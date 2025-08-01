import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { shoppingListService } from '../data/services';
import type { ShoppingListItem } from '../data/models';

export const ShoppingList: React.FC = () => {
  const { user } = useAuth();
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadShoppingList();
    }
  }, [user]);

  const loadShoppingList = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await shoppingListService.getShoppingList(user.id);
      setShoppingList(data);
    } catch (err) {
      console.error('Error loading shopping list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = async (id: string, isCompleted: boolean) => {
    try {
      const updatedItem = await shoppingListService.toggleShoppingItem(id, !isCompleted);
      setShoppingList(prev =>
        prev.map(item =>
          item.id === id ? updatedItem : item
        )
      );
    } catch (err) {
      console.error('Error toggling shopping item:', err);
    }
  };

  const handleRemoveItem = async (id: string) => {
    try {
      await shoppingListService.removeShoppingItem(id);
      setShoppingList(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error removing shopping item:', err);
    }
  };

  const handleClearCompleted = async () => {
    try {
      await shoppingListService.clearCompleted(user!.id);
      setShoppingList(prev => prev.filter(item => !item.is_completed));
    } catch (err) {
      console.error('Error clearing completed items:', err);
    }
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
        <h2 className="text-2xl font-bold text-gray-900">Shopping List</h2>
        <button
          onClick={handleClearCompleted}
          className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          <Trash2 size={18} />
          <span>Clear Completed</span>
        </button>
      </div>

      {/* Items List */}
      {shoppingList.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your shopping list is empty</h3>
          <p className="text-gray-600">Start adding items from your meal plan!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {shoppingList.map(item => (
              <li
                key={item.id}
                className="flex items-center justify-between px-4 py-2 hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleToggleItem(item.id, item.is_completed)}
                    className="focus:outline-none"
                  >
                    {item.is_completed ? (
                      <CheckSquare className="text-green-600" />
                    ) : (
                      <Square className="text-gray-600" />
                    )}
                  </button>
                  <div
                    className={`text-sm ${item.is_completed ? 'line-through text-gray-400' : 'text-gray-900'}`}
                  >
                    {item.ingredient_name} {item.quantity ? `- ${item.quantity} ${item.unit || ''}` : ''}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

