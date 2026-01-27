---
name: tech-stack
description: Knowledge base for the project's core technologies. Contains critical rules that override outdated patterns.
version: 1.0.0
triggers:
  - "when writing any code"
  - "when making technology decisions"
---

# Tech Stack Knowledge Base

This skill contains up-to-date knowledge for bleeding-edge technologies used in this project.

## Contents

### [REACT19.md](./REACT19.md)

Modern React 19 patterns:

- `use()` hook for data fetching (replaces `useEffect`)
- Form actions with `action` prop
- `useActionState` and `useFormStatus`
- React Compiler (no manual memoization)

### [TAILWIND4.md](./TAILWIND4.md)

Tailwind CSS v4 configuration:

- CSS-first config (no `tailwind.config.js`)
- `@theme` blocks for theming
- Native dark mode support

### [SQLITE_LANCE.md](./SQLITE_LANCE.md)

Hybrid Persistence Layer:

- Centralized `app.db` via `better-sqlite3`
- Vector storage via `LanceDB`
- Centralized `DatabaseFactory` logic

## Examples

Reference implementations are available in the `examples/` directory:

- `react19-use-api.tsx` - Data fetching with `use()`
- `tailwind4-theme.css` - CSS-first theme configuration

> **Related Skills:** [project-conventions](../project-conventions/SKILL.md)
