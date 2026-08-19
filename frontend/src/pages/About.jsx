import React from 'react';
import { ShieldCheck, Heart, Sparkles, Zap, ArrowLeft, Users, CheckCircle2, Lock } from 'lucide-react';
import { Link } from '../components/Link';

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-pink-600 selection:text-white pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-pink-500/20">
              ✂️
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-950">
                BelaGestão<span className="text-pink-600 font-bold">Studio</span>
              </span>
              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Sobre Nós
              </div>
            </div>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Início</span>
          </Link>
        </div>
      </header>

      {/* Conteúdo Institucional */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-pink-600" />
            <span>Nossa História e Missão</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
            Tecnologia de Ponta Feita para o Mercado da Beleza
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            O BelaGestão Studio nasceu com um propósito claro: libertar profissionais da beleza e proprietários de salão do caos de cadernos e planilhas confusas.
          </p>
        </div>

        {/* Pilares */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Foco na Experiência</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Desenvolvido ouvindo cabeleireiras, manicures, esteticistas e gestores, com telas intuitivas que qualquer membro da equipe domina em minutos.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Resiliência e Segurança</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Arquitetura com transações atômicas ACID, período de carência offline e backups criptografados automáticos com integridade SHA-256.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Automação Inteligente</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Disparos automáticos e silenciosos no WhatsApp dos seus clientes para lembretes, boas-vindas e fidelidade sem custo por mensagem.
            </p>
          </div>
        </div>

        {/* Nossa Filosofia */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xl font-black text-slate-900">Por que Salões Escolhem o BelaGestão?</h2>
          <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              Salões de beleza e clínicas de estética possuem particularidades que sistemas genéricos de comércio não entendem: comissões diferenciadas por serviço, fichas de anamnese capilar com fórmulas químicas de coloração, multisserviços na mesma comanda e cálculo dinâmico de tempo de atendimento.
            </p>
            <p>
              O <strong>BelaGestão Studio</strong> foi concebido de raiz para abraçar essa realidade. Cada funcionalidade foi polida para trazer lucro real, agilidade no balcão e fidelização dos clientes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-xs font-bold text-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sem fidelidade obrigatória ou taxas ocultas</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Conformidade rigorosa com a LGPD</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Pagamentos diretos via PIX e Cartão Mercado Pago</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Suporte humanizado em português</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-700 text-white p-8 rounded-3xl text-center space-y-4 shadow-xl">
          <h3 className="text-2xl font-black">Pronta(o) para transformar a gestão do seu salão?</h3>
          <p className="text-xs sm:text-sm text-pink-100 max-w-lg mx-auto">
            Crie sua conta agora mesmo no plano Starter 100% gratuito para até 2 usuários sem precisar de cartão de crédito.
          </p>
          <div className="pt-2">
            <Link
              to="/cadastro"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-black text-sm shadow-xl transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-pink-600" />
              <span>Criar Conta Grátis</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
