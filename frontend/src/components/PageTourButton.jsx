import React from 'react';
import { Compass, Sparkles, Play } from 'lucide-react';

export default function PageTourButton({ onClick, label = 'Tour Interativo' }) {
  if (!onClick) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/50 dark:hover:bg-pink-900/60 border border-pink-200 dark:border-pink-800/80 text-pink-700 dark:text-pink-300 text-xs font-black transition-all shadow-2xs hover:scale-105 active:scale-95 shrink-0"
      title="Iniciar tour guiado passo a passo desta funcionalidade"
    >
      <Compass className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">Tour</span>
    </button>
  );
}
