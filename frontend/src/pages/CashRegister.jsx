import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Wallet, 
  QrCode, 
  CreditCard, 
  Banknote, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  Minus, 
  History, 
  DollarSign, 
  Calendar, 
  User, 
  ArrowDownRight, 
  ArrowUpRight,
  Receipt,
  Ticket
} from 'lucide-react';
import { api } from '../services/api';

export default function CashRegister({ onOpenCashModal }) {
  const [cashData, setCashData] = useState(null);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // PDV Checkout State
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [discount, setDiscount] = useState('0.00');
  const [amountGiven, setAmountGiven] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cData, clList, sList, pList, appList] = await Promise.all([
        api.getCurrentCash(),
        api.getClients(),
        api.getServices(),
        api.getProfessionals(),
        api.getAppointments({ date: new Date().toISOString().split('T')[0], status: 'em_atendimento' })
      ]);
      setCashData(cData);
      setClients(clList);
      setServices(sList);
      setProfessionals(pList);
      setAppointments(appList);
    } catch (err) {
      console.error('Erro ao carregar PDV:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectAppointment = (appId) => {
    setSelectedAppointmentId(appId);
    if (!appId) {
      setCartItems([]);
      return;
    }
    const app = appointments.find(a => a.id === parseInt(appId));
    if (app) {
      setSelectedClientId(app.client_id);
      const mapped = app.items?.map(it => ({
        service_id: it.service_id,
        service_name: it.service_name,
        professional_id: it.professional_id,
        prof_name: it.prof_nickname || it.prof_name,
        price: it.price
      })) || [];
      setCartItems(mapped);
    }
  };

  const handleAddManualItem = (serviceId) => {
    const s = services.find(x => x.id === parseInt(serviceId));
    if (!s || professionals.length === 0) return;

    setCartItems([
      ...cartItems,
      {
        service_id: s.id,
        service_name: s.name,
        professional_id: professionals[0].id,
        prof_name: professionals[0].nickname || professionals[0].name,
        price: s.price
      }
    ]);
  };

  const handleRemoveCartItem = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const subtotal = cartItems.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
  const totalDiscount = parseFloat(discount) || 0;
  const totalToPay = Math.max(0, subtotal - totalDiscount);
  const changeDue = Math.max(0, (parseFloat(amountGiven) || 0) - totalToPay);

  const handleFinalizeCheckout = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert('Adicione pelo menos um serviço ao carrinho ou selecione um agendamento.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await api.checkoutPDV({
        appointment_id: selectedAppointmentId ? parseInt(selectedAppointmentId) : null,
        client_id: selectedClientId ? parseInt(selectedClientId) : null,
        services: cartItems,
        payment_method: paymentMethod,
        discount: totalDiscount
      });

      setCheckoutSuccess({
        transaction_id: res.transaction_id,
        total: totalToPay,
        paymentMethod,
        clientName: clients.find(c => c.id === parseInt(selectedClientId))?.name || 'Cliente Balcão',
        items: cartItems
      });

      // Reset cart
      setCartItems([]);
      setSelectedAppointmentId('');
      setDiscount('0.00');
      setAmountGiven('');

      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header Info */}
      <div className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            Frente de Caixa & PDV Balcão
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Finalização rápida de comandas, pagamentos multicanais (PIX, Cartão, Dinheiro) e controle de caixa
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl border flex items-center gap-3 ${
            cashData?.isOpen 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' 
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
          }`}>
            <Wallet className="w-5 h-5" />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider">Status do Caixa</p>
              <p className="text-sm font-extrabold leading-none">
                {cashData?.isOpen ? `ABERTO • R$ ${(cashData?.session?.system_balance || 0).toFixed(2)}` : 'FECHADO'}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenCashModal}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200"
          >
            {cashData?.isOpen ? 'Sangria / Fechamento' : 'Abrir Caixa'}
          </button>
        </div>
      </div>

      {/* Main Split: PDV Checkout (7 cols) + Cash Movements & Summary (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PDV Left: Order & Checkout Terminal (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-salon-500" />
              Terminal de Cobrança / Comanda
            </h3>
            {appointments.length > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                {appointments.length} em atendimento
              </span>
            )}
          </div>

          {/* Quick Select from Appointments in Progress */}
          {appointments.length > 0 && (
            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/40 space-y-2">
              <label className="block text-xs font-bold text-amber-800 dark:text-amber-300">
                Puxar Atendimento Em Andamento:
              </label>
              <select
                value={selectedAppointmentId}
                onChange={(e) => handleSelectAppointment(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900"
              >
                <option value="">Selecione ou lance venda avulsa abaixo...</option>
                {appointments.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.client_name} - {a.items?.map(i => i.service_name).join(', ')} (R$ {(a.total_price || 0).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Cliente & Adicionar Serviços Avulsos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Cliente</label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="">Cliente Avulso / Balcão</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Adicionar Serviço ao Carrinho</label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddManualItem(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="">+ Selecionar Serviço...</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name} - R$ {s.price.toFixed(2)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cart Table */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider grid grid-cols-12">
              <span className="col-span-6">Serviço</span>
              <span className="col-span-3">Profissional</span>
              <span className="col-span-2 text-right">Valor</span>
              <span className="col-span-1 text-center"></span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
              {cartItems.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Nenhum item adicionado ao carrinho.</p>
              ) : (
                cartItems.map((item, idx) => (
                  <div key={idx} className="px-4 py-2.5 text-xs grid grid-cols-12 items-center hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <span className="col-span-6 font-semibold text-slate-800 dark:text-slate-100">{item.service_name}</span>
                    <span className="col-span-3 text-slate-500">{item.prof_name}</span>
                    <span className="col-span-2 text-right font-bold text-slate-800 dark:text-slate-100">R$ {parseFloat(item.price).toFixed(2)}</span>
                    <button onClick={() => handleRemoveCartItem(idx)} className="col-span-1 text-center text-rose-500 hover:text-rose-700 font-bold">×</button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Forma de Pagamento
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'pix', label: 'PIX', icon: QrCode },
                { id: 'cartao_credito', label: 'Crédito', icon: CreditCard },
                { id: 'cartao_debito', label: 'Débito', icon: CreditCard },
                { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
                { id: 'voucher', label: 'Voucher', icon: Ticket }
              ].map(m => {
                const Icon = m.icon;
                const active = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                      active 
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calculations & Discount / Change */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">R$ {subtotal.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Desconto (R$):</span>
              <input
                type="number"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-24 px-2 py-1 text-right text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            {paymentMethod === 'dinheiro' && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Valor Entregue pelo Cliente:</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amountGiven}
                  onChange={(e) => setAmountGiven(e.target.value)}
                  className="w-24 px-2 py-1 text-right text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            )}

            {paymentMethod === 'dinheiro' && changeDue > 0 && (
              <div className="flex justify-between font-bold text-amber-600 dark:text-amber-400 pt-1">
                <span>Troco a Devolver:</span>
                <span>R$ {changeDue.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 text-sm">
              <span className="font-bold text-slate-800 dark:text-slate-100">Total a Pagar:</span>
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                R$ {totalToPay.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={handleFinalizeCheckout}
            disabled={isProcessing || cartItems.length === 0}
            className="w-full py-3 rounded-2xl font-extrabold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>{isProcessing ? 'Processando Venda...' : 'Finalizar Venda & Emitir Comprovante'}</span>
          </button>
        </div>

        {/* PDV Right: Caixa Movements & Receipt Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Receipt Modal / Alert on Success */}
          {checkoutSuccess && (
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>Venda Registrada com Sucesso!</span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-mono space-y-1">
                <p className="font-bold text-center border-b pb-1 text-slate-700 dark:text-slate-200">STUDIO BELLAGESTÃO • COMPROVANTE</p>
                <p>Transação: #{checkoutSuccess.transaction_id}</p>
                <p>Cliente: {checkoutSuccess.clientName}</p>
                <p>Forma: {checkoutSuccess.paymentMethod.toUpperCase()}</p>
                <p className="font-bold text-emerald-600 text-sm pt-1">Total: R$ {checkoutSuccess.total.toFixed(2)}</p>
              </div>

              <button
                onClick={() => setCheckoutSuccess(null)}
                className="w-full py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Novo Recebimento
              </button>
            </div>
          )}

          {/* Resumo por Forma de Pagamento no Caixa Atual */}
          <div className="glass-panel p-5 space-y-3">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-salon-500" />
              Recebimentos do Caixa Atual
            </h4>

            {(!cashData?.summaryByMethod || cashData.summaryByMethod.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-4">Nenhuma venda registrada nesta sessão de caixa.</p>
            ) : (
              <div className="space-y-1.5">
                {cashData.summaryByMethod.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                    <span className="font-medium capitalize text-slate-600 dark:text-slate-300">{m.payment_method?.replace('_', ' ')}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">R$ {m.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Histórico das Últimas Movimentações */}
          <div className="glass-panel p-5 space-y-3">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-salon-500" />
              Movimentações Recentes da Gaveta
            </h4>

            {(!cashData?.movements || cashData.movements.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-4">Sem movimentações no momento.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {cashData.movements.map((mov) => (
                  <div key={mov.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{mov.description}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{mov.type} • {mov.created_at?.split(' ')[1] || ''}</p>
                    </div>
                    <span className={`font-bold ${mov.type === 'sangria' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {mov.type === 'sangria' ? '-' : '+'} R$ {mov.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
