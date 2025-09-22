'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';

interface StationContextType {
  initialStationId: string | null;
}

// Valor predeterminado del contexto
const StationContext = createContext<StationContextType>({ initialStationId: null });

export function StationProvider({ children }: { children: ReactNode }) {
  // Estado para almacenar el ID de la estación
  const [initialStationId, setInitialStationId] = useState<string | null>(null);
  const pathname = usePathname();
  
  // Efecto para extraer el ID de la estación de la URL
  useEffect(() => {
    if (pathname) {
      // Extraer el ID de la estación de la URL (primer segmento después de /)
      const pathSegments = pathname.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        const stationId = pathSegments[0];
        // Solo actualizar si es diferente (evita re-renderizados innecesarios)
        if (stationId !== initialStationId) {
          setInitialStationId(stationId);
        }
      } else {
        // Si no hay segmentos de ruta, establecer a null (para usar la estación predeterminada)
        if (initialStationId !== null) {
          setInitialStationId(null);
        }
      }
    }
  }, [pathname, initialStationId]);
  
  // Usar useMemo para evitar re-renderizados innecesarios
  const contextValue = useMemo(
    () => ({ initialStationId }), 
    [initialStationId]
  );
  
  return (
    <StationContext.Provider value={contextValue}>
      {children}
    </StationContext.Provider>
  );
}

// Hook personalizado para acceder al contexto
export function useStation() {
  return useContext(StationContext);
}