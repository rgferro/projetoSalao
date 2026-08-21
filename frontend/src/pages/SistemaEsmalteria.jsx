import React from 'react';
import { Sparkles, CheckCircle2, ArrowRight, Scissors, Palette, MessageSquare, BarChart3, ShieldCheck, Heart, Crown, Check, ChevronRight } from 'lucide-react';
import { Link } from '../components/Link';

export default function SistemaEsmalteria() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-purple-600 selection:text-white pb-20">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-purple-500/20">
              💅
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-white">
                BelaGestão<span className="text-purple-400 font-bold">Nails</span>
              </span>
              <div className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider">
                Esmalterias & Nail Designers
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:inline-flex px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition"
            >
              Entrar
            </Link>
            <Link
              to="/cadastro?segment=esmalteria"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-black shadow-lg shadow-purple-600/30 transition-all active:scale-95"
            >
              Criar Conta Grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/80 border border-purple-700/50 text-purple-300 text-xs font-black uppercase tracking-wider">
            <Crown className="w-4 h-4 text-purple-400" />
            <span>Software Especializado em Alongamento, Manutenção & Esmaltação</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
            O Sistema Definitivo para sua{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-300 bg-clip-text text-transparent">
              Esmalteria & Studio de Unhas
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Controle de retornos e manutenções de gel/fibra, lembretes automáticos no WhatsApp e cálculo transparente de comissões por mesa e procedimento.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/cadastro?segment=esmalteria"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 text-white font-black text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300 fill-current" />
              <span>Começar Agora Grátis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/contato"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-sm font-bold border border-slate-800 flex items-center justify-center gap-2 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Fale Conosco / Suporte</span>
            </Link>
          </div>
        </div>

        {/* Recursos Específicos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-4 hover:border-purple-800/60 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-800 text-purple-400 flex items-center justify-center">
              <Crown className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Controle de Retorno e Manutenções</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              O sistema avisa automaticamente a cliente no WhatsApp quando faltam 3 dias para os 20 dias de manutenção do gel ou fibra de vidro.
            </p>
          </div>

          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-4 hover:border-purple-800/60 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-pink-950/60 border border-pink-800 text-pink-400 flex items-center justify-center">
              <Palette className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Múltiplas Mesas em Paralelo</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Visualize na mesma tela as agendas de todas as manicures, nail designers e podólogas em colunas inteligentes sem sobreposição.
            </p>
          </div>

          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-4 hover:border-purple-800/60 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Repasse de Comissões e Custos</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Configure porcentagens individuais (ex: 60% manicure / 40% salão) com dedução opcional do custo de produtos e lixas especiais.
            </p>
          </div>
        </div>

        {/* Rodapé do Segmento */}
        <footer className="pt-12 border-t border-slate-800/80 text-center text-xs text-slate-500 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400">
            <Link to="/" className="hover:text-purple-400">Todos os Segmentos</Link>
            <Link to="/sistema-para-salao-de-beleza" className="hover:text-purple-400">Salões de Beleza</Link>
            <Link to="/sistema-para-barbearia" className="hover:text-purple-400">Barbearias</Link>
            <Link to="/sistema-para-estetica" className="hover:text-purple-400">Clínicas de Estética</Link>
            <Link to="/sistema-para-lash-designer-e-sobrancelhas" className="hover:text-purple-400">Lash & Sobrancelhas</Link>
            <Link to="/contato" className="text-purple-400 font-bold hover:underline">Fale Conosco</Link>
          </div>
          <p>© {new Date().getFullYear()} BelaGestão Studio. Plataforma em conformidade com a LGPD.</p>
        </footer>
      </main>
    </div>
  );
}
