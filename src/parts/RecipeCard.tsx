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
      className="card-hover"
      onClick={onClick}
    >
      <div className="card-image">
        <img
          src={recipe.image}
          alt={recipe.name}
          className="card-image-full"
        />
        <div className="difficulty-badge">
          {recipe.difficulty}
        </div>
        <div className="overlay-badge">
          <button 
            onClick={handleFavoriteToggle} 
            disabled={favoriteLoading} 
            className={`btn-icon ${isFavorite ? 'bg-red-500 text-white' : 'btn-icon-ghost'} ${favoriteLoading ? 'btn-disabled' : ''}`}
          >
            <Heart size={16} className={isFavorite ? 'heart-filled' : ''} />
          </button>
          {onAddToMealPlan && (
            <button
              onClick={handleMealPlanClick}
              className="btn-icon-ghost"
            >
              <Calendar size={16} />
            </button>
          )}
        </div>
      </div>
      
      <div className="card-content">
        <h3 className="title mb-2 line-clamp-2">{recipe.name}</h3>
        
        <p className="subtitle text-small mb-3 line-clamp-2">
          {recipe.description}
        </p>
        
        <div className="recipe-stats">
          <div className="recipe-stat">
            <Clock size={16} />
            <span>{recipe.cookTime}min</span>
          </div>
          
          <div className="recipe-stat">
            <Users size={16} />
            <span>{recipe.servings}</span>
          </div>
          
          {recipe.rating && (
            <div className="recipe-stat">
              <Star size={16} className="icon-star-filled" />
              <span>{recipe.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        
        <div className="recipe-tags">
          {recipe.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="badge-default">
              {tag}
            </span>
          ))}
        </div>
        
        <div className="recipe-nutrition">
          <span className="nutrition-highlight">{recipe.nutrition.calories}</span> cal
          <span className="divider">•</span>
          <span>{recipe.nutrition.protein}g protein</span>
        </div>
      </div>
    </div>
  );
}
