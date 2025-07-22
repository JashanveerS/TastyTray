import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import type { SearchOptions } from '../data/models';

interface Props {
  onSearch: (options: SearchOptions) => void;
  isLoading?: boolean;
}

export default function SearchBar({ onSearch, isLoading }: Props) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchOptions>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ ...filters, query: query.trim() || undefined });
  };

  const cuisineOptions = [
    'Italian', 'Mexican', 'Asian', 'American', 'Mediterranean', 'Indian', 'Thai', 'French'
  ];

  const dietOptions = [
    'vegetarian', 'vegan', 'gluten-free', 'keto', 'paleo', 'dairy-free', 'low-carb'
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for recipes..."
              className="input pl-10 pr-4"
            />
          </div>
          
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`btn btn-outline px-3 ${showFilters ? 'bg-gray-100' : ''}`}
          >
            <Filter size={20} />
          </button>
          
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary px-6"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {showFilters && (
        <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Cuisine</label>
              <select
                value={filters.cuisine?.[0] || ''}
                onChange={(e) => setFilters({
                  ...filters,
                  cuisine: e.target.value ? [e.target.value] : undefined
                })}
                className="input"
              >
                <option value="">Any cuisine</option>
                {cuisineOptions.map(cuisine => (
                  <option key={cuisine} value={cuisine.toLowerCase()}>
                    {cuisine}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Diet</label>
              <select
                value={filters.diet?.[0] || ''}
                onChange={(e) => setFilters({
                  ...filters,
                  diet: e.target.value ? [e.target.value] : undefined
                })}
                className="input"
              >
                <option value="">Any diet</option>
                {dietOptions.map(diet => (
                  <option key={diet} value={diet}>
                    {diet}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max cooking time</label>
              <select
                value={filters.maxTime || ''}
                onChange={(e) => setFilters({
                  ...filters,
                  maxTime: e.target.value ? parseInt(e.target.value) : undefined
                })}
                className="input"
              >
                <option value="">Any time</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Include ingredients (comma separated)</label>
            <input
              type="text"
              placeholder="chicken, rice, tomatoes"
              onChange={(e) => setFilters({
                ...filters,
                ingredients: e.target.value ? e.target.value.split(',').map(i => i.trim()) : undefined
              })}
              className="input"
            />
          </div>
        </div>
      )}
    </div>
  );
}
