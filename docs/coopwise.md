# 🤖 CoopWise AI Agents — Design & Implementation Documentation

This document defines the **design, responsibilities, architecture, and implementation guidance** for the three core AI agents powering CoopWise. It is intended to be used directly by **engineers, AI architects, and contributors** during implementation using **LangChain and LangGraph**.

CoopWise is a blockchain-powered cooperative savings platform that modernises Africa's rotating savings systems — ajo, esusu, chama — without requiring users to understand or interact with cryptocurrency. These agents are the intelligence layer that transforms CoopWise from a digital savings app into an AI-native financial coordination platform. They operate silently in the background: preventing circle failure, matching members to compatible groups, and keeping treasuries healthy — so that communities built on centuries of mutual trust can now also be backed by cryptographic guarantees and adaptive machine intelligence.

---

## 🧭 Agent Overview

| Agent | Purpose | Primary Business Metric |
|-------|---------|-------------------------|
| Cooperative Health & Retention Agent | Prevent group failure and improve contributions | Retention, GMV |
| Cooperative Formation & Matching Agent | Optimise onboarding and group success | Activation, Growth |
| Treasury Optimisation & Stablecoin Flow Agent | Optimise fund usage and trust | Revenue, Capital Efficiency |

---

# 1️⃣ Cooperative Health & Retention Agent

## 🎯 Objective

Ensure the long-term sustainability of cooperatives by detecting early warning signals of failure and triggering proactive interventions — before a single member misses a cycle.

Rotating savings circles run on trust and consistency. When one member defaults, the ripple effect can collapse an entire group and erode the trust that took months to build. This agent exists to prevent that. It watches contribution patterns continuously, scores group health against a learned baseline, and escalates intelligently — nudging members, alerting admins, and recommending rule adjustments before a situation becomes critical.

## 🧠 Agent Responsibilities

- Monitor cooperative contribution behaviour across all active circles
- Detect risk patterns and declining engagement at member and group level
- Classify cooperative health status in real time
- Recommend or trigger corrective actions with explainable rationale
- Generate transparency summaries for admins and members
- Learn from historical group outcomes to improve future interventions

## 📥 Inputs

| Input | Source | Frequency |
|-------|--------|-----------|
| Contribution history | `/contributions` API | Per event |
| Membership activity | `/memberships` API | Daily |
| Group rules and schedules | `/groups` API | On change |
| Historical group outcomes | Analytics store | Weekly |
| Notification delivery status | `/notifications` API | Per event |
| Member communication patterns | `/dashboard` | Daily |

## 📤 Outputs

| Output | Type | Recipient |
|--------|------|-----------|
| Health score (0–100) | Numeric | Dashboard |
| Risk classification | `Healthy \| At Risk \| Critical` | Dashboard + Admin |
| Personalised member nudges | Push notification / SMS | Member |
| Admin alerts and summaries | Email / in-app | Group organiser |
| Rule adjustment recommendations | Structured suggestion | Admin |
| Weekly transparency digest | Markdown report | All members |

## 🔗 System Integrations

- `/contributions` — event stream for each cycle's contribution events
- `/memberships` — member status, join date, engagement history
- `/groups` — circle rules, rotation order, payout schedule
- `/notifications` — delivery receipts, open rates, bounce status
- `/dashboard` — admin read surface for health scores and alerts

## 🧩 Agent Architecture (LangGraph)

```
[Data Ingestion Node]
        ↓
[Health Scoring Node]          ← Weighted model: recency, frequency, consistency
        ↓
[Risk Classification Node]     ← Healthy | At Risk | Critical
        ↓
[Decision Policy Node]         ← Rule engine + LLM rationale generation
        ↓
[Action Execution Node]        ← Nudge / Alert / Escalate / Recommend
```

### Node Descriptions

**Data Ingestion Node**
Pulls the latest contribution events, membership changes, and notification receipts for all active circles. Normalises data into a unified `CircleHealthSnapshot` schema. Handles missing data gracefully — a missing contribution is itself a signal.

