// src/components/OptimizedImage.tsx
'use client';

import React, { useState } from 'react';
import { getResizedImageUrl } from '@/lib/imageUtils';
import config from '@/config';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  quality?: number;
  fallback?: React.ReactNode;
}

export default function OptimizedImage({
  src,
  alt,
  width = 600,
  height,
  className = '',
  quality = 85,
  fallback
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Si no hay src o hubo error, mostrar fallback
  if (!src || hasError) {
    return <>{fallback || <div className={`bg-gray-200 ${className}`} />}</>;
  }
  
  // Asegurar que src tenga la ruta completa cuando se accede desde IP
  let fullSrc = src;
  
  // Si estamos en el cliente
  if (typeof window !== 'undefined') {
    const currentHost = window.location.host;
    
    // Verificar si estamos accediendo desde un dominio permitido
    const isAllowedHost = config.allowedDomains.some(domain => 
      currentHost.includes(domain) || currentHost.includes(domain.split(':')[0])
    );
    
    // Si es un dominio permitido y la imagen no es una URL completa o absoluta
    if (isAllowedHost && !src.startsWith('http') && !src.startsWith('/')) {
      fullSrc = `/${src}`;
    }
  }
  
  // Construir URL optimizada
  const optimizedSrc = fullSrc.includes('/api/image-resizer') 
    ? fullSrc 
    : getResizedImageUrl(fullSrc, width, quality);
  
  return (
    <>
      {isLoading && fallback}
      <img
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          console.error('Error loading image:', optimizedSrc);
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </>
  );
}