# CoopWise Contribution Architecture + Smart Contract Spec

## 1. Objective

- Define contribution transfer logic for a cooperative savings platform using a smart contract reference ABI.
- Focus on two backend flows:
  1. Automated Debit (wallet-triggered by group policy)
  2. Manual Contribution (user-initiated from wallet)
- Exclude Celery event worker implementation for this phase.
- Provide a document for blockchain developer to implement contract, then implement backend integration.

---

## 2. Overall Architecture

### 2.1 Components

- Frontend: contribution UI and transaction requests (`apps/web/components/dashboard/*`)
- Backend API: FastAPI routes and services
- Persistent DB: PostgreSQL models
  - `Contribution`, `CooperativeGroup`, `GroupMembership`, `Wallet`, `WalletLedger`
- Wallet Service: local stablecoin and local currency balances
- Payment Service: gateway adapter (Paystack, CashRamp, Solana)
- Smart contract layer (on-chain)
  - `cooperativeContract` manages contribution pool and rules

### 2.2 Data model summary

- `Contribution` (`db/models/contribution_model.py`)
  - `status`: pledged|initiated|pending|completed|failed|cancelled
  - `amount`, `currency`, `due_date`, `fulfilled_at`

- `CooperativeGroup` (`db/models/cooperative_group.py`)
  - `contribution_amount`, `contribution_frequency`, `payout_strategy`
  - `next_payout_date`, `target_amount`, rules (JSON)

- `GroupMembership` (`db/models/membership.py`)
  - `role`, `status`, `payout_position`, `has_received_payout_this_cycle`

- `Wallet`/`WalletLedger` (`db/models/wallet_models.py`)
  - capacities for stable currency, local currency and history entries

---

## 3. Smart Contract ABI for Contributions

### 3.1 High-level contract interface (`CoopwiseContribution.sol`)

```
pragma solidity ^0.8.0;

interface ICooperativeContribution {
    struct GroupConfig {
        address creator;
        uint256 contributionAmount;
        uint256 targetAmount;
        uint256 nextPayoutTs;
        uint8 contributionFrequency; // 0=daily,1=weekly,2=monthly
        uint8 payoutStrategy; // 0=rotating,1=equal,2=priority
        bool active;
    }

    struct ContributionDetail {
        address contributor;
        uint256 amount;
        uint256 timestamp;
        uint8 status; // 0=Pledged,1=Initiated,2=Pending,3=Completed,4=Failed,5=Cancelled
    }

    event ContributionCreated(bytes32 indexed contributionId, uint256 indexed groupId, address indexed user, uint256 amount, uint8 status);
    event ContributionUpdated(bytes32 indexed contributionId, uint8 oldStatus, uint8 newStatus);
    event PayoutScheduled(uint256 indexed groupId, uint256 nextPayoutTs);
    event PayoutExecuted(uint256 indexed groupId, address indexed recipient, uint256 amount);

    function registerGroup(uint256 groupId, GroupConfig calldata config) external;
    function submitContribution(uint256 groupId, bytes32 contributionId, uint256 amount) external;
    function approveContribution(uint256 groupId, bytes32 contributionId) external;
    function rejectContribution(uint256 groupId, bytes32 contributionId) external;
    function schedulePayout(uint256 groupId, uint256 when) external;
    function executePayout(uint256 groupId) external;
    function getGroupBalance(uint256 groupId) external view returns (uint256);
    function getContribution(bytes32 contributionId) external view returns (ContributionDetail memory);
}
```

### 3.2 Behaviour from ABI perspective

- `registerGroup`: called with group config, includes contributionAmount + freq + strategy
- `submitContribution`: user commits funds; on-chain contribution is locked into group pool
- `approveContribution`/`rejectContribution`: admin flow, denies or confirms contribution
- `executePayout`: calculates distribution based on `payoutStrategy` and transfers funds to beneficiaries

### 3.3 Status mapping

- 0 => pledged (created but not yet paid)
- 1 => initiated (user locked funds, local pending)
- 2 => pending (gateway processing)
- 3 => completed
- 4 => failed
- 5 => cancelled

---

## 4. Contribution Flow Design (Backend)

### 4.1 Shared setup

- `app/schemas/contribution_schemas.py` stays as canonical request/response DTO.
- `app/services/contribution_service.py` handles local DB operations + on-chain queue event.
- `app/services/wallet_service.py` covers balance checks, debit/credit, and `WalletLedger` writes.
- `app/routers/v1/contribution.py` exposed endpoints.
- Consider introducing `app/services/contract_service.py` to talk to on-chain contract.