**Health Scoring Node**
Computes a 0–100 health score per circle using a weighted formula:

```python
health_score = (
  0.40 * contribution_consistency_score  # % of members contributing on time
  + 0.25 * engagement_trend_score        # trajectory over last 4 cycles
  + 0.20 * notification_response_rate    # members opening and acting on nudges
  + 0.15 * historical_completion_rate    # circles of similar profile that succeeded
)
```

**Risk Classification Node**
Maps health score to a risk tier with configurable thresholds:

```python
if score >= 75:   classification = "Healthy"
elif score >= 50: classification = "At Risk"
else:             classification = "Critical"
```

**Decision Policy Node**
Applies a deterministic rule engine first (hard guardrails), then invokes the LLM to generate a plain-language rationale and personalised nudge copy. The LLM never overrides the rule engine — it augments outputs with explainability.

**Action Execution Node**
Dispatches the decided action: push notification to a lagging member, admin alert email, in-app recommendation card, or an escalation to a human reviewer. All actions are logged to the audit store before execution.

## 🛠️ Agent Tools

```python
get_circle_contribution_snapshot(circle_id: str) -> CircleHealthSnapshot
compute_health_score(snapshot: CircleHealthSnapshot) -> float
classify_risk(score: float) -> Literal["Healthy", "At Risk", "Critical"]
generate_nudge_copy(member_id: str, context: dict) -> str        # LLM call
send_member_notification(member_id: str, message: str) -> bool
send_admin_alert(circle_id: str, summary: str, severity: str) -> bool
log_health_event(circle_id: str, event: HealthEvent) -> None
recommend_rule_adjustment(circle_id: str, issue: str) -> Recommendation
```

## 🧠 State & Memory

```python
class HealthAgentState(TypedDict):
    circle_id: str
    snapshot: CircleHealthSnapshot
    health_score: float
    risk_class: str
    recommended_actions: list[Action]
    executed_actions: list[Action]
    rationale: str
    timestamp: datetime
```

State is persisted per circle in **PostgreSQL** with a rolling 90-day window. Redis is used for hot state (circles currently in an active intervention cycle). Agent memory includes:

- Per-circle baseline health score (updated weekly)
- Historical intervention outcomes (did the nudge work?)
- Member communication preference profiles (SMS vs push vs in-app)

## ⚠️ Constraints

- **Human-in-the-loop required** for any action above "nudge" severity — admin must acknowledge before escalation fires
- **No autonomous rule changes** — recommendations are surfaced; admins apply them
- **Rate limiting on nudges** — maximum 2 nudge messages per member per cycle to prevent fatigue
- **Privacy boundary** — agent scores groups, not individual contribution amounts (FHE-encrypted values are never decrypted by the agent)
- **Bias audit** — nudge copy is reviewed against a fairness rubric before deployment to production

##  Success Metrics

| Metric | Target |
|--------|--------|
| Circle completion rate | > 85% of circles complete all rotations |
| Early intervention rate | > 70% of At Risk circles recover to Healthy within 2 cycles |
| Nudge open rate | > 40% |
| False positive rate (Critical) | < 10% |
| Admin alert acknowledgement time | < 4 hours |

## 🔄 Intervention Playbook

| Risk Class | Trigger | Action |
|------------|---------|--------|
| Healthy | Score drops > 10 pts in one cycle | Proactive check-in nudge to all members |
| At Risk | Score 50–74 for 2+ consecutive cycles | Personalised nudge to lagging members + admin summary |
| Critical | Score < 50 | Admin alert + escalation flag + rule adjustment recommendation |
| Critical (unresolved) | Score < 50 for 3+ cycles | Human reviewer escalation + optional circle pause recommendation |

---

# 2️⃣ Cooperative Formation & Matching Agent

## 🎯 Objective

