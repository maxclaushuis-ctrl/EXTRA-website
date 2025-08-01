/**
 * Role-based Point Allocation System
 * Different point rules for Chef, Horecamedewerker, and General employees
 */

import { storage } from "./storage";

export interface PointRule {
  basePoints: number;
  multiplier: number;
  bonusConditions: {
    overtime?: number;
    lastMinute?: number;
    punctuality?: number;
    weekendWork?: number;
    holidayWork?: number;
  };
}

// Define point rules for different employee types
export const ROLE_POINT_RULES: Record<string, PointRule> = {
  chef: {
    basePoints: 60, // Higher base points for chef role
    multiplier: 1.2,
    bonusConditions: {
      overtime: 25, // Extra points for overtime
      lastMinute: 35, // Higher last-minute bonus for chef
      punctuality: 15,
      weekendWork: 20,
      holidayWork: 30
    }
  },
  horecamedewerker: {
    basePoints: 40, // Standard points for service staff
    multiplier: 1.0,
    bonusConditions: {
      overtime: 20,
      lastMinute: 25,
      punctuality: 10,
      weekendWork: 15,
      holidayWork: 25
    }
  },
  general: {
    basePoints: 45, // General employee points
    multiplier: 1.1,
    bonusConditions: {
      overtime: 20,
      lastMinute: 25,
      punctuality: 10,
      weekendWork: 15,
      holidayWork: 25
    }
  }
};

export interface WorkSession {
  userId: number;
  shiftType: 'regular' | 'overtime' | 'lastminute';
  duration: number; // in hours
  date: Date;
  isPunctual: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  clientRating?: number; // 1-5 rating from client
  metadata?: any;
}

/**
 * Calculate points for a work session based on user role
 */
export async function calculateRoleBasedPoints(workSession: WorkSession): Promise<{
  totalPoints: number;
  breakdown: {
    basePoints: number;
    bonusPoints: number;
    multiplier: number;
    details: string[];
  };
}> {
  try {
    const user = await storage.getUser(workSession.userId);
    if (!user) {
      throw new Error(`User ${workSession.userId} not found`);
    }

    const employeeType = user.employeeType || 'general';
    const rules = ROLE_POINT_RULES[employeeType] || ROLE_POINT_RULES.general;
    
    let basePoints = rules.basePoints;
    let bonusPoints = 0;
    const details: string[] = [];

    // Base points calculation
    details.push(`Basis punten (${employeeType}): ${basePoints}`);

    // Shift type bonuses
    if (workSession.shiftType === 'overtime' && rules.bonusConditions.overtime) {
      bonusPoints += rules.bonusConditions.overtime;
      details.push(`Overwerk bonus: +${rules.bonusConditions.overtime}`);
    }

    if (workSession.shiftType === 'lastminute' && rules.bonusConditions.lastMinute) {
      bonusPoints += rules.bonusConditions.lastMinute;
      details.push(`Last-minute bonus: +${rules.bonusConditions.lastMinute}`);
    }

    // Punctuality bonus
    if (workSession.isPunctual && rules.bonusConditions.punctuality) {
      bonusPoints += rules.bonusConditions.punctuality;
      details.push(`Stiptheid bonus: +${rules.bonusConditions.punctuality}`);
    }

    // Weekend work bonus
    if (workSession.isWeekend && rules.bonusConditions.weekendWork) {
      bonusPoints += rules.bonusConditions.weekendWork;
      details.push(`Weekend bonus: +${rules.bonusConditions.weekendWork}`);
    }

    // Holiday work bonus
    if (workSession.isHoliday && rules.bonusConditions.holidayWork) {
      bonusPoints += rules.bonusConditions.holidayWork;
      details.push(`Feestdag bonus: +${rules.bonusConditions.holidayWork}`);
    }

    // Client rating bonus (for service roles)
    if (workSession.clientRating && workSession.clientRating >= 4) {
      const ratingBonus = (workSession.clientRating - 3) * 10; // 10 points per star above 3
      bonusPoints += ratingBonus;
      details.push(`Klantbeoordeling bonus (${workSession.clientRating}⭐): +${ratingBonus}`);
    }

    // Duration multiplier for longer shifts
    if (workSession.duration > 8) {
      const durationBonus = Math.floor((workSession.duration - 8) * 5); // 5 points per extra hour
      bonusPoints += durationBonus;
      details.push(`Lange dienst bonus (${workSession.duration}u): +${durationBonus}`);
    }

    // Apply role multiplier
    const totalBeforeMultiplier = basePoints + bonusPoints;
    const totalPoints = Math.round(totalBeforeMultiplier * rules.multiplier);
    
    if (rules.multiplier !== 1.0) {
      details.push(`Role multiplier (${employeeType}): ×${rules.multiplier}`);
    }

    return {
      totalPoints,
      breakdown: {
        basePoints,
        bonusPoints,
        multiplier: rules.multiplier,
        details
      }
    };
  } catch (error) {
    console.error('Error calculating role-based points:', error);
    throw error;
  }
}

/**
 * Award points for a work session and create transaction
 */
export async function awardWorkSessionPoints(workSession: WorkSession): Promise<{
  pointsAwarded: number;
  transactionId: number;
  breakdown: any;
}> {
  try {
    const calculation = await calculateRoleBasedPoints(workSession);
    
    // Create point transaction
    const transaction = await storage.createPointTransaction({
      userId: workSession.userId,
      amount: calculation.totalPoints,
      type: 'earned',
      description: `Punten verdiend voor ${workSession.shiftType} dienst`,
      source: 'planworks',
      metadata: {
        workSession,
        pointCalculation: calculation,
        timestamp: new Date().toISOString()
      }
    });

    // Update user points
    const user = await storage.getUser(workSession.userId);
    if (user) {
      await storage.updateUser(workSession.userId, {
        points: user.points + calculation.totalPoints,
        monthlyPoints: user.monthlyPoints + calculation.totalPoints,
        lastActivityDate: new Date()
      });
    }

    console.log(`✅ Awarded ${calculation.totalPoints} points to user ${workSession.userId} for work session`);
    
    return {
      pointsAwarded: calculation.totalPoints,
      transactionId: transaction.id,
      breakdown: calculation.breakdown
    };
  } catch (error) {
    console.error('Error awarding work session points:', error);
    throw error;
  }
}

/**
 * Get point rules for a specific employee type
 */
export function getEmployeeTypeRules(employeeType: string): PointRule {
  return ROLE_POINT_RULES[employeeType] || ROLE_POINT_RULES.general;
}

/**
 * Update employee type for a user
 */
export async function updateEmployeeType(userId: number, employeeType: string): Promise<void> {
  if (!ROLE_POINT_RULES[employeeType]) {
    throw new Error(`Invalid employee type: ${employeeType}`);
  }
  
  await storage.updateUser(userId, { employeeType });
  console.log(`Updated employee type for user ${userId} to ${employeeType}`);
}