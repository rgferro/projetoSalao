import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Link } from './Link';

export default function CookieBanner() {
  const [accepted, setAccepted] = useState(true);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('torque_cookies_accepted');
    if (!hasAccepted) {
      setAccepted(false);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('torque_cookies_accepted', 'true');
    setAccepted(true);
  };

  if (accepted) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-8 md:right-8 lg:max-w-3xl lg:mx-auto z-50 animate-fadeIn">
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 sm:p-5 rounded-2xl shadow-2xl border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-300 leading-relaxed">
            <p className="font-bold text-white mb-0.5">Privacidade e Proteção de Dados (LGPD)</p>
            <p>
              Utilizamos cookies essenciais e tratamos dados para autenticação segura e funcionamento do sistema.
              Para dúvidas, suporte ou exercer seus direitos de titular, acesse nosso{' '}
              <Link to="/contato" className="text-pink-400 font-bold underline hover:text-pink-300">
                Fale Conosco
              </Link>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto">
          <Link
            to="/privacidade"
            className="flex-1 sm:flex-initial text-center px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            Saber mais
          </Link>
          <button
            onClick={handleAccept}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-lg shadow-pink-600/30 transition flex items-center justify-center gap-1.5"
          >
            <span>Concordar e Fechar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