Increase successful cooperative formation by intelligently matching users into compatible groups — or autonomously creating new ones when no suitable match exists. Reduce time-to-first-contribution and eliminate the friction that causes onboarding abandonment.

The formation moment is the most critical in a member's lifecycle. A good match — compatible contribution amounts, aligned cycle lengths, similar financial goals — dramatically increases the probability that a circle completes all its rotations. A bad match causes early dropout and erodes trust. This agent replaces ad-hoc group formation with a structured, interview-driven, bias-aware matching process.

## 🧠 Agent Responsibilities

- Interview new users via conversational AI to extract financial intent and preferences
- Build structured, vectorised financial profiles from natural language responses
- Search and rank existing cooperatives by compatibility score
- Negotiate group fit when partial matches exist
- Autonomously create new cooperative configurations when no suitable match is found
- Generate onboarding summaries that set member expectations clearly

## 📥 Inputs

| Input | Source |
|-------|--------|
| AI interview chat responses | `/ai-chat` session |
| User profile and metadata | `/users` API |
| Existing cooperative data | `/groups` API |
| Group rules and member preferences | `/groups` API |
| Past matching outcomes | Analytics store |
| Vectorised group embeddings | Vector database |

## 📤 Outputs

| Output | Type |
|--------|------|
| Ranked cooperative matches | List with fit scores |
| Join recommendation | Structured suggestion + rationale |
| New group configuration | Auto-generated circle spec |
| Onboarding summary | Plain-language member brief |
| Financial profile | Structured JSON |

## 🔗 System Integrations

- `/ai-chat` — conversational interface for the interview session
- `/users` — user metadata, KYC status, activity history
- `/groups` — circle registry for search and creation
- `/memberships` — assignment endpoint for joining a circle

## 🧩 Multi-Agent Architecture

```
[Interview Agent]                ← Conversational LLM, session-scoped
        ↓
[Profile Structuring Agent]      ← NLP extraction → structured JSON profile
        ↓
[Group Search Agent]             ← Vector + rule-based search over circle registry
        ↓
[Fit Scoring Agent]              ← Ranking model: amount, cadence, goal, size
        ↓
   [Match found?]
   ↙           ↘
[Join Group]   [Create Group]    ← Autonomous creation with admin notification
```

### Node Descriptions

**Interview Agent**
Conducts a friendly, conversational onboarding session — not a form. Uses a structured prompt with a defined question set but adapts tone and follow-up questions based on user responses. Extracts: savings goal, weekly contribution comfort range, preferred cycle length, group size preference, and risk tolerance. The session is capped at 8 turns to avoid fatigue.

Example questions:
- *"How much are you comfortable contributing each week — roughly?"*
- *"Are you saving towards something specific, or building a general emergency fund?"*
- *"Would you prefer a small group (5–8 people) or a larger one (10–20)?"*

**Profile Structuring Agent**
Converts the raw interview transcript into a structured `FinancialProfile` using a schema-constrained LLM call:

```python
class FinancialProfile(BaseModel):
    contribution_range: tuple[float, float]   # min, max weekly (USD)
    preferred_cycle_length_days: int           # e.g. 7, 14, 30
    preferred_group_size: tuple[int, int]      # min, max members
    savings_goal: str                          # e.g. "emergency fund", "business capital"
    risk_tolerance: Literal["conservative", "moderate", "flexible"]
    preferred_language: str                    # for nudge localisation
    location_country: str                      # for offramp routing
```

**Group Search Agent**
Queries the circle registry using a hybrid search: rule-based filtering (contribution amount range, cycle length, available slots) followed by semantic vector search on group descriptions and member profiles. Returns up to 10 candidate circles.

**Fit Scoring Agent**
Scores each candidate circle against the user's profile across four dimensions:

```python
fit_score = (
  0.35 * contribution_amount_compatibility
  + 0.25 * cycle_length_alignment
  + 0.25 * savings_goal_similarity        # embedding cosine similarity
  + 0.15 * group_size_preference_match
)
```

