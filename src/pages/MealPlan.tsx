import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mealPlanService } from '../data/services';
import type { MealPlanItem } from '../data/models';

interface MealPlanProps {
  onNavigateToRecipeSearch?: (date: string, mealType: string) => void;
}

export const MealPlan: React.FC<MealPlanProps> = ({ onNavigateToRecipeSearch }) => {
  const { user } = useAuth();
  const [mealPlans, setMealPlans] = useState<MealPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

  useEffect(() => {
    if (user) {
      loadMealPlans();
    }
  }, [user, currentWeek, selectedDate]);

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
      
      // Calculate the range to include both the current week and selected date
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const weekEndStr = weekEnd.toISOString().split('T')[0];
      
      // Use the earliest start date and latest end date
      const startDate = selectedDateStr < weekStartStr ? selectedDateStr : weekStartStr;
      const endDate = selectedDateStr > weekEndStr ? selectedDateStr : weekEndStr;
      
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
    const dateStr = date.toISOString().split('T')[0];
    if (onNavigateToRecipeSearch) {
      onNavigateToRecipeSearch(dateStr, mealType);
    }
  };

  const handleRemoveMeal = async (mealPlanId: string) => {
    try {
      await mealPlanService.removeMealPlan(mealPlanId);
      setMealPlans(prev => prev.filter(plan => plan.id !== mealPlanId));
    } catch (err) {
      console.error('Error removing meal plan:', err);
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h2 className="heading-1">Meal Plan</h2>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-white p-3 sm:p-4 rounded-lg shadow-sm">
        <button
          onClick={() => {
            const prev = new Date(currentWeek);
            prev.setDate(prev.getDate() - 7);
            setCurrentWeek(prev);
          }}
          className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-orange-600 transition-colors"
        >
          <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base hidden sm:inline">Previous Week</span>
          <span className="text-sm sm:hidden">Prev</span>
        </button>
        
        <div className="text-sm sm:text-lg font-medium text-gray-900 text-center">
          <div className="hidden sm:block">
            {weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {' '}
            {weekEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="sm:hidden">
            {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {' '}
            {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>
        
        <button
          onClick={() => {
            const next = new Date(currentWeek);
            next.setDate(next.getDate() + 7);
            setCurrentWeek(next);
          }}
          className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-orange-600 transition-colors"
        >
          <span className="text-sm sm:text-base hidden sm:inline">Next Week</span>
          <span className="text-sm sm:hidden">Next</span>
          <ChevronRight size={18} className="sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Mobile Date Picker */}
      <div className="lg:hidden mb-4">
        <label htmlFor="selectedDate" className="block text-gray-700 font-medium mb-2">
          Select a date to plan
        </label>
        <input
          type="date"
          id="selectedDate"
          value={selectedDate.toISOString().split('T')[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
          className="w-full px-4 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
      </div>

      {/* Mobile View - Single Day Card Layout */}
      <div className="block lg:hidden space-y-4">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Date Header */}
          <div className={`p-4 font-semibold text-center border-b ${
            isToday(selectedDate) 
              ? 'bg-orange-50 text-orange-700 border-orange-200' 
              : 'bg-gray-50 text-gray-700 border-gray-200'
          }`}>
            <div className="text-lg">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
            </div>
            <div className="text-sm opacity-75">
              {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
          
          {/* Meals for this date */}
          <div className="p-4 space-y-4">
            {mealTypes.map((mealType) => {
              const meals = getMealsForDateAndType(selectedDate, mealType);
              return (
                <div key={mealType} className="">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 capitalize">{mealType}</h4>
                    <button
                      onClick={() => handleAddMeal(selectedDate, mealType)}
                      className="btn-secondary-sm"
                    >
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                  </div>
                  
                  {meals.length > 0 ? (
                    <div className="space-y-2">
                      {meals.map((meal) => (
                        <div
                          key={meal.id}
                          className="bg-orange-50 border border-orange-200 p-3 rounded-lg"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-orange-900 text-sm mb-1">
                                {meal.recipe_title}
                              </div>
                              <div className="flex items-center text-orange-700 text-xs">
                                <Users size={12} className="mr-1" />
                                {meal.servings} servings
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveMeal(meal.id)}
                              className="text-red-600 hover:text-red-800 p-1 ml-2"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                      No meals planned
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop View - Grid Layout */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-8 gap-0 min-w-[800px]">
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
                <div className="text-sm font-semibold">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-xs opacity-75">
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
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
                      className="p-2 border-b border-r min-h-[120px] bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="space-y-2">
                        {meals.map((meal) => (
                          <div
                            key={meal.id}
                            className="bg-orange-100 border border-orange-200 p-2 rounded text-sm"
                          >
                            <div className="font-medium text-orange-900 mb-1 text-xs leading-tight">
                              {meal.recipe_title}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-orange-700 text-xs">
                                <Users size={10} className="mr-1" />
                                {meal.servings}
                              </div>
                              <button
                                onClick={() => handleRemoveMeal(meal.id)}
                                className="text-red-600 hover:text-red-800 p-0.5"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => handleAddMeal(date, mealType)}
                          className="w-full flex items-center justify-center space-x-1 text-gray-400 hover:text-orange-600 py-2 transition-colors"
                        >
                          <Plus size={14} />
                          <span className="text-xs">Add</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
