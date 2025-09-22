// src/app/api/admin/cache-stats/route.ts - VERSIÓN SIMPLIFICADA
import { NextRequest, NextResponse } from 'next/server';

// Simulación de estadísticas para prueba
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const authCookie = request.cookies.get('admin-auth');
    if (!authCookie || authCookie.value !== process.env.ADMIN_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Datos de prueba para verificar que el endpoint funciona
    const mockStats = {
      success: true,
      data: {
        global: {
          totalHits: 150,
          totalMisses: 50,
          totalSets: 100,
          totalDeletes: 10,
          hitRate: '75.00%'
        },
        byCache: {
          stations: {
            hits: 50,
            misses: 10,
            sets: 30,
            deletes: 2,
            hitRate: 83.33
          },
          programs: {
            hits: 40,
            misses: 20,
            sets: 35,
            deletes: 3,
            hitRate: 66.67
          },
          currentProgram: {
            hits: 45,
            misses: 15,
            sets: 25,
            deletes: 4,
            hitRate: 75.00
          },
          images: {
            hits: 15,
            misses: 5,
            sets: 10,
            deletes: 1,
            hitRate: 75.00
          }
        },
        memory: {
          stations: {
            keys: 1,
            size: 2048
          },
          programs: {
            keys: 4,
            size: 8192
          },
          currentProgram: {
            keys: 4,
            size: 1024
          },
          images: {
            keys: 10,
            size: 4096
          }
        },
        timestamp: new Date().toISOString()
      }
    };
    
    return NextResponse.json(mockStats);
  } catch (error) {
    console.error('Error obteniendo estadísticas de caché:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}

// DELETE - Limpiar cachés (simulado)
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const authCookie = request.cookies.get('admin-auth');
    if (!authCookie || authCookie.value !== process.env.ADMIN_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const cacheName = searchParams.get('cache');
    
    // Simular limpieza de caché
    console.log(`Simulando limpieza de caché: ${cacheName || 'todos'}`);
    
    return NextResponse.json({
      success: true,
      message: cacheName 
        ? `Caché ${cacheName} limpiado exitosamente (simulado)`
        : 'Todos los cachés han sido limpiados (simulado)'
    });
  } catch (error) {
    console.error('Error limpiando caché:', error);
    return NextResponse.json(
      { success: false, error: 'Error al limpiar caché' },
      { status: 500 }
    );
  }
}