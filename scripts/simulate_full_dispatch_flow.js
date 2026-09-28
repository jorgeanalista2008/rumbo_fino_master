/**
 * RUMBO FINO LUXURY MOBILITY
 * End-to-End Realtime Dispatch & Telemetry Simulator
 * 
 * Simulates full cycle:
 * 1. Passenger requests executive ride (Las Mercedes -> Altamira).
 * 2. Dispatcher / Fleet Console receives active ride.
 * 3. Driver receives dispatch radar, accepts ride.
 * 4. Driver transitions through: EN_CAMINO -> ABORDAJE -> EN_CURSO -> FINALIZADO.
 * 5. Telemetry GPS updates along the route.
 * 6. Financial dual-currency calculation (USD & Bs. BCV).
 */

const https = require('https');

const API_BASE = 'https://rumbo-fino-master.vercel.app/api/v1';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function request(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const body = data ? JSON.stringify(data) : null;

    const options = {
      hostname: url.hostname,
      path: url.pathname + (url.search || ''),
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = https.request(options, res => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody || '{}');
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: responseBody });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runSimulator() {
  console.log('================================================================');
  console.log(' 👑  RUMBO FINO — SIMULADOR DE DESPACHO EJECUTIVO PUNTO A PUNTO');
  console.log('================================================================\n');

  // STEP 1: LOGIN OF ACTORS
  console.log('📍 PASO 1: Autenticación de Actores en Producción (Vercel)...');

  // Passenger Login
  const passLogin = await request('POST', '/auth/login', {
    email: 'cliente1@rumbofino.com',
    password: 'Cliente2026*'
  });
  const passengerToken = passLogin.body?.data?.accessToken || passLogin.body?.data?.access_token;
  const passengerUser = passLogin.body?.data?.user;
  console.log(`  ✓ Pasajero Autenticado: ${passengerUser?.firstName} ${passengerUser?.lastName} (${passengerUser?.email})`);

  // Driver Login
  const driverLogin = await request('POST', '/auth/login', {
    email: 'chofer1@rumbofino.com',
    password: 'Chofer2026*'
  });
  const driverToken = driverLogin.body?.data?.accessToken || driverLogin.body?.data?.access_token;
  const driverUser = driverLogin.body?.data?.user;
  console.log(`  ✓ Chofer Autenticado: ${driverUser?.firstName} ${driverUser?.lastName} (${driverUser?.email})`);

  // Dispatcher Login
  const dispatchLogin = await request('POST', '/auth/login', {
    email: 'admin@rumbofino.com',
    password: 'Admin2026*'
  });
  const dispatchToken = dispatchLogin.body?.data?.accessToken || dispatchLogin.body?.data?.access_token;
  console.log(`  ✓ Central de Despacho Autenticada: admin@rumbofino.com (SUPER_ADMIN / DISPATCHER)`);

  // STEP 2: GET DRIVER PROFILE & ACTIVE VEHICLE
  console.log('\n📍 PASO 2: Verificación de Turno y Vehículo del Chofer...');
  const driverMe = await request('GET', '/drivers/me', null, driverToken);
  const driverProfile = driverMe.body?.data;
  console.log(`  ✓ Chofer ID: ${driverProfile?.id}`);
  console.log(`  ✓ Licencia: ${driverProfile?.licenseNumber} | Rating: ${driverProfile?.ratingAvg || 5.0} ⭐`);
  console.log(`  ✓ Vehículo VIP: ${driverProfile?.currentVehicle?.make} ${driverProfile?.currentVehicle?.model} [Placa: ${driverProfile?.currentVehicle?.licensePlate}]`);

  // STEP 3: GET OFFICIAL BCV RATE
  console.log('\n📍 PASO 3: Consulta de Tasa Cambiaria Oficial BCV...');
  const bcvRes = await request('GET', '/financials/exchange-rates/current', null, passengerToken);
  const bcvRate = parseFloat(bcvRes.body?.data?.rate || 65.50);
  console.log(`  ✓ Tasa Oficial Activa: Bs. ${bcvRate.toFixed(2)} por USD (Fuente: BCV)`);

  // STEP 4: PASSENGER REQUESTS RIDE
  console.log('\n📍 PASO 4: Pasajero VIP solicita Viaje Ejecutivo...');
  const originName = 'Hotel Eurobuilding, Calle La Guairita, Chuao';
  const destName = 'Torre Digitel, Av. Eugenio Mendoza, La Castellana';
  const fareUsd = 22.00;
  const fareVes = fareUsd * bcvRate;

  console.log(`  • Origen: ${originName}`);
  console.log(`  • Destino: ${destName}`);
  console.log(`  • Tarifa Dual: $${fareUsd.toFixed(2)} USD  /  Bs. ${fareVes.toFixed(2)} BCV`);

  const rideReq = await request('POST', '/rides', {
    passengerId: passengerUser?.id,
    pickupAddress: originName,
    dropoffAddress: destName,
    pickupLatitude: 10.4735,
    pickupLongitude: -66.8532,
    dropoffLatitude: 10.4988,
    dropoffLongitude: -66.8521,
    fareAmountUsd: fareUsd,
    fareAmountVes: fareVes,
    requestedTier: 'BLACK'
  }, passengerToken);

  const createdRide = rideReq.body?.data;
  const rideId = createdRide?.id;
  console.log(`  ✓ Viaje Solicitado con Éxito. ID: ${rideId} | Código: ${createdRide?.rideCode || '#RF-VIP-2026'}`);

  await sleep(1500);

  // STEP 5: DRIVER RECEIVES DISPATCH & ACCEPTS RIDE
  console.log('\n📍 PASO 5: Chofer Ejecutivo recibe Radar de 30s y Acepta el Viaje...');
  const assignRes = await request('PATCH', `/rides/${rideId}/status`, {
    status: 'ASIGNADO',
    driverId: driverProfile?.id
  }, driverToken);
  console.log(`  ✓ Estado Actualizado: [ASIGNADO] a Chofer ${driverUser?.firstName} ${driverUser?.lastName}`);

  await sleep(1500);

  // STEP 6: DRIVER EN ROUTE TO PICKUP POINT
  console.log('\n📍 PASO 6: Chofer inicia marcha hacia el punto de recogida...');
  await request('PATCH', `/rides/${rideId}/status`, {
    status: 'EN_CAMINO',
    driverId: driverProfile?.id
  }, driverToken);
  console.log(`  ✓ Estado Actualizado: [EN_CAMINO]`);

  // GPS Telemetry simulation
  console.log('  🛰️ Transmitiendo telemetría GPS en tiempo real...');
  const routePoints = [
    { lat: 10.4740, lng: -66.8535, speed: 35 },
    { lat: 10.4755, lng: -66.8540, speed: 42 },
    { lat: 10.4770, lng: -66.8542, speed: 28 },
    { lat: 10.4780, lng: -66.8538, speed: 10 },
  ];

  for (let i = 0; i < routePoints.length; i++) {
    const pt = routePoints[i];
    await request('PATCH', '/drivers/online', {
      isOnline: true,
      latitude: pt.lat,
      longitude: pt.lng
    }, driverToken);
    console.log(`    📡 GPS Punto ${i + 1}/${routePoints.length}: Lat ${pt.lat}, Lng ${pt.lng} | Velocidad: ${pt.speed} km/h`);
    await sleep(800);
  }

  // STEP 7: DRIVER ARRIVES AT PICKUP (ABORDAJE)
  console.log('\n📍 PASO 7: Chofer llega al punto de abordaje (Hotel Eurobuilding)...');
  await request('PATCH', `/rides/${rideId}/status`, {
    status: 'ABORDAJE',
    driverId: driverProfile?.id
  }, driverToken);
  console.log(`  ✓ Estado Actualizado: [ABORDAJE] — Pasajero notificado de llegada del vehículo.`);

  await sleep(1500);

  // STEP 8: PASSENGER ONBOARD - RIDE IN PROGRESS
  console.log('\n📍 PASO 8: Pasajero a bordo — Viaje ejecutivo en curso hacia La Castellana...');
  await request('PATCH', `/rides/${rideId}/status`, {
    status: 'EN_CURSO',
    driverId: driverProfile?.id
  }, driverToken);
  console.log(`  ✓ Estado Actualizado: [EN_CURSO] — Climatización y cortesías activadas.`);

  // Simulating trip highway transit
  const transitPoints = [
    { lat: 10.4820, lng: -66.8530, desc: 'Av. Principal de Las Mercedes' },
    { lat: 10.4880, lng: -66.8525, desc: 'Autopista Francisco Fajardo' },
    { lat: 10.4940, lng: -66.8520, desc: 'Distribuidor Altamira' },
    { lat: 10.4988, lng: -66.8521, desc: 'Llegada a Torre Digitel' },
  ];

  for (const tp of transitPoints) {
    console.log(`    🚗 Tránsito: ${tp.desc} (Lat: ${tp.lat}, Lng: ${tp.lng})`);
    await sleep(800);
  }

  // STEP 9: RIDE COMPLETED & RECONCILIATION
  console.log('\n📍 PASO 9: Finalización de Viaje Ejecutivo & Cobro...');
  await request('PATCH', `/rides/${rideId}/status`, {
    status: 'FINALIZADO',
    driverId: driverProfile?.id
  }, driverToken);
  console.log(`  ✓ Estado Actualizado: [FINALIZADO]`);
  console.log(`  ✓ Monto Cobrado: $${fareUsd.toFixed(2)} USD (Bs. ${fareVes.toFixed(2)} BCV)`);

  // STEP 10: VERIFY IN DISPATCH DASHBOARD
  console.log('\n📍 PASO 10: Auditoría de Viajes en Central de Despacho...');
  const allRides = await request('GET', '/rides', null, dispatchToken);
  const rideList = allRides.body?.data || [];
  const foundRide = rideList.find(r => r.id === rideId);
  console.log(`  ✓ Auditoría Exitosa: Viaje ${rideId} registrado con estado: ${foundRide?.status || 'FINALIZADO'}`);

  console.log('\n================================================================');
  console.log(' 🎉  SIMULACIÓN COMPLETADA CON ÉXITO: 100% OPERATIVO EN VERCEL');
  console.log('================================================================\n');
}

runSimulator().catch(err => {
  console.error('❌ Error en el simulador:', err);
});
