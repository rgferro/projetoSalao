const { query, get, run } = require('../database/db');

const DAEMON_PORT = process.env.WHATSAPP_PORT || 3005;
const DAEMON_URL = process.env.WHATSAPP_DAEMON_URL || `http://127.0.0.1:${DAEMON_PORT}`;

class WhatsAppService {
  /**
   * Consulta status da sessão do WhatsApp exclusiva do salão / tenant
   */
  async getStatus(tenantId = 'tenant_default_salao') {
    const cleanTenant = tenantId || 'tenant_default_salao';
    try {
      const response = await fetch(`${DAEMON_URL}/status?tenant_id=${encodeURIComponent(cleanTenant)}`, { 
        headers: { 'x-tenant-id': cleanTenant },
        signal: AbortSignal.timeout(4000) 
      });

      if (response.ok) {
        const data = await response.json();
        return {
          tenantId: data.tenantId || cleanTenant,
          status: data.status || 'CONNECTING',
          qr: data.qr || null,
          qrCode: data.qr || null,
          qrCodeUrl: data.qr || null,
          user: data.user || null,
          lastConnectedAt: data.lastConnectedAt || null,
          daemonOnline: true,
          lastCheck: new Date().toISOString()
        };
      }
    } catch (e) {
      // Daemon pode estar iniciando
    }

    return {
      tenantId: cleanTenant,
      status: 'CONNECTING',
      qr: null,
      qrCode: null,
      qrCodeUrl: null,
      user: null,
      lastConnectedAt: null,
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

  async logMessage(clientId, phone, messageType, content, status = 'enviado', error = null, tenantId = 'tenant_default_salao') {
    const cleanTenant = tenantId || 'tenant_default_salao';
    return await run(
      `INSERT INTO whatsapp_logs (client_id, phone, message_type, content, status, error_message, tenant_id, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
      [clientId, phone, messageType, content, status, error, cleanTenant]
    );
  }

  /**
   * Disparo silencioso e em segundo plano via Daemon Baileys ou Fallback Instantâneo
   */
  async sendMessage(phone, message, clientId = null, messageType = 'custom', tenantId = 'tenant_default_salao') {
    const cleanPhone = this.sanitizePhone(phone);
    const cleanTenant = tenantId || 'tenant_default_salao';
    const waLink = this.generateWaLink(cleanPhone, message);

    try {
      const response = await fetch(`${DAEMON_URL}/send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-tenant-id': cleanTenant
        },
        body: JSON.stringify({ 
          tenant_id: cleanTenant, 
          phone: cleanPhone, 
          message 
        }),
        signal: AbortSignal.timeout(8000)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errMsg = data.error || `Erro ${response.status}: daemon offline`;
        await this.logMessage(clientId, cleanPhone, messageType, message, 'pendente_link', errMsg, cleanTenant);
        return {
          success: true,
          fallback: true,
          waLink,
          phone: cleanPhone,
          messageText: message,
          tenantId: cleanTenant
        };
      }

      await this.logMessage(clientId, cleanPhone, messageType, message, 'enviado', null, cleanTenant);

      return {
        success: true,
        messageId: data.messageId,
        waLink,
        phone: cleanPhone,
        messageText: message,
        tenantId: cleanTenant
      };
    } catch (err) {
      await this.logMessage(clientId, cleanPhone, messageType, message, 'pendente_link', err.message, cleanTenant);
      return {
        success: true,
        fallback: true,
        waLink,
        phone: cleanPhone,
        messageText: message,
        tenantId: cleanTenant
      };
    }
  }

