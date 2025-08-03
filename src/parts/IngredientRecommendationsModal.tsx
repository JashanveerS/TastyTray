import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Package, Loader2, Check } from 'lucide-react';
import { shoppingListService, pantryService } from '../data/services';
import { useAuth } from '../context/AuthContext';
import type { Recipe, PantryItem } from '../data/models';

interface IngredientRecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
  servings: number;
}

export const IngredientRecommendationsModal: React.FC<IngredientRecommendationsModalProps> = ({
  isOpen,
  onClose,
  recipe,
  servings
}) => {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [ingredientStatuses, setIngredientStatuses] = useState<{[key: string]: boolean}>({});
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [loadingPantry, setLoadingPantry] = useState(true);

  // Load pantry items and set smart defaults
  useEffect(() => {
    const loadPantryAndSetDefaults = async () => {
      if (!user || !isOpen) return;
      
      try {
        setLoadingPantry(true);
        const items = await pantryService.getPantryItems(user.id);
        setPantryItems(items);
        
        // Set smart defaults based on pantry - checked means "I have this"
        const smartStatuses: {[key: string]: boolean} = {};
        
        recipe.ingredients.forEach(ingredient => {
          // Check if ingredient exists in pantry (case-insensitive partial match)
          const existsInPantry = items.some(pantryItem => 
            pantryItem.ingredient_name.toLowerCase().includes(ingredient.name.toLowerCase()) ||
            ingredient.name.toLowerCase().includes(pantryItem.ingredient_name.toLowerCase())
          );
          
          // Default to checked if exists in pantry, unchecked otherwise
          smartStatuses[ingredient.id] = existsInPantry;
        });
        
        setIngredientStatuses(smartStatuses);
      } catch (error) {
        console.error('Error loading pantry items:', error);
        // Set all to unchecked as fallback (will go to shopping list)
        const fallbackStatuses: {[key: string]: boolean} = {};
        recipe.ingredients.forEach(ingredient => {
          fallbackStatuses[ingredient.id] = false;
        });
        setIngredientStatuses(fallbackStatuses);
      } finally {
        setLoadingPantry(false);
      }
    };
    
    loadPantryAndSetDefaults();
  }, [user, isOpen, recipe]);

  if (!isOpen) return null;

  const handleIngredientToggle = (ingredientId: string, hasIngredient: boolean) => {
    setIngredientStatuses(prev => ({
      ...prev,
      [ingredientId]: hasIngredient
    }));
  };

  const handleConfirm = async () => {
    if (!user) return;
    
    setProcessing(true);
    try {
      // Process each ingredient based on checkbox status
      for (const ingredient of recipe.ingredients) {
        const hasIngredient = ingredientStatuses[ingredient.id] ?? false; // Default to false (add to shopping list)
        
        if (!hasIngredient) {
          // Add to shopping list (unchecked means they need to buy it)
          await shoppingListService.addShoppingItem(
            user.id,
            ingredient.name,
            ingredient.amount * (servings / recipe.servings), // Adjust quantity based on servings
            ingredient.unit
          );
        } else {
          // Add to pantry (checked means they have it)
          await pantryService.addPantryItem(
            user.id,
            ingredient.name,
            undefined, // No quantity initially
            ingredient.unit
          );
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Error processing ingredient recommendations:', error);
    } finally {
      setProcessing(false);
    }
  };


  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Ingredient Recommendations</h2>
              <p className="text-sm text-gray-600 mt-1">
                Do you have these ingredients, or should we add them to your shopping list?
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

        {/* Recipe Info */}
        <div className="p-6 border-b border-gray-200 bg-orange-50">
          <div className="flex items-center space-x-4">
            <img
              src={recipe.image}
              alt={recipe.name}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div>
              <h3 className="font-medium text-gray-900">{recipe.name}</h3>
              <p className="text-sm text-gray-600">
                Planned servings: {servings} {servings !== recipe.servings && `(recipe serves ${recipe.servings})`}
              </p>
            </div>
          </div>
        </div>

        {/* Ingredients List */}
        <div className="flex-1 overflow-y-auto p-6" style={{maxHeight: 'calc(90vh - 280px)'}}>
          {loadingPantry ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-orange-600" size={32} />
              <span className="ml-3 text-gray-600">Checking your pantry...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {(!recipe.ingredients || recipe.ingredients.length === 0) ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">🍽️</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Ingredients Available</h3>
                  <p className="text-gray-600 mb-4">
                    This recipe doesn't have detailed ingredient information.
                  </p>
                  <p className="text-sm text-gray-500">
                    You can manually add ingredients to your shopping list or pantry later.
                  </p>
                </div>
              ) : (
                recipe.ingredients.filter(ingredient => 
                  // Filter out items that look like instructions rather than ingredients
                  ingredient.name && 
                  ingredient.name.length < 100 && // Instructions are usually longer
                  !ingredient.name.toLowerCase().includes('preheat') &&
                  !ingredient.name.toLowerCase().includes('heat oven') &&
                  !ingredient.name.toLowerCase().includes('mix') &&
                  !ingredient.name.toLowerCase().includes('cook') &&
                  !ingredient.name.toLowerCase().includes('bake') &&
                  !ingredient.name.toLowerCase().includes('step') &&
                  !ingredient.name.toLowerCase().includes('then') &&
                  !ingredient.name.toLowerCase().includes('meanwhile') &&
                  !ingredient.name.toLowerCase().includes('serve') &&
                  !ingredient.name.toLowerCase().includes('garnish')
                ).map((ingredient) => {
                const adjustedAmount = ingredient.amount * (servings / recipe.servings);
                const hasIngredient = ingredientStatuses[ingredient.id] ?? false;
                
                // Check if ingredient exists in pantry
                const inPantry = pantryItems.some(pantryItem => 
                  pantryItem.ingredient_name.toLowerCase().includes(ingredient.name.toLowerCase()) ||
                  ingredient.name.toLowerCase().includes(pantryItem.ingredient_name.toLowerCase())
                );
                
                return (
                  <div key={ingredient.id} className={`border rounded-lg p-4 ${
                    inPantry ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{ingredient.name}</h4>
                          {inPantry && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Package size={12} className="mr-1" />
                              In Pantry
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {adjustedAmount.toFixed(1)} {ingredient.unit}
                        </p>
                      </div>
                      
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasIngredient}
                          onChange={(e) => handleIngredientToggle(ingredient.id, e.target.checked)}
                          className="w-5 h-5 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                        />
                        <span className="text-sm font-medium text-gray-900">I have this</span>
                      </label>
                    </div>
                  </div>
                );
              })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={processing}
              className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? 'Processing...' : 'Confirm Choices'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
