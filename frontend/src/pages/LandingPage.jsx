import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Scissors,
  Flame,
  MessageSquare,
  Calendar,
  CreditCard,
  Heart,
  ChevronDown,
  X,
  Check,
  BarChart3,
  Zap,
  Users,
  Eye,
  Crown,
  Lock,
} from 'lucide-react';
import { Link } from '../components/Link';

export default function LandingPage({ onNavigateLogin, onNavigateRegister, onEnterDemo }) {
  const [activeTab, setActiveTab] = useState('cabelo');
  const [openFaq, setOpenFaq] = useState(null);
  const [showFloatingCta, setShowFloatingCta] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        setShowFloatingCta(window.scrollY > 500);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-pink-600 selection:text-white font-sans">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-pink-100/60 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-500 to-purple-600 flex items-center justify-center text-white font-black text-base sm:text-xl shadow-md shadow-pink-500/20 shrink-0">
              ✨
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-lg font-black tracking-tight text-slate-950 flex items-center gap-1.5 truncate">
                BellaGestão <span className="text-pink-600 font-extrabold text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-pink-50 border border-pink-200 shrink-0">Studio</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden xs:block truncate">Salão de Beleza • Barbearia • Estética</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs font-bold text-slate-600">
            <a href="#recursos" className="hover:text-pink-600 transition-colors">Recursos & Especialidades</a>
            <a href="#antes-depois" className="hover:text-pink-600 transition-colors">Antes vs. Depois</a>
            <a href="#planos" className="hover:text-pink-600 transition-colors">Planos & Preços</a>
            <a href="#faq" className="hover:text-pink-600 transition-colors">Dúvidas Frequentes</a>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              onClick={onNavigateLogin}
              className="px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-pink-600 transition-colors"
            >
              Entrar
            </button>
            <button
              onClick={onNavigateRegister}
              className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-black text-xs shadow-md shadow-pink-600/25 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Criar Conta Grátis</span>
              <span className="xs:hidden">Criar Conta</span>
            </button>
          </div>
        </div>
      </header>

      {/* 🚀 1. HERO SECTION & PROPOSTA DE VALOR */}
      <section className="relative pt-10 sm:pt-16 pb-12 text-center max-w-5xl mx-auto px-4 space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 border border-pink-200 text-pink-700 text-xs font-extrabold shadow-xs animate-pulse">
          <Flame className="w-4 h-4 text-pink-500 fill-current" />
          <span>O ERP para Salão Mais Moderno do Brasil • 100% Web</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.15]">
          Diga Adeus às Faltas e Transforme seu Salão em um Negócio{' '}
          <span className="bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 bg-clip-text text-transparent">
            Organizado e Altamente Lucrativo
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Agenda multisserviços, comissões automáticas para cabeleireiras, manicures e depiladoras, e{' '}
          <strong className="text-slate-900 font-bold">lembretes automáticos no WhatsApp</strong> dos clientes. Sem complicação e sem cartão de crédito.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={onNavigateRegister}
            className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-black text-base shadow-xl shadow-pink-600/30 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:scale-95"
          >
            <Sparkles className="w-5 h-5 text-amber-300 fill-current" />
            <span>Começar no Plano Gratuito (2 Usuários)</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={onEnterDemo}
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-sm border border-slate-300 shadow-xs flex items-center justify-center gap-2 transition-all hover:border-pink-300"
          >
            <span>Testar Demonstração Ao Vivo</span>
            <ArrowRight className="w-4 h-4 text-pink-600" />
          </button>
        </div>

        {/* Micro-copy de Confiança */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 pt-2 text-xs font-bold text-slate-600">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Sem necessidade de cartão de crédito</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Configuração em menos de 2 minutos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Acesso no Celular, Tablet e PC</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Suporte Humanizado</span>
          </div>
        </div>

        {/* MOCKUP INTERATIVO DA INTERFACE */}
        <div className="pt-6">
          <div className="relative mx-auto max-w-5xl rounded-3xl bg-slate-900 p-2 sm:p-4 shadow-2xl ring-1 ring-slate-900/10">
            <div className="rounded-2xl bg-slate-950 p-4 sm:p-6 text-left border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-slate-400 font-mono ml-2">app.bellagestao.com.br/agenda</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  WhatsApp Salão Conectado
                </div>
              </div>

              {/* Grid dos Cards de Demonstração */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Card 1: Agenda Multisserviços */}
                <div className="bg-slate-900/90 rounded-2xl p-4 border border-pink-900/40 space-y-3">
                  <div className="flex items-center justify-between font-bold text-pink-400">
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Agenda de Hoje</span>
                    <span className="bg-pink-500/20 px-2 py-0.5 rounded-full text-[10px]">14 Agendamentos</span>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-1.5">
                    <div className="flex justify-between font-bold text-white">
                      <span>Mariana Ribeiro</span>
                      <span className="text-emerald-400">09:30</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Mechas + Manicure (Camila & Fernanda)</p>
                    <div className="text-[10px] text-emerald-300 font-mono bg-emerald-950/80 p-1.5 rounded-lg border border-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Lembrete 24h enviado no WhatsApp!
                    </div>
                  </div>
                </div>

                {/* Card 2: Ficha Técnica & Anamnese */}
                <div className="bg-slate-900/90 rounded-2xl p-4 border border-purple-900/40 space-y-3">
                  <div className="flex items-center justify-between font-bold text-purple-400">
                    <span className="flex items-center gap-1.5"><Scissors className="w-4 h-4" /> Anamnese & Fórmulas</span>
                    <span className="bg-purple-500/20 px-2 py-0.5 rounded-full text-[10px]">Salvo</span>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-1.5">
                    <div className="flex justify-between font-bold text-white">
                      <span>Loiras & Morenas Iluminadas</span>
                      <span className="text-purple-300">Fórmula 8.31</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Ox 20 Vol + Matizador Pérola • Histórico 100% gravado</p>
                  </div>
                </div>

                {/* Card 3: Caixa e Comissões */}
                <div className="bg-slate-900/90 rounded-2xl p-4 border border-emerald-900/40 space-y-3">
                  <div className="flex items-center justify-between font-bold text-emerald-400">
                    <span className="flex items-center gap-1.5"><BarChart3 className="w-4 h-4" /> Faturamento de Hoje</span>
                    <span className="text-emerald-400 font-mono font-bold">+24.8%</span>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-2">
                    <div className="text-2xl font-black text-emerald-400 font-mono">R$ 3.840,00</div>
                    <div className="text-[10px] text-slate-300 bg-slate-700/60 p-1 rounded text-center">Comissões da Equipe Calculadas</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 2. DIFERENCIAIS DA PLATAFORMA */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-lg max-w-5xl mx-auto my-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-black text-pink-600 flex items-center justify-center gap-1.5">
              <Zap className="w-5 h-5" /> 100% Web
            </div>
            <div className="text-xs text-slate-500 font-semibold">Sem complicação, use no celular ou computador</div>
          </div>
          <div className="space-y-1 pt-4 sm:pt-0">
            <div className="text-xl sm:text-2xl font-black text-emerald-600 flex items-center justify-center gap-1.5">
              <MessageSquare className="w-5 h-5" /> WhatsApp
            </div>
            <div className="text-xs text-slate-500 font-semibold">Lembretes automáticos 24h e 2h antes</div>
          </div>
          <div className="space-y-1 pt-4 sm:pt-0">
            <div className="text-xl sm:text-2xl font-black text-purple-600 flex items-center justify-center gap-1.5">
              <Sparkles className="w-5 h-5 fill-current" /> Starter Grátis
            </div>
            <div className="text-xs text-slate-500 font-semibold">Até 2 Profissionais inclusos sem precisar de cartão</div>
          </div>
          <div className="space-y-1 pt-4 sm:pt-0">
            <div className="text-xl sm:text-2xl font-black text-blue-600 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-5 h-5" /> Seguro
            </div>
            <div className="text-xs text-slate-500 font-semibold">Backups diários e conformidade LGPD</div>
          </div>
        </div>
      </section>

      {/* ⚖️ 3. SEÇÃO ANTES VS. DEPOIS */}
      <section id="antes-depois" className="max-w-5xl mx-auto px-4 space-y-8 my-16">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Você ainda perde clientes por desorganização?
          </h2>
          <p className="text-sm text-slate-600">Veja a diferença entre a agenda de papel e uma gestão profissional:</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-rose-50/70 rounded-3xl p-6 sm:p-8 border border-rose-200 space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-black text-base uppercase tracking-wide">
              <X className="w-6 h-6 bg-rose-200 text-rose-800 rounded-full p-1" />
              <span>Sem Sistema (Agenda de Papel)</span>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-rose-950 font-medium">
              <li className="flex items-start gap-2.5">
                <span className="text-rose-500 font-bold text-base">✕</span>
                <span>Clientes esquecem o horário marcado e faltam (no-show com cadeira vazia).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-500 font-bold text-base">✕</span>
                <span>Fórmulas químicas de cor perdidas em anotações no caderno.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-500 font-bold text-base">✕</span>
                <span>Horas calculando comissões no final da semana com brigas e erros de soma.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-500 font-bold text-base">✕</span>
                <span>Caixa que não fecha e falta de visão sobre o lucro real do salão.</span>
              </li>
            </ul>
          </div>

          <div className="bg-emerald-50/70 rounded-3xl p-6 sm:p-8 border-2 border-emerald-300 shadow-md space-y-4">
            <div className="flex items-center gap-2 text-emerald-800 font-black text-base uppercase tracking-wide">
              <Check className="w-6 h-6 bg-emerald-200 text-emerald-800 rounded-full p-1" />
              <span>Com o BellaGestão Studio</span>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-emerald-950 font-semibold">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold text-base">✓</span>
                <span><strong>WhatsApp Automático:</strong> o cliente recebe lembrete 24h e 2h antes e confirma com 1 toque.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold text-base">✓</span>
                <span>Ficha de anamnese técnica digital para cabelo, unhas e depilação sempre acessível.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold text-base">✓</span>
                <span>Comissões divididas na hora com extrato transparente para cada profissional.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold text-base">✓</span>
                <span>PDV rápido com PIX dinâmico, cartões e fechamento de caixa sem furos.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 💅 4. ABAS POR ESPECIALIDADE & RECURSOS */}
      <section id="recursos" className="max-w-5xl mx-auto px-4 space-y-8 my-16">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest text-pink-600">Feito Para Todas as Especialidades</span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">Recursos Prontos Para Seu Salão</h2>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-200 pb-3">
          {[
            { id: 'cabelo', label: '💇‍♀️ Cabelo & Química' },
            { id: 'manicure', label: '💅 Manicure & Nails' },
            { id: 'depilacao', label: '🌸 Depilação & Estética' },
            { id: 'barbearia', label: '✂️ Barbearia' },
            { id: 'gestao', label: '💰 Caixa & Gestão' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-pink-600 text-white shadow-md shadow-pink-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Cards */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md">
          {activeTab === 'cabelo' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <h3 className="text-xl font-black text-slate-900">Gestão Completa de Cabelo & Colorimetria</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Histórico químico com fórmulas de tintura, mechas, tipo de curvatura do fio, sensibilidades e tempo de pausa.
                </p>
                <ul className="space-y-2 text-xs font-bold text-slate-700">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-pink-600" /> Ficha técnica de colorimetria por cliente</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-pink-600" /> Comanda multisserviços (Corte + Mechas + Tratamento)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-pink-600" /> Comissão diferenciada por cabeleireira ou por serviço</li>
                </ul>
              </div>
              <div className="bg-pink-50 rounded-2xl p-5 border border-pink-200 space-y-2 text-xs">
                <div className="font-bold text-pink-900">Exemplo de Ficha Capilar Salva:</div>
                <div className="bg-white p-3 rounded-xl border border-pink-100 shadow-xs space-y-1">
                  <div className="font-bold text-slate-900">Cliente: Fernanda Torres</div>
                  <div className="text-slate-600">Tom Natural: Castanho Claro (5.0) | Alergia: Amônia Zero</div>
                  <div className="text-pink-600 font-mono font-bold">Última Fórmula: 9.12 + Ox 30V + Plex</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'manicure' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <h3 className="text-xl font-black text-slate-900">Esmalteria & Nail Design de Alto Padrão</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Controle de tempo para alongamentos de gel, fibra e esmaltação em gel, com alertas de manutenção periódica no WhatsApp.
                </p>
                <ul className="space-y-2 text-xs font-bold text-slate-700">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-600" /> Lembrete automático de manutenção a cada 20 dias</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-600" /> Preferências de formato (Stiletto, Amendoada, Quadrada)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-600" /> Repasse rápido de comissão por atendimento</li>
                </ul>
              </div>
              <div className="bg-rose-50 rounded-2xl p-5 border border-rose-200 space-y-2 text-xs">
                <div className="font-bold text-rose-900">Lembrete Automático no Zap:</div>
                <div className="bg-white p-3 rounded-xl border border-rose-100 shadow-xs text-slate-700">
                  "Oi Carol! Faz 18 dias do seu alongamento em gel. Que tal agendar sua manutenção para garantir unhas impecáveis? 💅✨"
                </div>
              </div>
            </div>
          )}

          {activeTab === 'depilacao' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <h3 className="text-xl font-black text-slate-900">Depilação & Centro de Estética</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Anamnese de fototipo de pele, histórico de foliculite, alergias a ceras e produtos, e planos de sessões corporais.
                </p>
                <ul className="space-y-2 text-xs font-bold text-slate-700">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-600" /> Ficha de avaliação estética e sensibilidades</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-600" /> Histórico de áreas depiladas e método preferido</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-600" /> Bloqueio inteligente de salas e cabines</li>
                </ul>
              </div>
              <div className="bg-cyan-50 rounded-2xl p-5 border border-cyan-200 space-y-2 text-xs">
                <div className="font-bold text-cyan-900">Segurança Técnica:</div>
                <div className="bg-white p-3 rounded-xl border border-cyan-100 shadow-xs text-slate-700">
                  Fototipo III • Cera Hidrossolúvel de Mel • Cuidados pós-depilação disparados no WhatsApp
                </div>
              </div>
            </div>
          )}

          {activeTab === 'barbearia' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <h3 className="text-xl font-black text-slate-900">Barbearia & Cortes Masculinos</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Agilidade máxima no balcão: Barba, Cabelo, Bigode, Selagem e venda de pomadas e tônicos no PDV com 1 clique.
                </p>
                <ul className="space-y-2 text-xs font-bold text-slate-700">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600" /> Grade ágil por barbeiro</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600" /> Venda casada de serviços + produtos (PDV Balcão)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600" /> Pontos de fidelidade por corte</li>
                </ul>
              </div>
              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 space-y-2 text-xs">
                <div className="font-bold text-amber-900">Comanda Rápida:</div>
                <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-xs text-slate-700 font-bold">
                  Degradê Navalhado + Barboterapia + Pomada Matte = Total R$ 135,00
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gestao' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <h3 className="text-xl font-black text-slate-900">Frente de Caixa, PDV & DRE Lucrativo</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Saiba exatamente quanto seu salão faturou hoje, quanto foi pago de comissão e qual o lucro líquido real do negócio.
                </p>
                <ul className="space-y-2 text-xs font-bold text-slate-700">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Checkout com PIX Dinâmico, Cartão de Crédito/Débito e Dinheiro</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Relatório de repasse de comissões com quitação em 1 clique</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> DRE simplificado com receitas, despesas e lucro</li>
                </ul>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200 space-y-2 text-xs">
                <div className="font-bold text-emerald-900">Demonstrativo Financeiro:</div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-xs text-slate-700 space-y-1 font-semibold">
                  <div className="flex justify-between"><span>Receita Bruta:</span><span className="text-emerald-700 font-bold">R$ 18.450,00</span></div>
                  <div className="flex justify-between"><span>(-) Comissões Equipe:</span><span className="text-rose-600">R$ 9.225,00</span></div>
                  <div className="flex justify-between border-t pt-1"><span>(=) Lucro Líquido:</span><span className="text-emerald-800 font-black">R$ 7.120,00</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 💰 5. TABELA DE PREÇOS (POR CAPACIDADE OPERACIONAL) */}
      <section id="planos" className="bg-slate-950 text-white p-6 sm:p-12 rounded-3xl shadow-2xl space-y-10 relative overflow-hidden border border-slate-800 max-w-6xl mx-auto my-16">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest text-pink-400">Planos Transparentes por Capacidade</span>
          <h2 className="text-3xl sm:text-4xl font-black">Planos que Crescem Junto com seu Salão</h2>
          <p className="text-xs sm:text-sm text-slate-400">Da manicure autônoma a salões com 15+ colaboradores. Sem multas ou fidelidade.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {/* Solo */}
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Solo / Autônoma</div>
              <div className="text-3xl font-black text-white">R$ 0,00 <span className="text-xs font-normal text-slate-400">/mês</span></div>
              <div className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 p-2 rounded-xl border border-emerald-800">
                ✓ 1 Profissional • até 40 agendamentos/mês
              </div>
              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Manicure / Lash Solo</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Agenda simples</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Cadastro de clientes CRM</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Comissão fixa 100% autônoma</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Frente de Caixa Balcão</li>
              </ul>
            </div>
            <button
              onClick={onNavigateRegister}
              className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center transition-colors"
            >
              Começar Grátis
            </button>
          </div>

          {/* Starter */}
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">Starter</div>
              <div className="text-3xl font-black text-white">R$ 69,90 <span className="text-xs font-normal text-slate-400">/mês</span></div>
              <div className="text-[11px] font-semibold text-indigo-300 bg-indigo-950/60 p-2 rounded-xl border border-indigo-800">
                ✓ Até 2 Profissionais • Ilimitado
              </div>
              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> 2 Profissionais / Cadeiras</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> <strong>Agendamentos Ilimitados</strong></li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> Caixa Diário & PDV Balcão</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> Histórico & Anamnese Técnica</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> Lembretes automáticos</li>
              </ul>
            </div>
            <button
              onClick={onNavigateRegister}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs text-center transition-colors"
            >
              Assinar Starter
            </button>
          </div>

          {/* Studio Pro (Destaque) */}
          <div className="bg-gradient-to-b from-pink-950/90 via-slate-900 to-purple-950/90 rounded-3xl p-6 border-2 border-pink-500 shadow-2xl space-y-6 flex flex-col justify-between relative transform lg:-translate-y-2">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-full shadow-md whitespace-nowrap">
              ⭐ Mais Escolhido Pelos Salões
            </div>
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-pink-300">Studio Pro</div>
              <div className="text-3xl font-black text-white">
                R$ 139,90 <span className="text-xs font-normal text-slate-300">/mês</span>
              </div>
              <div className="text-xs text-pink-300 font-bold bg-pink-950/60 p-2 rounded-xl border border-pink-800">
                ✓ Até 5 Profissionais (+R$ 15/extra)
              </div>
              <ul className="space-y-2 text-xs text-slate-200 pt-2">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-pink-400 shrink-0" /> <strong>Comissões Sem Planilha</strong> (Lei do Salão Parceiro)</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-pink-400 shrink-0" /> <strong>Comandas Multisserviços Express</strong></li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-pink-400 shrink-0" /> Agendas individuais por cadeira</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-pink-400 shrink-0" /> WhatsApp Automático (24h e 2h)</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-pink-400 shrink-0" /> Anamnese & Fórmulas Químicas</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-pink-400 shrink-0" /> Backup Automático em Nuvem</li>
              </ul>
            </div>
            <button
              onClick={onNavigateRegister}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black text-sm text-center shadow-xl transition-all"
            >
              Assinar Studio Pro
            </button>
          </div>

          {/* Premier Express */}
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-purple-400">Premier Express</div>
              <div className="text-3xl font-black text-white">
                R$ 229,90 <span className="text-xs font-normal text-slate-400">/mês</span>
              </div>
              <div className="text-[11px] text-purple-300 font-semibold bg-purple-950/60 p-2 rounded-xl border border-purple-800">
                ✓ Até 15 Profissionais (+R$ 15/extra)
              </div>
              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-400 shrink-0" /> <strong>CRM Reativação de Clientes</strong></li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-400 shrink-0" /> Multi-agenda de alto fluxo</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-400 shrink-0" /> Relatórios de Produtividade DRE</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-400 shrink-0" /> Múltiplas Unidades / Filiais</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-400 shrink-0" /> Suporte Prioritário VIP 24/7</li>
              </ul>
            </div>
            <button
              onClick={onNavigateRegister}
              className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs text-center transition-colors"
            >
              Assinar Premier
            </button>
          </div>
        </div>
      </section>

      {/* ❓ 6. FAQ ACCORDION INTERATIVO */}
      <section id="faq" className="max-w-3xl mx-auto px-4 space-y-6 my-16">
        <div className="text-center space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-pink-600">Tire Suas Dúvidas</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Perguntas Frequentes</h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'Preciso instalar algum programa no computador?',
              a: 'Não! O BellaGestão Studio é 100% web e roda no celular, tablet e computador sem ocupar espaço e sem exigir equipamentos caros.',
            },
            {
              q: 'Como funciona o envio de mensagens no WhatsApp?',
              a: 'Você escaneia o QR Code uma única vez com o WhatsApp do salão. A partir daí, o sistema dispara lembretes automáticos 24h e 2h antes de cada horário sem você precisar fazer nada!',
            },
            {
              q: 'Posso cadastrar diferentes tipos de profissionais?',
              a: 'Sim! Você pode cadastrar cabeleireiras, manicures, depiladoras, esteticistas, maquiadoras, barbeiros e criar quantas funções desejar, com comissões específicas para cada uma.',
            },
            {
              q: 'Como funciona o plano grátis?',
              a: 'O plano Starter é gratuito para até 2 profissionais testarem e usarem com acesso a agendamento, anamnese e caixa balcão, sem precisar colocar cartão de crédito.',
            },
            {
              q: 'Posso cancelar a assinatura quando quiser?',
              a: 'Sim, a cobrança é 100% mensal e você pode cancelar sua assinatura em 1 clique a qualquer momento, sem taxas ou multas.',
            },
          ].map((faq, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 sm:p-5 text-left font-bold text-xs sm:text-sm flex items-center justify-between gap-4"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    openFaq === idx ? 'rotate-180 text-pink-600' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 sm:px-5 pb-5 text-xs text-slate-600 border-t border-slate-100 pt-3 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 📌 7. FLOATING STICKY CTA */}
      {showFloatingCta && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-8 z-50 animate-fadeIn">
          <div className="bg-slate-950/95 backdrop-blur-md text-white p-3 sm:px-6 sm:py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-4">
            <div className="hidden sm:block">
              <div className="text-xs font-black text-white">BellaGestão Studio • Gestão de Salão & Estética</div>
              <div className="text-[10px] text-pink-400 font-bold">2 Profissionais Grátis • Sem Cartão</div>
            </div>
            <button
              onClick={onNavigateRegister}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xs shadow-md flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Criar Conta Grátis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 📄 8. RODAPÉ INSTITUCIONAL & LGPD */}
      <footer className="border-t border-slate-200 bg-white py-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                ✨
              </div>
              <span className="text-sm font-black text-slate-900">BellaGestão Studio</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              O sistema definitivo para salões de beleza, centros de estética, esmalterias e barbearias.
            </p>
            <div className="flex items-center gap-3 pt-1 text-[11px] font-bold text-slate-700">
              <Link to="/sobre" className="hover:text-pink-600">Sobre Nós</Link>
              <span>•</span>
              <Link to="/contato" className="hover:text-pink-600">Fale Conosco</Link>
            </div>
          </div>
          <div>
            <div className="font-bold text-slate-900 mb-2">Soluções por Segmento</div>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link to="/sistema-para-salao-de-beleza" className="hover:text-pink-600 transition-colors">
                  Salão de Beleza & Química
                </Link>
              </li>
              <li>
                <Link to="/sistema-para-barbearia" className="hover:text-pink-600 transition-colors">
                  Barbearia Moderna
                </Link>
              </li>
              <li>
                <Link to="/sistema-para-estetica-e-esmalteria" className="hover:text-pink-600 transition-colors">
                  Estética & Esmalterias
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-slate-900 mb-2">Segurança & Legal</div>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link to="/privacidade" className="hover:text-pink-600 transition-colors">
                  Política de Privacidade (LGPD)
                </Link>
              </li>
              <li>
                <Link to="/termos" className="hover:text-pink-600 transition-colors">
                  Termos e Condições de Uso
                </Link>
              </li>
              <li>Banco de Dados Local Criptografado</li>
              <li>Pagamento Seguro Mercado Pago</li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-slate-900 mb-2">Atendimento & Suporte</div>
            <p className="text-[11px] leading-relaxed">
              Segunda a Sábado das 08h às 20h<br />
              WhatsApp: (11) 98765-4321<br />
              E-mail: contato@bellagestao.com.br
            </p>
            <div className="pt-2">
              <Link to="/contato" className="inline-flex items-center gap-1 font-bold text-pink-600 hover:underline text-[11px]">
                <span>Abrir chamado com suporte</span> →
              </Link>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100 mt-8 pt-6 text-center text-[10px] text-slate-400">
          Copyright © 2026 BellaGestão Studio ERP. Todos os direitos reservados.
        </div>
      </footer>

    </div>
  );
}
