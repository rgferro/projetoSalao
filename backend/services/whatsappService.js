const { query, get, run } = require('../database/db');

const DAEMON_URL = 'http://127.0.0.1:3005';

class WhatsAppService {
  async getStatus() {
    try {
      const response = await fetch(`${DAEMON_URL}/status`, { signal: AbortSignal.timeout(3000) });
      if (response.ok) {
        const data = await response.json();
        return {
          status: data.status,
          qrCode: data.qr,
          user: data.user,
          daemonOnline: true,
          lastCheck: new Date().toISOString()
        };
      }
    } catch (e) {
      // Daemon pode estar iniciando
    }

    return {
      status: 'CONNECTING',
      qrCode: null,
      user: null,
      daemonOnline: false,
      lastCheck: new Date().toISOString()
    };
  }

  formatMessage(templateBody, variables) {
    let msg = templateBody;
    for (const [key, val] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      msg = msg.replace(regex, val || '');
    }
    return msg;
  }

  sanitizePhone(phone) {
    let digits = String(phone).replace(/\D/g, '');
    if (digits.length === 10 || digits.length === 11) {
      digits = `55${digits}`;
    }
    return digits;
  }

  generateWaLink(phone, text = '') {
    const cleanPhone = this.sanitizePhone(phone);
    const encoded = encodeURIComponent(text);
    return `https://wa.me/${cleanPhone}${encoded ? `?text=${encoded}` : ''}`;
  }

  async logMessage(clientId, phone, messageType, content, status = 'enviado', error = null) {
    return await run(
      `INSERT INTO whatsapp_logs (client_id, phone, message_type, content, status, error_message, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
      [clientId, phone, messageType, content, status, error]
    );
  }

  /**
   * Disparo 100% silencioso e em segundo plano via Daemon Baileys
   */
  async sendMessage(phone, message, clientId = null, messageType = 'custom') {
    const cleanPhone = this.sanitizePhone(phone);

    try {
      const response = await fetch(`${DAEMON_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, message }),
        signal: AbortSignal.timeout(15000)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errMsg = data.error || `Erro ${response.status}: falha no daemon`;
        await this.logMessage(clientId, cleanPhone, messageType, message, 'erro', errMsg);
        throw new Error(errMsg);
      }

      await this.logMessage(clientId, cleanPhone, messageType, message, 'enviado');

      return {
        success: true,
        messageId: data.messageId,
        phone: cleanPhone,
        messageText: message
      };
    } catch (err) {
      await this.logMessage(clientId, cleanPhone, messageType, message, 'erro', err.message);
      throw err;
    }
  }

  async sendAppointmentReminder(appointmentId, type = 'reminder_24h') {
    const appointment = await get(
      `SELECT a.*, c.name as client_name, c.phone as client_phone
       FROM appointments a
       JOIN clients c ON a.client_id = c.id
       WHERE a.id = ?`,
      [appointmentId]
    );

    if (!appointment) throw new Error('Agendamento não encontrado');

    const items = await query(
      `SELECT ai.*, s.name as service_name, p.nickname as prof_nickname, p.name as prof_name
       FROM appointment_items ai
       JOIN services s ON ai.service_id = s.id
       JOIN professionals p ON ai.professional_id = p.id
       WHERE ai.appointment_id = ?`,
      [appointmentId]
    );

    const template = await get('SELECT * FROM whatsapp_templates WHERE code = ?', [type]);
    if (!template || !template.active) return null;

    const salonName = (await get("SELECT value FROM settings WHERE key = 'salon_name'"))?.value || 'Studio Bella';
    const salonAddress = (await get("SELECT value FROM settings WHERE key = 'salon_address'"))?.value || 'Nosso Salão';

    const servicesStr = items.map(i => i.service_name).join(', ');
    const profsStr = [...new Set(items.map(i => i.prof_nickname || i.prof_name))].join(', ');
    const startTime = items.length > 0 ? items[0].start_time : '09:00';

    const confirmationLink = `http://localhost:3001/confirm/${appointment.id}`;
    const formattedDate = appointment.date.split('-').reverse().join('/');

    const messageText = this.formatMessage(template.body, {
      cliente: appointment.client_name,
      data: formattedDate,
      horario: startTime,
      salao: salonName,
      servicos: servicesStr,
      profissional: profsStr,
      endereco: salonAddress,
      link_confirmacao: confirmationLink
    });

    // Enviar silenciosamente em segundo plano
    const sendResult = await this.sendMessage(appointment.client_phone, messageText, appointment.client_id, type);

    return {
      ...sendResult,
      clientName: appointment.client_name
    };
  }

  async sendWelcome(clientId) {
    const client = await get('SELECT * FROM clients WHERE id = ?', [clientId]);
    if (!client) throw new Error('Cliente não encontrado');

    const template = await get("SELECT * FROM whatsapp_templates WHERE code = 'welcome'");
    if (!template || !template.active) return null;

    const salonName = (await get("SELECT value FROM settings WHERE key = 'salon_name'"))?.value || 'Studio Bella';

    const messageText = this.formatMessage(template.body, {
      cliente: client.name,
      salao: salonName
    });

    const sendResult = await this.sendMessage(client.phone, messageText, client.id, 'welcome');
    return sendResult;
  }

  async sendBirthday(clientId) {
    const client = await get('SELECT * FROM clients WHERE id = ?', [clientId]);
    if (!client) throw new Error('Cliente não encontrado');

    const template = await get("SELECT * FROM whatsapp_templates WHERE code = 'birthday'");
    if (!template || !template.active) return null;

    const salonName = (await get("SELECT value FROM settings WHERE key = 'salon_name'"))?.value || 'Studio Bella';

    const messageText = this.formatMessage(template.body, {
      cliente: client.name,
      salao: salonName
    });

    const sendResult = await this.sendMessage(client.phone, messageText, client.id, 'birthday');
    return sendResult;
  }

  async logout() {
    try {
      const res = await fetch(`${DAEMON_URL}/logout`, { method: 'POST' });
      return await res.json();
    } catch (e) {
      throw new Error('Falha ao desconectar WhatsApp do daemon');
    }
  }
}

module.exports = new WhatsAppService();
