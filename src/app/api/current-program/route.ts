// src/app/api/current-program/route.ts - CON CACHÉ Y HEADERS OPTIMIZADOS
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProgram } from '@/lib/dataManager';
import { apiRateLimiter } from '@/lib/rateLimiter';
import { isValidApiRequest, createApiResponse } from '@/lib/apiProtection';

export async function GET(request: NextRequest) {
  try {
    // Verificar si es una petición válida
    if (!isValidApiRequest(request)) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>403 - Acceso Denegado</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f3f4f6;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #dc2626; margin-bottom: 1rem; }
            p { color: #6b7280; margin-bottom: 1.5rem; }
            a { 
              display: inline-block;
              padding: 0.5rem 1.5rem;
              background: #dc2626;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              transition: background 0.2s;
            }
            a:hover { background: #b91c1c; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>403 - Acceso Denegado</h1>
            <p>Esta API no puede ser accedida directamente desde el navegador.</p>
            <p>Por favor, use la aplicación para acceder a este contenido.</p>
            <a href="/">Ir a la Radio</a>
          </div>
        </body>
        </html>
        `,
        {
          status: 403,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          }
        }
      );
    }
    
    // Verificar rate limit
    if (apiRateLimiter.isRateLimited(request)) {
      return createApiResponse(
        { 
          success: false, 
          error: 'Demasiadas solicitudes',
          _meta: {
            retryAfter: 60,
            timestamp: new Date().toISOString()
          }
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': apiRateLimiter.getRemainingRequests(request).toString(),
            'Retry-After': '60'
          }
        }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const stationId = searchParams.get('stationId');
    
    if (!stationId) {
      return createApiResponse(
        { 
          success: false, 
          error: 'Station ID requerido',
          _meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    // getCurrentProgram ya implementa caché internamente
    const program = await getCurrentProgram(stationId);
    
    // Generar ETag basado en el programa actual
    const etag = program 
      ? `"${program.id}-${program.start_time}-${new Date().getHours()}"` 
      : `"empty-${stationId}-${new Date().getHours()}"`;
    
    // Verificar If-None-Match header para respuestas 304
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { 
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60'
        }
      });
    }
    
    return createApiResponse(
      { 
        success: true, 
        data: program,
        _meta: {
          cached: true,
          stationId,
          timestamp: new Date().toISOString(),
          peruTime: (() => {
            const now = new Date();
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const peruTime = new Date(utc + (3600000 * -5));
            return peruTime.toISOString();
          })()
        }
      },
      {
        headers: {
          // Caché del navegador: 30 segundos con revalidación
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
          // ETag para validación condicional
          'ETag': etag,
          // Indicar que el contenido puede variar según estos headers
          'Vary': 'X-Requested-With, Accept, If-None-Match',
          // Headers de seguridad adicionales
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          // Header personalizado para debugging
          'X-Program-Found': program ? 'true' : 'false'
        }
      }
    );
  } catch (error) {
    console.error('Error al obtener programa actual:', error);
    
    return createApiResponse(
      { 
        success: false, 
        error: 'Error al obtener programa actual',
        _meta: {
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

// OPTIONS - Para manejar preflight CORS requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With, Accept',
      'Access-Control-Max-Age': '86400', // 24 horas
    }
  });
}