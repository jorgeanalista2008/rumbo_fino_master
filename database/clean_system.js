const fs = require('fs');
const path = require('path');

// 1. Cargar variables de entorno
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

// Intentar cargar credenciales de producción o locales
loadEnvFile(path.join(__dirname, '..', 'backend', '.env.production'));
loadEnvFile(path.join(__dirname, '..', '.env.production'));
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

let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (e) {
  try {
    bcrypt = require('../backend/node_modules/bcrypt');
  } catch (e2) {
    bcrypt = require('../node_modules/bcrypt');
  }
}

async function cleanSystem() {
  const isCloud = process.env.DB_SSL === 'true' || (process.env.DB_HOST && process.env.DB_HOST !== 'localhost');

  const credentials = {
    host: process.env.DB_HOST || 'aws-0-ca-central-1.pooler.supabase.com',
    port: Number(process.env.DB_PORT) || 6543,
    user: process.env.DB_USERNAME || 'postgres.cplncxlkwioxdzluwmvr',
    password: process.env.DB_PASSWORD || 'LaqVHpvkRjdk3CTp',
    database: process.env.DB_NAME || 'postgres',
    ssl: isCloud ? { rejectUnauthorized: false } : false,
  };

  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('🧹 RUMBO FINO - LIMPIEZA TOTAL DE DATOS OPERACIONALES');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`🔌 Conectando a Supabase PostgreSQL [${credentials.host}:${credentials.port}/${credentials.database}]...`);

  const client = new Client(credentials);

  try {
    await client.connect();
    console.log('✅ Conexión establecida exitosamente con la base de datos Supabase.\n');

    // 1. Reseñas y calificaciones
    try {
      const res = await client.query('DELETE FROM reviews');
      console.log(`   • reviews: ${res.rowCount} eliminadas.`);
    } catch (e) {
      console.log(`   • reviews: omitida o no existe (${e.message})`);
    }

    // 2. Telemetría GPS
    try {
      const res = await client.query('DELETE FROM ride_locations');
      console.log(`   • ride_locations: ${res.rowCount} puntos GPS eliminados.`);
    } catch (e) {
      console.log(`   • ride_locations: omitida o no existe (${e.message})`);
    }

    // 3. Transacciones contables y financieras
    try {
      const res = await client.query('DELETE FROM transactions');
      console.log(`   • transactions: ${res.rowCount} eliminadas.`);
    } catch (e) {
      console.log(`   • transactions: omitida o no existe (${e.message})`);
    }

    // 4. Viajes (rides)
    try {
      const res = await client.query('DELETE FROM rides');
      console.log(`   • rides: ${res.rowCount} eliminados.`);
    } catch (e) {
      console.log(`   • rides: omitida o no existe (${e.message})`);
    }

    // 5. Asignaciones de vehículos y turnos
    try {
      const res = await client.query('DELETE FROM driver_vehicle_assignments');
      console.log(`   • driver_vehicle_assignments: ${res.rowCount} asignaciones eliminadas.`);
    } catch (e) {
      console.log(`   • driver_vehicle_assignments: omitida o no existe (${e.message})`);
    }

    // 6. Documentos de choferes
    try {
      const res = await client.query('DELETE FROM driver_documents');
      console.log(`   • driver_documents: ${res.rowCount} eliminados.`);
    } catch (e) {
      console.log(`   • driver_documents: omitida o no existe (${e.message})`);
    }

    // 7. Balances y billeteras de choferes
    try {
      const res = await client.query('DELETE FROM driver_balances');
      console.log(`   • driver_balances: ${res.rowCount} billeteras eliminadas.`);
    } catch (e) {
      console.log(`   • driver_balances: omitida o no existe (${e.message})`);
    }

    // 8. Documentos de vehículos
    try {
      const res = await client.query('DELETE FROM vehicle_documents');
      console.log(`   • vehicle_documents: ${res.rowCount} eliminados.`);
    } catch (e) {
      console.log(`   • vehicle_documents: omitida o no existe (${e.message})`);
    }

    // 9. Choferes
    try {
      const res = await client.query('DELETE FROM drivers');
      console.log(`   • drivers: ${res.rowCount} registros de choferes eliminados.`);
    } catch (e) {
      console.log(`   • drivers: omitida o no existe (${e.message})`);
    }

    // 10. Vehículos
    try {
      const res = await client.query('DELETE FROM vehicles');
      console.log(`   • vehicles: ${res.rowCount} vehículos eliminados.`);
    } catch (e) {
      console.log(`   • vehicles: omitida o no existe (${e.message})`);
    }

    // 11. Archivos subidos (fotos, licencias, etc.)
    try {
      const res = await client.query('DELETE FROM uploaded_files');
      console.log(`   • uploaded_files: ${res.rowCount} archivos en base de datos eliminados.`);
    } catch (e) {
      console.log(`   • uploaded_files: omitida o no existe (${e.message})`);
    }

    // 12. Usuarios: Borrar todos EXCEPTO el Super Admin
    try {
      const res = await client.query(`
        DELETE FROM users 
        WHERE role != 'SUPER_ADMIN' 
          AND email != 'admin@rumbofino.com'
      `);
      console.log(`   • users: ${res.rowCount} usuarios eliminados. Solo se conservó el Super Admin.`);
    } catch (e) {
      console.log(`   • users: error al eliminar usuarios (${e.message})`);
    }

    // 13. Asegurar contraseña activa y vigente del Super Admin
    try {
      if (bcrypt) {
        const hash = await bcrypt.hash('Admin123!', 10);
        await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, 'admin@rumbofino.com']);
        console.log('   • Super Admin verificado: credenciales aseguradas ("admin@rumbofino.com" / "Admin123!").');
      }
    } catch (e) {
      console.log(`   • Super Admin password update notice: (${e.message})`);
    }

    console.log('\n═══════════════════════════════════════════════════════════════════════');
    console.log('📊 REPORTE DE INTEGRIDAD TRAS LA LIMPIEZA:');
    console.log('═══════════════════════════════════════════════════════════════════════');

    const remainingUsers = (await client.query('SELECT id, email, role, first_name, last_name FROM users')).rows;
    console.log('👑 Usuarios activos en el sistema:');
    console.table(remainingUsers);

    const counts = {};
    for (const tbl of ['drivers', 'vehicles', 'rides', 'transactions', 'driver_balances', 'uploaded_files']) {
      try {
        const c = await client.query(`SELECT COUNT(*) FROM ${tbl}`);
        counts[tbl] = Number(c.rows[0].count);
      } catch (e) {
        counts[tbl] = 'N/A';
      }
    }
    console.log('📦 Conteos de tablas operacionales:', counts);

    console.log('\n✨ Sistema completamente limpio y listo para operar desde cero.');
    console.log('═══════════════════════════════════════════════════════════════════════\n');
  } catch (err) {
    console.error('❌ Error ejecutando la limpieza:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  cleanSystem();
}

module.exports = { cleanSystem };
