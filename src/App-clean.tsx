import React, { useState, useEffect } from 'react';
import { ChefHat, Mail, Lock, Search, Clock, Users, Star, Loader2, Heart, Calendar, Package, ShoppingCart, Filter } from 'lucide-react';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import { favoritesService, pantryService, shoppingListService, mealPlanService } from './data/services';

// Recipe fetching function
const fetchRecipes = async (count = 6) => {
  const SPOON_KEY = import.meta.env.VITE_SPOONACULAR_KEY;
  const MEAL_DB_URL = 'https://www.themealdb.com/api/json/v1/1';
  
  const recipes = [];
  
  // Fallback to MealDB
  try {
    for (let i = 0; i < count; i++) {
      const response = await axios.get(`${MEAL_DB_URL}/random.php`, { timeout: 5000 });
      
      if (response.data.meals?.[0]) {
        const meal = response.data.meals[0];
        recipes.push({
          id: meal.idMeal,
          name: meal.strMeal,
          image: meal.strMealThumb,
          servings: Math.floor(Math.random() * 4) + 2,
          cookTime: 15 + Math.floor(Math.random() * 45),
          description: meal.strInstructions.substring(0, 150) + '...',
          steps: meal.strInstructions.split('.').filter(s => s.trim()).slice(0, 5).map((step, i) => ({
            num: i + 1,
            instruction: step.trim() + '.'
          })),
          ingredients: (() => {
            const ingredients = [];
            for (let j = 1; j <= 10; j++) {
              const ingredient = meal[`strIngredient${j}`];
              const measure = meal[`strMeasure${j}`];
              if (ingredient?.trim()) {
                ingredients.push({
                  id: `${meal.idMeal}-${j}`,
                  name: ingredient.trim(),
                  amount: 1,
                  unit: measure?.trim() || ''
                });
              }
            }
            return ingredients;
          })(),
          nutrition: {
            calories: 200 + Math.floor(Math.random() * 400),
            protein: 15 + Math.floor(Math.random() * 25),
            carbs: 20 + Math.floor(Math.random() * 40),
            fat: 8 + Math.floor(Math.random() * 20),
            fiber: 3 + Math.floor(Math.random() * 8),
            sugar: 5 + Math.floor(Math.random() * 15),
            sodium: 300 + Math.floor(Math.random() * 700)
          },
          cuisines: meal.strArea ? [meal.strArea] : [],
          tags: meal.strTags ? meal.strTags.split(',') : [],
          difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
          rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
          source: 'mealdb'
        });
      }
    }
  } catch (error) {
    console.log('MealDB failed:', error);
  }
  
  return recipes;
};

