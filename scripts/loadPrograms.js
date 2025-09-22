// scripts/loadPrograms.js
const fs = require('fs').promises;
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'data.json');

// Programación de Lunes a Viernes
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

// Programación del Sábado
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

// Programación del Domingo
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

async function loadPrograms() {
  try {
    console.log('📻 Cargando programación para todas las estaciones...\n');
    
    // Leer el archivo data.json existente
    const dataContent = await fs.readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(dataContent);
    
    // Limpiar programas existentes
    data.programs = [];
    
    let programId = 1;
    
    // Para cada estación, agregar todos los programas
    for (const station of data.stations) {
      console.log(`\n📡 Cargando programas para ${station.name}...`);
      let stationProgramCount = 0;
      
      // Programas de Lunes a Viernes
      for (const program of weekdayPrograms) {
        data.programs.push({
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
        stationProgramCount++;
      }
      
      // Programas de Sábado
      for (const program of saturdayPrograms) {
        data.programs.push({
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
        stationProgramCount++;
      }
      
      // Programas de Domingo
      for (const program of sundayPrograms) {
        data.programs.push({
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
        stationProgramCount++;
      }
      
      console.log(`   ✅ ${stationProgramCount} programas cargados`);
    }
    
    // Guardar el archivo actualizado
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    
    console.log(`\n✅ Total de programas cargados: ${data.programs.length}`);
    console.log(`   (${weekdayPrograms.length} lun-vie + ${saturdayPrograms.length} sábado + ${sundayPrograms.length} domingo) x ${data.stations.length} estaciones`);
    console.log('\n🎉 ¡Programación cargada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  loadPrograms();
}

module.exports = loadPrograms;