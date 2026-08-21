import React from 'react';
import { 
  Lock, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Crown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRequiredPlanForModule } from '../lib/permissions';

const MODULE_DETAILS = {
  financial: {
    title: 'Módulo Financeiro Completo & DRE Gerencial',
    subtitle: 'Controle de contas a pagar, fluxo de caixa projetado, margem de contribuição e lucratividade real.',
    badge: 'Disponível no Studio Pro',
    features: [
      'DRE Simplificado & Gerencial em tempo real',
      'Contas a pagar e a receber com baixa automática',
      'Faturamento discriminado por categoria e forma de pagamento',
      'Ranking de serviços e lucratividade líquida',
      'Exportação contábil para relatórios e fechamentos'
    ]
  },
  professionals: {
    title: 'Gestão de Equipe & Comissões sem Planilha',
    subtitle: 'Cálculo automatizado do repasse a colaboradores em total conformidade com a Lei do Salão Parceiro.',
    badge: 'Disponível no Studio Pro',
    features: [
      'Até 5 ou 15 profissionais inclusos na mesma conta',
      'Comissões personalizadas por serviço ou taxa fixa',
      'Dedução automática de custo de produtos consumidos',
      'Fechamento e quitação de repasses em 1 clique',
      'Controle individual de permissões e acessos da equipe'
    ]
  },
  whatsapp: {
    title: 'Robô de WhatsApp Automático & Notificações 24/7',
    subtitle: 'Lembretes inteligentes 24h e 2h antes, confirmações de horário e redução de até 80% do não comparecimento.',
    badge: 'Disponível no Studio Pro',
    features: [
      'Conexão nativa via QR Code em segundo plano',
      'Disparo automático 24h e 2h antes do atendimento',
      'Mensagens de aniversário e pós-venda personalizadas',
      'Envio de comprovantes e extratos de comissão',
      'Zero custo por mensagem enviada (sem taxas extras)'
    ]
  },
  backup: {
    title: 'Backup Automático em Nuvem & Google Drive',
    subtitle: 'Proteja o histórico de atendimentos, dados de clientes e caixa com rotinas diárias e cópias de segurança.',
    badge: 'Disponível no Studio Pro',
    features: [
      'Sincronização diária automática com o Google Drive',
      'Isolamento estrito dos dados e conformidade com a LGPD',
      'Restauração de dados com 1 clique em caso de troca de máquina',
      'Download seguro de snapshots compactados',
      'Proteção contra panes físicas ou perda de arquivos'
    ]
  }
};

export default function PlanRestrictedView({ moduleId, onNavigateTab }) {
  const { user } = useAuth();
  const info = MODULE_DETAILS[moduleId] || {
    title: 'Recurso Exclusivo para Planos Superiores',
    subtitle: 'Faça upgrade da sua assinatura para desbloquear esta funcionalidade no seu salão.',
    badge: 'Requer Upgrade de Plano',
    features: [
      'Acesso completo a todas as ferramentas de gestão avançada',
      'Multi-agenda, comissões automáticas e WhatsApp 24/7',
      'Relatórios de desempenho e lucratividade'
    ]
  };

  const planReq = getRequiredPlanForModule(moduleId);
  const targetPlanName = planReq?.minPlanName || 'Studio Pro';
  const targetPlanPrice = planReq?.price || 'R$ 139,90/mês';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-pink-500/30 dark:border-pink-500/20 shadow-2xl overflow-hidden">
        
        {/* Banner Superior com Gradiente */}
        <div className="bg-gradient-to-r from-slate-950 via-purple-950 to-pink-950 p-6 sm:p-8 text-white relative">
          <div className="absolute top-4 right-4 bg-pink-500/20 border border-pink-400/30 text-pink-300 text-[11px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>{info.badge}</span>
          </div>

          <div className="max-w-xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-pink-300 text-xs font-bold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Plano Atual: <strong className="text-white uppercase">{user?.plan || 'SOLO'}</strong></span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {info.title}
            </h2>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {info.subtitle}
            </p>
          </div>
        </div>

        {/* Conteúdo com Benefícios e Call to Action */}
        <div className="p-6 sm:p-8 space-y-8">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
              <Crown className="w-4 h-4 text-pink-600" />
              O que você ganha ao ativar o Plano {targetPlanName}:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {info.features.map((feat, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card de CTA para tela de Assinatura */}
          <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-slate-800 dark:via-purple-950/40 dark:to-slate-800 p-6 rounded-3xl border border-pink-200 dark:border-pink-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="text-xs font-black text-pink-600 dark:text-pink-400 uppercase tracking-wider">
                Upgrade Instantâneo com Ativação Imediata
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                Plano {targetPlanName} por apenas <span className="text-pink-600 dark:text-pink-400">{targetPlanPrice}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pague via PIX transparente ou cartão. Cancele ou altere seu plano quando quiser sem fidelidade.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('subscription')}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-black text-xs sm:text-sm shadow-xl shadow-pink-600/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-current" />
              <span>Ver Planos & Fazer Upgrade</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}