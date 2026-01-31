/**
 * MCP Orchestrator
 * Manages the tool registry and selection for AI tasks
 */

import { pythonSandbox } from "@shared/lib/pythonSandbox";
import { useMcpToolStore } from "@shared/model/mcpToolStore";

import type { MCPTool } from "../../types/ai-brain";

export class MCPOrchestrator {
  private toolsCache: MCPTool[] | null = null;

  /**
   * Get all enabled tools from the registry
   */
  async getEnabledTools(): Promise<MCPTool[]> {
    if (this.toolsCache) return this.toolsCache;

    try {
      // Use the store to get tools instead of direct sqliteSelect
      const storeTools = useMcpToolStore.getState().tools;
      this.toolsCache = storeTools.filter(tool => tool.enabled) as unknown as MCPTool[];
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
   * Select relevant tools for a user query using weighted matching and negative keywords.
   */
  async selectToolsForQuery(query: string): Promise<MCPTool[]> {
    try {
      const allTools = await this.getEnabledTools();
      const lowerQuery = query.toLowerCase();

      // 🚀 ELITE FIX: Weighted Matching + Negative Keywords
      const scored = allTools.map(tool => {
        let score = 0;
        const toolName = tool.name.toLowerCase();
        const toolDesc = tool.description.toLowerCase();
        const toolCat = tool.category?.toLowerCase() || "";

        // 1. Check for negative constraints (e.g., "geen code", "no tools")
        // If the query contains "geen [toolnaam]" or "no [toolname]", penalize heavily
        const negativeKeywords = ["geen", "no", "don't", "avoid", "zonder"];
        const isExcluded = negativeKeywords.some(nk => {
          const pattern = new RegExp(`${nk}\\s+${toolName}`, 'i');
          return pattern.test(lowerQuery) || (nk === "geen" && lowerQuery.includes(`geen ${toolCat}`));
        });

        if (isExcluded) return { tool, score: -100 };

        // 2. High-precision matches (Exact name or category)
        if (lowerQuery.includes(toolName)) score += 10;
        if (toolCat && lowerQuery.includes(toolCat)) score += 5;

        // 🚀 ELITE DISCOVERY: Broad keywords
        if (lowerQuery.includes("tool") || lowerQuery.includes("mcp") || lowerQuery.includes("functies")) score += 2;

        // 3. Keyword/Description matching
        const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 3);
        for (const qw of queryWords) {
          if (toolDesc.includes(qw)) score += 2;
          if (toolName.includes(qw)) score += 3;
        }

        return { tool, score };
      });

      // Filter out excluded tools and low-relevance tools, then sort by score
      const relevant = scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score);

      if (relevant.length > 0) {
        return relevant.map(r => r.tool);
      }

      // Fallback: return general tools if it doesn't look like an exclusion request
      if (lowerQuery.includes("geen") || lowerQuery.includes("no tools")) return [];
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
    query?: string,
  ): Promise<Array<{ name: string; description: string; parameters: Record<string, unknown> }>> {
    const tools = await (query
      ? this.selectToolsForQuery(query)
      : this.getEnabledTools());

    // 🚀 ELITE BUILT-IN: Always include Python Interpreter if enabled
    const pythonTool: MCPTool = {
      id: "built_in_python",
      name: "python_interpreter",
      description: "Beveiligde Python omgeving. Gebruik voor: wiskunde, data-analyse, plots (matplotlib), of logische puzzels. Output bevat stdout en afbeeldingen.",
      enabled: true,
      category: "Engineering",
      parametersSchema: {
        type: "object",
        properties: {
          code: { type: "string", description: "De Python code om uit te voeren." }
        },
        required: ["code"]
      },
      executionType: "internal", // Assuming internal execution for built-in
      usageCount: 0,
      requiresApproval: false
    };

    if (!tools.some(t => t.name === "python_interpreter")) {
      tools.push(pythonTool);
    }

    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters:
        typeof tool.parametersSchema === "string"
          ? JSON.parse(tool.parametersSchema)
          : tool.parametersSchema,
    }));
  }

  /**
   * Elite local tool execution bridge
   * Delegates to pythonSandbox for built-ins, and ToolRegistry for all others.
   */
  async executeLocalTool(name: string, args: Record<string, unknown>): Promise<void | unknown> {
    if (name === "python_interpreter") {
      return await pythonSandbox.execute(args.code as string);
    }

    // 🚀 ELITE DELEGATION: Universal Registry Bridge
    const { getToolRegistry } = await import("./ToolRegistry");
    const registry = getToolRegistry();
    if (registry.has(name)) {
      return await registry.get(name)!.execute(args);
    }

    throw new Error(`Local tool ${name} not implemented in Universal Engine or Registry.`);
  }
}

let mcpOrchestratorInstance: MCPOrchestrator | null = null;

export const getMCPOrchestrator = (): MCPOrchestrator => {
  if (!mcpOrchestratorInstance) {
    mcpOrchestratorInstance = new MCPOrchestrator();
  }
  return mcpOrchestratorInstance;
};