Circles scoring above `0.72` are presented as recommendations. Below that threshold, a new circle is created.

**Join / Create Branch**
If a match exists: the agent presents ranked recommendations with plain-language explanations and asks for user consent before assigning membership. If no match: the agent auto-generates a circle specification, notifies the admin, and places the user as the founding member — waiting for the minimum group size before activating.

## 🛠️ Agent Tools

```python
conduct_user_interview(session_id: str) -> InterviewTranscript
parse_financial_intent(transcript: InterviewTranscript) -> FinancialProfile
search_available_groups(profile: FinancialProfile) -> list[CircleCandidate]
score_group_fit(profile: FinancialProfile, circle: CircleCandidate) -> float
assign_membership(user_id: str, circle_id: str) -> MembershipConfirmation
create_new_group(spec: CircleSpec, founding_member: str) -> CircleId
generate_onboarding_summary(user_id: str, circle: Circle) -> str
```

## 🧠 State & Memory

```python
class MatchingAgentState(TypedDict):
    session_id: str
    user_id: str
    interview_transcript: list[Message]
    financial_profile: FinancialProfile
    candidate_circles: list[CircleCandidate]
    fit_scores: dict[str, float]
    recommendation: CircleCandidate | None
    outcome: Literal["joined", "created", "abandoned"]
    timestamp: datetime
```

Session state is held in **Redis** for the duration of the onboarding flow (TTL: 24 hours). Matching outcomes are written to PostgreSQL for model improvement. Vector embeddings of circle metadata are stored in **Pinecone** and refreshed daily.

## ⚠️ Constraints

- **User consent required** before any membership assignment — explicit confirmation step, not implied
- **No forced group assignments** — if the user declines all recommendations, the session ends with no action
- **Bias-aware matching** — the fit scoring model is audited quarterly for demographic bias; location, name, and phone carrier are excluded from scoring features
- **Minimum group threshold** — newly created circles are held in a "forming" state until the minimum member count is reached; the founding member is notified of expected wait time
- **No re-interview within 7 days** — prevents profile thrashing from repeated sessions

##  Success Metrics

| Metric | Target |
|--------|--------|
| Time to first contribution | < 48 hours from signup |
| Onboarding completion rate | > 80% of interviews result in a match or creation |
| Group completion rate (matched circles) | > 90% |
| Match quality score (user-rated) | > 4.2 / 5.0 |
| Abandonment rate | < 20% |

## 🌍 Localisation

The Interview Agent adapts its language and examples to the user's region:

| Region | Language support | Contribution framing |
|--------|-----------------|----------------------|
| Nigeria | English, Yoruba, Igbo | Weekly NGN equivalent |
| Kenya | English, Swahili | Weekly KES equivalent |
| Ghana | English, Twi | Weekly GHS equivalent |

All contribution amounts in the interview are quoted in local currency and converted to USDC internally at contribution time using the Band Price Oracle.

---

# 3️⃣ Treasury Optimisation & Stablecoin Flow Agent

## 🎯 Objective

Maximise trust, efficiency, and sustainability by intelligently managing cooperative treasury behaviour and stablecoin flows — without ever touching funds autonomously.

Trust in a cooperative is built contribution by contribution. A single unexplained delay in a payout — even if caused by a transient liquidity gap — can shatter a group. This agent provides the financial intelligence layer that prevents those gaps: forecasting liquidity ahead of each payout cycle, flagging anomalies before they become problems, and giving admins transparent, plain-language reports they can share with their members.

## 🧠 Agent Responsibilities

- Monitor wallet inflows and outflows across all cooperative treasuries
- Forecast liquidity requirements per payout cycle
- Detect anomalies and misuse patterns in transaction behaviour
- Recommend treasury optimisation strategies to admins
- Generate transparent, plain-language financial reports
- Maintain a tamper-evident audit log of all agent observations and recommendations

