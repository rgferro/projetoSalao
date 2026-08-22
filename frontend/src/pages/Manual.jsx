import React, { useState } from 'react';
import {
  HelpCircle,
  Play,
  Sparkles,
  Calendar,
  CreditCard,
  Users,
  MessageSquare,
  Scissors,
  DollarSign,
  ChevronDown,
  BookOpen,
  Keyboard,
  ShieldCheck,
  Compass,
  HardDrive,
  UserCheck
} from 'lucide-react';

export default function Manual({ onNavigateTab, onStartTour }) {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const handleStartTourAndNavigate = (tourKey, tabName) => {
    if (onNavigateTab && tabName) onNavigateTab(tabName);
    setTimeout(() => {
      if (onStartTour) {
        onStartTour(tourKey);
      }
    }, 300);
  };

  const TOURS_LIST = [
    {
      key: 'dashboard',
      tab: 'dashboard',
      icon: '📊',
      bgIcon: 'bg-purple-100 dark:bg-purple-950 text-purple-600',
      title: 'Dashboard & Indicadores',
      desc: 'Aprenda a ler o faturamento do dia, taxa de ocupação das salas e atalhos rápidos.',
    },
    {
      key: 'appointments',
      tab: 'appointments',
      icon: '📅',
      bgIcon: 'bg-pink-100 dark:bg-pink-950 text-pink-600',
      title: 'Agenda & Multisserviços',
      desc: 'Como marcar horários, adicionar múltiplos profissionais na mesma comanda e bloquear folgas.',
    },
    {
      key: 'cash-register',
      tab: 'cash-register',
      icon: '💰',
      bgIcon: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600',
      title: 'Frente de Caixa & PDV',
      desc: 'Abertura de caixa, cobrança via PIX, sangria, reforço e fechamento diário sem furos.',
    },
    {
      key: 'clients',
      tab: 'clients',
      icon: '👥',
      bgIcon: 'bg-cyan-100 dark:bg-cyan-950 text-cyan-600',
      title: 'Clientes & Ficha Técnica',
      desc: 'Como preencher a ficha capilar, fórmulas de tintura, preferências de unhas e histórico.',
    },
    {
      key: 'whatsapp',
      tab: 'whatsapp',
      icon: '📲',
      bgIcon: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600',
      title: 'WhatsApp & Automações',
      desc: 'Como parear o QR Code e configurar os lembretes 24h e 2h antes com variáveis dinâmicas.',
    },
    {
      key: 'financial',
      tab: 'financial',
      icon: '📈',
      bgIcon: 'bg-blue-100 dark:bg-blue-950 text-blue-600',
      title: 'Financeiro, DRE & Contas',
      desc: 'Acompanhe lucratividade real, rateio de comissões e gestão de despesas fixas.',
    },
    {
      key: 'professionals',
      tab: 'professionals',
      icon: '✂️',
      bgIcon: 'bg-amber-100 dark:bg-amber-950 text-amber-600',
      title: 'Equipe & Profissionais',
      desc: 'Cadastre especialistas, defina níveis de acesso restrito e regras da Lei do Salão Parceiro.',
    },
    {
      key: 'subscription',
      tab: 'subscription',
      icon: '⭐',
      bgIcon: 'bg-pink-100 dark:bg-pink-950 text-pink-600',
      title: 'Assinatura & Planos',
      desc: 'Entenda os limites de vagas por plano, add-ons de profissionais e pagamento via PIX.',
    },
    {
      key: 'backup',
      tab: 'backup',
      icon: '☁️',
      bgIcon: 'bg-slate-100 dark:bg-slate-800 text-slate-600',
      title: 'Backup & Nuvem',
      desc: 'Auditoria de integridade SHA-256 e cópias de segurança em nuvem automáticas.',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 dark:bg-pink-950/60 border border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300 text-xs font-bold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Central de Ajuda & Treinamento</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Manual do Usuário & Tutoriais Interativos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Aprenda a dominar todos os recursos do BelaGestão Studio com tutoriais guiados passo a passo na sua tela.
          </p>
        </div>
      </div>

      {/* 🚀 1. TOURS GUIADOS INTERATIVOS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-pink-600" />
            <span>Tours Interativos Passo a Passo</span>
          </h2>
          <span className="text-xs text-slate-500 font-semibold hidden sm:inline">Clique para iniciar na tela correspondente</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOURS_LIST.map((tour) => (
            <div
              key={tour.key}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-xs hover:border-pink-300 transition-colors"
            >
              <div className="space-y-2">
                <div className={`w-10 h-10 rounded-xl ${tour.bgIcon} flex items-center justify-center font-bold text-lg`}>
                  {tour.icon}
                </div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">{tour.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {tour.desc}
                </p>
              </div>
              <button
                onClick={() => handleStartTourAndNavigate(tour.key, tour.tab)}
                className="w-full py-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 text-xs font-black flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Iniciar Tour na Tela</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ⌨️ 2. GUIA DE ATALHOS DE TECLADO */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-xs">
        <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Keyboard className="w-5 h-5 text-purple-600" />
          <span>Atalhos de Teclado (Produtividade Ultra-Rápida)</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Pressione estas teclas a qualquer momento dentro do sistema para ações instantâneas sem usar o mouse:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <kbd className="px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-xs font-mono font-black text-pink-600 text-xs border border-slate-200 dark:border-slate-700">
              F1
            </kbd>
            <div className="text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200">Guia de Atalhos</div>
              <div className="text-[10px] text-slate-400">Abrir janela de ajuda</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <kbd className="px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-xs font-mono font-black text-pink-600 text-xs border border-slate-200 dark:border-slate-700">
              F2
            </kbd>
            <div className="text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200">Novo Agendamento</div>
              <div className="text-[10px] text-slate-400">Marcar horário rápido</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <kbd className="px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-xs font-mono font-black text-pink-600 text-xs border border-slate-200 dark:border-slate-700">
              F3
            </kbd>
            <div className="text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200">Frente de Caixa</div>
              <div className="text-[10px] text-slate-400">Ir direto para o PDV</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <kbd className="px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-xs font-mono font-black text-pink-600 text-xs border border-slate-200 dark:border-slate-700">
              F4
            </kbd>
            <div className="text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200">Novo Cliente</div>
              <div className="text-[10px] text-slate-400">Cadastro + Anamnese</div>
            </div>
          </div>
        </div>
      </div>

      {/* ❓ 3. PERGUNTAS & RESPOSTAS OPERACIONAIS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-xs">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">
          Dúvidas Operacionais do Dia a Dia
        </h2>

        <div className="space-y-3">
          {[
            {
              q: 'Como calcular e pagar a comissão de uma cabeleireira ou manicure?',
              a: 'Acesse o módulo "Caixa & Financeiro" e clique na aba "Comissões da Equipe". O sistema calcula automaticamente o percentual de cada serviço realizado no período selecionado. Ao clicar em "Quitar Comissão", o repasse é marcado como pago e lançado como despesa no financeiro.',
            },
            {
              q: 'Como funciona o agendamento de uma cliente com dois serviços diferentes?',
              a: 'Pressione F2 ou abra a Agenda. No modal de Novo Agendamento, clique em "+ Adicionar Procedimento" para incluir, por exemplo, Corte com Camila e Manicure com Fernanda. O sistema organiza os horários e calcula o tempo total automaticamente.',
            },
            {
              q: 'O que acontece se a internet cair?',
              a: 'O BelaGestão Studio utiliza banco de dados SQLite local de altíssima performance. Todas as informações de clientes, agenda e caixa continuam gravadas com total segurança.',
            },
          ].map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-center justify-between gap-4"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    openFaq === idx ? 'rotate-180 text-pink-600' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
