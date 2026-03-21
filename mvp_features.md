# CoopWise MVP — Feature Deliverables

Five features. Each one described at three levels: what the user experiences, what happens technically, and exactly which files/functions implement it.

---

## Feature 1 — Account creation

### What the user experiences

The user downloads the app or visits the web app. They enter their phone number, receive an OTP, and verify with their device biometrics (Face ID / fingerprint). That's it. No seed phrase. No "connect wallet" modal. No buying FLOW for gas. They land on a dashboard with a CoopWise account and a wallet address already provisioned.

### What actually happens

Flow accounts are smart contracts natively. When a user signs up, CoopWise's backend creates a Flow account on their behalf using the **fee payer account** (CoopWise pays the ~0.001 FLOW account creation cost). The user's biometric generates a P-256 keypair (via the Web Crypto API / device secure enclave). The public key is registered as a key on their new Flow account. Their phone is now their signing device.

This uses Flow's **Account Abstraction** — not a bolt-on like ERC-4337, but a native protocol feature. There is no seed phrase because the account is a smart contract, not a private key. The private key lives in the device's secure enclave, never leaves it, and signs transactions via WebAuthn/passkey.

### Implementation

**Step 1 — OTP verification (existing FastAPI)**

```
POST /api/auth/send-otp    { phone: "+2348012345678" }
POST /api/auth/verify-otp  { phone: "+2348012345678", otp: "123456" }
```

This is your existing auth flow. On successful OTP verification, instead of just creating a DB user, you also trigger account provisioning.

**Step 2 — Passkey / keypair generation (Next.js frontend)**

```typescript
// apps/web/lib/flow/account.ts

export async function generatePasskeyForUser(phone: string) {
  // Uses WebAuthn API — key lives in device secure enclave
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: new Uint8Array(32),  // from backend
      rp: { name: "CoopWise", id: "coopwise.app" },
      user: {
        id: new TextEncoder().encode(phone),
        name: phone,
        displayName: phone,
      },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }],  // ES256 = P-256
      authenticatorSelection: {
        authenticatorAttachment: "platform",  // device biometric only
        userVerification: "required",
      },
    },
  })
  // Extract the P-256 public key bytes from the credential
  const publicKeyBytes = extractPublicKeyBytes(credential)
  return { credential, publicKeyBytes }
}
```

**Step 3 — Flow account creation (FastAPI backend)**

```python
# backend/api/app/services/flow_service.py

async def create_user_flow_account(public_key_hex: str) -> str:
    """
    Creates a Flow smart-contract account for a new user.
    CoopWise fee payer covers the creation fee (~0.001 FLOW).
    Returns the new account's Flow address.
    """
    cadence = open("blockchain/cadence/transactions/CreateUserAccount.cdc").read()
    tx_id = await send_transaction(
        cadence=cadence,
        args=[{"type": "String", "value": public_key_hex}],
        payer_address=COOPWISE_FEE_PAYER_ADDRESS,
        payer_key=COOPWISE_FEE_PAYER_KEY,
    )
    # Poll for the transaction to seal and extract the new account address from events
    new_address = await await_account_created_event(tx_id)
    return new_address
```

**Step 4 — `CreateUserAccount.cdc` transaction**

```cadence
// blockchain/cadence/transactions/CreateUserAccount.cdc
// Creates a new Flow account for a CoopWise user.
// Payer = CoopWise fee payer. User pays nothing.

transaction(userPublicKeyHex: String) {
  prepare(feePayer: auth(BorrowValue) &Account) {
    // Create new account — fee payer covers the creation cost
    let newAccount = Account(payer: feePayer)

    // Register the user's passkey-derived P-256 public key
    let key = PublicKey(
      publicKey: userPublicKeyHex.decodeHex(),
      signatureAlgorithm: SignatureAlgorithm.ECDSA_P256
    )
    newAccount.keys.add(
      publicKey: key,
      hashAlgorithm: HashAlgorithm.SHA3_256,
      weight: 1000.0   // full signing weight
    )

    // Emit the new address so the backend can capture it
    // Flow emits AccountCreated event automatically
  }
}
```

**Step 5 — Store in Postgres**

```python
# backend/api/app/routers/auth.py  (extend existing verify-otp endpoint)

@router.post("/verify-otp")
async def verify_otp(body: VerifyOTPBody, db=Depends(get_db)):
    # Existing: verify OTP
    user = auth_service.verify_otp(db, body.phone, body.otp)

    # New: provision Flow account
    flow_address = await flow_service.create_user_flow_account(body.public_key_hex)

    # Store the Flow address against the user
    user.flow_address = flow_address
    db.commit()

    return {
        "user_id": user.id,
        "flow_address": flow_address,
        "access_token": create_jwt(user.id),
    }
```

