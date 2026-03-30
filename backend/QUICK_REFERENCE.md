# Quick Reference: Contribution System

**TL;DR API Usage** - Copy & paste examples for common operations

---

## 1. Manual Contribution

```python
from app.services.contribution_service import ContributionService
from app.schemas.contribution_schemas import ContributionCreate
from app.schemas.auth import AuthenticatedUser

# Create contribution
contribution_data = ContributionCreate(
    user_id=user_id,
    group_id=group_id,
    amount=1000,
    currency="NGN",
    note="Monthly contribution"
)

# Process
contribution = await ContributionService.process_manual_contribution(
    contribution_data=contribution_data,
    user=authenticated_user,  # From JWT token
    db=db,
    group_address=str(group_id),
    network="flow"
)

# Check result
assert contribution.status == ContributionStatus.completed
assert float(contribution.amount) == 1000
print(f"Successfully contributed: {contribution.id}")
```

---

## 2. Automatic Contributions (Scheduled)

```python
# In Celery task
from app.services.timed_contribution_worker import TimedContributionWorker
from db.database import async_session_factory

@app.task
def process_timed_contributions():
    result = await TimedContributionWorker.process_all_due_contributions(
        db_session_factory=async_session_factory,
        network="flow"
    )
    
    log.info(f"Processed: {result['successful']}, Failed: {result['failed']}")
    
    # Alert if high failure rate
    if result['failed'] > result['successful'] * 0.1:  # >10% failure
        ALERT_TEAM()

# Schedule in beat config
app.conf.beat_schedule = {
    'process-contributions': {
        'task': 'tasks.process_timed_contributions',
        'schedule': crontab(minute=0),  # Every hour
    },
}
```

---

## 3. Query Contributions

```python
from app.services.contribution_service import ContributionService

# Get specific contribution
contrib = await ContributionService.get_contribution_by_id(
    db=db,
    contribution_id=contrib_id
)

# Get all contributions for user in group
summary = await ContributionService.get_user_group_contributions(
    db=db,
    user_id=user_id,
    group_id=group_id
)

print(f"Total contributed: {summary['total_contributed']}")
print(f"Pending: {summary['total_pending']}")
print(f"Failed count: {summary['failed_count']}")

# Get paginated list
contributions = await ContributionService.get_contributions(
    db=db,
    group_id=group_id,
    skip=0,
    limit=10
)
```

---

## 4. Execute Payout

```python
from app.services.payout_service import PayoutService

# Check if ready
readiness = await PayoutService.check_payout_readiness(
    group_id=group_id,
    group_address=str(group_id),
    db=db
)

if readiness['is_ready']:
    print(f"✅ Ready! {readiness['members_contributed']} collected")
    
    # Execute
    result = await PayoutService.execute_payout(
        group_id=group_id,
        group_address=str(group_id),
        db=db
    )
    
    if result['success']:
        print(f"✅ Payout completed: {result['tx_hash']}")
        print(f"Recipient: {result['recipient']}")
        print(f"Amount: {result['payout_amount']}")
    else:
        print(f"❌ Payout failed: {result['error']}")
else:
    print(f"⏳ Not ready yet")
    print(f"Waiting for: {readiness['members_total'] - readiness['members_contributed']} more members")
    print(f"Deadline: {readiness['deadline']}")
```

---

## 5. Emergency Withdrawal

```python
# User-initiated emergency refund
refund_result = await ContributionService.emergency_refund(
    group_id=group_id,
    user=authenticated_user,
    db=db
)

if refund_result['success']:
    print(f"✅ Refund initiated: {refund_result['tx_hash']}")
else:
    print(f"❌ Refund failed: {refund_result['message']}")
```

---

## 6. Request Withdrawal

```python
# Request to withdraw before scheduled payout
withdrawal_result = await ContributionService.request_withdrawal(
    group_id=group_id,
    user=authenticated_user,
    amount=Decimal(500),
    db=db
)

if withdrawal_result['success']:
    print(f"✅ Withdrawal requested: {withdrawal_result['tx_hash']}")
else:
    print(f"❌ Withdrawal failed: {withdrawal_result['message']}")
```

---

## Common Status Codes

| Status | Meaning |
|--------|---------|
| `pledged` | Initial - not yet locked |
| `initiated` | Funds locked, awaiting contract |
| `pending` | Contract received, confirming |
| `completed` | ✅ Successfully deducted |
| `failed` | ❌ Error - funds returned |
| `cancelled` | Manually cancelled |

---

## Error Handling

```python
from fastapi import HTTPException

try:
    contribution = await ContributionService.process_manual_contribution(...)
except HTTPException as e:
    # Expected error (user error, validation)
    # e.status_code: 400, 403, 404, etc.
    # e.detail: user-friendly message
    print(f"Error {e.status_code}: {e.detail}")
except Exception as e:
    # Unexpected error
    logger.error(f"Unexpected error: {e}")
    raise
```

---

## Debugging

