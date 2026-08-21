export const ACCESS_LEVELS = {
  ADMIN: 'ADMIN',
  GERENTE: 'GERENTE',
  RECEPCAO: 'RECEPCAO',
  PROFISSIONAL: 'PROFISSIONAL',
  AUXILIAR: 'AUXILIAR',
};

export const ROLE_CONFIG = {
  ADMIN: {
    label: 'Administrador / Dono',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800',
    icon: '👑',
    description: 'Acesso total e irrestrito a todos os módulos, faturamento, comissões, configurações e equipe.',
  },
  GERENTE: {
    label: 'Gerente do Salão',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    icon: '👔',
    description: 'Acesso a agenda geral, clientes, serviços, frente de caixa/PDV, equipe, relatórios e estoque.',
  },
  RECEPCAO: {
    label: 'Recepção / Atendente',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    icon: '🏷️',
    description: 'Acesso ao agendamento de clientes, recepção, PDV balcão, caixa diário e lembretes de WhatsApp.',
  },
  PROFISSIONAL: {
    label: 'Profissional Especialista',
    badgeColor: 'bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300 border-pink-300 dark:border-pink-800',
    icon: '✨',
    description: 'Acesso focado na sua própria agenda, ficha de anamnese técnica de clientes e extrato de comissões.',
  },
  AUXILIAR: {
    label: 'Auxiliar / Apoio',
    badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    icon: '🧼',
    description: 'Acesso para visualização de atendimentos em andamento, lavatório e suporte operacional.',
  },
};

// Subtipos e Especialidades Padrão (Extensíveis dinamicamente)
export const DEFAULT_PROFESSIONAL_SUBTYPES = [
  { id: 'cabeleireira', name: 'Cabeleireira / Hair Stylist', category: 'Cabelo', icon: 'Scissors', color: '#ec4899' },
  { id: 'colorista', name: 'Colorista / Terapeuta Capilar', category: 'Cabelo', icon: 'Palette', color: '#d946ef' },
  { id: 'manicure', name: 'Manicure & Pedicure', category: 'Unhas', icon: 'Sparkles', color: '#f43f5e' },
  { id: 'nail_designer', name: 'Nail Designer (Gel/Fibra)', category: 'Unhas', icon: 'Crown', color: '#fb7185' },
  { id: 'depiladora', name: 'Depiladora (Cera / Laser)', category: 'Depilação & Pele', icon: 'Flame', color: '#06b6d4' },
  { id: 'esteticista', name: 'Esteticista Facial & Corporal', category: 'Depilação & Pele', icon: 'Heart', color: '#0ea5e9' },
  { id: 'maquiadora', name: 'Maquiadora Profissional', category: 'Olhar & Make', icon: 'Smile', color: '#8b5cf6' },
  { id: 'lash_designer', name: 'Lash Designer / Sobrancelha', category: 'Olhar & Make', icon: 'Eye', color: '#a855f7' },
  { id: 'barbeiro', name: 'Barbeiro / Corte Masculino', category: 'Barba & Corte', icon: 'Zap', color: '#f59e0b' },
  { id: 'massoterapeuta', name: 'Massoterapeuta / Bem-Estar', category: 'Bem-Estar', icon: 'Activity', color: '#10b981' },
];

export const SYSTEM_MODULES = [
  { id: 'dashboard', name: 'Dashboard', icon: 'LayoutDashboard', category: 'Operacional' },
  { id: 'appointments', name: 'Agenda & Grade', icon: 'Calendar', category: 'Operacional' },
  { id: 'clients', name: 'Clientes & CRM', icon: 'Users', category: 'Operacional' },
  { id: 'cash-register', name: 'Frente de Caixa & PDV', icon: 'CreditCard', category: 'Operacional' },
  { id: 'financial', name: 'Financeiro & DRE', icon: 'DollarSign', category: 'Gestão' },
  { id: 'professionals', name: 'Equipe & Profissionais', icon: 'UserCheck', category: 'Gestão' },
  { id: 'services', name: 'Catálogo de Serviços', icon: 'Scissors', category: 'Gestão' },
  { id: 'whatsapp', name: 'WhatsApp Automático', icon: 'MessageSquare', category: 'Gestão' },
  { id: 'subscription', name: 'Assinatura & Planos', icon: 'Sparkles', category: 'Administrativo' },
  { id: 'manual', name: 'Manual & Tutoriais', icon: 'HelpCircle', category: 'Operacional' },
  { id: 'backup', name: 'Backup & Nuvem', icon: 'HardDrive', category: 'Administrativo' },
];

