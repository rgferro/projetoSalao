import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  User, 
  Scissors, 
  DollarSign, 
  Sparkles,
  QrCode,
  CreditCard,
  Banknote,
  Send,
  HelpCircle,
  FolderSync
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getSegmentConfig } from '../lib/segmentTheme';

// Modal de Atalhos de Teclado (F1)
export function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'F1', desc: 'Abrir este Guia de Atalhos Rápidos' },
    { key: 'F2', desc: 'Abrir tela de Novo Agendamento Multisserviços' },
    { key: 'F3', desc: 'Abrir Frente de Caixa / PDV Rápido' },
    { key: 'F4', desc: 'Abrir Cadastro Rápido de Novo Cliente' },
    { key: 'ESC', desc: 'Fechar modais e janelas abertas' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-salon-500" />
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Atalhos de Teclado</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          {shortcuts.map((s) => (
            <div key={s.key} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
              <span className="text-sm text-slate-600 dark:text-slate-300">{s.desc}</span>
              <kbd className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-sm text-salon-600 dark:text-salon-400">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal de Gerenciamento do Caixa Diário (Abertura, Sangria, Reforço, Fechamento)
export function CashManagementModal({ isOpen, onClose, cashStatus, onRefresh }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState(cashStatus?.isOpen ? 'movement' : 'open');
  const [initialBalance, setInitialBalance] = useState('100.00');
  const [movementType, setMovementType] = useState('sangria');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementDesc, setMovementDesc] = useState('');
  const [finalBalance, setFinalBalance] = useState('');
  const [operatorName, setOperatorName] = useState('Recepcionista');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleOpenCash = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      await api.openCash({
        initial_balance: parseFloat(initialBalance) || 0,
        opened_by: operatorName,
        notes
      });
      onRefresh();
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMovement = async (e) => {
    e.preventDefault();
    if (!movementAmount || !movementDesc) {
      setErrorMsg('Informe o valor e a justificativa da movimentação.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await api.addCashMovement({
        type: movementType,
        amount: parseFloat(movementAmount),
        description: movementDesc
      });
      setMovementAmount('');
      setMovementDesc('');
      onRefresh();
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseCash = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      await api.closeCash({
        final_balance: parseFloat(finalBalance) || 0,
        closed_by: operatorName,
        notes
      });
      onRefresh();
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Controle do Caixa Diário</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex gap-2 mt-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {!cashStatus?.isOpen ? (
            <button
              onClick={() => setActiveTab('open')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === 'open' ? 'bg-white dark:bg-slate-900 text-salon-600 shadow' : 'text-slate-500'}`}
            >
              Abrir Caixa
            </button>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('movement')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === 'movement' ? 'bg-white dark:bg-slate-900 text-salon-600 shadow' : 'text-slate-500'}`}
              >
                Sangria / Reforço
              </button>
              <button
                onClick={() => setActiveTab('close')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === 'close' ? 'bg-white dark:bg-slate-900 text-rose-600 shadow' : 'text-slate-500'}`}
              >
                Fechar Caixa
              </button>
            </>
          )}
        </div>

        {/* Form: Abertura */}
        {activeTab === 'open' && (
          <form onSubmit={handleOpenCash} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Fundo de Troco Inicial (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-salon-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Operador Responsável
              </label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
            >
              {loading ? 'Abrindo Caixa...' : 'Confirmar Abertura de Caixa'}
            </button>
          </form>
        )}

        {/* Form: Sangria / Reforço */}
        {activeTab === 'movement' && (
          <form onSubmit={handleAddMovement} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMovementType('sangria')}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  movementType === 'sangria' ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : 'border-slate-200 text-slate-600'
                }`}
              >
                Sangria (Retirada)
              </button>
              <button
                type="button"
                onClick={() => setMovementType('reforco')}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  movementType === 'reforco' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'border-slate-200 text-slate-600'
                }`}
              >
                Reforço (Suprimento)
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Valor da Movimentação (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={movementAmount}
                onChange={(e) => setMovementAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Motivo / Justificativa
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Compra de materiais de limpeza, Troco..."
                value={movementDesc}
                onChange={(e) => setMovementDesc(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-white bg-salon-600 hover:bg-salon-700 shadow-md shadow-salon-600/20"
            >
              {loading ? 'Salvando...' : 'Registrar Movimentação'}
            </button>
          </form>
        )}

        {/* Form: Fechamento */}
        {activeTab === 'close' && (
          <form onSubmit={handleCloseCash} className="mt-4 space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Saldo Inicial:</span>
                <span className="font-semibold">R$ {(cashStatus?.session?.initial_balance || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Saldo Atual do Sistema:</span>
                <span className="font-bold text-emerald-600">R$ {(cashStatus?.session?.system_balance || 0).toFixed(2)}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Valor Total em Caixa na Contagem Física (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={finalBalance}
                onChange={(e) => setFinalBalance(e.target.value)}
                placeholder="Digite o valor contado na gaveta"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20"
            >
              {loading ? 'Fechando...' : 'Encerrar Caixa Diário'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

// Modal de Novo Agendamento Multisserviços
export function NewAppointmentModal({ isOpen, onClose, onCreated }) {
  const { user } = useAuth();
  const segmentConfig = getSegmentConfig(user?.segment);

  const [clients, setClients] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [services, setServices] = useState([]);
  
  const [clientId, setClientId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [sendWhatsapp, setSendWhatsapp] = useState(true);

  // Itens de multisserviços
  const [items, setItems] = useState([
    { service_id: '', professional_id: '', start_time: '09:00', end_time: '10:00', price: 0, duration_min: 60 }
  ]);

  const [conflictAlert, setConflictAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen || !user?.tenantId) return;

    async function loadData() {
      try {
        setErrorMsg('');
        setClientId('');
        setClients([]);
        setProfessionals([]);
        setServices([]);
        const [cList, pList, sList] = await Promise.all([
          api.getClients(),
          api.getProfessionals(),
          api.getServices()
        ]);
        setClients(cList);
        setProfessionals(pList);
        setServices(sList);
        if (cList.length > 0) setClientId(cList[0].id);
        if (sList.length > 0 && pList.length > 0) {
          const s0 = sList[0];
          setItems([{
            service_id: s0.id,
            professional_id: pList[0].id,
            start_time: '09:00',
            end_time: '10:00',
            price: s0.price,
            duration_min: s0.duration_min
          }]);
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setErrorMsg(err.message || 'Não foi possível carregar os dados do salão ativo.');
      }
    }
    loadData();
  }, [isOpen, user?.tenantId, user?.segment]);

  const handleServiceChange = (index, serviceId) => {
    const s = services.find(x => x.id === parseInt(serviceId));
    if (!s) return;

    const newItems = [...items];
    newItems[index].service_id = s.id;
    newItems[index].price = s.price;
    newItems[index].duration_min = s.duration_min;

    // Calcular end_time
    const [h, m] = newItems[index].start_time.split(':').map(Number);
    const endTotalMin = h * 60 + m + s.duration_min;
    const endH = String(Math.floor(endTotalMin / 60)).padStart(2, '0');
    const endM = String(endTotalMin % 60).padStart(2, '0');
    newItems[index].end_time = `${endH}:${endM}`;

    setItems(newItems);
  };

  const handleStartTimeChange = (index, startTime) => {
    const newItems = [...items];
    newItems[index].start_time = startTime;
    const duration = newItems[index].duration_min || 60;
    const [h, m] = startTime.split(':').map(Number);
    const endTotalMin = h * 60 + m + duration;
    const endH = String(Math.floor(endTotalMin / 60)).padStart(2, '0');
    const endM = String(endTotalMin % 60).padStart(2, '0');
    newItems[index].end_time = `${endH}:${endM}`;
    setItems(newItems);
  };

  const handleAddItem = () => {
    if (services.length === 0 || professionals.length === 0) return;
    const lastItem = items[items.length - 1];
    const nextStart = lastItem ? lastItem.end_time : '10:00';
    const s0 = services[0];
    const [h, m] = nextStart.split(':').map(Number);
    const endTotalMin = h * 60 + m + s0.duration_min;
    const endH = String(Math.floor(endTotalMin / 60)).padStart(2, '0');
    const endM = String(endTotalMin % 60).padStart(2, '0');

    setItems([
      ...items,
      {
        service_id: s0.id,
        professional_id: professionals[0].id,
        start_time: nextStart,
        end_time: `${endH}:${endM}`,
        price: s0.price,
        duration_min: s0.duration_min
      }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totalPrice = items.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientId) {
      setErrorMsg('Selecione uma cliente.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await api.createAppointment({
        client_id: clientId,
        date,
        notes,
        items,
        sendWhatsappReminder: sendWhatsapp
      });
      onCreated();
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto my-auto">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className={`w-5 h-5 ${segmentConfig.theme.textAccent}`} />
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Novo Agendamento</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{segmentConfig.icon} Agenda de {user?.salonName || segmentConfig.shortLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Cliente *</label>
              <select
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="">Selecione a cliente...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Data do Atendimento *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          {/* Dynamic Service Items Selection */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Serviços Inclusos no Agendamento ({items.length})
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-semibold text-salon-600 dark:text-salon-400 flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Outro Serviço
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Serviço #{idx + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-rose-500 hover:text-rose-700 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remover
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Serviço</label>
                    <select
                      value={item.service_id}
                      onChange={(e) => handleServiceChange(idx, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      {services.map(s => (
                        <option key={s.id} value={s.id}>{s.name} (R$ {s.price})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Profissional</label>
                    <select
                      value={item.professional_id}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].professional_id = e.target.value;
                        setItems(copy);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      {professionals.map(p => (
                        <option key={p.id} value={p.id}>{p.nickname || p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Início</label>
                    <input
                      type="time"
                      value={item.start_time}
                      onChange={(e) => handleStartTimeChange(idx, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Término</label>
                    <input
                      type="time"
                      value={item.end_time}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].end_time = e.target.value;
                        setItems(copy);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Observações / Instruções
            </label>
            <input
              type="text"
              placeholder="Ex: Trazer referência de corte, cliente tem preferência por café..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="sendWa"
              checked={sendWhatsapp}
              onChange={(e) => setSendWhatsapp(e.target.checked)}
              className="rounded text-salon-600 focus:ring-salon-500"
            />
            <label htmlFor="sendWa" className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Disparar mensagem/lembrete de confirmação via WhatsApp automaticamente
            </label>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs text-slate-500">Valor Total Estimado:</span>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">R$ {totalPrice.toFixed(2)}</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-sm font-bold rounded-xl text-white bg-salon-600 hover:bg-salon-700 shadow-md shadow-salon-600/20"
              >
                {loading ? 'Agendando...' : 'Confirmar Agendamento'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}

// Modal de Cadastro Rápido de Novo Cliente (F4) com Anamnese
export function NewClientModal({ isOpen, onClose, onCreated }) {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [cpf, setCpf] = useState('');
  const [notes, setNotes] = useState('');
  const [activeAnamneseTab, setActiveAnamneseTab] = useState('hair');

  // Campos de Anamnese
  const [anamnesis, setAnamnesis] = useState({
    hair_type: '',
    hair_chemical_history: '',
    hair_color_formula: '',
    hair_sensitivities: '',
    waxing_skin_type: '',
    waxing_allergies: '',
    waxing_preferred_method: '',
    nails_shape_preferences: '',
    nails_gel_allergy: '',
    makeup_skin_type: '',
    makeup_restrictions: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone) {
      setErrorMsg('Nome e Telefone/WhatsApp são obrigatórios.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await api.createClient({
        name,
        phone,
        email,
        birthdate,
        cpf,
        notes,
        anamnesis,
        sendWelcome: true
      });
      onCreated();
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-salon-600" />
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Novo Cliente & Ficha de Anamnese</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Mariana Duarte"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                WhatsApp / Telefone *
              </label>
              <input
                type="text"
                required
                placeholder="(11) 98888-7777"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                E-mail
              </label>
              <input
                type="email"
                placeholder="cliente@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Data de Nascimento
              </label>
              <input
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          {/* Abas de Anamnese Técnica */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Ficha Técnica / Anamnese Especializada
            </label>

            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-3">
              {[
                { id: 'hair', label: 'Cabelo' },
                { id: 'waxing', label: 'Depilação' },
                { id: 'nails', label: 'Manicure' },
                { id: 'makeup', label: 'Maquiagem' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveAnamneseTab(t.id)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeAnamneseTab === t.id ? 'bg-white dark:bg-slate-900 text-salon-600 shadow' : 'text-slate-500'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {activeAnamneseTab === 'hair' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/70">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Tipo de Fio / Curvatura</label>
                  <input
                    type="text"
                    placeholder="Ex: Ondulado 2B, Fino"
                    value={anamnesis.hair_type}
                    onChange={(e) => setAnamnesis({ ...anamnesis, hair_type: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Fórmula de Coloração Habitual</label>
                  <input
                    type="text"
                    placeholder="Ex: Igora 9.98 + 9.1 com OX 20"
                    value={anamnesis.hair_color_formula}
                    onChange={(e) => setAnamnesis({ ...anamnesis, hair_color_formula: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-500 mb-0.5">Histórico Químico & Sensibilidades</label>
                  <input
                    type="text"
                    placeholder="Ex: Mechas a cada 4 meses, couro cabeludo sensível"
                    value={anamnesis.hair_chemical_history}
                    onChange={(e) => setAnamnesis({ ...anamnesis, hair_chemical_history: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            )}

            {activeAnamneseTab === 'waxing' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/70">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Tipo de Pele / Fototipo</label>
                  <input
                    type="text"
                    placeholder="Ex: Pele sensível, Fototipo II"
                    value={anamnesis.waxing_skin_type}
                    onChange={(e) => setAnamnesis({ ...anamnesis, waxing_skin_type: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Cera / Método Preferido</label>
                  <input
                    type="text"
                    placeholder="Ex: Cera morna hipoalergênica"
                    value={anamnesis.waxing_preferred_method}
                    onChange={(e) => setAnamnesis({ ...anamnesis, waxing_preferred_method: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-500 mb-0.5">Alergias ou Histórico de Foliculite</label>
                  <input
                    type="text"
                    placeholder="Ex: Alergia a mel, usar loção calmante pós"
                    value={anamnesis.waxing_allergies}
                    onChange={(e) => setAnamnesis({ ...anamnesis, waxing_allergies: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            )}

            {activeAnamneseTab === 'nails' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/70">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Formato & Preferência de Esmaltação</label>
                  <input
                    type="text"
                    placeholder="Ex: Amendoadas, tons nudes e vermelhos"
                    value={anamnesis.nails_shape_preferences}
                    onChange={(e) => setAnamnesis({ ...anamnesis, nails_shape_preferences: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Alergia a Esmalte em Gel / Outros</label>
                  <input
                    type="text"
                    placeholder="Ex: Nenhuma alergia relatada"
                    value={anamnesis.nails_gel_allergy}
                    onChange={(e) => setAnamnesis({ ...anamnesis, nails_gel_allergy: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            )}

            {activeAnamneseTab === 'makeup' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/70">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Tipo de Pele para Maquiagem</label>
                  <input
                    type="text"
                    placeholder="Ex: Mista a oleosa na zona T"
                    value={anamnesis.makeup_skin_type}
                    onChange={(e) => setAnamnesis({ ...anamnesis, makeup_skin_type: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Restrições / Fixadores</label>
                  <input
                    type="text"
                    placeholder="Ex: Sem produtos com cheiro forte, usar blindagem"
                    value={anamnesis.makeup_restrictions}
                    onChange={(e) => setAnamnesis({ ...anamnesis, makeup_restrictions: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-bold rounded-xl text-white bg-salon-600 hover:bg-salon-700 shadow-md shadow-salon-600/20"
            >
              {loading ? 'Salvando...' : 'Salvar Cadastro do Cliente'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
