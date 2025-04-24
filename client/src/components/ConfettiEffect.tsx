import { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiEffectProps {
  trigger: boolean;
  onComplete?: () => void;
  duration?: number;
  type?: 'reward' | 'birthday' | 'achievement' | 'default';
}

export function ConfettiEffect({
  trigger,
  onComplete,
  duration = 3000,
  type = 'default'
}: ConfettiEffectProps) {
  const fireConfetti = useCallback(() => {
    // Configuratie op basis van het type mijlpaal
    const config: confetti.Options = {
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    };

    // Aanpassen van de confetti op basis van het type
    switch (type) {
      case 'reward':
        // Goud en blauw voor beloningen
        config.colors = ['#FFD700', '#0078D7', '#FFFFFF'];
        config.particleCount = 150;
        config.gravity = 1.2;
        break;
      case 'birthday':
        // Feestelijke kleuren voor verjaardagen
        config.colors = ['#FF5252', '#FF4081', '#7C4DFF', '#536DFE', '#64FFDA'];
        config.particleCount = 200;
        config.gravity = 0.8;
        config.shapes = ['square', 'circle'];
        break;
      case 'achievement':
        // Goudgeel voor prestaties
        config.colors = ['#FFD700', '#FFC400', '#FFAB00'];
        config.particleCount = 120;
        config.shapes = ['star'];
        break;
      default:
        // Standaard EXTRA kleuren
        config.colors = ['#0078D7', '#00B0FF', '#FFFFFF'];
        break;
    }

    // Vuurwerk-achtig effect voor speciale gelegenheden
    if (type === 'achievement' || type === 'birthday') {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval: NodeJS.Timeout = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Confetti links en rechts schieten
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);
    } else {
      // Standaard confetti regen
      confetti(config);
    }

    // Callback uitvoeren na de animatie
    if (onComplete) {
      setTimeout(onComplete, duration);
    }
  }, [type, duration, onComplete]);

  useEffect(() => {
    if (trigger) {
      fireConfetti();
    }
  }, [trigger, fireConfetti]);

  return null; // Deze component rendert geen UI elementen
}