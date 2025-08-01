import React, { useState, useEffect } from 'react';
import { Clock, Users, Star, Heart, Calendar } from 'lucide-react';
import type { Recipe } from '../data/models';
import { useAuth } from '../context/AuthContext';
import { favoritesService } from '../data/services';

interface Props {
  recipe: Recipe;
  onClick?: () => void;
  onAddToMealPlan?: () => void;
}

export default function RecipeCard({ recipe, onClick, onAddToMealPlan }: Props) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkIfFavorite();
    }
  }, [user, recipe.id]);

  const checkIfFavorite = async () => {
    if (!user) return;
    try {
      const favorite = await favoritesService.isFavorite(user.id, recipe.id);
      setIsFavorite(favorite);
    } catch (err) {
      console.error('Error checking favorite status:', err);
    }
  };

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || favoriteLoading) return;

    try {
      setFavoriteLoading(true);
      if (isFavorite) {
        await favoritesService.removeFavorite(user.id, recipe.id);
        setIsFavorite(false);
      } else {
        await favoritesService.addFavorite(user.id, recipe.id, recipe.name, recipe.image);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleMealPlanClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToMealPlan) {
      onAddToMealPlan();
    }
  };
  return (
    <div 
      className="card hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden rounded-t-lg">
        <img
          src={recipe.image}
          alt={recipe.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
          {recipe.difficulty}
        </div>
        <div className="absolute top-2 left-2 flex space-x-2">
          <button onClick={handleFavoriteToggle} disabled={favoriteLoading} className={`p-2 rounded-full transition-colors ${ isFavorite 
                ? 'bg-red-500 text-white' 
                : 'bg-white bg-opacity-80 text-gray-600 hover:bg-opacity-100'} 
                ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  
            <Heart size={16} className={isFavorite ? 'fill-current' : ''} />
          </button>
          {onAddToMealPlan && (
            <button
              onClick={handleMealPlanClick}
              className="p-2 rounded-full bg-white bg-opacity-80 text-gray-600 hover:bg-opacity-100 transition-colors"
            >
              <Calendar size={16} />
            </button>
          )}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{recipe.name}</h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {recipe.description}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Clock size={16} />
            <span>{recipe.cookTime}min</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Users size={16} />
            <span>{recipe.servings}</span>
          </div>
          
          {recipe.rating && (
            <div className="flex items-center gap-1">
              <Star size={16} className="text-yellow-400 fill-current" />
              <span>{recipe.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {recipe.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
        
        <div className="text-sm text-gray-500">
          <span className="font-medium text-orange-600">{recipe.nutrition.calories}</span> cal
          <span className="mx-2">•</span>
          <span>{recipe.nutrition.protein}g protein</span>
        </div>
      </div>
    </div>
  );
}
