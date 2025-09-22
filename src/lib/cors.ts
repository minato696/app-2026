// src/lib/cors.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest, NextResponse } from 'next/server';

// Lista de dominios permitidos para CORS
const allowedOrigins = [
  'https://exitosanoticias.pe',
  'https://www.exitosanoticias.pe',
  'http://localhost:3000',
  'http://localhost:9544',
  'http://185.236.232.32:9544'
];

// Función para las API Routes basadas en NextApiRequest/NextApiResponse
export function setCorsHeaders(req: NextApiRequest, res: NextApiResponse) {
  // Verificar el origin
  const origin = req.headers.origin;
  
  // Si el origen está en la lista de permitidos o es un entorno de desarrollo
  if (origin && (allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.includes('192.168.10.230'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Para cualquier otro origen, usar el dominio principal
    res.setHeader('Access-Control-Allow-Origin', 'https://player.radioexitosa.pe');
  }
  
  // Permitir credenciales
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Métodos permitidos
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  
  // Cabeceras permitidas
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  // Cabeceras expuestas al cliente
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length');
  
  // Para permitir el uso en iframes
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://exitosanoticias.pe https://www.exitosanoticias.pe;");
  
  // Eliminar X-Frame-Options para evitar conflictos
  res.removeHeader('X-Frame-Options');
}

// Función para App Router (Route Handlers)
export function setCorsHeadersAppRouter(req: NextRequest): NextResponse {
  const res = NextResponse.next();
  
  // Verificar el origin
  const origin = req.headers.get('origin');
  
  // Si el origen está en la lista de permitidos o es un entorno de desarrollo
  if (origin && (allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.includes('192.168.10.230'))) {
    res.headers.set('Access-Control-Allow-Origin', origin);
  } else {
    // Para cualquier otro origen, usar el dominio principal
    res.headers.set('Access-Control-Allow-Origin', 'https://player.radioexitosa.pe');
  }
  
  // Permitir credenciales
  res.headers.set('Access-Control-Allow-Credentials', 'true');
  
  // Métodos permitidos
  res.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  
  // Cabeceras permitidas
  res.headers.set(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  // Cabeceras expuestas al cliente
  res.headers.set('Access-Control-Expose-Headers', 'Content-Length');
  
  // Para permitir el uso en iframes
  res.headers.set('Content-Security-Policy', "frame-ancestors 'self' https://exitosanoticias.pe https://www.exitosanoticias.pe;");
  
  // Eliminar X-Frame-Options para evitar conflictos
  res.headers.delete('X-Frame-Options');
  
  return res;
}

// Middleware para CORS
export function corsMiddleware(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Establecer cabeceras CORS
    setCorsHeaders(req, res);
    
    // Si es una solicitud OPTIONS (preflight), responder con 200
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    // Continuar con el handler
    return await handler(req, res);
  };
}