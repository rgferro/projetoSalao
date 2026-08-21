const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const gdriveService = require('../services/gdriveService');
const { DB_PATH } = require('../database/db');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const upload = multer({ dest: path.join(__dirname, '..', 'backups', 'temp') });

// Todas as rotas de backup exigem autenticação e perfil ADMIN / DONO
router.use(requireAuth, requireRole(['ADMIN', 'DONO']));

// Listar histórico de backups locais e status Google Drive
router.get('/', async (req, res) => {
  try {
    const data = await gdriveService.listBackups();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar Backup Local Imediato (.zip com banco SQLite)
router.post('/create-local', async (req, res) => {
  try {
    const backup = await gdriveService.createLocalBackup();
    res.status(201).json({
      message: 'Backup local gerado com sucesso!',
      backup
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download de um arquivo de backup
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

// Sincronizar Cópia de Segurança com Google Drive
router.post('/sync-gdrive', async (req, res) => {
  try {
    const result = await gdriveService.syncToGoogleDrive();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restaurar Banco de Dados via Upload de Arquivo (.db ou .zip)
router.post('/restore', upload.single('backupFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado para restauração.' });
    }

    const uploadedPath = req.file.path;
    const result = await gdriveService.restoreBackup(uploadedPath);

    // Limpar arquivo temporário
    try {
      if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);
    } catch (e) {}

    res.json({ message: 'Restauração realizada com sucesso! O sistema foi restaurado para o ponto do arquivo.', result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
