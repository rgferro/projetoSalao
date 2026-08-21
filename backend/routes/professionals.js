const express = require('express');
const router = express.Router();
const { query, get, run } = require('../database/db');
const { hashPassword } = require('../services/authService');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// Todas as rotas de profissionais exigem autenticação válida
router.use(requireAuth);

// 1. Listar Especialidades / Funções Extensíveis por Tenant
router.get('/specialties', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant não identificado.' });

    const list = await query(`
      SELECT * FROM custom_specialties 
      WHERE tenant_id = ?
      ORDER BY category ASC, name ASC
    `, [tenantId]);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Cadastrar Nova Especialidade / Função Customizada
router.post('/specialties', requireRole(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { name, category = 'Geral', icon = 'Sparkles' } = req.body;
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant não identificado.' });
    if (!name) return res.status(400).json({ error: 'Nome da especialidade é obrigatório.' });

    const result = await run(`
      INSERT OR IGNORE INTO custom_specialties (name, category, icon, tenant_id)
      VALUES (?, ?, ?, ?)
    `, [name.trim(), category.trim(), icon, tenantId]);

    res.status(201).json({ id: result.lastID, name: name.trim(), message: 'Função/Especialidade cadastrada com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Listar todos os profissionais da equipe do Tenant Autenticado
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Não autenticado.' });

    const professionals = await query(`
      SELECT p.*,
        (SELECT COUNT(*) FROM appointment_items ai WHERE ai.professional_id = p.id AND ai.status = 'concluido' AND ai.tenant_id = ?) as total_services_completed
      FROM professionals p
      WHERE p.tenant_id = ?
      ORDER BY p.name ASC
    `, [tenantId, tenantId]);

    // Parse JSON fields
    const parsed = professionals.map(p => ({
      ...p,
      specialties: p.specialties ? JSON.parse(p.specialties) : [],
      subtypes: p.subtypes ? JSON.parse(p.subtypes) : [],
      work_schedule: p.work_schedule ? JSON.parse(p.work_schedule) : {}
    }));

    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Detalhe de um profissional + comissões personalizadas
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Não autenticado.' });

    const prof = await get('SELECT * FROM professionals WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    if (!prof) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    const customCommissions = await query(
      `SELECT pc.*, s.name as service_name, s.category as service_category, s.price as service_price
       FROM professional_commissions pc
       JOIN services s ON pc.service_id = s.id
       WHERE pc.professional_id = ? AND pc.tenant_id = ?`,
      [id, tenantId]
    );

    res.json({
      ...prof,
      specialties: prof.specialties ? JSON.parse(prof.specialties) : [],
      subtypes: prof.subtypes ? JSON.parse(prof.subtypes) : [],
      work_schedule: prof.work_schedule ? JSON.parse(prof.work_schedule) : {},
      custom_commissions: customCommissions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Criar profissional com verificação de limite do plano (Exclusivo ADMIN/GERENTE)
router.post('/', requireRole(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const {
      name,
      nickname,
      role,
      access_level = 'PROFISSIONAL',
      subtypes,
      phone,
      email,
      password,
      color_hex,
      specialties,
      default_commission_type,
      default_commission_value,
      work_schedule,
      custom_commissions
    } = req.body;
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Não autenticado.' });

    if (!name) {
      return res.status(400).json({ error: 'Nome do profissional é obrigatório.' });
    }

    // Verificar limite de colaboradores do tenant conforme o plano contratado
    const tenant = await get(`SELECT plan, max_users, extra_users_count, is_master, is_exempt FROM tenants WHERE id = ?`, [tenantId]);
    if (tenant && !tenant.is_master && !tenant.is_exempt) {
      const plan = (tenant.plan || 'SOLO').toUpperCase();

      // No Plano SOLO (autônoma/individual), não é permitido cadastrar profissionais extras
      if (plan === 'SOLO') {
        const currentCount = await get(`SELECT COUNT(*) as count FROM professionals WHERE tenant_id = ? AND active = 1`, [tenantId]);
        if (currentCount && currentCount.count >= 1) {
          return res.status(403).json({
            error: 'O Plano Solo é exclusivo para profissionais autônomos (1 usuário). Para cadastrar e gerenciar novos membros na sua equipe, faça upgrade para o Plano Starter (até 2 profissionais) ou Studio Pro.'
          });
        }
      }

      const planBaseUsers = plan === 'PREMIER' ? 15 : plan === 'STUDIO' ? 5 : plan === 'STARTER' ? 2 : 1;
      const allowedSeats = (tenant.max_users || planBaseUsers) + (tenant.extra_users_count || 0);
      const currentCount = await get(`SELECT COUNT(*) as count FROM professionals WHERE tenant_id = ? AND active = 1`, [tenantId]);
      if (currentCount && currentCount.count >= allowedSeats) {
        return res.status(403).json({
          error: `Limite de colaboradores atingido (${allowedSeats} vagas no plano ${plan}). Adicione vagas extras por +R$ 15/mês ou faça upgrade para o plano superior.`
        });
      }
    }

    const hashedPassword = password ? hashPassword(password) : hashPassword('123456');

    const result = await run(
      `INSERT INTO professionals (
        name, nickname, role, access_level, subtypes, phone, email, password,
        color_hex, specialties, default_commission_type, default_commission_value,
        work_schedule, active, tenant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        name,
        nickname || name.split(' ')[0],
        role || 'Profissional',
        access_level,
        JSON.stringify(subtypes || []),
        phone || null,
        email || null,
        hashedPassword,
        color_hex || '#ec4899',
        JSON.stringify(specialties || []),
        default_commission_type || 'percentage',
        default_commission_value ?? 50.0,
        JSON.stringify(work_schedule || {}),
        tenantId
      ]
    );

    const profId = result.lastID;

    // Salvar comissões customizadas
    if (Array.isArray(custom_commissions)) {
      for (const cc of custom_commissions) {
        if (cc.service_id) {
          await run(
            `INSERT INTO professional_commissions (professional_id, service_id, commission_type, commission_value, tenant_id)
             VALUES (?, ?, ?, ?, ?)`,
            [profId, cc.service_id, cc.commission_type || 'percentage', cc.commission_value, tenantId]
          );
        }
      }
    }

    res.status(201).json({ id: profId, message: 'Profissional cadastrado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Atualizar profissional (Exclusivo ADMIN/GERENTE ou o próprio usuário editando seus dados básicos)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Não autenticado.' });

    const userRole = (req.user?.accessLevel || 'PROFISSIONAL').toUpperCase();
    const isMaster = Boolean(req.user?.isMaster);
    const isAdminOrGerente = isMaster || ['ADMIN', 'GERENTE'].includes(userRole);
    const isSelf = String(req.user?.userId || req.user?.id) === String(id);

    if (!isAdminOrGerente && !isSelf) {
      return res.status(403).json({ error: 'Você não possui permissão para editar outros colaboradores.' });
    }

    const {
      name,
      nickname,
      role,
      access_level,
      subtypes,
      phone,
      email,
      password,
      color_hex,
      specialties,
      default_commission_type,
      default_commission_value,
      work_schedule,
      active,
      custom_commissions
    } = req.body;

    // Se for o próprio profissional não-admin, impede alteração de seu próprio access_level e comissão
    const safeAccessLevel = isAdminOrGerente ? access_level : undefined;
    const safeRole = isAdminOrGerente ? role : undefined;
    const safeCommissionType = isAdminOrGerente ? default_commission_type : undefined;
    const safeCommissionValue = isAdminOrGerente ? default_commission_value : undefined;

    let updatePasswordSql = '';
    const params = [
      name,
      nickname,
      safeRole,
      safeAccessLevel,
      JSON.stringify(subtypes || []),
      phone,
      email,
      color_hex,
      JSON.stringify(specialties || []),
      safeCommissionType,
      safeCommissionValue,
      JSON.stringify(work_schedule || {}),
      active
    ];

    if (password) {
      updatePasswordSql = ', password = ?';
      params.push(hashPassword(password));
    }

    params.push(id, tenantId);

    await run(
      `UPDATE professionals 
       SET name = ?, nickname = ?, role = COALESCE(?, role), access_level = COALESCE(?, access_level),
           subtypes = ?, phone = ?, email = ?, color_hex = ?, 
           specialties = ?, default_commission_type = COALESCE(?, default_commission_type), default_commission_value = COALESCE(?, default_commission_value), 
           work_schedule = ?, active = COALESCE(?, active) ${updatePasswordSql}
       WHERE id = ? AND tenant_id = ?`,
      params
    );

    // Atualizar comissões customizadas apenas se for ADMIN/GERENTE
    if (isAdminOrGerente && Array.isArray(custom_commissions)) {
      await run('DELETE FROM professional_commissions WHERE professional_id = ? AND tenant_id = ?', [id, tenantId]);
      for (const cc of custom_commissions) {
        if (cc.service_id) {
          await run(
            `INSERT INTO professional_commissions (professional_id, service_id, commission_type, commission_value, tenant_id)
             VALUES (?, ?, ?, ?, ?)`,
            [id, cc.service_id, cc.commission_type || 'percentage', cc.commission_value, tenantId]
          );
        }
      }
    }

    res.json({ message: 'Profissional atualizado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Excluir profissional (Exclusivo ADMIN/GERENTE)
router.delete('/:id', requireRole(['ADMIN', 'GERENTE']), async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Não autenticado.' });

    await run('DELETE FROM professionals WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    res.json({ message: 'Profissional removido com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