### 4.2 Smart Contract adapter (backend)

- `app/services/contract_service.py` outline:
  - `submit_contribution_onchain(groupId, contributionId, amount, userAddress)`
  - `query_group_balance(groupId)`
  - `query_contribution(contributionId)`
  - `execute_payout(groupId)`
  - `onchain_event_listener()` (poll/logs)

### 4.3 Flow A: Automated Debit (group policy-driven)

1. **Trigger**: Group contribution due time from `CooperativeGroup.next_payout_date` and membership due status.
2. **Check user wallet**: `WalletService.get_balance(userId)`.
3. If sufficient: lock amount in wallet and create `WalletLedger` entry with type `debit_locked`.
4. Create `Contribution` record with status `initiated` in DB.
5. Call contract `submitContribution(groupId, contributionId, amount)`.
6. If contract returns success:
   - update `Contribution.status` to `pending` (or `completed` if instant finalization).
   - update local wallet `stable_coin_balance` by subtracting amount (or keep in locked portion currently required).
7. On successful local+onchain sync, event: `ContributionCreated` emitted
8. On failure: rollback `WalletLedger` and DB state to `failed`, notify user.

### 4.4 Flow B: Manual Contribution (user-initiated)

1. User clicks contribute now, calls API endpoint (e.g., `POST /api/v1/contributions/contribute`).
2. Validate:
   - user membership exists in group (`CooperativeMembershipService.get_membership_by_user_and_group`)
   - group active / not completed
   - `amount >= group.contribution_amount` (group rules). optionally allow overpay or partial.
3. Check wallet balance with `WalletService.get_balance` (stablecoin/fiat conversion as needed).
4. If enough funds:
   - `WalletService.withdraw` (or lock) from user wallet
   - Create `Contribution` with `status=initiated` + `source='manual'` metadata in note or JSON
   - Log `WalletLedger` with reference to contribution.
   - Contract call: `submitContribution(groupId, contributionId, amount)`.
   - Mark final state: `completed` after onchain success and local ledger commit.
5. If insufficient: return 400 with description.
6. On payment failure in external gateway: the existing payment path is used and status updated.

### 4.5 Balance states (on backend)

`Wallet` fields:
- `stable_coin_balance` (free)
- `stable_coin_locked` (reserved for pledged contributions)

Transaction states:
- `debit_lock` => reserved in `stable_coin_locked`
- `debit_finalize` => moved from locked to actual payout
- `debit_revert` => return locked funds when failure/cancel

### 4.6 Safety & security controls

- Enforce ownership: only `user_id` can operate own wallet.
- Validate membership and group active to prevent contributions to closed groups.
- Double-write refusal: do not mark DB completed until onchain tx confirmed.
- Add signature or nonce checks on manual contributions as optional
- On every critical transition, write `app/models/activity_log` entry.

---

## 5. Contribution Lifecycle + State Machine

1. `pledged` (user expresses intent via UI; no wallet movement yet)
2. `initiated` (wallet debited/locked locally, onchain submit started)
3. `pending` (onchain & gateway waiting confirmation)
4. `completed` (onchain accepted + wallet settled)
5. `failed` (any error in wallet or contract; maybe allow retry)
6. `cancelled` (manual user cancellation before completion)

---

## 6. Smart Contract Requirements for Developer

### 6.1 Contract state

- mapping `uint256 => GroupConfig` for each group
- mapping `bytes32 => ContributionDetail`
- mapping `uint256 => uint256` for group pool balances
- mapping `uint256 => address[]` for current cycle member queue
- mapping `uint256 => uint256` for group cycle index

### 6.2 Methods

- `registerGroup(uint256 groupId, GroupConfig config)`
- `submitContribution(uint256 groupId, bytes32 contributionId, uint256 amount)`
- `finalizeContribution(bytes32 contributionId, bool success)` (optional)
- `triggerPayout(uint256 groupId)`
- `calculateNextRecipient(uint256 groupId)`
- `claimPayout(uint256 groupId, address recipient)` (or direct `payout` method)
- `setPayoutStrategy(uint256 groupId, uint8 strategy)`
- `getContributionStatus(bytes32 contributionId)`

### 6.3 Events

- `ContributionCreated(bytes32 indexed contributionId, uint256 indexed groupId, address contributor, uint256 amount)`
- `ContributionStatusChanged(bytes32 indexed contributionId, uint8 oldStatus, uint8 newStatus)`
- `PayoutExecuted(uint256 indexed groupId, address recipient, uint256 amount, uint256 ts)`
- `GroupConfigUpdated(uint256 indexed groupId, address updater)`

