---
name: internationalization
description: i18n standards for translation keys, locale management, and multi-language support using i18next.
version: 1.0.0
triggers:
  - "when adding translations"
  - "when creating user-facing text"
  - "when supporting multiple languages"
---

# Internationalization (i18n) Standards

## 1. Translation Key Patterns

Use hierarchical, descriptive keys:

```typescript
// BAD
t("button1");
t("welcomeMessage");

// GOOD
t("common.buttons.submit");
t("auth.login.welcomeMessage");
t("features.dashboard.stats.totalUsers");
```

## 2. File Structure

```text
src/shared/assets/locales/
├── en/
│   ├── common.json
│   ├── auth.json
│   └── features/
│       └── dashboard.json
├── nl/
│   ├── common.json
│   └── ...
└── fr/
    └── ...
```

## 3. Key Naming Rules

- **Lowercase** with dots for hierarchy
- **Descriptive** context: `page.section.element`
- **Consistent** across all locales

## 4. Usage in Components

```tsx
import { useTranslation } from "react-i18next";

export const LoginButton = () => {
  const { t } = useTranslation("auth");

  return (
    <button aria-label={t("login.buttonLabel")}>{t("login.buttonText")}</button>
  );
};
```

## 5. Adding New Translations

1. Add key to **all** locale files (not just one)
2. Use the `/add-translation` workflow for consistency
3. Verify pluralization rules for languages that require them

## 6. Interpolation

```json
{
  "greeting": "Hello, {{name}}!",
  "itemCount": "You have {{count}} item",
  "itemCount_plural": "You have {{count}} items"
}
```

> **Related Skills:** [accessibility](../accessibility/SKILL.md), [documentation](../documentation/SKILL.md)
