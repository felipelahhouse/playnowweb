import React, { ImgHTMLAttributes, useState, useEffect } from 'react';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
}

/**
 * Componente otimizado para lazy loading de imagens
 * Usa Intersection Observer API para carregar apenas quando visível
 */
export const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  fallback = '/placeholder-game.png',
  className,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState<string>(src); // ✅ CORREÇÃO: Começa com a imagem real
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!imageRef || hasError || !src) return;

    // Se a imagem já está definida como src, apenas observar
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Forçar reload quando entrar na viewport
            const img = entry.target as HTMLImageElement;
            if (img.src !== src) {
              setImageSrc(src);
            }
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '100px', // Começa a carregar 100px antes
        threshold: 0.01,
      }
    );

    observer.observe(imageRef);

    return () => {
      if (imageRef) {
        observer.unobserve(imageRef);
      }
    };
  }, [imageRef, src, hasError]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setImageSrc(fallback);
  };

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy" // Fallback nativo do browser
      {...props}
    />
  );
};

export default LazyImage;
