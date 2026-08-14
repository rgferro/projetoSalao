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
  HelpCircle
} from 'lucide-react';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'appointments', label: 'Agenda & Horários', icon: CalendarDays },
  { id: 'clients', label: 'Clientes & Anamnese', icon: Users },
  { id: 'cash-register', label: 'Frente de Caixa & PDV', icon: ShoppingBag },
  { id: 'financial', label: 'Financeiro & DRE', icon: BadgeDollarSign },
  { id: 'professionals', label: 'Equipe & Comissões', icon: UserCheck },
  { id: 'services', label: 'Catálogo de Serviços', icon: Scissors },
  { id: 'whatsapp', label: 'Módulo WhatsApp', icon: MessageSquareText },
  { id: 'backup', label: 'Backup & Google Drive', icon: HardDriveDownload },
];

export default function Sidebar({ activeTab, setActiveTab, onOpenHelp }) {
  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 select-none transition-colors">
      
      {/* Navigation List */}
      <div className="p-4 space-y-1">
        <div className="px-3 pb-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Menu de Gestão
          </p>
        </div>

        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-salon-50 dark:bg-salon-950/40 text-salon-600 dark:text-salon-400 font-semibold shadow-sm border border-salon-200 dark:border-salon-800/50'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'scale-110 text-salon-600 dark:text-salon-400' : 'text-slate-400 dark:text-slate-500'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer Info & Shortcuts */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <button
          onClick={onOpenHelp}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-salon-500" />
            <span>Guia de Atalhos</span>
          </div>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">F1</span>
        </button>

        <div className="mt-3 px-2 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
          <span>v1.0.0 • SQLite ACID</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Sistema Online e Operante"></span>
        </div>
      </div>

    </aside>
  );
}
