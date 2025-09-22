// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import config from '@/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;
    
    // Verificar contraseña contra configuración centralizada
    const adminToken = config.adminToken;
    
    if (!adminToken) {
      console.error('ADMIN_TOKEN no está configurado en las variables de entorno');
      return NextResponse.json(
        { success: false, error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }
    
    if (password === adminToken) {
      const response = NextResponse.json({ success: true });
      
      // Establecer cookie segura
      response.cookies.set('admin-auth', adminToken, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: '/'
      });
      
      return response;
    }
    
    return NextResponse.json(
      { success: false, error: 'Contraseña incorrecta' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar solicitud' },
      { status: 500 }
    );
  }
}