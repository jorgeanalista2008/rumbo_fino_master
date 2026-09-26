const { Client } = require('pg');

async function updateEnums() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'Jf18759339',
    database: 'rumbo_fino',
  });

  await client.connect();
  console.log('Connected to rumbo_fino.');

  const values = ['PAGO_MOVIL', 'ZELLE', 'CORPORATE_ACCOUNT', 'CASH_USD', 'CASH_VES'];
  for (const val of values) {
    try {
      await client.query(`ALTER TYPE payment_method_enum ADD VALUE IF NOT EXISTS '${val}'`);
      console.log(`✅ Added ${val} to payment_method_enum`);
    } catch (e) {
      console.log(`⚠️ ${val}: ${e.message}`);
    }
  }

  await client.end();
}

updateEnums();
