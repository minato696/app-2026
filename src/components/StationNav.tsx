// src/components/StationNav.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Radio } from 'lucide-react';

interface Station {
  id: string;
  name: string;
  frequency?: string;
  city?: string;
}

export default function StationNav() {
  const [stations, setStations] = useState<Station[]>([]);
  const pathname = usePathname();
  
  // Obtener la estación actual de la URL
  const currentStationId = pathname === '/' ? 'lima' : pathname.slice(1);
  
  useEffect(() => {
    // Cargar estaciones
    fetch('/api/stations', {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStations(data.data);
        }
      })
      .catch(error => {
        console.error('Error cargando estaciones:', error);
      });
  }, []);
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-4 overflow-x-auto">
          <span className="text-sm font-medium text-gray-600 whitespace-nowrap flex items-center gap-2">
            <Radio size={16} />
            Enlaces directos:
          </span>
          {stations.map(station => (
            <Link
              key={station.id}
              href={`/${station.id}`}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all
                ${currentStationId === station.id 
                  ? 'bg-red-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {station.name}
              {station.frequency && (
                <span className="ml-1 text-xs opacity-80">
                  {station.frequency}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}