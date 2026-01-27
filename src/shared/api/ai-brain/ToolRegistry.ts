import { z } from "zod";

/**
 * Contract: Every tool must implement this interface
 */
export interface IToolHandler {
    name: string;
    category: string;
    description: string;
    schema?: z.ZodSchema;
    execute(params: Record<string, unknown>): Promise<unknown>;
}

/**
 * ToolRegistry - Central administration for all tools
 * Implements Singleton pattern for global access
 */
export class ToolRegistry {
    private static instance: ToolRegistry;
    private tools: Map<string, IToolHandler> = new Map();

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
    register(tool: IToolHandler): void {
        if (this.tools.has(tool.name)) {
            console.warn(`[Registry] Overwriting existing tool: ${tool.name}`);
        }
        this.tools.set(tool.name, tool);
        console.log(`[Registry] Registered tool: ${tool.name} [${tool.category}]`);
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
     * Get a tool by name
     */
    get(name: string): IToolHandler | undefined {
        return this.tools.get(name);
    }

    /**
     * Check if a tool exists
     */
    has(name: string): boolean {
        return this.tools.has(name);
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
    }
}

// Convenience function
export const getToolRegistry = (): ToolRegistry => ToolRegistry.getInstance();
