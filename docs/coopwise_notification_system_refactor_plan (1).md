# CoopWise Notification System Refactor & Integration Plan

## Goal
Refactor the existing CoopWise monorepo into a cleaner, modular, scalable architecture while implementing the new notification infrastructure described in:

`Notification System: Technical Specification`

The objective is to:

- Reduce backend service sprawl
- Introduce clear domain boundaries
- Centralize notification orchestration
- Improve scalability and maintainability
- Prepare the platform for 1M+ user scale
- Standardize Celery + Redis patterns
- Improve observability and reliability

---

# 1. Current Codebase Problems

## Backend Issues

### Service Layer Explosion

Current structure:

```txt
backend/app/services/
```

Contains:

- auth_service.py
- payment_service.py
- payout_service.py
- notification_service.py
- contribution_service.py
- membership_service.py
- dashboard_service.py
- insights_service.py
- etc.

Problems:

- Services tightly coupled
- Cross-service imports
- No clear domain ownership
- Business logic mixed with infra logic
- Notification logic scattered across modules
- No event-driven boundaries

---

### Router Organization

Current:

```txt
routers/v1
routers/v2
```

Problems:

- Versioning exists but not feature-grouped
- Logic leaks into routers
- No bounded context separation

---

### Notification Infrastructure is Too Thin

Current:

```txt
notification_service.py
notification-context.tsx
```

Missing:

- Event sourcing
- Retry orchestration
- Provider abstraction
- DLQ strategy
- Idempotency guarantees
- Preference management
- Audit trail
- Queue isolation

---

### Worker Structure is Inconsistent

Current:

```txt
workers/
  flow_event_worker.py
  flow_listener.py
```

Problems:

- No unified worker architecture
- No queue separation
- No retry standards
- No dedicated notification workers

---

### Monolithic App Folder

Current:

```txt
app/
  schemas/
  services/
  utils/
  routers/
```

Problems:

- Feature logic spread across folders
- Hard to reason about ownership
- Scaling engineering team becomes painful

---

# 2. Target Architecture

We move to:

```txt
backend/
└── app/
    ├── core/
    ├── infrastructure/
    ├── domains/
    ├── notifications/
    ├── workers/
    ├── api/
    └── shared/
```

---

# 3. Proposed New Backend Structure

## Core

```txt
core/
├── config.py
├── celery.py
├── logging.py
├── security.py
├── database.py
├── redis.py
└── dependencies.py
```

Purpose:

- Application bootstrap
- Infra initialization
- Shared app-level dependencies

---

# 4. Domain-Driven Structure

Instead of generic services/schemas.

## Proposed Domains

```txt
domains/
├── auth/
├── users/
├── groups/
├── contributions/
├── payouts/
├── wallets/
├── memberships/
├── insights/
└── notifications/
```

Each domain contains:

```txt
contributions/
├── models.py
├── schemas.py
├── service.py
├── repository.py
├── events.py
├── tasks.py
├── routes.py
└── exceptions.py
```

Benefits:

- Strong ownership boundaries
- Easier testing
- Easier onboarding
- Clear feature encapsulation
- Event-driven scaling

---

# 5. Notification System Architecture

## New Dedicated Notification Module

```txt
notifications/
├── providers/
│   ├── base.py
│   ├── email/
│   ├── sms/
│   └── push/
├── routers/
│   ├── provider_router.py
│   └── circuit_breaker.py
├── workers/
│   ├── email_worker.py
│   ├── sms_worker.py
│   ├── push_worker.py
│   └── retry_worker.py
├── templates/
├── services/
│   ├── notification_service.py
│   ├── preference_service.py
│   └── audit_service.py
├── repositories/
├── models/
├── schemas/
├── tasks/
├── events/
└── utils/
```

---

# 6. Database Refactor

## New Tables

### notifications

Tracks:

- lifecycle
- status
- provider
- attempts
- timestamps
- idempotency

---

### notification_events

Full audit trail.

Stores:

- queued
- retried
- delivered
- failed
- suppressed
- provider_failures

---

### user_notification_preferences

Stores:

- push enabled
- sms enabled
- email enabled
- marketing preferences

---

# 7. Event-Driven Notification Flow

Current architecture is request-driven.

We move to event-driven.

## Example Flow

### Contribution Paid

```txt
Contribution Service
    ↓
Publishes Event
    ↓
notification.contribution_confirmed
    ↓
Notification Orchestrator
    ↓
Enqueue Celery Tasks
    ↓
Channel Workers
    ↓
Provider Router
    ↓
Provider
```

---

# 8. Internal Event Bus

Introduce lightweight internal events.

```python
class ContributionConfirmed(Event):
    contribution_id: UUID
    user_id: UUID
    amount: Decimal
```

Benefits:

- Decoupling
- Async processing
- Better extensibility
- Easier analytics hooks
- Easier future Kafka/SNS migration

---

# 9. Celery Refactor

## Current Problem

Single celery usage without queue isolation.

---

## New Queue Strategy

```txt
Queues:
- critical_notifications
- email_notifications
- sms_notifications
- push_notifications
- marketing_notifications
- payouts
- blockchain
- analytics
```

---

## Worker Pools

```bash
celery -A app worker -Q critical_notifications --concurrency=20
celery -A app worker -Q email_notifications --concurrency=10
celery -A app worker -Q sms_notifications --concurrency=10
celery -A app worker -Q push_notifications --concurrency=10
```

---

# 10. Idempotency Strategy

Introduce:

```txt
{event}:{entity}:{state}
```

Examples:

```txt
contribution:txn_123:confirmed
payout:round_5:sent
wallet:user_22:credited
```

