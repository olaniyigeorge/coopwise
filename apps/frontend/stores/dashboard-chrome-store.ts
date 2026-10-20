import { create } from "zustand"

/**
 * The sidebar renders on every dashboard page, but the trust score is only
 * computed on the dashboard landing page (it needs the full dashboard
 * payload). This tiny store carries the last computed score across pages so
 * the sidebar badge doesn't reset to zero when someone opens Wallet.
 */
interface DashboardChromeState {
  trustScore: number
  tenureMonths: number
  setTrust: (score: number, tenureMonths: number) => void
}

export const useDashboardChromeStore = create<DashboardChromeState>((set) => ({
  trustScore: 10,
  tenureMonths: 1,
  setTrust: (trustScore, tenureMonths) => set({ trustScore, tenureMonths }),
}))
