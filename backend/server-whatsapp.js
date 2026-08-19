require('dotenv').config();
const http = require('http');
const path = require('path');
const fs = require('fs');
const { 
  default: makeWASocket, 
  useMultiFileAuthState, 
  DisconnectReason, 
  fetchLatestBaileysVersion, 
  Browsers 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');

const PORT = process.env.WHATSAPP_PORT || 3005;
const BASE_AUTH_DIR = path.join(__dirname, 'whatsapp_auth');

// Blindagem contra quedas do processo
process.on('uncaughtException', (err) => {
  console.error('⚠️ [WhatsApp Daemon] Erro não capturado (blindado):', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️ [WhatsApp Daemon] Rejeição de Promise não tratada (blindada):', reason);
});

const logger = pino({ level: 'silent' });

// Mapa de sessões por Salão / Tenant: tenantId -> SessionState
const sessions = new Map();

function sanitizeTenantId(tenantId) {
  if (!tenantId) return 'tenant_default_salao';
  return String(tenantId).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
}

function getTenantAuthDir(tenantId) {
  const clean = sanitizeTenantId(tenantId);
  return path.join(BASE_AUTH_DIR, clean);
}

/**
 * Migra credenciais legadas de raiz para o tenant default, se existirem
 */
function migrateLegacyAuth() {
  try {
    if (!fs.existsSync(BASE_AUTH_DIR)) {
      fs.mkdirSync(BASE_AUTH_DIR, { recursive: true });
      return;
    }

    const legacyCreds = path.join(BASE_AUTH_DIR, 'creds.json');
    if (fs.existsSync(legacyCreds)) {
      const defaultDir = path.join(BASE_AUTH_DIR, 'tenant_default_salao');
      if (!fs.existsSync(defaultDir)) {
        fs.mkdirSync(defaultDir, { recursive: true });
      }

      const files = fs.readdirSync(BASE_AUTH_DIR);
      for (const file of files) {
        const fullPath = path.join(BASE_AUTH_DIR, file);
        if (fs.statSync(fullPath).isFile()) {
          fs.renameSync(fullPath, path.join(defaultDir, file));
        }
      }
      console.log('🔄 [WhatsApp Daemon] Credenciais legadas migradas com sucesso para tenant_default_salao!');
    }
  } catch (err) {
    console.error('Erro ao migrar credenciais legadas:', err.message);
  }
}

/**
 * Inicializa ou retorna a sessão ativa de um salão / tenant específico
 */
async function getOrCreateTenantSession(rawTenantId) {
  const tenantId = sanitizeTenantId(rawTenantId);

  let session = sessions.get(tenantId);
  if (session && (session.status === 'CONNECTED' || session.status === 'QR_READY' || (session.status === 'CONNECTING' && session.isStarting))) {
    return session;
  }

  if (!session) {
    session = {
      tenantId,
      sock: null,
      status: 'CONNECTING',
      qr: null,
      user: null,
      lastConnectedAt: null,
      reconnectAttempts: 0,
      isStarting: false
    };
    sessions.set(tenantId, session);
  }

  const tenantAuthDir = getTenantAuthDir(tenantId);
  if (!fs.existsSync(tenantAuthDir)) {
    fs.mkdirSync(tenantAuthDir, { recursive: true });
  }

  session.isStarting = true;
  session.status = 'CONNECTING';

  try {
    const { state, saveCreds } = await useMultiFileAuthState(tenantAuthDir);

    let version = [2, 3000, 1015901307];
    try {
      const fetched = await fetchLatestBaileysVersion();
      if (fetched && fetched.version) version = fetched.version;
    } catch (vErr) {
      // fallback to standard
    }

    if (session.sock) {
      try {
        session.sock.ev.removeAllListeners();
        session.sock.end();
      } catch (e) {}
    }

    const sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      auth: state,
      browser: Browsers.macOS('Desktop'),
      syncFullHistory: false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      shouldIgnoreJid: (jid) => jid?.endsWith('@broadcast')
    });

    session.sock = sock;
    session.isStarting = false;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          session.qr = await QRCode.toDataURL(qr, { margin: 2, scale: 8 });
          session.status = 'QR_READY';
          console.log(`📲 [WhatsApp Daemon - Salão ${tenantId}] Novo QR Code exclusivo gerado! Pronto para escanear.`);
        } catch (qrErr) {
          console.error(`Erro ao gerar QR Code para salão ${tenantId}:`, qrErr);
        }
      }

      if (connection === 'open') {
        session.status = 'CONNECTED';
        session.qr = null;
        session.reconnectAttempts = 0;
        const jid = sock.user?.id || '';
        session.user = jid.split(':')[0] || jid.split('@')[0] || 'Conectado';
        session.lastConnectedAt = new Date().toISOString();
        console.log(`🟢 [WhatsApp Daemon - Salão ${tenantId}] Conectado com sucesso no número +${session.user}!`);
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;
        const shouldReconnect = !isLoggedOut && statusCode !== 401 && statusCode !== 405;

        console.log(`🔴 [WhatsApp Daemon - Salão ${tenantId}] Conexão fechada. Motivo: ${statusCode}. Reconectar: ${shouldReconnect}`);

        if (shouldReconnect) {
          session.reconnectAttempts = (session.reconnectAttempts || 0) + 1;
          const delayMs = Math.min(session.reconnectAttempts * 2000, 10000);
          session.status = 'CONNECTING';
          setTimeout(() => getOrCreateTenantSession(tenantId), delayMs);
        } else {
          session.status = 'DISCONNECTED';
          session.qr = null;
          session.user = null;
          try {
            fs.rmSync(tenantAuthDir, { recursive: true, force: true });
          } catch (e) {}
          // Gera novo QR Code para o salão após desconexão
          setTimeout(() => getOrCreateTenantSession(tenantId), 2000);
        }
      }
    });

    return session;
  } catch (error) {
    console.error(`❌ [WhatsApp Daemon - Salão ${tenantId}] Erro ao inicializar socket Baileys:`, error);
    session.status = 'DISCONNECTED';
    session.isStarting = false;
    setTimeout(() => getOrCreateTenantSession(tenantId), 5000);
    return session;
  }
}

