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
const initializeTenantDefaults = async (tenantId, salonData = {}, segment = 'salao') => {
  try {
    // 1. Especialidades & Funções Padrão por Segmento
    let defaultSpecialties = [];

    if (segment === 'barbearia') {
      defaultSpecialties = [
        { name: 'Barbeiro Master', category: 'Barba & Corte', icon: 'Zap' },
        { name: 'Barbeiro Clássico', category: 'Barba & Corte', icon: 'Scissors' },
        { name: 'Colorista Masculino', category: 'Química & Barba', icon: 'Palette' },
        { name: 'Terapeuta Capilar', category: 'Tratamentos', icon: 'Activity' },
        { name: 'Recepcionista / Bar', category: 'Atendimento', icon: 'Smile' },
        { name: 'Tatuador', category: 'Arte & Estilo', icon: 'Flame' },
      ];
    } else if (segment === 'estetica') {
      defaultSpecialties = [
        { name: 'Esteticista Facial', category: 'Facial & Pele', icon: 'Sparkles' },
        { name: 'Esteticista Corporal', category: 'Corporal & Drenagem', icon: 'Heart' },
        { name: 'Biomédica / Harmonização', category: 'Injetáveis & Avançada', icon: 'Crown' },
        { name: 'Massoterapeuta', category: 'Bem-Estar & Spa', icon: 'Activity' },
        { name: 'Depiladora Laser', category: 'Depilação', icon: 'Flame' },
        { name: 'Nutricionista / Saúde', category: 'Consultoria', icon: 'Smile' },
      ];
    } else if (segment === 'esmalteria') {
      defaultSpecialties = [
        { name: 'Nail Designer Fibra', category: 'Alongamento', icon: 'Crown' },
        { name: 'Nail Designer Gel', category: 'Alongamento', icon: 'Sparkles' },
        { name: 'Manicure Tradicional', category: 'Unhas', icon: 'Scissors' },
        { name: 'Pedicure & Spa dos Pés', category: 'Unhas', icon: 'Sparkles' },
        { name: 'Nail Art & Decoração', category: 'Arte', icon: 'Palette' },
        { name: 'Podóloga', category: 'Saúde dos Pés', icon: 'Heart' },
      ];
    } else if (segment === 'lash') {
      defaultSpecialties = [
        { name: 'Lash Designer Master', category: 'Extensão de Cílios', icon: 'Eye' },
        { name: 'Volume Russo / Brasileiro', category: 'Extensão de Cílios', icon: 'Sparkles' },
        { name: 'Lash Lifting & Tintura', category: 'Cílios Naturais', icon: 'Heart' },
        { name: 'Designer de Sobrancelhas', category: 'Sobrancelhas', icon: 'Crown' },
        { name: 'Micropigmentadora', category: 'Sobrancelhas & Lábios', icon: 'Palette' },
        { name: 'Brow Lamination', category: 'Sobrancelhas', icon: 'Smile' },
      ];
    } else {
      // Salão de Beleza Padrão / Misto
      defaultSpecialties = [
        { name: 'Cabeleireira Master', category: 'Cabelo', icon: 'Scissors' },
        { name: 'Colorista & Mechas', category: 'Cabelo', icon: 'Palette' },
        { name: 'Terapeuta Capilar', category: 'Tratamentos', icon: 'Heart' },
        { name: 'Manicure & Pedicure', category: 'Unhas', icon: 'Sparkles' },
        { name: 'Nail Designer', category: 'Unhas', icon: 'Crown' },
        { name: 'Maquiadora Profissional', category: 'Olhar & Make', icon: 'Smile' },
        { name: 'Lash & Sobrancelhas', category: 'Olhar & Make', icon: 'Eye' },
        { name: 'Depiladora', category: 'Depilação', icon: 'Flame' },
        { name: 'Gestão & Recepção', category: 'Atendimento', icon: 'Zap' },
      ];
    }

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

    // 3. Configurações Iniciais do Salão / Empresa
    const defaultSettings = [
      ['salon_name', salonData.name || 'Meu Salão & Studio'],
      ['salon_phone', salonData.ownerPhone || ''],
      ['salon_address', salonData.address || ''],
      ['salon_cnpj', salonData.document || ''],
      ['salon_segment', segment || 'salao'],
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
          'tenant_master_platform', 'BelaGestão Plataforma Master', '00.000.000/0001-00',
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
      name: 'BelaGestão Studio & Estética',
      address: 'Av. Paulista, 1000'
    });
    await initializeTenantDefaults('tenant_master_platform', {
      name: 'BelaGestão Plataforma Master',
      address: 'Studio Central'
    });
  } catch (error) {
    console.error('❌ Erro no seed de dados master:', error);
  }
};

module.exports = { seedData, initializeTenantDefaults, hashPassword };
