const path = require('path');
const db = require(path.join(__dirname, '../backend/database/db'));

async function cleanAll() {
  const masterTenantId = 'tenant_master_platform';
  console.log('🧹 Limpando todos os dados e registros órfãos que não pertencem ao Master Admin...');

  const tablesWithTenant = [
    'appointment_items', 'appointments', 'time_blocks', 'cash_movements',
    'cash_registers', 'financial_transactions', 'commission_settlements',
    'professional_commissions', 'professionals', 'anamnesis', 'clients',
    'services', 'custom_specialties', 'settings', 'whatsapp_logs',
    'whatsapp_templates', 'backup_logs', 'subscription_payments'
  ];

  for (const table of tablesWithTenant) {
    try {
      const res = await db.run(`DELETE FROM ${table} WHERE tenant_id != ? OR tenant_id IS NULL`, [masterTenantId]);
      console.log(`- ${table}: limpo`);
    } catch (e) {
      console.error(`Erro ao limpar ${table}:`, e.message);
    }
  }

  // Limpar tenants que não sejam master
  await db.run(`DELETE FROM tenants WHERE id != ?`, [masterTenantId]);
  await db.run(`DELETE FROM email_verifications`);

  console.log('✅ Banco de dados completamente limpo e pronto.');
  process.exit(0);
}

cleanAll();
