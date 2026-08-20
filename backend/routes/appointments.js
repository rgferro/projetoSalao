const express = require('express');
const router = express.Router();
const { query, get, run, transaction } = require('../database/db');
const whatsappService = require('../services/whatsappService');
const logger = require('../services/logger');
const { requireAuth } = require('../middleware/authMiddleware');

// Cada agenda pertence exclusivamente ao tenant ativo na sessão autenticada.
router.use(requireAuth);

// Listar agendamentos com filtros (por data, por intervalo, por profissional, por status) isolado por Tenant
router.get('/', async (req, res) => {
  try {
    const { date, startDate, endDate, professional_id, status } = req.query;
    const tenantId = req.tenantId;

    let sql = `
      SELECT a.*, c.name as client_name, c.phone as client_phone, c.email as client_email
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      WHERE a.tenant_id = ?
    `;
    const params = [tenantId];

    if (date) {
      sql += ' AND a.date = ?';
      params.push(date);
    } else if (startDate && endDate) {
      sql += ' AND a.date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY a.date ASC, a.created_at ASC';
    const appointments = await query(sql, params);

    // Para cada agendamento, carregar os itens (multisserviços)
    const result = [];
    for (const app of appointments) {
      let itemSql = `
        SELECT ai.*, 
          s.name as service_name, s.category as service_category, s.duration_min as service_duration,
          p.name as prof_name, p.nickname as prof_nickname, p.color_hex as prof_color
        FROM appointment_items ai
        JOIN services s ON ai.service_id = s.id
        JOIN professionals p ON ai.professional_id = p.id
        WHERE ai.appointment_id = ? AND ai.tenant_id = ?
      `;
      const itemParams = [app.id, tenantId];

      if (professional_id) {
        itemSql += ' AND ai.professional_id = ?';
        itemParams.push(professional_id);
      }

      const items = await query(itemSql, itemParams);
      if (!professional_id || items.length > 0) {
        result.push({
          ...app,
          items,
        });
      }
    }

    res.json(result);
  } catch (error) {
    logger.error('Erro ao buscar agendamentos:', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Verificar conflitos de horário para um profissional
router.post('/check-conflict', async (req, res) => {
  try {
    const { professional_id, date, start_time, end_time, exclude_appointment_id } = req.body;
    const tenantId = req.tenantId;

    if (!professional_id || !date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Dados incompletos para verificação de conflito.' });
    }

    // 1. Checar agendamentos existentes
    let appSql = `
      SELECT ai.*, a.id as appointment_id, a.status as appointment_status, c.name as client_name
      FROM appointment_items ai
      JOIN appointments a ON ai.appointment_id = a.id
      JOIN clients c ON a.client_id = c.id
      WHERE ai.professional_id = ? 
        AND a.date = ? 
        AND a.tenant_id = ?
        AND a.status NOT IN ('cancelado', 'no_show')
        AND NOT (ai.end_time <= ? OR ai.start_time >= ?)
    `;
    const appParams = [professional_id, date, tenantId, start_time, end_time];

    if (exclude_appointment_id) {
      appSql += ' AND a.id != ?';
      appParams.push(exclude_appointment_id);
    }

    const appConflicts = await query(appSql, appParams);

    // 2. Checar bloqueios de horário
    const blockSql = `
      SELECT * FROM time_blocks
      WHERE (professional_id = ? OR professional_id IS NULL)
        AND date = ?
        AND tenant_id = ?
        AND NOT (end_time <= ? OR start_time >= ?)
    `;
    const blockConflicts = await query(blockSql, [professional_id, date, tenantId, start_time, end_time]);

    const hasConflict = appConflicts.length > 0 || blockConflicts.length > 0;

    res.json({
      hasConflict,
      appConflicts,
      blockConflicts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar novo agendamento com Transação Atômica ACID
router.post('/', async (req, res) => {
  try {
    const { client_id, date, notes, items, sendWhatsappReminder = true } = req.body;
    const tenantId = req.tenantId;

    if (!client_id || !date || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cliente, Data e pelo menos 1 serviço são obrigatórios.' });
    }

    // Verificar limite mensal de agendamentos no Plano Solo (Degustação/Autônoma)
    const tenant = await get(`SELECT plan FROM tenants WHERE id = ?`, [tenantId]);
    if (tenant && tenant.plan === 'SOLO') {
      const monthPrefix = date.substring(0, 7); // YYYY-MM
      const monthlyCount = await get(
        `SELECT COUNT(*) as count FROM appointments WHERE tenant_id = ? AND strftime('%Y-%m', date) = ?`,
        [tenantId, monthPrefix]
      );
      if (monthlyCount && monthlyCount.count >= 40) {
        return res.status(403).json({
          error: 'Você atingiu o limite de 40 agendamentos deste mês no Plano Solo gratuito. Faça o upgrade para o Plano Starter ou Studio Pro para agendamentos ilimitados!'
        });
      }
    }

    // Executa em transação atômica única com rollback garantido em caso de erro
    const creationResult = await transaction(async ({ get: tGet, run: tRun }) => {
      const client = await tGet(
        'SELECT id FROM clients WHERE id = ? AND tenant_id = ?',
        [client_id, tenantId]
      );
      if (!client) {
        throw new Error('A cliente selecionada não pertence ao salão ativo.');
      }

      let totalPrice = 0;
      let totalDuration = 0;
      const processedItems = [];

      for (const item of items) {
        const service = await tGet('SELECT * FROM services WHERE id = ? AND tenant_id = ?', [item.service_id, tenantId]);
        const prof = await tGet('SELECT * FROM professionals WHERE id = ? AND tenant_id = ?', [item.professional_id, tenantId]);

        if (!service || !prof) {
          throw new Error('Serviço ou profissional não pertence ao salão ativo.');
        }

        const price = item.price !== undefined ? parseFloat(item.price) : service.price;
        totalPrice += price;
        totalDuration += item.duration_min || service.duration_min;

        const customComm = await tGet(
          'SELECT * FROM professional_commissions WHERE professional_id = ? AND service_id = ? AND tenant_id = ?',
          [prof.id, service.id, tenantId]
        );

        let commType = customComm ? customComm.commission_type : prof.default_commission_type;
        let commVal = customComm ? customComm.commission_value : prof.default_commission_value;
        let commAmount = commType === 'percentage' ? (price * commVal) / 100.0 : commVal;

        processedItems.push({
          service_id: service.id,
          professional_id: prof.id,
          start_time: item.start_time,
          end_time: item.end_time,
          price,
          commission_type: commType,
          commission_value: commVal,
          commission_amount: commAmount,
        });
      }

      if (processedItems.length === 0) {
        throw new Error('Inclua ao menos um serviço válido para o salão ativo.');
      }

      // Criar cabeçalho do agendamento
      const appResult = await tRun(
        `INSERT INTO appointments (client_id, date, status, total_price, total_duration_min, notes, tenant_id)
         VALUES (?, ?, 'agendado', ?, ?, ?, ?)`,
        [client_id, date, totalPrice, totalDuration, notes || null, tenantId]
      );
      const appointmentId = appResult.lastID;

      // Inserir itens atomicamente
      for (const pi of processedItems) {
        await tRun(
          `INSERT INTO appointment_items (appointment_id, service_id, professional_id, start_time, end_time, price, commission_type, commission_value, commission_amount, status, tenant_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'agendado', ?)`,
          [
            appointmentId,
            pi.service_id,
            pi.professional_id,
            pi.start_time,
            pi.end_time,
            pi.price,
            pi.commission_type,
            pi.commission_value,
            pi.commission_amount,
            tenantId
          ]
        );
      }

      return { appointmentId, totalPrice, totalDuration };
    });

    // Notificação assíncrona pós-commit (sem afetar a transação principal)
    let waResult = null;
    if (sendWhatsappReminder) {
      try {
        waResult = await whatsappService.sendAppointmentReminder(creationResult.appointmentId, 'reminder_24h');
      } catch (waErr) {
        logger.warn(`Erro ao disparar lembrete WhatsApp: ${waErr.message}`);
      }
    }

    res.status(201).json({
      id: creationResult.appointmentId,
      message: 'Agendamento realizado com sucesso!',
      totalPrice: creationResult.totalPrice,
      totalDuration: creationResult.totalDuration,
      waResult,
    });
  } catch (error) {
    logger.error('Erro na criação do agendamento:', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Atualizar status do agendamento com Transação Atômica
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const tenantId = req.tenantId;

    const validStatuses = ['agendado', 'confirmado', 'em_atendimento', 'concluido', 'cancelado', 'no_show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido.' });
    }

    await transaction(async ({ get: tGet, run: tRun }) => {
      await tRun('UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?', [status, id, tenantId]);
      await tRun('UPDATE appointment_items SET status = ? WHERE appointment_id = ? AND tenant_id = ?', [status, id, tenantId]);

      // Se marcado como concluído, computar pontos de fidelidade
      if (status === 'concluido') {
        const app = await tGet('SELECT client_id, total_price FROM appointments WHERE id = ? AND tenant_id = ?', [id, tenantId]);
        if (app) {
          const pointsEarned = Math.floor(app.total_price / 10);
          if (pointsEarned > 0) {
            await tRun('UPDATE clients SET loyalty_points = loyalty_points + ? WHERE id = ? AND tenant_id = ?', [
              pointsEarned,
              app.client_id,
              tenantId
            ]);
          }
        }
      }
    });

    res.json({ message: `Status alterado para "${status}" com sucesso!` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Excluir agendamento
router.delete('/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    await transaction(async ({ run: tRun }) => {
      await tRun('DELETE FROM appointment_items WHERE appointment_id = ? AND tenant_id = ?', [req.params.id, tenantId]);
      await tRun('DELETE FROM appointments WHERE id = ? AND tenant_id = ?', [req.params.id, tenantId]);
    });
    res.json({ message: 'Agendamento cancelado e removido com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bloqueios de Horários
router.get('/blocks/all', async (req, res) => {
  try {
    const { date } = req.query;
    const tenantId = req.tenantId;
    let sql = `
      SELECT tb.*, p.name as prof_name, p.nickname as prof_nickname, p.color_hex as prof_color
      FROM time_blocks tb
      LEFT JOIN professionals p ON tb.professional_id = p.id
      WHERE tb.tenant_id = ?
    `;
    const params = [tenantId];
    if (date) {
      sql += ' AND tb.date = ?';
      params.push(date);
    }
    sql += ' ORDER BY tb.start_time ASC';
    const blocks = await query(sql, params);
    res.json(blocks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/blocks', async (req, res) => {
  try {
    const { professional_id, date, start_time, end_time, reason } = req.body;
    const tenantId = req.tenantId;
    if (!date || !start_time || !end_time || !reason) {
      return res.status(400).json({ error: 'Data, Horários e Motivo do bloqueio são obrigatórios.' });
    }

    const result = await run(
      `INSERT INTO time_blocks (professional_id, date, start_time, end_time, reason, tenant_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [professional_id || null, date, start_time, end_time, reason, tenantId]
    );

    res.status(201).json({ id: result.lastID, message: 'Bloqueio de horário registrado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/blocks/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    await run('DELETE FROM time_blocks WHERE id = ? AND tenant_id = ?', [req.params.id, tenantId]);
    res.json({ message: 'Bloqueio de horário removido.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
