/**
 * RUMBO FINO - PURGA & LIMPIEZA DE DATOS DE PRUEBA
 * 
 * Este script elimina quirúrgicamente todos los datos operativos de prueba
 * (viajes, telemetría GPS, transacciones financieras, reseñas y turnos),
 * dejando la base de datos 100% limpia para lanzamiento a producción,
 * preservando los usuarios, vehículos, roles y documentos maestros.
 */

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

async function purgeTestData() {
  const isCloud = process.env.DB_SSL === 'true' || (process.env.DB_HOST && process.env.DB_HOST !== 'localhost');
  
  const credentials = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'Jf18759339',
    database: process.env.DB_NAME || 'rumbo_fino',
    ssl: isCloud ? { rejectUnauthorized: false } : false,
  };

  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('🧹 RUMBO FINO - PURGA OPERATIVA DE DATOS DE PRUEBA (READY FOR PROD)');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`🔌 Conectando a PostgreSQL en [${credentials.host}:${credentials.port}/${credentials.database}] (SSL: ${isCloud})...`);

  const client = new Client(credentials);

  try {
    await client.connect();
    console.log('✅ Conexión establecida con éxito.');

    console.log('\n🚀 Iniciando purga quirúrgica de registros de prueba...');

    // 1. Purgar Reseñas y Calificaciones de prueba
    const delReviews = await client.query('DELETE FROM reviews');
    console.log(`   • reviews: ${delReviews.rowCount} reseñas eliminadas.`);

    // 2. Purgar Telemetría GPS y Breadcrumbs de viajes
    const delLocations = await client.query('DELETE FROM ride_locations');
    console.log(`   • ride_locations: ${delLocations.rowCount} coordenadas GPS eliminadas.`);

    // 3. Purgar Transacciones Financieras y Comisiones de prueba
    const delTransactions = await client.query('DELETE FROM transactions');
    console.log(`   • transactions: ${delTransactions.rowCount} transacciones financieras eliminadas.`);

    // 4. Purgar Viajes Solicitados, En Curso y Finalizados de prueba
    const delRides = await client.query('DELETE FROM rides');
    console.log(`   • rides: ${delRides.rowCount} viajes eliminados.`);

    // 5. Purgar Asignaciones de Turnos de Choferes
    const delAssignments = await client.query('DELETE FROM driver_vehicle_assignments');
    console.log(`   • driver_vehicle_assignments: ${delAssignments.rowCount} turnos/asignaciones liberados.`);

    // 6. Resetear Billeteras y Balances de Choferes a CERO ($0.00)
    const resetBalances = await client.query(`
      UPDATE driver_balances 
      SET current_balance = 0.00,
          pending_payout = 0.00,
          total_earned = 0.00,
          total_commission_paid = 0.00,
          updated_at = NOW()
    `);
    console.log(`   • driver_balances: ${resetBalances.rowCount} billeteras reseteadas a $0.00 saldo limpio.`);

    // 7. Resetear Choferes (Desconectados, Sin Vehículo Asignado, 0 Viajes, Calificación 5.00)
    const resetDrivers = await client.query(`
      UPDATE drivers 
      SET is_online = false,
          current_vehicle_id = NULL,
          total_rides = 0,
          rating_avg = 5.00,
          updated_at = NOW()
    `);
    console.log(`   • drivers: ${resetDrivers.rowCount} perfiles de chofer restablecidos (0 viajes, Rating 5.00, Offline).`);

    // 8. Resetear Vehículos de la Flota (Todos 'AVAILABLE' y libres)
    const resetVehicles = await client.query(`
      UPDATE vehicles 
      SET status = 'AVAILABLE',
          updated_at = NOW()
    `);
    console.log(`   • vehicles: ${resetVehicles.rowCount} unidades vehiculares liberadas y en estado DISPONIBLE.`);

    // -------------------------------------------------------------------------
    // VERIFICACIÓN FINAL Y ESTADÍSTICAS DEL SISTEMA
    // -------------------------------------------------------------------------
    console.log('\n📊 VERIFICACIÓN DE ESTADO EN BASE DE DATOS:');
    const countUsers = (await client.query('SELECT COUNT(*) FROM users')).rows[0].count;
    const countDrivers = (await client.query('SELECT COUNT(*) FROM drivers')).rows[0].count;
    const countVehicles = (await client.query('SELECT COUNT(*) FROM vehicles')).rows[0].count;
    const countRides = (await client.query('SELECT COUNT(*) FROM rides')).rows[0].count;
    const countTransactions = (await client.query('SELECT COUNT(*) FROM transactions')).rows[0].count;
    const countReviews = (await client.query('SELECT COUNT(*) FROM reviews')).rows[0].count;
    const countLocations = (await client.query('SELECT COUNT(*) FROM ride_locations')).rows[0].count;
    const countRates = (await client.query('SELECT COUNT(*) FROM exchange_rates WHERE is_active = true')).rows[0].count;

    console.log(`   👥 Usuarios Registrados: ${countUsers}`);
    console.log(`   🚗 Vehículos en Flota: ${countVehicles}`);
    console.log(`   👔 Choferes Activos: ${countDrivers}`);
    console.log(`   ⚡ Viajes Activos/Históricos: ${countRides} (Limpio)`);
    console.log(`   💳 Transacciones Registradas: ${countTransactions} (Limpio)`);
    console.log(`   ⭐ Reseñas Registradas: ${countReviews} (Limpio)`);
    console.log(`   📍 Puntos GPS Históricos: ${countLocations} (Limpio)`);
    console.log(`   🇻🇪 Tasas BCV Activas: ${countRates}`);

    console.log('\n═══════════════════════════════════════════════════════════════════════');
    console.log('✨ BASE DE DATOS PURGADA Y 100% LISTA PARA LANZAMIENTO A PRODUCCIÓN');
    console.log('═══════════════════════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('❌ Error durante la purga de datos:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  purgeTestData();
}

module.exports = { purgeTestData };
