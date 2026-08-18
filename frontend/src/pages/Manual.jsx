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
} from 'lucide-react';
import { startTour } from '../lib/pageTours';

export default function Manual({ onNavigateTab }) {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const handleStartTourAndNavigate = (tourKey, tabName) => {
    if (onNavigateTab) onNavigateTab(tabName);
    setTimeout(() => {
      startTour(tourKey);
    }, 400);
  };

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
            Aprenda a dominar todos os recursos do BellaGestão Studio com tutoriais guiados passo a passo na sua tela.
          </p>
        </div>
      </div>

      {/* 🚀 1. TOURS GUIADOS INTERATIVOS (DRIVER.JS) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Play className="w-5 h-5 text-pink-600" />
            <span>Tours Interativos Passo a Passo</span>
          </h2>
          <span className="text-xs text-slate-500 font-semibold">Clique para iniciar na tela correspondente</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Tour 1: Dashboard */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-xs hover:border-pink-300 transition-colors">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold">
                📊
              </div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Dashboard & Indicadores</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aprenda a ler o faturamento do dia, taxa de ocupação das salas e atalhos rápidos.
              </p>
            </div>
            <button
              onClick={() => handleStartTourAndNavigate('dashboard', 'dashboard')}
              className="w-full py-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 text-xs font-black flex items-center justify-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Iniciar Tour no Dashboard</span>
            </button>
          </div>

          {/* Tour 2: Agenda */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-xs hover:border-pink-300 transition-colors">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-950 text-pink-600 flex items-center justify-center font-bold">
                📅
              </div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Agenda & Multisserviços</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Como marcar horários, adicionar múltiplos profissionais na mesma comanda e bloquear folgas.
              </p>
            </div>
            <button
              onClick={() => handleStartTourAndNavigate('appointments', 'appointments')}
              className="w-full py-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 text-xs font-black flex items-center justify-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Iniciar Tour na Agenda</span>
            </button>
          </div>

          {/* Tour 3: Caixa & PDV */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-xs hover:border-pink-300 transition-colors">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
                💰
              </div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Frente de Caixa & PDV</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Abertura de caixa, cobrança via PIX, sangria, reforço e fechamento diário sem furos.
              </p>
            </div>
            <button
              onClick={() => handleStartTourAndNavigate('cash', 'cash-register')}
              className="w-full py-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 text-xs font-black flex items-center justify-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Iniciar Tour no Caixa</span>
            </button>
          </div>

          {/* Tour 4: Clientes & Anamnese */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-xs hover:border-pink-300 transition-colors">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 flex items-center justify-center font-bold">
                👥
              </div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Clientes & Ficha Técnica</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Como preencher a ficha capilar, fórmulas de tintura, preferências de unhas e histórico.
              </p>
            </div>
            <button
              onClick={() => handleStartTourAndNavigate('clients', 'clients')}
              className="w-full py-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 text-xs font-black flex items-center justify-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Iniciar Tour nos Clientes</span>
            </button>
          </div>

          {/* Tour 5: WhatsApp Automático */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-xs hover:border-pink-300 transition-colors">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
                📲
              </div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">WhatsApp & Automações</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Como parear o QR Code e configurar os lembretes 24h e 2h antes com variáveis dinâmicas.
              </p>
            </div>
            <button
              onClick={() => handleStartTourAndNavigate('whatsapp', 'whatsapp')}
              className="w-full py-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 text-xs font-black flex items-center justify-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Iniciar Tour no WhatsApp</span>
            </button>
          </div>
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
              a: 'O BellaGestão Studio utiliza banco de dados SQLite local de altíssima performance. Todas as informações de clientes, agenda e caixa continuam gravadas com total segurança.',
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
