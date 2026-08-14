const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const { initDb } = require('./database/db');
const { seedData } = require('./database/seed');
const gdriveService = require('./services/gdriveService');
const whatsappService = require('./services/whatsappService');

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

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas da API REST
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
      name: 'Sistema de Gestão para Salão de Beleza e Estética API',
      status: 'online',
      version: '1.0.0',
      endpoints: [
        '/api/dashboard/metrics',
        '/api/clients',
        '/api/appointments',
        '/api/professionals',
        '/api/services',
        '/api/financial/cash/current',
        '/api/commissions/report',
        '/api/whatsapp/status',
        '/api/backup'
      ]
    });
  }
});

// Rotinas Agendadas em Segundo Plano (Cron Jobs)
// 1. Rotina de Backup Automático Diário (às 23:00)
cron.schedule('0 23 * * *', async () => {
  console.log('⏰ Executando rotina agendada de backup diário...');
  try {
    const backup = await gdriveService.createLocalBackup();
    console.log('✅ Backup diário criado:', backup.filename);
  } catch (err) {
    console.error('❌ Falha no backup diário automático:', err.message);
  }
});

// Inicialização do Servidor
const startServer = async () => {
  try {
    await initDb();
    await seedData();

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`💈 SALÃOPRO & ESTÉTICA - BACKEND LOCAL INICIADO COM SUCESSO!`);
      console.log(`📍 Servidor rodando em: http://localhost:${PORT}`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('❌ Falha crítica ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();
