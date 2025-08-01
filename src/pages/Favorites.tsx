import React, { useState, useEffect } from 'react';
import { Heart, Trash2, Calendar, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { favoritesService } from '../data/services';
import type { Favorite } from '../data/models';

interface FavoritesProps {
  onAddToMealPlan?: (recipeId: string, recipeTitle: string, recipeImage?: string) => void;
}

export const Favorites: React.FC<FavoritesProps> = ({ onAddToMealPlan }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await favoritesService.getFavorites(user.id);
      setFavorites(data);
    } catch (err) {
      setError('Failed to load favorites');
      console.error('Error loading favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (recipeId: string) => {
    if (!user) return;

    try {
      await favoritesService.removeFavorite(user.id, recipeId);
      setFavorites(prev => prev.filter(fav => fav.recipe_id !== recipeId));
    } catch (err) {
      console.error('Error removing favorite:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={loadFavorites}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
        <p className="text-gray-600">Start exploring recipes and add them to your favorites!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Favorites</h2>
        <div className="text-sm text-gray-600">
          {favorites.length} recipe{favorites.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map((favorite) => (
          <div
            key={favorite.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {favorite.recipe_image && (
              <div className="aspect-video bg-gray-200">
                <img
                  src={favorite.recipe_image}
                  alt={favorite.recipe_title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-4">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                {favorite.recipe_title}
              </h3>
              
              <div className="flex items-center text-sm text-gray-600 mb-3">
                <Star className="h-4 w-4 mr-1" />
                <span>Added {new Date(favorite.created_at).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  {onAddToMealPlan && (
                    <button
                      onClick={() => onAddToMealPlan(
                        favorite.recipe_id,
                        favorite.recipe_title,
                        favorite.recipe_image || undefined
                      )}
                      className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                    >
                      <Calendar size={14} />
                      <span>Plan</span>
                    </button>
                  )}
                </div>
                
                <button
                  onClick={() => handleRemoveFavorite(favorite.recipe_id)}
                  className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                >
                  <Trash2 size={14} />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
