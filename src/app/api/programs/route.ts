// src/app/api/programs/route.ts - CON CACHÉ COMPLETO
import { NextRequest, NextResponse } from 'next/server';
import { 
  getPrograms, 
  getProgramsByStation,
  createProgram,
  updateProgram,
  deleteProgram 
} from '@/lib/dataManager';

// GET - Obtener programas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stationId = searchParams.get('stationId');
    
    // Ambas funciones ya implementan caché internamente
    const programs = stationId 
      ? await getProgramsByStation(stationId)
      : await getPrograms();
    
    console.log(`Programas encontrados: ${programs.length}${stationId ? ` para estación ${stationId}` : ''}`);
      
    return NextResponse.json({ 
      success: true, 
      data: programs,
      _meta: {
        cached: true,
        count: programs.length,
        stationId: stationId || 'all',
        timestamp: new Date().toISOString()
      }
    }, {
      headers: {
        // Headers de caché para el navegador
        'Cache-Control': 'public, max-age=180, stale-while-revalidate=360', // 3 min caché, 6 min stale
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    });
  } catch (error) {
    console.error('Error al obtener programas:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener programas',
        _meta: {
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo programa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Creando nuevo programa:', body);
    
    // Validación básica
    const requiredFields = ['station_id', 'name', 'host', 'start_time', 'end_time', 'days'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Campos requeridos faltantes: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      );
    }
    
    // Validar formato de hora
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(body.start_time) || !timeRegex.test(body.end_time)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Formato de hora inválido. Use HH:MM' 
        },
        { status: 400 }
      );
    }
    
    // Validar días
    const validDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const invalidDays = body.days.filter((day: string) => !validDays.includes(day));
    
    if (invalidDays.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Días inválidos: ${invalidDays.join(', ')}` 
        },
        { status: 400 }
      );
    }
    
    // createProgram invalida los cachés automáticamente
    const program = await createProgram(body);
    
    return NextResponse.json({ 
      success: true, 
      data: program,
      _meta: {
        action: 'created',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error al crear programa:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al crear programa' 
      },
      { status: 500 }
    );
  }
}

// PUT - Actualizar programa existente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Actualizando programa:', body);
    
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID de programa requerido' 
        },
        { status: 400 }
      );
    }
    
    // Validar campos si se están actualizando
    if (updates.start_time || updates.end_time) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      if (updates.start_time && !timeRegex.test(updates.start_time)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Formato de hora de inicio inválido. Use HH:MM' 
          },
          { status: 400 }
        );
      }
      
      if (updates.end_time && !timeRegex.test(updates.end_time)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Formato de hora de fin inválido. Use HH:MM' 
          },
          { status: 400 }
        );
      }
    }
    
    if (updates.days) {
      const validDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      const invalidDays = updates.days.filter((day: string) => !validDays.includes(day));
      
      if (invalidDays.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Días inválidos: ${invalidDays.join(', ')}` 
          },
          { status: 400 }
        );
      }
    }
    
    // updateProgram invalida los cachés automáticamente
    const program = await updateProgram(id, updates);
    
    return NextResponse.json({ 
      success: true, 
      data: program,
      _meta: {
        action: 'updated',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error al actualizar programa:', error);
    
    // Manejo de errores específicos
    if (error instanceof Error && error.message === 'Programa no encontrado') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Programa no encontrado' 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al actualizar programa' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar programa
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    console.log('Eliminando programa:', id);
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID de programa requerido' 
        },
        { status: 400 }
      );
    }
    
    // deleteProgram invalida los cachés automáticamente
    await deleteProgram(id);
    
    return NextResponse.json({ 
      success: true,
      _meta: {
        action: 'deleted',
        deletedId: id,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error al eliminar programa:', error);
    
    // Manejo de errores específicos
    if (error instanceof Error && error.message === 'Programa no encontrado') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Programa no encontrado' 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al eliminar programa' 
      },
      { status: 500 }
    );
  }
}