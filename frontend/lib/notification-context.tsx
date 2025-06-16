"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import CookieService from './cookie-service';

export interface Notification {
  id: number;
  message: string;
  read: boolean;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nextId, setNextId] = useState(1);

  // Load notifications from cookies on mount
  useEffect(() => {
    const savedNotifications = CookieService.getNotifications();
    const savedNextId = CookieService.getNextNotificationId();
    
    if (savedNotifications && savedNotifications.length > 0) {
      setNotifications(savedNotifications);
      setNextId(savedNextId);
    } else {
      // Add some demo notifications if none exist
      setNotifications([
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
      ]);
      setNextId(4);
    }
  }, []);

  // Save notifications to cookies whenever they change
  useEffect(() => {
    if (notifications.length > 0) {
      CookieService.setNotifications(notifications);
      CookieService.setNextNotificationId(nextId);
    }
  }, [notifications, nextId]);

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  // Add a new notification
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: nextId,
      timestamp: new Date().toISOString()
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setNextId(prev => prev + 1);
  };

  // Mark a notification as read
  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
} 