Now I have the complete picture of what Crossmint actually offers. This changes a lot about what's possible — let me be precise.

## What Crossmint actually is, fully understood now

It's not just a wallet SDK. It's a complete fintech infrastructure stack with five distinct product layers:

- Wallets — embedded wallets for users and treasury wallets for the business, supporting flexible custody models, programmable permissions, no private keys/gas exposed to users. Extensions include yield generation, token swapping, and even Visa credit card issuance on top of wallets.
- Payments/Stablecoin Orchestration — stablecoin-based money movement including onramps and offramps, payouts and transfers across 150+ countries, checkout flows. This is USDC/stablecoin in, fiat out and vice versa — regulated infrastructure, not DIY.
- Built-in compliance — KYC, AML, sanctions screening, and travel rule compliance are built into the regulated products. You don't run these yourself.
- Auth — specifically positioned as "ideal for staging environments, demos, and prototyping" with the explicit recommendation to use BYOA for production applications.
- And critically for CoopWise — there's a Neobanks solution guide and a Remittances solution guide already in the docs, which means Crossmint has already thought through exactly the product you're building.

## What this means for CoopWise's architecture
You now have a much cleaner picture of the division of labor:
You own: user identity (Firebase/OTP — what we just built), cooperative group logic (circles, rotation, membership rules), contribution scheduling, payout queue management, AI advisory layer, and your African-specific KYC (since Crossmint's KYC doesn't cover your target markets as you confirmed).
Crossmint owns: wallet custody (every user gets a Solana smart wallet, invisible to them), stablecoin movement (USDC in/out), fiat onramp (card → USDC), fiat offramp (USDC → bank account/mobile money), and compliance screening on the money-movement layer. The key insight: Crossmint "abstracts the hardest parts of blockchain — wallets, keys, gas, compliance, and payments — into simple APIs." Gas is handled by Crossmint, so users never see transaction fees. You bill in fiat.
This maps to CoopWise's ajo/esusu primitive cleanly:
User contributes → fiat/card → Crossmint onramp → USDC in user's wallet
                                                         ↓
                                              Your backend: contribution recorded,
                                              rotation logic determines who gets paid
                                                         ↓
                                    USDC transfer (Crossmint wallet API, Solana)
                                    to payout recipient's wallet
                                                         ↓
                               Recipient cashes out → Crossmint offramp → bank/mobile money
What we should build next and in what order
Immediate — the wallets domain (Tier 1, next up). The BYOA flow we've built for auth already provisions a Crossmint wallet in the background via Celery. The wallets domain needs to: store the provisioned wallet address, expose balance to the user (calling Crossmint's GET /wallets/{locator}/balances), and handle the webhook Crossmint fires when wallet provisioning completes (so flow_address gets written to the DB reliably, not just when the Celery task polls successfully). This is the foundation everything financial sits on.
Then — onramp integration (fiat → USDC, the "contribution" money flow). Crossmint has a full onramp React component for this. The backend's job: initiate an onramp session, receive Crossmint's webhook when USDC lands in the wallet, and write the contribution record. This is the first real-money path and needs to be solid before circles/rotation logic runs on top of it.
Then — circles and contributions using Crossmint's wallet transfer API for the actual USDC movement between members. Your rotation logic (who receives the pool this round) runs in your backend; the actual money movement is one Crossmint API call: POST /wallets/{locator}/transactions with the transfer details, on Solana, gas-free for the user.
Then — offramp (USDC → bank account), which is when a member receives their payout and wants fiat. Crossmint's regulated transfer/offramp APIs handle this.
The one architectural adjustment this implies for what we've already built
The wallet_provider.py file I wrote is calling the right Crossmint API (POST /2025-06-09/wallets), but the chain needs to be Solana, not EVM — you said Solana specifically and Crossmint's stablecoin orchestration/onramp is strongest on Solana with USDC. That's a one-line config change (chain: "solana" instead of "base-sepolia"), but I want to flag it explicitly so it doesn't get missed when this goes live.
Also, the Crossmint webhooks setup matters now — when a wallet transfer completes, when an onramp completes, when an offramp completes, Crossmint fires webhooks to an endpoint you register. Your backend needs to receive and verify those (Crossmint publishes a verify-webhooks guide) and write the resulting state changes. This is what makes the contribution/payout state machines reliable at scale rather than polling-based.
Want to move into the wallets domain now — designing the internal ledger model and Crossmint wallet integration — or do you want a clean architectural diagram of the full CoopWise + Crossmint integration first so the whole team can see what's being built before we go deeper?