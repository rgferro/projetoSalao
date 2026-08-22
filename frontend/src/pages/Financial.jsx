import React, { useState, useEffect } from 'react';
import { 
  BadgeDollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Filter, 
  Calendar, 
  CheckCircle, 
  Trash2, 
  PieChart, 
  BarChart3, 
  DollarSign, 
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import PageTourButton from '../components/PageTourButton';

export default function Financial({ onStartTour }) {
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions', 'dre', 'categories', 'top-services'
  
  // Transactions
  const [transactions, setTransactions] = useState([]);
  const [transFilterType, setTransFilterType] = useState('');
  const [transFilterStatus, setTransFilterStatus] = useState('');
  const [showNewTransModal, setShowNewTransModal] = useState(false);

  // New Transaction Form
  const [newTrans, setNewTrans] = useState({
    type: 'despesa',
    category: 'Produtos',
    description: '',
    amount: '',
    payment_method: 'pix',
    due_date: new Date().toISOString().split('T')[0],
    status: 'pendente'
  });

  // DRE State
  const [dreData, setDreData] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tList, dre, cats, topS] = await Promise.all([
        api.getTransactions({ type: transFilterType, status: transFilterStatus }),
        api.getDRE(startDate, endDate),
        api.getCategoryReport(startDate, endDate),
        api.getTopServices()
      ]);
      setTransactions(tList);
      setDreData(dre);
      setCategoryData(cats);
      setTopServices(topS);
    } catch (err) {
      console.error('Erro ao carregar financeiro:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [transFilterType, transFilterStatus, startDate, endDate]);

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    try {
      await api.createTransaction(newTrans);
      setShowNewTransModal(false);
      setNewTrans({
        type: 'despesa',
        category: 'Produtos',
        description: '',
        amount: '',
        payment_method: 'pix',
        due_date: new Date().toISOString().split('T')[0],
        status: 'pendente'
      });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePayTransaction = async (id) => {
    try {
      await api.payTransaction(id, 'pix');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Deseja excluir este lançamento?')) return;
    try {
      await api.deleteTransaction(id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Date Range */}
      <div id="tour-dre-lucro" className="glass-panel p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600 shrink-0" />
            Gestão Financeira & DRE
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Contas a pagar/receber, DRE gerencial, margem de contribuição e lucratividade
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onStartTour && (
            <PageTourButton onClick={() => onStartTour('financial')} label="Tour do Financeiro" />
          )}

          <button
            onClick={() => setShowNewTransModal(true)}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> Novo Lançamento
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div id="tour-comissoes-equipe" className="flex gap-1.5 sm:gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-x-auto no-scrollbar">
        {[
          { id: 'transactions', label: 'Contas a Pagar & Receber' },
          { id: 'dre', label: 'DRE Simplificado' },
          { id: 'categories', label: 'Faturamento por Categoria' },
          { id: 'top-services', label: 'Serviços Mais Lucrativos' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 min-w-fit px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition ${
              activeTab === t.id ? 'bg-white dark:bg-slate-900 text-salon-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Contas a Pagar e Receber */}
      {activeTab === 'transactions' && (
        <div id="tour-contas-pagar" className="glass-panel p-6 space-y-4">
          
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <select
                value={transFilterType}
                onChange={(e) => setTransFilterType(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="">Todas as Transações</option>
                <option value="receita">Apenas Receitas (+)</option>
                <option value="despesa">Apenas Despesas (-)</option>
              </select>

              <select
                value={transFilterStatus}
                onChange={(e) => setTransFilterStatus(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="">Todos os Status</option>
                <option value="pendente">Pendentes / A Vencer</option>
                <option value="pago">Quitados / Pagos</option>
              </select>
            </div>

            <span className="text-xs font-bold text-slate-400">
              Total: {transactions.length} registros
            </span>
          </div>

          {/* Table */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.map((t) => (
              <div key={t.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${t.type === 'receita' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{t.description}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      t.status === 'pago' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="font-medium capitalize">{t.category}</span>
                    <span>•</span>
                    <span>Vencimento: {t.due_date.split('-').reverse().join('/')}</span>
                    <span>•</span>
                    <span className="uppercase font-mono">{t.payment_method}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-base font-bold ${t.type === 'receita' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'receita' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                  </span>

                  {t.status === 'pendente' && (
                    <button
                      onClick={() => handlePayTransaction(t.id)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      Quitar
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteTransaction(t.id)}
                    className="p-1 text-slate-400 hover:text-rose-500"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: DRE Simplificado */}
      {activeTab === 'dre' && (
        <div className="space-y-6">
          {/* Period Filter */}
          <div className="glass-panel p-4 flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Período de Análise:</span>
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

          {/* DRE Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-panel p-5 space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">Receita Bruta Total</span>
              <p className="text-2xl font-bold text-emerald-600">R$ {(dreData?.grossRevenue || 0).toFixed(2)}</p>
            </div>
            <div className="glass-panel p-5 space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">Repasse de Comissões</span>
              <p className="text-2xl font-bold text-amber-600">- R$ {(dreData?.commissionsTotal || 0).toFixed(2)}</p>
            </div>
            <div className="glass-panel p-5 space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">Despesas Operacionais</span>
              <p className="text-2xl font-bold text-rose-600">- R$ {(dreData?.totalExpenses || 0).toFixed(2)}</p>
            </div>
            <div className="glass-panel p-5 space-y-1 bg-gradient-to-tr from-emerald-500/10 to-transparent border-emerald-300 dark:border-emerald-800">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase">Lucro Líquido Real</span>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                R$ {(dreData?.netProfit || 0).toFixed(2)}
              </p>
              <p className="text-[11px] font-semibold text-emerald-700">Margem: {dreData?.marginPercent || 0}%</p>
            </div>
          </div>

          {/* DRE Detailed Table */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
              Demonstrativo de Resultado do Exercício (DRE)
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 font-bold text-emerald-700 dark:text-emerald-300">
                <span>(+) RECEITA OPERACIONAL BRUTA</span>
                <span>R$ {(dreData?.grossRevenue || 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 text-amber-700 dark:text-amber-300">
                <span>(-) Comissões da Equipe / Profissionais</span>
                <span>- R$ {(dreData?.commissionsTotal || 0).toFixed(2)}</span>
              </div>

              <div className="pl-4 space-y-1.5 text-xs text-slate-500">
                <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">(-) Despesas Administrativas & Fixas:</p>
                {dreData?.expensesByCategory?.map((exp, idx) => (
                  <div key={idx} className="flex justify-between py-1">
                    <span>• {exp.category}</span>
                    <span>- R$ {exp.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between py-3 border-t-2 border-slate-300 dark:border-slate-700 font-extrabold text-base text-slate-800 dark:text-slate-100">
                <span>(=) RESULTADO LÍQUIDO DO PERÍODO</span>
                <span className={dreData?.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  R$ {(dreData?.netProfit || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Faturamento por Categoria */}
      {activeTab === 'categories' && (
        <div className="glass-panel p-6 space-y-5">
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
            Faturamento Consolidado por Categoria de Serviço
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categoryData.map((cat, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{cat.category}</span>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">R$ {cat.total_revenue.toFixed(2)}</p>
                <div className="text-xs text-slate-500 space-y-0.5">
                  <p>💆 {cat.total_services_count} atendimentos realizados</p>
                  <p>👤 Comissões: R$ {cat.total_commission.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Serviços Mais Lucrativos */}
      {activeTab === 'top-services' && (
        <div className="glass-panel p-6 space-y-4">
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
            Ranking de Serviços Mais Lucrativos & Mais Realizados
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {topServices.map((s, idx) => (
              <div key={s.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-salon-100 dark:bg-salon-950/60 text-salon-700 dark:text-salon-300 font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{s.name}</p>
                    <p className="text-slate-400 capitalize">{s.category} • Preço: R$ {s.price.toFixed(2)}</p>
                  </div>
                </div>

                <div className="text-right space-y-0.5">
                  <p className="font-bold text-slate-800 dark:text-slate-100">
                    {s.times_performed} atendimentos • R$ {s.total_gross_revenue.toFixed(2)}
                  </p>
                  <p className="font-semibold text-emerald-600">Margem Líquida Estimada: R$ {s.total_net_margin.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Novo Lançamento Financeiro */}
      {showNewTransModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-4">Novo Lançamento Financeiro</h3>
            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewTrans({ ...newTrans, type: 'despesa' })}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    newTrans.type === 'despesa' ? 'bg-rose-50 border-rose-300 text-rose-700' : 'border-slate-200'
                  }`}
                >
                  Despesa (A Pagar)
                </button>
                <button
                  type="button"
                  onClick={() => setNewTrans({ ...newTrans, type: 'receita' })}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    newTrans.type === 'receita' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-slate-200'
                  }`}
                >
                  Receita (A Receber)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Conta de Energia, Reposição de Esmaltes..."
                  value={newTrans.description}
                  onChange={(e) => setNewTrans({ ...newTrans, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Categoria</label>
                  <select
                    value={newTrans.category}
                    onChange={(e) => setNewTrans({ ...newTrans, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Produtos">Produtos / Insumos</option>
                    <option value="Aluguel">Aluguel do Salão</option>
                    <option value="Energia/Água">Energia / Água / Net</option>
                    <option value="Comissões">Comissões</option>
                    <option value="Serviços">Serviços</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newTrans.amount}
                    onChange={(e) => setNewTrans({ ...newTrans, amount: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Data de Vencimento</label>
                  <input
                    type="date"
                    required
                    value={newTrans.due_date}
                    onChange={(e) => setNewTrans({ ...newTrans, due_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status Inicial</label>
                  <select
                    value={newTrans.status}
                    onChange={(e) => setNewTrans({ ...newTrans, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="pago">Já Pago / Quitado</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTransModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
