require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const { initDb } = require('./database/db');
const { seedData } = require('./database/seed');
const gdriveService = require('./services/gdriveService');
const logger = require('./services/logger');
const { sanitizationMiddleware } = require('./middleware/sanitization');
const { extractAuth } = require('./middleware/authMiddleware');
const { securityHeaders, rateLimit, issueCsrfToken, requireCsrfToken } = require('./middleware/security');

const clientsRoutes = require('./routes/clients');
const professionalsRoutes = require('./routes/professionals');
const servicesRoutes = require('./routes/services');
const appointmentsRoutes = require('./routes/appointments');
const financialRoutes = require('./routes/financial');
const commissionsRoutes = require('./routes/commissions');
const whatsappRoutes = require('./routes/whatsapp');
const backupRoutes = require('./routes/backup');
const dashboardRoutes = require('./routes/dashboard');
const settingsRoutes = require('./routes/settings');
const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscription');
const contactRoutes = require('./routes/contact');
const masterAdminRoutes = require('./routes/masterAdmin');
const aiChatRoutes = require('./routes/aiChat');

const app = express();
const PORT = process.env.PORT || 3001;
app.set('trust proxy', 1);

// Middlewares Globais de Segurança, Sanitização e Extração de Tenant
app.use(cors({ origin: process.env.APP_URL || true, credentials: true }));
app.use(securityHeaders);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizationMiddleware);
app.use(extractAuth);

// Rotas da API REST
const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Muitas tentativas. Aguarde alguns minutos para tentar novamente.' });
const contactRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 8, message: 'Muitas mensagens enviadas. Aguarde alguns minutos para tentar novamente.' });
app.get('/api/security/csrf-token', issueCsrfToken);
app.use('/api/auth', authRateLimit, requireCsrfToken, authRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/contact', contactRateLimit, requireCsrfToken, contactRoutes);
app.use('/api/master-admin', masterAdminRoutes);
app.use('/api/ai', aiChatRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/professionals', professionalsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/commissions', commissionsRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);

// Servir frontend compilado se existir em produção
const clientDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(clientDist));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientDist, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      name: 'BelaGestão Studio - Sistema de Gestão para Salão de Beleza e Estética API',
      status: 'online',
      version: '2.0.0',
      resilience: 'Circuit Breaker + Grace Period + ACID Transactions + Multi-Tenancy',
      endpoints: [
        '/api/auth/login',
        '/api/auth/register',
        '/api/master-admin/metrics',
        '/api/subscription/status',
        '/api/dashboard/metrics',
        '/api/clients',
        '/api/appointments',
        '/api/professionals',
        '/api/services',
        '/api/financial/cash/current',
        '/api/commissions/report',
        '/api/whatsapp/status',
        '/api/backup',
      ],
    });
  }
});

// Middleware Global de Tratamento de Erros (Graceful Error Handling)
app.use((err, req, res, next) => {
  logger.error(`Exceção capturada na rota [${req.method} ${req.path}]:`, { error: err.message });
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Corpo da requisição em formato inválido.' });
  }
  res.status(500).json({
    error: 'Ocorreu uma instabilidade momentânea. O sistema continuará operando com segurança.',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Rotinas Agendadas em Segundo Plano (Cron Jobs)
cron.schedule('0 23 * * *', async () => {
  logger.info('Executando rotina agendada de backup diário com hash SHA-256...');
  try {
    const backup = await gdriveService.createLocalBackup();
    logger.info(`Backup diário criado com sucesso: ${backup.filename} (${backup.sha256})`);
  } catch (err) {
    logger.error('Falha no backup diário automático:', { error: err.message });
  }
});

// Inicialização do Servidor
const startServer = async () => {
  try {
    await initDb();
    await seedData();

    app.listen(PORT, () => {
      logger.info(`💈 BELAGESTÃO STUDIO ERP - BACKEND INICIADO COM SUCESSO! Porta: ${PORT} | URL: ${process.env.APP_URL || 'https://belagestaostudio.com.br'}`);
    });
  } catch (error) {
    logger.error('Falha crítica ao iniciar servidor:', { error: error.message });
    process.exit(1);
  }
};

startServer();
