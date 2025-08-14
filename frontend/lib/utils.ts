import { ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ActivityDetail } from "./dashboard-service"
import { NotificationDetail } from "./stores/notification-store"

// Combine clsx and tailwind-merge to intelligently handle conflicting Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs))
}

// Format a number as Nigerian Naira currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}



export const getActivityDescription = (
  activity: ActivityDetail,
  isOwnActivity = false
): string => {
  const { type, user_id, amount } = activity

  const actor = isOwnActivity ? 'You' : `User (${user_id})`

  switch (type) {
    case 'created_group':
      return isOwnActivity ? 'You created a new savings group' : `${actor} created a new savings group`
    case 'joined_group':
      return isOwnActivity ? 'You joined a savings group' : `${actor} joined a savings group`
    case 'left_group':
      return isOwnActivity ? 'You left a savings group' : `${actor} left a savings group`
    case 'accepted_invite':
      return isOwnActivity ? 'You accepted an invitation to join a group' : `${actor} accepted an invitation to join a group`
    case 'declined_invite':
      return isOwnActivity ? 'You declined an invitation to join a group' : `${actor} declined an invitation to join a group`
    case 'made_contribution':
      if (amount) {
        return isOwnActivity 
          ? `You contributed ${formatCurrency(amount)} to your savings group`
          : `${actor} contributed ${formatCurrency(amount)} to a savings group`
      }
      return isOwnActivity ? 'You made a contribution to your savings group' : `${actor} made a contribution to a savings group`
    case 'received_payout':
      if (amount) {
        return isOwnActivity 
          ? `You received a payout of ${formatCurrency(amount)} from your savings group`
          : `${actor} received a payout of ${formatCurrency(amount)} from a savings group`
      }
      return isOwnActivity ? 'You received a payout from your savings group' : `${actor} received a payout from a savings group`
    case 'updated_profile':
      return isOwnActivity ? 'You updated your profile information' : `${actor} updated their profile information`
    default:
      return activity.description || `${actor} performed an activity`
  }
}






export const getNotificationLink = (notification: NotificationDetail) => {
  const { event_type, entity_url } = notification

  switch (event_type) {
    case 'group':
      return entity_url ? `/dashboard/my-group/${entity_url}` : undefined
    case 'contribution':
      return entity_url ? `/dashboard/my-group/${entity_url}#contributions` : undefined
    case 'payout':
      return entity_url ? `/dashboard/my-group/${entity_url}#payouts` : undefined
    case 'ai_insight':
      return entity_url ? `/dashboard/ai-insights/${entity_url}` : undefined
    default:
      return undefined
  }
}


export const getNotificationActionLabel = (notification: NotificationDetail) => {
  switch (notification.event_type) {
    case 'group':
      return 'View Group'
    case 'contribution':
      return 'View Contribution'
    case 'payout':
      return 'View Payout'
    case 'ai_insight':
      return 'View Insight'
    case 'membership':
      return 'View Membership'
    case 'transaction':
      return 'View Transaction'
    case 'general_alert':
      return 'View Alert'
    case 'system':
      return 'View System Update'
    default:
      return 'View Details'
  }
}