```python
# Check member membership
member = await CooperativeMembershipService.get_membership_by_user_and_group(
    user_id=user_id,
    group_id=group_id,
    db=db
)
print(f"Is member: {member is not None}")
print(f"Is active: {member.is_active if member else False}")

# Check wallet
wallet = await WalletService.get_balance(user_id, db)
print(f"Available: {wallet.stable_coin_balance}")
print(f"Locked: {wallet.locked_balance}")

# Check group status
group = await db.get(CooperativeGroup, group_id)
print(f"Group status: {group.status}")
print(f"Contribution amount: {group.contribution_amount}")
print(f"Frequency: {group.contribution_frequency}")

# Check last contribution
last_contrib = await db.execute(
    select(Contribution)
    .where(Contribution.user_id == user_id, Contribution.group_id == group_id)
    .order_by(Contribution.created_at.desc())
    .limit(1)
)
contrib = last_contrib.scalars().first()
print(f"Last contribution: {contrib.created_at if contrib else 'Never'}")
print(f"Status: {contrib.status.value if contrib else 'N/A'}")
```

---

## Performance Tips

### For High Volume

1. **Batch contributions**
   ```python
   # Process multiple users' contributions in parallel
   tasks = [
       ContributionService.process_auto_contribution(group_id, user, db)
       for user in users  # Up to 50 at a time
   ]
   results = await asyncio.gather(*tasks)
   ```

2. **Use database indexes**
   ```sql
   CREATE INDEX idx_contrib_group_user ON contributions(group_id, user_id);
   CREATE INDEX idx_contrib_status ON contributions(status);
   ```

3. **Cache group info**
   ```python
   @cache(ttl=300)
   async def get_group_cached(group_id):
       return await contract_service.get_group_info(group_id)
   ```

---

## Monitoring

### Key Metrics

```python
# Track success rate
success_rate = successful_count / total_count * 100
print(f"Contribution success rate: {success_rate}%")

# Track processing time
processing_time = end_time - start_time
print(f"Time per contribution: {processing_time.total_seconds()}ms")

# Track failure types
from collections import Counter
failures = Counter([error.split(':')[0] for error in error_list])
print(f"Failure types: {failures.most_common(3)}")
```

### Alerting on Issues

```python
# High failure rate
if failed_count > total_count * 0.05:  # >5%
    send_alert("High contribution failure rate")

# Long processing time
if avg_processing_time > 5000:  # >5 seconds
    send_alert("Slow contribution processing")

# Payout not completing
if days_since_last_payout > 31:
    send_alert("Overdue payout - check payout service")
```

---

## Testing

```bash
# Run all tests
pytest tests/test_contributions_comprehensive.py -v

# Run specific test
pytest tests/test_contributions_comprehensive.py::test_manual_contribution_success -v

# With coverage
pytest tests/test_contributions_comprehensive.py --cov=app.services.contribution_service

# Security tests only
pytest tests/test_contributions_comprehensive.py -k "security" -v
```

---

## Environment Setup

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Create .env file
cp .env.sample .env
# Edit with your values:
# - ROTATION_LOGIC=0x...
# - COOP_GROUP_FACTORY_CONTRACT=0x...
# - DATABASE_URL=postgres://...
# - APP_SECRET_KEY=your_secret

# 3. Setup database
alembic upgrade head

# 4. Start Celery (for auto-contributions)
celery -A app.services.timed_contribution_worker worker --loglevel=info

# 5. Start Celery Beat (scheduler)
celery -A app.services.timed_contribution_worker beat --loglevel=info

# 6. Start backend
uvicorn main:app --reload
```

---

## Data Model

```python
# Contribution
{
    "id": "uuid",
    "user_id": "uuid",
    "group_id": "uuid",
    "amount": 1000.00,
    "currency": "NGN",
    "status": "completed",  # initiated, pending, completed, failed
    "due_date": "2026-04-28T00:00:00",
    "fulfilled_at": "2026-03-28T12:34:56",
    "note": "Monthly contribution",
    "created_at": "2026-03-28T10:00:00",
    "updated_at": "2026-03-28T12:34:56"
}

# Summary
{
    "total_contributed": 10000.00,
    "total_pending": 2000.00,
    "contribution_count": 10,
    "pending_count": 2,
    "failed_count": 1,
    "contributions": [
        {"id": "...", "amount": 1000, "status": "completed", "created_at": "..."}
    ]
}
```

---

## Security Checklist

When using the system:

- ✅ Always use HTTPS in production
- ✅ Validate JWT tokens on every request
- ✅ Never log sensitive amounts in plaintext
- ✅ Use encrypted amounts (euint64) for privacy
- ✅ Verify contract addresses in .env
- ✅ Test with testnet before production
- ✅ Monitor for unusual patterns
- ✅ Keep audit logs for 7 years (financial records)
- ✅ Handle errors gracefully (no internal details exposed)
- ✅ Rate limit API endpoints

---

## Useful Queries

```sql
-- Members who haven't contributed this month
SELECT DISTINCT gm.user_id 
FROM group_memberships gm
WHERE gm.group_id = 'group_uuid'
  AND gm.is_active = true
  AND gm.user_id NOT IN (
    SELECT DISTINCT user_id FROM contributions
    WHERE group_id = 'group_uuid'
      AND status = 'completed'
      AND created_at >= DATE_TRUNC('month', NOW())
  );

-- Total contributions by member
SELECT user_id, SUM(amount) as total
FROM contributions
WHERE group_id = 'group_uuid' AND status = 'completed'
GROUP BY user_id
ORDER BY total DESC;

-- Failed contributions (to retry)
SELECT id, user_id, reason, created_at
FROM contributions
WHERE status = 'failed'
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Pending payouts
SELECT id, group_id, COUNT(*) as pending_count
FROM contributions
WHERE status IN ('initiated', 'pending')
GROUP BY group_id, id;
```

---

**Last Updated**: March 28, 2026
