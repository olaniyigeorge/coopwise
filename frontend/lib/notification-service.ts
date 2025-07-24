import AuthService from "./auth-service";

const NEXT_PUBLIC_WS_URL = process.env.NEXT_PUBLIC_WS_URL as string;

interface NotificationsResponse {
  total: number;
  page: number;
  page_size: number;
  notifications: any[];
}

const NotificationService = {
    async fetchNotifications(page: number = 1, pageSize: number = 20) {
        const token = await AuthService.getToken();
        if (!token) {
            throw new Error('You must be logged in to get your notifications');
        }
        
        const res = await fetch(`/api/v1/notifications/me?page=${page}&page_size=${pageSize}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            }
        );
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Error fetching notifications:', errorText);
            throw new Error("Failed to fetch notifications");
        }
        
        const data: NotificationsResponse = await res.json();
        return data;
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
                body: JSON.stringify({ status: "read" })
        });
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Error marking notification as read:', errorText);
            throw new Error("Failed to mark notification as read");
        }
        
        return res.json();
    },
  
    async connectWebSocket(userId: string, onMessage: (data: any) => void) {
        const token = await AuthService.getToken();
    
        if (!token) {
            throw new Error('You must be logged in to get your notifications');
        }
    
        const ws_notification_endpoint = `${NEXT_PUBLIC_WS_URL}/api/v1/notifications/ws?token=${token}`
        console.log(`🔌 Connecting to WebSocket: ${ws_notification_endpoint}`);
    
        const socket = new WebSocket(ws_notification_endpoint);
    
        socket.onopen = () => {
            console.log("WebSocket connected");
            console.log("Socket readyState:", socket.readyState);
        };
    
        socket.onmessage = (event) => {
            try {
                const parsedData = JSON.parse(event.data);
                onMessage(parsedData);
            } catch (err) {
                console.error("Invalid WebSocket data", err);
                console.error("Raw data that failed to parse:", event.data);
            }
        };
    
        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };
    
        socket.onclose = (event) => {
            console.log("🔌 WebSocket closed:", event.code, event.reason);
            
            // Attempt to reconnect after a delay if not intentionally closed
            if (event.code !== 1000) {
                console.log("🔄 Attempting to reconnect in 5 seconds...");
                setTimeout(() => {
                    this.connectWebSocket(userId, onMessage);
                }, 5000);
            }
        };
    
        return socket;
    },

    async createAndPushNotification(data: {
        user_id: string;
        title: string;
        message: string;
        event_type: string;
        type: string;
        entity_url?: string;
    }) {
        const token = await AuthService.getToken();
        if (!token) {
            throw new Error('You must be logged in to create notifications');
        }
        
        const res = await fetch(`/api/v1/notifications/create_and_push`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Error creating notification:', errorText);
            throw new Error("Failed to create notification");
        }
        
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
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Error marking all notifications as read:', errorText);
            throw new Error("Failed to mark all notifications as read");
        }
        
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
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Error archiving notification:', errorText);
            throw new Error("Failed to archive notification");
        }
        
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
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Error deleting notification:', errorText);
            throw new Error("Failed to delete notification");
        }
        
        return res.json();
    }
}
  
export default NotificationService;