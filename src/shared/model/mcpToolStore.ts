import { removeToolFromVectorIndex,syncToolToVectorIndex } from "@shared/api/ai-brain/vectorService";
import { sqliteDelete, sqliteInsert,sqliteSelect, sqliteUpdate } from "@shared/api/sqliteService";
import { createStore } from "@shared/lib/storeFactory";
import { toast } from "sonner";

export interface MCPToolState {
  id: string;
  name: string;
  description: string;
  parameters_schema: string;
  handler_code?: string;
  category?: string;
  enabled: boolean;
  requiresApproval: boolean;
  usageCount: number;
}

interface MCPToolStore {
  tools: MCPToolState[];
  isLoading: boolean;
  fetchTools: () => Promise<void>;
  toggleTool: (id: string, enabled: boolean) => Promise<void>;
  addTool: (tool: Partial<MCPToolState>) => Promise<void>;
  updateTool: (id: string, updates: Partial<MCPToolState>) => Promise<void>;
  deleteTool: (id: string) => Promise<void>;
}

export const useMcpToolStore = createStore<MCPToolStore>(
  (set, get) => ({
    tools: [],
    isLoading: false,

    fetchTools: async () => {
      set({ isLoading: true });
      try {
        const rows = await sqliteSelect<{
          id: string;
          name: string;
          description: string;
          parameters_schema: string;
          handler_code?: string;
          category?: string;
          enabled: number;
          requires_approval?: number;
        }>("mcp_tools");

        const usageRows = await sqliteSelect<{ tool_name: string }>(
          "mcp_tool_usage_logs",
        );

        const tools = rows.map((row) => {
          const usage = usageRows.filter((l) => l.tool_name === row.name).length;
          return {
            id: row.id,
            name: row.name,
            description: row.description,
            parameters_schema: row.parameters_schema,
            handler_code: row.handler_code,
            category: row.category,
            enabled: row.enabled === 1,
            requiresApproval: row.requires_approval === 1,
            usageCount: usage,
          };
        });

        set({ tools, isLoading: false });
      } catch (error: unknown) {
        console.error("Failed to fetch MCP tools:", error);
        set({ isLoading: false });
      }
    },

    toggleTool: async (id: string, enabled: boolean) => {
      try {
        await sqliteUpdate(
          "mcp_tools",
          { enabled: enabled ? 1 : 0 },
          "id = ?",
          [id],
        );

        const tools = get().tools.map((t) =>
          t.id === id ? { ...t, enabled } : t,
        );

        set({ tools });
        toast.success(`${enabled ? "Enabled" : "Disabled"} tool successfully.`);
      } catch {
        toast.error("Failed to update tool status.");
      }
    },

    addTool: async (toolData) => {
      const id = crypto.randomUUID();
      const newToolDbObject = {
        id,
        name: toolData.name || "new_tool",
        description: toolData.description || "",
        parameters_schema:
          toolData.parameters_schema ||
          JSON.stringify({ type: "object", properties: {} }),
        handler_code:
          toolData.handler_code ||
          "return { success: true, message: 'Tool executed' };",
        category: toolData.category || "General",
        execution_type: "internal",
        enabled: 1,
        requires_approval: toolData.requiresApproval ? 1 : 0,
      };

      try {
        await sqliteInsert("mcp_tools", newToolDbObject);

        // Sync to Vector Index (Elite Discovery)
        await syncToolToVectorIndex({
          id,
          name: newToolDbObject.name,
          description: newToolDbObject.description,
          category: newToolDbObject.category,
        });

        const tools = [
          ...get().tools,
          {
            ...newToolDbObject,
            enabled: true,
            requiresApproval: Boolean(newToolDbObject.requires_approval),
            usageCount: 0,
          },
        ];

        set({ tools });
        toast.success("Tool added successfully.");
      } catch (error) {
        console.error("Failed to add tool:", error);
        toast.error("Failed to add tool.");
      }
    },

    updateTool: async (id, updates) => {
      try {
        const dbUpdates: Record<string, string | number | boolean> = {
          ...updates,
        };
        if (updates.enabled !== undefined)
          dbUpdates.enabled = updates.enabled ? 1 : 0;

        await sqliteUpdate("mcp_tools", dbUpdates, "id = ?", [id]);

        const tools = get().tools.map((t) =>
          t.id === id ? { ...t, ...updates } : t,
        );

        set({ tools });

        // Sync to Vector Index if relevant fields changed
        if (updates.name || updates.description || updates.category) {
          const updatedTool = tools.find((t) => t.id === id);
          if (updatedTool) {
            await syncToolToVectorIndex({
              id,
              name: updatedTool.name,
              description: updatedTool.description,
              category: updatedTool.category || "General",
            });
          }
        }

        toast.success("Tool updated successfully.");
      } catch {
        toast.error("Failed to update tool.");
      }
    },

    deleteTool: async (id) => {
      try {
        await sqliteDelete("mcp_tools", "id = ?", [id]);

        // Remove from Vector Index
        await removeToolFromVectorIndex(id);

        const tools = get().tools.filter((t) => t.id !== id);
        set({ tools });
        toast.success("Tool deleted successfully.");
      } catch {
        toast.error("Failed to delete tool.");
      }
    },
  }),
  {
    name: "mcp-tools",
    persist: false,
  }
);
