---
name: git-workflow
description: Generates semantic commit messages and handles git operations.
version: 1.0.0
triggers:
  - "when committing changes"
  - "when creating branches"
  - "when merging code"
---

# Git Workflow

When asked to commit changes, follow this logic:

1. **Analyze changes:** `git diff --staged`
2. **Classify:**
   - `feat:` (new feature)
   - `fix:` (bug fix)
   - `refactor:` (code change, no behavior change)
   - `chore:` (maintenance, deps)
3. **Format:** `<type>(<scope>): <short description>`
   - Example: `feat(auth): implement jwt refresh logic`
4. **Execute:** Run the git commit command only after user confirmation or if explicitly autonomous.

> **Related Skills:** [deployment](../deployment/SKILL.md), [project-conventions](../project-conventions/SKILL.md)
