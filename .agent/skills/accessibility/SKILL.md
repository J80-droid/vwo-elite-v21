---
name: accessibility
description: Enforces WCAG 2.1 AA standards for all UI components.
version: 1.0.0
triggers:
  - "when creating UI components"
  - "when reviewing JSX"
  - "when building forms"
---

# Accessibility (A11y) Checklist

## Interactive Elements

- [ ] **Focus Styles:** All interactive elements (`<button>`, `<a>`, inputs) MUST have a visible focus state (`focus-visible:ring-...`).
- [ ] **Keyboard Nav:** Can the element be reached and activated using `Tab` and `Enter`/`Space`?
- [ ] **Labels:** Icon-only buttons MUST have `aria-label` or `<span className="sr-only">`.

## Forms

- [ ] **Inputs:** Every input MUST be associated with a `<label>` (via `htmlFor` + `id` or wrapping).
- [ ] **Errors:** Error messages must be linked via `aria-describedby`.

## Visuals

- [ ] **Contrast:** Ensure text color meets contrast ratio against background (Tailwind colors 500+ usually needed on white).
- [ ] **Motion:** Respect `prefers-reduced-motion` (use `motion-safe:` prefix in Tailwind).

> **Related Skills:** [project-conventions](../project-conventions/SKILL.md), [documentation](../documentation/SKILL.md), [internationalization](../internationalization/SKILL.md)
