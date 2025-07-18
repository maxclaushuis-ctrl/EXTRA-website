/**
 * Planworks Integration Service
 * Handles data synchronization with external planning system
 */

export interface PlanworksEmployee {
  id: string; // API ID van medewerker
  firstName: string;
  lastName: string;
  email: string;
  
  // Challenge-relevante data
  shiftsCompleted: number; // Totaal aantal gedraaide diensten
  overtimeHours: number; // Totaal overwerk uren
  lastMinuteShifts: number; // Last-minute ingevallen diensten
  punctualityScore: number; // Stiptheid score (0-100)
  availabilityPercentage: number; // Beschikbaarheid percentage
  clientRating: number; // Gemiddelde klantbeoordeling (1-5)
  trainingsCompleted: number; // Aantal voltooide trainingen
  
  // Metadata
  lastUpdated: string;
  activeStatus: boolean;
}

export interface PlanworksChallengeData {
  userId: string;
  challengeMetrics: {
    shifts: number;
    overtime: number;
    lastminute: number;
    punctuality: number;
    availability: number;
    client_rating: number;
    training_completion: number;
  };
  period: {
    start: string;
    end: string;
  };
}

class PlanworksAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.PLANWORKS_API_URL || 'https://api.planworks.nl/v1';
    this.apiKey = process.env.PLANWORKS_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('Planworks API key not configured - running in mock mode');
    }
  }

  /**
   * Check if Planworks integration is available
   */
  isAvailable(): boolean {
    return Boolean(this.apiKey && this.baseUrl);
  }

  /**
   * Get employee data from Planworks
   */
  async getEmployee(apiId: string): Promise<PlanworksEmployee | null> {
    if (!this.isAvailable()) {
      return this.getMockEmployeeData(apiId);
    }

    try {
      const response = await fetch(`${this.baseUrl}/employees/${apiId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformEmployeeData(data);
    } catch (error) {
      console.error(`Error fetching employee ${apiId} from Planworks:`, error);
      return null;
    }
  }

  /**
   * Get challenge metrics for specific employee
   */
  async getChallengeMetrics(apiId: string, startDate?: string, endDate?: string): Promise<PlanworksChallengeData | null> {
    if (!this.isAvailable()) {
      return this.getMockChallengeData(apiId);
    }

    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start', startDate);
      if (endDate) params.append('end', endDate);

      const response = await fetch(`${this.baseUrl}/employees/${apiId}/metrics?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformChallengeData(data);
    } catch (error) {
      console.error(`Error fetching challenge metrics for ${apiId}:`, error);
      return null;
    }
  }

  /**
   * Get all employees with challenge metrics
   */
  async getAllEmployeeMetrics(): Promise<PlanworksChallengeData[]> {
    if (!this.isAvailable()) {
      return this.getMockAllEmployeeData();
    }

    try {
      const response = await fetch(`${this.baseUrl}/employees/metrics`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.map((item: any) => this.transformChallengeData(item));
    } catch (error) {
      console.error('Error fetching all employee metrics:', error);
      return [];
    }
  }

  /**
   * Transform raw Planworks employee data to our format
   */
  private transformEmployeeData(data: any): PlanworksEmployee {
    return {
      id: data.id || data.employee_id,
      firstName: data.first_name || data.firstName,
      lastName: data.last_name || data.lastName,
      email: data.email,
      shiftsCompleted: data.shifts_completed || data.totalShifts || 0,
      overtimeHours: data.overtime_hours || data.overtime || 0,
      lastMinuteShifts: data.lastminute_shifts || data.urgentShifts || 0,
      punctualityScore: data.punctuality_score || data.punctuality || 100,
      availabilityPercentage: data.availability_percentage || data.availability || 100,
      clientRating: data.client_rating || data.rating || 5,
      trainingsCompleted: data.trainings_completed || data.trainings || 0,
      lastUpdated: data.last_updated || new Date().toISOString(),
      activeStatus: data.active_status !== false
    };
  }

  /**
   * Transform challenge data from Planworks format
   */
  private transformChallengeData(data: any): PlanworksChallengeData {
    return {
      userId: data.employee_id || data.id,
      challengeMetrics: {
        shifts: data.shifts_completed || data.shifts || 0,
        overtime: data.overtime_hours || data.overtime || 0,
        lastminute: data.lastminute_shifts || data.urgent || 0,
        punctuality: data.punctuality_score || data.punctuality || 100,
        availability: data.availability_percentage || data.availability || 100,
        client_rating: data.client_rating || data.rating || 5,
        training_completion: data.trainings_completed || data.trainings || 0
      },
      period: {
        start: data.period_start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: data.period_end || new Date().toISOString()
      }
    };
  }

  /**
   * Mock data for development/testing
   */
  private getMockEmployeeData(apiId: string): PlanworksEmployee {
    const mockId = parseInt(apiId) || 1;
    return {
      id: apiId,
      firstName: `Medewerker`,
      lastName: `${mockId}`,
      email: `medewerker${mockId}@extra.nl`,
      shiftsCompleted: Math.floor(Math.random() * 50) + 10,
      overtimeHours: Math.floor(Math.random() * 20),
      lastMinuteShifts: Math.floor(Math.random() * 10),
      punctualityScore: Math.floor(Math.random() * 20) + 80,
      availabilityPercentage: Math.floor(Math.random() * 30) + 70,
      clientRating: (Math.random() * 2 + 3).toFixed(1) as any,
      trainingsCompleted: Math.floor(Math.random() * 8),
      lastUpdated: new Date().toISOString(),
      activeStatus: true
    };
  }

  /**
   * Mock challenge data for development
   */
  private getMockChallengeData(apiId: string): PlanworksChallengeData {
    const employee = this.getMockEmployeeData(apiId);
    return {
      userId: apiId,
      challengeMetrics: {
        shifts: employee.shiftsCompleted,
        overtime: employee.overtimeHours,
        lastminute: employee.lastMinuteShifts,
        punctuality: employee.punctualityScore,
        availability: employee.availabilityPercentage,
        client_rating: employee.clientRating,
        training_completion: employee.trainingsCompleted
      },
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      }
    };
  }

  /**
   * Mock data for all employees
   */
  private getMockAllEmployeeData(): PlanworksChallengeData[] {
    const apiIds = ['emp_001', 'emp_002', 'emp_003', 'emp_004'];
    return apiIds.map(id => this.getMockChallengeData(id));
  }
}

// Singleton instance
let planworksAPI: PlanworksAPI | null = null;

export function getPlanworksAPI(): PlanworksAPI {
  if (!planworksAPI) {
    planworksAPI = new PlanworksAPI();
  }
  return planworksAPI;
}

export function isPlanworksConfigured(): boolean {
  return getPlanworksAPI().isAvailable();
}