// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  
  // Eliminar cookie de autenticación
  response.cookies.delete('admin-auth');
  
  return response;
}