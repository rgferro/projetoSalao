const express = require('express');
const router = express.Router();
const { query, get, run } = require('../database/db');

// Listar todos os profissionais
router.get('/', async (req, res) => {
  try {
    const professionals = await query(`
      SELECT p.*,
        (SELECT COUNT(*) FROM appointment_items ai WHERE ai.professional_id = p.id AND ai.status = 'concluido') as total_services_completed
      FROM professionals p
      ORDER BY p.name ASC
    `);

    // Parse JSON fields
    const parsed = professionals.map(p => ({
      ...p,
      specialties: p.specialties ? JSON.parse(p.specialties) : [],
      work_schedule: p.work_schedule ? JSON.parse(p.work_schedule) : {}
    }));

    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Detalhe de um profissional + comissões personalizadas
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const prof = await get('SELECT * FROM professionals WHERE id = ?', [id]);
    if (!prof) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    const customCommissions = await query(
      `SELECT pc.*, s.name as service_name, s.category as service_category, s.price as service_price
       FROM professional_commissions pc
       JOIN services s ON pc.service_id = s.id
       WHERE pc.professional_id = ?`,
      [id]
    );

    res.json({
      ...prof,
      specialties: prof.specialties ? JSON.parse(prof.specialties) : [],
      work_schedule: prof.work_schedule ? JSON.parse(prof.work_schedule) : {},
      custom_commissions: customCommissions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar profissional
router.post('/', async (req, res) => {
  try {
    const { name, nickname, phone, email, color_hex, specialties, default_commission_type, default_commission_value, work_schedule, custom_commissions } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome do profissional é obrigatório.' });
    }

    const result = await run(
      `INSERT INTO professionals (name, nickname, phone, email, color_hex, specialties, default_commission_type, default_commission_value, work_schedule)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        nickname || name.split(' ')[0],
        phone || null,
        email || null,
        color_hex || '#6366f1',
        JSON.stringify(specialties || []),
        default_commission_type || 'percentage',
        default_commission_value ?? 50.0,
        JSON.stringify(work_schedule || {})
      ]
    );

    const profId = result.lastID;

    // Salvar comissões customizadas
    if (Array.isArray(custom_commissions)) {
      for (const cc of custom_commissions) {
        if (cc.service_id) {
          await run(
            `INSERT INTO professional_commissions (professional_id, service_id, commission_type, commission_value)
             VALUES (?, ?, ?, ?)`,
            [profId, cc.service_id, cc.commission_type || 'percentage', cc.commission_value]
          );
        }
      }
    }

    res.status(201).json({ id: profId, message: 'Profissional cadastrado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar profissional
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, nickname, phone, email, color_hex, specialties, default_commission_type, default_commission_value, work_schedule, active, custom_commissions } = req.body;

    await run(
      `UPDATE professionals 
       SET name = ?, nickname = ?, phone = ?, email = ?, color_hex = ?, 
           specialties = ?, default_commission_type = ?, default_commission_value = ?, 
           work_schedule = ?, active = COALESCE(?, active)
       WHERE id = ?`,
      [
        name,
        nickname,
        phone,
        email,
        color_hex,
        JSON.stringify(specialties || []),
        default_commission_type,
        default_commission_value,
        JSON.stringify(work_schedule || {}),
        active,
        id
      ]
    );

    // Atualizar comissões customizadas
    if (Array.isArray(custom_commissions)) {
      await run('DELETE FROM professional_commissions WHERE professional_id = ?', [id]);
      for (const cc of custom_commissions) {
        if (cc.service_id) {
          await run(
            `INSERT INTO professional_commissions (professional_id, service_id, commission_type, commission_value)
             VALUES (?, ?, ?, ?)`,
            [id, cc.service_id, cc.commission_type || 'percentage', cc.commission_value]
          );
        }
      }
    }

    res.json({ message: 'Profissional atualizado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Excluir profissional
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM professionals WHERE id = ?', [id]);
    res.json({ message: 'Profissional removido com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
