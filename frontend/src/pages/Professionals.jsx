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
  Lock,
  KeyRound,
  Shield,
  Tag,
  Sliders,
  RotateCcw,
  LayoutDashboard,
  CreditCard,
  Users,
  MessageSquare,
  HelpCircle,
  HardDrive,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { api, getCsrfToken } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ROLE_CONFIG, DEFAULT_PROFESSIONAL_SUBTYPES, SYSTEM_MODULES, ACCESS_LEVELS } from '../lib/permissions';
import { 
  getSegmentConfig, 
  getSegmentTheme, 
  getSegmentSpecialties, 
  getSegmentTeamConfig 
} from '../lib/segmentTheme';

export default function Professionals() {
  const { 
    user, 
    isAdmin, 
    isMaster, 
    permissionsMap, 
    toggleRolePermission, 
    saveRolePermissions, 
    resetRolePermissions 
  } = useAuth();

  const segConfig = getSegmentConfig(user?.segment);
  const segTheme = segConfig.theme;
  const segTeam = segConfig.team;

  const [activeTab, setActiveTab] = useState('list'); // 'list', 'commissions-report', 'settlements', 'permissions'
  const [professionals, setProfessionals] = useState([]);
  const [services, setServices] = useState([]);
  const [specialtiesList, setSpecialtiesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gestão de Permissões
  const [selectedRoleToEdit, setSelectedRoleToEdit] = useState('PROFISSIONAL');
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [permSuccessMsg, setPermSuccessMsg] = useState('');
  const [permErrorMsg, setPermErrorMsg] = useState('');

  // New/Edit Professional Modal
  const [showProfModal, setShowProfModal] = useState(false);
  const [editingProf, setEditingProf] = useState(null);
  const [newTagInput, setNewTagInput] = useState('');
  const [profForm, setProfForm] = useState({
    name: '',
    nickname: '',
    role: segTeam.defaultRole,
    access_level: 'PROFISSIONAL',
    subtypes: [segTeam.defaultRole],
    phone: '',
    email: '',
    password: '',
    color_hex: segTeam.defaultColor,
    specialties: [segConfig.shortLabel || 'Geral'],
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

      // Carregar especialidades dinâmicas do backend com fallback prioritário do segmento
      fetch('/api/professionals/specialties')
        .then(res => res.json())
        .then(data => {
          const segSpecs = getSegmentSpecialties(user?.segment);
          if (Array.isArray(data) && data.length > 0) {
            // Mesclar evitando duplicatas
            const existingNames = new Set(data.map(d => (d.name || d).toLowerCase()));
            const merged = [...data];
            segSpecs.forEach(s => {
              if (!existingNames.has(s.name.toLowerCase())) {
                merged.push(s);
              }
            });
            setSpecialtiesList(merged);
          } else {
            setSpecialtiesList(segSpecs);
          }
        })
        .catch(() => setSpecialtiesList(getSegmentSpecialties(user?.segment)));

    } catch (err) {
      console.error('Erro ao carregar profissionais/comissões:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [repProfId, startDate, endDate, user?.segment]);

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
      password: '',
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bella_token') || ''}`,
          'X-CSRF-Token': await getCsrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          employeeId: prof.id,
          employeeEmail: prof.email,
          employeeName: prof.name,
          role: prof.role || 'Profissional',
          salonName: 'BelaGestão Studio',
          ownerName: 'Administrador'
        })
      });
      const data = await res.json();
      setSendingInviteId(null);

      if (data.success) {
        setInviteSuccessMsg(`Convite de acesso enviado com sucesso para ${prof.email}!`);
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
            <span className="text-xl shrink-0">{segConfig.icon}</span>
            <span>{segTeam.title}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {segTeam.subtitle}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProf(null);
            setProfForm({
              name: '',
              nickname: '',
              role: segTeam.defaultRole,
              access_level: 'PROFISSIONAL',
              subtypes: [segTeam.defaultRole],
              phone: '',
              email: '',
              password: '',
              color_hex: segTeam.defaultColor,
              specialties: [segConfig.shortLabel || 'Geral'],
              default_commission_type: 'percentage',
              default_commission_value: 50.0
            });
            setShowProfModal(true);
          }}
          className={`w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shrink-0 ${segTheme.buttonGradient}`}
        >
          <Plus className="w-4 h-4" /> {segTeam.newMemberBtn}
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
            activeTab === 'list' ? `${segTheme.activeTab}` : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Membros & Acessos
        </button>
        <button
          onClick={() => setActiveTab('commissions-report')}
          className={`flex-1 min-w-fit px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition ${
            activeTab === 'commissions-report' ? `${segTheme.activeTab}` : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Relatório de Comissões
        </button>
        <button
          onClick={() => setActiveTab('settlements')}
          className={`flex-1 min-w-fit px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition ${
            activeTab === 'settlements' ? `${segTheme.activeTab}` : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Histórico de Repasses
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('permissions')}
            className={`flex-1 min-w-fit px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition flex items-center justify-center gap-1.5 ${
              activeTab === 'permissions' ? `${segTheme.activeTab}` : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Permissões por Perfil</span>
          </button>
        )}
      </div>

      {/* TAB 1: Lista de Profissionais com Perfis e Subtipos */}
      {activeTab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {professionals.map((p) => {
            const roleConf = ROLE_CONFIG[p.access_level] || ROLE_CONFIG.PROFISSIONAL;
            const subtypes = Array.isArray(p.subtypes) ? p.subtypes : (p.role ? [p.role] : []);

            return (
              <div key={p.id} className="glass-panel p-5 space-y-4 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md"
                        style={{ backgroundColor: p.color_hex || segTeam.defaultColor }}
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

                  {/* Nível de Acesso Badge & E-mail */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${roleConf.badgeColor}`}>
                      {roleConf.icon} {roleConf.label}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md truncate max-w-[140px]" title={p.email}>
                      {p.email || 'Sem login'}
                    </span>
                  </div>

                  {/* Subtipos / Funções de Atuação */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Funções & Especialidades:</span>
                    <div className="flex flex-wrap gap-1">
                      {subtypes.map((sub, idx) => (
                        <span key={idx} className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${segTheme.tagBadge}`}>
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Regra de Comissão e Desempenho */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Comissão Padrão:</span>
                      <span className={`font-bold ${segTheme.textAccent}`}>
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
                    className="w-full py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    <span>{sendingInviteId === p.id ? 'Enviando...' : 'Enviar Convite por E-mail'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setRepProfId(p.id);
                      setActiveTab('commissions-report');
                    }}
                    className="w-full py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1"
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
              <p className={`text-xl font-black ${segTheme.textAccent}`}>
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
                      style={{ backgroundColor: profSummary.color_hex || segTeam.defaultColor }}
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

      {/* TAB 4: Matriz de Permissões por Perfil (Exclusivo Dono / Admin) */}
      {activeTab === 'permissions' && (
        <div className="glass-panel p-6 sm:p-8 space-y-6 animate-fadeIn">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold mb-2">
                <Shield className="w-3.5 h-3.5" />
                <span>Gerenciamento de Perfis & Segurança</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Personalização de Acessos por Perfil
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Defina exatamente quais módulos e telas cada perfil de colaborador pode acessar no seu espaço.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm('Deseja restaurar a matriz de permissões para os padrões recomendados do sistema?')) return;
                  const res = await resetRolePermissions();
                  if (res.success) {
                    setPermSuccessMsg('Permissões restauradas para os padrões recomendados com sucesso!');
                    setTimeout(() => setPermSuccessMsg(''), 4000);
                  } else {
                    setPermErrorMsg(res.error || 'Erro ao resetar permissões.');
                    setTimeout(() => setPermErrorMsg(''), 4000);
                  }
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Restaurar Padrões</span>
              </button>

              <button
                type="button"
                disabled={savingPermissions}
                onClick={async () => {
                  setSavingPermissions(true);
                  const res = await saveRolePermissions(permissionsMap);
                  setSavingPermissions(false);
                  if (res.success) {
                    setPermSuccessMsg('Matriz de permissões salva com sucesso e sincronizada com toda a equipe!');
                    setTimeout(() => setPermSuccessMsg(''), 4000);
                  } else {
                    setPermErrorMsg(res.error || 'Erro ao salvar permissões.');
                    setTimeout(() => setPermErrorMsg(''), 4000);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-purple-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {savingPermissions ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{savingPermissions ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </div>

          {permSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{permSuccessMsg}</span>
            </div>
          )}

          {permErrorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{permErrorMsg}</span>
            </div>
          )}

          {/* Seletor de Perfil para Configuração */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Selecione o Cargo / Perfil para Editar:
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {Object.keys(ACCESS_LEVELS).map((lvl) => {
                const conf = ROLE_CONFIG[lvl] || { label: lvl, icon: '👤', badgeColor: 'bg-slate-100' };
                const isSelected = selectedRoleToEdit === lvl;

                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedRoleToEdit(lvl)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/50 shadow-md ring-2 ring-purple-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{conf.icon}</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${conf.badgeColor}`}>
                        {lvl}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                        {conf.label}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Banner explicativo do perfil ativo */}
            {(() => {
              const activeConf = ROLE_CONFIG[selectedRoleToEdit] || ROLE_CONFIG.PROFISSIONAL;
              const allowedModulesCount = (permissionsMap[selectedRoleToEdit] || []).length;

              return (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{activeConf.icon}</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">{activeConf.label}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${activeConf.badgeColor}`}>
                        {allowedModulesCount} de {SYSTEM_MODULES.length} telas liberadas
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {activeConf.description}
                    </p>
                  </div>

                  {selectedRoleToEdit === 'ADMIN' && (
                    <div className="text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-950/60 px-3 py-1.5 rounded-xl border border-purple-300 dark:border-purple-800 shrink-0">
                      👑 Perfil Dono (Recomendado manter acesso irrestrito)
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Grade de Módulos e Acessos */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>Telas & Módulos Disponíveis</span>
                <span className="text-xs font-normal text-slate-400">
                  (Clique no card para ativar ou bloquear)
                </span>
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SYSTEM_MODULES.map((mod) => {
                const currentRoleAllowed = permissionsMap[selectedRoleToEdit] || [];
                const isAllowed = currentRoleAllowed.includes(mod.id);

                const getModuleIcon = (iconName) => {
                  switch (iconName) {
                    case 'LayoutDashboard': return <LayoutDashboard className="w-5 h-5" />;
                    case 'Calendar': return <Calendar className="w-5 h-5" />;
                    case 'Users': return <Users className="w-5 h-5" />;
                    case 'CreditCard': return <CreditCard className="w-5 h-5" />;
                    case 'DollarSign': return <DollarSign className="w-5 h-5" />;
                    case 'UserCheck': return <UserCheck className="w-5 h-5" />;
                    case 'Scissors': return <Scissors className="w-5 h-5" />;
                    case 'MessageSquare': return <MessageSquare className="w-5 h-5" />;
                    case 'Sparkles': return <Sparkles className="w-5 h-5" />;
                    case 'HelpCircle': return <HelpCircle className="w-5 h-5" />;
                    case 'HardDrive': return <HardDrive className="w-5 h-5" />;
                    default: return <Sparkles className="w-5 h-5" />;
                  }
                };

                const categoryColors = {
                  'Operacional': 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
                  'Gestão': 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
                  'Administrativo': 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
                };

                return (
                  <div
                    key={mod.id}
                    onClick={() => toggleRolePermission(selectedRoleToEdit, mod.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between select-none ${
                      isAllowed
                        ? 'bg-gradient-to-r from-emerald-50/90 to-teal-50/80 dark:from-emerald-950/40 dark:to-teal-950/30 border-emerald-300 dark:border-emerald-800/80 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60 hover:opacity-90'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                          isAllowed
                            ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                        }`}
                      >
                        {getModuleIcon(mod.icon)}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{mod.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${categoryColors[mod.category] || 'bg-slate-100'}`}>
                            {mod.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">#{mod.id}</span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-transform ${
                        isAllowed
                          ? 'bg-emerald-600 text-white shadow-sm scale-105'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                      }`}
                    >
                      {isAllowed ? <Check className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Novo / Editar Profissional com Nível de Acesso e Subtipos */}
      {showProfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <span>{segConfig.icon}</span>
              <span>{editingProf ? segTeam.editModalTitle : segTeam.newModalTitle}</span>
            </h3>

            <form onSubmit={handleSaveProf} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder={segTeam.placeholderName}
                    value={profForm.name}
                    onChange={(e) => setProfForm({ ...profForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Apelido na Grade</label>
                  <input
                    type="text"
                    placeholder={segTeam.placeholderNickname}
                    value={profForm.nickname}
                    onChange={(e) => setProfForm({ ...profForm, nickname: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
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

              {/* Subtipos / Funções de Atuação no Segmento (Extensíveis) */}
              <div className={`space-y-2 p-3 rounded-2xl border ${segTheme.bgLight} ${segTheme.borderLight}`}>
                <label className={`block font-bold flex items-center gap-1.5 ${segTheme.textAccent}`}>
                  <Tag className="w-3.5 h-3.5" />
                  <span>Funções & Especialidades do Nicho ({segConfig.label}):</span>
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
                            ? `${segTheme.tagBadgeSelected}`
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
                    placeholder={segTeam.placeholderCustomTag}
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewCustomSubtype}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${segTheme.buttonGradient}`}
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
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Senha de Acesso {editingProf ? '(opcional)' : ''}</span>
                  </label>
                  <input
                    type="password"
                    placeholder={editingProf ? 'Deixar em branco para manter' : 'Mínimo 6 caracteres'}
                    value={profForm.password || ''}
                    onChange={(e) => setProfForm({ ...profForm, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Cor na Grade</label>
                  <div className="flex items-center gap-2 pt-1">
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
                  className={`px-5 py-2 font-bold rounded-xl transition-all ${segTheme.buttonGradient}`}
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
