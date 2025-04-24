import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// Definieer verschillende typen mijlpalen
export type MilestoneType = 'points' | 'rewards' | 'birthday' | 'anniversary' | 'achievement';

// Configuratie voor verschillende mijlpalen
interface MilestoneConfig {
  pointsThresholds: number[];
  rewardsThresholds: number[];
  daysActive: number[];
}

// Standaard mijlpalen
const defaultMilestones: MilestoneConfig = {
  pointsThresholds: [100, 500, 1000, 5000, 10000],
  rewardsThresholds: [1, 5, 10, 25, 50],
  daysActive: [30, 90, 180, 365, 730], // 1 maand, 3 maanden, 6 maanden, 1 jaar, 2 jaar
};

interface MilestoneOptions {
  customMilestones?: Partial<MilestoneConfig>;
  autoToast?: boolean;
}

interface MilestoneResult {
  checkPointsMilestone: (points: number) => boolean;
  checkRewardsMilestone: (rewards: number) => boolean;
  checkAnniversaryMilestone: (startDate: Date) => boolean;
  triggerCustomMilestone: (type: MilestoneType, message: string) => void;
  milestoneTriggered: boolean;
  currentMilestone: { type: MilestoneType; message: string } | null;
  resetMilestone: () => void;
}

export function useMilestone(options: MilestoneOptions = {}): MilestoneResult {
  const { toast } = useToast();
  const [milestoneTriggered, setMilestoneTriggered] = useState(false);
  const [previousPointsValue, setPreviousPointsValue] = useState<number | null>(null);
  const [previousRewardsValue, setPreviousRewardsValue] = useState<number | null>(null);
  const [currentMilestone, setCurrentMilestone] = useState<{ type: MilestoneType; message: string } | null>(null);

  // Combineer standaard mijlpalen met aangepaste mijlpalen
  const milestones: MilestoneConfig = {
    ...defaultMilestones,
    ...options.customMilestones,
  };

  // Reset de mijlpaal status
  const resetMilestone = useCallback(() => {
    setMilestoneTriggered(false);
    setCurrentMilestone(null);
  }, []);

  // Trigger een mijlpaal en toon optioneel een toast
  const triggerMilestone = useCallback((type: MilestoneType, message: string) => {
    setMilestoneTriggered(true);
    setCurrentMilestone({ type, message });
    
    if (options.autoToast !== false) {
      toast({
        title: "Mijlpaal behaald! 🎉",
        description: message,
        duration: 5000,
      });
    }
    
    // Reset na 5 seconden
    setTimeout(() => {
      resetMilestone();
    }, 5000);
  }, [options.autoToast, resetMilestone, toast]);

  // Controleer of er een puntenmijlpaal is bereikt
  const checkPointsMilestone = useCallback((points: number): boolean => {
    if (previousPointsValue === null) {
      setPreviousPointsValue(points);
      return false;
    }

    // Zoek de eerste drempelwaarde die is overschreden
    const previousThreshold = milestones.pointsThresholds.find(t => previousPointsValue < t);
    const currentThreshold = milestones.pointsThresholds.find(t => points >= t);

    // Als er een nieuwe drempelwaarde is overschreden
    if (currentThreshold && (!previousThreshold || currentThreshold <= previousThreshold)) {
      setPreviousPointsValue(points);
      triggerMilestone('points', `Je hebt ${currentThreshold} punten behaald!`);
      return true;
    }

    setPreviousPointsValue(points);
    return false;
  }, [previousPointsValue, milestones.pointsThresholds, triggerMilestone]);

  // Controleer of er een beloningenmijlpaal is bereikt
  const checkRewardsMilestone = useCallback((rewards: number): boolean => {
    if (previousRewardsValue === null) {
      setPreviousRewardsValue(rewards);
      return false;
    }

    // Zoek de eerste drempelwaarde die is overschreden
    const previousThreshold = milestones.rewardsThresholds.find(t => previousRewardsValue < t);
    const currentThreshold = milestones.rewardsThresholds.find(t => rewards >= t);

    // Als er een nieuwe drempelwaarde is overschreden
    if (currentThreshold && (!previousThreshold || currentThreshold <= previousThreshold)) {
      setPreviousRewardsValue(rewards);
      triggerMilestone('rewards', `Je hebt ${currentThreshold} beloningen ingewisseld!`);
      return true;
    }

    setPreviousRewardsValue(rewards);
    return false;
  }, [previousRewardsValue, milestones.rewardsThresholds, triggerMilestone]);

  // Controleer of er een jubileummijlpaal is bereikt
  const checkAnniversaryMilestone = useCallback((startDate: Date): boolean => {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Zoek de eerste duur die is bereikt
    const milestone = milestones.daysActive.find(days => {
      // Check of het binnen 1 dag van de mijlpaal is 
      // (dit voorkomt meerdere trigger pogingen op dezelfde dag)
      return Math.abs(diffDays - days) <= 1;
    });

    if (milestone) {
      // Bereken jaren, maanden of dagen voor het bericht
      let message = '';
      if (milestone >= 365) {
        const years = Math.floor(milestone / 365);
        message = `Je bent al ${years} ${years === 1 ? 'jaar' : 'jaren'} actief bij EXTRA!`;
      } else if (milestone >= 30) {
        const months = Math.floor(milestone / 30);
        message = `Je bent al ${months} ${months === 1 ? 'maand' : 'maanden'} actief bij EXTRA!`;
      } else {
        message = `Je bent al ${milestone} dagen actief bij EXTRA!`;
      }
      
      triggerMilestone('anniversary', message);
      return true;
    }

    return false;
  }, [milestones.daysActive, triggerMilestone]);

  // Functie om een handmatige mijlpaal te triggeren
  const triggerCustomMilestone = useCallback((type: MilestoneType, message: string) => {
    triggerMilestone(type, message);
  }, [triggerMilestone]);

  return {
    checkPointsMilestone,
    checkRewardsMilestone,
    checkAnniversaryMilestone,
    triggerCustomMilestone,
    milestoneTriggered,
    currentMilestone,
    resetMilestone,
  };
}