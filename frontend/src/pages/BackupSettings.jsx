import React, { useState, useEffect } from 'react';
import { 
  CloudUpload, 
  RotateCcw, 
  Download, 
  Check, 
  AlertTriangle, 
  FolderArchive, 
  ShieldCheck, 
  Building, 
  Sparkles,
  Lock,
  Clock,
  HardDrive,
  ExternalLink,
  KeyRound,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Settings as SettingsIcon,
  RefreshCw,
  FileCheck,
  Eye,
  EyeOff,
  Database,
  Unplug
} from 'lucide-react';
import { api } from '../services/api';

export default function BackupSettings() {
  const [backups, setBackups] = useState(null);
  const [gdriveFiles, setGdriveFiles] = useState([]);
  const [gdriveStatus, setGdriveStatus] = useState({ isConnected: false, hasConfig: false, connectedEmail: '' });
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cloud'); // 'cloud' | 'local'
  
  // Ações e Mensagens
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);

  // Criptografia & Senha
  const [customPassphrase, setCustomPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Restore Modal State
  const [restoreModal, setRestoreModal] = useState({
    isOpen: false,
    fileId: null,
    filename: '',
    source: '', // 'gdrive' | 'local' | 'upload'
    isEncrypted: true
  });
  const [restorePassphrase, setRestorePassphrase] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);

  // Configuração OAuth Manual
  const [oauthConfig, setOauthConfig] = useState({ clientId: '', clientSecret: '', redirectUri: '' });
  const [authCodeInput, setAuthCodeInput] = useState('');
  const [isConnectingCode, setIsConnectingCode] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bData, sData, gdStatus] = await Promise.all([
        api.getBackups().catch(() => null),
        api.getSettings().catch(() => ({})),
        api.getGDriveStatus().catch(() => ({ isConnected: false, hasConfig: false }))
      ]);

      if (bData) {
        setBackups(bData);
        if (bData.gdriveStatus) setGdriveStatus(bData.gdriveStatus);
      }
      if (sData) setSettings(sData);
      if (gdStatus) setGdriveStatus(gdStatus);

      // Se conectado ao Drive, carregar lista remota
      if (gdStatus?.isConnected || bData?.gdriveStatus?.isConnected) {
        loadGDriveFiles();
      }
    } catch (err) {
      console.error('Erro ao carregar configurações/backup:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadGDriveFiles = async () => {
    try {
      const res = await api.getGDriveFiles();
      if (res && res.files) {
        setGdriveFiles(res.files);
      }
    } catch (e) {
      console.warn('Não foi possível listar arquivos do Google Drive:', e.message);
    }
  };

  useEffect(() => {
    loadData();

    // Listener para mensagem do Popup OAuth
    const handleAuthMessage = (event) => {
      if (event.data?.type === 'GDRIVE_AUTH_SUCCESS') {
        setActionMsg({
          type: 'success',
          text: `Google Drive conectado com sucesso! Conta: ${event.data.email || 'Autorizada'}`
        });
        loadData();
        setTimeout(() => setActionMsg({ type: '', text: '' }), 6000);
      } else if (event.data?.type === 'GDRIVE_AUTH_ERROR') {
        setActionMsg({
          type: 'error',
          text: `Erro ao autorizar Google Drive: ${event.data.error || 'Falha na autorização'}`
        });
        setTimeout(() => setActionMsg({ type: '', text: '' }), 6000);
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  // 1. Conectar ao Google Drive via OAuth Popup
  const handleConnectGoogleDrive = async () => {
    try {
      const res = await api.getGDriveAuthUrl();
      if (res?.authUrl) {
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        window.open(
          res.authUrl,
          'googleDriveAuth',
          `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`
        );
      }
    } catch (err) {
      // Se não houver Client ID configurado, abre o modal de configuração guiada
      setShowConfigModal(true);
      setActionMsg({
        type: 'error',
        text: 'Insira suas credenciais OAuth do Google Cloud ou utilize a chave da sua instalação.'
      });
    }
  };

  // Desconectar Google Drive
  const handleDisconnectGoogleDrive = async () => {
    if (!window.confirm('Deseja realmente desconectar sua conta do Google Drive? Os backups já salvos no seu Drive não serão excluídos.')) {
      return;
    }
    try {
      await api.disconnectGDrive();
      setActionMsg({ type: 'success', text: 'Conta do Google Drive desconectada.' });
      loadData();
      setGdriveFiles([]);
      setTimeout(() => setActionMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  // Salvar credenciais OAuth
  const handleSaveOAuthConfig = async (e) => {
    e.preventDefault();
    try {
      await api.saveGDriveConfig(oauthConfig);
      setShowConfigModal(false);
      setActionMsg({ type: 'success', text: 'Configurações do Google OAuth salvas com sucesso!' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Conectar com código manual
  const handleConnectWithCode = async (e) => {
    e.preventDefault();
    if (!authCodeInput.trim()) return;
    try {
      setIsConnectingCode(true);
      const res = await api.connectGDriveCode(authCodeInput.trim());
      setActionMsg({ type: 'success', text: res.message || 'Google Drive conectado!' });
      setAuthCodeInput('');
      setShowConfigModal(false);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsConnectingCode(false);
    }
  };

  // 2. Realizar Backup Criptografado no Google Drive
  const handleCloudBackupNow = async () => {
    try {
      setIsBackingUp(true);
      setBackupProgress(20);
      setActionMsg({ type: 'info', text: 'Compactando dados e aplicando criptografia AES-256-GCM...' });

      setTimeout(() => setBackupProgress(60), 400);

      const res = await api.uploadBackupToGDrive(customPassphrase || undefined);
      setBackupProgress(100);

      setActionMsg({
        type: 'success',
        text: `Backup criptografado enviado com sucesso para o Google Drive! (SHA-256: ${res.sha256.substring(0, 16)}...)`
      });

      loadData();
      loadGDriveFiles();
      setTimeout(() => {
        setActionMsg({ type: '', text: '' });
        setBackupProgress(0);
      }, 7000);
    } catch (err) {
      setActionMsg({ type: 'error', text: `Falha no backup: ${err.message}` });
      setBackupProgress(0);
    } finally {
      setIsBackingUp(false);
    }
  };

  // Realizar Backup Criptografado Local (.enc)
  const handleCreateLocalBackup = async () => {
    try {
      setIsBackingUp(true);
      setActionMsg({ type: 'info', text: 'Gerando arquivo de backup local com criptografia AES-256-GCM...' });
      const res = await api.createEncryptedBackup(customPassphrase || undefined);
      
      setActionMsg({
        type: 'success',
        text: `Arquivo seguro gerado: ${res.backup.filename} (${(res.backup.size / 1024).toFixed(1)} KB)`
      });

      loadData();
      setTimeout(() => setActionMsg({ type: '', text: '' }), 6000);
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message });
    } finally {
      setIsBackingUp(false);
    }
  };

  // 3. Abrir Modal de Restauração
  const openRestoreModal = (source, fileId, filename, isEncrypted = true) => {
    setRestoreModal({
      isOpen: true,
      fileId,
      filename,
      source,
      isEncrypted
    });
    setRestorePassphrase('');
  };

  // Executar Restauração a partir do Google Drive
  const handleExecuteRestoreFromGDrive = async (e) => {
    e.preventDefault();
    try {
      setIsRestoring(true);
      const res = await api.restoreFromGDrive(restoreModal.fileId, restorePassphrase || undefined);
      
      alert(`✅ Restauração Concluída!\n\n${res.message}\n\nPonto de segurança (rollback) gerado em: ${res.result?.rollbackPoint || 'backup automático'}`);
      setRestoreModal({ isOpen: false, fileId: null, filename: '', source: '', isEncrypted: true });
      loadData();
    } catch (err) {
      alert(`❌ Erro na Restauração:\n\n${err.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  // Executar Restauração via Upload de Arquivo Local
  const handleRestoreSubmit = async (e) => {
    e.preventDefault();
    if (!restoreFile) {
      alert('Selecione um arquivo de backup (.enc, .zip ou .db).');
      return;
    }

    if (!window.confirm('ATENÇÃO: A restauração substituirá os dados atuais pelo arquivo selecionado. Um ponto de rollback automático será gerado. Deseja continuar?')) {
      return;
    }

    try {
      setIsRestoring(true);
      const formData = new FormData();
      formData.append('backupFile', restoreFile);
      if (restorePassphrase) {
        formData.append('passphrase', restorePassphrase);
      }
      const res = await api.restoreBackup(formData);
      alert(`✅ Restauração Concluída!\n\n${res.message}\n\nChecksum SHA-256 verificado: ${res.result?.sha256?.substring(0, 16)}...`);
      setRestoreFile(null);
      setRestorePassphrase('');
      loadData();
    } catch (err) {
      alert(`❌ Falha na Restauração:\n\n${err.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  // Salvar Dados do Salão
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.updateSettings(settings);
      alert('Dados do salão atualizados com sucesso!');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* Header Principal */}
      <div className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-500/20 bg-gradient-to-r from-emerald-50/40 to-teal-50/20 dark:from-emerald-950/20 dark:to-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <CloudUpload className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Backup em Nuvem & Restauração Segura
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Proteção com Google Drive OAuth 2.0 e Criptografia Militar <span className="font-semibold text-emerald-600 dark:text-emerald-400">AES-256-GCM</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {gdriveStatus.isConnected ? (
            <button
              onClick={handleCloudBackupNow}
              disabled={isBackingUp}
              className="px-4 py-2.5 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
            >
              <CloudUpload className={`w-4 h-4 ${isBackingUp ? 'animate-bounce' : ''}`} />
              <span>{isBackingUp ? 'Enviando ao Drive...' : 'Fazer Backup no Google Drive Agora'}</span>
            </button>
          ) : (
            <button
              onClick={handleConnectGoogleDrive}
              className="px-4 py-2.5 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <CloudUpload className="w-4 h-4" />
              <span>Conectar Google Drive</span>
            </button>
          )}

          <button
            onClick={() => setShowConfigModal(true)}
            title="Configurações Avançadas do Google OAuth"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alertas e Mensagens de Status */}
      {actionMsg.text && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-fadeIn border ${
          actionMsg.type === 'error'
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-300'
            : actionMsg.type === 'info'
            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300'
            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
        }`}>
          {actionMsg.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          ) : actionMsg.type === 'info' ? (
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
          <div className="flex-1">
            <span>{actionMsg.text}</span>
            {backupProgress > 0 && backupProgress < 100 && (
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full transition-all duration-300" 
                  style={{ width: `${backupProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* DICA DE SEGURANÇA & PRIVACIDADE TOTAL */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 border border-emerald-500/30">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <span>Criptografia End-to-End Ativa (AES-256-GCM)</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">MILITAR</span>
            </h4>
            <p className="text-slate-300 text-[11px] leading-relaxed pt-0.5">
              Seus dados são <strong>criptografados antes de sair do sistema</strong>. Mesmo se a sua conta do Google Drive for comprometida, ninguém conseguirá ler ou extrair seus dados sem a chave.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Escopo Restrito
          </span>
        </div>
      </div>

      {/* PAINEL PASSO A PASSO (UX PARA LEIGOS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Passo 1 */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                1
              </span>
              {gdriveStatus.isConnected ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Conectado
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  Pendente
                </span>
              )}
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Conectar Google Drive
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              O sistema utiliza o protocolo oficial <strong>OAuth 2.0</strong> e acessa <strong>apenas a pasta de backup</strong>, mantendo o restante do seu Google Drive 100% privado.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            {gdriveStatus.isConnected ? (
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 truncate max-w-[170px]" title={gdriveStatus.connectedEmail}>
                  {gdriveStatus.connectedEmail || 'Conta Vinculada'}
                </div>
                <button
                  onClick={handleDisconnectGoogleDrive}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-bold transition flex items-center gap-1"
                  title="Desconectar Drive"
                >
                  <Unplug className="w-3.5 h-3.5" /> Desconectar
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectGoogleDrive}
                className="w-full py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 transition flex items-center justify-center gap-1.5"
              >
                <CloudUpload className="w-3.5 h-3.5" /> Conectar Conta Google
              </button>
            )}
          </div>
        </div>

        {/* Passo 2 */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                2
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                1-Clique
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Criar Cópia de Segurança
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              O sistema compacta clientes, agendamentos, caixa e financeiro, aplica <strong>AES-256-GCM</strong> e salva na nuvem e no computador.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <button
              onClick={handleCloudBackupNow}
              disabled={isBackingUp || !gdriveStatus.isConnected}
              className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-1.5"
            >
              <CloudUpload className="w-3.5 h-3.5" /> Fazer Backup Nuvem
            </button>
            <button
              onClick={handleCreateLocalBackup}
              disabled={isBackingUp}
              title="Gerar Cópia Criptografada (.enc) Local"
              className="p-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition"
            >
              <FolderArchive className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Passo 3 */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                3
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Anti-Perda
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Restaurar ou Baixar
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Trocou de computador ou deseja voltar dados? Escolha uma data na lista abaixo e clique em <strong>Restaurar</strong> ou <strong>Baixar</strong>.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <a
              href="/api/backup/download-raw-db"
              download
              className="w-full py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Baixar Banco Atual (.db)
            </a>
          </div>
        </div>

      </div>

      {/* GRID PRINCIPAL: GERENCIADOR DE BACKUPS & DADOS DO SALÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Lado Esquerdo (8 colunas): Lista de Backups com Abas (Google Drive vs Local) */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="glass-panel p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  Cópias de Segurança Disponíveis
                </h3>
                <p className="text-xs text-slate-400">
                  Histórico de pontos de restauração armazenados
                </p>
              </div>

              {/* Abas */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('cloud')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'cloud'
                      ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                  <span>No Google Drive ({gdriveFiles.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('local')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'local'
                      ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>No Computador ({backups?.files?.length || 0})</span>
                </button>
              </div>
            </div>

            {/* Conteúdo da Aba: Google Drive */}
            {activeTab === 'cloud' && (
              <div className="space-y-3">
                {!gdriveStatus.isConnected ? (
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
                    <CloudUpload className="w-10 h-10 text-slate-400 mx-auto" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">Google Drive Não Conectado</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto pt-1">
                        Conecte sua conta do Google Drive para que seus backups sejam salvos de forma segura e sincronizada na nuvem.
                      </p>
                    </div>
                    <button
                      onClick={handleConnectGoogleDrive}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 inline-flex items-center gap-1.5 transition active:scale-95"
                    >
                      <CloudUpload className="w-4 h-4" /> Conectar Google Drive Agora
                    </button>
                  </div>
                ) : gdriveFiles.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p>Conta conectada! Nenhum backup em nuvem gerado ainda.</p>
                    <button
                      onClick={handleCloudBackupNow}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700"
                    >
                      Gerar Primeiro Backup no Google Drive
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {gdriveFiles.map((file) => (
                      <div
                        key={file.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-emerald-500/40 transition"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                              {file.filename}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> AES-256-GCM
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400">
                            <span>Tamanho: {(file.size / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span>{new Date(file.createdAt).toLocaleString('pt-BR')}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={`/api/backup/gdrive/download/${file.id}`}
                            download
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" /> Baixar
                          </a>

                          <button
                            onClick={() => openRestoreModal('gdrive', file.id, file.filename, file.isEncrypted)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/20 transition flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" /> Restaurar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Conteúdo da Aba: Arquivos Locais */}
            {activeTab === 'local' && (
              <div className="space-y-3">
                {(!backups?.files || backups.files.length === 0) ? (
                  <p className="text-xs text-slate-400 py-6 text-center">Nenhum backup local encontrado.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {backups.files.map((file, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                              {file.filename}
                            </span>
                            {file.isEncrypted && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> AES-256
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400">
                            <span>{(file.size / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span>{new Date(file.mtime).toLocaleString('pt-BR')}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={`/api/backup/download/${file.filename}`}
                            download
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" /> Baixar
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card: Restauração Manual via Upload de Arquivo */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">Restaurar a partir de Arquivo Local (.enc / .db)</h3>
                <p className="text-xs text-slate-400">Envie um arquivo de backup do seu computador para recuperar todos os registros</p>
              </div>
            </div>

            <form onSubmit={handleRestoreSubmit} className="space-y-3">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Selecione o arquivo de backup (.enc, .db ou .zip):
                  </label>
                  <input
                    type="file"
                    accept=".enc,.db,.zip"
                    onChange={(e) => setRestoreFile(e.target.files[0])}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Chave/Senha de Descriptografia (Opcional se usou padrão seguro):
                  </label>
                  <input
                    type="password"
                    placeholder="Deixe em branco para usar a chave padrão"
                    value={restorePassphrase}
                    onChange={(e) => setRestorePassphrase(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isRestoring || !restoreFile}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                <RotateCcw className={`w-4 h-4 ${isRestoring ? 'animate-spin' : ''}`} />
                <span>{isRestoring ? 'Restaurando Banco de Dados...' : 'Restaurar Dados a Partir Deste Arquivo'}</span>
              </button>
            </form>
          </div>

        </div>

        {/* Lado Direito (4 colunas): Dados do Salão & Identidade */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="glass-panel p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-salon-100 dark:bg-salon-950/50 text-salon-600 dark:text-salon-400">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">Dados do Salão & PIX</h3>
                <p className="text-xs text-slate-400">Informações impressas em comprovantes</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Nome do Salão / Estúdio *</label>
                <input
                  type="text"
                  required
                  value={settings.salon_name || ''}
                  onChange={(e) => setSettings({ ...settings, salon_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">WhatsApp Principal</label>
                <input
                  type="text"
                  value={settings.salon_phone || ''}
                  onChange={(e) => setSettings({ ...settings, salon_phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">CNPJ / CPF</label>
                <input
                  type="text"
                  value={settings.salon_cnpj || ''}
                  onChange={(e) => setSettings({ ...settings, salon_cnpj: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Endereço Completo</label>
                <input
                  type="text"
                  value={settings.salon_address || ''}
                  onChange={(e) => setSettings({ ...settings, salon_address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Chave PIX</label>
                <input
                  type="text"
                  value={settings.pix_key || ''}
                  onChange={(e) => setSettings({ ...settings, pix_key: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Tipo da Chave PIX</label>
                <select
                  value={settings.pix_key_type || 'CNPJ'}
                  onChange={(e) => setSettings({ ...settings, pix_key_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                >
                  <option value="CNPJ">CNPJ</option>
                  <option value="CPF">CPF</option>
                  <option value="Telefone">Telefone</option>
                  <option value="Email">E-mail</option>
                  <option value="Aleatoria">Chave Aleatória</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-salon-600 hover:bg-salon-700 shadow-md shadow-salon-600/20 transition active:scale-95"
              >
                Salvar Dados do Salão
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* MODAL DE RESTAURAÇÃO DIRETA DO GOOGLE DRIVE */}
      {restoreModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">Restaurar Cópia do Google Drive</h3>
                <p className="text-xs text-slate-400 truncate max-w-[280px]">{restoreModal.filename}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" /> Ponto de Rollback Automático
              </p>
              <p className="text-[11px] text-amber-700/90 dark:text-amber-400">
                O sistema salvará uma cópia do banco atual antes da restauração. Em caso de necessidade, você pode voltar ao estado anterior.
              </p>
            </div>

            <form onSubmit={handleExecuteRestoreFromGDrive} className="space-y-4">
              {restoreModal.isEncrypted && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Senha/Chave de Descriptografia AES-256:
                  </label>
                  <input
                    type="password"
                    placeholder="Deixe em branco se utilizou a chave padrão"
                    value={restorePassphrase}
                    onChange={(e) => setRestorePassphrase(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestoreModal({ isOpen: false, fileId: null, filename: '', source: '', isEncrypted: true })}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isRestoring}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/20 disabled:opacity-50 transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                  <span>{isRestoring ? 'Restaurando...' : 'Confirmar e Restaurar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIGURAÇÃO OAUTH GOOGLE CLOUD */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <SettingsIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">Configuração Google OAuth 2.0</h3>
                  <p className="text-xs text-slate-400">Credenciais para integração com o Google Drive</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 text-xs text-blue-800 dark:text-blue-300 space-y-1">
              <p className="font-bold">Como obter suas credenciais gratuitas:</p>
              <ol className="list-decimal pl-4 space-y-0.5 text-[11px] text-blue-700/90 dark:text-blue-300">
                <li>Acesse o <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="underline font-bold">Google Cloud Console</a>.</li>
                <li>Crie um projeto e ative a <strong>Google Drive API</strong>.</li>
                <li>Crie uma credencial <strong>ID do cliente OAuth (Aplicativo da Web)</strong>.</li>
                <li>Adicione URI de redirecionamento autorizado: <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded font-mono text-[10px]">{window.location.origin}/api/backup/gdrive/callback</code></li>
              </ol>
            </div>

            <form onSubmit={handleSaveOAuthConfig} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Client ID do Google</label>
                <input
                  type="text"
                  placeholder="Ex: 123456789-abc.apps.googleusercontent.com"
                  value={oauthConfig.clientId}
                  onChange={(e) => setOauthConfig({ ...oauthConfig, clientId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Client Secret do Google</label>
                <input
                  type="password"
                  placeholder="GOCSPX-..."
                  value={oauthConfig.clientSecret}
                  onChange={(e) => setOauthConfig({ ...oauthConfig, clientSecret: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">URI de Redirecionamento (Callback)</label>
                <input
                  type="text"
                  placeholder={`${window.location.origin}/api/backup/gdrive/callback`}
                  value={oauthConfig.redirectUri || `${window.location.origin}/api/backup/gdrive/callback`}
                  onChange={(e) => setOauthConfig({ ...oauthConfig, redirectUri: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition"
                >
                  Salvar Credenciais
                </button>
              </div>
            </form>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-1.5">Ou conecte colando o Código de Autorização:</h4>
              <form onSubmit={handleConnectWithCode} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Cole o código retornado pelo Google..."
                  value={authCodeInput}
                  onChange={(e) => setAuthCodeInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono"
                />
                <button
                  type="submit"
                  disabled={isConnectingCode || !authCodeInput.trim()}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition disabled:opacity-50"
                >
                  {isConnectingCode ? 'Conectando...' : 'Conectar'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

