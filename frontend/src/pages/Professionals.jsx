import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Plus, 
  DollarSign, 
  Calendar, 
  FileText, 
  Check, 
  Edit3, 
  Trash2, 
  Filter, 
  ArrowRight,
  Receipt,
  Sparkles,
  Scissors
} from 'lucide-react';
import { api } from '../services/api';

export default function Professionals() {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'commissions-report', 'settlements'
  const [professionals, setProfessionals] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // New/Edit Professional Modal
  const [showProfModal, setShowProfModal] = useState(false);
  const [editingProf, setEditingProf] = useState(null);
  const [profForm, setProfForm] = useState({
    name: '',
    nickname: '',
    phone: '',
    email: '',
    color_hex: '#ec4899',
    specialties: ['Cabelo'],
    default_commission_type: 'percentage',
    default_commission_value: 50.0
  });

  // Commissions Report Filter
  const [repProfId, setRepProfId] = useState('');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [commReport, setCommReport] = useState(null);
  const [settlementHistory, setSettlementHistory] = useState([]);

  // Settlement Action
  const [settlingProf, setSettlingProf] = useState(null);
  const [deductionAmount, setDeductionAmount] = useState('0.00');
  const [settleMethod, setSettleMethod] = useState('pix');
  const [settleNotes, setSettleNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [pList, sList, rep, setts] = await Promise.all([
        api.getProfessionals(),
        api.getServices(),
        api.getCommissionReport({ professional_id: repProfId, startDate, endDate }),
        api.getSettlements(repProfId)
      ]);
      setProfessionals(pList);
      setServices(sList);
      setCommReport(rep);
      setSettlementHistory(setts);
    } catch (err) {
      console.error('Erro ao carregar profissionais/comissões:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [repProfId, startDate, endDate]);

  const handleSaveProf = async (e) => {
    e.preventDefault();
    try {
      if (editingProf) {
        await api.updateProfessional(editingProf.id, profForm);
      } else {
        await api.createProfessional(profForm);
      }
      setShowProfModal(false);
      setEditingProf(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProf = async (id) => {
    if (!window.confirm('Deseja realmente remover este profissional da equipe?')) return;
    try {
      await api.deleteProfessional(id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenEditProf = (p) => {
    setEditingProf(p);
    setProfForm({
      name: p.name,
      nickname: p.nickname || '',
      phone: p.phone || '',
      email: p.email || '',
      color_hex: p.color_hex || '#ec4899',
      specialties: Array.isArray(p.specialties) ? p.specialties : ['Cabelo'],
      default_commission_type: p.default_commission_type || 'percentage',
      default_commission_value: p.default_commission_value || 50.0
    });
    setShowProfModal(true);
  };

  const handleSettleCommission = async (e) => {
    e.preventDefault();
    if (!settlingProf) return;
    try {
      await api.settleCommission({
        professional_id: settlingProf.professional_id,
        period_start: startDate,
        period_end: endDate,
        total_services_amount: settlingProf.total_revenue,
        total_commission: settlingProf.total_commission,
        deduction_amount: parseFloat(deductionAmount) || 0,
        payment_method: settleMethod,
        notes: settleNotes
      });
      alert('Repasse quitado e registrado como despesa no financeiro com sucesso!');
      setSettlingProf(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Top Header */}
      <div className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-salon-600" />
            Equipe & Repasse de Comissões
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Regras de comissão por porcentagem ou valor fixo, fechamento de quitação e repasse
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProf(null);
            setProfForm({
              name: '',
              nickname: '',
              phone: '',
              email: '',
              color_hex: '#ec4899',
              specialties: ['Cabelo'],
              default_commission_type: 'percentage',
              default_commission_value: 50.0
            });
            setShowProfModal(true);
          }}
          className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-salon-600 hover:bg-salon-700 shadow-md shadow-salon-600/20 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Novo Profissional
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'list' ? 'bg-white dark:bg-slate-900 text-salon-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          Equipe Cadastrada ({professionals.length})
        </button>
        <button
          onClick={() => setActiveTab('commissions-report')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'commissions-report' ? 'bg-white dark:bg-slate-900 text-salon-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          Relatório de Repasse de Comissões
        </button>
        <button
          onClick={() => setActiveTab('settlements')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'settlements' ? 'bg-white dark:bg-slate-900 text-salon-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          Histórico de Quitações / Pagamentos
        </button>
      </div>

      {/* TAB 1: Lista de Profissionais */}
      {activeTab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {professionals.map((p) => (
            <div key={p.id} className="glass-panel p-5 space-y-4 flex flex-col justify-between">
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md"
                    style={{ backgroundColor: p.color_hex || '#ec4899' }}
                  >
                    {(p.nickname || p.name).charAt(0)}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditProf(p)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProf(p.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">{p.name}</h3>
                  <p className="text-xs text-slate-400">{p.nickname} • {p.phone || 'Sem fone'}</p>
                </div>

                <div className="flex flex-wrap gap-1">
                  {Array.isArray(p.specialties) && p.specialties.map((s, idx) => (
                    <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {s}
                    </span>
                  ))}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Regra de Comissão:</span>
                    <span className="font-bold text-salon-600">
                      {p.default_commission_type === 'percentage' ? `${p.default_commission_value}%` : `R$ ${p.default_commission_value}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Serviços Concluídos:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{p.total_services_completed || 0}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setRepProfId(p.id);
                  setActiveTab('commissions-report');
                }}
                className="w-full py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-salon-50 dark:hover:bg-salon-950/40 hover:text-salon-600 text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1"
              >
                <span>Ver Repasse deste Profissional</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

            </div>
          ))}
        </div>
      )}

      {/* TAB 2: Relatório de Repasse de Comissões */}
      {activeTab === 'commissions-report' && (
        <div className="space-y-6">
          
          {/* Filters Bar */}
          <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={repProfId}
                onChange={(e) => setRepProfId(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="">Todos os Profissionais</option>
                {professionals.map(p => (
                  <option key={p.id} value={p.id}>{p.nickname || p.name}</option>
                ))}
              </select>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <span className="text-xs text-slate-400">até</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">Total a Repassar:</span>
              <p className="text-xl font-extrabold text-salon-600 dark:text-salon-400">
                R$ {(commReport?.totalCommissionAll || 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Cards per Professional */}
          {(!commReport?.summary || commReport.summary.length === 0) ? (
            <div className="glass-panel p-10 text-center text-slate-400">
              <DollarSign className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold">Nenhum serviço concluído neste período para cálculo de repasse.</p>
            </div>
          ) : (
            commReport.summary.map((profSummary) => (
              <div key={profSummary.professional_id} className="glass-panel p-6 space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow"
                      style={{ backgroundColor: profSummary.color_hex || '#ec4899' }}
                    >
                      {profSummary.nickname.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">{profSummary.name} ({profSummary.nickname})</h3>
                      <p className="text-xs text-slate-400">{profSummary.total_services} atendimentos realizados no período</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Faturado: <strong>R$ {profSummary.total_revenue.toFixed(2)}</strong></p>
                      <p className="text-base font-extrabold text-emerald-600">Comissão: R$ {profSummary.total_commission.toFixed(2)}</p>
                    </div>

                    <button
                      onClick={() => {
                        setSettlingProf(profSummary);
                        setDeductionAmount('0.00');
                        setSettleNotes(`Quitação de comissões do período ${startDate} a ${endDate}`);
                      }}
                      className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                    >
                      Quitar / Pagar Repasse
                    </button>
                  </div>
                </div>

                {/* Items Detail Table */}
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {profSummary.items.map((it, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{it.service_name}</span>
                        <span className="text-slate-400 ml-2">({it.client_name} • {it.appointment_date.split('-').reverse().join('/')})</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-500">Valor: R$ {it.price.toFixed(2)}</span>
                        <span className="font-bold text-emerald-600">Comissão: R$ {it.commission_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            ))
          )}

        </div>
      )}

      {/* TAB 3: Histórico de Quitações */}
      {activeTab === 'settlements' && (
        <div className="glass-panel p-6 space-y-4">
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
            Histórico de Repasses Pagos à Equipe
          </h3>

          {settlementHistory.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Nenhum repasse quitado até o momento.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {settlementHistory.map((s) => (
                <div key={s.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      {s.prof_nickname || s.prof_name} • <span className="text-emerald-600">R$ {s.net_payout.toFixed(2)}</span>
                    </p>
                    <p className="text-slate-400">
                      Período: {s.period_start} a {s.period_end} • Pago em: {s.payment_date} ({s.payment_method.toUpperCase()})
                    </p>
                    {s.notes && <p className="text-[11px] text-slate-500 italic">{s.notes}</p>}
                  </div>

                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                    QUITADO NO FINANCEIRO
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Novo / Editar Profissional */}
      {showProfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-4">
              {editingProf ? 'Editar Profissional' : 'Novo Profissional Parceiro'}
            </h3>

            <form onSubmit={handleSaveProf} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={profForm.name}
                    onChange={(e) => setProfForm({ ...profForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Apelido / Nome na Agenda</label>
                  <input
                    type="text"
                    value={profForm.nickname}
                    onChange={(e) => setProfForm({ ...profForm, nickname: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    value={profForm.phone}
                    onChange={(e) => setProfForm({ ...profForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cor na Grade de Horários</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={profForm.color_hex}
                      onChange={(e) => setProfForm({ ...profForm, color_hex: e.target.value })}
                      className="w-10 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                    />
                    <span className="text-xs font-mono text-slate-500">{profForm.color_hex}</span>
                  </div>
                </div>
              </div>

              {/* Regra de Comissão Padrão */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Regra de Comissão Padrão</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <select
                      value={profForm.default_commission_type}
                      onChange={(e) => setProfForm({ ...profForm, default_commission_type: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      <option value="percentage">Porcentagem (%)</option>
                      <option value="fixed">Valor Fixo (R$)</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={profForm.default_commission_value}
                      onChange={(e) => setProfForm({ ...profForm, default_commission_value: parseFloat(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProfModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-salon-600 hover:bg-salon-700"
                >
                  Salvar Profissional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quitar Repasse */}
      {settlingProf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-2">Quitar Repasse de Comissões</h3>
            <p className="text-xs text-slate-500 mb-4">
              Profissional: <strong className="text-slate-800 dark:text-slate-200">{settlingProf.name}</strong>
            </p>

            <form onSubmit={handleSettleCommission} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Faturado em Serviços:</span>
                  <span className="font-semibold">R$ {settlingProf.total_revenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Comissão Calculada:</span>
                  <span className="font-bold text-emerald-600">R$ {settlingProf.total_commission.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Descontos / Insumos (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={deductionAmount}
                  onChange={(e) => setDeductionAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Forma de Pagamento</label>
                <select
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="transferencia">Transferência Bancária</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Observações da Quitação</label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex justify-between items-center text-sm font-bold text-emerald-700 dark:text-emerald-300">
                <span>Valor Líquido a Pagar:</span>
                <span>R$ {(settlingProf.total_commission - (parseFloat(deductionAmount) || 0)).toFixed(2)}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettlingProf(null)}
                  className="px-4 py-2 font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  Confirmar Quitação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
