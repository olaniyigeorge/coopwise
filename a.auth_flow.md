# Coopwise Authentication Flow

## Overview

Coopwise implements a **user-friendly authentication system** designed for non-crypto-native users.

Instead of requiring wallets, users can:

- Sign in with **email (Google login)**
- Automatically receive a **custodial wallet** via Crossmint
- Be authenticated using **backend-issued access tokens**

This abstracts blockchain complexity while preserving on-chain capabilities.

---

## Core Components

- **Frontend**: Next.js + Express Proxy
- **Auth Provider**: Crossmint
- **Blockchain**: Flow
- **State Management**: Zustand
- **Session Storage**: HTTP-only cookies

---

## Authentication Flow

### Step 1 — User Initiates Login

**Route**: `/auth/login`

**User Action**: Clicks **"Continue with Email (Google)"**

---

### Step 2 — Crossmint Authentication

**Hook used**: `useWalletFlow()`

**Function called**: `login()`

**Behavior**:
- Opens Crossmint authentication popup
- User logs in with email
- Crossmint handles authentication and wallet creation (if new user)

**Crossmint Response**:
```json
{
  "crossmint_user_id": "...",
  "email": "user@example.com",
  "wallet_address": "0x..."
}
```

---

### Step 3 — Sync with Backend

**Frontend Proxy**: `POST /api/auth/crossmint-sync`

**Backend Endpoint**: `POST /api/v1/auth/crossmint`

**Payload**:
```json
{
  "crossmint_user_id": "...",
  "email": "user@example.com",
  "wallet_address": "0x..."
}
```

---

### Step 4 — Backend User Resolution

**Logic**:
1. Check if user exists by `crossmint_user_id`
2. If not found, check by `email`

**Case 1 — User Exists**: Return existing user and generate access token

**Case 2 — User Does Not Exist**: Create new user with `crossmint_user_id`, `email`, and `wallet_address`, then generate access token

**Backend Response**:
```json
{
  "user": {
    "id": "...",
    "crossmint_user_id": "...",
    "email": "...",
    "wallet_address": "...",
    "full_name": "...",
    "email_verified": true,
    "phone_number": "..."
  },
  "access_token": "..."
}
```

---

### Step 5 — Session Persistence (Frontend)

**HTTP-only Cookies**:
```
auth_token=<access_token>
crossmint_jwt=<crossmint_token>
crossmint_refresh_token=<refresh_token>
```

**Notes**: Cookies are HTTP-only, used for authenticated backend requests, and not accessible via JavaScript (secure)

---

### Step 6 — Client State (Zustand)

**Auth State Structure**:
```json
{
  "authenticated": true,
  "user": {
    "id": "...",
    "crossmint_user_id": "...",
    "email": "...",
    "wallet_address": "...",
    "full_name": "...",
    "email_verified": true,
    "phone_number": "..."
  }
}
```

**Additional Client Data**:
```json
{
  "notification_id": "...",
  "notifications": []
}
```

---

## Flow Summary

| Step | Action | System |
|------|--------|--------|
| 1 | User clicks login | Frontend |
| 2 | Crossmint auth popup | Crossmint |
| 3 | Return user + wallet | Crossmint |
| 4 | Sync with backend | API |
| 5 | Create/find user | Backend |
| 6 | Issue access token | Backend |
| 7 | Store cookies | Frontend |
| 8 | Update Zustand state | Frontend |

---

## Key Design Principles

1. **Web2 UX, Web3 Backend**: Users authenticate with email; wallets are created automatically
2. **Custodial Wallet Abstraction**: No need for seed phrases or wallet extensions
3. **Backend-Controlled Auth**: Access tokens issued by Coopwise backend for authorization and session control
4. **Secure Token Storage**: HTTP-only cookies prevent XSS attacks

---

## Security Considerations

- Validate Crossmint tokens server-side
- Use short-lived access tokens
- Implement refresh token rotation
- Enforce HTTPS for all cookies
- Rate limit auth endpoints

---

## Optional Enhancements

- Logout endpoint (invalidate tokens)
- Token refresh endpoint
- Multi-device session management
- Email verification enforcement
- Phone-based authentication fallback

---

## End Result

After authentication, the user is logged in, wallet is created (via Crossmint), backend user exists, access token is stored securely, and the user can interact with Coopwise seamlessly.
