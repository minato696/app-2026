// src/app/api/image-resizer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const encodedImage = searchParams.get('image');
    const width = parseInt(searchParams.get('width') || '600', 10);
    const height = searchParams.get('height') ? parseInt(searchParams.get('height')!, 10) : null;
    const quality = parseInt(searchParams.get('quality') || '85', 10);
    
    if (!encodedImage) {
      return NextResponse.json(
        { error: 'Parámetro "image" requerido' },
        { status: 400 }
      );
    }
    
    // Decodificar la URL de base64
    let imagePath: string;
    try {
      const decodedUrl = Buffer.from(encodedImage, 'base64').toString('utf-8');
      
      // Si es una URL completa, extraer la ruta
      if (decodedUrl.startsWith('http')) {
        const url = new URL(decodedUrl);
        imagePath = url.pathname;
      } else {
        imagePath = decodedUrl;
      }
      
      // Asegurar que la ruta sea segura (prevenir path traversal)
      if (!imagePath.includes('/images/programs/') && !imagePath.includes('/images/stations/')) {
        throw new Error('Ruta de imagen no válida');
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'URL de imagen inválida' },
        { status: 400 }
      );
    }
    
    // Construir ruta completa del archivo
    const fullPath = path.join(process.cwd(), 'public', imagePath);
    
    // Leer y procesar la imagen
    try {
      const imageBuffer = await readFile(fullPath);
      
      // Configurar Sharp para redimensionar
      let sharpInstance = sharp(imageBuffer);
      
      // Aplicar redimensionamiento
      if (height) {
        sharpInstance = sharpInstance.resize(width, height, { fit: 'cover' });
      } else {
        sharpInstance = sharpInstance.resize(width, null, { 
          fit: 'inside',
          withoutEnlargement: true 
        });
      }
      
      // Convertir a JPEG con la calidad especificada
      const processedImage = await sharpInstance
        .jpeg({ quality })
        .toBuffer();
      
      // Devolver la imagen con headers apropiados
      return new NextResponse(processedImage, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (error) {
      console.error('Error procesando imagen:', error);
      return NextResponse.json(
        { error: 'Error al procesar la imagen' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error en image-resizer:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}