// src/lib/dataManager.ts - VERSIÓN COMPLETA CON CACHÉ
import fs from 'fs/promises';
import path from 'path';
import { 
  stationsCacheUtils, 
  programsCacheUtils, 
  currentProgramCacheUtils 
} from './cache';

const DATA_FILE = path.join(process.cwd(), 'data.json');

export interface Station {
  id: string;
  name: string;
  url: string;
  image?: string;
  frequency?: string;
  city?: string;
  description?: string;
}

export interface Program {
  id: string;
  station_id: string;
  name: string;
  host: string;
  start_time: string;
  end_time: string;
  image: string;
  days: string[];
}

export interface RadioData {
  stations: Station[];
  programs: Program[];
}

// Cache para el archivo completo (5 minutos)
let fileCache: { data: RadioData | null; timestamp: number } = {
  data: null,
  timestamp: 0
};
const FILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Función auxiliar para comparar horas en formato "HH:MM"
function compareTimeStrings(time1: string, time2: string): number {
  const [hours1, minutes1] = time1.split(':').map(Number);
  const [hours2, minutes2] = time2.split(':').map(Number);
  
  if (hours1 !== hours2) {
    return hours1 - hours2;
  }
  
  return minutes1 - minutes2;
}

// Función para ordenar programas por días y horario
function sortPrograms(programs: Program[]): Program[] {
  // Orden de días de la semana (comenzando con Lunes)
  const dayOrder: { [key: string]: number } = {
    'Lunes': 0,
    'Martes': 1,
    'Miércoles': 2,
    'Jueves': 3,
    'Viernes': 4,
    'Sábado': 5,
    'Domingo': 6
  };

  return [...programs].sort((a, b) => {
    // Primero ordenar por el primer día de emisión
    const firstDayA = a.days[0] || '';
    const firstDayB = b.days[0] || '';
    
    const dayComparison = dayOrder[firstDayA] - dayOrder[firstDayB];
    if (dayComparison !== 0) {
      return dayComparison;
    }
    
    // Si los días son iguales, ordenar por hora de inicio
    return compareTimeStrings(a.start_time, b.start_time);
  });
}

