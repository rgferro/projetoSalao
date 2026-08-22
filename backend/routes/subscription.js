const express = require('express');
const router = express.Router();
const { query, get, run, transaction } = require('../database/db');
const {
  createMercadoPagoPixPayment,
  createMercadoPagoPreapproval,
  getMercadoPagoPaymentStatus,
} = require('../services/mercadopagoService');
const { verifySessionToken } = require('../services/authService');
const { licenseManager } = require('../services/licenseCache');
const logger = require('../services/logger');

// Planos Oficiais Transparentes do BelaGestão Studio por Capacidade Operacional
const SAAS_PLANS = {
  SOLO: {
    id: 'SOLO',
    name: 'Plano Solo / Autônoma',
    priceMonthly: 0,
    priceAnnualMonthly: 0,
    maxUsers: 1,
    monthlyAppointmentLimit: 40,
    features: [
      '1 Profissional Ativo (Agenda Única)',
      'Até 40 Agendamentos por Mês',
      'Cadastro de Clientes & CRM',
      'Ficha de Anamnese Técnica Básica',
      'Comissão Fixa 100% Autônoma',
      'Backup Local SQLite',
    ],
  },
  STARTER: {
    id: 'STARTER',
    name: 'Plano Starter',
    priceMonthly: 69.9,
    priceAnnualMonthly: 59.9,
    maxUsers: 2,
    monthlyAppointmentLimit: null, // Ilimitado
    features: [
      'Até 2 Profissionais Cadastrados',
      'Agendamentos Ilimitados',
      'Gestão de Caixa Diário & PDV Balcão',
      'Histórico Completo de Clientes & Anamnese',
      'Lembretes Automáticos de Agendamento (WhatsApp/E-mail)',
      'Controle Básico de Comissões',
      'Backup Local & Exportação',
    ],
  },
  STUDIO: {
    id: 'STUDIO',
    name: 'Plano Studio Pro',
    priceMonthly: 139.9,
    priceAnnualMonthly: 119.9,
    maxUsers: 5,
    highlight: true,
    extraUserPrice: 15.0,
    monthlyAppointmentLimit: null,
    features: [
      'Até 5 Profissionais Inclusos (+R$ 15/mês por vaga extra)',
      'Agendamentos Ilimitados & Multi-Agenda por Cadeira',
      'Cálculo Automático de Comissões (Lei do Salão Parceiro)',
      'Comanda Multisserviços na Mesma Conta (Express)',
      'WhatsApp Automático Inteligente (24h e 2h antes)',
      'Controle de Estoque (Bancada/Procedimento vs Venda Recepção)',
      'DRE Financeiro e Relatórios de Lucratividade',
      'Backup Automático em Nuvem (Google Drive)',
    ],
  },
  PREMIER: {
    id: 'PREMIER',
    name: 'Plano Premier Express / Redes',
    priceMonthly: 229.9,
    priceAnnualMonthly: 199.9,
    maxUsers: 15,
    extraUserPrice: 15.0,
    monthlyAppointmentLimit: null,
    features: [
      'Até 15 Profissionais Inclusos (+R$ 15/mês por vaga extra)',
      'Multi-Agenda Rápida para Salões de Alto Fluxo',
      'CRM de Reativação de Clientes Sumidas (15d/20d/30d)',
      'Relatórios de Produtividade por Colaborador',
      'Múltiplas Filiais / Unidades Integradas',
      'Treinamento VIP com Especialista do Nicho',
      'Suporte Prioritário Humanizado 24/7',
    ],
  },
};

// 1. Listar Planos Mensais
router.get('/plans', (req, res) => {
  res.json({ success: true, plans: SAAS_PLANS });
});

