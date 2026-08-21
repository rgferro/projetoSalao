const express = require('express');
const router = express.Router();
const { query, get, run } = require('../database/db');
const whatsappService = require('../services/whatsappService');
const { requireAuth } = require('../middleware/authMiddleware');

// Todas as rotas de clientes exigem autenticação válida
router.use(requireAuth);

// Listar todos os clientes com resumo de pontos e último atendimento (Isolado por Tenant)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const tenantId = req.tenantId || 'tenant_default_salao';

    let sql = `
      SELECT c.*, 
        (SELECT MAX(date) FROM appointments WHERE client_id = c.id AND tenant_id = ?) as last_appointment_date,
        (SELECT COUNT(*) FROM appointments WHERE client_id = c.id AND status = 'concluido' AND tenant_id = ?) as total_completed_appointments
      FROM clients c
      WHERE c.tenant_id = ?
    `;
    const params = [tenantId, tenantId, tenantId];

    if (search) {
      sql += ` AND (c.name LIKE ? OR c.phone LIKE ? OR c.cpf LIKE ? OR c.email LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    sql += ` ORDER BY c.name ASC`;
    const clients = await query(sql, params);
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter detalhes de um cliente específico com Anamnese e Histórico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId || 'tenant_default_salao';

    const client = await get('SELECT * FROM clients WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const anamnesis = await get('SELECT * FROM anamnesis WHERE client_id = ? AND tenant_id = ?', [id, tenantId]);

    const appointments = await query(
      `SELECT a.*, 
        GROUP_CONCAT(s.name, ', ') as services_list,
        GROUP_CONCAT(p.nickname, ', ') as professionals_list
       FROM appointments a
       LEFT JOIN appointment_items ai ON a.id = ai.appointment_id
       LEFT JOIN services s ON ai.service_id = s.id
       LEFT JOIN professionals p ON ai.professional_id = p.id
       WHERE a.client_id = ? AND a.tenant_id = ?
       GROUP BY a.id
       ORDER BY a.date DESC, a.created_at DESC`,
      [id, tenantId]
    );

    res.json({
      ...client,
      anamnesis: anamnesis || {},
      history: appointments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cadastrar novo cliente (com disparo opcional de boas-vindas)
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, birthdate, cpf, address, notes, anamnesis, sendWelcome = true } = req.body;
    const tenantId = req.tenantId || 'tenant_default_salao';

    if (!name || !phone) {
      return res.status(400).json({ error: 'Nome e Telefone/WhatsApp são obrigatórios.' });
    }

    const result = await run(
      `INSERT INTO clients (name, phone, email, birthdate, cpf, address, notes, tenant_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, phone, email || null, birthdate || null, cpf || null, address || null, notes || null, tenantId]
    );

    const clientId = result.lastID;

    // Criar ou atualizar ficha de anamnese
    const a = anamnesis || {};
    await run(
      `INSERT INTO anamnesis (
        client_id, hair_type, hair_chemical_history, hair_color_formula, hair_sensitivities, hair_preferred_cut,
        waxing_skin_type, waxing_allergies, waxing_folliculitis_history, waxing_preferred_method, waxing_restrictions,
        nails_shape_preferences, nails_gel_allergy, makeup_skin_type, makeup_restrictions, general_observations, tenant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clientId,
        a.hair_type || null,
        a.hair_chemical_history || null,
        a.hair_color_formula || null,
        a.hair_sensitivities || null,
        a.hair_preferred_cut || null,
        a.waxing_skin_type || null,
        a.waxing_allergies || null,
        a.waxing_folliculitis_history || null,
        a.waxing_preferred_method || null,
        a.waxing_restrictions || null,
        a.nails_shape_preferences || null,
        a.nails_gel_allergy || null,
        a.makeup_skin_type || null,
        a.makeup_restrictions || null,
        a.general_observations || null,
        tenantId
      ]
    );

    let welcomeInfo = null;
    if (sendWelcome) {
      try {
        welcomeInfo = await whatsappService.sendWelcome(clientId);
      } catch (wErr) {
        console.warn('Aviso: Não foi possível disparar boas-vindas:', wErr.message);
      }
    }

    res.status(201).json({ id: clientId, message: 'Cliente cadastrado com sucesso!', welcomeInfo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar cliente e anamnese
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, birthdate, cpf, address, notes, loyalty_points, anamnesis } = req.body;
    const tenantId = req.tenantId || 'tenant_default_salao';

    await run(
      `UPDATE clients 
       SET name = ?, phone = ?, email = ?, birthdate = ?, cpf = ?, address = ?, notes = ?, 
           loyalty_points = COALESCE(?, loyalty_points), updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND tenant_id = ?`,
      [name, phone, email, birthdate, cpf, address, notes, loyalty_points, id, tenantId]
    );

    if (anamnesis) {
      const a = anamnesis;
      await run(
        `INSERT INTO anamnesis (
          client_id, hair_type, hair_chemical_history, hair_color_formula, hair_sensitivities, hair_preferred_cut,
          waxing_skin_type, waxing_allergies, waxing_folliculitis_history, waxing_preferred_method, waxing_restrictions,
          nails_shape_preferences, nails_gel_allergy, makeup_skin_type, makeup_restrictions, general_observations,
          tenant_id, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(client_id) DO UPDATE SET
          hair_type = excluded.hair_type,
          hair_chemical_history = excluded.hair_chemical_history,
          hair_color_formula = excluded.hair_color_formula,
          hair_sensitivities = excluded.hair_sensitivities,
          hair_preferred_cut = excluded.hair_preferred_cut,
          waxing_skin_type = excluded.waxing_skin_type,
          waxing_allergies = excluded.waxing_allergies,
          waxing_folliculitis_history = excluded.waxing_folliculitis_history,
          waxing_preferred_method = excluded.waxing_preferred_method,
          waxing_restrictions = excluded.waxing_restrictions,
          nails_shape_preferences = excluded.nails_shape_preferences,
          nails_gel_allergy = excluded.nails_gel_allergy,
          makeup_skin_type = excluded.makeup_skin_type,
          makeup_restrictions = excluded.makeup_restrictions,
          general_observations = excluded.general_observations,
          updated_at = CURRENT_TIMESTAMP`,
        [
          id,
          a.hair_type, a.hair_chemical_history, a.hair_color_formula, a.hair_sensitivities, a.hair_preferred_cut,
          a.waxing_skin_type, a.waxing_allergies, a.waxing_folliculitis_history, a.waxing_preferred_method, a.waxing_restrictions,
          a.nails_shape_preferences, a.nails_gel_allergy, a.makeup_skin_type, a.makeup_restrictions, a.general_observations,
          tenantId
        ]
      );
    }

    res.json({ message: 'Cliente e Ficha de Anamnese atualizados com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Excluir cliente
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId || 'tenant_default_salao';
    await run('DELETE FROM clients WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    res.json({ message: 'Cliente removido com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Adicionar / Resgatar pontos de fidelidade
router.post('/:id/loyalty', async (req, res) => {
  try {
    const { id } = req.params;
    const { points, operation } = req.body;
    const tenantId = req.tenantId || 'tenant_default_salao';
    const delta = operation === 'redeem' ? -Math.abs(points) : Math.abs(points);

    await run('UPDATE clients SET loyalty_points = MAX(0, loyalty_points + ?) WHERE id = ? AND tenant_id = ?', [delta, id, tenantId]);
    const updated = await get('SELECT loyalty_points FROM clients WHERE id = ? AND tenant_id = ?', [id, tenantId]);

    res.json({ loyalty_points: updated.loyalty_points, message: 'Pontos atualizados!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