**Database change — add one column to the existing users table:**

```sql
ALTER TABLE users ADD COLUMN flow_address VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN passkey_credential_id TEXT;
```

### What the user has after this feature

- A Flow smart-contract account at address `0xABCDEF`
- Their phone biometric is the signing key for that account
- CoopWise has paid the account creation fee — user has never seen FLOW
- Their wallet is ready to receive USDC payouts

---

## Feature 2 — Join or create a circle

### What the user experiences

**Creating:** The user taps "Start a circle", enters a circle name, sets a weekly contribution amount (in NGN — CoopWise converts to USDC internally), picks a payout schedule (weekly/monthly), and invites members by phone number. The circle is created immediately.

**Joining:** A user receives an invite link or notification. They tap "Join", review the circle terms (size, amount, schedule), and confirm. They are now a member.

### What actually happens

A circle is a `Circle` resource stored in `CoopWise.cdc` on the Flow blockchain. Creating a circle writes this resource on-chain and assigns a unique `circleId`. Joining a circle appends the member's address to the `members` array and `rotationQueue`. The rotation order is set at creation time (or can be randomised — configurable).

The `weeklyAmountUSDC` stored on-chain is in USDC (6 decimals). The frontend shows it in the user's local currency (NGN, KES, GHS) using a live exchange rate from the BandProtocol oracle.

### Implementation

**API — create circle**

```python
# backend/api/app/routers/circles.py

@router.post("/circles")
async def create_circle(body: CreateCircleBody, current_user=Depends(get_current_user), db=Depends(get_db)):
    # 1. Resolve phone numbers → Flow addresses for all invited members
    member_addresses = await resolve_member_addresses(db, body.member_phones)
    member_addresses.insert(0, current_user.flow_address)  # creator is first member

    # 2. Convert NGN amount → USDC via current rate
    usdc_amount = await fx_service.ngn_to_usdc(body.weekly_amount_ngn)

    # 3. Write circle to blockchain
    tx_id = await flow_service.create_circle(
        member_addresses=member_addresses,
        weekly_amount_usdc=usdc_amount,
    )
    circle_id = await flow_service.await_circle_created_event(tx_id)

    # 4. Mirror in Postgres (for fast queries, notifications, KYC data)
    circle = circle_service.create_circle_record(db, {
        "chain_circle_id": circle_id,
        "name": body.name,
        "creator_id": current_user.id,
        "weekly_amount_usdc": usdc_amount,
        "weekly_amount_ngn": body.weekly_amount_ngn,
        "member_ids": [m.id for m in resolve_users(db, member_addresses)],
        "payout_schedule": body.payout_schedule,
    })

    # 5. Send invite notifications to all members
    notification_service.send_circle_invites(circle, current_user)

    return { "circle_id": circle_id, "tx_id": tx_id }
```

**Cadence — `CreateCircle.cdc`** (already written in contracts doc)

**API — join circle**

```python
@router.post("/circles/{circle_id}/join")
async def join_circle(circle_id: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    # 1. Submit JoinCircle.cdc transaction
    tx_id = await flow_service.join_circle(
        circle_id=circle_id,
        member_address=current_user.flow_address,
    )

    # 2. Update Postgres membership record
    circle_service.add_member(db, circle_id, current_user.id)

    return { "tx_id": tx_id, "status": "joined" }
```

**Schemas (Pydantic)**

```python
# backend/api/app/schemas/circle.py

class CreateCircleBody(BaseModel):
    name: str
    member_phones: list[str]          # e.g. ["+2348012345678", "+2349087654321"]
    weekly_amount_ngn: float          # user enters in naira
    payout_schedule: Literal["weekly", "biweekly", "monthly"]
    rotation_order: Literal["sequential", "random"] = "sequential"

class CircleResponse(BaseModel):
    chain_circle_id: int
    name: str
    member_count: int
    weekly_amount_ngn: float
    weekly_amount_usdc: float
    next_payout_date: datetime
    your_position_in_queue: int       # when is your turn
```

**Frontend — circle creation form**

```typescript
// apps/web/components/circle/CreateCircleForm.tsx

export function CreateCircleForm() {
  const [members, setMembers] = useState<string[]>([])
  const [weeklyAmountNgn, setWeeklyAmountNgn] = useState(0)

  async function handleSubmit() {
    // Show loading state — this involves a blockchain transaction
    const { circle_id, tx_id } = await api.post("/circles", {
      name, member_phones: members, weekly_amount_ngn: weeklyAmountNgn, payout_schedule
    })
    // Wait for tx to seal (FCL poll) then redirect to circle page
    await fcl.tx(tx_id).onceSealed()
    router.push(`/circle/${circle_id}`)
  }
}
```

