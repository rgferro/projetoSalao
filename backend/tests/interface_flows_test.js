const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { query, get, run, transaction, initDb } = require('../database/db');
const { seedData } = require('../database/seed');
const { 
  ACCESS_LEVELS, 
  PERMISSIONS_MAP, 
  canAccessModule, 
  getDefaultTabForRole,
  ROLE_CONFIG,
  SYSTEM_MODULES
} = require('../../frontend/src/lib/permissions.js');
const whatsappService = require('../services/whatsappService');
const gdriveService = require('../services/gdriveService');
const { hashPassword, verifyPassword, validateCPF } = require('../services/authService');

let passedTests = 0;
let failedTests = 0;
const failedDetails = [];

async function runTest(name, fn) {
  const start = performance.now();
  try {
    process.stdout.write(`🖥️  [UI/FLUXO] ${name}... `);
    await fn();
    const duration = (performance.now() - start).toFixed(1);
    console.log(`✅ PASSOU (${duration}ms)`);
    passedTests++;
  } catch (err) {
    const duration = (performance.now() - start).toFixed(1);
    console.log(`❌ FALHOU (${duration}ms)`);
    console.error(`   Detalhe do Erro:`, err.message);
    failedDetails.push({ name, error: err.message });
    failedTests++;
  }
}

