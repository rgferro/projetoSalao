import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function DynamicCpfFooter() {
  const [revealed, setRevealed] = useState(false);

  // Ofuscação para evitar web scrapers
  const getCpf = () => {
    if (revealed) {
      const parts = ['116', '658', '727', '48'];
      return `${parts[0]}.${parts[1]}.${parts[2]}-${parts[3]}`;
    }
    return 'XXX.XXX.XXX-XX';
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 text-[11px] text-slate-500 text-center">
      <span>Torque ERP © 2026 • Operado por Rafael Gielow —</span>
      <button
        type="button"
        onClick={() => setRevealed(!revealed)}
        className="inline-flex items-center gap-1 font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
        title="Clique para revelar/ocultar CPF do responsável legal"
      >
        <span>CPF: {getCpf()}</span>
        {revealed ? <EyeOff className="w-3 h-3 text-slate-400" /> : <Eye className="w-3 h-3 text-slate-400" />}
      </button>
      <span>• Juiz de Fora - MG</span>
    </div>
  );
}
