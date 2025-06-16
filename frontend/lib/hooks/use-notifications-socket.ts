import { useEffect } from "react";
import { toast } from "sonner";
import { useAppStore } from "./use-app-store";
import NotificationService from "../notification-service";
import { NotificationDetail } from "../stores/notification-store";

/**
 * Hook to initialize WebSocket connection for notifications,
 * fetch initial notifications, save to store, and show toast for new ones.
 */
export const useNotificationListener = () => {
  const { auth, notifications } = useAppStore();
  const { user } = auth;
  const { addNotification, setNotifications } = notifications;

  useEffect(() => {
    if (!user) {
      console.log("❌ User not authenticated. Skipping WebSocket connection");
      return;
    }

    let socket: WebSocket;

    const connect = async () => {
      try {
        socket = await NotificationService.connectWebSocket(user.id, (data: NotificationDetail) => {
          // Parse if it's still a string 
          let notificationData;
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
          // Add notif to store
          addNotification(notificationData);
          

          // Toast notif
          toast.success(
            notificationData.title || "New Notification",
            {
              description: notificationData.message, 
              duration: 5000,
            }
          )
        });

        console.log("✅ Notif listener conn established");
        
      } catch (error) {
        console.error("❌ Failed to connect notif listener:", error);
      }
    };

    connect();

    return () => {
      if (socket) {
        console.log("🔌 Closing WebSocket connection");
        socket.close();
      }
    };

  }, [user?.id, addNotification, notifications.notifications.length]);

  // Fetch initial notifications
  useEffect(() => {
    if (!user) return;

    const fetchInitialNotifications = async () => {
      try {
        const data = await NotificationService.fetchNotifications(user.id);
        setNotifications(data.notifications || []);
      } catch (error) {
        console.error("❌ Failed to fetch initial notifications:", error);
      }
    };

    fetchInitialNotifications();
  }, [user?.id, setNotifications]);
};