const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
require('dotenv').config();
const https = require('https');
const circuitBreakers = require('./circuitBreaker');
const logger = require('./logger');

const getBrevoConfig = () => ({
  apiKey: process.env.BREVO_API_KEY || '',
  senderEmail: process.env.BREVO_SENDER_EMAIL || 'contato@belagestaostudio.com.br',
  senderName: process.env.BREVO_SENDER_NAME || 'BellaGestão Studio',
});

/**
 * Envia e-mail transacional usando a API REST Oficial da Brevo (v3) com Circuit Breaker e Retry
 */
async function sendBrevoEmail(payloadData) {
  const config = getBrevoConfig();
  if (!config.apiKey) {
    logger.warn(`[Brevo Simulado] Chave BREVO_API_KEY não configurada no .env. Simulação para: ${payloadData.to?.[0]?.email} | Assunto: ${payloadData.subject}`);
    return { success: true, simulated: true };
  }

  const payload = JSON.stringify({
    sender: payloadData.sender || {
      name: config.senderName,
      email: config.senderEmail,
    },
    to: payloadData.to,
    subject: payloadData.subject,
    htmlContent: payloadData.htmlContent,
  });

  const makeRequest = () => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.brevo.com',
        port: 443,
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'api-key': config.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'BellaGestaoERP/1.0',
          'Content-Length': Buffer.byteLength(payload),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve({ success: true, data: JSON.parse(data) });
            } catch {
              resolve({ success: true, raw: data });
            }
          } else {
            reject(new Error(`Brevo HTTP Status ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(8000, () => {
        req.destroy(new Error('Brevo Request Timeout (8s)'));
      });

      req.write(payload);
      req.end();
    });
  };

  // Executar sob a proteção do Circuit Breaker com fallback elegante
  return await circuitBreakers.brevo.execute(makeRequest, (fallbackErr) => {
    logger.warn(`[Brevo Fallback] Não foi possível entregar e-mail: ${fallbackErr.message}`);
    return { success: false, fallback: true, error: fallbackErr.message };
  });
}

/**
 * Envia código de verificação de 6 dígitos para o e-mail do Dono do Salão
 */
async function sendVerificationEmail(targetEmail, code, salonName = 'BellaGestão') {
  logger.info(`Despachando código [${code}] para [${targetEmail}] via Brevo...`);

  return sendBrevoEmail({
    to: [{ email: targetEmail }],
    subject: `Seu Código de Confirmação: ${code} - ${salonName}`,
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 32px; color: #1e293b; max-width: 520px; margin: 0 auto; border: 1px solid #fce7f3; border-radius: 24px; background: #ffffff; box-shadow: 0 4px 20px rgba(236, 72, 153, 0.08);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 52px; height: 52px; line-height: 52px; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: #ffffff; font-size: 26px; border-radius: 16px;">✨</div>
          <h2 style="color: #0f172a; margin: 12px 0 0 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">BellaGestão Studio</h2>
          <p style="color: #ec4899; font-size: 12px; margin-top: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Gestão de Salões & Estética</p>
        </div>
        
        <p style="font-size: 15px; line-height: 1.5; color: #334155;">Olá!</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          Obrigado por escolher o <strong>BellaGestão Studio</strong>. Para ativar seu cadastro no plano Starter gratuito, digite o código de confirmação abaixo:
        </p>
        
        <div style="font-size: 38px; font-weight: 900; background: #fdf2f8; padding: 22px; border-radius: 18px; text-align: center; letter-spacing: 10px; color: #db2777; margin: 24px 0; border: 2px dashed #fbcfe8;">
          ${code}
        </div>
        
        <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; text-align: center;">⏱️ Este código é válido por <strong>15 minutos</strong>. Se você não solicitou esta confirmação, ignore esta mensagem com segurança.</p>
        
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 28px 0 20px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">BellaGestão Studio • Beleza e Alta Lucratividade</p>
      </div>
    `,
  });
}

/**
 * Envia convite por e-mail para um novo colaborador/profissional criar sua senha
 */