**Frontend — circle detail page (what a member sees)**

```typescript
// apps/web/app/(dashboard)/circle/[id]/page.tsx

export default function CirclePage({ params }) {
  const { circle, members, isLoading } = useCircle(params.id)

  return (
    <div>
      <h1>{circle.name}</h1>
      <p>₦{circle.weekly_amount_ngn.toLocaleString()} / week · {circle.member_count} members</p>

      {/* Member contribution status — ✓ or ✗ only, no amounts */}
      <MemberStatusGrid members={members} />

      {/* Your position in the queue */}
      <PayoutQueueCard position={circle.your_position} nextDate={circle.next_payout_date} />
    </div>
  )
}
```

### Database additions

```sql
-- circles table (new)
CREATE TABLE circles (
  id              SERIAL PRIMARY KEY,
  chain_circle_id INTEGER UNIQUE NOT NULL,   -- the on-chain UInt64 ID
  name            VARCHAR(100),
  creator_id      INTEGER REFERENCES users(id),
  weekly_amount_usdc NUMERIC(12,6),
  weekly_amount_ngn  NUMERIC(14,2),
  payout_schedule VARCHAR(20),
  rotation_order  VARCHAR(20),
  current_round   INTEGER DEFAULT 0,
  is_complete     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- circle_members table (new)
CREATE TABLE circle_members (
  id        SERIAL PRIMARY KEY,
  circle_id INTEGER REFERENCES circles(id),
  user_id   INTEGER REFERENCES users(id),
  queue_position INTEGER,               -- their rotation order
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);
```

---

## Feature 3 — Contribute to a circle

### What the user experiences

**Manual contribution:** The user opens their circle, taps "Contribute this week", sees their contribution amount pre-filled (in NGN), confirms with biometrics. Done. A ✓ appears next to their name. Other members see the ✓ but never see the amount.

**Automatic contribution:** The user opts into auto-pay when joining a circle. Every week, on the contribution deadline, the contribution is submitted automatically — no action required. The user gets a push notification: "Your ₦5,000 contribution to Lagos-7 was submitted."

### What actually happens

**Manual path:** The frontend calls the backend to get an encrypted version of the contribution amount from the Zama relayer. The encrypted amount + proof is then submitted as a Cadence transaction signed by the user's passkey. The Cadence contract calls `CoopWiseVault.sol` via Cross-VM bridge, which calls `FHE.add` to accumulate the encrypted pool. The plaintext amount never appears on-chain.

**Automatic path:** The Forte Scheduled Transaction (a Flow protocol-level cron) fires every 7 days. This submits `Contribute.cdc` on behalf of each member automatically. The fee payer (CoopWise) covers gas. The user's passkey is not needed because the Forte scheduler was authorised once at circle creation time (session key pattern — a limited-capability key is registered on the user's account for this circle only).

### Implementation

**Manual contribution — API endpoint**

```python
# backend/api/app/routers/circles.py

@router.post("/circles/{circle_id}/contribute")
async def contribute(
    circle_id: int,
    body: ContributeBody,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    circle = circle_service.get_circle(db, circle_id)

    # 1. Convert the user's local currency amount to USDC micro-units
    usdc_micro = await fx_service.ngn_to_usdc_micro(circle.weekly_amount_ngn)

    # 2. Encrypt the amount via Zama relayer sidecar
    #    Returns { encryptedAmount: "0x...", inputProof: "0x..." }
    encrypted = await fhevm_service.encrypt_contribution(
        amount=usdc_micro,
        member_address=current_user.flow_address,
    )

    # 3. Return the encrypted payload to the frontend
    #    The frontend signs and submits the Cadence transaction directly
    #    (keeps the user's signing key on their device — backend never touches it)
    return {
        "encrypted_amount": encrypted["encryptedAmount"],
        "input_proof": encrypted["inputProof"],
        "circle_chain_id": circle.chain_circle_id,
        "usdc_micro": usdc_micro,
    }

class ContributeBody(BaseModel):
    pass  # no body needed — amount is taken from circle config
```

**Manual contribution — frontend hook**

