# Contribution System Architecture & Integration Guide

**Purpose**: Understand how all components work together  
**Audience**: Developers, Architects, Security Reviewers

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     API Layer (FastAPI)                              │
├─────────────────────────────────────────────────────────────────────┤
│  POST /contributions/manual         POST /payouts/execute            │
│  GET  /contributions/{id}           POST /groups/{id}/join           │
│  GET  /contributions?group={id}     GET  /payouts/readiness         │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼─────────────┐      ┌────────▼──────────┐
│ ContributionService │      │  PayoutService    │
├─────────────────────┤      ├───────────────────┤
│ - Manual contrib    │      │ - Execute payout  │
│ - Auto contrib      │      │ - Next recipient  │
│ - Withdraw          │      │ - Initialize rot. │
│ - Emergency refund  │      │ - Check readiness │
└────────┬────────────┘      └────────┬──────────┘
         │                            │
         └──────────────┬─────────────┘
                        │
         ┌──────────────▼──────────────┐
         │   ContractService           │
         ├─────────────────────────────┤
         │ - submit_contribution()     │
         │ - execute_payout()          │
         │ - get_next_recipient()      │
         │ - get_group_info()          │
         │ - initialize_rotation()     │
         └──────────────┬──────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
┌───────▼────────────┐        ┌────────▼─────────┐
│ Flow Blockchain    │        │ Zama fhEVM       │
├────────────────────┤        ├──────────────────┤
│ - CoopGroupFactory │        │ - Encrypted Ops  │
│ - CoopGroup        │        │ - Privacy-Safe   │
│ - RotationLogic    │        │ - Verifiable     │
│ - FlowVault        │        │ - Homomorphic    │
└────────────────────┘        └──────────────────┘
```

---

## Component Interaction Flow

### 1. Manual Contribution Flow

```
User initiates contribution
        ↓
API receives POST /contributions/manual
        ↓
FastAPI validates JWT token
        ↓
ContributionService.process_manual_contribution()
        ├─ Verify membership (active)
        ├─ Get group info (status = active)
        ├─ Validate amount (> 0, ≤ balance)
        ├─ Lock funds in wallet
        │   └─ WalletService.lock_for_contribution()
        ├─ Create Contribution record (status = initiated)
        ├─ Call ContractService.submit_contribution()
        │   ├─ Net: Flow | Zama network
        │   ├─ Encrypt amount if needed
        │   └─ Submit to smart contract
        │
        ├─ IF success:
        │   ├─ Mark Contribution(status = completed)
        │   ├─ Finalize wallet debit
        │   └─ Return contribution object
        │
        └─ IF failure:
            ├─ Release locked funds
            ├─ Mark Contribution(status = failed)
            └─ Raise HTTPException

Response returned to user
```

**Error Handling**:
- Non-member → HTTP 403 Forbidden
- Insufficient balance → HTTP 400 Bad Request
- Contract failure → Released locked funds + HTTP 400
- Any other error → Cleanup + HTTP 500 Internal Server Error

---

### 2. Automated Contribution Flow

```
Celery Beat triggers (hourly/daily)
        ↓
TimedContributionWorker.process_all_due_contributions()
        ├─ Get all active groups
        ├─ For each group:
        │   ├─ Get all active members
        │   ├─ Batch process (50 at a time)
        │   └─ For each member:
        │       ├─ Create AuthenticatedUser object
        │       ├─ Call ContributionService.process_auto_contribution()
        │       │   ├─ Verify active membership
        │       │   ├─ Check if contribution due
        │       │   │   └─ Use _is_contribution_due() logic
        │       │   ├─ Check wallet balance
        │       │   │   └─ If insufficient → return None (skip)
        │       │   ├─ Lock funds
        │       │   ├─ Create Contribution record
        │       │   ├─ Submit to contract
        │       │   ├─ Mark success or failure
        │       │   └─ Return contribution or None
        │       │
        │       └─ Catch exceptions (individual member fails)
        │
        ├─ Compile summary:
        │   ├─ total_processed
        │   ├─ successful count
        │   ├─ failed count
        │   ├─ skipped count
        │   └─ error list
        │
        └─ Log summary (for monitoring/alerting)

Return summary to Celery (logged to file/monitoring)
```

**Key Points**:
- One member's failure doesn't block others
- Skipped (not due) don't count as failures
- Failed contributions can be retried later
- Comprehensive logging for debugging

---

### 3. Payout Execution Flow

```
Admin/Automated trigger calls execute_payout()
        ↓
PayoutService.execute_payout()
        ├─ Get group info from contract
        ├─ Get next recipient (rotation order)
        ├─ Verify recipient eligibility:
        │   ├─ Member exists
        │   ├─ Member is active
        │   ├─ Member hasn't received payout this round
        │   └─ No double-payout flag
        │
        ├─ Check vault has sufficient funds
        ├─ Get vault balance from contract
        │
        ├─ Call ContractService.execute_payout()
        │   ├─ Submit TX to blockchain
        │   ├─ Recipient receives funds
        │   └─ Rotation advances to next member
        │
        ├─ Record payout in audit trail
        ├─ Update member's last_payout_round
        │
        └─ Return result:
            ├─ success: true/false
            ├─ tx_hash
            ├─ recipient address
            ├─ round number
            └─ payout_amount
