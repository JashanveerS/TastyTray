import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Users, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mealPlanService } from '../data/services';
import { RecipeSearchModal } from '../parts/RecipeSearchModal';
import type { MealPlanItem } from '../data/models';

interface MealPlanProps {
  onGenerateShoppingList?: (startDate: string, endDate: string) => void;
}

export const MealPlan: React.FC<MealPlanProps> = ({ onGenerateShoppingList }) => {
  const { user } = useAuth();
  const [mealPlans, setMealPlans] = useState<MealPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showRecipeSearchModal, setShowRecipeSearchModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | null>(null);

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

  useEffect(() => {
    if (user) {
      loadMealPlans();
    }
  }, [user, currentWeek]);

  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      dates.push(day);
    }
    return dates;
  };

  const weekDates = getWeekDates(currentWeek);
  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];

  const loadMealPlans = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const startDate = weekStart.toISOString().split('T')[0];
      const endDate = weekEnd.toISOString().split('T')[0];
      const data = await mealPlanService.getMealPlans(user.id, startDate, endDate);
      setMealPlans(data);
    } catch (err) {
      console.error('Error loading meal plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMealsForDateAndType = (date: Date, mealType: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return mealPlans.filter(plan => plan.date === dateStr && plan.meal_type === mealType);
  };

  const handleAddMeal = (date: Date, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    setSelectedDate(date);
    setSelectedMealType(mealType);
    setShowRecipeSearchModal(true);
  };

  const handleMealAdded = () => {
    loadMealPlans(); // Refresh the meal plans
  };

  const handleCloseRecipeSearchModal = () => {
    setShowRecipeSearchModal(false);
    setSelectedDate(null);
    setSelectedMealType(null);
  };

  const handleRemoveMeal = async (mealPlanId: string) => {
    try {
      await mealPlanService.removeMealPlan(mealPlanId);
      setMealPlans(prev => prev.filter(plan => plan.id !== mealPlanId));
    } catch (err) {
      console.error('Error removing meal plan:', err);
    }
  };

  const handleGenerateShoppingList = () => {
    if (onGenerateShoppingList) {
      const startDate = weekStart.toISOString().split('T')[0];
      const endDate = weekEnd.toISOString().split('T')[0];
      onGenerateShoppingList(startDate, endDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Meal Plan</h2>
        <div className="flex items-center space-x-4">
          {onGenerateShoppingList && (
            <button
              onClick={handleGenerateShoppingList}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <ShoppingCart size={18} />
              <span>Generate Shopping List</span>
            </button>
          )}
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        <button
          onClick={() => {
            const prev = new Date(currentWeek);
            prev.setDate(prev.getDate() - 7);
            setCurrentWeek(prev);
          }}
          className="flex items-center space-x-2 text-gray-600 hover:text-orange-600"
        >
          <ChevronLeft size={20} />
          <span>Previous Week</span>
        </button>
        
        <div className="text-lg font-medium text-gray-900">
          {weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {' '}
          {weekEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        
        <button
          onClick={() => {
            const next = new Date(currentWeek);
            next.setDate(next.getDate() + 7);
            setCurrentWeek(next);
          }}
          className="flex items-center space-x-2 text-gray-600 hover:text-orange-600"
        >
          <span>Next Week</span>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Meal Plan Grid */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="grid grid-cols-8 gap-0">
          {/* Header Row */}
          <div className="bg-gray-50 p-3 font-medium text-gray-700 border-b border-r">
            Meal
          </div>
          {weekDates.map((date) => (
            <div
              key={date.toISOString()}
              className={`bg-gray-50 p-3 text-center font-medium border-b border-r ${
                isToday(date) ? 'bg-orange-50 text-orange-700' : 'text-gray-700'
              }`}
            >
              {formatDate(date)}
            </div>
          ))}

          {/* Meal Rows */}
          {mealTypes.map((mealType) => (
            <React.Fragment key={mealType}>
              <div className="bg-gray-50 p-3 font-medium text-gray-700 border-b border-r capitalize">
                {mealType}
              </div>
              {weekDates.map((date) => {
                const meals = getMealsForDateAndType(date, mealType);
                return (
                  <div
                    key={`${date.toISOString()}-${mealType}`}
                    className="p-2 border-b border-r min-h-[100px] bg-white hover:bg-gray-50"
                  >
                    <div className="space-y-2">
                      {meals.map((meal) => (
                        <div
                          key={meal.id}
                          className="bg-orange-100 p-2 rounded text-sm"
                        >
                          <div className="font-medium text-orange-900 mb-1">
                            {meal.recipe_title}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-orange-700 text-xs">
                              <Users size={12} className="mr-1" />
                              {meal.servings}
                            </div>
                            <button
                              onClick={() => handleRemoveMeal(meal.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddMeal(date, mealType)}
                        className="w-full flex items-center justify-center space-x-1 text-gray-400 hover:text-orange-600 py-2"
                      >
                        <Plus size={16} />
                        <span className="text-xs">Add Meal</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Recipe Search Modal */}
      {showRecipeSearchModal && selectedDate && selectedMealType && (
        <RecipeSearchModal
          isOpen={showRecipeSearchModal}
          onClose={handleCloseRecipeSearchModal}
          selectedDate={selectedDate}
          selectedMealType={selectedMealType}
          onMealAdded={handleMealAdded}
        />
      )}
    </div>
  );
};
