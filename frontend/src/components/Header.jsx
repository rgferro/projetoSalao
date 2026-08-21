import React, { useState, useRef, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  CalendarPlus, 
  ShoppingBag, 
  Wallet, 
  Wifi, 
  WifiOff, 
  Clock,
  Sparkles,
  KeyRound,
  LogOut,
  HelpCircle,
  Menu,
  X,
  ChevronDown,
  Plus,
  Building2,
  Check,
  MapPin,
  Phone,
  Layers,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_CONFIG } from '../lib/permissions';
import { maskCEP, fetchViaCEP } from '../lib/validation';
import { getSegmentConfig } from '../lib/segmentTheme';

export const SEGMENT_MAP = {
  salao: { label: 'Salão & Cabelo', icon: '✂️', desc: 'Cabelo, mechas, química', gradient: 'from-pink-600 via-rose-500 to-purple-600' },
  barbearia: { label: 'Barbearia', icon: '💈', desc: 'Barba, corte masculino, navalha', gradient: 'from-amber-600 via-orange-600 to-red-600' },
  estetica: { label: 'Estética & Spa', icon: '✨', desc: 'Facial, corporal, drenagem, pele', gradient: 'from-emerald-600 via-teal-600 to-emerald-700' },
  esmalteria: { label: 'Esmalteria', icon: '💅', desc: 'Unhas, alongamento em gel/fibra', gradient: 'from-fuchsia-600 via-pink-600 to-rose-600' },
  lash: { label: 'Lash & Sobrancelhas', icon: '👁️', desc: 'Extensão de cílios, mapping, brow', gradient: 'from-rose-600 via-purple-600 to-indigo-600' },
};

