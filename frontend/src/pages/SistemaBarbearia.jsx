import React from 'react';
import { Sparkles, CheckCircle2, ArrowRight, Zap, Flame, DollarSign, MessageSquare } from 'lucide-react';
import { Link } from '../components/Link';

export default function SistemaBarbearia() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-amber-500 selection:text-slate-950 pb-20">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20">
              💈
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-white">
                BelaGestão<span className="text-amber-400 font-bold">Barber</span>
              </span>
              <div className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                Para Barbearias Modernas
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
              to="/cadastro?segment=barbearia"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              Criar Conta Grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/80 border border-amber-600/50 text-amber-300 text-xs font-black uppercase tracking-wider">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Foco em Velocidade, Fila de Atendimento & Comissões</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
            O Sistema Definitivo para sua{' '}
            <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent">
              Barbearia
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Frente de caixa rápida com QR Code PIX dinâmico na tela, terminal de troca rápida por PIN de 4 dígitos e disparo de WhatsApp de retorno automático.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/cadastro?segment=barbearia"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-400/30 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>Começar Grátis (2 Barbeiros)</span>
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

        {/* Diferenciais da Barbearia */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-4 hover:border-amber-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-950/60 border border-amber-800 text-amber-400 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Troca Rápida de Barbeiro por PIN</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No tablet ou computador da bancada, cada barbeiro digita seu PIN de 4 dígitos em 1 segundo para lançar o corte sem precisar deslogar.
            </p>
          </div>

          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-4 hover:border-amber-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">PIX Imediato no Balcão</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gera o QR Code do valor exato na hora. O cliente aponta o celular e o sistema já baixa a comanda e alimenta o caixa diário.
            </p>
          </div>

          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-4 hover:border-amber-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-800 text-cyan-400 flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Aviso de Retorno de 15/30 dias</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Lembrete automático para o cliente que cortou há 20 dias: "O degradê já cresceu? Venha dar um trato no visual!"
            </p>
          </div>
        </div>

        {/* Rodapé do Segmento */}
        <footer className="pt-12 border-t border-slate-800/80 text-center text-xs text-slate-500 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400">
            <Link to="/" className="hover:text-amber-400">Todos os Segmentos</Link>
            <Link to="/sistema-para-salao-de-beleza" className="hover:text-amber-400">Salões de Beleza</Link>
            <Link to="/sistema-para-estetica" className="hover:text-amber-400">Clínicas de Estética</Link>
            <Link to="/sistema-para-esmalteria-e-unhas" className="hover:text-amber-400">Esmalterias & Unhas</Link>
            <Link to="/sistema-para-lash-designer-e-sobrancelhas" className="hover:text-amber-400">Lash & Sobrancelhas</Link>
            <Link to="/contato" className="text-amber-400 font-bold hover:underline">Fale Conosco</Link>
          </div>
          <p>© {new Date().getFullYear()} BelaGestão Studio. Plataforma em conformidade com a LGPD.</p>
        </footer>
      </main>
    </div>
  );
}
