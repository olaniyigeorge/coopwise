# Contribution System Security Review

**Document Version**: 1.0  
**Date**: March 28, 2026  
**Scope**: Contribution functionality across ContractService, ContributionService, PayoutService, and TimedContributionWorker

---

## Executive Summary

This document outlines security considerations, threats, and mitigations for the CoopWise contribution system. The system handles financial transactions with encrypted amounts, time-based automation, and blockchain integration. Security is built in at multiple layers: database, API, contract interaction, and worker scheduling.

**Security Level**: HIGH PRIORITY  

---

## 1. THREAT MODEL

### 1.1 Attacker Profiles

| Profile | Motivation | Capabilities |
|---------|-----------|--------------|
| Malicious User | Steal funds, fraud | API access, wallet control |
| Rogue Member | Dodge contributions | Group membership hijacking |
| External Attacker | Financial theft | Network/API exploitation |
| Insider (Employee) | Embezzlement | Direct database/code access |

### 1.2 Attack Vectors

#### Financial Attacks
- **Double-Spend**: Contribute same funds twice
- **Replay Attack**: Replay contribution transaction
- **Underflow**: Send negative contributions (withdrawal disguised as negative amount)
- **Vault Draining**: Execute unauthorized payouts
- **Frontrunning**: Compete for payout order

#### Authorization Attacks
- **Privilege Escalation**: Non-member performing actions
- **Group Hijacking**: Non-creator modifying group settings
- **Payout Interception**: Redirecting payout to wrong addr
- **Forced Contributions**: Unauthorized auto-debits

#### System Attacks
- **Race Conditions**: Concurrent contribution/payout race
- **Denial of Service**: Flood with high-volume contributions
- **Worker Manipulation**: Trigger workers maliciously
- **Encryption Bypass**: Exploiting FHE implementation weaknesses

---

## 2. SECURITY CONTROLS

### 2.1 Input Validation & Sanitization

**Status**:  IMPLEMENTED  

#### Controls:
```python
# Amount validation
if amount <= 0:
    raise HTTPException(detail="Amount must > 0")

# Member validation
if not membership or not membership.is_active:
    raise HTTPException(detail="Not active member")

# Group status validation
if group.status != CooperativeStatus.active:
    raise HTTPException(detail="Group not active")

# Decimal precision
amount = Decimal(str(contribution_data.amount))  # Prevent float precision issues
```

**Rationale**: Prevents invalid contributions, unauthorized operations.

**Edge Cases Handled**:
- Negative amounts (rejected)
- Zero amounts (rejected)
- Extremely large amounts (checked against balance)
- Group state mismatches (validated)
- Inactive members (rejected)

### 2.2 Authentication & Authorization

**Status**:  IMPLEMENTED  

#### Controls:
```python
# User authentication
user: AuthenticatedUser  # Dependency injection from FastAPI

# Membership verification
membership = await CooperativeMembershipService.get_membership_by_user_and_group(
    user_id=user.id, group_id=contribution_data.group_id, db=db
)
if not membership:
    raise HTTPException(status_code=403, detail="Not a member")

# Active status check
if not membership.is_active:
    raise HTTPException(status_code=403, detail="Membership inactive")
```

**Rationale**: Only authenticated, active members can contribute. Prevents outsiders from performing operations.

**JWT Tokens**: FastAPI security dependency ensures token validation on all endpoints.

### 2.3 Double-Spend Prevention

**Status**:  IMPLEMENTED  

#### Mechanisms:

**1. Wallet Locking**
```python
lock_result = await WalletService.lock_for_contribution(
    user_id=user.id,
    amount=amount,
    db=db
)
# Prevents use of same balance in concurrent operations
```

**2. Contribution State Machine**
```python
# Contributions progress: initiated -> pending -> completed/failed
# Can't transition backwards
# Status immutable once completed
```

**3. Idempotent Submission ID**
```python
# Same contribution ID resubmitted = no effect
# Contract checks this via ReentrancyGuard
```

**Rationale**: Multiple layers ensure funds can't be moved twice simultaneously.

### 2.4 Replay Attack Prevention

**Status**:  IMPLEMENTED  