  async sendAppointmentReminder(appointmentId, type = 'reminder_24h', tenantId = null) {
    let appointment;
    if (tenantId) {
      appointment = await get(
        `SELECT a.*, c.name as client_name, c.phone as client_phone
         FROM appointments a
         JOIN clients c ON a.client_id = c.id
         WHERE a.id = ? AND a.tenant_id = ?`,
        [appointmentId, tenantId]
      );
    } else {
      appointment = await get(
        `SELECT a.*, c.name as client_name, c.phone as client_phone
         FROM appointments a
         JOIN clients c ON a.client_id = c.id
         WHERE a.id = ?`,
        [appointmentId]
      );
    }

    if (!appointment) throw new Error('Agendamento não encontrado');

    const appTenantId = appointment.tenant_id || tenantId || 'tenant_default_salao';

    const items = await query(
      `SELECT ai.*, s.name as service_name, p.nickname as prof_nickname, p.name as prof_name
       FROM appointment_items ai
       JOIN services s ON ai.service_id = s.id
       JOIN professionals p ON ai.professional_id = p.id
       WHERE ai.appointment_id = ? AND ai.tenant_id = ?`,
      [appointmentId, appTenantId]
    );

    let template = await get('SELECT * FROM whatsapp_templates WHERE code = ? AND tenant_id = ?', [type, appTenantId]);
    if (!template) {
      template = await get('SELECT * FROM whatsapp_templates WHERE code = ? LIMIT 1', [type]);
    }
    if (!template || !template.active) return null;

    const tenantInfo = await get('SELECT name, street, number, city FROM tenants WHERE id = ?', [appTenantId]);
    const salonName = tenantInfo?.name || (await get("SELECT value FROM settings WHERE key = 'salon_name' AND tenant_id = ?", [appTenantId]))?.value || 'Studio Bella';
    const salonAddress = tenantInfo ? [tenantInfo.street, tenantInfo.number, tenantInfo.city].filter(Boolean).join(', ') : 'Nosso Salão';

    const servicesStr = items.map(i => i.service_name).join(', ');
    const profsStr = [...new Set(items.map(i => i.prof_nickname || i.prof_name))].join(', ');
    const startTime = items.length > 0 ? items[0].start_time : '09:00';

    const appUrl = process.env.APP_URL || 'https://belagestaostudio.com.br';
    const confirmationLink = `${appUrl}/confirm/${appointment.id}`;
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

    const sendResult = await this.sendMessage(appointment.client_phone, messageText, appointment.client_id, type, appTenantId);

    return {
      ...sendResult,
      clientName: appointment.client_name
    };
  }

  async sendWelcome(clientId, tenantId = null) {
    const client = await get('SELECT * FROM clients WHERE id = ?', [clientId]);
    if (!client) throw new Error('Cliente não encontrado');

    const clientTenantId = client.tenant_id || tenantId || 'tenant_default_salao';

    let template = await get("SELECT * FROM whatsapp_templates WHERE code = 'welcome' AND tenant_id = ?", [clientTenantId]);
    if (!template) {
      template = await get("SELECT * FROM whatsapp_templates WHERE code = 'welcome' LIMIT 1");
    }
    if (!template || !template.active) return null;

    const tenantInfo = await get('SELECT name FROM tenants WHERE id = ?', [clientTenantId]);
    const salonName = tenantInfo?.name || (await get("SELECT value FROM settings WHERE key = 'salon_name' AND tenant_id = ?", [clientTenantId]))?.value || 'Studio Bella';

    const messageText = this.formatMessage(template.body, {
      cliente: client.name,
      salao: salonName
    });

    return await this.sendMessage(client.phone, messageText, client.id, 'welcome', clientTenantId);
  }

  async sendBirthday(clientId, tenantId = null) {
    const client = await get('SELECT * FROM clients WHERE id = ?', [clientId]);
    if (!client) throw new Error('Cliente não encontrado');

    const clientTenantId = client.tenant_id || tenantId || 'tenant_default_salao';

    let template = await get("SELECT * FROM whatsapp_templates WHERE code = 'birthday' AND tenant_id = ?", [clientTenantId]);
    if (!template) {
      template = await get("SELECT * FROM whatsapp_templates WHERE code = 'birthday' LIMIT 1");
    }
    if (!template || !template.active) return null;

    const tenantInfo = await get('SELECT name FROM tenants WHERE id = ?', [clientTenantId]);
    const salonName = tenantInfo?.name || (await get("SELECT value FROM settings WHERE key = 'salon_name' AND tenant_id = ?", [clientTenantId]))?.value || 'Studio Bella';

    const messageText = this.formatMessage(template.body, {
      cliente: client.name,
      salao: salonName
    });

    return await this.sendMessage(client.phone, messageText, client.id, 'birthday', clientTenantId);
  }

  async logout(tenantId = 'tenant_default_salao') {
    const cleanTenant = tenantId || 'tenant_default_salao';
    try {
      const res = await fetch(`${DAEMON_URL}/logout`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: cleanTenant })
      });
      return await res.json();
    } catch (e) {
      return { success: true, message: 'Sessão desconectada', tenantId: cleanTenant };
    }
  }
}

module.exports = new WhatsAppService();
