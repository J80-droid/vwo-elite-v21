---
name: security
description: Security hardening rules, CSP headers, input sanitization, and vulnerability prevention.
version: 1.0.0
triggers:
  - "when handling user input"
  - "when implementing authentication"
  - "when reviewing security"
---

# Security Standards

## 1. Input Validation

- **NEVER** trust user input. Always validate and sanitize.
- Use TypeScript strict typing for API responses.
- Escape HTML in user-generated content.

```typescript
// BAD
const html = `<div>${userInput}</div>`;

// GOOD
import DOMPurify from "dompurify";
const html = `<div>${DOMPurify.sanitize(userInput)}</div>`;
```

## 2. API Security

- **NEVER** expose API keys in client-side code.
- Use environment variables with `VITE_` prefix only for public values.
- Proxy sensitive API calls through a backend.

## 3. Content Security Policy (CSP)

Recommended headers (configure in server/CDN):

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;
```

## 4. Dependency Security

Run before every release:

```bash
npm audit --audit-level=high
```

## 5. Authentication Checklist

- [ ] Use HttpOnly cookies for tokens (not localStorage)
- [ ] Implement CSRF protection
- [ ] Rate limit authentication endpoints
- [ ] Use secure password hashing (bcrypt/argon2)
- [ ] Implement proper session management

## 6. Secrets Management

- Never commit `.env` files with real credentials
- Use `.env.example` as a template
- Rotate keys regularly

> **Related Skills:** [deployment](../deployment/SKILL.md), [documentation](../documentation/SKILL.md)
