// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

// Lista de rutas API que queremos proteger
const protectedAPIRoutes = [
  '/api/stations',
  '/api/programs',
  '/api/current-program',
  '/api/upload',
  '/api/image-resizer',
  '/api/admin/cache-stats'
];

// Lista de rutas que requieren autenticación completa
const adminRoutes = [
  '/admin'
];

// Lista de dominios permitidos para embeber la aplicación en iframe
const allowedFrameAncestors = [
  'exitosanoticias.pe',
  'www.exitosanoticias.pe',
  'localhost',
  '185.236.232.32'
];

// Leer directamente de las variables de entorno
const getAllowedHosts = () => {
  const domainString = process.env.NEXT_PUBLIC_DOMAIN || 'localhost:9544';
  return domainString.split(',').map(domain => domain.trim());
};

// Lista de hosts permitidos
const allowedHosts = getAllowedHosts();

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();
  
  // Agregar cabeceras para permitir embeber en iframe desde dominios específicos
  const frameAncestorsValue = `'self' ${allowedFrameAncestors.map(domain => `https://${domain} http://${domain}`).join(' ')}`;
  
  // Establecer Content-Security-Policy para permitir ser embebido en iframes
  response.headers.set(
    'Content-Security-Policy',
    `frame-ancestors ${frameAncestorsValue};`
  );
  
  // Modificar X-Frame-Options para prevenir conflictos
  response.headers.set('X-Frame-Options', 'ALLOWALL');
  
  // Proteger rutas de administración
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    const authCookie = request.cookies.get('admin-auth');
    
    // Si no está autenticado, redirigir al login
    if (!authCookie || authCookie.value !== process.env.ADMIN_TOKEN) {
      // Si ya está en la página de login, permitir acceso
      if (pathname === '/admin/login') {
        return response;
      }
      
      // Redirigir a login
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // Proteger APIs - Solo permitir desde el mismo origen
  if (protectedAPIRoutes.some(route => pathname.startsWith(route))) {
    const referer = request.headers.get('referer');
    const host = request.headers.get('host');
    
    // Permitir acceso desde rutas autenticadas de admin
    if (referer && referer.includes('/admin')) {
      const authCookie = request.cookies.get('admin-auth');
      if (authCookie && authCookie.value === process.env.ADMIN_TOKEN) {
        return response;
      }
    }
    
    // Verificar que la petición viene del mismo origen o un host permitido
    if (referer) {
      const refererUrl = new URL(referer);
      const expectedHost = host || 'localhost:9544';
      
      if (allowedHosts.includes(refererUrl.host) || expectedHost.includes(refererUrl.host)) {
        return response;
      }
        
      if (!allowedHosts.includes(refererUrl.host) && !refererUrl.host.includes(expectedHost)) {
        return NextResponse.json(
          { error: 'Acceso no autorizado' },
          { status: 403 }
        );
      }
    }
    
    // Bloquear acceso directo desde el navegador
    const isAjax = request.headers.get('x-requested-with') === 'XMLHttpRequest' ||
                   request.headers.get('accept')?.includes('application/json');
    
    const isNextData = request.headers.get('x-nextjs-data');
    
    // Si no hay referer y no es AJAX ni Next.js interno, bloquear
    if (!referer && !isAjax && !isNextData) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Acceso Denegado</title>
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
            .error-container {
              text-align: center;
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #dc2626; }
            p { color: #6b7280; }
            a { 
              color: #dc2626; 
              text-decoration: none;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="error-container">
            <h1>403 - Acceso Denegado</h1>
            <p>No tienes permiso para acceder a este recurso directamente.</p>
            <p><a href="/">Volver al inicio</a></p>
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
  }
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
};