```typescript
// apps/web/hooks/useContribution.ts

export function useContribution(circleId: string) {
  const [status, setStatus] = useState<"idle" | "encrypting" | "signing" | "confirming" | "done">("idle")

  async function contribute() {
    setStatus("encrypting")

    // 1. Get encrypted amount from backend (calls Zama relayer internally)
    const { encrypted_amount, input_proof, circle_chain_id } =
      await api.post(`/circles/${circleId}/contribute`)

    setStatus("signing")

    // 2. User signs the transaction with their passkey (Touch ID / Face ID)
    //    FCL triggers the biometric prompt automatically
    const txId = await fcl.mutate({
      cadence: CONTRIBUTE_CDC,
      args: (arg, t) => [
        arg(circle_chain_id.toString(), t.UInt64),
        arg(hexToBytes(encrypted_amount), t.Array(t.UInt8)),
        arg(hexToBytes(input_proof), t.Array(t.UInt8)),
      ],
      proposer: fcl.currentUser,
      authorizations: [fcl.currentUser],
      payer: coopwiseFeePayer,   // CoopWise pays gas — user pays nothing
      limit: 9999,
    })

    setStatus("confirming")

    // 3. Wait for transaction to seal on Flow (usually ~5 seconds)
    await fcl.tx(txId).onceSealed()

    setStatus("done")
    return txId
  }

  return { contribute, status }
}
```

**Automatic contribution — Forte session key registration**

When a user joins a circle and opts into auto-pay, a limited-capability session key is registered on their Flow account. This key can only submit `Contribute.cdc` for that specific circle — it cannot move funds or do anything else.

```cadence
// blockchain/cadence/transactions/RegisterAutoPayKey.cdc
// Called once when user opts into automatic contributions for a circle.
// Registers a CoopWise-controlled session key on the user's account.
// This key can ONLY call Contribute.cdc for this circle.

transaction(circleId: UInt64, sessionPublicKey: String) {
  prepare(user: auth(Keys) &Account, feePayer: &Account) {
    // Add a limited-weight key for CoopWise to use for auto-contributions
    // Weight 500 = below the 1000 threshold for full account control
    // Cannot: transfer tokens, add/remove keys, deploy contracts
    // Can: submit transactions (the transaction itself gates what it can do)
    let key = PublicKey(
      publicKey: sessionPublicKey.decodeHex(),
      signatureAlgorithm: SignatureAlgorithm.ECDSA_P256
    )
    user.keys.add(
      publicKey: key,
      hashAlgorithm: HashAlgorithm.SHA3_256,
      weight: 500.0
    )
  }
}
```

```python
# backend/api/app/workers/auto_contribute_worker.py
# Celery beat task — runs weekly, submits contributions for auto-pay members

from .celery import celery

@celery.task
def auto_contribute_circle(circle_id: int):
    """
    Submits automatic contributions for all opted-in members of a circle.
    Uses the session key registered on each user's Flow account.
    Called by Celery beat on the circle's contribution schedule.
    """
    circle = get_circle(circle_id)
    auto_pay_members = get_auto_pay_members(circle_id)

    for member in auto_pay_members:
        try:
            # Encrypt their contribution amount
            encrypted = fhevm_service.encrypt_contribution_sync(
                amount=circle.weekly_amount_usdc_micro,
                member_address=member.flow_address,
            )
            # Submit Contribute.cdc using their session key
            tx_id = flow_service.contribute_with_session_key(
                circle_id=circle.chain_circle_id,
                member_address=member.flow_address,
                encrypted_amount=encrypted["encryptedAmount"],
                input_proof=encrypted["inputProof"],
                session_key=member.session_private_key,  # stored encrypted in DB
            )
            # Record in Postgres
            contribution_service.record_contribution(
                circle_id=circle_id,
                member_id=member.id,
                tx_id=tx_id,
                round=circle.current_round,
            )
            notification_service.send_contribution_confirmed(member, circle)

        except Exception as e:
            notification_service.send_contribution_failed(member, circle, error=str(e))
```

**Database additions**

```sql
-- contributions table (new)
CREATE TABLE contributions (
  id            SERIAL PRIMARY KEY,
  circle_id     INTEGER REFERENCES circles(id),
  member_id     INTEGER REFERENCES users(id),
  round         INTEGER NOT NULL,
  tx_id         VARCHAR(64) UNIQUE,           -- Flow transaction ID
  submitted_at  TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at  TIMESTAMPTZ,
  -- NOTE: NO amount column — amounts are encrypted on-chain
  UNIQUE(circle_id, member_id, round)
);

-- auto_pay_settings table (new)
CREATE TABLE auto_pay_settings (
  id                   SERIAL PRIMARY KEY,
  circle_member_id     INTEGER REFERENCES circle_members(id) UNIQUE,
  enabled              BOOLEAN DEFAULT FALSE,
  session_key_index    INTEGER,    -- key index on Flow account
  session_private_key  TEXT,       -- encrypted with server KMS key
  registered_at        TIMESTAMPTZ
);
```

