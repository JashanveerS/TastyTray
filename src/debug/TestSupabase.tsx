import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../data/supabase';
import { favoritesService, mealPlanService } from '../data/services';

export const TestSupabase: React.FC = () => {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      runTests();
    }
  }, [user]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
  };

  const runTests = async () => {
    if (!user) {
      addTestResult('❌ No user logged in');
      return;
    }

    addTestResult(`✅ User logged in: ${user.email}`);

    // Test 1: Basic Supabase connection
    try {
      const { data, error } = await supabase.from('favorites').select('count').limit(1);
      if (error) {
        addTestResult(`❌ Supabase connection error: ${error.message}`);
      } else {
        addTestResult('✅ Supabase connection successful');
      }
    } catch (err) {
      addTestResult(`❌ Supabase connection failed: ${err}`);
    }

    // Test 2: Check if tables exist
    const tables = ['favorites', 'meal_plans', 'pantry_items', 'shopping_list', 'profiles'];
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          addTestResult(`❌ Table ${table} error: ${error.message}`);
        } else {
          addTestResult(`✅ Table ${table} accessible`);
        }
      } catch (err) {
        addTestResult(`❌ Table ${table} failed: ${err}`);
      }
    }

    // Test 3: Test adding a favorite
    try {
      await favoritesService.addFavorite(user.id, 'test-recipe-123', 'Test Recipe', 'https://example.com/image.jpg');
      addTestResult('✅ Add favorite successful');
      
      // Test 4: Test retrieving favorites
      const favorites = await favoritesService.getFavorites(user.id);
      addTestResult(`✅ Retrieved ${favorites.length} favorites`);
      
      // Test 5: Test removing favorite
      await favoritesService.removeFavorite(user.id, 'test-recipe-123');
      addTestResult('✅ Remove favorite successful');
    } catch (err: any) {
      addTestResult(`❌ Favorites test failed: ${err.message}`);
    }

    // Test 6: Test meal plan
    try {
      await mealPlanService.addMealPlan(
        user.id,
        '2024-01-01',
        'dinner',
        'test-recipe-456',
        'Test Meal Recipe',
        2,
        'https://example.com/meal-image.jpg'
      );
      addTestResult('✅ Add meal plan successful');
      
      const mealPlans = await mealPlanService.getMealPlans(user.id, '2024-01-01', '2024-01-01');
      addTestResult(`✅ Retrieved ${mealPlans.length} meal plans`);
      
      // Clean up
      if (mealPlans.length > 0) {
        await mealPlanService.removeMealPlan(mealPlans[0].id);
        addTestResult('✅ Remove meal plan successful');
      }
    } catch (err: any) {
      addTestResult(`❌ Meal plan test failed: ${err.message}`);
    }

    setConnectionStatus('Tests completed');
  };

  if (!user) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p>Please log in to run Supabase tests</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Supabase Connection Test</h3>
      <p className="mb-4 text-gray-600">Status: {connectionStatus}</p>
      
      <div className="space-y-2">
        {testResults.map((result, index) => (
          <div key={index} className="text-sm font-mono">
            {result}
          </div>
        ))}
      </div>
      
      <button
        onClick={runTests}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Run Tests Again
      </button>
    </div>
  );
};
