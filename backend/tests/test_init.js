const { initDb } = require('../database/db');
const { seedData } = require('../database/seed');

(async () => {
  try {
    console.log('Testing DB init & seed...');
    await initDb();
    await seedData();
    console.log('✅ TEST PASSED: DB initialized and seeded cleanly.');
    process.exit(0);
  } catch (err) {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
  }
})();
