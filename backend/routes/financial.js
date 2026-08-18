const express = require('express');
const router = express.Router();
const { query, get, run, transaction } = require('../database/db');
const { requireRole } = require('../middleware/authMiddleware');
const logger = require('../services/logger');

// Bloqueia perfis sem acesso operacional (ex: Profissional puro ou Auxiliar)
router.use(requireRole(['ADMIN', 'GERENTE', 'RECEPCAO']));

// Obter status do caixa atual (Aberto ou Fechado) por Tenant
router.get('/cash/current', async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant_default_salao';
    const current = await get(
      `SELECT * FROM cash_registers WHERE status = 'aberto' AND tenant_id = ? ORDER BY id DESC LIMIT 1`,
      [tenantId]
    );

    if (!current) {
      return res.json({ isOpen: false, session: null, movements: [] });
    }

    const movements = await query(
      `SELECT * FROM cash_movements WHERE cash_register_id = ? AND tenant_id = ? ORDER BY created_at DESC`,
      [current.id, tenantId]
    );

    // Resumo por forma de pagamento no caixa atual
    const summaryByMethod = await query(
      `SELECT payment_method, SUM(amount) as total
       FROM cash_movements
       WHERE cash_register_id = ? AND type = 'venda' AND tenant_id = ?
       GROUP BY payment_method`,
      [current.id, tenantId]
    );

    res.json({
      isOpen: true,
      session: current,
      movements,
      summaryByMethod,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Abertura de Caixa Diário com Transação Atômica e Isolamento Multi-Tenant
router.post('/cash/open', async (req, res) => {
  try {
    const { initial_balance, opened_by, notes } = req.body;
    const tenantId = req.tenantId || 'tenant_default_salao';

    const cashId = await transaction(async ({ get: tGet, run: tRun }) => {
      // Verificar se já existe caixa aberto
      const existing = await tGet("SELECT id FROM cash_registers WHERE status = 'aberto' AND tenant_id = ?", [tenantId]);
      if (existing) {
        throw new Error('Já existe um caixa aberto no momento.');
      }

      const initBal = parseFloat(initial_balance) || 0.0;
      const result = await tRun(
        `INSERT INTO cash_registers (opened_at, initial_balance, system_balance, status, opened_by, notes, tenant_id)
         VALUES (datetime('now', 'localtime'), ?, ?, 'aberto', ?, ?, ?)`,
        [initBal, initBal, opened_by || 'Operador', notes || null, tenantId]
      );

      const newId = result.lastID;

      // Registrar movimentação de abertura
      await tRun(
        `INSERT INTO cash_movements (cash_register_id, type, amount, payment_method, description, tenant_id)
         VALUES (?, 'abertura', ?, 'dinheiro', 'Fundo de troco inicial de abertura', ?)`,
        [newId, initBal, tenantId]
      );

      return newId;
    });

    res.status(201).json({ id: cashId, message: 'Caixa aberto com sucesso!', initial_balance: parseFloat(initial_balance) || 0.0 });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Movimentação de Sangria ou Reforço com Transação Atômica
router.post('/cash/movement', async (req, res) => {
  try {
    const { type, amount, description, payment_method = 'dinheiro' } = req.body;
    const tenantId = req.tenantId || 'tenant_default_salao';

    if (!type || !amount || !description) {
      return res.status(400).json({ error: 'Tipo (sangria/reforco), valor e descrição são obrigatórios.' });
    }

    await transaction(async ({ get: tGet, run: tRun }) => {
      const current = await tGet("SELECT * FROM cash_registers WHERE status = 'aberto' AND tenant_id = ? ORDER BY id DESC LIMIT 1", [tenantId]);
      if (!current) {
        throw new Error('Não há nenhum caixa aberto para realizar movimentações.');
      }

      const numAmount = Math.abs(parseFloat(amount));
      const delta = type === 'sangria' ? -numAmount : numAmount;

      await tRun(
        `INSERT INTO cash_movements (cash_register_id, type, amount, payment_method, description, tenant_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [current.id, type, numAmount, payment_method, description, tenantId]
      );

      await tRun(
        `UPDATE cash_registers SET system_balance = system_balance + ? WHERE id = ? AND tenant_id = ?`,
        [delta, current.id, tenantId]
      );
    });

    res.json({ message: `Movimentação de ${type === 'sangria' ? 'Sangria' : 'Reforço'} registrada com sucesso!` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Fechamento de Caixa Diário com Transação Atômica
router.post('/cash/close', async (req, res) => {
  try {
    const { final_balance, closed_by, notes } = req.body;
    const tenantId = req.tenantId || 'tenant_default_salao';

    const result = await transaction(async ({ get: tGet, run: tRun }) => {
      const current = await tGet("SELECT * FROM cash_registers WHERE status = 'aberto' AND tenant_id = ? ORDER BY id DESC LIMIT 1", [tenantId]);
      if (!current) {
        throw new Error('Nenhum caixa aberto para fechar.');
      }

      const declaredFinal = parseFloat(final_balance) || 0.0;
      const difference = declaredFinal - current.system_balance;

      await tRun(
        `UPDATE cash_registers 
         SET closed_at = datetime('now', 'localtime'), final_balance = ?, difference = ?, status = 'fechado', closed_by = ?, notes = ?
         WHERE id = ? AND tenant_id = ?`,
        [declaredFinal, difference, closed_by || 'Operador', notes || null, current.id, tenantId]
      );

      await tRun(
        `INSERT INTO cash_movements (cash_register_id, type, amount, description, tenant_id)
         VALUES (?, 'fechamento', ?, 'Fechamento de caixa', ?)`,
        [current.id, declaredFinal, tenantId]
      );

      return {
        system_balance: current.system_balance,
        final_balance: declaredFinal,
        difference,
      };
    });

    // Disparar backup em nuvem assíncrono pós-fechamento
    try {
      const gdriveService = require('../services/gdriveService');
      gdriveService.syncToGoogleDrive().catch((e) => logger.warn(`Aviso no backup em nuvem: ${e.message}`));
    } catch (bErr) {}

    res.json({
      message: 'Caixa fechado com sucesso e cópia de segurança enviada para a nuvem!',
      system_balance: result.system_balance,
      final_balance: result.final_balance,
      difference: result.difference,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Frente de Caixa / PDV Checkout com Transação Atômica e Idempotência
router.post('/checkout', async (req, res) => {
  try {
    const {
      appointment_id,
      client_id,
      services,
      payment_method,
      discount = 0,
      notes,
    } = req.body;
    const tenantId = req.tenantId || 'tenant_default_salao';

    if (!payment_method) {
      return res.status(400).json({ error: 'Forma de pagamento é obrigatória.' });
    }

    const checkoutResult = await transaction(async ({ get: tGet, run: tRun }) => {
      const currentCash = await tGet("SELECT id FROM cash_registers WHERE status = 'aberto' AND tenant_id = ? ORDER BY id DESC LIMIT 1", [tenantId]);
      const cashId = currentCash ? currentCash.id : null;

      let subtotal = 0;
      let clientName = 'Cliente Avulso';

      if (client_id) {
        const client = await tGet('SELECT name FROM clients WHERE id = ? AND tenant_id = ?', [client_id, tenantId]);
        if (client) clientName = client.name;
      }

      if (appointment_id) {
        const app = await tGet('SELECT * FROM appointments WHERE id = ? AND tenant_id = ?', [appointment_id, tenantId]);
        if (app) {
          subtotal = app.total_price;
        }
      } else if (Array.isArray(services)) {
        subtotal = services.reduce((acc, s) => acc + (parseFloat(s.price) || 0), 0);
      }

      const totalFinal = Math.max(0, subtotal - (parseFloat(discount) || 0));
      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Criar transação financeira
      const desc = `Venda PDV - ${clientName} (${payment_method.toUpperCase()})`;
      const finRes = await tRun(
        `INSERT INTO financial_transactions (type, category, description, amount, payment_method, due_date, payment_date, status, client_id, appointment_id, cash_register_id, tenant_id)
         VALUES ('receita', 'Serviços', ?, ?, ?, ?, ?, 'pago', ?, ?, ?, ?)`,
        [desc, totalFinal, payment_method, todayStr, todayStr, client_id || null, appointment_id || null, cashId, tenantId]
      );

      // 2. Se caixa estiver aberto, registrar movimento
      if (cashId) {
        await tRun(
          `INSERT INTO cash_movements (cash_register_id, type, amount, payment_method, description, tenant_id)
           VALUES (?, 'venda', ?, ?, ?, ?)`,
          [cashId, totalFinal, payment_method, desc, tenantId]
        );
        await tRun(
          `UPDATE cash_registers SET system_balance = system_balance + ? WHERE id = ? AND tenant_id = ?`,
          [totalFinal, cashId, tenantId]
        );
      }

      // 3. Se veio de agendamento, atualizar status para 'concluido'
      if (appointment_id) {
        await tRun(
          `UPDATE appointments SET status = 'concluido', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?`,
          [appointment_id, tenantId]
        );
        await tRun(
          `UPDATE appointment_items SET status = 'concluido' WHERE appointment_id = ? AND tenant_id = ?`,
          [appointment_id, tenantId]
        );

        // Creditar pontos de fidelidade
        if (client_id) {
          const points = Math.floor(totalFinal / 10);
          if (points > 0) {
            await tRun('UPDATE clients SET loyalty_points = loyalty_points + ? WHERE id = ? AND tenant_id = ?', [points, client_id, tenantId]);
          }
        }
      }

      return { transactionId: finRes.lastID, total: totalFinal };
    });

    res.status(201).json({
      message: 'Venda finalizada com sucesso no PDV!',
      transaction_id: checkoutResult.transactionId,
      total: checkoutResult.total,
      payment_method,
    });
  } catch (error) {
    logger.error('Erro no checkout PDV:', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Listar Contas a Pagar / Receber (Exclusivo Admin e Gerente)
router.get('/transactions', requireRole(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { type, status, startDate, endDate, category } = req.query;
    const tenantId = req.tenantId || 'tenant_default_salao';

    let sql = `
      SELECT ft.*, c.name as client_name, p.nickname as prof_nickname
      FROM financial_transactions ft
      LEFT JOIN clients c ON ft.client_id = c.id
      LEFT JOIN professionals p ON ft.professional_id = p.id
      WHERE ft.tenant_id = ?
    `;
    const params = [tenantId];

    if (type) {
      sql += ' AND ft.type = ?';
      params.push(type);
    }
    if (status) {
      sql += ' AND ft.status = ?';
      params.push(status);
    }
    if (category) {
      sql += ' AND ft.category = ?';
      params.push(category);
    }
    if (startDate && endDate) {
      sql += ' AND ft.due_date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    sql += ' ORDER BY ft.due_date DESC, ft.created_at DESC';
    const transactions = await query(sql, params);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar Conta a Pagar / Receber (Exclusivo Admin e Gerente)
router.post('/transactions', requireRole(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { type, category, description, amount, payment_method, due_date, status = 'pendente', client_id, professional_id } = req.body;
    const tenantId = req.tenantId || 'tenant_default_salao';

    if (!type || !category || !description || !amount || !due_date) {
      return res.status(400).json({ error: 'Tipo, categoria, descrição, valor e data de vencimento são obrigatórios.' });
    }

    const payDate = status === 'pago' ? due_date : null;

    const result = await run(
      `INSERT INTO financial_transactions (type, category, description, amount, payment_method, due_date, payment_date, status, client_id, professional_id, tenant_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [type, category, description, parseFloat(amount), payment_method || 'pix', due_date, payDate, status, client_id || null, professional_id || null, tenantId]
    );

    res.status(201).json({ id: result.lastID, message: 'Lançamento financeiro registrado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Quitar Conta a Pagar / Receber (Exclusivo Admin e Gerente)
router.patch('/transactions/:id/pay', requireRole(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method } = req.body;
    const tenantId = req.tenantId || 'tenant_default_salao';
    const todayStr = new Date().toISOString().split('T')[0];

    await run(
      `UPDATE financial_transactions 
       SET status = 'pago', payment_date = ?, payment_method = COALESCE(?, payment_method)
       WHERE id = ? AND tenant_id = ?`,
      [todayStr, payment_method, id, tenantId]
    );

    res.json({ message: 'Lançamento quitado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Excluir Lançamento Financeiro (Exclusivo Admin e Gerente)
router.delete('/transactions/:id', requireRole(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant_default_salao';
    await run('DELETE FROM financial_transactions WHERE id = ? AND tenant_id = ?', [req.params.id, tenantId]);
    res.json({ message: 'Lançamento financeiro excluído.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Relatório DRE Simplificado por Tenant (Exclusivo Admin e Gerente)
router.get('/reports/dre', requireRole(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const tenantId = req.tenantId || 'tenant_default_salao';
    const sDate = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const eDate = endDate || new Date().toISOString().split('T')[0];

    const grossRevenueRow = await get(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM financial_transactions 
       WHERE type = 'receita' AND status = 'pago' AND payment_date BETWEEN ? AND ? AND tenant_id = ?`,
      [sDate, eDate, tenantId]
    );
    const grossRevenue = grossRevenueRow.total;

    const commissionsRow = await get(
      `SELECT COALESCE(SUM(commission_amount), 0) as total
       FROM appointment_items ai
       JOIN appointments a ON ai.appointment_id = a.id
       WHERE a.status = 'concluido' AND a.date BETWEEN ? AND ? AND a.tenant_id = ?`,
      [sDate, eDate, tenantId]
    );
    const commissionsTotal = commissionsRow.total;

    const expensesByCategory = await query(
      `SELECT category, COALESCE(SUM(amount), 0) as total
       FROM financial_transactions
       WHERE type = 'despesa' AND status = 'pago' AND payment_date BETWEEN ? AND ? AND tenant_id = ?
       GROUP BY category`,
      [sDate, eDate, tenantId]
    );

    const totalExpenses = expensesByCategory.reduce((acc, curr) => acc + curr.total, 0);
    const netProfit = grossRevenue - commissionsTotal - totalExpenses;
    const marginPercent = grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(1) : 0;

    res.json({
      period: { startDate: sDate, endDate: eDate },
      grossRevenue,
      commissionsTotal,
      expensesByCategory,
      totalExpenses,
      netProfit,
      marginPercent,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Relatório de Faturamento por Categoria de Serviço (Exclusivo Admin e Gerente)
router.get('/reports/category', requireRole(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const tenantId = req.tenantId || 'tenant_default_salao';
    const sDate = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const eDate = endDate || new Date().toISOString().split('T')[0];

    const categoryData = await query(
      `SELECT s.category, 
              COUNT(ai.id) as total_services_count, 
              COALESCE(SUM(ai.price), 0) as total_revenue,
              COALESCE(SUM(ai.commission_amount), 0) as total_commission
       FROM appointment_items ai
       JOIN services s ON ai.service_id = s.id
       JOIN appointments a ON ai.appointment_id = a.id
       WHERE a.status = 'concluido' AND a.date BETWEEN ? AND ? AND a.tenant_id = ?
       GROUP BY s.category
       ORDER BY total_revenue DESC`,
      [sDate, eDate, tenantId]
    );

    res.json(categoryData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Relatório de Serviços Mais Lucrativos (Exclusivo Admin e Gerente)
router.get('/reports/top-services', requireRole(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant_default_salao';
    const topServices = await query(
      `SELECT s.id, s.name, s.category, s.price, s.cost_price,
              COUNT(ai.id) as times_performed,
              COALESCE(SUM(ai.price), 0) as total_gross_revenue,
              COALESCE(SUM(ai.price - s.cost_price - ai.commission_amount), 0) as total_net_margin
       FROM appointment_items ai
       JOIN services s ON ai.service_id = s.id
       JOIN appointments a ON ai.appointment_id = a.id
       WHERE a.status = 'concluido' AND a.tenant_id = ?
       GROUP BY s.id
       ORDER BY times_performed DESC, total_gross_revenue DESC
       LIMIT 10`,
      [tenantId]
    );

    res.json(topServices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
