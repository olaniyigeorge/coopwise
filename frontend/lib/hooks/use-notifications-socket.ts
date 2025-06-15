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
        console.log(`🔌 Connecting WebSocket for user: ${user.id}`);
        
        socket = await NotificationService.connectWebSocket(user.id, (data: NotificationDetail) => {
          console.log("🔔 NEW NOTIFICATION RECEIVED:", data);
          console.log("📊 Current notifications in store:", notifications.notifications.length);
          
          // Add notif to store
          addNotification(data);
          
          console.log("✅ Added to store, new count:", notifications.notifications.length + 1);

          // Toast notif

          console.log("🔍 Debugging toast data:");
            console.log("Full data object:", data);
            console.log("data.title:", data.title);
            console.log("data.message:", data.message);
            console.log("typeof data:", typeof data);
            console.log("Object.keys(data):", Object.keys(data));

          toast.success(
            data.title || "New Notification",
            {
              description: data.message, 
              duration: 5000,
            }
          )
          console.log("✅ Toasted new notif:", data);

        });

        console.log("✅ WebSocket connection established");
        
      } catch (error) {
        console.error("❌ Failed to connect WebSocket:", error);
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
        console.log("📥 Fetching initial notifications...");
        const data = await NotificationService.fetchNotifications(user.id);
        console.log("📊 Fetched notifications:", data);
        setNotifications(data.notifications || []);
      } catch (error) {
        console.error("❌ Failed to fetch initial notifications:", error);
      }
    };

    fetchInitialNotifications();
  }, [user?.id, setNotifications]);
};