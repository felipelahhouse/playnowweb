import React, { useState } from 'react';
import ModernSearchBar from './ModernSearchBar';
import ModernPlatformSelector from './ModernPlatformSelector';

interface ModernGameLibraryHeaderProps {
  onSearch?: (query: string) => void;
  onGenreChange?: (genre: string) => void;
  onSortChange?: (sort: string) => void;
  onPlatformChange?: (platform: string) => void;
}

const ModernGameLibraryHeader: React.FC<ModernGameLibraryHeaderProps> = ({
  onSearch = () => {},
  onGenreChange = () => {},
  onSortChange = () => {},
  onPlatformChange = () => {},
}) => {
  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      {/* Search Bar */}
      <ModernSearchBar
        onSearch={onSearch}
        onGenreChange={onGenreChange}
        onSortChange={onSortChange}
      />

      {/* Platform Selector */}
      <ModernPlatformSelector
        onPlatformChange={onPlatformChange}
      />
    </div>
  );
};

export default ModernGameLibraryHeader;