// Main App Component
function TastyTrayApp() {
  const { user, login, register, signOut, loading: authLoading } = useAuth();
  
  // Auth form states
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  
  // App states
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [activeSection, setActiveSection] = useState('recipes');
  
  // Feature states
  const [favorites, setFavorites] = useState([]);
  const [mealPlan, setMealPlan] = useState({});
  const [pantryItems, setPantryItems] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  
  // Modal states
  const [showMealPlanModal, setShowMealPlanModal] = useState(false);
  const [selectedRecipeForMeal, setSelectedRecipeForMeal] = useState(null);
  
  // Load user data when user logs in
  useEffect(() => {
    if (user) {
      loadUserData();
      if (recipes.length === 0) {
        loadRecipes();
      }
    } else {
      // Clear data when user logs out
      setFavorites([]);
      setMealPlan({});
      setPantryItems([]);
      setShoppingList([]);
      setRecipes([]);
    }
  }, [user]);
  
  const loadUserData = async () => {
    if (!user) return;
    
    try {
      const [favoritesData, pantryData, shoppingData, mealPlanData] = await Promise.all([
        favoritesService.getFavorites(user.id),
        pantryService.getPantryItems(user.id),
        shoppingListService.getShoppingList(user.id),
        mealPlanService.getMealPlans(user.id)
      ]);
      
      setFavorites(favoritesData || []);
      setPantryItems(pantryData || []);
      setShoppingList(shoppingData || []);
      
      // Convert meal plan array to object
      const mealPlanObj = {};
      mealPlanData.forEach(meal => {
        if (!mealPlanObj[meal.date]) {
          mealPlanObj[meal.date] = {};
        }
        mealPlanObj[meal.date][meal.meal_type] = {
          id: meal.recipe_id,
          name: meal.recipe_title,
          image: meal.recipe_image,
          servings: meal.servings,
          cookTime: 30
        };
      });
      setMealPlan(mealPlanObj);
      
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };
  
  const loadRecipes = async () => {
    setLoading(true);
    try {
      const fetchedRecipes = await fetchRecipes(6);
      setRecipes(fetchedRecipes);
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Auth handlers
  const handleAuth = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }
    
    if (!isLogin && !name) {
      alert('Please enter your name');
      return;
    }
    
    setFormLoading(true);
    
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      
      // Clear form
      setEmail('');
      setPassword('');
      setName('');
    } catch (error) {
      alert(error.message || 'Authentication failed');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    try {
      await signOut();
      setActiveSection('recipes');
      setEmail('');
      setPassword('');
      setName('');
    } catch (error) {
      console.error('Sign out error:', error);
      alert('Failed to sign out');
    }
  };
  
  // Favorites handlers
  const toggleFavorite = async (recipe) => {
    if (!user) {
      alert('Please log in to add favorites');
      return;
    }
    
    const isFav = favorites.some(fav => fav.recipe_id === recipe.id);
    
    try {
      console.log('Toggling favorite for recipe:', recipe, 'User:', user.id);

      if (isFav) {
        await favoritesService.removeFavorite(user.id, recipe.id);
        console.log('Successfully removed from favorites');
        setFavorites(prev => prev.filter(fav => fav.recipe_id !== recipe.id));
      } else {
        const newFavorite = await favoritesService.addFavorite(user.id, recipe.id, recipe.name, recipe.image);
        console.log('Successfully added to favorites:', newFavorite);
        setFavorites(prev => [...prev, newFavorite]);
      }
    } catch (error) {
      console.error('Favorite toggle error:', error);
      alert(`Failed to ${isFav ? 'remove from' : 'add to'} favorites: ${error.message || JSON.stringify(error)}`);
    }
  };
  
  const isFavorite = (recipeId) => {
    return favorites.some(fav => fav.recipe_id === recipeId);
  };
  
  // Meal plan handlers
  const openMealPlanModal = (recipe) => {
    setSelectedRecipeForMeal(recipe);
    setShowMealPlanModal(true);
  };
  
  const addToMealPlan = async (date, mealType, recipe) => {
    if (!user) {
      alert('Please log in to add to meal plan');
      return;
    }
    
    try {
      console.log('Adding to meal plan:', date, mealType, recipe, 'User:', user.id);

      await mealPlanService.addMealPlan(
        user.id,
        date,
        mealType,
        recipe.id,
        recipe.name,
        recipe.servings || 1,
        recipe.image
      );

      console.log('Successfully added to meal plan');
      setMealPlan(prev => ({
        ...prev,
        [date]: {
          ...prev[date],
          [mealType]: {
            id: recipe.id,
            name: recipe.name,
            image: recipe.image,
            servings: recipe.servings || 1,
            cookTime: recipe.cookTime
          }
        }
      }));
      
      setShowMealPlanModal(false);
      setSelectedRecipeForMeal(null);
      alert(`Added ${recipe.name} to ${mealType} on ${date}!`);
    } catch (error) {
      console.error('Meal plan error:', error);
      alert(`Failed to add to meal plan: ${error.message || JSON.stringify(error)}`);
    }
  };
  
  // If user is not logged in, show auth form
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <ChefHat className="text-orange-600" size={40} />
              <h1 className="text-3xl font-bold text-gray-900">TastyTray</h1>
            </div>
            <p className="text-gray-600">
              {isLogin ? 'Welcome back! Sign in to your account' : 'Create your account to get started'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleAuth} className="space-y-6">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter your full name"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder={isLogin ? "Enter your password" : "Create a password"}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full bg-orange-500 text-white py-3 text-lg rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {formLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin mr-2" size={20} />
                    {isLogin ? 'Signing In...' : 'Creating Account...'}
                  </div>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main app interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-2">
                <ChefHat className="text-orange-600" size={32} />
                <h1 className="text-2xl font-bold text-orange-600">TastyTray</h1>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {[
                  { id: 'recipes', label: 'Recipes', icon: ChefHat },
                  { id: 'favorites', label: 'Favorites', icon: Heart },
                  { id: 'meal-plan', label: 'Meal Plan', icon: Calendar },
                  { id: 'pantry', label: 'Pantry', icon: Package },
                  { id: 'shopping', label: 'Shopping', icon: ShoppingCart }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors ${
                        isActive
                          ? 'bg-orange-100 text-orange-700'
                          : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-gray-50 transition-colors"
              >
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeSection === 'recipes' && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to TastyTray! 🍽️
              </h2>
              <p className="text-gray-600">
                Discover delicious recipes tailored to your taste
              </p>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-orange-600 mr-2" size={32} />
                <span className="text-gray-600">Loading delicious recipes...</span>
              </div>
            )}
            
            {!loading && recipes.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Popular Recipes ({recipes.length})
                  </h3>
                  <button
                    onClick={loadRecipes}
                    className="text-sm bg-orange-100 hover:bg-orange-200 px-3 py-1 rounded-md transition-colors"
                  >
                    Load More
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recipes.map((recipe) => (
                    <div 
                      key={recipe.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="relative h-48 cursor-pointer" onClick={() => setSelectedRecipe(recipe)}>
                        <img
                          src={recipe.image}
                          alt={recipe.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
                          {recipe.difficulty}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(recipe);
                          }}
                          className={`absolute top-2 left-2 p-2 rounded-full transition-colors ${
                            isFavorite(recipe.id) 
                              ? 'bg-red-500 text-white' 
                              : 'bg-white bg-opacity-80 text-gray-600 hover:bg-red-50 hover:text-red-500'
                          }`}
                        >
                          <Heart size={16} className={isFavorite(recipe.id) ? 'fill-current' : ''} />
                        </button>
                      </div>
                      
                      <div className="p-4">
                        <h4 className="font-semibold text-lg mb-2 line-clamp-2">{recipe.name}</h4>
                        
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {recipe.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Clock size={16} />
                            <span>{recipe.cookTime}min</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Users size={16} />
                            <span>{recipe.servings}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Star size={16} className="text-yellow-400 fill-current" />
                            <span>{recipe.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-500 mb-3">
                          <span className="font-medium text-orange-600">{recipe.nutrition.calories}</span> cal
                          <span className="mx-2">•</span>
                          <span>{recipe.nutrition.protein}g protein</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => openMealPlanModal(recipe)}
                            className="flex-1 bg-orange-100 text-orange-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-orange-200 transition-colors flex items-center justify-center gap-1"
                          >
                            <Calendar size={14} />
                            Plan Meal
                          </button>
                          <button
                            onClick={() => setSelectedRecipe(recipe)}
                            className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                          >
                            View Recipe
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {!loading && recipes.length === 0 && (
              <div className="text-center py-12">
                <ChefHat size={48} className="mx-auto text-gray-400 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  No recipes loaded yet
                </h4>
                <p className="text-gray-600 mb-4">
                  Click below to load some delicious recipes!
                </p>
                <button 
                  onClick={loadRecipes}
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Load Recipes
                </button>
              </div>
            )}
          </>
        )}
        
        {activeSection === 'favorites' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Your Favorite Recipes ❤️
              </h2>
              <p className="text-gray-600">
                All your saved recipes in one place
              </p>
            </div>
            
            {favorites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((favorite) => {
                  const recipe = {
                    id: favorite.recipe_id,
                    name: favorite.recipe_title,
                    image: favorite.recipe_image,
                    description: 'Saved from your favorites',
                    cookTime: '30',
                    servings: '4',
                    rating: 4.5
                  };
                  
                  return (
                    <div 
                      key={favorite.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-colors"
                    >
                      <div className="relative h-48 cursor-pointer" onClick={() => setSelectedRecipe(recipe)}>
                        <img
                          src={recipe.image}
                          alt={recipe.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(recipe);
                          }}
                          className="absolute top-2 right-2 p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                        >
                          <Heart size={16} className="fill-current" />
                        </button>
                      </div>
                      
                      <div className="p-4">
                        <h4 className="font-semibold text-lg mb-2">{recipe.name}</h4>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {recipe.description}
                        </p>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => openMealPlanModal(recipe)}
                            className="flex-1 bg-orange-100 text-orange-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-orange-200 transition-colors flex items-center justify-center gap-1"
                          >
                            <Calendar size={14} />
                            Plan Meal
                          </button>
                          <button
                            onClick={() => setSelectedRecipe(recipe)}
                            className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                          >
                            View Recipe
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart size={48} className="mx-auto text-gray-400 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  No favorites yet
                </h4>
                <p className="text-gray-600 mb-4">
                  Start adding recipes to your favorites by clicking the heart icon!
                </p>
                <button 
                  onClick={() => setActiveSection('recipes')}
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Browse Recipes
                </button>
              </div>
            )}
          </div>
        )}
        
        {activeSection === 'meal-plan' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Meal Planning 📅
              </h2>
              <p className="text-gray-600">
                Plan your meals for the week
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                  const today = new Date();
                  const dayDate = new Date(today.setDate(today.getDate() - today.getDay() + ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(day) + 1));
                  const dateStr = dayDate.toISOString().split('T')[0];
                  
                  return (
                    <div key={day} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-center mb-3">{day}</h4>
                      <div className="text-sm text-gray-500 text-center mb-3">
                        {dayDate.toLocaleDateString()}
                      </div>
                      
                      {['breakfast', 'lunch', 'dinner'].map((mealType) => (
                        <div key={mealType} className="mb-2">
                          <div className="text-xs font-medium text-gray-700 capitalize mb-1">
                            {mealType}
                          </div>
                          {mealPlan[dateStr]?.[mealType] ? (
                            <div className="bg-orange-50 p-2 rounded text-xs">
                              <div className="font-medium">{mealPlan[dateStr][mealType].name}</div>
                              <div className="text-gray-600">{mealPlan[dateStr][mealType].cookTime}min</div>
                            </div>
                          ) : (
                            <div className="bg-gray-50 p-2 rounded text-xs text-gray-500 text-center">
                              + Add meal
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
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
                  onClick={() => setSelectedRecipe(null)}
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
                    {selectedRecipe.ingredients?.map((ingredient) => (
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
                      <span>{selectedRecipe.nutrition?.calories}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Protein:</span>
                      <span>{selectedRecipe.nutrition?.protein}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Carbs:</span>
                      <span>{selectedRecipe.nutrition?.carbs}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fat:</span>
                      <span>{selectedRecipe.nutrition?.fat}g</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-2">Instructions</h3>
                <ol className="space-y-3">
                  {selectedRecipe.steps?.map((step) => (
                    <li key={step.num} className="flex gap-3">
                      <span className="bg-orange-100 text-orange-800 text-sm font-medium px-2 py-1 rounded-full min-w-[24px] text-center">
                        {step.num}
                      </span>
                      <span className="text-gray-700 flex-1">{step.instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Meal Planning Modal */}
      {showMealPlanModal && selectedRecipeForMeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add to Meal Plan</h3>
              <button
                onClick={() => {
                  setShowMealPlanModal(false);
                  setSelectedRecipeForMeal(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={selectedRecipeForMeal.image}
                  alt={selectedRecipeForMeal.name}
                  className="w-12 h-12 object-cover rounded"
                />
                <div>
                  <h4 className="font-medium">{selectedRecipeForMeal.name}</h4>
                  <p className="text-sm text-gray-500">{selectedRecipeForMeal.cookTime}min • {selectedRecipeForMeal.servings} servings</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                <input
                  type="date"
                  id="mealDate"
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meal Type</label>
                <select
                  id="mealType"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowMealPlanModal(false);
                  setSelectedRecipeForMeal(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const dateInput = document.getElementById('mealDate') as HTMLInputElement;
                  const mealTypeSelect = document.getElementById('mealType') as HTMLSelectElement;
                  
                  if (!dateInput?.value) {
                    alert('Please select a date');
                    return;
                  }
                  
                  addToMealPlan(dateInput.value, mealTypeSelect.value, selectedRecipeForMeal);
                }}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
              >
                Add to Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export the app wrapped with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <TastyTrayApp />
    </AuthProvider>
  );
}
