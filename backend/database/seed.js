const { db, initDb, query, run, get } = require('./db');

const seedData = async () => {
  await initDb();

  const countProf = await get('SELECT count(*) as count FROM professionals');
  if (countProf.count > 0) {
    console.log('ℹ️ Banco de dados já contém registros. Pulando seed inicial.');
    return;
  }

  console.log('🌱 Iniciando carga de dados iniciais no SQLite...');

  // 1. Configurações Gerais
  const defaultSettings = [
    ['salon_name', 'Studio Bella & Estética'],
    ['salon_phone', '(11) 98765-4321'],
    ['salon_email', 'contato@bellastudio.com.br'],
    ['salon_address', 'Av. Paulista, 1500 - Sala 304, Bela Vista - São Paulo/SP'],
    ['salon_cnpj', '12.345.678/0001-90'],
    ['pix_key', '12345678000190'],
    ['pix_key_type', 'CNPJ'],
    ['theme_mode', 'light'],
    ['auto_backup_enabled', '1'],
    ['auto_backup_frequency', 'daily'], // 'daily', 'on_close', 'weekly'
    ['gdrive_sync_enabled', '0'],
    ['gdrive_folder_name', 'Backup_BellaStudio'],
    ['gdrive_client_id', ''],
    ['gdrive_client_secret', ''],
    ['gdrive_refresh_token', ''],
    ['whatsapp_status', 'ready'],
    ['whatsapp_auto_reminder_24h', '1'],
    ['whatsapp_auto_reminder_2h', '1'],
    ['whatsapp_auto_welcome', '1'],
    ['whatsapp_auto_birthday', '1']
  ];

  for (const [k, v] of defaultSettings) {
    await run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [k, v]);
  }

  // 2. Modelos de WhatsApp
  const templates = [
    [
      'reminder_24h',
      'Lembrete 24h Antes',
      'Olá, *{cliente}*! ✨ Lembramos do seu agendamento amanhã ({data}) às *{horario}* no *{salao}*.\n\n💆 *Serviços:* {servicos}\n👤 *Profissional:* {profissional}\n📍 *Local:* {endereco}\n\nPor favor, confirme respondendo *SIM* ou acesse: {link_confirmacao}'
    ],
    [
      'reminder_2h',
      'Lembrete 2h Antes',
      'Olá, *{cliente}*! ⏰ Seu atendimento no *{salao}* será hoje às *{horario}* ({servicos}).\nEstamos te aguardando com muito carinho!'
    ],
    [
      'welcome',
      'Boas-Vindas ao Cliente',
      'Olá, *{cliente}*! Seja muito bem-vindo(a) ao *{salao}*! 💖\nÉ uma alegria ter você conosco. Estamos sempre prontos para realçar ainda mais a sua beleza!'
    ],
    [
      'birthday',
      'Felicitações de Aniversário',
      'Parabéns, *{cliente}*! 🎂🎉\nO *{salao}* deseja um ano repleto de realizações, saúde e beleza!\n\n🎁 Preparamos um presente para você: *15% OFF* em qualquer serviço durante este mês de aniversário. Venha comemorar conosco!'
    ],
    [
      'post_service',
      'Pesquisa de Satisfação Pós-Atendimento',
      'Olá, *{cliente}*! Esperamos que tenha amado sua experiência no *{salao}* hoje! ✨ Se puder avaliar nosso atendimento ou deixar seu feedback, ficaremos imensamente gratos.'
    ]
  ];

  for (const [code, title, body] of templates) {
    await run('INSERT INTO whatsapp_templates (code, title, body) VALUES (?, ?, ?)', [code, title, body]);
  }

  // 3. Profissionais
  const professionals = [
    {
      name: 'Ana Paula Ferreira',
      nickname: 'Ana Paula',
      phone: '(11) 98111-2233',
      email: 'anapaula@bellastudio.com',
      color_hex: '#ec4899', // Rosa
      specialties: JSON.stringify(['Cabelo', 'Maquiagem']),
      default_commission_type: 'percentage',
      default_commission_value: 50.0,
      work_schedule: JSON.stringify({
        mon: { active: false },
        tue: { active: true, start: '09:00', end: '19:00' },
        wed: { active: true, start: '09:00', end: '19:00' },
        thu: { active: true, start: '09:00', end: '19:00' },
        fri: { active: true, start: '09:00', end: '20:00' },
        sat: { active: true, start: '08:30', end: '19:00' },
        sun: { active: false }
      })
    },
    {
      name: 'Camila Silva Santos',
      nickname: 'Camila Nails',
      phone: '(11) 98222-3344',
      email: 'camila@bellastudio.com',
      color_hex: '#8b5cf6', // Roxo
      specialties: JSON.stringify(['Manicure']),
      default_commission_type: 'percentage',
      default_commission_value: 60.0,
      work_schedule: JSON.stringify({
        mon: { active: false },
        tue: { active: true, start: '09:00', end: '18:30' },
        wed: { active: true, start: '09:00', end: '18:30' },
        thu: { active: true, start: '09:00', end: '18:30' },
        fri: { active: true, start: '09:00', end: '19:30' },
        sat: { active: true, start: '08:30', end: '18:30' },
        sun: { active: false }
      })
    },
    {
      name: 'Juliana Rocha Lima',
      nickname: 'Ju Estética',
      phone: '(11) 98333-4455',
      email: 'juliana@bellastudio.com',
      color_hex: '#f59e0b', // Âmbar
      specialties: JSON.stringify(['Depilação']),
      default_commission_type: 'percentage',
      default_commission_value: 55.0,
      work_schedule: JSON.stringify({
        mon: { active: false },
        tue: { active: true, start: '09:00', end: '18:00' },
        wed: { active: true, start: '09:00', end: '18:00' },
        thu: { active: true, start: '09:00', end: '18:00' },
        fri: { active: true, start: '09:00', end: '19:00' },
        sat: { active: true, start: '09:00', end: '18:00' },
        sun: { active: false }
      })
    },
    {
      name: 'Beatriz Ramos Costa',
      nickname: 'Bia Make',
      phone: '(11) 98444-5566',
      email: 'beatriz@bellastudio.com',
      color_hex: '#10b981', // Esmeralda
      specialties: JSON.stringify(['Maquiagem', 'Cabelo']),
      default_commission_type: 'percentage',
      default_commission_value: 50.0,
      work_schedule: JSON.stringify({
        mon: { active: false },
        tue: { active: true, start: '10:00', end: '19:00' },
        wed: { active: true, start: '10:00', end: '19:00' },
        thu: { active: true, start: '10:00', end: '19:00' },
        fri: { active: true, start: '09:00', end: '20:00' },
        sat: { active: true, start: '08:00', end: '19:00' },
        sun: { active: false }
      })
    }
  ];

  const profIds = [];
  for (const p of professionals) {
    const res = await run(
      `INSERT INTO professionals (name, nickname, phone, email, color_hex, specialties, default_commission_type, default_commission_value, work_schedule)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.name, p.nickname, p.phone, p.email, p.color_hex, p.specialties, p.default_commission_type, p.default_commission_value, p.work_schedule]
    );
    profIds.push(res.lastID);
  }

  // 4. Catálogo de Serviços
  const services = [
    // Cabelo
    { name: 'Corte Feminino & Escova', category: 'Cabelo', price: 110.0, cost_price: 10.0, duration_min: 60, default_commission_type: 'percentage', default_commission_value: 50.0 },
    { name: 'Coloração Completa / Retoque', category: 'Cabelo', price: 190.0, cost_price: 35.0, duration_min: 90, default_commission_type: 'percentage', default_commission_value: 45.0 },
    { name: 'Mechas Criativas / Morena Iluminada', category: 'Cabelo', price: 380.0, cost_price: 60.0, duration_min: 210, default_commission_type: 'percentage', default_commission_value: 45.0 },
    { name: 'Cronograma Capilar / Nutrição Profunda', category: 'Cabelo', price: 130.0, cost_price: 25.0, duration_min: 60, default_commission_type: 'percentage', default_commission_value: 50.0 },
    { name: 'Escova Modelada', category: 'Cabelo', price: 65.0, cost_price: 5.0, duration_min: 45, default_commission_type: 'percentage', default_commission_value: 50.0 },

    // Manicure & Pedicure
    { name: 'Manicure Tradicional', category: 'Manicure', price: 35.0, cost_price: 3.0, duration_min: 40, default_commission_type: 'percentage', default_commission_value: 60.0 },
    { name: 'Pedicure Completa com Esfoliação', category: 'Manicure', price: 45.0, cost_price: 4.0, duration_min: 45, default_commission_type: 'percentage', default_commission_value: 60.0 },
    { name: 'Combo Pé e Mão Tradicional', category: 'Manicure', price: 75.0, cost_price: 7.0, duration_min: 80, default_commission_type: 'percentage', default_commission_value: 60.0 },
    { name: 'Alongamento em Fibra / Gel', category: 'Manicure', price: 180.0, cost_price: 25.0, duration_min: 120, default_commission_type: 'percentage', default_commission_value: 55.0 },
    { name: 'Manutenção Alongamento Gel', category: 'Manicure', price: 110.0, cost_price: 15.0, duration_min: 90, default_commission_type: 'percentage', default_commission_value: 55.0 },
    { name: 'Esmaltação em Gel', category: 'Manicure', price: 65.0, cost_price: 8.0, duration_min: 50, default_commission_type: 'percentage', default_commission_value: 60.0 },

    // Depilação
    { name: 'Depilação Buço & Queixo', category: 'Depilação', price: 30.0, cost_price: 3.0, duration_min: 20, default_commission_type: 'percentage', default_commission_value: 55.0 },
    { name: 'Depilação Axilas (Cera Morna)', category: 'Depilação', price: 35.0, cost_price: 4.0, duration_min: 20, default_commission_type: 'percentage', default_commission_value: 55.0 },
    { name: 'Depilação Pernas Inteiras', category: 'Depilação', price: 85.0, cost_price: 10.0, duration_min: 50, default_commission_type: 'percentage', default_commission_value: 55.0 },
    { name: 'Depilação Íntima Completa / Virilha Total', category: 'Depilação', price: 80.0, cost_price: 8.0, duration_min: 45, default_commission_type: 'percentage', default_commission_value: 55.0 },

    // Maquiagem & Sobrancelhas
    { name: 'Design de Sobrancelhas com Henna', category: 'Maquiagem', price: 55.0, cost_price: 5.0, duration_min: 35, default_commission_type: 'percentage', default_commission_value: 50.0 },
    { name: 'Maquiagem Social Glam', category: 'Maquiagem', price: 160.0, cost_price: 20.0, duration_min: 60, default_commission_type: 'percentage', default_commission_value: 50.0 },
    { name: 'Produção Completa Madrinha / Formanda', category: 'Maquiagem', price: 320.0, cost_price: 30.0, duration_min: 120, default_commission_type: 'percentage', default_commission_value: 50.0 }
  ];

  const serviceIds = [];
  for (const s of services) {
    const res = await run(
      `INSERT INTO services (name, category, price, cost_price, duration_min, default_commission_type, default_commission_value)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [s.name, s.category, s.price, s.cost_price, s.duration_min, s.default_commission_type, s.default_commission_value]
    );
    serviceIds.push(res.lastID);
  }

  // 5. Clientes e Fichas de Anamnese Especializada
  const clientsData = [
    {
      name: 'Mariana Duarte Santos',
      phone: '(11) 99111-8899',
      email: 'mariana.duarte@email.com',
      birthdate: '1992-08-20',
      cpf: '234.567.890-11',
      address: 'Rua Bela Cintra, 450 - Jardins, São Paulo/SP',
      notes: 'Gosta de café expresso sem açúcar. Prefere atendimento pontual.',
      loyalty_points: 120,
      anamnesis: {
        hair_type: 'Ondulado 2B, Fio fino e descolorido',
        hair_chemical_history: 'Luzes com pó descolorante OX 30 e matização 9.89 a cada 4 meses',
        hair_color_formula: 'Igora Royal 9-98 + 9-1 (1:1) com OX 20 vol',
        hair_sensitivities: 'Couro cabeludo levemente sensível a produtos com álcool',
        hair_preferred_cut: 'Corte em camadas suaves, mantendo comprimento longo',
        waxing_skin_type: 'Fototipo II, sensível',
        waxing_allergies: 'Nenhuma alergia relatada',
        waxing_folliculitis_history: 'Leve tendência na virilha; usar loção calmante pós-cera',
        waxing_preferred_method: 'Cera morna hipoalergênica de camomila',
        waxing_restrictions: 'Não usar produtos com fragrâncias fortes logo após a sessão',
        nails_shape_preferences: 'Formato Amendoadas / Esmalte tons nudes e vermelhos fechados',
        nails_gel_allergy: 'Não possui alergia',
        makeup_skin_type: 'Mista a oleosa na zona T',
        makeup_restrictions: 'Usar blindagem para fixação; sem produtos comedogênicos',
        general_observations: 'Cliente assídua há mais de 1 ano.'
      }
    },
    {
      name: 'Fernanda Caroline Ribeiro',
      phone: '(11) 99222-7766',
      email: 'fernanda.ribeiro@email.com',
      birthdate: '1988-04-12',
      cpf: '345.678.901-22',
      address: 'Alameda Santos, 820 - Cerqueira César, São Paulo/SP',
      notes: 'Adora nail art minimalista.',
      loyalty_points: 75,
      anamnesis: {
        hair_type: 'Liso 1B, Fio médio e natural',
        hair_chemical_history: 'Cabelo 100% natural, sem química prévia',
        hair_color_formula: 'N/A',
        hair_sensitivities: 'Nenhuma',
        hair_preferred_cut: 'Chanel de bico moderno',
        waxing_skin_type: 'Fototipo III',
        waxing_allergies: 'Alergia a cera de mel pura (usar cera de chocolate branco)',
        waxing_folliculitis_history: 'Sem histórico',
        waxing_preferred_method: 'Cera morna elastica',
        waxing_restrictions: 'Nenhuma restrição adicional',
        nails_shape_preferences: 'Quadrada com cantos arredondados, alongamento em gel',
        nails_gel_allergy: 'Sem alergias a monômeros/gel',
        makeup_skin_type: 'Seca / Precisa de hidratação pré-make reforçada',
        makeup_restrictions: 'Evitar pó solto em excesso abaixo dos olhos',
        general_observations: 'Cliente super pontual e comunicativa.'
      }
    },
    {
      name: 'Patrícia Helena Moura',
      phone: '(11) 99333-6655',
      email: 'patricia.moura@email.com',
      birthdate: '1995-11-05',
      cpf: '456.789.012-33',
      address: 'Rua Augusta, 1200 - Consolação, São Paulo/SP',
      notes: 'Noiva! Casamento agendado para novembro.',
      loyalty_points: 250,
      anamnesis: {
        hair_type: 'Cacheado 3A, volumoso e hidratado',
        hair_chemical_history: 'Mechas caramelo sutis',
        hair_color_formula: 'Wella Blondor + Color Touch 7/73',
        hair_sensitivities: 'Nenhuma sensibilidade',
        hair_preferred_cut: 'Corte a seco em camadas para definir cachos',
        waxing_skin_type: 'Fototipo IV',
        waxing_allergies: 'Sem histórico',
        waxing_folliculitis_history: 'Indicação de esfoliação 48h antes',
        waxing_preferred_method: 'Roll-on para pernas e cera morna para áreas delicadas',
        waxing_restrictions: 'Nenhuma',
        nails_shape_preferences: 'Stiletto curto / Francesinha moderna e tons perolados',
        nails_gel_allergy: 'Não',
        makeup_skin_type: 'Normal / Viçosa',
        makeup_restrictions: 'Prefere acabamento Glow com contorno sutil',
        general_observations: 'Pacote de noiva completo em andamento.'
      }
    },
    {
      name: 'Camila Nogueira Torres',
      phone: '(11) 99444-5544',
      email: 'camila.torres@email.com',
      birthdate: '1990-08-14', // Hoje é o aniversário dela!
      cpf: '567.890.123-44',
      address: 'Rua Oscar Freire, 910 - Pinheiros, São Paulo/SP',
      notes: 'Aniversariante hoje! Enviar mensagem e cupom de parabéns.',
      loyalty_points: 90,
      anamnesis: {
        hair_type: 'Ondulado 2A, fino',
        hair_chemical_history: 'Escova progressiva orgânica sem formol',
        hair_color_formula: 'Castanho iluminado 6.7',
        hair_sensitivities: 'Sem queixas',
        hair_preferred_cut: 'Long Bob reto',
        waxing_skin_type: 'Sensível, fototipo II',
        waxing_allergies: 'Sensibilidade a álcool e fragrâncias',
        waxing_folliculitis_history: 'Leve na região da virilha',
        waxing_preferred_method: 'Cera vegetal hipoalergênica',
        waxing_restrictions: 'Evitar sol por 48 horas após',
        nails_shape_preferences: 'Unhas curtas e esmalte preto ou vinho',
        nails_gel_allergy: 'Não usa gel, apenas tradicional',
        makeup_skin_type: 'Oleosa com poros dilatados',
        makeup_restrictions: 'Usar primer matificante e bruma fixadora',
        general_observations: 'Gosta de agendar nos finais de tarde.'
      }
    }
  ];

  const clientIds = [];
  for (const c of clientsData) {
    const res = await run(
      `INSERT INTO clients (name, phone, email, birthdate, cpf, address, notes, loyalty_points)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.name, c.phone, c.email, c.birthdate, c.cpf, c.address, c.notes, c.loyalty_points]
    );
    const cid = res.lastID;
    clientIds.push(cid);

    const a = c.anamnesis;
    await run(
      `INSERT INTO anamnesis (
        client_id, hair_type, hair_chemical_history, hair_color_formula, hair_sensitivities, hair_preferred_cut,
        waxing_skin_type, waxing_allergies, waxing_folliculitis_history, waxing_preferred_method, waxing_restrictions,
        nails_shape_preferences, nails_gel_allergy, makeup_skin_type, makeup_restrictions, general_observations
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cid, a.hair_type, a.hair_chemical_history, a.hair_color_formula, a.hair_sensitivities, a.hair_preferred_cut,
        a.waxing_skin_type, a.waxing_allergies, a.waxing_folliculitis_history, a.waxing_preferred_method, a.waxing_restrictions,
        a.nails_shape_preferences, a.nails_gel_allergy, a.makeup_skin_type, a.makeup_restrictions, a.general_observations
      ]
    );
  }

  // 6. Sessão de Caixa Diário Atual
  const cashRes = await run(
    `INSERT INTO cash_registers (opened_at, initial_balance, system_balance, status, opened_by, notes)
     VALUES (datetime('now', 'localtime'), 150.0, 150.0, 'aberto', 'Recepção (Mariana)', 'Caixa aberto com troco inicial padrão')`
  );
  const currentCashId = cashRes.lastID;

  await run(
    `INSERT INTO cash_movements (cash_register_id, type, amount, payment_method, description)
     VALUES (?, 'abertura', 150.0, 'dinheiro', 'Fundo de troco inicial do caixa')`,
    [currentCashId]
  );

  // 7. Agendamentos de Exemplo para Hoje (Multisserviços)
  const todayStr = new Date().toISOString().split('T')[0];

  // Agendamento 1: Mariana Duarte (Corte + Manicure)
  const app1 = await run(
    `INSERT INTO appointments (client_id, date, status, total_price, total_duration_min, notes)
     VALUES (?, ?, 'confirmado', 145.0, 100, 'Cliente solicitou café e confirmação por WhatsApp.')`,
    [clientIds[0], todayStr]
  );
  await run(
    `INSERT INTO appointment_items (appointment_id, service_id, professional_id, start_time, end_time, price, commission_type, commission_value, commission_amount, status)
     VALUES (?, ?, ?, '09:30', '10:30', 110.0, 'percentage', 50.0, 55.0, 'confirmado')`,
    [app1.lastID, serviceIds[0], profIds[0]] // Corte Feminino com Ana Paula
  );
  await run(
    `INSERT INTO appointment_items (appointment_id, service_id, professional_id, start_time, end_time, price, commission_type, commission_value, commission_amount, status)
     VALUES (?, ?, ?, '10:30', '11:10', 35.0, 'percentage', 60.0, 21.0, 'confirmado')`,
    [app1.lastID, serviceIds[5], profIds[1]] // Manicure com Camila Silva
  );

  // Agendamento 2: Fernanda Ribeiro (Depilação Completa)
  const app2 = await run(
    `INSERT INTO appointments (client_id, date, status, total_price, total_duration_min, notes)
     VALUES (?, ?, 'em_atendimento', 115.0, 65, 'Em atendimento na cabine 2.')`,
    [clientIds[1], todayStr]
  );
  await run(
    `INSERT INTO appointment_items (appointment_id, service_id, professional_id, start_time, end_time, price, commission_type, commission_value, commission_amount, status)
     VALUES (?, ?, ?, '14:00', '14:45', 80.0, 'percentage', 55.0, 44.0, 'em_atendimento')`,
    [app2.lastID, serviceIds[13], profIds[2]] // Depilação Íntima com Juliana
  );
  await run(
    `INSERT INTO appointment_items (appointment_id, service_id, professional_id, start_time, end_time, price, commission_type, commission_value, commission_amount, status)
     VALUES (?, ?, ?, '14:45', '15:05', 35.0, 'percentage', 55.0, 19.25, 'em_atendimento')`,
    [app2.lastID, serviceIds[11], profIds[2]] // Depilação Axilas com Juliana
  );

  // Agendamento 3: Patrícia Helena (Maquiagem Social + Sobrancelha) - Concluído e faturado
  const app3 = await run(
    `INSERT INTO appointments (client_id, date, status, total_price, total_duration_min, notes)
     VALUES (?, ?, 'concluido', 215.0, 95, 'Cliente amou o resultado!')`,
    [clientIds[2], todayStr]
  );
  await run(
    `INSERT INTO appointment_items (appointment_id, service_id, professional_id, start_time, end_time, price, commission_type, commission_value, commission_amount, status)
     VALUES (?, ?, ?, '11:00', '12:00', 160.0, 'percentage', 50.0, 80.0, 'concluido')`,
    [app3.lastID, serviceIds[15], profIds[3]] // Make Social com Beatriz
  );
  await run(
    `INSERT INTO appointment_items (appointment_id, service_id, professional_id, start_time, end_time, price, commission_type, commission_value, commission_amount, status)
     VALUES (?, ?, ?, '12:00', '12:35', 55.0, 'percentage', 50.0, 27.5, 'concluido')`,
    [app3.lastID, serviceIds[14], profIds[3]] // Design Sobrancelhas com Beatriz
  );

  // Lançar Venda Concluída no Financeiro e no Caixa
  await run(
    `INSERT INTO financial_transactions (type, category, description, amount, payment_method, due_date, payment_date, status, client_id, appointment_id, cash_register_id)
     VALUES ('receita', 'Serviços', 'Atendimento #3 - Patrícia Moura (Make + Sobrancelhas)', 215.0, 'pix', ?, ?, 'pago', ?, ?, ?)`,
    [todayStr, todayStr, clientIds[2], app3.lastID, currentCashId]
  );
  await run(
    `INSERT INTO cash_movements (cash_register_id, type, amount, payment_method, description)
     VALUES (?, 'venda', 215.0, 'pix', 'Recebimento Atendimento #3 - Patrícia Moura')`,
    [currentCashId]
  );
  await run(
    `UPDATE cash_registers SET system_balance = system_balance + 215.0 WHERE id = ?`,
    [currentCashId]
  );

  // 8. Bloqueios de Horários de Exemplo
  await run(
    `INSERT INTO time_blocks (professional_id, date, start_time, end_time, reason)
     VALUES (?, ?, '12:30', '13:30', 'Almoço e Intervalo')`,
    [profIds[0], todayStr]
  );
  await run(
    `INSERT INTO time_blocks (professional_id, date, start_time, end_time, reason)
     VALUES (?, ?, '13:00', '14:00', 'Intervalo Almoço')`,
    [profIds[1], todayStr]
  );

  // 9. Contas a Pagar e a Receber de Exemplo
  await run(
    `INSERT INTO financial_transactions (type, category, description, amount, payment_method, due_date, status)
     VALUES ('despesa', 'Aluguel', 'Aluguel do Salão - Sala Comercial', 2800.0, 'boleto', ?, 'pendente')`,
    [todayStr]
  );
  await run(
    `INSERT INTO financial_transactions (type, category, description, amount, payment_method, due_date, payment_date, status)
     VALUES ('despesa', 'Energia/Água', 'Conta de Energia Enel', 485.50, 'pix', ?, ?, 'pago')`,
    [todayStr, todayStr]
  );
  await run(
    `INSERT INTO financial_transactions (type, category, description, amount, payment_method, due_date, status)
     VALUES ('despesa', 'Produtos', 'Reposição de Esmaltes e Géis Coleção Verão', 340.0, 'cartao_credito', ?, 'pendente')`,
    [todayStr]
  );

  console.log('✅ Carga de dados iniciais (Seed) concluída com sucesso!');
};

if (require.main === module) {
  seedData()
    .then(() => {
      console.log('🏁 Seed executado!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Erro no seed:', err);
      process.exit(1);
    });
}

module.exports = { seedData };
