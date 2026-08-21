const crypto = require('crypto');
const logger = require('./logger');

const SECRET_SALT = process.env.LICENSE_CACHE_SECRET || 'BELLA_LICENSE_INTEGRITY_SALT_2026';
const GRACE_PERIOD_DAYS = 7; // 7 dias de tolerância offline

/**
 * Assina dados de licença com HMAC SHA-256 para prevenir adulteração local
 */
function generateLicenseSignature(licenseData) {
  const payload = `${licenseData.tenantId}|${licenseData.plan}|${licenseData.expiresAt}|${licenseData.maxUsers}`;
  return crypto.createHmac('sha256', SECRET_SALT).update(payload).digest('hex');
}

/**
 * Valida se a assinatura local do cache é genuína
 */
function verifyLicenseSignature(licenseData, signature) {
  if (!signature) return false;
  const expected = generateLicenseSignature(licenseData);
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
}

/**
 * Gerenciador de Licença com Grace Period e Modo Degradado
 */
class LicenseCacheManager {
  constructor() {
    this.memoryCache = new Map();
  }

  /**
   * Armazena licença no cache com assinatura digital
   */
  cacheLicense(tenantId, plan, expiresAt, maxUsers = 5) {
    const licenseData = {
      tenantId,
      plan: plan || 'PRO',
      expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      maxUsers,
      cachedAt: new Date().toISOString(),
    };
    const signature = generateLicenseSignature(licenseData);

    this.memoryCache.set(tenantId, {
      data: licenseData,
      signature,
    });

    logger.info(`[LicenseCache] Licença assinada e cacheada para tenant: ${tenantId}`, {
      plan,
      expiresAt: licenseData.expiresAt,
    });

    return { ...licenseData, signature };
  }

  /**
   * Avalia o status da licença aplicando Período de Carência (Grace Period) e Modo Degradado
   */
  evaluateLicense(tenantId, dbTenant = null) {
    const now = new Date();

    // 1. Se temos dados do banco de dados local
    if (dbTenant) {
      // 1.1 Se for isento vitalício (Cortesia Master)
      if (dbTenant.is_exempt || dbTenant.subscription_status === 'exempt' || dbTenant.is_master) {
        return {
          status: 'EXEMPT',
          plan: dbTenant.plan || 'PREMIER',
          maxUsers: dbTenant.max_users || 999,
          isDegraded: false,
          gracePeriodActive: false,
          daysRemaining: null,
          isExempt: true,
          message: 'Salão com Isenção Vitalícia / Cortesia Master ativa.',
        };
      }

      // 1.2 Se for Plano SOLO (gratuito)
      if ((dbTenant.plan || 'SOLO').toUpperCase() === 'SOLO') {
        return {
          status: 'ACTIVE',
          plan: 'SOLO',
          maxUsers: 1,
          isDegraded: false,
          gracePeriodActive: false,
          daysRemaining: null,
          isExempt: false,
          message: 'Plano Solo Gratuito ativo.',
        };
      }

      // 1.3 Planos Pagos (STARTER, STUDIO, PREMIER)
      let expDate = null;
      if (dbTenant.subscription_expires_at) {
        const rawDate = String(dbTenant.subscription_expires_at).trim();
        // Se a data do banco for fictícia do plano Solo (ex: 2099), define como 30 dias a partir de agora
        if (rawDate.startsWith('2099') || rawDate.startsWith('2100')) {
          expDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        } else {
          const isoString = rawDate.includes('T')
            ? (rawDate.endsWith('Z') ? rawDate : rawDate + 'Z')
            : rawDate.replace(' ', 'T') + 'Z';
          expDate = new Date(isoString);
          if (isNaN(expDate.getTime())) {
            expDate = new Date(rawDate);
          }
        }
      } else {
        expDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      const diffMs = expDate.getTime() - now.getTime();
      const isExpired = diffMs < 0;
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      if (!isExpired) {
        // Licença ativa e regular
        this.cacheLicense(tenantId, dbTenant.plan, expDate.toISOString(), dbTenant.max_users);
        return {
          status: 'ACTIVE',
          plan: dbTenant.plan || 'STARTER',
          maxUsers: dbTenant.max_users || (dbTenant.plan === 'STARTER' ? 2 : dbTenant.plan === 'STUDIO' ? 5 : 15),
          isDegraded: false,
          gracePeriodActive: false,
          daysRemaining,
          expiresAt: expDate.toISOString(),
          message: 'Licença ativa e regular.',
        };
      }

      // 2. Licença expirada: Checar se está dentro do Período de Carência (Grace Period)
      const expiredDays = Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60 * 24));

      if (expiredDays <= GRACE_PERIOD_DAYS) {
        const graceDaysLeft = Math.max(0, GRACE_PERIOD_DAYS - expiredDays);
        logger.warn(`[LicenseCache] Tenant ${tenantId} operando em Grace Period (${graceDaysLeft} dias restantes).`);
        return {
          status: 'GRACE_PERIOD',
          plan: dbTenant.plan || 'STARTER',
          maxUsers: dbTenant.max_users || 2,
          isDegraded: true,
          gracePeriodActive: true,
          graceDaysRemaining: graceDaysLeft,
          daysRemaining: 0,
          expiresAt: expDate.toISOString(),
          message: `Sua assinatura expirou. Modo de Carência ativo por mais ${graceDaysLeft} dias sem interrupção do salão.`,
        };
      }
    }

    // 3. Fallback de Cache Assinado
    const cached = this.memoryCache.get(tenantId);
    if (cached && verifyLicenseSignature(cached.data, cached.signature)) {
      logger.info(`[LicenseCache] Utilizando fallback de cache assinado para tenant: ${tenantId}`);
      return {
        status: 'CACHED_FALLBACK',
        plan: cached.data.plan,
        maxUsers: cached.data.maxUsers,
        isDegraded: true,
        gracePeriodActive: true,
        daysRemaining: 1,
        message: 'Conexão offline: operando com credenciais locais seguras.',
      };
    }

    // 4. Modo Degradado Básico (Starter) - NUNCA CRASHA O SISTEMA
    return {
      status: 'DEGRADED_STARTER',
      plan: 'STARTER',
      maxUsers: 2,
      isDegraded: true,
      gracePeriodActive: false,
      daysRemaining: 0,
      message: 'Operando no modo essencial gratuito. Renove sua assinatura para liberar todos os recursos.',
    };
  }
}

const licenseManager = new LicenseCacheManager();

module.exports = {
  licenseManager,
  generateLicenseSignature,
  verifyLicenseSignature,
  GRACE_PERIOD_DAYS,
};
