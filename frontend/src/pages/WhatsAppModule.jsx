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
  FileCode,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { api } from '../services/api';

export default function WhatsAppModule() {
  const [waStatus, setWaStatus] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('connection'); // 'connection', 'templates', 'direct-send', 'logs'
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  // Template Editing
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateBody, setTemplateBody] = useState('');
  const [templateTitle, setTemplateTitle] = useState('');

  // Direct Send Form
  const [customPhone, setCustomPhone] = useState('');
  const [customMsg, setCustomMsg] = useState('');
  const [isSending, setIsSending] = useState(false);

  const showToast = (text, type = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchStatus = async () => {
    try {
      const st = await api.getWhatsAppStatus();
      setWaStatus(st);
    } catch (err) {
      console.warn('Daemon WhatsApp conectando...', err);
    }
  };

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
      console.error('Erro ao carregar dados do WhatsApp:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Polling a cada 2.5s para monitorar QR Code e Conexão Multi-Device
    const interval = setInterval(fetchStatus, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    if (!window.confirm('Deseja desconectar a sessão do WhatsApp e gerar um novo QR Code?')) return;
    try {
      await api.logoutWhatsApp();
      showToast('Sessão desconectada. Gerando novo QR Code...');
      fetchStatus();
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
      showToast('Modelo de mensagem atualizado com sucesso!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendCustom = async (e) => {
    e.preventDefault();
    try {
      setIsSending(true);
      await api.sendCustomMsg({
        phone: customPhone,
        message: customMsg
      });
      showToast('✅ Mensagem enviada em segundo plano com sucesso!', 'success');
      setCustomMsg('');
      setCustomPhone('');
      const updatedLogs = await api.getWhatsAppLogs();
      setLogs(updatedLogs);
    } catch (err) {
      showToast(`❌ Erro no envio: ${err.message}`, 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-bold animate-bounce transition-all ${
          toastMsg.type === 'error' 
            ? 'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-200' 
            : 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200'
        }`}>
          {toastMsg.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-emerald-600" />
            WhatsApp Multi-Device Silencioso (Daemon Baileys)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Envio 100% automático e em segundo plano (sem abrir novas abas no navegador)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
            waStatus?.status === 'CONNECTED'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300'
              : waStatus?.status === 'QR_READY'
              ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 animate-pulse'
              : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
          }`}>
            {waStatus?.status === 'CONNECTED' ? (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>🟢 CONECTADO ({waStatus.user || 'Multi-Device'})</span>
              </>
            ) : waStatus?.status === 'QR_READY' ? (
              <>
                <QrCode className="w-4 h-4 text-amber-500" />
                <span>🟡 ESCANEAR QR CODE</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
                <span>INICIALIZANDO DAEMON...</span>
              </>
            )}
          </div>

          {waStatus?.status === 'CONNECTED' && (
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-bold rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Desconectar</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
        <button
          onClick={() => setActiveTab('connection')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'connection' ? 'bg-white dark:bg-slate-900 text-salon-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Conexão & QR Code</span>
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'templates' ? 'bg-white dark:bg-slate-900 text-salon-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Modelos de Mensagens ({templates.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('direct-send')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'direct-send' ? 'bg-white dark:bg-slate-900 text-salon-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Envio Rápido Avulso</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'logs' ? 'bg-white dark:bg-slate-900 text-salon-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>Histórico de Envios ({logs.length})</span>
        </button>
      </div>

      {/* TAB 1: Conexão & QR Code Oficial */}
      {activeTab === 'connection' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card do QR Code */}
          <div className="glass-panel p-6 flex flex-col items-center justify-center text-center space-y-4">
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-600" />
              Pareamento Multi-Device WhatsApp
            </h3>

            {waStatus?.status === 'CONNECTED' ? (
              <div className="p-8 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3 w-full max-w-sm">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="font-extrabold text-base text-emerald-800 dark:text-emerald-200">
                  Aparelho Conectado com Sucesso!
                </h4>
                <p className="text-xs font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                  {waStatus.user ? `+${waStatus.user}` : 'Multi-Device Ativo'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Todas as confirmações de agenda, lembretes e mensagens de aniversário agora são enviadas automaticamente em segundo plano.
                </p>
                <button
                  onClick={handleLogout}
                  className="w-full mt-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-white dark:bg-slate-800 hover:bg-rose-50 border border-rose-200 shadow-sm transition"
                >
                  Desconectar e Conectar Outro Número
                </button>
              </div>
            ) : (waStatus?.qr || waStatus?.qrCode || waStatus?.qrCodeUrl) ? (
              <div className="space-y-4">
                <div className="p-3 bg-white rounded-3xl shadow-xl border-4 border-emerald-500 inline-block">
                  <img
                    src={waStatus.qr || waStatus.qrCode || waStatus.qrCodeUrl}
                    alt="QR Code WhatsApp"
                    className="w-64 h-64 rounded-2xl object-contain mx-auto"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Aponte a câmera do WhatsApp para o QR Code acima
                  </p>
                  <p className="text-[11px] text-slate-400">
                    O código atualiza automaticamente a cada poucos segundos.
                  </p>
                </div>
                <button
                  onClick={fetchStatus}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mx-auto transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Atualizar QR Code</span>
                </button>
              </div>
            ) : (
              <div className="p-12 space-y-3">
                <RefreshCw className="w-10 h-10 text-slate-400 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-500">Iniciando daemon e gerando QR Code seguro...</p>
                <button
                  onClick={fetchStatus}
                  className="mt-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 inline-flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Verificar Novamente</span>
                </button>
              </div>
            )}
          </div>

          {/* Instruções Passo a Passo */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Como Conectar em 3 Passos Simples:
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">Abra o WhatsApp no seu Celular</p>
                  <p className="text-slate-500">No Android toque nos 3 pontinhos no topo. No iPhone toque em Configurações.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">Toque em "Aparelhos Conectados"</p>
                  <p className="text-slate-500">Selecione a opção <strong>"Conectar um Aparelho"</strong>.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">Escaneie o QR Code na Tela</p>
                  <p className="text-slate-500">Assim que a leitura for feita, a tela mudará imediatamente para 🟢 CONECTADO.</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> Vantagem Multi-Device Baileys:
              </p>
              <p className="text-[11px] leading-relaxed">
                As mensagens são disparadas direto pelo daemon local em milissegundos sem abrir abas do navegador e sem travar a tela da recepção.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Modelos de Mensagens */}
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
                          className="w-full py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition"
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

      {/* TAB 3: Disparo Direto Manual Silencioso */}
      {activeTab === 'direct-send' && (
        <div className="glass-panel p-6 max-w-xl mx-auto space-y-4">
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">Disparar Mensagem Avulsa via WhatsApp</h3>
          <p className="text-xs text-slate-500">A mensagem será enviada silenciosamente pelo número conectado.</p>

          <form onSubmit={handleSendCustom} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">WhatsApp / Telefone com DDD *</label>
              <input
                type="text"
                required
                placeholder="(11) 98888-7777"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Texto da Mensagem *</label>
              <textarea
                rows={5}
                required
                placeholder="Digite a mensagem..."
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Enviando em Segundo Plano...' : 'Enviar Mensagem Silenciosamente'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: Fila & Logs */}
      {activeTab === 'logs' && (
        <div className="glass-panel p-6 space-y-4">
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">Histórico de Mensagens Enviadas em Segundo Plano</h3>
          
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Nenhuma mensagem registrada ainda.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-100">{log.client_name || log.phone}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 uppercase text-slate-500">
                        {log.message_type}
                      </span>
                      <span className={`text-[10px] font-bold font-mono ${
                        log.status === 'enviado' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {log.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 line-clamp-1">{log.content}</p>
                    {log.error_message && (
                      <p className="text-[10px] text-rose-500 font-mono">{log.error_message}</p>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 shrink-0">
                    {log.created_at || log.sent_at}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
