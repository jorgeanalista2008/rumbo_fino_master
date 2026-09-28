const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.substring(0, eqIdx).trim();
        const val = trimmed.substring(eqIdx + 1).trim().replace(/(^['"]|['"]$)/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

loadEnvFile(path.join(__dirname, '..', '.env.production'));
loadEnvFile(path.join(__dirname, '..', 'backend', '.env.production'));
loadEnvFile(path.join(__dirname, '..', 'backend', '.env'));

let Client;
try {
  Client = require('pg').Client;
} catch (e) {
  try {
    Client = require('../backend/node_modules/pg').Client;
  } catch (e2) {
    Client = require('../node_modules/pg').Client;
  }
}

async function purgeAllOperationalData() {
  const isCloud = process.env.DB_SSL === 'true' || (process.env.DB_HOST && process.env.DB_HOST !== 'localhost');
  
  const credentials = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'Jf18759339',
    database: process.env.DB_NAME || 'postgres',
    ssl: isCloud ? { rejectUnauthorized: false } : false,
  };

  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('🧹 RUMBO FINO - PURGA TOTAL LIMPIA PARA LLENADO DESDE BACKOFFICE');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`🔌 Conectando a PostgreSQL [${credentials.host}:${credentials.port}/${credentials.database}]...`);

  const client = new Client(credentials);

  try {
    await client.connect();
    console.log('✅ Conexión establecida con éxito a Supabase PostgreSQL.\n');

    // 1. Reseñas
    const delReviews = await client.query('DELETE FROM reviews');
    console.log(`   • reviews: ${delReviews.rowCount} eliminadas.`);

    // 2. Telemetría GPS
    const delLocations = await client.query('DELETE FROM ride_locations');
    console.log(`   • ride_locations: ${delLocations.rowCount} coordenadas eliminadas.`);

    // 3. Transacciones
    const delTransactions = await client.query('DELETE FROM transactions');
    console.log(`   • transactions: ${delTransactions.rowCount} eliminadas.`);

    // 4. Viajes
    const delRides = await client.query('DELETE FROM rides');
    console.log(`   • rides: ${delRides.rowCount} eliminados.`);

    // 5. Asignaciones de Vehículos
    const delAssignments = await client.query('DELETE FROM driver_vehicle_assignments');
    console.log(`   • driver_vehicle_assignments: ${delAssignments.rowCount} liberadas.`);

    // 6. Documentos de Choferes
    const delDriverDocs = await client.query('DELETE FROM driver_documents');
    console.log(`   • driver_documents: ${delDriverDocs.rowCount} eliminados.`);

    // 7. Balances de Choferes
    const delBalances = await client.query('DELETE FROM driver_balances');
    console.log(`   • driver_balances: ${delBalances.rowCount} eliminados.`);

    // 8. Documentos de Vehículos
    const delVehDocs = await client.query('DELETE FROM vehicle_documents');
    console.log(`   • vehicle_documents: ${delVehDocs.rowCount} eliminados.`);

    // 9. Reset / Borrar Choferes
    const delDrivers = await client.query('DELETE FROM drivers');
    console.log(`   • drivers: ${delDrivers.rowCount} choferes eliminados (listos para registrar desde backoffice).`);

    // 10. Reset / Borrar Vehículos
    const delVehicles = await client.query('DELETE FROM vehicles');
    console.log(`   • vehicles: ${delVehicles.rowCount} vehículos eliminados (listos para registrar desde backoffice).`);

    // 11. Eliminar usuarios no administradores (Mantener SUPER_ADMIN admin@rumbofino.com)
    const delUsers = await client.query(`DELETE FROM users WHERE role != 'SUPER_ADMIN' AND email != 'admin@rumbofino.com'`);
    console.log(`   • users: ${delUsers.rowCount} usuarios secundarios eliminados (Super Admin conservado).`);

    console.log('\n📊 ESTADO FINAL DE LA BASE DE DATOS TRAS LA PURGA:');
    const countUsers = (await client.query('SELECT COUNT(*) FROM users')).rows[0].count;
    const countDrivers = (await client.query('SELECT COUNT(*) FROM drivers')).rows[0].count;
    const countVehicles = (await client.query('SELECT COUNT(*) FROM vehicles')).rows[0].count;
    const countRides = (await client.query('SELECT COUNT(*) FROM rides')).rows[0].count;
    const countLocations = (await client.query('SELECT COUNT(*) FROM ride_locations')).rows[0].count;
    const countRates = (await client.query('SELECT COUNT(*) FROM exchange_rates WHERE is_active = true')).rows[0].count;

    console.log(`   👑 Super Admins Activos: ${countUsers}`);
    console.log(`   🚗 Vehículos: ${countVehicles} (Limpio)`);
    console.log(`   👔 Choferes: ${countDrivers} (Limpio)`);
    console.log(`   ⚡ Viajes: ${countRides} (Limpio)`);
    console.log(`   📍 Puntos GPS: ${countLocations} (Limpio)`);
    console.log(`   🇻🇪 Tasas BCV Activas: ${countRates}`);

    console.log('\n═══════════════════════════════════════════════════════════════════════');
    console.log('✨ PURGA COMPLETADA: Sistema listo para creación desde Backoffice Online');
    console.log('═══════════════════════════════════════════════════════════════════════\n');
  } catch (err) {
    console.error('❌ Error ejecutando purga total:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  purgeAllOperationalData();
}

module.exports = { purgeAllOperationalData };
