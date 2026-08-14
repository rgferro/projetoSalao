import React from 'react';
import { 
  Sun, 
  Moon, 
  CalendarPlus, 
  ShoppingBag, 
  UserPlus, 
  Wallet, 
  MessageSquare, 
  Wifi, 
  WifiOff, 
  Clock,
  Sparkles 
} from 'lucide-react';

export default function Header({ 
  darkMode, 
  setDarkMode, 
  cashStatus, 
  onOpenNewAppointment, 
  onOpenPDV, 
  onOpenNewClient,
  onOpenCashModal,
  waStatus
}) {
  const todayFormatted = new Intl.DateTimeFormat('pt-BR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Salão Info & Realtime Date */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-salon-600 to-rose-400 text-white shadow-md shadow-salon-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                BellaGestão <span className="text-salon-600 dark:text-salon-400 text-sm font-semibold">STUDIO</span>
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                100% Local
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {todayFormatted}
            </p>
          </div>
        </div>

        {/* Center/Right: Badges & Quick Action Shortcuts */}
        <div className="flex items-center gap-3">
          
          {/* Status Caixa Diário */}
          <button
            onClick={onOpenCashModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              cashStatus?.isOpen 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100' 
                : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 hover:bg-rose-100'
            }`}
            title="Clique para gerenciar o caixa diário"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>{cashStatus?.isOpen ? `Caixa Aberto (R$ ${(cashStatus?.session?.system_balance || 0).toFixed(2)})` : 'Caixa Fechado'}</span>
          </button>

          {/* Status WhatsApp */}
          <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
            waStatus === 'connected'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
          }`}>
            {waStatus === 'connected' ? <Wifi className="w-3.5 h-3.5 text-emerald-500" /> : <WifiOff className="w-3.5 h-3.5 text-amber-500" />}
            <span>{waStatus === 'connected' ? 'WhatsApp Ativo' : 'WhatsApp Pendente'}</span>
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewClient}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Atalho: F4"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Cliente <span className="opacity-60 text-[10px] ml-1 font-mono">F4</span></span>
            </button>

            <button
              onClick={onOpenPDV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/40 hover:bg-emerald-200/80 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 transition"
              title="Atalho: F3"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>PDV / Caixa <span className="opacity-70 text-[10px] ml-1 font-mono">F3</span></span>
            </button>

            <button
              onClick={onOpenNewAppointment}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-salon-600 to-salon-500 hover:from-salon-700 hover:to-salon-600 shadow-sm shadow-salon-500/20 active:scale-95 transition"
              title="Atalho: F2"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Novo Agendamento <span className="opacity-80 text-[10px] ml-1 font-mono">F2</span></span>
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={darkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
