# CoopWise — Roadmap & Monetization (Locked)

## Build Sequencing

The phased build is the right sequencing for *shipping*, even though the goal/beneficiary-pattern model (see `business-thesis.md`) is architecturally the more important insight:

**Web2 MVP → pluggable Web3 layer → decentralized core**

The goal/beneficiary-pattern model should be read as an architectural refinement that sits **inside Phase 0–1 (Group Savings)** — before governance and dispute resolution (Phases 1 and 4) get built on top of it, since goal type is what determines which governance and dispute rules apply in the first place.

Rough phase shape (confirm current phase with Olaniyi at the start of any roadmap conversation — this list is directional, not a committed date-bound plan):

- **Phase 0–1 — Group Savings (current build focus):** core contribution tracking, group/cooperative creation, KYC, wallet infra, goal creation with beneficiary-pattern gating.
- **Phase 1 continued / Phase 2 — Governance layer:** dispute resolution primitives, AI governance assistant, ownership/exit rules for pooled-for-shared goals.
- **Phase 3 — Trust standing as collateral:** the mechanic that lets accumulated trust records unlock financing/origination — this is the bridge from "savings infrastructure" to the platform-equity monetization model below.
- **Phase 4 — AI-driven governance and dispute resolution at scale**, decentralized core.

## Monetization — Locked Model

This has two layers, both current and intentional (not one superseding the other):

### 1. Baseline transaction revenue (the floor)
- **0.5% fee per transaction** — this replaces the earlier stale draft numbers ($0.05 flat per transaction, $1.00 flat per payout). Use 0.5% as the current baseline figure in any pricing conversation, spreadsheet, or pitch material unless Olaniyi says otherwise.
- Dispute penalties split between accuser and CoopWise (carried over from the original draft, not yet revisited).
- Optional subscriptions (analytics, AI concierge, auto-conversion) remain a plausible secondary layer but are not the strategic focus.

### 2. Platform-equity / growth-share model (the strategic direction)
This is the **current direction** and the lens that should drive product and partnership decisions, not just the fee schedule:

- CoopWise doesn't monetize the transaction — it monetizes the growth of the economic entities (cooperatives) built on top of it.
- Communities are treated less like accounts and more like companies incubated on the platform: growth compounds back to CoopWise, both directly and via network effects between cooperatives.
- The mechanism that makes this real is **Phase 3's trust-standing-as-collateral**: that's how CoopWise actually gets a stake in a community's growth rather than just a fee on its activity (origination or spread revenue on financing unlocked by group trust standing).
- When evaluating a new feature or partnership, ask: does this deepen CoopWise's stake in cooperative growth (platform-equity direction), or is it just more transaction volume (baseline-fee direction)? Both are fine to build, but don't let the baseline-fee lens quietly become the only lens — it's the floor, not the ambition.

### How to talk about this externally
- To investors: lead with the platform-equity/growth-share framing — it's the differentiated, defensible story.
- To users/cooperatives: the 0.5% transaction fee is the concrete, easy-to-explain number; don't lead with "we take equity in your growth" language toward end users, that's a backend monetization lens, not a user-facing pitch.
- Treat this file as the source of truth if a stale monetization figure surfaces elsewhere in old docs (e.g. `docs/coopwise.md` in the repo still has the old $0.05/$1.00 draft — that's superseded).