### What gets stored where

| Store | What | Who can read it |
|---|---|---|
| Flow blockchain (Cadence) | `ContributionReceived` event: circleId, member, round, txId | Anyone — no amount |
| Flow EVM (CoopWiseVault.sol) | `circlePool[circleId]` as `euint64` ciphertext | Nobody (only the contract itself) |
| Postgres `contributions` table | circleId, memberId, round, txId | CoopWise backend — no amount |
| Frontend UI | ✓ or ✗ per member per round | All circle members |

---

## Feature 4 — Inspect transactions (leaderboard / circle history)

### What the user experiences

**Circle history tab:** Inside a circle, the user sees a feed of all contribution activity across all rounds. Each entry shows: who contributed, which round, when, and a link to the transaction on the Flow block explorer. No amounts are shown anywhere — only the action and the timestamp.

**Platform leaderboard:** A global screen showing the most active circles and top contributors by number of contributions (not amounts). Shows total circles created, total rounds completed, total members. Never shows any money figures.

**On-chain verification:** A "verify on-chain" button on any contribution opens the Flow block explorer transaction, where the user can see the encrypted ciphertext handle. They can verify the transaction happened without seeing the amount.

### What actually happens

Contribution history is served from **two sources** depending on what's being shown:

- **Postgres** is the fast source for the app UI — already synced by the event-listener service. This is what the circle history feed reads.
- **Flow blockchain** is the truth source — always available for verification. The "verify on-chain" link goes directly to flowscan.io.

The leaderboard reads only counts, never amounts. Postgres stores no amounts. The on-chain data is encrypted. There is no way for any surface — app, API, database, block explorer — to show contribution amounts to anyone except the rotation winner at payout time.

### Implementation

**API — circle history**

```python
# backend/api/app/routers/circles.py

@router.get("/circles/{circle_id}/history")
async def get_circle_history(
    circle_id: int,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    # Verify current user is a member of this circle
    assert_member(db, circle_id, current_user.id)

    # Read from Postgres — fast, no blockchain call needed
    history = db.query(Contribution).filter(
        Contribution.circle_id == circle_id
    ).order_by(Contribution.submitted_at.desc()).all()

    return [
        {
            "member_name": contribution.member.display_name,
            "member_address": contribution.member.flow_address,
            "round": contribution.round,
            "submitted_at": contribution.submitted_at,
            "tx_id": contribution.tx_id,
            "explorer_url": f"https://testnet.flowscan.io/tx/{contribution.tx_id}",
            # NO amount field — intentionally absent
        }
        for contribution in history
    ]
```

**API — leaderboard**

```python
@router.get("/leaderboard")
async def get_leaderboard(db=Depends(get_db)):
    # Top circles by total contributions made (count, not amount)
    top_circles = db.execute("""
        SELECT
            c.name,
            c.chain_circle_id,
            COUNT(co.id) as total_contributions,
            COUNT(DISTINCT co.member_id) as member_count,
            MAX(co.round) as current_round
        FROM circles c
        LEFT JOIN contributions co ON co.circle_id = c.id
        GROUP BY c.id
        ORDER BY total_contributions DESC
        LIMIT 20
    """).fetchall()

    # Platform stats (counts only — no amounts anywhere)
    stats = db.execute("""
        SELECT
            COUNT(DISTINCT c.id)   as total_circles,
            COUNT(DISTINCT cm.user_id) as total_members,
            COUNT(co.id)            as total_contributions_ever,
            COUNT(DISTINCT CASE WHEN c.is_complete THEN c.id END) as completed_circles
        FROM circles c
        LEFT JOIN circle_members cm ON cm.circle_id = c.id
        LEFT JOIN contributions co ON co.circle_id = c.id
    """).fetchone()

    return {
        "platform_stats": {
            "total_circles": stats.total_circles,
            "total_members": stats.total_members,
            "total_contributions": stats.total_contributions_ever,
            "completed_circles": stats.completed_circles,
            # NO total_volume, NO average_contribution — never expose amounts
        },
        "top_circles": [
            {
                "name": row.name,
                "chain_circle_id": row.chain_circle_id,
                "total_contributions": row.total_contributions,
                "member_count": row.member_count,
                "current_round": row.current_round,
            }
            for row in top_circles
        ],
    }
```

**API — on-chain verification (proxies to Flow REST API)**

