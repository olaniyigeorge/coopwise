"""
domains/cooperatives

Replaces `domains/circles` as the primary group domain.

This domain owns the "Cooperative Engine": a Cooperative composes
versioned, pluggable rule modules (governance / membership / financial /
decision) plus the goal-typing system (beneficiary_patterns +
goal_categories) that gates what a Goal is allowed to do.

All models here are prefixed `Coop*` (tables: `coop_*`) to make it
unambiguous, at a glance, which rows belong to the new engine vs. any
legacy `circles`-domain tables still hanging around during migration.

See: apps/backend -> Documentation "Database Design: Goals + Governance
Core" for full rationale and the decisions log.
"""