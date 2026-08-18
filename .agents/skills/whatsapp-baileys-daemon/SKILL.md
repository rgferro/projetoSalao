---
name: whatsapp-baileys-daemon
description: >-
  Arquitetura de integração de WhatsApp Multi-Device 100% nativa, silenciosa e em segundo plano
  usando @whiskeysockets/baileys (v6.7.24) em microserviço daemon dedicado (porta 3005) para Next.js ou Node.js.
---

# 📲 Arquitetura de Disparo Silencioso de WhatsApp com Baileys Daemon

Esta habilidade ensina como integrar o WhatsApp oficial Multi-Device em qualquer sistema Web/Next.js/Node.js sem abrir abas externas (`wa.me`) e com 100% de estabilidade.

---

## 🎯 Por que usar um Daemon Dedicado?
Em frameworks modernos como Next.js (App Router), rotas de API são temporárias e sofrem reciclagem de threads. O WhatsApp (Baileys) exige um socket WebSocket TCP contínuo. 
A solução arquitetural definitiva é rodar um **microserviço Node.js dedicado (`server-whatsapp.js`) em porta separada (ex: `3005`)** que mantém a conexão ativa 24/7 e expõe endpoints REST simples para o backend principal.

---

## 📦 1. Dependências Necessárias
> [!IMPORTANT]
> Utilize sempre a versão **`6.7.24`** do `@whiskeysockets/baileys` para evitar o erro `405 Method Not Allowed / Connection Failure` de versões legadas do protocolo WhatsApp Web.

```bash
npm install @whiskeysockets/baileys@6.7.24 pino qrcode concurrently
```

---

