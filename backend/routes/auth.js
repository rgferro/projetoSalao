const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query, get, run } = require('../database/db');
const {
  validateCPF,
  validateCNPJ,
  validatePasswordStrength,
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken
} = require('../services/authService');
const {
  sendVerificationEmail,
  sendEmployeeInviteEmail,
  sendPasswordResetEmail
} = require('../services/brevoService');
const { initializeTenantDefaults } = require('../database/seed');

// 1. Enviar Código de Verificação por E-mail (Brevo REST API v3)
router.post('/send-code', async (req, res) => {
  try {
    const { email, salonName } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'E-mail inválido informado.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutos

    await run(`
      INSERT INTO email_verifications (email, code, expires_at)
      VALUES (?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET code = ?, expires_at = ?
    `, [cleanEmail, code, expiresAt, code, expiresAt]);

    await sendVerificationEmail(cleanEmail, code, salonName || 'BelaGestão Studio');

    res.json({
      success: true,
      message: 'Código de 6 dígitos enviado para seu e-mail.',
      expiresInMinutes: 15
    });
  } catch (error) {
    console.error('Erro ao enviar código de verificação:', error);
    res.status(500).json({ error: 'Falha ao despachar e-mail de verificação.' });
  }
});

// 2. Validar Código de 6 Dígitos
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'E-mail e código são obrigatórios.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const verification = await get(`SELECT * FROM email_verifications WHERE email = ?`, [cleanEmail]);

    if (!verification) {
      return res.status(400).json({ error: 'Código não encontrado. Solicite um novo código.' });
    }

    if (new Date(verification.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Código expirado. Solicite um novo código.' });
    }

    if (verification.code !== code.trim()) {
      return res.status(400).json({ error: 'Código incorreto. Confira os 6 dígitos recebidos.' });
    }

    res.json({ success: true, message: 'E-mail verificado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno ao validar código.' });
  }
});

