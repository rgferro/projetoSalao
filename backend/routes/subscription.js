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
      autoRenew: tenant?.auto_renew !== 0,
      canceledAt: tenant?.subscription_canceled_at || null,
      paymentMethod: tenant?.payment_method || 'pix',
      preapprovalId: tenant?.preapproval_id || null,
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
      autoRenew: true,
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

// 4. Gerar Assinatura Recorrente no Cartão de Crédito (Débito Mensal Automático)
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

    const cardData = await createMercadoPagoPreapproval(tenant, amount.toFixed(2), `${planConfig.name} (${extraUsers} extras)`);

    // Atualizar tenant com preapproval_id e método cartão
    if (cardData.preapproval_id) {
      await run(
        `UPDATE tenants SET preapproval_id = ?, payment_method = 'card', auto_renew = 1, subscription_canceled_at = NULL WHERE id = ?`,
        [cardData.preapproval_id, tenant.id]
      );
    }

    res.json({
      success: true,
      preapprovalId: cardData.preapproval_id,
      initPoint: cardData.init_point,
      simulated: cardData.simulated || false,
    });
  } catch (error) {
    logger.error('Erro ao gerar checkout de cartão:', { error: error.message });
    res.status(500).json({ error: error.message || 'Erro ao gerar checkout de cartão.' });
  }
});

// 5. Cancelar Renovação Automática (O plano CONTINUA ATIVO até a data de vencimento)
router.post('/cancel', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let tenantId = 'tenant_default_salao';

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const session = verifySessionToken(token);
      if (session && session.tenantId) tenantId = session.tenantId;
    }

    const tenant = await get(`SELECT * FROM tenants WHERE id = ?`, [tenantId]);
    if (!tenant) {
      return res.status(404).json({ error: 'Salão não encontrado.' });
    }

    // Se houver preapproval no Mercado Pago, cancela na API do MP
    if (tenant.preapproval_id) {
      try {
        const { cancelMercadoPagoPreapproval } = require('../services/mercadopagoService');
        await cancelMercadoPagoPreapproval(tenant.preapproval_id);
      } catch (err) {
        logger.warn(`Erro ao cancelar preapproval no MP (${tenant.preapproval_id}): ${err.message}`);
      }
    }

    // Desativa renovação automática MAS MANTÉM PLANO ATIVO ATÉ O VENCIMENTO
    await run(
      `UPDATE tenants 
       SET auto_renew = 0, subscription_canceled_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`,
      [tenantId]
    );

    res.json({
      success: true,
      message: 'Renovação automática cancelada com sucesso. Seu plano continuará 100% ativo com todas as funcionalidades até o vencimento contratado.',
      expiresAt: tenant.subscription_expires_at,
    });
  } catch (error) {
    logger.error('Erro ao cancelar assinatura:', { error: error.message });
    res.status(500).json({ error: 'Erro ao cancelar assinatura.' });
  }
});

// 6. Reativar Assinatura Recorrente
router.post('/reactivate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let tenantId = 'tenant_default_salao';

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const session = verifySessionToken(token);
      if (session && session.tenantId) tenantId = session.tenantId;
    }

    await run(
      `UPDATE tenants 
       SET auto_renew = 1, subscription_canceled_at = NULL, updated_at = datetime('now')
       WHERE id = ?`,
      [tenantId]
    );

    res.json({
      success: true,
      message: 'Assinatura reativada com sucesso! A renovação automática foi restabelecida.',
    });
  } catch (error) {
    logger.error('Erro ao reativar assinatura:', { error: error.message });
    res.status(500).json({ error: 'Erro ao reativar assinatura.' });
  }
});

