import React from 'react';
import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react';
import { Link } from '../components/Link';

export default function Terms() {
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
                Termos de Uso
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

      {/* Conteúdo */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 space-y-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/60 text-slate-700 text-xs font-bold">
            <FileText className="w-3.5 h-3.5" />
            <span>Última atualização: Agosto de 2026</span>
          </div>
          <h1 className="text-3xl font-black text-slate-950">Termos e Condições de Uso</h1>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-slate-900">1. Objeto e Aceitação</h2>
            <p>
              Ao criar uma conta ou utilizar o <strong>BelaGestão Studio</strong>, você concorda expressamente com estes Termos de Uso. Esta plataforma destina-se ao gerenciamento operacional, financeiro, agendamento de atendimentos e automação de salões de beleza, clínicas de estética, esmalterias e barbearias.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-slate-900">2. Planos, Assinaturas e Pagamentos</h2>
            <p>
              O sistema opera em modalidades de assinatura com cobrança direta mensal transparente através do Mercado Pago.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Plano Starter:</strong> Gratuito para até 2 usuários da equipe.</li>
              <li><strong>Plano Pro Studio:</strong> R$ 69,90/mês para até 5 profissionais com WhatsApp e relatórios avançados.</li>
              <li><strong>Plano Elite Master:</strong> R$ 129,90/mês para redes e salões de alto fluxo com até 15 profissionais.</li>
            </ul>
            <p>
              O cancelamento pode ser efetuado a qualquer momento no painel de assinaturas, sem multas rescisórias ou fidelidade.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-slate-900">3. Período de Carência Offline e Resiliência</h2>
            <p>
              Em respeito à operação ininterrupta do seu salão, implementamos períodos de carência de segurança para que instabilidades pontuais na rede ou operadoras de cartão não bloqueiem imediatamente o atendimento aos seus clientes ou o fluxo do caixa diário.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-slate-900">4. Responsabilidade pelos Dados e Anamneses</h2>
            <p>
              O salão contratante é o controlador dos dados pessoais e registros de anamnese capilar/estética inseridos na plataforma, competindo-lhe coletar o devido consentimento de seus clientes em conformidade com a legislação aplicável.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-slate-900">5. Backups e Cópia de Segurança</h2>
            <p>
              A plataforma disponibiliza ferramentas automáticas e manuais para geração de backups locais compactados e sincronização com nuvem (Google Drive), garantindo portabilidade total dos dados.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
