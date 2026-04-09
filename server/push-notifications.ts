/**
 * Push Notification Service for Employee Motivation
 * Handles web push notifications for gamification features
 */

import webpush from 'web-push';
import { User } from '../shared/schema';

// Generate VAPID keys if not provided
function generateVapidKeys() {
  return webpush.generateVAPIDKeys();
}

// Configuration
let VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
let VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@extra.nl';

// Generate keys if not provided in environment
if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.log('VAPID keys niet gevonden in environment variables, genereren van nieuwe keys...');
  const vapidKeys = generateVapidKeys();
  VAPID_PUBLIC_KEY = vapidKeys.publicKey;
  VAPID_PRIVATE_KEY = vapidKeys.privateKey;
  
  console.log('VAPID keys gegenereerd:');
  console.log('Public Key:', VAPID_PUBLIC_KEY);
  console.log('Voeg deze toe aan je environment variables voor productie gebruik');
}

// Initialize web-push
webpush.setVapidDetails(
  VAPID_EMAIL,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export interface PushSubscription {
  userId: number;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: Date;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    type: 'achievement' | 'challenge' | 'leaderboard' | 'reward' | 'social' | 'candidate';
    action?: string;
    url?: string;
    points?: number;
    challengeId?: number;
    candidateId?: number;
  };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class PushNotificationService {
  private subscriptions: Map<number, PushSubscription[]> = new Map();

  /**
   * Load all subscriptions from DB into memory (call on server startup)
   */
  async loadFromDb(db: any, pushSubscriptionsTable: any) {
    try {
      const rows = await db.select().from(pushSubscriptionsTable);
      this.subscriptions.clear();
      for (const row of rows) {
        if (!this.subscriptions.has(row.userId)) {
          this.subscriptions.set(row.userId, []);
        }
        this.subscriptions.get(row.userId)!.push({
          userId: row.userId,
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth },
          createdAt: row.createdAt ?? new Date(),
        });
      }
      console.log(`Push subscriptions geladen uit DB: ${rows.length} abonnementen voor ${this.subscriptions.size} gebruikers`);
    } catch (err) {
      console.error('Fout bij laden push subscriptions uit DB:', err);
    }
  }

  /**
   * Subscribe user to push notifications
   */
  subscribe(userId: number, subscription: Omit<PushSubscription, 'userId' | 'createdAt'>) {
    if (!this.subscriptions.has(userId)) {
      this.subscriptions.set(userId, []);
    }
    
    const userSubscriptions = this.subscriptions.get(userId)!;

    // Prevent duplicate endpoints
    const alreadyExists = userSubscriptions.some(s => s.endpoint === subscription.endpoint);
    if (alreadyExists) {
      console.log(`Push subscription al aanwezig voor user ${userId}, overschrijven...`);
      this.unsubscribe(userId, subscription.endpoint);
      this.subscriptions.get(userId) || this.subscriptions.set(userId, []);
    }

    const newSubscription: PushSubscription = {
      userId,
      ...subscription,
      createdAt: new Date()
    };
    
    this.subscriptions.get(userId)!.push(newSubscription);
    console.log(`Push subscription toegevoegd voor user ${userId}. Totaal: ${this.subscriptions.get(userId)!.length}`);
  }

  /**
   * Unsubscribe user from push notifications
   */
  unsubscribe(userId: number, endpoint: string) {
    const userSubscriptions = this.subscriptions.get(userId);
    if (userSubscriptions) {
      const filtered = userSubscriptions.filter(sub => sub.endpoint !== endpoint);
      this.subscriptions.set(userId, filtered);
      console.log(`Push subscription removed for user ${userId}`);
    }
  }

  /**
   * Send notification to specific user
   */
  async sendToUser(userId: number, payload: NotificationPayload) {
    const userSubscriptions = this.subscriptions.get(userId);
    if (!userSubscriptions || userSubscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return;
    }

    const promises = userSubscriptions.map(async (subscription) => {
      try {
        const pushPayload = JSON.stringify({
          ...payload,
          icon: payload.icon || '/icons/notification-icon.png',
          badge: payload.badge || '/icons/badge-icon.png'
        });

        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys
          },
          pushPayload
        );
        
        console.log(`Push notification sent to user ${userId}`);
      } catch (error) {
        console.error(`Failed to send push notification to user ${userId}:`, error);
        
        // Remove invalid subscriptions
        if (error instanceof Error && error.message.includes('410')) {
          this.unsubscribe(userId, subscription.endpoint);
        }
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Send notification to multiple users
   */
  async sendToUsers(userIds: number[], payload: NotificationPayload) {
    const promises = userIds.map(userId => this.sendToUser(userId, payload));
    await Promise.allSettled(promises);
  }

  /**
   * Send new candidate / form submission alert to admin users
   */
  async sendNewCandidateAlert(adminUserIds: number[], candidateName: string, functionType: string, candidateId: number) {
    const functionLabels: Record<string, string> = {
      horecamedewerker: 'Horecamedewerker',
      housekeeping: 'Housekeeping',
      chef: 'Chef',
      frontoffice: 'Front Office',
    };
    const label = functionLabels[functionType] || functionType;
    const payload: NotificationPayload = {
      title: '📋 Nieuw formulier ingediend',
      body: `${candidateName} heeft zich aangemeld als ${label}.`,
      tag: `new-candidate-${candidateId}`,
      data: {
        type: 'candidate',
        action: 'view_candidate',
        url: '/',
        candidateId,
      },
      actions: [
        { action: 'view_candidate', title: 'Bekijk kandidaat' },
        { action: 'dismiss', title: 'Sluiten' },
      ],
    };
    await this.sendToUsers(adminUserIds, payload);
  }

  /**
   * Send new staffing request alert to admin users
   */
  async sendStaffingRequestAlert(adminUserIds: number[], companyName: string, contactName: string, functions: string[]) {
    const payload: NotificationPayload = {
      title: '🏢 Nieuwe personeelsaanvraag',
      body: `${companyName} (${contactName}) heeft personeel aangevraagd: ${functions.join(', ')}.`,
      tag: `staffing-${Date.now()}`,
      data: {
        type: 'candidate',
        action: 'view_dashboard',
        url: '/',
      },
      actions: [
        { action: 'view_dashboard', title: 'Bekijk dashboard' },
        { action: 'dismiss', title: 'Sluiten' },
      ],
    };
    await this.sendToUsers(adminUserIds, payload);
  }

  /**
   * Send achievement notification
   */
  async sendAchievementNotification(user: User, achievement: {
    title: string;
    points: number;
    type: 'challenge' | 'reward' | 'milestone';
  }) {
    const payload: NotificationPayload = {
      title: '🎉 Gefeliciteerd!',
      body: `Je hebt "${achievement.title}" behaald en ${achievement.points} punten verdiend!`,
      tag: 'achievement',
      data: {
        type: 'achievement',
        action: 'view_dashboard',
        url: '/',
        points: achievement.points
      },
      actions: [
        {
          action: 'view_dashboard',
          title: 'Bekijk Dashboard'
        },
        {
          action: 'view_leaderboard',
          title: 'Bekijk Ranglijst'
        }
      ]
    };

    await this.sendToUser(user.id, payload);
  }

  /**
   * Send challenge progress notification
   */
  async sendChallengeProgressNotification(user: User, challenge: {
    title: string;
    currentStep: number;
    totalSteps: number;
    nextReward: number;
  }) {
    const payload: NotificationPayload = {
      title: '🎯 Challenge Voortgang',
      body: `Je bent bij stap ${challenge.currentStep}/${challenge.totalSteps} van "${challenge.title}". Nog ${challenge.nextReward} punten te verdienen!`,
      tag: 'challenge_progress',
      data: {
        type: 'challenge',
        action: 'view_challenges',
        url: '/dashboard?tab=challenges'
      },
      actions: [
        {
          action: 'view_challenges',
          title: 'Bekijk Challenges'
        }
      ]
    };

    await this.sendToUser(user.id, payload);
  }

  /**
   * Send leaderboard position notification
   */
  async sendLeaderboardNotification(user: User, position: {
    current: number;
    previous: number;
    totalUsers: number;
  }) {
    const isImprovement = position.current < position.previous;
    const emoji = position.current <= 3 ? '🏆' : '📈';
    
    const payload: NotificationPayload = {
      title: `${emoji} Ranglijst Update`,
      body: isImprovement 
        ? `Je bent gestegen naar positie ${position.current}! Goed bezig!`
        : `Je staat op positie ${position.current} van ${position.totalUsers} medewerkers`,
      tag: 'leaderboard',
      data: {
        type: 'leaderboard',
        action: 'view_leaderboard',
        url: '/dashboard?tab=leaderboard'
      },
      actions: [
        {
          action: 'view_leaderboard',
          title: 'Bekijk Ranglijst'
        }
      ]
    };

    await this.sendToUser(user.id, payload);
  }

  /**
   * Send new reward available notification
   */
  async sendNewRewardNotification(users: User[], reward: {
    name: string;
    pointsCost: number;
  }) {
    const payload: NotificationPayload = {
      title: '🎁 Nieuwe Beloning Beschikbaar!',
      body: `"${reward.name}" is nu beschikbaar voor ${reward.pointsCost} punten`,
      tag: 'new_reward',
      data: {
        type: 'reward',
        action: 'view_rewards',
        url: '/dashboard?tab=rewards'
      },
      actions: [
        {
          action: 'view_rewards',
          title: 'Bekijk Beloningen'
        }
      ]
    };

    const userIds = users.map(user => user.id);
    await this.sendToUsers(userIds, payload);
  }

  /**
   * Send motivation notification (daily/weekly)
   */
  async sendMotivationNotification(user: User, motivation: {
    type: 'daily' | 'weekly' | 'streak';
    message: string;
    points?: number;
  }) {
    const emoji = motivation.type === 'streak' ? '🔥' : '💪';
    
    const payload: NotificationPayload = {
      title: `${emoji} Motivatie Boost`,
      body: motivation.message,
      tag: 'motivation',
      data: {
        type: 'social',
        action: 'view_dashboard',
        url: '/'
      },
      actions: [
        {
          action: 'view_dashboard',
          title: 'Start Nu'
        }
      ]
    };

    await this.sendToUser(user.id, payload);
  }

  /**
   * Send near-miss notification (almost reached goal)
   */
  async sendNearMissNotification(user: User, nearMiss: {
    type: 'challenge' | 'points' | 'leaderboard';
    message: string;
    action: string;
  }) {
    const payload: NotificationPayload = {
      title: '⚡ Bijna Daar!',
      body: nearMiss.message,
      tag: 'near_miss',
      data: {
        type: 'challenge',
        action: 'view_dashboard',
        url: '/'
      },
      actions: [
        {
          action: 'view_dashboard',
          title: nearMiss.action
        }
      ]
    };

    await this.sendToUser(user.id, payload);
  }

  /**
   * Send TWV expiry reminder to admin users
   */
  async sendTwvExpiryAlert(adminUserIds: number[], candidateName: string, daysLeft: number, candidateId: number) {
    const payload: NotificationPayload = {
      title: '⚠️ TWV verloopt binnenkort',
      body: `De TWV van ${candidateName} verloopt over ${daysLeft} dagen. Actie vereist.`,
      tag: `twv-expiry-${candidateId}`,
      data: {
        type: 'candidate',
        action: 'view_twv',
        url: '/',
        candidateId,
      },
      actions: [
        { action: 'view_twv', title: 'Bekijk TWV overzicht' },
        { action: 'dismiss', title: 'Sluiten' },
      ],
    };
    await this.sendToUsers(adminUserIds, payload);
  }

  /**
   * Get VAPID public key for client-side subscription
   */
  getVapidPublicKey(): string {
    return VAPID_PUBLIC_KEY;
  }
}

// Singleton instance
let pushNotificationService: PushNotificationService | null = null;

export function initPushNotificationService(): PushNotificationService {
  if (!pushNotificationService) {
    pushNotificationService = new PushNotificationService();
    console.log('Push notification service initialized');
  }
  return pushNotificationService;
}

export function getPushNotificationService(): PushNotificationService | null {
  return pushNotificationService;
}

// Notification templates for common scenarios
export const NotificationTemplates = {
  // Achievement notifications
  firstPoints: (points: number) => ({
    title: '🎉 Eerste Punten!',
    body: `Gefeliciteerd! Je hebt je eerste ${points} punten verdiend!`,
    points
  }),

  levelUp: (newLevel: number, points: number) => ({
    title: '⬆️ Level Up!',
    body: `Je bent nu level ${newLevel}! Je hebt ${points} punten verdiend!`,
    points
  }),

  challengeComplete: (challengeName: string, points: number) => ({
    title: '✅ Challenge Voltooid!',
    body: `Je hebt "${challengeName}" voltooid en ${points} punten verdiend!`,
    points
  }),

  // Progress notifications
  challengeProgress: (challengeName: string, progress: number, total: number) => ({
    title: '📈 Voortgang Challenge',
    body: `Je bent ${progress}/${total} bij "${challengeName}". Blijf doorgaan!`
  }),

  almostThere: (challengeName: string, remaining: number) => ({
    title: '🎯 Bijna Klaar!',
    body: `Nog ${remaining} te gaan voor "${challengeName}". Je kunt het!`
  }),

  // Social notifications
  leaderboardClimb: (newPosition: number) => ({
    title: '🚀 Omhoog in Ranglijst!',
    body: `Je bent geklommen naar positie ${newPosition}!`
  }),

  topThree: (position: number) => ({
    title: '🏆 Top 3!',
    body: `Geweldig! Je staat nu ${position}e in de ranglijst!`
  }),

  // Motivation notifications
  dailyMotivation: [
    'Start je dag met energie! Bekijk welke challenges je vandaag kunt voltooien.',
    'Gisteren was goed, vandaag wordt nog beter! Check je voortgang.',
    'Je collega\'s zijn actief bezig met challenges. Doe jij ook mee?',
    'Nieuwe dag, nieuwe kansen om punten te verdienen!',
    'Je staat dichtbij je volgende milestone. Ga ervoor!'
  ],

  weeklyRecap: (weeklyPoints: number) => ({
    title: '📊 Week Samenvatting',
    body: `Deze week heb je ${weeklyPoints} punten verdiend. Goed bezig!`
  })
};