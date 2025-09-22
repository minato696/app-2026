// src/lib/cache.ts
import NodeCache from 'node-cache';

// Configuración de diferentes cachés con TTL específicos
const cacheConfig = {
  // Datos que cambian poco frecuentemente
  stations: { stdTTL: 3600, checkperiod: 600 }, // 1 hora
  programs: { stdTTL: 1800, checkperiod: 300 }, // 30 minutos
  currentProgram: { stdTTL: 60, checkperiod: 30 }, // 1 minuto
  images: { stdTTL: 86400, checkperiod: 3600 }, // 24 horas
};

// Crear instancias de caché
const stationsCache = new NodeCache(cacheConfig.stations);
const programsCache = new NodeCache(cacheConfig.programs);
const currentProgramCache = new NodeCache(cacheConfig.currentProgram);
const imagesCache = new NodeCache(cacheConfig.images);

// Estadísticas de caché
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

class CacheManager {
  private stats: Map<string, CacheStats> = new Map();

  constructor() {
    // Inicializar estadísticas
    ['stations', 'programs', 'currentProgram', 'images'].forEach(cache => {
      this.stats.set(cache, {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        hitRate: 0
      });
    });

    // Eventos de caché para estadísticas
    this.setupCacheEvents();
  }

  private setupCacheEvents() {
    // Configurar eventos para cada caché
    const caches = [
      { name: 'stations', instance: stationsCache },
      { name: 'programs', instance: programsCache },
      { name: 'currentProgram', instance: currentProgramCache },
      { name: 'images', instance: imagesCache }
    ];

    caches.forEach(({ name, instance }) => {
      instance.on('hit', () => this.recordHit(name));
      instance.on('miss', () => this.recordMiss(name));
      instance.on('set', () => this.recordSet(name));
      instance.on('del', () => this.recordDelete(name));
    });
  }

  private recordHit(cacheName: string) {
    const stats = this.stats.get(cacheName)!;
    stats.hits++;
    this.updateHitRate(cacheName);
  }

  private recordMiss(cacheName: string) {
    const stats = this.stats.get(cacheName)!;
    stats.misses++;
    this.updateHitRate(cacheName);
  }

  private recordSet(cacheName: string) {
    const stats = this.stats.get(cacheName)!;
    stats.sets++;
  }

  private recordDelete(cacheName: string) {
    const stats = this.stats.get(cacheName)!;
    stats.deletes++;
  }

  private updateHitRate(cacheName: string) {
    const stats = this.stats.get(cacheName)!;
    const total = stats.hits + stats.misses;
    stats.hitRate = total > 0 ? (stats.hits / total) * 100 : 0;
  }

  // Métodos públicos para obtener estadísticas
  getStats(cacheName?: string): CacheStats | Map<string, CacheStats> {
    if (cacheName) {
      return this.stats.get(cacheName)!;
    }
    return this.stats;
  }

  // Limpiar todos los cachés
  clearAll() {
    stationsCache.flushAll();
    programsCache.flushAll();
    currentProgramCache.flushAll();
    imagesCache.flushAll();
    console.log('✅ Todos los cachés han sido limpiados');
  }

  // Obtener información de uso de memoria
  getMemoryUsage() {
    return {
      stations: {
        keys: stationsCache.keys().length,
        size: JSON.stringify(stationsCache.data).length
      },
      programs: {
        keys: programsCache.keys().length,
        size: JSON.stringify(programsCache.data).length
      },
      currentProgram: {
        keys: currentProgramCache.keys().length,
        size: JSON.stringify(currentProgramCache.data).length
      },
      images: {
        keys: imagesCache.keys().length,
        size: JSON.stringify(imagesCache.data).length
      }
    };
  }
}

// Instancia única del manager
export const cacheManager = new CacheManager();

// Funciones de caché específicas

// Cache de estaciones
export const stationsCacheUtils = {
  get: (key: string): any => stationsCache.get(key),
  set: (key: string, value: any, ttl?: number): boolean => 
    stationsCache.set(key, value, ttl || cacheConfig.stations.stdTTL),
  del: (key: string): number => stationsCache.del(key),
  has: (key: string): boolean => stationsCache.has(key),
  flush: (): void => stationsCache.flushAll()
};

// Cache de programas
export const programsCacheUtils = {
  get: (key: string): any => programsCache.get(key),
  set: (key: string, value: any, ttl?: number): boolean => 
    programsCache.set(key, value, ttl || cacheConfig.programs.stdTTL),
  del: (key: string): number => programsCache.del(key),
  has: (key: string): boolean => programsCache.has(key),
  flush: (): void => programsCache.flushAll(),
  
  // Método especial para invalidar programas de una estación
  invalidateStation: (stationId: string): void => {
    const keys = programsCache.keys();
    keys.forEach(key => {
      if (key.includes(stationId)) {
        programsCache.del(key);
      }
    });
  }
};

// Cache de programa actual
export const currentProgramCacheUtils = {
  get: (stationId: string): any => currentProgramCache.get(`current_${stationId}`),
  set: (stationId: string, value: any): boolean => 
    currentProgramCache.set(`current_${stationId}`, value),
  del: (stationId: string): number => currentProgramCache.del(`current_${stationId}`),
  has: (stationId: string): boolean => currentProgramCache.has(`current_${stationId}`),
  flush: (): void => currentProgramCache.flushAll()
};

// Cache de imágenes procesadas
export const imagesCacheUtils = {
  get: (url: string): any => imagesCache.get(url),
  set: (url: string, value: any, ttl?: number): boolean => 
    imagesCache.set(url, value, ttl || cacheConfig.images.stdTTL),
  del: (url: string): number => imagesCache.del(url),
  has: (url: string): boolean => imagesCache.has(url),
  flush: (): void => imagesCache.flushAll()
};

// Función para precalentar el caché
export async function warmUpCache() {
  console.log('🔥 Calentando caché...');
  
  try {
    // Aquí puedes agregar lógica para precargar datos importantes
    // Por ejemplo, cargar todas las estaciones
    const { getStations } = await import('./dataManager');
    const stations = await getStations();
    stationsCacheUtils.set('all_stations', { success: true, data: stations });
    
    console.log('✅ Caché precalentado exitosamente');
  } catch (error) {
    console.error('❌ Error precalentando caché:', error);
  }
}

// Exportar la instancia principal para uso directo si es necesario
export { stationsCache, programsCache, currentProgramCache, imagesCache };