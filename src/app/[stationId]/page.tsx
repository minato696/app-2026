'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import RadioPlayer from '@/components/RadioPlayer';

// Mapeo detallado de estaciones con información SEO
const stationInfo: Record<string, {
  name: string;
  frequency: string;
  description: string;
}> = {
  lima: {
    name: 'Lima',
    frequency: '95.5 FM',
    description: 'La estación principal de Radio Exitosa en la capital del Perú'
  },
  arequipa: {
    name: 'Arequipa',
    frequency: '104.9 FM',
    description: 'Transmitiendo desde la Ciudad Blanca'
  },
  trujillo: {
    name: 'Trujillo',
    frequency: '103.3 FM',
    description: 'La voz de la Ciudad de la Eterna Primavera'
  },
  chiclayo: {
    name: 'Chiclayo',
    frequency: '98.9 FM',
    description: 'Conectando con el norte del Perú'
  }
};

export default function StationPage() {
  const params = useParams();

  useEffect(() => {
    if (params?.stationId) {
      // Obtener el ID de la estación
      const id = Array.isArray(params.stationId) ? params.stationId[0] : params.stationId as string;

      // Verificar si la estación existe en nuestro mapeo
      if (stationInfo[id]) {
        const station = stationInfo[id];

        // Actualizar el título con el nombre, frecuencia y eslogan
        const newTitle = `Radio Exitosa - ${station.name} ${station.frequency} | La Voz que Integra al Perú`;

        // Usar setTimeout para asegurar que el título se actualice después de que el DOM esté listo
        setTimeout(() => {
          document.title = newTitle;
        }, 100);

        // Actualizar la meta descripción para SEO
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
          metaDescription.setAttribute('content',
            `Escucha Radio Exitosa ${station.name} en vivo - ${station.frequency}. Noticias, información y debate. ${station.description}. La Voz que Integra al Perú.`
          );
        }
      }
    }
  }, [params]);

  return <RadioPlayer />;
}