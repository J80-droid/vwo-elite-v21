---
name: project-conventions
description: Defines the specific coding style, architecture patterns, and tech stack for this project. Always consult this when generating code.
version: 1.2.0
triggers:
  - "when generating any code"
  - "when creating new features"
  - "when reviewing architecture"
---

# Project Architecture & Conventions

## Tech Stack

- **Language:** TypeScript
- **Framework:** React 19 (Vite)
- **Styling:** Tailwind CSS (v4)
- **State Management:** Zustand, TanStack React Query

## Coding Style

- **Naming:** CamelCase for variables, PascalCase for components/classes.
- **File Structure:** Feature-slice architecture (e.g., `/features/auth/` instead of `/components/`).
  > **MANDATORY:** Do not manually create folders for new features. You MUST use the scaffolding script to ensure DDD compliance:
  > `powershell -ExecutionPolicy Bypass -File .agent/skills/project-conventions/scripts/scaffold_feature.ps1 <Name>`
- **Imports:** Use absolute imports where configured.

## Architecture Rules

1. **Separation of Concerns:** UI components should not contain heavy business logic. Use custom hooks or services.
2. **Strict Typing:** No `any` types allowed. Use `unknown` if necessary or strictly type interfaces.
3. **Commits:** Follow Conventional Commits format (e.g., `feat: add login button`, `fix: resolve crash`).
4. **Centralized Persistence:** All Main process data MUST be stored in the central `app.db` via `DatabaseFactory`. Never create feature-specific database files in the main process.
5. **Quality Gate (Elite Status):** You MUST run `pnpm run pre-deploy:elite` before considering any major feature complete or preparing for deployment. The codebase is NOT "Elite" ready until this command exits with code 0.

## UI Components Strategy

- **Reusability First:** Before styling a new element, check `src/components/ui`.
- **Strict Rule:** NEVER inline standard styles for Buttons, Inputs, or Cards. Import the generic component.
- **Design System:** "Premium Neon Glassmorphism". No solid backgrounds. Use subtle transparency (5-10%), neon accent colors (Indigo/Purple/Emerald), and matching glow shadows.
- **Library:** Elite UI (custom components in `src/shared/ui/`).
- **Dark Mode Dropdowns:** NEVER use native `<select>` elements. Always use a custom, dark-mode compatible dropdown component (e.g., `CustomSelect`) with `bg-obsidian-900`, `border-white/10`, and hover effects.
- **Full-Width Flexible Layouts:** All new pages MUST use a **full-width, flexible layout**. Content should auto-expand and unnecessary panels must auto-collapse.

## Documentation

- Update `README.md` if new environment variables or setup steps are added.
- Use JSDoc/DocStrings for complex functions.
