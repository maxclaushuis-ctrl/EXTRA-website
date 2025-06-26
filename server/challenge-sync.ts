/**
 * Challenge Synchronization Service
 * Automatically syncs challenge progress with planning system data
 */

import { getPlanningAPI, ChallengeProgressData } from './planning-api';
import type { User, UserChallengeProgress, Challenge } from '@shared/schema';

export interface ChallengeSyncResult {
  userId: number;
  challengeId: number;
  previousValue: number;
  newValue: number;
  stepsCompleted: number[];
  pointsAwarded: number;
  success: boolean;
  error?: string;
}

export class ChallengeSyncService {
  private storage: any;

  constructor(storage: any) {
    this.storage = storage;
  }

  /**
   * Sync challenge progress for a specific user
   */
  async syncUserChallenges(user: User): Promise<ChallengeSyncResult[]> {
    const results: ChallengeSyncResult[] = [];

    if (!user.apiId) {
      console.warn(`User ${user.id} has no apiId - skipping planning system sync`);
      return results;
    }

    const planningAPI = getPlanningAPI();
    if (!planningAPI) {
      console.warn('Planning system not configured - skipping sync');
      return results;
    }

    try {
      // Get challenge progress from planning system
      const progressData = await planningAPI.getChallengeProgress(user.apiId);
      
      // Get all active challenges
      const challenges = await this.storage.getChallenges();
      const activeChallenges = challenges.filter((c: Challenge) => c.status === 'active');

      // Sync each challenge type
      for (const challenge of activeChallenges) {
        const result = await this.syncChallengeProgress(user, challenge, progressData);
        results.push(result);
      }

    } catch (error) {
      console.error(`Error syncing challenges for user ${user.id}:`, error);
      
      // Return error results for all challenges
      const challenges = await this.storage.getChallenges();
      for (const challenge of challenges) {
        results.push({
          userId: user.id,
          challengeId: challenge.id,
          previousValue: 0,
          newValue: 0,
          stepsCompleted: [],
          pointsAwarded: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Sync progress for a specific challenge
   */
  private async syncChallengeProgress(
    user: User, 
    challenge: Challenge, 
    progressData: ChallengeProgressData
  ): Promise<ChallengeSyncResult> {
    
    const result: ChallengeSyncResult = {
      userId: user.id,
      challengeId: challenge.id,
      previousValue: 0,
      newValue: 0,
      stepsCompleted: [],
      pointsAwarded: 0,
      success: false
    };

    try {
      // Get current progress from database
      let userProgress = await this.storage.getUserChallengeProgress(user.id, challenge.id);
      
      if (!userProgress) {
        // Create new progress record
        userProgress = await this.storage.createUserChallengeProgress({
          userId: user.id,
          challengeId: challenge.id,
          currentValue: 0,
          completedSteps: [],
          planningSystemData: progressData
        });
      }

      result.previousValue = userProgress.currentValue;

      // Determine new value based on challenge category
      let newValue = 0;
      switch (challenge.category) {
        case 'shifts':
        case 'diensten':
          newValue = progressData.shiftsCompleted;
          break;
        case 'lastminute':
        case 'last-minute':
          newValue = progressData.lastMinuteShifts;
          break;
        case 'referrals':
        case 'vrienden':
          newValue = progressData.referralsCount;
          break;
        case 'social':
        case 'stories':
          newValue = progressData.socialShares;
          break;
        default:
          console.warn(`Unknown challenge category: ${challenge.category}`);
          return result;
      }

      result.newValue = newValue;

      // Check if value actually changed
      if (newValue === result.previousValue) {
        result.success = true;
        return result;
      }

      // Get challenge steps to check for completions
      const steps = await this.storage.getChallengeSteps(challenge.id);
      const sortedSteps = steps.sort((a: any, b: any) => a.stepNumber - b.stepNumber);
      
      // Determine newly completed steps
      const previousCompletedSteps = userProgress.completedSteps || [];
      const newCompletedSteps = [];
      let pointsAwarded = 0;

      for (const step of sortedSteps) {
        if (newValue >= step.targetValue && !previousCompletedSteps.includes(step.id)) {
          newCompletedSteps.push(step.id);
          pointsAwarded += step.pointsReward;
        }
      }

      result.stepsCompleted = newCompletedSteps;
      result.pointsAwarded = pointsAwarded;

      // Update user progress
      const allCompletedSteps = [...previousCompletedSteps, ...newCompletedSteps];
      await this.storage.updateUserChallengeProgress(userProgress.id, {
        currentValue: newValue,
        completedSteps: allCompletedSteps,
        lastSyncedAt: new Date(),
        planningSystemData: progressData
      });

      // Award points if any steps were completed
      if (pointsAwarded > 0) {
        await this.awardChallengePoints(user, challenge, newCompletedSteps, pointsAwarded);
      }

      result.success = true;

    } catch (error) {
      console.error(`Error syncing challenge ${challenge.id} for user ${user.id}:`, error);
      result.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return result;
  }

  /**
   * Award points for completed challenge steps
   */
  private async awardChallengePoints(
    user: User, 
    challenge: Challenge, 
    completedSteps: number[], 
    totalPoints: number
  ): Promise<void> {
    
    try {
      // Add points to user's total
      await this.storage.updateUserPoints(user.id, user.points + totalPoints);

      // Create point transaction record
      await this.storage.createPointTransaction({
        userId: user.id,
        type: 'earned',
        amount: totalPoints,
        description: `Challenge "${challenge.title}" - ${completedSteps.length} stap(pen) voltooid`,
        source: 'challenge_completion',
        metadata: {
          challengeId: challenge.id,
          challengeTitle: challenge.title,
          completedSteps: completedSteps,
          autoSynced: true,
          syncTimestamp: new Date().toISOString()
        }
      });

      console.log(`Awarded ${totalPoints} points to user ${user.id} for challenge "${challenge.title}"`);

    } catch (error) {
      console.error(`Error awarding points for challenge completion:`, error);
      throw error;
    }
  }

  /**
   * Sync all users' challenges (bulk operation)
   */
  async syncAllUserChallenges(): Promise<{ 
    totalUsers: number; 
    successfulSyncs: number; 
    errors: number; 
    results: ChallengeSyncResult[] 
  }> {
    
    const users = await this.storage.getUsers();
    const allResults: ChallengeSyncResult[] = [];
    let successfulSyncs = 0;
    let errors = 0;

    console.log(`Starting challenge sync for ${users.length} users...`);

    for (const user of users) {
      try {
        const userResults = await this.syncUserChallenges(user);
        allResults.push(...userResults);
        
        const userSuccess = userResults.every(r => r.success);
        if (userSuccess) {
          successfulSyncs++;
        } else {
          errors++;
        }

      } catch (error) {
        console.error(`Failed to sync challenges for user ${user.id}:`, error);
        errors++;
      }
    }

    console.log(`Challenge sync completed: ${successfulSyncs} successful, ${errors} errors`);

    return {
      totalUsers: users.length,
      successfulSyncs,
      errors,
      results: allResults
    };
  }

  /**
   * Get challenge progress summary for a user
   */
  async getUserChallengesSummary(userId: number): Promise<{
    challenges: Array<{
      challenge: Challenge;
      progress: UserChallengeProgress | null;
      steps: any[];
      completionPercentage: number;
      nextStepTarget?: number;
      nextStepReward?: number;
    }>;
  }> {
    
    const challenges = await this.storage.getChallenges();
    const activeChallenges = challenges.filter((c: Challenge) => c.status === 'active');
    
    const summary = [];

    for (const challenge of activeChallenges) {
      const progress = await this.storage.getUserChallengeProgress(userId, challenge.id);
      const steps = await this.storage.getChallengeSteps(challenge.id);
      const sortedSteps = steps.sort((a: any, b: any) => a.stepNumber - b.stepNumber);
      
      // Calculate completion percentage
      const currentValue = progress?.currentValue || 0;
      const maxTarget = Math.max(...sortedSteps.map((s: any) => s.targetValue));
      const completionPercentage = maxTarget > 0 ? Math.min((currentValue / maxTarget) * 100, 100) : 0;
      
      // Find next uncompleted step
      const completedSteps = progress?.completedSteps || [];
      const nextStep = sortedSteps.find((s: any) => !completedSteps.includes(s.id));
      
      summary.push({
        challenge,
        progress,
        steps: sortedSteps,
        completionPercentage,
        nextStepTarget: nextStep?.targetValue,
        nextStepReward: nextStep?.pointsReward
      });
    }

    return { challenges: summary };
  }
}

// Export singleton instance
let challengeSyncService: ChallengeSyncService | null = null;

export function initChallengeSyncService(storage: any): ChallengeSyncService {
  if (!challengeSyncService) {
    challengeSyncService = new ChallengeSyncService(storage);
  }
  return challengeSyncService;
}

export function getChallengeSyncService(): ChallengeSyncService | null {
  return challengeSyncService;
}