## 📥 Inputs

| Input | Source | Frequency |
|-------|--------|-----------|
| Wallet transaction history | `/wallet` API | Real-time stream |
| Group payout schedules | `/groups` API | Per cycle change |
| Contribution commitments | `/contributions` API | Per event |
| CashRamp settlement events | CashRamp API webhook | Per settlement |
| Audit logs | Audit store | Continuous |
| On-chain event stream | Flow blockchain events | Real-time |

## 📤 Outputs

| Output | Type | Recipient |
|--------|------|-----------|
| Liquidity forecast | Time-series projection | Dashboard |
| Risk and anomaly alerts | Structured alert | Admin |
| Treasury strategy recommendations | Ranked suggestions | Admin |
| Cycle payout readiness status | Boolean + confidence | System |
| Admin financial summaries | Markdown report | Group organiser |
| Audit log entries | Structured JSON | Compliance store |

## 🔗 System Integrations

- `/wallet` — real-time transaction stream and balance queries
- `/dashboard` — admin read surface for treasury status and reports
- **CashRamp API** — settlement event webhooks and offramp status
- **Audit logging system** — append-only event store for all agent observations
- **Flow blockchain event stream** — on-chain contribution and payout events

## 🧩 Agent Architecture (LangGraph)

```
[Wallet Monitor Node]            ← Real-time inflow/outflow tracking
        ↓
[Pattern Analysis Node]          ← Rolling stats, trend detection
        ↓
[Risk & Forecast Node]           ← Anomaly detection + liquidity projection
        ↓
[Recommendation Node]            ← Strategy generation with LLM rationale
        ↓
[Admin Notification Node]        ← Report generation + alert dispatch
```

### Node Descriptions

**Wallet Monitor Node**
Subscribes to the `/wallet` event stream and the Flow blockchain event bus. Maintains a rolling state of each cooperative's treasury: current balance, committed outflows (upcoming payouts), expected inflows (scheduled contributions), and historical settlement times. Emits a `TreasurySnapshot` on every significant event.

**Pattern Analysis Node**
Runs statistical analysis over the rolling state: contribution timing distributions, payout settlement latency trends, and inflow/outflow velocity. Flags deviations from a circle's established baseline. This node never makes decisions — it surfaces signals for the risk node to evaluate.

**Risk & Forecast Node**
Two sub-tasks run in parallel:

*Anomaly Detection* — uses a combination of z-score thresholds and rule-based checks:
```python
anomaly_signals = [
  contribution_arrived_outside_window(tx, expected_window_hours=2),
  unusual_withdrawal_pattern(tx, circle_history),
  settlement_latency_spike(settlement_event, p95_latency_minutes),
  duplicate_contribution_hash(tx, recent_tx_hashes),
]
```

*Liquidity Forecasting* — projects treasury balance through the next 3 payout cycles:
```python
forecast = rolling_average_inflow(last_4_cycles) * expected_members
         - scheduled_payout_amount
         - estimated_offramp_fees
# Alert if projected balance < payout_amount * safety_margin (default 1.1x)
```

**Recommendation Node**
When a risk or forecast signal fires, this node generates a ranked list of recommendations using the LLM. Each recommendation includes a plain-language explanation, a confidence score, and the data points that drove it. Examples: *"Payout cycle 7 is projected to have a 12% shortfall — consider reminding 3 members whose contributions have not yet arrived."* The LLM is constrained to recommendations only — it cannot initiate actions.

**Admin Notification Node**
Assembles the weekly treasury summary report and dispatches it via the admin's preferred channel (email, in-app, or Slack webhook). Critical alerts (anomaly severity ≥ HIGH) are dispatched immediately. All dispatched content is logged to the audit store before sending.

## 🛠️ Agent Tools