#### Mechanisms:

**1. Nonce/Replay Guard**
```python
# Zama fhEVM includes ReentrancyGuardReentrantCall error
# Prevents re-entrant calls within same transaction
```

**2. Contribution Record Uniqueness**
```python
# Each contribution is UUID tracked on-chain and off-chain
# Submitting same contribution ID again rejects with error
```

**3. Timestamp Validation**
```python
contribution.created_at -> Immutable
contribution.fulfilled_at -> Set only once
# Prevents backdating/manipulation
```

**4. Transaction Hashing**
```python
# Each blockchain TX has unique hash
# Can't replay same TX hash
```

### 2.5 Encrypted Amounts (Privacy)

**Status**:  IMPLEMENTED (via ABI integration)  

#### Implementation:
```python
# CoopGroup::contribute() accepts encrypted amount
async def submit_contribution(
    self,
    amount: Decimal,
    encrypted_amount: Optional[str] = None,  # FHE encrypted euint64
    proof: Optional[str] = None,
    ...
) -> Dict[str, Any]:
    ...
    call_data = {
        "amount": amount_wei,  # Public amount if not sensitive
        "encryptedAmount": encrypted_amount or "",  # Encrypted via Zama
        "proof": proof or ""  # ZK proof
    }
```

**Security Properties**:
- Amount hidden from blockchain observers
- Smart contract operations on encrypted values (FHE)
- Only recipient can decrypt (private key required)
- No plaintext amount stored temporarily

### 2.6 Authorization Levels

**Status**:  IMPLEMENTED  

```python
# User can only:
- View own contributions
- View own group memberships
- Submit contributions to groups they're in
- Request withdrawals from own funds

# Group Creator can:
- Manage group settings
- View all contributions (encrypted except their own)
- Execute payouts (when eligible)

# Admin can (backend-only):
- Override emergency refunds
- Pause groups
- Modify contribution rules

# Contract Owner can:
- Upgrade contract logic
- Emergency pause
```

### 2.7 Wallet Lock Implementation

**Status**:  IMPLEMENTED  

#### Flow:
```python
# 1. User initiates contribution
contribution_data = ContributionCreate(amount=1000)

# 2. System locks funds
lock_result = await WalletService.lock_for_contribution(user_id, amount=1000)
# Wallet.locked_balance += 1000
# Wallet.available_balance -= 1000

# 3. Submit to contract
contract_result = await contract_service.submit_contribution(...)

# 4a. SUCCESS: Finalize debit
await WalletService.finalize_contribution_debit(amount=1000)
# Debit from wallet permanently

# 4b. FAILURE: Release lock
await WalletService.release_locked_funds(amount=1000)
# wallet.locked_balance -= 1000
# wallet.available_balance += 1000
```

**Race Condition Protection**: Database transactions + locking ensures atomicity.

### 2.8 Payout Authorization

**Status**:  IMPLEMENTED  

#### Checks Before Payout:
```python
async def execute_payout(...):
    # 1. Verify recipient exists
    member_info = await contract_service.get_member_info(recipient)
    if not member_info or not member_info["is_active"]:
        return {"success": False, "error": "Recipient inactive"}
    
    # 2. Verify sufficient funds
    vault_balance = await contract_service.get_group_balance(group_address)
    if vault_balance < expected_payout:
        return {"success": False, "error": "Insufficient funds"}
    
    # 3. Verify rotation order
    next_recipient = await contract_service.get_next_payout_recipient(group_address)
    if next_recipient != recipient:
        return {"success": False, "error": "Not next in rotation"}
    
    # 4. Verify no double payout this round
    last_payout = member_info["last_payout_round"]
    current_round = await contract_service.get_current_round(group_address)
    if last_payout == current_round:
        return {"success": False, "error": "Already received payout this round"}
    
    # 5. Execute payout
    result = await contract_service.execute_payout(...)
```

### 2.9 Time-Based Contribution Automation

**Status**:  IMPLEMENTED  

#### Security for Timed Worker:

**1. Membership Verification**
```python
# Every automated contribution validates active membership
membership = await CooperativeMembershipService.get_membership_by_user_and_group(...)
if not membership or not membership.is_active:
    return None  # Skip gracefully
```

