// src/components/CacheMonitor.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Trash2, RefreshCw, Activity, Database, Radio, Music } from 'lucide-react';

interface CacheStats {
  global: {
    totalHits: number;
    totalMisses: number;
    totalSets: number;
    totalDeletes: number;
    hitRate: string;
  };
  byCache: {
    [key: string]: {
      hits: number;
      misses: number;
      sets: number;
      deletes: number;
      hitRate: number;
    };
  };
  memory: {
    [key: string]: {
      keys: number;
      size: number;
    };
  };
  timestamp: string;
}

export default function CacheMonitor() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      console.log('Fetching cache stats...'); // Debug
      setError(null);
      
      const response = await fetch('/api/admin/cache-stats', {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
        },
        credentials: 'same-origin'
      });
      
      console.log('Response status:', response.status); // Debug
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response not OK:', errorText);
        
        if (response.status === 401) {
          setError('No autorizado. Por favor, inicia sesión nuevamente.');
        } else if (response.status === 404) {
          setError('Endpoint no encontrado. Verifica la configuración.');
        } else {
          setError(`Error del servidor: ${response.status}`);
        }
        return;
      }
      
      const data = await response.json();
      console.log('Stats data received:', data); // Debug
      
      if (data.success) {
        setStats(data.data);
        setError(null);
      } else {
        setError(data.error || 'Error al cargar estadísticas');
      }
    } catch (error) {
      console.error('Error fetching cache stats:', error);
      setError('Error de conexión. Verifica que el servidor esté funcionando.');
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async (cacheName?: string) => {
    setClearing(cacheName || 'all');
    
    try {
      const url = cacheName 
        ? `/api/admin/cache-stats?cache=${cacheName}`
        : '/api/admin/cache-stats';
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
        },
        credentials: 'same-origin'
      });
      
      if (response.ok) {
        // Refrescar estadísticas
        await fetchStats();
        alert(cacheName ? `Caché ${cacheName} limpiado` : 'Todos los cachés limpiados');
      } else {
        const errorData = await response.json();
        alert(`Error al limpiar caché: ${errorData.error || response.status}`);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Error al limpiar caché');
    } finally {
      setClearing(null);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getHitRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Cargando estadísticas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold">Error al cargar estadísticas</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchStats();
            }}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">No se pudieron cargar las estadísticas</p>
      </div>
    );
  }

  const cacheTypes = [
    { key: 'stations', name: 'Estaciones', icon: Radio, color: 'blue' },
    { key: 'programs', name: 'Programas', icon: Music, color: 'green' },
    { key: 'currentProgram', name: 'Programa Actual', icon: Activity, color: 'orange' },
    { key: 'images', name: 'Imágenes', icon: Database, color: 'purple' }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart className="w-5 h-5" />
          Monitor de Caché
        </h2>
        
        <div className="flex gap-2">
          <button
            onClick={() => fetchStats()}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center gap-2 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
          
          <button
            onClick={() => clearCache()}
            disabled={clearing === 'all'}
            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {clearing === 'all' ? 'Limpiando...' : 'Limpiar Todo'}
          </button>
        </div>
      </div>

      {/* Estadísticas Globales */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Hits</p>
          <p className="text-2xl font-bold text-green-600">{stats.global.totalHits}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Misses</p>
          <p className="text-2xl font-bold text-red-600">{stats.global.totalMisses}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Hit Rate Global</p>
          <p className={`text-2xl font-bold ${getHitRateColor(parseFloat(stats.global.hitRate))}`}>
            {stats.global.hitRate}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Sets</p>
          <p className="text-2xl font-bold text-blue-600">{stats.global.totalSets}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Deletes</p>
          <p className="text-2xl font-bold text-orange-600">{stats.global.totalDeletes}</p>
        </div>
      </div>

      {/* Estadísticas por Caché */}
      <div className="space-y-4">
        {cacheTypes.map(({ key, name, icon: Icon, color }) => {
          const cacheStats = stats.byCache[key];
          const memory = stats.memory[key];
          
          if (!cacheStats || !memory) return null;
          
          const colorClasses = {
            blue: 'bg-blue-50 border-blue-200',
            green: 'bg-green-50 border-green-200',
            orange: 'bg-orange-50 border-orange-200',
            purple: 'bg-purple-50 border-purple-200'
          };
          
          return (
            <div key={key} className={`border rounded-lg p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4" />
                    {name}
                  </h3>
                  
                  <div className="grid grid-cols-6 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Hits:</span>
                      <span className="ml-1 font-medium text-green-600">{cacheStats.hits}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Misses:</span>
                      <span className="ml-1 font-medium text-red-600">{cacheStats.misses}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Hit Rate:</span>
                      <span className={`ml-1 font-medium ${getHitRateColor(cacheStats.hitRate)}`}>
                        {cacheStats.hitRate.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Sets:</span>
                      <span className="ml-1 font-medium">{cacheStats.sets}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Keys:</span>
                      <span className="ml-1 font-medium">{memory.keys}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tamaño:</span>
                      <span className="ml-1 font-medium">{formatBytes(memory.size)}</span>
                    </div>
                  </div>
                  
                  {/* Barra de progreso visual del hit rate */}
                  <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        cacheStats.hitRate >= 80 ? 'bg-green-600' :
                        cacheStats.hitRate >= 60 ? 'bg-yellow-600' :
                        'bg-red-600'
                      }`}
                      style={{ width: `${cacheStats.hitRate}%` }}
                    />
                  </div>
                </div>
                
                <button
                  onClick={() => clearCache(key)}
                  disabled={clearing === key}
                  className="ml-4 p-2 bg-white hover:bg-gray-100 rounded-lg transition disabled:opacity-50 border border-gray-300"
                  title={`Limpiar caché de ${name}`}
                >
                  {clearing === key ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Última actualización */}
      <div className="mt-4 text-sm text-gray-500 text-right">
        Última actualización: {new Date(stats.timestamp).toLocaleString('es-PE')}
      </div>
    </div>
  );
}