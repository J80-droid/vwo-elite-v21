---
name: knowledge-tailwind4
description: Critical rules and syntax for Tailwind CSS v4. Overrides v3 knowledge.
version: 1.0.0
triggers:
  - "when styling components"
  - "when configuring theme"
  - "when using dark mode"
---

# Tailwind CSS v4 Standards

**CRITICAL WARNING:** This project uses Tailwind CSS v4.

- ❌ **DO NOT** create or look for `tailwind.config.js` or `tailwind.config.ts`.
- ❌ **DO NOT** use `@tailwind base/components/utilities`.
- ✅ **DO** use CSS-first configuration.

## 1. Setup & Imports

The main CSS file (e.g., `src/index.css` or `src/app.css`) implies the configuration.

**Correct Syntax:**

```css
@import "tailwindcss";

/* If you need custom utilities */
@layer utilities {
  .scrollbar-hide {
    scrollbar-width: none;
  }
}
```

## 2. Configuration (The @theme block)

Do not use JavaScript for theme config. Use the `@theme` block directly in CSS.

**How to extend the theme:**

```css
@theme {
  /* Colors */
  --color-brand-primary: #3b82f6;
  --color-brand-dark: #1e3a8a;

  /* Fonts */
  --font-display: "Satoshi", "sans-serif";

  /* Spacing/Breakpoints */
  --breakpoint-3xl: 1920px;
}
```

**Usage in HTML:** `<div class="bg-brand-primary font-display">...</div>`

## 3. Dynamic Values

Tailwind v4 has an upgraded JIT engine. Prefer arbitrary values for one-off styles over cluttering the theme.

**Use:** `<div class="h-[calc(100vh-4rem)]">`
**Use:** `<div class="grid-cols-[1fr_500px_1fr]">`

## 4. Dark Mode

Dark mode is now supported natively via the `dark:` variant without extra config. If you need class-based toggling (instead of system pref), wrap the import:

```css
@import "tailwindcss" theme(reference);

:root {
  /* Default light variables */
}

.dark {
  /* Dark overrides */
}
```