// Matriz de Módulos Permitidos por Nível de Acesso
export const PERMISSIONS_MAP = {
  ADMIN: [
    'dashboard',
    'appointments',
    'clients',
    'cash-register',
    'financial',
    'professionals',
    'services',
    'whatsapp',
    'subscription',
    'manual',
    'backup',
  ],
  GERENTE: [
    'dashboard',
    'appointments',
    'clients',
    'cash-register',
    'financial',
    'professionals',
    'services',
    'whatsapp',
    'manual',
  ],
  RECEPCAO: [
    'dashboard',
    'appointments',
    'clients',
    'cash-register',
    'services',
    'whatsapp',
    'manual',
  ],
  PROFISSIONAL: [
    'dashboard',
    'appointments',
    'clients',
    'manual',
  ],
  AUXILIAR: [
    'appointments',
    'manual',
  ],
};

// Matriz de Módulos Permitidos por Plano Contratado do Salão
export const PLAN_MODULES_MAP = {
  SOLO: [
    'dashboard',
    'appointments',
    'clients',
    'cash-register',
    'services',
    'subscription',
    'manual',
  ],
  STARTER: [
    'dashboard',
    'appointments',
    'clients',
    'cash-register',
    'services',
    'subscription',
    'manual',
  ],
  STUDIO: [
    'dashboard',
    'appointments',
    'clients',
    'cash-register',
    'financial',
    'professionals',
    'services',
    'whatsapp',
    'subscription',
    'manual',
    'backup',
  ],
  PRO: [
    'dashboard',
    'appointments',
    'clients',
    'cash-register',
    'financial',
    'professionals',
    'services',
    'whatsapp',
    'subscription',
    'manual',
    'backup',
  ],
  PREMIER: [
    'dashboard',
    'appointments',
    'clients',
    'cash-register',
    'financial',
    'professionals',
    'services',
    'whatsapp',
    'subscription',
    'manual',
    'backup',
  ],
  ELITE: [
    'dashboard',
    'appointments',
    'clients',
    'cash-register',
    'financial',
    'professionals',
    'services',
    'whatsapp',
    'subscription',
    'manual',
    'backup',
  ],
};

// Metadados sobre qual plano mínimo desbloqueia cada módulo restrito
export const MODULE_PLAN_REQUIREMENTS = {
  financial: { minPlan: 'STUDIO', minPlanName: 'Studio Pro', price: 'R$ 139,90/mês' },
  professionals: { minPlan: 'STUDIO', minPlanName: 'Studio Pro', price: 'R$ 139,90/mês' },
  whatsapp: { minPlan: 'STUDIO', minPlanName: 'Studio Pro', price: 'R$ 139,90/mês' },
  backup: { minPlan: 'STUDIO', minPlanName: 'Studio Pro', price: 'R$ 139,90/mês' },
};

// Rota/Tela Inicial de Trabalho Padrão por Perfil
export const ROLE_DEFAULT_TABS = {
  ADMIN: 'dashboard',
  GERENTE: 'dashboard',
  RECEPCAO: 'appointments',
  PROFISSIONAL: 'appointments',
  AUXILIAR: 'appointments',
};

export function canAccessModule(accessLevel, moduleId) {
  if (!accessLevel) return false;
  const allowed = PERMISSIONS_MAP[accessLevel] || [];
  return allowed.includes(moduleId);
}

export function canPlanAccessModule(plan, moduleId, isMaster = false, isExempt = false) {
  if (isMaster || isExempt) return true;
  const normalizedPlan = (plan || 'SOLO').toUpperCase();
  const allowed = PLAN_MODULES_MAP[normalizedPlan] || PLAN_MODULES_MAP.SOLO;
  return allowed.includes(moduleId);
}

export function getRequiredPlanForModule(moduleId) {
  return MODULE_PLAN_REQUIREMENTS[moduleId] || null;
}

export function getDefaultTabForRole(accessLevel) {
  if (!accessLevel) return 'dashboard';
  return ROLE_DEFAULT_TABS[accessLevel] || 'dashboard';
}
