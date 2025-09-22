// src/app/api/stations/route.ts - CON CACHÉ COMPLETO
import { NextRequest, NextResponse } from 'next/server';
import { 
  getStations, 
  updateStation, 
  createStation, 
  deleteStation 
} from '@/lib/dataManager';

// GET - Obtener todas las estaciones
export async function GET(request: NextRequest) {
  try {
    // getStations ya implementa caché internamente
    const stations = await getStations();
    
    return NextResponse.json({ 
      success: true, 
      data: stations,
      // Metadata adicional para debugging
      _meta: {
        cached: true,
        count: stations.length,
        timestamp: new Date().toISOString()
      }
    }, {
      headers: {
        // Headers de caché para el navegador
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5 min caché, 10 min stale
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    });
  } catch (error) {
    console.error('Error al obtener estaciones:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener estaciones',
        _meta: {
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

// POST - Crear nueva estación
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Creando nueva estación:', body);
    
    // Validación básica
    if (!body.name || !body.url) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Nombre y URL son requeridos' 
        },
        { status: 400 }
      );
    }
    
    // createStation invalida los cachés automáticamente
    const station = await createStation(body);
    
    return NextResponse.json({ 
      success: true, 
      data: station,
      _meta: {
        action: 'created',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error al crear estación:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al crear estación' 
      },
      { status: 500 }
    );
  }
}

// PUT - Actualizar estación existente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Actualizando estación:', body);
    
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID de estación requerido' 
        },
        { status: 400 }
      );
    }
    
    // updateStation invalida los cachés automáticamente
    const station = await updateStation(id, updates);
    
    return NextResponse.json({ 
      success: true, 
      data: station,
      _meta: {
        action: 'updated',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error al actualizar estación:', error);
    
    // Manejo de errores específicos
    if (error instanceof Error && error.message === 'Estación no encontrada') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Estación no encontrada' 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al actualizar estación' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar estación
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    console.log('Eliminando estación:', id);
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID de estación requerido' 
        },
        { status: 400 }
      );
    }
    
    // deleteStation invalida los cachés automáticamente
    await deleteStation(id);
    
    return NextResponse.json({ 
      success: true,
      _meta: {
        action: 'deleted',
        deletedId: id,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error al eliminar estación:', error);
    
    // Manejo de errores específicos
    if (error instanceof Error && error.message === 'Estación no encontrada') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Estación no encontrada' 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al eliminar estación' 
      },
      { status: 500 }
    );
  }
}