// 3. Cadastro do Salão e Dono (Onboarding Multi-Tenant & Multi-Projeto)
router.post('/register', async (req, res) => {
  try {
    const {
      name, // Nome do Salão / Empresa / Projeto
      segment = 'salao', // salao, barbearia, estetica, esmalteria, lash
      document, // CPF ou CNPJ
      ownerName,
      ownerEmail,
      ownerPhone,
      password,
      code, // Código de 6 dígitos da Brevo
      cep,
      street,
      number,
      complement,
      neighborhood,
      city,
      state
    } = req.body;

    if (!name || !ownerName || !ownerEmail || !password) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
    }

    const cleanEmail = ownerEmail.trim().toLowerCase();

    // Validação de documento (se fornecido)
    if (document) {
      const cleanDoc = document.replace(/\D/g, '');
      if (cleanDoc.length === 11 && !validateCPF(cleanDoc)) {
        return res.status(400).json({ error: 'CPF informado é inválido.' });
      } else if (cleanDoc.length === 14 && !validateCNPJ(cleanDoc)) {
        return res.status(400).json({ error: 'CNPJ informado é inválido.' });
      }
    }

    // Validação de senha
    const strength = validatePasswordStrength(password);
    if (!strength.isValid) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
    }

    // Validar código de verificação (se código estiver preenchido)
    if (code) {
      const verification = await get(`SELECT * FROM email_verifications WHERE email = ?`, [cleanEmail]);
      if (!verification || verification.code !== code.trim()) {
        return res.status(400).json({ error: 'Código de confirmação de e-mail inválido.' });
      }
    }

    const isMasterEmail = cleanEmail === 'rafael.gielow@gmail.com';
    const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const hashedPassword = hashPassword(password);

    // Criar Tenant com o Segmento especificado
    await run(`
      INSERT INTO tenants (
        id, name, segment, document, plan, subscription_status, subscription_expires_at,
        max_users, owner_email, owner_password, owner_name, owner_phone,
        cep, street, number, complement, neighborhood, city, state, is_master, is_exempt, active
      ) VALUES (
        ?, ?, ?, ?, 'SOLO', 'active', '2099-12-31 23:59:59',
        1, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, 1
      )
    `, [
      tenantId, name, segment, document || null, cleanEmail, hashedPassword, ownerName, ownerPhone || null,
      cep || null, street || null, number || null, complement || null, neighborhood || null, city || null, state || null,
      isMasterEmail ? 1 : 0, isMasterEmail ? 1 : 0
    ]);

    // Determinar função inicial e especialidade pelo segmento
    let initialRole = 'Proprietária / Administradora';
    let initialSubtypes = ['Gestão'];
    let initialSpecialties = ['Gestão'];

    if (segment === 'barbearia') {
      initialRole = 'Barbeiro / Proprietário';
      initialSubtypes = ['Barbeiro Master', 'Gestão'];
      initialSpecialties = ['Barba & Corte', 'Gestão'];
    } else if (segment === 'estetica') {
      initialRole = 'Esteticista / Proprietária';
      initialSubtypes = ['Esteticista Facial', 'Gestão'];
      initialSpecialties = ['Facial & Pele', 'Gestão'];
    } else if (segment === 'esmalteria') {
      initialRole = 'Nail Designer / Proprietária';
      initialSubtypes = ['Nail Designer Fibra', 'Gestão'];
      initialSpecialties = ['Alongamento', 'Gestão'];
    } else if (segment === 'lash') {
      initialRole = 'Lash Designer / Proprietária';
      initialSubtypes = ['Lash Designer Master', 'Gestão'];
      initialSpecialties = ['Extensão de Cílios', 'Gestão'];
    } else {
      initialRole = 'Cabeleireira / Proprietária';
      initialSubtypes = ['Cabeleireira Master', 'Gestão'];
      initialSpecialties = ['Cabelo', 'Gestão'];
    }

    // Criar Proprietário como Primeiro Administrador na tabela de profissionais desse salão/projeto
    await run(`
      INSERT INTO professionals (
        name, nickname, role, access_level, subtypes, phone, email, password,
        pin_code, color_hex, specialties, default_commission_type, default_commission_value,
        active, tenant_id
      ) VALUES (?, ?, ?, 'ADMIN', ?, ?, ?, ?, '1234', '#ec4899', ?, 'percentage', 60.0, 1, ?)
    `, [
      ownerName, ownerName.split(' ')[0], initialRole, JSON.stringify(initialSubtypes),
      ownerPhone || null, cleanEmail, hashedPassword, JSON.stringify(initialSpecialties), tenantId
    ]);

    // Inicializar templates e configurações limpas para o novo salão com base no segmento
    const fullAddress = [street, number, neighborhood, city, state].filter(Boolean).join(', ');
    await initializeTenantDefaults(tenantId, {
      name,
      ownerPhone,
      address: fullAddress,
      document: document || null
    }, segment);

    // Limpar verificação se usada
    await run(`DELETE FROM email_verifications WHERE email = ?`, [cleanEmail]);

    // Buscar todos os salões/projetos deste proprietário
    const allTenants = await query(`
      SELECT id, name, segment, plan, city, state, is_master
      FROM tenants
      WHERE owner_email = ? AND active = 1
      ORDER BY created_at DESC
    `, [cleanEmail]);

    // Criar Sessão JWT
    const token = createSessionToken({
      userId: tenantId,
      name: ownerName,
      email: cleanEmail,
      salonName: name,
      segment: segment,
      accessLevel: 'ADMIN',
      tenantId: tenantId,
      isMaster: isMasterEmail
    });

    res.json({
      success: true,
      message: 'Projeto cadastrado com sucesso! Bem-vinda(o) ao BelaGestão Studio.',
      token,
      user: {
        id: tenantId,
        name: ownerName,
        email: cleanEmail,
        salonName: name,
        segment: segment,
        accessLevel: 'ADMIN',
        role: initialRole,
        tenantId,
        plan: 'SOLO',
        isMaster: isMasterEmail,
        tenants: allTenants
      }
    });
  } catch (error) {
    console.error('Erro no cadastro do salão:', error);
    res.status(500).json({ error: 'Erro ao processar cadastro do salão.' });
  }
});

