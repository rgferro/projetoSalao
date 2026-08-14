-- Schema completo do Sistema de Gestão para Salão de Beleza e Estética (SQLite)

PRAGMA foreign_keys = ON;

-- Configurações Gerais do Salão
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Clientes e CRM
CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    birthdate TEXT, -- YYYY-MM-DD
    cpf TEXT,
    address TEXT,
    notes TEXT,
    loyalty_points INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ficha de Anamnese Técnica Especializada por Cliente
CREATE TABLE IF NOT EXISTS anamnesis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER UNIQUE NOT NULL,
    -- Cabelo
    hair_type TEXT,
    hair_chemical_history TEXT,
    hair_color_formula TEXT,
    hair_sensitivities TEXT,
    hair_preferred_cut TEXT,
    -- Depilação
    waxing_skin_type TEXT,
    waxing_allergies TEXT,
    waxing_folliculitis_history TEXT,
    waxing_preferred_method TEXT,
    waxing_restrictions TEXT,
    -- Manicure e Maquiagem
    nails_shape_preferences TEXT,
    nails_gel_allergy TEXT,
    makeup_skin_type TEXT,
    makeup_restrictions TEXT,
    general_observations TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Profissionais / Parceiros
CREATE TABLE IF NOT EXISTS professionals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    nickname TEXT,
    phone TEXT,
    email TEXT,
    color_hex TEXT DEFAULT '#6366f1',
    specialties TEXT, -- JSON array: ["Cabelo", "Manicure", "Depilação", "Maquiagem"]
    default_commission_type TEXT DEFAULT 'percentage', -- 'percentage' ou 'fixed'
    default_commission_value REAL DEFAULT 50.0,
    work_schedule TEXT, -- JSON schedule por dia da semana
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Serviços Oferecidos
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Cabelo', 'Manicure', 'Depilação', 'Maquiagem', 'Outros'
    description TEXT,
    price REAL NOT NULL,
    cost_price REAL DEFAULT 0,
    duration_min INTEGER NOT NULL DEFAULT 60,
    default_commission_type TEXT DEFAULT 'percentage', -- 'percentage' ou 'fixed'
    default_commission_value REAL DEFAULT 50.0,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sobrescrita de Comissão Específica (Profissional x Serviço)
CREATE TABLE IF NOT EXISTS professional_commissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    professional_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    commission_type TEXT NOT NULL, -- 'percentage' ou 'fixed'
    commission_value REAL NOT NULL,
    FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    UNIQUE(professional_id, service_id)
);

-- Agendamentos (Cabeçalho do Atendimento)
CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD
    status TEXT DEFAULT 'agendado', -- 'agendado', 'confirmado', 'em_atendimento', 'concluido', 'cancelado', 'no_show'
    total_price REAL DEFAULT 0,
    total_duration_min INTEGER DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Itens do Agendamento (Permite Multisserviços e Múltiplos Profissionais)
CREATE TABLE IF NOT EXISTS appointment_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    professional_id INTEGER NOT NULL,
    start_time TEXT NOT NULL, -- HH:MM (ex: "09:00")
    end_time TEXT NOT NULL,   -- HH:MM (ex: "10:30")
    price REAL NOT NULL,
    commission_type TEXT NOT NULL,
    commission_value REAL NOT NULL,
    commission_amount REAL NOT NULL,
    status TEXT DEFAULT 'agendado',
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (professional_id) REFERENCES professionals(id)
);

-- Bloqueio de Horários (Almoço, Folga, Manutenção)
CREATE TABLE IF NOT EXISTS time_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    professional_id INTEGER, -- NULL = bloqueio geral do salão
    date TEXT NOT NULL,      -- YYYY-MM-DD
    start_time TEXT NOT NULL, -- HH:MM
    end_time TEXT NOT NULL,   -- HH:MM
    reason TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE
);

-- Caixa Diário (Frente de Caixa / PDV)
CREATE TABLE IF NOT EXISTS cash_registers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME,
    initial_balance REAL NOT NULL DEFAULT 0.0,
    final_balance REAL,
    system_balance REAL,
    difference REAL,
    status TEXT DEFAULT 'aberto', -- 'aberto', 'fechado'
    opened_by TEXT DEFAULT 'Recepcionista',
    closed_by TEXT,
    notes TEXT
);

-- Movimentações do Caixa Diário (Sangria, Reforço, Pagamentos)
CREATE TABLE IF NOT EXISTS cash_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cash_register_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'abertura', 'sangria', 'reforco', 'venda', 'despesa', 'fechamento'
    amount REAL NOT NULL,
    payment_method TEXT, -- 'dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'voucher'
    description TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id)
);

-- Transações Financeiras (Contas a Pagar, Contas a Receber e Vendas)
CREATE TABLE IF NOT EXISTS financial_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, -- 'receita', 'despesa'
    category TEXT NOT NULL, -- 'Serviços', 'Produtos', 'Aluguel', 'Energia/Água', 'Comissões', 'Materiais', 'Outros'
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT, -- 'pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'voucher', 'boleto'
    due_date TEXT NOT NULL, -- YYYY-MM-DD
    payment_date TEXT,      -- YYYY-MM-DD
    status TEXT DEFAULT 'pendente', -- 'pendente', 'pago', 'cancelado'
    client_id INTEGER,
    professional_id INTEGER,
    appointment_id INTEGER,
    cash_register_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE SET NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id) ON DELETE SET NULL
);

-- Repasses e Quitações de Comissões
CREATE TABLE IF NOT EXISTS commission_settlements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    professional_id INTEGER NOT NULL,
    period_start TEXT NOT NULL, -- YYYY-MM-DD
    period_end TEXT NOT NULL,   -- YYYY-MM-DD
    total_services_amount REAL NOT NULL,
    total_commission REAL NOT NULL,
    deduction_amount REAL DEFAULT 0,
    net_payout REAL NOT NULL,
    payment_date TEXT NOT NULL, -- YYYY-MM-DD
    payment_method TEXT DEFAULT 'pix',
    notes TEXT,
    financial_transaction_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (professional_id) REFERENCES professionals(id),
    FOREIGN KEY (financial_transaction_id) REFERENCES financial_transactions(id)
);

-- Modelos de Mensagens do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL, -- 'reminder_24h', 'reminder_2h', 'welcome', 'birthday', 'custom'
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Histórico / Fila de Mensagens do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    phone TEXT NOT NULL,
    message_type TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pendente', -- 'pendente', 'enviado', 'erro'
    error_message TEXT,
    sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

-- Histórico de Backups
CREATE TABLE IF NOT EXISTS backup_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    size_bytes INTEGER DEFAULT 0,
    backup_type TEXT NOT NULL, -- 'local', 'gdrive'
    status TEXT NOT NULL,      -- 'sucesso', 'erro'
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para Máxima Performance em Consultas Locais
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointment_items_app ON appointment_items(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_items_prof ON appointment_items(professional_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_financial_due ON financial_transactions(due_date);
CREATE INDEX IF NOT EXISTS idx_financial_status ON financial_transactions(status);
