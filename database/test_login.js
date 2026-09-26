let Client;
try {
  Client = require('pg').Client;
} catch (e) {
  Client = require('../backend/node_modules/pg').Client;
}

let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (e) {
  bcrypt = require('../backend/node_modules/bcrypt');
}

async function testLogin() {
  const credentials = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'Jf18759339',
    database: process.env.DB_NAME || 'rumbo_fino',
  };

  console.log('🧪 Probando autenticación y credenciales de usuarios en PostgreSQL...');
  const client = new Client(credentials);

  try {
    await client.connect();

    const testUsers = [
      { email: 'admin@rumbofino.com', pass: 'Admin123!', roleLabel: 'Super Admin' },
      { email: 'despacho@rumbofino.com', pass: 'Despacho123!', roleLabel: 'Despachador' },
      { email: 'chofer1@rumbofino.com', pass: 'Driver123!', roleLabel: 'Chofer Ejecutivo' },
      { email: 'pasajero1@rumbofino.com', pass: 'Passenger123!', roleLabel: 'Pasajero VIP' },
    ];

    for (const u of testUsers) {
      const res = await client.query('SELECT id, email, password_hash, first_name, last_name, role FROM users WHERE email = $1', [u.email]);
      
      if (res.rows.length === 0) {
        console.log(`❌ Usuario ${u.email} no encontrado en la base de datos.`);
        continue;
      }

      const dbUser = res.rows[0];
      const isValid = await bcrypt.compare(u.pass, dbUser.password_hash);

      if (isValid) {
        console.log(`✅ LOGIN EXITOSO: [${u.roleLabel}] ${dbUser.first_name} ${dbUser.last_name} (${dbUser.email}) -> Password match OK!`);
      } else {
        console.log(`❌ FAIL LOGIN: ${u.email} -> Contraseña incorrecta.`);
      }
    }
  } catch (err) {
    console.error('❌ Error probando login:', err.message);
  } finally {
    await client.end();
  }
}

testLogin();