```

**Authorization Checks** (Multi-layer):
1. Recipient is in group and active
2. No double-payout this round
3. Funds available in vault
4. Recipient is next in rotation
5. Blockchain TX doesn't fail

---

## Database Schema (Relevant Tables)

### Contributions Table

```sql
CREATE TABLE contributions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    group_id UUID NOT NULL REFERENCES cooperative_groups(id),
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'NGN',
    status ENUM('pledged', 'initiated', 'pending', 'completed', 'failed', 'cancelled'),
    due_date TIMESTAMP,
    fulfilled_at TIMESTAMP,
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE(id),
    INDEX(group_id, user_id),
    INDEX(status)
);
```

### Wallet Table

```sql
CREATE TABLE wallets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    stable_coin_balance NUMERIC(15,2) DEFAULT 0,
    local_balance NUMERIC(15,2) DEFAULT 0,
    locked_balance NUMERIC(15,2) DEFAULT 0,  -- For contributions
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Wallet Ledger (Audit Trail)

```sql
CREATE TABLE wallet_ledgers (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    type ENUM('deposit', 'withdrawal', 'contribution', 'refund', 'payout'),
    amount NUMERIC(15,2) NOT NULL,
    tx_hash VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Group Memberships

```sql
CREATE TABLE group_memberships (
    id UUID PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES cooperative_groups(id),
    user_id UUID NOT NULL REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    contribution_status VARCHAR(50),  -- 'active', 'paused', 'frozen'
    joined_at TIMESTAMP DEFAULT NOW()
);
```

---

## State Machines

### Contribution Lifecycle

```
┌─────────┐
│ PLEDGED │ (Initial - amount promised but not locked)
└────┬────┘
     │ process_manual_contribution() called
     ↓
┌─────────────┐
│ INITIATED   │ (Wallet locked, awaiting contract confirmation)
└────┬────────┘
     │
     ├─ Contract succeeds
     │  ↓
     │  ┌───────────┐
     │  │ COMPLETED │ (Success - funds deducted, recorded on chain)
     │  └───────────┘
     │
     └─ Contract fails
        ↓
        ┌────────┐
        │ FAILED │ (Error - wallet unlocked, money returned)
        └────────┘
```

### Payout Eligibility

```
Member eligible for payout IF:
- ✅ is_member(group) == True
- ✅ is_active == True
- ✅ has_contributed_this_round == True
- ✅ rotation_order[current_index] == member_address
- ✅ last_payout_round < current_round
- ✅ group.isActive == True
- ✅ vault_balance >= expected_payout
```

---

## Sequence Diagram: Full Lifecycle

```
User                API              Service          Contract        Blockchain
 │                  │                 │                 │                │
 ├─ POST /contrib. ─┤                 │                 │                │
 │                  ├─ Auth check     │                 │                │
 │                  ├─ Validate       │                 │                │
 │                  ├─ process_manual ┤                 │                │
 │                  │                 ├─ Lock funds    │                │
 │                  │                 ├─ Create record │                │
 │                  │                 ├─ submit_contrib.                │
 │                  │                 │                 ├─ TX          ─┼─ Confirm
 │                  │                 │                 ◄─────────────── ┤
 │                  │                 │                 ├─ Mint receipt  │
 │                  │                 ◄─ Return success │                │
 │                  │                 ├─ Mark complete  │                │
 │                  │                 ├─ Finalize debit │                │
 │                  ◄─ Return contrib.│                 │                │
 │◄─ 200 OK + data ─┤                 │                 │                │
 │                  │                 │                 │                │
 │                  │                 │ (Automated)     │                │
 │                  │ [Later...Celery]├─ Auto debit ok? │                │
 │                  │                 ├─ Submit again   │                │
 │                  │                 │                 ├─ TX          ─┼─ Confirm
 │                  │                 │                 ◄─────────────── ┤
 │                  │                 │ (Ready for payout)               │
 │                  │                 │                 │                │
 │ [When ready]     │                 │                 │                │
 │                  ├─ POST /payout   │                 │                │
 │                  ├─ Auth check     │                 │                │
 │                  ├─ Check readiness├─ execute_payout │                │
 │                  │                 ├─ Auth checks   │                │
 │                  │                 ├─ Get next recip│                │
 │                  │                 ├─ Verify funds  │                │
 │                  │                 ├─ Call contract ├─ Distribute   ─┼─ Transfer
 │                  │                 │                 ◄─────────────── ┤
 │                  │                 ◄─ TX hash        ├─ Event        │
 │                  ◄─ Return success │                 │                │
 │◄─ 200 OK        ─┤                 │                 │                │
 │                  │                 │                 │                │
 │ Recipient       │                 │                 │                │
 │ sees funds      │                 │                 │                │
