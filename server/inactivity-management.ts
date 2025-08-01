/**
 * Inactivity Management System
 * Automatically resets points for users inactive for 3+ months unless overridden by admin
 */

import { storage } from "./storage";
import { initMailService } from "./mail";

const INACTIVITY_THRESHOLD_MONTHS = 3;

export interface InactivityReport {
  usersChecked: number;
  usersReset: number;
  usersSkipped: number;
  details: {
    userId: number;
    name: string;
    lastActivity: Date | null;
    pointsReset: number;
    reason: string;
  }[];
}

/**
 * Check for inactive users and reset their points if necessary
 */
export async function checkInactiveUsers(): Promise<InactivityReport> {
  const report: InactivityReport = {
    usersChecked: 0,
    usersReset: 0,
    usersSkipped: 0,
    details: []
  };

  try {
    const allUsers = await storage.getAllUsers();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - INACTIVITY_THRESHOLD_MONTHS);

    for (const user of allUsers) {
      if (user.role !== 'employee') continue;
      
      report.usersChecked++;
      
      // Check if user has admin override
      if (user.inactivityResetOverride) {
        report.usersSkipped++;
        report.details.push({
          userId: user.id,
          name: `${user.firstName} ${user.lastName}`,
          lastActivity: user.lastActivityDate || null,
          pointsReset: 0,
          reason: 'Admin override active'
        });
        continue;
      }

      // Check last activity date
      const lastActivity = user.lastActivityDate || user.dateJoined;
      
      if (new Date(lastActivity) < threeMonthsAgo && user.points > 0) {
        // Reset points for inactive user
        const pointsToReset = user.points;
        
        await storage.updateUser(user.id, {
          points: 0,
          monthlyPoints: 0
        });

        // Create transaction record
        await storage.createPointTransaction({
          userId: user.id,
          amount: -pointsToReset,
          type: 'redeemed',
          description: `Punten gereset wegens inactiviteit (${INACTIVITY_THRESHOLD_MONTHS} maanden geen activiteit)`,
          source: 'system',
          metadata: {
            lastActivity: lastActivity,
            resetDate: new Date().toISOString(),
            reason: 'inactivity_reset'
          }
        });

        report.usersReset++;
        report.details.push({
          userId: user.id,
          name: `${user.firstName} ${user.lastName}`,
          lastActivity: new Date(lastActivity),
          pointsReset: pointsToReset,
          reason: `Inactief sinds ${new Date(lastActivity).toLocaleDateString()}`
        });

        // Send notification email
        await sendInactivityNotification(user, pointsToReset);
      } else {
        report.usersSkipped++;
        report.details.push({
          userId: user.id,
          name: `${user.firstName} ${user.lastName}`,
          lastActivity: new Date(lastActivity),
          pointsReset: 0,
          reason: user.points === 0 ? 'Geen punten om te resetten' : 'Nog actief binnen 3 maanden'
        });
      }
    }

    console.log(`✅ Inactivity check completed: ${report.usersReset} users reset, ${report.usersSkipped} skipped`);
    return report;
    
  } catch (error) {
    console.error('Error during inactivity check:', error);
    throw error;
  }
}

/**
 * Send notification email to user about point reset
 */
async function sendInactivityNotification(user: any, pointsReset: number): Promise<void> {
  try {
    const mailService = await initMailService();
    
    const subject = 'EXTRAATJE - Punten gereset wegens inactiviteit';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Hallo ${user.firstName},</h2>
        
        <p>Je EXTRAATJE punten zijn automatisch gereset omdat je de afgelopen 3 maanden geen activiteit hebt gehad.</p>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Gereset punten:</strong> ${pointsReset}</p>
          <p><strong>Reden:</strong> Geen activiteit in de afgelopen 3 maanden</p>
        </div>
        
        <p>Begin weer met werken om opnieuw punten te verdienen! Je kunt inloggen op het EXTRAATJE platform om je huidige status te bekijken.</p>
        
        <p>Heb je vragen? Neem contact op met je contactpersoon bij EXTRA.</p>
        
        <p>Met vriendelijke groet,<br>Het EXTRA team</p>
      </div>
    `;

    await mailService.sendEmail({
      to: user.email,
      subject: subject,
      html: htmlContent
    });

    console.log(`📧 Inactivity notification sent to ${user.email}`);
  } catch (error) {
    console.error(`Failed to send inactivity notification to ${user.email}:`, error);
  }
}

/**
 * Update user's last activity date (call this when user performs work-related actions)
 */
export async function updateUserActivity(userId: number): Promise<void> {
  try {
    await storage.updateUser(userId, {
      lastActivityDate: new Date()
    });
    console.log(`Updated activity date for user ${userId}`);
  } catch (error) {
    console.error(`Failed to update activity for user ${userId}:`, error);
  }
}

/**
 * Get users who will be affected by next inactivity check
 */
export async function getInactivityWarningUsers(): Promise<any[]> {
  try {
    const allUsers = await storage.getAllUsers();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - INACTIVITY_THRESHOLD_MONTHS);
    
    const twoAndHalfMonthsAgo = new Date();
    twoAndHalfMonthsAgo.setMonth(twoAndHalfMonthsAgo.getMonth() - 2.5);

    return allUsers.filter(user => {
      if (user.role !== 'employee' || user.inactivityResetOverride || user.points === 0) {
        return false;
      }
      
      const lastActivity = new Date(user.lastActivityDate || user.dateJoined);
      return lastActivity < twoAndHalfMonthsAgo && lastActivity >= threeMonthsAgo;
    });
  } catch (error) {
    console.error('Error getting inactivity warning users:', error);
    return [];
  }
}