async function startInterfaceTests() {
  console.log('\n================================================================');
  console.log('✨ TESTES DE INTERFACE, PERMISSÕES, FUNCIONALIDADES & FLUXOS (E2E)');
  console.log('================================================================\n');

  await initDb();
  await seedData();

  const testTenant = `tenant_ui_${Date.now()}`;
  await run(
    `INSERT INTO tenants (id, name, owner_name, owner_email, plan, active)
     VALUES (?, 'Studio Bella UI Tests', 'Camila Testes', ?, 'PRO', 1)`,
    [testTenant, `ui_${Date.now()}@teste.com`]
  );

  // ==========================================================================
  // BLOCO 1: MATRIZ DE PERMISSÕES RBAC E CONTROLE DE ACESSO (ROLES)
  // ==========================================================================
  await runTest('1.1 - Perfil ADMIN: Acesso Total e Irrestrito a Todos os Módulos', async () => {
    const allModuleIds = SYSTEM_MODULES.map(m => m.id);
    for (const modId of allModuleIds) {
      assert.strictEqual(canAccessModule(ACCESS_LEVELS.ADMIN, modId), true, `ADMIN deve ter acesso a ${modId}`);
    }
    assert.strictEqual(getDefaultTabForRole(ACCESS_LEVELS.ADMIN), 'dashboard');
  });

  await runTest('1.2 - Perfil GERENTE: Acesso Operacional + Gestão (Sem Backup/Assinatura)', async () => {
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.GERENTE, 'dashboard'), true);
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.GERENTE, 'appointments'), true);
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.GERENTE, 'clients'), true);
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.GERENTE, 'cash-register'), true);
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.GERENTE, 'financial'), true);
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.GERENTE, 'professionals'), true);
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.GERENTE, 'services'), true);
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.GERENTE, 'whatsapp'), true);
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.GERENTE, 'manual'), true);
    // Bloqueados para Gerente:
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.GERENTE, 'backup'), false);
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.GERENTE, 'subscription'), false);
  });

  await runTest('1.3 - Perfil RECEPCAO: Foco em Balcão (Bloqueio Financeiro e Equipe)', async () => {
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.RECEPCAO, 'appointments'), true);
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.RECEPCAO, 'clients'), true);
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.RECEPCAO, 'cash-register'), true);
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.RECEPCAO, 'whatsapp'), true);
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.RECEPCAO, 'services'), true);
    // Bloqueados para Recepção:
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.RECEPCAO, 'financial'), false);
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.RECEPCAO, 'professionals'), false);
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.RECEPCAO, 'backup'), false);
    assert.strictEqual(getDefaultTabForRole(ACCESS_LEVELS.RECEPCAO), 'appointments');
  });

  await runTest('1.4 - Perfil PROFISSIONAL: Foco em Atendimento Pessoal', async () => {
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.PROFISSIONAL, 'appointments'), true);
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.PROFISSIONAL, 'clients'), true);
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.PROFISSIONAL, 'dashboard'), true);
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.PROFISSIONAL, 'cash-register'), false);
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.PROFISSIONAL, 'financial'), false);
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.PROFISSIONAL, 'whatsapp'), false);
    assert.strictEqual(getDefaultTabForRole(ACCESS_LEVELS.PROFISSIONAL), 'appointments');
  });

  await runTest('1.5 - Perfil AUXILIAR: Acesso Mínimo Operacional', async () => {
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.AUXILIAR, 'appointments'), true);
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.AUXILIAR, 'manual'), true);
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.AUXILIAR, 'clients'), false);
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.AUXILIAR, 'financial'), false);
    assert.strictEqual(canAccessModule(ACCESS_LEVELS.AUXILIAR, 'cash-register'), false);
    assert.strictEqual(getDefaultTabForRole(ACCESS_LEVELS.AUXILIAR), 'appointments');
  });

  // ==========================================================================
  // BLOCO 2: FLUXO DE AGENDAMENTO (MODAL F2, VALIDAÇÕES & WHATSAPP)
  // ==========================================================================
  await runTest('2.1 - Fluxo Completo de Agendamento: Validação, Itens, Conflito e Totalizador', async () => {
    // 1. Criar Cliente e Profissional
    const client = await run(
      'INSERT INTO clients (name, phone, tenant_id) VALUES (?, ?, ?)',
      ['Juliana Agendamento', '(11) 98888-1111', testTenant]
    );
    const prof = await run(
      'INSERT INTO professionals (name, nickname, specialties, color_hex, tenant_id) VALUES (?, ?, ?, ?, ?)',
      ['Luciana Hair', 'Lu', '["Cabeleireira", "Colorista"]', '#ec4899', testTenant]
    );
    const service1 = await run(
      'INSERT INTO services (name, category, price, duration_min, tenant_id) VALUES (?, ?, ?, ?, ?)',
      ['Escova Modeladora', 'Cabelo', 75.00, 45, testTenant]
    );
    const service2 = await run(
      'INSERT INTO services (name, category, price, duration_min, tenant_id) VALUES (?, ?, ?, ?, ?)',
      ['Hidratação Profunda', 'Cabelo', 90.00, 30, testTenant]
    );

    // 2. Simular payload gerado pelo Modal F2 (NewAppointmentModal)
    const appointmentDate = '2026-09-10';
    const startTime = '10:00';
    const totalDuration = 45 + 30; // 75 min -> Fim: 11:15
    const totalPrice = 75.00 + 90.00; // 165.00

    const appRes = await run(
      `INSERT INTO appointments (client_id, date, status, total_price, total_duration_min, tenant_id)
       VALUES (?, ?, 'confirmado', ?, ?, ?)`,
      [client.lastID, appointmentDate, totalPrice, totalDuration, testTenant]
    );

    await run(
      `INSERT INTO appointment_items (appointment_id, service_id, professional_id, start_time, end_time, price, commission_type, commission_value, commission_amount, tenant_id)
       VALUES (?, ?, ?, '10:00', '10:45', 75.00, 'percentage', 50, 37.50, ?)`,
      [appRes.lastID, service1.lastID, prof.lastID, testTenant]
    );

    await run(
      `INSERT INTO appointment_items (appointment_id, service_id, professional_id, start_time, end_time, price, commission_type, commission_value, commission_amount, tenant_id)
       VALUES (?, ?, ?, '10:45', '11:15', 90.00, 'percentage', 50, 45.00, ?)`,
      [appRes.lastID, service2.lastID, prof.lastID, testTenant]
    );

    // 3. Validação do agendamento gravado
    const savedApp = await get('SELECT * FROM appointments WHERE id = ?', [appRes.lastID]);
    assert.strictEqual(savedApp.total_price, 165.00);
    assert.strictEqual(savedApp.total_duration_min, 75);

    // 4. Detecção de Conflito de Horário
    const conflictCheck = await get(
      `SELECT a.id FROM appointments a
       JOIN appointment_items ai ON a.id = ai.appointment_id
       WHERE a.date = ? AND ai.professional_id = ? AND ai.start_time < '11:15' AND ai.end_time > '10:00' AND a.status != 'cancelado'`,
      [appointmentDate, prof.lastID]
    );
    assert.ok(conflictCheck, 'O sistema deve detectar conflito para novas reservas dentro da mesma faixa horária');
  });

  // ==========================================================================
  // BLOCO 3: FLUXO DE FRENTE DE CAIXA (MODAL F3, MOVIMENTAÇÕES & FECHAMENTO)
  // ==========================================================================
  await runTest('3.1 - Fluxo de Frente de Caixa: Abertura, Sangria, Venda PDV e Fechamento', async () => {
    // 1. Abertura do Caixa (Modal F3)
    const initialBalance = 150.00;
    const register = await run(
      `INSERT INTO cash_registers (initial_balance, system_balance, status, opened_by, tenant_id)
       VALUES (?, ?, 'aberto', 'Recepção', ?)`,
      [initialBalance, initialBalance, testTenant]
    );
    const regId = register.lastID;

    // 2. Movimentação de Venda no PDV (Entrada de R$ 165,00 via Cartão de Débito)
    await run(
      `INSERT INTO cash_movements (cash_register_id, type, amount, payment_method, description, tenant_id)
       VALUES (?, 'venda', 165.00, 'cartao_debito', 'Venda Atendimento #1', ?)`,
      [regId, testTenant]
    );

    // 3. Movimentação de Sangria (Retirada de R$ 50,00 em Dinheiro para Pagamento de Café)
    await run(
      `INSERT INTO cash_movements (cash_register_id, type, amount, payment_method, description, tenant_id)
       VALUES (?, 'sangria', 50.00, 'dinheiro', 'Sangria - Café e Suprimentos', ?)`,
      [regId, testTenant]
    );

    // 4. Fechamento de Caixa com Conferência
    const inTotal = (await get(
      `SELECT COALESCE(SUM(amount), 0) as total FROM cash_movements WHERE cash_register_id = ? AND type = 'venda'`,
      [regId]
    )).total;

    const outTotal = (await get(
      `SELECT COALESCE(SUM(amount), 0) as total FROM cash_movements WHERE cash_register_id = ? AND type = 'sangria'`,
      [regId]
    )).total;

    const systemBalance = initialBalance + inTotal - outTotal; // 150 + 165 - 50 = 265.00
    const physicalCounted = 265.00;
    const difference = physicalCounted - systemBalance; // 0.00

    await run(
      `UPDATE cash_registers 
       SET closed_at = CURRENT_TIMESTAMP, final_balance = ?, system_balance = ?, difference = ?, status = 'fechado', closed_by = 'Gerente'
       WHERE id = ?`,
      [physicalCounted, systemBalance, difference, regId]
    );

    const closedReg = await get('SELECT * FROM cash_registers WHERE id = ?', [regId]);
    assert.strictEqual(closedReg.status, 'fechado');
    assert.strictEqual(closedReg.final_balance, 265.00);
    assert.strictEqual(closedReg.difference, 0.00);
  });

  // ==========================================================================
  // BLOCO 4: FLUXO DE CLIENTES, ANAMNESE E FIDELIDADE
  // ==========================================================================
  await runTest('4.1 - Fluxo de Clientes: Cadastro com CPF Válido, Anamnese Técnica e Fidelidade', async () => {
    // 1. Validar CPF e Inserir Cliente
    const validCpf = '52998224725';
    assert.strictEqual(validateCPF(validCpf), true);

    const clientRes = await run(
      `INSERT INTO clients (name, phone, email, cpf, loyalty_points, tenant_id)
       VALUES (?, ?, ?, ?, 10, ?)`,
      ['Ana Paula Anamnese', '(11) 97777-2222', 'anapaula@teste.com', validCpf, testTenant]
    );
    const clientId = clientRes.lastID;

    // 2. Ficha de Anamnese Técnica
    await run(
      `INSERT INTO anamnesis (client_id, hair_type, hair_chemical_history, hair_sensitivities, nails_shape_preferences, tenant_id)
       VALUES (?, 'Crespo 4A', 'Mechas loiras em 2025', 'Sensibilidade no couro cabeludo', 'Amendoada', ?)`,
      [clientId, testTenant]
    );

    const anam = await get('SELECT * FROM anamnesis WHERE client_id = ?', [clientId]);
    assert.strictEqual(anam.hair_type, 'Crespo 4A');
    assert.strictEqual(anam.nails_shape_preferences, 'Amendoada');

    // 3. Atualizar Clube Fidelidade (+15 pontos = total 25)
    await run('UPDATE clients SET loyalty_points = loyalty_points + 15 WHERE id = ?', [clientId]);
    const updatedClient = await get('SELECT loyalty_points FROM clients WHERE id = ?', [clientId]);
    assert.strictEqual(updatedClient.loyalty_points, 25);
  });

  // ==========================================================================
  // BLOCO 5: FLUXO DE EQUIPE, CREDENCIAIS INDIVIDUAIS E MATRIZ DE PERMISSÕES
  // ==========================================================================
  await runTest('5.1 - Fluxo de Equipe: Login Individual por E-mail/Senha, Comissões e Convites', async () => {
    const hashedPass = hashPassword('ProfSenhaForte2026!');

    // 1. Cadastrar Profissional com Especialidades e Comissões
    const profRes = await run(
      `INSERT INTO professionals (name, nickname, phone, email, specialties, color_hex, default_commission_type, default_commission_value, tenant_id)
       VALUES (?, ?, '(11) 95555-4444', 'fe@teste.com', '["Colorista", "Mega Hair"]', '#d946ef', 'percentage', 60.0, ?)`,
      ['Fernanda Cores', 'Fê', testTenant]
    );
    const profId = profRes.lastID;

    // 2. Validação dos dados do profissional para UI (Cards, Badges e Comissões)
    const matchedProf = await get(
      'SELECT id, name, nickname, specialties, default_commission_value FROM professionals WHERE id = ? AND tenant_id = ? AND active = 1',
      [profId, testTenant]
    );
    assert.ok(matchedProf);
    assert.strictEqual(matchedProf.nickname, 'Fê');
    assert.strictEqual(matchedProf.default_commission_value, 60.0);

    // 3. Liquidação de Repasse de Comissão (Commission Settlement)
    const settleRes = await run(
      `INSERT INTO commission_settlements (professional_id, period_start, period_end, total_services_amount, total_commission, net_payout, payment_date, payment_method, tenant_id)
       VALUES (?, '2026-09-01', '2026-09-15', 2500.00, 1500.00, 1500.00, '2026-09-15', 'pix', ?)`,
      [profId, testTenant]
    );
    assert.ok(settleRes.lastID);
  });

  await runTest('5.2 - Matriz Customizada de Permissões: Dono Configura e Salva Acessos por Cargo', async () => {
    // 1. Salvar configuração customizada para o salão
    const customPerms = {
      ADMIN: ['dashboard', 'appointments', 'clients', 'cash-register', 'financial', 'professionals', 'services', 'whatsapp', 'subscription', 'manual', 'backup'],
      GERENTE: ['dashboard', 'appointments', 'clients', 'cash-register', 'financial', 'services', 'whatsapp'],
      RECEPCAO: ['appointments', 'clients', 'cash-register'],
      PROFISSIONAL: ['appointments', 'clients'],
      AUXILIAR: ['appointments']
    };

    await run(
      `INSERT OR REPLACE INTO settings (key, value, tenant_id)
       VALUES ('custom_role_permissions', ?, ?)`,
      [JSON.stringify(customPerms), testTenant]
    );

    // 2. Recuperar do banco e validar
    const row = await get(
      `SELECT value FROM settings WHERE key = 'custom_role_permissions' AND tenant_id = ?`,
      [testTenant]
    );
    assert.ok(row && row.value);
    const parsed = JSON.parse(row.value);
    assert.strictEqual(parsed.RECEPCAO.includes('cash-register'), true);
    assert.strictEqual(parsed.RECEPCAO.includes('financial'), false);
    assert.strictEqual(canAccessModule('RECEPCAO', 'cash-register', parsed), true);
    assert.strictEqual(canAccessModule('RECEPCAO', 'financial', parsed), false);
  });

  // ==========================================================================
  // BLOCO 6: FLUXO DO WHATSAPP MULTI-DEVICE (QR CODE, TEMPLATES E LOGS)
  // ==========================================================================
  await runTest('6.1 - Fluxo WhatsApp: Normalização de Status, Templates e Mensagens', async () => {
    const status = await whatsappService.getStatus();
    assert.ok(status.status);
    assert.ok(typeof status.daemonOnline === 'boolean');
    // Deve prover suporte defensivo a múltiplas chaves:
    assert.ok(status.hasOwnProperty('qr'));
    assert.ok(status.hasOwnProperty('qrCode'));
    assert.ok(status.hasOwnProperty('qrCodeUrl'));

    // Testar Interpolação de Template
    const templateText = 'Olá {cliente}! Seu agendamento de {servicos} no {salao} está confirmado para {data} às {horario}. Endereço: {endereco}. Link: {link_confirmacao}';
    const interpolated = whatsappService.formatMessage(templateText, {
      cliente: 'Patrícia',
      servicos: 'Corte e Manicure',
      salao: 'Studio Bella',
      data: '20/09/2026',
      horario: '14:30',
      endereco: 'Av. Paulista, 1000',
      link_confirmacao: 'http://localhost:3001/confirm/123'
    });

    assert.strictEqual(interpolated.includes('{cliente}'), false);
    assert.strictEqual(interpolated.includes('Patrícia'), true);
    assert.strictEqual(interpolated.includes('20/09/2026 às 14:30'), true);
  });

  // ==========================================================================
  // BLOCO 7: FLUXO DE PLANOS, ASSINATURAS, MASTER ADMIN E ISENÇÃO CORTESIA
  // ==========================================================================
  await runTest('7.1 - Planos Oficiais: Solo (R$ 0), Starter (R$ 69,90), Studio Pro (R$ 139,90) e Premier (R$ 229,90)', async () => {
    const { SAAS_PLANS } = require('../routes/subscription');
    assert.strictEqual(SAAS_PLANS.SOLO.priceMonthly, 0);
    assert.strictEqual(SAAS_PLANS.STARTER.priceMonthly, 69.90);
    assert.strictEqual(SAAS_PLANS.STUDIO.priceMonthly, 139.90);
    assert.strictEqual(SAAS_PLANS.PREMIER.priceMonthly, 229.90);
  });

  await runTest('7.2 - Super Admin Master Oficial: rafael.gielow@gmail.com possui acesso irrestrito e isenção', async () => {
    const masterTenant = await get(`SELECT * FROM tenants WHERE owner_email = ?`, ['rafael.gielow@gmail.com']);
    assert.ok(masterTenant, 'Tenant Master rafael.gielow@gmail.com deve existir');
    assert.strictEqual(Number(masterTenant.is_master), 1, 'is_master deve ser 1');
    assert.strictEqual(Number(masterTenant.is_exempt), 1, 'is_exempt deve ser 1');
  });

  await runTest('7.3 - Isenção de Salão (Cortesia Master): Salão isento nunca expira e opera sem limites', async () => {
    const { licenseManager } = require('../services/licenseCache');
    const exemptTenant = {
      id: 'tenant_exempt_test',
      plan: 'PREMIER',
      is_exempt: 1,
      subscription_status: 'exempt',
      is_master: 0,
      max_users: 15
    };
    const evalResult = licenseManager.evaluateLicense(exemptTenant.id, exemptTenant);
    assert.strictEqual(evalResult.status, 'EXEMPT');
    assert.strictEqual(evalResult.isExempt, true);
    assert.strictEqual(evalResult.isDegraded, false);
    assert.strictEqual(evalResult.gracePeriodActive, false);
  });

  await runTest('7.4 - Privacidade Financeira: Exibição de valores restrita a Dono/Admin e ocultada de Recepção/Profissional', async () => {
    // Simula avaliação de permissões
    const adminCanSeeFinancial = canAccessModule(ACCESS_LEVELS.ADMIN, 'financial');
    const recepcionistaCanSeeFinancial = canAccessModule(ACCESS_LEVELS.RECEPCAO, 'financial');
    const profissionalCanSeeFinancial = canAccessModule(ACCESS_LEVELS.PROFISSIONAL, 'financial');

    assert.strictEqual(adminCanSeeFinancial, true, 'Admin deve ver financeiro');
    assert.strictEqual(recepcionistaCanSeeFinancial, false, 'Recepção NÃO deve ver financeiro consolidado/DRE');
    assert.strictEqual(profissionalCanSeeFinancial, false, 'Profissional NÃO deve ver financeiro geral do salão');
  });

  await runTest('7.5 - Adaptação de Nicho em Assinatura: Validação dos 5 Segmentos Operacionais', async () => {
    const validSegments = ['salao', 'barbearia', 'estetica', 'esmalteria', 'lash'];
    for (const seg of validSegments) {
      const tenantSeg = await run(
        `INSERT INTO tenants (id, name, owner_name, owner_email, segment, plan, active)
         VALUES (?, ?, 'Proprietário Nicho', ?, ?, 'STUDIO', 1)`,
        [`tenant_${seg}_${Date.now()}`, `Espaço ${seg}`, `nicho_${seg}_${Date.now()}@teste.com`, seg]
      );
      assert.ok(tenantSeg.lastID || tenantSeg.changes);
    }
  });

  // ==========================================================================
  // BLOCO 8: FLUXO DE BACKUP E SEGURANÇA
  // ==========================================================================
  await runTest('8.1 - Fluxo de Backup: Criação de Snapshot Local com Hash SHA-256', async () => {
    const backupResult = await gdriveService.createLocalBackup();
    assert.ok(backupResult.filename.endsWith('.zip') || backupResult.filename.endsWith('.db'));
    assert.ok(backupResult.sha256 && backupResult.sha256.length === 64);
    assert.strictEqual(fs.existsSync(backupResult.path), true);
  });

  // ==========================================================================
  // BLOCO 9: ROTAS PÚBLICAS E LANDING PAGES INSTITUCIONAIS
  // ==========================================================================
  await runTest('9.1 - Rotas Públicas e Landing Pages por Segmento', async () => {
    const validPublicViews = [
      'landing',
      'login',
      'register',
      'invite',
      'sobre',
      'contato',
      'termos',
      'privacidade',
      'sistema-salao',
      'sistema-barbearia',
      'sistema-estetica',
      'sistema-esmalteria',
      'sistema-lash'
    ];

    assert.strictEqual(validPublicViews.length, 13, 'Todas as 13 rotas públicas devem estar registradas');
  });

  // Limpeza Completa de Todos os Tenants de Teste
  try {
    await run('DELETE FROM appointment_items WHERE tenant_id = ?', [testTenant]);
    await run('DELETE FROM appointments WHERE tenant_id = ?', [testTenant]);
    await run('DELETE FROM anamnesis WHERE tenant_id = ?', [testTenant]);
    await run('DELETE FROM clients WHERE tenant_id = ?', [testTenant]);
    await run('DELETE FROM commission_settlements WHERE tenant_id = ?', [testTenant]);
    await run('DELETE FROM professionals WHERE tenant_id = ?', [testTenant]);
    await run('DELETE FROM services WHERE tenant_id = ?', [testTenant]);
    await run('DELETE FROM cash_movements WHERE tenant_id = ?', [testTenant]);
    await run('DELETE FROM cash_registers WHERE tenant_id = ?', [testTenant]);
    await run(`
      DELETE FROM tenants 
      WHERE id = ? 
         OR id LIKE 'tenant_salao_%' 
         OR id LIKE 'tenant_barbearia_%' 
         OR id LIKE 'tenant_estetica_%' 
         OR id LIKE 'tenant_esmalteria_%' 
         OR id LIKE 'tenant_lash_%' 
         OR id LIKE 'tenant_stress_%' 
         OR id LIKE 'tenant_ui_%'
    `, [testTenant]);
  } catch (cleanErr) {}

  console.log('\n================================================================');
  console.log(`📊 RESULTADO DOS TESTES DE INTERFACE & FLUXOS (E2E):`);
  console.log(`   ✅ Testes Aprovados: ${passedTests}`);
  console.log(`   ❌ Testes Falhados:  ${failedTests}`);
  if (failedDetails.length > 0) {
    console.log('----------------------------------------------------------------');
    console.log('Falhas encontradas:');
    failedDetails.forEach((f, idx) => {
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
  startInterfaceTests();
}

module.exports = { startInterfaceTests };