// 2. Consultar Status da Assinatura com Grace Period & Modo Degradado
router.get('/status', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let tenantId = 'tenant_default_salao';

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const session = verifySessionToken(token);
      if (session && session.tenantId) tenantId = session.tenantId;
    }

    const tenant = await get(`SELECT * FROM tenants WHERE id = ?`, [tenantId]);
    const licenseEvaluation = licenseManager.evaluateLicense(tenantId, tenant);

    const profCount = await get(
      `SELECT COUNT(*) as count FROM professionals WHERE tenant_id = ? AND active = 1`,
      [tenantId]
    );
    const currentUsers = profCount?.count || 1;
    const extraUsers = tenant?.extra_users_count || 0;
    const totalAllowedUsers = (licenseEvaluation.maxUsers || 2) + extraUsers;

    // Contagem de agendamentos no mês atual
    const currentMonth = new Date().toISOString().substring(0, 7);
    const appCount = await get(
      `SELECT COUNT(*) as count FROM appointments WHERE tenant_id = ? AND strftime('%Y-%m', date) = ?`,
      [tenantId, currentMonth]
    );
    const currentMonthAppointments = appCount?.count || 0;

    res.json({
      success: true,
      tenantId: tenant?.id || tenantId,
      salonName: tenant?.name || 'BelaGestão Studio',
      plan: licenseEvaluation.plan,
      status: licenseEvaluation.status,
      isDegraded: licenseEvaluation.isDegraded,
      gracePeriodActive: licenseEvaluation.gracePeriodActive,
      graceDaysRemaining: licenseEvaluation.graceDaysRemaining || 0,
      daysRemaining: licenseEvaluation.daysRemaining,
      maxUsers: totalAllowedUsers,
      baseMaxUsers: licenseEvaluation.maxUsers || 2,
      extraUsers,
      currentUsers,
      currentMonthAppointments,
      monthlyAppointmentLimit: licenseEvaluation.plan === 'SOLO' ? 40 : null,
      expiresAt: tenant?.subscription_expires_at || null,
      message: licenseEvaluation.message,
      ownerEmail: tenant?.owner_email || '',
      isMaster: Boolean(tenant?.is_master),
    });
  } catch (error) {
    logger.error('Erro ao consultar assinatura:', { error: error.message });
    res.json({
      success: true,
      plan: 'STARTER',
      status: 'DEGRADED_FALLBACK',
      isDegraded: true,
      gracePeriodActive: true,
      maxUsers: 2,
      currentUsers: 1,
      daysRemaining: 1,
      message: 'Modo offline seguro ativo.',
    });
  }
});

// 3. Gerar Cobrança PIX com Cálculo de Vagas Extras (+R$ 15/mês)
router.post('/pix', async (req, res) => {
  try {
    const { plan = 'STUDIO', extraUsers = 0 } = req.body;
    const planConfig = SAAS_PLANS[plan] || SAAS_PLANS.STUDIO;

    const basePrice = planConfig.priceMonthly;
    const extraSeatsCost = Number(extraUsers || 0) * 15.0;
    const amount = Number(basePrice + extraSeatsCost);

    const authHeader = req.headers.authorization;
    let tenant = {
      id: 'tenant_default_salao',
      name: 'BelaGestão Studio',
      owner_email: 'contato@bellagestao.com.br',
      owner_name: 'Camila Silveira',
      document: '12.345.678/0001-90',
    };

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const session = verifySessionToken(token);
      if (session && session.tenantId) {
        const found = await get(`SELECT * FROM tenants WHERE id = ?`, [session.tenantId]);
        if (found) tenant = found;
      }
    }

    if (amount <= 0) {
      // Plano Gratuito Solo
      await run(`UPDATE tenants SET plan = 'SOLO', max_users = 1, extra_users_count = 0, subscription_expires_at = NULL WHERE id = ?`, [tenant.id]);
      licenseManager.memoryCache.delete(tenant.id);
      licenseManager.cacheLicense(tenant.id, 'SOLO', null, 1);
      return res.json({
        success: true,
        amount: 0,
        plan: 'SOLO',
        message: 'Plano Solo Gratuito ativado com sucesso!',
      });
    }

    const pixData = await createMercadoPagoPixPayment(tenant, amount.toFixed(2), `${planConfig.name} (${extraUsers} extras)`);

    const paymentDbId = `pay_${Date.now()}`;
    await run(
      `INSERT INTO subscription_payments (
        id, tenant_id, payment_id, amount, status, method, plan, qr_code, qr_code_base64
      ) VALUES (?, ?, ?, ?, 'pending', 'pix', ?, ?, ?)`,
      [paymentDbId, tenant.id, pixData.payment_id, amount, plan, pixData.qr_code, pixData.qr_code_base64]
    );

    res.json({
      success: true,
      paymentId: pixData.payment_id,
      amount,
      plan,
      extraUsers,
      qrCode: pixData.qr_code,
      qrCodeBase64: pixData.qr_code_base64,
      simulated: pixData.simulated || false,
    });
  } catch (error) {
    logger.error('Erro ao gerar PIX mensal:', { error: error.message });
    res.status(500).json({ error: error.message || 'Erro ao gerar PIX no Mercado Pago.' });
  }
});

