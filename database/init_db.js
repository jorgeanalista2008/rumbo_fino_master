let Client;
try {
  Client = require('pg').Client;
} catch (e) {
  Client = require('../backend/node_modules/pg').Client;
}

const fs = require('fs');
const path = require('path');

async function initDatabase() {
  const credentials = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'Jf18759339',
  };

  console.log('🔌 Conectando a servidor PostgreSQL local...');
  const rootClient = new Client({ ...credentials, database: 'postgres' });

  try {
    await rootClient.connect();
    console.log('✅ Conexión exitosa a PostgreSQL.');

    const res = await rootClient.query(
      "SELECT 1 FROM pg_database WHERE datname = 'rumbo_fino'",
    );
    if (res.rowCount === 0) {
      console.log("🛠️ Creando base de datos 'rumbo_fino'...");
      await rootClient.query('CREATE DATABASE rumbo_fino');
      console.log("✅ Base de datos 'rumbo_fino' creada con éxito.");
    } else {
      console.log("ℹ️ Base de datos 'rumbo_fino' ya existe.");
    }
  } catch (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
    process.exit(1);
  } finally {
    await rootClient.end();
  }

  console.log("🔌 Conectando a base de datos 'rumbo_fino'...");
  const dbClient = new Client({ ...credentials, database: 'rumbo_fino' });

  try {
    await dbClient.connect();
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sqlScript = fs.readFileSync(schemaPath, 'utf8');

    console.log('📜 Aplicando esquema PostGIS DDL schema.sql...');
    await dbClient.query(sqlScript);
    console.log('🎉 Esquema DDL de Rumbo Fino (Tablas, PostGIS, Índices) listo y verificado.');
  } catch (err) {
    console.error('❌ Error ejecutando DDL schema:', err.message);
  } finally {
    await dbClient.end();
  }
}

initDatabase();