// 7. Calcular Upgrade Proporcional Pró-Rata Mantendo a Data de Vencimento
router.post('/calculate-upgrade', async (req, res) => {
  try {
    const { targetPlan = 'STUDIO', targetExtraUsers = 0 } = req.body;
    const authHeader = req.headers.authorization;
    let tenantId = 'tenant_default_salao';

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const session = verifySessionToken(token);
      if (session && session.tenantId) tenantId = session.tenantId;
    }

    const tenant = await get(`SELECT * FROM tenants WHERE id = ?`, [tenantId]);
    const currentPlanId = tenant?.plan || 'SOLO';
    const currentExtra = tenant?.extra_users_count || 0;

    const currentPlanConfig = SAAS_PLANS[currentPlanId] || SAAS_PLANS.SOLO;
    const targetPlanConfig = SAAS_PLANS[targetPlan] || SAAS_PLANS.STUDIO;

    const currentMonthly = Number(currentPlanConfig.priceMonthly + (currentExtra * 15.0));
    const targetMonthly = Number(targetPlanConfig.priceMonthly + (Number(targetExtraUsers || 0) * 15.0));

    // Calcular dias restantes da assinatura atual
    let daysRemaining = 0;
    if (tenant?.subscription_expires_at) {
      const expDate = new Date(tenant.subscription_expires_at);
      const diffMs = expDate.getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    // Se o plano atual for gratuito (SOLO) ou estiver vencido, cobra o valor cheio de 30 dias
    if (currentMonthly <= 0 || daysRemaining <= 0) {
      return res.json({
        success: true,
        isProportional: false,
        daysRemaining: 0,
        currentPlan: currentPlanId,
        targetPlan,
        currentMonthly,
        targetMonthly,
        proportionalPrice: targetMonthly,
        expiresAt: tenant?.subscription_expires_at || null,
        message: 'Upgrade sem saldo proporcional residual.',
      });
    }

    // Pró-rata: diferença diária pelos dias restantes
    const dailyDiff = (targetMonthly - currentMonthly) / 30;
    const proportionalDiff = Math.max(0, Number((dailyDiff * daysRemaining).toFixed(2)));

    res.json({
      success: true,
      isProportional: true,
      daysRemaining,
      currentPlan: currentPlanId,
      targetPlan,
      currentMonthly,
      targetMonthly,
      proportionalPrice: proportionalDiff,
      expiresAt: tenant.subscription_expires_at,
      message: `Upgrade proporcional para os ${daysRemaining} dias restantes mantendo a data de vencimento.`,
    });
  } catch (error) {
    logger.error('Erro ao calcular upgrade:', { error: error.message });
    res.status(500).json({ error: 'Erro ao calcular upgrade.' });
  }
});

