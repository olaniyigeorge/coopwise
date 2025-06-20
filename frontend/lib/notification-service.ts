import AuthService from "./auth-service";

const NEXT_PUBLIC_WS_URL = process.env.NEXT_PUBLIC_WS_URL as string;

const NotificationService = {
    async fetchNotifications(userId: string) {
        const token = await AuthService.getToken();
        if (!token) {
        throw new Error('You must be logged in to get your notifications');
        }
        
        const res = await fetch(`/api/v1/notifications`, {
                method: 'GET',
                headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
                },
            }
        );
        if (!res.ok) throw new Error("Failed to fetch notifications");
        return res.json();
    },

    async markAsRead(notificationId: string) {
        const token = await AuthService.getToken();

        if (!token) {
        throw new Error('You must be logged in to update a notification');
        }
        const res = await fetch(`/api/v1/notifications/${notificationId}`, {
                method: "PATCH",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({status: "read"})
        });
        if (!res.ok) throw new Error("Failed to mark notification as read");
        return res.json();
    },
  
    async connectWebSocket(userId: string, onMessage: (data: any) => void) {
        const token = await AuthService.getToken();
    
        if (!token) {
            throw new Error('You must be logged in to get your notifications');
        }
    
        const ws_notification_endpoint = `${NEXT_PUBLIC_WS_URL}/api/v1/notifications/ws?token=${token}`
        // console.log(`🔌 Connecting to: ${ws_notification_endpoint}`)
    
        const socket = new WebSocket(ws_notification_endpoint);
    
        socket.onopen = () => {
            console.log("✅ WebSocket connected");
            console.log("Socket readyState:", socket.readyState);
        };
    
        socket.onmessage = (event) => {
            // console.log(`📨 Raw WebSocket message received:`, event.data);

            try {
                const parsedData = JSON.parse(event.data);
                // console.log(`📋 Parsed data:`, parsedData);
                // console.log(`📋 Type of parsed data:`, typeof parsedData);
                // console.log(`📋 Parsed data title:`, parsedData.title);
                // console.log(`📋 Parsed data message:`, parsedData.message);
                
                onMessage(parsedData); // Make sure we're passing the parsed object
            } catch (err) {
                console.error("❌ Invalid WebSocket data", err);
                console.error("❌ Raw data that failed to parse:", event.data);
            }
        };
    
        socket.onerror = (error) => {
            console.error("❌ WebSocket error:", error);
        };
    
        socket.onclose = (event) => {
            console.log("🔌 WebSocket closed:", event.code, event.reason);
        };
    
        return socket;
    },

    async getNotifications() {
        const token = await AuthService.getToken();
        if (!token) {
            throw new Error('You must be logged in to get your notifications');
        }
        
        const res = await fetch(`/api/v1/notifications`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });
        if (!res.ok) throw new Error("Failed to fetch notifications");
        return res.json();
    },

    async markAllAsRead() {
        const token = await AuthService.getToken();
        if (!token) {
            throw new Error('You must be logged in to mark notifications as read');
        }
        
        const res = await fetch(`/api/v1/notifications/mark-all-as-read`, {
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error("Failed to mark all notifications as read");
        return res.json();
    },

    async archiveNotification(notificationId: string) {
        const token = await AuthService.getToken();
        if (!token) {
            throw new Error('You must be logged in to archive notifications');
        }
        
        const res = await fetch(`/api/v1/notifications/${notificationId}/archive`, {
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({status: "archived"})
        });
        if (!res.ok) throw new Error("Failed to archive notification");
        return res.json();
    },

    async deleteNotification(notificationId: string) {
        const token = await AuthService.getToken();
        if (!token) {
            throw new Error('You must be logged in to delete notifications');
        }
        
        const res = await fetch(`/api/v1/notifications/${notificationId}`, {
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error("Failed to delete notification");
        return res.json();
    }
}
  

export default NotificationService;