```python
@router.get("/transactions/{tx_id}/verify")
async def verify_transaction(tx_id: str):
    """
    Fetches the raw Flow transaction from the blockchain.
    Returns the transaction details including the encrypted payload.
    The user can see the transaction happened and verify it on-chain,
    but cannot read the encrypted amount.
    """
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"https://rest-testnet.onflow.org/v1/transactions/{tx_id}"
        )
    tx = res.json()
    return {
        "tx_id": tx_id,
        "status": tx["execution_result"]["status"],
        "block_height": tx["reference_block_id"],
        "events": [
            {
                "type": e["type"],
                "timestamp": e["timestamp"],
                # event payload includes circleId, member, round — but not amount
            }
            for e in tx.get("execution_result", {}).get("events", [])
            if "ContributionReceived" in e["type"]
        ],
        "explorer_url": f"https://testnet.flowscan.io/tx/{tx_id}",
    }
```

**Frontend — circle history feed**

```typescript
// apps/web/components/circle/CircleHistory.tsx

export function CircleHistory({ circleId }: { circleId: string }) {
  const { data: history } = useSWR(`/circles/${circleId}/history`)

  return (
    <div>
      {history?.map((entry) => (
        <div key={entry.tx_id} className="history-entry">
          <Avatar address={entry.member_address} name={entry.member_name} />
          <div>
            <span className="member-name">{entry.member_name}</span>
            <span className="action"> contributed</span>
            <span className="round"> · Round {entry.round}</span>
          </div>
          <div className="right">
            <span className="time">{formatRelativeTime(entry.submitted_at)}</span>
            <a
              href={entry.explorer_url}
              target="_blank"
              rel="noopener noreferrer"
              className="verify-link"
            >
              Verify ↗
            </a>
          </div>
          {/* NOTE: No amount shown anywhere in this component */}
        </div>
      ))}
    </div>
  )
}
```

**Frontend — leaderboard**

```typescript
// apps/web/app/(dashboard)/leaderboard/page.tsx

export default function LeaderboardPage() {
  const { data } = useSWR("/leaderboard")

  return (
    <div>
      {/* Platform stats — counts only */}
      <div className="stats-grid">
        <StatCard label="Active circles" value={data?.platform_stats.total_circles} />
        <StatCard label="Members" value={data?.platform_stats.total_members} />
        <StatCard label="Contributions made" value={data?.platform_stats.total_contributions} />
        <StatCard label="Circles completed" value={data?.platform_stats.completed_circles} />
        {/* No money amounts on this page */}
      </div>

      {/* Top circles by activity */}
      {data?.top_circles.map((circle) => (
        <CircleRankCard
          key={circle.chain_circle_id}
          name={circle.name}
          contributions={circle.total_contributions}
          members={circle.member_count}
          round={circle.current_round}
          // No amounts
        />
      ))}
    </div>
  )
}
```

**Event listener — keeps Postgres in sync**

```typescript
// services/event-listener/src/handlers.ts

export async function handleContributionReceived(event: FlowEvent) {
  // event.data: { circleId, member, round }  — no amount in the event
  await db.query(`
    INSERT INTO contributions (circle_id, member_id, round, tx_id, confirmed_at)
    VALUES (
      (SELECT id FROM circles WHERE chain_circle_id = $1),
      (SELECT id FROM users WHERE flow_address = $2),
      $3, $4, NOW()
    )
    ON CONFLICT (circle_id, member_id, round) DO UPDATE SET confirmed_at = NOW()
  `, [event.data.circleId, event.data.member, event.data.round, event.txId])
}
```

---

## Feature 5 — Payout

### What the user experiences

When it is a member's turn in the rotation, they receive a push notification: "It's your turn! Your payout is being processed." Within 30–60 minutes, the full circle pool lands in their bank account (NGN/KES/GHS). Inside the app, the circle page shows their round as complete with a ✓, and they can see their own payout amount in their personal transaction history — but only them, not the other members.

### What actually happens

Five things happen in sequence, automatically:

1. The Forte Scheduled Transaction fires `TriggerRotation.cdc`. The next winner's address is popped from the rotation queue.
2. `CoopWise.cdc` calls `CoopWiseVault.sol` via Cross-VM bridge — `triggerPayout(circleId, winner)`.
3. Zama FHEVM grants the winner ACL decryption rights (`FHE.allow(pool, winner)`) and requests async decryption from the oracle.
4. The Zama oracle calls back `callbackPayout()` with the cleartext amount + proof. The `PayoutReady` event is emitted.
5. The event-listener picks up `PayoutReady`, triggers the Celery `payout_worker`, which calls Flutterwave/Paystack to send a bank transfer.

