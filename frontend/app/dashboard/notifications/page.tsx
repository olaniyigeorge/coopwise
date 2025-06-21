"use client"

import React, { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Check } from 'lucide-react'
import useAuthStore from '@/lib/stores/auth-store'
import useNotificationStore, { NotificationDetail } from '@/lib/stores/notification-store'
import Link from 'next/link'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getNotificationActionLabel, getNotificationLink } from '@/lib/utils'

export default function NotificationsPage() {
  const { user } = useAuthStore()
  const { notifications, unreadCount, markAllAsRead, markAsRead,  } = useNotificationStore()

  const [selectedNotification, setSelectedNotification] = useState<NotificationDetail | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = (notification: any) => {
    setSelectedNotification(notification)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setSelectedNotification(null)
    setIsModalOpen(false)
  }

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'success':
        return <div className="w-2 h-2 rounded-full bg-green-500"></div>
      case 'warning':
        return <div className="w-2 h-2 rounded-full bg-amber-500"></div>
      case 'error':
        return <div className="w-2 h-2 rounded-full bg-red-500"></div>
      default:
        return <div className="w-2 h-2 rounded-full bg-blue-500"></div>
    }
  }

  return (
    <DashboardLayout>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          {selectedNotification && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedNotification.title}</DialogTitle>
                <DialogDescription className="text-xs text-gray-500">{formatDate(selectedNotification.created_at)}</DialogDescription>
              </DialogHeader>
              <div className="mt-2">{selectedNotification.message}</div>
                  {getNotificationLink(selectedNotification) && (
                    <Link href={getNotificationLink(selectedNotification)!} className="text-blue-600 text-sm underline mt-4 block">
                      {getNotificationActionLabel(selectedNotification)}
                    </Link>
                  )}
              <div className="mt-4 flex justify-end gap-2">
                {!selectedNotification?.is_read && (
                  <Button
                    onClick={() => {
                      markAsRead(selectedNotification.id)
                      closeModal()
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Mark as Read
                  </Button>
                )}
                <DialogClose asChild>
                  <Button size="sm" variant="default">
                    Close
                  </Button>
                </DialogClose>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'
              }
            </p>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              onClick={markAllAsRead}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>All Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`
                      p-4 rounded-lg border flex items-start gap-3
                      ${notification.is_read ? 'bg-white' : 'bg-gray-50 border-gray-200'}
                    `}
                  >
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-primary">
                        <p className={`${notification.is_read ? 'font-normal' : 'font-medium'}`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                      <p className={`${notification.is_read ? 'font-normal' : 'font-medium'}`}>
                          {notification.message}
                      </p>
                      <div className="flex justify-between items--center">
                        {!notification.is_read && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => markAsRead(notification.id)}
                            className="mt-2 h-8 text-xs"
                          >
                            Mark as read
                          </Button>
                        )}
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="mt-2 h-8 text-xs"
                          onClick={() => openModal(notification)}
                        >
                          View details
                        </Button>
                        
                        </div>
                      
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium">No notifications</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    You don't have any notifications at the moment.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 

