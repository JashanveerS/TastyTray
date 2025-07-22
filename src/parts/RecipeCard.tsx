import { Clock, Users, Star } from 'lucide-react';
import type { Recipe } from '../data/models';

interface Props {
  recipe: Recipe;
  onClick?: () => void;
}

export default function RecipeCard({ recipe, onClick }: Props) {
  return (
    <div 
      className="card hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-48 mb-4 overflow-hidden rounded-lg">
        <img
          src={recipe.image}
          alt={recipe.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
          {recipe.difficulty}
        </div>
      </div>
      
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
  );
}