```python
get_wallet_transactions(circle_id: str, since: datetime) -> list[Transaction]
get_treasury_snapshot(circle_id: str) -> TreasurySnapshot
forecast_liquidity(circle_id: str, cycles_ahead: int = 3) -> LiquidityForecast
detect_anomalies(snapshot: TreasurySnapshot) -> list[AnomalySignal]
generate_treasury_report(circle_id: str, period: str) -> str            # Markdown
send_admin_notification(admin_id: str, content: str, severity: str) -> bool
log_audit_event(circle_id: str, event: AuditEvent) -> None
get_offramp_settlement_status(payout_id: str) -> SettlementStatus
```

## 🧠 State & Memory

```python
class TreasuryAgentState(TypedDict):
    circle_id: str
    treasury_snapshot: TreasurySnapshot
    anomaly_signals: list[AnomalySignal]
    liquidity_forecast: LiquidityForecast
    recommendations: list[Recommendation]
    dispatched_notifications: list[Notification]
    audit_events: list[AuditEvent]
    last_updated: datetime
```

Wallet-level rolling state is held in **Redis** (hot path, 30-day window). Historical liquidity patterns and recommendation outcomes are persisted in **PostgreSQL**. Audit logs are written to an **append-only event store** (immutable, compliance-grade). Previous recommendation outcomes feed back into the forecast model monthly.

## ⚠️ Constraints

- **Read-only financial authority** — the agent observes and recommends; it cannot move, allocate, or hold funds under any circumstance
- **No autonomous fund reallocation** — any action involving funds requires explicit admin confirmation
- **Full audit trail required** — every observation, recommendation, and notification is logged with timestamp, data source, and agent version before execution
- **Anomaly alert rate limiting** — maximum 3 anomaly alerts per circle per 24 hours to prevent alert fatigue
- **Recommendation expiry** — recommendations older than 48 hours are automatically marked stale and removed from the dashboard

##  Success Metrics

| Metric | Target |
|--------|--------|
| Liquidity shortfall rate | < 2% of payout cycles affected |
| Payout delivery reliability | > 99% on-time |
| Anomaly detection precision | > 85% (low false positive rate) |
| Admin report engagement rate | > 60% of admins open weekly summary |
| Forecast accuracy (3-cycle horizon) | MAPE < 8% |

## 📊 Sample Treasury Report (Agent Output)

```markdown
## CoopWise Treasury Summary — Circle: ajo-lagos-7
Period: Cycle 6 of 12 | Generated: 2025-07-14

**Treasury health:  Healthy**

**This cycle**
- Contributions received: 8 of 9 members (89%)
- Total pool: ~$360 USDC (encrypted on-chain)
- Payout status: Delivered to Amaka — bank credit confirmed ✓
- Offramp settlement time: 34 minutes

**Forecast — next 3 cycles**
- Cycle 7: Projected  (all commitments on track)
- Cycle 8: ⚠️ One member's contribution pattern shows irregularity — monitoring
- Cycle 9: Projected 

**Recommendations**
1. Send a payment reminder to Member #3 ahead of Cycle 8 (confidence: 78%)
2. Consider enabling SMS backup notifications for 2 members with low push open rates

**Audit trail**: 47 events logged this cycle. No anomalies detected.
```

---

# 🔐 Shared Agent Design Principles

These principles apply to all three agents and are non-negotiable. They exist because CoopWise handles real money for communities that may have limited recourse if something goes wrong.

## Deterministic execution paths
Every agent follows a defined node graph. Conditional branches are explicit and auditable. No agent makes a decision that cannot be traced back to a specific input, rule, and timestamp.

## Human-in-the-loop overrides
Every action above a defined severity threshold requires human acknowledgement before execution. Admins can pause, override, or dismiss any agent recommendation at any time. The agents are advisors, not decision-makers — except for low-stakes, high-confidence actions (nudge dispatch, report generation) where autonomy is explicitly enabled.

## Explainable reasoning outputs
Every recommendation includes a plain-language rationale that references the specific data points that drove it. No black-box outputs. Admins and members should be able to understand why the agent acted, even without technical knowledge.

