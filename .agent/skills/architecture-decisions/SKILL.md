---
name: architecture-decisions
description: Records significant architectural choices (ADRs). Use when changing libraries, patterns, or data strategies.
version: 1.0.0
triggers:
  - "when changing libraries"
  - "when making architectural decisions"
  - "when introducing new patterns"
---

# Architectural Decision Records (ADR) Protocol

**RULE:** If a decision affects the long-term structure or stack of the project, it MUST be documented.

## Trigger Events

- Replacing a core library (e.g., Axios → Fetch).
- Changing state management strategy.
- Introducing a new external service.
- Major refactoring decisions.

## How to Create an ADR

1. **Generate File:** Create `docs/adr/YYYY-MM-DD-title-of-decision.md`.
2. **Content Template:**

```markdown
# [Title]

- **Status:** [Proposed | Accepted | Deprecated]
- **Date:** [YYYY-MM-DD]
- **Deciders:** [Names]

## Context

The issue that motivated this decision. (e.g., "Moment.js is too large bundle-wise.")

## Decision

We will use [Solution] because [Reason]. (e.g., "We will switch to `date-fns`.")

## Consequences

- **Positive:** [Benefits]
- **Negative:** [Trade-offs]
```

## Action

After creating the ADR, verify the consequences with the user.

> **Related Skills:** [documentation](../documentation/SKILL.md), [project-conventions](../project-conventions/SKILL.md)
