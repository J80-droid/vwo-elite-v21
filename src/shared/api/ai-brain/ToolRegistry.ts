import { z } from "zod";

/**
 * Contract: Every tool must implement this interface
 */
export interface IToolHandler {
    name: string;
    category: string;
    description: string;
    schema?: z.ZodSchema;
    parametersSchema?: Record<string, unknown>;
    execute(params: Record<string, unknown>): Promise<unknown>;
}

/**
 * ToolRegistry - Central administration for all tools
 * Implements Singleton pattern for global access
 */
export class ToolRegistry {
    private static instance: ToolRegistry;
    private tools: Map<string, IToolHandler> = new Map();
    private aliases: Map<string, string> = new Map();

    private constructor() { }

    static getInstance(): ToolRegistry {
        if (!this.instance) {
            this.instance = new ToolRegistry();
        }
        return this.instance;
    }

    /**
     * Register a new tool (at runtime or startup)
     */
    register(tool: IToolHandler, aliases?: string[]): void {
        if (this.tools.has(tool.name)) {
            console.warn(`[Registry] Overwriting existing tool: ${tool.name}`);
        }
        this.tools.set(tool.name, tool);

        if (aliases) {
            for (const alias of aliases) {
                this.aliases.set(alias, tool.name);
            }
        }

        console.log(`[Registry] Registered tool: ${tool.name} [${tool.category}]${aliases ? ` (aliases: ${aliases.join(', ')})` : ''}`);
    }

    /**
     * Register multiple tools at once
     */
    registerAll(tools: IToolHandler[]): void {
        for (const tool of tools) {
            this.register(tool);
        }
    }

    /**
     * Get a tool by name (with Alias and Fuzzy support)
     */
    get(name: string): IToolHandler | undefined {
        const toolName = this.aliases.get(name) || name;
        const tool = this.tools.get(toolName);

        if (!tool) {
            const suggestion = this.findSuggestion(name);
            if (suggestion) {
                console.info(`[Registry] Tool "${name}" not found. Did you mean "${suggestion}"?`);
            }
        }

        return tool;
    }

    /**
     * Find a similar tool name if a lookup fails
     */
    private findSuggestion(name: string): string | null {
        const keys = Array.from(this.tools.keys());
        const lowerName = name.toLowerCase();

        // Simple heuristic: startsWith or includes
        const match = keys.find(k => k.toLowerCase().startsWith(lowerName) || lowerName.startsWith(k.toLowerCase()) || k.toLowerCase().includes(lowerName));
        return match || null;
    }

    /**
     * Check if a tool exists
     */
    has(name: string): boolean {
        return this.tools.has(name) || this.aliases.has(name);
    }

    /**
     * Get all tool definitions (for Orchestrator discovery)
     */
    getAllDefinitions(): Array<{ name: string; category: string; description: string }> {
        return Array.from(this.tools.values()).map(t => ({
            name: t.name,
            category: t.category,
            description: t.description
        }));
    }

    /**
     * Get all tool handlers
     */
    getAllTools(): IToolHandler[] {
        return Array.from(this.tools.values());
    }

    /**
     * Get tools by category
     */
    getByCategory(category: string): IToolHandler[] {
        return Array.from(this.tools.values()).filter(t => t.category === category);
    }

    /**
     * Get total number of registered tools
     */
    get size(): number {
        return this.tools.size;
    }

    /**
     * Clear all registered tools (useful for testing)
     */
    clear(): void {
        this.tools.clear();
        this.aliases.clear();
    }
}

// Convenience function
export const getToolRegistry = (): ToolRegistry => ToolRegistry.getInstance();