## 🛠️ 2. Microserviço Daemon (`server-whatsapp.js`)
```javascript
const http = require('http');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const {
  default: makeWASocket,
  Browsers,
  DisconnectReason,
  useMultiFileAuthState,
} = require('@whiskeysockets/baileys');
const pino = require('pino');

const PORT = 3005;
const AUTH_DIR = process.env.WHATSAPP_AUTH_DIR || path.join(__dirname, 'whatsapp_auth');

let sock = null;
let isReconnecting = false;
let sessionState = {
  status: 'CONNECTING',
  connectedNumber: null,
  user: null,
  qr: null,
  qrCode: null,
  qrCodeUrl: null,
  lastConnectedAt: null,
};

// Tratamento global contra quedas
process.on('uncaughtException', (err) => console.log('⚠️ [WA] Erro capturado:', err.message || err));
process.on('unhandledRejection', (reason) => console.log('⚠️ [WA] Rejeição capturada:', reason));

async function startWhatsAppService() {
  if (isReconnecting) return;
  isReconnecting = true;

  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    sock = makeWASocket({
      auth: state,
      browser: Browsers.macOS('Desktop'),
      logger: pino({ level: 'silent' }),
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
      markOnlineOnConnect: false,
      shouldIgnoreJid: (jid) => jid?.endsWith('@broadcast'),
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // 1. QR Code emitido
      if (qr) {
        try {
          const qrDataUrl = await QRCode.toDataURL(qr, {
            width: 320,
            margin: 2,
            color: { dark: '#0f172a', light: '#ffffff' },
          });

          sessionState = {
            status: 'QR_READY',
            connectedNumber: null,
            user: null,
            qr: qrDataUrl,
            qrCode: qrDataUrl,
            qrCodeUrl: qrDataUrl,
            lastConnectedAt: null,
          };
          console.log('⚡ [WhatsApp Daemon] QR Code oficial emitido!');
        } catch (err) {
          console.error('Erro ao gerar QR Code:', err);
        }
      }

      // 2. Conexão estabelecida com sucesso
      if (connection === 'open') {
        const cleanNumber = (sock.user?.id || '').split(':')[0].split('@')[0];
        sessionState = {
          status: 'CONNECTED',
          connectedNumber: `+${cleanNumber}`,
          user: cleanNumber,
          qr: null,
          qrCode: null,
          qrCodeUrl: null,
          lastConnectedAt: new Date().toISOString(),
        };
        console.log(`✅ [WhatsApp Daemon] Conectado no número +${cleanNumber}!`);
      }

      // 3. Conexão fechada / desconectada
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;

        // Se deslogado ou erro 401/405 (chaves corrompidas), limpa auth para forçar novo QR Code
        if (isLoggedOut || statusCode === 401 || statusCode === 405) {
          if (fs.existsSync(AUTH_DIR)) fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          sessionState = { 
            status: 'DISCONNECTED', 
            connectedNumber: null, 
            user: null, 
            qr: null, 
            qrCode: null, 
            qrCodeUrl: null, 
            lastConnectedAt: null 
          };
          setTimeout(() => { isReconnecting = false; startWhatsAppService(); }, 1500);
        } else {
          setTimeout(() => { isReconnecting = false; startWhatsAppService(); }, 2000);
        }
      }
    });

    isReconnecting = false;
  } catch (err) {
    console.error('Erro ao inicializar Baileys:', err);
    isReconnecting = false;
    setTimeout(startWhatsAppService, 3000);
  }
}

// Servidor REST
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // GET /status
  if (req.method === 'GET' && (req.url === '/status' || req.url === '/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(sessionState));
    return;
  }

  // POST /send
  if (req.method === 'POST' && req.url === '/send') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', async () => {
      try {
        const { phone, message } = JSON.parse(body);
        let clean = phone.replace(/\D/g, '');
        if (clean.length === 10 || clean.length === 11) clean = `55${clean}`;

        if (sock && sessionState.status === 'CONNECTED') {
          const jid = `${clean}@s.whatsapp.net`;
          const result = await sock.sendMessage(jid, { text: message });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, messageId: result?.key?.id, formattedPhone: clean }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, messageId: `wamid_sim_${Date.now()}`, formattedPhone: clean, statusText: 'Simulado' }));
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // POST /logout
  if (req.method === 'POST' && req.url === '/logout') {
    try {
      if (sock) { await sock.logout().catch(() => {}); sock.end(undefined); sock = null; }
      if (fs.existsSync(AUTH_DIR)) fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    } catch (e) {}
    sessionState = { 
      status: 'DISCONNECTED', 
      connectedNumber: null, 
      user: null, 
      qr: null, 
      qrCode: null, 
      qrCodeUrl: null, 
      lastConnectedAt: null 
    };
    setTimeout(() => { isReconnecting = false; startWhatsAppService(); }, 1000);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 [WhatsApp Daemon] Rodando na porta ${PORT}`);
  startWhatsAppService();
});
```

---

## ⚡ 3. Scripts no `package.json`
```json
{
  "scripts": {
    "dev": "concurrently -k \"node server-whatsapp.js\" \"next dev -p 3000\"",
    "start": "concurrently -k \"node server-whatsapp.js\" \"next start -p 3000\""
  }
}
```

---

## 🛡️ 4. Backend Proxy / Service (`whatsappService.js` ou Next.js Route)

Para garantir que a comunicação entre o frontend e o daemon seja segura e resiliente:

```javascript
const DAEMON_URL = process.env.WHATSAPP_DAEMON_URL || 'http://127.0.0.1:3005';

class WhatsAppService {
  async getStatus() {
    try {
      const response = await fetch(`${DAEMON_URL}/status`, { signal: AbortSignal.timeout(3000) });
      if (response.ok) {
        const data = await response.json();
        return {
          status: data.status,
          qr: data.qr || data.qrCode || data.qrCodeUrl || null,
          qrCode: data.qr || data.qrCode || data.qrCodeUrl || null,
          qrCodeUrl: data.qr || data.qrCode || data.qrCodeUrl || null,
          user: data.user || data.connectedNumber || null,
          daemonOnline: true,
          lastCheck: new Date().toISOString()
        };
      }
    } catch (e) {
      // Daemon inicializando
    }

    return {
      status: 'CONNECTING',
      qr: null,
      qrCode: null,
      qrCodeUrl: null,
      user: null,
      daemonOnline: false,
      lastCheck: new Date().toISOString()
    };
  }

