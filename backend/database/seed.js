const { query, get, run } = require('./db');
const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Inicializa dados essenciais padrão para um novo salão (templates de WhatsApp, especialidades e configurações)
 * Sem sujar a base com agendamentos, clientes, movimentações ou equipe fictícia.
 */
const initializeTenantDefaults = async (tenantId, salonData = {}) => {
  try {
    // 1. Especialidades & Funções Padrão
    const defaultSpecialties = [
      { name: 'Cabeleireira', category: 'Cabelo', icon: 'Scissors' },
      { name: 'Colorista', category: 'Cabelo', icon: 'Palette' },
      { name: 'Manicure', category: 'Unhas', icon: 'Sparkles' },
      { name: 'Pedicure', category: 'Unhas', icon: 'Sparkles' },
      { name: 'Nail Designer', category: 'Unhas', icon: 'Crown' },
      { name: 'Depiladora', category: 'Depilação & Pele', icon: 'Flame' },
      { name: 'Esteticista', category: 'Depilação & Pele', icon: 'Heart' },
      { name: 'Maquiadora', category: 'Olhar & Make', icon: 'Smile' },
      { name: 'Lash Designer', category: 'Olhar & Make', icon: 'Eye' },
      { name: 'Barbeiro', category: 'Barba & Corte', icon: 'Zap' },
      { name: 'Massoterapeuta', category: 'Bem-Estar', icon: 'Activity' }
    ];

    for (const spec of defaultSpecialties) {
      await run(`
        INSERT OR IGNORE INTO custom_specialties (name, category, icon, tenant_id)
        VALUES (?, ?, ?, ?)
      `, [spec.name, spec.category, spec.icon, tenantId]);
    }

    // 2. Modelos de WhatsApp Padrão
    const defaultTemplates = [
      {
        code: 'reminder_24h',
        title: 'Lembrete de Agendamento (24h antes)',
        body: 'Olá {cliente}! ✨ Passando para confirmar seu horário amanhã ({data} às {horario}) no {salao} para realizar: {servicos} com {profissional}. Podemos confirmar? Responda com SIM para confirmar!'
      },
      {
        code: 'reminder_2h',
        title: 'Lembrete Imediato (2h antes)',
        body: 'Oi {cliente}! Seu horário no {salao} está chegando: hoje às {horario} com {profissional}. Estamos preparando tudo com muito carinho para receber você! 💇‍♀️💅'
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
        title: 'Agradecimento Pós-Atendimento & Fidelidade',
        body: 'Olá {cliente}! Foi maravilhoso cuidar de você hoje no {salao}. Você acumulou pontos no nosso Programa Fidelidade! 💖 Esperamos vê-la(o) novamente em breve.'
      }
    ];

    for (const t of defaultTemplates) {
      await run(`
        INSERT OR IGNORE INTO whatsapp_templates (code, title, body, active, tenant_id)
        VALUES (?, ?, ?, 1, ?)
      `, [t.code, t.title, t.body, tenantId]);
    }

    // 3. Configurações Iniciais do Salão
    const defaultSettings = [
      ['salon_name', salonData.name || 'Meu Salão & Studio'],
      ['salon_phone', salonData.ownerPhone || ''],
      ['salon_address', salonData.address || ''],
      ['salon_cnpj', salonData.document || ''],
      ['loyalty_rate_reais_per_point', '10']
    ];

    for (const [key, val] of defaultSettings) {
      await run(`INSERT OR IGNORE INTO settings (key, value, tenant_id) VALUES (?, ?, ?)`, [key, val, tenantId]);
    }

  } catch (error) {
    console.error(`❌ Erro ao inicializar configurações padrão do tenant ${tenantId}:`, error.message);
  }
};

/**
 * Rotina de inicialização limpa executada ao subir o servidor.
 * Mantém apenas o Super Admin Master da plataforma e nunca reinsere dados demo sujos.
 */
const seedData = async () => {
  try {
    // 1. Garantir Super Admin Master Oficial para rafael.gielow@gmail.com
    const masterEmail = 'rafael.gielow@gmail.com';
    const existingMaster = await get(`SELECT id FROM tenants WHERE owner_email = ?`, [masterEmail]);
    
    if (!existingMaster) {
      const masterPassHash = hashPassword('Master@2026!');
      await run(`
        INSERT INTO tenants (
          id, name, document, plan, subscription_status, subscription_expires_at,
          max_users, owner_email, owner_password, owner_name, owner_phone,
          is_master, is_exempt, active
        ) VALUES (
          'tenant_master_platform', 'BellaGestão Plataforma Master', '00.000.000/0001-00',
          'PREMIER', 'exempt', '2099-12-31 23:59:59',
          999, ?, ?, 'Rafael Gielow', '(11) 99999-9999',
          1, 1, 1
        )
      `, [masterEmail, masterPassHash]);
      console.log('👑 Super Admin Master Oficial registrado:', masterEmail);
    } else {
      await run(`
        UPDATE tenants 
        SET is_master = 1, is_exempt = 1, plan = 'PREMIER', subscription_status = 'exempt', 
            subscription_expires_at = '2099-12-31 23:59:59', active = 1 
        WHERE owner_email = ?
      `, [masterEmail]);
    }

    // 2. Garantir perfil do Master na equipe de seu tenant
    const masterProf = await get(`SELECT id FROM professionals WHERE email = ? AND tenant_id = 'tenant_master_platform'`, [masterEmail]);
    if (!masterProf) {
      const masterPassHash = hashPassword('Master@2026!');
      await run(`
        INSERT INTO professionals (
          name, nickname, role, access_level, subtypes, phone, email, password,
          pin_code, color_hex, specialties, default_commission_type, default_commission_value,
          active, tenant_id
        ) VALUES (
          'Rafael Gielow', 'Rafael', 'Super Admin Master', 'ADMIN',
          '["Gestão"]', '(11) 99999-9999', ?, ?, '1234', '#6366f1',
          '["Gestão", "Administração"]', 'percentage', 100.0, 1, 'tenant_master_platform'
        )
      `, [masterEmail, masterPassHash]);
    }

    // 3. Garantir especialidades e templates no tenant padrão e master
    await initializeTenantDefaults('tenant_default_salao', {
      name: 'BellaGestão Studio & Estética',
      address: 'Av. Paulista, 1000'
    });
    await initializeTenantDefaults('tenant_master_platform', {
      name: 'BellaGestão Plataforma Master',
      address: 'Studio Central'
    });
  } catch (error) {
    console.error('❌ Erro no seed de dados master:', error);
  }
};

module.exports = { seedData, initializeTenantDefaults, hashPassword };
