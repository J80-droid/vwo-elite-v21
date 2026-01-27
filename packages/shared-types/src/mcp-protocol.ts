/**
 * MCP Protocol Standards
 * Universal interfaces for the VWO Elite tool system
 */

export interface ToolResponse<T = unknown> {
    success: boolean;
    data: T | null;
    error?: string;
    metadata: {
        durationMs: number;
        toolName: string;
        timestamp: number;
        category?: string;
    };
}

export interface PaginationParams {
    limit?: number;
    offset?: number;
}

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, unknown>; // JSON Schema
    category?: string;
    requiresApproval?: boolean;
}
