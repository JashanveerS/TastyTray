import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mealPlanService } from '../data/services';
import { IngredientRecommendationsModal } from './IngredientRecommendationsModal';
import type { Recipe } from '../data/models';

interface MealPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
  onSuccess?: () => void;
  prefilledDate?: string; // ISO date string
  prefilledMealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export const MealPlanModal: React.FC<MealPlanModalProps> = ({ 
  isOpen, 
  onClose, 
  recipe, 
  onSuccess,
  prefilledDate,
  prefilledMealType
}) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(prefilledDate || '');
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>(prefilledMealType || 'dinner');
  const [servings, setServings] = useState(recipe.servings || 2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIngredientRecommendations, setShowIngredientRecommendations] = useState(false);

  // Update state when prefilled props change
  useEffect(() => {
    if (prefilledDate) setSelectedDate(prefilledDate);
    if (prefilledMealType) setSelectedMealType(prefilledMealType);
  }, [prefilledDate, prefilledMealType]);

  const mealTypes = [
    { value: 'breakfast' as const, label: 'Breakfast' },
    { value: 'lunch' as const, label: 'Lunch' },
    { value: 'dinner' as const, label: 'Dinner' },
    { value: 'snack' as const, label: 'Snack' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedDate) return;

    try {
      setLoading(true);
      setError(null);
      
      await mealPlanService.addMealPlan(
        user.id,
        selectedDate,
        selectedMealType,
        recipe.id,
        recipe.name,
        servings,
        recipe.image
      );
      
      // Call onSuccess to refresh meal plans, but don't close modal yet
      onSuccess?.();
      
      // Show ingredient recommendations if recipe has ingredients
      if (recipe.ingredients && recipe.ingredients.length > 0) {
        setShowIngredientRecommendations(true);
      } else {
        onClose();
      }
    } catch (err) {
      console.error('Error adding meal plan:', err);
      setError('Failed to add meal to plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const handleCloseIngredientRecommendations = () => {
    setShowIngredientRecommendations(false);
    onClose(); // Close the main modal after ingredient recommendations
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Calendar className="text-orange-600" size={20} />
                <span>Plan Meal</span>
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                <X size={24} />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {/* Recipe Info */}
            <div className="mb-6">
              <div className="flex items-start space-x-3">
                <img
                  src={recipe.image}
                  alt={recipe.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{recipe.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock size={14} />
                      <span>{recipe.cookTime}min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users size={14} />
                      <span>{recipe.servings} servings</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getMinDate()}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Meal Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meal Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {mealTypes.map((mealType) => (
                    <button
                      key={mealType.value}
                      type="button"
                      onClick={() => setSelectedMealType(mealType.value)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        selectedMealType === mealType.value
                          ? 'bg-orange-100 border-orange-300 text-orange-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {mealType.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Servings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Servings
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setServings(Math.max(1, servings - 1))}
                    className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 flex items-center justify-center"
                  >
                    −
                  </button>
                  <span className="text-lg font-medium w-8 text-center">{servings}</span>
                  <button
                    type="button"
                    onClick={() => setServings(servings + 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedDate}
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Adding...' : 'Add to Meal Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Ingredient Recommendations Modal - Now outside and with higher z-index */}
      {showIngredientRecommendations && (
        <IngredientRecommendationsModal
          isOpen={showIngredientRecommendations}
          onClose={handleCloseIngredientRecommendations}
          recipe={recipe}
          servings={servings}
        />
      )}
    </>
  );
};
