import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Package, Check, Loader2 } from 'lucide-react';
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
  const [ingredientChoices, setIngredientChoices] = useState<{[key: string]: 'shopping' | 'pantry' | 'skip'}>({});

  if (!isOpen) return null;

  const handleIngredientChoice = (ingredientId: string, choice: 'shopping' | 'pantry' | 'skip') => {
    setIngredientChoices(prev => ({
      ...prev,
      [ingredientId]: choice
    }));
  };

  const handleConfirm = async () => {
    if (!user) return;
    
    setProcessing(true);
    try {
      // Process each ingredient based on user choice
      for (const ingredient of recipe.ingredients) {
        const choice = ingredientChoices[ingredient.id] || 'shopping'; // Default to shopping list
        
        if (choice === 'shopping') {
          // Add to shopping list
          await shoppingListService.addShoppingItem(
            user.id,
            ingredient.name,
            ingredient.amount * (servings / recipe.servings), // Adjust quantity based on servings
            ingredient.unit
          );
        } else if (choice === 'pantry') {
          // Add to pantry (without quantity, user can add later)
          await pantryService.addPantryItem(
            user.id,
            ingredient.name,
            undefined, // No quantity initially
            ingredient.unit
          );
        }
        // If 'skip', do nothing
      }
      
      onClose();
    } catch (error) {
      console.error('Error processing ingredient recommendations:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getChoiceForIngredient = (ingredientId: string) => {
    return ingredientChoices[ingredientId] || 'shopping';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
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
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {recipe.ingredients.map((ingredient) => {
              const adjustedAmount = ingredient.amount * (servings / recipe.servings);
              const choice = getChoiceForIngredient(ingredient.id);
              
              return (
                <div key={ingredient.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{ingredient.name}</h4>
                      <p className="text-sm text-gray-600">
                        {adjustedAmount.toFixed(1)} {ingredient.unit}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleIngredientChoice(ingredient.id, 'shopping')}
                      className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border transition-colors ${
                        choice === 'shopping'
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ShoppingCart size={16} />
                      <span className="text-sm">Add to Shopping List</span>
                      {choice === 'shopping' && <Check size={16} />}
                    </button>
                    
                    <button
                      onClick={() => handleIngredientChoice(ingredient.id, 'pantry')}
                      className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border transition-colors ${
                        choice === 'pantry'
                          ? 'bg-green-50 border-green-300 text-green-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Package size={16} />
                      <span className="text-sm">I Have This</span>
                      {choice === 'pantry' && <Check size={16} />}
                    </button>
                    
                    <button
                      onClick={() => handleIngredientChoice(ingredient.id, 'skip')}
                      className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border transition-colors ${
                        choice === 'skip'
                          ? 'bg-gray-50 border-gray-400 text-gray-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-sm">Skip</span>
                      {choice === 'skip' && <Check size={16} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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
