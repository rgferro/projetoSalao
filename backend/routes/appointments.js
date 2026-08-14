const express = require('express');
const router = express.Router();
const { query, get, run } = require('../database/db');
const whatsappService = require('../services/whatsappService');

// Listar agendamentos com filtros (por data, por intervalo, por profissional, por status)
router.get('/', async (req, res) => {
  try {
    const { date, startDate, endDate, professional_id, status } = req.query;
    let sql = `
      SELECT a.*, c.name as client_name, c.phone as client_phone, c.email as client_email
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      WHERE 1=1
    `;
    const params = [];

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
        WHERE ai.appointment_id = ?
      `;
      const itemParams = [app.id];

      if (professional_id) {
        itemSql += ' AND ai.professional_id = ?';
        itemParams.push(professional_id);
      }

      const items = await query(itemSql, itemParams);
      if (!professional_id || items.length > 0) {
        result.push({
          ...app,
          items
        });
      }
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verificar conflitos de horário para um profissional
router.post('/check-conflict', async (req, res) => {
  try {
    const { professional_id, date, start_time, end_time, exclude_appointment_id } = req.body;

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
        AND a.status NOT IN ('cancelado', 'no_show')
        AND NOT (ai.end_time <= ? OR ai.start_time >= ?)
    `;
    const appParams = [professional_id, date, start_time, end_time];

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
        AND NOT (end_time <= ? OR start_time >= ?)
    `;
    const blockConflicts = await query(blockSql, [professional_id, date, start_time, end_time]);

    const hasConflict = appConflicts.length > 0 || blockConflicts.length > 0;

    res.json({
      hasConflict,
      appConflicts,
      blockConflicts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar novo agendamento (suporta múltiplos serviços encadeados)
router.post('/', async (req, res) => {
  try {
    const { client_id, date, notes, items, sendWhatsappReminder = true } = req.body;

    if (!client_id || !date || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cliente, Data e pelo menos 1 serviço são obrigatórios.' });
    }

    let totalPrice = 0;
    let totalDuration = 0;

    // Calcular totais e comissões para cada item
    const processedItems = [];
    for (const item of items) {
      const service = await get('SELECT * FROM services WHERE id = ?', [item.service_id]);
      const prof = await get('SELECT * FROM professionals WHERE id = ?', [item.professional_id]);

      if (!service || !prof) continue;

      const price = item.price !== undefined ? parseFloat(item.price) : service.price;
      totalPrice += price;
      totalDuration += (item.duration_min || service.duration_min);

      // Checar comissão customizada
      const customComm = await get(
        'SELECT * FROM professional_commissions WHERE professional_id = ? AND service_id = ?',
        [prof.id, service.id]
      );

      let commType = customComm ? customComm.commission_type : prof.default_commission_type;
      let commVal = customComm ? customComm.commission_value : prof.default_commission_value;
      let commAmount = 0;

      if (commType === 'percentage') {
        commAmount = (price * commVal) / 100.0;
      } else {
        commAmount = commVal;
      }

      processedItems.push({
        service_id: service.id,
        professional_id: prof.id,
        start_time: item.start_time,
        end_time: item.end_time,
        price,
        commission_type: commType,
        commission_value: commVal,
        commission_amount: commAmount
      });
    }

    // Criar cabeçalho do agendamento
    const appResult = await run(
      `INSERT INTO appointments (client_id, date, status, total_price, total_duration_min, notes)
       VALUES (?, ?, 'agendado', ?, ?, ?)`,
      [client_id, date, totalPrice, totalDuration, notes || null]
    );
    const appointmentId = appResult.lastID;

    // Inserir itens
    for (const pi of processedItems) {
      await run(
        `INSERT INTO appointment_items (appointment_id, service_id, professional_id, start_time, end_time, price, commission_type, commission_value, commission_amount, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'agendado')`,
        [appointmentId, pi.service_id, pi.professional_id, pi.start_time, pi.end_time, pi.price, pi.commission_type, pi.commission_value, pi.commission_amount]
      );
    }

    // Preparar disparo de WhatsApp se solicitado
    let waResult = null;
    if (sendWhatsappReminder) {
      try {
        waResult = await whatsappService.sendAppointmentReminder(appointmentId, 'reminder_24h');
      } catch (waErr) {
        console.warn('Aviso: Erro ao disparar lembrete de WhatsApp:', waErr.message);
      }
    }

    res.status(201).json({
      id: appointmentId,
      message: 'Agendamento realizado com sucesso!',
      totalPrice,
      totalDuration,
      waResult
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar status do agendamento
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'agendado', 'confirmado', 'em_atendimento', 'concluido', 'cancelado', 'no_show'

    const validStatuses = ['agendado', 'confirmado', 'em_atendimento', 'concluido', 'cancelado', 'no_show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido.' });
    }

    await run('UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
    await run('UPDATE appointment_items SET status = ? WHERE appointment_id = ?', [status, id]);

    // Se marcado como concluído, somar pontos de fidelidade (1 ponto para cada R$ 10)
    if (status === 'concluido') {
      const app = await get('SELECT client_id, total_price FROM appointments WHERE id = ?', [id]);
      if (app) {
        const pointsEarned = Math.floor(app.total_price / 10);
        if (pointsEarned > 0) {
          await run('UPDATE clients SET loyalty_points = loyalty_points + ? WHERE id = ?', [pointsEarned, app.client_id]);
        }
      }
    }

    res.json({ message: `Status alterado para "${status}" com sucesso!` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Excluir agendamento
router.delete('/:id', async (req, res) => {
  try {
    await run('DELETE FROM appointments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Agendamento cancelado e removido com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bloqueios de Horários (Pausas, Almoço, Folgas)
router.get('/blocks/all', async (req, res) => {
  try {
    const { date } = req.query;
    let sql = `
      SELECT tb.*, p.name as prof_name, p.nickname as prof_nickname, p.color_hex as prof_color
      FROM time_blocks tb
      LEFT JOIN professionals p ON tb.professional_id = p.id
      WHERE 1=1
    `;
    const params = [];
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
    if (!date || !start_time || !end_time || !reason) {
      return res.status(400).json({ error: 'Data, Horários e Motivo do bloqueio são obrigatórios.' });
    }

    const result = await run(
      `INSERT INTO time_blocks (professional_id, date, start_time, end_time, reason)
       VALUES (?, ?, ?, ?, ?)`,
      [professional_id || null, date, start_time, end_time, reason]
    );

    res.status(201).json({ id: result.lastID, message: 'Bloqueio de horário registrado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/blocks/:id', async (req, res) => {
  try {
    await run('DELETE FROM time_blocks WHERE id = ?', [req.params.id]);
    res.json({ message: 'Bloqueio de horário removido.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
