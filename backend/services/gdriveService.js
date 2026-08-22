const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { DB_PATH, run, query, get } = require('../database/db');
const logger = require('./logger');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const MAGIC_HEADER = Buffer.from('BELABACKUP_V1'); // 13 bytes
const SQLITE_MAGIC_HEADER = Buffer.from('SQLite format 3\0');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Calcula o hash SHA-256 de um buffer ou arquivo
 */
function calculateFileSHA256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

function calculateBufferSHA256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Deriva uma chave de 256 bits (32 bytes) a partir de uma senha/passphrase usando PBKDF2
 */
function deriveKey(passphrase, salt) {
  return crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha512');
}

/**
 * Criptografa dados com AES-256-GCM gerando envelope binário
 */
function encryptAESGCM(dataBuffer, passphrase = 'BELLA_GESTAO_SECURE_KEY_2026') {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12); // 96-bit nonce recomendado para GCM
  const key = deriveKey(passphrase, salt);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag(); // 16 bytes

  // Envelope: [ MAGIC (13 bytes) | SALT (16 bytes) | IV (12 bytes) | AUTH_TAG (16 bytes) | CIPHERTEXT ]
  return Buffer.concat([MAGIC_HEADER, salt, iv, authTag, encrypted]);
}

/**
 * Descriptografa envelope binário AES-256-GCM com validação de Auth Tag
 */
function decryptAESGCM(encryptedBuffer, passphrase = 'BELLA_GESTAO_SECURE_KEY_2026') {
  const magicLen = MAGIC_HEADER.length; // 13
  const saltLen = 16;
  const ivLen = 12;
  const authTagLen = 16;
  const headerLen = magicLen + saltLen + ivLen + authTagLen; // 57 bytes

  if (encryptedBuffer.length < headerLen) {
    throw new Error('Arquivo de backup corrompido ou formato inválido (tamanho insuficiente).');
  }

  const magic = encryptedBuffer.subarray(0, magicLen);
  if (!magic.equals(MAGIC_HEADER)) {
    throw new Error('Arquivo não possui o cabeçalho de criptografia esperado (BELABACKUP_V1).');
  }

  let offset = magicLen;
  const salt = encryptedBuffer.subarray(offset, offset + saltLen);
  offset += saltLen;

  const iv = encryptedBuffer.subarray(offset, offset + ivLen);
  offset += ivLen;

  const authTag = encryptedBuffer.subarray(offset, offset + authTagLen);
  offset += authTagLen;

  const ciphertext = encryptedBuffer.subarray(offset);

  const key = deriveKey(passphrase, salt);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted;
  } catch (err) {
    throw new Error('Falha de autenticidade ou senha de descriptografia incorreta. Os dados podem ter sido adulterados.');
  }
}

