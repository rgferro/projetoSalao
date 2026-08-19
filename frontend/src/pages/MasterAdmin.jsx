import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Key,
  ExternalLink,
  RefreshCw,
  Sparkles,
  CreditCard,
  ChevronRight,
  Clock,
  Filter
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MasterAdmin() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [activeTab, setActiveTab] = useState('tenants'); // 'tenants', 'payments'

  // Modal de edição de salão
  const [editingTenant, setEditingTenant] = useState(null);
  const [editPlan, setEditPlan] = useState('STARTER');
  const [editMaxUsers, setEditMaxUsers] = useState(2);
  const [editStatus, setEditStatus] = useState('active');
  const [editIsExempt, setEditIsExempt] = useState(false);
  const [extendDays, setExtendDays] = useState(30);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [metricsRes, tenantsRes, paymentsRes] = await Promise.all([
        api.get('/master-admin/metrics'),
        api.get(`/master-admin/tenants?search=${encodeURIComponent(search)}&plan=${selectedPlan}&status=${selectedStatus}`),
        api.get('/master-admin/payments')
      ]);

      if (metricsRes.data?.success) {
        setMetrics(metricsRes.data.metrics);
        setRecentPayments(metricsRes.data.recentPayments || []);
      }
      if (tenantsRes.data?.success) {
        setTenants(tenantsRes.data.tenants || []);
      }
      if (paymentsRes.data?.success) {
        setAllPayments(paymentsRes.data.payments || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados master:', error);
      showToast('Erro ao carregar métricas do Master Admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPlan, selectedStatus]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleUpdatePlan = async () => {
    if (!editingTenant) return;
    try {
      setActionLoading(true);
      await api.post(`/master-admin/tenants/${editingTenant.id}/plan`, {
        plan: editPlan,
        maxUsers: Number(editMaxUsers),
        subscriptionStatus: editStatus,
        isExempt: editIsExempt
      });
      showToast(`Plano de ${editingTenant.name} atualizado com sucesso!`);
      setEditingTenant(null);
      loadData();
    } catch (err) {
      showToast('Erro ao atualizar plano.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleExempt = async (tenantId) => {
    try {
      setActionLoading(true);
      const res = await api.post(`/master-admin/tenants/${tenantId}/toggle-exempt`);
      showToast(res.data.message || 'Status de isenção atualizado!');
      loadData();
    } catch (err) {
      showToast('Erro ao alternar isenção do salão.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendDays = async (tenantId, days) => {
    try {
      setActionLoading(true);
      const res = await api.post(`/master-admin/tenants/${tenantId}/extend`, { days });
      showToast(res.data.message || 'Assinatura estendida!');
      if (editingTenant) setEditingTenant(null);
      loadData();
    } catch (err) {
      showToast('Erro ao estender validade.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (tenantId) => {
    try {
      const res = await api.post(`/master-admin/tenants/${tenantId}/toggle-status`);
      showToast(res.data.message);
      loadData();
    } catch (err) {
      showToast('Erro ao alternar status do salão.');
    }
  };

  const { login: authLogin, user: currentUser } = useAuth();

  const handleImpersonate = async (tenantId) => {
    try {
      const res = await api.post(`/master-admin/tenants/${tenantId}/impersonate`);
      if (res.data?.success && res.data.token) {
        // Salvar sessão master atual para possibilitar o retorno posterior
        const currentToken = localStorage.getItem('bella_token');
        if (currentToken && currentUser) {
          localStorage.setItem('bella_master_token', currentToken);
          localStorage.setItem('bella_master_user', JSON.stringify(currentUser));
        }
        localStorage.removeItem('salao_token');
        localStorage.removeItem('salao_user');

        // Logar como o salão selecionado
        authLogin(res.data.user, res.data.token);
        window.location.href = '/dashboard';
      }
    } catch (err) {
      showToast('Erro ao entrar como o salão.');
    }
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-pink-500/40 flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-pink-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header do Master Admin */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Super Admin Master Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
            Painel Executivo da Plataforma
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Gerenciamento global de salões, receita recorrente (MRR/ARR) e controle multi-tenant.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all active:scale-95 shadow-md"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Métricas</span>
        </button>
      </div>

      {/* Cards de Métricas SaaS */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">MRR Mensal</span>
              <DollarSign className="w-5 h-5 text-emerald-600 bg-emerald-50 p-1 rounded-xl" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              R$ {metrics.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>ARR: R$ {metrics.arr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano</span>
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Salões Ativos</span>
              <Building2 className="w-5 h-5 text-blue-600 bg-blue-50 p-1 rounded-xl" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {metrics.activeTenants} <span className="text-xs text-slate-400 font-normal">/ {metrics.totalTenants} total</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              {metrics.pastDueTenants} salões inativos ou vencidos
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Usuários / Equipe</span>
              <Users className="w-5 h-5 text-purple-600 bg-purple-50 p-1 rounded-xl" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {metrics.totalUsers}
            </div>
            <div className="text-[11px] text-purple-600 font-semibold">
              Profissionais ativos na plataforma
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Atendimentos</span>
              <Calendar className="w-5 h-5 text-pink-600 bg-pink-50 p-1 rounded-xl" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {metrics.totalAppointments}
            </div>
            <div className="text-[11px] text-pink-600 font-semibold">
              {metrics.totalClients} clientes atendidos
            </div>
          </div>
        </div>
      )}

      {/* Navegação por Abas */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
            activeTab === 'tenants'
              ? 'bg-slate-950 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Salões Cadastrados ({tenants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
            activeTab === 'payments'
              ? 'bg-slate-950 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Histórico de Transações ({allPayments.length})</span>
        </button>
      </div>

      {/* ABA 1: LISTAGEM DE SALÕES / TENANTS */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          {/* Barra de Filtros e Busca */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <form onSubmit={handleSearch} className="flex-1 w-full flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome do salão, e-mail do proprietário ou CPF/CNPJ..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-2xl hover:bg-slate-800 transition-all"
              >
                Buscar
              </button>
            </form>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-700"
              >
                <option value="ALL">Todos os Planos</option>
                <option value="SOLO">Solo / Autônoma (R$ 0)</option>
                <option value="STARTER">Starter (R$ 69,90)</option>
                <option value="STUDIO">Studio Pro (R$ 139,90)</option>
                <option value="PREMIER">Premier Express (R$ 229,90)</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-700"
              >
                <option value="ALL">Todos os Status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos / Bloqueados</option>
              </select>
            </div>
          </div>

          {/* Tabela de Tenants */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4">Salão / Empresa</th>
                    <th className="p-4">Proprietário(a)</th>
                    <th className="p-4">Plano Atual</th>
                    <th className="p-4 text-center">Usuários</th>
                    <th className="p-4">Validade Assinatura</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-extrabold text-slate-900 text-sm">{t.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {t.document || 'Sem documento'} • {t.city || 'São Paulo'}/{t.state || 'SP'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{t.owner_name}</div>
                        <div className="text-[11px] text-slate-500">{t.owner_email}</div>
                        {t.owner_phone && <div className="text-[10px] text-slate-400">{t.owner_phone}</div>}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            t.plan === 'PREMIER' || t.plan === 'ELITE'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : t.plan === 'STUDIO' || t.plan === 'PRO'
                              ? 'bg-pink-100 text-pink-900 border border-pink-300'
                              : t.plan === 'STARTER'
                              ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {t.plan || 'STARTER'}
                          </span>
                          {Boolean(t.is_exempt) && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black text-amber-900 bg-amber-100 border border-amber-300 flex items-center gap-0.5">
                              ⭐ Cortesia
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-bold text-slate-800">{t.current_users || 0}</span>
                        <span className="text-slate-400"> / {t.max_users || 2}</span>
                      </td>
                      <td className="p-4">
                        <div className="text-slate-700 font-semibold">
                          {t.is_exempt ? 'Vitalício (Isento)' : (t.subscription_expires_at ? new Date(t.subscription_expires_at).toLocaleDateString('pt-BR') : 'Indeterminado')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {t.is_exempt ? 'Isenção Master Ativa' : (t.subscription_status === 'active' ? 'Assinatura em dia' : 'Pendente de renovação')}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {t.active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> Bloqueado
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleToggleExempt(t.id)}
                            className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1 ${
                              t.is_exempt
                                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                            title={t.is_exempt ? 'Remover isenção de pagamento' : 'Isentar salão de cobranças'}
                          >
                            <span>⭐ {t.is_exempt ? 'Isento' : 'Isentar'}</span>
                          </button>

                          <button
                            onClick={() => {
                              setEditingTenant(t);
                              setEditPlan(t.plan || 'STARTER');
                              setEditMaxUsers(t.max_users || 2);
                              setEditStatus(t.subscription_status || 'active');
                              setEditIsExempt(Boolean(t.is_exempt));
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-all"
                            title="Alterar Plano e Limites"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => handleToggleStatus(t.id)}
                            className={`p-1.5 rounded-xl text-[11px] font-bold transition-all ${
                              t.active
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                            title={t.active ? 'Bloquear Salão' : 'Desbloquear Salão'}
                          >
                            {t.active ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => handleImpersonate(t.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center gap-1 transition-all"
                            title="Entrar como o Salão para Suporte"
                          >
                            <span>Acessar</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {tenants.length === 0 && !loading && (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400">
                        Nenhum salão encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: HISTÓRICO DE PAGAMENTOS MERCADO PAGO */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">Transações de Assinatura do SaaS</h3>
            <span className="text-xs text-slate-500 font-medium">Processadas nativamente via Mercado Pago</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">Data / Hora</th>
                  <th className="p-4">Salão / Assinante</th>
                  <th className="p-4">Plano</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4">Método</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4">ID Transação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/80">
                    <td className="p-4 text-slate-600">
                      {new Date(pay.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{pay.salon_name || 'Salão'}</div>
                      <div className="text-[11px] text-slate-500">{pay.owner_email}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-bold uppercase text-slate-800">{pay.plan}</span>
                    </td>
                    <td className="p-4 font-black text-slate-900">
                      R$ {Number(pay.amount).toFixed(2)}
                    </td>
                    <td className="p-4 uppercase text-[11px] font-semibold text-slate-600">
                      {pay.method === 'pix' ? '💠 PIX' : '💳 Cartão'}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        pay.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : pay.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {pay.status === 'approved' ? 'Aprovado' : pay.status === 'pending' ? 'Pendente' : pay.status}
                      </span>
                    </td>
                    <td className="p-4 text-[11px] text-slate-400 font-mono">
                      {pay.payment_id || pay.id}
                    </td>
                  </tr>
                ))}
                {allPayments.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400">
                      Nenhuma transação registrada até o momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE SALÃO */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-6 animate-scaleIn">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Editar Salão & Assinatura</h3>
                <p className="text-xs text-slate-500 font-medium">{editingTenant.name}</p>
              </div>
              <button
                onClick={() => setEditingTenant(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Plano da Assinatura</label>
                <select
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800"
                >
                  <option value="SOLO">Solo / Autônoma (R$ 0 - 1 Usuário / até 40 agendamentos)</option>
                  <option value="STARTER">Starter (R$ 69,90/mês - 2 Usuários)</option>
                  <option value="STUDIO">Studio Pro (R$ 139,90/mês - 5 Usuários + Extras)</option>
                  <option value="PREMIER">Premier Express (R$ 229,90/mês - 15 Usuários + Extras)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Limite Máximo de Usuários/Profissionais</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={editMaxUsers}
                  onChange={(e) => setEditMaxUsers(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status da Assinatura</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800"
                >
                  <option value="active">Ativa (Em dia)</option>
                  <option value="exempt">Isento de Pagamentos (Cortesia Master)</option>
                  <option value="past_due">Pendente / Vencida</option>
                  <option value="canceled">Cancelada</option>
                </select>
              </div>

              {/* Toggle Isenção Total */}
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-center justify-between">
                <div>
                  <label className="font-extrabold text-amber-950 dark:text-amber-300 block text-xs">⭐ Isenção Total de Cobrança</label>
                  <p className="text-[11px] text-amber-800 dark:text-amber-400">Cortesia VIP / Vitalícia (Salão parceiro ou próprio)</p>
                </div>
                <input
                  type="checkbox"
                  checked={editIsExempt}
                  onChange={(e) => {
                    setEditIsExempt(e.target.checked);
                    if (e.target.checked) setEditStatus('exempt');
                    else setEditStatus('active');
                  }}
                  className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="block font-bold text-slate-700">Estender Validade (Cortesia / Bônus)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExtendDays(editingTenant.id, 15)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                  >
                    +15 Dias
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendDays(editingTenant.id, 30)}
                    className="flex-1 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 font-black text-amber-900"
                  >
                    +30 Dias
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendDays(editingTenant.id, 90)}
                    className="flex-1 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 font-black text-purple-900"
                  >
                    +90 Dias
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingTenant(null)}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleUpdatePlan}
                disabled={actionLoading}
                className="px-6 py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs shadow-md"
              >
                {actionLoading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