// 4. Gerar Assinatura Recorrente no Cartão de Crédito
router.post('/card', async (req, res) => {
  try {
    const { plan = 'STUDIO', extraUsers = 0 } = req.body;
    const planConfig = SAAS_PLANS[plan] || SAAS_PLANS.STUDIO;
    const basePrice = planConfig.priceMonthly;
    const amount = Number(basePrice + (Number(extraUsers || 0) * 15.0));

    const authHeader = req.headers.authorization;
    let tenant = {
      id: 'tenant_default_salao',
      name: 'BelaGestão Studio',
      owner_email: 'contato@bellagestao.com.br',
      owner_name: 'Camila Silveira',
    };

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const session = verifySessionToken(token);
      if (session && session.tenantId) {
        const found = await get(`SELECT * FROM tenants WHERE id = ?`, [session.tenantId]);
        if (found) tenant = found;
      }
    }

    const cardData = await createMercadoPagoPreapproval(tenant, amount.toFixed(2), planConfig.name);

    res.json({
      success: true,
      preapprovalId: cardData.preapproval_id,
      initPoint: cardData.init_point,
      simulated: cardData.simulated || false,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erro ao gerar checkout de cartão.' });
  }
});

// 5. Webhook Oficial do Mercado Pago
router.post('/webhook', async (req, res) => {
  try {
    const { data } = req.body;
    const paymentId = data?.id || req.query?.['data.id'] || req.query?.id;

    if (paymentId) {
      const payment = await getMercadoPagoPaymentStatus(paymentId);

      if (payment && payment.status === 'approved') {
        await transaction(async ({ get: tGet, run: tRun }) => {
          const subPayment = await tGet(
            `SELECT * FROM subscription_payments WHERE payment_id = ?`,
            [String(paymentId)]
          );

          const tenantId = subPayment?.tenant_id || 'tenant_default_salao';
          const plan = subPayment?.plan || 'STUDIO';
          const maxUsers = plan === 'PREMIER' ? 15 : plan === 'STUDIO' ? 5 : plan === 'STARTER' ? 2 : 1;

          const currentTenant = await tGet(`SELECT subscription_expires_at FROM tenants WHERE id = ?`, [tenantId]);
          const now = new Date();
          let currentExp = null;
          if (currentTenant?.subscription_expires_at) {
            const raw = String(currentTenant.subscription_expires_at);
            if (!raw.startsWith('2099') && !raw.startsWith('2100')) {
              currentExp = new Date(raw.includes('T') ? (raw.endsWith('Z') ? raw : raw + 'Z') : raw.replace(' ', 'T') + 'Z');
            }
          }
          let newExpiresAt;
          if (!currentExp || isNaN(currentExp.getTime()) || currentExp < now) {
            newExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          } else {
            newExpiresAt = new Date(currentExp.getTime() + 30 * 24 * 60 * 60 * 1000);
          }

          await tRun(
            `UPDATE subscription_payments
             SET status = 'approved', paid_at = datetime('now')
             WHERE payment_id = ?`,
            [String(paymentId)]
          );

          await tRun(
            `UPDATE tenants
             SET plan = ?, subscription_status = 'active', max_users = ?,
                 subscription_expires_at = ?,
                 updated_at = datetime('now')
             WHERE id = ?`,
            [plan, maxUsers, newExpiresAt.toISOString(), tenantId]
          );

          licenseManager.cacheLicense(
            tenantId,
            plan,
            newExpiresAt.toISOString(),
            maxUsers
          );
        });

        logger.info(`[Mercado Pago] Assinatura mensal estendida para plano ${paymentId}`);
      }
    }

    return res.status(200).send('OK');
  } catch (err) {
    logger.error('Erro no webhook MP:', { error: err.message });
    return res.status(200).send('OK');
  }
});

// 6. Listar Histórico de Pagamentos do Salão (Auditoria do SaaS)
router.get('/payments', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let tenantId = 'tenant_default_salao';

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const session = verifySessionToken(token);
      if (session && session.tenantId) tenantId = session.tenantId;
    }

    const payments = await query(
      `SELECT * FROM subscription_payments WHERE tenant_id = ? ORDER BY created_at DESC`,
      [tenantId]
    );

    res.json({ success: true, payments: payments || [] });
  } catch (error) {
    logger.error('Erro ao buscar histórico de pagamentos:', { error: error.message });
    res.status(500).json({ error: 'Erro ao buscar histórico de pagamentos.' });
  }
});

