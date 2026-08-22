const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { query, get, run, exec, transaction, initDb } = require('../database/db');
const { seedData } = require('../database/seed');
const whatsappService = require('../services/whatsappService');
const gdriveService = require('../services/gdriveService');
const {
  validateCPF,
  validateCNPJ,
  validatePasswordStrength,
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
} = require('../services/authService');
const {
  createMercadoPagoPixPayment,
  createMercadoPagoPreapproval,
} = require('../services/mercadopagoService');
const {
  sendVerificationEmail,
  sendEmployeeInviteEmail,
} = require('../services/brevoService');
const { CircuitBreaker } = require('../services/circuitBreaker');
const { licenseManager, generateLicenseSignature, verifyLicenseSignature } = require('../services/licenseCache');
const { sanitizeInput } = require('../middleware/sanitization');

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
  console.log('🚀 BATERIA DE TESTES DEVSECOPS & RESILIÊNCIA - BELAGESTÃO STUDIO');
  console.log('================================================================\n');

  // Setup inicial do banco de dados
  await initDb();
  await seedData();

  // 1. Testes de Autenticação & Validação de Documentos
  await runTest('1.1 - Validação Oficial de CPF (Módulo 11 da Receita)', async () => {
    assert.strictEqual(validateCPF('111.111.111-11'), false);
    assert.strictEqual(validateCPF('123.456.789-00'), false);
    assert.strictEqual(validateCPF('52998224725'), true);
  });

  await runTest('1.2 - Validação Oficial de CNPJ (Módulo 11 da Receita)', async () => {
    assert.strictEqual(validateCNPJ('11.111.111/1111-11'), false);
    assert.strictEqual(validateCNPJ('12.345.678/0001-90'), false);
    assert.strictEqual(validateCNPJ('06.990.590/0001-23'), true);
  });

  await runTest('1.3 - Hash PBKDF2/Salt e Validação de Senha', async () => {
    const pass = 'Bella@2026';
    const hash = hashPassword(pass);
    assert.ok(hash.includes(':'));
    assert.strictEqual(verifyPassword(pass, hash), true);
    assert.strictEqual(verifyPassword('SenhaErrada', hash), false);
  });

  // 2. Testes de Multi-Tenancy & Isolamento de Dados
  await runTest('2.1 - Isolamento de Dados entre Salões (Multi-Tenant)', async () => {
    const tenantA = `tenant_test_a_${Date.now()}`;
    const tenantB = `tenant_test_b_${Date.now()}`;

    // Inserir cliente no Salão A
    await run('INSERT INTO clients (name, phone, tenant_id) VALUES (?, ?, ?)', ['Cliente Salão A', '(11) 91111-1111', tenantA]);
    // Inserir cliente no Salão B
    await run('INSERT INTO clients (name, phone, tenant_id) VALUES (?, ?, ?)', ['Cliente Salão B', '(11) 92222-2222', tenantB]);

    // Consultar clientes do Salão A
    const clientsA = await query('SELECT * FROM clients WHERE tenant_id = ?', [tenantA]);
    assert.strictEqual(clientsA.length, 1);
    assert.strictEqual(clientsA[0].name, 'Cliente Salão A');

    // Consultar clientes do Salão B
    const clientsB = await query('SELECT * FROM clients WHERE tenant_id = ?', [tenantB]);
    assert.strictEqual(clientsB.length, 1);
    assert.strictEqual(clientsB[0].name, 'Cliente Salão B');

    // Limpeza
    await run('DELETE FROM clients WHERE tenant_id IN (?, ?)', [tenantA, tenantB]);
  });

  // 3. Testes de Circuit Breaker & Retry com Exponential Backoff
  await runTest('3.1 - Circuit Breaker: Retry com Exponential Backoff e Transição para OPEN', async () => {
    const breaker = new CircuitBreaker('TestService', {
      failureThreshold: 2,
      recoveryTimeout: 500,
      maxRetries: 2,
      baseDelayMs: 20,
    });

    let callCount = 0;
    const failingAction = async () => {
      callCount++;
      throw new Error('Falha simulada na API externa');
    };

    // Primeira execução deve tentar maxRetries (2 vezes) e falhar
    try {
      await breaker.execute(failingAction);
    } catch (e) {
      assert.strictEqual(e.message, 'Falha simulada na API externa');
    }
    assert.strictEqual(callCount, 2, 'Deveria ter executado 2 tentativas com retry');

    // Segunda execução falha -> atinge threshold e abre o circuito
    try {
      await breaker.execute(failingAction);
    } catch (e) {}

    assert.strictEqual(breaker.state, 'OPEN', 'Circuito deveria estar no estado OPEN');

    // Com circuito OPEN, execução com fallback deve retornar o fallback imediatamente sem tentar chamar o serviço
    let fallbackExecuted = false;
    const fallbackResult = await breaker.execute(failingAction, async () => {
      fallbackExecuted = true;
      return { fallback: true };
    });

    assert.strictEqual(fallbackExecuted, true, 'Fallback deve ser acionado com circuito OPEN');
    assert.strictEqual(fallbackResult.fallback, true);
  });

  // 4. Testes de Licença Offline, Grace Period & Assinatura HMAC
  await runTest('4.1 - Assinatura Digital HMAC SHA-256 de Licença e Anti-Tampering', async () => {
    const license = {
      tenantId: 'tenant_test_123',
      plan: 'PRO',
      expiresAt: '2026-09-01T00:00:00.000Z',
      maxUsers: 5,
    };
    const signature = generateLicenseSignature(license);
    assert.ok(signature.length === 64, 'Assinatura HMAC SHA-256 deve ter 64 caracteres hex');
    assert.strictEqual(verifyLicenseSignature(license, signature), true, 'Assinatura genuína deve validar');

    // Simulação de adulteração (tentativa de mudar plano para ELITE localmente)
    const tamperedLicense = { ...license, plan: 'ELITE' };
    assert.strictEqual(verifyLicenseSignature(tamperedLicense, signature), false, 'Licença adulterada deve ser rejeitada');
  });

  await runTest('4.2 - Período de Carência (Grace Period) Offline de 7 Dias', async () => {
    // Simula tenant expirado há 3 dias (dentro do limite de 7 dias)
    const expired3DaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const mockTenant = {
      id: 'tenant_grace_test',
      plan: 'PRO',
      max_users: 5,
      subscription_expires_at: expired3DaysAgo,
    };

    const evalResult = licenseManager.evaluateLicense('tenant_grace_test', mockTenant);
    assert.strictEqual(evalResult.status, 'GRACE_PERIOD', 'Status deve ser GRACE_PERIOD');
    assert.strictEqual(evalResult.gracePeriodActive, true, 'Grace Period deve estar ativo');
    assert.strictEqual(evalResult.isDegraded, true, 'Sistema deve estar em modo degradado tratado');
    assert.ok(evalResult.graceDaysRemaining >= 3, 'Deve calcular dias restantes de carência');
  });

  // 5. Testes de Transações Atômicas ACID com Rollback Automático
  await runTest('5.1 - Transação Atômica ACID: Rollback Automático em Exceção', async () => {
    const testName = `Cliente Rollback ${Date.now()}`;

    try {
      await transaction(async ({ run: tRun }) => {
        // Passo 1: Inserir cliente
        await tRun('INSERT INTO clients (name, phone) VALUES (?, ?)', [testName, '(11) 90000-0000']);

        // Passo 2: Forçar erro de sintaxe SQL para simular falha no meio da transação
        await tRun('INSERT INTO tabela_inexistente_de_erro (coluna) VALUES (1)');
      });
    } catch (err) {
      // Erro esperado
    }

    // Verificar se o cliente do Passo 1 foi revertido pelo ROLLBACK
    const shouldNotExist = await get('SELECT * FROM clients WHERE name = ?', [testName]);
    assert.strictEqual(shouldNotExist, undefined, 'Cliente não deve existir no banco após ROLLBACK');
  });

  // 6. Testes de Sanitização de Inputs e Proteção contra Injection
  await runTest('6.1 - Sanitização de Inputs: XSS, Scripts e Injections', async () => {
    const maliciousPayload = {
      name: '  Camila <script>alert("XSS")</script>  ',
      description: 'Corte de Cabelo <script>evil()</script>',
      nested: {
        safe: 'Olá Mundo',
        scriptTag: '<script src="malicious.js"></script>',
      },
    };

    const cleaned = sanitizeInput(maliciousPayload);
    assert.strictEqual(cleaned.name, 'Camila');
    assert.strictEqual(cleaned.description, 'Corte de Cabelo');
    assert.strictEqual(cleaned.nested.scriptTag, '');
  });

  // 7. Testes de Integridade de Backup com AES-256-GCM e Google Drive OAuth
  await runTest('7.1 - Geração de Backup Criptografado com AES-256-GCM e SHA-256', async () => {
    const testPassphrase = 'SenhaDeTesteForte@2026';
    const backup = await gdriveService.createEncryptedBackup(testPassphrase, 'tenant_test');
    assert.ok(backup.sha256 && backup.sha256.length === 64, 'Backup deve gerar hash SHA-256 de 64 caracteres');
    assert.ok(fs.existsSync(backup.path), 'Arquivo de backup criptografado deve existir em disco');
    assert.strictEqual(backup.filename.endsWith('.enc'), true, 'Extensão deve ser .enc');

    // Verificar envelope binário: MAGIC "BELABACKUP_V1"
    const fileBuf = fs.readFileSync(backup.path);
    const magic = fileBuf.subarray(0, 13).toString('utf-8');
    assert.strictEqual(magic, 'BELABACKUP_V1', 'Cabeçalho mágico deve ser BELABACKUP_V1');
  });

  await runTest('7.2 - Descriptografia e Restauração com Sucesso usando Senha Correta', async () => {
    const testPassphrase = 'MinhaSenhaDeBackup@123';
    const backup = await gdriveService.createEncryptedBackup(testPassphrase, 'tenant_test');
    
    // Restaurar a partir do arquivo criptografado
    const restoreResult = await gdriveService.restoreBackup(backup.path, testPassphrase);
    assert.strictEqual(restoreResult.success, true);
    assert.ok(restoreResult.sha256, 'Deve calcular sha256 do banco restaurado');
    assert.ok(restoreResult.rollbackPoint, 'Deve gerar ponto de rollback antes da restauração');
  });

  await runTest('7.3 - Anti-Tampering: Rejeição de Arquivo Adulterado ou Senha Incorreta', async () => {
    const correctPassphrase = 'SenhaOriginal@2026';
    const wrongPassphrase = 'SenhaErrada@9999';
    const backup = await gdriveService.createEncryptedBackup(correctPassphrase, 'tenant_test');

    // Tentativa 1: Senha incorreta
    let failedWrongPass = false;
    try {
      await gdriveService.restoreBackup(backup.path, wrongPassphrase);
    } catch (e) {
      failedWrongPass = true;
      assert.ok(e.message.includes('autenticidade') || e.message.includes('senha') || e.message.includes('descriptografia'));
    }
    assert.strictEqual(failedWrongPass, true, 'Descriptografia com senha incorreta DEVE falhar');

    // Tentativa 2: Adulteração de 1 bit no ciphertext (Payload Tampering)
    const originalBuf = fs.readFileSync(backup.path);
    const tamperedBuf = Buffer.from(originalBuf);
    // Inverte o último byte
    tamperedBuf[tamperedBuf.length - 1] ^= 0xFF;

    let failedTampered = false;
    try {
      await gdriveService.restoreFromBuffer(tamperedBuf, correctPassphrase);
    } catch (e) {
      failedTampered = true;
    }
    assert.strictEqual(failedTampered, true, 'Arquivo adulterado DEVE ser rejeitado pela verificação de integridade Auth Tag');
  });

  await runTest('7.4 - Validação de Cabeçalho SQLite e Rejeição de Arquivo Não-Banco', async () => {
    // Arquivo falso sem cabeçalho SQLite format 3
    const fakeDbBuffer = Buffer.from('ARQUIVO_TEXTO_FALSO_SEM_CABECALHO_SQLITE_333333333333333333');
    let rejected = false;
    try {
      await gdriveService.restoreFromBuffer(fakeDbBuffer);
    } catch (e) {
      rejected = true;
      assert.ok(e.message.includes('SQLite') || e.message.includes('inválido'));
    }
    assert.strictEqual(rejected, true, 'Restauração de arquivo sem cabeçalho SQLite válido DEVE ser bloqueada');
  });

  await runTest('7.5 - Validação de Escopos Restritos Google OAuth 2.0 (Menor Privilégio)', async () => {
    await gdriveService.saveOAuthConfig('tenant_test', {
      clientId: '123456789-test.apps.googleusercontent.com',
      clientSecret: 'GOCSPX-secret_test',
      redirectUri: 'http://localhost:3001/api/backup/gdrive/callback'
    });

    const authUrl = await gdriveService.getAuthUrl('tenant_test');
    assert.ok(authUrl.includes('accounts.google.com/o/oauth2/v2/auth'));
    assert.ok(authUrl.includes('drive.file'), 'Escopo restrito drive.file deve estar presente');
    assert.ok(authUrl.includes('drive.appdata'), 'Escopo restrito drive.appdata deve estar presente');
    assert.ok(!authUrl.includes('auth/drive%20') && !authUrl.includes('auth/drive+'), 'NÃO deve solicitar escopo de acesso amplo auth/drive');
  });


  // 8. Testes de Especialidades e Subtipos
  await runTest('8.1 - Especialidades Extensíveis de Salão (Cabelo, Manicure, Depilação)', async () => {
    const specs = await query('SELECT * FROM custom_specialties');
    const names = specs.map((s) => s.name);
    assert.ok(names.includes('Cabeleireira'));
    assert.ok(names.includes('Manicure'));
    assert.ok(names.includes('Depiladora'));
  });

  // 9. Testes de WhatsApp
  await runTest('9.1 - Formatação de Mensagens e Sanitização Telefônica', async () => {
    const formatted = whatsappService.formatMessage('Olá {cliente}, seu horário no {salao} é às {horario}.', {
      cliente: 'Mariana',
      salao: 'BelaGestão Studio',
      horario: '15:00',
    });
    assert.strictEqual(formatted, 'Olá Mariana, seu horário no BelaGestão Studio é às 15:00.');

    const cleanPhone = whatsappService.sanitizePhone('(11) 98765-4321');
    assert.strictEqual(cleanPhone, '5511987654321');
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
