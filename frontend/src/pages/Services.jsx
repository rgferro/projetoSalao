import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  Plus, 
  Clock, 
  DollarSign, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Filter,
  Check
} from 'lucide-react';
import { api } from '../services/api';

const CATEGORIES = [
  { id: 'all', label: 'Todos os Serviços' },
  { id: 'Cabelo', label: '💇 Cabelo & Química' },
  { id: 'Manicure', label: '💅 Manicure & Pedicure' },
  { id: 'Depilação', label: '✨ Depilação' },
  { id: 'Maquiagem', label: '💄 Maquiagem & Estética' }
];

export default function Services() {
  const [services, setServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    category: 'Cabelo',
    description: '',
    price: '',
    cost_price: '0.00',
    duration_min: 60,
    default_commission_type: 'percentage',
    default_commission_value: 50.0
  });

  const loadServices = async () => {
    try {
      setLoading(true);
      const cat = selectedCategory === 'all' ? undefined : selectedCategory;
      const data = await api.getServices(cat);
      setServices(data);
    } catch (err) {
      console.error('Erro ao carregar serviços:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [selectedCategory]);

  const handleSaveService = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        await api.updateService(editingService.id, serviceForm);
      } else {
        await api.createService(serviceForm);
      }
      setShowModal(false);
      setEditingService(null);
      loadServices();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Deseja realmente remover este serviço do catálogo?')) return;
    try {
      await api.deleteService(id);
      loadServices();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenEdit = (s) => {
    setEditingService(s);
    setServiceForm({
      name: s.name,
      category: s.category,
      description: s.description || '',
      price: s.price,
      cost_price: s.cost_price || '0.00',
      duration_min: s.duration_min || 60,
      default_commission_type: s.default_commission_type || 'percentage',
      default_commission_value: s.default_commission_value || 50.0
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Top Header */}
      <div className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Scissors className="w-5 h-5 text-salon-600" />
            Catálogo de Serviços & Tabela de Preços
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cadastre os procedimentos, durações, custos de insumos e comissão padrão
          </p>
        </div>

        <button
          onClick={() => {
            setEditingService(null);
            setServiceForm({
              name: '',
              category: 'Cabelo',
              description: '',
              price: '',
              cost_price: '0.00',
              duration_min: 60,
              default_commission_type: 'percentage',
              default_commission_value: 50.0
            });
            setShowModal(true);
          }}
          className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-salon-600 hover:bg-salon-700 shadow-md shadow-salon-600/20 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Novo Serviço
        </button>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              selectedCategory === cat.id ? 'bg-white dark:bg-slate-900 text-salon-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s) => (
          <div key={s.id} className="glass-panel p-5 space-y-3 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition">
            
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-salon-50 dark:bg-salon-950/60 text-salon-600 dark:text-salon-400 border border-salon-200 dark:border-salon-800/60">
                  {s.category}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(s)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteService(s.id)}
                    className="p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">{s.name}</h3>
              {s.description && <p className="text-xs text-slate-400">{s.description}</p>}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Duração:
                </span>
                <span className="font-semibold">{s.duration_min} minutos</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Comissão Padrão:</span>
                <span className="font-semibold text-salon-600">
                  {s.default_commission_type === 'percentage' ? `${s.default_commission_value}%` : `R$ ${s.default_commission_value.toFixed(2)}`}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1 text-sm font-extrabold text-slate-800 dark:text-slate-100">
                <span>Valor:</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-base">
                  R$ {s.price.toFixed(2)}
                </span>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Modal: Novo / Editar Serviço */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-4">
              {editingService ? 'Editar Serviço' : 'Novo Serviço no Catálogo'}
            </h3>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Nome do Procedimento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mechas Criativas / Morena Iluminada"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Categoria *</label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Cabelo">Cabelo</option>
                    <option value="Manicure">Manicure</option>
                    <option value="Depilação">Depilação</option>
                    <option value="Maquiagem">Maquiagem</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Duração (Minutos) *</label>
                  <input
                    type="number"
                    required
                    step="5"
                    value={serviceForm.duration_min}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration_min: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Preço Cobrado (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Custo Estimado de Insumos (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={serviceForm.cost_price}
                    onChange={(e) => setServiceForm({ ...serviceForm, cost_price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Comissão Padrão */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Comissão Padrão do Serviço</label>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={serviceForm.default_commission_type}
                    onChange={(e) => setServiceForm({ ...serviceForm, default_commission_type: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>

                  <input
                    type="number"
                    step="0.1"
                    required
                    value={serviceForm.default_commission_value}
                    onChange={(e) => setServiceForm({ ...serviceForm, default_commission_value: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold rounded-xl text-white bg-salon-600 hover:bg-salon-700"
                >
                  Salvar Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
