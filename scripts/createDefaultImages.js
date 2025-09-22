// scripts/createDefaultImages.js
const fs = require('fs');
const path = require('path');

// Directorio de imágenes de estaciones
const stationsDir = path.join(process.cwd(), 'public', 'images', 'stations');

// Crear directorio si no existe
if (!fs.existsSync(stationsDir)) {
  fs.mkdirSync(stationsDir, { recursive: true });
  console.log('Directorio de imágenes de estaciones creado');
}

// Estaciones para las que crear imágenes
const stations = ['lima', 'arequipa', 'trujillo', 'chiclayo'];

// SVG simple para cada estación (un círculo con texto)
function createStationSVG(name) {
  const colors = {
    lima: '#D70007',
    arequipa: '#D70007',
    trujillo: '#D70007',
    chiclayo: '#D70007'
  };
  
  const color = colors[name] || '#D70007';
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="98" fill="${color}" />
    <circle cx="100" cy="100" r="88" fill="white" />
    <circle cx="100" cy="100" r="78" fill="${color}" />
    <text x="100" y="110" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="white" font-weight="bold">${name.toUpperCase()}</text>
  </svg>`;
}

// Crear SVG y guardar como PNG para cada estación
stations.forEach(station => {
  const svgContent = createStationSVG(station);
  const filePath = path.join(stationsDir, `${station}-default.png`);
  
  // Si el archivo no existe, crearlo
  if (!fs.existsSync(filePath)) {
    // Crear un archivo de imagen básico (el SVG se convierte a PNG en la implementación real)
    // Como esto es solo un script básico, simplemente guardaremos el SVG como archivo
    fs.writeFileSync(
      filePath.replace('.png', '.svg'), 
      svgContent, 
      'utf8'
    );
    console.log(`Imagen SVG creada para ${station}`);
  }
});

console.log('Imágenes predeterminadas generadas. Copia los SVG a PNG o ejecuta un conversor SVG a PNG.');