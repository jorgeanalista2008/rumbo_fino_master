const fs = require('fs');
const path = require('path');

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

async function cleanTarget(name, credentials) {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`🧹 LIMPIEZA DE BASE DE DATOS: [${name.toUpperCase()}]`);
  console.log(`🔌 Conectando a ${credentials.host}:${credentials.port}/${credentials.database}...`);
  console.log('═══════════════════════════════════════════════════════════════════════');

  const client = new Client(credentials);

  try {
    await client.connect();
    console.log(`✅ Conectado con éxito a ${name}.\n`);

    const tablesToDelete = [
      'reviews',
      'ride_locations',
      'transactions',
      'rides',
      'driver_vehicle_assignments',
      'driver_documents',
      'driver_balances',
      'vehicle_documents',
      'drivers',
      'vehicles',
      'uploaded_files',
    ];

    for (const tbl of tablesToDelete) {
      try {
        const res = await client.query(`DELETE FROM ${tbl}`);
        console.log(`   • ${tbl}: ${res.rowCount} registros eliminados.`);
      } catch (e) {
        console.log(`   • ${tbl}: omitida (${e.message})`);
      }
    }

    // Eliminar usuarios excepto SUPER_ADMIN (admin@rumbofino.com)
    try {
      const res = await client.query(`
        DELETE FROM users 
        WHERE role != 'SUPER_ADMIN' 
          AND email != 'admin@rumbofino.com'
      `);
      console.log(`   • users: ${res.rowCount} usuarios eliminados. Solo se conservó el Super Admin.`);
    } catch (e) {
      console.log(`   • users: error al eliminar (${e.message})`);
    }

    // Asegurar que el Super Admin existe y tiene contraseña activa
    try {
      if (bcrypt) {
        const hash = await bcrypt.hash('Admin123!', 10);
        // Verificar si existe admin@rumbofino.com
        const check = await client.query(`SELECT id FROM users WHERE email = 'admin@rumbofino.com'`);
        if (check.rows.length === 0) {
          await client.query(`
            INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status)
            VALUES ('admin@rumbofino.com', $1, '+58 414 0000001', 'Alexander', 'Vance', 'SUPER_ADMIN', 'ACTIVE')
          `, [hash]);
          console.log('   • Super Admin creado de nuevo con éxito.');
        } else {
          await client.query(`UPDATE users SET password_hash = $1 WHERE email = 'admin@rumbofino.com'`, [hash]);
          console.log('   • Super Admin verificado: login habilitado con "Admin123!".');
        }
      }
    } catch (e) {
      console.log(`   • Super Admin notice: (${e.message})`);
    }

    const remainingUsers = (await client.query('SELECT id, email, role, first_name, last_name FROM users')).rows;
    console.log(`\n👑 Usuarios restantes en ${name}:`);
    console.table(remainingUsers);

    const counts = {};
    for (const tbl of ['drivers', 'vehicles', 'rides', 'transactions', 'driver_balances']) {
      try {
        const c = await client.query(`SELECT COUNT(*) FROM ${tbl}`);
        counts[tbl] = Number(c.rows[0].count);
      } catch (e) {
        counts[tbl] = 'N/A';
      }
    }
    console.log(`📦 Conteos en ${name}:`, counts);
    console.log(`✨ ${name} quedó 100% limpio.\n`);
  } catch (err) {
    console.error(`❌ Error conectando o limpiando ${name}:`, err.message);
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

async function run() {
  // 1. Limpiar base de datos local PostgreSQL (localhost)
  const localCreds = {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: process.env.DB_PASSWORD || 'Jf18759339',
    database: 'rumbo_fino',
    ssl: false,
  };

  await cleanTarget('Local PostgreSQL (localhost:5432)', localCreds);

  // 2. Limpiar base de datos Supabase Cloud PostgreSQL
  const supabaseCreds = {
    host: 'aws-0-ca-central-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.cplncxlkwioxdzluwmvr',
    password: 'LaqVHpvkRjdk3CTp',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  };

  await cleanTarget('Supabase Cloud (aws-0-ca-central-1.pooler.supabase.com)', supabaseCreds);
}

if (require.main === module) {
  run();
}

module.exports = { run };
