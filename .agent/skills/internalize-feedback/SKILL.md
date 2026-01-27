---
name: internalize-feedback
description: Updates the long-term memory with user corrections. Trigger this when the user says "Don't do X" or "Always do Y".
version: 1.0.0
triggers:
  - "when user corrects behavior"
  - "when user sets preference"
  - "when user says never or always"
---

# Internalization Protocol

**Trigger:** User explicitly corrects a behavior or sets a new preference.

## Procedure

1. **Analyze:** Extract the core rule from the user's feedback.
   - _Input:_ "Stop using arrow functions for top-level components!"
   - _Rule:_ "Top-level components must use `function` keyword, not arrow syntax."

2. **Record:** Append the rule to `.agent/memory/lessons-learned.md` with a timestamp.
   - Format: `* [YYYY-MM-DD] <The Rule>`

3. **Confirm:** Reply to the user: "I have updated my internal memory. I will enforce this rule in future tasks."

## Constraint

Do not record project-specific one-offs. Only record reusable patterns or preferences.

## Example

**User says:** "Ik wil dat je voortaan altijd commentaar in het Nederlands schrijft."

**Action:**

1. Extract: "Write all code comments in Dutch."
2. Append to `lessons-learned.md`:

   ```markdown
   - [2026-01-16] Code comments must be written in Dutch.
   ```

3. Confirm: "Ik heb mijn intern geheugen bijgewerkt. Alle toekomstige comments zullen in het Nederlands zijn."

> **Related Skills:** [documentation](../documentation/SKILL.md), [project-conventions](../project-conventions/SKILL.md)
