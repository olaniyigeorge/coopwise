# Coopwise Join Flow (Detailed)

## Overview

This document describes the full **Join Flow** for Coopwise, including:

- Frontend → Proxy → Backend interactions
- Public invite preview flow
- Authenticated join request flow
- Membership creation and validation logic

---

## Stage 1 — Invite Link Generation (Share Flow)

### User Action

User navigates to `/dashboard/circle/:circle_id` and clicks **"Share"**.

### Frontend Request (Proxy Layer)

```
POST /api/circle/:id/invite
```

### Backend Request

Proxy forwards request to:

```
POST /api/v1/collaborative/:id/invite
```

### Behavior

- Backend generates an **invite code**
- Code encodes:
    - `group_id`
    - `invited_by` (user ID)

### Response

```json
{
    "invite_link": "https://app.coopwise/invite/:code"
}
```

### Outcome

User copies and shares invite link.

---

## Stage 2 — Invite Link Access (Public Preview)

### User Action

User clicks invite link: `/invite/:code`

### Backend Request (No Proxy, No Auth)

```
GET /api/v1/corporate/invite/:code
```

### Behavior

- Decode invite code
- Extract `group_id`
- Fetch **public circle data**

### Response

```json
{
    "name": "Circle Name",
    "amount": 5000,
    "member_count": 10,
    "description": "..."
}
```

### Notes

- No authentication required
- No membership created
- Read-only preview

---

## Stage 3 — Join Request

### User Action

User clicks **"Join"**.

### Authentication Handling

**If NOT authenticated:** Redirect to `/auth/login`

**If authenticated:** Proceed to `/invite/:code/join`

### Backend Request

```
POST /api/v1/circle/:circle_id/join
```

### Behavior

Backend performs:

1. Validate invite code
2. Extract `group_id` and `invited_by`
3. Check for existing membership

### Case 1 — Membership Exists

```json
{
    "message": "Membership already exists"
}
```

### Case 2 — No Membership Exists

Create new membership:

```json
{
    "user_id": "<authenticated_user>",
    "group_id": "<from_code>",
    "status": "pending",
    "invited_by": "<from_code>"
}
```

### Outcome

Membership created with **pending** status, awaiting approval.

---

## Stage 4 — Membership Approval

### Trigger

Existing members receive notification.

### Backend Endpoint

```
POST /api/v1/memberships/:id/approve
```

(or reject equivalent)

### Approval Behavior

Update `status = "accepted"` — User becomes active member.

### Rejection Behavior

Update `status = "rejected"`.

---

## On-Chain Synchronization

### When It Happens

Only after `status = accepted`.

### Behavior

Append user to on-chain member list for the circle.

### Reasoning

- Prevents unverified users on-chain
- Ensures data integrity
- Reduces unnecessary writes

---

## Full Flow Summary

| Stage | Action | Endpoint | Auth | DB Write | On-Chain |
|-------|--------|----------|------|----------|----------|
| 1 | Generate invite | `POST /api/v1/collaborative/:id/invite` | Yes | No | No |
| 2 | Preview | `GET /api/v1/corporate/invite/:code` | No | No | No |
| 3 | Join | `POST /api/v1/circle/:circle_id/join` | Yes | Yes (pending) | No |
| 4 | Approve | `POST /api/v1/memberships/:id/approve` | Yes | Yes | Yes |

---

## Key Rules

### 1. Only Accepted Members Can Invite

Must validate membership status before generating invite.

### 2. Invite Code is Source of Truth

Contains: `group_id` and `invited_by`.

### 3. Membership Creation is Idempotent

Prevent duplicate memberships.

### 4. On-Chain Writes are Deferred

Only after approval.

---

## Suggested Improvements

- Invite expiration (TTL)
- Max usage per invite
- Admin-only approvals (optional)
- Rate limiting join requests
- Signed invite tokens (JWT/HMAC)
