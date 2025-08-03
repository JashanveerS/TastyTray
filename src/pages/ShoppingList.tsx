import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, CheckSquare, Square, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { shoppingListService } from '../data/services';
import type { ShoppingListItem } from '../data/models';

export const ShoppingList: React.FC = () => {
  const { user } = useAuth();
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [adding, setAdding] = useState(false);

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

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newItemName.trim()) return;

    try {
      setAdding(true);
      const quantity = newItemQuantity ? parseFloat(newItemQuantity) : undefined;
      const unit = newItemUnit.trim() || undefined;
      
      const newItem = await shoppingListService.addShoppingItem(
        user.id,
        newItemName.trim(),
        quantity,
        unit
      );
      
      setShoppingList(prev => [...prev, newItem]);
      
      // Reset form
      setNewItemName('');
      setNewItemQuantity('');
      setNewItemUnit('');
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding shopping item:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleCancelAdd = () => {
    setNewItemName('');
    setNewItemQuantity('');
    setNewItemUnit('');
    setShowAddForm(false);
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
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus size={18} />
            <span>Add Item</span>
          </button>
          <button
            onClick={handleClearCompleted}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 size={18} />
            <span>Clear Completed</span>
          </button>
        </div>
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Item</h3>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  id="itemName"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g., Milk, Bread, Apples"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label htmlFor="itemQuantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  id="itemQuantity"
                  value={newItemQuantity}
                  onChange={(e) => setNewItemQuantity(e.target.value)}
                  placeholder="e.g., 2"
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label htmlFor="itemUnit" className="block text-sm font-medium text-gray-700 mb-2">
                  Unit
                </label>
                <input
                  type="text"
                  id="itemUnit"
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  placeholder="e.g., lbs, cups, pieces"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancelAdd}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adding || !newItemName.trim()}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {adding && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                <span>{adding ? 'Adding...' : 'Add Item'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items List */}
      {shoppingList.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your shopping list is empty</h3>
          <p className="text-gray-600 mb-4">Add items manually or generate from your meal plan!</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus size={18} />
            <span>Add Your First Item</span>
          </button>
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