// Inicializar archivo de datos si no existe
async function initDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    const initialData: RadioData = {
      stations: [
        {
          id: "lima",
          name: "Lima",
          url: "https://radios-player-exitosa.mediaserver.digital/exitosa.chiclayo",
          image: "/images/stations/1752245607379-f9si3p.jpg",
          frequency: "95.5 FM",
          city: "Lima, Perú",
          description: "La estación principal de Radio Exitosa en la capital del Perú"
        },
        {
          id: "arequipa",
          name: "Arequipa",
          url: "https://neptuno-3-audio.mediaserver.digital/e_arequipa",
          image: "/images/stations/1752245619584-g4ffj.jpg",
          frequency: "104.9 FM",
          city: "Arequipa, Perú",
          description: "Transmitiendo desde la Ciudad Blanca"
        },
        {
          id: "trujillo",
          name: "Trujillo",
          url: "https://radios-player-exitosa.mediaserver.digital/exitosa.trujillo",
          image: "/images/stations/1752245627866-a2gt25.jpg",
          frequency: "103.3 FM",
          city: "Trujillo, Perú",
          description: "La voz de la Ciudad de la Eterna Primavera"
        },
        {
          id: "chiclayo",
          name: "Chiclayo",
          url: "https://radios-player-exitosa.mediaserver.digital/exitosa.chiclayo",
          image: "/images/stations/1752245634342-tow063.jpg",
          frequency: "98.9 FM",
          city: "Chiclayo, Perú",
          description: "Conectando con el norte del Perú"
        }
      ],
      programs: []
    };
    
    // Agregar todos los programas para cada estación
    const weekdayPrograms = [
      { name: "La Hora Esotérica", host: "Soralla De Los Angeles", start_time: "00:00", end_time: "01:00" },
      { name: "Usted Tiene Derecho", host: "Mario Camacho Perla", start_time: "01:00", end_time: "02:00" },
      { name: "La Voz De Los Pueblos", host: "Jack Miranda y Marcial De La Cruz", start_time: "02:00", end_time: "05:00" },
      { name: "Exitosa Perú", host: "Pedro Paredes", start_time: "05:00", end_time: "08:00" },
      { name: "Hablemos Claro", host: "Nicolás Lúcar", start_time: "08:00", end_time: "11:00" },
      { name: "Exitosa Te Escucha", host: "Katyusca Torres Aybar", start_time: "11:00", end_time: "14:00" },
      { name: "Exitosa Deportes", host: "Gonzalo Núñez, Óscar Paz y Jean Rodríguez", start_time: "14:00", end_time: "16:00" },
      { name: "Contra El Tráfico", host: "Ricardo Rondón", start_time: "16:00", end_time: "18:00" },
      { name: "Médicos En Acción", host: "Armando Massé", start_time: "18:00", end_time: "19:00" },
      { name: "Informamos y Opinamos", host: "Karina Novoa", start_time: "19:00", end_time: "22:00" },
      { name: "Exitosa Noticias", host: "Juriko Novoa", start_time: "22:00", end_time: "23:00" },
      { name: "Despierta Tus Emociones", host: "José Poicón", start_time: "23:00", end_time: "00:00" }
    ];

    const saturdayPrograms = [
      { name: "La Hora Esotérica", host: "Esotéricos", start_time: "00:00", end_time: "01:00" },
      { name: "Educando Mis Emociones", host: "Dra. Danila Villegas", start_time: "01:00", end_time: "02:00" },
      { name: "La Voz De Los Pueblos", host: "Jack Miranda", start_time: "02:00", end_time: "05:00" },
      { name: "Exitosa Perú", host: "Pedro Paredes", start_time: "05:00", end_time: "08:00" },
      { name: "Hablemos Claro", host: "Jesús Verde", start_time: "08:00", end_time: "11:00" },
      { name: "Construyendo Cimientos Para El Futuro", host: "Jose Cieza", start_time: "11:00", end_time: "12:00" },
      { name: "Derrama Magisterial", host: "Carlos Cornejo", start_time: "12:00", end_time: "13:00" },
      { name: "Exitosa Deportes", host: "Óscar Paz", start_time: "13:00", end_time: "15:00" },
      { name: "Exitosa Sábado", host: "Katyusca Torres Aybar", start_time: "15:00", end_time: "18:00" },
      { name: "La Hora Del Volante", host: "Tito Alvites", start_time: "18:00", end_time: "20:00" },
      { name: "Exitosa Te Escucha", host: "Jorge Valdez", start_time: "20:00", end_time: "22:00" },
      { name: "Noche Esotérica", host: "Vidente Hayimy", start_time: "22:00", end_time: "00:00" }
    ];

    const sundayPrograms = [
      { name: "Noche Esotérica", host: "Vidente Hayimy", start_time: "00:00", end_time: "01:00" },
      { name: "La Voz de los Pueblos", host: "Hierbero", start_time: "01:00", end_time: "02:00" },
      { name: "La Voz de los Pueblos", host: "Marcial de la Cruz", start_time: "02:00", end_time: "06:00" },
      { name: "Exitosa Perú", host: "Piura", start_time: "06:00", end_time: "07:00" },
      { name: "Exitosa Perú", host: "Cusco", start_time: "07:00", end_time: "08:00" },
      { name: "Exitosa Perú", host: "Arequipa", start_time: "08:00", end_time: "09:00" },
      { name: "Exitosa Perú", host: "Trujillo", start_time: "09:00", end_time: "10:00" },
      { name: "En Defensa de la Verdad", host: "Cecilia García", start_time: "10:00", end_time: "12:00" },
      { name: "Exitosa Perú", host: "Chiclayo", start_time: "12:00", end_time: "13:00" },
      { name: "Exitosa Perú", host: "Huancayo", start_time: "13:00", end_time: "14:00" },
      { name: "Exitosa Perú", host: "Huacho", start_time: "14:00", end_time: "15:00" },
      { name: "Exitosa Perú", host: "Ica", start_time: "15:00", end_time: "16:00" },
      { name: "Exitosa Perú", host: "Iquitos", start_time: "16:00", end_time: "17:00" },
      { name: "Exitosa Perú", host: "Tacna", start_time: "17:00", end_time: "18:00" },
      { name: "Exitosa Perú", host: "Tarapoto", start_time: "18:00", end_time: "19:00" },
      { name: "Médicos en Acción", host: "Daniel Bueno", start_time: "19:00", end_time: "21:00" },
      { name: "Exitosa Deportes", host: "Óscar Paz", start_time: "21:00", end_time: "22:00" },
      { name: "Noche Esotérica", host: "Vidente Hayimy", start_time: "22:00", end_time: "00:00" }
    ];
    
    let programId = 1;
    
    // Para cada estación, agregar todos los programas
    for (const station of initialData.stations) {
      // Programas de Lunes a Viernes
      for (const program of weekdayPrograms) {
        initialData.programs.push({
          id: programId.toString(),
          station_id: station.id,
          name: program.name,
          host: program.host,
          start_time: program.start_time,
          end_time: program.end_time,
          image: '',
          days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
        });
        programId++;
      }
      
      // Programas de Sábado
      for (const program of saturdayPrograms) {
        initialData.programs.push({
          id: programId.toString(),
          station_id: station.id,
          name: program.name,
          host: program.host,
          start_time: program.start_time,
          end_time: program.end_time,
          image: '',
          days: ['Sábado']
        });
        programId++;
      }
      
      // Programas de Domingo
      for (const program of sundayPrograms) {
        initialData.programs.push({
          id: programId.toString(),
          station_id: station.id,
          name: program.name,
          host: program.host,
          start_time: program.start_time,
          end_time: program.end_time,
          image: '',
          days: ['Domingo']
        });
        programId++;
      }
    }
    
    // Ordenar los programas antes de guardarlos
    initialData.programs = sortPrograms(initialData.programs);
    
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
    console.log(`✅ Archivo data.json creado con ${initialData.programs.length} programas`);
  }
}

