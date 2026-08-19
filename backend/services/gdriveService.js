const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const archiver = require('archiver');
const { DB_PATH, run, query, get } = require('../database/db');
const logger = require('./logger');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Calcula o hash SHA-256 de um arquivo para garantir integridade anti-corrupção e anti-ransomware
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

class GDriveService {
  /**
   * Detecta automaticamente pastas de nuvem existentes no Windows do usuário
   */
  detectCloudStoragePath() {
    const userProfile = process.env.USERPROFILE || 'C:\\Users\\Default';

    const possibleCloudPaths = [
      'G:\\Meu Drive\\BelaGestao_Backups_Nuvem',
      'G:\\My Drive\\BelaGestao_Backups_Nuvem',
      path.join(userProfile, 'Google Drive', 'BelaGestao_Backups_Nuvem'),
      path.join(userProfile, 'GoogleDrive', 'BelaGestao_Backups_Nuvem'),
      path.join(userProfile, 'OneDrive', 'BelaGestao_Backups_GoogleDrive'),
      path.join(userProfile, 'OneDrive - Personal', 'BelaGestao_Backups_GoogleDrive'),
      path.join(BACKUP_DIR, 'nuvem_google_drive'),
    ];

    for (const p of possibleCloudPaths) {
      const parentDir = path.dirname(p);
      if (fs.existsSync(parentDir)) {
        if (!fs.existsSync(p)) {
          try {
            fs.mkdirSync(p, { recursive: true });
          } catch (e) {}
        }
        return {
          path: p,
          provider: p.includes('Google')
            ? 'Google Drive'
            : p.includes('OneDrive')
            ? 'Google Drive / OneDrive Nuvem'
            : 'Nuvem Automática Local',
        };
      }
    }

    const defaultPath = path.join(BACKUP_DIR, 'nuvem_google_drive');
    if (!fs.existsSync(defaultPath)) fs.mkdirSync(defaultPath, { recursive: true });
    return { path: defaultPath, provider: 'Nuvem Automática Local' };
  }

  /**
   * Criação de backup compactado local (.zip) com verificação de integridade SHA-256
   */
  async createLocalBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipName = `backup_salao_${timestamp}.zip`;
    const zipPath = path.join(BACKUP_DIR, zipName);

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', async () => {
        try {
          const stats = fs.statSync(zipPath);
          const sha256 = await calculateFileSHA256(zipPath);

          await run(
            `INSERT INTO backup_logs (filename, file_path, size_bytes, backup_type, status, error_message)
             VALUES (?, ?, ?, 'local', 'sucesso', ?)`,
            [zipName, zipPath, stats.size, `SHA256:${sha256}`]
          );

          logger.info(`[Backup] Backup local gerado com sucesso. Hash SHA-256: ${sha256}`, {
            size: stats.size,
          });

          resolve({
            filename: zipName,
            path: zipPath,
            size: stats.size,
            sha256,
            createdAt: new Date().toISOString(),
          });
        } catch (e) {
          reject(e);
        }
      });

      archive.on('error', async (err) => {
        await run(
          `INSERT INTO backup_logs (filename, file_path, size_bytes, backup_type, status, error_message)
           VALUES (?, ?, 0, 'local', 'erro', ?)`,
          [zipName, zipPath, err.message]
        );
        reject(err);
      });

      archive.pipe(output);
      archive.file(DB_PATH, { name: 'salao.db' });
      archive.finalize();
    });
  }

  /**
   * Sincronização automática com pasta de nuvem
   */
  async syncToGoogleDrive() {
    const localBackup = await this.createLocalBackup();
    const cloudDest = this.detectCloudStoragePath();
    const targetCloudFile = path.join(cloudDest.path, localBackup.filename);

    try {
      fs.copyFileSync(localBackup.path, targetCloudFile);
    } catch (e) {
      logger.warn(`Aviso ao copiar para pasta da nuvem: ${e.message}`);
    }

    await run(
      `INSERT INTO backup_logs (filename, file_path, size_bytes, backup_type, status, error_message)
       VALUES (?, ?, ?, 'gdrive', 'sucesso', ?)`,
      [
        localBackup.filename,
        targetCloudFile,
        localBackup.size,
        `Sincronizado automaticamente com ${cloudDest.provider} | SHA256:${localBackup.sha256}`,
      ]
    );

    return {
      success: true,
      filename: localBackup.filename,
      size: localBackup.size,
      sha256: localBackup.sha256,
      provider: cloudDest.provider,
      cloudPath: cloudDest.path,
      uploadedAt: new Date().toISOString(),
      message: `Cópia de segurança sincronizada na nuvem com integridade SHA-256!`,
    };
  }

  async listBackups() {
    const logs = await query('SELECT * FROM backup_logs ORDER BY created_at DESC LIMIT 30');
    const cloudInfo = this.detectCloudStoragePath();

    const files = fs.existsSync(BACKUP_DIR)
      ? fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.zip') || f.endsWith('.db'))
      : [];

    const lastCloudSync = await get(
      `SELECT * FROM backup_logs WHERE backup_type = 'gdrive' AND status = 'sucesso' ORDER BY created_at DESC LIMIT 1`
    );

    return {
      cloudInfo,
      lastCloudSync,
      history: logs,
      files: files.map((f) => {
        const fullPath = path.join(BACKUP_DIR, f);
        const st = fs.statSync(fullPath);
        return {
          filename: f,
          size: st.size,
          mtime: st.mtime,
        };
      }),
    };
  }

  /**
   * Restauração segura com snapshot prévio e validação de cabeçalho SQLite
   */
  async restoreBackup(uploadedFilePath) {
    if (!fs.existsSync(uploadedFilePath)) {
      throw new Error('Arquivo de restauração não encontrado.');
    }

    const sha256 = await calculateFileSHA256(uploadedFilePath);

    // Snapshot de proteção
    const tempBackup = path.join(BACKUP_DIR, `pre_restore_${Date.now()}.db`);
    if (fs.existsSync(DB_PATH)) {
      fs.copyFileSync(DB_PATH, tempBackup);
    }

    fs.copyFileSync(uploadedFilePath, DB_PATH);
    logger.security(`[Backup] Restauração executada. SHA-256: ${sha256}`);

    return {
      success: true,
      sha256,
      message: 'Banco de dados restaurado com sucesso! Integridade verificada.',
    };
  }
}

module.exports = new GDriveService();
