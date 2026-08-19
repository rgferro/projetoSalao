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
    const existingTenant = await get(`SELECT id FROM tenants WHERE owner_email = ?`, [cleanEmail]);
    if (existingTenant) {
      return res.status(400).json({ error: 'Este e-mail já possui um salão cadastrado. Faça login.' });
    }

    // Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutos

    await run(`
      INSERT INTO email_verifications (email, code, expires_at)
      VALUES (?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET code = ?, expires_at = ?
    `, [cleanEmail, code, expiresAt, code, expiresAt]);

    await sendVerificationEmail(cleanEmail, code, salonName || 'BellaGestão Studio');

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

// 3. Cadastro do Salão e Dono (Onboarding Multi-Tenant)
router.post('/register', async (req, res) => {
  try {
    const {
      name, // Nome do Salão
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

    const existingTenant = await get(`SELECT id FROM tenants WHERE owner_email = ?`, [cleanEmail]);
    if (existingTenant) {
      return res.status(400).json({ error: 'Já existe um salão registrado com este e-mail.' });
    }

    const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const hashedPassword = hashPassword(password);

    // Criar Tenant com Plano Solo (Gratuito para sempre)
    await run(`
      INSERT INTO tenants (
        id, name, document, plan, subscription_status, subscription_expires_at,
        max_users, owner_email, owner_password, owner_name, owner_phone,
        cep, street, number, complement, neighborhood, city, state, is_master, active
      ) VALUES (
        ?, ?, ?, 'SOLO', 'active', '2099-12-31 23:59:59',
        1, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, 0, 1
      )
    `, [
      tenantId, name, document || null, cleanEmail, hashedPassword, ownerName, ownerPhone || null,
      cep || null, street || null, number || null, complement || null, neighborhood || null, city || null, state || null
    ]);

    // Criar Proprietário como Primeiro Administrador na tabela de profissionais
    await run(`
      INSERT INTO professionals (
        name, nickname, role, access_level, subtypes, phone, email, password,
        pin_code, color_hex, specialties, default_commission_type, default_commission_value,
        active, tenant_id
      ) VALUES (?, ?, 'Proprietária / Administrador', 'ADMIN', ?, ?, ?, ?, '1234', '#ec4899', '["Cabelo", "Gestão"]', 'percentage', 60.0, 1, ?)
    `, [
      ownerName, ownerName.split(' ')[0], JSON.stringify(['Cabeleireira', 'Gestão']),
      ownerPhone || null, cleanEmail, hashedPassword, tenantId
    ]);

    // Inicializar templates e configurações limpas para o novo salão
    const fullAddress = [street, number, neighborhood, city, state].filter(Boolean).join(', ');
    await initializeTenantDefaults(tenantId, {
      name,
      ownerPhone,
      address: fullAddress,
      document: document || null
    });

    // Limpar verificação
    await run(`DELETE FROM email_verifications WHERE email = ?`, [cleanEmail]);

    // Criar Sessão JWT
    const token = createSessionToken({
      userId: tenantId,
      name: ownerName,
      email: cleanEmail,
      salonName: name,
      accessLevel: 'ADMIN',
      tenantId: tenantId,
      isMaster: false
    });

    res.json({
      success: true,
      message: 'Salão cadastrado com sucesso no Plano Solo! Bem-vinda ao BellaGestão Studio.',
      token,
      user: {
        id: tenantId,
        name: ownerName,
        email: cleanEmail,
        salonName: name,
        accessLevel: 'ADMIN',
        tenantId,
        plan: 'SOLO'
      }
    });
  } catch (error) {
    console.error('Erro no cadastro do salão:', error);
    res.status(500).json({ error: 'Erro ao processar cadastro do salão.' });
  }
});

// 4. Login Unificado (E-mail ou Usuário + Senha / PIN)
router.post('/login', async (req, res) => {
  try {
    const { login, password, pinCode } = req.body;
    if (!login && !pinCode) {
      return res.status(400).json({ error: 'Informe e-mail ou PIN de acesso.' });
    }

    // A. Login Rápido por PIN de 4 dígitos (Terminal de Salão compartilhado)
    if (pinCode) {
      const prof = await get(`
        SELECT p.*, t.name as salon_name, t.plan, t.is_master
        FROM professionals p
        LEFT JOIN tenants t ON p.tenant_id = t.id
        WHERE p.pin_code = ? AND p.active = 1
        LIMIT 1
      `, [pinCode.trim()]);

      if (!prof) {
        return res.status(401).json({ error: 'PIN de 4 dígitos não reconhecido.' });
      }

      const token = createSessionToken({
        userId: String(prof.id),
        name: prof.name,
        email: prof.email,
        salonName: prof.salon_name || 'BellaGestão Studio',
        accessLevel: prof.access_level || 'PROFISSIONAL',
        role: prof.role,
        tenantId: prof.tenant_id,
        isMaster: Boolean(prof.is_master)
      });

      return res.json({
        success: true,
        token,
        user: {
          id: String(prof.id),
          name: prof.name,
          email: prof.email,
          salonName: prof.salon_name || 'BellaGestão Studio',
          accessLevel: prof.access_level || 'PROFISSIONAL',
          role: prof.role,
          subtypes: prof.subtypes ? JSON.parse(prof.subtypes) : [],
          tenantId: prof.tenant_id,
          plan: prof.plan || 'SOLO',
          isMaster: Boolean(prof.is_master)
        }
      });
    }

    const cleanLogin = login.trim().toLowerCase();
    const isMasterEmail = cleanLogin === 'rafael.gielow@gmail.com';

    // B. Tentar Login como Dono (Tenants)
    const tenant = await get(`SELECT * FROM tenants WHERE owner_email = ?`, [cleanLogin]);
    if (tenant && verifyPassword(password, tenant.owner_password)) {
      const isMasterUser = Boolean(tenant.is_master) || isMasterEmail;
      const token = createSessionToken({
        userId: tenant.id,
        name: tenant.owner_name,
        email: tenant.owner_email,
        salonName: tenant.name,
        accessLevel: 'ADMIN',
        tenantId: tenant.id,
        isMaster: isMasterUser
      });

      return res.json({
        success: true,
        token,
        user: {
          id: tenant.id,
          name: tenant.owner_name,
          email: tenant.owner_email,
          salonName: tenant.name,
          accessLevel: 'ADMIN',
          tenantId: tenant.id,
          plan: tenant.plan || 'SOLO',
          isMaster: isMasterUser
        }
      });
    }

    // C. Tentar Login como Profissional/Colaborador (Professionals)
    const professional = await get(`
      SELECT p.*, t.name as salon_name, t.plan, t.is_master
      FROM professionals p
      LEFT JOIN tenants t ON p.tenant_id = t.id
      WHERE p.email = ? AND p.active = 1
      LIMIT 1
    `, [cleanLogin]);

    if (professional && verifyPassword(password, professional.password)) {
      const isMasterUser = Boolean(professional.is_master) || isMasterEmail;
      const finalRole = isMasterUser ? 'ADMIN' : (professional.access_level || 'PROFISSIONAL');
      const token = createSessionToken({
        userId: String(professional.id),
        name: professional.name,
        email: professional.email,
        salonName: professional.salon_name || 'BellaGestão Studio',
        accessLevel: finalRole,
        role: professional.role,
        tenantId: professional.tenant_id,
        isMaster: isMasterUser
      });

      return res.json({
        success: true,
        token,
        user: {
          id: String(professional.id),
          name: professional.name,
          email: professional.email,
          salonName: professional.salon_name || 'BellaGestão Studio',
          accessLevel: finalRole,
          role: professional.role,
          subtypes: professional.subtypes ? JSON.parse(professional.subtypes) : [],
          tenantId: professional.tenant_id,
          plan: professional.plan || 'SOLO',
          isMaster: isMasterUser
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

// 5. Troca Rápida de Usuário no Salão (Terminal PDV / Recepção)
router.post('/switch-user', async (req, res) => {
  try {
    const { pinCode } = req.body;
    if (!pinCode) return res.status(400).json({ error: 'PIN obrigatório.' });

    const prof = await get(`
      SELECT p.*, t.name as salon_name, t.plan, t.is_master
      FROM professionals p
      LEFT JOIN tenants t ON p.tenant_id = t.id
      WHERE p.pin_code = ? AND p.active = 1
      LIMIT 1
    `, [pinCode.trim()]);

    if (!prof) {
      return res.status(401).json({ error: 'PIN incorreto.' });
    }

    const token = createSessionToken({
      userId: String(prof.id),
      name: prof.name,
      email: prof.email,
      salonName: prof.salon_name || 'BellaGestão Studio',
      accessLevel: prof.access_level || 'PROFISSIONAL',
      role: prof.role,
      tenantId: prof.tenant_id,
      isMaster: Boolean(prof.is_master)
    });

    res.json({
      success: true,
      token,
      user: {
        id: String(prof.id),
        name: prof.name,
        email: prof.email,
        salonName: prof.salon_name || 'BellaGestão Studio',
        accessLevel: prof.access_level || 'PROFISSIONAL',
        role: prof.role,
        subtypes: prof.subtypes ? JSON.parse(prof.subtypes) : [],
        tenantId: prof.tenant_id,
        plan: prof.plan || 'SOLO',
        isMaster: Boolean(prof.is_master)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao alternar usuário.' });
  }
});

// 6. Obter Dados do Usuário e Salão Autenticado
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Não autenticado.' });

    const token = authHeader.replace('Bearer ', '');
    const session = verifySessionToken(token);
    if (!session) return res.status(401).json({ error: 'Sessão expirada.' });

    const tenant = await get(`SELECT * FROM tenants WHERE id = ?`, [session.tenantId]);
    res.json({
      success: true,
      user: session,
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
      salonName: salonName || 'BellaGestão Studio',
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
          salonName: prof.salon_name || 'BellaGestão Studio',
          accessLevel: prof.access_level || 'PROFISSIONAL',
          role: prof.role,
          tenantId: prof.tenant_id,
          isMaster: Boolean(prof.is_master)
        });
        authUser = {
          id: String(prof.id),
          name: prof.name,
          email: prof.email,
          salonName: prof.salon_name || 'BellaGestão Studio',
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