// Leer datos con caché de archivo
export async function readData(): Promise<RadioData> {
  const now = Date.now();
  
  // Verificar caché del archivo
  if (fileCache.data && (now - fileCache.timestamp) < FILE_CACHE_TTL) {
    console.log('📁 Datos servidos desde caché de archivo');
    return fileCache.data;
  }
  
  console.log('📁 Leyendo datos desde archivo');
  await initDataFile();
  const data = await fs.readFile(DATA_FILE, 'utf-8');
  const parsed = JSON.parse(data);
  
  // Actualizar caché
  fileCache = {
    data: parsed,
    timestamp: now
  };
  
  return parsed;
}

// Escribir datos e invalidar cachés
export async function writeData(data: RadioData): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  
  // Invalidar todos los cachés relacionados
  fileCache = { data: null, timestamp: 0 };
  stationsCacheUtils.flush();
  programsCacheUtils.flush();
  currentProgramCacheUtils.flush();
  
  console.log('💾 Datos guardados y cachés invalidados');
}

// Obtener todas las estaciones (con caché)
export async function getStations(): Promise<Station[]> {
  const cacheKey = 'all_stations';
  
  // Intentar obtener del caché
  const cached = stationsCacheUtils.get(cacheKey);
  if (cached) {
    console.log('🎯 Estaciones servidas desde caché');
    return cached;
  }
  
  // Si no está en caché, leer y cachear
  const data = await readData();
  stationsCacheUtils.set(cacheKey, data.stations);
  return data.stations;
}

// Obtener todos los programas (con caché)
export async function getPrograms(): Promise<Program[]> {
  const cacheKey = 'all_programs';
  
  const cached = programsCacheUtils.get(cacheKey);
  if (cached) {
    console.log('🎯 Programas servidos desde caché');
    return cached;
  }
  
  const data = await readData();
  const sortedPrograms = sortPrograms(data.programs);
  programsCacheUtils.set(cacheKey, sortedPrograms);
  return sortedPrograms;
}

