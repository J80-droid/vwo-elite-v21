---
name: logic-verification
description: Performs a deep semantic analysis of code logic. Simulates execution mentally to find edge cases, race conditions, and fallacies.
triggers: ["check logic", "validate algorithm", "debug flow"]
---

# Logic Verification Protocol (The "Spock" Method)

**Goal:** Validate that the code does what it is _intended_ to do, not just that it compiles.

## Phase 1: The Translation (Rubber Ducking)

Translate the complex code block into plain Dutch pseudocode.

- _Does the narrative match the business requirement?_
- _Are operations performed in the correct order?_ (e.g., Auth check BEFORE Data fetch).

## Phase 2: The Mental Sandbox (Dry Run)

You must simulate the execution of the code with 3 distinct datasets:

1. **The Happy Path:** Standard input.
2. **The Void:** Null, undefined, empty arrays/strings.
3. **The Chaos:** Negative numbers, massive datasets, special characters.

> **Output Format for Sandbox:**
>
> - Input: `[]` (Empty Array)
> - Step 1: Loop skipped (Correct)
> - Step 2: Returns `0` (Correct)
> - _Verdict: Safe._

## Phase 3: Logical Fallacy Check

Scan specifically for:

- **Off-by-one errors:** Loops using `<=` vs `<`.
- **Truthiness traps:** Checks like `if (value)` where `0` is a valid value but evaluates to false.
- **Race Conditions:** Are independent async calls (`Promise.all`) actually dependent?
- **Mutation risks:** Is an object modified by reference unexpectedly?

## Action

If a logic flaw is found, propose the fix immediately with the label **[LOGIC REPAIR]**.
