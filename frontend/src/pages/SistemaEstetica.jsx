import React from 'react';
import { Sparkles, CheckCircle2, ArrowRight, Heart, ShieldCheck, Crown, MessageSquare } from 'lucide-react';
import { Link } from '../components/Link';

export default function SistemaEstetica() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-pink-600 selection:text-white pb-20">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-pink-500/20">
              🌸
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-white">
                BellaGestão<span className="text-pink-400 font-bold">Estética</span>
              </span>
              <div className="text-[10px] text-pink-400 font-semibold uppercase tracking-wider">
                Para Estética & Esmalterias
              </div>
            </div>
          </Link>

          <Link
            to="/cadastro"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs font-black shadow-lg shadow-pink-500/20 transition-all"
          >
            Criar Conta Grátis
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-950/80 border border-pink-700/50 text-pink-300 text-xs font-black uppercase tracking-wider">
            <Crown className="w-4 h-4 text-pink-400" />
            <span>Ficha de Anamnese Especializada para Depilação, Nails & Pele</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
            O Software Especializado em{' '}
            <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 bg-clip-text text-transparent">
              Estética & Esmalterias
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Controle de restrições a monômeros em unhas de gel, fototipos de pele para depilação com cera ou laser e programa de fidelidade por pontos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/cadastro"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-700 hover:from-pink-700 hover:to-purple-800 text-white font-black text-sm shadow-xl shadow-pink-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300 fill-current" />
              <span>Experimentar Grátis (2 Usuárias)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Pilares Específicos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-pink-950/60 border border-pink-800 text-pink-400 flex items-center justify-center">
              <Crown className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Anamnese de Nails & Unhas em Gel</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Registre formato preferido (Stiletto, Bailarina, Almond), alergias a produtos químicos e tempo de manutenção.
            </p>
          </div>

          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-800 text-purple-400 flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Anamnese de Depilação & Pele</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fototipo da pele, histórico de foliculite, sensibilidade térmica e método preferido (cera quente, roll-on ou laser).
            </p>
          </div>

          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Programa de Fidelidade 100% Automático</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gera 1 ponto a cada R$ 10 gastos. O cliente acumula e resgata em procedimentos, incentivando a recorrência mensal.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
