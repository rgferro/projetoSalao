import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  KeyRound,
  CheckCircle2,
  Eye,
  EyeOff,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login({ onNavigateRegister, onNavigateLanding, onLoginSuccess }) {
  const { login } = useAuth();

  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Estados da Recuperação de Senha ("Esqueci minha senha")
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState('request'); // 'request' | 'verify' | 'success'
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [authSessionData, setAuthSessionData] = useState(null);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg('');

    try {
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: loginValue.trim(), password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        return setErrorMsg(data.error || 'E-mail ou senha incorretos.');
      }

      login(data.user, data.token);
      if (onLoginSuccess) onLoginSuccess(data.user);
    } catch (err) {
      setLoading(false);
      setErrorMsg('Erro de conexão com o servidor do salão.');
    }
  };

  // Etapa 1: Solicitar Código de 6 Dígitos
  const handleRequestForgotCode = async (e) => {
    e.preventDefault();
    setForgotError('');

    if (!forgotEmail || !forgotEmail.includes('@')) {
      return setForgotError('Por favor, digite um e-mail válido.');
    }

    try {
      setForgotLoading(true);
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });

      const data = await res.json();
      setForgotLoading(false);

      if (!res.ok) {
        return setForgotError(data.error || 'Não foi possível localizar este e-mail.');
      }

      setForgotStep('verify');
    } catch (err) {
      setForgotLoading(false);
      setForgotError('Erro de conexão ao solicitar código de recuperação.');
    }
  };

  // Etapa 2: Validar Código e Redefinir Senha
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');

    if (forgotCode.trim().length !== 6) {
      return setForgotError('O código de confirmação deve ter exatamente 6 dígitos.');
    }

    if (newPassword.length < 6) {
      return setForgotError('A nova senha deve ter no mínimo 6 caracteres.');
    }

    if (newPassword !== confirmPassword) {
      return setForgotError('A confirmação de senha não coincide com a nova senha.');
    }

    try {
      setForgotLoading(true);
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          code: forgotCode.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      setForgotLoading(false);

      if (!res.ok) {
        return setForgotError(data.error || 'Falha ao redefinir a senha.');
      }

      if (data.token && data.user) {
        setAuthSessionData(data);
      }

      setForgotStep('success');
      setLoginValue(forgotEmail.trim());
      setPassword(newPassword);
    } catch (err) {
      setForgotLoading(false);
      setForgotError('Erro de conexão ao redefinir senha.');
    }
  };

  const handleEnterAfterReset = () => {
    setShowForgotModal(false);
    if (authSessionData && authSessionData.user && authSessionData.token) {
      login(authSessionData.user, authSessionData.token);
      if (onLoginSuccess) onLoginSuccess(authSessionData.user);
    } else {
      login({ email: loginValue }, 'temp_session');
      if (onLoginSuccess) onLoginSuccess({ email: loginValue });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans relative">
      
      {/* Botão Superior para Voltar à Página Inicial */}
      <div className="max-w-md w-full mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onNavigateLanding}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-pink-600 text-xs font-bold shadow-2xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a Página Inicial</span>
        </button>

        <span className="text-[11px] font-bold text-pink-600 uppercase tracking-wider">
          BelaGestão Studio
        </span>
      </div>

      <div className="max-w-md w-full bg-white rounded-3xl border border-pink-100 shadow-xl p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-500 to-purple-600 text-white text-2xl shadow-md shadow-pink-500/20 mb-2">
            ✨
          </div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">
            Acessar o BelaGestão Studio
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Digite seu e-mail e senha de acesso
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulário de Login (100% E-mail e Senha) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">E-mail Cadastrado</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="seu.email@exemplo.com"
                value={loginValue}
                onChange={(e) => setLoginValue(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Senha de Acesso</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(loginValue || '');
                  setShowForgotModal(true);
                  setForgotStep('request');
                  setForgotError('');
                }}
                className="text-[11px] font-bold text-pink-600 hover:text-pink-700 hover:underline transition-colors"
              >
                Esqueceu sua senha?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-black text-xs shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Entrar no Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 flex items-center justify-center gap-4">
          <span>Ainda não tem cadastro?</span>
          <button
            onClick={onNavigateRegister}
            className="text-pink-600 font-bold hover:underline"
          >
            Cadastre seu salão grátis
          </button>
        </div>

      </div>

      {/* MODAL DE RECUPERAÇÃO DE SENHA */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-pink-100 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-5 relative">
            
            {/* Botão Fechar */}
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho do Modal */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20 mb-1">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-slate-900">
                {forgotStep === 'success'
                  ? 'Senha Redefinida!'
                  : forgotStep === 'verify'
                  ? 'Criar Nova Senha'
                  : 'Recuperar Acesso'}
              </h2>
              <p className="text-xs text-slate-500">
                {forgotStep === 'success'
                  ? 'Sua nova senha foi gravada com sucesso.'
                  : forgotStep === 'verify'
                  ? `Digite o código de 6 dígitos enviado para ${forgotEmail}`
                  : 'Enviaremos um código de 6 dígitos para o seu e-mail.'}
              </p>
            </div>

            {forgotError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {/* ETAPA 1: Solicitar Código */}
            {forgotStep === 'request' && (
              <form onSubmit={handleRequestForgotCode} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Seu E-mail Cadastrado</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="seu.email@exemplo.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-black text-xs shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {forgotLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Enviar Código por E-mail</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ETAPA 2: Digitar Código e Nova Senha */}
            {forgotStep === 'verify' && (
              <form onSubmit={handleResetPassword} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Código de 6 Dígitos</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full py-3 text-center text-xl tracking-[8px] font-black rounded-xl border border-pink-200 bg-pink-50/40 text-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <p className="text-[10px] text-slate-400 text-center">
                    ⏱️ Código válido por 15 minutos. Confira também a caixa de spam.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nova Senha</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="No mínimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Confirmar Nova Senha</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="Repita a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium"
                    />
                  </div>
                </div>

                {/* Checklist de requisitos */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${newPassword.length >= 6 ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>Mínimo de 6 caracteres</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${newPassword && newPassword === confirmPassword ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>Senhas coincidem</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-black text-xs shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {forgotLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Salvar Nova Senha & Concluir</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotStep('request')}
                    className="text-[11px] font-bold text-slate-400 hover:text-slate-600 underline"
                  >
                    Reenviar ou trocar e-mail
                  </button>
                </div>
              </form>
            )}

            {/* ETAPA 3: Sucesso */}
            {forgotStep === 'success' && (
              <div className="text-center space-y-4 py-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Sua senha foi redefinida com segurança! Agora você já pode entrar com sua nova credencial.
                </p>
                <button
                  type="button"
                  onClick={handleEnterAfterReset}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-black text-xs shadow-lg shadow-pink-600/25 transition-all flex items-center justify-center gap-2"
                >
                  <span>Acessar Minha Conta Agora</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

