const { verifySessionToken } = require('../services/authService');
const { get } = require('../database/db');
const logger = require('../services/logger');

/**
 * Função utilitária para capturar o IP real da requisição
 */
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || req.ip || '0.0.0.0';
};

/**
 * Middleware que extrai a sessão e o tenantId de forma transparente
 */
const extractAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      const session = verifySessionToken(token);
      if (session) {
        if (session.email && session.email.toLowerCase() === 'rafael.gielow@gmail.com') {
          session.isMaster = true;
          session.accessLevel = 'ADMIN';
        }
        req.user = session;
        req.tenantId = session.tenantId || null;
        return next();
      }
    }

    req.tenantId = null;
    req.user = null;
    next();
  } catch (error) {
    req.tenantId = null;
    req.user = null;
    next();
  }
};

/**
 * Exige autenticação válida (HTTP 401)
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    const clientIp = getClientIp(req);
    logger.security('Tentativa de acesso não autenticado (401)', {
      ip: clientIp,
      method: req.method,
      path: req.originalUrl || req.path,
      timestamp: new Date().toISOString(),
    });
    return res.status(401).json({ error: 'Acesso restrito. Faça login para continuar.' });
  }
  next();
};

/**
 * Exige que o usuário seja Super Admin Master do SaaS (HTTP 403)
 */
const requireMaster = async (req, res, next) => {
  const clientIp = getClientIp(req);

  if (!req.user) {
    logger.security('Tentativa de acesso não autenticado a endpoint Master (401)', {
      ip: clientIp,
      method: req.method,
      path: req.originalUrl || req.path,
      timestamp: new Date().toISOString(),
    });
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

  if (req.user.tenantId) {
    const tenant = await get(`SELECT is_master FROM tenants WHERE id = ?`, [req.user.tenantId]);
    if (tenant && tenant.is_master) {
      req.user.isMaster = true;
      return next();
    }
  }

  logger.security('Acesso negado: Tentativa não autorizada a recurso Master (403)', {
    userId: req.user.userId || req.user.id,
    userEmail: req.user.email,
    tenantId: req.user.tenantId,
    ip: clientIp,
    method: req.method,
    path: req.originalUrl || req.path,
    timestamp: new Date().toISOString(),
  });

  return res.status(403).json({ error: 'Acesso restrito ao Super Admin Master da plataforma.' });
};

/**
 * Exige permissão baseada em papéis RBAC / ABAC (HTTP 403)
 */
const requireRole = (allowedRoles = ['ADMIN']) => {
  return (req, res, next) => {
    const clientIp = getClientIp(req);

    if (!req.user) {
      logger.security('Tentativa de acesso a recurso protegido por role sem autenticação (401)', {
        ip: clientIp,
        method: req.method,
        path: req.originalUrl || req.path,
        allowedRoles,
        timestamp: new Date().toISOString(),
      });
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    const userRole = (req.user.accessLevel || 'PROFISSIONAL').toUpperCase();
    const isMaster = Boolean(req.user.isMaster);
    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());

    if (isMaster || normalizedAllowed.includes(userRole)) {
      return next();
    }

    logger.security('Acesso negado por RBAC (403 Forbidden)', {
      userId: req.user.userId || req.user.id,
      userEmail: req.user.email,
      userRole,
      allowedRoles: normalizedAllowed,
      tenantId: req.user.tenantId,
      ip: clientIp,
      method: req.method,
      path: req.originalUrl || req.path,
      timestamp: new Date().toISOString(),
    });

    return res.status(403).json({ error: 'Você não possui permissão para acessar este recurso ou executar esta ação.' });
  };
};

module.exports = {
  extractAuth,
  requireAuth,
  requireMaster,
  requireRole,
  getClientIp
};
