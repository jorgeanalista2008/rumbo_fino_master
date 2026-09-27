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

const fs = require('fs');
const path = require('path');

async function seedData() {
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
  console.log('🌱 INICIALIZANDO Y SEMBRANDO BASE DE DATOS DE RUMBO FINO');
  console.log('═══════════════════════════════════════════════════════════════════════');
  
  const client = new Client(credentials);

  try {
    await client.connect();
    console.log('🔌 Conexión establecida con PostgreSQL.');

    // -------------------------------------------------------------------------
    // 0. RESET COMPLETO DE TABLAS
    // -------------------------------------------------------------------------
    console.log('🧹 Limpiando y purgando tablas existentes...');
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
      {
        role: 'SUPERVISOR_OPERACIONES',
        displayName: 'Supervisor de Operaciones',
        description: 'Supervisión de tráfico de flota, disponibilidad de choferes y despacho en vivo.',
        allowedRoutes: ['/dashboard', '/dashboard/dispatch', '/dashboard/drivers', '/dashboard/vehicles'],
        isSystem: false,
        canCreate: true,
        canEdit: true,
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
    console.log('✅ 7 Perfiles de Roles configurados con permisos de menú.');

    // -------------------------------------------------------------------------
    // 2. SEMBRAR TASAS OFICIALES BCV (exchange_rates)
    // -------------------------------------------------------------------------
    console.log('💵 Sembrando Tasas Oficiales de Cambio BCV...');
    await client.query(
      `INSERT INTO exchange_rates (currency_pair, rate, source, effective_date, is_active, notes, admin_name)
       VALUES 
       ('USD/VES', 64.8500, 'BCV', NOW(), true, 'Tasa Oficial BCV Apertura - Publicada en portal oficial', 'Alexander Vance (Super Admin)'),
       ('USD/VES', 64.2000, 'BCV', NOW() - INTERVAL '1 day', false, 'Tasa Oficial BCV Cierre Jornada Anterior', 'Alexander Vance (Super Admin)'),
       ('USD/VES', 63.7500, 'BCV', NOW() - INTERVAL '2 days', false, 'Tasa Oficial BCV Operativa', 'Alexander Vance (Super Admin)'),
       ('USD/VES', 63.1000, 'BCV', NOW() - INTERVAL '3 days', false, 'Tasa Oficial BCV Inicial de Semana', 'Alexander Vance (Super Admin)')`,
    );
    console.log('✅ Monitor BCV activo en 64.8500 Bs/$ con 4 registros históricos de auditoría.');

    // -------------------------------------------------------------------------
    // 3. SEMBRAR USUARIOS (Todos los roles con contraseñas seguras)
    // -------------------------------------------------------------------------
    console.log('👥 Sembrando Usuarios con credenciales para todas las situaciones...');
    const salt = await bcrypt.genSalt(10);
    const passSuperAdmin = await bcrypt.hash('Admin2026*', salt);
    const passFleetAdmin = await bcrypt.hash('AdminFlota2026*', salt);
    const passDispatcher = await bcrypt.hash('Despacho2026*', salt);
    const passDriver = await bcrypt.hash('Chofer2026*', salt);
    const passPassenger = await bcrypt.hash('Pasajero2026*', salt);
    const passAuditor = await bcrypt.hash('Auditor2026*', salt);
    const passSupervisor = await bcrypt.hash('Supervisor2026*', salt);

    // 1. Super Admin
    const uAdmin = (await client.query(
      `INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      ['admin@rumbofino.com', passSuperAdmin, '+58 414 0000001', 'Alexander', 'Vance', 'SUPER_ADMIN', 'ACTIVE', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'],
    )).rows[0].id;

    // 2. Fleet Admin
    const uFleet = (await client.query(
      `INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      ['flota@rumbofino.com', passFleetAdmin, '+58 414 0000002', 'Sebastián', 'Alarcón', 'FLEET_ADMIN', 'ACTIVE', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'],
    )).rows[0].id;

    // 3. Dispatchers
    const uDisp1 = (await client.query(
      `INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      ['despacho@rumbofino.com', passDispatcher, '+58 414 0000003', 'Mariana', 'Valdez', 'DISPATCHER', 'ACTIVE', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'],
    )).rows[0].id;

    const uDisp2 = (await client.query(
      `INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      ['despacho2@rumbofino.com', passDispatcher, '+58 414 0000004', 'Andrés', 'Parra', 'DISPATCHER', 'ACTIVE', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'],
    )).rows[0].id;

    // 4. Drivers
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

    const uDrv5 = (await client.query(
      `INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      ['chofer5@rumbofino.com', passDriver, '+58 412 1110005', 'Javier', 'Morales', 'DRIVER', 'PENDING_APPROVAL', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400'],
    )).rows[0].id;

    // 5. Passengers
    const uPass1 = (await client.query(
      `INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      ['pasajero1@rumbofino.com', passPassenger, '+58 424 2220001', 'Elena', 'Rostova', 'PASSENGER', 'ACTIVE', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'],
    )).rows[0].id;

    const uPass2 = (await client.query(
      `INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      ['pasajero2@rumbofino.com', passPassenger, '+58 424 2220002', 'Gabriel', 'García', 'PASSENGER', 'ACTIVE', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400'],
    )).rows[0].id;

    const uPass3 = (await client.query(
      `INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      ['pasajero3@rumbofino.com', passPassenger, '+58 424 2220003', 'Valeria', 'Zambrano', 'PASSENGER', 'ACTIVE', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400'],
    )).rows[0].id;

    const uPass4 = (await client.query(
      `INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      ['pasajero4@rumbofino.com', passPassenger, '+58 424 2220004', 'Diego', 'Villalobos', 'PASSENGER', 'ACTIVE', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400'],
    )).rows[0].id;

    // 6. Custom RBAC Users
    const uAuditor = (await client.query(
      `INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      ['auditor@rumbofino.com', passAuditor, '+58 414 3330001', 'Mauricio', 'Castañeda', 'AUDITOR_FINANCIERO', 'ACTIVE', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'],
    )).rows[0].id;

    const uSupervisor = (await client.query(
      `INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      ['supervisor@rumbofino.com', passSupervisor, '+58 414 3330002', 'Patricia', 'Blanco', 'SUPERVISOR_OPERACIONES', 'ACTIVE', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400'],
    )).rows[0].id;

    console.log('✅ 15 Usuarios creados con avatares, roles y contraseñas.');

    // -------------------------------------------------------------------------
    // 4. SEMBRAR VEHÍCULOS EJECUTIVOS (vehicles & vehicle_documents)
    // -------------------------------------------------------------------------
    console.log('🚘 Sembrando Flota de Vehículos de Lujo con Fichas Técnicas...');
    
    // Vehículo 1: Mercedes-Benz Sedán
    const v1Id = (await client.query(
      `INSERT INTO vehicles (make, model, year, color, license_plate, vin, seats, category, status, transmission, fuel_type, luggage_capacity, amenities, photos)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
      [
        'Mercedes-Benz',
        'E-Class 350 AMG Line',
        2024,
        'Negro Obsidian Metalizado',
        'VIP-777',
        'WDD2130421A123456',
        4,
        'EXECUTIVE_SEDAN',
        'IN_SERVICE',
        'Automática 9G-Tronic',
        'Gasolina Premium / Mild Hybrid',
        '3 Maletas Grandes + 2 de Mano',
        JSON.stringify([
          'Wi-Fi 5G Ilimitado',
          'Asientos de Cuero Nappa Calefaccionados',
          'Climatizador Automático Tri-Zona',
          'Tomas 110V / USB-C Ultra Rápido',
          'Agua Evian y Mints VIP',
          'Cristales Tintados de Privacidad',
          'Sistema de Sonido Burmester® 3D',
        ]),
        JSON.stringify([
          'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1000',
          'https://images.unsplash.com/photo-1563720223185-11003d516935?w=1000',
        ]),
      ],
    )).rows[0].id;

    // Vehículo 2: Cadillac Escalade SUV
    const v2Id = (await client.query(
      `INSERT INTO vehicles (make, model, year, color, license_plate, vin, seats, category, status, transmission, fuel_type, luggage_capacity, amenities, photos)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
      [
        'Cadillac',
        'Escalade ESV Platinum',
        2025,
        'Azul Midnight Imperial',
        'LUX-999',
        '1GYS4HKJ8R1987654',
        7,
        'VIP_SUV',
        'IN_SERVICE',
        'Automática de 10 Velocidades',
        'V8 6.2L EcoTec3',
        '6 Maletas Grandes + 4 de Mano',
        JSON.stringify([
          'Wi-Fi 5G a Bordo',
          'Pantallas OLED Traseras de 12.6"',
          'Asientos Capitán con Masaje',
          'Refrigerador / Enfriador Integrado',
          'Suspensión Neumática MagneRide',
          'Aislamiento Acústico Doble Cristal',
          'Audio AKG Studio Reference 36 Altavoces',
        ]),
        JSON.stringify([
          'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1000',
          'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000',
        ]),
      ],
    )).rows[0].id;

    // Vehículo 3: BMW Serie 7 Blindado
    const v3Id = (await client.query(
      `INSERT INTO vehicles (make, model, year, color, license_plate, vin, seats, category, status, transmission, fuel_type, luggage_capacity, amenities, photos)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
      [
        'BMW',
        '740i Protection VR7',
        2024,
        'Gris Dravit Metalizado',
        'BLI-001',
        'WBA7E4105PCF99881',
        4,
        'LUXURY_ARMORED',
        'AVAILABLE',
        'Automática Steptronic Sport',
        'TwinPower Turbo 3.0L',
        '3 Maletas Grandes',
        JSON.stringify([
          'Blindaje Certificado Nivel VR7 / Balístico',
          'Vidrios de Seguridad Policarbonato 38mm',
          'Sistema de Oxígeno de Emergencia',
          'Pantalla BMW Theatre 31.3" 8K',
          'Llantas Run-Flat Reforzadas Pax System',
          'Sirena y Comunicador Exterior Intercom',
        ]),
        JSON.stringify([
          'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1000',
        ]),
      ],
    )).rows[0].id;

    // Vehículo 4: Mercedes-Benz Sprinter Van
    const v4Id = (await client.query(
      `INSERT INTO vehicles (make, model, year, color, license_plate, vin, seats, category, status, transmission, fuel_type, luggage_capacity, amenities, photos)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
      [
        'Mercedes-Benz',
        'Sprinter 519 CDI VIP Class',
        2024,
        'Plata Iridio',
        'VAN-888',
        'WD3PF0CD5KP445566',
        12,
        'PREMIUM_VAN',
        'AVAILABLE',
        'Automática 7G-Tronic Plus',
        'Diésel BlueTEC',
        '12 Maletas Grandes',
        JSON.stringify([
          'Configuración Salón de Negocios 12 Butacas',
          'Mesas de Trabajo Plegables de Caoba',
          'Pantalla Smart TV 43" con HDMI / Apple TV',
          'Nevera Ejecutiva y Cafetera Nespresso',
          'Iluminación Ambiental LED StarLight',
        ]),
        JSON.stringify([
          'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1000',
        ]),
      ],
    )).rows[0].id;

    // Vehículo 5: Audi A8 Sedán en Mantenimiento
    const v5Id = (await client.query(
      `INSERT INTO vehicles (make, model, year, color, license_plate, vin, seats, category, status, transmission, fuel_type, luggage_capacity, amenities, photos)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
      [
        'Audi',
        'A8 L 55 TFSI Quattro',
        2023,
        'Blanco Glaciar',
        'AUD-555',
        'WAUZZZF85NA001122',
        4,
        'EXECUTIVE_SEDAN',
        'MAINTENANCE',
        'Tiptronic 8 Velocidades',
        'V6 Turbo 3.0L MHEV',
        '3 Maletas Grandes + 2 de Mano',
        JSON.stringify(['Bang & Olufsen 3D', 'Faros Matrix LED Láser', 'Masaje en Asientos']),
        JSON.stringify(['https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=1000']),
      ],
    )).rows[0].id;

    // Documentos de Vehículos
    await client.query(
      `INSERT INTO vehicle_documents (vehicle_id, document_type, document_number, file_url, expiration_date, status)
       VALUES 
       ($1, 'SOAT_INSURANCE', 'SOAT-2026-VIP777', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '2026-12-31', 'APPROVED'),
       ($1, 'TECHNICAL_INSPECTION', 'REV-TECH-2026-99', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '2026-11-30', 'APPROVED'),
       ($2, 'SOAT_INSURANCE', 'SOAT-2026-LUX999', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '2026-10-15', 'APPROVED'),
       ($3, 'VEHICLE_TITLE', 'TIT-BLI-001-2024', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '2030-01-01', 'APPROVED'),
       ($4, 'TECHNICAL_INSPECTION', 'REV-AUD-555', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '2026-08-01', 'EXPIRED')`,
      [v1Id, v2Id, v3Id, v5Id],
    );

    console.log('✅ 5 Vehículos ejecutivos y sus expedientes documentales registrados.');

    // -------------------------------------------------------------------------
    // 5. SEMBRAR CHOFERES, BALANCES Y TURNOS (drivers, driver_balances, assignments)
    // -------------------------------------------------------------------------
    console.log('👨‍✈️ Sembrando Expedientes de Choferes, Ubicaciones GPS y Balances...');

    // Chofer 1: Carlos Mendoza (Online, Disponible en Las Mercedes, asignado a Mercedes Sedán)
    const d1Id = (await client.query(
      `INSERT INTO drivers (user_id, license_number, license_category, license_expiration, rating_avg, total_rides, is_online, current_latitude, current_longitude, current_vehicle_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [uDrv1, 'LIC-5TA-0019283', 'Quinto Grado Profesional', '2028-12-31', 4.98, 234, true, 10.4816, -66.8606, v1Id],
    )).rows[0].id;

    // Chofer 2: Roberto Silva (Online, En Viaje Activo en El Rosal, asignado a Escalade SUV)
    const d2Id = (await client.query(
      `INSERT INTO drivers (user_id, license_number, license_category, license_expiration, rating_avg, total_rides, is_online, current_latitude, current_longitude, current_vehicle_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [uDrv2, 'LIC-5TA-0048271', 'Quinto Grado Profesional', '2027-09-15', 4.92, 189, true, 10.4891, -66.8654, v2Id],
    )).rows[0].id;

    // Chofer 3: Fernando Quintero (Online, Disponible en La Castellana, asignado a BMW Blindado)
    const d3Id = (await client.query(
      `INSERT INTO drivers (user_id, license_number, license_category, license_expiration, rating_avg, total_rides, is_online, current_latitude, current_longitude, current_vehicle_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [uDrv3, 'LIC-5TA-0077362', 'Quinto Grado Blindados / VIP', '2029-03-20', 5.00, 95, true, 10.4984, -66.8562, v3Id],
    )).rows[0].id;

    // Chofer 4: Luis Hernández (Offline / Fuera de Turno en Altamira, Sprinter Van)
    const d4Id = (await client.query(
      `INSERT INTO drivers (user_id, license_number, license_category, license_expiration, rating_avg, total_rides, is_online, current_latitude, current_longitude, current_vehicle_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [uDrv4, 'LIC-5TA-0099112', 'Quinto Grado Transporte Colectivo', '2028-06-10', 4.85, 142, false, 10.4958, -66.8529, v4Id],
    )).rows[0].id;

    // Chofer 5: Javier Morales (Offline, Pendiente de Aprobación)
    const d5Id = (await client.query(
      `INSERT INTO drivers (user_id, license_number, license_category, license_expiration, rating_avg, total_rides, is_online, current_latitude, current_longitude, current_vehicle_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [uDrv5, 'LIC-5TA-0033221', 'Quinto Grado Profesional', '2027-11-25', 5.00, 0, false, 10.5000, -66.9000, null],
    )).rows[0].id;

    // Balances Financieros de Choferes
    await client.query(
      `INSERT INTO driver_balances (driver_id, current_balance, pending_payout, total_earned, total_commission_paid, last_settlement_at)
       VALUES 
       ($1, 420.50, 150.00, 2850.00, 502.94, NOW() - INTERVAL '3 days'),
       ($2, 310.00, 80.00, 1940.00, 342.35, NOW() - INTERVAL '5 days'),
       ($3, 580.00, 200.00, 3400.00, 600.00, NOW() - INTERVAL '2 days'),
       ($4, 180.00, 0.00, 1120.00, 197.65, NOW() - INTERVAL '7 days'),
       ($5, 0.00, 0.00, 0.00, 0.00, null)`,
      [d1Id, d2Id, d3Id, d4Id, d5Id],
    );

    // Turnos y Odómetros Activos
    await client.query(
      `INSERT INTO driver_vehicle_assignments (driver_id, vehicle_id, initial_odometer, shift_status, notes)
       VALUES 
       ($1, $2, 14250, 'ACTIVE', 'Turno ejecutivo matutino en ruta - Las Mercedes'),
       ($3, $4, 28100, 'ACTIVE', 'Servicio corporativo especial con vehículo blindado - La Castellana')`,
      [d1Id, v1Id, d3Id, v3Id],
    );

    // Documentos de Choferes
    await client.query(
      `INSERT INTO driver_documents (driver_id, document_type, document_number, file_url, expiration_date, status)
       VALUES 
       ($1, 'DRIVER_LICENSE', 'LIC-5TA-0019283', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '2028-12-31', 'APPROVED'),
       ($1, 'CRIMINAL_RECORD', 'CERT-ANTEC-2026-99', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '2027-01-15', 'APPROVED'),
       ($2, 'DRIVER_LICENSE', 'LIC-5TA-0048271', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '2027-09-15', 'APPROVED'),
       ($3, 'MEDICAL_CERTIFICATE', 'MED-CERT-2026-44', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '2028-04-30', 'APPROVED'),
       ($4, 'DRIVER_LICENSE', 'LIC-5TA-0033221', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '2027-11-25', 'PENDING')`,
      [d1Id, d2Id, d3Id, d5Id],
    );

    console.log('✅ 5 Choferes configurados con turnos, geolocalización y balances.');

    // -------------------------------------------------------------------------
    // 6. SEMBRAR VIAJES CUBRIENDO TODAS LAS SITUACIONES
    // -------------------------------------------------------------------------
    console.log('🛣️ Sembrando Viajes para todas las situaciones operativas...');

    // SITUACIÓN 1: VIAJE EN CURSO (EN_CURSO) con Telemetría GPS en Vivo
    const rInCourseId = (await client.query(
      `INSERT INTO rides (passenger_id, driver_id, vehicle_id, status, category_requested, origin_address, origin_latitude, origin_longitude, destination_address, destination_latitude, destination_longitude, distance_km, estimated_duration_min, base_fare, distance_fare, time_fare, surge_multiplier, total_fare, platform_fee, driver_net_earnings, payment_method, requested_at, accepted_at, arrived_at, started_at)
       VALUES ($1, $2, $3, 'EN_CURSO', 'VIP_SUV', 'Torre Digitel, Av. Eugenio Mendoza, La Castellana', 10.4984000, -66.8562000, 'Hotel Eurobuilding Caracas, Chuao', 10.4782000, -66.8550000, 6.80, 18, 15.00, 13.60, 5.40, 1.00, 34.00, 5.10, 28.90, 'ZELLE', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '13 minutes', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '8 minutes')
       RETURNING id`,
      [uPass1, d2Id, v2Id],
    )).rows[0].id;

    // Telemetría GPS para el viaje en curso
    await client.query(
      `INSERT INTO ride_locations (ride_id, driver_id, latitude, longitude, speed, heading, timestamp)
       VALUES 
       ($1, $2, 10.4984, -66.8562, 28.5, 180.0, NOW() - INTERVAL '8 minutes'),
       ($1, $2, 10.4930, -66.8580, 42.0, 175.0, NOW() - INTERVAL '5 minutes'),
       ($1, $2, 10.4891, -66.8654, 38.2, 160.0, NOW() - INTERVAL '1 minute')`,
      [rInCourseId, d2Id],
    );

    // SITUACIÓN 2: VIAJE SOLICITADO / PENDIENTE DE ASIGNACIÓN (SOLICITADO)
    await client.query(
      `INSERT INTO rides (passenger_id, driver_id, vehicle_id, status, category_requested, origin_address, origin_latitude, origin_longitude, destination_address, destination_latitude, destination_longitude, distance_km, estimated_duration_min, base_fare, distance_fare, time_fare, surge_multiplier, total_fare, platform_fee, driver_net_earnings, payment_method, requested_at)
       VALUES ($1, null, null, 'SOLICITADO', 'EXECUTIVE_SEDAN', 'Centro Comercial San Ignacio, La Castellana', 10.4965000, -66.8558000, 'Valle Arriba Athletic Club, Colinas de Valle Arriba', 10.4680000, -66.8690000, 8.50, 22, 12.00, 17.00, 6.60, 1.00, 35.60, 5.34, 30.26, 'PAGO_MOVIL', NOW() - INTERVAL '2 minutes')`,
      [uPass2],
    );

    // SITUACIÓN 3: VIAJE ASIGNADO Y EN CAMINO AL ABORDAJE (EN_CAMINO)
    await client.query(
      `INSERT INTO rides (passenger_id, driver_id, vehicle_id, status, category_requested, origin_address, origin_latitude, origin_longitude, destination_address, destination_latitude, destination_longitude, distance_km, estimated_duration_min, base_fare, distance_fare, time_fare, surge_multiplier, total_fare, platform_fee, driver_net_earnings, payment_method, requested_at, accepted_at)
       VALUES ($1, $2, $3, 'EN_CAMINO', 'LUXURY_ARMORED', 'Torre Cavendes, Los Palos Grandes', 10.4950000, -66.8480000, 'Aeropuerto Internacional Simón Bolívar, Maiquetía', 10.6012000, -66.9912000, 34.50, 45, 40.00, 69.00, 20.00, 1.00, 129.00, 19.35, 109.65, 'CREDIT_CARD', NOW() - INTERVAL '6 minutes', NOW() - INTERVAL '4 minutes')`,
      [uPass3, d3Id, v3Id],
    );

    // SITUACIÓN 4: VIAJE FINALIZADO CON CALIFICACIÓN 5 ESTRELLAS Y RESEÑA (FINALIZADO)
    const rCompleted1Id = (await client.query(
      `INSERT INTO rides (passenger_id, driver_id, vehicle_id, status, category_requested, origin_address, origin_latitude, origin_longitude, destination_address, destination_latitude, destination_longitude, distance_km, estimated_duration_min, base_fare, distance_fare, time_fare, surge_multiplier, total_fare, platform_fee, driver_net_earnings, payment_method, requested_at, accepted_at, arrived_at, started_at, completed_at)
       VALUES ($1, $2, $3, 'FINALIZADO', 'EXECUTIVE_SEDAN', 'Hotel Tamanaco Intercontinental, Las Mercedes', 10.4770000, -66.8620000, 'Restaurante Alto, 1ra Avenida de Los Palos Grandes', 10.4975000, -66.8485000, 7.20, 20, 12.00, 14.40, 6.00, 1.00, 32.40, 4.86, 27.54, 'ZELLE', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '170 minutes', NOW() - INTERVAL '165 minutes', NOW() - INTERVAL '160 minutes', NOW() - INTERVAL '140 minutes')
       RETURNING id`,
      [uPass1, d1Id, v1Id],
    )).rows[0].id;

    // Reseña del viaje completado 1
    await client.query(
      `INSERT INTO reviews (ride_id, author_id, target_id, rating, cleanliness_rating, punctuality_rating, comfort_rating, comment, created_at)
       VALUES ($1, $2, $3, 5, 5, 5, 5, 'Excelente chofer, vehículo impecable, temperatura perfecta y agua fría disponible. Servicio 5 estrellas recomendado.', NOW() - INTERVAL '135 minutes')`,
      [rCompleted1Id, uPass1, uDrv1],
    );

    // Transacción del viaje completado 1
    await client.query(
      `INSERT INTO transactions (ride_id, driver_id, passenger_id, type, amount, currency, status, reference_code, metadata)
       VALUES 
       ($1, $2, $3, 'RIDE_FARE', 32.40, 'USD', 'COMPLETED', 'TRX-RIDE-001', '{"bcv_rate": 64.85, "ves_amount": 2101.14}'::jsonb),
       ($1, $2, null, 'PLATFORM_COMMISSION', 4.86, 'USD', 'COMPLETED', 'TRX-FEE-001', '{"fee_percent": 15}'::jsonb),
       ($1, $2, $3, 'TIP_PAYMENT', 5.00, 'USD', 'COMPLETED', 'TRX-TIP-001', '{"note": "Propina por excelente servicio"}'::jsonb)`,
      [rCompleted1Id, d1Id, uPass1],
    );

    // SITUACIÓN 5: VIAJE FINALIZADO AEROPUERTO (FINALIZADO)
    const rCompleted2Id = (await client.query(
      `INSERT INTO rides (passenger_id, driver_id, vehicle_id, status, category_requested, origin_address, origin_latitude, origin_longitude, destination_address, destination_latitude, destination_longitude, distance_km, estimated_duration_min, base_fare, distance_fare, time_fare, surge_multiplier, total_fare, platform_fee, driver_net_earnings, payment_method, requested_at, accepted_at, arrived_at, started_at, completed_at)
       VALUES ($1, $2, $3, 'FINALIZADO', 'VIP_SUV', 'Club Táchira, Colinas de Bello Monte', 10.4720000, -66.8750000, 'Aeropuerto Internacional Simón Bolívar, Maiquetía', 10.6012000, -66.9912000, 36.00, 50, 25.00, 72.00, 15.00, 1.00, 112.00, 16.80, 95.20, 'CORPORATE_VOUCHER', NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours', NOW() - INTERVAL '22 hours 50 min', NOW() - INTERVAL '22 hours 40 min', NOW() - INTERVAL '21 hours 50 min')
       RETURNING id`,
      [uPass4, d2Id, v2Id],
    )).rows[0].id;

    // Reseña del viaje completado 2
    await client.query(
      `INSERT INTO reviews (ride_id, author_id, target_id, rating, cleanliness_rating, punctuality_rating, comfort_rating, comment, created_at)
       VALUES ($1, $2, $3, 5, 5, 5, 5, 'Traslado al aeropuerto con puntualidad milimétrica. Maletas acomodadas con cuidado. Todo perfecto.', NOW() - INTERVAL '21 hours')`,
      [rCompleted2Id, uPass4, uDrv2],
    );

    // SITUACIÓN 6: VIAJE CANCELADO CON MOTIVO (CANCELADO)
    await client.query(
      `INSERT INTO rides (passenger_id, driver_id, vehicle_id, status, category_requested, origin_address, origin_latitude, origin_longitude, destination_address, destination_latitude, destination_longitude, distance_km, estimated_duration_min, base_fare, distance_fare, time_fare, surge_multiplier, total_fare, platform_fee, driver_net_earnings, payment_method, requested_at, cancelled_at, cancellation_reason)
       VALUES ($1, null, null, 'CANCELADO', 'EXECUTIVE_SEDAN', 'Torre KPMG, Chacao', 10.4910000, -66.8590000, 'Quinta La Esmeralda, Campo Alegre', 10.4940000, -66.8610000, 2.10, 8, 10.00, 4.20, 2.40, 1.00, 16.60, 2.49, 14.11, 'CASH', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours 52 min', 'Reunión corporativa reprogramada por el cliente')`,
      [uPass2],
    );

    console.log('✅ 6 Viajes sembrados representando todos los estados (EN_CURSO, SOLICITADO, EN_CAMINO, FINALIZADO, CANCELADO).');

    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('🎉 PROCESO DE SIEMBRA COMPLETADO EXITOSAMENTE');
    console.log('═══════════════════════════════════════════════════════════════════════');
  } catch (err) {
    console.error('❌ Error durante la siembra de la base de datos:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedData();
