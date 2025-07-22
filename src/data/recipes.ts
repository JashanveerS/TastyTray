import axios from 'axios';
import type { Recipe, SearchOptions } from './models';

const MEAL_DB_URL = 'https://www.themealdb.com/api/json/v1/1';
const SPOON_URL = 'https://api.spoonacular.com/recipes';

// Get API key from environment
const SPOON_KEY = import.meta.env.VITE_SPOONACULAR_KEY;

export const fetchRandomRecipes = async (count = 12): Promise<Recipe[]> => {
  try {
    const recipes: Recipe[] = [];
    
    // Try MealDB first (free)
    try {
      const mealDbPromises = Array.from({ length: count }, () =>
        axios.get(`${MEAL_DB_URL}/random.php`)
      );
      
      const responses = await Promise.all(mealDbPromises);
      
      for (const response of responses) {
        if (response.data.meals && response.data.meals[0]) {
          const meal = response.data.meals[0];
          recipes.push(transformMealDbRecipe(meal));
        }
      }
    } catch (error) {
      console.log('MealDB error:', error);
    }
    
    // Fill remaining with Spoonacular if we have API key
    if (recipes.length < count && SPOON_KEY) {
      try {
        const remaining = count - recipes.length;
        const spoonResponse = await axios.get(`${SPOON_URL}/random`, {
          params: {
            apiKey: SPOON_KEY,
            number: remaining,
            includeNutrition: true,
          }
        });
        
        if (spoonResponse.data.recipes) {
          for (const recipe of spoonResponse.data.recipes) {
            recipes.push(transformSpoonRecipe(recipe));
          }
        }
      } catch (error) {
        console.log('Spoonacular error:', error);
      }
    }
    
    return recipes.slice(0, count);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return [];
  }
};

export const searchRecipes = async (options: SearchOptions): Promise<Recipe[]> => {
  const recipes: Recipe[] = [];
  
  // Search MealDB by name if query exists
  if (options.query) {
    try {
      const response = await axios.get(`${MEAL_DB_URL}/search.php?s=${options.query}`);
      if (response.data.meals) {
        for (const meal of response.data.meals.slice(0, 6)) {
          recipes.push(transformMealDbRecipe(meal));
        }
      }
    } catch (error) {
      console.log('MealDB search error:', error);
    }
  }
  
  // Search Spoonacular with more filters if we have API key
  if (SPOON_KEY) {
    try {
      const params: any = {
        apiKey: SPOON_KEY,
        number: 12,
        includeNutrition: true,
      };
      
      if (options.query) params.query = options.query;
      if (options.cuisine) params.cuisine = options.cuisine.join(',');
      if (options.diet) params.diet = options.diet.join(',');
      if (options.allergies) params.intolerances = options.allergies.join(',');
      if (options.maxTime) params.maxReadyTime = options.maxTime;
      if (options.ingredients) params.includeIngredients = options.ingredients.join(',');
      if (options.excludeIngredients) params.excludeIngredients = options.excludeIngredients.join(',');
      
      const response = await axios.get(`${SPOON_URL}/complexSearch`, { params });
      
      if (response.data.results) {
        // Get detailed info for each recipe
        for (const result of response.data.results.slice(0, 6)) {
          try {
            const detailResponse = await axios.get(`${SPOON_URL}/${result.id}/information`, {
              params: { apiKey: SPOON_KEY, includeNutrition: true }
            });
            recipes.push(transformSpoonRecipe(detailResponse.data));
          } catch (error) {
            console.log(`Error getting recipe ${result.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.log('Spoonacular search error:', error);
    }
  }
  
  return recipes;
};

const transformMealDbRecipe = (meal: any): Recipe => {
  const ingredients = [];
  
  // MealDB has up to 20 ingredients
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    
    if (ingredient && ingredient.trim()) {
      ingredients.push({
        id: `${meal.idMeal}-${i}`,
        name: ingredient.trim(),
        amount: 1,
        unit: measure ? measure.trim() : '',
      });
    }
  }
  
  const steps = meal.strInstructions
    .split('.')
    .filter((step: string) => step.trim())
    .map((step: string, index: number) => ({
      num: index + 1,
      instruction: step.trim() + '.'
    }));
  
  return {
    id: meal.idMeal,
    name: meal.strMeal,
    image: meal.strMealThumb,
    servings: 4,
    cookTime: 30,
    description: meal.strInstructions.substring(0, 150) + '...',
    steps,
    ingredients,
    nutrition: {
      calories: 250,
      protein: 20,
      carbs: 30,
      fat: 10,
      fiber: 5,
      sugar: 8,
      sodium: 400,
    },
    cuisines: meal.strArea ? [meal.strArea] : [],
    tags: meal.strTags ? meal.strTags.split(',') : [],
    difficulty: 'medium',
    source: 'mealdb',
  };
};

const transformSpoonRecipe = (recipe: any): Recipe => {
  const ingredients = recipe.extendedIngredients?.map((ing: any) => ({
    id: ing.id.toString(),
    name: ing.name,
    amount: ing.amount,
    unit: ing.unit,
    image: ing.image,
  })) || [];
  
  const steps = recipe.analyzedInstructions?.[0]?.steps?.map((step: any) => ({
    num: step.number,
    instruction: step.step,
  })) || [];
  
  const nutrition = recipe.nutrition?.nutrients || [];
  const calories = nutrition.find((n: any) => n.name === 'Calories')?.amount || 0;
  const protein = nutrition.find((n: any) => n.name === 'Protein')?.amount || 0;
  const carbs = nutrition.find((n: any) => n.name === 'Carbohydrates')?.amount || 0;
  const fat = nutrition.find((n: any) => n.name === 'Fat')?.amount || 0;
  const fiber = nutrition.find((n: any) => n.name === 'Fiber')?.amount || 0;
  const sugar = nutrition.find((n: any) => n.name === 'Sugar')?.amount || 0;
  const sodium = nutrition.find((n: any) => n.name === 'Sodium')?.amount || 0;
  
  return {
    id: recipe.id.toString(),
    name: recipe.title,
    image: recipe.image,
    servings: recipe.servings,
    cookTime: recipe.readyInMinutes,
    description: recipe.summary?.replace(/<[^>]*>/g, '').substring(0, 150) + '...' || '',
    steps,
    ingredients,
    nutrition: {
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sugar,
      sodium,
    },
    cuisines: recipe.cuisines || [],
    tags: recipe.diets || [],
    difficulty: recipe.readyInMinutes > 60 ? 'hard' : recipe.readyInMinutes > 30 ? 'medium' : 'easy',
    rating: recipe.spoonacularScore / 20,
    source: 'spoonacular',
  };
};
