const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const gdriveService = require('../services/gdriveService');
const { DB_PATH } = require('../database/db');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const tempDir = path.join(__dirname, '..', 'backups', 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const upload = multer({ dest: tempDir });

// -------------------------------------------------------------
// ROTA PÚBLICA DE CALLBACK OAUTH (Recebe redirect do Google via Popup/Navegador)
// -------------------------------------------------------------
router.get('/gdrive/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.send(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 40px;">
            <h2 style="color: #ef4444;">Conexão Cancelada ou Recusada</h2>
            <p>${error}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GDRIVE_AUTH_ERROR', error: '${error}' }, '*');
                setTimeout(() => window.close(), 2000);
              }
            </script>
          </body>
        </html>
      `);
    }

    if (!code) {
      return res.status(400).send('Código de autorização não informado.');
    }

    let tenantId = 'tenant_default';
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf-8'));
        if (decoded.tenantId) tenantId = decoded.tenantId;
      } catch (e) {}
    }

    const result = await gdriveService.exchangeCodeForTokens(code, tenantId);

    // Retorna página HTML que fecha o popup e notifica a janela principal
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Drive Conectado</title>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f0fdf4; color: #166534; }
            .card { background: white; padding: 32px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; max-width: 400px; }
            .check { font-size: 48px; margin-bottom: 16px; }
            h2 { margin: 0 0 8px 0; color: #15803d; }
            p { color: #4b5563; font-size: 14px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="check">✅</div>
            <h2>Google Drive Conectado!</h2>
            <p>Conta: <strong>${result.userEmail || 'Autorizada com Sucesso'}</strong></p>
            <p>Você já pode fechar esta janela.</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GDRIVE_AUTH_SUCCESS', email: '${result.userEmail || ''}' }, '*');
              setTimeout(() => { window.close(); }, 1500);
            } else {
              setTimeout(() => { window.location.href = '/'; }, 2000);
            }
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    return res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 40px;">
          <h2 style="color: #ef4444;">Erro ao Conectar Google Drive</h2>
          <p>${error.message}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GDRIVE_AUTH_ERROR', error: '${error.message}' }, '*');
            }
          </script>
        </body>
      </html>
    `);
  }
});

// -------------------------------------------------------------
// TODAS AS DEMAIS ROTAS EXIGEM AUTENTICAÇÃO E PERFIL ADMIN / DONO
// -------------------------------------------------------------
router.use(requireAuth, requireRole(['ADMIN', 'DONO']));

// Listar histórico de backups locais e status Google Drive
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant_default';
    const data = await gdriveService.listBackups(tenantId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter URL de autorização OAuth 2.0
router.get('/gdrive/auth-url', async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant_default';
    const authUrl = await gdriveService.getAuthUrl(tenantId);
    res.json({ authUrl });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Salvar credenciais OAuth personalizadas (opcional pelo painel)
router.post('/gdrive/config', async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant_default';
    const { clientId, clientSecret, redirectUri } = req.body;
    await gdriveService.saveOAuthConfig(tenantId, { clientId, clientSecret, redirectUri });
    res.json({ message: 'Credenciais Google OAuth salvas com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Conectar via código de autorização manual (troca direta)
router.post('/gdrive/connect', async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant_default';
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Código de autorização não informado.' });
    }
    const result = await gdriveService.exchangeCodeForTokens(code, tenantId);
    res.json({
      message: 'Google Drive conectado com sucesso!',
      userEmail: result.userEmail,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Consultar status da conexão Google Drive
router.get('/gdrive/status', async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant_default';
    const status = await gdriveService.getStatus(tenantId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Desconectar conta do Google Drive
router.post('/gdrive/disconnect', async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant_default';
    const result = await gdriveService.disconnectGDrive(tenantId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar arquivos de backup armazenados no Google Drive
router.get('/gdrive/files', async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant_default';
    const data = await gdriveService.listGoogleDriveBackups(tenantId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar Backup Local Criptografado com AES-256-GCM (.enc)
router.post('/create-encrypted', async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant_default';
    const { passphrase } = req.body;
    const backup = await gdriveService.createEncryptedBackup(passphrase, tenantId);
    res.status(201).json({
      message: 'Backup criptografado (AES-256-GCM) gerado com sucesso!',
      backup,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload Direto para Google Drive com Criptografia AES-256-GCM
router.post('/gdrive/upload', async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant_default';
    const { passphrase } = req.body;
    const result = await gdriveService.performCloudBackup(passphrase, tenantId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota de compatibilidade retroativa
router.post('/sync-gdrive', async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant_default';
    const { passphrase } = req.body;
    const status = await gdriveService.getStatus(tenantId);
    if (status.isConnected) {
      const result = await gdriveService.performCloudBackup(passphrase, tenantId);
      return res.json(result);
    } else {
      const backup = await gdriveService.createEncryptedBackup(passphrase, tenantId);
      return res.json({
        success: true,
        message: 'Backup criptografado local criado com sucesso! Conecte o Google Drive para envio em nuvem.',
        backup,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota de compatibilidade para criar local
router.post('/create-local', async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant_default';
    const { passphrase } = req.body;
    const backup = await gdriveService.createEncryptedBackup(passphrase, tenantId);
    res.status(201).json({
      message: 'Backup criptografado (AES-256-GCM) gerado com sucesso!',
      backup,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download de backup local (.enc, .zip, .db)
router.get('/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const safeFilename = path.basename(filename);
    const filePath = path.join(__dirname, '..', 'backups', safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Arquivo de backup não encontrado.' });
    }

    res.download(filePath, safeFilename);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download de backup diretamente do Google Drive por File ID
router.get('/gdrive/download/:fileId', async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant_default';
    const { fileId } = req.params;
    const file = await gdriveService.downloadFromGoogleDrive(fileId, tenantId);

    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', file.size);
    res.send(file.buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download direto do arquivo SQLite atual (.db)
router.get('/download-raw-db', (req, res) => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return res.status(404).json({ error: 'Banco de dados não encontrado.' });
    }
    const timestamp = new Date().toISOString().split('T')[0];
    res.download(DB_PATH, `salao_backup_${timestamp}.db`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restaurar Banco de Dados diretamente do Google Drive por File ID
router.post('/gdrive/restore/:fileId', async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant_default';
    const { fileId } = req.params;
    const { passphrase } = req.body;

    const result = await gdriveService.restoreFromGoogleDrive(fileId, passphrase, tenantId);
    res.json({
      message: `Backup "${result.filename}" do Google Drive restaurado com sucesso! O sistema foi atualizado com segurança.`,
      result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restaurar Banco de Dados via Upload de Arquivo (.enc, .zip ou .db)
router.post('/restore', upload.single('backupFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado para restauração.' });
    }

    const passphrase = req.body.passphrase;
    const uploadedPath = req.file.path;
    const result = await gdriveService.restoreBackup(uploadedPath, passphrase);

    // Limpar arquivo temporário
    try {
      if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);
    } catch (e) {}

    res.json({
      message: 'Restauração realizada com sucesso! O sistema foi restaurado para o ponto do arquivo.',
      result,
    });
  } catch (error) {
    // Limpar arquivo temporário em caso de erro
    if (req.file?.path) {
      try {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (e) {}
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

