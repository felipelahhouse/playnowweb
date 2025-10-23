import React, { memo } from 'react';

interface OptimizedLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  text?: string;
}

const OptimizedLoader: React.FC<OptimizedLoaderProps> = memo(({ 
  size = 'md', 
  fullScreen = false,
  text 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4'
  };

  const loader = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div 
        className={`${sizeClasses[size]} border-cyan-500 border-t-transparent rounded-full animate-spin gpu-accelerated`}
        role="status"
        aria-label="Carregando"
      />
      {text && (
        <p className="text-cyan-400 text-sm font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        {loader}
      </div>
    );
  }

  return loader;
});

OptimizedLoader.displayName = 'OptimizedLoader';

export default OptimizedLoader;