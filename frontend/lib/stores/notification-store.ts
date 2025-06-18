import { create } from "zustand";
import { persist } from "zustand/middleware";
import NotificationService from '../notification-service'; // Assuming you have this

export type EventType =
  | "group"
  | "transaction"
  | "membership"
  | "contribution"
  | "payout"
  | "general_alert"
  | "system"
  | "ai_insight"
  | "other";

export type NotificationType = "info" | "success" | "warning" | "danger";

export type NotificationStatus = "unread" | "read" | "archived";

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone_number: string;
  role: string;
  target_savings_amount: number;
  savings_purpose: string;
  income_range: string;
  saving_frequency: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationDetail {
  id: string; // UUID (string)
  user_id?: string;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  event_type: EventType;
  entity_url?: string | null;
  user?: User;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  updated_at?: string;
}

interface NotificationStore {
  notifications: NotificationDetail[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
  
  // Actions
  fetchNotifications: (page?: number, pageSize?: number) => Promise<void>;
  setNotifications: (notifications: NotificationDetail[]) => void;
  addNotification: (notification: NotificationDetail) => void;
  updateNotification: (notificationId: string, updates: Partial<NotificationDetail>) => void;
  removeNotification: (notificationId: string) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => void;
  clearError: () => void;
  setLoading: (isLoading: boolean) => void;
  
  // Getters/Selectors
  getNotificationById: (id: string) => NotificationDetail | undefined;
  getNotificationsByType: (type: NotificationType) => NotificationDetail[];
  getNotificationsByEventType: (eventType: EventType) => NotificationDetail[];
  getUnreadNotifications: () => NotificationDetail[];
  getArchivedNotifications: () => NotificationDetail[];
  loadNextPage: () => Promise<void>;
}

const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      pagination: {
        total: 0,
        page: 1,
        pageSize: 20,
      },

      fetchNotifications: async (page = 1, pageSize = 20) => {
        set({ isLoading: true, error: null });
        try {
          const response = await NotificationService.fetchNotifications(page, pageSize);
          
          set({
            notifications: page === 1 
              ? response.notifications || [] 
              : [...get().notifications, ...(response.notifications || [])],
            pagination: {
              total: response.total || 0,
              page: response.page || 1,
              pageSize: response.page_size || 20,
            },
            unreadCount: (response.notifications || []).filter((n: NotificationDetail) => !n.is_read).length,
            isLoading: false
          });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch notifications',
            isLoading: false
          });
        }
      },

      loadNextPage: async () => {
        const currentPage = get().pagination.page;
        const pageSize = get().pagination.pageSize;
        const total = get().pagination.total;
        const currentCount = get().notifications.length;

        // Only load next page if there are more notifications to load
        if (currentCount < total) {
          await get().fetchNotifications(currentPage + 1, pageSize);
        }
      },

      setNotifications: (notifications) => {
        set({
          notifications,
          unreadCount: notifications.filter((n) => !n.is_read).length,
        });
      },

      addNotification: (notification) => {
        // Check if notification already exists to avoid duplicates
        const exists = get().notifications.some(n => n.id === notification.id);
        
        if (!exists) {
          const updated = [notification, ...get().notifications];
          set({
            notifications: updated,
            unreadCount: updated.filter((n) => !n.is_read).length,
          });
        }
      },

      updateNotification: (notificationId, updates) => {
        const updated = get().notifications.map((n) =>
          n.id === notificationId ? { ...n, ...updates } : n
        );
        set({
          notifications: updated,
          unreadCount: updated.filter((n) => !n.is_read).length,
        });
      },

      removeNotification: (notificationId) => {
        const updated = get().notifications.filter((n) => n.id !== notificationId);
        set({
          notifications: updated,
          unreadCount: updated.filter((n) => !n.is_read).length,
        });
      },

      markAsRead: async (notificationId) => {
        set({ isLoading: true, error: null });
        try {
          await NotificationService.markAsRead(notificationId);
          const updated = get().notifications.map((n) =>
            n.id === notificationId 
              ? { 
                  ...n, 
                  is_read: true, 
                  status: "read" as NotificationStatus,
                  read_at: new Date().toISOString()
                } 
              : n
          );
          set({
            notifications: updated,
            unreadCount: updated.filter((n) => !n.is_read).length,
            isLoading: false
          });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to mark notification as read',
            isLoading: false
          });
          throw error;
        }
      },

      markAllAsRead: async () => {
        set({ isLoading: true, error: null });
        try {
          await NotificationService.markAllAsRead();
          const updated = get().notifications.map((n) => ({
            ...n,
            is_read: true,
            status: "read" as NotificationStatus,
            read_at: n.read_at || new Date().toISOString()
          }));
          set({
            notifications: updated,
            unreadCount: 0,
            isLoading: false
          });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to mark all notifications as read',
            isLoading: false
          });
          throw error;
        }
      },

      archiveNotification: async (notificationId) => {
        set({ isLoading: true, error: null });
        try {
          await NotificationService.archiveNotification(notificationId);
          const updated = get().notifications.map((n) =>
            n.id === notificationId 
              ? { ...n, status: "archived" as NotificationStatus }
              : n
          );
          set({
            notifications: updated,
            unreadCount: updated.filter((n) => !n.is_read).length,
            isLoading: false
          });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to archive notification',
            isLoading: false
          });
          throw error;
        }
      },

      deleteNotification: async (notificationId) => {
        set({ isLoading: true, error: null });
        try {
          await NotificationService.deleteNotification(notificationId);
          get().removeNotification(notificationId);
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to delete notification',
            isLoading: false
          });
          throw error;
        }
      },

      clearAllNotifications: () => {
        set({
          notifications: [],
          unreadCount: 0
        });
      },

      clearError: () => set({ error: null }),

      setLoading: (isLoading) => set({ isLoading }),

      // Getters/Selectors
      getNotificationById: (id) => {
        return get().notifications.find((n) => n.id === id);
      },

      getNotificationsByType: (type) => {
        return get().notifications.filter((n) => n.type === type);
      },

      getNotificationsByEventType: (eventType) => {
        return get().notifications.filter((n) => n.event_type === eventType);
      },

      getUnreadNotifications: () => {
        return get().notifications.filter((n) => !n.is_read);
      },

      getArchivedNotifications: () => {
        return get().notifications.filter((n) => n.status === "archived");
      },
    }),
    {
      name: 'notifications-storage',
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
);

