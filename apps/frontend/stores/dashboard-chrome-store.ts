import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

/**
 * The sidebar and dashboard header render on every page, but the trust score
 * is only computed on the dashboard landing page (it needs the full dashboard
 * payload). This store carries the last *confirmed* score across pages and
 * reloads so the badge doesn't flicker through a placeholder while data loads.
 */
interface DashboardChromeState {
  trustScore: number
  tenureMonths: number
  /** When the score was last computed from real dashboard data. */
  updatedAt: number | null
  setTrust: (score: number, tenureMonths: number) => void
}

export const useDashboardChromeStore = create<DashboardChromeState>()(
  persist(
    (set) => ({
      trustScore: 10,
      tenureMonths: 1,
      updatedAt: null,
      setTrust: (trustScore, tenureMonths) =>
        set({ trustScore, tenureMonths, updatedAt: Date.now() }),
    }),
    {
      name: "coopwise-dashboard-chrome",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        trustScore: state.trustScore,
        tenureMonths: state.tenureMonths,
        updatedAt: state.updatedAt,
      }),
    }
  )
)
