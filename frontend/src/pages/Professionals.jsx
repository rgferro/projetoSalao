import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Plus, 
  DollarSign, 
  Calendar, 
  FileText, 
  Check, 
  Edit3, 
  Trash2, 
  Filter, 
  ArrowRight,
  Receipt,
  Sparkles,
  Scissors,
  Mail,
  Send,
  KeyRound,
  Shield,
  Tag
} from 'lucide-react';
import { api } from '../services/api';
import { ROLE_CONFIG, DEFAULT_PROFESSIONAL_SUBTYPES } from '../lib/permissions';

export default function Professionals() {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'commissions-report', 'settlements'
  const [professionals, setProfessionals] = useState([]);
  const [services, setServices] = useState([]);
  const [specialtiesList, setSpecialtiesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // New/Edit Professional Modal
  const [showProfModal, setShowProfModal] = useState(false);
  const [editingProf, setEditingProf] = useState(null);
  const [newTagInput, setNewTagInput] = useState('');
  const [profForm, setProfForm] = useState({
    name: '',
    nickname: '',
    role: 'Cabeleireira',
    access_level: 'PROFISSIONAL',
    subtypes: ['Cabeleireira'],
    phone: '',
    email: '',
    pin_code: '1234',
    color_hex: '#ec4899',
    specialties: ['Cabelo'],
    default_commission_type: 'percentage',
    default_commission_value: 50.0
  });

  // Commissions Report Filter
  const [repProfId, setRepProfId] = useState('');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [commReport, setCommReport] = useState(null);
  const [settlementHistory, setSettlementHistory] = useState([]);

  // Settlement Action
  const [settlingProf, setSettlingProf] = useState(null);
  const [deductionAmount, setDeductionAmount] = useState('0.00');
  const [settleMethod, setSettleMethod] = useState('pix');
  const [settleNotes, setSettleNotes] = useState('');

  // Email Invite Sending State
  const [sendingInviteId, setSendingInviteId] = useState(null);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [pList, sList, rep, setts] = await Promise.all([
        api.getProfessionals(),
        api.getServices(),
        api.getCommissionReport({ professional_id: repProfId, startDate, endDate }),
        api.getSettlements(repProfId)
      ]);
      setProfessionals(pList);
      setServices(sList);
      setCommReport(rep);
      setSettlementHistory(setts);

      // Carregar especialidades dinâmicas do backend
      fetch('/api/professionals/specialties')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setSpecialtiesList(data);
          } else {
            setSpecialtiesList(DEFAULT_PROFESSIONAL_SUBTYPES);
          }
        })
        .catch(() => setSpecialtiesList(DEFAULT_PROFESSIONAL_SUBTYPES));

    } catch (err) {
      console.error('Erro ao carregar profissionais/comissões:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [repProfId, startDate, endDate]);

  const handleSaveProf = async (e) => {
    e.preventDefault();
    try {
      if (editingProf) {
        await api.updateProfessional(editingProf.id, profForm);
      } else {
        await api.createProfessional(profForm);
      }
      setShowProfModal(false);
      setEditingProf(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProf = async (id) => {
    if (!window.confirm('Deseja realmente remover este profissional da equipe?')) return;
    try {
      await api.deleteProfessional(id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenEditProf = (p) => {
    setEditingProf(p);
    setProfForm({
      name: p.name,
      nickname: p.nickname || '',
      role: p.role || 'Profissional',
      access_level: p.access_level || 'PROFISSIONAL',
      subtypes: Array.isArray(p.subtypes) ? p.subtypes : (p.role ? [p.role] : ['Cabeleireira']),
      phone: p.phone || '',
      email: p.email || '',
      pin_code: p.pin_code || '1234',
      color_hex: p.color_hex || '#ec4899',
      specialties: Array.isArray(p.specialties) ? p.specialties : ['Cabelo'],
      default_commission_type: p.default_commission_type || 'percentage',
      default_commission_value: p.default_commission_value || 50.0
    });
    setShowProfModal(true);
  };

  const handleToggleSubtype = (tag) => {
    setProfForm(prev => {
      const exists = prev.subtypes?.includes(tag);
      const updated = exists 
        ? prev.subtypes.filter(t => t !== tag)
        : [...(prev.subtypes || []), tag];
      return { ...prev, subtypes: updated };
    });
  };

  const handleAddNewCustomSubtype = async (e) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    const tagName = newTagInput.trim();

    try {
      await fetch('/api/professionals/specialties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagName, category: 'Personalizada' })
      });

      setSpecialtiesList(prev => [...prev, { name: tagName, category: 'Personalizada' }]);
      handleToggleSubtype(tagName);
      setNewTagInput('');
    } catch (e) {
      handleToggleSubtype(tagName);
      setNewTagInput('');
    }
  };

  const handleSendInviteEmail = async (prof) => {
    if (!prof.email) {
      alert('Cadastre um e-mail para este profissional antes de enviar o convite.');
      return;
    }

    try {
      setSendingInviteId(prof.id);
      const res = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: prof.id,
          employeeEmail: prof.email,
          employeeName: prof.name,
          role: prof.role || 'Profissional',
          salonName: 'BellaGestão Studio',
          ownerName: 'Administrador'
        })
      });
      const data = await res.json();
      setSendingInviteId(null);

      if (data.success) {
        setInviteSuccessMsg(`Convite enviado via Brevo para ${prof.email}!`);
        setTimeout(() => setInviteSuccessMsg(''), 4000);
      } else {
        alert(data.error || 'Erro ao enviar convite.');
      }
    } catch (err) {
      setSendingInviteId(null);
      alert('Erro de conexão ao despachar convite.');
    }
  };

  const handleSettleCommission = async (e) => {
    e.preventDefault();
    if (!settlingProf) return;
    try {
      await api.settleCommission({
        professional_id: settlingProf.professional_id,
        period_start: startDate,
        period_end: endDate,
        total_services_amount: settlingProf.total_revenue,
        total_commission: settlingProf.total_commission,
        deduction_amount: parseFloat(deductionAmount) || 0,
        payment_method: settleMethod,
        notes: settleNotes
      });
      alert('Repasse quitado e registrado como despesa no financeiro com sucesso!');
      setSettlingProf(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Top Header */}
      <div className="glass-panel p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-pink-600 shrink-0" />
            Equipe, Especialidades & Repasse de Comissões
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Perfis de acesso, funções extensíveis (Cabeleireira, Manicure, Depiladora) e regras de comissão
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProf(null);
            setProfForm({
              name: '',
              nickname: '',
              role: 'Cabeleireira',
              access_level: 'PROFISSIONAL',
              subtypes: ['Cabeleireira'],
              phone: '',
              email: '',
              pin_code: '1234',
              color_hex: '#ec4899',
              specialties: ['Cabelo'],
              default_commission_type: 'percentage',
              default_commission_value: 50.0
            });
            setShowProfModal(true);
          }}
          className="w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 shadow-md shadow-pink-600/20 flex items-center justify-center gap-1.5 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Novo Membro da Equipe
        </button>
      </div>

      {inviteSuccessMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold border border-emerald-200 flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{inviteSuccessMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 sm:gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 min-w-fit px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition ${
            activeTab === 'list' ? 'bg-white dark:bg-slate-900 text-pink-600 shadow-xs' : 'text-slate-500'
          }`}
        >
          Membros & Acessos
        </button>
        <button
          onClick={() => setActiveTab('commissions-report')}
          className={`flex-1 min-w-fit px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition ${
            activeTab === 'commissions-report' ? 'bg-white dark:bg-slate-900 text-pink-600 shadow-xs' : 'text-slate-500'
          }`}
        >
          Relatório de Comissões
        </button>
        <button
          onClick={() => setActiveTab('settlements')}
          className={`flex-1 min-w-fit px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition ${
            activeTab === 'settlements' ? 'bg-white dark:bg-slate-900 text-pink-600 shadow-xs' : 'text-slate-500'
          }`}
        >
          Histórico de Repasses
        </button>
      </div>

      {/* TAB 1: Lista de Profissionais com Perfis e Subtipos */}
      {activeTab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {professionals.map((p) => {
            const roleConf = ROLE_CONFIG[p.access_level] || ROLE_CONFIG.PROFISSIONAL;
            const subtypes = Array.isArray(p.subtypes) ? p.subtypes : (p.role ? [p.role] : []);

            return (
              <div key={p.id} className="glass-panel p-5 space-y-4 flex flex-col justify-between hover:border-pink-200 dark:hover:border-pink-900/60 transition-all">
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md"
                        style={{ backgroundColor: p.color_hex || '#ec4899' }}
                      >
                        {(p.nickname || p.name).charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">{p.name}</h3>
                        <p className="text-xs text-slate-400">{p.nickname} • {p.phone || 'Sem fone'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditProf(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Editar profissional"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProf(p.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Nível de Acesso Badge */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${roleConf.badgeColor}`}>
                      {roleConf.icon} {roleConf.label}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      PIN: {p.pin_code || '1234'}
                    </span>
                  </div>

                  {/* Subtipos / Funções de Atuação */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Funções & Especialidades:</span>
                    <div className="flex flex-wrap gap-1">
                      {subtypes.map((sub, idx) => (
                        <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-pink-50 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800/40">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Regra de Comissão e Desempenho */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Comissão Padrão:</span>
                      <span className="font-bold text-pink-600">
                        {p.default_commission_type === 'percentage' ? `${p.default_commission_value}%` : `R$ ${p.default_commission_value}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Atendimentos Concluídos:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{p.total_services_completed || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Ações Rápidas */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handleSendInviteEmail(p)}
                    disabled={sendingInviteId === p.id}
                    className="w-full py-1.5 text-xs font-bold rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    <span>{sendingInviteId === p.id ? 'Enviando...' : 'Enviar Convite por E-mail (Brevo)'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setRepProfId(p.id);
                      setActiveTab('commissions-report');
                    }}
                    className="w-full py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-pink-950/40 hover:text-pink-600 text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1"
                  >
                    <span>Ver Extrato de Repasse</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Relatório de Repasse de Comissões */}
      {activeTab === 'commissions-report' && (
        <div className="space-y-6">
          <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={repProfId}
                onChange={(e) => setRepProfId(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
              >
                <option value="">Todos os Profissionais</option>
                {professionals.map(p => (
                  <option key={p.id} value={p.id}>{p.nickname || p.name}</option>
                ))}
              </select>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <span className="text-xs text-slate-400">até</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">Total a Repassar:</span>
              <p className="text-xl font-black text-pink-600 dark:text-pink-400">
                R$ {(commReport?.totalCommissionAll || 0).toFixed(2)}
              </p>
            </div>
          </div>

          {(!commReport?.summary || commReport.summary.length === 0) ? (
            <div className="glass-panel p-10 text-center text-slate-400">
              <DollarSign className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold">Nenhum atendimento concluído no período para cálculo de repasse.</p>
            </div>
          ) : (
            commReport.summary.map((profSummary) => (
              <div key={profSummary.professional_id} className="glass-panel p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow"
                      style={{ backgroundColor: profSummary.color_hex || '#ec4899' }}
                    >
                      {profSummary.nickname.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">{profSummary.name} ({profSummary.nickname})</h3>
                      <p className="text-xs text-slate-400">{profSummary.total_services} atendimentos realizados no período</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Faturado: <strong>R$ {profSummary.total_revenue.toFixed(2)}</strong></p>
                      <p className="text-base font-black text-emerald-600">Comissão: R$ {profSummary.total_commission.toFixed(2)}</p>
                    </div>

                    <button
                      onClick={() => {
                        setSettlingProf(profSummary);
                        setDeductionAmount('0.00');
                        setSettleNotes(`Quitação de comissões do período ${startDate} a ${endDate}`);
                      }}
                      className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                    >
                      Quitar / Pagar Repasse
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {profSummary.items.map((it, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{it.service_name}</span>
                        <span className="text-slate-400 ml-2">({it.client_name} • {it.appointment_date.split('-').reverse().join('/')})</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-500">Valor: R$ {it.price.toFixed(2)}</span>
                        <span className="font-bold text-emerald-600">Comissão: R$ {it.commission_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: Histórico de Quitações */}
      {activeTab === 'settlements' && (
        <div className="glass-panel p-6 space-y-4">
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
            Histórico de Repasses Pagos à Equipe
          </h3>

          {settlementHistory.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Nenhum repasse quitado até o momento.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {settlementHistory.map((s) => (
                <div key={s.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      {s.prof_nickname || s.prof_name} • <span className="text-emerald-600">R$ {s.net_payout.toFixed(2)}</span>
                    </p>
                    <p className="text-slate-400">
                      Período: {s.period_start} a {s.period_end} • Pago em: {s.payment_date} ({s.payment_method.toUpperCase()})
                    </p>
                    {s.notes && <p className="text-[11px] text-slate-500 italic">{s.notes}</p>}
                  </div>

                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                    QUITADO NO FINANCEIRO
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Novo / Editar Profissional com Nível de Acesso e Subtipos */}
      {showProfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-lg text-slate-900 dark:text-white">
              {editingProf ? 'Editar Profissional da Equipe' : 'Cadastrar Novo Profissional'}
            </h3>

            <form onSubmit={handleSaveProf} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Camila Silveira"
                    value={profForm.name}
                    onChange={(e) => setProfForm({ ...profForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Apelido na Grade</label>
                  <input
                    type="text"
                    placeholder="Ex: Camila Hair"
                    value={profForm.nickname}
                    onChange={(e) => setProfForm({ ...profForm, nickname: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Nível de Acesso / Hierarquia de Permissões */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-purple-600" />
                  <span>Nível de Acesso / Permissão no Sistema:</span>
                </label>
                <select
                  value={profForm.access_level}
                  onChange={(e) => setProfForm({ ...profForm, access_level: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200"
                >
                  <option value="ADMIN">👑 Administrador / Dono (Acesso Total)</option>
                  <option value="GERENTE">👔 Gerente do Salão (Agenda, Clientes, Caixa, Equipe, DRE)</option>
                  <option value="RECEPCAO">🏷️ Recepção / Atendente (Agenda, Clientes, PDV)</option>
                  <option value="PROFISSIONAL">✨ Profissional Especialista (Agenda Própria, Anamnese, Comissões)</option>
                  <option value="AUXILIAR">🧼 Auxiliar / Apoio (Visualização de Agenda do Dia)</option>
                </select>
              </div>

              {/* Subtipos / Funções de Atuação no Salão (Extensíveis) */}
              <div className="space-y-2 p-3 bg-pink-50/50 dark:bg-pink-950/20 rounded-2xl border border-pink-200/60 dark:border-pink-800/40">
                <label className="block font-bold text-pink-900 dark:text-pink-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-pink-600" />
                  <span>Funções & Especialidades (Selecione uma ou mais):</span>
                </label>

                <div className="flex flex-wrap gap-1.5">
                  {specialtiesList.map((item, idx) => {
                    const name = item.name || item;
                    const isSelected = profForm.subtypes?.includes(name);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleToggleSubtype(name)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                          isSelected
                            ? 'bg-pink-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{name}
                      </button>
                    );
                  })}
                </div>

                {/* Input para Adicionar Nova Função Customizada */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Adicionar outra função (ex: Lash Designer, Massagem)..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-pink-200 dark:border-pink-800 text-xs bg-white dark:bg-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewCustomSubtype}
                    className="px-3 py-1.5 bg-pink-600 text-white font-bold rounded-xl text-xs"
                  >
                    + Criar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={profForm.phone}
                    onChange={(e) => setProfForm({ ...profForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">E-mail (para convite)</label>
                  <input
                    type="email"
                    placeholder="profissional@email.com"
                    value={profForm.email}
                    onChange={(e) => setProfForm({ ...profForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-pink-600" />
                    <span>PIN Rápido (4 dígitos)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={profForm.pin_code}
                    onChange={(e) => setProfForm({ ...profForm, pin_code: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Cor na Grade</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={profForm.color_hex}
                      onChange={(e) => setProfForm({ ...profForm, color_hex: e.target.value })}
                      className="w-10 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                    />
                    <span className="text-xs font-mono text-slate-500">{profForm.color_hex}</span>
                  </div>
                </div>
              </div>

              {/* Regra de Comissão Padrão */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Regra de Comissão Padrão</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <select
                      value={profForm.default_commission_type}
                      onChange={(e) => setProfForm({ ...profForm, default_commission_type: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                    >
                      <option value="percentage">Porcentagem (%)</option>
                      <option value="fixed">Valor Fixo (R$)</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={profForm.default_commission_value}
                      onChange={(e) => setProfForm({ ...profForm, default_commission_value: parseFloat(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProfModal(false)}
                  className="px-4 py-2 font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold rounded-xl text-white bg-gradient-to-r from-pink-600 to-purple-600 shadow-md shadow-pink-600/20"
                >
                  Salvar Profissional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quitar Repasse */}
      {settlingProf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">Quitar Repasse de Comissões</h3>
            <p className="text-xs text-slate-500">
              Profissional: <strong className="text-slate-800 dark:text-slate-200">{settlingProf.name}</strong>
            </p>

            <form onSubmit={handleSettleCommission} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Faturado em Serviços:</span>
                  <span className="font-semibold">R$ {settlingProf.total_revenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Comissão Calculada:</span>
                  <span className="font-bold text-emerald-600">R$ {settlingProf.total_commission.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Descontos / Insumos (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={deductionAmount}
                  onChange={(e) => setDeductionAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Forma de Pagamento</label>
                <select
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="transferencia">Transferência Bancária</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Observações da Quitação</label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex justify-between items-center text-sm font-bold text-emerald-700 dark:text-emerald-300">
                <span>Valor Líquido a Pagar:</span>
                <span>R$ {(settlingProf.total_commission - (parseFloat(deductionAmount) || 0)).toFixed(2)}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettlingProf(null)}
                  className="px-4 py-2 font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  Confirmar Quitação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
