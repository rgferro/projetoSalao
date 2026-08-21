import React from 'react';
import { Sparkles, CheckCircle2, ArrowRight, Scissors, Palette, MessageSquare, BarChart3, ShieldCheck, Heart, Crown, Check, Eye } from 'lucide-react';
import { Link } from '../components/Link';

export default function SistemaLash() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-600 selection:text-white pb-20">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-rose-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">
              👁️
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-white">
                BelaGestão<span className="text-indigo-400 font-bold">Lash</span>
              </span>
              <div className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
                Lash Designers & Sobrancelhas
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
              to="/cadastro?segment=lash"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-700 hover:to-rose-700 text-white text-xs font-black shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              Criar Conta Grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-black uppercase tracking-wider">
            <Eye className="w-4 h-4 text-indigo-400" />
            <span>Extensão de Cílios, Brow Lamination & Micropigmentação</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
            O Sistema Especializado em{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-rose-400 bg-clip-text text-transparent">
              Lash & Design de Olhar
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Ficha de mapping de curvaturas (C, D, L, M), controle de espessuras, teste alérgico e alertas de manutenção preventiva no WhatsApp.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/cadastro?segment=lash"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:opacity-95 text-white font-black text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
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
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-4 hover:border-indigo-800/60 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-800 text-indigo-400 flex items-center justify-center">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Mapping & Registro Técnico</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Guarde o mapping completo da cliente (ex: Fio a Fio 8-12mm Curvatura D, cola utilizada e tempo de secagem) direto no cadastro.
            </p>
          </div>

          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-4 hover:border-indigo-800/60 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-400 flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Retorno Preventivo no WhatsApp</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Lembretes automáticos enviados antes dos 15 ou 21 dias para que a cliente agende a manutenção e garanta o preenchimento perfeito.
            </p>
          </div>

          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-4 hover:border-indigo-800/60 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Lucro Real por Procedimento</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Acompanhe seu faturamento líquido descontando custos de adesivos, fios tecnológicos e materiais descartáveis.
            </p>
          </div>
        </div>

        {/* Rodapé do Segmento */}
        <footer className="pt-12 border-t border-slate-800/80 text-center text-xs text-slate-500 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400">
            <Link to="/" className="hover:text-indigo-400">Todos os Segmentos</Link>
            <Link to="/sistema-para-salao-de-beleza" className="hover:text-indigo-400">Salões de Beleza</Link>
            <Link to="/sistema-para-barbearia" className="hover:text-indigo-400">Barbearias</Link>
            <Link to="/sistema-para-estetica" className="hover:text-indigo-400">Clínicas de Estética</Link>
            <Link to="/sistema-para-esmalteria-e-unhas" className="hover:text-indigo-400">Esmalterias & Unhas</Link>
            <Link to="/contato" className="text-indigo-400 font-bold hover:underline">Fale Conosco</Link>
          </div>
          <p>© {new Date().getFullYear()} BelaGestão Studio. Plataforma em conformidade com a LGPD.</p>
        </footer>
      </main>
    </div>
  );
}
