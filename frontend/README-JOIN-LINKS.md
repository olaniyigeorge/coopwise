# Join Link System for Unauthenticated Users

This document describes the new join link system that allows unauthenticated users to view group information before signing in to join.

## Overview

The system now provides two main flows:

1. **Public Group Preview** (`/invite/[code]`) - For unauthenticated users to view group information
2. **Authenticated Join** (`/invite/[code]/join`) - For authenticated users to actually join the group

## How It Works

### 1. Public Group Preview Page (`/invite/[code]`)

- **URL**: `/invite/[code]` where `[code]` is the invite code
- **Access**: Public (no authentication required)
- **Purpose**: Show group information to potential members before they sign up/login

**Features:**
- Displays group name, description, contribution amount, frequency
- Shows member count (without revealing individual profiles)
- Displays group rules (limited preview)
- Provides "Sign In to Join" and "Create Account" buttons
- Stores invite code in localStorage for after authentication

**API Endpoint**: `/api/groups/public/invite/[code]`
- Fetches basic group information from backend
- Handles cases where backend requires authentication gracefully
- Returns only safe, public information

### 2. Authenticated Join Page (`/invite/[code]/join`)

- **URL**: `/invite/[code]/join`
- **Access**: Requires authentication
- **Purpose**: Handle the actual group joining process

**Features:**
- Automatically redirects unauthenticated users to login
- Shows group summary before joining
- Handles the join process using GroupService
- Redirects to dashboard after successful join

## User Flow

### For Unauthenticated Users:

1. User clicks invite link → `/invite/[code]`
2. User sees group preview with basic information
3. User clicks "Sign In to Join" or "Create Account"
4. Invite code is stored in localStorage
5. User is redirected to auth page with return URL
6. After successful auth, user is automatically redirected to `/invite/[code]/join`
7. User confirms joining and becomes a member

### For Authenticated Users:

1. User clicks invite link → `/invite/[code]`
2. User sees group preview
3. User clicks "Join Group" → redirected to `/invite/[code]/join`
4. User confirms joining and becomes a member

## Technical Implementation

### Components

- **`PublicGroupPreview`** (`/components/invite/public-group-preview.tsx`)
  - Handles the unauthenticated view
  - Shows group information safely
  - Manages redirects to auth pages

- **`JoinGroupPage`** (`/app/invite/[code]/join/page.tsx`)
  - Handles authenticated joining
  - Integrates with GroupService
  - Manages join flow and success states

### API Routes

- **`/api/groups/public/invite/[code]`**
  - Public endpoint for group information
  - No authentication required
  - Gracefully handles backend auth requirements

### Authentication Integration

- **Auth Context Updates**
  - Modified login/register functions to handle return URLs
  - Automatically processes pending invite codes after authentication
  - Redirects users to appropriate pages

- **Local Storage Management**
  - Stores pending invite codes temporarily
  - Clears codes after successful processing
  - Handles edge cases gracefully

## Security Considerations

- **Public Information Only**: Only safe, non-sensitive group data is exposed
- **No Member Profiles**: Individual member information is not shown to unauthenticated users
- **Invite Code Validation**: Codes are validated before showing any information
- **Authentication Required**: Actual joining requires proper authentication

## Benefits

1. **Better User Experience**: Users can see what they're joining before creating accounts
2. **Increased Conversion**: Reduces friction in the signup process
3. **Social Sharing**: Invite links can be shared publicly without exposing sensitive data
4. **Seamless Flow**: Automatic redirects after authentication provide smooth user experience

## Testing

To test the system:

1. Create a group and generate an invite code
2. Share the invite link (`/invite/[code]`) with someone
3. Verify they can see group information without logging in
4. Test the signup/login flow with the invite code
5. Verify automatic joining after authentication

## Future Enhancements

- **Analytics**: Track invite link clicks and conversions
- **Customization**: Allow group creators to customize public preview content
- **Social Features**: Add sharing buttons and social media integration
- **Mobile Optimization**: Ensure mobile-friendly experience for shared links
