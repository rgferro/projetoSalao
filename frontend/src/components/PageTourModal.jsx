import React, { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2, X, Compass } from 'lucide-react';
import { PAGE_TOURS } from '../lib/pageTours';

export default function PageTourModal({ tourKey, isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen || !tourKey || !PAGE_TOURS[tourKey]) return null;

  const tour = PAGE_TOURS[tourKey];
  const totalSteps = tour.steps.length;
  const step = tour.steps[currentStep];

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
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-pink-200/80 space-y-6 animate-scaleIn">
        {/* Header do Tour */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-500 text-white flex items-center justify-center shadow-md shadow-pink-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-pink-600">
                Tour Interativo • Passo {currentStep + 1} de {totalSteps}
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {tour.title}
              </h3>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Progresso */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-pink-600 to-rose-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Conteúdo do Passo */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
            <Sparkles className="w-4 h-4 text-pink-600" />
            <span>{step.title}</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            {step.content}
          </p>
        </div>

        {/* Rodapé e Botões */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
              currentStep === 0
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-black text-xs shadow-lg shadow-pink-600/30 flex items-center gap-1.5 transition-all active:scale-95"
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
  );
}
