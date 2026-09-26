const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
let adminToken = '';
let dispatcherToken = '';
let driverToken = '';
let testDriverId = '';
let testVehicleId = '';
let testRideId = '';

const results = [];

function request(method, urlPath, body = null, token = null, isMultipart = false, multipartData = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(urlPath, BASE_URL);
    const headers = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let payload = null;

    if (isMultipart && multipartData) {
      const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substring(2);
      headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
      
      const parts = [];
      parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${multipartData.fieldName}"; filename="${multipartData.filename}"\r\nContent-Type: ${multipartData.mimeType}\r\n\r\n`);
      parts.push(multipartData.content);
      parts.push(`\r\n--${boundary}--\r\n`);
      payload = Buffer.concat(parts.map(p => Buffer.isBuffer(p) ? p : Buffer.from(p)));
      headers['Content-Length'] = payload.length;
    } else if (body) {
      payload = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 3000,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: headers,
      timeout: 10000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ statusCode: res.statusCode, headers: res.headers, data: json });
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => { req.destroy(); reject(new Error('Request Timeout')); });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

function recordTest(testName, passed, details) {
  results.push({ name: testName, passed, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${passed ? 'PASS' : 'FAIL'}] ${testName} - ${details}`);
}

async function runAllTests() {
  console.log('========================================================================');
  console.log('🚀 INICIANDO BATERÍA DE PRUEBAS INTEGRALES DE PUNTA A PUNTA (RUMBO FINO)');
  console.log('========================================================================\n');

  try {
    // -------------------------------------------------------------------------
    // 1. AUTENTICACIÓN & ROLES
    // -------------------------------------------------------------------------
    console.log('--- 1. PRUEBAS DE AUTENTICACIÓN & CONTROL DE ACCESO ---');
    
    // Test 1: Admin Login
    const adminLogin = await request('POST', '/api/v1/auth/login', {
      email: 'admin@rumbofino.com',
      password: 'Admin123!',
    });
    if ((adminLogin.statusCode === 200 || adminLogin.statusCode === 201) && adminLogin.data?.data?.accessToken) {
      adminToken = adminLogin.data.data.accessToken;
      recordTest('Auth: Login Super Admin', true, `Token JWT recibido (Rol: ${adminLogin.data.data.user.role})`);
    } else {
      recordTest('Auth: Login Super Admin', false, `Status ${adminLogin.statusCode}: ${JSON.stringify(adminLogin.data)}`);
    }

    // Test 2: Dispatcher Login
    const dispLogin = await request('POST', '/api/v1/auth/login', {
      email: 'despacho@rumbofino.com',
      password: 'Despacho123!',
    });
    if ((dispLogin.statusCode === 200 || dispLogin.statusCode === 201) && dispLogin.data?.data?.accessToken) {
      dispatcherToken = dispLogin.data.data.accessToken;
      recordTest('Auth: Login Despachador', true, `Token JWT recibido (Rol: ${dispLogin.data.data.user.role})`);
    } else {
      recordTest('Auth: Login Despachador', false, `Status ${dispLogin.statusCode}`);
    }

    // Test 3: Driver Login
    const driverLogin = await request('POST', '/api/v1/auth/login', {
      email: 'chofer1@rumbofino.com',
      password: 'Driver123!',
    });
    if ((driverLogin.statusCode === 200 || driverLogin.statusCode === 201) && driverLogin.data?.data?.accessToken) {
      driverToken = driverLogin.data.data.accessToken;
      recordTest('Auth: Login Chofer VIP', true, `Token JWT recibido (Rol: ${driverLogin.data.data.user.role})`);
    } else {
      recordTest('Auth: Login Chofer VIP', false, `Status ${driverLogin.statusCode}`);
    }

    // Test 4: Invalid Password (Security 401)
    const invalidLogin = await request('POST', '/api/v1/auth/login', {
      email: 'admin@rumbofino.com',
      password: 'ClaveEquivocada!',
    });
    if (invalidLogin.statusCode === 401) {
      recordTest('Seguridad: Rechazo de Contraseña Inválida', true, 'Retorna 401 Unauthorized correctamente');
    } else {
      recordTest('Seguridad: Rechazo de Contraseña Inválida', false, `Esperado 401, recibido ${invalidLogin.statusCode}`);
    }

    // Test 5: Profile Verification with Bearer Token
    const profileRes = await request('GET', '/api/v1/auth/profile', null, adminToken);
    if (profileRes.statusCode === 200 && profileRes.data?.data?.email === 'admin@rumbofino.com') {
      recordTest('Auth: Consulta de Perfil Protegido', true, `Usuario verificado: ${profileRes.data.data.email}`);
    } else {
      recordTest('Auth: Consulta de Perfil Protegido', false, `Status ${profileRes.statusCode}`);
    }

    // -------------------------------------------------------------------------
    // 2. CHOFERES & EXPEDIENTE DIGITAL (VENEZUELA)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. PRUEBAS DE CHOFERES & EXPEDIENTES DIGITALES ---');

    // Test 6: List Drivers
    const driversList = await request('GET', '/api/v1/drivers', null, adminToken);
    if (driversList.statusCode === 200 && Array.isArray(driversList.data?.data)) {
      testDriverId = driversList.data.data[0]?.id;
      recordTest('Choferes: Listado de Choferes Activos', true, `Obtenidos ${driversList.data.data.length} choferes`);
    } else {
      recordTest('Choferes: Listado de Choferes Activos', false, `Status ${driversList.statusCode}`);
    }

    // Test 7: Full Profile with 5 Mandatory Documents
    if (testDriverId) {
      const fullProfile = await request('GET', `/api/v1/drivers/${testDriverId}/full-profile`, null, adminToken);
      const docs = fullProfile.data?.data?.documents || [];
      const has5Docs = docs.length >= 5;
      recordTest(
        'Choferes: Expediente Digital con 5 Documentos Obligatorios',
        fullProfile.statusCode === 200 && has5Docs,
        `Retornó ${docs.length} documentos obligatorios sintetizados (Licencia, Médico, Manejo, Antecedentes, Cédula)`
      );
    }

    // Test 8: Multipart File Upload
    const dummyFileContent = Buffer.from('PDF_DUMMY_EXPEDIENTE_RUMBO_FINO_VENEZUELA_2026');
    const uploadRes = await request('POST', '/api/v1/drivers/upload-file', null, adminToken, true, {
      fieldName: 'file',
      filename: 'licencia_conducir_carlos.pdf',
      mimeType: 'application/pdf',
      content: dummyFileContent,
    });
    
    let uploadedFileUrl = '';
    const fileUrl = uploadRes.data?.data?.fileUrl || uploadRes.data?.data?.url;
    if (uploadRes.statusCode === 201 && fileUrl) {
      uploadedFileUrl = fileUrl;
      recordTest('Choferes: Subida Física de Archivos PDF/Foto', true, `Guardado en disco: ${uploadedFileUrl}`);
    } else {
      recordTest('Choferes: Subida Física de Archivos PDF/Foto', false, `Status ${uploadRes.statusCode}: ${JSON.stringify(uploadRes.data)}`);
    }

    // Test 9: Static Asset Serving from /uploads/drivers/...
    if (uploadedFileUrl) {
      const staticRes = await request('GET', uploadedFileUrl);
      recordTest(
        'Servidor: Entrega de Archivos Estáticos (/uploads/drivers)',
        staticRes.statusCode === 200,
        `Servido exitosamente con Status ${staticRes.statusCode}`
      );
    }

    // -------------------------------------------------------------------------
    // 3. FLOTA & VEHÍCULOS DISPATCH-READY
    // -------------------------------------------------------------------------
    console.log('\n--- 3. PRUEBAS DE FLOTA & VEHÍCULOS HABILITADOS ---');

    // Test 10: List All Vehicles
    const vehiclesList = await request('GET', '/api/v1/vehicles', null, adminToken);
    if (vehiclesList.statusCode === 200 && Array.isArray(vehiclesList.data?.data)) {
      testVehicleId = vehiclesList.data.data[0]?.id;
      recordTest('Vehículos: Listado General de Flota', true, `Total ${vehiclesList.data.data.length} vehículos en catálogo`);
    } else {
      recordTest('Vehículos: Listado General de Flota', false, `Status ${vehiclesList.statusCode}`);
    }

    // Test 11: Dispatch-Ready Vehicles Filter
    const dispatchReady = await request('GET', '/api/v1/vehicles/dispatch-ready', null, adminToken);
    if (dispatchReady.statusCode === 200 && Array.isArray(dispatchReady.data?.data)) {
      recordTest(
        'Vehículos: Filtro de Unidades Habilitadas para Despacho',
        true,
        `${dispatchReady.data.data.length} vehículos aprobados y conectados en línea`
      );
    } else {
      recordTest('Vehículos: Filtro de Unidades Habilitadas para Despacho', false, `Status ${dispatchReady.statusCode}`);
    }

    // Test 12: Update Vehicle Status
    if (testVehicleId) {
      const updateStatus = await request('PATCH', `/api/v1/vehicles/${testVehicleId}/status`, { status: 'AVAILABLE' }, adminToken);
      recordTest(
        'Vehículos: Actualización de Estado Operativo',
        updateStatus.statusCode === 200,
        `Vehículo ${testVehicleId.substring(0, 8)} actualizado a AVAILABLE`
      );
    }

    // -------------------------------------------------------------------------
    // 4. CICLO DE VIDA DE VIAJES & DESPACHO
    // -------------------------------------------------------------------------
    console.log('\n--- 4. PRUEBAS DE DESPACHO & MÁQUINA DE ESTADOS DE VIAJE ---');

    // Test 13: Create & Dispatch Ride in Venezuela (Caracas Las Mercedes -> Maiquetía)
    // Find passenger ID from database/seed or users list
    const newRidePayload = {
      passengerId: 'eb49d543-e8ea-4311-aec6-f7097e752e87',
      categoryRequested: 'EXECUTIVE_SEDAN',
      originAddress: 'Centro Financiero Las Mercedes, Caracas',
      originLat: 10.4806,
      originLng: -66.8622,
      destinationAddress: 'Aeropuerto Internacional Simón Bolívar de Maiquetía (CCS)',
      destinationLat: 10.6031,
      destinationLng: -66.9906,
      paymentMethod: 'PAGO_MOVIL',
    };

    const createRide = await request('POST', '/api/v1/rides', newRidePayload, dispatcherToken);
    if ((createRide.statusCode === 200 || createRide.statusCode === 201) && createRide.data?.data?.id) {
      testRideId = createRide.data.data.id;
      const fare = createRide.data.data.totalFare;
      const dist = createRide.data.data.distanceKm;
      recordTest(
        'Viajes: Despacho de Viaje VIP con Cálculo de Tarifa',
        true,
        `Viaje ${testRideId.substring(0, 8)} creado (${dist} km, $${fare} USD, Estado: ${createRide.data.data.status})`
      );
    } else {
      recordTest('Viajes: Despacho de Viaje VIP con Cálculo de Tarifa', false, `Status ${createRide.statusCode}: ${JSON.stringify(createRide.data)}`);
    }

    // Test 14: Active Rides Endpoint
    const activeRides = await request('GET', '/api/v1/rides/active', null, dispatcherToken);
    if (activeRides.statusCode === 200 && Array.isArray(activeRides.data?.data)) {
      recordTest(
        'Viajes: Consulta de Servicios Activos en Tiempo Real',
        true,
        `Retornó ${activeRides.data.data.length} viajes en curso para el mapa`
      );
    } else {
      recordTest('Viajes: Consulta de Servicios Activos en Tiempo Real', false, `Status ${activeRides.statusCode}`);
    }

    // Test 15-19: State Machine Cycle
    if (testRideId) {
      // SOLICITADO -> ASIGNADO
      const s1 = await request('PATCH', `/api/v1/rides/${testRideId}/status`, { status: 'ASIGNADO' }, dispatcherToken);
      recordTest('Máquina de Estados: Transición a ASIGNADO', s1.statusCode === 200, `Estado: ${s1.data?.data?.status}`);

      // ASIGNADO -> EN_CAMINO
      const s2 = await request('PATCH', `/api/v1/rides/${testRideId}/status`, { status: 'EN_CAMINO' }, driverToken);
      recordTest('Máquina de Estados: Transición a EN_CAMINO', s2.statusCode === 200, `Estado: ${s2.data?.data?.status}`);

      // EN_CAMINO -> ABORDAJE
      const s3 = await request('PATCH', `/api/v1/rides/${testRideId}/status`, { status: 'ABORDAJE' }, driverToken);
      recordTest('Máquina de Estados: Transición a ABORDAJE', s3.statusCode === 200, `Estado: ${s3.data?.data?.status}`);

      // ABORDAJE -> EN_CURSO
      const s4 = await request('PATCH', `/api/v1/rides/${testRideId}/status`, { status: 'EN_CURSO' }, driverToken);
      recordTest('Máquina de Estados: Transición a EN_CURSO (Pasajero a Bordo)', s4.statusCode === 200, `Estado: ${s4.data?.data?.status}`);

      // EN_CURSO -> FINALIZADO
      const s5 = await request('PATCH', `/api/v1/rides/${testRideId}/status`, { status: 'FINALIZADO' }, driverToken);
      recordTest('Máquina de Estados: Transición a FINALIZADO (Servicio Liquidado)', s5.statusCode === 200, `Estado: ${s5.data?.data?.status}`);
    }

    // -------------------------------------------------------------------------
    // 5. FINANZAS & BILLETERAS (VENEZUELA)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. PRUEBAS DE FINANZAS & BILLETERAS VENEZUELA ---');

    // Test 20: Financial Summary
    const finSummary = await request('GET', '/api/v1/financials/summary', null, adminToken);
    if (finSummary.statusCode === 200) {
      recordTest(
        'Finanzas: Resumen Global de Recaudación',
        true,
        `Volumen Bruto: $${finSummary.data.data.totalVolume} USD, Comisión Plataforma: $${finSummary.data.data.totalPlatformCommission} USD`
      );
    } else {
      recordTest('Finanzas: Resumen Global de Recaudación', false, `Status ${finSummary.statusCode}`);
    }

    // Test 21: Driver Wallets & Debt Balances
    const balances = await request('GET', '/api/v1/financials/balances', null, adminToken);
    if (balances.statusCode === 200 && Array.isArray(balances.data?.data)) {
      recordTest(
        'Finanzas: Billeteras y Control de Deudas de Choferes',
        true,
        `Auditadas ${balances.data.data.length} billeteras de choferes`
      );
    } else {
      recordTest('Finanzas: Billeteras y Control de Deudas de Choferes', false, `Status ${balances.statusCode}`);
    }

    // Test 22: Transactions Ledger
    const transactions = await request('GET', '/api/v1/financials/transactions', null, adminToken);
    if (transactions.statusCode === 200 && Array.isArray(transactions.data?.data)) {
      recordTest(
        'Finanzas: Libro Mayor de Transacciones',
        true,
        `${transactions.data.data.length} asientos contables registrados`
      );
    } else {
      recordTest('Finanzas: Libro Mayor de Transacciones', false, `Status ${transactions.statusCode}`);
    }

    // -------------------------------------------------------------------------
    // RESUMEN FINAL
    // -------------------------------------------------------------------------
    console.log('\n========================================================================');
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    console.log(`📊 REPORTE DE EJECUCIÓN: ${passedCount}/${totalCount} PRUEBAS EXITOSAS (${Math.round((passedCount/totalCount)*100)}%)`);
    console.log('========================================================================');

    if (passedCount === totalCount) {
      console.log('🎉 TODAS LAS FUNCIONALIDADES DEL SISTEMA OPERAN AL 100% SIN ERRORES.');
    } else {
      console.log(`⚠️ Se identificaron ${totalCount - passedCount} pruebas con observaciones.`);
    }

  } catch (err) {
    console.error('❌ Error fatal durante la ejecución de pruebas:', err);
  }
}

runAllTests();
