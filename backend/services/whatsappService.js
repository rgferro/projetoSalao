const { query, get, run } = require('../database/db');
const QRCode = require('qrcode');

class WhatsAppService {
  constructor() {
    this.status = 'connected'; // 'connected', 'qr_ready', 'disconnected'
    this.sessionQr = null;
    this.init();
  }

  async init() {
    try {
      // Gera QR code padrão inicial para simulação/conexão local
      const qrPayload = `BELLASTUDIO_WA_LOCAL_${Date.now()}`;
      this.sessionQr = await QRCode.toDataURL(qrPayload);
    } catch (e) {
      console.error('Erro ao gerar QR Code inicial do WhatsApp:', e);
    }
  }

  async getStatus() {
    const settingStatus = await get("SELECT value FROM settings WHERE key = 'whatsapp_status'");
    return {
      status: settingStatus ? settingStatus.value : this.status,
      qrCode: this.sessionQr,
      lastCheck: new Date().toISOString()
    };
  }

  async setStatus(status) {
    this.status = status;
    await run("INSERT OR REPLACE INTO settings (key, value) VALUES ('whatsapp_status', ?)", [status]);
    return this.getStatus();
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
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length === 10 || digits.length === 11) {
      return `55${digits}`;
    }
    return digits;
  }

  generateWaLink(phone, messageText) {
    const cleanPhone = this.sanitizePhone(phone);
    const encodedText = encodeURIComponent(messageText);
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }

  async logMessage(clientId, phone, messageType, content, status = 'enviado', error = null) {
    return await run(
      `INSERT INTO whatsapp_logs (client_id, phone, message_type, content, status, error_message, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
      [clientId, phone, messageType, content, status, error]
    );
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

    const confirmationLink = `http://localhost:3000/confirm/${appointment.id}`;

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

    const waLink = this.generateWaLink(appointment.client_phone, messageText);

    // Registra na fila/log
    await this.logMessage(appointment.client_id, appointment.client_phone, type, messageText, 'enviado');

    return {
      success: true,
      messageText,
      waLink,
      phone: appointment.client_phone
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

    const waLink = this.generateWaLink(client.phone, messageText);
    await this.logMessage(client.id, client.phone, 'welcome', messageText, 'enviado');

    return { success: true, messageText, waLink };
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

    const waLink = this.generateWaLink(client.phone, messageText);
    await this.logMessage(client.id, client.phone, 'birthday', messageText, 'enviado');

    return { success: true, messageText, waLink };
  }
}

module.exports = new WhatsAppService();
