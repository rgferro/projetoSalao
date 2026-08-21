const express = require('express');
const router = express.Router();
const { query, get, run } = require('../database/db');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// Todas as rotas de comissão exigem autenticação válida
router.use(requireAuth);

// Relatório de Repasse de Comissões por Profissional e Período isolado por Tenant
router.get('/report', async (req, res) => {
  try {
    let { professional_id, startDate, endDate } = req.query;
    const tenantId = req.tenantId;
    const userRole = (req.user?.accessLevel || 'PROFISSIONAL').toUpperCase();
    const isMaster = Boolean(req.user?.isMaster);
    const isAdminOrGerente = isMaster || ['ADMIN', 'GERENTE'].includes(userRole);

    // Prevenção de IDOR: Se não for ADMIN/GERENTE, força o filtro para o ID do próprio profissional autenticado
    if (!isAdminOrGerente) {
      professional_id = req.user?.userId || req.user?.id;
    }

    const sDate = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const eDate = endDate || new Date().toISOString().split('T')[0];

    let profFilter = '';
    const params = [tenantId, sDate, eDate];

    if (professional_id) {
      profFilter = ' AND ai.professional_id = ?';
      params.push(professional_id);
    }

    const items = await query(
      `SELECT ai.*, 
              a.date as appointment_date, a.id as appointment_id,
              c.name as client_name,
              s.name as service_name, s.category as service_category,
              p.name as prof_name, p.nickname as prof_nickname, p.color_hex as prof_color
       FROM appointment_items ai
       JOIN appointments a ON ai.appointment_id = a.id
       JOIN clients c ON a.client_id = c.id
       JOIN services s ON ai.service_id = s.id
       JOIN professionals p ON ai.professional_id = p.id
       WHERE a.tenant_id = ? AND a.status = 'concluido' AND a.date BETWEEN ? AND ? ${profFilter}
       ORDER BY a.date DESC, ai.start_time DESC`,
      params
    );

    // Agrupar por profissional
    const profsMap = {};
    for (const item of items) {
      const pid = item.professional_id;
      if (!profsMap[pid]) {
        profsMap[pid] = {
          professional_id: pid,
          name: item.prof_name,
          nickname: item.prof_nickname,
          color_hex: item.prof_color,
          total_services: 0,
          total_revenue: 0,
          total_commission: 0,
          items: []
        };
      }

      profsMap[pid].total_services += 1;
      profsMap[pid].total_revenue += item.price;
      profsMap[pid].total_commission += item.commission_amount;
      profsMap[pid].items.push(item);
    }

    const summary = Object.values(profsMap);

    res.json({
      period: { startDate: sDate, endDate: eDate },
      summary,
      totalCommissionAll: summary.reduce((acc, p) => acc + p.total_commission, 0),
      totalRevenueAll: summary.reduce((acc, p) => acc + p.total_revenue, 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Registrar Quitação / Pagamento de Repasse de Comissão com Tenant (Exclusivo ADMIN/GERENTE)
router.post('/settle', requireRole(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { professional_id, period_start, period_end, total_services_amount, total_commission, deduction_amount = 0, payment_method = 'pix', notes } = req.body;
    const tenantId = req.tenantId;

    if (!professional_id || !period_start || !period_end || total_commission === undefined) {
      return res.status(400).json({ error: 'Profissional, período e total de comissão são obrigatórios.' });
    }

    const prof = await get('SELECT name, nickname FROM professionals WHERE id = ? AND tenant_id = ?', [professional_id, tenantId]);
    if (!prof) return res.status(404).json({ error: 'Profissional não encontrado' });

    const netPayout = parseFloat(total_commission) - (parseFloat(deduction_amount) || 0);
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Criar transação financeira de despesa
    const finRes = await run(
      `INSERT INTO financial_transactions (type, category, description, amount, payment_method, due_date, payment_date, status, professional_id, tenant_id)
       VALUES ('despesa', 'Comissões', ?, ?, ?, ?, ?, 'pago', ?, ?)`,
      [
        `Repasse de Comissão - ${prof.nickname || prof.name} (${period_start} a ${period_end})`,
        netPayout,
        payment_method,
        todayStr,
        todayStr,
        professional_id,
        tenantId
      ]
    );

    const finId = finRes.lastID;

    // 2. Registrar histórico do acerto de comissão
    const result = await run(
      `INSERT INTO commission_settlements (professional_id, period_start, period_end, total_services_amount, total_commission, deduction_amount, net_payout, payment_date, payment_method, notes, financial_transaction_id, tenant_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        professional_id,
        period_start,
        period_end,
        total_services_amount,
        total_commission,
        deduction_amount,
        netPayout,
        todayStr,
        payment_method,
        notes || null,
        finId,
        tenantId
      ]
    );

    res.status(201).json({
      id: result.lastID,
      message: `Repasse de R$ ${netPayout.toFixed(2)} registrado e lançado no financeiro com sucesso!`,
      net_payout: netPayout
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Histórico de Quitações
router.get('/settlements', async (req, res) => {
  try {
    let { professional_id } = req.query;
    const tenantId = req.tenantId;
    const userRole = (req.user?.accessLevel || 'PROFISSIONAL').toUpperCase();
    const isMaster = Boolean(req.user?.isMaster);
    const isAdminOrGerente = isMaster || ['ADMIN', 'GERENTE'].includes(userRole);

    // Prevenção de IDOR: Se não for ADMIN/GERENTE, visualiza apenas o próprio histórico
    if (!isAdminOrGerente) {
      professional_id = req.user?.userId || req.user?.id;
    }

    let sql = `
      SELECT cs.*, p.name as prof_name, p.nickname as prof_nickname
      FROM commission_settlements cs
      JOIN professionals p ON cs.professional_id = p.id
      WHERE cs.tenant_id = ?
    `;
    const params = [tenantId];
    if (professional_id) {
      sql += ' AND cs.professional_id = ?';
      params.push(professional_id);
    }
    sql += ' ORDER BY cs.payment_date DESC, cs.created_at DESC';
    const settlements = await query(sql, params);
    res.json(settlements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
