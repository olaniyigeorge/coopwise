import AuthService from "./auth-service";
import ApiService from "./api-service";
import { WalletDetail } from "./dashboard-service";

export interface DepositData {
  payment_gateway: string; // 'paystack' | 'crypto_wallet' | 'flutterwave'
  local_amount: number;
  currency: string; // e.g., 'NGN' | 'USD' | 'CAMP'
}

export interface PaystackInitResponse {
  payment_gateway: string
  init_payment_response: {
    status: boolean
    message: string
    data?: {
      authorization_url?: string
      access_code?: string
      reference?: string
      tx_ref?: string
      amount?: number
    }
  }
}

// Wallet service
const WalletService = {

  async getWallet() {
    return ApiService.get<WalletDetail>("/wallet")
  },

  async depositInWallet(depositData: DepositData): Promise<WalletDetail | null> {
    try {
      const token = await AuthService.getToken();
      if (!token) {
        console.warn('No authentication token found, returning null');
        return null;
      }

      console.log('\n Attempting deposit in service...\n');
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
  },

  /**
   * Initiates a real deposit via the Paystack gateway. Returns Paystack's
   * hosted-checkout `authorization_url` to redirect the browser to — the
   * actual wallet credit happens server-side once the user completes
   * payment (via /api/v1/payments/paystack/callback).
   */
  async initiateDeposit(depositData: DepositData) {
    return ApiService.post<PaystackInitResponse>(
      `/wallet/deposit?payment_gateway=${encodeURIComponent(depositData.payment_gateway)}`,
      depositData
    )
  },

  /**
   * Settles a previously-initiated deposit by its ledger reference and
   * credits the wallet. Used for the `mock_success` gateway (no real
   * payment provider round-trip) — real gateways settle via their own
   * callback/webhook instead.
   */
  async finalizeDeposit(reference: string, paymentGateway: string) {
    return ApiService.post<{ message: string; receipt: Record<string, unknown> }>(
      `/wallet/deposit/finalise?reference=${encodeURIComponent(reference)}&payment_gateway=${encodeURIComponent(paymentGateway)}`
    )
  },
}


export default WalletService;
