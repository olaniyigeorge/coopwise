import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import CookieService from '../cookie-service';

export interface Notification {
  id: number;
  message: string;
  read: boolean;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface NotificationState {
  notifications: Notification[];
  nextId: number;
  
  // Derived state
  unreadCount: number;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      nextId: 1,
      
      // Computed property using a getter
      get unreadCount() {
        return get().notifications.filter(n => !n.read).length;
      },
      
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: get().nextId,
          timestamp: new Date().toISOString()
        };
        
        set(state => ({
          notifications: [newNotification, ...state.notifications],
          nextId: state.nextId + 1
        }));
        
        // Also update cookies for persistence
        const updatedNotifications = [newNotification, ...get().notifications];
        CookieService.setNotifications(updatedNotifications);
      },
      
      markAsRead: (id) => {
        set(state => ({
          notifications: state.notifications.map(notification => 
            notification.id === id ? { ...notification, read: true } : notification
          )
        }));
        
        // Update cookies
        const updatedNotifications = get().notifications.map(notification => 
          notification.id === id ? { ...notification, read: true } : notification
        );
        CookieService.setNotifications(updatedNotifications);
      },
      
      markAllAsRead: () => {
        set(state => ({
          notifications: state.notifications.map(notification => ({ ...notification, read: true }))
        }));
        
        // Update cookies
        const updatedNotifications = get().notifications.map(notification => 
          ({ ...notification, read: true })
        );
        CookieService.setNotifications(updatedNotifications);
      },
      
      clearNotifications: () => {
        set({ notifications: [] });
        
        // Update cookies
        CookieService.setNotifications([]);
      }
    }),
    {
      name: 'notification-storage',
      // Store all notification data for persistence
      partialize: (state) => ({ 
        notifications: state.notifications,
        nextId: state.nextId
      }),
    }
  )
);

// Initialize with data from cookies if available
const initializeFromCookies = () => {
  const savedNotifications = CookieService.getNotifications();
  const savedNextId = CookieService.getNextNotificationId();
  
  if (savedNotifications && savedNotifications.length > 0) {
    useNotificationStore.setState({ 
      notifications: savedNotifications,
      nextId: savedNextId
    });
  } else {
    // Add some demo notifications if none exist
    useNotificationStore.setState({
      notifications: [
        {
          id: 1,
          message: "New cooperative invitation from Sunshine Savings Group",
          read: false,
          timestamp: new Date().toISOString(),
          type: 'info'
        },
        {
          id: 2,
          message: "Payment of ₦25,000 received from your cooperative savings",
          read: false,
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          type: 'success'
        },
        {
          id: 3,
          message: "Profile update successful",
          read: true,
          timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          type: 'success'
        }
      ],
      nextId: 4
    });
  }
};

// Run initialization if we're in a browser environment
if (typeof window !== 'undefined') {
  initializeFromCookies();
}

export default useNotificationStore; 