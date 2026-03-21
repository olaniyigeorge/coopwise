import { ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ActivityDetail, ActivityType } from "./dashboard-service"
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
  const { type, user_id, amount, entity_id } = activity

  const actor = isOwnActivity ? 'You' : `User (${user_id})`

  switch (type) {
    case ActivityType.CREATED_GROUP:
      return `${actor} created a group(${entity_id}).`
    case ActivityType.JOINED_GROUP:
      return `${actor} joined a group.`
    case ActivityType.LEFT_GROUP:
      return `${actor} left the group.`
    case ActivityType.ACCEPTED_INVITE:
      return `${actor} accepted an invite to join the group.`
    case ActivityType.DECLINED_INVITE:
      return `${actor} declined an invite to join the group.`
    case ActivityType.MADE_CONTRIBUTION:
      return `${actor} contributed ${amount ? formatCurrency(amount) : 'an amount'} to the group.`
    case ActivityType.RECEIVED_PAYOUT:
      return `${actor} received a payout of ${amount ? formatCurrency(amount) : 'an amount'} from the group.`
    default:
      return activity.description || `${actor} performed an activity.`
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
