'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RadioPlayer from '@/components/RadioPlayer';
import { apiClient } from '@/lib/apiClient';

// Definir interfaz para Station
interface Station {
  id: string;
  name: string;
  url: string;
  image?: string;
  frequency?: string;
  city?: string;
  description?: string;
}

export default function StationClientPage() {
  const params = useParams();
  const router = useRouter();
  const [validStation, setValidStation] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // Efecto para cargar los datos de la estación y actualizar el título
  useEffect(() => {
    if (params?.stationId) {
      // Asegurarse de que stationId es una cadena
      const id = Array.isArray(params.stationId) 
        ? params.stationId[0] 
        : params.stationId as string;
      
      console.log('⚡ Client: Params stationId:', id);
      
      // Verificar si la estación existe
      setIsLoading(true);
      apiClient.getStations()
        .then(response => {
          console.log('🔍 Stations data received:', response.data.length);
          if (response.success) {
            const station = response.data.find((s: Station) => s.id === id);
            
            if (station) {
              console.log('🔍 Found station:', station.name, station.frequency);
              setValidStation(true);
              
              // Actualizar el título INMEDIATAMENTE incluyendo la frecuencia
              const newTitle = `Radio Exitosa - ${station.name} ${station.frequency || ''}`;
              console.log('📝 Setting title to:', newTitle);
              document.title = newTitle;
              
              // También actualizar la metaetiqueta de descripción
              const metaDescription = document.querySelector('meta[name="description"]');
              if (metaDescription) {
                const newDescription = station.description || 
                  `Escucha Radio Exitosa ${station.name} en vivo - ${station.frequency || ''}`;
                metaDescription.setAttribute('content', newDescription);
              }
            } else {
              console.log('⚠️ Station not found with id:', id);
              setValidStation(false);
            }
          } else {
            console.log('⚠️ API error');
            setValidStation(false);
          }
        })
        .catch((error) => {
          console.error('❌ Error fetching stations:', error);
          setValidStation(false);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [params]);
  
  // Si la estación no es válida, redirigir a la página principal
  useEffect(() => {
    if (!isLoading && !validStation) {
      console.log('⚠️ Invalid station, redirecting to home');
      router.push('/');
    }
  }, [validStation, isLoading, router]);
  
  // Mostrar un indicador de carga mientras verificamos la estación
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-icon">Cargando...</div>
        </div>
      </div>
    );
  }
  
  // Ya no pasamos el initialStationId como prop
  // El componente RadioPlayer lo obtendrá del contexto
  return <RadioPlayer />;
}