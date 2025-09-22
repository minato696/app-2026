// src/app/not-found.tsx
'use client';

import React from 'react';
import { Radio } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-600 p-4 rounded-full">
            <Radio className="w-10 h-10 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Estación no encontrada</h1>
        
        <p className="text-gray-600 mb-6">
          La estación que estás buscando no existe o no está disponible en este momento.
        </p>
        
        <Link href="/" className="block w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition">
          Volver a la radio
        </Link>
      </div>
    </div>
  );
}