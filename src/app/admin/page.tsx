// src/app/admin/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Save, Trash2, Plus, Upload, X, Clock, Calendar, Music, Radio, LogOut, Edit2, BarChart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import StationsManager from '@/components/StationsManager';
import CacheMonitor from '@/components/CacheMonitor';
import '@/styles/admin.css';

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

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function AdminPanel() {
  const [stations, setStations] = useState<Station[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedStation, setSelectedStation] = useState('');
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [activeTab, setActiveTab] = useState<'programs' | 'stations' | 'cache'>('programs');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Formulario
  const [formData, setFormData] = useState({
    station_id: '',
    name: '',
    host: '',
    start_time: '',
    end_time: '',
    image: '',
    days: [] as string[]
  });

  // Cargar datos
  useEffect(() => {
    setIsLoading(true);
    
    // Cargar estaciones
    fetch('/api/stations', {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
      },
      credentials: 'same-origin'
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStations(data.data);
          if (data.data.length > 0 && !selectedStation) {
            setSelectedStation(data.data[0].id);
          }
        }
      })
      .catch(error => {
        console.error('Error cargando estaciones:', error);
      });

    // Cargar programas
    fetch('/api/programs', {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
      },
      credentials: 'same-origin'
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPrograms(data.data);
        }
      })
      .catch(error => {
        console.error('Error cargando programas:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Filtrar programas por estación
  const filteredPrograms = programs.filter(p => p.station_id === selectedStation);
  
  // Ordenar programas por día y hora
  const sortedPrograms = useMemo(() => {
    // Orden de días de la semana
    const dayOrder: { [key: string]: number } = {
      'Lunes': 0,
      'Martes': 1,
      'Miércoles': 2,
      'Jueves': 3,
      'Viernes': 4,
      'Sábado': 5,
      'Domingo': 6
    };

    return [...filteredPrograms].sort((a, b) => {
      // Primero ordenar por el primer día de emisión
      const firstDayA = a.days[0] || '';
      const firstDayB = b.days[0] || '';
      
      const dayComparison = dayOrder[firstDayA] - dayOrder[firstDayB];
      if (dayComparison !== 0) {
        return dayComparison;
      }
      
      // Si los días son iguales, ordenar por hora de inicio
      const [hoursA, minutesA] = a.start_time.split(':').map(Number);
      const [hoursB, minutesB] = b.start_time.split(':').map(Number);
      
      if (hoursA !== hoursB) {
        return hoursA - hoursB;
      }
      
      return minutesA - minutesB;
    });
  }, [filteredPrograms]);
  
  // Debug
  useEffect(() => {
    console.log('Estado actual:', {
      selectedStation,
      totalPrograms: programs.length,
      filteredPrograms: filteredPrograms.length,
      sortedPrograms: sortedPrograms.length,
      stations: stations.map(s => ({ id: s.id, name: s.name }))
    });
  }, [selectedStation, programs, stations, sortedPrograms]);

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Manejar días seleccionados
  const handleDayToggle = (day: string) => {
    if (formData.days.includes(day)) {
      setFormData({
        ...formData,
        days: formData.days.filter(d => d !== day)
      });
    } else {
      setFormData({
        ...formData,
        days: [...formData.days, day]
      });
    }
  };

  // Subir imagen
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea JPG/JPEG
    if (!file.type.includes('jpeg') && !file.type.includes('jpg')) {
      alert('Por favor, sube una imagen en formato JPG/JPEG');
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('type', 'program');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin',
        body: formDataUpload
      });

      const result = await response.json();
      if (result.success) {
        setFormData({
          ...formData,
          image: result.data.url
        });
      }
    } catch (error) {
      console.error('Error al subir imagen:', error);
    }
  };

  // Crear o actualizar programa
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingProgram ? '/api/programs' : '/api/programs';
    const method = editingProgram ? 'PUT' : 'POST';
    const body = editingProgram 
      ? { ...formData, id: editingProgram.id }
      : formData;

    try {
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify(body)
      });

      const result = await response.json();
      if (result.success) {
        // Recargar programas
        const programsRes = await fetch('/api/programs', {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
          },
          credentials: 'same-origin'
        });
        const programsData = await programsRes.json();
        if (programsData.success) {
          setPrograms(programsData.data);
        }

        // Limpiar formulario
        resetForm();
      }
    } catch (error) {
      console.error('Error al guardar programa:', error);
    }
  };

  // Eliminar programa
  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este programa?')) return;

    try {
      const response = await fetch(`/api/programs?id=${id}`, {
        method: 'DELETE',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        credentials: 'same-origin'
      });

      if (response.ok) {
        setPrograms(programs.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Error al eliminar programa:', error);
    }
  };

  // Actualizar estación
  const handleStationUpdate = async (stationId: string, imageUrl: string) => {
    try {
      const response = await fetch('/api/stations', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({ id: stationId, image: imageUrl })
      });

      const result = await response.json();
      if (result.success) {
        // Recargar estaciones
        const stationsRes = await fetch('/api/stations', {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
          },
          credentials: 'same-origin'
        });
        const stationsData = await stationsRes.json();
        if (stationsData.success) {
          setStations(stationsData.data);
        }
      }
    } catch (error) {
      console.error('Error al actualizar estación:', error);
    }
  };

  // Subir imagen de estación
  const handleStationImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, stationId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('type', 'station');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin',
        body: formDataUpload
      });

      const result = await response.json();
      if (result.success) {
        await handleStationUpdate(stationId, result.data.url);
      }
    } catch (error) {
      console.error('Error al subir imagen:', error);
    }
  };

  // Editar programa
  const handleEdit = (program: Program) => {
    setEditingProgram(program);
    setFormData({
      station_id: program.station_id,
      name: program.name,
      host: program.host,
      start_time: program.start_time,
      end_time: program.end_time,
      image: program.image,
      days: program.days
    });
    setIsCreating(true);
    
    // Hacer scroll suave hacia el formulario
    setTimeout(() => {
      const formElement = document.getElementById('program-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Limpiar formulario
  const resetForm = () => {
    setFormData({
      station_id: selectedStation,
      name: '',
      host: '',
      start_time: '',
      end_time: '',
      image: '',
      days: []
    });
    setEditingProgram(null);
    setIsCreating(false);
  };

  // Cerrar sesión
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        credentials: 'same-origin'
      });
      router.push('/admin/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Panel de Administración - Radio Exitosa</h1>
          <div className="flex items-center gap-4">
            <a href="/" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded transition">
              Ver Radio
            </a>
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('programs')}
              className={`px-6 py-3 font-medium ${activeTab === 'programs' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-600'}`}
            >
              Programas
            </button>
            <button
              onClick={() => setActiveTab('stations')}
              className={`px-6 py-3 font-medium ${activeTab === 'stations' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-600'}`}
            >
              Estaciones
            </button>
            <button
              onClick={() => setActiveTab('cache')}
              className={`px-6 py-3 font-medium ${activeTab === 'cache' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-600'}`}
            >
              <BarChart className="w-4 h-4 inline mr-2" />
              Monitor de Caché
            </button>
          </div>
        </div>

        {/* Tab de Monitor de Caché */}
        {activeTab === 'cache' && <CacheMonitor />}

        {/* Tab de Estaciones */}
        {activeTab === 'stations' && (
          <StationsManager 
            stations={stations} 
            onUpdate={setStations}
          />
        )}

        {/* Tab de Programas */}
        {activeTab === 'programs' && (
          <>
            {/* Selector de estación */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estación
              </label>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
              >
                {stations.map(station => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Botón crear programa */}
            {!isCreating && (
              <button
                onClick={() => {
                  setIsCreating(true);
                  setFormData({ ...formData, station_id: selectedStation });
                  setEditingProgram(null);
                  setTimeout(() => {
                    const formElement = document.getElementById('program-form');
                    if (formElement) {
                      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }}
                className="mb-6 bg-red-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-red-700 transition"
              >
                <Plus className="w-5 h-5" />
                Crear Nuevo Programa
              </button>
            )}

            {/* Formulario */}
            {isCreating && (
              <div id="program-form" className={`bg-white rounded-lg shadow p-6 mb-6 animate-slide-down ${editingProgram ? 'editing' : ''}`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">
                    {editingProgram ? '✏️ Editar Programa' : '➕ Nuevo Programa'}
                  </h2>
                  {editingProgram && (
                    <span className="text-sm text-gray-600">
                      Editando: <strong>{editingProgram.name}</strong>
                    </span>
                  )}
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Programa
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Conductor
                      </label>
                      <input
                        type="text"
                        name="host"
                        value={formData.host}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Hora de Inicio
                      </label>
                      <input
                        type="time"
                        name="start_time"
                        value={formData.start_time}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Hora de Fin
                      </label>
                      <input
                        type="time"
                        name="end_time"
                        value={formData.end_time}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Días de Emisión
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayToggle(day)}
                          className={`px-4 py-2 rounded-lg transition ${
                            formData.days.includes(day)
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Imagen del Programa
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 transition"
                      >
                        <Upload className="w-4 h-4" />
                        Subir Imagen
                      </label>
                      
                      {formData.image && (
                        <div className="relative">
                          <img 
                            src={formData.image} 
                            alt="Preview" 
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, image: '' })}
                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="bg-red-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition"
                    >
                      <Save className="w-4 h-4" />
                      {editingProgram ? 'Actualizar' : 'Guardar'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-gray-200 hover:bg-gray-300 px-6 py-2 rounded-lg flex items-center gap-2 transition"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Lista de programas */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Programas de {stations.find(s => s.id === selectedStation)?.name || 'Cargando...'}
                  <span className="text-sm font-normal text-gray-600">
                    ({sortedPrograms.length} programas)
                  </span>
                </h2>
              </div>
              
              <div className="divide-y">
                {isLoading ? (
                  <div className="p-12 text-center">
                    <div className="inline-flex items-center gap-3 text-gray-600">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                      <span>Cargando programas...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {programs.length === 0 && (
                      <div className="p-6 text-center">
                        <p className="text-gray-500 mb-4">
                          No se encontraron programas en la base de datos.
                        </p>
                        <p className="text-sm text-gray-400">
                          Verifica que el archivo <code className="bg-gray-100 px-2 py-1 rounded">data.json</code> existe y contiene programas.
                        </p>
                      </div>
                    )}
                    
                    {programs.length > 0 && sortedPrograms.length === 0 && (
                      <div className="p-6 text-center text-gray-500">
                        No hay programas registrados para esta estación
                      </div>
                    )}
                    
                    {sortedPrograms.map(program => (
                      <div 
                        key={program.id} 
                        className={`p-6 flex items-center gap-4 transition-all ${
                          editingProgram?.id === program.id 
                            ? 'bg-blue-50 border-l-4 border-blue-600' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {program.image ? (
                          <img 
                            src={program.image} 
                            alt={program.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Music className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{program.name}</h3>
                          <p className="text-gray-600">
                            {program.host} • {program.start_time} - {program.end_time}
                          </p>
                          <p className="text-sm text-gray-500">
                            {program.days.join(', ')}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(program)}
                            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition group relative"
                            title="Editar programa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(program.id)}
                            className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition"
                            title="Eliminar programa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}