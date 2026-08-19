const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = options.headers || {};

  // Limpar tokens legados em cache se existirem
  if (typeof window !== 'undefined') {
    if (localStorage.getItem('salao_token')) localStorage.removeItem('salao_token');
    if (localStorage.getItem('salao_user')) localStorage.removeItem('salao_user');
  }

  // Injetar token de autenticação unificado
  const token = typeof window !== 'undefined' ? localStorage.getItem('bella_token') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error((data && data.error) || `Erro ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  // Axios-like helper methods for flexibility
  get: (endpoint, options = {}) => request(endpoint, { method: 'GET', ...options }).then(res => ({ data: res })),
  post: (endpoint, body, options = {}) => request(endpoint, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body), ...options }).then(res => ({ data: res })),
  put: (endpoint, body, options = {}) => request(endpoint, { method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body), ...options }).then(res => ({ data: res })),
  patch: (endpoint, body, options = {}) => request(endpoint, { method: 'PATCH', body: body instanceof FormData ? body : JSON.stringify(body), ...options }).then(res => ({ data: res })),
  delete: (endpoint, options = {}) => request(endpoint, { method: 'DELETE', ...options }).then(res => ({ data: res })),

  // Dashboard
  getDashboardMetrics: () => request('/dashboard/metrics'),

  // Clientes & CRM & Anamnese
  getClients: (search) => request(`/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getClient: (id) => request(`/clients/${id}`),
  createClient: (data) => request('/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id, data) => request(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClient: (id) => request(`/clients/${id}`, { method: 'DELETE' }),
  updateLoyalty: (id, data) => request(`/clients/${id}/loyalty`, { method: 'POST', body: JSON.stringify(data) }),

  // Profissionais & Comissões
  getProfessionals: () => request('/professionals'),
  getProfessional: (id) => request(`/professionals/${id}`),
  createProfessional: (data) => request('/professionals', { method: 'POST', body: JSON.stringify(data) }),
  updateProfessional: (id, data) => request(`/professionals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProfessional: (id) => request(`/professionals/${id}`, { method: 'DELETE' }),

  // Serviços
  getServices: (category, active) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (active !== undefined) params.append('active', active);
    const qs = params.toString();
    return request(`/services${qs ? `?${qs}` : ''}`);
  },
  getService: (id) => request(`/services/${id}`),
  createService: (data) => request('/services', { method: 'POST', body: JSON.stringify(data) }),
  updateService: (id, data) => request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteService: (id) => request(`/services/${id}`, { method: 'DELETE' }),

  // Agendamentos & Conflitos
  getAppointments: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/appointments${qs ? `?${qs}` : ''}`);
  },
  checkConflict: (data) => request('/appointments/check-conflict', { method: 'POST', body: JSON.stringify(data) }),
  createAppointment: (data) => request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  updateAppointmentStatus: (id, status) => request(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteAppointment: (id) => request(`/appointments/${id}`, { method: 'DELETE' }),
  
  // Bloqueios de horários
  getTimeBlocks: (date) => request(`/appointments/blocks/all${date ? `?date=${date}` : ''}`),
  createTimeBlock: (data) => request('/appointments/blocks', { method: 'POST', body: JSON.stringify(data) }),
  deleteTimeBlock: (id) => request(`/appointments/blocks/${id}`, { method: 'DELETE' }),

  // Frente de Caixa & PDV
  getCurrentCash: () => request('/financial/cash/current'),
  openCash: (data) => request('/financial/cash/open', { method: 'POST', body: JSON.stringify(data) }),
  addCashMovement: (data) => request('/financial/cash/movement', { method: 'POST', body: JSON.stringify(data) }),
  closeCash: (data) => request('/financial/cash/close', { method: 'POST', body: JSON.stringify(data) }),
  checkoutPDV: (data) => request('/financial/checkout', { method: 'POST', body: JSON.stringify(data) }),

  // Financeiro & DRE & Contas
  getTransactions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/financial/transactions${qs ? `?${qs}` : ''}`);
  },
  createTransaction: (data) => request('/financial/transactions', { method: 'POST', body: JSON.stringify(data) }),
  payTransaction: (id, payment_method) => request(`/financial/transactions/${id}/pay`, { method: 'PATCH', body: JSON.stringify({ payment_method }) }),
  deleteTransaction: (id) => request(`/financial/transactions/${id}`, { method: 'DELETE' }),
  getDRE: (startDate, endDate) => {
    const qs = new URLSearchParams({ startDate: startDate || '', endDate: endDate || '' }).toString();
    return request(`/financial/reports/dre?${qs}`);
  },
  getCategoryReport: (startDate, endDate) => {
    const qs = new URLSearchParams({ startDate: startDate || '', endDate: endDate || '' }).toString();
    return request(`/financial/reports/category?${qs}`);
  },
  getTopServices: () => request('/financial/reports/top-services'),

  // Repasse de Comissões
  getCommissionReport: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/commissions/report${qs ? `?${qs}` : ''}`);
  },
  settleCommission: (data) => request('/commissions/settle', { method: 'POST', body: JSON.stringify(data) }),
  getSettlements: (professional_id) => request(`/commissions/settlements${professional_id ? `?professional_id=${professional_id}` : ''}`),

  // WhatsApp Multi-Device
  getWhatsAppStatus: () => request('/whatsapp/status'),
  logoutWhatsApp: () => request('/whatsapp/logout', { method: 'POST' }),
  getWhatsAppTemplates: () => request('/whatsapp/templates'),
  updateWhatsAppTemplate: (id, data) => request(`/whatsapp/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  sendReminder: (appointment_id, type) => request('/whatsapp/send-reminder', { method: 'POST', body: JSON.stringify({ appointment_id, type }) }),
  sendBirthdayMsg: (client_id) => request('/whatsapp/send-birthday', { method: 'POST', body: JSON.stringify({ client_id }) }),
  sendCustomMsg: (data) => request('/whatsapp/send-custom', { method: 'POST', body: JSON.stringify(data) }),
  getWhatsAppLogs: () => request('/whatsapp/logs'),

  // Backup & Google Drive
  getBackups: () => request('/backup'),
  createLocalBackup: () => request('/backup/create-local', { method: 'POST' }),
  syncGDrive: () => request('/backup/sync-gdrive', { method: 'POST' }),
  restoreBackup: (formData) => request('/backup/restore', { method: 'POST', body: formData }),

  // Configurações
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'POST', body: JSON.stringify(data) })
};

export default api;
