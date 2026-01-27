# SQLite & LanceDB Configuration

The VWO Elite Main process uses a hybrid persistence layer combining traditional relational data with high-performance vector storage.

## Core Rules

1. **Centralized SQLite**: All relational data (models, chat, settings) MUST live in `app.db`.
2. **LanceDB for RAG**: Use LanceDB (`knowledge_base.lance`) for vector storage and semantic search.
3. **DatabaseFactory**: Always access databases via `DatabaseFactory` to ensure consistent paths and performance optimizations (WAL mode).

## SQLite (better-sqlite3)

- **Mode**: WAL (Write-Ahead Logging) is enabled for high concurrency.
- **Sync**: `synchronous = NORMAL` for balancing speed and safety.
- **DAO Pattern**: Use Data Access Objects (DAOs) in `apps/main/src/db/` or `apps/main/src/repositories/`.

## LanceDB

- **Vector Size**: Default dimensions are 384 (all-MiniLM-L6-v2).
- **Storage**: Binary vectors + hydrated metadata in `.lance` directory.
- **Querying**: Use the `@lancedb/lancedb` Node.js SDK.

## Maintenance

- **Integrity**: `DocumentRepository.verifyIntegrity()` runs on startup to clean up stalled indexing tasks.
- **Schema Migrations**: Handled within `DatabaseFactory.getSQLite()` via `PRAGMA table_info` checks.