// 4. Login Unificado (E-mail + Senha) com Suporte a Múltiplos Projetos
router.post('/login', async (req, res) => {
  try {
    const { login, password, tenantId: targetTenantId } = req.body;
    if (!login || !password) {
      return res.status(400).json({ error: 'Informe e-mail e senha de acesso.' });
    }

    const cleanLogin = login.trim().toLowerCase();
    const isMasterEmail = cleanLogin === 'rafael.gielow@gmail.com';

    // B. Tentar Login como Dono (Tenants)
    const tenants = await query(`
      SELECT * FROM tenants
      WHERE owner_email = ? AND active = 1
      ORDER BY is_master DESC, created_at DESC
    `, [cleanLogin]);

    if (tenants && tenants.length > 0) {
      // Verificar se a senha confere com algum dos tenants do usuário
      const validTenant = tenants.find(t => verifyPassword(password, t.owner_password));
      if (validTenant) {
        // Se targetTenantId foi passado e existe na lista, seleciona ele; senão usa validTenant
        const activeTenant = (targetTenantId && tenants.find(t => t.id === targetTenantId)) || validTenant;
        const isMasterUser = Boolean(activeTenant.is_master) || isMasterEmail || tenants.some(t => t.is_master);

        const token = createSessionToken({
          userId: activeTenant.id,
          name: activeTenant.owner_name,
          email: activeTenant.owner_email,
          salonName: activeTenant.name,
          segment: activeTenant.segment || 'salao',
          accessLevel: 'ADMIN',
          tenantId: activeTenant.id,
          isMaster: isMasterUser
        });

        const userTenants = tenants.map(t => ({
          id: t.id,
          name: t.name,
          segment: t.segment || 'salao',
          plan: t.plan || 'SOLO',
          city: t.city,
          state: t.state,
          isMaster: Boolean(t.is_master)
        }));

        return res.json({
          success: true,
          token,
          user: {
            id: activeTenant.id,
            name: activeTenant.owner_name,
            email: activeTenant.owner_email,
            salonName: activeTenant.name,
            segment: activeTenant.segment || 'salao',
            accessLevel: 'ADMIN',
            role: 'Proprietário & Administrador',
            tenantId: activeTenant.id,
            plan: activeTenant.plan || 'SOLO',
            isMaster: isMasterUser,
            tenants: userTenants
          }
        });
      }
    }

    // C. Tentar Login como Profissional/Colaborador (Professionals)
    const professionals = await query(`
      SELECT p.*, t.name as salon_name, t.segment, t.plan, t.is_master
      FROM professionals p
      LEFT JOIN tenants t ON p.tenant_id = t.id
      WHERE p.email = ? AND p.active = 1
      ORDER BY p.id DESC
    `, [cleanLogin]);

    const validProf = professionals.find(p => verifyPassword(password, p.password));
    if (validProf) {
      const activeProf = (targetTenantId && professionals.find(p => p.tenant_id === targetTenantId)) || validProf;
      const isMasterUser = Boolean(activeProf.is_master) || isMasterEmail;
      const finalRole = isMasterUser ? 'ADMIN' : (activeProf.access_level || 'PROFISSIONAL');

      const token = createSessionToken({
        userId: String(activeProf.id),
        name: activeProf.name,
        email: activeProf.email,
        salonName: activeProf.salon_name || 'BelaGestão Studio',
        segment: activeProf.segment || 'salao',
        accessLevel: finalRole,
        role: activeProf.role,
        tenantId: activeProf.tenant_id,
        isMaster: isMasterUser
      });

      const userTenants = professionals.map(p => ({
        id: p.tenant_id,
        name: p.salon_name || 'BelaGestão Studio',
        segment: p.segment || 'salao',
        plan: p.plan || 'SOLO',
        role: p.role,
        isMaster: Boolean(p.is_master)
      }));

      return res.json({
        success: true,
        token,
        user: {
          id: String(activeProf.id),
          name: activeProf.name,
          email: activeProf.email,
          salonName: activeProf.salon_name || 'BelaGestão Studio',
          segment: activeProf.segment || 'salao',
          accessLevel: finalRole,
          role: activeProf.role,
          subtypes: activeProf.subtypes ? JSON.parse(activeProf.subtypes) : [],
          tenantId: activeProf.tenant_id,
          plan: activeProf.plan || 'SOLO',
          isMaster: isMasterUser,
          tenants: userTenants
        }
      });
    }

    // D. Credenciais Inválidas
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao efetuar login.' });
  }
});

