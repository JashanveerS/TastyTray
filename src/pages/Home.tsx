import { useState, useEffect } from 'react';
import { ChefHat, Loader2 } from 'lucide-react';
import SearchBar from '../parts/SearchBar';
import RecipeCard from '../parts/RecipeCard';
import { Navigation } from '../parts/Navigation';
import { MealPlanModal } from '../parts/MealPlanModal';
import { TestSupabase } from '../debug/TestSupabase';
import { Favorites } from './Favorites';
import { MealPlan } from './MealPlan';
import { Pantry } from './Pantry';
import { ShoppingList } from './ShoppingList';
import type { Recipe, SearchOptions } from '../data/models';
import { fetchRandomRecipes, searchRecipes } from '../data/recipes';
import { useAuth } from '../context/AuthContext';
import { shoppingListService } from '../data/services';

export default function Home() {
  const [activeSection, setActiveSection] = useState('recipes');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [mealPlanModalOpen, setMealPlanModalOpen] = useState(false);
  const [recipeToAddToMealPlan, setRecipeToAddToMealPlan] = useState<Recipe | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [canLoadMore, setCanLoadMore] = useState(true);
  const [currentSearchOptions, setCurrentSearchOptions] = useState<SearchOptions | null>(null);

  const { user, profile } = useAuth();

  useEffect(() => {
    loadRandomRecipes();
  }, []);

  const loadRandomRecipes = async () => {
    setLoading(true);
    try {
      const randomRecipes = await fetchRandomRecipes(12);
      setRecipes(randomRecipes);
      setHasSearched(false);
      setCurrentSearchOptions(null);
      setCanLoadMore(true);
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (options: SearchOptions) => {
    setSearching(true);
    setHasSearched(true);
    setCurrentSearchOptions(options);
    setCanLoadMore(true); // Enable load more for search results
    try {
      const results = await searchRecipes(options);
      setRecipes(results);
    } catch (error) {
      console.error('Error searching recipes:', error);
    } finally {
      setSearching(false);
    }
  };

  const loadMoreRecipes = async () => {
    if (loadingMore) return;
    
    setLoadingMore(true);
    try {
      const currentOffset = recipes.length;
      let moreRecipes: Recipe[] = [];
      
      if (hasSearched && currentSearchOptions) {
        // Load more search results
        moreRecipes = await searchRecipes(currentSearchOptions, currentOffset);
      } else {
        // Load more random recipes
        moreRecipes = await fetchRandomRecipes(8, currentOffset);
      }
      
      if (moreRecipes.length === 0) {
        setCanLoadMore(false);
      } else {
        // Filter out any duplicate recipes based on ID
        const existingIds = new Set(recipes.map(r => r.id));
        const newRecipes = moreRecipes.filter(recipe => !existingIds.has(recipe.id));
        
        if (newRecipes.length === 0) {
          setCanLoadMore(false);
        } else {
          setRecipes(prev => [...prev, ...newRecipes]);
        }
      }
    } catch (error) {
      console.error('Error loading more recipes:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const closeRecipeModal = () => {
    setSelectedRecipe(null);
  };

  const handleAddToMealPlan = (recipeId: string, recipeTitle: string, recipeImage?: string) => {
    // Find the recipe from the current recipes list
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe) {
      setRecipeToAddToMealPlan(recipe);
      setMealPlanModalOpen(true);
    } else {
      // If recipe not found in current list, create a basic recipe object
      const basicRecipe: Recipe = {
        id: recipeId,
        name: recipeTitle,
        image: recipeImage || '',
        description: '',
        ingredients: [],
        steps: [],
        cookTime: 30,
        servings: 2,
        difficulty: 'medium',
        tags: [],
        nutrition: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0
        }
      };
      setRecipeToAddToMealPlan(basicRecipe);
      setMealPlanModalOpen(true);
    }
  };

  const handleMealPlanSuccess = () => {
    // Optionally refresh meal plan data or show success message
    setActiveSection('meal-plan');
  };

  const handleGenerateShoppingList = async (startDate: string, endDate: string) => {
    try {
      await shoppingListService.generateFromMealPlan(user!.id, startDate, endDate);
      setActiveSection('shopping');
    } catch (error) {
      console.error('Error generating shopping list:', error);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'debug':
        return <TestSupabase />;
      case 'favorites':
        return <Favorites onAddToMealPlan={handleAddToMealPlan} />;
      case 'meal-plan':
        return <MealPlan onGenerateShoppingList={handleGenerateShoppingList} />;
      case 'pantry':
        return <Pantry />;
      case 'shopping':
        return <ShoppingList />;
      default:
        return renderRecipesSection();
    }
  };

  const renderRecipesSection = () => {
    return (
      <>
        {/* Search Section */}
        <div className="mb-8">
          <SearchBar onSearch={handleSearch} isLoading={searching} />
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            {hasSearched ? 'Search Results' : 'Popular Recipes'}
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({recipes.length} recipes)
            </span>
          </h3>
          
          {hasSearched && (
            <button
              onClick={loadRandomRecipes}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              View Popular Recipes
            </button>
          )}
        </div>

        {/* Loading State */}
        {(loading || searching) && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-orange-600 mr-2" size={32} />
            <span className="text-gray-600">
              {searching ? 'Searching recipes...' : 'Loading recipes...'}
            </span>
          </div>
        )}

        {/* No Results */}
        {!loading && !searching && recipes.length === 0 && hasSearched && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <ChefHat size={48} className="mx-auto" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No recipes found
            </h4>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or browse our popular recipes.
            </p>
            <button onClick={loadRandomRecipes} className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
              Browse Popular Recipes
            </button>
          </div>
        )}

        {/* Recipe Grid */}
        {!loading && !searching && recipes.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => setSelectedRecipe(recipe)}
                  onAddToMealPlan={() => handleAddToMealPlan(recipe.id, recipe.name, recipe.image)}
                />
              ))}
            </div>
            
            {/* Load More Button */}
            {canLoadMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMoreRecipes}
                  disabled={loadingMore}
                  className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>Loading More...</span>
                    </>
                  ) : (
                    <span>{hasSearched ? 'Load More Results' : 'Load More Recipes'}</span>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeSection === 'recipes' && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {profile?.name?.split(' ')[0] || 'Chef'}!
            </h2>
            <p className="text-gray-600">
              Discover delicious recipes tailored to your taste
            </p>
          </div>
        )}

        {renderSection()}
      </main>

      {/* Recipe Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedRecipe.name}
                </h2>
                <button
                  onClick={closeRecipeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <img
                src={selectedRecipe.image}
                alt={selectedRecipe.name}
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
              
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">Description</h3>
                <p className="text-gray-600">{selectedRecipe.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Ingredients</h3>
                  <ul className="space-y-2">
                    {selectedRecipe.ingredients.map((ingredient) => (
                      <li key={ingredient.id} className="text-gray-600">
                        {ingredient.amount} {ingredient.unit} {ingredient.name}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-2">Nutrition</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Calories:</span>
                      <span>{selectedRecipe.nutrition.calories}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Protein:</span>
                      <span>{selectedRecipe.nutrition.protein}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Carbs:</span>
                      <span>{selectedRecipe.nutrition.carbs}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fat:</span>
                      <span>{selectedRecipe.nutrition.fat}g</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedRecipe.steps.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Instructions</h3>
                  <ol className="space-y-3">
                    {selectedRecipe.steps.map((step) => (
                      <li key={step.num} className="flex gap-3">
                        <span className="bg-orange-100 text-orange-800 text-sm font-medium px-2 py-1 rounded-full min-w-[24px] text-center">
                          {step.num}
                        </span>
                        <span className="text-gray-700 flex-1">{step.instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Meal Plan Modal */}
      {mealPlanModalOpen && recipeToAddToMealPlan && (
        <MealPlanModal
          isOpen={mealPlanModalOpen}
          onClose={() => {
            setMealPlanModalOpen(false);
            setRecipeToAddToMealPlan(null);
          }}
          recipe={recipeToAddToMealPlan}
          onSuccess={handleMealPlanSuccess}
        />
      )}
    </div>
  );
}
