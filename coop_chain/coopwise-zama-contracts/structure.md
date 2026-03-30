coopwise-zama-contracts/
├── contracts/
│   ├── CoopGroupFactory.sol          # Deploys new savings groups
│   ├── CoopGroup.sol                 # Main group logic & state
│   ├── USDTVault.sol                 # USDT custody & escrow
│   ├── RotationLogic.sol             # Deterministic payout sequencing
│   ├── PrivacyUtils.sol              # Zama encryption helpers
│   └── interfaces/
│       ├── ICoopGroup.sol
│       ├── IUSDTVault.sol
│       └── IERC20USDT.sol
├── lib/
│   ├── fhevm/
│   │   └── lib/
│   │       └── TFHE.sol              # Zama's homomorphic encryption lib
│   └── openzeppelin-contracts/
│       ├── access/Ownable.sol
│       ├── security/ReentrancyGuard.sol
│       └── token/ERC20/IERC20.sol
├── test/
│   ├── CoopGroupFactory.t.sol
│   ├── CoopGroup.t.sol
│   ├── USDTVault.t.sol
│   └── RotationLogic.t.sol
├── scripts/
│   ├── deploy_factory.ts
│   ├── create_group.ts
│   └── setup_zama.ts
└── foundry.toml