## Secure role-based tool access
Each agent has access only to the APIs and data stores its role requires. The Health Agent cannot access wallet data. The Treasury Agent cannot access interview transcripts. Tool access is enforced at the infrastructure level, not just in code.

## Full audit logging
All agent observations, decisions, and actions are logged to a tamper-evident audit store before execution. Log entries include: agent ID, version, input state hash, decision, rationale, output, and timestamp. Logs are retained for a minimum of 24 months.

## Privacy-preserving by design
Agents operate on group-level signals, not individual encrypted contribution amounts. The FHE layer on Zama's FHEVM ensures that contribution ciphertexts are never decrypted by agents — only by the designated payout recipient. Agent scoring uses contribution presence/absence signals, not amounts.

---

# 🚀 Implementation Notes

## Stack

| Layer | Technology |
|-------|-----------|
| Agent orchestration | LangGraph (stateful, deterministic graphs) |
| Tool definitions | LangChain tools with Pydantic schemas |
| LLM calls | Claude claude-sonnet-4-6 (recommendations + nudge copy) |
| State persistence (hot) | Redis — rolling 30-day window |
| State persistence (cold) | PostgreSQL — full history |
| Vector store | Pinecone — group and member profile embeddings |
| Audit store | Append-only event store (e.g. EventStoreDB) |
| Deployment | Containerised, one agent per service, autoscaled |

## Development practices

- **Version agent prompts and decision policies** — treat prompt changes as code changes: commit, review, test, deploy. Use semantic versioning.
- **Gradually enable autonomy via feature flags** — new action types start gated behind admin-confirm=required. Autonomy is earned by demonstrated precision over 30+ days.
- **Evaluation harness per agent** — each agent has an offline eval suite that runs against a fixture dataset before every deployment. Regressions block deployment.
- **Observability** — emit structured spans for every node execution. Track: input token count, latency, output schema validity, action type, and outcome. Pipe to your observability stack (Datadog, Grafana, etc.).
- **Graceful degradation** — if an LLM call fails, agents fall back to deterministic rule-based outputs. No agent is blocked by LLM unavailability.

## Local development

```bash
# Install dependencies
pip install langchain langgraph langchain-anthropic pinecone-client redis psycopg2

# Run a single agent in local mode (uses fixture data)
python -m coopwise.agents.health --mode local --circle-id ajo-lagos-7

# Run the full agent pipeline against staging
python -m coopwise.agents.run --env staging --agent all
```

## Environment variables

```bash
ANTHROPIC_API_KEY=...
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://...
PINECONE_API_KEY=...
PINECONE_INDEX=coopwise-groups
AUDIT_STORE_URL=...
COOPWISE_AGENT_ENV=staging   # staging | production
AUTONOMY_FLAG_HEALTH=nudge   # nudge | alert | full
AUTONOMY_FLAG_MATCHING=recommend  # recommend | assign
AUTONOMY_FLAG_TREASURY=report    # report | alert
```

---

# 🧠 Strategic Moat

These agents collectively transform CoopWise from a digital savings app into an AI-native financial coordination layer for African cooperatives. The moat is not any single agent — it is the **compound effect of all three operating together**:

- The Matching Agent places compatible members into circles, increasing the probability of success from day one.
- The Health Agent catches failure signals early, protecting the trust that took those members months to build.
- The Treasury Agent gives admins the financial clarity they need to run their circles with confidence — and give their members peace of mind.

Each agent improves over time. Matching outcomes feed the scoring model. Health interventions feed the intervention playbook. Treasury forecasts feed the anomaly thresholds. The platform learns from every circle, every cycle, every payout.

Africa's rotating savings systems have survived for centuries on community trust. CoopWise adds a layer that communities can also verify. That is the foundation worth building on.

Let's build systems that communities can trust. ✨

---

*Document version: 2.0 | Last updated: 2026 | Maintained by the CoopWise*