import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Calendar, 
  Sparkles, 
  Edit3, 
  Trash2, 
  Send, 
  FileText, 
  Star, 
  Gift, 
  Check, 
  X,
  History,
  Scissors
} from 'lucide-react';
import { api } from '../services/api';

export default function Clients({ onOpenNewClient }) {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [crmFilter, setCrmFilter] = useState('all'); // 'all', 'inactive'
  const [activeTab, setActiveTab] = useState('anamnese'); // 'anamnese', 'history', 'fidelity'
  const [anamneseCategory, setAnamneseCategory] = useState('hair'); // 'hair', 'waxing', 'nails', 'makeup'
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [loyaltyPointsToAdd, setLoyaltyPointsToAdd] = useState('');

  const filteredClients = clients.filter(c => {
    if (crmFilter === 'inactive') {
      // Clientes sem visita registrada ou última visita há mais de 15 dias
      return true; // Na lista completa destaca para reativação
    }
    return true;
  });

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await api.getClients(search);
      setClients(data);
      if (selectedClient) {
        const updated = await api.getClient(selectedClient.id);
        setSelectedClient(updated);
      }
    } catch (err) {
      console.error('Erro ao listar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [search]);

  const handleSelectClient = async (client) => {
    try {
      const full = await api.getClient(client.id);
      setSelectedClient(full);
      setEditFormData({
        name: full.name,
        phone: full.phone,
        email: full.email || '',
        birthdate: full.birthdate || '',
        cpf: full.cpf || '',
        address: full.address || '',
        notes: full.notes || '',
        anamnesis: { ...full.anamnesis }
      });
      setIsEditing(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.updateClient(selectedClient.id, editFormData);
      setIsEditing(false);
      loadClients();
      const updated = await api.getClient(selectedClient.id);
      setSelectedClient(updated);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteClient = async (id) => {
    if (!window.confirm('Deseja realmente remover esta cliente e todas as suas fichas técnicas?')) return;
    try {
      await api.deleteClient(id);
      setSelectedClient(null);
      loadClients();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLoyaltyOperation = async (operation) => {
    const pts = parseInt(loyaltyPointsToAdd);
    if (!pts || isNaN(pts)) return;
    try {
      await api.updateLoyalty(selectedClient.id, { points: pts, operation });
      setLoyaltyPointsToAdd('');
      const updated = await api.getClient(selectedClient.id);
      setSelectedClient(updated);
      loadClients();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDirectWhatsApp = async (phone) => {
    const msg = window.prompt(`Enviar mensagem de WhatsApp para ${phone}:`, 'Olá! Tudo bem? Passando para saber como você está e se precisa de algum atendimento no nosso salão.');
    if (!msg) return;
    try {
      await api.sendCustomMsg({ phone, message: msg, client_id: selectedClient?.id });
      alert('✅ Mensagem enviada com sucesso no WhatsApp em segundo plano!');
    } catch (err) {
      alert(`Erro no envio: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header Bar */}
      <div className="glass-panel p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-salon-600 shrink-0" />
            CRM de Clientes & Fichas de Anamnese
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cadastros completos, fórmulas químicas capilares, preferências e fidelidade
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, WhatsApp, CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-salon-500"
            />
          </div>

          <button
            onClick={onOpenNewClient}
            className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-salon-600 hover:bg-salon-700 shadow-md shadow-salon-600/20 flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> Novo Cliente (F4)
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Left: Client List (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-4 space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Clientes ({filteredClients.length})
            </span>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[10px] font-bold">
              <button
                onClick={() => setCrmFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${crmFilter === 'all' ? 'bg-white dark:bg-slate-700 text-pink-600 font-black shadow-xs' : 'text-slate-500'}`}
              >
                Todas
              </button>
              <button
                onClick={() => setCrmFilter('inactive')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${crmFilter === 'inactive' ? 'bg-pink-600 text-white font-black shadow-xs' : 'text-slate-500'}`}
                title="Clientes sem atendimento há mais de 15 dias"
              >
                <span>🔥 Reativação</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
            {clients.map((c) => {
              const isSelected = selectedClient?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectClient(c)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-salon-50/90 dark:bg-salon-950/40 border-salon-300 dark:border-salon-700 shadow-sm'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/70 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{c.name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-salon-500" /> {c.phone}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {c.loyalty_points || 0} pts
                      </span>
                      {c.last_appointment_date && (
                        <span className="text-[10px] text-slate-400">
                          Último: {c.last_appointment_date.split('-').reverse().join('/')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Client Details & Anamnesis / History (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6">
          {!selectedClient ? (
            <div className="h-[500px] flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Nenhum cliente selecionado</p>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Clique em uma cliente da lista ao lado para visualizar a Ficha de Anamnese técnica, histórico e pontos de fidelidade.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Client Profile Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-salon-600 to-rose-400 text-white font-bold text-lg flex items-center justify-center shadow-md">
                    {selectedClient.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 leading-tight">
                      {selectedClient.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{selectedClient.phone}</span>
                      <span>•</span>
                      <span>{selectedClient.email || 'Sem e-mail'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDirectWhatsApp(selectedClient.phone)}
                    className="p-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 hover:bg-emerald-100"
                    title="Conversar no WhatsApp"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditing ? 'Cancelar Edição' : 'Editar Ficha'}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClient(selectedClient.id)}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Excluir Cliente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sub-Tabs: Anamnese / Histórico / Fidelidade */}
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  onClick={() => setActiveTab('anamnese')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === 'anamnese' ? 'bg-white dark:bg-slate-900 text-salon-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Ficha de Anamnese Técnica
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === 'history' ? 'bg-white dark:bg-slate-900 text-salon-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Histórico de Atendimentos ({selectedClient.history?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('fidelity')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === 'fidelity' ? 'bg-white dark:bg-slate-900 text-salon-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Programa de Fidelidade
                </button>
              </div>

              {/* TAB 1: Ficha de Anamnese */}
              {activeTab === 'anamnese' && (
                <div className="space-y-4">
                  {/* Categorias da Anamnese */}
                  <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    {[
                      { id: 'hair', label: '💇 Cabelo & Química' },
                      { id: 'waxing', label: '✨ Depilação & Pele' },
                      { id: 'nails', label: '💅 Manicure & Unhas' },
                      { id: 'makeup', label: '💄 Maquiagem' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setAnamneseCategory(tab.id)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                          anamneseCategory === tab.id
                            ? 'bg-salon-50 dark:bg-salon-950/50 text-salon-600 dark:text-salon-400 font-bold'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleSaveEdit} className="space-y-4">
                      {anamneseCategory === 'hair' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Tipo de Cabelo / Curvatura</label>
                            <input
                              type="text"
                              value={editFormData.anamnesis?.hair_type || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, anamnesis: { ...editFormData.anamnesis, hair_type: e.target.value } })}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Fórmula de Coloração</label>
                            <input
                              type="text"
                              value={editFormData.anamnesis?.hair_color_formula || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, anamnesis: { ...editFormData.anamnesis, hair_color_formula: e.target.value } })}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Histórico Químico & Sensibilidades</label>
                            <textarea
                              rows={3}
                              value={editFormData.anamnesis?.hair_chemical_history || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, anamnesis: { ...editFormData.anamnesis, hair_chemical_history: e.target.value } })}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </div>
                        </div>
                      )}

                      {anamneseCategory === 'waxing' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Tipo de Pele / Fototipo</label>
                            <input
                              type="text"
                              value={editFormData.anamnesis?.waxing_skin_type || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, anamnesis: { ...editFormData.anamnesis, waxing_skin_type: e.target.value } })}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Método / Tipo de Cera</label>
                            <input
                              type="text"
                              value={editFormData.anamnesis?.waxing_preferred_method || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, anamnesis: { ...editFormData.anamnesis, waxing_preferred_method: e.target.value } })}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Alergias / Foliculite / Restrições</label>
                            <textarea
                              rows={3}
                              value={editFormData.anamnesis?.waxing_allergies || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, anamnesis: { ...editFormData.anamnesis, waxing_allergies: e.target.value } })}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </div>
                        </div>
                      )}

                      {anamneseCategory === 'nails' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Formato de Unha / Preferência</label>
                            <input
                              type="text"
                              value={editFormData.anamnesis?.nails_shape_preferences || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, anamnesis: { ...editFormData.anamnesis, nails_shape_preferences: e.target.value } })}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Alergia a Gel / Monômeros</label>
                            <input
                              type="text"
                              value={editFormData.anamnesis?.nails_gel_allergy || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, anamnesis: { ...editFormData.anamnesis, nails_gel_allergy: e.target.value } })}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </div>
                        </div>
                      )}

                      {anamneseCategory === 'makeup' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Tipo de Pele</label>
                            <input
                              type="text"
                              value={editFormData.anamnesis?.makeup_skin_type || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, anamnesis: { ...editFormData.anamnesis, makeup_skin_type: e.target.value } })}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Restrições & Fixação</label>
                            <input
                              type="text"
                              value={editFormData.anamnesis?.makeup_restrictions || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, anamnesis: { ...editFormData.anamnesis, makeup_restrictions: e.target.value } })}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-salon-600 hover:bg-salon-700"
                        >
                          Salvar Alterações
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Visualização Somente Leitura da Anamnese */
                    <div className="space-y-3">
                      {anamneseCategory === 'hair' && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3 text-xs">
                          <div>
                            <span className="font-bold text-slate-500">Tipo de Fio:</span>
                            <p className="text-slate-800 dark:text-slate-200 mt-0.5">{selectedClient.anamnesis?.hair_type || 'Não informado'}</p>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500">Fórmula de Coloração Cadastrada:</span>
                            <p className="text-slate-800 dark:text-slate-200 mt-0.5 font-mono font-semibold text-salon-600 dark:text-salon-400">
                              {selectedClient.anamnesis?.hair_color_formula || 'Sem fórmula registrada'}
                            </p>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500">Histórico Químico & Sensibilidades:</span>
                            <p className="text-slate-800 dark:text-slate-200 mt-0.5">{selectedClient.anamnesis?.hair_chemical_history || 'Nenhuma restrição registrada'}</p>
                          </div>
                        </div>
                      )}

                      {anamneseCategory === 'waxing' && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3 text-xs">
                          <div>
                            <span className="font-bold text-slate-500">Tipo de Pele / Fototipo:</span>
                            <p className="text-slate-800 dark:text-slate-200 mt-0.5">{selectedClient.anamnesis?.waxing_skin_type || 'Não informado'}</p>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500">Método / Cera Preferida:</span>
                            <p className="text-slate-800 dark:text-slate-200 mt-0.5">{selectedClient.anamnesis?.waxing_preferred_method || 'Cera tradicional'}</p>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500">Alergias ou Histórico de Foliculite:</span>
                            <p className="text-slate-800 dark:text-slate-200 mt-0.5">{selectedClient.anamnesis?.waxing_allergies || 'Sem histórico de alergia'}</p>
                          </div>
                        </div>
                      )}

                      {anamneseCategory === 'nails' && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3 text-xs">
                          <div>
                            <span className="font-bold text-slate-500">Formato & Cores Preferidas:</span>
                            <p className="text-slate-800 dark:text-slate-200 mt-0.5">{selectedClient.anamnesis?.nails_shape_preferences || 'Tradicional'}</p>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500">Alergias a Gel:</span>
                            <p className="text-slate-800 dark:text-slate-200 mt-0.5">{selectedClient.anamnesis?.nails_gel_allergy || 'Sem alergia relatada'}</p>
                          </div>
                        </div>
                      )}

                      {anamneseCategory === 'makeup' && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3 text-xs">
                          <div>
                            <span className="font-bold text-slate-500">Tipo de Pele / Acabamento:</span>
                            <p className="text-slate-800 dark:text-slate-200 mt-0.5">{selectedClient.anamnesis?.makeup_skin_type || 'Normal'}</p>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500">Restrições ou Alergias a Produtos:</span>
                            <p className="text-slate-800 dark:text-slate-200 mt-0.5">{selectedClient.anamnesis?.makeup_restrictions || 'Nenhuma'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Histórico de Atendimentos */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  {(!selectedClient.history || selectedClient.history.length === 0) ? (
                    <p className="text-xs text-slate-500 py-6 text-center">Nenhum atendimento realizado até o momento.</p>
                  ) : (
                    selectedClient.history.map((app) => (
                      <div key={app.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs flex justify-between items-center">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-100">{app.date.split('-').reverse().join('/')}</span>
                            <span className={`px-2 py-0.5 rounded-full uppercase font-bold text-[10px] badge-${app.status}`}>
                              {app.status}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300">💆 {app.services_list || 'Serviço'}</p>
                          <p className="text-[11px] text-slate-400">Profissional: {app.professionals_list}</p>
                        </div>
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                          R$ {(app.total_price || 0).toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: Fidelidade */}
              {activeTab === 'fidelity' && (
                <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-2xl border border-amber-300/40 dark:border-amber-700/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Saldo de Pontos</span>
                      <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{selectedClient.loyalty_points || 0} pts</p>
                    </div>
                    <Gift className="w-10 h-10 text-amber-500/80" />
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    A cada R$ 10,00 consumidos em serviços, a cliente acumula 1 ponto. 100 pontos valem R$ 20,00 em desconto ou serviços especiais.
                  </p>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="number"
                      placeholder="Qtd pontos..."
                      value={loyaltyPointsToAdd}
                      onChange={(e) => setLoyaltyPointsToAdd(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 w-32"
                    />
                    <button
                      onClick={() => handleLoyaltyOperation('add')}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      + Creditar
                    </button>
                    <button
                      onClick={() => handleLoyaltyOperation('redeem')}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200"
                    >
                      - Resgatar
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
