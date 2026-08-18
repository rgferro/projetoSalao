const express = require('express');
const router = express.Router();
const { query, get, run } = require('../database/db');
const { requireMaster } = require('../middleware/authMiddleware');
const { createSessionToken } = require('../services/authService');

// Todas as rotas deste router exigem Super Admin Master
router.use(requireMaster);

// 1. Métricas Globais do SaaS (MRR, ARR, Tenants, Assinaturas)
router.get('/metrics', async (req, res) => {
  try {
    const totalTenants = await get(`SELECT COUNT(*) as count FROM tenants`);
    const activeTenants = await get(`SELECT COUNT(*) as count FROM tenants WHERE active = 1 AND subscription_status = 'active'`);
    const pastDueTenants = await get(`SELECT COUNT(*) as count FROM tenants WHERE subscription_status != 'active' OR active = 0`);

    const planStats = await query(`
      SELECT plan, COUNT(*) as count 
      FROM tenants 
      WHERE active = 1 AND is_exempt != 1
      GROUP BY plan
    `);

    let mrr = 0;
    planStats.forEach(p => {
      if (p.plan === 'STARTER') mrr += p.count * 69.90;
      else if (p.plan === 'STUDIO' || p.plan === 'PRO') mrr += p.count * 139.90;
      else if (p.plan === 'PREMIER' || p.plan === 'ELITE') mrr += p.count * 229.90;
    });
    const arr = mrr * 12;

    const exemptTenants = await get(`SELECT COUNT(*) as count FROM tenants WHERE is_exempt = 1`);
    const totalUsers = await get(`SELECT COUNT(*) as count FROM professionals`);
    const totalClients = await get(`SELECT COUNT(*) as count FROM clients`);
    const totalAppointments = await get(`SELECT COUNT(*) as count FROM appointments`);

    const recentPayments = await query(`
      SELECT sp.*, t.name as salon_name, t.owner_email 
      FROM subscription_payments sp
      LEFT JOIN tenants t ON sp.tenant_id = t.id
      ORDER BY sp.created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      metrics: {
        totalTenants: totalTenants.count || 0,
        activeTenants: activeTenants.count || 0,
        pastDueTenants: pastDueTenants.count || 0,
        exemptTenants: exemptTenants.count || 0,
        mrr: Number(mrr.toFixed(2)),
        arr: Number(arr.toFixed(2)),
        totalUsers: totalUsers.count || 0,
        totalClients: totalClients.count || 0,
        totalAppointments: totalAppointments.count || 0,
        planDistribution: planStats
      },
      recentPayments
    });
  } catch (error) {
    console.error('Erro ao buscar métricas master admin:', error);
    res.status(500).json({ error: 'Falha ao consolidar métricas do SaaS.' });
  }
});

// 2. Listagem Completa de Salões / Tenants com busca e filtros
router.get('/tenants', async (req, res) => {
  try {
    const { search, plan, status } = req.query;
    let sql = `
      SELECT t.*, 
        (SELECT COUNT(*) FROM professionals WHERE tenant_id = t.id) as current_users,
        (SELECT COUNT(*) FROM clients WHERE tenant_id = t.id) as total_clients,
        (SELECT COUNT(*) FROM appointments WHERE tenant_id = t.id) as total_appointments
      FROM tenants t
    `;
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push(`(t.name LIKE ? OR t.owner_email LIKE ? OR t.owner_name LIKE ? OR t.document LIKE ?)`);
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    if (plan && plan !== 'ALL') {
      conditions.push(`t.plan = ?`);
      params.push(plan);
    }

    if (status === 'active') {
      conditions.push(`t.active = 1 AND t.subscription_status = 'active'`);
    } else if (status === 'inactive') {
      conditions.push(`(t.active = 0 OR t.subscription_status != 'active')`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(' AND ');
    }

    sql += ` ORDER BY t.created_at DESC`;

    const tenants = await query(sql, params);
    res.json({ success: true, tenants });
  } catch (error) {
    console.error('Erro ao listar tenants:', error);
    res.status(500).json({ error: 'Falha ao listar salões cadastrados.' });
  }
});

// 3. Atualizar Plano e Limite de Usuários do Salão
router.post('/tenants/:id/plan', async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, maxUsers, subscriptionStatus, isExempt } = req.body;

    const tenant = await get(`SELECT id FROM tenants WHERE id = ?`, [id]);
    if (!tenant) return res.status(404).json({ error: 'Salão não encontrado.' });

    let finalMaxUsers = maxUsers;
    if (!finalMaxUsers) {
      if (plan === 'SOLO') finalMaxUsers = 1;
      else if (plan === 'STARTER') finalMaxUsers = 2;
      else if (plan === 'STUDIO' || plan === 'PRO') finalMaxUsers = 5;
      else if (plan === 'PREMIER' || plan === 'ELITE') finalMaxUsers = 15;
    }

    const exemptVal = isExempt !== undefined ? (isExempt ? 1 : 0) : undefined;

    await run(`
      UPDATE tenants 
      SET plan = COALESCE(?, plan),
          max_users = COALESCE(?, max_users),
          subscription_status = COALESCE(?, subscription_status),
          is_exempt = COALESCE(?, is_exempt),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [plan, finalMaxUsers, subscriptionStatus, exemptVal, id]);

    res.json({ success: true, message: 'Plano do salão atualizado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar plano do salão.' });
  }
});

