---
name: deployment
description: Validates, builds, and deploys the application. Enforces strict quality gates (Lint, Test, Build, Audit).
version: 1.1.0
triggers:
  - "when deploying"
  - "when releasing"
  - "when building for production"
---

# Deployment Workflow

## 1. Release Verification

Before any deployment, the release candidate MUST be verified. This automated process handles Linting, Testing, and Building.

> **Command:**
> `powershell -ExecutionPolicy Bypass -File .agent/skills/deployment/scripts/verify_release.ps1`

## 2. Environment Variables

Ensure `.env.production` contains all keys required by the build output (refer to `.env.example`).

## 3. Deployment

If the verification script passes (Green), proceed with deployment:

**Deploy to Production:**

```bash
# [Insert your specific deploy command here, e.g., 'vercel --prod' or 'docker push']
npm run build && npm run preview
```

## 4. Resources

Templates are available in the `resources/` directory:

- `Dockerfile.template` - Multi-stage Docker build
- `github-actions.yml.template` - CI/CD pipeline for GitHub

> **Related Skills:** [git-workflow](../git-workflow/SKILL.md), [security](../security/SKILL.md)
