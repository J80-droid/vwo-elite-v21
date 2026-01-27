---
name: release-pipeline
description: ORCHESTRATION: Safe production deployment sequence.
triggers: ["deploy", "release", "ship it", "publish"]
---

# Release Pipeline

**STATUS:** CRITICAL
**OVERRIDE:** NONE

## Phase 1: Verification (The Wall)

**Goal:** Stop bad code from leaving the machine.

1. **Security Audit (Red Team):**
   - **MUST RUN:** `powershell -ExecutionPolicy Bypass -File .agent/skills/red-team/scripts/security_scan.ps1`
   - _Constraint:_ If scan fails (EXIT CODE 1), HALT immediately. Do not proceed.
2. **Execute Build Verification:**
   - **MUST RUN:** `powershell -ExecutionPolicy Bypass -File .agent/skills/deployment/scripts/verify_release.ps1`
3. **Analyze Result:**
   - If **EXIT CODE 0** (Green): Proceed to Phase 2.
   - If **EXIT CODE 1** (Red): HALT immediately. List failures.

## Phase 2: Version Control

1. **Status Check:** Run `git status`. Ensure tree is clean.
2. **Commit Check:** Ensure all changes are committed using `git-workflow`.

## Phase 3: Deployment

1. **Execute Deploy:**
   - Command: `npm run deploy` (or specific cloud command).
2. **Post-Flight:**
   - Output the production URL.
   - Ask user: "Verify live site manually?"
