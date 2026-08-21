const express = require('express');
const router = express.Router();
const { query, get, run } = require('../database/db');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// Todas as rotas de serviços exigem autenticação válida
router.use(requireAuth);

// Listar todos os serviços por Tenant
router.get('/', async (req, res) => {
  try {
    const { category, active } = req.query;
    const tenantId = req.tenantId || 'tenant_default_salao';
    let sql = 'SELECT * FROM services WHERE tenant_id = ?';
    const params = [tenantId];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (active !== undefined) {
      sql += ' AND active = ?';
      params.push(active === 'true' || active === '1' ? 1 : 0);
    }

    sql += ' ORDER BY category ASC, name ASC';
    const services = await query(sql, params);
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Detalhes de um serviço
router.get('/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant_default_salao';
    const service = await get('SELECT * FROM services WHERE id = ? AND tenant_id = ?', [req.params.id, tenantId]);
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar serviço (Exclusivo ADMIN/GERENTE)
router.post('/', requireRole(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { name, category, description, price, cost_price, duration_min, default_commission_type, default_commission_value } = req.body;
    const tenantId = req.tenantId || 'tenant_default_salao';

    if (!name || !category || price === undefined) {
      return res.status(400).json({ error: 'Nome, Categoria e Preço são obrigatórios.' });
    }

    const result = await run(
      `INSERT INTO services (name, category, description, price, cost_price, duration_min, default_commission_type, default_commission_value, tenant_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        category,
        description || null,
        price,
        cost_price || 0,
        duration_min || 60,
        default_commission_type || 'percentage',
        default_commission_value ?? 50.0,
        tenantId
      ]
    );

    res.status(201).json({ id: result.lastID, message: 'Serviço cadastrado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar serviço (Exclusivo ADMIN/GERENTE)
router.put('/:id', requireRole(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, description, price, cost_price, duration_min, default_commission_type, default_commission_value, active } = req.body;
    const tenantId = req.tenantId || 'tenant_default_salao';

    await run(
      `UPDATE services 
       SET name = ?, category = ?, description = ?, price = ?, cost_price = ?, 
           duration_min = ?, default_commission_type = ?, default_commission_value = ?, active = COALESCE(?, active)
       WHERE id = ? AND tenant_id = ?`,
      [name, category, description, price, cost_price, duration_min, default_commission_type, default_commission_value, active, id, tenantId]
    );

    res.json({ message: 'Serviço atualizado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Excluir serviço (Exclusivo ADMIN/GERENTE)
router.delete('/:id', requireRole(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant_default_salao';
    await run('DELETE FROM services WHERE id = ? AND tenant_id = ?', [req.params.id, tenantId]);
    res.json({ message: 'Serviço removido com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
