import React, { createContext, useContext, ReactNode } from 'react';
import { useMilestone, MilestoneType } from '@/hooks/use-milestone';
import { ConfettiEffect } from '@/components/ConfettiEffect';

// Context type
interface MilestoneContextType {
  checkPointsMilestone: (points: number) => boolean;
  checkRewardsMilestone: (rewards: number) => boolean;
  checkAnniversaryMilestone: (startDate: Date) => boolean;
  triggerCustomMilestone: (type: MilestoneType, message: string) => void;
  milestoneTriggered: boolean;
  currentMilestone: { type: MilestoneType; message: string } | null;
  resetMilestone: () => void;
}

// Context aanmaken
const MilestoneContext = createContext<MilestoneContextType | undefined>(undefined);

// Custom hook om de context te gebruiken
export const useMilestoneContext = () => {
  const context = useContext(MilestoneContext);
  if (context === undefined) {
    throw new Error('useMilestoneContext moet binnen een MilestoneProvider worden gebruikt');
  }
  return context;
};

// Provider component
interface MilestoneProviderProps {
  children: ReactNode;
  customMilestones?: {
    pointsThresholds?: number[];
    rewardsThresholds?: number[];
    daysActive?: number[];
  };
}

export const MilestoneProvider: React.FC<MilestoneProviderProps> = ({ children, customMilestones }) => {
  const milestone = useMilestone({
    customMilestones,
    autoToast: true,
  });

  // Bepaal het type confetti op basis van het mijlpaaltype
  const getConfettiType = () => {
    if (!milestone.currentMilestone) return 'default';
    
    switch (milestone.currentMilestone.type) {
      case 'points':
        return 'reward';
      case 'rewards':
        return 'reward';
      case 'birthday':
        return 'birthday';
      case 'anniversary':
        return 'achievement';
      case 'achievement':
        return 'achievement';
      default:
        return 'default';
    }
  };

  return (
    <MilestoneContext.Provider value={milestone}>
      {children}
      
      {/* Confetti effect toevoegen wanneer een mijlpaal wordt bereikt */}
      <ConfettiEffect 
        trigger={milestone.milestoneTriggered}
        type={getConfettiType() as 'reward' | 'birthday' | 'achievement' | 'default'}
        onComplete={milestone.resetMilestone}
      />
    </MilestoneContext.Provider>
  );
};