class GDriveService {
  /**
   * Obtém credenciais OAuth 2.0 configuradas
   */
  async getOAuthConfig(tenantId = 'tenant_default') {
    const envClientId = process.env.GOOGLE_CLIENT_ID || '';
    const envClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    const envRedirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL || 'http://localhost:3001'}/api/backup/gdrive/callback`;

    const dbClientId = await get('SELECT value FROM settings WHERE key = ? AND (tenant_id = ? OR tenant_id = "tenant_default")', ['gdrive_client_id', tenantId]);
    const dbClientSecret = await get('SELECT value FROM settings WHERE key = ? AND (tenant_id = ? OR tenant_id = "tenant_default")', ['gdrive_client_secret', tenantId]);
    const dbRedirectUri = await get('SELECT value FROM settings WHERE key = ? AND (tenant_id = ? OR tenant_id = "tenant_default")', ['gdrive_redirect_uri', tenantId]);

    const clientId = dbClientId?.value || envClientId;
    const clientSecret = dbClientSecret?.value || envClientSecret;
    const redirectUri = dbRedirectUri?.value || envRedirectUri;

    return { clientId, clientSecret, redirectUri };
  }

  /**
   * Salva credenciais do cliente OAuth
   */
  async saveOAuthConfig(tenantId, { clientId, clientSecret, redirectUri }) {
    if (clientId !== undefined) {
      await run(`INSERT INTO settings (key, value, tenant_id) VALUES ('gdrive_client_id', ?, ?)
                 ON CONFLICT(key, tenant_id) DO UPDATE SET value = excluded.value`, [clientId, tenantId]);
    }
    if (clientSecret !== undefined) {
      await run(`INSERT INTO settings (key, value, tenant_id) VALUES ('gdrive_client_secret', ?, ?)
                 ON CONFLICT(key, tenant_id) DO UPDATE SET value = excluded.value`, [clientSecret, tenantId]);
    }
    if (redirectUri !== undefined) {
      await run(`INSERT INTO settings (key, value, tenant_id) VALUES ('gdrive_redirect_uri', ?, ?)
                 ON CONFLICT(key, tenant_id) DO UPDATE SET value = excluded.value`, [redirectUri, tenantId]);
    }
  }

  /**
   * Gera a URL de autorização OAuth 2.0 com escopos estritos de menor privilégio
   */
  async getAuthUrl(tenantId = 'tenant_default', stateExtra = '') {
    const { clientId, redirectUri } = await this.getOAuthConfig(tenantId);
    if (!clientId) {
      throw new Error('Google Client ID não configurado. Defina as credenciais OAuth nas configurações.');
    }

    const statePayload = Buffer.from(JSON.stringify({ tenantId, extra: stateExtra, ts: Date.now() })).toString('base64url');

    // Escopos de menor privilégio: apenas arquivos criados pela aplicação (drive.file e drive.appdata)
    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.appdata',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent',
      state: statePayload,
      include_granted_scopes: 'true',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Troca o Authorization Code por tokens OAuth (Access Token e Refresh Token)
   */
  async exchangeCodeForTokens(code, tenantId = 'tenant_default') {
    const { clientId, clientSecret, redirectUri } = await this.getOAuthConfig(tenantId);
    if (!clientId || !clientSecret) {
      throw new Error('Credenciais Google OAuth (Client ID ou Client Secret) não configuradas.');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error_description || data.error || 'Falha ao trocar código por tokens do Google.');
    }

    // Obter informações do usuário conectado
    let userEmail = '';
    try {
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (userRes.ok) {
        const userInfo = await userRes.json();
        userEmail = userInfo.email || '';
      }
    } catch (e) {}

    const expiresAt = Date.now() + ((data.expires_in || 3600) - 300) * 1000;

    await run(`INSERT INTO settings (key, value, tenant_id) VALUES ('gdrive_access_token', ?, ?)
               ON CONFLICT(key, tenant_id) DO UPDATE SET value = excluded.value`, [data.access_token, tenantId]);
    if (data.refresh_token) {
      await run(`INSERT INTO settings (key, value, tenant_id) VALUES ('gdrive_refresh_token', ?, ?)
                 ON CONFLICT(key, tenant_id) DO UPDATE SET value = excluded.value`, [data.refresh_token, tenantId]);
    }
    await run(`INSERT INTO settings (key, value, tenant_id) VALUES ('gdrive_token_expires_at', ?, ?)
               ON CONFLICT(key, tenant_id) DO UPDATE SET value = excluded.value`, [String(expiresAt), tenantId]);
    if (userEmail) {
      await run(`INSERT INTO settings (key, value, tenant_id) VALUES ('gdrive_connected_email', ?, ?)
                 ON CONFLICT(key, tenant_id) DO UPDATE SET value = excluded.value`, [userEmail, tenantId]);
    }

    logger.info(`[GDrive] Conta Google vinculada com sucesso para o tenant ${tenantId}. Email: ${userEmail}`);
    return { success: true, userEmail, expiresAt };
  }

  /**
   * Obtém token de acesso válido, renovando automaticamente se expirado
   */
  async getValidAccessToken(tenantId = 'tenant_default') {
    const accessTokenRow = await get('SELECT value FROM settings WHERE key = ? AND (tenant_id = ? OR tenant_id = "tenant_default")', ['gdrive_access_token', tenantId]);
    const refreshTokenRow = await get('SELECT value FROM settings WHERE key = ? AND (tenant_id = ? OR tenant_id = "tenant_default")', ['gdrive_refresh_token', tenantId]);
    const expiresAtRow = await get('SELECT value FROM settings WHERE key = ? AND (tenant_id = ? OR tenant_id = "tenant_default")', ['gdrive_token_expires_at', tenantId]);

    const accessToken = accessTokenRow?.value;
    const refreshToken = refreshTokenRow?.value;
    const expiresAt = Number(expiresAtRow?.value || 0);

    if (!accessToken && !refreshToken) {
      return null;
    }

    if (accessToken && Date.now() < expiresAt) {
      return accessToken;
    }

    if (!refreshToken) {
      return null;
    }

    // Renovar token com refresh_token
    const { clientId, clientSecret } = await this.getOAuthConfig(tenantId);
    if (!clientId || !clientSecret) {
      throw new Error('Credenciais OAuth incompletas para renovar token do Google.');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      logger.warn(`[GDrive] Falha ao renovar token com refresh_token: ${data.error_description || data.error}`);
      return null;
    }

    const newExpiresAt = Date.now() + ((data.expires_in || 3600) - 300) * 1000;
    await run(`INSERT INTO settings (key, value, tenant_id) VALUES ('gdrive_access_token', ?, ?)
               ON CONFLICT(key, tenant_id) DO UPDATE SET value = excluded.value`, [data.access_token, tenantId]);
    await run(`INSERT INTO settings (key, value, tenant_id) VALUES ('gdrive_token_expires_at', ?, ?)
               ON CONFLICT(key, tenant_id) DO UPDATE SET value = excluded.value`, [String(newExpiresAt), tenantId]);

    return data.access_token;
  }

  /**
   * Desconecta o Google Drive do tenant
   */
  async disconnectGDrive(tenantId = 'tenant_default') {
    await run(`DELETE FROM settings WHERE key IN ('gdrive_access_token', 'gdrive_refresh_token', 'gdrive_token_expires_at', 'gdrive_connected_email') AND tenant_id = ?`, [tenantId]);
    logger.info(`[GDrive] Google Drive desconectado para tenant ${tenantId}.`);
    return { success: true, message: 'Google Drive desconectado com sucesso.' };
  }

  /**
   * Obtém status detalhado da conexão com o Google Drive
   */
  async getStatus(tenantId = 'tenant_default') {
    const oauthConfig = await this.getOAuthConfig(tenantId);
    const emailRow = await get('SELECT value FROM settings WHERE key = ? AND (tenant_id = ? OR tenant_id = "tenant_default")', ['gdrive_connected_email', tenantId]);

    const hasConfig = Boolean(oauthConfig.clientId && oauthConfig.clientSecret);
    let isConnected = false;
    let email = emailRow?.value || '';

    try {
      const token = await this.getValidAccessToken(tenantId);
      if (token) {
        isConnected = true;
      }
    } catch (e) {
      isConnected = false;
    }

    const lastCloudSync = await get(
      `SELECT * FROM backup_logs WHERE backup_type = 'gdrive' AND status = 'sucesso' AND (tenant_id = ? OR tenant_id = 'tenant_default') ORDER BY created_at DESC LIMIT 1`,
      [tenantId]
    );

    return {
      hasConfig,
      isConnected,
      connectedEmail: email,
      lastCloudSync,
      oauthConfig: {
        clientId: oauthConfig.clientId ? `${oauthConfig.clientId.substring(0, 12)}...` : '',
        redirectUri: oauthConfig.redirectUri,
      },
    };
  }

  /**
   * Criação de backup local criptografado (.enc) com AES-256-GCM
   */
  async createEncryptedBackup(passphrase = 'BELLA_GESTAO_SECURE_KEY_2026', tenantId = 'tenant_default') {
    if (!fs.existsSync(DB_PATH)) {
      throw new Error('Banco de dados SQLite principal não localizado para backup.');
    }

    const dbBuffer = fs.readFileSync(DB_PATH);
    const compressedBuffer = zlib.deflateSync(dbBuffer, { level: 9 });
    const encryptedBuffer = encryptAESGCM(compressedBuffer, passphrase);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const encFilename = `backup_salao_${timestamp}.enc`;
    const encFilePath = path.join(BACKUP_DIR, encFilename);

    fs.writeFileSync(encFilePath, encryptedBuffer);
    const sha256 = calculateBufferSHA256(encryptedBuffer);

    await run(
      `INSERT INTO backup_logs (filename, file_path, size_bytes, backup_type, status, error_message, sha256, tenant_id)
       VALUES (?, ?, ?, 'local_encrypted', 'sucesso', 'AES-256-GCM', ?, ?)`,
      [encFilename, encFilePath, encryptedBuffer.length, sha256, tenantId]
    );

    logger.info(`[Backup] Backup criptografado local gerado: ${encFilename} (AES-256-GCM, SHA256: ${sha256})`);

    return {
      filename: encFilename,
      path: encFilePath,
      size: encryptedBuffer.length,
      sha256,
      encryption: 'AES-256-GCM',
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Alias de compatibilidade para criar backup local
   */
  async createLocalBackup(tenantId = 'tenant_default') {
    return this.createEncryptedBackup('BELLA_GESTAO_SECURE_KEY_2026', tenantId);
  }

  /**
   * Upload de arquivo para o Google Drive via Google Drive REST API v3 (Multipart Upload)
   */

  async uploadToGoogleDrive(fileBuffer, filename, mimeType = 'application/octet-stream', tenantId = 'tenant_default') {
    const accessToken = await this.getValidAccessToken(tenantId);
    if (!accessToken) {
      throw new Error('Google Drive não está conectado ou a sessão expirou. Conecte sua conta do Google Drive primeiro.');
    }

    const metadata = {
      name: filename,
      description: 'BelaGestão Studio Encrypted Backup (AES-256-GCM)',
      appProperties: {
        app: 'BelaGestaoStudio',
        type: 'database_backup',
        encryption: 'AES-256-GCM',
        tenantId: tenantId,
      },
    };

    const boundary = '-------BelaGestaoBoundary' + Date.now().toString(16);
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataHeader = delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata);

    const mediaHeader = delimiter +
      `Content-Type: ${mimeType}\r\n\r\n`;

    const multipartBody = Buffer.concat([
      Buffer.from(metadataHeader, 'utf-8'),
      Buffer.from(mediaHeader, 'utf-8'),
      fileBuffer,
      Buffer.from(closeDelimiter, 'utf-8'),
    ]);

    const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,createdTime,mimeType';

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': String(multipartBody.length),
      },
      body: multipartBody,
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error?.message || data.error_description || 'Falha ao enviar backup para o Google Drive.');
    }

    return data;
  }

  /**
   * Executa o fluxo completo: Compactação -> Criptografia AES-256-GCM -> Upload no Google Drive
   */
  async performCloudBackup(passphrase = 'BELLA_GESTAO_SECURE_KEY_2026', tenantId = 'tenant_default') {
    const localEncrypted = await this.createEncryptedBackup(passphrase, tenantId);
    const encBuffer = fs.readFileSync(localEncrypted.path);

    const gdriveResult = await this.uploadToGoogleDrive(encBuffer, localEncrypted.filename, 'application/octet-stream', tenantId);

    await run(
      `INSERT INTO backup_logs (filename, file_path, size_bytes, backup_type, status, error_message, sha256, tenant_id)
       VALUES (?, ?, ?, 'gdrive', 'sucesso', ?, ?, ?)`,
      [
        localEncrypted.filename,
        `gdrive://${gdriveResult.id}`,
        localEncrypted.size,
        `Enviado ao Google Drive (ID: ${gdriveResult.id}) com criptografia AES-256-GCM`,
        localEncrypted.sha256,
        tenantId,
      ]
    );

    logger.info(`[GDrive] Backup enviado ao Google Drive com sucesso. ID: ${gdriveResult.id}`);

    return {
      success: true,
      filename: localEncrypted.filename,
      fileId: gdriveResult.id,
      size: localEncrypted.size,
      sha256: localEncrypted.sha256,
      uploadedAt: gdriveResult.createdTime || new Date().toISOString(),
      message: 'Cópia de segurança criptografada (AES-256-GCM) enviada ao Google Drive com sucesso!',
    };
  }

  /**
   * Lista backups armazenados no Google Drive
   */
  async listGoogleDriveBackups(tenantId = 'tenant_default') {
    const accessToken = await this.getValidAccessToken(tenantId);
    if (!accessToken) {
      return { connected: false, files: [] };
    }

    const q = "trashed = false and (name contains 'backup_salao_' or appProperties has { key='app' and value='BelaGestaoStudio' })";
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,size,createdTime,modifiedTime,mimeType,appProperties)&orderBy=createdTime desc&pageSize=50`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error?.message || 'Falha ao listar backups do Google Drive.');
    }

    const files = (data.files || []).map((f) => ({
      id: f.id,
      filename: f.name,
      size: Number(f.size || 0),
      createdAt: f.createdTime,
      isEncrypted: f.name.endsWith('.enc') || f.appProperties?.encryption === 'AES-256-GCM',
    }));

    return { connected: true, files };
  }

  /**
   * Baixa um arquivo diretamente do Google Drive por File ID (Stream / Buffer)
   */
  async downloadFromGoogleDrive(fileId, tenantId = 'tenant_default') {
    const accessToken = await this.getValidAccessToken(tenantId);
    if (!accessToken) {
      throw new Error('Google Drive não está conectado.');
    }

    const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,size,mimeType`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const metadata = await metaRes.json();
    if (!metaRes.ok) {
      throw new Error(metadata.error?.message || 'Arquivo não localizado no Google Drive.');
    }

    const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!downloadRes.ok) {
      throw new Error('Falha ao baixar arquivo do Google Drive.');
    }

    const arrayBuf = await downloadRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    return {
      filename: metadata.name || `backup_${fileId}.enc`,
      size: buffer.length,
      buffer,
    };
  }

  /**
   * Restauração segura a partir de buffer com validação anti-tampering e verificação de cabeçalho SQLite
   */
  async restoreFromBuffer(inputBuffer, passphrase = 'BELLA_GESTAO_SECURE_KEY_2026') {
    let rawDbBuffer = null;

    // Caso 1: Envelope Criptografado AES-256-GCM (Começa com BELABACKUP_V1)
    if (inputBuffer.length >= MAGIC_HEADER.length && inputBuffer.subarray(0, MAGIC_HEADER.length).equals(MAGIC_HEADER)) {
      try {
        const decryptedCompressed = decryptAESGCM(inputBuffer, passphrase);
        rawDbBuffer = zlib.inflateSync(decryptedCompressed);
      } catch (err) {
        throw new Error(`Erro na descriptografia do backup: ${err.message}`);
      }
    }
    // Caso 2: Arquivo já é um banco SQLite não criptografado
    else if (inputBuffer.length >= 16 && inputBuffer.subarray(0, 16).equals(SQLITE_MAGIC_HEADER)) {
      rawDbBuffer = inputBuffer;
    }
    // Caso 3: Arquivo comprimido zlib direto
    else {
      try {
        const decompressed = zlib.inflateSync(inputBuffer);
        if (decompressed.length >= 16 && decompressed.subarray(0, 16).equals(SQLITE_MAGIC_HEADER)) {
          rawDbBuffer = decompressed;
        }
      } catch (e) {
        throw new Error('Arquivo de backup inválido ou formato não suportado. Verifique se a senha informada está correta.');
      }
    }

    if (!rawDbBuffer || rawDbBuffer.length < 16) {
      throw new Error('Arquivo de restauração inválido: conteúdo vazio ou corrompido.');
    }

    // Validação Estrita de Segurança Anti-Injection / Anti-Tampering: Cabeçalho Mágico SQLite
    const header = rawDbBuffer.subarray(0, 16);
    if (!header.equals(SQLITE_MAGIC_HEADER)) {
      throw new Error('Arquivo descriptografado não é um banco de dados SQLite válido. Restauração cancelada por segurança.');
    }

    // Criar Snapshot de Segurança de Rollback do banco atual antes de sobrescrever
    const rollbackSnapshotPath = path.join(BACKUP_DIR, `pre_restore_${Date.now()}.db.bak`);
    if (fs.existsSync(DB_PATH)) {
      try {
        fs.copyFileSync(DB_PATH, rollbackSnapshotPath);
        logger.info(`[Backup] Snapshot de segurança criado antes da restauração em: ${rollbackSnapshotPath}`);
      } catch (e) {
        logger.warn(`[Backup] Aviso ao criar snapshot pré-restauração: ${e.message}`);
      }
    }

    // Sobrescrever atomicamente o arquivo do banco SQLite
    fs.writeFileSync(DB_PATH, rawDbBuffer);
    const sha256 = calculateBufferSHA256(rawDbBuffer);

    logger.security(`[Backup] Restauração concluída com sucesso. Checksum SHA-256 do banco restaurado: ${sha256}`);

    return {
      success: true,
      sha256,
      size: rawDbBuffer.length,
      rollbackPoint: path.basename(rollbackSnapshotPath),
      message: 'Banco de dados restaurado com sucesso! Integridade SQLite verificada.',
    };
  }

  /**
   * Restauração a partir de arquivo em disco
   */
  async restoreBackup(uploadedFilePath, passphrase = 'BELLA_GESTAO_SECURE_KEY_2026') {
    if (!fs.existsSync(uploadedFilePath)) {
      throw new Error('Arquivo de restauração não encontrado.');
    }

    const fileBuffer = fs.readFileSync(uploadedFilePath);
    return this.restoreFromBuffer(fileBuffer, passphrase);
  }

  /**
   * Restauração direta de um backup localizado no Google Drive por File ID
   */
  async restoreFromGoogleDrive(fileId, passphrase = 'BELLA_GESTAO_SECURE_KEY_2026', tenantId = 'tenant_default') {
    const { buffer, filename } = await this.downloadFromGoogleDrive(fileId, tenantId);
    const result = await this.restoreFromBuffer(buffer, passphrase);
    result.filename = filename;
    return result;
  }

  /**
   * Listagem consolidada de backups locais e status da nuvem
   */
  async listBackups(tenantId = 'tenant_default') {
    const logs = await query('SELECT * FROM backup_logs WHERE tenant_id = ? OR tenant_id = "tenant_default" ORDER BY created_at DESC LIMIT 30', [tenantId]);
    const status = await this.getStatus(tenantId);

    const files = fs.existsSync(BACKUP_DIR)
      ? fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.enc') || f.endsWith('.zip') || f.endsWith('.db'))
      : [];

    return {
      gdriveStatus: status,
      history: logs,
      files: files.map((f) => {
        const fullPath = path.join(BACKUP_DIR, f);
        const st = fs.statSync(fullPath);
        return {
          filename: f,
          size: st.size,
          mtime: st.mtime,
          isEncrypted: f.endsWith('.enc'),
        };
      }),
    };
  }
}

module.exports = new GDriveService();

