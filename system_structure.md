```
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
├── blockchain/
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
