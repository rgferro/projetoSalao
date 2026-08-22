import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

/**
 * Cria e configura uma instância otimizada do Driver.js
 * com padrão visual de Popover com Spotlight e suporte a botões em pílula
 */
export const createDriverTour = (customConfig = {}) => {
  return driver({
    animate: true,
    smoothScroll: true,
    allowClose: true,
    overlayColor: '#0f172a',
    overlayOpacity: 0.75,
    stagePadding: 8,
    stageRadius: 12,
    showProgress: true,
    progressText: '{{current}} of {{total}}',
    nextBtnText: 'Próximo',
    prevBtnText: 'Anterior',
    doneBtnText: 'Concluir',
    ...customConfig,
  });
};

/**
 * Inicia um tour guiado do Driver.js a partir de uma lista de passos
 */
export const startDriverTour = (steps = [], options = {}) => {
  if (!steps || steps.length === 0) return null;

  const driverInstance = createDriverTour({
    steps,
    ...options,
  });

  driverInstance.drive();
  return driverInstance;
};
