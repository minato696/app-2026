// src/lib/imageUtils.ts

/**
 * Construye una URL de imagen redimensionada usando nuestro servicio local
 * @param imageUrl URL de la imagen (debe ser relativa, ej: /images/programs/imagen.jpg)
 * @param width Ancho deseado (por defecto 600)
 * @param quality Calidad JPEG (por defecto 85)
 * @returns URL del servicio de redimensionamiento
 */
export function getResizedImageUrl(imageUrl: string, width: number = 600, quality: number = 85): string {
  // Si ya es una URL del servicio de redimensionamiento, devolverla tal cual
  if (imageUrl.includes('/api/image-resizer')) {
    return imageUrl;
  }
  
  // Si es una URL absoluta, extraer solo la ruta
  let imagePath = imageUrl;
  if (imageUrl.startsWith('http')) {
    try {
      const url = new URL(imageUrl);
      imagePath = url.pathname;
    } catch (error) {
      console.error('Error parseando URL:', error);
      return imageUrl;
    }
  }
  
  // Codificar ruta en base64
  const encodedPath = Buffer.from(imagePath).toString('base64');
  
  // Construir URL del servicio
  return `/api/image-resizer?image=${encodedPath}&width=${width}&quality=${quality}`;
}

/**
 * Extrae la URL original de una URL del servicio de redimensionamiento
 * @param resizedUrl URL del servicio de redimensionamiento
 * @returns URL original o la misma URL si no es del servicio
 */
export function getOriginalImageUrl(resizedUrl: string): string {
  if (!resizedUrl.includes('/api/image-resizer')) {
    return resizedUrl;
  }
  
  try {
    const url = new URL(resizedUrl, 'http://localhost:3000'); // Base URL temporal para parsear
    const encodedImage = url.searchParams.get('image');
    if (encodedImage) {
      const decodedPath = Buffer.from(encodedImage, 'base64').toString('utf-8');
      return decodedPath;
    }
  } catch (error) {
    console.error('Error decodificando URL:', error);
  }
  
  return resizedUrl;
}

/**
 * Genera diferentes tamaños de imagen para uso responsivo
 * @param imageUrl URL de la imagen original
 * @returns Objeto con URLs para diferentes tamaños
 */
export function getResponsiveImageUrls(imageUrl: string) {
  return {
    thumbnail: getResizedImageUrl(imageUrl, 150, 80),
    small: getResizedImageUrl(imageUrl, 300, 85),
    medium: getResizedImageUrl(imageUrl, 600, 85),
    large: getResizedImageUrl(imageUrl, 1200, 90),
    original: getOriginalImageUrl(imageUrl)
  };
}