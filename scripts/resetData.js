// scripts/resetData.js
const fs = require('fs');
const path = require('path');

const dataFile = path.join(process.cwd(), 'data.json');

console.log('🔄 Reseteando archivo data.json...\n');

// Verificar si existe
if (fs.existsSync(dataFile)) {
  // Hacer backup
  const backupFile = path.join(process.cwd(), `data.backup.${Date.now()}.json`);
  fs.copyFileSync(dataFile, backupFile);
  console.log(`✅ Backup creado: ${backupFile}`);
  
  // Eliminar archivo actual
  fs.unlinkSync(dataFile);
  console.log('✅ Archivo data.json eliminado');
  console.log('\n📝 El archivo se recreará automáticamente con la nueva estructura cuando inicies el servidor');
} else {
  console.log('ℹ️ El archivo data.json no existe');
}

console.log('\n🚀 Ahora ejecuta: npm run dev');