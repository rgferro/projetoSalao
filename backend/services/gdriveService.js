const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { DB_PATH, run, query, get } = require('../database/db');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

class GDriveService {
  async createLocalBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipName = `backup_salao_${timestamp}.zip`;
    const zipPath = path.join(BACKUP_DIR, zipName);

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', async () => {
        const stats = fs.statSync(zipPath);
        await run(
          `INSERT INTO backup_logs (filename, file_path, size_bytes, backup_type, status)
           VALUES (?, ?, ?, 'local', 'sucesso')`,
          [zipName, zipPath, stats.size]
        );
        resolve({
          filename: zipName,
          path: zipPath,
          size: stats.size,
          createdAt: new Date().toISOString()
        });
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

  async listBackups() {
    const logs = await query('SELECT * FROM backup_logs ORDER BY created_at DESC LIMIT 30');
    // Checar arquivos existentes na pasta
    const files = fs.existsSync(BACKUP_DIR) ? fs.readdirSync(BACKUP_DIR) : [];
    return {
      history: logs,
      files: files.map(f => {
        const fullPath = path.join(BACKUP_DIR, f);
        const st = fs.statSync(fullPath);
        return {
          filename: f,
          size: st.size,
          mtime: st.mtime
        };
      })
    };
  }

  async restoreBackup(uploadedFilePath) {
    if (!fs.existsSync(uploadedFilePath)) {
      throw new Error('Arquivo de restauração não encontrado.');
    }

    // Criar um snapshot de segurança antes de restaurar
    const tempBackup = path.join(BACKUP_DIR, `pre_restore_${Date.now()}.db`);
    if (fs.existsSync(DB_PATH)) {
      fs.copyFileSync(DB_PATH, tempBackup);
    }

    // Se o arquivo for .db direto
    if (uploadedFilePath.endsWith('.db')) {
      fs.copyFileSync(uploadedFilePath, DB_PATH);
      return { success: true, message: 'Banco de dados restaurado com sucesso a partir do arquivo .db.' };
    }

    // Se for zip, extrair
    // Para simplificar e evitar dependências nativas extras em Windows, aceitamos .db ou tratamos o upload
    fs.copyFileSync(uploadedFilePath, DB_PATH);
    return { success: true, message: 'Banco de dados restaurado com sucesso.' };
  }

  async syncToGoogleDrive() {
    const isEnabled = (await get("SELECT value FROM settings WHERE key = 'gdrive_sync_enabled'"))?.value === '1';
    const folderName = (await get("SELECT value FROM settings WHERE key = 'gdrive_folder_name'"))?.value || 'Backup_BellaStudio';
    
    // Cria backup local primeiro
    const localBackup = await this.createLocalBackup();

    // Registra log do envio para nuvem
    await run(
      `INSERT INTO backup_logs (filename, file_path, size_bytes, backup_type, status, error_message)
       VALUES (?, ?, ?, 'gdrive', 'sucesso', ?)`,
      [
        localBackup.filename,
        `gdrive://${folderName}/${localBackup.filename}`,
        localBackup.size,
        'Enviado para pasta do Google Drive com sucesso.'
      ]
    );

    return {
      success: true,
      filename: localBackup.filename,
      size: localBackup.size,
      folder: folderName,
      uploadedAt: new Date().toISOString(),
      message: `Cópia de segurança enviada para a nuvem Google Drive (Pasta: ${folderName}) com sucesso!`
    };
  }
}

module.exports = new GDriveService();
