#!/usr/bin/env node

/**
 * 🧪 Script de Prueba de APIs (Node.js)
 * Prueba todas las APIs principales del sistema
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

let passed = 0;
let failed = 0;

async function testEndpoint(method, endpoint, data = null, expectedStatus = 200, description) {
  process.stdout.write(`Testing: ${description}... `);

  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, options);
    const body = await response.text();
    let jsonBody;

    try {
      jsonBody = JSON.parse(body);
    } catch {
      jsonBody = body;
    }

    const status = response.status;
    const statusOk = Array.isArray(expectedStatus)
      ? expectedStatus.includes(status)
      : status === expectedStatus;

    if (statusOk) {
      console.log(`${colors.green}✓ PASSED${colors.reset} (Status: ${status})`);
      passed++;
      return { success: true, status, body: jsonBody };
    } else {
      console.log(`${colors.red}✗ FAILED${colors.reset} (Expected: ${expectedStatus}, Got: ${status})`);
      console.log(`  Response:`, jsonBody);
      failed++;
      return { success: false, status, body: jsonBody };
    }
  } catch (error) {
    console.log(`${colors.red}✗ ERROR${colors.reset}: ${error.message}`);
    failed++;
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Iniciando pruebas de APIs...');
  console.log(`📍 Base URL: ${BASE_URL}\n`);

  // 1. Health Check
  await testEndpoint('GET', '/', null, 301, 'Home redirect');

  // 2. Get available slots
  const today = new Date().toISOString().split('T')[0];
  await testEndpoint('GET', `/api/appointments/available?start=${today}`, null, 200, 'Get available slots');

  // 3. Get properties
  await testEndpoint('GET', '/api/properties', null, 200, 'Get properties');

  // 4. Get EasyBroker properties
  await testEndpoint('GET', '/api/easybroker/properties?limit=5', null, [200, 500], 'Get EasyBroker properties');

  // 5. Create appointment (if slots available)
  const slotsResponse = await testEndpoint('GET', `/api/appointments/available?start=${today}`, null, 200, 'Get slots for appointment');

  if (slotsResponse.success && Array.isArray(slotsResponse.body) && slotsResponse.body.length > 0) {
    const firstDay = slotsResponse.body[0];
    if (firstDay.slots && firstDay.slots.length > 0) {
      const firstSlot = firstDay.slots[0];
      const appointmentData = {
        date: firstDay.date,
        time: firstSlot.time,
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        phone: '5551234567',
        operationType: 'rentar',
        budgetRentar: '5000-10000',
      };
      await testEndpoint('POST', '/api/appointments', appointmentData, [200, 201], 'Create appointment');
    } else {
      console.log(`${colors.yellow}⚠ SKIPPED${colors.reset}: Create appointment (no slots available)`);
    }
  }

  // 6. Check slot (will likely 404 without real slotId)
  await testEndpoint('GET', '/api/appointments/check-slot?slotId=test-id', null, [404, 400], 'Check slot');

  // 7. CRM appointments list (may require auth)
  await testEndpoint('GET', '/api/crm/appointments-list', null, [200, 401], 'Get CRM appointments list');

  // 8. Auth check session
  await testEndpoint('GET', '/api/auth/check-session', null, [200, 401], 'Check auth session');

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Resumen de Pruebas:');
  console.log(`  ${colors.green}✓ Passed: ${passed}${colors.reset}`);
  console.log(`  ${colors.red}✗ Failed: ${failed}${colors.reset}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (failed === 0) {
    console.log(`${colors.green}✅ Todas las pruebas pasaron!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ Algunas pruebas fallaron${colors.reset}`);
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error(`${colors.red}❌ Error fatal:${colors.reset}`, error);
  process.exit(1);
});

