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

async function seedData() {
  const credentials = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'Jf18759339',
    database: process.env.DB_NAME || 'rumbo_fino',
  };

  console.log("🌱 Conectando a la base de datos 'rumbo_fino' para sembrar datos de prueba con Ficha Técnica Completa...");
  const client = new Client(credentials);

  try {
    await client.connect();
    console.log('✅ Conexión establecida.');

    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('Admin123!', salt);
    const dispatcherPass = await bcrypt.hash('Despacho123!', salt);
    const driverPass = await bcrypt.hash('Driver123!', salt);
    const passengerPass = await bcrypt.hash('Passenger123!', salt);

    console.log('👤 Sembrando Usuarios (Super Admin, Despachador, Choferes, Pasajeros VIP)...');

    // Super Admin
    const adminRes = await client.query(
      `INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
       RETURNING id`,
      ['admin@rumbofino.com', adminPass, '+18005550001', 'Alexander', 'Vance', 'SUPER_ADMIN', 'ACTIVE'],
    );
    const adminId = adminRes.rows[0].id;

    // Dispatcher
    const dispatcherRes = await client.query(
      `INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
       RETURNING id`,
      ['despacho@rumbofino.com', dispatcherPass, '+18005550002', 'Mariana', 'Valdez', 'DISPATCHER', 'ACTIVE'],
    );
    const dispatcherId = dispatcherRes.rows[0].id;

    // Drivers Users
    const driverUser1Res = await client.query(
      `INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
       RETURNING id`,
      ['chofer1@rumbofino.com', driverPass, '+18005551001', 'Carlos', 'Mendoza', 'DRIVER', 'ACTIVE'],
    );
    const driverUser1Id = driverUser1Res.rows[0].id;

    const driverUser2Res = await client.query(
      `INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
       RETURNING id`,
      ['chofer2@rumbofino.com', driverPass, '+18005551002', 'Roberto', 'Silva', 'DRIVER', 'ACTIVE'],
    );
    const driverUser2Id = driverUser2Res.rows[0].id;

    // VIP Passengers Users
    const passUser1Res = await client.query(
      `INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
       RETURNING id`,
      ['pasajero1@rumbofino.com', passengerPass, '+18005552001', 'Elena', 'Rostova', 'PASSENGER', 'ACTIVE'],
    );
    const passenger1Id = passUser1Res.rows[0].id;

    const passUser2Res = await client.query(
      `INSERT INTO users (email, password_hash, phone_number, first_name, last_name, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
       RETURNING id`,
      ['pasajero2@rumbofino.com', passengerPass, '+18005552002', 'Gabriel', 'García', 'PASSENGER', 'ACTIVE'],
    );
    const passenger2Id = passUser2Res.rows[0].id;

    // -------------------------------------------------------------------------
    // 2. VEHICLES (Con Ficha Técnica Completa y Galería)
    // -------------------------------------------------------------------------
    console.log('🚘 Sembrando Flota Ejecutiva con Ficha Técnica Detallada...');
    
    // Drop and recreate vehicles table to ensure new columns apply cleanly
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

    const schemaScript = require('fs').readFileSync(require('path').join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schemaScript);

    const vehicle1Res = await client.query(
      `INSERT INTO vehicles (make, model, year, color, license_plate, vin, seats, category, status, transmission, fuel_type, luggage_capacity, amenities, photos)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id`,
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
          'Tomas de Corriente 110V / USB-C Rápido',
          'Agua Evian y Snacks VIP',
          'Cristales Tintados de Privacidad',
          'Sistema de Sonido Burmester® 3D',
        ]),
        JSON.stringify([
          'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1000&auto=format&fit=crop',
        ]),
      ],
    );
    const vehicle1Id = vehicle1Res.rows[0].id;

    const vehicle2Res = await client.query(
      `INSERT INTO vehicles (make, model, year, color, license_plate, vin, seats, category, status, transmission, fuel_type, luggage_capacity, amenities, photos)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id`,
      [
        'Cadillac',
        'Escalade ESV Platinum',
        2025,
        'Azul Midnight Imperial',
        'LUX-999',
        '1GYS4HKJ8R1987654',
        7,
        'VIP_SUV',
        'AVAILABLE',
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
          'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1000&auto=format&fit=crop',
        ]),
      ],
    );
    const vehicle2Id = vehicle2Res.rows[0].id;

    // -------------------------------------------------------------------------
    // 3. DRIVERS & BALANCES
    // -------------------------------------------------------------------------
    console.log('👨‍✈️ Sembrando Perfiles de Choferes...');
    const driver1Res = await client.query(
      `INSERT INTO drivers (user_id, license_number, license_category, license_expiration, rating_avg, total_rides, is_online, current_latitude, current_longitude, current_vehicle_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [driverUser1Id, 'LIC-A3C-998877', 'A-IIIc Executive', '2028-12-31', 4.95, 142, true, -12.046374, -77.042793, vehicle1Id],
    );
    const driver1Id = driver1Res.rows[0].id;

    const driver2Res = await client.query(
      `INSERT INTO drivers (user_id, license_number, license_category, license_expiration, rating_avg, total_rides, is_online, current_latitude, current_longitude, current_vehicle_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [driverUser2Id, 'LIC-A3C-554433', 'A-IIIc Executive', '2029-06-30', 5.00, 89, false, -12.080000, -77.030000, null],
    );
    const driver2Id = driver2Res.rows[0].id;

    // Balances
    await client.query(
      `INSERT INTO driver_balances (driver_id, current_balance, pending_payout, total_earned, total_commission_paid)
       VALUES ($1, $2, $3, $4, $5)`,
      [driver1Id, 340.50, 120.00, 1850.00, 326.47],
    );

    await client.query(
      `INSERT INTO driver_balances (driver_id, current_balance, pending_payout, total_earned, total_commission_paid)
       VALUES ($1, $2, $3, $4, $5)`,
      [driver2Id, 195.00, 0.00, 920.00, 162.35],
    );

    // Active Shift
    await client.query(
      `INSERT INTO driver_vehicle_assignments (driver_id, vehicle_id, initial_odometer, shift_status, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [driver1Id, vehicle1Id, 15400, 'ACTIVE', 'Turno ejecutivo de mañana sin novedades'],
    );

    // Documents for Vehicles
    await client.query(
      `INSERT INTO vehicle_documents (vehicle_id, document_type, document_number, file_url, expiration_date, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [vehicle1Id, 'SOAT_INSURANCE', 'SOAT-2026-998811', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '2026-12-31', 'APPROVED'],
    );

    await client.query(
      `INSERT INTO vehicle_documents (vehicle_id, document_type, document_number, file_url, expiration_date, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [vehicle1Id, 'TECHNICAL_INSPECTION', 'REV-TECH-2026-4411', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '2026-11-30', 'PENDING'],
    );

    // -------------------------------------------------------------------------
    // 4. RIDES, TRANSACTIONS & REVIEWS
    // -------------------------------------------------------------------------
    console.log('🛣️ Sembrando Viajes de Prueba...');
    const ride1Res = await client.query(
      `INSERT INTO rides (passenger_id, driver_id, vehicle_id, status, category_requested, origin_address, origin_latitude, origin_longitude, destination_address, destination_latitude, destination_longitude, distance_km, estimated_duration_min, base_fare, distance_fare, time_fare, surge_multiplier, total_fare, platform_fee, driver_net_earnings, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
       RETURNING id`,
      [
        passenger1Id,
        driver1Id,
        vehicle1Id,
        'FINALIZADO',
        'EXECUTIVE_SEDAN',
        'Hotel Marriott, Av. Larco 1300, Miraflores',
        -12.1315,
        -77.0305,
        'Aeropuerto Internacional Jorge Chávez (Terminal VIP)',
        -12.0219,
        -77.1143,
        18.50,
        35,
        10.00,
        27.75,
        7.25,
        1.00,
        45.00,
        6.75,
        38.25,
        'CREDIT_CARD',
      ],
    );
    const ride1Id = ride1Res.rows[0].id;

    await client.query(
      `INSERT INTO transactions (ride_id, driver_id, passenger_id, type, amount, currency, status, reference_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [ride1Id, driver1Id, passenger1Id, 'RIDE_FARE', 45.00, 'USD', 'COMPLETED', `FARE-${ride1Id.substring(0, 8)}`],
    );

    await client.query(
      `INSERT INTO transactions (ride_id, driver_id, type, amount, currency, status, reference_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [ride1Id, driver1Id, 'PLATFORM_COMMISSION', 6.75, 'USD', 'COMPLETED', `COMM-${ride1Id.substring(0, 8)}`],
    );

    await client.query(
      `INSERT INTO reviews (ride_id, author_id, target_id, rating, cleanliness_rating, punctuality_rating, comfort_rating, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        ride1Id,
        passenger1Id,
        driverUser1Id,
        5,
        5,
        5,
        5,
        'Excelente servicio ejecutivo. El chofer Carlos fue sumamente puntual, refinado y el Mercedes E-Class estaba impecable.',
      ],
    );

    console.log('------------------------------------------------------------------');
    console.log('🎉 DATOS DE PRUEBA Y FICHA TÉCNICA RE-SEMBRADOS EXITOSAMENTE');
    console.log('------------------------------------------------------------------');
  } catch (err) {
    console.error('❌ Error sembrando datos de prueba:', err);
  } finally {
    await client.end();
  }
}

seedData();
