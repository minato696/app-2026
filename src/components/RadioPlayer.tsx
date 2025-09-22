'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, Radio, Loader, SkipBack, SkipForward } from 'lucide-react';
import OptimizedImage from '@/components/OptimizedImage';
import { apiClient } from '@/lib/apiClient';
import { useStation } from '@/contexts/StationContext';
import ProgramSchedule from '@/components/ProgramSchedule';
import '../styles/RadioPlayer.css';

interface Station {
  id: string;
  name: string;
  url: string;
  image?: string;
  frequency?: string;
  city?: string;
  description?: string;
}

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
  return new Date(utc + (3600000 * -5)); // UTC-5 para Perú
};

function RadioPlayer() {
  // Obtener el ID de la estación del contexto
  const { initialStationId } = useStation();
  
  const [stations, setStations] = useState<Station[]>([]);
  const [currentStation, setCurrentStation] = useState(0);
  const [visibleStations, setVisibleStations] = useState<Station[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentProgram, setCurrentProgram] = useState<Program | null>(null);
  const [currentTime, setCurrentTime] = useState(getPeruTime());
  const [isLoadingProgram, setIsLoadingProgram] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [stationsLoaded, setStationsLoaded] = useState(false);

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Actualizar tiempo actual
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getPeruTime());
    }, 1000); // Actualizar cada segundo

    return () => clearInterval(timer);
  }, []);

  // Actualizar estaciones visibles cuando cambia la estación actual (solo para móvil)
  useEffect(() => {
    if (stations.length === 0) return;
    
    // Mostrar solo 3 estaciones a la vez en móvil
    if (isMobile) {
      const stationsCount = stations.length;
      const prevIndex = (currentStation - 1 + stationsCount) % stationsCount;
      const nextIndex = (currentStation + 1) % stationsCount;
      
      // Siempre mostrar 3 estaciones: anterior, actual y siguiente
      setVisibleStations([
        stations[prevIndex],
        stations[currentStation],
        stations[nextIndex]
      ]);
    }
  }, [currentStation, stations, isMobile]);

  // Calcular progreso del programa
  const calculateProgress = () => {
    if (!currentProgram) return 0;

    const now = currentTime;
    const [startHour, startMin] = currentProgram.start_time.split(':').map(Number);
    const [endHour, endMin] = currentProgram.end_time.split(':').map(Number);
    
    // Convertir todo a minutos desde medianoche
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;
    
    // Si el programa cruza medianoche
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60; // Agregar 24 horas en minutos
      // Si estamos después de medianoche, ajustar el tiempo actual
      if (currentMinutes < startMinutes) {
        const adjustedMinutes = currentMinutes + 24 * 60;
        const duration = endMinutes - startMinutes;
        const elapsed = adjustedMinutes - startMinutes;
        return Math.min(100, Math.max(0, (elapsed / duration) * 100));
      }
    }
    
    // Calcular progreso normal
    const duration = endMinutes - startMinutes;
    const elapsed = currentMinutes - startMinutes;
    
    return Math.min(100, Math.max(0, (elapsed / duration) * 100));
  };

  // Configurar MediaSession API para control de medios cuando la pantalla está bloqueada
  useEffect(() => {
    if ('mediaSession' in navigator && currentProgram) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentProgram.name,
        artist: currentProgram.host,
        album: `Exitosa ${stations[currentStation]?.name || 'Radio'}`,
        artwork: [
          { 
            src: currentProgram.image || stations[currentStation]?.image || '', 
            sizes: '512x512', 
            type: 'image/jpeg' 
          }
        ]
      });
      
      // Actualizar controles de MediaSession
      navigator.mediaSession.setActionHandler('play', togglePlay);
      navigator.mediaSession.setActionHandler('pause', togglePlay);
      navigator.mediaSession.setActionHandler('previoustrack', prevStation);
      navigator.mediaSession.setActionHandler('nexttrack', nextStation);
    }
  }, [currentProgram, currentStation, stations, isPlaying]);

  // Cargar estaciones
  useEffect(() => {
    apiClient.getStations()
      .then(data => {
        if (data.success) {
          setStations(data.data);
          setStationsLoaded(true);
        }
      })
      .catch(error => {
        console.error('Error loading stations:', error);
      });
  }, []);

  // Efecto para manejar la selección de estación cuando initialStationId cambia o las estaciones se cargan
  useEffect(() => {
    if (!stationsLoaded || stations.length === 0) {
      return; // No hacer nada si las estaciones aún no se han cargado
    }
    
    if (initialStationId) {
      // Buscar el índice de la estación por ID
      const stationIndex = stations.findIndex(s => s.id === initialStationId);
      
      if (stationIndex !== -1) {
        setCurrentStation(stationIndex);
        
        // Cargar el programa actual para esta estación
        setIsLoadingProgram(true);
        apiClient.getCurrentProgram(stations[stationIndex].id)
          .then(data => {
            if (data.success) {
              setCurrentProgram(data.data);
            }
          })
          .catch(error => {
            console.error('Error loading program:', error);
          })
          .finally(() => {
            setIsLoadingProgram(false);
          });
        
        return; // Salir del efecto ya que hemos encontrado y establecido la estación
      }
    }
    
    // Si no hay initialStationId o no se encontró, usar Lima como predeterminado
    const limaIndex = stations.findIndex(s => s.id === 'lima');
    if (limaIndex !== -1) {
      setCurrentStation(limaIndex);
      
      // Cargar el programa actual para Lima
      setIsLoadingProgram(true);
      apiClient.getCurrentProgram(stations[limaIndex].id)
        .then(data => {
          if (data.success) {
            setCurrentProgram(data.data);
          }
        })
        .catch(error => {
          console.error('Error loading program:', error);
        })
        .finally(() => {
          setIsLoadingProgram(false);
        });
    } else if (stations.length > 0) {
      // Si no hay Lima, usar la primera estación
      setCurrentStation(0);
      
      // Cargar el programa actual para la primera estación
      setIsLoadingProgram(true);
      apiClient.getCurrentProgram(stations[0].id)
        .then(data => {
          if (data.success) {
            setCurrentProgram(data.data);
          }
        })
        .catch(error => {
          console.error('Error loading program:', error);
        })
        .finally(() => {
          setIsLoadingProgram(false);
        });
    }
  }, [initialStationId, stations, stationsLoaded]);

  // Cargar programa actual cuando cambia la estación
  useEffect(() => {
    if (!stations[currentStation]) return;

    const loadProgram = () => {
      setIsLoadingProgram(true);
      apiClient.getCurrentProgram(stations[currentStation].id)
        .then(data => {
          if (data.success) {
            setCurrentProgram(data.data);
          }
        })
        .catch(error => {
          console.error('Error loading program:', error);
        })
        .finally(() => {
          setIsLoadingProgram(false);
        });
    };

    loadProgram();
    const interval = setInterval(loadProgram, 60000); // Actualizar cada minuto
    return () => clearInterval(interval);
  }, [currentStation, stations]);

  // Control de reproducción
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      
      // Actualizar estado de MediaSession
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    } else {
      setIsBuffering(true);
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setIsBuffering(false);
          
          // Actualizar estado de MediaSession
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
          }
        })
        .catch(() => {
          setIsBuffering(false);
        });
    }
  };

  // Cambiar estación 
  const changeStation = (index: number) => {
    if (!audioRef.current || !stations[index] || index === currentStation) return;
    
    const wasPlaying = isPlaying;
    audioRef.current.pause();
    setIsPlaying(false);
    setCurrentStation(index);
    
    // Actualizar la URL sin recargar la página para reflejar la estación seleccionada
    if (typeof window !== 'undefined' && window.history) {
      const newUrl = `/${stations[index].id}`;
      window.history.replaceState(null, '', newUrl);
    }
    
    audioRef.current.src = stations[index].url;
    audioRef.current.load();

    if (wasPlaying) {
      setIsBuffering(true);
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setIsBuffering(false);
        })
        .catch(() => {
          setIsBuffering(false);
        });
    }
  };

  const prevStation = () => {
    const newIndex = (currentStation - 1 + stations.length) % stations.length;
    changeStation(newIndex);
  };

  const nextStation = () => {
    const newIndex = (currentStation + 1) % stations.length;
    changeStation(newIndex);
  };

  // Mostrar programación
  const loadStationSchedule = () => {
    setShowSchedule(true);
  };

  if (stations.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <Radio className="loading-icon" />
          <p className="loading-text">Cargando estaciones...</p>
        </div>
      </div>
    );
  }

  const station = stations[currentStation];

  return (
    <div className="player-container">
      {/* Main Content */}
      <div className="main-content">
        <div className="content-wrapper">
          {/* Stations Bar - 3 estaciones en móvil, todas en desktop */}
          <div className="stations-bar">
            <button className="arrow-button" onClick={prevStation}>
              <ChevronLeft size={24} />
            </button>
            
            {isMobile ? (
              // Vista móvil: solo 3 estaciones
              <div className="stations-display">
                {visibleStations.map((s, i) => (
                  <button
                    key={`visible-${s.id}-${i}`}
                    onClick={() => {
                      // Si es la estación central, no hacemos nada
                      if (i === 1) return;
                      
                      // Si es la anterior, vamos a la anterior
                      if (i === 0) {
                        prevStation();
                      }
                      // Si es la siguiente, vamos a la siguiente
                      else if (i === 2) {
                        nextStation();
                      }
                    }}
                    className={`station-button ${i === 1 ? 'active' : ''} ${s.image ? 'has-image' : ''}`}
                    title={s.name}
                  >
                    {s.image ? (
                      <img src={s.image} alt={s.name} />
                    ) : (
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: '600',
                        color: i === 1 ? '#D70007' : '#666'
                      }}>
                        {s.name}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              // Vista desktop: todas las estaciones (sin botón de programación)
              <div className="stations-display-desktop">
                {stations.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => changeStation(i)}
                    className={`station-button ${i === currentStation ? 'active' : ''} ${s.image ? 'has-image' : ''}`}
                    title={s.name}
                  >
                    {s.image ? (
                      <img src={s.image} alt={s.name} />
                    ) : (
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: '600',
                        color: i === currentStation ? '#D70007' : '#666'
                      }}>
                        {s.name}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            
            <button className="arrow-button" onClick={nextStation}>
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Content Area */}
          <div className="content-area">
            {/* Actualizado: Mostrar el nombre del programa y botón de programación */}
            <div className="program-info">
              <h1 className="program-title">{currentProgram ? currentProgram.name : `Exitosa ${station.name}`}</h1>
              <button 
                className="program-schedule-button"
                onClick={loadStationSchedule}
              >
                <span className="program-schedule-icon">≡</span>
                PROGRAMACIÓN {station.name.toUpperCase()}
              </button>
            </div>

            {/* Cover */}
            <div className="cover-container">
              {isLoadingProgram ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <Loader className="w-12 h-12 animate-spin text-gray-400" />
                </div>
              ) : currentProgram?.image ? (
                <>
                  <OptimizedImage 
                    src={currentProgram.image} 
                    alt={currentProgram ? currentProgram.name : `Exitosa ${station.name}`}
                    width={600}
                    quality={90}
                    className="w-full h-full object-cover"
                    fallback={
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <Loader className="w-12 h-12 animate-spin text-gray-400" />
                      </div>
                    }
                  />
                  
                  {/* Información del programa superpuesta en la imagen (estilo actualizado) */}
                  {currentProgram && (
                    <div className="program-info-overlay">
                      <div className="on-air-container">
                        <div className="on-air-badge">
                          {isPlaying ? "EN VIVO" : "AL AIRE"}
                        </div>
                        {isPlaying && (
                          <div className="audio-visualizer">
                            <span className="audio-bar"></span>
                            <span className="audio-bar"></span>
                            <span className="audio-bar"></span>
                          </div>
                        )}
                      </div>
                      <div className="host-name">{currentProgram.host}</div>
                      <div className="program-time-small">{currentProgram.start_time} - {currentProgram.end_time}</div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Radio className="radio-icon" size={80} />
                  <div className="station-name-cover">{station.name}</div>
                  <div className="radio-text">Radio Exitosa</div>
                  
                  {/* Información del programa superpuesta (estilo actualizado) */}
                  {currentProgram && (
                    <div className="program-info-overlay">
                      <div className="on-air-container">
                        <div className="on-air-badge">
                          {isPlaying ? "EN VIVO" : "AL AIRE"}
                        </div>
                        {isPlaying && (
                          <div className="audio-visualizer">
                            <span className="audio-bar"></span>
                            <span className="audio-bar"></span>
                            <span className="audio-bar"></span>
                          </div>
                        )}
                      </div>
                      <div className="host-name">{currentProgram.host}</div>
                      <div className="program-time-small">{currentProgram.start_time} - {currentProgram.end_time}</div>
                    </div>
                  )}
                </>
              )}
              
              {!isPlaying && !isBuffering && (
                <div className="play-button-overlay" onClick={togglePlay}>
                  <div className="play-button-circle">
                    <div className="play-button-triangle"></div>
                  </div>
                </div>
              )}
              
              {isBuffering && (
                <div className="buffering-overlay">
                  <Loader className="buffering-spinner" size={48} />
                </div>
              )}
            </div>
          </div>

          {/* Controls Bar - Diseño diferente para móvil */}
          {isMobile ? (
            <div className="controls-bar mobile-controls">
              <div className="mobile-player-row">
                <div className="now-playing-info">
                  <div className="now-playing-cover">
                    {currentProgram?.image ? (
                      <OptimizedImage 
                        src={currentProgram.image} 
                        alt={currentProgram.name}
                        width={40}
                        quality={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-red-600">
                        <Radio className="text-white" size={20} />
                      </div>
                    )}
                  </div>
                  <div className="now-playing-text">
                    <p className="now-playing-title">{currentProgram ? currentProgram.name : `Exitosa ${station.name}`}</p>
                    <p className="now-playing-subtitle">{station.name}</p>
                  </div>
                </div>
                
                <div className="player-controls-mobile">
                  <button className="control-button" onClick={prevStation}>
                    <SkipBack size={18} />
                  </button>
                  <button className="control-button play" onClick={togglePlay}>
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button className="control-button" onClick={nextStation}>
                    <SkipForward size={18} />
                  </button>
                </div>
              </div>

              {/* Mobile progress bar - más simple */}
              <div className="progress-section-mobile">
                <span className="time-display">
                  {currentProgram?.start_time || '00:00'}
                </span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${calculateProgress()}%` }} />
                </div>
                <span className="time-display">
                  {currentProgram?.end_time || '00:00'}
                </span>
              </div>
            </div>
          ) : (
            // Diseño original para desktop
            <div className="controls-bar">
              <div className="controls-container">
                <div className="now-playing-info">
                  <div className="now-playing-cover">
                    {currentProgram?.image ? (
                      <OptimizedImage 
                        src={currentProgram.image} 
                        alt={currentProgram.name}
                        width={48}
                        quality={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-red-600">
                        <Radio className="text-white" size={24} />
                      </div>
                    )}
                  </div>
                  <div className="now-playing-text">
                    <p className="now-playing-title">{currentProgram ? currentProgram.name : `Exitosa ${station.name}`}</p>
                    <p className="now-playing-subtitle">{station.name}</p>
                  </div>
                </div>
                
                <div className="player-controls">
                  <button className="control-button" onClick={prevStation}>
                    <SkipBack size={20} />
                  </button>
                  <button className="control-button play" onClick={togglePlay}>
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                  <button className="control-button" onClick={nextStation}>
                    <SkipForward size={20} />
                  </button>
                </div>
                
                <div className="progress-section">
                  <span className="time-display">
                    {currentProgram?.start_time || '00:00'}
                  </span>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${calculateProgress()}%` }} />
                  </div>
                  <span className="time-display">
                    {currentProgram?.end_time || '00:00'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Usar el componente de programación separado */}
      {showSchedule && (
        <ProgramSchedule 
          stationId={station.id}
          stationName={station.name}
          onClose={() => setShowSchedule(false)}
          currentProgramId={currentProgram?.id}
        />
      )}

      {/* Audio element */}
      <audio 
        ref={audioRef} 
        crossOrigin="anonymous"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        {station && <source src={station.url} type="audio/mpeg" />}
      </audio>
    </div>
  );
}

export default RadioPlayer;