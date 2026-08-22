const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'salao.db');

// Conexão ao banco SQLite
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco SQLite:', err.message);
  } else {
    console.log('✅ Conectado ao banco SQLite local com sucesso em:', DB_PATH);
  }
});

// Habilitar foreign keys e modo WAL para máxima performance e concorrência ACID
db.run('PRAGMA foreign_keys = ON');
db.run('PRAGMA journal_mode = WAL');
db.run('PRAGMA busy_timeout = 5000');

// Promisified Helpers para facilitar operações assíncronas
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const exec = (sql) => {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

/**
 * Executa uma transação atômica ACID com Rollback automático em caso de falha
 */
const transaction = async (callback) => {
  await exec('BEGIN IMMEDIATE TRANSACTION');
  try {
    const result = await callback({ query, get, run, exec });
    await exec('COMMIT');
    return result;
  } catch (error) {
    try {
      await exec('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Erro ao executar ROLLBACK:', rollbackErr.message);
    }
    throw error;
  }
};

/**
 * Migração suave de colunas tenant_id para tabelas existentes
 */
const migrateTenantColumns = async () => {
  const tables = [
    'clients', 'anamnesis', 'professionals', 'services', 'professional_commissions',
    'appointments', 'appointment_items', 'time_blocks', 'cash_registers',
    'cash_movements', 'financial_transactions', 'commission_settlements',
    'whatsapp_templates', 'whatsapp_logs', 'backup_logs', 'custom_specialties', 'settings'
  ];

  for (const table of tables) {
    try {
      const columns = await query(`PRAGMA table_info(${table})`);
      if (columns && columns.length > 0) {
        const hasTenant = columns.some(c => c.name === 'tenant_id');
        if (!hasTenant) {
          await run(`ALTER TABLE ${table} ADD COLUMN tenant_id TEXT DEFAULT 'tenant_default_salao'`);
        }
      }
    } catch (e) {
      // Ignora se tabela ainda não existe
    }
  }

  // Migração de colunas na tabela backup_logs
  try {
    const backupCols = await query('PRAGMA table_info(backup_logs)');
    if (backupCols && backupCols.length > 0) {
      if (!backupCols.some(c => c.name === 'sha256')) {
        await run("ALTER TABLE backup_logs ADD COLUMN sha256 TEXT");
      }
    }
  } catch (e) {}

  // Migração de unicidade na tabela settings (key, tenant_id)
  try {
    await run("CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_key_tenant ON settings(key, tenant_id)");
  } catch (e) {}

  // Migração de colunas na tabela professionals
  try {
    const profCols = await query('PRAGMA table_info(professionals)');
    if (profCols && profCols.length > 0) {
      if (!profCols.some(c => c.name === 'email')) {
        await run("ALTER TABLE professionals ADD COLUMN email TEXT");
      }
      if (!profCols.some(c => c.name === 'password')) {
        await run("ALTER TABLE professionals ADD COLUMN password TEXT");
      }
      if (!profCols.some(c => c.name === 'nickname')) {
        await run("ALTER TABLE professionals ADD COLUMN nickname TEXT");
      }
      if (!profCols.some(c => c.name === 'role')) {
        await run("ALTER TABLE professionals ADD COLUMN role TEXT DEFAULT 'Cabeleireira'");
      }
      if (!profCols.some(c => c.name === 'access_level')) {
        await run("ALTER TABLE professionals ADD COLUMN access_level TEXT DEFAULT 'PROFISSIONAL'");
      }
      if (!profCols.some(c => c.name === 'subtypes')) {
        await run("ALTER TABLE professionals ADD COLUMN subtypes TEXT");
      }
      if (!profCols.some(c => c.name === 'pin_code')) {
        await run("ALTER TABLE professionals ADD COLUMN pin_code TEXT");
      }
      if (!profCols.some(c => c.name === 'invite_token')) {
        await run("ALTER TABLE professionals ADD COLUMN invite_token TEXT");
      }
      if (!profCols.some(c => c.name === 'invite_expires_at')) {
        await run("ALTER TABLE professionals ADD COLUMN invite_expires_at DATETIME");
      }
    }
  } catch (e) {}

  // Migração de segment, extra_users_count e is_exempt na tabela tenants
  try {
    const tenantCols = await query('PRAGMA table_info(tenants)');
    if (tenantCols && tenantCols.length > 0) {
      if (!tenantCols.some(c => c.name === 'segment')) {
        await run("ALTER TABLE tenants ADD COLUMN segment TEXT DEFAULT 'salao'");
      }
      if (!tenantCols.some(c => c.name === 'extra_users_count')) {
        await run("ALTER TABLE tenants ADD COLUMN extra_users_count INTEGER DEFAULT 0");
      }

      if (!tenantCols.some(c => c.name === 'is_exempt')) {
        await run("ALTER TABLE tenants ADD COLUMN is_exempt INTEGER DEFAULT 0");
      }

      // Verificar se a tabela tenants ainda tem restrição UNIQUE em owner_email
      const tableDef = await get("SELECT sql FROM sqlite_master WHERE type='table' AND name='tenants'");
      if (tableDef && tableDef.sql && tableDef.sql.includes('owner_email TEXT UNIQUE')) {
        console.log('🔄 Migrando tabela tenants para suportar múltiplos salões/projetos por usuário...');
        await exec(`
          PRAGMA foreign_keys = OFF;
          CREATE TABLE tenants_new (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            segment TEXT DEFAULT 'salao',
            document TEXT,
            plan TEXT DEFAULT 'SOLO',
            subscription_status TEXT DEFAULT 'active',
            subscription_expires_at DATETIME,
            max_users INTEGER DEFAULT 1,
            extra_users_count INTEGER DEFAULT 0,
            owner_email TEXT NOT NULL,
            owner_password TEXT,
            owner_name TEXT NOT NULL,
            owner_phone TEXT,
            cep TEXT,
            street TEXT,
            number TEXT,
            complement TEXT,
            neighborhood TEXT,
            city TEXT,
            state TEXT,
            is_master INTEGER DEFAULT 0,
            is_exempt INTEGER DEFAULT 0,
            active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
          INSERT INTO tenants_new (
            id, name, segment, document, plan, subscription_status, subscription_expires_at,
            max_users, extra_users_count, owner_email, owner_password, owner_name, owner_phone,
            cep, street, number, complement, neighborhood, city, state, is_master, is_exempt, active,
            created_at, updated_at
          )
          SELECT 
            id, name, COALESCE(segment, 'salao'), document, plan, subscription_status, subscription_expires_at,
            max_users, extra_users_count, owner_email, owner_password, owner_name, owner_phone,
            cep, street, number, complement, neighborhood, city, state, is_master, is_exempt, active,
            created_at, updated_at
          FROM tenants;
          DROP TABLE tenants;
          ALTER TABLE tenants_new RENAME TO tenants;
          CREATE INDEX IF NOT EXISTS idx_tenants_owner_email ON tenants(owner_email);
          PRAGMA foreign_keys = ON;
        `);
        console.log('✅ Tabela tenants migrada com sucesso para Multi-Segmento!');
      } else {
        await run("CREATE INDEX IF NOT EXISTS idx_tenants_owner_email ON tenants(owner_email)");
      }
    }
  } catch (e) {
    console.error('Erro na migração da tabela tenants:', e.message);
  }

  // Verificar se a tabela whatsapp_templates tem restrição UNIQUE global em code
  try {
    const waTableDef = await get("SELECT sql FROM sqlite_master WHERE type='table' AND name='whatsapp_templates'");
    if (waTableDef && waTableDef.sql && waTableDef.sql.includes('code TEXT UNIQUE')) {
      console.log('🔄 Migrando tabela whatsapp_templates para suportar templates por salão/tenant...');
      await exec(`
        PRAGMA foreign_keys = OFF;
        CREATE TABLE whatsapp_templates_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT NOT NULL,
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          active INTEGER DEFAULT 1,
          tenant_id TEXT DEFAULT 'tenant_default_salao',
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(tenant_id, code)
        );
        INSERT OR IGNORE INTO whatsapp_templates_new (id, code, title, body, active, tenant_id, updated_at)
        SELECT id, code, title, body, active, COALESCE(tenant_id, 'tenant_default_salao'), updated_at
        FROM whatsapp_templates;
        DROP TABLE whatsapp_templates;
        ALTER TABLE whatsapp_templates_new RENAME TO whatsapp_templates;
        CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_tenant ON whatsapp_templates(tenant_id, code);
        PRAGMA foreign_keys = ON;
      `);
    } else {
      await run("CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_tenant ON whatsapp_templates(tenant_id, code)");
    }
  } catch (e) {
    console.error('Erro na migração da tabela whatsapp_templates:', e.message);
  }

  // Verificar se a tabela settings tem chave primária simples em key
  try {
    const settingsTableDef = await get("SELECT sql FROM sqlite_master WHERE type='table' AND name='settings'");

    if (settingsTableDef && settingsTableDef.sql && !settingsTableDef.sql.includes('PRIMARY KEY(key, tenant_id)') && !settingsTableDef.sql.includes('PRIMARY KEY (key, tenant_id)')) {
      console.log('🔄 Migrando tabela settings para suportar configurações por tenant (key, tenant_id)...');
      await exec(`
        PRAGMA foreign_keys = OFF;
        CREATE TABLE settings_new (
          key TEXT NOT NULL,
          value TEXT NOT NULL,
          tenant_id TEXT DEFAULT 'tenant_default',
          PRIMARY KEY(key, tenant_id)
        );
        INSERT OR IGNORE INTO settings_new (key, value, tenant_id)
        SELECT key, value, COALESCE(tenant_id, 'tenant_default')
        FROM settings;
        DROP TABLE settings;
        ALTER TABLE settings_new RENAME TO settings;
        PRAGMA foreign_keys = ON;
      `);
    }
  } catch (e) {
    console.error('Erro na migração da tabela settings:', e.message);
  }
};


// Inicialização automática das tabelas e migrações
const initDb = async () => {
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    
    // Executa schema inicial
    try {
      await exec(schemaSql);
    } catch (schemaErr) {
      // Se houver tabelas legadas sem coluna, executa migração e re-executa schema
      await migrateTenantColumns();
      await exec(schemaSql);
    }

    await migrateTenantColumns();
    try {
      await run("UPDATE tenants SET subscription_expires_at = NULL WHERE plan = 'SOLO' AND (subscription_expires_at LIKE '2099%' OR subscription_expires_at LIKE '2100%')");
    } catch (e) {}
    console.log('✅ Estrutura do banco de dados SQLite Multi-Tenant inicializada.');
  } catch (error) {
    console.error('❌ Erro ao inicializar tabelas do banco:', error);
  }
};

module.exports = {
  db,
  DB_PATH,
  query,
  get,
  run,
  exec,
  transaction,
  initDb,
};
