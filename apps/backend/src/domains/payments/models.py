# User initiates payment
#         ↓
# domains/payments/service.py
#   - creates WalletLedger(status=initiated)
#   - dispatches to the right gateway handler
#         ↓
#     ┌───────────────────────────────┐
#     │ web2 rail                     │ web3 rail
#     │ infra/payments/               │ infra/blockchain/
#     │   paystack_service.py         │   contract_service.py
#     │   flutterwave_service.py      │   chain.py
#     │   cashramp_service.py         │
#     └───────────────────────────────┘
#         ↓                                   ↓
#   webhook callback               on-chain event / confirmation
#         ↓                                   ↓
# domains/payments/service.py
#   - updates WalletLedger(status=settled, provider_reference=... OR tx_hash=...)
#   - updates Wallet balance
#   - emits notification event