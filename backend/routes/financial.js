const express = require('express');
const router = express.Router();
const { query, get, run } = require('../database/db');

// Obter status do caixa atual (Aberto ou Fechado)
router.get('/cash/current', async (req, res) => {
  try {
    const current = await get(
      `SELECT * FROM cash_registers WHERE status = 'aberto' ORDER BY id DESC LIMIT 1`
    );

    if (!current) {
      return res.json({ isOpen: false, session: null, movements: [] });
    }

    const movements = await query(
      `SELECT * FROM cash_movements WHERE cash_register_id = ? ORDER BY created_at DESC`,
      [current.id]
    );

    // Resumo por forma de pagamento no caixa atual
    const summaryByMethod = await query(
      `SELECT payment_method, SUM(amount) as total
       FROM cash_movements
       WHERE cash_register_id = ? AND type = 'venda'
       GROUP BY payment_method`,
      [current.id]
    );

    res.json({
      isOpen: true,
      session: current,
      movements,
      summaryByMethod
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Abertura de Caixa Diário
router.post('/cash/open', async (req, res) => {
  try {
    const { initial_balance, opened_by, notes } = req.body;

    // Verificar se já existe caixa aberto
    const existing = await get("SELECT id FROM cash_registers WHERE status = 'aberto'");
    if (existing) {
      return res.status(400).json({ error: 'Já existe um caixa aberto no momento.' });
    }

    const initBal = parseFloat(initial_balance) || 0.0;
    const result = await run(
      `INSERT INTO cash_registers (opened_at, initial_balance, system_balance, status, opened_by, notes)
       VALUES (datetime('now', 'localtime'), ?, ?, 'aberto', ?, ?)`,
      [initBal, initBal, opened_by || 'Operador', notes || null]
    );

    const cashId = result.lastID;

    // Registrar movimentação de abertura
    await run(
      `INSERT INTO cash_movements (cash_register_id, type, amount, payment_method, description)
       VALUES (?, 'abertura', ?, 'dinheiro', 'Fundo de troco inicial de abertura')`,
      [cashId, initBal]
    );

    res.status(201).json({ id: cashId, message: 'Caixa aberto com sucesso!', initial_balance: initBal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Movimentação de Sangria (retirada) ou Reforço (suprimento)
router.post('/cash/movement', async (req, res) => {
  try {
    const { type, amount, description, payment_method = 'dinheiro' } = req.body;

    if (!type || !amount || !description) {
      return res.status(400).json({ error: 'Tipo (sangria/reforco), valor e descrição são obrigatórios.' });
    }

    const current = await get("SELECT * FROM cash_registers WHERE status = 'aberto' ORDER BY id DESC LIMIT 1");
    if (!current) {
      return res.status(400).json({ error: 'Não há nenhum caixa aberto para realizar movimentações.' });
    }

    const numAmount = Math.abs(parseFloat(amount));
    const delta = type === 'sangria' ? -numAmount : numAmount;

    await run(
      `INSERT INTO cash_movements (cash_register_id, type, amount, payment_method, description)
       VALUES (?, ?, ?, ?, ?)`,
      [current.id, type, numAmount, payment_method, description]
    );

    await run(
      `UPDATE cash_registers SET system_balance = system_balance + ? WHERE id = ?`,
      [delta, current.id]
    );

    res.json({ message: `Movimentação de ${type === 'sangria' ? 'Sangria' : 'Reforço'} registrada com sucesso!` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fechamento de Caixa Diário
router.post('/cash/close', async (req, res) => {
  try {
    const { final_balance, closed_by, notes } = req.body;

    const current = await get("SELECT * FROM cash_registers WHERE status = 'aberto' ORDER BY id DESC LIMIT 1");
    if (!current) {
      return res.status(400).json({ error: 'Nenhum caixa aberto para fechar.' });
    }

    const declaredFinal = parseFloat(final_balance) || 0.0;
    const difference = declaredFinal - current.system_balance;

    await run(
      `UPDATE cash_registers 
       SET closed_at = datetime('now', 'localtime'), final_balance = ?, difference = ?, status = 'fechado', closed_by = ?, notes = ?
       WHERE id = ?`,
      [declaredFinal, difference, closed_by || 'Operador', notes || null, current.id]
    );

    await run(
      `INSERT INTO cash_movements (cash_register_id, type, amount, description)
       VALUES (?, 'fechamento', ?, 'Fechamento de caixa')`,
      [current.id, declaredFinal]
    );

    res.json({
      message: 'Caixa fechado com sucesso!',
      system_balance: current.system_balance,
      final_balance: declaredFinal,
      difference
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Frente de Caixa / PDV Checkout (Venda de balcão ou Finalização de Agendamento)
router.post('/checkout', async (req, res) => {
  try {
    const {
      appointment_id,
      client_id,
      services, // Array de { service_id, professional_id, price, commission_type, commission_value }
      payment_method, // 'pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'voucher'
      discount = 0,
      notes
    } = req.body;

    if (!payment_method) {
      return res.status(400).json({ error: 'Forma de pagamento é obrigatória.' });
    }

    const currentCash = await get("SELECT id FROM cash_registers WHERE status = 'aberto' ORDER BY id DESC LIMIT 1");
    const cashId = currentCash ? currentCash.id : null;

    let subtotal = 0;
    let clientName = 'Cliente Avulso';

    if (client_id) {
      const client = await get('SELECT name FROM clients WHERE id = ?', [client_id]);
      if (client) clientName = client.name;
    }

    let appointmentHeaderId = appointment_id;

    if (appointment_id) {
      const app = await get('SELECT * FROM appointments WHERE id = ?', [appointment_id]);
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
    const finRes = await run(
      `INSERT INTO financial_transactions (type, category, description, amount, payment_method, due_date, payment_date, status, client_id, appointment_id, cash_register_id)
       VALUES ('receita', 'Serviços', ?, ?, ?, ?, ?, 'pago', ?, ?, ?)`,
      [desc, totalFinal, payment_method, todayStr, todayStr, client_id || null, appointmentHeaderId || null, cashId]
    );

    // 2. Se caixa estiver aberto, registrar movimento
    if (cashId) {
      await run(
        `INSERT INTO cash_movements (cash_register_id, type, amount, payment_method, description)
         VALUES (?, 'venda', ?, ?, ?)`,
        [cashId, totalFinal, payment_method, desc]
      );
      await run(
        `UPDATE cash_registers SET system_balance = system_balance + ? WHERE id = ?`,
        [totalFinal, cashId]
      );
    }

    // 3. Se veio de agendamento, atualizar status para 'concluido'
    if (appointment_id) {
      await run(
        `UPDATE appointments SET status = 'concluido', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [appointment_id]
      );
      await run(
        `UPDATE appointment_items SET status = 'concluido' WHERE appointment_id = ?`,
        [appointment_id]
      );

      // Creditar pontos de fidelidade
      if (client_id) {
        const points = Math.floor(totalFinal / 10);
        if (points > 0) {
          await run('UPDATE clients SET loyalty_points = loyalty_points + ? WHERE id = ?', [points, client_id]);
        }
      }
    }

    res.status(201).json({
      message: 'Venda finalizada com sucesso no PDV!',
      transaction_id: finRes.lastID,
      total: totalFinal,
      payment_method
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Contas a Pagar e a Receber (Listar com filtros)
router.get('/transactions', async (req, res) => {
  try {
    const { type, status, startDate, endDate, category } = req.query;
    let sql = `
      SELECT ft.*, c.name as client_name, p.nickname as prof_nickname
      FROM financial_transactions ft
      LEFT JOIN clients c ON ft.client_id = c.id
      LEFT JOIN professionals p ON ft.professional_id = p.id
      WHERE 1=1
    `;
    const params = [];

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

// Criar Conta a Pagar / Receber
router.post('/transactions', async (req, res) => {
  try {
    const { type, category, description, amount, payment_method, due_date, status = 'pendente', client_id, professional_id } = req.body;

    if (!type || !category || !description || !amount || !due_date) {
      return res.status(400).json({ error: 'Tipo, categoria, descrição, valor e data de vencimento são obrigatórios.' });
    }

    const payDate = status === 'pago' ? due_date : null;

    const result = await run(
      `INSERT INTO financial_transactions (type, category, description, amount, payment_method, due_date, payment_date, status, client_id, professional_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [type, category, description, parseFloat(amount), payment_method || 'pix', due_date, payDate, status, client_id || null, professional_id || null]
    );

    res.status(201).json({ id: result.lastID, message: 'Lançamento financeiro registrado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Quitar Conta a Pagar / Receber
router.patch('/transactions/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method } = req.body;
    const todayStr = new Date().toISOString().split('T')[0];

    await run(
      `UPDATE financial_transactions 
       SET status = 'pago', payment_date = ?, payment_method = COALESCE(?, payment_method)
       WHERE id = ?`,
      [todayStr, payment_method, id]
    );

    res.json({ message: 'Lançamento quitado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Excluir Lançamento Financeiro
router.delete('/transactions/:id', async (req, res) => {
  try {
    await run('DELETE FROM financial_transactions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Lançamento financeiro excluído.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Relatório DRE Simplificado
router.get('/reports/dre', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const sDate = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const eDate = endDate || new Date().toISOString().split('T')[0];

    // Receita Bruta
    const grossRevenueRow = await get(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM financial_transactions 
       WHERE type = 'receita' AND status = 'pago' AND payment_date BETWEEN ? AND ?`,
      [sDate, eDate]
    );
    const grossRevenue = grossRevenueRow.total;

    // Comissões pagas ou devidas
    const commissionsRow = await get(
      `SELECT COALESCE(SUM(commission_amount), 0) as total
       FROM appointment_items ai
       JOIN appointments a ON ai.appointment_id = a.id
       WHERE a.status = 'concluido' AND a.date BETWEEN ? AND ?`,
      [sDate, eDate]
    );
    const commissionsTotal = commissionsRow.total;

    // Despesas Operacionais Fixas e Variáveis
    const expensesByCategory = await query(
      `SELECT category, COALESCE(SUM(amount), 0) as total
       FROM financial_transactions
       WHERE type = 'despesa' AND status = 'pago' AND payment_date BETWEEN ? AND ?
       GROUP BY category`,
      [sDate, eDate]
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
      marginPercent
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Relatório de Faturamento por Categoria de Serviço
router.get('/reports/category', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
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
       WHERE a.status = 'concluido' AND a.date BETWEEN ? AND ?
       GROUP BY s.category
       ORDER BY total_revenue DESC`,
      [sDate, eDate]
    );

    res.json(categoryData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Relatório de Serviços Mais Lucrativos
router.get('/reports/top-services', async (req, res) => {
  try {
    const topServices = await query(
      `SELECT s.id, s.name, s.category, s.price, s.cost_price,
              COUNT(ai.id) as times_performed,
              COALESCE(SUM(ai.price), 0) as total_gross_revenue,
              COALESCE(SUM(ai.price - s.cost_price - ai.commission_amount), 0) as total_net_margin
       FROM appointment_items ai
       JOIN services s ON ai.service_id = s.id
       JOIN appointments a ON ai.appointment_id = a.id
       WHERE a.status = 'concluido'
       GROUP BY s.id
       ORDER BY times_performed DESC, total_gross_revenue DESC
       LIMIT 10`
    );

    res.json(topServices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
