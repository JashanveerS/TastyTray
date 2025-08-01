import React, { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Edit3, AlertTriangle, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { pantryService } from '../data/services';
import type { PantryItem } from '../data/models';

export const Pantry: React.FC = () => {
  const { user } = useAuth();
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [formData, setFormData] = useState({
    ingredient_name: '',
    quantity: '',
    unit: '',
    expiry_date: ''
  });

  useEffect(() => {
    if (user) {
      loadPantryItems();
    }
  }, [user]);

  const loadPantryItems = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await pantryService.getPantryItems(user.id);
      setPantryItems(data);
    } catch (err) {
      console.error('Error loading pantry items:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = pantryItems.filter(item =>
    item.ingredient_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);
    
    return expiry <= threeDaysFromNow && expiry >= today;
  };

  const isExpired = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  const handleAddItem = async () => {
    if (!user || !formData.ingredient_name.trim()) return;

    try {
      const newItem = await pantryService.addPantryItem(
        user.id,
        formData.ingredient_name.trim(),
        formData.quantity ? parseFloat(formData.quantity) : undefined,
        formData.unit || undefined,
        formData.expiry_date || undefined
      );
      setPantryItems(prev => [...prev, newItem]);
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error('Error adding pantry item:', err);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    try {
      const updatedItem = await pantryService.updatePantryItem(
        editingItem.id,
        formData.quantity ? parseFloat(formData.quantity) : undefined,
        formData.unit || undefined,
        formData.expiry_date || undefined
      );
      setPantryItems(prev => prev.map(item => 
        item.id === editingItem.id ? updatedItem : item
      ));
      setEditingItem(null);
      resetForm();
    } catch (err) {
      console.error('Error updating pantry item:', err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await pantryService.removePantryItem(itemId);
      setPantryItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      console.error('Error deleting pantry item:', err);
    }
  };

  const openEditModal = (item: PantryItem) => {
    setEditingItem(item);
    setFormData({
      ingredient_name: item.ingredient_name,
      quantity: item.quantity?.toString() || '',
      unit: item.unit || '',
      expiry_date: item.expiry_date || ''
    });
  };

  const resetForm = () => {
    setFormData({
      ingredient_name: '',
      quantity: '',
      unit: '',
      expiry_date: ''
    });
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingItem(null);
    resetForm();
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
        <h2 className="text-2xl font-bold text-gray-900">My Pantry</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus size={18} />
          <span>Add Item</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search pantry items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{pantryItems.length}</div>
          <div className="text-gray-600">Total Items</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-yellow-600">
            {pantryItems.filter(item => item.expiry_date && isExpiringSoon(item.expiry_date)).length}
          </div>
          <div className="text-gray-600">Expiring Soon</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-red-600">
            {pantryItems.filter(item => item.expiry_date && isExpired(item.expiry_date)).length}
          </div>
          <div className="text-gray-600">Expired</div>
        </div>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No items found' : 'Your pantry is empty'}
          </h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search term' : 'Start adding ingredients to track your pantry!'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 gap-0">
            {filteredItems.map((item) => {
              const hasExpiry = item.expiry_date;
              const expiring = hasExpiry && isExpiringSoon(item.expiry_date!);
              const expired = hasExpiry && isExpired(item.expiry_date!);

              return (
                <div
                  key={item.id}
                  className={`p-4 border-b border-gray-200 hover:bg-gray-50 ${
                    expired ? 'bg-red-50' : expiring ? 'bg-yellow-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900 capitalize">
                          {item.ingredient_name}
                        </h3>
                        {expired && (
                          <div className="flex items-center space-x-1 text-red-600 text-xs">
                            <AlertTriangle size={14} />
                            <span>Expired</span>
                          </div>
                        )}
                        {expiring && !expired && (
                          <div className="flex items-center space-x-1 text-yellow-600 text-xs">
                            <AlertTriangle size={14} />
                            <span>Expires Soon</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-1 text-sm text-gray-600">
                        {item.quantity && item.unit && (
                          <span className="mr-4">
                            Quantity: {item.quantity} {item.unit}
                          </span>
                        )}
                        {item.expiry_date && (
                          <span>
                            Expires: {new Date(item.expiry_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="text-gray-400 hover:text-orange-600"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingItem) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem ? 'Edit Item' : 'Add Pantry Item'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingredient Name *
                </label>
                <input
                  type="text"
                  value={formData.ingredient_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, ingredient_name: e.target.value }))}
                  disabled={!!editingItem}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50"
                  placeholder="e.g., Tomatoes"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    placeholder="2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    placeholder="lbs"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={editingItem ? handleUpdateItem : handleAddItem}
                disabled={!formData.ingredient_name.trim()}
                className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingItem ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
