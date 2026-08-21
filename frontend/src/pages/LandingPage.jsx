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
  Building,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { Link } from '../components/Link';
import DynamicCpfFooter from '../components/DynamicCpfFooter';

export default function LandingPage({ onNavigateLogin, onNavigateRegister, onEnterDemo }) {
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

  const segments = [
    {
      id: 'salao',
      icon: '✂️',
      title: 'Salão de Beleza & Química Capilar',
      desc: 'Gestão completa de mechas, colorimetria capilar, cronograma, múltiplos profissionais e repasse de comissões.',
      path: '/sistema-para-salao-de-beleza',
      gradient: 'from-pink-600 to-rose-500',
      badge: 'Cabelo & Química',
      features: ['Anamnese e fórmulas químicas', 'Agenda em bancada multisserviços', 'Comissões com dedução de produtos']
    },
    {
      id: 'barbearia',
      icon: '💈',
      title: 'Barbearia Moderna & Barber Club',
      desc: 'Terminal rápido por PIN de 4 dígitos para bancada, QR Code PIX dinâmico e lembrete de retorno do degradê.',
      path: '/sistema-para-barbearia',
      gradient: 'from-amber-500 to-orange-500',
      badge: 'Cortes & Barba',
      features: ['Troca rápida por PIN em 1s', 'PIX dinâmico com baixa no caixa', 'WhatsApp de retorno aos 20 dias']
    },
    {
      id: 'estetica',
      icon: '✨',
      title: 'Clínica de Estética, Spa & Harmonização',
      desc: 'Fichas de anamnese facial e corporal com histórico de alergias, controle de pacotes/sessões e conformidade LGPD.',
      path: '/sistema-para-estetica',
      gradient: 'from-emerald-600 to-teal-500',
      badge: 'Estética & Saúde',
      features: ['Controle de pacotes (ex: 10 sessões)', 'Histórico clínico e fotos de evolução', 'Termos de consentimento digitais']
    },
    {
      id: 'esmalteria',
      icon: '💅',
      title: 'Esmalteria & Nail Design',
      desc: 'Especializado em alongamento de unhas (gel/fibra), manutenção preventiva aos 20 dias e controle por mesa.',
      path: '/sistema-para-esmalteria-e-unhas',
      gradient: 'from-purple-600 to-pink-500',
      badge: 'Alongamento & Unhas',
      features: ['Alerta automático de manutenção', 'Múltiplas mesas em paralelo', 'Comissão e custo de lixas/produtos']
    },
    {
      id: 'lash',
      icon: '👁️',
      title: 'Lash Designer & Sobrancelhas',
      desc: 'Fichas técnicas com mapping de curvaturas (C, D, L), registro de adesivos e lembrete preventivo de retenção.',
      path: '/sistema-para-lash-designer-e-sobrancelhas',
      gradient: 'from-indigo-600 to-rose-500',
      badge: 'Cílios & Olhar',
      features: ['Mapping de curvatura e espessura', 'Lembrete de manutenção aos 15/21 dias', 'Lucro real descontando materiais']
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-pink-600 selection:text-white font-sans">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-pink-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-md shadow-pink-500/20 shrink-0">
              ✨
            </div>
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-black tracking-tight text-slate-950 flex items-center gap-1.5">
                <span className="truncate">BelaGestão</span>
                <span className="hidden md:inline-flex text-pink-600 font-extrabold text-[11px] px-2 py-0.5 rounded-full bg-pink-50 border border-pink-200 shrink-0">
                  Platform
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block truncate">
                Ecossistema Multi-Segmentos para Beleza & Bem-Estar
              </p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#segmentos" className="hover:text-pink-600 transition-colors">Soluções por Segmento</a>
            <a href="#infraestrutura" className="hover:text-pink-600 transition-colors">Infraestrutura</a>
            <a href="#planos" className="hover:text-pink-600 transition-colors">Planos & Preços</a>
            <a href="#faq" className="hover:text-pink-600 transition-colors">Dúvidas</a>
            <Link to="/contato" className="hover:text-pink-600 transition-colors">Fale Conosco</Link>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link
              to="/login"
              className="px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-pink-600 transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/cadastro"
              className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-black text-xs shadow-md shadow-pink-600/25 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Criar Conta Grátis</span>
              <span className="sm:hidden">Começar</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 🚀 1. HERO SECTION INSTITUCIONAL */}
      <section className="relative pt-12 sm:pt-20 pb-12 text-center max-w-5xl mx-auto px-4 space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 border border-purple-200 text-purple-700 text-xs font-extrabold shadow-xs animate-pulse">
          <Layers className="w-4 h-4 text-purple-600" />
          <span>A Plataforma de Gestão Definitiva • 100% na Nuvem</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.15]">
          A Infraestrutura Completa para o seu Negócio de{' '}
          <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Beleza, Estética & Bem-Estar
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Um ecossistema inteligente que une agendamento, <strong className="text-slate-900 font-bold">WhatsApp automático</strong>, frente de caixa PDV, fichas técnicas e repasse de comissões com fluxos sob medida para cada segmento.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            to="/cadastro"
            className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-black text-base shadow-xl shadow-pink-600/30 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:scale-95"
          >
            <Sparkles className="w-5 h-5 text-amber-300 fill-current" />
            <span>Começar Agora Grátis</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            to="/contato"
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-sm border border-slate-300 shadow-xs flex items-center justify-center gap-2 transition-all hover:border-slate-400"
          >
            <MessageSquare className="w-4 h-4 text-slate-600" />
            <span>Fale Conosco / Suporte</span>
          </Link>
        </div>

        {/* Micro-copy de Confiança */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 pt-4 text-xs font-bold text-slate-600">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Sem taxa de adesão</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Sem precisar de cartão de crédito</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Ativação Imediata</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>100% Web no Celular e PC</span>
          </div>
        </div>
      </section>

      {/* 🚀 2. HUB DE SOLUÇÕES POR SEGMENTO */}
      <section id="segmentos" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest text-pink-600">Soluções Especializadas</span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Escolha a Solução Ideal para o seu Segmento
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Cada nicho possui necessidades únicas. Conheça as páginas e recursos dedicados criados para o seu tipo de negócio:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {segments.map((seg) => (
            <div
              key={seg.id}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-6 group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{seg.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {seg.badge}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-pink-600 transition-colors">
                    {seg.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {seg.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  {seg.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <Link
                  to={seg.path}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 font-black text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Conhecer Solução</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🚀 3. INFRAESTRUTURA UNIFICADA COMPARTILHADA */}
      <section id="infraestrutura" className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-purple-600">Tecnologia de Ponta</span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
              O que Todas as Nossas Soluções Entregam
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Pilares robustos que funcionam de ponta a ponta, sem complexidade e sem instalações pesadas:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">
                💬
              </div>
              <h3 className="text-base font-black text-slate-900">Robô WhatsApp Integrado</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Confirmações em tempo real, lembrete automático 24h e 2h antes com botão de confirmação, mensagens de feliz aniversário e fidelidade.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl">
                💰
              </div>
              <h3 className="text-base font-black text-slate-900">Frente de Caixa & PDV Dinâmico</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Abertura, suprimento, sangria e fechamento de caixa diário. Geração de QR Code PIX dinâmico com recebimento imediato e sem erro manual.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl">
                📊
              </div>
              <h3 className="text-base font-black text-slate-900">Repasse de Comissões Transparente</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Configure porcentagens individuais por colaborador, deduza custos de produtos e quite os pagamentos com lançamento contábil em 1 clique.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl">
                ⚡
              </div>
              <h3 className="text-base font-black text-slate-900">100% Web (Celular, Tablet e PC)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sem downloads e sem travar seu computador. Acesse de qualquer lugar com sincronização em tempo real e interface responsiva.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xl">
                🎁
              </div>
              <h3 className="text-base font-black text-slate-900">Programa Fidelidade Automático</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seus clientes acumulam pontos a cada real gasto e resgatam descontos em serviços pré-configurados para aumentar a retenção.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xl">
                🛡️
              </div>
              <h3 className="text-base font-black text-slate-900">Backups Automáticos & LGPD</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Rotinas diárias automáticas de backup, isolamento estrito entre salões e criptografia de ponta a ponta. Seus dados nunca são compartilhados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 💰 4. TABELA DE PREÇOS */}
      <section id="planos" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest text-pink-600">Planos Transparentes</span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950">Planos Feitos para o Seu Tamanho</h2>
          <p className="text-xs sm:text-sm text-slate-600">Comece 100% grátis e faça upgrade apenas quando sua equipe crescer.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {/* 1. SOLO / AUTÔNOMA */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="space-y-4">
              <div className="text-xs font-black uppercase tracking-wider text-slate-500">Solo / Autônoma</div>
              <div>
                <div className="text-3xl font-black text-slate-900">
                  R$ 0,00 <span className="text-xs font-normal text-slate-500">/mês</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Degustação sem cartão</div>
              </div>
              <div className="text-xs text-slate-700 bg-slate-100 p-2.5 rounded-xl font-bold">
                ✓ 1 Profissional • até 40 agendamentos/mês
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Manicure / Lash Solo</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Agenda simples</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Cadastro de Clientes CRM</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Comissão fixa 100% autônoma</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Frente de Caixa Balcão</li>
              </ul>
            </div>
            <Link
              to="/cadastro"
              className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-xs text-center transition-all"
            >
              Começar Grátis
            </Link>
          </div>

          {/* 2. STARTER */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between hover:border-indigo-300 transition-all">
            <div className="space-y-4">
              <div className="text-xs font-black uppercase tracking-wider text-indigo-600">Starter</div>
              <div>
                <div className="text-3xl font-black text-slate-900">
                  R$ 69,90 <span className="text-xs font-normal text-slate-500">/mês</span>
                </div>
                <div className="text-[11px] text-emerald-600 font-bold mt-0.5">Agendamentos Ilimitados</div>
              </div>
              <div className="text-xs text-indigo-700 bg-indigo-50 p-2.5 rounded-xl font-bold border border-indigo-200">
                ✓ Até 2 Profissionais Inclusos
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> 2 Profissionais / Cadeiras</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Agendamentos Ilimitados</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Caixa Diário & PDV Balcão</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Histórico & Anamnese Técnica</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Lembretes automáticos</li>
              </ul>
            </div>
            <Link
              to="/cadastro"
              className="w-full py-3.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-xs text-center border border-indigo-200 transition-all"
            >
              Assinar Starter
            </Link>
          </div>

          {/* 3. STUDIO PRO (DESTAQUE) */}
          <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 border-2 border-pink-500 shadow-2xl space-y-6 flex flex-col justify-between relative transform lg:-translate-y-2">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-black uppercase px-3.5 py-1 rounded-full shadow-md whitespace-nowrap">
              ⭐ Mais Escolhido por Salões
            </div>
            <div className="space-y-4 pt-2">
              <div className="text-xs font-black uppercase tracking-wider text-pink-400">Studio Pro</div>
              <div>
                <div className="text-3xl sm:text-4xl font-black text-white">
                  R$ 139,90 <span className="text-xs font-normal text-slate-400">/mês</span>
                </div>
                <div className="text-[11px] text-pink-300 font-bold mt-0.5">Sem Taxa de Adesão</div>
              </div>
              <div className="text-xs text-pink-300 font-bold bg-pink-950/80 p-2.5 rounded-xl border border-pink-800">
                ✓ Até 5 Profissionais (+ R$ 15/extra)
              </div>
              <ul className="space-y-2 text-xs text-slate-200">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-pink-400 shrink-0" /> <strong>Comissões Sem Planilha</strong> (Lei Salão Parceiro)</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-pink-400 shrink-0" /> <strong>Comandas Multisserviços</strong> (Express)</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-pink-400 shrink-0" /> Agendas individuais por cadeira</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-pink-400 shrink-0" /> WhatsApp Automático (24h e 2h)</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-pink-400 shrink-0" /> Estoque de bancada vs revenda</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-pink-400 shrink-0" /> Backup Nuvem Google Drive</li>
              </ul>
            </div>
            <Link
              to="/cadastro"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 text-white font-black text-xs sm:text-sm text-center shadow-xl hover:opacity-95 transition-all"
            >
              Assinar Studio Pro
            </Link>
          </div>

          {/* 4. PREMIER EXPRESS / REDES */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between hover:border-purple-300 transition-all">
            <div className="space-y-4">
              <div className="text-xs font-black uppercase tracking-wider text-purple-600">Premier Express</div>
              <div>
                <div className="text-3xl font-black text-slate-900">
                  R$ 229,90 <span className="text-xs font-normal text-slate-500">/mês</span>
                </div>
                <div className="text-[11px] text-purple-600 font-bold mt-0.5">Para Redes e Grandes Espaços</div>
              </div>
              <div className="text-xs text-purple-700 bg-purple-50 p-2.5 rounded-xl font-bold border border-purple-200">
                ✓ Até 15 Profissionais (+ R$ 15/extra)
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600 shrink-0" /> <strong>CRM Reativação de Clientes</strong></li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Multi-agenda de alto fluxo</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Relatórios de Produtividade DRE</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Múltiplas filiais e unidades</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Treinamento VIP com especialista</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Suporte Prioritário 24/7</li>
              </ul>
            </div>
            <Link
              to="/cadastro"
              className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs text-center shadow-md transition-all"
            >
              Assinar Premier
            </Link>
          </div>
        </div>
      </section>

      {/* ❓ 5. FAQ INTERATIVO */}
      <section id="faq" className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-pink-600">Tire Suas Dúvidas</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Perguntas Frequentes</h2>
        </div>

        <div className="space-y-3">
          {[
            { q: 'O sistema serve para mais de um tipo de negócio?', a: 'Sim! A plataforma possui fluxos e recursos especializados para Salões de Beleza, Barbearias, Clínicas de Estética, Esmalterias e Lash Designers, permitindo que cada espaço utilize sua própria configuração.' },
            { q: 'Preciso instalar algum programa ou app pesado?', a: 'Não! O BelaGestão Studio é 100% web na nuvem. Você pode acessar diretamente pelo navegador do celular, tablet ou computador.' },
            { q: 'Como funciona o envio de mensagens no WhatsApp?', a: 'Você conecta o WhatsApp do seu espaço lendo um QR Code na tela. A partir daí, o sistema dispara confirmações, lembretes de agendamento 24h e 2h antes e avisos pós-atendimento automaticamente.' },
            { q: 'Posso cancelar a qualquer momento?', a: 'Sim! Sem fidelidade, sem contratos engessados e sem multas rescisórias. Você tem total liberdade.' },
          ].map((faq, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 sm:p-5 text-left font-bold text-xs sm:text-sm flex items-center justify-between gap-4"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-pink-600' : ''}`} />
              </button>
              {openFaq === idx && (
                <div className="px-4 sm:px-5 pb-5 text-xs text-slate-600 border-t border-slate-100 pt-3">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 📄 6. RODAPÉ INSTITUCIONAL & LGPD */}
      <footer className="border-t border-slate-200 bg-white py-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                ✨
              </div>
              <span className="text-sm font-black text-slate-900">BelaGestão Studio</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              A plataforma de gestão definitiva para salões de beleza, barbearias, clínicas de estética, esmalterias e lash designers.
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
                  ✂️ Salão de Beleza & Química
                </Link>
              </li>
              <li>
                <Link to="/sistema-para-barbearia" className="hover:text-pink-600 transition-colors">
                  💈 Barbearia Moderna
                </Link>
              </li>
              <li>
                <Link to="/sistema-para-estetica" className="hover:text-pink-600 transition-colors">
                  ✨ Estética & Spas
                </Link>
              </li>
              <li>
                <Link to="/sistema-para-esmalteria-e-unhas" className="hover:text-pink-600 transition-colors">
                  💅 Esmalterias & Nail Design
                </Link>
              </li>
              <li>
                <Link to="/sistema-para-lash-designer-e-sobrancelhas" className="hover:text-pink-600 transition-colors">
                  👁️ Lash & Sobrancelhas
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
              Atendimento humanizado para tirar dúvidas e prestar suporte completo ao seu negócio.
            </p>
            <div className="pt-3">
              <Link
                to="/contato"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-pink-50 border border-pink-200 text-pink-700 font-bold hover:bg-pink-100 text-xs transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Abrir Chamado / Fale Conosco</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100 mt-8 pt-6">
          <DynamicCpfFooter />
        </div>
      </footer>

      {/* 📌 Floating CTA */}
      {showFloatingCta && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-8 z-50 animate-fadeIn">
          <div className="bg-slate-950/95 backdrop-blur-md text-white p-3 sm:px-6 sm:py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-4">
            <div className="hidden sm:block">
              <div className="text-xs font-black text-white">BelaGestão Studio Platform</div>
              <div className="text-[10px] text-pink-400 font-bold">Plano Solo 100% Grátis • Sem Cartão</div>
            </div>
            <Link
              to="/cadastro"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xs shadow-md flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Criar Conta Grátis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
