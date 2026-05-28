# Zustand State Management in CoopWise

This project uses Zustand for state management, which provides a lightweight and flexible approach to managing application state.

## Key Features

- **Minimal API** - Simple and intuitive API that's easy to learn and use
- **Performance** - High performance with minimal re-renders
- **TypeScript Support** - Full TypeScript support with proper typing
- **Middleware** - Built-in middleware for features like persistence and state immer

## Store Structure

The application's state is divided into multiple stores:

### AuthStore (`auth-store.ts`)

Handles authentication state, including:
- User information
- Authentication status
- Login/logout functionality
- Error handling

```typescript
const { user, isAuthenticated, login, logout } = useAuthStore();
```

### NotificationStore (`notification-store.ts`)

Manages application notifications:
- Notification list
- Unread count
- Adding notifications
- Marking notifications as read

```typescript
const { notifications, unreadCount, addNotification } = useNotificationStore();
```

### GroupStore (`group-store.ts`)

Manages cooperative group data:
- User's groups
- Available groups
- Current selected group
- Group operations (create, join, etc.)

```typescript
const { myGroups, availableGroups, fetchMyGroups } = useGroupStore();
```

## Combined Hook

We provide a combined hook (`use-app-store.ts`) to easily access all stores:

```typescript
import { useAppStore } from '@/lib/hooks/use-app-store';

function MyComponent() {
  const { auth, notifications, groups } = useAppStore();
  
  // Use the stores
  return (
    <div>
      {auth.isAuthenticated ? (
        <p>Welcome, {auth.user?.full_name}</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
```

## Persistence

All stores use the Zustand `persist` middleware to persist relevant state in localStorage. This allows for maintaining state across page refreshes.

Additionally, we use cookies via the `CookieService` for security-sensitive data like authentication tokens.

## Benefits of This Approach

1. **Modular State Management**: Each domain has its own store
2. **Type Safety**: Full TypeScript support with proper typing
3. **Performance**: Minimal re-renders with fine-grained updates
4. **Simplicity**: Simple API with a small learning curve
5. **Persistence**: Built-in state persistence using cookies and localStorage
6. **Security**: HTTP-only cookies for sensitive data, complemented with client-side state management

## Migration from Context API

We've migrated from React Context API to Zustand for several benefits:
- Better performance with fewer re-renders
- Simpler API with less boilerplate
- Built-in persistence
- Developer tools for debugging 