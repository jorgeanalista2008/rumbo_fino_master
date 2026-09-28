/**
 * RUMBO FINO - SEEDER MAESTRO DE PRODUCCIÓN LIMPIA
 * 
 * Este seeder inicializa el esquema completo desde cero con:
 *  - Matriz RBAC de Roles y Permisos oficiales.
 *  - Monitor de Tasa Oficial BCV activa.
 *  - Cuentas maestras administrativas (Super Admin, Flota, Despacho, Auditor).
 *  - Flota vehicular de lujo (Sedán Ejecutivo, SUV VIP, Van Premium, Blindados).
 *  - Choferes homologados con expedientes y billeteras limpias ($0.00).
 *  - Cuentas de Pasajeros de prueba/referencia.
 *  - CERO VIAJES, CERO TRANSACCIONES, CERO GPS RESIDUAL (100% Producción).
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

async function seedProduction() {
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
  console.log('🌱 RUMBO FINO - SEMBRADO MAESTRO PARA PRODUCCIÓN LIMPIA');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`🔌 Conectando a PostgreSQL en [${credentials.host}:${credentials.port}/${credentials.database}] (SSL: ${isCloud})...`);

  const client = new Client(credentials);

  try {
    await client.connect();
    console.log('✅ Conexión establecida con éxito.');

    // -------------------------------------------------------------------------
    // 0. RESET COMPLETO DE TABLAS
    // -------------------------------------------------------------------------
    console.log('🧹 Purgando tablas existentes...');
    await client.query('DROP TABLE IF EXISTS reviews CASCADE');
    await client.query('DROP TABLE IF EXISTS transactions CASCADE');
    await client.query('DROP TABLE IF EXISTS driver_balances CASCADE');
    await client.query('DROP TABLE IF EXISTS ride_locations CASCADE');
    await client.query('DROP TABLE IF EXISTS rides CASCADE');
    await client.query('DROP TABLE IF EXISTS driver_vehicle_assignments CASCADE');
    await client.query('DROP TABLE IF EXISTS driver_documents CASCADE');
    await client.query('DROP TABLE IF EXISTS drivers CASCADE');
    await client.query('DROP TABLE IF EXISTS vehicle_documents CASCADE');
    await client.query('DROP TABLE IF EXISTS vehicles CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    await client.query('DROP TABLE IF EXISTS exchange_rates CASCADE');
    await client.query('DROP TABLE IF EXISTS role_permissions CASCADE');

    console.log('📜 Ejecutando DDL schema.sql...');
    const schemaScript = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schemaScript);
    console.log('✅ Esquema DDL aplicado con éxito.');

    // -------------------------------------------------------------------------
    // 1. SEMBRAR MATRIZ DINÁMICA DE ROLES Y PERMISOS (RBAC)
    // -------------------------------------------------------------------------
    console.log('🔐 Sembrando Matriz de Roles y Permisos (role_permissions)...');
    const rolesData = [
      {
        role: 'SUPER_ADMIN',
        displayName: 'Super Admin',
        description: 'Control total del sistema, auditoría financiera, configuración global y administración de roles.',
        allowedRoutes: [
          '/dashboard',
          '/dashboard/vehicles',
          '/dashboard/drivers',
          '/dashboard/dispatch',
          '/dashboard/financials',
          '/dashboard/exchange-rates',
          '/dashboard/users',
          '/dashboard/roles-permissions',
        ],
        isSystem: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canExport: true,
      },
      {
        role: 'FLEET_ADMIN',
        displayName: 'Administrador de Flota',
        description: 'Gestión completa de vehículos, expedientes documentales, mantenimiento y asignación de unidades.',
        allowedRoutes: [
          '/dashboard',
          '/dashboard/vehicles',
          '/dashboard/drivers',
          '/dashboard/exchange-rates',
        ],
        isSystem: true,
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
      },
      {
        role: 'DISPATCHER',
        displayName: 'Despachador Central',
        description: 'Centro de comando, telemetría y despacho de viajes en vivo, asignación de choferes y protocolo SOS.',
        allowedRoutes: [
          '/dashboard',
          '/dashboard/dispatch',
          '/dashboard/drivers',
          '/dashboard/vehicles',
        ],
        isSystem: true,
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
      },
      {
        role: 'DRIVER',
        displayName: 'Chofer VIP',
        description: 'Conductor en red, control de turnos, odómetro, estado de cuenta y calificación.',
        allowedRoutes: ['/dashboard/drivers', '/dashboard/dispatch'],
        isSystem: true,
        canCreate: false,
        canEdit: true,
        canDelete: false,
        canExport: false,
      },
      {
        role: 'PASSENGER',
        displayName: 'Cliente / Pasajero',
        description: 'Solicitante de viajes ejecutivos, seguimiento de ruta y métodos de pago.',
        allowedRoutes: ['/dashboard/dispatch'],
        isSystem: true,
        canCreate: true,
        canEdit: false,
        canDelete: false,
        canExport: false,
      },
      {
        role: 'AUDITOR_FINANCIERO',
        displayName: 'Auditor Financiero',
        description: 'Supervisión de finanzas, conciliaciones de comisiones y paridad cambiaria oficial.',
        allowedRoutes: ['/dashboard', '/dashboard/financials', '/dashboard/exchange-rates'],
        isSystem: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canExport: true,
      },
    ];

    for (const r of rolesData) {
      await client.query(
        `INSERT INTO role_permissions (role, display_name, description, allowed_routes, is_system, can_create, can_edit, can_delete, can_export)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          r.role,
          r.displayName,
          r.description,
          JSON.stringify(r.allowedRoutes),
          r.isSystem,
          r.canCreate,
          r.canEdit,
          r.canDelete,
          r.canExport,
        ],
      );
    }
    console.log('✅ Matriz RBAC oficial sembrada con éxito.');

    // -------------------------------------------------------------------------
    // 2. SEMBRAR TASA OFICIAL BCV ACTIVA
    // -------------------------------------------------------------------------
    console.log('💵 Sembrando Tasa Oficial BCV activa...');
    await client.query(
      `INSERT INTO exchange_rates (currency_pair, rate, source, effective_date, is_active, notes, admin_name)
       VALUES 
       ('USD_VES', 65.5000, 'BCV', NOW(), true, 'Tasa Oficial Activa BCV Apertura Producción', 'Alexander Vance (Super Admin)')`,
    );
    console.log('✅ Tasa oficial BCV establecida en 65.50 Bs/$.');

    // -------------------------------------------------------------------------
    // 3. SEMBRAR USUARIOS ADMINISTRATIVOS, CHOFERES Y PASAJEROS
    // -------------------------------------------------------------------------
    console.log('👥 Sembrando Cuentas de Usuario Maestras...');
    const salt = await bcrypt.genSalt(10);
    const passSuperAdmin = await bcrypt.hash('Admin2026*', salt);
    const passFleetAdmin = await bcrypt.hash('AdminFlota2026*', salt);
    const passDispatcher = await bcrypt.hash('Despacho2026*', salt);
    const passDriver = await bcrypt.hash('Chofer2026*', salt);
    const passPassenger = await bcrypt.hash('Pasajero2026*', salt);
    const passAuditor = await bcrypt.hash('Auditor2026*', salt);

    // Super Admin
    await client.query(
      `INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      ['admin@rumbofino.com', passSuperAdmin, '+58 414 0000001', 'Alexander', 'Vance', 'SUPER_ADMIN', 'ACTIVE', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'],
    );

    // Fleet Admin
    await client.query(
      `INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      ['flota@rumbofino.com', passFleetAdmin, '+58 414 0000002', 'Sebastián', 'Alarcón', 'FLEET_ADMIN', 'ACTIVE', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'],
    );

    // Dispatcher
    await client.query(
      `INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      ['despacho@rumbofino.com', passDispatcher, '+58 414 0000003', 'Mariana', 'Valdez', 'DISPATCHER', 'ACTIVE', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'],
    );

    // Auditor
    await client.query(
      `INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      ['auditor@rumbofino.com', passAuditor, '+58 414 3330001', 'Mauricio', 'Castañeda', 'SUPER_ADMIN', 'ACTIVE', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'],
    );

    // Drivers
    const uDrv1 = (await client.query(
      `INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      ['chofer1@rumbofino.com', passDriver, '+58 412 1110001', 'Carlos', 'Mendoza', 'DRIVER', 'ACTIVE', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400'],
    )).rows[0].id;

    const uDrv2 = (await client.query(
      `INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      ['chofer2@rumbofino.com', passDriver, '+58 412 1110002', 'Roberto', 'Silva', 'DRIVER', 'ACTIVE', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400'],
    )).rows[0].id;

    const uDrv3 = (await client.query(
      `INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      ['chofer3@rumbofino.com', passDriver, '+58 412 1110003', 'Fernando', 'Quintero', 'DRIVER', 'ACTIVE', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'],
    )).rows[0].id;

    const uDrv4 = (await client.query(
      `INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      ['chofer4@rumbofino.com', passDriver, '+58 412 1110004', 'Luis', 'Hernández', 'DRIVER', 'ACTIVE', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400'],
    )).rows[0].id;

    // Passengers
    await client.query(
      `INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status, avatar_url)
       VALUES 
       ('pasajero1@rumbofino.com', $1, '+58 424 2220001', 'Elena', 'Rostova', 'PASSENGER', 'ACTIVE', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'),
       ('pasajero2@rumbofino.com', $1, '+58 424 2220002', 'Gabriel', 'García', 'PASSENGER', 'ACTIVE', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400'),
       ('pasajero3@rumbofino.com', $1, '+58 424 2220003', 'Valeria', 'Zambrano', 'PASSENGER', 'ACTIVE', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400')`,
      [passPassenger],
    );

    // -------------------------------------------------------------------------
    // 4. SEMBRAR FLOTA VEHICULAR EJECUTIVA DISPONIBLE
    // -------------------------------------------------------------------------
    console.log('🚗 Sembrando Flota Vehicular Ejecutiva...');
    const vehiclesData = [
      {
        make: 'Mercedes-Benz',
        model: 'E-Class 350 AMG Line',
        year: 2024,
        color: 'Negro Obsidian Metalizado',
        licensePlate: 'VIP-777',
        vin: 'WDB2130481A998811',
        seats: 4,
        category: 'EXECUTIVE_SEDAN',
        status: 'AVAILABLE',
        photos: [
          'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800',
          'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800',
        ],
      },
      {
        make: 'Toyota',
        model: 'Fortuner Executive 4x4',
        year: 2024,
        color: 'Negro Brillante',
        licensePlate: 'AB123CD',
        vin: 'MHFK88E23P004455',
        seats: 6,
        category: 'VIP_SUV',
        status: 'AVAILABLE',
        photos: [
          'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800',
          'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800',
        ],
      },
      {
        make: 'BMW',
        model: 'Serie 5 530i M Sport',
        year: 2023,
        color: 'Gris Grafito Perlado',
        licensePlate: 'RF-888',
        vin: 'WBA530I99A887766',
        seats: 4,
        category: 'EXECUTIVE_SEDAN',
        status: 'AVAILABLE',
        photos: [
          'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800',
        ],
      },
      {
        make: 'Cadillac',
        model: 'Escalade ESV Platinum Blindada (VR7)',
        year: 2024,
        color: 'Negro Jet Black',
        licensePlate: 'RF-001',
        vin: '1GYS4HKJ8PR112233',
        seats: 7,
        category: 'LUXURY_ARMORED',
        status: 'AVAILABLE',
        photos: [
          'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800',
        ],
      },
      {
        make: 'Mercedes-Benz',
        model: 'V-Class 300d Extra Long VIP',
        year: 2024,
        color: 'Azul Cavansita Metalizado',
        licensePlate: 'RF-VAN-01',
        vin: 'WDF44781313998877',
        seats: 7,
        category: 'PREMIUM_VAN',
        status: 'AVAILABLE',
        photos: [
          'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800',
        ],
      },
    ];

    for (const v of vehiclesData) {
      await client.query(
        `INSERT INTO vehicles (make, model, year, color, license_plate, vin, seats, category, status, photos)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          v.make,
          v.model,
          v.year,
          v.color,
          v.licensePlate,
          v.vin,
          v.seats,
          v.category,
          v.status,
          JSON.stringify(v.photos),
        ],
      );
    }
    console.log('✅ 5 Unidades vehiculares ejecutivas registradas y DISPONIBLES.');

    // -------------------------------------------------------------------------
    // 5. SEMBRAR PERFILES DE CHOFERES, EXPEDIENTES Y BILLETERAS CERO ($0.00)
    // -------------------------------------------------------------------------
    console.log('👔 Sembrando Perfiles de Choferes Homologados...');
    const driversData = [
      { userId: uDrv1, licenseNumber: 'LIC-5TA-0019283', licenseCategory: 'Quinta Profesional', ratingAvg: 5.0, totalRides: 0 },
      { userId: uDrv2, licenseNumber: 'LIC-5TA-0019284', licenseCategory: 'Quinta Profesional', ratingAvg: 5.0, totalRides: 0 },
      { userId: uDrv3, licenseNumber: 'LIC-5TA-0019285', licenseCategory: 'Quinta Profesional', ratingAvg: 5.0, totalRides: 0 },
      { userId: uDrv4, licenseNumber: 'LIC-5TA-0019286', licenseCategory: 'Quinta Profesional', ratingAvg: 5.0, totalRides: 0 },
    ];

    for (const d of driversData) {
      const driverId = (await client.query(
        `INSERT INTO drivers (user_id, license_number, license_category, license_expiration, rating_avg, total_rides, is_online, current_vehicle_id)
         VALUES ($1, $2, $3, '2028-12-31', $4, $5, false, NULL) RETURNING id`,
        [d.userId, d.licenseNumber, d.licenseCategory, d.ratingAvg, d.totalRides],
      )).rows[0].id;

      // Expedientes Digitales Aprobados
      const docs = [
        { type: 'DRIVER_LICENSE', num: d.licenseNumber },
        { type: 'MEDICAL_CERTIFICATE', num: `MED-${d.licenseNumber}` },
        { type: 'DRIVING_CERTIFICATE', num: `CERT-${d.licenseNumber}` },
        { type: 'CRIMINAL_RECORD', num: `ANT-${d.licenseNumber}` },
        { type: 'IDENTITY_CARD', num: `DNI-${d.licenseNumber}` },
      ];

      for (const doc of docs) {
        await client.query(
          `INSERT INTO driver_documents (driver_id, document_type, document_number, file_url, expiration_date, status)
           VALUES ($1, $2, $3, 'https://rumbofino.com/docs/expediente_oficial.pdf', '2028-12-31', 'APPROVED')`,
          [driverId, doc.type, doc.num],
        );
      }

      // Billetera con Saldo Cero Inicial ($0.00)
      await client.query(
        `INSERT INTO driver_balances (driver_id, current_balance, pending_payout, total_earned, total_commission_paid)
         VALUES ($1, 0.00, 0.00, 0.00, 0.00)`,
        [driverId],
      );
    }
    console.log('✅ Choferes homologados con expedientes y billeteras en $0.00.');

    // -------------------------------------------------------------------------
    // 6. RESUMEN FINAL
    // -------------------------------------------------------------------------
    console.log('\n📊 ESTADO FINAL DE PRODUCCIÓN LIMPIA:');
    console.log('   • Viajes Activos/Históricos: 0 (Cero - Listo para primer despacho)');
    console.log('   • Transacciones Financieras: 0 (Cero - Billeteras limpias en $0.00)');
    console.log('   • Coordenadas GPS Residuales: 0 (Cero)');
    console.log('   • Reseñas Residuales: 0 (Cero)');
    console.log('   • Flota Vehicular: 100% DISPONIBLE');
    console.log('   • Tasa BCV: 65.50 Bs/$ (Activa)');
    console.log('   • Credenciales: Administradores, Choferes y Pasajeros listos.');

    console.log('\n═══════════════════════════════════════════════════════════════════════');
    console.log('🎉 SISTEMA RUMBO FINO INICIALIZADO Y LISTO PARA PRODUCCIÓN OFICIAL');
    console.log('═══════════════════════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('❌ Error inicializando base de datos de producción:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  seedProduction();
}

module.exports = { seedProduction };
