import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotificationStore } from '@/lib/hooks/use-app-store';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationDropdown() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications 
  } = useNotificationStore();

  // Format the timestamp to a relative time (e.g. "2 hours ago")
  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return 'recently';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center translate-x-1/4 -translate-y-1/4">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7 px-2"
              onClick={() => markAllAsRead()}
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup className="max-h-[300px] overflow-auto">
          {notifications.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map(notification => (
              <DropdownMenuItem 
                key={notification.id}
                className={`p-3 cursor-default ${!notification.read ? 'bg-accent/50' : ''}`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex flex-col space-y-1 w-full">
                  <div className="flex items-start justify-between">
                    <span className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                      {notification.message}
                    </span>
                    {!notification.read && (
                      <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1"></span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(notification.timestamp)}
                  </span>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => clearNotifications()}
              >
                Clear all
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 