export default useNotificationStore;















// import { create } from 'zustand';
// import { persist } from 'zustand/middleware';
// import CookieService from '../cookie-service';

// export interface Notification {
//   id: number;
//   message: string;
//   read: boolean;
//   timestamp: string;
//   type: 'info' | 'success' | 'warning' | 'error';
// }

// interface NotificationState {
//   notifications: Notification[];
//   nextId: number;
  
//   // Derived state
//   unreadCount: number;
  
//   // Actions
//   addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
//   markAsRead: (id: number) => void;
//   markAllAsRead: () => void;
//   clearNotifications: () => void;
// }

// const useNotificationStore = create<NotificationState>()(
//   persist(
//     (set, get) => ({
//       notifications: [],
//       nextId: 1,
      
//       // Computed property using a getter
//       get unreadCount() {
//         return get().notifications.filter(n => !n.read).length;
//       },
      
//       addNotification: (notification) => {
//         const newNotification: Notification = {
//           ...notification,
//           id: get().nextId,
//           timestamp: new Date().toISOString()
//         };
        
//         set(state => ({
//           notifications: [newNotification, ...state.notifications],
//           nextId: state.nextId + 1
//         }));
        
//         // Also update cookies for persistence
//         const updatedNotifications = [newNotification, ...get().notifications];
//         CookieService.setNotifications(updatedNotifications);
//       },
      
//       markAsRead: (id) => {
//         set(state => ({
//           notifications: state.notifications.map(notification => 
//             notification.id === id ? { ...notification, read: true } : notification
//           )
//         }));
        
//         // Update cookies
//         const updatedNotifications = get().notifications.map(notification => 
//           notification.id === id ? { ...notification, read: true } : notification
//         );
//         CookieService.setNotifications(updatedNotifications);
//       },
      
//       markAllAsRead: () => {
//         set(state => ({
//           notifications: state.notifications.map(notification => ({ ...notification, read: true }))
//         }));
        
//         // Update cookies
//         const updatedNotifications = get().notifications.map(notification => 
//           ({ ...notification, read: true })
//         );
//         CookieService.setNotifications(updatedNotifications);
//       },
      
//       clearNotifications: () => {
//         set({ notifications: [] });
        
//         // Update cookies
//         CookieService.setNotifications([]);
//       }
//     }),
//     {
//       name: 'notification-storage',
//       // Store all notification data for persistence
//       partialize: (state) => ({ 
//         notifications: state.notifications,
//         nextId: state.nextId
//       }),
//     }
//   )
// );

// // Initialize with data from cookies if available
// const initializeFromCookies = () => {
//   const savedNotifications = CookieService.getNotifications();
//   const savedNextId = CookieService.getNextNotificationId();
  
//   if (savedNotifications && savedNotifications.length > 0) {
//     useNotificationStore.setState({ 
//       notifications: savedNotifications,
//       nextId: savedNextId
//     });
//   } else {
//     // Add some demo notifications if none exist
//     useNotificationStore.setState({
//       notifications: [
//         {
//           id: 1,
//           message: "New cooperative invitation from Sunshine Savings Group",
//           read: false,
//           timestamp: new Date().toISOString(),
//           type: 'info'
//         },
//         {
//           id: 2,
//           message: "Payment of ₦25,000 received from your cooperative savings",
//           read: false,
//           timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
//           type: 'success'
//         },
//         {
//           id: 3,
//           message: "Profile update successful",
//           read: true,
//           timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
//           type: 'success'
//         }
//       ],
//       nextId: 4
//     });
//   }
// };

// // Run initialization if we're in a browser environment
// if (typeof window !== 'undefined') {
//   initializeFromCookies();
// }

// export default useNotificationStore; 