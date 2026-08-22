const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
require('dotenv').config();
const https = require('https');
const circuitBreakers = require('./circuitBreaker');
const logger = require('./logger');

const getMPAccessToken = () => process.env.MP_ACCESS_TOKEN || '';
const getAppUrl = () => process.env.APP_URL || 'https://belagestaostudio.com.br';

/**
 * Cria cobrança PIX mensal com QR Code Copia e Cola, Base64 e proteção de Circuit Breaker
 */
async function createMercadoPagoPixPayment(tenant, amount, planName = 'Plano Pro Salão') {
  const token = getMPAccessToken();
  const appUrl = getAppUrl();

  if (!token) {
    logger.info(`[Mercado Pago Simulado] Gerando PIX Mensal de R$ ${amount} para ${tenant.name}`);
    const simulatedId = `pix_sim_${Date.now()}`;
    const simulatedQrCode = `00020126580014br.gov.bcb.pix0136${tenant.id || 'bellagestao'}520400005303986540${amount}.005802BR5920BelaGestao Studio6009Sao Paulo62070503***6304E8A2`;

    const QRCode = require('qrcode');
    const qrBase64 = await QRCode.toDataURL(simulatedQrCode);

    return {
      payment_id: simulatedId,
      status: 'pending',
      qr_code: simulatedQrCode,
      qr_code_base64: qrBase64.replace(/^data:image\/png;base64,/, ''),
      ticket_url: 'https://mercadopago.com.br',
      simulated: true,
    };
  }

  const makeRequest = () => {
    return new Promise((resolve, reject) => {
      const payload = {
        transaction_amount: Number(amount),
        description: `Mensalidade ${planName} - ${tenant.name || tenant.owner_name}`,
        payment_method_id: 'pix',
        payer: {
          email: tenant.owner_email || tenant.email,
          first_name: (tenant.owner_name || tenant.name || 'Cliente').split(' ')[0],
          last_name: (tenant.owner_name || 'Salão').split(' ').slice(1).join(' ') || 'Studio',
          identification: {
            type: (tenant.document || '').replace(/\D/g, '').length > 11 ? 'CNPJ' : 'CPF',
            number: (tenant.document || '').replace(/\D/g, '') || '00000000000',
          },
        },
      };

      if (appUrl && !appUrl.includes('localhost') && !appUrl.includes('127.0.0.1')) {
        payload.notification_url = `${appUrl}/api/subscription/webhook`;
      }

      const postData = JSON.stringify(payload);

      const req = https.request(
        {
          hostname: 'api.mercadopago.com',
          path: '/v1/payments',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-Idempotency-Key': `pix_${tenant.id}_${Date.now()}`,
          },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            try {
              const data = JSON.parse(body);
              if (data.id) {
                const poi = data.point_of_interaction?.transaction_data;
                resolve({
                  payment_id: String(data.id),
                  status: data.status,
                  qr_code: poi?.qr_code,
                  qr_code_base64: poi?.qr_code_base64,
                  ticket_url: poi?.ticket_url,
                });
              } else {
                reject(new Error(data.message || (data.cause && data.cause[0] ? data.cause[0].description : 'Erro ao gerar PIX no Mercado Pago')));
              }
            } catch (e) {
              reject(e);
            }
          });
        }
      );

      req.on('error', reject);
      req.setTimeout(10000, () => req.destroy(new Error('Mercado Pago PIX Timeout (10s)')));
      req.write(postData);
      req.end();
    });
  };

  return await circuitBreakers.mercadopago.execute(makeRequest, (fallbackErr) => {
    logger.warn(`[Mercado Pago Fallback] Indisponibilidade de API: ${fallbackErr.message}`);
    throw new Error(fallbackErr.message || 'Serviço de pagamento temporariamente instável. Tente novamente em alguns instantes.');
  });
}

/**
 * Cria assinatura recorrente no Cartão de Crédito via /preapproval com Circuit Breaker
 */
