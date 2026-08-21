import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  ShoppingBag, 
  BadgeDollarSign, 
  UserCheck, 
  Scissors, 
  MessageSquareText, 
  HardDriveDownload,
  HelpCircle,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Compass,
  X,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSegmentConfig } from '../lib/segmentTheme';
import { MODULE_PLAN_REQUIREMENTS } from '../lib/permissions';

const ALL_MENU_ITEMS = [
  { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, category: 'Operacional' },
  { id: 'appointments', label: 'Agenda & Horários', icon: CalendarDays, category: 'Operacional' },
  { id: 'clients', label: 'Clientes & Anamnese', icon: Users, category: 'Operacional' },
  { id: 'cash-register', label: 'Frente de Caixa & PDV', icon: ShoppingBag, category: 'Operacional' },
  { id: 'financial', label: 'Financeiro & DRE', icon: BadgeDollarSign, category: 'Gestão' },
  { id: 'professionals', label: 'Equipe & Profissionais', icon: UserCheck, category: 'Gestão' },
  { id: 'services', label: 'Catálogo de Serviços', icon: Scissors, category: 'Gestão' },
  { id: 'whatsapp', label: 'WhatsApp Automático', icon: MessageSquareText, category: 'Gestão' },
  { id: 'subscription', label: 'Assinatura & Planos', icon: Sparkles, category: 'Administrativo' },
  { id: 'manual', label: 'Manual & Tutoriais', icon: BookOpen, category: 'Operacional' },
  { id: 'backup', label: 'Backup & Nuvem', icon: HardDriveDownload, category: 'Administrativo' },
];

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  onOpenHelp, 
  onStartTour,
  isOpenMobile,
  onCloseMobile
}) {
  const { user, checkPermission, isPlanAllowed } = useAuth();
  const segConfig = getSegmentConfig(user?.segment);
  const segTheme = segConfig.theme;

  // Filtrar apenas módulos autorizados para o perfil do usuário (RBAC)
  const allowedMenuItems = ALL_MENU_ITEMS.filter((item) => checkPermission(item.id));

  const handleSelectTab = (id) => {
    setActiveTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between bg-white dark:bg-slate-900 select-none">
      {/* Navigation List */}
      <div className="p-3 sm:p-4 space-y-1 overflow-y-auto flex-1">
        {/* Unit & Segment info */}
        <div className={`px-3 py-2 mb-2 rounded-xl border flex items-center justify-between ${segTheme.bgLight} ${segTheme.borderLight}`}>
          <div className="min-w-0 flex items-center gap-2">
            <span className="text-base shrink-0">{segConfig.icon}</span>
            <div className="min-w-0">
              <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 truncate">
                {user?.salonName || 'BelaGestão Studio'}
              </p>
              <p className={`text-[10px] font-bold truncate ${segTheme.textAccent}`}>
                {segConfig.shortLabel || segConfig.label}
              </p>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Super Admin Master Highlight */}
        {user?.isMaster && (
          <button
            onClick={() => handleSelectTab('master-admin')}
            className={`w-full mb-2 flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'master-admin'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md border border-amber-400'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 border border-amber-200/80 dark:border-amber-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-900 dark:text-amber-300" />
            <span className="truncate">Painel Master Admin</span>
          </button>
        )}

        {allowedMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isAllowedByPlan = isPlanAllowed(item.id);
          const req = MODULE_PLAN_REQUIREMENTS[item.id];

          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? `${segTheme.bgLight} ${segTheme.textAccent} ${segTheme.borderLight} border shadow-xs`
                  : !isAllowedByPlan
                  ? 'text-slate-400 dark:text-slate-500 hover:text-pink-600 hover:bg-pink-50/40 dark:hover:bg-pink-950/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 transition-transform ${
                  isActive 
                    ? `scale-110 ${segTheme.textAccent}` 
                    : !isAllowedByPlan
                    ? 'text-slate-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`} />
                <span className="truncate">{item.label}</span>
              </div>

              {!isAllowedByPlan && req && (
                <span className="shrink-0 flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800/60">
                  <Lock className="w-2.5 h-2.5" />
                  <span>PRO</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info & Shortcuts */}
      <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
        {onStartTour && (
          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              onStartTour();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${segTheme.bgLight} ${segTheme.textAccent} hover:opacity-90`}
          >
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4" />
              <span>Tour Interativo</span>
            </div>
            <span className="text-[10px] uppercase font-black">Guia</span>
          </button>
        )}

        <button
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            onOpenHelp();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>Guia de Atalhos</span>
          </div>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">F1</span>
        </button>

        <div className="px-2 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
          <span>BelaGestão v2.0</span>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Online
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, visible on md and up) */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (visible when isOpenMobile is true) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fadeIn">
          {/* Backdrop Blur */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Slide-in Drawer */}
          <div className="relative w-4/5 max-w-xs h-full bg-white dark:bg-slate-900 shadow-2xl z-10 border-r border-slate-200 dark:border-slate-800 animate-slideRight">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