Protection layers:

1. Postgres unique constraint
2. Redis NX dedup
3. Worker terminal state checks

---

# 11. Provider Abstraction Layer

## Current Problem

Provider logic likely embedded directly in services.

---

## New Architecture

```python
class NotificationProvider(Protocol):
    def send(self, recipient, content):
        ...
```

Implementations:

### Email

- SendGrid
- Mailgun
- AWS SES

### SMS

- Termii
- Twilio

### Push

- Firebase Cloud Messaging
- APNS

---

# 12. Circuit Breakers

Introduce Redis-backed provider circuit breakers.

States:

- CLOSED
- OPEN
- HALF_OPEN

Benefits:

- Faster failover
- Prevent cascading latency
- Improve delivery reliability

---

# 13. Observability Refactor

## Introduce Structured Logging

Current logging is too primitive.

Move to:

```python
logger.info(
    "notification_delivered",
    extra={
        "notification_id": notif.id,
        "provider": provider,
        "channel": channel,
    }
)
```

---

## Add Sentry Everywhere

Capture:

- provider failures
- celery crashes
- retries exhausted
- queue failures
- slow delivery traces

---

## Metrics

Track:

- delivery success rate
- retry rate
- queue depth
- provider latency
- failed sends
- suppression counts

---

# 14. Frontend Cleanup

## Current Problems

`apps/web/components/`
contains too many unrelated components.

---

## Proposed Structure

```txt
apps/web/
├── features/
│   ├── auth/
│   ├── notifications/
│   ├── dashboard/
│   ├── contributions/
│   ├── payouts/
│   └── groups/
├── shared/
│   ├── ui/
│   ├── hooks/
│   ├── lib/
│   └── utils/
└── app/
```

---

# 15. Frontend Notification Refactor

## New Frontend Notification Layer

```txt
features/notifications/
├── api/
├── hooks/
├── components/
├── stores/
└── types/
```

Add:

- realtime updates
- optimistic UI
- notification preferences page
- notification inbox
- read/unread state

---

# 16. API Standardization

Current services likely return inconsistent responses.

Introduce:

```json
{
  "success": true,
  "data": {},
  "message": ""
}
```

Errors:

```json
{
  "success": false,
  "error": {
    "code": "NOTIFICATION_FAILED",
    "message": "Provider unavailable"
  }
}
```

---

# 17. Repository Pattern

Move DB access out of services.

Example:

```python
class NotificationRepository:
    async def create(...):
        ...

    async def update_status(...):
        ...
```

Benefits:

- Cleaner services
- Easier mocking
- Easier testing

---

# 18. Testing Improvements

## Add:

```txt
tests/
├── unit/
├── integration/
├── e2e/
├── load/
└── fixtures/
```

---

## Notification Tests

Must cover:

- duplicate prevention
- retries
- provider fallback
- DLQ movement
- worker crash recovery
- preference suppression

---

# 19. Docker Improvements

Split services.

```yaml
services:
  api:
  redis:
  postgres:
  celery_email:
  celery_sms:
  celery_push:
  celery_critical:
  celery_beat:
```

---

# 20. Suggested Migration Plan

## Phase 1 — Foundation

### Duration
1 week

### Tasks

- Introduce domain structure
- Create notifications module
- Add new DB tables
- Centralize Celery config
- Add structured logging

---

## Phase 2 — Notification Core

### Duration
1–2 weeks

### Tasks

- Provider abstraction
- Notification queues
- Retry system
- Idempotency
- Audit trail
- Preferences

---

## Phase 3 — Reliability

### Duration
1 week

### Tasks

- Circuit breakers
- DLQ
- Provider failover
- Queue prioritization
- Sentry tracing

---

## Phase 4 — Scale

### Duration
2 weeks

### Tasks

- Batch fan-out
- Broadcast campaigns
- Queue metrics
- Load testing
- Table partitioning

---

# 21. Immediate Refactor Priorities

## Highest Priority

### Backend

1. Introduce domain structure
2. Centralize notification logic
3. Refactor Celery config
4. Add notification tables
5. Add event-driven notification triggers

---

### Frontend

1. Move features into feature folders
2. Create notification feature module
3. Standardize hooks/services
4. Remove duplicated logic

---

# 22. Recommended Tech Decisions

## Keep

- FastAPI
- Celery
- Redis
- PostgreSQL
- Next.js
- TypeScript

---

## Add

### Backend

- Sentry SDK
- structlog
- SQLAlchemy repositories
- Pydantic settings management

### Frontend

- Zustand for notification state
- TanStack Query
- WebSocket/SSE layer

---

# 23. Final Architecture Outcome

After cleanup:

- Feature-driven backend
- Event-driven notification system
- Reliable async delivery
- Clear domain ownership
- Easier onboarding
- Scalable worker architecture
- Production-grade observability
- Cleaner frontend separation
- Ready for multi-million event throughput

---

# 24. Recommended First Implementation Order

## Step 1

Create:

```txt
backend/app/notifications/
```

and move all notification logic there.

---

## Step 2

Add:

- notifications table
- notification_events table
- preferences table

---

## Step 3

Refactor Celery into:

```txt
core/celery.py
```

with isolated queues.

---

## Step 4

Create provider abstraction.

---

## Step 5

Convert contribution + payout flows into event-driven notification triggers.

---

# 25. Long-Term Vision

Eventually this evolves into:

```txt
- notification microservice
- Kafka/SQS integration
- analytics event pipeline
- realtime event streaming
- campaign orchestration
- user engagement engine
```

without rewriting the core architecture.