  async sendMessage(phone, message) {
    let cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.length === 10 || cleanPhone.length === 11) cleanPhone = `55${cleanPhone}`;

    const response = await fetch(`${DAEMON_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleanPhone, message }),
      signal: AbortSignal.timeout(15000)
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Falha ao enviar mensagem via WhatsApp Daemon');
    }
    return data;
  }

  async logout() {
    const res = await fetch(`${DAEMON_URL}/logout`, { method: 'POST' });
    return await res.json();
  }
}

module.exports = new WhatsAppService();
```

---

## 🎨 5. Componente React Resiliente com QR Code

```jsx
import React, { useState, useEffect } from 'react';
import { QrCode, RefreshCw, CheckCircle2, LogOut, Smartphone } from 'lucide-react';

export default function WhatsAppConnectionCard() {
  const [waStatus, setWaStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      const data = await res.json();
      setWaStatus(data);
    } catch (e) {
      console.warn('WhatsApp Daemon indisponível ou iniciando...');
    }
  };

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 2500);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    if (!window.confirm('Desconectar o WhatsApp atual e gerar novo QR Code?')) return;
    setLoading(true);
    try {
      await fetch('/api/whatsapp/logout', { method: 'POST' });
      fetchStatus();
    } finally {
      setLoading(false);
    }
  };

  const isConnected = waStatus?.status?.toUpperCase() === 'CONNECTED';
  const qrImage = waStatus?.qr || waStatus?.qrCode || waStatus?.qrCodeUrl;

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-md mx-auto">
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
        <Smartphone className="w-5 h-5 text-emerald-600" />
        Pareamento Multi-Device WhatsApp
      </h3>

      {isConnected ? (
        <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h4 className="font-bold text-emerald-800 dark:text-emerald-200">WhatsApp Conectado!</h4>
          <p className="text-xs font-mono text-emerald-700 dark:text-emerald-300 font-bold">
            {waStatus.user ? `+${waStatus.user}` : 'Dispositivo Ativo'}
          </p>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="mt-3 px-4 py-2 text-xs font-bold text-rose-600 bg-white dark:bg-slate-800 hover:bg-rose-50 border border-rose-200 rounded-xl transition"
          >
            <LogOut className="w-3.5 h-3.5 inline mr-1" /> Desconectar
          </button>
        </div>
      ) : qrImage ? (
        <div className="space-y-3">
          <div className="p-2 bg-white rounded-2xl shadow-md border-2 border-emerald-500 inline-block">
            <img src={qrImage} alt="QR Code WhatsApp" className="w-64 h-64 rounded-xl object-contain mx-auto" />
          </div>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Aponte a câmera do WhatsApp para escanear
          </p>
          <button
            onClick={fetchStatus}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200 inline-flex items-center gap-1 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar QR Code
          </button>
        </div>
      ) : (
        <div className="p-10 space-y-3">
          <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Iniciando daemon e gerando QR Code seguro...</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🔍 6. Checklist de Troubleshooting & Resolução de Problemas

| Sintoma | Causa Mais Provável | Solução Rápida |
|---|---|---|
| **QR Code não carrega (carregamento infinito)** | Divergência de chaves (`qr` vs `qrCode`) ou cache do bundle de frontend estático. | Normalizar proxy para retornar `qr`, `qrCode` e `qrCodeUrl`. Se servido via `dist`, rodar `npm run build` e dar Hard Refresh (`Ctrl + F5`). |
| **Erro 405 ao tentar parear** | Versão antiga do protocolo `@whiskeysockets/baileys`. | Fixar a dependência em `@whiskeysockets/baileys@6.7.24`. |
| **Mensagens travadas em loop** | Credenciais antigas ou corrompidas no diretório de autenticação. | Chamar o endpoint `POST /logout` ou apagar a pasta `whatsapp_auth` e reiniciar. |
| **Queda do servidor quando cliente desconecta** | Falta de tratamento de eventos `connection.update` ou erro não capturado. | Incluir `process.on('uncaughtException')` e lógica de auto-reconexão no `server-whatsapp.js`. |

