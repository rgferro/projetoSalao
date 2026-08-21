const express = require('express');
const router = express.Router();
const { query, get } = require('../database/db');
const { requireAuth } = require('../middleware/authMiddleware');

// Todas as métricas do dashboard exigem autenticação válida
router.use(requireAuth);

// Dashboard com métricas consolidadas em tempo real por Tenant
router.get('/metrics', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentMonthPrefix = today.substring(0, 7); // YYYY-MM
    const currentDayMonth = today.substring(5); // MM-DD
    const tenantId = req.tenantId || 'tenant_default_salao';

    // 1. Agendamentos de Hoje
    const todayAppsCount = await get(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'concluido' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'em_atendimento' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status IN ('agendado', 'confirmado') THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END) as canceled
       FROM appointments WHERE date = ? AND tenant_id = ?`,
      [today, tenantId]
    );

    // 2. Faturamento de Hoje
    const todayRevenue = await get(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM financial_transactions
       WHERE type = 'receita' AND status = 'pago' AND payment_date = ? AND tenant_id = ?`,
      [today, tenantId]
    );

    // 3. Faturamento do Mês
    const monthRevenue = await get(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM financial_transactions
       WHERE type = 'receita' AND status = 'pago' AND payment_date LIKE ? AND tenant_id = ?`,
      [`${currentMonthPrefix}%`, tenantId]
    );

    // 4. Status do Caixa Diário Atual
    const currentCash = await get(
      `SELECT * FROM cash_registers WHERE status = 'aberto' AND tenant_id = ? ORDER BY id DESC LIMIT 1`,
      [tenantId]
    );

    // 5. Aniversariantes do Dia
    const birthdaysToday = await query(
      `SELECT id, name, phone, birthdate, loyalty_points
       FROM clients
       WHERE birthdate LIKE ? AND tenant_id = ?
       ORDER BY name ASC`,
      [`%-${currentDayMonth}`, tenantId]
    );

    // 6. Próximos Atendimentos de Hoje
    const upcomingToday = await query(
      `SELECT a.*, c.name as client_name, c.phone as client_phone,
        GROUP_CONCAT(s.name, ', ') as services_list,
        GROUP_CONCAT(p.nickname, ', ') as profs_list,
        MIN(ai.start_time) as first_time
       FROM appointments a
       JOIN clients c ON a.client_id = c.id
       JOIN appointment_items ai ON a.id = ai.appointment_id
       JOIN services s ON ai.service_id = s.id
       JOIN professionals p ON ai.professional_id = p.id
       WHERE a.date = ? AND a.tenant_id = ? AND a.status IN ('agendado', 'confirmado', 'em_atendimento')
       GROUP BY a.id
       ORDER BY first_time ASC
       LIMIT 8`,
      [today, tenantId]
    );

    // 7. Contas a Vencer Hoje ou Vencidas
    const pendingPayables = await query(
      `SELECT * FROM financial_transactions 
       WHERE type = 'despesa' AND status = 'pendente' AND due_date <= ? AND tenant_id = ?
       ORDER BY due_date ASC
       LIMIT 5`,
      [today, tenantId]
    );

    // 8. Total de Clientes Cadastrados
    const totalClientsCount = (await get('SELECT COUNT(*) as count FROM clients WHERE tenant_id = ?', [tenantId]))?.count || 0;

    const userRole = (req.user?.accessLevel || 'PROFISSIONAL').toUpperCase();
    const isMaster = Boolean(req.user?.isMaster);
    const canViewFullFinancials = isMaster || ['ADMIN', 'GERENTE'].includes(userRole);

    // Se for Profissional autônomo, busca apenas a comissão pessoal
    let myCommissionsToday = 0;
    let myCommissionsMonth = 0;
    if (userRole === 'PROFISSIONAL' && req.user?.userId) {
      const commToday = await get(`
        SELECT COALESCE(SUM(ai.commission_amount), 0) as total
        FROM appointment_items ai
        JOIN appointments a ON ai.appointment_id = a.id
        WHERE ai.professional_id = ? AND a.date = ? AND a.status = 'concluido' AND a.tenant_id = ?
      `, [req.user.userId, today, tenantId]);
      myCommissionsToday = commToday?.total || 0;

      const commMonth = await get(`
        SELECT COALESCE(SUM(ai.commission_amount), 0) as total
        FROM appointment_items ai
        JOIN appointments a ON ai.appointment_id = a.id
        WHERE ai.professional_id = ? AND a.date LIKE ? AND a.status = 'concluido' AND a.tenant_id = ?
      `, [req.user.userId, `${currentMonthPrefix}%`, tenantId]);
      myCommissionsMonth = commMonth?.total || 0;
    }

    res.json({
      today,
      userRole,
      canViewFinancials: canViewFullFinancials,
      todayApps: todayAppsCount,
      todayRevenue: canViewFullFinancials ? todayRevenue.total : null,
      monthRevenue: canViewFullFinancials ? monthRevenue.total : null,
      myCommissionsToday: userRole === 'PROFISSIONAL' ? myCommissionsToday : null,
      myCommissionsMonth: userRole === 'PROFISSIONAL' ? myCommissionsMonth : null,
      cashRegister: {
        isOpen: !!currentCash,
        session: (canViewFullFinancials || userRole === 'RECEPCAO') ? currentCash : null
      },
      birthdaysToday,
      upcomingToday,
      pendingPayables: canViewFullFinancials ? pendingPayables : [],
      totalClients: totalClientsCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