export default function Header({ 
  darkMode, 
  setDarkMode, 
  cashStatus, 
  onOpenNewAppointment, 
  onOpenPDV, 
  onOpenNewClient, 
  onOpenCashModal, 
  waStatus, 
  onLogout, 
  onStartTour, 
  isMobileMenuOpen, 
  onToggleMobileMenu 
}) {
  const { user, userTenants, switchTenant, createProject, refreshTenants, exitImpersonation } = useAuth();

  // Estados do Menu Dropdown de Projetos/Salões
  const [showTenantMenu, setShowTenantMenu] = useState(false);
  const [switchingTenantId, setSwitchingTenantId] = useState(null);
  const tenantMenuRef = useRef(null);

  // Estados do Modal "+ Novo Projeto / Salão"
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectLoading, setNewProjectLoading] = useState(false);
  const [newProjectError, setNewProjectError] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: '',
    segment: 'salao',
    phone: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });

  // Fechar menu de tenants ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tenantMenuRef.current && !tenantMenuRef.current.contains(event.target)) {
        setShowTenantMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const todayFormatted = new Intl.DateTimeFormat('pt-BR', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  }).format(new Date());

  const currentRole = ROLE_CONFIG[user?.accessLevel] || ROLE_CONFIG.PROFISSIONAL;
  const segConfig = getSegmentConfig(user?.segment);
  const segTheme = segConfig.theme;
  const currentSegment = SEGMENT_MAP[user?.segment] || SEGMENT_MAP.salao;

  const handleSelectTenant = async (tenantId) => {
    if (tenantId === user?.tenantId) {
      setShowTenantMenu(false);
      return;
    }
    try {
      setSwitchingTenantId(tenantId);
      const res = await switchTenant(tenantId);
      setSwitchingTenantId(null);
      setShowTenantMenu(false);
      if (res.success) {
        window.location.reload();
      }
    } catch (e) {
      setSwitchingTenantId(null);
    }
  };

  const handleCepChange = async (e) => {
    const masked = maskCEP(e.target.value);
    setProjectForm(prev => ({ ...prev, cep: masked }));

    if (masked.replace(/\D/g, '').length === 8) {
      setLoadingCep(true);
      const address = await fetchViaCEP(masked);
      setLoadingCep(false);
      if (address) {
        setProjectForm(prev => ({
          ...prev,
          street: address.street || '',
          neighborhood: address.neighborhood || '',
          city: address.city || '',
          state: address.state || '',
        }));
      }
    }
  };

  const handleCreateProjectSubmit = async (e) => {
    e.preventDefault();
    setNewProjectError('');

    if (!projectForm.name.trim()) {
      return setNewProjectError('Informe o nome da empresa ou salão.');
    }

    try {
      setNewProjectLoading(true);
      const res = await createProject(projectForm);
      setNewProjectLoading(false);

      if (res.success) {
        setShowNewProjectModal(false);
        setProjectForm({
          name: '',
          segment: 'salao',
          phone: '',
          cep: '',
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: ''
        });
        window.location.reload();
      } else {
        setNewProjectError(res.error || 'Falha ao cadastrar novo projeto.');
      }
    } catch (err) {
      setNewProjectLoading(false);
      setNewProjectError(err.message || 'Erro ao criar projeto.');
    }
  };

  return (
    <>
      {user?.impersonated && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center justify-between shadow-md sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <span className="bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-mono">
              Suporte Master
            </span>
            <span className="text-white">
              Você está acessando como suporte o salão: <strong className="text-amber-200 underline">{user?.salonName}</strong>
            </span>
          </div>
          <button
            onClick={exitImpersonation}
            className="px-3 py-1 bg-slate-950 hover:bg-slate-900 text-amber-300 border border-amber-400/40 rounded-xl text-[11px] font-black transition shadow-sm"
          >
            Voltar ao Painel Master ↩
          </button>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Hamburger (mobile only) + Seletor de Projetos / Segmentos */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0" ref={tenantMenuRef}>
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none shrink-0"
              aria-label="Abrir menu de navegação"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Ícone e Botão Dropdown do Salão / Segmento Ativo */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTenantMenu(!showTenantMenu)}
                className="flex items-center gap-2 sm:gap-3 p-1.5 -m-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition text-left group"
                title="Clique para alternar entre seus salões e segmentos"
              >
                <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr ${currentSegment.gradient} text-white shadow-md shadow-pink-500/20 shrink-0 text-base sm:text-lg group-hover:scale-105 transition-transform`}>
                  {currentSegment.icon}
                </div>
                
                <div className="min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <h1 className="font-black text-xs sm:text-base lg:text-lg text-slate-800 dark:text-slate-100 tracking-tight leading-none truncate max-w-[110px] xs:max-w-[150px] sm:max-w-[220px]">
                      {user?.salonName || 'BelaGestão'}
                    </h1>
                    <span className="hidden sm:inline-flex text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full font-bold bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200 dark:border-pink-800 shrink-0 items-center gap-1">
                      <span>{currentSegment.label.split(' ')[0]}</span>
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-pink-600 transition-transform shrink-0 ${showTenantMenu ? 'rotate-180 text-pink-600' : ''}`} />
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 capitalize mt-0.5 hidden xs:flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{todayFormatted}</span>
                  </p>
                </div>
              </button>

              {/* Menu Dropdown de Alternância de Projetos */}
              {showTenantMenu && (
                <div className="absolute top-full left-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-fadeIn">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-pink-600" />
                      Seus Salões & Segmentos
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {userTenants?.length || 1}
                    </span>
                  </div>

                  {/* Lista de Salões do Usuário */}
                  <div className="max-h-60 overflow-y-auto py-1 space-y-1">
                    {userTenants && userTenants.length > 0 ? (
                      userTenants.map((t) => {
                        const isCurrent = t.id === user?.tenantId;
                        const tSeg = SEGMENT_MAP[t.segment] || SEGMENT_MAP.salao;
                        const isSwitchingThis = switchingTenantId === t.id;

                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleSelectTenant(t.id)}
                            disabled={isSwitchingThis}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl transition text-left ${
                              isCurrent
                                ? 'bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800/60'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${tSeg.gradient} text-white flex items-center justify-center text-sm shrink-0 shadow-2xs`}>
                                {tSeg.icon}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
                                  {t.name}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                  <span>{tSeg.label}</span>
                                  {t.city && <span>• {t.city}</span>}
                                </div>
                              </div>
                            </div>

                            {isSwitchingThis ? (
                              <Loader2 className="w-4 h-4 text-pink-600 animate-spin shrink-0" />
                            ) : isCurrent ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-pink-600 dark:text-pink-400 bg-pink-100/60 dark:bg-pink-900/40 px-1.5 py-0.5 rounded-md shrink-0">
                                <Check className="w-3 h-3" /> Ativo
                              </span>
                            ) : null}
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-500">
                        {user?.salonName} ({currentSegment.label})
                      </div>
                    )}
                  </div>

                  {/* Botão para Adicionar Novo Salão / Segmento */}
                  <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setShowTenantMenu(false);
                        setShowNewProjectModal(true);
                      }}
                      className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold shadow-sm transition ${segTheme.buttonGradient}`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Criar Novo Salão / Segmento</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center/Right: Badges & Quick Action Shortcuts */}
          <div className="flex items-center gap-1 sm:gap-2">
            
            {/* Status Caixa Diário */}
            <button
              id="tour-cash-status"
              onClick={onOpenCashModal}
              className={`hidden md:flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                cashStatus?.isOpen 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100' 
                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 hover:bg-rose-100'
              }`}
              title="Gerenciar caixa diário"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{cashStatus?.isOpen ? `Caixa Aberto (R$ ${(cashStatus?.session?.system_balance || 0).toFixed(2)})` : 'Caixa Fechado'}</span>
            </button>

            {/* Status WhatsApp */}
            <div className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border ${
              waStatus === 'connected' || waStatus === 'CONNECTED'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
            }`}>
              {waStatus === 'connected' || waStatus === 'CONNECTED' ? <Wifi className="w-3.5 h-3.5 text-emerald-500" /> : <WifiOff className="w-3.5 h-3.5 text-amber-500" />}
              <span>{waStatus === 'connected' || waStatus === 'CONNECTED' ? 'WhatsApp Ativo' : 'WhatsApp'}</span>
            </div>

            {/* Crachá do Usuário Logado (Visível em telas médias/grandes) */}
            <div
              className="hidden md:flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-left"
            >
              <span className="text-sm sm:text-base">{currentRole.icon}</span>
              <div className="hidden lg:block">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                  {user?.name || 'Profissional'}
                </div>
                <div className={`text-[10px] ${segTheme.textAccent} font-semibold`}>
                  {user?.role || currentRole.label}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                onClick={onOpenPDV}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/40 hover:bg-emerald-200/80 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 transition"
                title="Atalho: F3"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>PDV <span className="opacity-70 text-[10px] font-mono">F3</span></span>
              </button>

              <button
                id="tour-new-appointment-btn"
                onClick={onOpenNewAppointment}
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 whitespace-nowrap ${segTheme.buttonGradient}`}
                title="Novo Agendamento (F2)"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Novo Agendamento <span className="opacity-80 text-[10px] ml-1 font-mono">F2</span></span>
                <span className="sm:hidden text-[11px]">Novo</span>
              </button>

              {/* Botão de Tour Guiado (desktop/tablet) */}
              <button
                onClick={onStartTour}
                className="hidden sm:inline-flex p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Iniciar Tour Guiado Interativo"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {/* Dark / Light Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>

              {/* Sair / Logout */}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  title="Sair da Conta"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* Modal "+ Criar Novo Salão / Segmento" */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 to-purple-600 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-pink-500/20">
                  ✨
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Novo Salão / Segmento
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Crie um novo projeto independente com equipe e serviços próprios
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {newProjectError && (
              <div className="p-3 bg-rose-50 text-rose-800 text-xs font-bold rounded-xl border border-rose-200">
                {newProjectError}
              </div>
            )}

            <form onSubmit={handleCreateProjectSubmit} className="space-y-4">
              {/* Segmento */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-600 dark:text-slate-300">
                  Segmento de Atuação *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(SEGMENT_MAP).map(([key, seg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setProjectForm(prev => ({ ...prev, segment: key }))}
                      className={`p-2.5 rounded-xl border text-left flex flex-col items-start gap-1 transition ${
                        projectForm.segment === key
                          ? 'border-pink-500 bg-pink-50/70 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-bold ring-2 ring-pink-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-base">{seg.icon}</span>
                      <span className="text-xs font-bold leading-tight">{seg.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nome do Salão */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nome do Salão / Studio / Barbearia *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Studio Bella, Barbearia VIP, Bella Esmalteria..."
                  value={projectForm.name}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                />
              </div>

              {/* Telefone / WhatsApp */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  WhatsApp / Telefone da Unidade
                </label>
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={projectForm.phone}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                />
              </div>

              {/* Endereço Rápido */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>CEP</span>
                    {loadingCep && <span className="text-[10px] text-pink-600">Buscando...</span>}
                  </label>
                  <input
                    type="text"
                    placeholder="00000-000"
                    value={projectForm.cep}
                    onChange={handleCepChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-pink-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Cidade / UF</label>
                  <input
                    type="text"
                    placeholder="Cidade - UF"
                    value={projectForm.city ? `${projectForm.city} - ${projectForm.state}` : ''}
                    readOnly
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={newProjectLoading}
                  className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-black shadow-md hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  {newProjectLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Cadastrando...</span>
                    </>
                  ) : (
                    <span>Criar Projeto & Entrar</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
