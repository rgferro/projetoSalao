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
  HardDrive
} from 'lucide-react';
import { api } from '../services/api';

export default function BackupSettings() {
  const [backups, setBackups] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Restore file
  const [restoreFile, setRestoreFile] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bData, sData] = await Promise.all([
        api.getBackups(),
        api.getSettings()
      ]);
      setBackups(bData);
      setSettings(sData);
    } catch (err) {
      console.error('Erro ao carregar configurações/backup:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateLocalBackup = async () => {
    try {
      setActionMsg('Criando cópia compactada do banco SQLite...');
      const res = await api.createLocalBackup();
      setActionMsg(`Backup local criado com sucesso: ${res.backup.filename}`);
      loadData();
      setTimeout(() => setActionMsg(''), 5000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSyncGoogleDrive = async () => {
    try {
      setIsSyncing(true);
      setActionMsg('Sincronizando cópia de segurança na nuvem...');
      const res = await api.syncGDrive();
      setActionMsg(res.message);
      loadData();
      setTimeout(() => setActionMsg(''), 5000);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestoreSubmit = async (e) => {
    e.preventDefault();
    if (!restoreFile) {
      alert('Selecione um arquivo de backup (.db ou .zip).');
      return;
    }
    if (!window.confirm('ATENÇÃO: A restauração substituirá os dados atuais pelo arquivo selecionado. Deseja continuar?')) {
      return;
    }

    try {
      setIsRestoring(true);
      const formData = new FormData();
      formData.append('backupFile', restoreFile);
      const res = await api.restoreBackup(formData);
      alert(res.message);
      setRestoreFile(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsRestoring(false);
    }
  };

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
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <CloudUpload className="w-5 h-5 text-emerald-600" />
            Backup Automático na Nuvem & Segurança
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Seus dados são salvos e protegidos de forma 100% automática, sem necessidade de configurações técnicas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncGoogleDrive}
            disabled={isSyncing}
            className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition active:scale-95"
          >
            <CloudUpload className="w-4 h-4" />
            <span>{isSyncing ? 'Sincronizando Nuvem...' : 'Sincronizar Nuvem Agora'}</span>
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-2xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Main Grid: Auto Cloud Status & Salon Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Zero-Friction Cloud Backup Card */}
        <div className="space-y-6">
          
          {/* Card: Status da Nuvem 100% Automático */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl shadow-emerald-600/15 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Proteção 100% Ativa e Automática</span>
                </div>
                <h3 className="text-xl font-black tracking-tight pt-1">
                  Google Drive & Nuvem Conectada
                </h3>
              </div>

              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <CloudUpload className="w-6 h-6 text-white" />
              </div>
            </div>

            <p className="text-xs text-emerald-50 leading-relaxed">
              Você <strong>não precisa configurar senhas nem chaves de API</strong>. O sistema identifica a pasta de nuvem do seu computador e envia cópias de segurança compactadas automaticamente.
            </p>

            <div className="p-3.5 bg-black/15 backdrop-blur-md rounded-2xl space-y-2 text-xs border border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-emerald-100 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Rotina Diária:
                </span>
                <span className="font-bold">Todos os dias às 23:00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-emerald-100 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> No Fechamento de Caixa:
                </span>
                <span className="font-bold">Automático a cada encerramento</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-white/10">
                <span className="text-emerald-100">Último Backup na Nuvem:</span>
                <span className="font-bold text-yellow-200">
                  {backups?.lastCloudSync ? backups.lastCloudSync.created_at : 'Pronto para sincronizar'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={handleSyncGoogleDrive}
                disabled={isSyncing}
                className="flex-1 py-2.5 rounded-xl font-extrabold text-xs bg-white text-emerald-800 hover:bg-emerald-50 shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <CloudUpload className="w-4 h-4" />
                <span>{isSyncing ? 'Sincronizando...' : 'Fazer Backup na Nuvem Agora'}</span>
              </button>

              <button
                onClick={handleCreateLocalBackup}
                className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-emerald-800/60 hover:bg-emerald-800 border border-white/20 text-white transition flex items-center gap-1"
              >
                <FolderArchive className="w-4 h-4" />
                <span>Gerar .ZIP Local</span>
              </button>
            </div>
          </div>

          {/* Card: Restauração de Dados Simples */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">Restaurar Cópia de Segurança</h3>
                <p className="text-xs text-slate-400">Trocou de computador ou deseja voltar dados de um backup anterior?</p>
              </div>
            </div>

            <form onSubmit={handleRestoreSubmit} className="space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Selecione o arquivo de backup (.db ou .zip):
                </label>
                <input
                  type="file"
                  accept=".db,.zip"
                  onChange={(e) => setRestoreFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-salon-50 file:text-salon-700 hover:file:bg-salon-100 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={isRestoring || !restoreFile}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 transition"
              >
                {isRestoring ? 'Restaurando...' : 'Restaurar Dados a Partir Deste Arquivo'}
              </button>
            </form>
          </div>

          {/* Backups Disponíveis */}
          <div className="glass-panel p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-salon-500" />
                Histórico de Cópias de Segurança
              </h3>
              <a
                href="/api/backup/download-raw-db"
                download
                className="text-xs font-semibold text-salon-600 hover:underline flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Baixar Banco Atual (.DB)
              </a>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(!backups?.files || backups.files.length === 0) ? (
                <p className="text-xs text-slate-400 py-4 text-center">Nenhum arquivo de backup gerado ainda.</p>
              ) : (
                backups.files.map((file, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{file.filename}</p>
                      <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>

                    <a
                      href={`/api/backup/download/${file.filename}`}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Baixar
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right: Dados do Salão & Identidade */}
        <div className="glass-panel p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-salon-100 dark:bg-salon-950/50 text-salon-600 dark:text-salon-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">Dados do Salão & Informações</h3>
              <p className="text-xs text-slate-400">Personalize o nome do estúdio, WhatsApp e chave PIX para os comprovantes</p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
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

            <div className="grid grid-cols-2 gap-3">
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Chave PIX do Estabelecimento</label>
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
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-bold text-sm text-white bg-salon-600 hover:bg-salon-700 shadow-md shadow-salon-600/20"
            >
              Salvar Dados do Salão
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
