const express = require('express');
const router = express.Router();
const { query, get, run } = require('../database/db');
const whatsappService = require('../services/whatsappService');

// Obter status e QR Code de conexão
router.get('/status', async (req, res) => {
  try {
    const status = await whatsappService.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Alternar status de simulação/conexão
router.post('/toggle-status', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await whatsappService.setStatus(status || 'connected');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar Modelos de Mensagens
router.get('/templates', async (req, res) => {
  try {
    const templates = await query('SELECT * FROM whatsapp_templates ORDER BY id ASC');
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar Modelo de Mensagem
router.put('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, active } = req.body;

    await run(
      `UPDATE whatsapp_templates 
       SET title = COALESCE(?, title), body = COALESCE(?, body), active = COALESCE(?, active), updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [title, body, active, id]
    );

    res.json({ message: 'Modelo de mensagem atualizado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disparar Lembrete Manual para um Agendamento
router.post('/send-reminder', async (req, res) => {
  try {
    const { appointment_id, type = 'reminder_24h' } = req.body;
    if (!appointment_id) return res.status(400).json({ error: 'ID do agendamento é obrigatório.' });

    const result = await whatsappService.sendAppointmentReminder(appointment_id, type);
    res.json({ message: 'Lembrete processado!', ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disparar Mensagem de Aniversário
router.post('/send-birthday', async (req, res) => {
  try {
    const { client_id } = req.body;
    if (!client_id) return res.status(400).json({ error: 'ID do cliente é obrigatório.' });

    const result = await whatsappService.sendBirthday(client_id);
    res.json({ message: 'Mensagem de aniversário processada!', ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disparo Livre de Mensagem via WhatsApp
router.post('/send-custom', async (req, res) => {
  try {
    const { client_id, phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ error: 'Telefone e mensagem são obrigatórios.' });

    const waLink = whatsappService.generateWaLink(phone, message);
    await whatsappService.logMessage(client_id || null, phone, 'custom', message, 'enviado');

    res.json({ message: 'Mensagem gerada com sucesso!', waLink });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Histórico de Mensagens Enviadas / Fila
router.get('/logs', async (req, res) => {
  try {
    const logs = await query(`
      SELECT wl.*, c.name as client_name
      FROM whatsapp_logs wl
      LEFT JOIN clients c ON wl.client_id = c.id
      ORDER BY wl.created_at DESC
      LIMIT 100
    `);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
