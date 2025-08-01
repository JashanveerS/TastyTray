import { supabase } from './supabase';
import type { Favorite, PantryItem, ShoppingListItem, MealPlanItem } from './models';

// Favorites Service
export const favoritesService = {
  async getFavorites(userId: string): Promise<Favorite[]> {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async addFavorite(userId: string, recipeId: string, recipeTitle: string, recipeImage?: string): Promise<Favorite> {
    
    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        recipe_id: recipeId,
        recipe_title: recipeTitle,
        recipe_image: recipeImage
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    return data;
  },

  async removeFavorite(userId: string, recipeId: string): Promise<void> {
    
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('recipe_id', recipeId);
    
    if (error) {
      throw error;
    }
  },

  async isFavorite(userId: string, recipeId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('recipe_id', recipeId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }
};

// Meal Planning Service
export const mealPlanService = {
  async getMealPlans(userId: string, startDate?: string, endDate?: string): Promise<MealPlanItem[]> {
    let query = supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', userId);
    
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    
    const { data, error } = await query.order('date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async addMealPlan(
    userId: string,
    date: string,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    recipeId: string,
    recipeTitle: string,
    servings: number,
    recipeImage?: string
  ): Promise<MealPlanItem> {
    
    // First, remove any existing meal for this date and meal type
    const { error: deleteError } = await supabase
      .from('meal_plans')
      .delete()
      .eq('user_id', userId)
      .eq('date', date)
      .eq('meal_type', mealType);
      
    // Ignore delete errors - may not exist
    
    // Insert new meal plan
    const { data, error } = await supabase
      .from('meal_plans')
      .insert({
        user_id: userId,
        date,
        meal_type: mealType,
        recipe_id: recipeId,
        recipe_title: recipeTitle,
        recipe_image: recipeImage,
        servings
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    return data;
  },

  async removeMealPlan(id: string): Promise<void> {
    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async updateMealPlan(id: string, servings: number): Promise<MealPlanItem> {
    const { data, error } = await supabase
      .from('meal_plans')
      .update({ servings })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Pantry Service
export const pantryService = {
  async getPantryItems(userId: string): Promise<PantryItem[]> {
    const { data, error } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('user_id', userId)
      .order('ingredient_name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async addPantryItem(
    userId: string,
    ingredientName: string,
    quantity?: number,
    unit?: string,
    expiryDate?: string
  ): Promise<PantryItem> {
    const { data, error } = await supabase
      .from('pantry_items')
      .insert({
        user_id: userId,
        ingredient_name: ingredientName,
        quantity,
        unit,
        expiry_date: expiryDate
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updatePantryItem(
    id: string,
    quantity?: number,
    unit?: string,
    expiryDate?: string
  ): Promise<PantryItem> {
    const { data, error } = await supabase
      .from('pantry_items')
      .update({
        quantity,
        unit,
        expiry_date: expiryDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async removePantryItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('pantry_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Shopping List Service
export const shoppingListService = {
  async getShoppingList(userId: string): Promise<ShoppingListItem[]> {
    const { data, error } = await supabase
      .from('shopping_list')
      .select('*')
      .eq('user_id', userId)
      .order('is_completed', { ascending: true })
      .order('ingredient_name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async addShoppingItem(
    userId: string,
    ingredientName: string,
    quantity?: number,
    unit?: string
  ): Promise<ShoppingListItem> {
    const { data, error } = await supabase
      .from('shopping_list')
      .insert({
        user_id: userId,
        ingredient_name: ingredientName,
        quantity,
        unit,
        is_completed: false
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async toggleShoppingItem(id: string, isCompleted: boolean): Promise<ShoppingListItem> {
    const { data, error } = await supabase
      .from('shopping_list')
      .update({
        is_completed: isCompleted,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async removeShoppingItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('shopping_list')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async generateFromMealPlan(userId: string, startDate: string, endDate: string): Promise<void> {
    // Get meal plans for the date range
    const mealPlans = await mealPlanService.getMealPlans(userId, startDate, endDate);
    
    // For each meal plan, we would need to fetch the recipe ingredients
    // This is a simplified version - in a real app, you'd want to:
    // 1. Fetch recipe details for each meal plan
    // 2. Extract ingredients and calculate quantities based on servings
    // 3. Check against pantry items to avoid duplicates
    // 4. Add missing ingredients to shopping list
    
    // For now, this is a placeholder that could be expanded with recipe API integration
  },

  async clearCompleted(userId: string): Promise<void> {
    const { error } = await supabase
      .from('shopping_list')
      .delete()
      .eq('user_id', userId)
      .eq('is_completed', true);
    
    if (error) throw error;
  }
};
