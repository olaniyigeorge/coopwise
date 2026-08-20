---
name: coopwise
description: Use this skill for ANY work on CoopWise — the African cooperative savings/trust-infrastructure platform (FastAPI + Next.js + PostgreSQL + Celery + Crossmint/Flow wallet). Covers technical work (backend domain design, API routes, DB models, Celery jobs, KYC flows, wallet/blockchain integration, frontend components, design system) AND strategy/positioning work (pitch decks, investor materials, landing copy, monetization framing, roadmap decisions, feature prioritization). Trigger whenever the user mentions CoopWise, cooperative savings, ajo/esusu/tontine/chama, rotating savings groups, group goals, or portable trust records for underbanked users — even without saying "CoopWise" if clearly working in that codebase or product. Consult before writing code, copy, or strategic recommendations so output stays consistent with the locked thesis, architecture, and conventions.
---

# CoopWise

CoopWise is Olaniyi's cooperative savings platform for African markets. Read this skill before doing **any** work on it — code, copy, pitches, or roadmap calls — so output stays anchored to the locked thesis and existing architecture instead of drifting into generic "savings app" territory.

## The one-line thesis (never lose this)

**CoopWise is not a savings app. It's trust infrastructure for groups that do business together, not just save together.**

Money is downstream. Trust is upstream. Don't build or pitch CoopWise as "Venmo for ajo groups" — it's the coordination layer that lets groups collectively own, finance, and execute goals, the same category move Stripe made on payments or AWS made on servers.

**Positioning line:** *CoopWise is the operating system for community-owned finance — helping groups coordinate money, ownership, and goals through programmable cooperative rules.*

**The trap to actively avoid:** African fintech's default failure mode is becoming a commodity wallet (payments, transfers, savings). Every feature, pitch, or prioritization call should be checked against: does this deepen identity/trust/governance/ownership/collective-action, or does it just make CoopWise a nicer wallet? If it's the latter, flag it.

## When to go deeper

This SKILL.md carries the thesis you should hold in mind for every task. For the full depth, pull the relevant reference file:

- **`references/business-thesis.md`** — full positioning, the primitive being digitized, goals-as-first-class-primitive model, product principles, the moat, AI's real role, B2B expansion, economic insights (why they win / how they make money / what trends affect them). Read this before any strategy, pitch, investor, or landing-page-copy task.
- **`references/roadmap-monetization.md`** — phased roadmap (Web2 MVP → pluggable Web3 → decentralized core) and the locked monetization model. Read this before any pricing, fee-structure, or "what should we build next" conversation.
- **`references/technical-architecture.md`** — backend domain structure, frontend structure, design system tokens, auth/wallet architecture, and Olaniyi's standing engineering conventions. Read this before writing or reviewing any code in the repo.

## Quick-reference: the core model

Goal type — not group type — gates contract terms, visibility, and exit rules:

```
Create group → Define purpose → Create goal → Apply governance model → Execute financial activity
```

| Pattern | Description | Governance needs |
|---|---|---|
| Rotating-but-tracked | Individual payouts; outcomes roll up into cumulative group impact | Standard rotation rules |
| Pooled-for-one | Group funds one member's goal (rent, travel, equipment) | Deadline, withdrawal restrictions, beneficiary privacy |
| Pooled-for-shared | Goal is a jointly-owned asset that stays with the group | Ownership shares, voting, exit/valuation rules |

Membership defaults to transparency — every stakeholder is a group member, so visibility is inherited rather than a separate permission system.

## Non-negotiable product principles

1. Groups are economic organisms, not containers — they carry history, rules, reputation, assets, and goals.
2. Every contribution creates reputation, not just balance.
3. Ownership must be explicit for pooled-for-shared goals: shares, transfer rules, exit rules, valuation.
4. The cooperative should survive the app — community owns the relationship, the app is infrastructure underneath it.
5. "Customizable cooperatives" is the likely differentiator — model a configurable cooperative engine (governance, membership, financial, goal-type, decision rules), not a single fixed "Group" object.

## How to use this skill in practice

- **Writing code or reviewing a PR** → check `technical-architecture.md` for the domain it touches, confirm it follows the DDD/ports-and-adapters pattern already established, and confirm any new goal/group logic respects the beneficiary-pattern model above.
- **Naming or scoping a new feature** → run it through the trap-to-avoid check and the moat (portable trust record) before agreeing it's worth building.
- **Writing pitch/landing/investor copy** → lead with the positioning line and the primitive-being-digitized framing (digitizing ajo/esusu/chama trust, not importing Western banking). Pull specific angles from `business-thesis.md`.
- **Talking pricing or monetization** → use the locked model in `roadmap-monetization.md`, don't reintroduce the stale flat-fee-only draft as if it were current.
- **Unsure which phase something belongs in** → check the roadmap in `roadmap-monetization.md`; goal/beneficiary-pattern architecture sits inside Phase 0–1, before governance/dispute-resolution (Phases 1 and 4) are built on top.

If new information surfaces during a session that changes the thesis, architecture, or monetization stance (not just a one-off implementation detail), say so explicitly and ask whether the reference files should be updated — don't let the skill silently go stale.