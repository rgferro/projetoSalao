const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'BELLA_GESTAO_SECURE_SECRET_2026';

function validateCPF(cpf) {
  if (!cpf) return false;
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11 || /^(\d)\1{10}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(clean.charAt(i)) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev >= 10) rev = 0;
  if (rev !== parseInt(clean.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(clean.charAt(i)) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev >= 10) rev = 0;
  return rev === parseInt(clean.charAt(10));
}

function validateCNPJ(cnpj) {
  if (!cnpj) return false;
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14 || /^(\d)\1{13}$/.test(clean)) return false;

  let length = 12, numbers = clean.substring(0, length), digits = clean.substring(length), sum = 0, pos = length - 7;
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  length = 13; numbers = clean.substring(0, length); sum = 0; pos = length - 7;
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1));
}

function validatePasswordStrength(password) {
  if (!password) return { isValid: false, score: 0 };
  const checks = {
    length: password.length >= 6,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  // Considera válido se tiver pelo menos 6 caracteres e combinação básica
  return { isValid: password.length >= 6, score, checks };
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

function createSessionToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30; // 30 dias
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifySessionToken(token) {
  try {
    if (!token || !token.includes('.')) return null;
    const [header, body, signature] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

module.exports = {
  validateCPF,
  validateCNPJ,
  validatePasswordStrength,
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
};