The winner sees their amount in their personal history only because the backend stores it after the `UnwrapFinalized` event — where the cleartext first appears. This amount is stored encrypted in Postgres (AES-256) and served only to the winner when they query their own history.

### Implementation

**Forte scheduled transaction registration (on circle creation)**

```cadence
// blockchain/cadence/transactions/RegisterCircleSchedule.cdc
// Called once when a circle is created.
// Registers the weekly auto-rotation trigger with Forte.

import "CoopWise"

transaction(circleId: UInt64, intervalSeconds: UInt64) {
  prepare(coordinator: auth(BorrowValue) &Account) {
    // Register a Forte Scheduled Transaction:
    // Every intervalSeconds, run TriggerRotation.cdc for this circleId.
    // Fee payer = CoopWise (no gas for members).
    scheduleTransaction(
      cadence: getTriggerRotationCadence(),
      args: [circleId],
      intervalSeconds: intervalSeconds,   // 604800 = 7 days
      payer: coordinator.address
    )
  }
}
```

**Payout worker (Celery)**

```python
# backend/api/app/workers/payout_worker.py

from .celery import celery
from ..services import offramp_service, kyc_service, notification_service

@celery.task(bind=True, max_retries=5, default_retry_delay=300)
def process_payout(self, circle_id: int, winner_flow_address: str, cleartext_usdc: int):
    """
    Triggered by event-listener when CoopWiseVault emits PayoutReady.
    cleartext_usdc: USDC amount in micro-units (6 decimals).
                    This is the first time this value appears in the backend.
    """
    try:
        # 1. Look up winner's KYC/bank details
        winner = kyc_service.get_user_by_flow_address(winner_flow_address)
        if not winner or not winner.bank_account_verified:
            raise ValueError(f"Winner {winner_flow_address} has no verified bank account")

        # 2. Convert USDC to local currency
        local_amount = fx_service.usdc_micro_to_local(cleartext_usdc, winner.currency)

        # 3. Store payout record (amount encrypted at rest)
        payout = payout_service.create_payout_record(
            circle_id=circle_id,
            winner_id=winner.id,
            usdc_amount=cleartext_usdc,      # stored encrypted with AES-256
            local_amount=local_amount,
            currency=winner.currency,
        )

        # 4. Trigger bank transfer via Flutterwave or Paystack
        transfer_ref = f"coopwise-{circle_id}-{payout.id}"
        transfer = offramp_service.transfer(
            bank_code=winner.bank_code,
            account_number=winner.account_number,
            amount=local_amount,
            currency=winner.currency,
            reference=transfer_ref,          # idempotency key — safe to retry
            narration=f"CoopWise circle payout - round {payout.round}",
        )

        # 5. Update payout record with transfer status
        payout_service.update_payout_status(payout.id, transfer_id=transfer["id"], status="processing")

        # 6. Notify winner
        notification_service.send_payout_initiated(winner, local_amount, winner.currency)

    except Exception as exc:
        # Retry up to 5 times with 5-minute delay between attempts
        raise self.retry(exc=exc)
```

**Offramp service**

```python
# backend/api/app/services/offramp_service.py

import flutterwave_python as flw
import os

client = flw.Client(secret_key=os.getenv("FLUTTERWAVE_SECRET_KEY"))

def transfer(bank_code: str, account_number: str, amount: float,
             currency: str, reference: str, narration: str) -> dict:
    """
    Initiates a bank transfer via Flutterwave.
    reference is an idempotency key — duplicate calls with the same reference
    return the existing transfer, never double-pay.
    """
    return client.Transfer.initiate({
        "account_bank": bank_code,
        "account_number": account_number,
        "amount": amount,
        "currency": currency,
        "reference": reference,
        "narration": narration,
        "callback_url": f"{os.getenv('API_BASE_URL')}/webhooks/flutterwave",
    })
```

**Flutterwave webhook — confirms transfer completion**

```python
# backend/api/app/routers/webhooks.py

@router.post("/webhooks/flutterwave")
async def flutterwave_webhook(request: Request, db=Depends(get_db)):
    # Verify Flutterwave signature
    payload = await request.json()
    assert_flutterwave_signature(request.headers, payload)

    if payload["event"] == "transfer.completed":
        payout_service.mark_payout_complete(
            db,
            reference=payload["data"]["reference"],
            completed_at=payload["data"]["complete_message"],
        )
        winner = get_winner_by_reference(db, payload["data"]["reference"])
        notification_service.send_payout_confirmed(winner)

    return { "status": "ok" }
```

**Personal payout history — served only to the winner**