// 7. Validar Status do Pagamento Diretamente no Mercado Pago
router.post('/check-payment/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const authHeader = req.headers.authorization;
    let tenantId = 'tenant_default_salao';

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const session = verifySessionToken(token);
      if (session && session.tenantId) tenantId = session.tenantId;
    }

    const payment = await getMercadoPagoPaymentStatus(paymentId);

    if (payment && payment.status === 'approved') {
      await transaction(async ({ get: tGet, run: tRun }) => {
        const subPayment = await tGet(
          `SELECT * FROM subscription_payments WHERE payment_id = ?`,
          [String(paymentId)]
        );

        const activeTenantId = subPayment?.tenant_id || tenantId;
        const plan = subPayment?.plan || 'STUDIO';
        const maxUsers = plan === 'PREMIER' ? 15 : plan === 'STUDIO' ? 5 : plan === 'STARTER' ? 2 : 1;

        const currentTenant = await tGet(`SELECT subscription_expires_at FROM tenants WHERE id = ?`, [activeTenantId]);
        const now = new Date();
        let currentExp = null;
        if (currentTenant?.subscription_expires_at) {
          const raw = String(currentTenant.subscription_expires_at);
          if (!raw.startsWith('2099') && !raw.startsWith('2100')) {
            currentExp = new Date(raw.includes('T') ? (raw.endsWith('Z') ? raw : raw + 'Z') : raw.replace(' ', 'T') + 'Z');
          }
        }
        let newExpiresAt;
        if (!currentExp || isNaN(currentExp.getTime()) || currentExp < now) {
          newExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        } else {
          newExpiresAt = new Date(currentExp.getTime() + 30 * 24 * 60 * 60 * 1000);
        }

        await tRun(
          `UPDATE subscription_payments
           SET status = 'approved', paid_at = datetime('now')
           WHERE payment_id = ?`,
          [String(paymentId)]
        );

        await tRun(
          `UPDATE tenants
           SET plan = ?, subscription_status = 'active', max_users = ?,
               subscription_expires_at = ?,
               updated_at = datetime('now')
           WHERE id = ?`,
          [plan, maxUsers, newExpiresAt.toISOString(), activeTenantId]
        );

        licenseManager.cacheLicense(
          activeTenantId,
          plan,
          newExpiresAt.toISOString(),
          maxUsers
        );
      });

      return res.json({
        success: true,
        status: 'approved',
        message: 'Pagamento confirmado com sucesso! Assinatura ativada por mais 30 dias.',
      });
    }

    res.json({
      success: true,
      status: payment?.status || 'pending',
      message: payment?.status === 'pending'
        ? 'Pagamento ainda pendente de confirmação no Mercado Pago. Se já realizou a transferência, aguarde alguns segundos e clique novamente.'
        : `Status no Mercado Pago: ${payment?.status || 'desconhecido'}`,
    });
  } catch (error) {
    logger.error('Erro ao validar pagamento:', { error: error.message });
    res.status(500).json({ error: 'Erro ao validar status do pagamento no Mercado Pago.' });
  }
});

// 8. Simulação Instantânea de Teste com Suporte a Vagas Extras
router.post('/simulate-approval', async (req, res) => {
  try {
    const { paymentId, plan = 'STUDIO', extraUsers = 0 } = req.body;
    const authHeader = req.headers.authorization;
    let tenantId = 'tenant_default_salao';

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const session = verifySessionToken(token);
      if (session && session.tenantId) tenantId = session.tenantId;
    }

    const maxUsers = plan === 'PREMIER' ? 15 : plan === 'STUDIO' ? 5 : plan === 'STARTER' ? 2 : 1;

    await transaction(async ({ run: tRun }) => {
      if (paymentId) {
        await tRun(
          `UPDATE subscription_payments
           SET status = 'approved', paid_at = datetime('now')
           WHERE payment_id = ?`,
          [paymentId]
        );
      }

      await tRun(
        `UPDATE tenants
         SET plan = ?, subscription_status = 'active', max_users = ?, extra_users_count = ?,
             subscription_expires_at = datetime('now', '+30 days'),
             updated_at = datetime('now')
         WHERE id = ?`,
        [plan, maxUsers, Number(extraUsers || 0), tenantId]
      );

      licenseManager.cacheLicense(
        tenantId,
        plan,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        maxUsers + Number(extraUsers || 0)
      );
    });

    res.json({ success: true, message: `Mensalidade do Plano ${plan} ativada com sucesso por 30 dias!` });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao simular aprovação.' });
  }
});

module.exports = router;
module.exports.SAAS_PLANS = SAAS_PLANS;
