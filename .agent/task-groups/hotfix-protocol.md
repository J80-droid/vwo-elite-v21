---
name: hotfix-protocol
description: ORCHESTRATION: Scientific method for diagnosing and fixing bugs.
triggers: ["fix bug", "error", "crash", "not working"]
---

# Hotfix Protocol (TDD)

**STATUS:** ACTIVE
**METHOD:** TEST-DRIVEN REMEDIATION

## Phase 1: Isolation (The Red Phase)

**Goal:** Prove the bug exists.

1. **Analyze:** Read the error log or user report.
2. **Create Reproduction:** Create a temporary test file `src/repro_<issue_id>.test.ts`.
3. **Write Fail Case:** Write a test that strictly reproduces the bug scenario.
4. **Execute:** Run the test.
   - _Condition:_ The test **MUST FAIL**.
   - _If Pass:_ The bug is not reproduced. STOP and ask user for more info.

## Phase 2: Remediation (The Green Phase)

**Goal:** Fix the logic with surgical precision.

1. **Consult:** If syntax error, check `tech-stack` skills.
2. **Edit:** Modify the code to handle the edge case / fix the error.
3. **Verify:** Run the `repro_<issue_id>.test.ts` again.
   - _Condition:_ The test **MUST PASS**.

## Phase 3: Cleanup & Commit

1. **Integration:** Move the test case to the permanent test suite (regression prevention).
2. **Delete:** Remove the temporary `repro_` file.
3. **Commit:** Initiate `git-workflow` with type `fix:`.
