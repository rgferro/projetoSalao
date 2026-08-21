import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Check,
  CreditCard,
  QrCode,
  ShieldCheck,
  Clock,
  ArrowRight,
  AlertCircle,
  Copy,
  CheckCircle2,
  Zap,
  Users,
  ShieldAlert,
  Crown,
  Plus,
  Minus,
  Scissors,
  DollarSign,
  RefreshCw,
  Eye,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Subscription() {
  const { user } = useAuth();
  const [subStatus, setSubStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const billingCycle = 'monthly';
  const [extraSeats, setExtraSeats] = useState(0);

  // Modal PIX
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixData, setPixData] = useState(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [simulatingApproval, setSimulatingApproval] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState('');

  // Histórico de Pagamentos & Validação em Tempo Real
  const [payments, setPayments] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [validatingPaymentId, setValidatingPaymentId] = useState(null);
  const [validationAlert, setValidationAlert] = useState(null);

  const loadSubscriptionStatus = async () => {
    try {
      const res = await fetch('/api/subscription/status', {
        headers: { Authorization: `Bearer ${localStorage.getItem('bella_token') || ''}` },
      });
      const data = await res.json();
      setSubStatus(data);
      if (data.extraUsers) setExtraSeats(data.extraUsers);
    } catch (e) {
      console.warn('Erro ao carregar status:', e);
    }
  };

  const loadPaymentHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch('/api/subscription/payments', {
        headers: { Authorization: `Bearer ${localStorage.getItem('bella_token') || ''}` },
      });
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments || []);
      }
    } catch (e) {
      console.warn('Erro ao carregar histórico:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadSubscriptionStatus();
    loadPaymentHistory();
  }, []);

  const handleValidatePayment = async (paymentId) => {
    try {
      setValidatingPaymentId(paymentId);
      const res = await fetch(`/api/subscription/check-payment/${paymentId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('bella_token') || ''}` },
      });
      const data = await res.json();
      setValidatingPaymentId(null);

      if (data.success) {
        if (data.status === 'approved') {
          setValidationAlert({ type: 'success', message: data.message });
          loadSubscriptionStatus();
        } else {
          setValidationAlert({ type: 'info', message: data.message });
        }
        loadPaymentHistory();
        setTimeout(() => setValidationAlert(null), 5000);
      } else {
        alert(data.error || 'Erro ao validar status do pagamento no Mercado Pago.');
      }
    } catch (err) {
      setValidatingPaymentId(null);
      alert('Erro ao comunicar com o servidor.');
    }
  };

  const handleOpenQrCodeModal = (payment) => {
    setPixData({
      paymentId: payment.payment_id,
      amount: payment.amount,
      plan: payment.plan,
      qrCode: payment.qr_code,
      qrCodeBase64: payment.qr_code_base64,
    });
    setShowPixModal(true);
  };

  const handleGeneratePix = async (planKey) => {
    try {
      setLoading(true);
      const res = await fetch('/api/subscription/pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('bella_token') || ''}`,
        },
        body: JSON.stringify({
          plan: planKey,
          extraUsers: planKey === 'STUDIO' || planKey === 'PREMIER' ? extraSeats : 0,
          billingCycle,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.success) {
        if (data.amount === 0) {
          alert('Plano Solo Gratuito ativado com sucesso!');
          loadSubscriptionStatus();
          return;
        }
        setPixData(data);
        setShowPixModal(true);
      }
    } catch (err) {
      setLoading(false);
      alert('Erro ao gerar PIX do Mercado Pago');
    }
  };

  const handleCopyPix = () => {
    if (pixData?.qrCode) {
      navigator.clipboard.writeText(pixData.qrCode);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 3000);
    }
  };

  const handleSimulateApproval = async () => {
    try {
      setSimulatingApproval(true);
      const res = await fetch('/api/subscription/simulate-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: pixData?.paymentId,
          plan: pixData?.plan || 'STUDIO',
          extraUsers: pixData?.extraUsers || extraSeats,
        }),
      });
      const data = await res.json();
      setSimulatingApproval(false);
      setApprovalMessage(data.message || 'Plano ativado com sucesso!');
      loadSubscriptionStatus();
      setTimeout(() => {
        setShowPixModal(false);
        setApprovalMessage('');
      }, 2000);
    } catch (e) {
      setSimulatingApproval(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-12">
      
      {/* Aviso de Período de Carência (Grace Period / Modo Offline) */}
      {subStatus?.gracePeriodActive && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-300 dark:border-amber-700 rounded-2xl flex items-center justify-between gap-4 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
            <div className="text-xs">
              <div className="font-black text-sm">Modo de Carência Ativo ({subStatus.graceDaysRemaining} dias restantes)</div>
              <p>{subStatus.message}</p>
            </div>
          </div>
          <button
            onClick={() => handleGeneratePix('STUDIO')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl whitespace-nowrap shadow-xs"
          >
            Renovar Agora
          </button>
        </div>
      )}

      {/* Alerta de Isenção Vitalícia / Cortesia Master */}
      {(subStatus?.isExempt || subStatus?.status === 'EXEMPT') && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-pink-500/20 border-2 border-amber-400 dark:border-amber-500/60 flex items-center gap-4 text-amber-950 dark:text-amber-200">
          <div className="p-3 bg-amber-400 text-slate-950 rounded-2xl shrink-0 font-black shadow-md">
            ⭐ VIP
          </div>
          <div>
            <div className="font-black text-sm">Salão com Isenção Vitalícia / Cortesia Master Ativa</div>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              Seu espaço possui acesso completo e irrestrito a todos os módulos, agendamentos ilimitados e suporte sem cobranças de mensalidade.
            </p>
          </div>
        </div>
      )}

      {/* Header & Status Atual */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 dark:bg-pink-950/60 border border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Assinatura do Salão por Capacidade Operacional</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Planos & Capacidade da Equipe
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Cobre de forma justa conforme o tamanho do seu espaço: da profissional autônoma a salões com 15+ colaboradores.
            </p>
          </div>

          {/* Card de Status Resumido */}
          {(() => {
            const isFreeQuotaPlan = subStatus?.plan === 'SOLO' || subStatus?.monthlyAppointmentLimit === 40;
            const usedAppointments = subStatus?.currentMonthAppointments || 0;
            const remainingAppointments = Math.max(0, (subStatus?.monthlyAppointmentLimit || 40) - usedAppointments);

            return (
              <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-2.5 min-w-[290px] shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-slate-400">Plano Atual:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-white font-black text-[11px] ${
                    subStatus?.plan === 'PREMIER' ? 'bg-purple-600' :
                    subStatus?.plan === 'STUDIO' ? 'bg-pink-600' :
                    subStatus?.plan === 'STARTER' ? 'bg-blue-600' : 'bg-rose-500'
                  }`}>
                    {subStatus?.plan === 'STUDIO' ? 'STUDIO PRO' : subStatus?.plan === 'PREMIER' ? 'PREMIER EXPRESS' : subStatus?.plan === 'SOLO' ? 'SOLO AUTÔNOMA' : 'STARTER'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Capacidade da Equipe:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {subStatus?.currentUsers || 1} / {subStatus?.maxUsers || (isFreeQuotaPlan ? 1 : 2)} Profissionais
                  </span>
                </div>

                {/* Se for o plano Gratuito com limite mensal de agendamentos */}
                {isFreeQuotaPlan ? (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Agendamentos no Mês:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {usedAppointments} / 40 utilizados
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Agendamentos Restantes:</span>
                      <span className={`font-black ${
                        remainingAppointments > 10 ? 'text-emerald-600 dark:text-emerald-400' :
                        remainingAppointments > 0 ? 'text-amber-600 dark:text-amber-400' :
                        'text-rose-600 dark:text-rose-400'
                      }`}>
                        Faltam {remainingAppointments} agendamentos
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-700/60">
                      <span className="text-slate-500 dark:text-slate-400">Validade do Plano:</span>
                      <span className="font-bold text-pink-600 dark:text-pink-400">
                        Gratuito (Sem limite de dias)
                      </span>
                    </div>
                  </>
                ) : (
                  /* Planos com Assinatura Paga (Starter, Studio Pro, Premier) */
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Agendamentos no Mês:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        Ilimitados ({usedAppointments} feitos)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Dias Restantes:</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        Faltam {subStatus?.daysRemaining ?? 30} dias
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-700/60">
                      <span className="text-slate-500 dark:text-slate-400">Status da Assinatura:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Assinatura Ativa
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Add-on de Profissionais Extras */}
      <div className="flex flex-col items-center justify-center space-y-3 pt-2">
        <div className="bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-xl w-full">
          <div className="flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-xl bg-pink-600 text-white flex items-center justify-center font-bold shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-white">Add-on: Vagas Extras de Profissionais</div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400">+ R$ 15,00/mês por profissional além da cota do plano</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-pink-300 dark:border-pink-700 shadow-xs">
            <button
              onClick={() => setExtraSeats(Math.max(0, extraSeats - 1))}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-black px-2 min-w-[20px] text-center text-pink-600">
              +{extraSeats}
            </span>
            <button
              onClick={() => setExtraSeats(extraSeats + 1)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid com os 4 Planos do Nicho de Beleza */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch pt-2">
        
        {/* 1. SOLO / AUTÔNOMA */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500">Solo / Autônoma</div>
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                R$ 0,00 <span className="text-xs font-normal text-slate-500">/mês</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Degustação sem cartão</div>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl font-bold">
              ✓ 1 Profissional • até 40 agendamentos/mês
            </div>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Manicure / Lash Solo</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Agenda simples</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Cadastro de Clientes CRM</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Comissão fixa 100% autônoma</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Frente de Caixa Balcão</li>
            </ul>
          </div>
          <button
            onClick={() => handleGeneratePix('SOLO')}
            className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs"
          >
            {subStatus?.plan === 'SOLO' ? 'Plano Atual' : 'Ativar Solo Grátis'}
          </button>
        </div>

        {/* 2. STARTER */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div className="text-xs font-black uppercase tracking-wider text-indigo-600">Starter</div>
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                R$ 69,90 <span className="text-xs font-normal text-slate-500">/mês</span>
              </div>
              <div className="text-[11px] text-emerald-600 font-bold mt-0.5">Agendamentos Ilimitados</div>
            </div>
            <div className="text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 p-2.5 rounded-xl font-bold border border-indigo-200 dark:border-indigo-800">
              ✓ Até 2 Profissionais Inclusos
            </div>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> 2 Profissionais / Cadeiras</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Agendamentos Ilimitados</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Caixa Diário & PDV Balcão</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Histórico & Anamnese Técnica</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Lembretes automáticos</li>
            </ul>
          </div>
          <button
            onClick={() => handleGeneratePix('STARTER')}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-black text-xs border border-indigo-200 dark:border-indigo-800"
          >
            Assinar Starter
          </button>
        </div>

        {/* 3. STUDIO PRO (RECOMENDADO) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-pink-500 shadow-xl space-y-6 flex flex-col justify-between relative transform lg:-translate-y-2">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-full shadow-md whitespace-nowrap">
            ⭐ Mais Escolhido por Salões
          </div>
          <div className="space-y-4 pt-1">
            <div className="text-xs font-black uppercase tracking-wider text-pink-600">Studio Pro</div>
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                R$ {139.9 + (extraSeats * 15)} <span className="text-xs font-normal text-slate-500">/mês</span>
              </div>
              {extraSeats > 0 && (
                <div className="text-[10px] text-pink-600 font-bold">
                  Inclui +{extraSeats} vagas extras (+R$ {extraSeats * 15}/mês)
                </div>
              )}
            </div>
            <div className="text-xs text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/60 p-2.5 rounded-xl font-bold border border-pink-200 dark:border-pink-800">
              ✓ Até {5 + extraSeats} Profissionais (+ R$ 15/extra)
            </div>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-200">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-pink-600 shrink-0" /> <strong>Comissões Sem Planilha</strong> (Lei do Salão Parceiro)</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-pink-600 shrink-0" /> <strong>Comandas Multisserviços</strong> (Express)</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-pink-600 shrink-0" /> Agendas individuais por cadeira</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-pink-600 shrink-0" /> WhatsApp Automático (24h e 2h)</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-pink-600 shrink-0" /> Estoque de bancada vs revenda</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-pink-600 shrink-0" /> Backup Nuvem Google Drive</li>
            </ul>
          </div>

          <button
            onClick={() => handleGeneratePix('STUDIO')}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-black text-xs shadow-md shadow-pink-600/30 flex items-center justify-center gap-1.5"
          >
            <QrCode className="w-4 h-4" />
            <span>Assinar Studio Pro via PIX</span>
          </button>
        </div>

        {/* 4. PREMIER EXPRESS / REDES */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div className="text-xs font-black uppercase tracking-wider text-purple-600">Premier Express</div>
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                R$ {229.9 + (extraSeats * 15)} <span className="text-xs font-normal text-slate-500">/mês</span>
              </div>
              <div className="text-[11px] text-purple-600 font-bold mt-0.5">Para Redes e Grandes Espaços</div>
            </div>
            <div className="text-xs text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 p-2.5 rounded-xl font-bold border border-purple-200 dark:border-purple-800">
              ✓ Até {15 + extraSeats} Profissionais (+ R$ 15/extra)
            </div>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600 shrink-0" /> <strong>CRM Reativação de Clientes</strong></li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600 shrink-0" /> Multi-agenda de alto fluxo</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600 shrink-0" /> Relatórios de Produtividade DRE</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600 shrink-0" /> Múltiplas filiais e unidades</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600 shrink-0" /> Treinamento VIP com especialista</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600 shrink-0" /> Suporte Prioritário 24/7</li>
            </ul>
          </div>

          <button
            onClick={() => handleGeneratePix('PREMIER')}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
          >
            <QrCode className="w-4 h-4" />
            <span>Assinar Premier</span>
          </button>
        </div>

      </div>

      {/* Histórico de Pagamentos & Comprovantes (Auditoria do SaaS) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Auditoria Financeira do SaaS</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Histórico de Pagamentos & Comprovantes
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Todas as transações PIX e Cartão ficam registradas no banco para auditoria, histórico contábil e validação imediata.
            </p>
          </div>

          <button
            onClick={loadPaymentHistory}
            disabled={loadingHistory}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shrink-0 self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
            <span>Atualizar Histórico</span>
          </button>
        </div>

        {validationAlert && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn ${
              validationAlert.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{validationAlert.message}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pr-4">DATA / HORA</th>
                <th className="pb-3 px-4">DESCRIÇÃO / PLANO</th>
                <th className="pb-3 px-4">ID MERCADO PAGO</th>
                <th className="pb-3 px-4">MÉTODO</th>
                <th className="pb-3 px-4">VALOR</th>
                <th className="pb-3 px-4">STATUS</th>
                <th className="pb-3 pl-4 text-right">AÇÃO / VALIDAÇÃO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    Nenhum pagamento registrado ainda. Ao gerar um PIX ou assinar um plano, o comprovante aparecerá aqui.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const planLabels = {
                    SOLO: 'Plano Solo / Autônoma',
                    STARTER: 'Plano Starter',
                    STUDIO: 'Plano Studio Pro',
                    PREMIER: 'Plano Premier Express',
                  };
                  const planTitle = planLabels[p.plan] || p.plan || 'Plano Studio Pro';

                  const dateFormatted = p.created_at
                    ? new Date(p.created_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-';

                  const paidDateFormatted = p.paid_at
                    ? new Date(p.paid_at).toLocaleDateString('pt-BR')
                    : p.created_at
                    ? new Date(p.created_at).toLocaleDateString('pt-BR')
                    : '-';

                  const isApproved = p.status === 'approved';
                  const isPending = p.status === 'pending';

                  return (
                    <tr key={p.id || p.payment_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 pr-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {dateFormatted}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {planTitle}
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {p.payment_id || '-'}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        {p.method === 'card' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-[11px]">
                            <CreditCard className="w-3 h-3" />
                            <span>Cartão</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-[11px]">
                            <Zap className="w-3 h-3" />
                            <span>PIX</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-black text-slate-900 dark:text-white whitespace-nowrap">
                        R$ {Number(p.amount || 0).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Aprovado</span>
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-bold text-xs">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pendente</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-xs">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{p.status}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 pl-4 text-right whitespace-nowrap">
                        {isApproved ? (
                          <span className="text-xs text-slate-500 font-medium">
                            Pago em {paidDateFormatted}
                          </span>
                        ) : (
                          <div className="inline-flex items-center justify-end gap-2">
                            {p.qr_code && (
                              <button
                                onClick={() => handleOpenQrCodeModal(p)}
                                className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-xs transition-colors"
                              >
                                Ver QR Code
                              </button>
                            )}
                            <button
                              onClick={() => handleValidatePayment(p.payment_id)}
                              disabled={validatingPaymentId === p.payment_id}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3 h-3 ${validatingPaymentId === p.payment_id ? 'animate-spin' : ''}`} />
                              <span>{validatingPaymentId === p.payment_id ? 'Validando...' : 'Validar Pagamento'}</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Os 3 Gatilhos de Ouro do Nicho */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl border border-slate-800">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[11px] font-black uppercase">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Diferenciais Exclusivos para Salões de Beleza</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black">Os 3 Pilares que Pagam a Mensalidade Sozinhos</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              1
            </div>
            <div className="font-bold text-sm text-emerald-300">Gestão de Comissões Sem Planilha</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Em total conformidade com a Lei do Salão Parceiro: cada profissional recebe sua % exata por serviço, gerando folha de pagamento e quitação em 1 clique.
            </p>
          </div>

          <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-black">
              2
            </div>
            <div className="font-bold text-sm text-pink-300">Vagas Extras Flexíveis (+R$ 15/mês)</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Mantenha o plano base acessível e adicione novas manicures ou cabeleireiras conforme o salão cresce sem precisar negociar manualmente.
            </p>
          </div>

          <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black">
              3
            </div>
            <div className="font-bold text-sm text-purple-300">Comanda Multisserviços Express</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              A cliente faz mão com a Manicure A, escova com a Cabeleireira B e depilação com a Esteticista C na mesma conta com rateio perfeito.
            </p>
          </div>
        </div>
      </div>

      {/* Modal PIX com QR Code do Mercado Pago */}
      {showPixModal && pixData && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
                💳
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Pagamento Seguro via PIX
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Escaneie o QR Code abaixo com o app do seu banco para ativar instantaneamente:
              </p>
              <div className="text-2xl font-black text-pink-600">
                R$ {Number(pixData.amount).toFixed(2).replace('.', ',')}
              </div>
            </div>

            {/* Imagem do QR Code Base64 */}
            {pixData.qrCodeBase64 && (
              <div className="flex justify-center p-4 bg-white rounded-2xl border border-slate-200 shadow-inner max-w-[240px] mx-auto">
                <img
                  src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                  alt="QR Code PIX Mercado Pago"
                  className="w-48 h-48"
                />
              </div>
            )}

            {/* Chave Copia e Cola */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                PIX Copia e Cola:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={pixData.qrCode || ''}
                  className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-slate-600 dark:text-slate-300 truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="px-3 py-2 bg-pink-600 text-white rounded-xl text-xs font-bold hover:bg-pink-700 flex items-center gap-1 shrink-0"
                >
                  {copiedPix ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {approvalMessage && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center border border-emerald-200">
                {approvalMessage}
              </div>
            )}

            {/* Ações */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleSimulateApproval}
                disabled={simulatingApproval}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-colors"
              >
                {simulatingApproval ? 'Confirmando...' : '✓ Simular Confirmação Instantânea de Teste'}
              </button>

              <button
                type="button"
                onClick={() => setShowPixModal(false)}
                className="w-full py-2.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-bold"
              >
                Fechar Janela
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