```

---

## Configuration & Environment

### Required Environment Variables

```bash
# Blockchain Networks
ROTATION_LOGIC=0x03597D130387702B29B21155fAA80C3A7d40FC3d
COOP_GROUP_FACTORY_CONTRACT=0x2dCe6F795565CeC6FeF0C29DdF4D0787b1d929eB
DEFAULT_NETWORK=flow

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/coopwise_db

# Security
APP_SECRET_KEY=your_secret_key_here
JWT_ALGORITHM=HS256

# Celery (for scheduled contributions)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Optional: Monitoring
SENTRY_DSN=https://...@sentry.io/...
LOG_LEVEL=INFO
```

---

## Testing Strategy

### Unit Tests

```python
# Test service methods in isolation
test_manual_contribution_success()
test_contribution_insufficient_balance()
test_contribution_non_member()
test_auto_contribution_when_due()
test_payout_execution()
```

See: `tests/test_contributions_comprehensive.py`

### Integration Tests

```python
# Test full workflows
test_full_contribution_lifecycle()  # Contribute → Verify → Payout
```

### Security Tests

```python
test_contribution_amount_validation()
test_wallet_lock_prevents_double_spend()
test_contribution_idempotency()
test_payout_authorization()
```

### Load Tests

```python
# Simulate high volume
- 1000 contributions per minute
- 100 simultaneous payouts
- 10k active members
```

---

## Performance Considerations

### Database Indexing

**Critical indexes**:
```sql
CREATE INDEX idx_contributions_group_user ON contributions(group_id, user_id);
CREATE INDEX idx_contributions_status ON contributions(status);
CREATE INDEX idx_wallet_user ON wallets(user_id);
CREATE INDEX idx_membership_active ON group_memberships(group_id, is_active);
```

### Query Optimization

```python
# Good: Load user + group in one query
result = await db.execute(
    select(Contribution, User, CooperativeGroup).join(User).join(CooperativeGroup)
    .where(Contribution.id == contrib_id)
)

# Bad: N+1 queries
contributions = await db.execute(select(Contribution))
for contrib in contributions:
    user = await db.get(User, contrib.user_id)  # Repeated queries!
    group = await db.get(CooperativeGroup, contrib.group_id)
```

### Caching Strategy

```python
# Cache group info (rarely changes)
@cached(TTL=300)  # 5 minutes
async def get_group_info(group_id):
    return await contract_service.get_group_info(group_address)

# Cache user membership (changes infrequently)
@cached(TTL=600)  # 10 minutes
async def get_membership(user_id, group_id):
    return await CooperativeMembershipService.get_membership_by_user_and_group(...)
```

---

## Monitoring & Alerting

### Metrics to Track

```
- contributions_total (counter)
- contributions_success_rate (gauge)
- contribution_processing_time_ms (histogram)
- auto_contribution_failures (counter)
- payout_execution_time_ms (histogram)
- payout_success_rate (gauge)
- wallet_lock_duration_ms (histogram)
- contract_call_errors (counter by method)
```

### Alert Rules

```
- IF contributions_success_rate < 95% for 5 minutes → Alert
- IF auto_contribution_failures > 10 in 1 hour → Alert
- IF contract_call_errors.execute_payout > 5 → Alert
- IF wallet_lock_duration > 60 seconds → Alert
- IF payout_execution_time > 30 seconds → Alert
```

---

## Troubleshooting Guide

### Contribution Fails with "Insufficient Balance"

**Cause**: User has less than contribution + 5% fee buffer  
**Solution**: User needs to top up wallet or wait for payout

### Auto-Contribution Never Runs

**Causes**:
1. Celery beat not started
2. Redis broker down
3. Member marked inactive
4. Group status not active
5. Contribution not yet due

**Solution**: 
- Check `celery -A app inspect active_queues`
- Verify Redis: `redis-cli ping`
- Check group/member status in database

### Payout Stuck in "Pending"

**Cause**: Contract error or TX not confirmed  
**Solution**:
1. Check TX status on blockchain
2. Verify recipient is still active
3. Manually trigger retry via admin endpoint

### Contract Calls Fail with "ReentrancyGuardReentrantCall"

**Cause**: Same user/group calling contract twice simultaneously  
**Solution**: 
1. Implement request deduplication
2. Use nonce/idempotency keys
3. Add timeout before retry

---

## Deployment Checklist

- [ ] All tests passing
- [ ] Security review completed
- [ ] Database migrations run
- [ ] Environment variables set
- [ ] Contract addresses verified
- [ ] Celery beat configured
- [ ] Monitoring/alerting setup
- [ ] Backup strategy in place
- [ ] Runbook documentation complete
- [ ] Load testing passed
- [ ] Security audit signed off

---

## References

- Implementation: [CONTRIBUTION_IMPLEMENTATION_SUMMARY.md](CONTRIBUTION_IMPLEMENTATION_SUMMARY.md)
- Security: [SECURITY_CONSIDERATIONS.md](SECURITY_CONSIDERATIONS.md)
- Tests: [tests/test_contributions_comprehensive.py](tests/test_contributions_comprehensive.py)
- Smart Contract ABI: [ABI.ts](ABI.ts)

---

**Document Version**: 1.0  
**Last Updated**: March 28, 2026  
**Status**: COMPLETE ✅
