// src/config/index.ts
// Configuración centralizada para la aplicación

// Obtener dominios permitidos del .env
const getDomains = () => {
  if (typeof process === 'undefined' || !process.env) {
    return ['localhost:9544']; // Valor por defecto si no hay process.env
  }
  const domainString = process.env.NEXT_PUBLIC_DOMAIN || 'localhost:9544';
  return domainString.split(',').map(domain => domain.trim());
};

// Configuración de la aplicación
const config = {
  // Puerto de la aplicación
  port: typeof process !== 'undefined' && process.env ? (process.env.PORT || '9544') : '9544',
  
  // Dominios permitidos (para CORS, imágenes, etc.)
  allowedDomains: getDomains(),
  
  // Dominio principal (primero de la lista)
  mainDomain: getDomains()[0],
  
  // Token de administrador
  adminToken: typeof process !== 'undefined' && process.env ? (process.env.ADMIN_TOKEN || '') : '',
  
  // Configuración de imágenes
  images: {
    quality: typeof process !== 'undefined' && process.env ? parseInt(process.env.IMAGE_QUALITY || '85', 10) : 85,
    maxSize: typeof process !== 'undefined' && process.env ? parseInt(process.env.MAX_IMAGE_SIZE || '5', 10) : 5, // MB
  },
  
  // URL base de la API
  apiUrl: typeof process !== 'undefined' && process.env ? (process.env.NEXT_PUBLIC_API_URL || '') : '',
  
  // Entorno de ejecución
  isProduction: typeof process !== 'undefined' && process.env ? process.env.NODE_ENV === 'production' : false,
  isDevelopment: typeof process !== 'undefined' && process.env ? process.env.NODE_ENV === 'development' : true,
};

export default config;