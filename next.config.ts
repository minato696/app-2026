import type { NextConfig } from "next";

// Extraer los dominios directamente de las variables de entorno
const getImageDomains = () => {
  const domainString = process.env.NEXT_PUBLIC_DOMAIN || 'localhost:9544';
  return domainString.split(',').map(domain => {
    // Extraer solo el nombre de dominio sin el puerto
    return domain.trim().split(':')[0];
  });
};

const nextConfig: NextConfig = {
  /* config options here */
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  
  // Configuración de imágenes
  images: {
    domains: getImageDomains(),
  },
  
  // Permitir orígenes de desarrollo para corregir el warning
  allowedDevOrigins: [
    'http://localhost:9544', 
    'http://185.236.232.32:9544'
  ],
  
  // Configurar headers HTTP para permitir el uso en iframes
  async headers() {
    return [
      {
        // Aplicar cabeceras a todas las rutas
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://exitosanoticias.pe https://www.exitosanoticias.pe http://localhost:* http://185.236.232.32:*;",
          },
          // Modificar X-Frame-Options para permitir iframe
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
        ],
      },
    ];
  },
  
  // Configura el dominio público para que sea accesible correctamente
  publicRuntimeConfig: {
    basePath: '',
  },
};

export default nextConfig;