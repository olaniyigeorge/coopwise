import AuthService from './auth-service';

export interface DashboardData {
  savings: {
    total: number;
    goal: number;
    progress: number;
  };
  wallet: {
    balance: number;
  };
  nextContribution: {
    groupName?: string;
    amount?: number;
    dueDate?: string;
    hasUpcoming: boolean;
  };
  nextPayout: {
    groupName?: string;
    amount?: number;
    dueDate?: string;
    hasUpcoming: boolean;
  };
  recentActivity: {
    id: string;
    type: string;
    description: string;
    date: string;
    amount?: number;
    status?: string;
  }[];
  savingsGoal: {
    name: string;
    current: number;
    target: number;
    progress: number;
    remaining: number;
  };
  aiInsights: {
    available: boolean;
    insights?: {
      title: string;
      description: string;
    }[];
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  try {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('Fetching dashboard data...');
    const response = await fetch('/api/v1/dashboard/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Dashboard API error response:', errorData);
      throw new Error(`Error fetching dashboard data: ${response.status}`);
    }

    const data = await response.json();
    console.log('Dashboard data from API:', data);
    
    return data;
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    // Return default/empty data structure in case of error
    return {
      savings: {
        total: 0,
        goal: 0,
        progress: 0,
      },
      wallet: {
        balance: 0,
      },
      nextContribution: {
        hasUpcoming: false,
      },
      nextPayout: {
        hasUpcoming: false,
      },
      recentActivity: [],
      savingsGoal: {
        name: '',
        current: 0,
        target: 0,
        progress: 0,
        remaining: 0,
      },
      aiInsights: {
        available: false,
        insights: [],
      },
    };
  }
} 