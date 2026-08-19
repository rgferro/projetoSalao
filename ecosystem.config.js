module.exports = {
  apps: [
    {
      name: 'bellagestao',
      script: './backend/server.js',
      cwd: '/var/www/bellagestao',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        WHATSAPP_PORT: 3006,
        APP_URL: 'https://belagestaostudio.com.br',
        BREVO_API_KEY: 'REMOVED',
        BREVO_SENDER_NAME: 'BelaGestão Studio',
        BREVO_SENDER_EMAIL: 'contato@belagestaostudio.com.br',
        ADMIN_NOTIFICATION_EMAIL: 'rafael.gielow@gmail.com'
      }
    },
    {
      name: 'bellagestao-whatsapp',
      script: './backend/server-whatsapp.js',
      cwd: '/var/www/bellagestao',
      env: {
        NODE_ENV: 'production',
        WHATSAPP_PORT: 3006,
        APP_URL: 'https://belagestaostudio.com.br'
      }
    }
  ]
};
