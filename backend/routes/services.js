const express = require('express');
const router = express.Router();
const { query, get, run } = require('../database/db');

// Listar todos os serviços
router.get('/', async (req, res) => {
  try {
    const { category, active } = req.query;
    let sql = 'SELECT * FROM services WHERE 1=1';
    const params = [];

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
    const service = await get('SELECT * FROM services WHERE id = ?', [req.params.id]);
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar serviço
router.post('/', async (req, res) => {
  try {
    const { name, category, description, price, cost_price, duration_min, default_commission_type, default_commission_value } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ error: 'Nome, Categoria e Preço são obrigatórios.' });
    }

    const result = await run(
      `INSERT INTO services (name, category, description, price, cost_price, duration_min, default_commission_type, default_commission_value)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        category,
        description || null,
        price,
        cost_price || 0,
        duration_min || 60,
        default_commission_type || 'percentage',
        default_commission_value ?? 50.0
      ]
    );

    res.status(201).json({ id: result.lastID, message: 'Serviço cadastrado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar serviço
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, description, price, cost_price, duration_min, default_commission_type, default_commission_value, active } = req.body;

    await run(
      `UPDATE services 
       SET name = ?, category = ?, description = ?, price = ?, cost_price = ?, 
           duration_min = ?, default_commission_type = ?, default_commission_value = ?, active = COALESCE(?, active)
       WHERE id = ?`,
      [name, category, description, price, cost_price, duration_min, default_commission_type, default_commission_value, active, id]
    );

    res.json({ message: 'Serviço atualizado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Excluir serviço
router.delete('/:id', async (req, res) => {
  try {
    await run('DELETE FROM services WHERE id = ?', [req.params.id]);
    res.json({ message: 'Serviço removido com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
