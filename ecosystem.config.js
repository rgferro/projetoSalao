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
        BREVO_SENDER_NAME: 'BellaGestão Studio',
        BREVO_SENDER_EMAIL: 'contato@belagestaostudio.com.br'
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