async function createMercadoPagoPreapproval(tenant, amount, planName = 'Plano Pro BelaGestão') {
  const token = getMPAccessToken();
  const appUrl = getAppUrl();

  if (!token) {
    logger.info(`[Mercado Pago Simulado] Gerando Assinatura Mensal de R$ ${amount}/mês para ${tenant.name}`);
    return {
      preapproval_id: `preapp_sim_${Date.now()}`,
      init_point: `${appUrl}/assinatura?simulated_checkout=true`,
      simulated: true,
    };
  }

  const makeRequest = () => {
    return new Promise((resolve, reject) => {
      const payload = {
        payer_email: tenant.owner_email,
        back_url: `${appUrl}/assinatura?success=true`,
        reason: `Mensalidade ${planName}`,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: Number(amount),
          currency_id: 'BRL',
        },
        external_reference: String(tenant.id),
      };

      if (appUrl && !appUrl.includes('localhost') && !appUrl.includes('127.0.0.1')) {
        payload.notification_url = `${appUrl}/api/subscription/webhook`;
      }

      const postData = JSON.stringify(payload);

      const req = https.request(
        {
          hostname: 'api.mercadopago.com',
          path: '/preapproval',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            try {
              const data = JSON.parse(body);
              if (data.id && data.init_point) {
                resolve({
                  preapproval_id: data.id,
                  init_point: data.init_point,
                });
              } else {
                reject(new Error(data.message || 'Erro ao criar assinatura recorrente'));
              }
            } catch (e) {
              reject(e);
            }
          });
        }
      );

      req.on('error', reject);
      req.setTimeout(10000, () => req.destroy(new Error('Mercado Pago Preapproval Timeout (10s)')));
      req.write(postData);
      req.end();
    });
  };

  return await circuitBreakers.mercadopago.execute(makeRequest);
}

/**
 * Consulta status de pagamento diretamente na API do Mercado Pago
 */
async function getMercadoPagoPaymentStatus(paymentId) {
  const token = getMPAccessToken();

  if (!token || String(paymentId).startsWith('pix_sim_')) {
    return { id: paymentId, status: 'approved', transaction_amount: 69.9 };
  }

  const makeRequest = () => {
    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: 'api.mercadopago.com',
          path: `/v1/payments/${paymentId}`,
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            try {
              const data = JSON.parse(body);
              resolve(data);
            } catch (e) {
              reject(e);
            }
          });
        }
      );

      req.on('error', reject);
      req.setTimeout(8000, () => req.destroy(new Error('Mercado Pago Status Timeout (8s)')));
      req.end();
    });
  };

  return await circuitBreakers.mercadopago.execute(makeRequest, () => {
    return { id: paymentId, status: 'pending', fallback: true };
  });
}

/**
 * Cancela assinatura recorrente no Mercado Pago (/preapproval/{id})
 */
async function cancelMercadoPagoPreapproval(preapprovalId) {
  const token = getMPAccessToken();

  if (!token || String(preapprovalId).startsWith('preapp_sim_')) {
    logger.info(`[Mercado Pago Simulado] Cancelando assinatura ${preapprovalId}`);
    return { id: preapprovalId, status: 'cancelled' };
  }

  const makeRequest = () => {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify({ status: 'cancelled' });
      const req = https.request(
        {
          hostname: 'api.mercadopago.com',
          path: `/preapproval/${preapprovalId}`,
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            try {
              const data = JSON.parse(body);
              resolve(data);
            } catch (e) {
              reject(e);
            }
          });
        }
      );

      req.on('error', reject);
      req.setTimeout(10000, () => req.destroy(new Error('Mercado Pago Cancel Timeout (10s)')));
      req.write(payload);
      req.end();
    });
  };

  return await circuitBreakers.mercadopago.execute(makeRequest, () => ({ id: preapprovalId, status: 'cancelled' }));
}

/**
 * Consulta status da assinatura recorrente no Mercado Pago (/preapproval/{id})
 */
async function getMercadoPagoPreapprovalStatus(preapprovalId) {
  const token = getMPAccessToken();

  if (!token || String(preapprovalId).startsWith('preapp_sim_')) {
    return { id: preapprovalId, status: 'authorized' };
  }

  const makeRequest = () => {
    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: 'api.mercadopago.com',
          path: `/preapproval/${preapprovalId}`,
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            try {
              const data = JSON.parse(body);
              resolve(data);
            } catch (e) {
              reject(e);
            }
          });
        }
      );

      req.on('error', reject);
      req.setTimeout(8000, () => req.destroy(new Error('Mercado Pago Preapproval Status Timeout (8s)')));
      req.end();
    });
  };

  return await circuitBreakers.mercadopago.execute(makeRequest, () => ({ id: preapprovalId, status: 'authorized' }));
}

module.exports = {
  createMercadoPagoPixPayment,
  createMercadoPagoPreapproval,
  cancelMercadoPagoPreapproval,
  getMercadoPagoPreapprovalStatus,
  getMercadoPagoPaymentStatus,
};

