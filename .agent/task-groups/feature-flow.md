---
name: feature-flow
description: ORCHESTRATION: End-to-end workflow for scaffolding and implementing new features.
triggers: ["new feature", "create page", "add module"]
---

# Feature Development Protocol

**STATUS:** ACTIVE
**STRICTNESS:** HIGH

## Phase 1: Architecture & Scaffolding

**Goal:** Enforce Domain-Driven Design before writing logic.

1. **Define Name:** Extract a clean, pascal-case name for the feature (e.g., `UserSettings`).
2. **Execute Scaffold:**
   - **MUST RUN:** `powershell -ExecutionPolicy Bypass -File .agent/skills/project-conventions/scripts/scaffold_feature.ps1 <Name>`
   - _Validation:_ Check if `src/features/<name>` exists. If not, HALT and report error.

## Phase 2: Context Injection (Knowledge Loading)

**Goal:** Prevent legacy code generation.

1. **Load Knowledge:** Read `.agent/skills/tech-stack/REACT19.md`.
2. **Load Knowledge:** Read `.agent/skills/tech-stack/TAILWIND4.md`.
3. **Rule:** Confirm internal understanding:
   - "I will use `use()` instead of `useEffect`."
   - "I will use `@theme` variables instead of magic hex codes."

## Phase 3: Implementation Strategy

**Goal:** Fill the scaffolded structure.

1. **Data Layer (`/logic`):**
   - Create hooks utilizing TanStack Query or `use()` based on requirements.
   - Define TypeScript interfaces in `/core/types`.
2. **UI Layer (`/ui`):**
   - Build components in `/ui/components`.
   - Assemble layouts in `/ui/modules`.
   - **Constraint:** Check `accessibility` skill for ARIA labels on all interactables.

## Phase 4: Logic Verification (The Sanity Check)

**Goal:** Prevent logical bugs before testing.

1. **Analyze:** For any function with > 5 lines of logic or conditional branching:
   - **ACTIVATE:** `logic-verification` skill.
   - **Constraint:** You MUST perform a "Mental Sandbox" dry run for edge cases.

## Phase 5: Quality Gate

1. **Lint:** Run `npm run lint`. Fix any errors immediately.
2. **User Handover:** Output the exact import statement required to add this feature to the main App router.