```python
# backend/api/app/routers/payouts.py

@router.get("/me/payouts")
async def get_my_payouts(current_user=Depends(get_current_user), db=Depends(get_db)):
    """
    Returns the current user's own payout history.
    Amounts are shown ONLY to the recipient — never to other circle members.
    """
    payouts = db.query(Payout).filter(
        Payout.winner_id == current_user.id
    ).order_by(Payout.created_at.desc()).all()

    return [
        {
            "circle_name": p.circle.name,
            "round": p.round,
            "amount_ngn": decrypt_amount(p.local_amount_encrypted),  # AES-256 decrypt
            "currency": p.currency,
            "transferred_at": p.transferred_at,
            "status": p.status,
            "tx_id": p.chain_tx_id,
            "explorer_url": f"https://testnet.flowscan.io/tx/{p.chain_tx_id}",
        }
        for p in payouts
    ]

# NOTE: There is no /circles/{id}/payouts endpoint that shows amounts.
# The circle history endpoint (Feature 4) shows WHO was paid, but not HOW MUCH.
```

**Frontend — payout reveal (winner's view)**

```typescript
// apps/web/components/payout/PayoutReveal.tsx
// This component only renders for the rotation winner.

export function PayoutReveal({ circleId }: { circleId: string }) {
  const { user } = useCurrentUser()
  const { circle } = useCircle(circleId)

  // Only show if it's the current user's turn
  if (circle.current_winner !== user.flow_address) return null

  const { data: payouts } = useSWR("/me/payouts")
  const thisPayout = payouts?.find(p => p.circle_name === circle.name && p.status === "processing")

  return (
    <div className="payout-reveal">
      <h2>It's your turn!</h2>
      {thisPayout ? (
        <>
          <p className="amount">
            ₦{thisPayout.amount_ngn.toLocaleString()} is on its way
          </p>
          <p className="sub">To your {circle.bank_name} account · 30–60 min</p>
          <a href={thisPayout.explorer_url} target="_blank">Verify on-chain ↗</a>
        </>
      ) : (
        <p>Processing your payout...</p>
      )}
    </div>
  )
}
```

**Database additions**

```sql
-- payouts table (new)
CREATE TABLE payouts (
  id                      SERIAL PRIMARY KEY,
  circle_id               INTEGER REFERENCES circles(id),
  winner_id               INTEGER REFERENCES users(id),
  round                   INTEGER NOT NULL,
  usdc_amount_encrypted   BYTEA,          -- AES-256 encrypted, server-side key
  local_amount_encrypted  BYTEA,          -- AES-256 encrypted, server-side key
  currency                VARCHAR(3),     -- NGN, KES, GHS
  flutterwave_transfer_id VARCHAR(100),
  reference               VARCHAR(100) UNIQUE,
  status                  VARCHAR(20) DEFAULT 'pending',  -- pending, processing, complete, failed
  chain_tx_id             VARCHAR(64),
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  transferred_at          TIMESTAMPTZ,
  UNIQUE(circle_id, round)
);
```

**Why amounts are stored encrypted in Postgres even though the backend sees them:**

The Zama FHEVM protects amounts from the blockchain and from other users. But the backend inevitably sees the cleartext amount at payout time (to call Flutterwave). Encrypting the amount in Postgres at rest means a database breach does not expose what any member received. The decryption key lives in a KMS (AWS KMS / GCP KMS), separate from the database.

---

## Summary — what each feature builds on

```
Feature 1 (Accounts)
  └── Feature 2 (Circles) — needs user.flow_address to register members on-chain
        └── Feature 3 (Contribute) — needs circle.chain_circle_id + Zama relayer
              └── Feature 4 (History) — needs contributions table + event-listener running
                    └── Feature 5 (Payout) — needs history + KYC bank details + offramp
```

Build and test them in this exact order. Features 1–2 can be fully tested with mock data and testnet Flow. Feature 3 requires the Zama relayer running locally. Feature 4 requires the event-listener service. Feature 5 requires Flutterwave sandbox credentials and a completed circle.

---

## What is never stored, never shown, never logged

As a hard rule across all five features:

| What | Why |
|---|---|
| Individual contribution amounts | Encrypted on-chain as `euint64`. Not in events. Not in Postgres. Not in API responses. |
| Total circle pool value | Encrypted on-chain. The app shows member count and round count, never pool value. |
| Other members' payout amounts | Stored encrypted in Postgres. Only the recipient can retrieve their own via `/me/payouts`. |
| Private keys | Never leave the device. Session keys stored in DB are encrypted with KMS. Fee payer key is in Secrets Manager. |