// src/components/ProgramSchedule.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X, Calendar, Clock, Radio, User } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import OptimizedImage from '@/components/OptimizedImage';
import '../styles/ProgramSchedule.css';

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

interface Station {
  id: string;
  name: string;
  frequency?: string;
  image?: string;
}

interface ProgramScheduleProps {
  stationId: string;
  stationName: string;
  onClose: () => void;
  currentProgramId?: string;
}

export default function ProgramSchedule({ stationId, stationName, onClose, currentProgramId }: ProgramScheduleProps) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDay, setActiveDay] = useState('Lunes');
  const [dayPrograms, setDayPrograms] = useState<Program[]>([]);
  const daysNavRef = useRef<HTMLDivElement>(null);

  // Cargar programas
  useEffect(() => {
    setIsLoading(true);
    apiClient.getPrograms(stationId)
      .then(data => {
        if (data.success) {
          setPrograms(data.data);
          
          // Establecer día activo basado en el día actual
          const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
          const today = days[new Date().getDay()];
          setActiveDay(today);
        }
      })
      .catch(error => {
        console.error('Error loading programs:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [stationId]);

  // Efecto para hacer scroll al día actual cuando se cargan los programas
  useEffect(() => {
    if (programs.length > 0 && activeDay) {
      // Hacer scroll al día actual después de un pequeño delay
      setTimeout(() => {
        if (daysNavRef.current) {
          const activeButton = daysNavRef.current.querySelector('.day-tab.active');
          if (activeButton) {
            activeButton.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'nearest', 
              inline: 'center' 
            });
          }
        }
      }, 200);
    }
  }, [programs, activeDay]);

  // Filtrar programas por día activo
  useEffect(() => {
    if (programs.length > 0 && activeDay) {
      const filtered = programs
        .filter(program => program.days.includes(activeDay))
        .sort((a, b) => {
          const timeA = a.start_time.split(':').map(Number);
          const timeB = b.start_time.split(':').map(Number);
          return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
        });
      
      setDayPrograms(filtered);
    }
  }, [programs, activeDay]);

  // Manejar cambio de día
  const handleDayChange = (day: string) => {
    setActiveDay(day);
    
    // Opcional: hacer scroll hacia arriba cuando cambia el día
    const contentElement = document.querySelector('.schedule-content');
    if (contentElement) {
      contentElement.scrollTop = 0;
    }
  };

  // Lista de días
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // Cerrar al hacer clic fuera o con ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('schedule-overlay')) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="schedule-overlay">
      <div className="schedule-container">
        <header className="schedule-header">
          <div className="schedule-title">
            <Calendar className="schedule-title-icon" />
            <h2>Programación - Radio Exitosa {stationName}</h2>
          </div>
          <button className="schedule-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </header>
        
        {/* Barra de navegación de días con indicador de scroll para móvil */}
        <div className="days-tabs-container">
          <div className="days-tabs" ref={daysNavRef}>
            {days.map(day => (
              <button 
                key={day}
                className={`day-tab ${activeDay === day ? 'active' : ''}`}
                onClick={() => handleDayChange(day)}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="schedule-content">
          {isLoading ? (
            <div className="schedule-loading">
              <div className="schedule-loader"></div>
              <p>Cargando programación...</p>
            </div>
          ) : (
            <div className="schedule-programs-grid">
              {dayPrograms.length === 0 ? (
                <div className="schedule-no-programs">
                  <Radio size={48} />
                  <p>No hay programas registrados para este día</p>
                </div>
              ) : (
                dayPrograms.map(program => (
                  <div 
                    key={program.id} 
                    className={`program-card ${currentProgramId === program.id ? 'current-program' : ''}`}
                  >
                    <div className="program-card-content">
                      <div className="program-image-container">
                        {program.image ? (
                          <OptimizedImage 
                            src={program.image} 
                            alt={program.name}
                            width={120}
                            className="program-image"
                            fallback={
                              <div className="program-image-placeholder">
                                <Radio size={30} />
                              </div>
                            }
                          />
                        ) : (
                          <div className="program-image-placeholder">
                            <Radio size={30} />
                          </div>
                        )}
                      </div>
                      
                      <div className="program-details">
                        <h3 className="program-name">{program.name}</h3>
                        
                        <div className="program-time">
                          <Clock size={14} />
                          <span>{program.start_time} - {program.end_time}</span>
                        </div>
                        
                        <div className="program-host">
                          <User size={14} />
                          <span>{program.host}</span>
                        </div>
                      </div>
                    </div>
                    
                    {currentProgramId === program.id && (
                      <div className="live-indicator-container">
                        <div className="live-indicator-badge">EN VIVO</div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}