### 6.4 Invariants

- sum(contributions in group) <= targetAmount (or can exceed, but track overpayment)
- only group members can `submitContribution` (check mapping membership onchain, or via offchain proof)
- `executePayout` only if group pool >= required payout amount
- no double payout via `hasReceivedPayoutThisCycle` guard.

---

## 7. Backend API Changes (Needed)

### 7.1 Contribution endpoints

- `POST /api/v1/contributions/contribute` (existing)
  - add param: `mode: 'manual' | 'auto'`
  - add validation for `group.contribution_amount`
  - call wallet lock and contract submit

- `POST /api/v1/contributions/auto-debit` (new)
  - input: `group_id`, optionally `member_ids[]`
  - logic: for each due member, attempt wallet debit; track failures

- `GET /api/v1/contributions/:id` (existing)
- `GET /api/v1/contributions` (existing)
  - include `source`, `payout_cycle_id`, `contract_tx_hash`

### 7.2 Group endpoints

- `POST /api/v1/groups/payout/execute` (admin trigger)
- `GET /api/v1/groups/:id/payout-schedule`
- `GET /api/v1/groups/:id/payout-history`

---

## 8. Backend Internal Service Design

### ContributionService (extend)

- `process_manual_contribution(contribution_data, user, db)`
- `process_auto_debit(group, user, db)`
- `mark_contribution_failed(contribution_id, reason)`
- `mark_contribution_success(contribution_id, txHash)`
- `sync_onchain_status(contribution_id)`

### WalletService (extend)

- `lock_for_contribution(user_id, amount)`
- `release_locked_funds(user_id, amount)`
- `finalize_contribution_debit(user_id, amount)`
- `get_effective_balance(user_id)`

### ContractService (new)

- `submit_contribution_onchain(group_id, contribution_id, amount, user_address)`
- `confirm_contribution_status(contribution_id)`
- `read_group_config(group_id)`
- `execute_group_payout(group_id)`

---

## 9. Onchain - Offchain Sync Contract Schema (Data Mirror)

| Onchain notated | Backend model | purpose |
|---|---|---|
| `ContributionState` | `Contribution.status` | sync status, reconciliation |
| `GroupPoolBalance` | `CooperativeGroup` pool amount (approx) | verify host values |
| `PayoutQueue` | `GroupMembership.payout_position` | rolling group payout order |
| `Contribution` | `Contribution` DB row | state + audit tracking |

---

## 10. Developer Step-by-step Guide (Blockchain-first)

1. Implement contract interface and events with stablecoin ERC20 (or native network coin) support.
2. Provide ABI and contract address to backend team.
3. Expose helper endpoints for onchain query (group state, contribution status).
4. Backend uses `web3` (Eth / Solana adapter) to call contract functions:
   - `submitContribution` from `manual` / `automated` flows
   - `executePayout` by scheduler/admin
5. Backend stores tx hash and status each step in DB.
6. For failure and retry, use explicit `ContributionStatus.failed` + `cancel` logic.

---

## 11. Security and audit checklist

- Validate `groupId` and membership before wallet transfers.
- Ensure all user contributions are nonce-protected (or idempotency-keyed).
- Escrow funds in wallet until fully confirmed.
- Prevent replay using contribution UUID and smart contract claim guard.
- Add server-side logging for every state transition, to a dedicated audit table.

---

## 12. Next Steps (Backend now)

1. Add `contract_service.py` + ABI wrapper.
2. Extend `ContributionService` and `WalletService` for lock/finalize flows.
3. Add rollback pattern in route error handling.
4. Implement new group-level actions (`auto-debit`, `execute-payout`).
5. Build tests for both flows.

---

## 13. Contribution Architecture Summary (for handoff)

### Key Concepts
- Contribution is not final until both local wallet and smart contract confirm.
- Two flow modes: `auto` (policy) and `manual`.
- Balances include free and locked amounts.
- Payout is separate lifecycle from contribution, and uses group strategy.

### Contract-first requirement
- Build on-chain state machine first: group config, contribution log, token pool, payout walker.
- Mirror critical events off-chain for app dashboards.

### Backend requirement
- Orchestration service that calls smart contract and updates local aggregates.
- CI steps: run contract tests, run API tests, run integration tests with simulated chain.


---

## 14. Notes for integration

- `ContributionStatus` enum in backend should match onchain statuses.
- `payout_strategy` conversions should be shared as constants in both codebases.
- High priority from frontend: `.contribution-summary`, `.contribution-history`, `.payout-tracker`.

---

*Approved for immediate handoff to blockchain dev and backend team.*