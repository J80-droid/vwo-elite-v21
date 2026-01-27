import { DatabaseFactory } from "../infrastructure/database/database.factory";

interface RawModelRow {
  id: string;
  name: string;
  provider: string;
  model_id: string;
  endpoint: string | null;
  api_key_id: string | null;
  local_path: string | null;
  capabilities: string | null;
  enabled: number;
  priority: number;
  metrics: string | null;
  requirements: string | null;
  created_at: number;
  last_used_at: number | null;
}

/**
 * Migration Helper: Previously this file managed its own connection.
 * We now delegate to the central DatabaseFactory for consistency.
 */
export function getMainDb() {
  return DatabaseFactory.getSQLite();
}

/** Legacy export for backward compatibility */
export function initMainDb() {
  return DatabaseFactory.getSQLite();
}

// DAO for AI Models
export const aiModelDao = {
  getAll: () => {
    const rows = DatabaseFactory.getSQLite()
      .prepare("SELECT * FROM ai_models")
      .all() as RawModelRow[];
    return rows.map((row) => ({
      ...row,
      modelId: row.model_id,
      capabilities: JSON.parse(row.capabilities || "[]"),
      metrics: JSON.parse(row.metrics || "{}"),
      requirements: JSON.parse(row.requirements || "{}"),
      enabled: Boolean(row.enabled),
      createdAt: row.created_at,
      lastUsedAt: row.last_used_at,
    }));
  },

  get: (id: string) => {
    const row = DatabaseFactory.getSQLite()
      .prepare("SELECT * FROM ai_models WHERE id = ? OR model_id = ?")
      .get(id, id) as RawModelRow | undefined;
    if (!row) return undefined;
    return {
      ...row,
      modelId: row.model_id,
      capabilities: JSON.parse(row.capabilities || "[]"),
      metrics: JSON.parse(row.metrics || "{}"),
      requirements: JSON.parse(row.requirements || "{}"),
      enabled: Boolean(row.enabled),
      createdAt: row.created_at,
      lastUsedAt: row.last_used_at,
    };
  },

  upsert: (model: {
    id: string;
    name: string;
    provider: string;
    modelId: string;
    endpoint?: string;
    apiKeyId?: string;
    localPath?: string;
    capabilities?: string[];
    enabled?: boolean;
    priority?: number;
    metrics?: Record<string, unknown>;
    requirements?: Record<string, unknown>;
    createdAt?: number;
    lastUsedAt?: number;
  }) => {
    const stmt = DatabaseFactory.getSQLite().prepare(`
      INSERT OR REPLACE INTO ai_models 
      (id, name, provider, model_id, endpoint, api_key_id, local_path, capabilities, enabled, priority, metrics, requirements, created_at, last_used_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      model.id,
      model.name,
      model.provider,
      model.modelId,
      model.endpoint || null,
      model.apiKeyId || null,
      model.localPath || null,
      JSON.stringify(model.capabilities || []),
      model.enabled ? 1 : 0,
      model.priority || 50,
      JSON.stringify(model.metrics || {}),
      JSON.stringify(model.requirements || {}),
      model.createdAt || Date.now(),
      model.lastUsedAt || null,
    );
  },
};
