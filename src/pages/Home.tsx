import { useState, useEffect } from 'react';
import { ChefHat, Loader2 } from 'lucide-react';
import SearchBar from '../parts/SearchBar';
import RecipeCard from '../parts/RecipeCard';
import { Navigation } from '../parts/Navigation';
import { MealPlanModal } from '../parts/MealPlanModal';
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
        cuisines: [],
        source: 'manual',
        nutrition: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0
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
        <div className="flex-between mb-6">
          <h3 className="heading-3">
            {hasSearched ? 'Search Results' : 'Popular Recipes'}
            <span className="ml-2 text-small font-normal text-muted">
              ({recipes.length} recipes)
            </span>
          </h3>
          
          {hasSearched && (
            <button
              onClick={loadRandomRecipes}
              className="btn-primary"
            >
              View Popular Recipes
            </button>
          )}
        </div>

        {/* Loading State */}
        {(loading || searching) && (
          <div className="loading-container">
            <Loader2 className="loading-spinner" size={32} />
            <span className="subtitle">
              {searching ? 'Searching recipes...' : 'Loading recipes...'}
            </span>
          </div>
        )}

        {/* No Results */}
        {!loading && !searching && recipes.length === 0 && hasSearched && (
          <div className="empty-state">
            <div className="empty-icon">
              <ChefHat size={48} />
            </div>
            <h4 className="empty-title">
              No recipes found
            </h4>
            <p className="empty-description">
              Try adjusting your search criteria or browse our popular recipes.
            </p>
            <button onClick={loadRandomRecipes} className="btn-primary">
              Browse Popular Recipes
            </button>
          </div>
        )}

        {/* Recipe Grid */}
        {!loading && !searching && recipes.length > 0 && (
          <>
            <div className="grid-responsive">
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
              <div className="flex-center mt-8">
                <button
                  onClick={loadMoreRecipes}
                  disabled={loadingMore}
                  className={`btn-primary px-6 py-3 space-items ${loadingMore ? 'btn-disabled' : ''}`}
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
    <div className="page-container">
      <Navigation
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Main Content */}
      <main className="main-content">
        {activeSection === 'recipes' && (
          <div className="section-header">
            <h2 className="heading-1 mb-2">
              Welcome back, {profile?.name?.split(' ')[0] || 'Chef'}!
            </h2>
            <p className="subtitle">
              Discover delicious recipes tailored to your taste
            </p>
          </div>
        )}

        {renderSection()}
      </main>

      {/* Recipe Modal */}
      {selectedRecipe && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="flex-between">
                <h2 className="modal-title">
                  {selectedRecipe.name}
                </h2>
                <button
                  onClick={closeRecipeModal}
                  className="modal-close"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="modal-body">
              <img
                src={selectedRecipe.image}
                alt={selectedRecipe.name}
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
              
              <div className="mb-6">
                <h3 className="title mb-2">Description</h3>
                <p className="subtitle">{selectedRecipe.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="title mb-2">Ingredients</h3>
                  <ul className="space-y-2">
                    {selectedRecipe.ingredients.map((ingredient) => (
                      <li key={ingredient.id} className="subtitle">
                        {ingredient.amount} {ingredient.unit} {ingredient.name}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="title mb-2">Nutrition</h3>
                  <div className="space-y-1 text-small">
                    <div className="flex-between">
                      <span>Calories:</span>
                      <span>{selectedRecipe.nutrition.calories}</span>
                    </div>
                    <div className="flex-between">
                      <span>Protein:</span>
                      <span>{selectedRecipe.nutrition.protein}g</span>
                    </div>
                    <div className="flex-between">
                      <span>Carbs:</span>
                      <span>{selectedRecipe.nutrition.carbs}g</span>
                    </div>
                    <div className="flex-between">
                      <span>Fat:</span>
                      <span>{selectedRecipe.nutrition.fat}g</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedRecipe.steps.length > 0 && (
                <div>
                  <h3 className="title mb-2">Instructions</h3>
                  <ol className="space-y-3">
                    {selectedRecipe.steps.map((step) => (
                      <li key={step.num} className="flex gap-3">
                        <span className="badge-primary text-small font-medium min-w-[24px] text-center">
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
