import { useEffect } from "react";
import { toast } from "sonner";
import { useAppStore } from "./use-app-store";
import NotificationService from "../../services/notification-service";
import { NotificationDetail } from "../../stores/notification-store";

/**
 * Hook to initialize WebSocket connection for notifications,
 * fetch initial notifications, save to store, and show toast for new ones.
 */
export const useNotificationListener = () => {
  const { auth, notifications } = useAppStore();
  const { user } = auth;
  const { addNotification, fetchNotifications } = notifications;

  // Set up WebSocket connection for real-time notifications
  useEffect(() => {
    if (!user) {
      console.log("❌ User not authenticated. Skipping WebSocket connection");
      return;
    }

    let socket: WebSocket | undefined;
    // connect() is async: if this effect is cleaned up (StrictMode, user or
    // callback identity change) before it resolves, `socket` is still
    // undefined and would never be closed — leaking a connection that then
    // delivers (and toasts) every notification again.
    let cancelled = false;

    const connect = async () => {
      try {
        const opened = await NotificationService.connectWebSocket(user.id, (data: NotificationDetail | string) => {
          if (cancelled) return;
          // Parse if it's still a string 
          let notificationData: NotificationDetail;
          if (typeof data === 'string') {
            try {
              notificationData = JSON.parse(data);
            } catch (e) {
              console.error("Failed to parse notification data:", e);
              return;
            }
          } else {
            notificationData = data;
          }

          // Add notification to store
          addNotification(notificationData);

          // Show toast notification with proper type handling
          const toastMap = {
            success: toast.success,
            warning: toast.warning,
            danger: toast.error,
          } as const;

          const toastFn = toastMap[notificationData.type as keyof typeof toastMap] || toast;

          toastFn(notificationData.title || "New Notification", {
            description: notificationData.message,
            duration: 5000,
            // Same notification => same toast, never a stack of duplicates.
            id: notificationData.id ? `notification-${notificationData.id}` : undefined,
          });
        });

        if (cancelled) {
          opened.close(1000);
          return;
        }
        socket = opened;

        console.log(" Notification websocket connection established");

      } catch (error) {
        console.error("❌ Failed to connect to notification websocket:", error);
      }
    };


    connect();

    return () => {
      cancelled = true;
      if (socket) {
        console.log("🔌 Closing WebSocket connection");
        socket.close(1000); // Normal closure
      }
    };

  }, [user, addNotification]);

  // Fetch initial notifications
  useEffect(() => {
    if (!user) return;

    const loadInitialNotifications = async () => {
      try {
        await fetchNotifications();
        console.log("Initial notifications loaded");
      } catch (error) {
        console.error("Failed to fetch initial notifications:", error);
      }
    };

    loadInitialNotifications();
  }, [user, fetchNotifications]);
};