
export interface SecurityAudit {
    passed: boolean;
    threats: string[];
    action: 'ALLOW' | 'BLOCK' | 'WARN';
}

export interface VisualOutput {
    type: 'chart' | 'diagram' | 'timeline' | 'table';
    library: 'mermaid' | 'chartjs' | 'markdown';
    code: string;
    caption: string;
}

export interface AgentPersona {
    name: string;
    role: string;
    expertise: string[];
}

export interface DialecticRound {
    challenge: string;
    rebuttal: string;
}

export interface ExpertInfluence {
    agent: string;
    score: number;
}

export interface MultiAgentResponse {
    consensus: string;
    individualInsights: Array<{ agent: string; insight: string }>;
    visualizations: VisualOutput[];
    academicDocument: string;
    securityAudit?: SecurityAudit;
    confidenceScore: number;
    auditTrail: DialecticRound[];
    influenceMatrix: ExpertInfluence[];
}

export function isValidMultiAgentResponse(value: unknown): value is MultiAgentResponse {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return 'consensus' in v && Array.isArray(v.individualInsights);
}