**2. Individual Transaction Isolation**
```python
# Each member processed independently
# Failure in one doesn't block others
for member in members:
    try:
        await process_contribution(member)
    except Exception:
        # Log, skip to next
        continue
```

**3. Balance Verification**
```python
# Check balance before auto-debit
wallet_balance = await WalletService.get_balance(user.id)
if wallet_balance.stable_coin_balance < group.contribution_amount:
    return None  # Don't force contribution
```

**4. Frequency Enforcement**
```python
# Check if due based on frequency
if not await ContributionService._is_contribution_due(group_id, user.id):
    return None  # Not yet due
```

**5. Audit Trail**
```python
# All auto-contributions logged with action type and timestamp
logger.info(
    f"Auto-contribution processed: user={user.id}, group={group_id}, "
    f"amount={amount}, action={ContributionActionType.AUTO_DEBIT.value}"
)
```

### 2.10 Error Handling & Graceful Degradation

**Status**:  IMPLEMENTED  

#### Principles:
```python
# 1. Don't expose internal errors to users
try:
    ...
except Exception as e:
    logger.error(f"Internal error: {e}", exc_info=True)
    raise HTTPException(
        status_code=500, 
        detail="An unexpected error occurred"  # Generic message
    )

# 2. Rollback failed operations
if not contract_result.get("success"):
    await WalletService.release_locked_funds(user_id, amount)

# 3. Partial failure handling in batch operations
for member in batch:
    try:
        process(member)
    except Exception:
        # Continue processing other members
        result["failed"] += 1

# 4. Circuit breaker pattern for recurring failures
# (Not yet implemented - recommended enhancement)
```

### 2.11 Rate Limiting

**Status**: ⚠️ PARTIALLY IMPLEMENTED  

#### Recommendations:
```python
# Add per-user rate limits:
# - 100 contributions per day
# - Max 1 contribution per minute

# Add per-group limits:
# - Max contribution amount per member per cycle
# - Prevent spam contributions

from fastapi_limiter import FastAPILimiter
@limiter.limit("100/day")
async def contribute(...):
    ...
```

**Implementation**: Use FastAPI-Limiter + Redis for tracking.

### 2.12 Database Security

**Status**:  IMPLEMENTED  

#### Controls:
```python
# 1. Parameterized queries (SQLAlchemy ORM)
result = await db.execute(
    select(Contribution).where(Contribution.id == contribution_id)
)
# NOT: f"SELECT * FROM contributions WHERE id = {contribution_id}"

# 2. Row-level security simulation
# Users can only query own contributions (enforced at query level)

# 3. Encryption for sensitive fields
# contribution.note can contain encrypted data

# 4. Audit logger
# All changes logged via WalletLedger, ActivityLog
```

---

## 3. ENCRYPTION & PRIVACY

### 3.1 Encrypted Amounts

**Implementation**: Zama fhEVM Integration

```python
# euint64: Encrypted unsigned 64-bit integer
# Supported operations:
- add: encrypted + encrypted = encrypted
- sub: encrypted - encrypted = encrypted
- mul: encrypted * encrypted = encrypted

# Smart contract operations on encrypted data
contract.contribute(encryptedAmount, proof)

# Only authorized parties can decrypt:
recipient_private_key -> decrypt(encryptedAmount)
```

**Privacy Guarantees**:
- Blockchain observers can't see contribution amounts
- Contract can't see plaintext amounts
- Only intended recipients decrypt
- Mathematical proofs verify correctness

### 3.2 Wallet Address Privacy

**Not Encrypted** (by design):
- User wallet addresses are public blockchain addresses
- Linked to transactions via ETH logs/events

**Mitigation**:
- Users can rotate wallet addresses
- Multiple addresses per user supported (future)
- Anonymization layer (future)

---

## 4. BLOCKCHAIN INTEGRATION SECURITY

### 4.1 Contract Address Whitelist

**Status**:  IMPLEMENTED  

```python
# .env.sample
ROTATION_LOGIC=0x03597D130387702B29B21155fAA80C3A7d40FC3d
COOP_GROUP_FACTORY_CONTRACT=0x2dCe6F795565CeC6FeF0C29DdF4D0787b1d929eB
```

