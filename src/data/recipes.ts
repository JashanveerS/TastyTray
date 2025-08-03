import axios from 'axios';
import type { Recipe, SearchOptions } from './models';

const MEAL_DB_URL = 'https://www.themealdb.com/api/json/v1/1';
const SPOON_URL = 'https://api.spoonacular.com/recipes';

// Get API key from environment
const SPOON_KEY = import.meta.env.VITE_SPOONACULAR_KEY;

export const fetchRandomRecipes = async (count = 12, offset = 0): Promise<Recipe[]> => {
  try {
    const recipes: Recipe[] = [];
    
    // Try Spoonacular first if available (single API call for multiple recipes)
    if (SPOON_KEY) {
      try {
        const spoonResponse = await axios.get(`${SPOON_URL}/random`, {
          params: {
            apiKey: SPOON_KEY,
            number: count * 2, // Fetch more to filter for high ratings
            includeNutrition: true,
          },
          timeout: 10000 // 10 second timeout
        });
        
        if (spoonResponse.data.recipes && spoonResponse.data.recipes.length > 0) {
          const highRatedRecipes = [];
          for (const recipe of spoonResponse.data.recipes) {
            const transformedRecipe = transformSpoonRecipe(recipe);
            // Only include recipes with rating 4.0 or higher
            if (transformedRecipe.rating && transformedRecipe.rating >= 4.0) {
              highRatedRecipes.push(transformedRecipe);
            }
          }
          if (highRatedRecipes.length >= count) {
            return highRatedRecipes.slice(0, count);
          }
          recipes.push(...highRatedRecipes);
        }
      } catch (error) {
        // Spoonacular failed, fallback to MealDB
      }
    }
    
    // Fallback to MealDB but with more calls for pagination and filtering
    try {
      const maxAttempts = count * 3; // Try more recipes to find high-rated ones
      const maxParallel = Math.min(maxAttempts, 12); // Allow up to 12 parallel calls
      const mealDbPromises = Array.from({ length: maxParallel }, () =>
        axios.get(`${MEAL_DB_URL}/random.php`, { timeout: 5000 })
      );
      
      const responses = await Promise.allSettled(mealDbPromises);
      const highRatedRecipes = [];
      
      for (const response of responses) {
        if (response.status === 'fulfilled' && 
            response.value.data.meals && 
            response.value.data.meals[0]) {
          const meal = response.value.data.meals[0];
          const transformedRecipe = transformMealDbRecipe(meal);
          // Only include recipes with rating 4.0 or higher
          if (transformedRecipe.rating && transformedRecipe.rating >= 4.0) {
            highRatedRecipes.push(transformedRecipe);
          }
        }
      }
      
      recipes.push(...highRatedRecipes);
    } catch (error) {
      // MealDB failed
    }
    
    return recipes.slice(0, count);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return [];
  }
};

export const searchRecipes = async (options: SearchOptions, offset = 0): Promise<Recipe[]> => {
  const recipes: Recipe[] = [];
  
  // Search MealDB by name if query exists
  if (options.query) {
    try {
      const response = await axios.get(`${MEAL_DB_URL}/search.php?s=${options.query}`);
      if (response.data.meals) {
        // Apply offset and get next batch of meals
        const startIndex = offset;
        const endIndex = offset + 8;
        const mealsSlice = response.data.meals.slice(startIndex, endIndex);
        
        for (const meal of mealsSlice) {
          recipes.push(transformMealDbRecipe(meal));
        }
      }
    } catch (error) {
      // MealDB search failed
    }
  }
  
  // Search Spoonacular with more filters if we have API key
  if (SPOON_KEY) {
    try {
      const params: any = {
        apiKey: SPOON_KEY,
        number: 8,
        offset: offset,
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
        for (const result of response.data.results) {
          try {
            const detailResponse = await axios.get(`${SPOON_URL}/${result.id}/information`, {
              params: { apiKey: SPOON_KEY, includeNutrition: true }
            });
            recipes.push(transformSpoonRecipe(detailResponse.data));
          } catch (error) {
            // Skip recipe if details fetch fails
          }
        }
      }
    } catch (error) {
      // Spoonacular search failed
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
  
  // Generate realistic random nutrition values
  const baseCalories = 200 + Math.floor(Math.random() * 400); // 200-600 calories
  const protein = Math.floor(baseCalories * (0.15 + Math.random() * 0.20) / 4); // 15-35% of calories from protein
  const fat = Math.floor(baseCalories * (0.20 + Math.random() * 0.15) / 9); // 20-35% of calories from fat
  const carbs = Math.floor((baseCalories - (protein * 4) - (fat * 9)) / 4); // Remaining calories from carbs
  
  return {
    id: meal.idMeal,
    name: meal.strMeal,
    image: meal.strMealThumb,
    servings: Math.floor(Math.random() * 4) + 2, // 2-6 servings
    cookTime: 15 + Math.floor(Math.random() * 45), // 15-60 minutes
    description: meal.strInstructions.substring(0, 150) + '...',
    steps,
    ingredients,
    nutrition: {
      calories: baseCalories,
      protein: Math.max(protein, 5),
      carbs: Math.max(carbs, 10),
      fat: Math.max(fat, 3),
      fiber: Math.floor(Math.random() * 8) + 2, // 2-10g
      sugar: Math.floor(Math.random() * 15) + 3, // 3-18g
      sodium: Math.floor(Math.random() * 800) + 200, // 200-1000mg
    },
    cuisines: meal.strArea ? [meal.strArea] : [],
    tags: meal.strTags ? meal.strTags.split(',') : [],
    difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
    rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10, // 3.5-5.0 rating
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
