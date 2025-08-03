import React, { useState, useEffect } from 'react';
import { Search, X, Plus, Loader2 } from 'lucide-react';
import { searchRecipes } from '../data/recipes';
import { mealPlanService } from '../data/services';
import { useAuth } from '../context/AuthContext';
import { IngredientRecommendationsModal } from './IngredientRecommendationsModal';
import type { Recipe, SearchOptions } from '../data/models';

interface RecipeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  selectedMealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  onMealAdded: () => void;
}

export const RecipeSearchModal: React.FC<RecipeSearchModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  selectedMealType,
  onMealAdded
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showIngredientRecommendations, setShowIngredientRecommendations] = useState(false);
  const [selectedRecipeForRecommendations, setSelectedRecipeForRecommendations] = useState<Recipe | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setSearchQuery('');
      setRecipes([]);
      setHasSearched(false);
      setAdding(null);
    }
  }, [isOpen]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const searchOptions: SearchOptions = {
        query: searchQuery.trim()
      };
      const results = await searchRecipes(searchOptions);
      setRecipes(results);
    } catch (error) {
      console.error('Error searching recipes:', error);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeal = async (recipe: Recipe) => {
    if (!user) return;
    
    setAdding(recipe.id);
    try {
      await mealPlanService.addMealPlan(
        user.id,
        selectedDate.toISOString().split('T')[0],
        selectedMealType,
        recipe.id,
        recipe.name,
        recipe.servings,
        recipe.image
      );
      onMealAdded();
      
      // Show ingredient recommendations if recipe has ingredients
      if (recipe.ingredients && recipe.ingredients.length > 0) {
        setSelectedRecipeForRecommendations(recipe);
        setShowIngredientRecommendations(true);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error adding meal to plan:', error);
    } finally {
      setAdding(null);
    }
  };

  const handleCloseIngredientRecommendations = () => {
    setShowIngredientRecommendations(false);
    setSelectedRecipeForRecommendations(null);
    onClose(); // Close the main modal after ingredient recommendations
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add Meal</h2>
              <p className="text-sm text-gray-600 mt-1">
                {formatDate(selectedDate)} • {selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Search Form */}
        <div className="p-6 border-b border-gray-200">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for recipes to add to your meal plan..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {!hasSearched && (
            <div className="text-center py-12">
              <Search className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Search for Recipes</h3>
              <p className="text-gray-600">
                Enter a recipe name or ingredient to find meals for your plan
              </p>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-orange-600" size={32} />
              <span className="ml-3 text-gray-600">Searching recipes...</span>
            </div>
          )}

          {hasSearched && !loading && recipes.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">🍽️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes found</h3>
              <p className="text-gray-600">
                Try a different search term or check your spelling
              </p>
            </div>
          )}

          {recipes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipes.map((recipe) => (
                <div key={recipe.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <img
                    src={recipe.image}
                    alt={recipe.name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-4">
                    <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                      {recipe.name}
                    </h4>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <span>🕒 {recipe.cookTime} min</span>
                      <span>👥 {recipe.servings} servings</span>
                      {recipe.rating && (
                        <span>⭐ {recipe.rating.toFixed(1)}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddMeal(recipe)}
                      disabled={adding === recipe.id}
                      className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {adding === recipe.id ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus size={16} />
                          Add to Meal Plan
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ingredient Recommendations Modal */}
      {showIngredientRecommendations && selectedRecipeForRecommendations && (
        <IngredientRecommendationsModal
          isOpen={showIngredientRecommendations}
          onClose={handleCloseIngredientRecommendations}
          recipe={selectedRecipeForRecommendations}
          servings={selectedRecipeForRecommendations.servings}
        />
      )}
    </div>
  );
};
