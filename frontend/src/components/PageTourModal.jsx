import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  Compass,
  Play,
  RotateCcw
} from 'lucide-react';
import { getTour } from '../lib/pageTours';

export default function PageTourModal({ tourKey, isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  // Resetar passo ao abrir um novo tour
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen, tourKey]);

  // Suporte a teclas de atalho no teclado (Setas e ESC)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentStep((prev) => {
          const tour = getTour(tourKey);
          return Math.min((tour?.steps?.length || 1) - 1, prev + 1);
        });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentStep((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, tourKey]);

  if (!isOpen || !tourKey) return null;

  const tour = getTour(tourKey);
  if (!tour || !tour.steps || tour.steps.length === 0) return null;

  const totalSteps = tour.steps.length;
  const step = tour.steps[currentStep] || tour.steps[0];

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl border border-pink-200/80 dark:border-pink-900/50 space-y-5 animate-slideUp sm:animate-scaleIn max-h-[90vh] overflow-y-auto pb-safe"
        role="dialog"
        aria-modal="true"
      >
        {/* Header do Tour (com badge e botão fechar) */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-pink-500/20 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-pink-600 dark:text-pink-400">
                  Tour Guiado • Passo {currentStep + 1} de {totalSteps}
                </span>
                {step.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 text-[9px] font-black">
                    {step.badge}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug truncate">
                {tour.title}
              </h3>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Fechar Tour (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Progresso Interativa */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
            {tour.steps.map((_, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-full flex-1 transition-all duration-300 cursor-pointer border-r border-white dark:border-slate-900 last:border-0 ${
                  idx <= currentStep
                    ? 'bg-gradient-to-r from-pink-600 to-rose-500'
                    : 'bg-slate-200 dark:bg-slate-700 hover:bg-pink-300 dark:hover:bg-pink-800'
                }`}
                title={`Ir para passo ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Conteúdo do Passo do Tour */}
        <div className="bg-slate-50 dark:bg-slate-800/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
          <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white text-sm sm:text-base">
            <Sparkles className="w-4 h-4 text-pink-600 shrink-0" />
            <span>{step.title}</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {step.content}
          </p>
        </div>

        {/* Rodapé e Botões de Ação (100% responsivos para mobile) */}
        <div className="flex items-center justify-between pt-1 gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`px-3 sm:px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
              currentStep === 0
                ? 'opacity-40 cursor-not-allowed text-slate-400 bg-transparent'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentStep(0)}
              className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Reiniciar Tour"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-black text-xs shadow-lg shadow-pink-600/30 flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap"
            >
              {currentStep === totalSteps - 1 ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Concluir Tour</span>
                </>
              ) : (
                <>
                  <span>Próximo Passo</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