// 5. Listar Salões/Projetos do Usuário Conectado
router.get('/my-tenants', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Não autenticado.' });

    const token = authHeader.replace('Bearer ', '').trim();
    const session = verifySessionToken(token);
    if (!session) return res.status(401).json({ error: 'Sessão expirada.' });

    const cleanEmail = session.email.toLowerCase();
    const isMaster = session.isMaster || cleanEmail === 'rafael.gielow@gmail.com';

    let tenants = [];
    if (isMaster) {
      tenants = await query(`
        SELECT id, name, segment, plan, city, state, is_master, subscription_status
        FROM tenants
        WHERE active = 1
        ORDER BY created_at DESC
      `);
    } else {
      // Buscar salões onde é dono
      const ownedTenants = await query(`
        SELECT id, name, segment, plan, city, state, is_master, subscription_status
        FROM tenants
        WHERE owner_email = ? AND active = 1
        ORDER BY created_at DESC
      `, [cleanEmail]);

      // Buscar salões onde é profissional da equipe
      const teamTenants = await query(`
        SELECT t.id, t.name, t.segment, t.plan, t.city, t.state, t.is_master, t.subscription_status
        FROM professionals p
        JOIN tenants t ON p.tenant_id = t.id
        WHERE p.email = ? AND p.active = 1 AND t.active = 1
      `, [cleanEmail]);

      const map = new Map();
      for (const t of [...ownedTenants, ...teamTenants]) {
        map.set(t.id, t);
      }
      tenants = Array.from(map.values());
    }

    res.json({ success: true, tenants });
  } catch (error) {
    console.error('Erro ao listar projetos do usuário:', error);
    res.status(500).json({ error: 'Falha ao buscar projetos.' });
  }
});

