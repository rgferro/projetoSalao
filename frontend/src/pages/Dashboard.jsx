import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  CalendarCheck, 
  Clock, 
  Wallet, 
  Cake, 
  Users, 
  AlertCircle, 
  ArrowUpRight, 
  ChevronRight, 
  Check, 
  ShoppingBag, 
  Send,
  Sparkles,
  DollarSign,
  Award
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getSegmentConfig } from '../lib/segmentTheme';

export default function Dashboard({ 
  onNavigate, 
  onOpenNewAppointment, 
  onOpenNewClient, 
  onOpenPDV,
  onOpenCashModal 
}) {
  const { user, canViewFinancial, canViewCashRegister } = useAuth();
  const segConfig = getSegmentConfig(user?.segment);
  const segTheme = segConfig.theme;

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Erro ao carregar métricas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (appId, status) => {
    try {
      await api.updateAppointmentStatus(appId, status);
      setToastMsg(`Status alterado para "${status}" com sucesso!`);
      loadData();
      setTimeout(() => setToastMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendReminder = async (appId) => {
    try {
      const res = await api.sendReminder(appId, 'reminder_24h');
      if (res.waLink) {
        window.open(res.waLink, '_blank');
      }
      setToastMsg('Lembrete de WhatsApp gerado!');
      setTimeout(() => setToastMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendBirthday = async (clientId) => {
    try {
      await api.sendBirthdayMsg(clientId);
      setToastMsg('✅ Mensagem de aniversário enviada no WhatsApp em segundo plano!');
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err) {
      alert(`Erro ao enviar WhatsApp: ${err.message}`);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  const { 
    todayApps, 
    todayRevenue, 
    monthRevenue, 
    myCommissionsToday, 
    myCommissionsMonth, 
    cashRegister, 
    birthdaysToday, 
    upcomingToday, 
    pendingPayables, 
    totalClients 
  } = metrics || {};

  const isProf = user?.accessLevel === 'PROFISSIONAL';

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-20 right-8 z-50 p-4 bg-emerald-600 text-white font-semibold rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
          <Check className="w-5 h-5" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner with Quick Actions */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${segTheme.gradient} text-white p-5 sm:p-8 shadow-lg ${segTheme.glow}`}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-medium">
              <span className="text-sm shrink-0">{segConfig.icon}</span>
              <span>Painel de Controle • {segConfig.label}</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">
              Olá, {user?.name || 'Equipe BelaGestão'}!
            </h2>
            <p className="text-xs sm:text-sm text-white/90 max-w-xl">
              {isProf 
                ? 'Acompanhe seus horários de atendimento, fichas de clientes e o extrato das suas comissões.'
                : `Gerencie seus atendimentos de ${segConfig.shortLabel || 'serviços'}, frente de caixa PDV e equipe com agilidade e total controle.`
              }
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={onOpenNewAppointment}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Novo Agendamento (F2)</span>
            </button>
            {canViewCashRegister && (
              <button
                onClick={onOpenPDV}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-salon-950/40 hover:bg-salon-950/60 backdrop-blur-md border border-white/20 text-white font-bold text-xs sm:text-sm transition active:scale-95 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Frente de Caixa (F3)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Faturamento do Salão (Apenas Dono / Gerente) */}
        {canViewFinancial && (
          <div className="glass-panel p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Faturamento Hoje
              </span>
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                R$ {(todayRevenue || 0).toFixed(2)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Acumulado no Mês: <strong className="text-emerald-600">R$ {(monthRevenue || 0).toFixed(2)}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Minhas Comissões (Exclusivo para Profissional) */}
        {isProf && (
          <div className="glass-panel p-5 space-y-3 border-pink-200 dark:border-pink-900/50 bg-gradient-to-br from-pink-50/50 to-white dark:from-pink-950/20 dark:to-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-pink-700 dark:text-pink-400">
                Minhas Comissões Hoje
              </span>
              <div className="p-2 rounded-xl bg-pink-100 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-pink-700 dark:text-pink-300">
                R$ {(myCommissionsToday || 0).toFixed(2)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Ganhos no Mês: <strong className="text-pink-600">R$ {(myCommissionsMonth || 0).toFixed(2)}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Atendimentos Hoje */}
        <div className="glass-panel p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isProf ? 'Meus Atendimentos Hoje' : 'Agendamentos Hoje'}
            </span>
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {todayApps?.total || 0}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="text-emerald-600 font-semibold">{todayApps?.completed || 0} Concluídos</span>
              <span>•</span>
              <span className="text-amber-600 font-semibold">{todayApps?.in_progress || 0} Em Curso</span>
            </div>
          </div>
        </div>

        {/* Caixa Diário (Dono, Gerente, Recepção) */}
        {canViewCashRegister && (
          <div className="glass-panel p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Caixa Diário
              </span>
              <div className={`p-2 rounded-xl ${cashRegister?.isOpen ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50' : 'bg-rose-100 text-rose-600 dark:bg-rose-950/50'}`}>
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${cashRegister?.isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {cashRegister?.isOpen ? `R$ ${(cashRegister.session?.system_balance || 0).toFixed(2)}` : 'Fechado'}
                </p>
              </div>
              <button
                onClick={onOpenCashModal}
                className="text-xs text-salon-600 dark:text-salon-400 font-semibold hover:underline mt-1 inline-block"
              >
                {cashRegister?.isOpen ? 'Gerenciar Sangria / Fechar' : 'Abrir Caixa Diário'}
              </button>
            </div>
          </div>
        )}

        {/* Total de Clientes */}
        <div className="glass-panel p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Base de Clientes
            </span>
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {totalClients || 0}
            </p>
            <button
              onClick={onOpenNewClient}
              className="text-xs text-salon-600 dark:text-salon-400 font-semibold hover:underline mt-1 inline-block"
            >
              + Cadastrar Novo (F4)
            </button>
          </div>
        </div>

      </div>

      {/* Main Grid: Atendimentos em Tempo Real & Alertas/Aniversariantes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left (2 cols): Próximos Atendimentos Hoje */}
        <div className="lg:col-span-2 glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-salon-500" />
                Atendimentos de Hoje
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acompanhe o fluxo de clientes e altere os status com um clique
              </p>
            </div>

            <button
              onClick={() => onNavigate('appointments')}
              className="text-xs font-semibold text-salon-600 dark:text-salon-400 hover:underline flex items-center gap-1"
            >
              Ver Grade Completa <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {(!upcomingToday || upcomingToday.length === 0) ? (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <CalendarCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Nenhum atendimento agendado para hoje.</p>
                <button
                  onClick={onOpenNewAppointment}
                  className="mt-3 px-3.5 py-1.5 text-xs font-bold rounded-lg text-white bg-salon-600 hover:bg-salon-700"
                >
                  Agendar Primeiro Horário
                </button>
              </div>
            ) : (
              upcomingToday.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 hover:border-salon-300 dark:hover:border-salon-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                      <Clock className="w-3.5 h-3.5 text-salon-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{app.first_time || '09:00'}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{app.client_name}</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full badge-${app.status}`}>
                          {app.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        💆 {app.services_list || 'Serviços'}
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>👤 {app.profs_list}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">R$ {(app.total_price || 0).toFixed(2)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleSendReminder(app.id)}
                      className="p-2 rounded-lg text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800"
                      title="Enviar Lembrete por WhatsApp"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>

                    {app.status === 'agendado' && (
                      <button
                        onClick={() => handleUpdateStatus(app.id, 'confirmado')}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200"
                      >
                        Confirmar
                      </button>
                    )}

                    {app.status === 'confirmado' && (
                      <button
                        onClick={() => handleUpdateStatus(app.id, 'em_atendimento')}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200"
                      >
                        Iniciar Atendimento
                      </button>
                    )}

                    {app.status === 'em_atendimento' && (
                      <button
                        onClick={onOpenPDV}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 shadow-sm"
                      >
                        Concluir & Faturar
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right (1 col): Aniversariantes do Dia & Contas a Vencer */}
        <div className="space-y-6">
          
          {/* Aniversariantes do Dia */}
          <div className="glass-panel p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cake className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">Aniversariantes do Dia</h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                {birthdaysToday?.length || 0}
              </span>
            </div>

            {(!birthdaysToday || birthdaysToday.length === 0) ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center">
                Nenhum cliente aniversariando hoje.
              </p>
            ) : (
              <div className="space-y-2">
                {birthdaysToday.map((b) => (
                  <div key={b.id} className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{b.name}</p>
                      <p className="text-[11px] text-slate-500">{b.phone}</p>
                    </div>
                    <button
                      onClick={() => handleSendBirthday(b.id)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-sm flex items-center gap-1 shrink-0"
                    >
                      <Send className="w-3 h-3" /> Parabéns
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contas a Pagar / Pendências Financeiras (Apenas Dono / Gerente) */}
          {canViewFinancial && (
            <div className="glass-panel p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">Contas a Vencer</h3>
                </div>
                <button
                  onClick={() => onNavigate('financial')}
                  className="text-xs font-semibold text-salon-600 dark:text-salon-400 hover:underline"
                >
                  Ver Todas
                </button>
              </div>

              {(!pendingPayables || pendingPayables.length === 0) ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center">
                  Tudo em dia! Sem despesas pendentes para hoje.
                </p>
              ) : (
                <div className="space-y-2">
                  {pendingPayables.map((p) => (
                    <div key={p.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{p.description}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{p.category} • Vencimento: {p.due_date.split('-').reverse().join('/')}</p>
                      </div>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        R$ {p.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
