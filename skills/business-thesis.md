# CoopWise — Business Thesis (Locked)

## The one-line thesis

**CoopWise is not a savings app. It's trust infrastructure for groups that do business together, not just save together.**

Money is downstream. Trust is upstream. Contribution tracking is a feature; the real opportunity is the coordination layer that lets groups collectively own, finance, and execute goals — the same distinction as Stripe (payment infrastructure, not "payment buttons") or AWS (cloud infrastructure, not "servers").

**Positioning line:** *CoopWise is the operating system for community-owned finance — helping groups coordinate money, ownership, and goals through programmable cooperative rules.*

## The primitive being digitized

Western finance solves individual accounts, individual credit scores, individual risk. Informal African economies already run on a different, powerful layer: reputation, relationships, collective accountability, social enforcement (church, market association, family, workplace, community history). CoopWise's job is to digitize *that* layer — not to import a Western banking model wholesale.

## Goals as the first-class primitive

The strongest architectural insight: **goal type, not group type, should gate contract terms, visibility, and exit rules.**

```
Create group → Define purpose → Create goal → Apply governance model → Execute financial activity
```

Same group, different goal contracts. Three beneficiary patterns a goal can take:

| Pattern | Description | Governance needs |
|---|---|---|
| **Rotating-but-tracked** | Individual payouts; outcomes roll up into cumulative group impact | Standard rotation rules |
| **Pooled-for-one** | Group funds one member's goal (rent, travel, equipment) | Deadline, withdrawal restrictions, beneficiary privacy |
| **Pooled-for-shared** | Goal is a jointly-owned asset (equipment, business) that stays with the group | Ownership shares, voting, exit/valuation rules |

Membership defaults to transparency: every stakeholder is a group member, so visibility is inherited rather than a separate permission system to design.

## Product principles

1. **Groups are economic organisms, not containers.** They carry history, rules, reputation, assets, and goals.
2. **Every contribution creates reputation**, not just balance — participation history and trust score should accrue alongside the transaction.
3. **Ownership must be explicit**, especially for pooled-for-shared goals: shares, transfer rules, exit rules, valuation. This is what moves CoopWise from savings into collective wealth creation.
4. **The cooperative should survive the app.** The community owns the relationship; the app is infrastructure underneath it, not the thing itself.
5. **"Customizable cooperatives" is the likely differentiator.** Church groups, alumni associations, market traders, employee cooperatives, family groups all need different governance shapes — model a configurable cooperative engine (governance rules, membership rules, financial rules, goal types, decision rules), not a single fixed "Group" object.

## The trap to avoid

African fintech has a well-worn failure mode: becoming a commodity wallet (payments, transfers, savings). CoopWise's differentiation has to stay in **identity, trust, governance, ownership, and collective action** — not payment rails. Every feature or prioritization call should be checked against this.

## The moat: historical data as new financial identity

Banks have transaction and credit history. CoopWise can build something banks don't have: contribution history, trust/reliability history, goal-completion history, community endorsements, leadership roles held. This becomes a portable trust record — a credit-score equivalent for people who've never had one, built from verified cooperative behavior rather than property or paperwork.

## AI's real role: cooperative intelligence, not a chatbot

A bolt-on chatbot is shallow. The deeper opportunity is AI as the intelligence layer sitting over group behavior:

- **Risk detection** — flagging contribution patterns that historically precede exits
- **Governance assistant** — surfacing what similar groups needed (e.g. exit agreements before a large shared-asset purchase)
- **Goal planning** — modeling whether a group's contribution rate can fund a stated goal in a given timeframe
- **Conflict resolution support** — reasoning over a group's own governance rules when disputes arise

This lines up with the roadmap's AI-driven governance and dispute-resolution phases (see `roadmap-monetization.md`).

## B2B / infrastructure expansion

Beyond consumer cooperatives, the same rails could power employee cooperatives, alumni associations, unions, professional groups, and franchise networks — CoopWise as infrastructure a company or institution runs on top of, not just a consumer app.

## Economic insights

### What problem are they solving?

Most African businesses are individually owned and built for immediate, short-term survival — not built to last. That ownership structure is the root cause of everything downstream: undercapitalized, under-managed, short-lived, structurally unable to scale across decades. CoopWise's real problem statement isn't "people need a place to save." It's: the individual is the wrong unit of economic building in this context, and there's no infrastructure that lets communities — which already have the trust and continuity individuals lack — act as the unit of economic building instead.

### Why will they win?

Not by inventing something new, but by digitizing something already proven at civilizational scale: community-based cooperation (ajo, esusu, chamas, church and market associations) has worked for centuries because it solves the exact problem individual ownership can't — pooled capital, shared accountability, continuity beyond any one person's lifespan or attention span. Most competitors treat contributions as the product — better rotating-savings apps. CoopWise builds the layer underneath: infrastructure that lets a community build wealth, own assets, and run financial/economic ventures together. That's a category difference, not a feature difference, which is why it's defensible — a competitor can copy a savings feature in a sprint, but not an infrastructure position or the trust-record data a community accumulates over years of use.

### How do they make money?

See `roadmap-monetization.md` for the locked model. In short: CoopWise doesn't monetize the transaction — it monetizes the growth of the economic entities built on top of it. Communities are treated less like accounts and more like companies incubated on the platform, so their growth compounds back to CoopWise both directly and through network effects between cooperatives.

### What trends affect them?

The tailwind is structural, not seasonal: community is not a trend that decays — collective coordination is a permanent human primitive, not a fintech fad. The compounding trend is what happens after onboarding: as more communities build on the platform, they extend it, inventing new ways to build lasting wealth together that CoopWise didn't originally design for. That's flywheel risk-and-reward in one — the risk is rigid rails can't keep up with what communities invent; the reward is that a flexible enough platform (customizable cooperatives, goal-type-gated governance) turns each new invented use case into a template other communities can adopt.
