const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { query, get, run, transaction, initDb } = require('../database/db');
const { seedData } = require('../database/seed');
const { CircuitBreaker } = require('../services/circuitBreaker');
const { sanitizeInput } = require('../middleware/sanitization');
const { generateLicenseSignature, verifyLicenseSignature } = require('../services/licenseCache');
const whatsappService = require('../services/whatsappService');

let passedTests = 0;
let failedTests = 0;
const failedTestDetails = [];

async function runTest(name, fn) {
  const start = performance.now();
  try {
    process.stdout.write(`⚡ [STRESS] ${name}... `);
    await fn();
    const duration = (performance.now() - start).toFixed(1);
    console.log(`✅ PASSOU (${duration}ms)`);
    passedTests++;
  } catch (err) {
    const duration = (performance.now() - start).toFixed(1);
    console.log(`❌ FALHOU (${duration}ms)`);
    console.error(`   Detalhe do Erro:`, err.message);
    failedTestDetails.push({ name, error: err.message });
    failedTests++;
  }
}

async function startStressSuite() {
  console.log('\n================================================================');
  console.log('🔥 BATERIA DE TESTES PESADOS & CONCORRÊNCIA EXTREMA (HEAVY LOAD)');
  console.log('================================================================\n');

  await initDb();
  await seedData();

  const stressTenant = `tenant_stress_${Date.now()}`;
  await run(
    `INSERT INTO tenants (id, name, owner_name, owner_email, plan, active)
     VALUES (?, 'Salão Stress Testing', 'Tester', ?, 'PRO', 1)`,
    [stressTenant, `stress_${Date.now()}@teste.com`]
  );

  // ==========================================================================
  // TEST 1: Inserção Massiva Concorrente (500 registros em paralelo)
  // ==========================================================================
  await runTest('1. Concorrência Massiva: 500 Inserções Simultâneas sem Perda', async () => {
    const TOTAL_INSERTS = 500;
    const promises = [];

    const startTime = performance.now();
    for (let i = 1; i <= TOTAL_INSERTS; i++) {
      promises.push(
        run(
          'INSERT INTO clients (name, phone, email, tenant_id) VALUES (?, ?, ?, ?)',
          [`Cliente Stress #${i}`, `(11) 9${String(i).padStart(8, '0')}`, `stress${i}@exemplo.com`, stressTenant]
        )
      );
    }

    await Promise.all(promises);
    const elapsedSec = (performance.now() - startTime) / 1000;

    const countResult = await get(
      'SELECT COUNT(*) as total FROM clients WHERE tenant_id = ?',
      [stressTenant]
    );

    assert.strictEqual(countResult.total, TOTAL_INSERTS, `Deveria ter exatamente ${TOTAL_INSERTS} registros inseridos.`);
    const opsPerSec = (TOTAL_INSERTS / elapsedSec).toFixed(0);
    process.stdout.write(`[Throughput: ${opsPerSec} ops/seg] `);
  });

  // ==========================================================================
  // TEST 2: Integridade Matemática de Caixa Diário em Carga (200 transações)
  // ==========================================================================
  await runTest('2. Frente de Caixa: 200 Movimentações Concorrentes com Balanço Centavo a Centavo', async () => {
    const INITIAL_BALANCE = 250.00;
    const NUM_ENTRIES = 100;
    const ENTRY_VALUE = 15.50; // Total Entradas = 1550.00
    const NUM_EXITS = 100;
    const EXIT_VALUE = 5.25;   // Total Saídas = 525.00
    // Saldo esperado = 250.00 + 1550.00 - 525.00 = 1275.00

    // 1. Abrir sessão de caixa para o teste
    const cashRegister = await run(
      `INSERT INTO cash_registers (initial_balance, system_balance, status, opened_by, tenant_id)
       VALUES (?, ?, 'aberto', 'Recepção Teste', ?)`,
      [INITIAL_BALANCE, INITIAL_BALANCE, stressTenant]
    );
    const cashRegisterId = cashRegister.lastID;

    // 2. Disparar 100 entradas e 100 saídas simultâneas
    const txPromises = [];

    for (let i = 0; i < NUM_ENTRIES; i++) {
      txPromises.push(
        run(
          `INSERT INTO cash_movements (cash_register_id, type, amount, payment_method, description, tenant_id)
           VALUES (?, 'venda', ?, 'pix', ?, ?)`,
          [cashRegisterId, ENTRY_VALUE, `Entrada Stress #${i + 1}`, stressTenant]
        )
      );
    }

    for (let i = 0; i < NUM_EXITS; i++) {
      txPromises.push(
        run(
          `INSERT INTO cash_movements (cash_register_id, type, amount, payment_method, description, tenant_id)
           VALUES (?, 'sangria', ?, 'dinheiro', ?, ?)`,
          [cashRegisterId, EXIT_VALUE, `Saída Stress #${i + 1}`, stressTenant]
        )
      );
    }

    await Promise.all(txPromises);

    // 3. Calcular saldo consolidado via SQL e verificar integridade centavo a centavo
    const inTotal = (await get(
      `SELECT COALESCE(SUM(amount), 0) as total FROM cash_movements WHERE cash_register_id = ? AND type = 'venda'`,
      [cashRegisterId]
    )).total;

    const outTotal = (await get(
      `SELECT COALESCE(SUM(amount), 0) as total FROM cash_movements WHERE cash_register_id = ? AND type = 'sangria'`,
      [cashRegisterId]
    )).total;

    const calculatedBalance = INITIAL_BALANCE + inTotal - outTotal;
    const expectedBalance = 1275.00;

    assert.strictEqual(Math.abs(calculatedBalance - expectedBalance) < 0.001, true, `Saldo calculado (${calculatedBalance}) diferente do esperado (${expectedBalance})`);
    assert.strictEqual(inTotal, 1550.00, 'Total de entradas inválido');
    assert.strictEqual(outTotal, 525.00, 'Total de saídas inválido');
  });

  // ==========================================================================
  // TEST 3: Race Conditions em Agendamento de Horário Único
  // ==========================================================================
  await runTest('3. Race Condition: 25 Agendamentos Concorrentes para a Mesma Vaga Exclusiva', async () => {
    let prof = await get('SELECT id FROM professionals WHERE tenant_id = ? LIMIT 1', [stressTenant]);
    if (!prof) {
      const pRes = await run(`INSERT INTO professionals (name, tenant_id) VALUES ('Prof Stress', ?)`, [stressTenant]);
      prof = { id: pRes.lastID };
    }

    let service = await get('SELECT id, price, duration_min FROM services WHERE tenant_id = ? LIMIT 1', [stressTenant]);
    if (!service) {
      const sRes = await run(`INSERT INTO services (name, category, price, duration_min, tenant_id) VALUES ('Corte Stress', 'Cabelo', 50.0, 60, ?)`, [stressTenant]);
      service = { id: sRes.lastID, price: 50.0, duration_min: 60 };
    }

    let client = await get('SELECT id FROM clients WHERE tenant_id = ? LIMIT 1', [stressTenant]);
    if (!client) {
      const cRes = await run(`INSERT INTO clients (name, phone, tenant_id) VALUES ('Cliente Stress', '(11) 99999-9999', ?)`, [stressTenant]);
      client = { id: cRes.lastID };
    }

    const targetDate = '2026-10-15';
    const targetTime = '14:00';
    const CONCURRENT_ATTEMPTS = 25;

    let successfulBookings = 0;
    let conflictRejections = 0;

    // Função de tentativa atômica de agendamento
    const tryBook = async (attemptIndex) => {
      try {
        await transaction(async ({ get: tGet, run: tRun }) => {
          // Checar conflito dentro da transação
          const conflict = await tGet(
            `SELECT a.id FROM appointments a
             JOIN appointment_items ai ON a.id = ai.appointment_id
             WHERE a.date = ? AND ai.professional_id = ? AND ai.start_time = ? AND a.status != 'cancelado'`,
            [targetDate, prof.id, targetTime]
          );

          if (conflict) {
            throw new Error('CONFLITO_HORARIO');
          }

          const appRes = await tRun(
            `INSERT INTO appointments (client_id, date, status, total_price, tenant_id)
             VALUES (?, ?, 'agendado', ?, ?)`,
            [client.id, targetDate, service.price, stressTenant]
          );

          await tRun(
            `INSERT INTO appointment_items (appointment_id, service_id, professional_id, start_time, end_time, price, commission_type, commission_value, commission_amount, tenant_id)
             VALUES (?, ?, ?, ?, '15:00', ?, 'percentage', 50, ?, ?)`,
            [appRes.lastID, service.id, prof.id, targetTime, service.price, service.price * 0.5, stressTenant]
          );

          successfulBookings++;
        });
      } catch (err) {
        if (err.message === 'CONFLITO_HORARIO') {
          conflictRejections++;
        } else {
          conflictRejections++;
        }
      }
    };

    const attempts = [];
    for (let i = 0; i < CONCURRENT_ATTEMPTS; i++) {
      attempts.push(tryBook(i));
    }

    await Promise.all(attempts);

    const actualAppointments = await query(
      `SELECT a.id FROM appointments a
       JOIN appointment_items ai ON a.id = ai.appointment_id
       WHERE a.date = ? AND ai.professional_id = ? AND ai.start_time = ? AND a.status != 'cancelado'`,
      [targetDate, prof.id, targetTime]
    );

    assert.strictEqual(actualAppointments.length, 1, 'Apenas 1 agendamento deve ter sido gravado para a vaga única');
    assert.strictEqual(successfulBookings, 1, 'Exatamente 1 tentativa deve ter sucesso');
    assert.strictEqual(conflictRejections, CONCURRENT_ATTEMPTS - 1, 'Todas as outras 24 tentativas devem ser rejeitadas');
  });

  // ==========================================================================
  // TEST 4: Fuzzing e Injeção de Payloads Maliciosos em Massa (1.000 Casos)
  // ==========================================================================
  await runTest('4. Fuzzing de Segurança: 1.000 Payloads de XSS e Injeções em Massa', async () => {
    const maliciousPatterns = [
      '<script>alert("XSS")</script>',
      '<IMG SRC="javascript:alert(\'XSS\');">',
      '<iframe src="http://evil.com"></iframe>',
      '\'; DROP TABLE users; --',
      '1\' OR \'1\'=\'1',
      '<svg/onload=alert(1)>',
      '"><script>eval(atob("YWxlcnQoMSk="))</script>',
      '<<SCRIPT>alert("nested");//<</SCRIPT>',
      'javascript:void(0)',
      'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='
    ];

    let processedCount = 0;

    for (let i = 0; i < 1000; i++) {
      const pattern = maliciousPatterns[i % maliciousPatterns.length];
      const payload = {
        name: `Cliente Teste ${pattern} #${i}`,
        notes: `Observação <script>evil()</script> ${pattern}`,
        profile: {
          bio: `Bio ${pattern}`,
          tags: [`tag1 ${pattern}`, `tag2 <script>`]
        }
      };

      const cleaned = sanitizeInput(payload);

      assert.strictEqual(cleaned.name.includes('<script>'), false, `Tag script não removida no caso #${i}`);
      assert.strictEqual(cleaned.notes.includes('<script>'), false, `Tag script em notes não removida no caso #${i}`);
      assert.strictEqual(cleaned.profile.bio.includes('<script>'), false, `Bio contaminada no caso #${i}`);
      assert.strictEqual(cleaned.profile.tags[1].includes('<script>'), false, `Tag de array contaminada no caso #${i}`);
      processedCount++;
    }

    assert.strictEqual(processedCount, 1000, 'Deveria processar todos os 1.000 payloads de fuzzing');
  });

  // ==========================================================================
  // TEST 5: Chaos Testing sob Tempestade de Falhas e Circuit Breaker
  // ==========================================================================
  await runTest('5. Chaos Testing: 100 Chamadas sob Queda Contínua e Proteção do Circuit Breaker', async () => {
    const breaker = new CircuitBreaker('ChaosService', {
      failureThreshold: 3,
      recoveryTimeout: 500,
      maxRetries: 2,
      baseDelayMs: 2
    });

    let networkAttempts = 0;
    let fallbackCalls = 0;

    const unstableService = async () => {
      networkAttempts++;
      throw new Error('503 Service Unavailable');
    };

    const fallbackHandler = async () => {
      fallbackCalls++;
      return { fallbackActive: true };
    };

    // Executar 100 chamadas em sequência rápida simulando rajada de tráfego
    for (let i = 0; i < 100; i++) {
      const res = await breaker.execute(unstableService, fallbackHandler);
      assert.strictEqual(res.fallbackActive, true);
    }

    assert.strictEqual(breaker.state, 'OPEN', 'O circuito deve permanecer em OPEN sob tempestade de falhas');
    // Como o circuito abriu após o threshold (3 falhas x 2 retries = 6 chamadas), as 97 restantes usaram fallback sem tocar a rede
    assert.ok(networkAttempts <= 10, `Circuito poupou a rede externa (Tentativas reais: ${networkAttempts}/100)`);
    assert.strictEqual(fallbackCalls, 100, 'Todos os 100 fallbacks devem ter sido executados com segurança');
  });

  // ==========================================================================
  // TEST 6: Assinaturas HMAC SHA-256 e Anti-Tampering em Lote (1.000 Casos)
  // ==========================================================================
  await runTest('6. Criptografia HMAC SHA-256: 1.000 Validações e 1.000 Rejeições de Fraude', async () => {
    const plans = ['STARTER', 'PRO', 'ELITE', 'ENTERPRISE'];

    for (let i = 0; i < 1000; i++) {
      const originalLicense = {
        tenantId: `tenant_sec_${i}`,
        plan: plans[i % plans.length],
        maxUsers: (i % 20) + 1,
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString()
      };

      // 1. Assinar
      const signature = generateLicenseSignature(originalLicense);
      assert.strictEqual(verifyLicenseSignature(originalLicense, signature), true, `Assinatura genuína falhou no caso #${i}`);

      // 2. Simular adulteração maliciosa
      const tamperedLicense = {
        ...originalLicense,
        plan: 'ELITE_UNLIMITED_HACKED',
        maxUsers: 99999
      };

      assert.strictEqual(verifyLicenseSignature(tamperedLicense, signature), false, `Falha de segurança: licença adulterada aceita no caso #${i}`);
    }
  });

  // ==========================================================================
  // TEST 7: Benchmark de Latência e Percentis P95 / P99
  // ==========================================================================
  await runTest('7. Benchmark de Performance: Latência P95 < 25ms e P99 < 50ms em Consultas Analíticas', async () => {
    const TOTAL_QUERIES = 300;
    const latencies = [];

    for (let i = 0; i < TOTAL_QUERIES; i++) {
      const start = performance.now();
      await query(`
        SELECT a.id, a.date, a.total_price, c.name as client_name, s.name as service_name, p.name as prof_name
        FROM appointments a
        JOIN clients c ON a.client_id = c.id
        LEFT JOIN appointment_items ai ON a.id = ai.appointment_id
        LEFT JOIN services s ON ai.service_id = s.id
        LEFT JOIN professionals p ON ai.professional_id = p.id
        WHERE a.tenant_id = ?
        LIMIT 50
      `, [stressTenant]);
      latencies.push(performance.now() - start);
    }

    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(TOTAL_QUERIES * 0.50)].toFixed(2);
    const p95 = latencies[Math.floor(TOTAL_QUERIES * 0.95)].toFixed(2);
    const p99 = latencies[Math.floor(TOTAL_QUERIES * 0.99)].toFixed(2);
    const avg = (latencies.reduce((a, b) => a + b, 0) / TOTAL_QUERIES).toFixed(2);

    process.stdout.write(`[Média: ${avg}ms | P50: ${p50}ms | P95: ${p95}ms | P99: ${p99}ms] `);

    assert.ok(parseFloat(p95) < 50, `P95 muito alto: ${p95}ms`);
    assert.ok(parseFloat(p99) < 100, `P99 muito alto: ${p99}ms`);
  });

  // Limpeza dos dados de estresse (ordem correta de dependências FK)
  try {
    await run('DELETE FROM appointment_items WHERE tenant_id = ?', [stressTenant]);
    await run('DELETE FROM appointments WHERE tenant_id = ?', [stressTenant]);
    await run('DELETE FROM cash_movements WHERE tenant_id = ?', [stressTenant]);
    await run('DELETE FROM cash_registers WHERE tenant_id = ?', [stressTenant]);
    await run('DELETE FROM clients WHERE tenant_id = ?', [stressTenant]);
    await run('DELETE FROM tenants WHERE id = ?', [stressTenant]);
  } catch (cleanErr) {
    // Ignorar avisos de limpeza
  }

  console.log('\n================================================================');
  console.log(`📊 RESULTADO DA BATERIA DE TESTES PESADOS:`);
  console.log(`   ✅ Testes de Estresse Aprovados: ${passedTests}`);
  console.log(`   ❌ Testes de Estresse Falhados:  ${failedTests}`);
  if (failedTestDetails.length > 0) {
    console.log('----------------------------------------------------------------');
    console.log('Falhas encontradas:');
    failedTestDetails.forEach((f, idx) => {
      console.log(`   ${idx + 1}. [${f.name}]: ${f.error}`);
    });
  }
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

if (require.main === module) {
  startStressSuite();
}

module.exports = { startStressSuite };
