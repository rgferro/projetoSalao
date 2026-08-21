const express = require('express');
const router = express.Router();
const { query, get, run } = require('../database/db');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// Leitura exige autenticação; alteração exige ADMIN / GERENTE
router.use(requireAuth);

// Obter todas as configurações por Tenant
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant_default_salao';
    const rows = await query('SELECT key, value FROM settings WHERE tenant_id = ?', [tenantId]);
    const settings = {};
    rows.forEach(r => {
      settings[r.key] = r.value;
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar configurações em lote por Tenant (Exclusivo ADMIN/GERENTE)
router.post('/', requireRole(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant_default_salao';
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      await run(`
        INSERT INTO settings (key, value, tenant_id) VALUES (?, ?, ?)
        ON CONFLICT(key, tenant_id) DO UPDATE SET value = excluded.value
      `, [key, String(value), tenantId]);
    }
    res.json({ message: 'Configurações atualizadas com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
