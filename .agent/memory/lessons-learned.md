# Agent Long-Term Memory & Lessons Learned

> This file acts as the persistent memory for the agent.
> RULES listed here override all defaults.

## Learned Constraints

- [2026-01-16] Use `use()` hook for data fetching, never `useEffect`.
- [2026-01-16] Tailwind v4 uses CSS-first config, no `tailwind.config.js`.
- [2026-01-16] All new features MUST be scaffolded via `scaffold_feature.ps1`.
- [2026-01-16] No inline CSS styles; use Tailwind classes exclusively.
- [2026-01-16] Interface names should be clean (e.g., `User`), never prefixed with `I`.
- [2026-01-16] Avoid circular dependencies by moving shared interfaces to `@shared/types/ai-brain.ts` early. Memory systems often trigger deep import loops.
- [2026-01-17] **NEVER USE SOLID BUTTONS**. All UI elements must follow "Premium Neon Style": transparent glass (5-10% opacity), neon text/borders, and elegant glow shadows in the same tint.
- [2026-01-17] **Color-Code Sections**: Use distinct neon colors (Cyan, Pink, Amber, Violet) for different functional groups to improve scanability.

## Project-Specific Preferences

- [2026-01-16] Interaction language: Dutch. Code/docs: English.
- [2026-01-16] Persona: Principal Software Architect. No filler language.
- [2026-01-18] **Centralize SQLite**: Never create multiple database files for distinct features. All main process state (AI models, chat, metadata) MUST live in the central `app.db` managed by `DatabaseFactory` for consistency and easier backup.
- [2026-01-18] **PDF ESM Compatibility**: `pdf-parse` v2.4.5+ requires named imports (`import { PDFParse } from 'pdf-parse'`) and MUST be marked as `external` in Vite/Rollup configs to avoid SSR/Worker execution errors.
- [2026-01-18] **Service Consolidation**: Prefer a single robust `AIService` for all transformer-based tasks (embeddings, classification) over multiple smaller services to ensure unified memory management (idle-timers) and faster loading.
- [2026-01-18] **Worker-Powered Ingestion**: Document processing/extraction MUST run in `worker_threads` to keep the Electron Main process responsive during large uploads. Use `IngestionService` as the unified entry point.
