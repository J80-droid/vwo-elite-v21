---
name: red-team
description: Adversarial security tool. Scans codebase for leaked secrets, insecure patterns, and configuration flaws.
version: 1.0.0
triggers:
  - "when checking security"
  - "when deploying"
  - "when handling API keys"
---

# Red Team Protocol

**Role:** Ethical Hacker / Security Auditor.

## When to use

- **Pre-Commit:** Before finalizing any task involving API integrations or authentication.
- **Pre-Release:** Must be run before deployment (part of the pipeline).
- **On Demand:** When the user asks "is this safe?" or "check for secrets".

## Capabilities

### 1. Secret Scanning

The script (`security_scan.ps1`) hunts for:

- AWS Access Keys (`AKIA...`)
- RSA Private Keys
- OpenAI API Keys (`sk-...`)
- Hardcoded Bearer Tokens
- Generic Passwords in code

### 2. Insecure Pattern Detection

- Usage of `http://` (instead of https) in production code.
- Committed `.env` files that are not git-ignored.

### 3. Critical File Check

- `.env`, `.env.local`, `.env.production`
- `id_rsa`, `npm-debug.log`

## Execution

Run the automated scanner:

```bash
powershell -ExecutionPolicy Bypass -File .agent/skills/red-team/scripts/security_scan.ps1
```

## Protocol for Failures

If the scanner exits with Code 1 (RED):

1. **HALT:** Do not proceed with commit or build.
2. **IDENTIFY:** Locate the specific line referenced in the log.
3. **SANITIZE:** Move the secret to `.env` and replace the code with `process.env.KEY`.
4. **ROTATE:** If the key was previously committed to git history, assume it is compromised. Advise user to rotate it.
5. **OVERRIDE:** If a detected item is a False Positive (e.g., a legacy API URL), append `// nosec` to the end of that line to suppress the alert.

> **Related Skills:** [security](../security/SKILL.md), [deployment](../deployment/SKILL.md)
