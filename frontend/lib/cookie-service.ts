import Cookies from 'js-cookie';

// Constants
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user';
const NOTIFICATIONS_KEY = 'notifications';
const NEXT_NOTIFICATION_ID_KEY = 'nextNotificationId';

// Cookie options
const cookieOptions = {
  expires: 7, // 7 days
  path: '/',
  secure: process.env.NODE_ENV === 'production', // Only send cookie over HTTPS in production
  sameSite: 'strict' as const
};

// Cookie service
const CookieService = {
  // General purpose set method
  set(key: string, value: any, options = {}): void {
    const mergedOptions = { ...cookieOptions, ...options };
    Cookies.set(key, typeof value === 'object' ? JSON.stringify(value) : value, mergedOptions);
  },

  // General purpose get method
  get(key: string): any {
    const value = Cookies.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch (e) {
      // If it's not JSON, return the raw value
      return value;
    }
  },

  // General purpose remove method
  remove(key: string, options = {}): void {
    const mergedOptions = { path: '/', ...options };
    Cookies.remove(key, mergedOptions);
  },
  
  // Set token cookie
  setToken(token: string): void {
    Cookies.set(TOKEN_KEY, token, cookieOptions);
  },

  // Get token from cookie
  getToken(): string | undefined {
    return Cookies.get(TOKEN_KEY);
  },

  // Remove token cookie
  removeToken(): void {
    Cookies.remove(TOKEN_KEY, { path: '/' });
  },

  // Set user cookie
  setUser(user: any): void {
    Cookies.set(USER_KEY, JSON.stringify(user), cookieOptions);
  },

  // Get user from cookie
  getUser(): any | null {
    const userStr = Cookies.get(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user from cookie:', e);
        return null;
      }
    }
    return null;
  },

  // Remove user cookie
  removeUser(): void {
    Cookies.remove(USER_KEY, { path: '/' });
  },

  // Clear all auth cookies
  clearAuth(): void {
    this.removeToken();
    this.removeUser();
  },

  // Notification methods
  setNotifications(notifications: any[]): void {
    Cookies.set(NOTIFICATIONS_KEY, JSON.stringify(notifications), cookieOptions);
  },

  getNotifications(): any[] {
    const notificationsStr = Cookies.get(NOTIFICATIONS_KEY);
    if (notificationsStr) {
      try {
        return JSON.parse(notificationsStr);
      } catch (e) {
        console.error('Error parsing notifications from cookie:', e);
        return [];
      }
    }
    return [];
  },

  setNextNotificationId(id: number): void {
    Cookies.set(NEXT_NOTIFICATION_ID_KEY, id.toString(), cookieOptions);
  },

  getNextNotificationId(): number {
    const nextIdStr = Cookies.get(NEXT_NOTIFICATION_ID_KEY);
    if (nextIdStr) {
      return parseInt(nextIdStr, 10);
    }
    return 1;
  }
};

export default CookieService; 