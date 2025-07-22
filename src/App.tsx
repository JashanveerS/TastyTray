import { useState, useEffect } from 'react';
import { ChefHat, Loader2 } from 'lucide-react';
import SearchBar from './parts/SearchBar';
import RecipeCard from './parts/RecipeCard';
import type { Recipe, SearchOptions } from './data/models';
import { fetchRandomRecipes, searchRecipes } from './data/recipes';

function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    loadRandomRecipes();
  }, []);

  const loadRandomRecipes = async () => {
    setLoading(true);
    try {
      const randomRecipes = await fetchRandomRecipes(12);
      setRecipes(randomRecipes);
      setHasSearched(false);
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (options: SearchOptions) => {
    setSearching(true);
    setHasSearched(true);
    try {
      const results = await searchRecipes(options);
      setRecipes(results);
    } catch (error) {
      console.error('Error searching recipes:', error);
    } finally {
      setSearching(false);
    }
  };

  const closeRecipeModal = () => {
    setSelectedRecipe(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChefHat className="text-orange-600" size={32} />
              <h1 className="text-2xl font-bold text-gray-900">TastyTray</h1>
            </div>
            <div className="text-sm text-gray-600">
              Smart meal planning with AI
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <SearchBar onSearch={handleSearch} isLoading={searching} />
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {hasSearched ? 'Search Results' : 'Popular Recipes'}
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({recipes.length} recipes)
            </span>
          </h2>
          
          {hasSearched && (
            <button
              onClick={loadRandomRecipes}
              className="btn btn-outline"
            >
              View Popular Recipes
            </button>
          )}
        </div>

        {/* Loading State */}
        {(loading || searching) && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-orange-600" size={32} />
            <span className="ml-2 text-gray-600">
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No recipes found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or browse our popular recipes.
            </p>
            <button onClick={loadRandomRecipes} className="btn btn-primary">
              Browse Popular Recipes
            </button>
          </div>
        )}

        {/* Recipe Grid */}
        {!loading && !searching && recipes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => setSelectedRecipe(recipe)}
              />
            ))}
          </div>
        )}
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
                  className="text-gray-400 hover:text-gray-600"
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
    </div>
  );
}

export default App;
