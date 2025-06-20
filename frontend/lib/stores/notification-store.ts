import { create } from "zustand";
import { persist } from "zustand/middleware";
import NotificationService from '../notification-service'; // Assuming you have this
import { toast } from "sonner";

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

export type NotificationStatus = "unread" | "read" | "archived" | "deleted";

export interface NotificationDetail {
  id: string; // UUID (string)
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  event_type: EventType;
  entity_url?: string | null;

  is_read: boolean;
  read_at?: string | null;

  created_at: string;
  updated_at: string;
}

interface NotificationStore {
  notifications: NotificationDetail[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchNotifications: () => Promise<void>;
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
}

const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,

      fetchNotifications: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await NotificationService.getNotifications();
          if (response.notifications) {
            set({
              notifications: response.notifications,
              unreadCount: response.notifications.filter((n: NotificationDetail) => !n.is_read).length,
              isLoading: false
            });
          }
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch notifications',
            isLoading: false
          });
        }
      },

      setNotifications: (notifications) => {
        set({
          notifications,
          unreadCount: notifications.filter((n) => !n.is_read).length,
        });
      },

      addNotification: (notification) => {
        let updated = [notification, ...get().notifications]; // Attempt on multiple notif toast and duplicate notifs
        if (get().notifications.includes(notification)) {
          updated = get().notifications;
        }
        set({
          notifications: updated,
          unreadCount: updated.filter((n) => !n.is_read).length,
        });
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
          toast("Notification marked as read", {
            description: "You have successfully marked the notification as read.",
            duration: 3000,
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
          toast("Notifications marked as read", {
            description: "You have successfully marked all your notifications as read.",
            duration: 3000,
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
      name: 'notification-storage',
      // Only persist non-sensitive data
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount
      }),
    }
  )
);

export default useNotificationStore;








