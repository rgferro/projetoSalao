import React, { useState } from 'react';

const STORAGE_KEY = 'bella_cookie_preferences';

export default function CookieConsentBanner() {
  const [saved] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [isManaging, setIsManaging] = useState(false);
  const [preferences, setPreferences] = useState({ analytics: false, marketing: false });

  if (saved) return null;

  const save = (nextPreferences) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ necessary: true, ...nextPreferences, savedAt: new Date().toISOString() }));
    window.location.reload();
  };

  return (
    <aside
      className="fixed inset-x-3 bottom-20 md:bottom-6 z-[45] mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-4 sm:p-5 shadow-2xl transition-all"
      aria-label="Preferências de cookies"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex-1">
          <h2 className="text-sm font-black text-slate-900">Sua privacidade importa</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">Usamos cookies essenciais para segurança e funcionamento. Cookies analíticos e de marketing só são ativados com sua permissão.</p>
          {isManaging && (
            <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-700">
              <label className="flex items-center justify-between gap-3"><span><strong>Essenciais</strong><br />Segurança e sessão</span><input type="checkbox" checked disabled /></label>
              <label className="flex items-center justify-between gap-3"><span><strong>Analíticos</strong><br />Medição de uso</span><input type="checkbox" checked={preferences.analytics} onChange={(event) => setPreferences({ ...preferences, analytics: event.target.checked })} /></label>
              <label className="flex items-center justify-between gap-3"><span><strong>Marketing</strong><br />Comunicações e campanhas</span><input type="checkbox" checked={preferences.marketing} onChange={(event) => setPreferences({ ...preferences, marketing: event.target.checked })} /></label>
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:w-44 sm:flex-col">
          <button type="button" onClick={() => save({ analytics: true, marketing: true })} className="flex-1 bg-slate-900 px-3 py-2 text-xs font-bold text-white">Aceitar todos</button>
          <button type="button" onClick={() => save({ analytics: false, marketing: false })} className="flex-1 border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700">Recusar opcionais</button>
          <button type="button" onClick={() => isManaging ? save(preferences) : setIsManaging(true)} className="px-3 py-1 text-xs font-bold text-pink-700 underline">{isManaging ? 'Salvar preferências' : 'Gerenciar'}</button>
        </div>
      </div>
    </aside>
  );
}