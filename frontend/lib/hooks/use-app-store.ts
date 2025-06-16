import useAuthStore from '../stores/auth-store';
import useNotificationStore from '../stores/notification-store';
import useGroupStore from '../stores/group-store';

/**
 * Combined hook to access all application stores
 * This provides a convenient way to access all stores from a single import
 */
export function useAppStore() {
  const auth = useAuthStore();
  const notifications = useNotificationStore();
  const groups = useGroupStore();

  return {
    auth,
    notifications,
    groups
  };
}

// Re-export individual stores for direct access if needed
export { useAuthStore, useNotificationStore, useGroupStore }; 