// Obtener programas por estación (con caché)
export async function getProgramsByStation(stationId: string): Promise<Program[]> {
  const cacheKey = `programs_station_${stationId}`;
  
  const cached = programsCacheUtils.get(cacheKey);
  if (cached) {
    console.log(`🎯 Programas de estación ${stationId} servidos desde caché`);
    return cached;
  }
  
  const data = await readData();
  const programs = data.programs.filter(p => p.station_id === stationId);
  const sortedPrograms = sortPrograms(programs);
  programsCacheUtils.set(cacheKey, sortedPrograms);
  return sortedPrograms;
}

// Obtener programa actual (con caché corto)
export async function getCurrentProgram(stationId: string): Promise<Program | null> {
  // Verificar caché primero
  const cached = currentProgramCacheUtils.get(stationId);
  if (cached !== undefined) {
    console.log(`🎯 Programa actual de ${stationId} servido desde caché`);
    return cached;
  }
  
  const data = await readData();
  
  // Obtener hora de Perú (UTC-5)
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const peruTime = new Date(utc + (3600000 * -5));
  
  const currentHour = peruTime.getHours();
  const currentMinute = peruTime.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute; // Minutos desde medianoche
  const currentDay = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][peruTime.getDay()];
  
  const stationPrograms = data.programs.filter(p => p.station_id === stationId);
  
  for (const program of stationPrograms) {
    if (!program.days.includes(currentDay)) continue;
    
    // Convertir tiempos a minutos desde medianoche
    const [startHour, startMin] = program.start_time.split(':').map(Number);
    const [endHour, endMin] = program.end_time.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;
    
    // Si el programa termina a las 00:00, significa que termina a medianoche (1440 minutos)
    if (endHour === 0 && endMin === 0 && startHour >= 12) {
      endMinutes = 24 * 60; // 1440 minutos (medianoche)
    }
    
    // Caso 1: Programa normal (no cruza medianoche)
    if (startMinutes < endMinutes) {
      if (currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes) {
        currentProgramCacheUtils.set(stationId, program);
        console.log(`💾 Programa actual de ${stationId} cacheado`);
        return program;
      }
    }
    // Caso 2: Programa que cruza la medianoche (ej: 22:00 - 02:00)
    else if (startMinutes > endMinutes) {
      // Si estamos después del inicio O antes del fin
      if (currentTimeMinutes >= startMinutes || currentTimeMinutes < endMinutes) {
        currentProgramCacheUtils.set(stationId, program);
        console.log(`💾 Programa actual de ${stationId} cacheado`);
        return program;
      }
    }
    // Caso 3: Programa de 24 horas (start = end)
    else if (startMinutes === endMinutes) {
      currentProgramCacheUtils.set(stationId, program);
      console.log(`💾 Programa actual de ${stationId} cacheado`);
      return program; // Siempre activo
    }
  }
  
  // Si no encontramos programa para el día actual, buscar el programa del día anterior que cruza medianoche
  if (currentTimeMinutes < 360) { // Si es antes de las 6 AM
    const yesterdayIndex = peruTime.getDay() === 0 ? 6 : peruTime.getDay() - 1;
    const yesterdayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][yesterdayIndex];
    
    for (const program of stationPrograms) {
      if (!program.days.includes(yesterdayName)) continue;
      
      const [startHour, startMin] = program.start_time.split(':').map(Number);
      const [endHour, endMin] = program.end_time.split(':').map(Number);
      
      // Solo revisar programas que empiezan tarde (después de las 20:00)
      if (startHour >= 20) {
        const endMinutes = endHour * 60 + endMin;
        
        // Si el programa del día anterior cruza a hoy
        if (endHour < 12 && currentTimeMinutes < endMinutes) {
          currentProgramCacheUtils.set(stationId, program);
          console.log(`💾 Programa actual de ${stationId} cacheado`);
          return program;
        }
      }
    }
  }
  
  // Cachear null también para evitar búsquedas repetidas
  currentProgramCacheUtils.set(stationId, null);
  console.log(`💾 Sin programa actual para ${stationId} - cacheado como null`);
  return null;
}

