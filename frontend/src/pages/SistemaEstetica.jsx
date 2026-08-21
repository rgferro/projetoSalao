import React from 'react';
import { Sparkles, CheckCircle2, ArrowRight, Heart, Sparkle, ShieldCheck, MessageSquare, BarChart3, FileText } from 'lucide-react';
import { Link } from '../components/Link';

export default function SistemaEstetica() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-500 selection:text-slate-950 pb-20">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20">
              ✨
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-white">
                BelaGestão<span className="text-emerald-400 font-bold">Estética</span>
              </span>
              <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                Clínicas & Spas
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
              to="/cadastro?segment=estetica"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              Criar Conta Grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-xs font-black uppercase tracking-wider">
            <Heart className="w-4 h-4 text-emerald-400" />
            <span>Fichas de Anamnese, Protocolos Faciais & Pacotes de Sessões</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
            A Gestão Médica & Estética{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              Mais Confiável do Brasil
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Controle de pacotes (ex: 10 sessões de drenagem), anamnese com histórico de alergias e termos de consentimento, integrado ao WhatsApp.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/cadastro?segment=estetica"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 fill-current" />
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
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-4 hover:border-emerald-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Anamnese Completa & Alergias</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Formulário digital de avaliação facial e corporal, registro de ácidos, contraindicações e histórico fotográfico de evolução.
            </p>
          </div>

          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-4 hover:border-emerald-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-teal-950/60 border border-teal-800 text-teal-400 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Controle de Pacotes & Sessões</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Venda pacotes fechados (ex: 5 sessões de Peeling) e dê baixa individual a cada visita com controle do saldo restante.
            </p>
          </div>

          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-4 hover:border-emerald-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-800 text-cyan-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Segurança em Conformidade LGPD</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dados sensíveis de saúde criptografados e acessíveis apenas por profissionais autorizados com controle por nível de acesso.
            </p>
          </div>
        </div>

        {/* Rodapé do Segmento */}
        <footer className="pt-12 border-t border-slate-800/80 text-center text-xs text-slate-500 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400">
            <Link to="/" className="hover:text-emerald-400">Todos os Segmentos</Link>
            <Link to="/sistema-para-salao-de-beleza" className="hover:text-emerald-400">Salões de Beleza</Link>
            <Link to="/sistema-para-barbearia" className="hover:text-emerald-400">Barbearias</Link>
            <Link to="/sistema-para-esmalteria-e-unhas" className="hover:text-emerald-400">Esmalterias & Unhas</Link>
            <Link to="/sistema-para-lash-designer-e-sobrancelhas" className="hover:text-emerald-400">Lash & Sobrancelhas</Link>
            <Link to="/contato" className="text-emerald-400 font-bold hover:underline">Fale Conosco</Link>
          </div>
          <p>© {new Date().getFullYear()} BelaGestão Studio. Plataforma em conformidade com a LGPD.</p>
        </footer>
      </main>
    </div>
  );
}