// 6. Alternar para Outro Salão / Projeto (Switch Tenant)
router.post('/switch-tenant', async (req, res) => {
  try {
    const { tenantId } = req.body;
    if (!tenantId) return res.status(400).json({ error: 'tenantId é obrigatório.' });

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Não autenticado.' });

    const token = authHeader.replace('Bearer ', '').trim();
    const session = verifySessionToken(token);
    if (!session) return res.status(401).json({ error: 'Sessão expirada.' });

    const cleanEmail = session.email.toLowerCase();
    const isMaster = session.isMaster || cleanEmail === 'rafael.gielow@gmail.com';

    // Verificar se o tenant existe
    const tenant = await get(`SELECT * FROM tenants WHERE id = ? AND active = 1`, [tenantId]);
    if (!tenant) {
      return res.status(404).json({ error: 'Salão ou projeto não localizado.' });
    }

    // Verificar se usuário tem acesso (é master, ou dono, ou profissional cadastrado)
    let accessGranted = isMaster || (tenant.owner_email.toLowerCase() === cleanEmail);
    let profRecord = null;

    if (!accessGranted) {
      profRecord = await get(`
        SELECT * FROM professionals 
        WHERE tenant_id = ? AND email = ? AND active = 1
      `, [tenantId, cleanEmail]);
      if (profRecord) accessGranted = true;
    }

    if (!accessGranted) {
      return res.status(403).json({ error: 'Você não tem permissão para acessar este salão.' });
    }

    const isMasterUser = Boolean(tenant.is_master) || isMaster;
    const finalAccessLevel = isMasterUser || (tenant.owner_email.toLowerCase() === cleanEmail)
      ? 'ADMIN'
      : (profRecord?.access_level || 'PROFISSIONAL');

    const finalRole = profRecord?.role || (isMasterUser ? 'Super Admin Master' : 'Proprietário & Administrador');

    const newToken = createSessionToken({
      userId: profRecord ? String(profRecord.id) : tenant.id,
      name: session.name || tenant.owner_name,
      email: cleanEmail,
      salonName: tenant.name,
      segment: tenant.segment || 'salao',
      accessLevel: finalAccessLevel,
      role: finalRole,
      tenantId: tenant.id,
      isMaster: isMasterUser
    });

    res.json({
      success: true,
      token: newToken,
      user: {
        id: profRecord ? String(profRecord.id) : tenant.id,
        name: session.name || tenant.owner_name,
        email: cleanEmail,
        salonName: tenant.name,
        segment: tenant.segment || 'salao',
        accessLevel: finalAccessLevel,
        role: finalRole,
        tenantId: tenant.id,
        plan: tenant.plan || 'SOLO',
        isMaster: isMasterUser
      },
      tenant
    });
  } catch (error) {
    console.error('Erro ao alternar projeto:', error);
    res.status(500).json({ error: 'Falha ao alternar projeto.' });
  }
});

