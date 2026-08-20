const express = require('express');
const router = express.Router();
const { query, get, run } = require('../database/db');
const { sendContactEmail } = require('../services/brevoService');

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message, acceptTerms } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Nome, e-mail e mensagem são obrigatórios.' });
    }
    if (acceptTerms !== true) {
      return res.status(400).json({ error: 'Confirme a Política de Privacidade para enviar sua mensagem.' });
    }

    const id = `msg_${Date.now()}`;
    await run(`
      INSERT INTO contact_messages (id, name, email, phone, subject, message, status)
      VALUES (?, ?, ?, ?, ?, ?, 'UNREAD')
    `, [id, name, email, phone || null, subject || 'Dúvida sobre o BelaGestão Studio', message]);

    await sendContactEmail({
      name,
      senderEmail: email,
      phone,
      subject: subject || 'Contato via Site',
      message
    });

    res.json({ success: true, message: 'Mensagem enviada com sucesso! Em breve retornaremos.' });
  } catch (error) {
    console.error('Erro ao enviar contato:', error);
    res.status(500).json({ error: 'Erro ao processar mensagem.' });
  }
});

module.exports = router;
