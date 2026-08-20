import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { validatePasswordStrength } from '../lib/validation';
import { getCsrfToken } from '../services/api';

export default function Invite({ onNavigateLogin }) {
  const [token, setToken] = useState('');
  const [inviteData, setInviteData] = useState(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (!t) {
      setErrorMsg('Token de convite não encontrado na URL.');
      setLoadingInvite(false);
      return;
    }
    setToken(t);

    fetch(`/api/auth/invite/${t}`)
      .then((res) => res.json())
      .then((data) => {
        setLoadingInvite(false);
        if (data.error) {
          setErrorMsg(data.error);
        } else {
          setInviteData(data.professional);
        }
      })
      .catch(() => {
        setLoadingInvite(false);
        setErrorMsg('Erro ao consultar convite.');
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      return setErrorMsg('As senhas digitadas não coincidem.');
    }

    const check = validatePasswordStrength(password);
    if (!check.isValid) {
      return setErrorMsg('A senha deve ter no mínimo 6 dígitos.');
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/auth/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': await getCsrfToken() },
        credentials: 'same-origin',
        body: JSON.stringify({
          token,
          password,
        }),
      });
      const data = await res.json();
      setSubmitting(false);

      if (!res.ok) {
        return setErrorMsg(data.error || 'Erro ao registrar senha.');
      }

      setSuccess(true);
    } catch (err) {
      setSubmitting(false);
      setErrorMsg('Erro de conexão ao salvar senha.');
    }
  };

  if (loadingInvite) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-pink-600 font-bold text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Verificando convite de equipe...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl border border-pink-100 shadow-xl p-6 sm:p-8 space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 to-purple-600 text-white flex items-center justify-center mx-auto text-xl font-bold shadow-md shadow-pink-500/20">
            ✨
          </div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">
            Ativação de Convite de Equipe
          </h1>
          {inviteData && (
            <p className="text-xs text-slate-500">
              Olá, <strong className="text-slate-800">{inviteData.name}</strong>! Crie sua senha de acesso para o salão{' '}
              <strong className="text-pink-600">{inviteData.salon_name || 'BelaGestão'}</strong>.
            </p>
          )}
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {success ? (
          <div className="text-center space-y-4 p-6 bg-emerald-50 rounded-2xl border border-emerald-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <div className="font-black text-sm text-emerald-950">
              Senha cadastrada com sucesso!
            </div>
            <p className="text-xs text-emerald-800">
              Sua conta foi ativada. Você já pode fazer login com seu e-mail e senha no sistema do salão.
            </p>
            <button
              onClick={onNavigateLogin}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
            >
              Ir para Tela de Login
            </button>
          </div>
        ) : (
          !errorMsg && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Crie sua Senha</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 dígitos"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Confirmar Senha</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="Repita sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-black text-xs shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ativar Minha Conta & Salvar'}
              </button>
            </form>
          )
        )}

      </div>
    </div>
  );
}