async function sendEmployeeInviteEmail(data) {
  logger.info(`Despachando convite para profissional [${data.employeeEmail}] via Brevo...`);

  return sendBrevoEmail({
    to: [{ email: data.employeeEmail, name: data.employeeName }],
    subject: `Convite de Acesso: Equipe ${data.salonName} - BellaGestão Studio`,
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 32px; color: #1e293b; max-width: 540px; margin: 0 auto; border: 1px solid #fce7f3; border-radius: 24px; background: #ffffff; box-shadow: 0 4px 20px rgba(236, 72, 153, 0.08);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 52px; height: 52px; line-height: 52px; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: #ffffff; font-size: 26px; border-radius: 16px;">✨</div>
          <h2 style="color: #0f172a; margin: 12px 0 0 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">BellaGestão Studio</h2>
          <p style="color: #ec4899; font-size: 12px; margin-top: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Convite de Equipe</p>
        </div>
        
        <h3 style="color: #1e293b; font-size: 16px; margin-bottom: 8px;">Olá, ${data.employeeName}!</h3>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          Você foi adicionada(o) por <strong>${data.ownerName}</strong> para fazer parte da equipe de <strong>${data.salonName}</strong> na função de <strong>${data.role}</strong>.
        </p>
        
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          Para começar a usar o sistema, acessar sua agenda individual e visualizar suas comissões, crie sua senha pessoal clicando no botão abaixo:
        </p>
        
        <div style="text-align: center; margin: 28px 0;">
          <a href="${data.inviteLink}" style="background: linear-gradient(135deg, #ec4899, #db2777); color: #ffffff; padding: 14px 28px; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(236, 72, 153, 0.35);">
            Criar Minha Senha de Acesso →
          </a>
        </div>
        
        <p style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
          ⏱️ Este link de convite é válido por <strong>48 horas</strong>.<br/>
          Caso o botão não abra, copie e cole no seu navegador:<br/>
          <a href="${data.inviteLink}" style="color: #ec4899; word-break: break-all;">${data.inviteLink}</a>
        </p>
        
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 28px 0 20px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">BellaGestão Studio • Gestão Inteligente para Salões e Estética</p>
      </div>
    `,
  });
}

/**
 * Despacha mensagens recebidas do formulário de contato para o administrador
 */
async function sendContactEmail(data) {
  return sendBrevoEmail({
    to: [{ email: process.env.ADMIN_NOTIFICATION_EMAIL || 'contato@bellagestao.com.br', name: 'Suporte BellaGestão' }],
    subject: `[BellaGestão Fale Conosco] ${data.subject} - De: ${data.name}`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; padding: 25px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #fce7f3; border-radius: 16px; background: #ffffff;">
        <h2 style="color: #ec4899; margin-top: 0;">✨ BellaGestão Studio - Nova Mensagem de Contato</h2>
        <p><strong>Nome:</strong> ${data.name}</p>
        <p><strong>E-mail:</strong> ${data.senderEmail}</p>
        <p><strong>WhatsApp / Telefone:</strong> ${data.phone || 'Não informado'}</p>
        <p><strong>Assunto:</strong> ${data.subject}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p><strong>Mensagem:</strong></p>
        <div style="background: #fdf2f8; padding: 16px; border-radius: 12px; font-size: 14px; white-space: pre-wrap; line-height: 1.6; border: 1px solid #fbcfe8;">
          ${data.message}
        </div>
      </div>
    `,
  });
}

/**
 * Envia e-mail com código de 6 dígitos para Recuperação / Redefinição de Senha
 */
async function sendPasswordResetEmail(targetEmail, code, userName = 'Usuário') {
  logger.info(`Despachando código de recuperação de senha [${code}] para [${targetEmail}] via Brevo...`);

  return sendBrevoEmail({
    to: [{ email: targetEmail, name: userName }],
    subject: `Recuperação de Senha: ${code} - BellaGestão Studio`,
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 32px; color: #1e293b; max-width: 520px; margin: 0 auto; border: 1px solid #fce7f3; border-radius: 24px; background: #ffffff; box-shadow: 0 4px 20px rgba(236, 72, 153, 0.08);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 52px; height: 52px; line-height: 52px; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: #ffffff; font-size: 26px; border-radius: 16px;">🔑</div>
          <h2 style="color: #0f172a; margin: 12px 0 0 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">BellaGestão Studio</h2>
          <p style="color: #ec4899; font-size: 12px; margin-top: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Recuperação de Acesso</p>
        </div>
        
        <p style="font-size: 15px; line-height: 1.5; color: #334155;">Olá, <strong>${userName}</strong>!</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          Recebemos uma solicitação para redefinir a sua senha de acesso ao <strong>BellaGestão Studio</strong>. Utilize o código de 6 dígitos abaixo para criar sua nova senha:
        </p>
        
        <div style="font-size: 38px; font-weight: 900; background: #fdf2f8; padding: 22px; border-radius: 18px; text-align: center; letter-spacing: 10px; color: #db2777; margin: 24px 0; border: 2px dashed #fbcfe8;">
          ${code}
        </div>
        
        <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; text-align: center;">⏱️ Este código é válido por <strong>15 minutos</strong>. Se você não fez essa solicitação, pode ignorar esta mensagem com total segurança.</p>
        
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 28px 0 20px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">BellaGestão Studio • Segurança e Gestão de Alta Performance</p>
      </div>
    `,
  });
}

module.exports = {
  sendBrevoEmail,
  sendVerificationEmail,
  sendEmployeeInviteEmail,
  sendContactEmail,
  sendPasswordResetEmail,
};
