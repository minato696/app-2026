// src/hooks/useCurrentProgram.ts - VERSIÓN PRODUCCIÓN SIN LOGS
import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/apiClient';

interface Program {
    id: string;
    station_id: string;
    name: string;
    host: string;
    start_time: string;
    end_time: string;
    image: string;
    days: string[];
}

// Obtener hora de Perú (UTC-5)
const getPeruTime = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * -5));
};

// Calcular milisegundos hasta el próximo cambio de programa
const getMillisecondsUntilNextProgram = (currentProgram: Program | null): number => {
    if (!currentProgram) return 60000; // Si no hay programa, revisar en 1 minuto

    const now = getPeruTime();
    const [endHour, endMin] = currentProgram.end_time.split(':').map(Number);

    // Crear fecha con la hora de fin del programa
    const endTime = new Date(now);
    endTime.setHours(endHour, endMin, 0, 0);

    // Si la hora de fin ya pasó hoy, es para mañana (programas que cruzan medianoche)
    if (endTime <= now && endHour !== 0) {
        endTime.setDate(endTime.getDate() + 1);
    }

    // Si es medianoche (00:00) y estamos en la noche, es para hoy a medianoche
    if (endHour === 0 && endMin === 0 && now.getHours() >= 20) {
        endTime.setDate(endTime.getDate() + 1);
    }

    const msUntilEnd = endTime.getTime() - now.getTime();

    // Agregar 30 segundos de buffer para asegurar que el nuevo programa ya esté activo
    return msUntilEnd + 30000;
};

export function useCurrentProgram(stationId: string | undefined) {
    const [currentProgram, setCurrentProgram] = useState<Program | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Función para cargar el programa
    const loadProgram = async (isInitial = false) => {
        if (!stationId) return;

        try {
            if (isInitial) setIsLoading(true);

            const data = await apiClient.getCurrentProgram(stationId);

            if (data.success) {
                const newProgram = data.data;

                // Solo actualizar si el programa cambió
                if (!currentProgram || !newProgram || currentProgram.id !== newProgram?.id) {
                    setCurrentProgram(newProgram);
                    setLastUpdateTime(new Date());

                    // Si hay un nuevo programa, programar la próxima actualización
                    if (newProgram) {
                        scheduleNextUpdate(newProgram);
                    }
                }
            }
        } catch (error) {
            // Solo mantener console.error para errores reales
            console.error('Error loading program:', error);
        } finally {
            if (isInitial) setIsLoading(false);
        }
    };

    // Función para programar la próxima actualización
    const scheduleNextUpdate = (program: Program) => {
        // Limpiar timeout anterior
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        const msUntilNext = getMillisecondsUntilNextProgram(program);

        // Programar actualización cuando termine el programa actual
        timeoutRef.current = setTimeout(() => {
            loadProgram();
        }, Math.min(msUntilNext, 2147483647)); // Max timeout value
    };

    // Verificación periódica de seguridad (cada 5 minutos)
    useEffect(() => {
        if (!stationId) return;

        // Cargar programa inicial
        loadProgram(true);

        // Verificación de seguridad cada 5 minutos
        checkIntervalRef.current = setInterval(() => {
            const now = getPeruTime();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            // Si tenemos un programa, verificar si debería haber cambiado
            if (currentProgram) {
                const [endHour, endMin] = currentProgram.end_time.split(':').map(Number);
                const endMinutes = endHour * 60 + endMin;

                // Si ya pasó la hora de fin (considerando programas que cruzan medianoche)
                if ((endMinutes > 0 && currentMinutes >= endMinutes) ||
                    (endMinutes === 0 && currentMinutes < 60)) {
                    loadProgram();
                }
            } else {
                // Si no hay programa, intentar cargar
                loadProgram();
            }
        }, 300000); // 5 minutos

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
        };
    }, [stationId]); // Solo depende de stationId

    // Listener para cuando la pestaña vuelve a estar activa
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                // Cuando la pestaña vuelve a estar activa, verificar si necesitamos actualizar
                const now = new Date();
                const timeSinceLastUpdate = now.getTime() - lastUpdateTime.getTime();

                // Si han pasado más de 5 minutos, actualizar
                if (timeSinceLastUpdate > 300000) {
                    loadProgram();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [lastUpdateTime, stationId]);

    return {
        currentProgram,
        isLoading,
        refresh: () => loadProgram(),
        lastUpdateTime
    };
}