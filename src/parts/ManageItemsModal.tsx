import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, Plus, X, Loader2, ArrowRight, ArrowLeft, Trash2 } from 'lucide-react';
import { pantryService, shoppingListService } from '../data/services';
import { useAuth } from '../context/AuthContext';
import type { PantryItem, ShoppingListItem } from '../data/models';

interface ManageItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManageItemsModal: React.FC<ManageItemsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [shoppingListItems, setShoppingListItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPantryItem, setNewPantryItem] = useState('');
  const [newShoppingItem, setNewShoppingItem] = useState('');
  const [addingToPantry, setAddingToPantry] = useState(false);
  const [addingToShopping, setAddingToShopping] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      if (!user || !isOpen) return;
      try {
        setLoading(true);
        const pantryData = await pantryService.getPantryItems(user.id);
        const shoppingData = await shoppingListService.getShoppingList(user.id);
        setPantryItems(pantryData);
        setShoppingListItems(shoppingData);
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleMoveToPantry = async (item: ShoppingListItem) => {
    try {
      const newPantryItem = await pantryService.addPantryItem(user!.id, item.ingredient_name, undefined, item.unit);
      await shoppingListService.removeShoppingItem(item.id);
      setShoppingListItems(prev => prev.filter(i => i.id !== item.id));
      setPantryItems(prev => [...prev, newPantryItem]);
    } catch (error) {
      console.error('Error moving item to pantry:', error);
    }
  };

  const handleMoveToShoppingList = async (item: PantryItem) => {
    try {
      const newShoppingItem = await shoppingListService.addShoppingItem(user!.id, item.ingredient_name, undefined, item.unit);
      await pantryService.removePantryItem(item.id);
      setPantryItems(prev => prev.filter(i => i.id !== item.id));
      setShoppingListItems(prev => [...prev, newShoppingItem]);
    } catch (error) {
      console.error('Error moving item to shopping list:', error);
    }
  };

  const handleAddToPantry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPantryItem.trim() || !user) return;
    
    setAddingToPantry(true);
    try {
      const newItem = await pantryService.addPantryItem(user.id, newPantryItem.trim());
      setPantryItems(prev => [...prev, newItem]);
      setNewPantryItem('');
    } catch (error) {
      console.error('Error adding item to pantry:', error);
    } finally {
      setAddingToPantry(false);
    }
  };

  const handleAddToShoppingList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShoppingItem.trim() || !user) return;
    
    setAddingToShopping(true);
    try {
      const newItem = await shoppingListService.addShoppingItem(user.id, newShoppingItem.trim());
      setShoppingListItems(prev => [...prev, newItem]);
      setNewShoppingItem('');
    } catch (error) {
      console.error('Error adding item to shopping list:', error);
    } finally {
      setAddingToShopping(false);
    }
  };

  const handleDeletePantryItem = async (id: string) => {
    try {
      await pantryService.removePantryItem(id);
      setPantryItems(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error deleting pantry item:', error);
    }
  };

  const handleDeleteShoppingItem = async (id: string) => {
    try {
      await shoppingListService.removeShoppingItem(id);
      setShoppingListItems(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error deleting shopping item:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Manage Items</h2>
              <p className="text-sm text-gray-600 mt-1">Add items manually or move them between your pantry and shopping list</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-orange-600" size={32} />
              <span className="ml-3 text-gray-600">Loading items...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {/* Pantry Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Package className="mr-2 text-green-600" size={20} />
                    Pantry
                  </h3>
                  <span className="text-sm text-gray-500">{pantryItems.length} items</span>
                </div>
                
                {/* Add New Pantry Item */}
                <form onSubmit={handleAddToPantry} className="flex">
                  <input
                    type="text"
                    value={newPantryItem}
                    onChange={(e) => setNewPantryItem(e.target.value)}
                    placeholder="Add new pantry item..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={addingToPantry || !newPantryItem.trim()}
                    className="bg-green-500 text-white px-4 py-2 rounded-r-lg transition-colors hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {addingToPantry ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                  </button>
                </form>
                
                {/* Pantry Items List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {pantryItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package size={48} className="mx-auto mb-3 opacity-30" />
                      <p>No pantry items yet</p>
                      <p className="text-sm">Add items you have at home</p>
                    </div>
                  ) : (
                    pantryItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-green-50 rounded-lg p-3 group">
                        <div className="flex items-center space-x-3">
                          <Package size={16} className="text-green-600" />
                          <span className="text-gray-900">{item.ingredient_name}</span>
                        </div>
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDeletePantryItem(item.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded"
                            title="Delete item"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => handleMoveToShoppingList(item)}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 px-2 py-1 rounded"
                            title="Move to shopping list"
                          >
                            <ArrowRight size={14} />
                            <ShoppingCart size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Shopping List Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <ShoppingCart className="mr-2 text-blue-600" size={20} />
                    Shopping List
                  </h3>
                  <span className="text-sm text-gray-500">{shoppingListItems.length} items</span>
                </div>
                
                {/* Add New Shopping List Item */}
                <form onSubmit={handleAddToShoppingList} className="flex">
                  <input
                    type="text"
                    value={newShoppingItem}
                    onChange={(e) => setNewShoppingItem(e.target.value)}
                    placeholder="Add new shopping item..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={addingToShopping || !newShoppingItem.trim()}
                    className="bg-blue-500 text-white px-4 py-2 rounded-r-lg transition-colors hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {addingToShopping ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                  </button>
                </form>
                
                {/* Shopping List Items */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {shoppingListItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
                      <p>No shopping items yet</p>
                      <p className="text-sm">Add items you need to buy</p>
                    </div>
                  ) : (
                    shoppingListItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-blue-50 rounded-lg p-3 group">
                        <div className="flex items-center space-x-3">
                          <ShoppingCart size={16} className="text-blue-600" />
                          <span className="text-gray-900">{item.ingredient_name}</span>
                        </div>
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDeleteShoppingItem(item.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded"
                            title="Delete item"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => handleMoveToPantry(item)}
                            className="flex items-center space-x-1 text-green-600 hover:text-green-800 px-2 py-1 rounded"
                            title="Move to pantry"
                          >
                            <ArrowLeft size={14} />
                            <Package size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-600 text-white py-2 px-6 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
