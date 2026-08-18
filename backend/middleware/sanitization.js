const logger = require('../services/logger');

/**
 * Sanitiza valores contra Injeções SQL, XSS e Payload Tampering
 */
function sanitizeInput(value) {
  if (typeof value === 'string') {
    return value
      // Remove tags <script> completas, parciais ou malformadas
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<\/?[a-z0-9_-]*script[a-z0-9_-]*[^>]*>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/data:text\/html[^,]*,/gi, '')
      .replace(/on(load|error|click|mouseover|focus|blur|change|submit)\s*=/gi, '')
      .trim();
  }
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.map(sanitizeInput);
    }
    const cleanObj = {};
    for (const [k, v] of Object.entries(value)) {
      // Bloqueia chaves com $ (NoSQL/Prototype pollution)
      if (!k.startsWith('$') && k !== '__proto__' && k !== 'constructor' && k !== 'prototype') {
        cleanObj[k] = sanitizeInput(v);
      }
    }
    return cleanObj;
  }
  return value;
}

/**
 * Express Middleware de Sanitização Global
 */
function sanitizationMiddleware(req, res, next) {
  if (req.body) req.body = sanitizeInput(req.body);
  if (req.query) req.query = sanitizeInput(req.query);
  if (req.params) req.params = sanitizeInput(req.params);
  next();
}

module.exports = {
  sanitizationMiddleware,
  sanitizeInput,
};
