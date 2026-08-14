const express = require('express');
const router = express.Router();
const { query, get } = require('../database/db');

// Dashboard com métricas consolidadas em tempo real
router.get('/metrics', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentMonthPrefix = today.substring(0, 7); // YYYY-MM
    const currentDayMonth = today.substring(5); // MM-DD

    // 1. Agendamentos de Hoje
    const todayAppsCount = await get(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'concluido' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'em_atendimento' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status IN ('agendado', 'confirmado') THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END) as canceled
       FROM appointments WHERE date = ?`,
      [today]
    );

    // 2. Faturamento de Hoje
    const todayRevenue = await get(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM financial_transactions
       WHERE type = 'receita' AND status = 'pago' AND payment_date = ?`,
      [today]
    );

    // 3. Faturamento do Mês
    const monthRevenue = await get(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM financial_transactions
       WHERE type = 'receita' AND status = 'pago' AND payment_date LIKE ?`,
      [`${currentMonthPrefix}%`]
    );

    // 4. Status do Caixa Diário Atual
    const currentCash = await get(
      `SELECT * FROM cash_registers WHERE status = 'aberto' ORDER BY id DESC LIMIT 1`
    );

    // 5. Aniversariantes do Dia
    const birthdaysToday = await query(
      `SELECT id, name, phone, birthdate, loyalty_points
       FROM clients
       WHERE birthdate LIKE ?
       ORDER BY name ASC`,
      [`%-${currentDayMonth}`]
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
       WHERE a.date = ? AND a.status IN ('agendado', 'confirmado', 'em_atendimento')
       GROUP BY a.id
       ORDER BY first_time ASC
       LIMIT 8`,
      [today]
    );

    // 7. Contas a Vencer Hoje ou Vencidas
    const pendingPayables = await query(
      `SELECT * FROM financial_transactions 
       WHERE type = 'despesa' AND status = 'pendente' AND due_date <= ?
       ORDER BY due_date ASC
       LIMIT 5`,
      [today]
    );

    // 8. Total de Clientes Cadastrados
    const totalClientsCount = (await get('SELECT COUNT(*) as count FROM clients'))?.count || 0;

    res.json({
      today,
      todayApps: todayAppsCount,
      todayRevenue: todayRevenue.total,
      monthRevenue: monthRevenue.total,
      cashRegister: {
        isOpen: !!currentCash,
        session: currentCash
      },
      birthdaysToday,
      upcomingToday,
      pendingPayables,
      totalClients: totalClientsCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