// 7. Criar Novo Salão / Projeto Direto do Painel (Autenticado)
router.post('/create-tenant', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Não autenticado.' });

    const token = authHeader.replace('Bearer ', '').trim();
    const session = verifySessionToken(token);
    if (!session) return res.status(401).json({ error: 'Sessão expirada.' });

    const {
      name,
      segment = 'salao',
      document,
      phone,
      cep,
      street,
      number,
      complement,
      neighborhood,
      city,
      state
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Informe o nome do novo salão/projeto.' });
    }

    const cleanEmail = session.email.toLowerCase();
    const isMasterEmail = cleanEmail === 'rafael.gielow@gmail.com' || Boolean(session.isMaster);

    // Buscar senha do dono a partir de um tenant existente ou padrão
    const existingTenant = await get(`SELECT owner_password, owner_phone, owner_name FROM tenants WHERE owner_email = ? LIMIT 1`, [cleanEmail]);
    const ownerPassword = existingTenant?.owner_password || hashPassword('123456');
    const ownerName = existingTenant?.owner_name || session.name || 'Proprietário';
    const ownerPhone = phone || existingTenant?.owner_phone || null;

    const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Criar Tenant
    await run(`
      INSERT INTO tenants (
        id, name, segment, document, plan, subscription_status, subscription_expires_at,
        max_users, owner_email, owner_password, owner_name, owner_phone,
        cep, street, number, complement, neighborhood, city, state, is_master, is_exempt, active
      ) VALUES (
        ?, ?, ?, ?, 'SOLO', 'active', '2099-12-31 23:59:59',
        1, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, 1
      )
    `, [
      tenantId, name.trim(), segment, document || null, cleanEmail, ownerPassword, ownerName, ownerPhone,
      cep || null, street || null, number || null, complement || null, neighborhood || null, city || null, state || null,
      isMasterEmail ? 1 : 0, isMasterEmail ? 1 : 0
    ]);

    // Determinar função inicial e especialidade pelo segmento
    let initialRole = 'Proprietária / Administradora';
    let initialSubtypes = ['Gestão'];
    let initialSpecialties = ['Gestão'];

    if (segment === 'barbearia') {
      initialRole = 'Barbeiro / Proprietário';
      initialSubtypes = ['Barbeiro Master', 'Gestão'];
      initialSpecialties = ['Barba & Corte', 'Gestão'];
    } else if (segment === 'estetica') {
      initialRole = 'Esteticista / Proprietária';
      initialSubtypes = ['Esteticista Facial', 'Gestão'];
      initialSpecialties = ['Facial & Pele', 'Gestão'];
    } else if (segment === 'esmalteria') {
      initialRole = 'Nail Designer / Proprietária';
      initialSubtypes = ['Nail Designer Fibra', 'Gestão'];
      initialSpecialties = ['Alongamento', 'Gestão'];
    } else if (segment === 'lash') {
      initialRole = 'Lash Designer / Proprietária';
      initialSubtypes = ['Lash Designer Master', 'Gestão'];
      initialSpecialties = ['Extensão de Cílios', 'Gestão'];
    } else {
      initialRole = 'Cabeleireira / Proprietária';
      initialSubtypes = ['Cabeleireira Master', 'Gestão'];
      initialSpecialties = ['Cabelo', 'Gestão'];
    }

    // Criar Proprietário como Primeiro Administrador na tabela de profissionais desse novo salão
    await run(`
      INSERT INTO professionals (
        name, nickname, role, access_level, subtypes, phone, email, password,
        pin_code, color_hex, specialties, default_commission_type, default_commission_value,
        active, tenant_id
      ) VALUES (?, ?, ?, 'ADMIN', ?, ?, ?, ?, '1234', '#ec4899', ?, 'percentage', 60.0, 1, ?)
    `, [
      ownerName, ownerName.split(' ')[0], initialRole, JSON.stringify(initialSubtypes),
      ownerPhone, cleanEmail, ownerPassword, JSON.stringify(initialSpecialties), tenantId
    ]);

    // Inicializar templates e configurações limpas para o novo salão com base no segmento
    const fullAddress = [street, number, neighborhood, city, state].filter(Boolean).join(', ');
    await initializeTenantDefaults(tenantId, {
      name: name.trim(),
      ownerPhone,
      address: fullAddress,
      document: document || null
    }, segment);

    // Gerar token de sessão para o novo tenant criado
    const newToken = createSessionToken({
      userId: tenantId,
      name: ownerName,
      email: cleanEmail,
      salonName: name.trim(),
      segment: segment,
      accessLevel: 'ADMIN',
      role: initialRole,
      tenantId: tenantId,
      isMaster: isMasterEmail
    });

    const allTenants = await query(`
      SELECT id, name, segment, plan, city, state, is_master
      FROM tenants
      WHERE owner_email = ? AND active = 1
      ORDER BY created_at DESC
    `, [cleanEmail]);

    res.json({
      success: true,
      message: `Projeto "${name}" cadastrado com sucesso!`,
      token: newToken,
      user: {
        id: tenantId,
        name: ownerName,
        email: cleanEmail,
        salonName: name.trim(),
        segment: segment,
        accessLevel: 'ADMIN',
        role: initialRole,
        tenantId,
        plan: 'SOLO',
        isMaster: isMasterEmail,
        tenants: allTenants
      },
      newTenant: {
        id: tenantId,
        name: name.trim(),
        segment: segment
      }
    });
  } catch (error) {
    console.error('Erro ao criar novo salão/projeto:', error);
    res.status(500).json({ error: 'Falha ao criar novo projeto.' });
  }
});


// 9. Obter Dados do Usuário e Salão Autenticado
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Não autenticado.' });

    const token = authHeader.replace('Bearer ', '').trim();
    const session = verifySessionToken(token);
    if (!session) return res.status(401).json({ error: 'Sessão expirada.' });

    const tenant = await get(`SELECT * FROM tenants WHERE id = ?`, [session.tenantId]);
    const cleanEmail = session.email?.toLowerCase();
    
    // Obter todos os tenants acessíveis
    const userTenants = cleanEmail ? await query(`
      SELECT id, name, segment, plan, city, state, is_master
      FROM tenants
      WHERE (owner_email = ? OR id = ?) AND active = 1
      ORDER BY created_at DESC
    `, [cleanEmail, session.tenantId]) : [];

    res.json({
      success: true,
      user: {
        ...session,
        segment: tenant?.segment || session.segment || 'salao',
        tenants: userTenants
      },
      tenant: tenant || null
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar sessão.' });
  }
});

