---
name: mercadopago-saas-subscription
description: Arquitetura e implementação de cobrança de assinaturas SaaS e PIX automático via Mercado Pago API (sem SDKs pesados, 100% nativo com idempotência e Webhook).
---

# Mercado Pago SaaS Subscription & PIX Integration Skill

Guia de implementação de cobrança recorrente, geração de PIX dinâmico com QR Code, checkout de cartão e processamento de Webhooks do Mercado Pago para aplicações SaaS (Node.js / Next.js / Express).

---

## 🏗️ 1. Arquitetura da Solução

O fluxo conecta a aplicação diretamente à API REST do Mercado Pago (`api.mercadopago.com`) usando autenticação por `Bearer Token` (`MP_ACCESS_TOKEN`):

1. **Assinatura Recorrente no Cartão (`/preapproval`):**
   * Cria plano de débito mensal automático com renovação transparente.
2. **Pagamento Avulso / Mensal via PIX (`/v1/payments`):**
   * Cria pagamento PIX instantâneo com `X-Idempotency-Key`, gerando:
     - `qr_code`: Chave Copia e Cola.
     - `qr_code_base64`: Imagem do QR Code para exibição imediata no modal do cliente.
3. **Webhook de Notificação Automática (`/api/webhooks/mercadopago`):**
   * Recebe eventos de `payment.updated` e `preapproval`, consulta a API oficial do Mercado Pago para confirmação de segurança e atualiza o status da assinatura do Tenant/Empresa para `active` até a próxima data de expiração (`expires_at = NOW() + 30 days`).

---

## 💻 2. Código de Referência de Produção (Extraído do PrazosOnline)

### A. Criação de Pagamento PIX Instantâneo
```javascript
const https = require('https');

async function createMercadoPagoPixPayment(user, amount, planName = 'Assinatura Mensal') {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      transaction_amount: Number(amount),
      description: `${planName} - ${user.companyName || user.email}`,
      payment_method_id: 'pix',
      payer: {
        email: user.email,
        first_name: user.name?.split(' ')[0] || 'Cliente',
        last_name: user.name?.split(' ').slice(1).join(' ') || 'SaaS',
        identification: {
          type: user.document?.length > 11 ? 'CNPJ' : 'CPF',
          number: user.document?.replace(/\D/g, '') || '00000000000',
        },
      },
      notification_url: `${process.env.APP_URL}/api/webhooks/mercadopago`,
    });

    const req = https.request(
      {
        hostname: 'api.mercadopago.com',
        path: '/v1/payments',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          'X-Idempotency-Key': `pix_${user.id}_${Date.now()}`,
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
                payment_id: data.id,
                status: data.status,
                qr_code: poi?.qr_code,
                qr_code_base64: poi?.qr_code_base64,
                ticket_url: poi?.ticket_url,
              });
            } else {
              reject(new Error(data.message || 'Erro ao gerar PIX no Mercado Pago'));
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}
```

---

### B. Criação de Assinatura Recorrente no Cartão (`/preapproval`)
```javascript
async function createMercadoPagoPreapproval(user, amount, planName = 'Plano Pro Oficina') {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      payer_email: user.email,
      back_url: `${process.env.APP_URL}/financeiro/assinatura?success=true`,
      reason: planName,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: Number(amount),
        currency_id: 'BRL',
      },
      external_reference: String(user.id),
      notification_url: `${process.env.APP_URL}/api/webhooks/mercadopago`,
    });

    const req = https.request(
      {
        hostname: 'api.mercadopago.com',
        path: '/preapproval',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
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
    req.write(postData);
    req.end();
  });
}
```

---

### C. Webhook de Confirmação Segura do Pagamento
```javascript
async function handleMercadoPagoWebhook(req, res, onPaymentApproved) {
  try {
    const { action, type, data } = req.body;
    const paymentId = data?.id || req.query?.['data.id'] || req.query?.id;

    if (paymentId) {
      // Consulta a API do Mercado Pago diretamente para prevenir webhooks forjados
      const payment = await getMercadoPagoPaymentStatus(paymentId);

      if (payment.status === 'approved') {
        const userId = payment.external_reference || payment.payer?.id;
        const amount = payment.transaction_amount;

        // Callback para estender assinatura (+30 dias)
        await onPaymentApproved({
          userId,
          paymentId: payment.id,
          amount,
          paymentMethod: payment.payment_method_id,
        });

        console.log(`✅ Pagamento Mercado Pago Aprovado: ${paymentId}`);
      }
    }

    return res.status(200).send('OK');
  } catch (err) {
    console.error('Erro no webhook MP:', err.message);
    return res.status(200).send('OK'); // Retorna 200 para evitar retries desnecessários
  }
}
```

---

## 📋 3. Variáveis de Ambiente Necessárias (`.env`)
```env
MP_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxx
MP_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
APP_URL=https://seusaas.com.br
```
