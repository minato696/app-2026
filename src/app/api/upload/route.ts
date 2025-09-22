// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'program';
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }
    
    // Crear directorio si no existe
    const uploadDir = path.join(process.cwd(), 'public', 'images', type === 'station' ? 'stations' : 'programs');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    // Generar nombre único con extensión .jpg
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    const filePath = path.join(uploadDir, fileName);
    
    // Guardar archivo original
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);
    
    // Construir URL pública
    const publicUrl = `/images/${type === 'station' ? 'stations' : 'programs'}/${fileName}`;
    
    // Para estaciones, devolver URL directa
    if (type === 'station') {
      return NextResponse.json({
        success: true,
        data: { url: publicUrl }
      });
    }
    
    // Para programas, construir URL del servicio de redimensionamiento
    // Codificar la ruta en base64
    const encodedPath = Buffer.from(publicUrl).toString('base64');
    
    // Construir URL del servicio de redimensionamiento local
    const resizedUrl = `/api/image-resizer?image=${encodedPath}&width=600&quality=85`;
    
    return NextResponse.json({
      success: true,
      data: { 
        url: resizedUrl,
        originalUrl: publicUrl
      }
    });
  } catch (error) {
    console.error('Error al subir imagen:', error);
    return NextResponse.json(
      { success: false, error: 'Error al subir imagen' },
      { status: 500 }
    );
  }
}