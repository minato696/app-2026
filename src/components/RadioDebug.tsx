// src/components/RadioDebug.tsx
'use client';

import { useState, useEffect } from 'react';

// Este componente ayuda a depurar problemas con la carga de estaciones
export default function RadioDebug({ initialStationId }: { initialStationId?: string }) {
  const [pageUrl, setPageUrl] = useState<string>('');
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPageUrl(window.location.href);
    }
  }, []);
  
  if (process.env.NODE_ENV === 'production') {
    return null; // No mostrar en producción
  }
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      backgroundColor: 'rgba(0,0,0,0.7)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div><strong>🔍 Depuración Radio:</strong></div>
      <div>URL: {pageUrl}</div>
      <div>initialStationId: {initialStationId || 'ninguno'}</div>
    </div>
  );
}