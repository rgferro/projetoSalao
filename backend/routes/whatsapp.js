const express = require('express');
const router = express.Router();
const { query, get, run } = require('../database/db');
const whatsappService = require('../services/whatsappService');

const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const logger = require('../services/logger');

// Obter status e QR Code de conexão em tempo real para o Salão / Tenant
// Exclusivo para perfis Administrador ('ADMIN' / 'DONO')
router.get('/status', requireAuth, requireRole(['ADMIN', 'DONO']), async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant_default_salao';
    const status = await whatsappService.getStatus(tenantId);

    // Auditoria ao gerar/entregar o QR Code ativo
    if (status && (status.qr || status.qrCode)) {
      const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || req.ip || 'desconhecido';
      const userId = req.user?.id || req.user?.userId || 'admin';
      const userEmail = req.user?.email || 'desconhecido';
      const timestamp = new Date().toISOString();

      logger.info(`[AUDITORIA-QR] QR Code acessado/gerado - User: ${userId} (${userEmail}) | IP: ${clientIp} | Tenant: ${tenantId} | Timestamp: ${timestamp}`);
    }

    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Desconectar sessão (Logout) exclusiva do Salão / Tenant para gerar novo QR Code
router.post('/logout', requireAuth, requireRole(['ADMIN', 'DONO']), async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant_default_salao';
    const result = await whatsappService.logout(tenantId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar Modelos de Mensagens exclusivos do Salão / Tenant
router.get('/templates', async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant_default_salao';
    let templates = await query('SELECT * FROM whatsapp_templates WHERE tenant_id = ? ORDER BY id ASC', [tenantId]);

    // Se o salão ainda não tiver templates cadastrados, copia os modelos padrão
    if (!templates || templates.length === 0) {
      const defaultTemplates = [
        {
          code: 'reminder_24h',
          title: 'Lembrete de Agendamento (24h antes)',
          body: 'Olá {cliente}! ✨ Passando para confirmar seu horário amanhã ({data} às {horario}) no {salao} para realizar: {servicos} com {profissional}. Podemos confirmar? Responda com SIM para confirmar!'
        },
        {
          code: 'reminder_2h',
          title: 'Lembrete Imediato (2h antes)',
          body: 'Oi {cliente}! Seu horário no {salao} está chegando: hoje às {horario} com {profissional}. Estamos preparando tudo com muito carinho para receber você! 🌸'
        },
        {
          code: 'welcome',
          title: 'Boas-Vindas Novo Cliente',
          body: 'Seja muito bem-vinda(o) ao {salao}, {cliente}! 🌸 É um prazer ter você conosco. Qualquer dúvida sobre horários ou procedimentos, é só nos chamar aqui!'
        },
        {
          code: 'birthday',
          title: 'Felicitações de Aniversário & Cupom',
          body: '🎉 Parabéns {cliente}! Toda a equipe do {salao} deseja a você um aniversário maravilhoso, repleto de beleza, saúde e felicidade! Como presente especial, ganhe 15% de desconto em qualquer serviço neste mês! 🎁✨'
        },
        {
          code: 'finished',
          title: 'Agradecimento Pós-Atendimento & Avaliação',
          body: 'Olá {cliente}! Muito obrigado por sua visita ao {salao} hoje! Esperamos que tenha amado sua experiência. Poderia nos avaliar com 5 estrelas no Google? Sua opinião é fundamental para nossa equipe! ⭐⭐⭐⭐⭐'
        }
      ];

      for (const t of defaultTemplates) {
        await run(`
          INSERT OR IGNORE INTO whatsapp_templates (code, title, body, active, tenant_id)
          VALUES (?, ?, ?, 1, ?)
        `, [t.code, t.title, t.body, tenantId]);
      }

      templates = await query('SELECT * FROM whatsapp_templates WHERE tenant_id = ? ORDER BY id ASC', [tenantId]);
    }

    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar Modelo de Mensagem exclusivo do Salão / Tenant
router.put('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, active } = req.body;
    const tenantId = req.tenantId || 'tenant_default_salao';

    await run(
      `UPDATE whatsapp_templates 
       SET title = COALESCE(?, title), body = COALESCE(?, body), active = COALESCE(?, active), updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND tenant_id = ?`,
      [title, body, active, id, tenantId]
    );

    res.json({ message: 'Modelo de mensagem atualizado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disparar Lembrete Manual 100% Silencioso em Background no WhatsApp do Salão
router.post('/send-reminder', async (req, res) => {
  try {
    const { appointment_id, type = 'reminder_24h' } = req.body;
    const tenantId = req.tenantId || 'tenant_default_salao';
    if (!appointment_id) return res.status(400).json({ error: 'ID do agendamento é obrigatório.' });

    const result = await whatsappService.sendAppointmentReminder(appointment_id, type, tenantId);
    res.json({ message: 'Lembrete enviado com sucesso pelo WhatsApp do salão!', ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disparar Mensagem de Aniversário Silenciosa no WhatsApp do Salão
router.post('/send-birthday', async (req, res) => {
  try {
    const { client_id } = req.body;
    const tenantId = req.tenantId || 'tenant_default_salao';
    if (!client_id) return res.status(400).json({ error: 'ID do cliente é obrigatório.' });

    const result = await whatsappService.sendBirthday(client_id, tenantId);
    res.json({ message: 'Mensagem de aniversário enviada com sucesso pelo WhatsApp do salão!', ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disparo Livre de Mensagem via WhatsApp do Salão
router.post('/send-custom', async (req, res) => {
  try {
    const { client_id, phone, message } = req.body;
    const tenantId = req.tenantId || 'tenant_default_salao';
    if (!phone || !message) return res.status(400).json({ error: 'Telefone e mensagem são obrigatórios.' });

    const result = await whatsappService.sendMessage(phone, message, client_id || null, 'custom', tenantId);
    res.json({ message: 'Mensagem enviada com sucesso pelo WhatsApp do salão!', ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Histórico de Mensagens Enviadas / Fila por Salão
router.get('/logs', async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant_default_salao';
    const logs = await query(`
      SELECT wl.*, c.name as client_name
      FROM whatsapp_logs wl
      LEFT JOIN clients c ON wl.client_id = c.id
      WHERE wl.tenant_id = ?
      ORDER BY wl.created_at DESC
      LIMIT 100
    `, [tenantId]);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
