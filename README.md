# 🟢 CoopWise: Reimagining African Cooperatives with AI & Stablecoin Innovation

**CoopWise** is an *AI* and *blockchain-powered* cooperative savings platform designed for Africa’s financial realities. It digitizes traditional savings models like Ajo, Esusu, and Chamas, offering programmable stablecoin escrows, transparent group governance, and AI-driven insights. With smart contract automation and fiat on/off-ramps via Flow, CoopWise empowers communities with modern, decentralized financial infrastructure.

---

## 🧠 Key Features

- 🔐 **Authentication & Identity Verification**
- 🤖 **AI-Powered Cooperative Insights & Financial Nudges**
- 🌍 **Group Creation, Joining, and Discovery**
- 💰 **Stablecoin Wallets & Seamless Contributions**
- 📈 **Smart Dashboards with Contribution Tracking**
- 📬 **Real-time Notifications & Invitations**
- 🛠️ **Admin and Support Channels for Dispute Resolution**
- 💬 **AI Interview Chat (Beta)**

---

## 📁 Project Structure

```txt
coopwise/                          # monorepo root
├── apps/
│   ├── web/                        # Next.js frontend (existing)
│   │   ├── app/
│   │   │   ├── (auth)/             # existing
│   │   │   └── (dashboard)/
│   │   │       └── circle/[id]/    # existing
│   │   ├── components/
│   │   │   ├── circle/             # existing
│   │   │   ├── contribution/       # new - encrypt + submit UI
│   │   │   └── payout/             # new - ACL-gated reveal UI
│   │   ├── lib/
│   │   │   ├── flow/               # Flow FCL client config
│   │   │   ├── fhevm/              # Zama relayer SDK client
│   │   │   └── offramp/            # Flutterwave/Paystack calls
│   │   └── hooks/                  # new - useCircle, useContribution, usePayout
│   └── mobile/                     # new - React Native (future)
├── backend/
│   ├── api/                        # FastAPI (existing)
│   │   ├── app/
│   │   │   ├── routers/            # circles, members, payouts, webhooks
│   │   │   ├── models/             # SQLAlchemy models
│   │   │   └── services/
│   │   │       ├── circle_service.py      # existing
│   │   │       ├── flow_service.py        # Flow Cadence tx builder
│   │   │       ├── fhevm_service.py       # Zama relayer calls
│   │   │       ├── offramp_service.py     # Flutterwave/Paystack SDK
│   │   │       └── kyc_service.py         # existing
│   │   ├── workers/                # new - Celery tasks
│   │   │   ├── flow_event_worker.py       # Flow gRPC event listener
│   │   │   └── payout_worker.py           # UnwrapFinalized → Flutterwave
│   │   └── webhooks/               # new - Forte scheduled tx callbacks
├── coopchain/
│   ├── cadence/                    # Flow smart contracts
│   │   ├── contracts/
│   │   │   ├── CoopWise.cdc        # circle registry, rotation, schedule
│   │   │   └── CoopWiseAdmin.cdc   # fee payer, admin ops
│   │   ├── transactions/           # user action transactions
│   │   │   ├── CreateCircle.cdc
│   │   │   ├── JoinCircle.cdc
│   │   │   ├── Contribute.cdc
│   │   │   └── TriggerRotation.cdc
│   │   ├── scripts/                # read-only queries
│   │   └── tests/                  # Cadence test framework
│   └── evm/                        # Zama FHEVM contracts (Solidity)
│       ├── contracts/
│       │   ├── CoopWiseVault.sol   # euint64 balances, FHE operations
│       │   ├── ConfidentialUSDC.sol # ERC-7984 wrapper
│       │   └── interfaces/
│       │       └── ICoopWiseVault.sol
│       ├── deploy/                 # Hardhat deploy scripts
│       ├── test/                   # Hardhat + Zama tests
│       └── hardhat.config.ts       # Flow EVM network config
├── services/
│   ├── relayer/                    # Zama relayer sidecar (Node.js)
│   │   └── src/
│   │       ├── encrypt.ts          # FHE encryption wrapper
│   │       ├── decrypt.ts          # decryption requests
│   │       └── server.ts           # HTTP server
│   └── event-listener/             # Flow gRPC → Postgres
├── packages/                       # shared across apps
│   ├── types/                      # TypeScript shared types
│   ├── constants/                  # contract addresses, chain IDs
│   └── config/                     # ESLint, TSConfig, Prettier
├── infra/
│   ├── docker-compose.yml
│   └── .github/workflows/          # test + deploy on push
└── docs/                           # architecture docs & ADRs

```








## 🔧 Tech Stack

| Layer       | Technology                                                  |
|-------------|-------------------------------------------------------------|
| Frontend    | Next.js 14, Shadcn, React Server Components            |
| Backend     | FastAPI, PostgreSQL, SQLAlchemy, Redis, Celery              |
| AI Stack    | Google LLM Flash Pro, LLM Prompts, Deepgram STT             |
| Auth        | JWT, Email as Username, Secure Role-based Access           |
| Payments    | CashRamp API, Stablecoin Wallets                            |
| Infra       | Docker, Render/Vercel, S3 for Storage                        |

---

## Getting Started

### 1. Clone Repo

```bash
git clone https://github.com/Timeless-Dave/coopwise.git
cd coopwise
```
```bash
cd backend
cp .env.sample .env
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```


### 2. Backend Setup
```bash
cd backend
cp .env.sample .env
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
yarn
yarn dev
```

### 4. Docker (Optional)
```bash
docker-compose up --build
```


## 🤖 AI Insights
AI Insights are generated based on group contribution patterns, saving behavior, and cooperative health. This includes:

- Intelligent savings reminders
- Group performance summaries
- Personalized financial nudges
- Onboarding insights for new users
- Backed by llm_client.py and insights_service.py, this engine can be extended with templates and session context.

#### 📦 API Overview
Base URL: /api/v1

### Route	Description
- /auth	Login, Register, Verify
- /users	Profile, KYC, Me
- / groups	Create, Join, Discover
- /memberships	Invite, Accept, Roles
- /contributions	Make, View, Summary
- /wallet	Fund wallet, View balance
- /dashboard	AI insights, analytics
- /notifications	Realtime alerts
- /ai-chat	Chat interface (experimental)

### 🧪 Testing
Backend tests (use pytest):
```bash
pytest
```
Frontend tests (if enabled):
```bash
yarn test
```
### 💡 Contribution
We welcome contributors building towards better financial systems for Africa.
 
### Guidelines:
Use feature branches
- Follow PEP8 for Python and ESM for Next.js
- Document new routes or services in todo.md

### 🛡️ Security & Trust
We leverage:
- CashRamp(Accurue) GraphQL for payment settlement and stablecoin integration
- Audit logging for all wallet and contribution events
- JWT encryption and secure session handling
- Clear roles & permission enforcement

#### 📄 License
MIT License. See LICENSE.md file.

#### 🙏 Acknowledgements
NexaScale & Accurue Hackathon 2025
CashRamp Team for open APIs
OpenAI for GPT-4o API access

*Let’s build Africa’s future of savings. ✨*