// 8. Executar Upgrade Proporcional Mantendo a Data de Vencimento
router.post('/upgrade', async (req, res) => {
  try {
    const { targetPlan = 'STUDIO', targetExtraUsers = 0, method = 'pix' } = req.body;
    const authHeader = req.headers.authorization;
    let tenantId = 'tenant_default_salao';

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const session = verifySessionToken(token);
      if (session && session.tenantId) tenantId = session.tenantId;
    }

    const tenant = await get(`SELECT * FROM tenants WHERE id = ?`, [tenantId]);
    if (!tenant) return res.status(404).json({ error: 'Salão não encontrado.' });

    const currentPlanId = tenant.plan || 'SOLO';
    const currentExtra = tenant.extra_users_count || 0;
    const currentPlanConfig = SAAS_PLANS[currentPlanId] || SAAS_PLANS.SOLO;
    const targetPlanConfig = SAAS_PLANS[targetPlan] || SAAS_PLANS.STUDIO;

    const currentMonthly = Number(currentPlanConfig.priceMonthly + (currentExtra * 15.0));
    const targetMonthly = Number(targetPlanConfig.priceMonthly + (Number(targetExtraUsers || 0) * 15.0));

    let daysRemaining = 0;
    if (tenant.subscription_expires_at) {
      const expDate = new Date(tenant.subscription_expires_at);
      const diffMs = expDate.getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    const dailyDiff = (targetMonthly - currentMonthly) / 30;
    const proportionalPrice = (currentMonthly > 0 && daysRemaining > 0)
      ? Math.max(0, Number((dailyDiff * daysRemaining).toFixed(2)))
      : targetMonthly;

    const targetMaxUsers = targetPlan === 'PREMIER' ? 15 : targetPlan === 'STUDIO' ? 5 : targetPlan === 'STARTER' ? 2 : 1;

    // Se o valor proporcional for 0 (ex: upgrade imediato ou sem custo extra)
    if (proportionalPrice <= 0) {
      await run(
        `UPDATE tenants 
         SET plan = ?, max_users = ?, extra_users_count = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [targetPlan, targetMaxUsers, Number(targetExtraUsers || 0), tenantId]
      );
      licenseManager.cacheLicense(
        tenantId,
        targetPlan,
        tenant.subscription_expires_at,
        targetMaxUsers + Number(targetExtraUsers || 0)
      );
      return res.json({
        success: true,
        proportionalPrice: 0,
        message: `Plano atualizado para ${targetPlanConfig.name} com sucesso! Data de vencimento mantida.`,
      });
    }

    if (method === 'card') {
      const cardData = await createMercadoPagoPreapproval(
        tenant,
        targetMonthly.toFixed(2),
        `${targetPlanConfig.name} (Upgrade Pró-Rata R$ ${proportionalPrice})`
      );
      return res.json({
        success: true,
        method: 'card',
        proportionalPrice,
        initPoint: cardData.init_point,
        preapprovalId: cardData.preapproval_id,
      });
    }

    // PIX Pró-Rata
    const pixData = await createMercadoPagoPixPayment(
      tenant,
      proportionalPrice.toFixed(2),
      `Upgrade Pró-Rata ${targetPlanConfig.name} (${daysRemaining}d)`
    );

    const paymentDbId = `pay_${Date.now()}`;
    await run(
      `INSERT INTO subscription_payments (
        id, tenant_id, payment_id, amount, status, method, plan, qr_code, qr_code_base64
      ) VALUES (?, ?, ?, ?, 'pending', 'pix_upgrade', ?, ?, ?)`,
      [paymentDbId, tenant.id, pixData.payment_id, proportionalPrice, targetPlan, pixData.qr_code, pixData.qr_code_base64]
    );

    res.json({
      success: true,
      method: 'pix',
      paymentId: pixData.payment_id,
      proportionalPrice,
      targetPlan,
      qrCode: pixData.qr_code,
      qrCodeBase64: pixData.qr_code_base64,
      expiresAt: tenant.subscription_expires_at,
    });
  } catch (error) {
    logger.error('Erro ao executar upgrade:', { error: error.message });
    res.status(500).json({ error: error.message || 'Erro ao gerar pagamento de upgrade.' });
  }
});

// 9. Webhook Oficial do Mercado Pago (Suporta Pagamentos e Assinaturas Recorrentes)
router.post('/webhook', async (req, res) => {
  try {
    const { data, type, action } = req.body;
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
          const isUpgrade = subPayment?.method === 'pix_upgrade';

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
          if (isUpgrade && currentExp && currentExp > now) {
            // Upgrade mantém a data de vencimento original intacta
            newExpiresAt = currentExp;
          } else if (!currentExp || isNaN(currentExp.getTime()) || currentExp < now) {
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
                 auto_renew = 1,
                 subscription_canceled_at = NULL,
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

        logger.info(`[Mercado Pago] Assinatura/Upgrade aprovado: ${paymentId}`);
      }
    }

    return res.status(200).send('OK');
  } catch (err) {
    logger.error('Erro no webhook MP:', { error: err.message });
    return res.status(200).send('OK');
  }
});

// 10. Listar Histórico de Pagamentos do Salão (Auditoria do SaaS)
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

// 11. Validar Status do Pagamento Diretamente no Mercado Pago
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
        const isUpgrade = subPayment?.method === 'pix_upgrade';

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
        if (isUpgrade && currentExp && currentExp > now) {
          // Upgrade mantém a data de vencimento original intacta
          newExpiresAt = currentExp;
        } else if (!currentExp || isNaN(currentExp.getTime()) || currentExp < now) {
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
               auto_renew = 1,
               subscription_canceled_at = NULL,
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
        message: 'Pagamento confirmado com sucesso! Assinatura ativada.',
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

// 12. Simulação Instantânea de Teste com Suporte a Vagas Extras e Upgrade
router.post('/simulate-approval', async (req, res) => {
  try {
    const { paymentId, plan = 'STUDIO', extraUsers = 0, isUpgrade = false } = req.body;
    const authHeader = req.headers.authorization;
    let tenantId = 'tenant_default_salao';

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const session = verifySessionToken(token);
      if (session && session.tenantId) tenantId = session.tenantId;
    }

    const maxUsers = plan === 'PREMIER' ? 15 : plan === 'STUDIO' ? 5 : plan === 'STARTER' ? 2 : 1;

    await transaction(async ({ get: tGet, run: tRun }) => {
      if (paymentId) {
        await tRun(
          `UPDATE subscription_payments
           SET status = 'approved', paid_at = datetime('now')
           WHERE payment_id = ?`,
          [paymentId]
        );
      }

      const currentTenant = await tGet(`SELECT subscription_expires_at FROM tenants WHERE id = ?`, [tenantId]);
      let targetExpires = currentTenant?.subscription_expires_at;
      if (!isUpgrade || !targetExpires) {
        targetExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      await tRun(
        `UPDATE tenants
         SET plan = ?, subscription_status = 'active', max_users = ?, extra_users_count = ?,
             subscription_expires_at = ?,
             auto_renew = 1,
             subscription_canceled_at = NULL,
             updated_at = datetime('now')
         WHERE id = ?`,
        [plan, maxUsers, Number(extraUsers || 0), targetExpires, tenantId]
      );

      licenseManager.cacheLicense(
        tenantId,
        plan,
        targetExpires,
        maxUsers + Number(extraUsers || 0)
      );
    });

    res.json({ success: true, message: `Mensalidade do Plano ${plan} ativada com sucesso!` });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao simular aprovação.' });
  }
});

module.exports = router;
module.exports.SAAS_PLANS = SAAS_PLANS;

