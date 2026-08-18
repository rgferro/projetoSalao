import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_CONFIG } from '../lib/permissions';

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
  const { user, switchUserWithPin } = useAuth();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState('');
  const [switching, setSwitching] = useState(false);

  const todayFormatted = new Intl.DateTimeFormat('pt-BR', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  }).format(new Date());

  const currentRole = ROLE_CONFIG[user?.accessLevel] || ROLE_CONFIG.PROFISSIONAL;

  const handleSwitchUser = async (e) => {
    e.preventDefault();
    setPinError('');
    if (!pinCode.trim()) return setPinError('Digite o PIN de 4 dígitos');

    setSwitching(true);
    const res = await switchUserWithPin(pinCode.trim());
    setSwitching(false);

    if (res.success) {
      setShowPinModal(false);
      setPinCode('');
    } else {
      setPinError(res.error || 'PIN não reconhecido.');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Hamburger (mobile only) + Salão Info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none shrink-0"
              aria-label="Abrir menu de navegação"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-pink-600 via-rose-500 to-purple-600 text-white shadow-md shadow-pink-500/20 shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-bold text-sm sm:text-base lg:text-lg text-slate-800 dark:text-slate-100 tracking-tight leading-none truncate max-w-[130px] xs:max-w-[180px] sm:max-w-none">
                  {user?.salonName || 'BellaGestão'}
                </h1>
                <span className="hidden xs:inline-block text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full font-bold bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200 dark:border-pink-800 shrink-0">
                  {user?.plan || 'PRO'}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 capitalize mt-0.5 hidden xs:flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{todayFormatted}</span>
              </p>
            </div>
          </div>

          {/* Center/Right: Badges & Quick Action Shortcuts */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
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

            {/* Crachá do Usuário Logado + Troca de Usuário (PIN) */}
            <button
              onClick={() => setShowPinModal(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition text-left"
              title="Trocar usuário com PIN de 4 dígitos"
            >
              <span className="text-sm sm:text-base">{currentRole.icon}</span>
              <div className="hidden lg:block">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                  {user?.name || 'Profissional'}
                </div>
                <div className="text-[10px] text-pink-600 dark:text-pink-400 font-semibold">
                  {user?.role || currentRole.label}
                </div>
              </div>
              <KeyRound className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
            </button>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-1.5">
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
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 shadow-xs shadow-pink-500/20 active:scale-95 transition"
                title="Novo Agendamento (F2)"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Novo Agendamento <span className="opacity-80 text-[10px] ml-1 font-mono">F2</span></span>
                <span className="sm:hidden">Novo</span>
              </button>

              {/* Botão de Tour Guiado */}
              <button
                onClick={onStartTour}
                className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-slate-800 transition"
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

      {/* Modal de Troca Rápida de Usuário por PIN de 4 Dígitos */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950 text-pink-600 flex items-center justify-center mx-auto text-xl font-bold">
                🔑
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Troca Rápida de Usuário
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Digite seu PIN de 4 dígitos para alternar de profissional
              </p>
            </div>

            {pinError && (
              <div className="p-2.5 bg-rose-50 text-rose-800 text-xs font-bold rounded-xl border border-rose-200 text-center">
                {pinError}
              </div>
            )}

            <form onSubmit={handleSwitchUser} className="space-y-4">
              <input
                type="password"
                maxLength={4}
                autoFocus
                placeholder="••••"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-3xl font-black tracking-widest py-3 px-4 rounded-2xl border-2 border-pink-300 dark:border-pink-800 focus:outline-none focus:ring-4 focus:ring-pink-500/20 text-pink-600 font-mono bg-pink-50/50 dark:bg-slate-800"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setShowPinModal(false); setPinCode(''); }}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={switching}
                  className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-black shadow-md hover:opacity-90 transition"
                >
                  {switching ? 'Alternando...' : 'Entrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
