export interface User {
  id: string;
  name: string;
  email: string;
  preferences: string[];
  allergies: string[];
  goals: Goals;
  favoriteCuisines: string[];
}

export interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Recipe {
  id: string;
  name: string;
  image: string;
  servings: number;
  cookTime: number;
  description: string;
  steps: Step[];
  ingredients: Item[];
  nutrition: Nutrition;
  cuisines: string[];
  tags: string[];
  difficulty: string;
  rating?: number;
  source: string;
}

export interface Step {
  num: number;
  instruction: string;
}

export interface Item {
  id: string;
  name: string;
  amount: number;
  unit: string;
  image?: string;
}

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface MealPlan {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  meals: PlannedMeal[];
  totalNutrition: Nutrition;
}

export interface PlannedMeal {
  id: string;
  date: string;
  type: string;
  recipe: Recipe;
  servings: number;
}

export interface SearchOptions {
  query?: string;
  cuisine?: string[];
  diet?: string[];
  allergies?: string[];
  maxTime?: number;
  ingredients?: string[];
  excludeIngredients?: string[];
}

export interface Ingredient {
  id: string;
  name: string;
  image?: string;
  expiry?: string;
  amount?: number;
  unit?: string;
}

// Supabase Database Types
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  recipe_id: string;
  recipe_title: string;
  recipe_image?: string;
  created_at: string;
}

export interface PantryItem {
  id: string;
  user_id: string;
  ingredient_name: string;
  quantity?: number;
  unit?: string;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListItem {
  id: string;
  user_id: string;
  ingredient_name: string;
  quantity?: number;
  unit?: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface MealPlanItem {
  id: string;
  user_id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipe_id: string;
  recipe_title: string;
  recipe_image?: string;
  servings: number;
  created_at: string;
}
