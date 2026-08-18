/**
 * Módulo de Log Estruturado Seguro
 * Mascara credenciais, tokens, senhas e documentos para evitar vazamento em logs
 */

const SENSITIVE_KEYS = ['password', 'token', 'access_token', 'mp_access_token', 'brevo_api_key', 'pin_code', 'pin', 'cpf', 'cnpj', 'document', 'card_number', 'cvv'];

function maskValue(val) {
  if (!val || typeof val !== 'string') return '***';
  if (val.length <= 4) return '****';
  return val.substring(0, 2) + '*'.repeat(val.length - 4) + val.substring(val.length - 2);
}

function sanitizeLogData(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeLogData);

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((k) => lowerKey.includes(k))) {
      sanitized[key] = maskValue(String(value));
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

const logger = {
  info: (msg, meta) => {
    const time = new Date().toISOString();
    if (meta) {
      console.log(`[${time}] ℹ️ INFO: ${msg}`, sanitizeLogData(meta));
    } else {
      console.log(`[${time}] ℹ️ INFO: ${msg}`);
    }
  },
  warn: (msg, meta) => {
    const time = new Date().toISOString();
    if (meta) {
      console.warn(`[${time}] ⚠️ WARN: ${msg}`, sanitizeLogData(meta));
    } else {
      console.warn(`[${time}] ⚠️ WARN: ${msg}`);
    }
  },
  error: (msg, meta) => {
    const time = new Date().toISOString();
    if (meta) {
      console.error(`[${time}] ❌ ERROR: ${msg}`, sanitizeLogData(meta));
    } else {
      console.error(`[${time}] ❌ ERROR: ${msg}`);
    }
  },
  security: (msg, meta) => {
    const time = new Date().toISOString();
    console.warn(`[${time}] 🛡️ SECURITY EVENT: ${msg}`, sanitizeLogData(meta));
  },
  sanitize: sanitizeLogData,
};

module.exports = logger;
