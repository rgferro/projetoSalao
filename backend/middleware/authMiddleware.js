const { verifySessionToken } = require('../services/authService');
const { get } = require('../database/db');

/**
 * Middleware que extrai a sessão e o tenantId de forma transparente
 */
const extractAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const headerTenant = req.headers['x-tenant-id'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      const session = verifySessionToken(token);
      if (session) {
        if (session.email && session.email.toLowerCase() === 'rafael.gielow@gmail.com') {
          session.isMaster = true;
          session.accessLevel = 'ADMIN';
        }
        req.user = session;
        req.tenantId = session.tenantId || headerTenant || null;
        return next();
      }
    }

    // Se não houver token válido, usa tenantId do header se enviado
    req.tenantId = headerTenant || null;
    req.user = null;
    next();
  } catch (error) {
    req.tenantId = null;
    req.user = null;
    next();
  }
};

/**
 * Exige autenticação válida
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Acesso restrito. Faça login para continuar.' });
  }
  next();
};

/**
 * Exige que o usuário seja Super Admin Master do SaaS
 */
const requireMaster = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  // Verifica e-mail master oficial
  if (req.user.email && req.user.email.toLowerCase() === 'rafael.gielow@gmail.com') {
    req.user.isMaster = true;
    return next();
  }

  // Verifica na sessão ou consulta no banco
  if (req.user.isMaster) {
    return next();
  }

  const tenant = await get(`SELECT is_master FROM tenants WHERE id = ?`, [req.user.tenantId]);
  if (tenant && tenant.is_master) {
    req.user.isMaster = true;
    return next();
  }

  return res.status(403).json({ error: 'Acesso restrito ao Super Admin Master da plataforma.' });
};

/**
 * Exige permissão baseada em papéis (RBAC)
 */
const requireRole = (allowedRoles = ['ADMIN']) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    const userRole = (req.user.accessLevel || 'PROFISSIONAL').toUpperCase();
    const isMaster = req.user.isMaster;

    if (isMaster || allowedRoles.map(r => r.toUpperCase()).includes(userRole)) {
      return next();
    }

    return res.status(403).json({ error: 'Você não possui permissão para executar esta ação.' });
  };
};

module.exports = {
  extractAuth,
  requireAuth,
  requireMaster,
  requireRole
};