// 3.1 Alternar Isenção de Pagamentos do Salão (Cortesia VIP / Isenção Master)
router.post('/tenants/:id/toggle-exempt', async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await get(`SELECT id, is_exempt, name FROM tenants WHERE id = ?`, [id]);
    if (!tenant) return res.status(404).json({ error: 'Salão não encontrado.' });

    const newExempt = tenant.is_exempt ? 0 : 1;
    const newStatus = newExempt ? 'exempt' : 'active';
    const expiresAt = newExempt ? '2099-12-31 23:59:59' : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await run(`
      UPDATE tenants 
      SET is_exempt = ?,
          subscription_status = ?,
          subscription_expires_at = ?,
          active = 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newExempt, newStatus, expiresAt, id]);

    res.json({
      success: true,
      isExempt: newExempt,
      message: newExempt 
        ? `Salão "${tenant.name}" isento de pagamentos com sucesso! (Cortesia Master)`
        : `Isenção de pagamentos desativada para o salão "${tenant.name}".`
    });
  } catch (error) {
    console.error('Erro ao alternar isenção do salão:', error);
    res.status(500).json({ error: 'Erro ao alternar isenção do salão.' });
  }
});

// 4. Estender Período de Assinatura (Dias Adicionais)
router.post('/tenants/:id/extend', async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.body;

    const tenant = await get(`SELECT id, subscription_expires_at FROM tenants WHERE id = ?`, [id]);
    if (!tenant) return res.status(404).json({ error: 'Salão não encontrado.' });

    const currentExpire = tenant.subscription_expires_at ? new Date(tenant.subscription_expires_at) : new Date();
    const baseDate = currentExpire > new Date() ? currentExpire : new Date();
    baseDate.setDate(baseDate.getDate() + Number(days));

    const newExpiresAt = baseDate.toISOString();

    await run(`
      UPDATE tenants 
      SET subscription_expires_at = ?,
          subscription_status = 'active',
          active = 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newExpiresAt, id]);

    res.json({
      success: true,
      message: `Assinatura estendida por +${days} dias com sucesso!`,
      newExpiresAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao estender validade.' });
  }
});

// 5. Alternar Bloqueio / Ativação do Salão
router.post('/tenants/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await get(`SELECT id, active FROM tenants WHERE id = ?`, [id]);
    if (!tenant) return res.status(404).json({ error: 'Salão não encontrado.' });

    const newStatus = tenant.active ? 0 : 1;
    await run(`UPDATE tenants SET active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [newStatus, id]);

    res.json({
      success: true,
      active: newStatus,
      message: newStatus ? 'Salão desbloqueado e ativo.' : 'Salão bloqueado com sucesso.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao alternar status do salão.' });
  }
});

// 6. Impersonar Salão (Suporte ao Cliente com Acesso Temporário)
router.post('/tenants/:id/impersonate', async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await get(`SELECT * FROM tenants WHERE id = ?`, [id]);
    if (!tenant) return res.status(404).json({ error: 'Salão não localizado.' });

    const token = createSessionToken({
      userId: tenant.id,
      name: `[Suporte] ${tenant.owner_name}`,
      email: tenant.owner_email,
      salonName: tenant.name,
      accessLevel: 'ADMIN',
      tenantId: tenant.id,
      isMaster: true,
      impersonated: true
    });

    res.json({
      success: true,
      token,
      user: {
        id: tenant.id,
        name: `[Suporte] ${tenant.owner_name}`,
        email: tenant.owner_email,
        salonName: tenant.name,
        accessLevel: 'ADMIN',
        tenantId: tenant.id,
        plan: tenant.plan,
        isMaster: true,
        impersonated: true
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar acesso de suporte.' });
  }
});

// 7. Relatório Global de Pagamentos e Transações do SaaS
router.get('/payments', async (req, res) => {
  try {
    const payments = await query(`
      SELECT sp.*, t.name as salon_name, t.owner_email, t.owner_name
      FROM subscription_payments sp
      LEFT JOIN tenants t ON sp.tenant_id = t.id
      ORDER BY sp.created_at DESC
      LIMIT 100
    `);

    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar pagamentos.' });
  }
});

module.exports = router;
