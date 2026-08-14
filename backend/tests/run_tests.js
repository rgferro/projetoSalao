const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { query, get, run, initDb } = require('../database/db');
const { seedData } = require('../database/seed');
const whatsappService = require('../services/whatsappService');
const gdriveService = require('../services/gdriveService');

let passedTests = 0;
let failedTests = 0;

async function runTest(name, fn) {
  try {
    process.stdout.write(`🧪 Testando: ${name}... `);
    await fn();
    console.log(`✅ PASSOU`);
    passedTests++;
  } catch (err) {
    console.log(`❌ FALHOU`);
    console.error(`   Erro:`, err.message);
    failedTests++;
  }
}

async function startTestSuite() {
  console.log('================================================================');
  console.log('🚀 INICIANDO BATERIA DE TESTES AUTOMATIZADOS - BELLAGESTÃO STUDIO');
  console.log('================================================================\n');

  // Setup banco
  await initDb();
  await seedData();

  // 1. Testes de Banco de Dados & Configurações
  await runTest('1.1 - Persistência SQLite e Configurações Gerais', async () => {
    const salonName = await get("SELECT value FROM settings WHERE key = 'salon_name'");
    assert.ok(salonName, 'Configuração salon_name deve existir');
    assert.ok(salonName.value.length > 0, 'salon_name não pode estar vazio');
  });

  // 2. Testes de Clientes & Anamnese
  await runTest('2.1 - Cadastro de Cliente com Ficha de Anamnese Técnica', async () => {
    const testPhone = `(11) 9${Math.floor(10000000 + Math.random() * 90000000)}`;
    const cRes = await run(
      `INSERT INTO clients (name, phone, email, birthdate, loyalty_points)
       VALUES (?, ?, ?, '1995-05-15', 50)`,
      ['Cliente Teste Unitário', testPhone, 'teste@email.com']
    );
    const clientId = cRes.lastID;
    assert.ok(clientId > 0, 'Cliente deve ser inserido com ID');

    // Inserir Anamnese
    await run(
      `INSERT INTO anamnesis (client_id, hair_type, hair_color_formula, waxing_skin_type, nails_shape_preferences, makeup_skin_type)
       VALUES (?, 'Ondulado 2A', 'Igora 9.7', 'Fototipo II', 'Amendoadas', 'Pele Mista')`,
      [clientId]
    );

    const saved = await get('SELECT * FROM clients WHERE id = ?', [clientId]);
    const savedAnamnese = await get('SELECT * FROM anamnesis WHERE client_id = ?', [clientId]);

    assert.strictEqual(saved.name, 'Cliente Teste Unitário');
    assert.strictEqual(savedAnamnese.hair_color_formula, 'Igora 9.7');
    assert.strictEqual(savedAnamnese.waxing_skin_type, 'Fototipo II');
  });

  await runTest('2.2 - Programa de Fidelidade (Crédito e Resgate de Pontos)', async () => {
    const client = await get('SELECT id, loyalty_points FROM clients LIMIT 1');
    const initial = client.loyalty_points;

    // Creditar 25 pontos
    await run('UPDATE clients SET loyalty_points = loyalty_points + 25 WHERE id = ?', [client.id]);
    let updated = await get('SELECT loyalty_points FROM clients WHERE id = ?', [client.id]);
    assert.strictEqual(updated.loyalty_points, initial + 25, 'Pontos creditados incorretamente');

    // Resgatar 10 pontos
    await run('UPDATE clients SET loyalty_points = MAX(0, loyalty_points - 10) WHERE id = ?', [client.id]);
    updated = await get('SELECT loyalty_points FROM clients WHERE id = ?', [client.id]);
    assert.strictEqual(updated.loyalty_points, initial + 15, 'Pontos resgatados incorretamente');
  });

  // 3. Testes de Serviços e Profissionais
  await runTest('3.1 - Catálogo de Serviços e Categorias', async () => {
    const services = await query('SELECT * FROM services WHERE active = 1');
    assert.ok(services.length >= 4, 'Deve conter pelo menos serviços de Cabelo, Manicure, Depilação e Maquiagem');

    const categories = [...new Set(services.map(s => s.category))];
    assert.ok(categories.includes('Cabelo'), 'Categoria Cabelo ausente');
    assert.ok(categories.includes('Manicure'), 'Categoria Manicure ausente');
    assert.ok(categories.includes('Depilação'), 'Categoria Depilação ausente');
    assert.ok(categories.includes('Maquiagem'), 'Categoria Maquiagem ausente');
  });

  await runTest('3.2 - Profissionais e Regras de Comissão', async () => {
    const profs = await query('SELECT * FROM professionals WHERE active = 1');
    assert.ok(profs.length >= 2, 'Deve conter profissionais cadastrados');

    const p = profs[0];
    assert.ok(p.default_commission_value > 0, 'Valor de comissão padrão deve ser positivo');
  });

  // 4. Testes de Agendamento Multisserviços e Validação de Conflitos
  await runTest('4.1 - Agendamento Multisserviços Encadeados', async () => {
    const client = await get('SELECT id FROM clients LIMIT 1');
    const profs = await query('SELECT id FROM professionals LIMIT 2');
    const srvs = await query('SELECT id, price FROM services LIMIT 2');
    const today = new Date().toISOString().split('T')[0];

    const totalPrice = srvs[0].price + srvs[1].price;

    const appRes = await run(
      `INSERT INTO appointments (client_id, date, status, total_price, total_duration_min)
       VALUES (?, ?, 'agendado', ?, 120)`,
      [client.id, today, totalPrice]
    );
    const appId = appRes.lastID;

    // Inserir 2 itens no mesmo agendamento com profissionais diferentes
    await run(
      `INSERT INTO appointment_items (appointment_id, service_id, professional_id, start_time, end_time, price, commission_type, commission_value, commission_amount, status)
       VALUES (?, ?, ?, '16:00', '17:00', ?, 'percentage', 50.0, ?, 'agendado')`,
      [appId, srvs[0].id, profs[0].id, srvs[0].price, srvs[0].price * 0.5]
    );

    await run(
      `INSERT INTO appointment_items (appointment_id, service_id, professional_id, start_time, end_time, price, commission_type, commission_value, commission_amount, status)
       VALUES (?, ?, ?, '17:00', '18:00', ?, 'percentage', 60.0, ?, 'agendado')`,
      [appId, srvs[1].id, profs[1].id, srvs[1].price, srvs[1].price * 0.6]
    );

    const items = await query('SELECT * FROM appointment_items WHERE appointment_id = ?', [appId]);
    assert.strictEqual(items.length, 2, 'Deve conter exatamente 2 itens');
  });

  await runTest('4.2 - Detecção de Conflitos de Horários do Profissional', async () => {
    const prof = await get('SELECT id FROM professionals LIMIT 1');
    const today = new Date().toISOString().split('T')[0];

    // Criar agendamento teste às 10:00 - 11:00
    const client = await get('SELECT id FROM clients LIMIT 1');
    const app = await run(
      `INSERT INTO appointments (client_id, date, status, total_price) VALUES (?, ?, 'confirmado', 100)`,
      [client.id, today]
    );
    await run(
      `INSERT INTO appointment_items (appointment_id, service_id, professional_id, start_time, end_time, price, commission_type, commission_value, commission_amount)
       VALUES (?, 1, ?, '10:00', '11:00', 100, 'percentage', 50, 50)`,
      [app.lastID, prof.id]
    );

    // Checar conflito com 10:30 - 11:30 (deve detectar conflito)
    const conflicts = await query(
      `SELECT ai.* FROM appointment_items ai
       JOIN appointments a ON ai.appointment_id = a.id
       WHERE ai.professional_id = ? AND a.date = ? AND a.status NOT IN ('cancelado', 'no_show')
         AND NOT (ai.end_time <= '10:30' OR ai.start_time >= '11:30')`,
      [prof.id, today]
    );

    assert.ok(conflicts.length > 0, 'Deveria ter detectado conflito de horário sobreposto');
  });

  // 5. Testes de Frente de Caixa (PDV) e Financeiro
  await runTest('5.1 - Controle de Caixa Diário (Abertura, Sangria e Fechamento)', async () => {
    // Abrir sessão de teste
    const cash = await run(
      `INSERT INTO cash_registers (initial_balance, system_balance, status, opened_by)
       VALUES (100.0, 100.0, 'aberto', 'Teste Automatizado')`
    );
    const cashId = cash.lastID;

    // Sangria de R$ 30
    await run(
      `INSERT INTO cash_movements (cash_register_id, type, amount, description)
       VALUES (?, 'sangria', 30.0, 'Sangria de Teste')`,
      [cashId]
    );
    await run('UPDATE cash_registers SET system_balance = system_balance - 30.0 WHERE id = ?', [cashId]);

    // Reforço de R$ 50
    await run(
      `INSERT INTO cash_movements (cash_register_id, type, amount, description)
       VALUES (?, 'reforco', 50.0, 'Reforço de Teste')`,
      [cashId]
    );
    await run('UPDATE cash_registers SET system_balance = system_balance + 50.0 WHERE id = ?', [cashId]);

    const updatedCash = await get('SELECT system_balance FROM cash_registers WHERE id = ?', [cashId]);
    assert.strictEqual(updatedCash.system_balance, 120.0, 'Saldo do caixa deveria ser R$ 120.00');

    // Fechar caixa
    await run(
      `UPDATE cash_registers SET status = 'fechado', final_balance = 120.0, difference = 0.0 WHERE id = ?`,
      [cashId]
    );
    const closed = await get('SELECT status FROM cash_registers WHERE id = ?', [cashId]);
    assert.strictEqual(closed.status, 'fechado');
  });

  await runTest('5.2 - DRE Gerencial (Receita, Comissões e Lucro Líquido)', async () => {
    const today = new Date().toISOString().split('T')[0];

    // Inserir receita de teste
    await run(
      `INSERT INTO financial_transactions (type, category, description, amount, payment_method, due_date, payment_date, status)
       VALUES ('receita', 'Serviços', 'Venda Teste DRE', 500.0, 'pix', ?, ?, 'pago')`,
      [today, today]
    );

    // Inserir despesa de teste
    await run(
      `INSERT INTO financial_transactions (type, category, description, amount, payment_method, due_date, payment_date, status)
       VALUES ('despesa', 'Produtos', 'Insumos Teste DRE', 100.0, 'pix', ?, ?, 'pago')`,
      [today, today]
    );

    const rec = await get("SELECT SUM(amount) as total FROM financial_transactions WHERE type = 'receita' AND status = 'pago' AND payment_date = ?", [today]);
    const desp = await get("SELECT SUM(amount) as total FROM financial_transactions WHERE type = 'despesa' AND status = 'pago' AND payment_date = ?", [today]);

    assert.ok(rec.total >= 500.0, 'Receita deve computar');
    assert.ok(desp.total >= 100.0, 'Despesa deve computar');
    assert.ok(rec.total - desp.total > 0, 'Lucro líquido do dia deve ser positivo');
  });

  // 6. Testes de Comissões e Repasse
  await runTest('6.1 - Cálculo de Repasse e Quitação Financeira', async () => {
    const prof = await get('SELECT id, name FROM professionals LIMIT 1');
    const today = new Date().toISOString().split('T')[0];

    const fin = await run(
      `INSERT INTO financial_transactions (type, category, description, amount, payment_method, due_date, payment_date, status, professional_id)
       VALUES ('despesa', 'Comissões', 'Repasse Teste', 150.0, 'pix', ?, ?, 'pago', ?)`,
      [today, today, prof.id]
    );

    const setRes = await run(
      `INSERT INTO commission_settlements (professional_id, period_start, period_end, total_services_amount, total_commission, net_payout, payment_date, financial_transaction_id)
       VALUES (?, ?, ?, 300.0, 150.0, 150.0, ?, ?)`,
      [prof.id, today, today, today, fin.lastID]
    );

    assert.ok(setRes.lastID > 0, 'Acerto de comissão deve ser registrado');
  });

  // 7. Testes de WhatsApp
  await runTest('7.1 - Formatação de Templates e Links wa.me', async () => {
    const formatted = whatsappService.formatMessage('Olá {cliente}, seu horário é às {horario} no {salao}.', {
      cliente: 'Maria',
      horario: '14:30',
      salao: 'Bella Studio'
    });

    assert.strictEqual(formatted, 'Olá Maria, seu horário é às 14:30 no Bella Studio.');

    const cleanPhone = whatsappService.sanitizePhone('(11) 98765-4321');
    assert.strictEqual(cleanPhone, '5511987654321');

    const link = whatsappService.generateWaLink('(11) 98765-4321', 'Olá!');
    assert.ok(link.startsWith('https://wa.me/5511987654321?text='), 'Link wa.me gerado incorretamente');
  });

  // 8. Testes de Backup Local
  await runTest('8.1 - Geração de Cópia de Segurança Compactada (.ZIP)', async () => {
    const backup = await gdriveService.createLocalBackup();
    assert.ok(backup.filename.endsWith('.zip'), 'Backup deve ser arquivo .zip');
    assert.ok(fs.existsSync(backup.path), 'Arquivo de backup deve existir fisicamente');
    assert.ok(backup.size > 0, 'Tamanho do backup deve ser maior que 0');
  });

  console.log('\n================================================================');
  console.log(`📊 RESULTADO FINAL DOS TESTES:`);
  console.log(`   ✅ Testes Aprovados: ${passedTests}`);
  console.log(`   ❌ Testes Falhados:  ${failedTests}`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

if (require.main === module) {
  startTestSuite();
}

module.exports = { startTestSuite };
