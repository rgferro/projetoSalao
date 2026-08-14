import React, { useState, useEffect } from 'react';
import { 
  MessageSquareText, 
  Wifi, 
  WifiOff, 
  Send, 
  Sparkles, 
  Edit3, 
  Check, 
  QrCode, 
  Clock, 
  Phone, 
  RefreshCw, 
  ListOrdered,
  Layers,
  FileCode
} from 'lucide-react';
import { api } from '../services/api';

export default function WhatsAppModule() {
  const [waStatus, setWaStatus] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('templates'); // 'templates', 'logs', 'direct-send', 'connection'
  const [loading, setLoading] = useState(true);

  // Template Editing
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateBody, setTemplateBody] = useState('');
  const [templateTitle, setTemplateTitle] = useState('');

  // Direct Send Form
  const [customPhone, setCustomPhone] = useState('');
  const [customMsg, setCustomMsg] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [st, tmps, lg] = await Promise.all([
        api.getWhatsAppStatus(),
        api.getWhatsAppTemplates(),
        api.getWhatsAppLogs()
      ]);
      setWaStatus(st);
      setTemplates(tmps);
      setLogs(lg);
    } catch (err) {
      console.error('Erro ao carregar módulo WhatsApp:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (newStatus) => {
    try {
      const res = await api.toggleWhatsAppStatus(newStatus);
      setWaStatus(res);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveTemplate = async (id) => {
    try {
      await api.updateWhatsAppTemplate(id, {
        title: templateTitle,
        body: templateBody
      });
      setEditingTemplate(null);
      loadData();
      alert('Modelo de mensagem atualizado com sucesso!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendCustom = async (e) => {
    e.preventDefault();
    try {
      const res = await api.sendCustomMsg({
        phone: customPhone,
        message: customMsg
      });
      if (res.waLink) window.open(res.waLink, '_blank');
      setSendSuccess('Mensagem disparada e registrada com sucesso!');
      setCustomMsg('');
      setCustomPhone('');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header Bar */}
      <div className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-emerald-600" />
            Automação de WhatsApp (Lembretes & Notificações)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Disparo local 100% gratuito de lembretes (24h e 2h antes), boas-vindas e aniversariantes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
            waStatus?.status === 'connected'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
          }`}>
            {waStatus?.status === 'connected' ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-amber-500" />}
            <span>{waStatus?.status === 'connected' ? 'Sessão Conectada / Ativa' : 'Sessão Desconectada'}</span>
          </div>

          <button
            onClick={() => handleToggleStatus(waStatus?.status === 'connected' ? 'disconnected' : 'connected')}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200"
          >
            {waStatus?.status === 'connected' ? 'Pausar Conexão' : 'Reconectar'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'templates' ? 'bg-white dark:bg-slate-900 text-salon-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          Modelos de Mensagens (Templates)
        </button>
        <button
          onClick={() => setActiveTab('direct-send')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'direct-send' ? 'bg-white dark:bg-slate-900 text-salon-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          Disparo Direto Manual
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'logs' ? 'bg-white dark:bg-slate-900 text-salon-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          Fila & Histórico de Disparos ({logs.length})
        </button>
      </div>

      {/* TAB 1: Modelos de Mensagens */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl text-xs space-y-1">
            <p className="font-bold text-emerald-800 dark:text-emerald-300">Variáveis Dinâmicas Disponíveis nos Modelos:</p>
            <p className="text-slate-600 dark:text-slate-400 font-mono">
              {'{cliente}'}, {'{data}'}, {'{horario}'}, {'{salao}'}, {'{servicos}'}, {'{profissional}'}, {'{endereco}'}, {'{link_confirmacao}'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tmpl) => {
              const isEditingThis = editingTemplate?.id === tmpl.id;
              return (
                <div key={tmpl.id} className="glass-panel p-5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {tmpl.code}
                      </span>
                      <button
                        onClick={() => {
                          if (isEditingThis) {
                            setEditingTemplate(null);
                          } else {
                            setEditingTemplate(tmpl);
                            setTemplateTitle(tmpl.title);
                            setTemplateBody(tmpl.body);
                          }
                        }}
                        className="text-xs text-salon-600 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isEditingThis ? 'Cancelar' : 'Editar Modelo'}</span>
                      </button>
                    </div>

                    {isEditingThis ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={templateTitle}
                          onChange={(e) => setTemplateTitle(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                        <textarea
                          rows={6}
                          value={templateBody}
                          onChange={(e) => setTemplateBody(e.target.value)}
                          className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                        <button
                          onClick={() => handleSaveTemplate(tmpl.id)}
                          className="w-full py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700"
                        >
                          Salvar Alterações
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{tmpl.title}</h3>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs whitespace-pre-wrap text-slate-700 dark:text-slate-300 font-sans">
                          {tmpl.body}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Disparo Direto Manual */}
      {activeTab === 'direct-send' && (
        <div className="glass-panel p-6 max-w-xl mx-auto space-y-4">
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">Disparar Mensagem Avulsa via WhatsApp</h3>
          
          {sendSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">
              {sendSuccess}
            </div>
          )}

          <form onSubmit={handleSendCustom} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">WhatsApp / Telefone com DDD *</label>
              <input
                type="text"
                required
                placeholder="(11) 98888-7777"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Texto da Mensagem *</label>
              <textarea
                rows={5}
                required
                placeholder="Digite a mensagem personalizada..."
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Enviar Mensagem via WhatsApp
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: Fila & Logs */}
      {activeTab === 'logs' && (
        <div className="glass-panel p-6 space-y-4">
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">Histórico de Mensagens Disparadas</h3>
          
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {logs.map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-100">{log.client_name || log.phone}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 uppercase text-slate-500">
                      {log.message_type}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold font-mono">
                      {log.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 line-clamp-1">{log.content}</p>
                </div>

                <span className="text-[10px] text-slate-400 shrink-0">
                  {log.created_at}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
