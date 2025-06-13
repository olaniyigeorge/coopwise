import AuthService from "./auth-service";
import { WalletDetail } from "./dashboard-service";



export interface DepositData {
    local_amount: number;
    currency: string;
}


// Wallet service
const WalletService = {
  
  
  async depositInWallet(depositData: DepositData): Promise<WalletDetail | null> {
    try {
      const token = await AuthService.getToken();
      if (!token) {
        console.warn('No authentication token found, returning null');
        return null;
      }

      console.log('Attempting deposit in service...');
      const response = await fetch('/api/v1/wallet/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(depositData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Dashboard API error data:', errorData);
        throw new Error(`Error fetching dashboard data: ${response.status}`);
      }

      const data = await response.json();
      console.log('Deposit successful:', data);
      
      return data;
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      return null;
    }
  } 

}


export default WalletService; 