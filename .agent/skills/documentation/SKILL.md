---
name: documentation
description: Standards for writing JSDoc, READMEs, and architectural decision records.
version: 1.0.0
triggers:
  - "when creating new components"
  - "when adding environment variables"
  - "when writing complex logic"
---

# Documentation Standards

Code is read more often than it is written.

## 1. Component Documentation (TSDoc)

Every exported component MUST have a TSDoc comment explaining:

- **What** it does.
- **When** to use it.
- **Key Props** (especially if complex).

```typescript
/**
 * Primary UI button with ripple effect.
 * @param variant - 'solid' | 'outline' (default: 'solid')
 * @example
 * <Button variant="outline" onClick={...}>Cancel</Button>
 */
export const Button = ...
```

## 2. README Updates

- If a new environment variable is added -> Update `.env.example` AND `README.md`.
- If a new script is added -> Add it to the "Scripts" table in `README.md`.

## 3. Inline Comments

- ❌ Do not explain **what** the code does (the code shows that).
- ✅ Explain **why** it does it (context, hacks, business rules).

> **Related Skills:** [project-conventions](../project-conventions/SKILL.md), [accessibility](../accessibility/SKILL.md)