/**
 * Auto-reconecta todas as sessões salvas no disco
 */
async function autoStartSavedSessions() {
  migrateLegacyAuth();

  try {
    if (!fs.existsSync(BASE_AUTH_DIR)) return;

    const entries = fs.readdirSync(BASE_AUTH_DIR);
    for (const entry of entries) {
      const fullPath = path.join(BASE_AUTH_DIR, entry);
      if (fs.statSync(fullPath).isDirectory()) {
        const credsFile = path.join(fullPath, 'creds.json');
        if (fs.existsSync(credsFile)) {
          console.log(`🔄 [WhatsApp Daemon] Restaurando sessão salva do salão: ${entry}...`);
          getOrCreateTenantSession(entry);
        }
      }
    }

    // Garante que o tenant padrão tenha sessão inicializada
    if (!sessions.has('tenant_default_salao')) {
      getOrCreateTenantSession('tenant_default_salao');
    }
  } catch (e) {
    console.error('Erro ao auto-iniciar sessões salvas:', e);
  }
}

// Inicia sessões existentes
autoStartSavedSessions();

// Servidor HTTP Nativo com REST Endpoints na porta 3005
const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-tenant-id');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const headerTenant = req.headers['x-tenant-id'];
  const queryTenant = parsedUrl.searchParams.get('tenant_id') || headerTenant || 'tenant_default_salao';

  // 1. GET /status?tenant_id=...
  if (req.method === 'GET' && pathname === '/status') {
    const tenantId = sanitizeTenantId(queryTenant);
    const session = await getOrCreateTenantSession(tenantId);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      tenantId: session.tenantId,
      status: session.status,
      qr: session.qr,
      qrCode: session.qr,
      qrCodeUrl: session.qr,
      user: session.user,
      lastConnectedAt: session.lastConnectedAt,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // 2. GET /sessions - Resumo de todas as sessões ativas
  if (req.method === 'GET' && pathname === '/sessions') {
    const list = Array.from(sessions.values()).map(s => ({
      tenantId: s.tenantId,
      status: s.status,
      user: s.user,
      lastConnectedAt: s.lastConnectedAt
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, count: list.length, sessions: list }));
    return;
  }

  // 3. POST /send - Disparo silencioso no WhatsApp exclusivo do salão
  if (req.method === 'POST' && pathname === '/send') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { tenant_id, phone, message } = JSON.parse(body || '{}');
        const tenantId = sanitizeTenantId(tenant_id || queryTenant);

        if (!phone || !message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Telefone e mensagem são obrigatórios.' }));
          return;
        }

        const session = await getOrCreateTenantSession(tenantId);

        if (session.status !== 'CONNECTED' || !session.sock) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            error: `WhatsApp do salão (${tenantId}) não está conectado no momento. Por favor, escaneie o QR Code nas configurações deste salão.`,
            status: session.status,
            tenantId
          }));
          return;
        }

        // Sanitização de número de telefone
        let cleanPhone = String(phone).replace(/\D/g, '');
        if (cleanPhone.length === 10 || cleanPhone.length === 11) {
          cleanPhone = `55${cleanPhone}`;
        }

        const jid = `${cleanPhone}@s.whatsapp.net`;

        // Disparo real via Baileys Multi-Device do salão
        const result = await session.sock.sendMessage(jid, { text: message });

        console.log(`✉️ [WhatsApp Daemon - Salão ${tenantId}] Mensagem enviada com sucesso para ${cleanPhone} (ID: ${result?.key?.id})`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          tenantId,
          messageId: result?.key?.id,
          phone: cleanPhone,
          timestamp: new Date().toISOString()
        }));
      } catch (sendErr) {
        console.error('❌ [WhatsApp Daemon] Erro ao enviar mensagem:', sendErr);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: sendErr.message }));
      }
    });
    return;
  }

  // 4. POST /logout - Desconectar apenas a sessão do salão solicitado
  if (req.method === 'POST' && pathname === '/logout') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { tenant_id } = JSON.parse(body || '{}');
        const tenantId = sanitizeTenantId(tenant_id || queryTenant);

        const session = sessions.get(tenantId);
        if (session && session.sock) {
          try { await session.sock.logout(); } catch (e) {}
          try { session.sock.end(); } catch (e) {}
          session.sock = null;
        }

        const tenantAuthDir = getTenantAuthDir(tenantId);
        try {
          fs.rmSync(tenantAuthDir, { recursive: true, force: true });
        } catch (e) {}

        if (session) {
          session.status = 'DISCONNECTED';
          session.qr = null;
          session.user = null;
        }

        setTimeout(() => getOrCreateTenantSession(tenantId), 1000);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          message: `Sessão do salão (${tenantId}) desconectada com sucesso. Gerando novo QR Code exclusivo...`,
          tenantId 
        }));
      } catch (logoutErr) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: logoutErr.message }));
      }
    });
    return;
  }

  // 5. POST /restart - Reiniciar sessão do salão solicitado
  if (req.method === 'POST' && pathname === '/restart') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { tenant_id } = JSON.parse(body || '{}');
        const tenantId = sanitizeTenantId(tenant_id || queryTenant);

        const session = sessions.get(tenantId);
        if (session && session.sock) {
          try { session.sock.end(); } catch (e) {}
        }
        await getOrCreateTenantSession(tenantId);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: `Sessão do salão (${tenantId}) reiniciada.`, tenantId }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint não encontrado no WhatsApp Daemon Multi-Tenant.' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`================================================================`);
  console.log(`📱 DAEMON WHATSAPP MULTI-TENANT ATIVO NA PORTA: ${PORT}`);
  console.log(`================================================================`);
});