// Crear programa
export async function createProgram(program: Omit<Program, 'id'>): Promise<Program> {
  const data = await readData();
  const newProgram: Program = {
    ...program,
    id: Date.now().toString()
  };
  
  // Agregar el nuevo programa
  data.programs.push(newProgram);
  
  // Ordenar programas antes de guardar
  data.programs = sortPrograms(data.programs);
  
  await writeData(data);
  
  // Invalidar cachés específicos
  programsCacheUtils.del('all_programs');
  programsCacheUtils.del(`programs_station_${program.station_id}`);
  currentProgramCacheUtils.del(program.station_id);
  
  return newProgram;
}

// Actualizar programa
export async function updateProgram(id: string, updates: Partial<Program>): Promise<Program> {
  const data = await readData();
  const index = data.programs.findIndex(p => p.id === id);
  if (index === -1) throw new Error('Programa no encontrado');
  
  const oldProgram = data.programs[index];
  data.programs[index] = { ...oldProgram, ...updates };
  
  // Ordenar programas antes de guardar
  data.programs = sortPrograms(data.programs);
  
  await writeData(data);
  
  // Invalidar cachés específicos
  programsCacheUtils.del('all_programs');
  programsCacheUtils.del(`programs_station_${oldProgram.station_id}`);
  currentProgramCacheUtils.del(oldProgram.station_id);
  
  // Si cambió la estación, invalidar también la nueva
  if (updates.station_id && updates.station_id !== oldProgram.station_id) {
    programsCacheUtils.del(`programs_station_${updates.station_id}`);
    currentProgramCacheUtils.del(updates.station_id);
  }
  
  return data.programs[index];
}

// Eliminar programa
export async function deleteProgram(id: string): Promise<void> {
  const data = await readData();
  const program = data.programs.find(p => p.id === id);
  if (!program) throw new Error('Programa no encontrado');
  
  data.programs = data.programs.filter(p => p.id !== id);
  await writeData(data);
  
  // Invalidar cachés específicos
  programsCacheUtils.del('all_programs');
  programsCacheUtils.del(`programs_station_${program.station_id}`);
  currentProgramCacheUtils.del(program.station_id);
}

// Crear estación
export async function createStation(stationData: Partial<Station>): Promise<Station> {
  const data = await readData();
  const newStation: Station = {
    id: Date.now().toString(),
    name: stationData.name || '',
    url: stationData.url || '',
    image: stationData.image,
    frequency: stationData.frequency,
    city: stationData.city,
    description: stationData.description
  };
  data.stations.push(newStation);
  await writeData(data);
  
  // Invalidar caché de estaciones
  stationsCacheUtils.del('all_stations');
  
  return newStation;
}

// Actualizar estación
export async function updateStation(id: string, updates: Partial<Station>): Promise<Station> {
  const data = await readData();
  const index = data.stations.findIndex(s => s.id === id);
  if (index === -1) throw new Error('Estación no encontrada');
  
  data.stations[index] = { ...data.stations[index], ...updates };
  await writeData(data);
  
  // Invalidar caché de estaciones
  stationsCacheUtils.del('all_stations');
  
  return data.stations[index];
}

// Eliminar estación
export async function deleteStation(id: string): Promise<void> {
  const data = await readData();
  // Eliminar la estación
  data.stations = data.stations.filter(s => s.id !== id);
  // Eliminar todos los programas de esa estación
  data.programs = data.programs.filter(p => p.station_id !== id);
  await writeData(data);
  
  // Invalidar todos los cachés relacionados
  stationsCacheUtils.del('all_stations');
  programsCacheUtils.del('all_programs');
  programsCacheUtils.del(`programs_station_${id}`);
  currentProgramCacheUtils.del(id);
}