// 7. Enviar Convite para Profissional da Equipe Criar Senha
router.post('/invite', async (req, res) => {
  try {
    const { employeeId, employeeEmail, employeeName, role, salonName, ownerName } = req.body;
    if (!employeeEmail) return res.status(400).json({ error: 'E-mail do profissional é obrigatório.' });

    const inviteToken = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48h

    if (employeeId) {
      await run(`
        UPDATE professionals
        SET invite_token = ?, invite_expires_at = ?
        WHERE id = ?
      `, [inviteToken, expiresAt, employeeId]);
    }

    const inviteLink = `${process.env.APP_URL || 'https://belagestaostudio.com.br'}/convite?token=${inviteToken}`;

    await sendEmployeeInviteEmail({
      employeeName: employeeName || 'Colaborador',
      employeeEmail: employeeEmail.trim(),
      role: role || 'Profissional',
      salonName: salonName || 'BelaGestão Studio',
      ownerName: ownerName || 'Administrador',
      inviteLink
    });

    res.json({ success: true, message: 'Convite despachado com sucesso via Brevo!' });
  } catch (error) {
    console.error('Erro ao enviar convite:', error);
    res.status(500).json({ error: 'Falha ao despachar convite.' });
  }
});

// 8. Verificar Token de Convite
router.get('/invite/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const prof = await get(`
      SELECT p.id, p.name, p.email, p.role, p.access_level, p.invite_expires_at, t.name as salon_name
      FROM professionals p
      LEFT JOIN tenants t ON p.tenant_id = t.id
      WHERE p.invite_token = ?
    `, [token]);

    if (!prof) {
      return res.status(404).json({ error: 'Convite inválido ou expirado.' });
    }

    if (prof.invite_expires_at && new Date(prof.invite_expires_at) < new Date()) {
      return res.status(400).json({ error: 'Este link de convite expirou (validade de 48h).' });
    }

    res.json({ success: true, professional: prof });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar convite.' });
  }
});

// 9. Aceitar Convite e Definir Senha Pessoal
router.post('/invite/accept', async (req, res) => {
  try {
    const { token, password, pinCode } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
    }

    const strength = validatePasswordStrength(password);
    if (!strength.isValid) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
    }

    const prof = await get(`SELECT id FROM professionals WHERE invite_token = ?`, [token]);
    if (!prof) {
      return res.status(404).json({ error: 'Convite não localizado.' });
    }

    const hashedPassword = hashPassword(password);
    await run(`
      UPDATE professionals
      SET password = ?, pin_code = COALESCE(?, pin_code), invite_token = NULL, invite_expires_at = NULL
      WHERE id = ?
    `, [hashedPassword, pinCode || null, prof.id]);

    res.json({ success: true, message: 'Senha cadastrada com sucesso! Agora você pode fazer login.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar senha.' });
  }
});

// 10. Esqueci Minha Senha - Solicitar Código de 6 Dígitos
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Informe um e-mail válido.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Procurar em tenants (Dono)
    const tenant = await get(`SELECT id, owner_name as name FROM tenants WHERE owner_email = ?`, [cleanEmail]);
    
    // 2. Procurar em professionals (Equipe)
    const prof = !tenant ? await get(`SELECT id, name FROM professionals WHERE email = ? AND active = 1`, [cleanEmail]) : null;

    if (!tenant && !prof) {
      return res.status(404).json({ error: 'Nenhuma conta encontrada com este e-mail.' });
    }

    const userName = tenant ? tenant.name : prof.name;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutos

    await run(`
      INSERT INTO email_verifications (email, code, expires_at)
      VALUES (?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET code = ?, expires_at = ?
    `, [cleanEmail, code, expiresAt, code, expiresAt]);

    await sendPasswordResetEmail(cleanEmail, code, userName);

    res.json({
      success: true,
      message: 'Código de 6 dígitos enviado para seu e-mail.',
      expiresInMinutes: 15
    });
  } catch (error) {
    console.error('Erro ao solicitar recuperação de senha:', error);
    res.status(500).json({ error: 'Falha ao processar solicitação de recuperação.' });
  }
});

// 11. Redefinir Senha com Código de 6 Dígitos
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'E-mail, código e nova senha são obrigatórios.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Validação do Código de 6 Dígitos
    const verification = await get(`SELECT * FROM email_verifications WHERE email = ?`, [cleanEmail]);
    if (!verification) {
      return res.status(400).json({ error: 'Código de recuperação não encontrado. Solicite um novo código.' });
    }

    if (new Date(verification.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Este código expirou. Solicite um novo código.' });
    }

    if (verification.code !== code.trim()) {
      return res.status(400).json({ error: 'Código incorreto. Confira os 6 dígitos recebidos.' });
    }

    // Validação de força da nova senha
    const strength = validatePasswordStrength(newPassword);
    if (!strength.isValid) {
      return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
    }

    const newHash = hashPassword(newPassword);

    // Atualizar no Dono (tenants) ou no Profissional (professionals)
    const tenant = await get(`SELECT * FROM tenants WHERE owner_email = ?`, [cleanEmail]);
    let authUser = null;
    let token = null;

    if (tenant) {
      await run(`UPDATE tenants SET owner_password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [newHash, tenant.id]);
      const isMasterUser = Boolean(tenant.is_master) || cleanEmail === 'rafael.gielow@gmail.com';
      token = createSessionToken({
        userId: tenant.id,
        name: tenant.owner_name,
        email: tenant.owner_email,
        salonName: tenant.name,
        accessLevel: 'ADMIN',
        tenantId: tenant.id,
        isMaster: isMasterUser
      });
      authUser = {
        id: tenant.id,
        name: tenant.owner_name,
        email: tenant.owner_email,
        salonName: tenant.name,
        accessLevel: 'ADMIN',
        role: 'Proprietário & Administrador',
        tenantId: tenant.id,
        plan: tenant.plan || 'SOLO',
        isMaster: isMasterUser
      };
    } else {
      const prof = await get(`
        SELECT p.*, t.name as salon_name, t.plan, t.is_master
        FROM professionals p
        LEFT JOIN tenants t ON p.tenant_id = t.id
        WHERE p.email = ? AND p.active = 1
      `, [cleanEmail]);

      if (prof) {
        await run(`UPDATE professionals SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [newHash, prof.id]);
        token = createSessionToken({
          userId: String(prof.id),
          name: prof.name,
          email: prof.email,
          salonName: prof.salon_name || 'BelaGestão Studio',
          accessLevel: prof.access_level || 'PROFISSIONAL',
          role: prof.role,
          tenantId: prof.tenant_id,
          isMaster: Boolean(prof.is_master)
        });
        authUser = {
          id: String(prof.id),
          name: prof.name,
          email: prof.email,
          salonName: prof.salon_name || 'BelaGestão Studio',
          accessLevel: prof.access_level || 'PROFISSIONAL',
          role: prof.role,
          subtypes: prof.subtypes ? JSON.parse(prof.subtypes) : [],
          tenantId: prof.tenant_id,
          plan: prof.plan || 'SOLO',
          isMaster: Boolean(prof.is_master)
        };
      } else {
        return res.status(404).json({ error: 'Conta de usuário não localizada.' });
      }
    }

    // Consumir o código de uso único
    await run(`DELETE FROM email_verifications WHERE email = ?`, [cleanEmail]);

    res.json({
      success: true,
      message: 'Sua senha foi redefinida com sucesso! Você já pode acessar sua conta.',
      token,
      user: authUser
    });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ error: 'Erro interno ao redefinir a senha.' });
  }
});

module.exports = router;
