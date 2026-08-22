import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { getTour } from '../lib/pageTours';

export default function PageTourModal({ tourKey, isOpen, onClose }) {
  const driverRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !tourKey) {
      if (driverRef.current) {
        try {
          driverRef.current.destroy();
        } catch (e) {
          // ignore
        }
        driverRef.current = null;
      }
      return;
    }

    const tour = getTour(tourKey);
    if (!tour || !tour.steps || tour.steps.length === 0) {
      onClose?.();
      return;
    }

    // Mapear passos garantindo foco nos seletores do DOM
    const steps = tour.steps.map((step) => {
      const el = step.element && document.querySelector(step.element) ? step.element : undefined;
      return {
        element: el,
        popover: {
          title: step.title,
          description: step.content,
          side: step.side || 'bottom',
          align: 'start',
        },
      };
    });

    const driverObj = driver({
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
      steps,
      onDestroyStarted: () => {
        try {
          driverObj.destroy();
        } catch (e) {
          // ignore
        }
        driverRef.current = null;
        onClose?.();
      },
      onCloseClick: () => {
        try {
          driverObj.destroy();
        } catch (e) {
          // ignore
        }
        driverRef.current = null;
        onClose?.();
      },
    });

    driverRef.current = driverObj;
    
    // Pequeno timeout para garantir que o DOM esteja renderizado
    const timer = setTimeout(() => {
      driverObj.drive();
    }, 50);

    return () => {
      clearTimeout(timer);
      if (driverRef.current) {
        try {
          driverRef.current.destroy();
        } catch (e) {
          // ignore
        }
        driverRef.current = null;
      }
    };
  }, [isOpen, tourKey]);

  return null;
}

