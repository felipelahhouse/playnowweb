import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, X } from 'lucide-react';

interface ModernSearchBarProps {
  onSearch: (query: string) => void;
  onGenreChange: (genre: string) => void;
  onSortChange: (sort: string) => void;
}

const ModernSearchBar: React.FC<ModernSearchBarProps> = ({ onSearch, onGenreChange, onSortChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('All Genres');
  const [selectedSort, setSelectedSort] = useState('Most Popular');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch(value);
  };

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(genre);
    onGenreChange(genre);
  };

  const handleSortSelect = (sort: string) => {
    setSelectedSort(sort);
    onSortChange(sort);
  };

  const clearSearch = () => {
    setSearchQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="relative group">
        {/* Glow effect on focus */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur opacity-0 group-focus-within:opacity-30 transition duration-300" />
        
        <div className="relative bg-gray-900/80 backdrop-blur-xl border-2 border-gray-800 rounded-2xl overflow-hidden group-focus-within:border-cyan-500/50 transition-all duration-300">
          <div className="flex items-center gap-3 px-6 py-4">
            {/* Search Icon */}
            <Search className="w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
            
            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search for your favorite retro games..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg"
            />
            
            {/* Clear Button */}
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="p-1 hover:bg-gray-800 rounded-lg transition-colors group/clear"
              >
                <X className="w-5 h-5 text-gray-500 group-hover/clear:text-red-400 transition-colors" />
              </button>
            )}
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                showFilters
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {/* Search suggestions (animated) */}
          {searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-xl border-2 border-gray-800 rounded-xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <div className="p-2">
                <div className="text-xs text-gray-500 px-3 py-2">Quick Results</div>
                {/* This would be populated with actual search results */}
                <div className="text-sm text-gray-400 px-3 py-2 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
                  No results yet - keep typing...
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters Panel (collapsible) */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          showFilters ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Genre Filter */}
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-2 font-semibold">
              <Filter className="w-4 h-4 inline mr-2" />
              Genre
            </label>
            <select
              value={selectedGenre}
              onChange={(e) => handleGenreSelect(e.target.value)}
              className="w-full bg-gray-900 border-2 border-gray-800 rounded-xl px-4 py-3 text-white font-semibold focus:border-cyan-500 focus:outline-none transition-colors cursor-pointer"
            >
              <option>All Genres</option>
              <option>Action</option>
              <option>Adventure</option>
              <option>Fighting</option>
              <option>Platform</option>
              <option>RPG</option>
              <option>Racing</option>
              <option>Sports</option>
              <option>Puzzle</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-2 font-semibold">
              <SlidersHorizontal className="w-4 h-4 inline mr-2" />
              Sort By
            </label>
            <select
              value={selectedSort}
              onChange={(e) => handleSortSelect(e.target.value)}
              className="w-full bg-gray-900 border-2 border-gray-800 rounded-xl px-4 py-3 text-white font-semibold focus:border-purple-500 focus:outline-none transition-colors cursor-pointer"
            >
              <option>Most Popular</option>
              <option>Newest First</option>
              <option>A to Z</option>
              <option>Z to A</option>
              <option>Highest Rated</option>
              <option>Most Played</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernSearchBar;
