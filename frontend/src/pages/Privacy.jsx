import React from 'react';
import { ArrowLeft, ShieldCheck, Lock, Eye } from 'lucide-react';
import { Link } from '../components/Link';

export default function Privacy() {
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
                Privacidade & LGPD
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</span>
          </div>
          <h1 className="text-3xl font-black text-slate-950">Política de Privacidade</h1>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-slate-900">1. Coleta e Finalidade dos Dados</h2>
            <p>
              O <strong>BelaGestão Studio</strong> coleta apenas as informações estritamente necessárias para a prestação de serviços de gestão, emissão de comprovantes, agendamento de horários e comunicação via WhatsApp e e-mail:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Dados do Salão / Titular:</strong> Nome, Razão Social, CPF/CNPJ, E-mail, Telefone e Endereço comercial.</li>
              <li><strong>Dados de Clientes e CRM:</strong> Nome, WhatsApp, Data de nascimento (para ações de aniversariantes) e Histórico de atendimentos.</li>
              <li><strong>Ficha de Anamnese Técnica:</strong> Tipo de cabelo, fórmulas de coloração química, preferências de unhas, sensibilidades e alergias cutâneas para segurança do procedimento.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-slate-900">2. Segurança e Criptografia</h2>
            <p>
              Adotamos os mais rigorosos padrões DevSecOps: senhas armazenadas com hash PBKDF2 com Salt criptográfico individual, sessões autenticadas via JWT com assinatura HMAC SHA-256 e proteção nativa contra injeções SQL e XSS.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-slate-900">3. Não Compartilhamento com Terceiros</h2>
            <p>
              Seus dados, cadastros de clientes e faturamento <strong>nunca são vendidos, alugados ou compartilhados</strong> com empresas de publicidade terceiras. As integrações externas (Mercado Pago para pagamentos e Brevo para e-mails de serviço) processam apenas os dados estritamente necessários para a conclusão das transações solicitadas pelo usuário.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-slate-900">4. Direitos do Titular (LGPD Art. 18)</h2>
            <p>
              O titular pode solicitar confirmação, correção, exportação em arquivo portátil ou exclusão definitiva dos dados. Para exercer seus direitos, envie uma solicitação para <strong>contato@belagestaostudio.com.br</strong> com o assunto “LGPD — Exportação” ou “LGPD — Exclusão”.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-slate-900">5. Encarregado de Dados (DPO)</h2>
            <p>O Encarregado de Dados do BelaGestão Studio é o time de Privacidade BelaGestão Studio. Canal direto: <strong>contato@belagestaostudio.com.br</strong>, assunto “LGPD”.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
