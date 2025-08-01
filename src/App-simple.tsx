import { useState, useEffect } from 'react';
import { ChefHat, Mail, Lock, Search, Clock, Users, Star, Loader2, Filter, Heart, Calendar, Package, ShoppingCart } from 'lucide-react';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import { favoritesService, pantryService, shoppingListService, mealPlanService } from './data/services';
// Optimized API fetch function
const fetchRecipes = async (count = 3) => {
  const SPOON_KEY = import.meta.env.VITE_SPOONACULAR_KEY;
  const MEAL_DB_URL = 'https://www.themealdb.com/api/json/v1/1';
  const SPOON_URL = 'https://api.spoonacular.com/recipes';
  
  const recipes = [];
  
  // Try Spoonacular first (single API call for multiple recipes)
  if (SPOON_KEY) {
    try {
      console.log('Fetching from Spoonacular...');
      const response = await axios.get(`${SPOON_URL}/random`, {
        params: {
          apiKey: SPOON_KEY,
          number: count,
          includeNutrition: true,
        },
        timeout: 8000
      });
      
      if (response.data.recipes) {
        for (const recipe of response.data.recipes) {
          recipes.push({
            id: recipe.id.toString(),
            name: recipe.title,
            image: recipe.image,
            servings: recipe.servings || 4,
            cookTime: recipe.readyInMinutes || 30,
            description: recipe.summary?.replace(/<[^>]*>/g, '').substring(0, 150) + '...' || 'Delicious recipe',
            steps: recipe.analyzedInstructions?.[0]?.steps?.slice(0, 5).map(step => ({
              num: step.number,
              instruction: step.step
            })) || [],
            ingredients: recipe.extendedIngredients?.slice(0, 8).map(ing => ({
              id: ing.id.toString(),
              name: ing.name,
              amount: ing.amount,
              unit: ing.unit
            })) || [],
            nutrition: {
              calories: recipe.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || 300,
              protein: recipe.nutrition?.nutrients?.find(n => n.name === 'Protein')?.amount || 20,
              carbs: recipe.nutrition?.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || 40,
              fat: recipe.nutrition?.nutrients?.find(n => n.name === 'Fat')?.amount || 15,
              fiber: 5,
              sugar: 8,
              sodium: 500
            },
            cuisines: recipe.cuisines || [],
            tags: recipe.diets || [],
            difficulty: recipe.readyInMinutes > 45 ? 'hard' : recipe.readyInMinutes > 25 ? 'medium' : 'easy',
            rating: Math.round((recipe.spoonacularScore / 20) * 10) / 10 || 4.0,
            source: 'spoonacular'
          });
        }
        return recipes;
      }
} catch (error: any) {
      console.log('Spoonacular failed:', error.message);
    }
  }
  
  // Fallback to MealDB with minimal calls
  try {
    console.log('Fetching from MealDB...');
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
          for (let i = 1; i <= 10; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            if (ingredient?.trim()) {
              ingredients.push({
                id: `${meal.idMeal}-${i}`,
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
} catch (error: any) {
    console.log('MealDB failed:', error.message);
  }
  
  return recipes;
};

// Search recipes function
const searchRecipes = async (query: string, filters: any = {}) => {
  const SPOON_KEY = import.meta.env.VITE_SPOONACULAR_KEY;
  const MEAL_DB_URL = 'https://www.themealdb.com/api/json/v1/1';
  const SPOON_URL = 'https://api.spoonacular.com/recipes';
  
  const recipes = [];
  
  // Try Spoonacular first if we have filters or API key
  if (SPOON_KEY && (query || filters.cuisine || filters.diet)) {
    try {
      console.log('Searching with Spoonacular...');
      const params: any = {
        apiKey: SPOON_KEY,
        number: 6,
        addRecipeInformation: true,
        includeNutrition: true,
      };
      
      if (query) params.query = query;
      if (filters.cuisine) params.cuisine = filters.cuisine;
      if (filters.diet) params.diet = filters.diet;
      if (filters.maxTime) params.maxReadyTime = filters.maxTime;
      
      const response = await axios.get(`${SPOON_URL}/complexSearch`, {
        params,
        timeout: 8000
      });
      
      if (response.data.results) {
        for (const result of response.data.results) {
          recipes.push({
            id: result.id.toString(),
            name: result.title,
            image: result.image,
            servings: result.servings || 4,
            cookTime: result.readyInMinutes || 30,
            description: result.summary?.replace(/<[^>]*>/g, '').substring(0, 150) + '...' || 'Delicious recipe',
            steps: [],
            ingredients: [],
            nutrition: {
              calories: 250 + Math.floor(Math.random() * 350),
              protein: 15 + Math.floor(Math.random() * 25),
              carbs: 20 + Math.floor(Math.random() * 40),
              fat: 8 + Math.floor(Math.random() * 20),
              fiber: 3 + Math.floor(Math.random() * 8),
              sugar: 5 + Math.floor(Math.random() * 15),
              sodium: 300 + Math.floor(Math.random() * 700)
            },
            cuisines: result.cuisines || [],
            tags: result.diets || [],
            difficulty: (result.readyInMinutes || 30) > 45 ? 'hard' : (result.readyInMinutes || 30) > 25 ? 'medium' : 'easy',
            rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
            source: 'spoonacular'
          });
        }
        return recipes;
      }
} catch (error: any) {
      console.log('Spoonacular search failed:', error.message);
    }
  }
  
  // Fallback to MealDB for simple text search
  if (query) {
    try {
      console.log('Searching with MealDB...');
      const response = await axios.get(`${MEAL_DB_URL}/search.php?s=${query}`, {
        timeout: 5000
      });
      
      if (response.data.meals) {
        for (const meal of response.data.meals.slice(0, 6)) {
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
              for (let i = 1; i <= 10; i++) {
                const ingredient = meal[`strIngredient${i}`];
                const measure = meal[`strMeasure${i}`];
                if (ingredient?.trim()) {
                  ingredients.push({
                    id: `${meal.idMeal}-${i}`,
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
} catch (error: any) {
      console.log('MealDB search failed:', error.message);
    }
  }
  
  return recipes;
};

// Main app component - keeping existing logic for now
function TastyTrayApp() {
  // Get Supabase auth state (but don't use it yet)
  const { user, login, register, signOut, loading: authLoading } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  // Use only Supabase user state for authentication
  const isLoggedIn = !!user;
  
  // Auto-fill email when user logs in via Supabase
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    cuisine: '',
    diet: '',
    maxTime: ''
  });
  const [hasSearched, setHasSearched] = useState(false);
  
  // Modal states
  const [showMealPlanModal, setShowMealPlanModal] = useState(false);
  const [selectedRecipeForMeal, setSelectedRecipeForMeal] = useState<any>(null);
  
  // Navigation state
  const [activeSection, setActiveSection] = useState('recipes');
  
  // Features state - loaded from Supabase
  const [favorites, setFavorites] = useState([]);
  const [pantryItems, setPantryItems] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [mealPlan, setMealPlan] = useState({});
  
  
  // Load user data from Supabase when user logs in
  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      // Clear data when user logs out
      setFavorites([]);
      setPantryItems([]);
      setShoppingList([]);
      setMealPlan({});
    }
  }, [user]);
  
  const loadUserData = async () => {
    if (!user) return;
    
    console.log('Loading user data for user:', user.id);
    
    try {
      // Load all user data in parallel
      const [favoritesData, pantryData, shoppingData, mealPlanData] = await Promise.all([
        favoritesService.getFavorites(user.id),
        pantryService.getPantryItems(user.id),
        shoppingListService.getShoppingList(user.id),
        mealPlanService.getMealPlans(user.id)
      ]);
      
      console.log('Loaded favorites:', favoritesData);
      console.log('Loaded pantry:', pantryData);
      console.log('Loaded shopping list:', shoppingData);
      console.log('Loaded meal plans:', mealPlanData);
      
      setFavorites(favoritesData || []);
      setPantryItems(pantryData || []);
      setShoppingList(shoppingData || []);
      
      // Convert meal plan array to object grouped by date and meal type
      const mealPlanObj = {};
      mealPlanData.forEach(meal => {
        if (!mealPlanObj[meal.date]) {
          mealPlanObj[meal.date] = {};
        }
        mealPlanObj[meal.date][meal.meal_type] = {
          id: meal.recipe_id,
          name: meal.recipe_title,
          image: meal.recipe_image,
          servings: meal.servings
        };
      });
      setMealPlan(mealPlanObj);
      
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };
  
  // Load recipes when user logs in
  useEffect(() => {
    if (isLoggedIn && recipes.length === 0) {
      loadRecipes();
    }
  }, [isLoggedIn]);
  
  const loadRecipes = async () => {
    setLoading(true);
    setHasSearched(false);
    try {
      const fetchedRecipes = await fetchRecipes(3); // Start with just 3 recipes
      setRecipes(fetchedRecipes);
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };
  
const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() && !searchFilters.cuisine && !searchFilters.diet) {
      return;
    }
    
    setLoading(true);
    setHasSearched(true);
    
    try {
      const searchResults = await searchRecipes(searchQuery.trim(), searchFilters);
      setRecipes(searchResults);
    } catch (error) {
      console.error('Error searching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }
    
    try {
      if (isLogin) {
        await login(email, password);
        console.log('Login successful');
      } else {
        if (!name) {
          alert('Please enter your name');
          return;
        }
        await register(name, email, password);
        console.log('Registration successful');
      }
    } catch (error: any) {
      alert(error.message || 'Authentication failed');
    }
  };

  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      await signOut();
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear all local state and caches
    setRecipes([]);
    setEmail('');
    setPassword('');
    setName('');
    
    // Clear all localStorage data
    localStorage.removeItem('tastytray_logged_in');
    localStorage.removeItem('tastytray_favorites');
    localStorage.removeItem('tastytray_pantry');
    localStorage.removeItem('tastytray_shopping');
    localStorage.removeItem('tastytray_mealplan');
    
    // Clear any browser caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
  };
  
  // Helper functions for features
  const addToFavorites = async (recipe: any) => {
    if (!user) return;
    
    try {
      const newFavorite = await favoritesService.addFavorite(user.id, recipe.id, recipe.name, recipe.image);
      setFavorites(prev => [...prev, newFavorite]);
      console.log('Added to favorites:', newFavorite);
    } catch (error) {
      console.error('Failed to add favorite:', error);
      alert('Failed to add to favorites. Please try again.');
    }
  };
  
  const removeFromFavorites = async (recipeId: string) => {
    if (!user) return;
    
    try {
      await favoritesService.removeFavorite(user.id, recipeId);
      setFavorites(prev => prev.filter(fav => fav.recipe_id !== recipeId));
      console.log('Removed from favorites:', recipeId);
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      alert('Failed to remove from favorites. Please try again.');
    }
  };
  
  const isFavorite = (recipeId: string) => {
    return favorites.some(fav => fav.recipe_id === recipeId);
  };
  
const addToPantry = async (ingredient: any) => {
    if (!user) return;
    
    try {
      const newItem = await pantryService.addPantryItem(user.id, ingredient.name);
      setPantryItems(prev => [...prev, newItem]);
      console.log('Added to pantry:', newItem);
    } catch (error) {
      console.error('Failed to add pantry item:', error);
      alert('Failed to add to pantry. Please try again.');
    }
  };
  
  const removeFromPantry = async (itemId: string) => {
    if (!user) return;
    
    try {
      await pantryService.removePantryItem(itemId);
      setPantryItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Failed to remove pantry item:', error);
    }
  };
  
const addToShoppingList = async (ingredient: any) => {
    if (!user) return;
    
    try {
      const newItem = await shoppingListService.addShoppingItem(user.id, ingredient.name);
      setShoppingList(prev => [...prev, newItem]);
      console.log('Added to shopping list:', newItem);
    } catch (error) {
      console.error('Failed to add shopping item:', error);
      alert('Failed to add to shopping list. Please try again.');
    }
  };
  
  const toggleShoppingItem = async (itemId: string) => {
    if (!user) return;
    
    try {
      const item = shoppingList.find(item => item.id === itemId);
      if (item) {
        await shoppingListService.toggleShoppingItem(itemId, !item.is_completed);
        setShoppingList(prev => prev.map(item => 
          item.id === itemId ? { ...item, is_completed: !item.is_completed } : item
        ));
      }
    } catch (error) {
      console.error('Failed to toggle shopping item:', error);
    }
  };
  
  const removeFromShoppingList = async (itemId: string) => {
    if (!user) return;
    
    try {
      await shoppingListService.removeShoppingItem(itemId);
      setShoppingList(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Failed to remove shopping item:', error);
    }
  };
  
const addToMealPlan = async (date: string, mealType: string, recipe: any) => {
    if (!user) return;
    
    try {
      const newMealPlan = await mealPlanService.addMealPlan(
        user.id,
        date,
        mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        recipe.id,
        recipe.name,
        recipe.servings || 1,
        recipe.image
      );
      
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
      
      console.log('Added to meal plan:', newMealPlan);
      
      // Close modal after adding
      setShowMealPlanModal(false);
      setSelectedRecipeForMeal(null);
      
      alert(`Added ${recipe.name} to ${mealType} on ${date}!`);
    } catch (error) {
      console.error('Failed to add meal plan:', error);
      alert('Failed to add to meal plan. Please try again.');
    }
  };
  
  const openMealPlanModal = (recipe: any) => {
    setSelectedRecipeForMeal(recipe);
    setShowMealPlanModal(true);
  };

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <ChefHat className="text-orange-600" size={32} />
                  <h1 className="text-2xl font-bold text-orange-600">TastyTray</h1>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {[
                    { id: 'recipes', label: 'Recipes', icon: ChefHat },
                    { id: 'favorites', label: 'Favorites', icon: Heart },
                    { id: 'meal-plan', label: 'Meal Plan', icon: Calendar },
                    { id: 'pantry', label: 'Pantry', icon: Package },
                    { id: 'shopping', label: 'Shopping', icon: ShoppingCart },
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

              {/* User Menu */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>{user?.email || email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-gray-50 transition-colors"
                >
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
            
            {/* Mobile Navigation */}
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {[
                  { id: 'recipes', label: 'Recipes', icon: ChefHat },
                  { id: 'favorites', label: 'Favorites', icon: Heart },
                  { id: 'meal-plan', label: 'Meal Plan', icon: Calendar },
                  { id: 'pantry', label: 'Pantry', icon: Package },
                  { id: 'shopping', label: 'Shopping', icon: ShoppingCart },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
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
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Debug Component - Remove this after testing */}
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

          {/* Search Bar */}
          <div className="mb-8 max-w-4xl mx-auto">
            <form onSubmit={handleSearch} className="relative">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for recipes..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${showFilters ? 'bg-gray-100' : ''}`}
                >
                  <Filter size={20} className="text-gray-600" />
                </button>
                
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
              </div>
            </form>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine</label>
                    <select
                      value={searchFilters.cuisine}
                      onChange={(e) => setSearchFilters({
                        ...searchFilters,
                        cuisine: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Any cuisine</option>
                      <option value="Italian">Italian</option>
                      <option value="Mexican">Mexican</option>
                      <option value="Asian">Asian</option>
                      <option value="American">American</option>
                      <option value="Mediterranean">Mediterranean</option>
                      <option value="Indian">Indian</option>
                      <option value="Thai">Thai</option>
                      <option value="French">French</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Diet</label>
                    <select
                      value={searchFilters.diet}
                      onChange={(e) => setSearchFilters({
                        ...searchFilters,
                        diet: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Any diet</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="gluten-free">Gluten Free</option>
                      <option value="keto">Keto</option>
                      <option value="paleo">Paleo</option>
                      <option value="dairy-free">Dairy Free</option>
                      <option value="low-carb">Low Carb</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max cooking time</label>
                    <select
                      value={searchFilters.maxTime}
                      onChange={(e) => setSearchFilters({
                        ...searchFilters,
                        maxTime: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Any time</option>
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchFilters({ cuisine: '', diet: '', maxTime: '' });
                      setSearchQuery('');
                    }}
                    className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
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
                  {hasSearched ? 'Search Results' : 'Popular Recipes'} ({recipes.length})
                </h3>
                <div className="flex gap-2">
                  {hasSearched && (
                    <button
                      onClick={() => {
                        setHasSearched(false);
                        setSearchQuery('');
                        setSearchFilters({ cuisine: '', diet: '', maxTime: '' });
                        loadRecipes();
                      }}
                      className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md transition-colors"
                    >
                      View Popular Recipes
                    </button>
                  )}
                  {!hasSearched && (
                    <button
                      onClick={loadRecipes}
                      className="text-sm bg-orange-100 hover:bg-orange-200 px-3 py-1 rounded-md transition-colors"
                    >
                      Load More
                    </button>
                  )}
                </div>
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
                      if (isFavorite(recipe.id)) {
                        removeFromFavorites(recipe.id);
                      } else {
                        addToFavorites(recipe);
                      }
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
                  
                  {/* Action buttons */}
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
          
          {/* Favorites Section */}
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
                    // Create a recipe object from the favorite data
                    const recipe = {
                      id: favorite.recipe_id,
                      name: favorite.recipe_title,
                      image: favorite.recipe_image,
                      description: 'Saved from your favorites',
                      cookTime: '30', // Default values since we don't store these
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
                              removeFromFavorites(favorite.recipe_id);
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
                              <span>{recipe.rating?.toFixed(1) || '4.0'}</span>
                            </div>
                          </div>
                          
                          {/* Action buttons */}
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
          
          {/* Meal Plan Section */}
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
          
          {/* Pantry Section */}
          {activeSection === 'pantry' && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Your Pantry 📦
                </h2>
                <p className="text-gray-600">
                  Keep track of your ingredients
                </p>
              </div>
              
              <div className="mb-6">
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h3 className="font-semibold mb-3">Add New Ingredient</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ingredient name..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      onKeyPress={(e: any) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          addToPantry({ name: e.target.value.trim() });
                          e.target.value = '';
                        }
                      }}
                    />
                    <button
                      onClick={(e: any) => {
                        const input = e.target.parentElement.querySelector('input');
                        if (input.value.trim()) {
                          addToPantry({ name: input.value.trim() });
                          input.value = '';
                        }
                      }}
                      className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
              
              {pantryItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pantryItems.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{item.ingredient_name}</h4>
                        <button
                          onClick={() => removeFromPantry(item.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Added {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package size={48} className="mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Your pantry is empty
                  </h4>
                  <p className="text-gray-600">
                    Add ingredients to keep track of what you have at home
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Shopping List Section */}
          {activeSection === 'shopping' && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Shopping List 🛒
                </h2>
                <p className="text-gray-600">
                  Keep track of what you need to buy
                </p>
              </div>
              
              <div className="mb-6">
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h3 className="font-semibold mb-3">Add New Item</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Item name..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      onKeyPress={(e: any) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          addToShoppingList({ name: e.target.value.trim() });
                          e.target.value = '';
                        }
                      }}
                    />
                    <button
                      onClick={(e: any) => {
                        const input = e.target.parentElement.querySelector('input');
                        if (input.value.trim()) {
                          addToShoppingList({ name: input.value.trim() });
                          input.value = '';
                        }
                      }}
                      className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
              
              {shoppingList.length > 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="space-y-3">
                    {shoppingList.map((item) => (
                      <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                        item.is_completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleShoppingItem(item.id)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              item.is_completed 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'border-gray-300 hover:border-green-400'
                            }`}
                          >
                            {item.is_completed && '✓'}
                          </button>
                          <span className={`font-medium ${
                            item.is_completed ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}>
                            {item.ingredient_name}
                          </span>
                        </div>
                        <button
                          onClick={() => removeFromShoppingList(item.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {shoppingList.some(item => item.is_completed) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={async () => {
                          try {
                            await shoppingListService.clearCompleted(user!.id);
                            setShoppingList(prev => prev.filter(item => !item.is_completed));
                            console.log('Cleared completed items');
                          } catch (error) {
                            console.error('Failed to clear completed items:', error);
                            alert('Failed to clear completed items. Please try again.');
                          }
                        }}
                        className="text-sm text-gray-600 hover:text-gray-800"
                      >
                        Clear completed items
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Your shopping list is empty
                  </h4>
                  <p className="text-gray-600">
                    Add items you need to buy for your next grocery trip
                  </p>
                </div>
              )}
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
                    
                    if (!dateInput.value) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ChefHat className="text-orange-600" size={40} />
            <h1 className="text-3xl font-bold text-gray-900">TastyTray</h1>
          </div>
          <p className="text-gray-600">
            {isLogin ? 'Welcome back! Sign in to your account' : 'Create your account to get started'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="input"
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input pl-10"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input pl-10"
                  placeholder={isLogin ? "Enter your password" : "Create a password"}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full btn btn-primary py-3 text-lg"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Toggle */}
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

// Export the app wrapped with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <TastyTrayApp />
    </AuthProvider>
  );
}
