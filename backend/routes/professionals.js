const express = require('express');
const router = express.Router();
const { query, get, run } = require('../database/db');
const { hashPassword } = require('../services/authService');

// 1. Listar Especialidades / Funções Extensíveis por Tenant
router.get('/specialties', async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant_default_salao';
    const list = await query(`
      SELECT * FROM custom_specialties 
      WHERE tenant_id = ? OR tenant_id = 'tenant_default' OR tenant_id = 'tenant_default_salao'
      ORDER BY category ASC, name ASC
    `, [tenantId]);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Cadastrar Nova Especialidade / Função Customizada
router.post('/specialties', async (req, res) => {
  try {
    const { name, category = 'Geral', icon = 'Sparkles' } = req.body;
    const tenantId = req.tenantId || 'tenant_default_salao';
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

// 3. Listar todos os profissionais da equipe do Tenant
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant_default_salao';
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
    const tenantId = req.tenantId || 'tenant_default_salao';
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

// 5. Criar profissional com verificação de limite do plano
router.post('/', async (req, res) => {
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
      pin_code = '1234',
      color_hex,
      specialties,
      default_commission_type,
      default_commission_value,
      work_schedule,
      custom_commissions
    } = req.body;
    const tenantId = req.tenantId || 'tenant_default_salao';

    if (!name) {
      return res.status(400).json({ error: 'Nome do profissional é obrigatório.' });
    }

    // Verificar limite de usuários do tenant (incluindo profissionais extras)
    const tenant = await get(`SELECT plan, max_users, extra_users_count FROM tenants WHERE id = ?`, [tenantId]);
    if (tenant) {
      const allowedSeats = (tenant.max_users || 2) + (tenant.extra_users_count || 0);
      const currentCount = await get(`SELECT COUNT(*) as count FROM professionals WHERE tenant_id = ? AND active = 1`, [tenantId]);
      if (currentCount && currentCount.count >= allowedSeats) {
        return res.status(403).json({
          error: `Limite de colaboradores atingido (${allowedSeats} vagas no plano ${tenant.plan}). Adicione vagas extras por +R$ 15/mês ou faça upgrade de plano.`
        });
      }
    }

    const hashedPassword = password ? hashPassword(password) : hashPassword('123456');

    const result = await run(
      `INSERT INTO professionals (
        name, nickname, role, access_level, subtypes, phone, email, password,
        pin_code, color_hex, specialties, default_commission_type, default_commission_value,
        work_schedule, active, tenant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        name,
        nickname || name.split(' ')[0],
        role || 'Profissional',
        access_level,
        JSON.stringify(subtypes || []),
        phone || null,
        email || null,
        hashedPassword,
        pin_code || '1234',
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

// 6. Atualizar profissional
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId || 'tenant_default_salao';
    const {
      name,
      nickname,
      role,
      access_level,
      subtypes,
      phone,
      email,
      pin_code,
      password,
      color_hex,
      specialties,
      default_commission_type,
      default_commission_value,
      work_schedule,
      active,
      custom_commissions
    } = req.body;

    let updatePasswordSql = '';
    const params = [
      name,
      nickname,
      role,
      access_level,
      JSON.stringify(subtypes || []),
      phone,
      email,
      pin_code,
      color_hex,
      JSON.stringify(specialties || []),
      default_commission_type,
      default_commission_value,
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
           subtypes = ?, phone = ?, email = ?, pin_code = COALESCE(?, pin_code), color_hex = ?, 
           specialties = ?, default_commission_type = ?, default_commission_value = ?, 
           work_schedule = ?, active = COALESCE(?, active) ${updatePasswordSql}
       WHERE id = ? AND tenant_id = ?`,
      params
    );

    // Atualizar comissões customizadas
    if (Array.isArray(custom_commissions)) {
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

// 7. Excluir profissional
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId || 'tenant_default_salao';
    await run('DELETE FROM professionals WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    res.json({ message: 'Profissional removido com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
