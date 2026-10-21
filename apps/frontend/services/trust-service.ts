import { DashboardData, ActivityDetail, ActivityType } from '@/services/dashboard-service'

export type TrustTier = 'FOUNDATIONAL' | 'ESTABLISHED' | 'ANCHOR' | 'EXEMPLAR'

export interface TrustSignal {
  id: string
  label: string
  value: string
  detail: string
  scoreWeight: number
}

export interface TrustStanding {
  score: number // 0 - 100
  tier: TrustTier
  tierLabel: string
  tallyMarks: number // 1 to 4 representation for UI
  signals: TrustSignal[]
  onTimeTracked: boolean
}

export interface CircleHistoryEntry {
  due_date?: string
  fulfilled_at?: string
  member_name?: string
  member_address?: string
}

export interface MemberIdentity {
  name?: string
  address?: string
}

/**
 * Helper to compute on-time streak if member identity can be reliably matched.
 */
export function computeOnTimeStreak(
  history: CircleHistoryEntry[],
  identity: MemberIdentity
): { onTimeCount: number; totalCount: number; percentage: number } | null {
  if (!history || history.length === 0) return null
  if (!identity.name && !identity.address) return null

  const userEntries = history.filter((entry) => {
    const matchName = identity.name && entry.member_name?.toLowerCase() === identity.name.toLowerCase()
    const matchAddr = identity.address && entry.member_address?.toLowerCase() === identity.address.toLowerCase()
    return matchName || matchAddr
  })

  if (userEntries.length === 0) return null

  let onTimeCount = 0
  userEntries.forEach((entry) => {
    if (entry.fulfilled_at && entry.due_date) {
      const fulfilled = new Date(entry.fulfilled_at).getTime()
      const due = new Date(entry.due_date).getTime()
      if (fulfilled <= due) {
        onTimeCount++
      }
    }
  })

  return {
    onTimeCount,
    totalCount: userEntries.length,
    percentage: Math.round((onTimeCount / userEntries.length) * 100),
  }
}

/**
 * Pure function computing trust standing based cleanly on user_id attributable signals.
 */
export function describeTrustScore(score: number): {
  tier: TrustTier
  tierLabel: string
  tallyMarks: number
} {
  const totalScore = Math.min(Math.max(Math.round(score), 10), 100)

  if (totalScore >= 85) {
    return { tier: 'EXEMPLAR', tierLabel: 'Exemplar Pillar', tallyMarks: 4 }
  }
  if (totalScore >= 65) {
    return { tier: 'ANCHOR', tierLabel: 'Anchor Trustee', tallyMarks: 3 }
  }
  if (totalScore >= 40) {
    return {
      tier: 'ESTABLISHED',
      tierLabel: 'Established Contributor',
      tallyMarks: 2,
    }
  }
  return { tier: 'FOUNDATIONAL', tierLabel: 'Foundational Member', tallyMarks: 1 }
}

export function computeTrustStanding(inputs: {
  userId: string
  createdAt?: string
  activities: ActivityDetail[]
  activeCoopCount: number
  yourSavings: number
  targetSavings: number
  onTimeData?: { onTimeCount: number; totalCount: number } | null
}): TrustStanding {
  const { userId, createdAt, activities, activeCoopCount, yourSavings, targetSavings, onTimeData } = inputs

  // Signal 1: Consistency (User's contribution activity count)
  const userContributions = activities.filter(
    (act) => act.user_id === userId && act.type === ActivityType.MADE_CONTRIBUTION
  )
  const contribCount = userContributions.length
  // Max 35 points for consistency
  const consistencyScore = Math.min(Math.round((contribCount / 12) * 35), 35)

  // Signal 2: Tenure (Months since user creation)
  let tenureMonths = 1
  if (createdAt) {
    const createdDate = new Date(createdAt)
    const now = new Date()
    tenureMonths = Math.max(1, (now.getFullYear() - createdDate.getFullYear()) * 12 + (now.getMonth() - createdDate.getMonth()))
  }
  // Max 25 points for tenure (capped at 12 months)
  const tenureScore = Math.min(Math.round((tenureMonths / 12) * 25), 25)

  // Signal 3: Commitment & Breadth (Coops count + Personal target progress folded in)
  const targetProgress = targetSavings > 0 ? Math.min(yourSavings / targetSavings, 1) : 0.5
  const coopBreadthScore = Math.min(activeCoopCount * 10, 20)
  const commitmentScore = Math.min(Math.round(coopBreadthScore + targetProgress * 20), 40) // Max 40 points

  let totalScore = consistencyScore + tenureScore + commitmentScore

  // Optional on-time adjustment if reliably derived
  let onTimeTracked = false
  if (onTimeData && onTimeData.totalCount > 0) {
    onTimeTracked = true
    const onTimeRatio = onTimeData.onTimeCount / onTimeData.totalCount
    totalScore = Math.round(totalScore * 0.7 + onTimeRatio * 30)
  }

  totalScore = Math.min(Math.max(totalScore, 10), 100)

  // Determine Tier
  const { tier, tierLabel, tallyMarks } = describeTrustScore(totalScore)

  const signals: TrustSignal[] = [
    {
      id: 'consistency',
      label: 'Contribution Rhythm',
      value: `${contribCount} Events`,
      detail: `${contribCount} logged group contributions across active circles.`,
      scoreWeight: consistencyScore,
    },
    {
      id: 'tenure',
      label: 'Network Tenure',
      value: `${tenureMonths} mo`,
      detail: `Member of trust infrastructure since ${createdAt ? new Date(createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'joining'}.`,
      scoreWeight: tenureScore,
    },
    {
      id: 'commitment',
      label: 'Portfolio Commitment',
      value: `${activeCoopCount} Coops`,
      detail: `Coordinating in ${activeCoopCount} active groups with ${Math.round(targetProgress * 100)}% target backing.`,
      scoreWeight: commitmentScore,
    },
  ]

  return {
    score: totalScore,
    tier,
    tierLabel,
    tallyMarks,
    signals,
    onTimeTracked,
  }
}

/**
 * Mapper helper from DashboardData model to pure trust inputs
 */
export function deriveTrustInputsFromDashboard(data: DashboardData) {
  return {
    userId: data.user?.id || '',
    createdAt: data.user?.created_at,
    activities: data.activities || [],
    activeCoopCount: data.groups?.user_groups?.length || 0,
    yourSavings: data.summary?.your_savings || 0,
    targetSavings: data.user?.target_savings_amount || 0,
  }
}