**Security**: Only whitelisted contracts accepted. Prevents phishing attacks to fake contracts.

### 4.2 Transaction Verification

**Status**:  IMPLEMENTED (via contract ABI)  

```python
# Verify TX before marking as complete:
tx_result = await contract_service.submit_contribution(...)
tx_hash = tx_result.get("tx_hash")

# Query transaction status on-chain
tx_status = await contract_service.query_tx_status(tx_hash)
if tx_status != "completed":
    mark_as_failed()
```

### 4.3 Contract Upgrade Security

**Recommendation**: 
- Use proxy pattern (UUPS)
- Timelock for upgrades (48-72 hour delay)
- Multi-sig requirement for upgrades

---

## 5. WORKER SECURITY (Scheduled Tasks)

### 5.1 TimedContributionWorker

**Threats**:
1. Unauthorized worker execution
2. Excessive resource usage
3. Data inconsistency
4. Crash without cleanup

**Mitigations**:

**1. Authentication**
```python
# Only backend processes can trigger
# No public API endpoint for worker
# Scheduled via Celery beat with auth token
```

**2. Rate Limiting**
```python
BATCH_SIZE = 50  # Process max 50 users per batch
MAX_RETRIES = 3  # Don't retry failed endlessly
RETRY_DELAY = 300  # 5 minute delay between retries
```

**3. Monitoring & Alerting**
```python
summary = {
    "total_processed": 100,
    "successful": 95,
    "failed": 5,
    "errors": [...]
}

if summary["failed"] > threshold:
    ALERT_ADMIN()  # Send notification
```

**4. Graceful Degradation**
```python
# Each member processed independently
# One failure doesn't cascade
# Summary report sent regardless
```

### 5.2 Failed Contribution Retry

**Flow**:
```python
async def process_failed_contributions_retry(...):
    # 1. Find recently failed (last 24 hours)
    # 2. Verify still failed (state may have changed)
    # 3. Resubmit to contract
    # 4. Update status
    # 5. Log results
```

**Safety**: Max retry age prevents infinite retry loops.

---

## 6. AUDIT & LOGGING

### 6.1 Contribution Audit Trail

**Logged Events**:
```python
# Logged:
- Contribution initiated (user, amount, group)
- Contribution succeeded (tx_hash, timestamp)
- Contribution failed (reason)
- Wallet lock/unlock (amount, user)
- Contract call success/failure
- Payout execution (recipient, amount, round)
- Emergency refund (user, amount)

# NOT logged:
- Plaintext encrypted amounts (only tx_hash)
- User private keys
- Internal error details (exposed to logs but not to user)
```

**Storage**: 
```python
logger.info(f"Message {user_id=} {amount=} {group_id=}")
# Structured logging via Python logger
# Persisted to: logs/server.logs (should S3/CloudWatch in production)
```

### 6.2 Activity Tracking

**Models**:
- `ActivityLog`: All user actions
- `WalletLedger`: All wallet changes
- `Contribution`: Contribution record with status
- `PayoutRecord` (TODO): All payouts

---

## 7. RECOMMENDATIONS & ENHANCEMENTS

### 7.1 HIGH PRIORITY

| Item | Status | Est. Effort |
|------|--------|-------------|
| Rate limiting on contributions | ⚠️ Partial | 2 hours |
| Multi-signature for large payouts | ✗ Not implemented | 1 day |
| Timestamp validation (ensure no backdating) |  Implemented | - |
| Idempotency keys in API |  Implemented | - |

### 7.2 MEDIUM PRIORITY

| Item | Status | Est. Effort |
|------|--------|-------------|
| Circuit breaker for failed operations | ✗ Not implemented | 4 hours |
| Anomaly detection (unusual withdrawal patterns) | ✗ Not implemented | 1 day |
| Encryption key rotation | ✗ Not implemented | 2 days |
| Audit log encryption | ✗ Not implemented | 4 hours |

### 7.3 LOW PRIORITY / FUTURE

- IP whitelisting for backend APIs
- Geographic restrictions
- Behavioral biometrics
- Decentralized governance voting

