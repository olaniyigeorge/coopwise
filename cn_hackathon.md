# CoopWise — 5 Phase Build Plan (Camp Network Sprint)

---

# **PHASE 1 — Identity ↔ Wallet Mapping (ONLY Identity + Wallet)**
**Timeline:** Day 1–2  
This phase is strictly about mapping a human user identity to one or more crypto wallets.  
NO blockchain writes. NO contribution logic. NO token logic.

## **Modules**
### **1. Core Identity (Web2 Auth)**
- User registration (`/auth/register`)
- User login (`/auth/login`)
- Basic session/JWT logic

### **2. Wallet Linking (Attach Wallet to Identity)**
- Generate nonce for signature
- Verify wallet signature (ECDSA)
- Add wallet to existing user account  
- Mark wallet as verified  
- Ability to set a **primary wallet**  
- Remove or change wallet

### **3. Wallet Login (Web3 Auth)**
- User signs nonce  
- Backend verifies signature  
- If wallet belongs to an existing user → log them in  
- If wallet does not exist → create user + attach wallet

### **4. Identity–Wallet Sync Rules**
- One user → many wallets  
- Always one **primary wallet**  
- If wallet is unlinked → user must reauthenticate  
- If wallet signature fails → login denied

#### Deliverables: Users should be able to signin and connect their wallet(s)

---

# **PHASE 2 — Contribution & Membership Data Preparation (Off-Chain Models + Token Blueprints)**
**Timeline:** Day 3–4  
This phase prepares all data structures that will later be written on-chain.  
We are NOT writing to the contract yet—just preparing the data, tokens, and events.

## **Modules**
### **1. Contribution Data Model**
- Contribution DB model  
- Fields:
  - `amount`
  - `userId`
  - `coopId`
  - `timestamp`
  - `status`
  - `onChainStatus`
- Endpoints to create and manage contributions

### **2. Membership Data Model**
- Membership DB model  
- Fields: userId, coopId, role, joinedAt, status
- Tracks membership tokens (SBT)

### **3. Membership Token (SBT) Preparation**
- Generate **SBT token IDs** for each membership  
- Store token metadata (off-chain for now)  
- Prepare payload for on-chain write:
  ```
  { userId, coopId, membershipId, sbtTokenId }
  ```

### **4. Contribution Token (IPT) Preparation**
- Generate **IP Tokens (IPT)** per contribution  
- Create metadata JSON  
- Prepare on-chain write payload:
  ```
  { userId, coopId, amount, contributionId, iptId }
  ```

### **5. Pending On-Chain Writes Queue**
- A table for events that will be written in Phase 3  
- Types:
  - `MembershipCreated`
  - `ContributionCreated`
  - `SBTIssued`
  - `IPTIssued`
- Store event payloads as JSON

---

# **PHASE 3 — Smart Contract (1 Contract, Simple, 1–2 Days)**
**Timeline:** Day 5–6  
This phase is light. We build **one** smart contract to handle:

### **Features of the Contract**
- Register memberships (write SBT token ID)  
- Register contributions (write IPT token ID)  
- Emit events:
  - `MembershipCreated`
  - `ContributionRecorded`
  - `SBTIssued`
  - `IPTIssued`

### **Modules**
- Contract design (simple structs + events)  
- Implementation (Foundry/Hardhat)  
- Deployment on Camp Network  
- Backend integration:
  - connect wallet (backend signer)
  - load ABI + contract address
  - write membership
  - write contribution
  - write SBT/IPT tokens

**This entire phase must be ≤ 2 days.**

---

# **PHASE 4 — Verification & Testing (Chain Sync + QA)**
**Timeline:** Day 7  
This phase ensures everything works together end-to-end.

## **Modules**
### **1. Chain Sync Verification**
- Read events from smart contract  
- Compare to DB entries  
- Validate:
  - membership matches  
  - contributions match  
  - tokens match (SBT/IPT)

### **2. End-to-End Flow Testing**
- Register user → link wallet  
- Join coop → membership created → SBT prepared → SBT written  
- Make contribution → IPT prepared → IPT written  
- Validate chain + DB consistency

### **3. Fix Errors & Patch**
- Retry failed writes  
- Fix broken signatures  
- Fix wallet mapping issues  
- Add logs + monitoring

---

# **PHASE 5 — Submission (Final Packaging & Delivery)**
**Timeline:** Day 8  

## **Modules**
### **1. Final Documentation**
- README for backend  
- Contract documentation  
- Identity–wallet flow explanation  
- Contribution + membership token explanation  

### **2. Final Demo/Test Video**
- Display wallet linking  
- Membership creation  
- Contribution creation  
- On-chain verification  
- Explorer links

### **3. Submission Packaging**
- Deploy backend  
- Deploy frontend  
- Deploy contract  
- Publish demo links  
- Submit final zip/URL

---

# **8-Day Summary**
| Phase | Focus | Days |
|-------|--------|-------|
| **1** | Identity ↔ Wallet Mapping | 1–2 |
| **2** | Contribution + Membership Data (Off-chain + Token Prep) | 3–4 |
| **3** | Smart Contract (simple, 1 contract) | 5–6 |
| **4** | Verification, Sync, QA | 7 |
| **5** | Submission | 8 |

