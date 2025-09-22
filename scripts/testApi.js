// scripts/testApi.js
const BASE_URL = 'http://localhost:3000';

async function testStationsAPI() {
  console.log('🧪 Probando API de estaciones...\n');

  // Test GET
  console.log('1️⃣ Probando GET /api/stations');
  try {
    const response = await fetch(`${BASE_URL}/api/stations`, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json'
      }
    });
    const data = await response.json();
    console.log(`✅ GET funcionando - ${data.data?.length || 0} estaciones encontradas\n`);
  } catch (error) {
    console.log(`❌ Error en GET: ${error.message}\n`);
  }

  // Test POST
  console.log('2️⃣ Probando POST /api/stations');
  try {
    const response = await fetch(`${BASE_URL}/api/stations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Station',
        url: 'https://test.stream.com',
        city: 'Test City',
        frequency: '99.9 FM'
      })
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ POST funcionando - Estación creada con ID: ${data.data?.id}\n`);
    } else {
      console.log(`❌ Error en POST: ${data.error}\n`);
    }
  } catch (error) {
    console.log(`❌ Error en POST: ${error.message}\n`);
  }
}

// Función principal
async function main() {
  try {
    // Verificar que el servidor esté corriendo
    const response = await fetch(BASE_URL);
    if (response.ok) {
      console.log('✅ Servidor corriendo en', BASE_URL);
      await testStationsAPI();
    }
  } catch (error) {
    console.log('❌ El servidor no está corriendo. Ejecuta: npm run dev');
  }
}

// Ejecutar
main();