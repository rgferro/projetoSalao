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
const AUTH_DIR = path.join(__dirname, 'whatsapp_auth');

// Blindagem contra quedas do processo
process.on('uncaughtException', (err) => {
  console.error('⚠️ [WhatsApp Daemon] Erro não capturado (blindado):', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️ [WhatsApp Daemon] Rejeição de Promise não tratada (blindada):', reason);
});

let sock = null;
let connectionStatus = 'CONNECTING'; // 'CONNECTING' | 'QR_READY' | 'CONNECTED' | 'DISCONNECTED'
let qrCodeDataUrl = null;
let userNumber = null;
let reconnectAttempts = 0;

const logger = pino({ level: 'silent' });

async function initWASocket() {
  try {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    let version = [2, 3000, 1015901307];
    try {
      const fetched = await fetchLatestBaileysVersion();
      if (fetched && fetched.version) version = fetched.version;
    } catch (vErr) {
      // fallback to standard
    }

    connectionStatus = 'CONNECTING';

    sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      auth: state,
      browser: Browsers.macOS('Desktop'),
      syncFullHistory: false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          qrCodeDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 8 });
          connectionStatus = 'QR_READY';
          console.log('📲 [WhatsApp Daemon] Novo QR Code gerado! Pronto para escanear.');
        } catch (qrErr) {
          console.error('Erro ao gerar QR Code DataURL:', qrErr);
        }
      }

      if (connection === 'open') {
        connectionStatus = 'CONNECTED';
        qrCodeDataUrl = null;
        reconnectAttempts = 0;
        const jid = sock.user?.id || '';
        userNumber = jid.split(':')[0] || jid.split('@')[0] || 'Conectado';
        console.log(`🟢 [WhatsApp Daemon] Conexão Multi-Device ativa com sucesso! Número: ${userNumber}`);
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`🔴 [WhatsApp Daemon] Conexão fechada. Motivo: ${statusCode}. Reconectando: ${shouldReconnect}`);

        if (shouldReconnect) {
          reconnectAttempts++;
          const delayMs = Math.min(reconnectAttempts * 2000, 10000);
          connectionStatus = 'CONNECTING';
          setTimeout(() => initWASocket(), delayMs);
        } else {
          connectionStatus = 'DISCONNECTED';
          qrCodeDataUrl = null;
          userNumber = null;
          // Limpar pasta de autenticação se deslogado
          try {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          } catch (e) {}
          setTimeout(() => initWASocket(), 2000);
        }
      }
    });

  } catch (error) {
    console.error('❌ [WhatsApp Daemon] Falha ao inicializar socket Baileys:', error);
    connectionStatus = 'DISCONNECTED';
    setTimeout(() => initWASocket(), 5000);
  }
}

// Inicia conexão do Baileys
initWASocket();

// Servidor HTTP Nativo com REST Endpoints na porta 3005
const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url.split('?')[0];

  // 1. GET /status
  if (req.method === 'GET' && url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: connectionStatus,
      qr: qrCodeDataUrl,
      user: userNumber,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // 2. POST /send - Disparo 100% silencioso em segundo plano
  if (req.method === 'POST' && url === '/send') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { phone, message } = JSON.parse(body || '{}');

        if (!phone || !message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Telefone e mensagem são obrigatórios.' }));
          return;
        }

        if (connectionStatus !== 'CONNECTED' || !sock) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            error: 'WhatsApp não está conectado no momento. Por favor, escaneie o QR Code nas configurações.',
            status: connectionStatus
          }));
          return;
        }

        // Sanitização de número de telefone
        let cleanPhone = String(phone).replace(/\D/g, '');
        if (cleanPhone.length === 10 || cleanPhone.length === 11) {
          cleanPhone = `55${cleanPhone}`;
        }

        const jid = `${cleanPhone}@s.whatsapp.net`;

        // Disparo real via Baileys Multi-Device
        const result = await sock.sendMessage(jid, { text: message });

        console.log(`✉️ [WhatsApp Daemon] Mensagem enviada com sucesso para ${cleanPhone} (ID: ${result?.key?.id})`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
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

  // 3. POST /logout - Desconectar e limpar credenciais
  if (req.method === 'POST' && url === '/logout') {
    try {
      if (sock) {
        try { await sock.logout(); } catch (e) {}
      }
      try {
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      } catch (e) {}
      connectionStatus = 'DISCONNECTED';
      qrCodeDataUrl = null;
      userNumber = null;
      setTimeout(() => initWASocket(), 1000);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Desconectado com sucesso. Gerando novo QR Code...' }));
    } catch (logoutErr) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: logoutErr.message }));
    }
    return;
  }

  // 4. POST /restart
  if (req.method === 'POST' && url === '/restart') {
    try {
      if (sock) {
        try { sock.end(); } catch (e) {}
      }
      initWASocket();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Serviço do WhatsApp reiniciado.' }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint não encontrado.' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`================================================================`);
  console.log(`📱 DAEMON WHATSAPP MULTI-DEVICE ATIVO NA PORTA: ${PORT}`);
  console.log(`================================================================`);
});
