---
name: refactoring
description: Guidelines for cleaning up code without changing behavior. Use when asked to "clean up" or "optimize".
version: 1.0.0
triggers:
  - "when cleaning up code"
  - "when optimizing"
  - "when reducing complexity"
---

# Refactoring Protocol

## Priority Targets

1. **Long Functions:** Break down components larger than 150 lines into sub-components or hooks.
2. **Magic Strings/Numbers:** Extract into constants or config files.
3. **Prop Drilling:** If passing props down >3 levels, move to Zustand store or Context.

## Safety Rules

1. **No Logic Changes:** Refactoring MUST NOT change the external behavior.
2. **Verify Tests:** Run `npm test` BEFORE and AFTER the refactor.
3. **Atomic Commits:** Refactor one module at a time. Do not mix refactoring with feature work.

> **Related Skills:** [project-conventions](../project-conventions/SKILL.md), [documentation](../documentation/SKILL.md), [testing](../testing/SKILL.md)
