/**
 * Planning System API Integration
 * Handles communication with external planning system for challenge synchronization
 */

export interface PlanningSystemConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
}

export interface ShiftData {
  employeeId: string;
  shiftId: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceType: string;
  location: string;
  status: 'completed' | 'no_show' | 'cancelled';
  isLastMinute: boolean;
  clientName: string;
}

export interface ReferralData {
  referrerId: string;
  refereeId: string;
  refereeEmail: string;
  referreeName: string;
  status: 'pending' | 'hired' | 'rejected';
  referralDate: string;
}

export interface SocialShareData {
  employeeId: string;
  platform: 'instagram' | 'facebook' | 'linkedin' | 'tiktok';
  postUrl: string;
  shareDate: string;
  verified: boolean;
}

export interface ChallengeProgressData {
  employeeId: string;
  shiftsCompleted: number;
  lastMinuteShifts: number;
  referralsCount: number;
  socialShares: number;
  lastUpdated: string;
}

class PlanningSystemAPI {
  private config: PlanningSystemConfig;

  constructor(config: PlanningSystemConfig) {
    this.config = config;
  }

  /**
   * Fetch shift data for an employee from the planning system
   */
  async getEmployeeShifts(apiId: string, fromDate?: string, toDate?: string): Promise<ShiftData[]> {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      
      const url = `${this.config.baseUrl}/api/employees/${apiId}/shifts?${params}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        throw new Error(`Planning API error: ${response.status} - ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching employee shifts:', error);
      throw error;
    }
  }

  /**
   * Fetch referral data for an employee
   */
  async getEmployeeReferrals(apiId: string): Promise<ReferralData[]> {
    try {
      const url = `${this.config.baseUrl}/api/employees/${apiId}/referrals`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        throw new Error(`Planning API error: ${response.status} - ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching employee referrals:', error);
      throw error;
    }
  }

  /**
   * Fetch social media shares for an employee
   */
  async getEmployeeSocialShares(apiId: string): Promise<SocialShareData[]> {
    try {
      const url = `${this.config.baseUrl}/api/employees/${apiId}/social-shares`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        throw new Error(`Planning API error: ${response.status} - ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching employee social shares:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive challenge progress data for an employee
   */
  async getChallengeProgress(apiId: string): Promise<ChallengeProgressData> {
    try {
      // Get current month dates for filtering
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const fromDate = firstDayOfMonth.toISOString().split('T')[0];
      const toDate = lastDayOfMonth.toISOString().split('T')[0];

      // Fetch all relevant data
      const [shifts, referrals, socialShares] = await Promise.all([
        this.getEmployeeShifts(apiId, fromDate, toDate),
        this.getEmployeeReferrals(apiId),
        this.getEmployeeSocialShares(apiId)
      ]);

      // Calculate challenge progress
      const completedShifts = shifts.filter(shift => shift.status === 'completed').length;
      const lastMinuteShifts = shifts.filter(shift => 
        shift.status === 'completed' && shift.isLastMinute
      ).length;
      const successfulReferrals = referrals.filter(ref => ref.status === 'hired').length;
      const verifiedShares = socialShares.filter(share => share.verified).length;

      return {
        employeeId: apiId,
        shiftsCompleted: completedShifts,
        lastMinuteShifts: lastMinuteShifts,
        referralsCount: successfulReferrals,
        socialShares: verifiedShares,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error getting challenge progress:', error);
      throw error;
    }
  }

  /**
   * Test connection to planning system
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        signal: AbortSignal.timeout(5000)
      });

      return response.ok;
    } catch (error) {
      console.error('Planning system connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
let planningAPI: PlanningSystemAPI | null = null;

export function initPlanningAPI(): PlanningSystemAPI | null {
  const baseUrl = process.env.PLANNING_API_URL;
  const apiKey = process.env.PLANNING_API_KEY;

  if (!baseUrl || !apiKey) {
    console.warn('Planning system niet geconfigureerd - API_URL en/of API_KEY ontbreken');
    return null;
  }

  if (!planningAPI) {
    planningAPI = new PlanningSystemAPI({
      baseUrl,
      apiKey,
      timeout: 30000 // 30 seconds timeout
    });
  }

  return planningAPI;
}

export function getPlanningAPI(): PlanningSystemAPI | null {
  return planningAPI;
}