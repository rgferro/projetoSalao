const logger = require('./logger');

/**
 * Padrão Circuit Breaker com Retry e Exponential Backoff
 */
class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 3; // falhas para abrir
    this.recoveryTimeout = options.recoveryTimeout || 10000; // 10s para tentar half-open
    this.maxRetries = options.maxRetries || 3;
    this.baseDelayMs = options.baseDelayMs || 200;

    this.state = 'CLOSED'; // 'CLOSED', 'OPEN', 'HALF_OPEN'
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }

  /**
   * Executa a operação com proteção de Circuit Breaker e Retry com Exponential Backoff
   */
  async execute(action, fallback = null) {
    const now = Date.now();

    // 1. Checar se o circuito deve transitar de OPEN para HALF_OPEN
    if (this.state === 'OPEN') {
      if (now - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
        logger.info(`[Circuit Breaker: ${this.name}] Transição para HALF_OPEN. Testando serviço...`);
      } else {
        logger.warn(`[Circuit Breaker: ${this.name}] Circuito ABERTO. Executando fallback imediato.`);
        if (typeof fallback === 'function') {
          return await fallback(new Error(`Circuito ${this.name} temporariamente aberto.`));
        }
        throw new Error(`Serviço ${this.name} temporariamente indisponível (Circuit Breaker OPEN).`);
      }
    }

    // 2. Tentar executar com Retry e Exponential Backoff
    let lastError = null;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await action();
        this._onSuccess();
        return result;
      } catch (err) {
        lastError = err;
        logger.warn(`[Circuit Breaker: ${this.name}] Falha na tentativa ${attempt}/${this.maxRetries}: ${err.message}`);

        if (attempt < this.maxRetries) {
          // Exponential backoff com jitter aleatório
          const delay = this.baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 50;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // 3. Todas as tentativas falharam
    this._onFailure(lastError);

    if (typeof fallback === 'function') {
      return await fallback(lastError);
    }
    throw lastError;
  }

  _onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      logger.info(`[Circuit Breaker: ${this.name}] Serviço recuperado! Circuito FECHADO.`);
    }
  }

  _onFailure(err) {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN' || this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.security(`[Circuit Breaker: ${this.name}] Limite de falhas atingido (${this.failureCount}). Circuito ABERTO!`, {
        error: err.message,
      });
    }
  }

  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
    };
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
  }
}

// Instâncias compartilhadas dos Circuit Breakers do sistema
const circuitBreakers = {
  brevo: new CircuitBreaker('BrevoEmailAPI', { failureThreshold: 3, recoveryTimeout: 15000, maxRetries: 2 }),
  mercadopago: new CircuitBreaker('MercadoPagoAPI', { failureThreshold: 3, recoveryTimeout: 20000, maxRetries: 2 }),
  whatsapp: new CircuitBreaker('WhatsAppDaemon', { failureThreshold: 3, recoveryTimeout: 10000, maxRetries: 2 }),
  gdrive: new CircuitBreaker('GoogleDriveCloud', { failureThreshold: 2, recoveryTimeout: 30000, maxRetries: 2 }),
  CircuitBreaker,
};

module.exports = circuitBreakers;
