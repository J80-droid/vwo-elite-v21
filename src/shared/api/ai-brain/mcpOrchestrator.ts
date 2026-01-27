/**
 * MCP Orchestrator
 * Manages the tool registry and selection for AI tasks
 */

import type { MCPTool } from "../../types/ai-brain";
import { sqliteSelect } from "../sqliteService";

export class MCPOrchestrator {
  private toolsCache: MCPTool[] | null = null;

  /**
   * Get all enabled tools from the registry
   */
  async getEnabledTools(): Promise<MCPTool[]> {
    if (this.toolsCache) return this.toolsCache;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = await sqliteSelect<any>("mcp_tools", "enabled = 1");
      this.toolsCache = rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        parametersSchema:
          typeof row.parameters_schema === "string"
            ? JSON.parse(row.parameters_schema)
            : row.parameters_schema,
        executionType: row.execution_type,
        endpointUrl: row.endpoint_url || undefined,
        requiresAuth: row.requires_auth === 1,
        requiresApproval: row.requires_approval === 1,
        enabled: row.enabled === 1,
        category: row.category || undefined,
      }));
      return this.toolsCache!;
    } catch (error) {
      console.error("[MCPOrchestrator] Failed to fetch tools:", error);
      return [];
    }
  }

  /**
   * Clear registry cache (e.g. after database update)
   */
  clearCache() {
    this.toolsCache = null;
  }

  /**
   * Select relevant tools for a user query using LanceDB semantic search
   */
  async selectToolsForQuery(query: string): Promise<MCPTool[]> {
    try {
      // LanceDB is a native module that only works in main process.
      // In renderer, we must use keyword fallback or IPC.
      // For now, use enhanced keyword matching until IPC bridge is set up.
      const allTools = await this.getEnabledTools();
      const lowerQuery = query.toLowerCase();

      // Enhanced keyword matching with fuzzy logic
      const scored = allTools.map(tool => {
        const keywords = [
          tool.name.toLowerCase(),
          tool.description.toLowerCase(),
          tool.category?.toLowerCase() || ""
        ];
        let score = 0;
        for (const kw of keywords) {
          if (lowerQuery.includes(kw) || kw.includes(lowerQuery)) score += 2;
          // Partial word matching
          const queryWords = lowerQuery.split(/\s+/);
          const kwWords = kw.split(/\s+/);
          for (const qw of queryWords) {
            if (kwWords.some(k => k.includes(qw) || qw.includes(k))) score += 1;
          }
        }
        return { tool, score };
      });

      // Return tools with score > 0, sorted by score descending
      const relevant = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);
      if (relevant.length > 0) {
        return relevant.map(r => r.tool);
      }

      // Fallback: return general tools
      return allTools.filter(tool => tool.category === "General").slice(0, 5);
    } catch (error) {
      console.warn("[MCPOrchestrator] Tool selection failed:", error);
      return [];
    }
  }

  /**
   * Get tool definitions in the format expected by model providers (e.g. Gemini)
   */
  async getToolDefinitionsForLLM(
    query: string,
  ): Promise<Record<string, unknown>[]> {
    const relevantTools = await this.selectToolsForQuery(query);

    return relevantTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parametersSchema,
    }));
  }
}

let mcpOrchestratorInstance: MCPOrchestrator | null = null;

export const getMCPOrchestrator = (): MCPOrchestrator => {
  if (!mcpOrchestratorInstance) {
    mcpOrchestratorInstance = new MCPOrchestrator();
  }
  return mcpOrchestratorInstance;
};