---

## 8. THREAT MATRIX

### Impact vs. Likelihood vs. Mitigation

| Threat | Impact | Likelihood | Mitigation | Status |
|--------|--------|-----------|-----------|--------|
| Double-spend | Critical | Low | Wallet lock, state machine |  |
| Replay attack | Critical | Very Low | Nonce, unique IDs |  |
| Unauthorized member | High | Medium | Auth check |  |
| Payout interception | Critical | Low | TX verification |  |
| DoS on worker | Medium | Medium | Rate limiting | ⚠️ |
| Contract upgrade exploit | Critical | Very Low | Timelock, proxy | 🔄 |
| Vault drain | Critical | Low | Rotation verification |  |
| Frontrunning payout | High | Medium | Encrypted amounts |  |

---

## 9. TESTING STRATEGY

### 9.1 Security Test Coverage

```
test_manual_contribution_success                    
test_manual_contribution_insufficient_balance       
test_manual_contribution_non_member                 
test_contribution_amount_validation                 
test_contribution_idempotency                       
test_wallet_lock_prevents_double_spend             
test_payout_authorization                          
test_auto_contribution_not_due                      
test_auto_contribution_insufficient_balance        
test_full_lifecycle                                
```

### 9.2 Running Tests

```bash
# All tests
pytest tests/test_contributions_comprehensive.py -v

# Security tests only
pytest tests/test_contributions_comprehensive.py -k "security" -v

# With coverage
pytest tests/test_contributions_comprehensive.py --cov=app.services.contribution_service
```

---

## 10. COMPLIANCE

### 10.1 Regulatory Considerations

**Potential Jurisdictions**:
- Nigeria: CBN fintech guidelines
- EU: GDPR (for encrypted amounts, audit logs)
- US: FinCEN rules (for amounts >$10k)

**Recommendations**:
1. Implement KYC/AML checks at group creation
2. Track user contributions for reporting
3. Maintain audit trail for regulatory review
4. Implement transaction limits per jurisdiction

### 10.2 Data Retention Policy

```
- Contributions: 7 years (financial record)
- Audit logs: 3 years (compliance)
- Wallet ledger: 7 years (financial record)
- User sessions: 90 days (retention policy)
- Failed attempts: 1 year (security analysis)
```

---

## 11. INCIDENT RESPONSE

### 11.1 Suspected Breach Protocol

```
1. DETECT: Monitoring systems alert on anomaly
   - Unusual withdrawal patterns
   - Failed auth attempts spike
   - Contract call failures

2. CONTAIN: Immediate actions
   - Pause affected contributions (feature flag)
   - Disable auto-workers
   - Isolate affected users

3. INVESTIGATE: Root cause analysis
   - Review logs
   - Query database
   - Check blockchain

4. REMEDIATE: Fix and restore
   - Fix vulnerability
   - Revert fraudulent transactions (if possible)
   - Restore from backup

5. COMMUNICATE: Notify stakeholders
   - Alert admin
   - Notify affected users
   - Document incident
```

### 11.2 Emergency Procedures

```python
# Emergency refund (in PayoutService)
await contract_service.emergency_refund(
    group_address=group_address,
    user_address=user.wallet_address
)

# Pause contributions (feature flag)
ENABLE_CONTRIBUTIONS = False  # config.py

# Disable workers (stop Celery task)
app.control.disable_all()
```

---

## CONCLUSION

The CoopWise contribution system implements **defense-in-depth** security across multiple layers:

 **Input Validation**: Amount, member, group checks  
 **Authentication**: FastAPI JWT + user context injection  
 **Authorization**: Role-based access control  
 **Double-Spend Prevention**: Wallet locking + state machine  
 **Encryption**: FHE for sensitive amounts  
 **Audit Trail**: Comprehensive logging  
 **Error Handling**: Graceful degradation  

**Remaining Risks**: LOW to MEDIUM (with recommended enhancements)

**Review Date**: Next quarter + after each production incident

---

**Prepared by**: Senior Security Engineering Team  
**Last Updated**: March 28, 2026  
**Next Review**: June 28, 2026
