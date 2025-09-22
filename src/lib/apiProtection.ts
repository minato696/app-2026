// src/lib/apiProtection.ts
import { NextRequest } from 'next/server';

// Leer directamente de las variables de entorno
const getAllowedHosts = () => {
  const domainString = process.env.NEXT_PUBLIC_DOMAIN || 'localhost:9544';
  return domainString.split(',').map(domain => domain.trim());
};

// Lista de hosts permitidos
const allowedHosts = getAllowedHosts();

export function isValidApiRequest(request: NextRequest): boolean {
  // Obtener headers
  const referer = request.headers.get('referer');
  const userAgent = request.headers.get('user-agent');
  const xRequestedWith = request.headers.get('x-requested-with');
  const accept = request.headers.get('accept');
  const host = request.headers.get('host') || '';
  
  // Si estamos accediendo desde localhost o una IP conocida, permitir más flexibilidad
  const isLocalAccess = allowedHosts.includes(host);
  
  if (isLocalAccess && xRequestedWith) {
    // Para desarrollo local con IP, ser más permisivo con las peticiones AJAX
    return true;
  }
  
  // Rechazar si no hay user agent (probablemente un bot)
  if (!userAgent) {
    return false;
  }
  
  // Verificar si es una petición desde el navegador directamente
  const isBrowserDirectAccess = !referer && 
                                !xRequestedWith && 
                                userAgent.includes('Mozilla') &&
                                !accept?.includes('application/json');
  
  if (isBrowserDirectAccess) {
    return false;
  }
  
  // Si hay referer, verificar que sea de un origen permitido
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      
      // Verificar si el referer está en nuestra lista de hosts permitidos
      const refererHost = refererUrl.host;
      if (allowedHosts.includes(refererHost)) {
        return true;
      }
      
      // Comparar con el host de la solicitud
      if (refererHost !== host) {
        return false;
      }
    } catch {
      return false;
    }
  }
  
  // Verificar que sea una petición AJAX
  const isAjax = xRequestedWith === 'XMLHttpRequest' || 
                 (accept?.includes('application/json') ?? false);
  
  return isAjax;
}

export function createApiResponse(data: any, options?: ResponseInit) {
  return Response.json(data, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      // Agregar headers CORS para permitir acceso desde IP
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...options?.headers,
    }
  });
}