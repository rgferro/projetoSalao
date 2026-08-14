import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  User, 
  Scissors, 
  Send, 
  Lock, 
  Unlock, 
  Check, 
  X, 
  Trash2, 
  AlertCircle,
  Filter,
  DollarSign
} from 'lucide-react';
import { api } from '../services/api';

const STATUS_CONFIG = {
  agendado: { label: 'Agendado', bg: 'badge-agendado' },
  confirmado: { label: 'Confirmado', bg: 'badge-confirmado' },
  em_atendimento: { label: 'Em Atendimento', bg: 'badge-em_atendimento' },
  concluido: { label: 'Concluído', bg: 'badge-concluido' },
  cancelado: { label: 'Cancelado', bg: 'badge-cancelado' },
  no_show: { label: 'No-show / Falta', bg: 'badge-no_show' }
};

export default function Appointments({ onOpenNewAppointment, onOpenPDV }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('columns'); // 'columns' (por profissional), 'list', 'blocks'
  const [selectedProfId, setSelectedProfId] = useState('');
  
  const [appointments, setAppointments] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal de Bloqueio de Horário
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockProfId, setBlockProfId] = useState('');
  const [blockStartTime, setBlockStartTime] = useState('12:00');
  const [blockEndTime, setBlockEndTime] = useState('13:00');
  const [blockReason, setBlockReason] = useState('Almoço / Intervalo');

  const loadData = async () => {
    try {
      setLoading(true);
      const [appData, profData, blockData] = await Promise.all([
        api.getAppointments({ date: selectedDate, professional_id: selectedProfId }),
        api.getProfessionals(),
        api.getTimeBlocks(selectedDate)
      ]);
      setAppointments(appData);
      setProfessionals(profData);
      setTimeBlocks(blockData);
    } catch (err) {
      console.error('Erro ao carregar agenda:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedProfId]);

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleUpdateStatus = async (appId, status) => {
    try {
      await api.updateAppointmentStatus(appId, status);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteApp = async (appId) => {
    if (!window.confirm('Deseja realmente cancelar e excluir este agendamento?')) return;
    try {
      await api.deleteAppointment(appId);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendReminder = async (appId) => {
    try {
      const res = await api.sendReminder(appId, 'reminder_24h');
      if (res.waLink) window.open(res.waLink, '_blank');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateBlock = async (e) => {
    e.preventDefault();
    try {
      await api.createTimeBlock({
        professional_id: blockProfId ? parseInt(blockProfId) : null,
        date: selectedDate,
        start_time: blockStartTime,
        end_time: blockEndTime,
        reason: blockReason
      });
      setShowBlockModal(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteBlock = async (blockId) => {
    try {
      await api.deleteTimeBlock(blockId);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const dateObj = new Date(selectedDate + 'T00:00:00');
  const formattedDateTitle = new Intl.DateTimeFormat('pt-BR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }).format(dateObj);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header Bar: Date Selector & Actions */}
      <div className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Date Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => changeDate(-1)}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              title="Dia Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-salon-600"
            >
              Hoje
            </button>
            <button
              onClick={() => changeDate(1)}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              title="Próximo Dia"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          />

          <span className="hidden sm:inline-block text-xs font-bold capitalize text-slate-600 dark:text-slate-300">
            {formattedDateTitle}
          </span>
        </div>

        {/* View Mode & Filter */}
        <div className="flex flex-wrap items-center gap-2">
          
          <select
            value={selectedProfId}
            onChange={(e) => setSelectedProfId(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            <option value="">Todos os Profissionais</option>
            {professionals.map(p => (
              <option key={p.id} value={p.id}>{p.nickname || p.name}</option>
            ))}
          </select>

          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('columns')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${viewMode === 'columns' ? 'bg-white dark:bg-slate-900 text-salon-600 shadow-sm' : 'text-slate-500'}`}
            >
              Grade por Equipe
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-salon-600 shadow-sm' : 'text-slate-500'}`}
            >
              Lista Cronológica
            </button>
          </div>

          <button
            onClick={() => setShowBlockModal(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
            title="Bloquear intervalo de almoço ou folga"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Bloquear Horário</span>
          </button>

          <button
            onClick={onOpenNewAppointment}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl text-white bg-salon-600 hover:bg-salon-700 shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>

        </div>

      </div>

      {/* Main Schedule Container */}
      {viewMode === 'columns' ? (
        /* Visual Column Grid by Professional */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {professionals.map((prof) => {
            // Filtrar agendamentos que contêm serviços desse profissional hoje
            const profApps = appointments.filter(app => 
              app.items && app.items.some(item => item.professional_id === prof.id)
            );

            // Filtrar bloqueios desse profissional hoje
            const profBlocks = timeBlocks.filter(b => b.professional_id === prof.id || b.professional_id === null);

            return (
              <div key={prof.id} className="glass-panel p-4 space-y-3 min-h-[500px] flex flex-col">
                
                {/* Professional Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm"
                      style={{ backgroundColor: prof.color_hex || '#ec4899' }}
                    >
                      {(prof.nickname || prof.name).charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight">
                        {prof.nickname || prof.name}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {Array.isArray(prof.specialties) ? prof.specialties.join(', ') : 'Especialista'}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {profApps.length} atend.
                  </span>
                </div>

                {/* Blocks in Column */}
                {profBlocks.length > 0 && (
                  <div className="space-y-1.5">
                    {profBlocks.map(b => (
                      <div key={b.id} className="p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                          <Lock className="w-3 h-3 shrink-0" />
                          <span className="font-bold">{b.start_time} - {b.end_time}</span>
                          <span className="opacity-80 truncate">({b.reason})</span>
                        </div>
                        <button onClick={() => handleDeleteBlock(b.id)} className="text-amber-600 hover:text-amber-800">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Appointments in Column */}
                <div className="flex-1 space-y-3">
                  {profApps.length === 0 && profBlocks.length === 0 ? (
                    <div className="h-48 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      <Clock className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-1" />
                      <p className="text-xs text-slate-400">Sem horários para hoje</p>
                    </div>
                  ) : (
                    profApps.map((app) => {
                      const profItems = app.items.filter(i => i.professional_id === prof.id);
                      const startTime = profItems.length > 0 ? profItems[0].start_time : '09:00';
                      const endTime = profItems.length > 0 ? profItems[profItems.length - 1].end_time : '10:00';

                      return (
                        <div
                          key={app.id}
                          className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2.5 hover:shadow-md transition"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                              <Clock className="w-3.5 h-3.5 text-salon-500" />
                              <span>{startTime} - {endTime}</span>
                            </div>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${STATUS_CONFIG[app.status]?.bg || 'badge-agendado'}`}>
                              {STATUS_CONFIG[app.status]?.label || app.status}
                            </span>
                          </div>

                          <div>
                            <p className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              {app.client_name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {profItems.map(i => i.service_name).join(' + ')}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-700/60">
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              R$ {(app.total_price || 0).toFixed(2)}
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleSendReminder(app.id)}
                                className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                title="Enviar Lembrete via WhatsApp"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>

                              <select
                                value={app.status}
                                onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                                className="text-[10px] font-semibold py-0.5 px-1.5 rounded bg-slate-100 dark:bg-slate-700 border-none"
                              >
                                <option value="agendado">Agendado</option>
                                <option value="confirmado">Confirmado</option>
                                <option value="em_atendimento">Em Atendimento</option>
                                <option value="concluido">Concluído</option>
                                <option value="cancelado">Cancelado</option>
                                <option value="no_show">No-Show (Falta)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* Chronological List View */
        <div className="glass-panel p-6 space-y-4">
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
            Lista Completa de Agendamentos do Dia ({appointments.length})
          </h3>

          {appointments.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">Nenhum agendamento encontrado para esta data.</p>
          ) : (
            <div className="space-y-3">
              {appointments.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{app.client_name}</span>
                      <span className="text-xs text-slate-400">({app.client_phone})</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${STATUS_CONFIG[app.status]?.bg}`}>
                        {STATUS_CONFIG[app.status]?.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
                      {app.items?.map((it, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <strong>{it.start_time} - {it.end_time}</strong>: {it.service_name} com <em>{it.prof_nickname || it.prof_name}</em>
                        </span>
                      ))}
                    </div>

                    {app.notes && (
                      <p className="text-xs text-slate-400 italic">Obs: {app.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs text-slate-400">Total:</span>
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100">R$ {(app.total_price || 0).toFixed(2)}</p>
                    </div>

                    <button
                      onClick={() => handleSendReminder(app.id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" /> WhatsApp
                    </button>

                    <select
                      value={app.status}
                      onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                      className="text-xs font-semibold py-1.5 px-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="agendado">Agendado</option>
                      <option value="confirmado">Confirmado</option>
                      <option value="em_atendimento">Em Atendimento</option>
                      <option value="concluido">Concluído</option>
                      <option value="cancelado">Cancelado</option>
                      <option value="no_show">No-Show</option>
                    </select>

                    <button
                      onClick={() => handleDeleteApp(app.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Bloqueio de Horário */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">Bloquear Horário na Grade</h3>
              </div>
              <button onClick={() => setShowBlockModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBlock} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Profissional
                </label>
                <select
                  value={blockProfId}
                  onChange={(e) => setBlockProfId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="">Geral (Salão Inteiro)</option>
                  {professionals.map(p => (
                    <option key={p.id} value={p.id}>{p.nickname || p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Início</label>
                  <input
                    type="time"
                    required
                    value={blockStartTime}
                    onChange={(e) => setBlockStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Fim</label>
                  <input
                    type="time"
                    required
                    value={blockEndTime}
                    onChange={(e) => setBlockEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Motivo do Bloqueio
                </label>
                <input
                  type="text"
                  required
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Ex: Almoço, Curso, Folga..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-amber-600 hover:bg-amber-700"
                >
                  Salvar Bloqueio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
