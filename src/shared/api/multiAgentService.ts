import { BudgetManager } from "./ai-brain/BudgetManager";
import { ContextManager } from "./ai-brain/ContextManager";
import { DataVisualizerAgent } from "./ai-brain/DataVisualizerAgent";
import { DocumentArchitect } from "./ai-brain/DocumentArchitect";
import { aiGenerate } from "./ai-brain/orchestrator";
import { QueryOptimizer } from "./ai-brain/QueryOptimizer";
import { RedTeamGuard } from "./ai-brain/RedTeamGuard";
import { type AcademicSource, ResearchIntegrator } from "./ai-brain/ResearchIntegrator";
import { ValidationGuard } from "./ai-brain/ValidationGuard";
import type {
    AgentPersona,
    DialecticRound,
    ExpertInfluence,
    MultiAgentResponse
} from "./multiAgentTypes";

export { isValidMultiAgentResponse, type MultiAgentResponse } from "./multiAgentTypes";

// --- Types ---
interface AgentInsight {
    agent: string;
    role: string;
    insight: string;
    sources: AcademicSource[];
    success: boolean;
}

export type SessionStatus =
    | { stage: 'initializing'; message: string }
    | { stage: 'researching'; agent: string; message: string }
    | { stage: 'insights'; agent: string; message: string }
    | { stage: 'reviews'; strategy: string; message: string }
    | { stage: 'synthesis'; message: string }
    | { stage: 'visualizing'; message: string }
    | { stage: 'validation'; message: string }
    | { stage: 'security'; message: string }
    | { stage: 'archiving'; message: string }
    | { stage: 'finalizing'; message: string };

// --- Configuration ---
const DEFAULT_PERSONAS: Record<string, AgentPersona> = {
    biologist: { name: "Dr. Bio", role: "Senior Bioloog", expertise: ["ecologie", "genetica", "anatomie"] },
    historian: { name: "Prof. Gist", role: "Historicus", expertise: ["politieke geschiedenis", "oorlogvoering", "sociale archeologie"] },
    mathematician: { name: "Euler Pro", role: "Wiskundige", expertise: ["calculus", "statistiek", "algoritmes"] },
    economist: { name: "Adam S.", role: "Econoom", expertise: ["macro-economie", "marktwerking", "duurzaamheid"] },
    data_scientist: { name: "Dr. Matrix", role: "Data Scientist", expertise: ["machine learning", "data mining", "statistische modellering", "visualisatie"] },
    scientific_researcher: { name: "Dr. Curie", role: "Wetenschappelijk Onderzoeker", expertise: ["methodologie", "peer review", "experimenteel ontwerp", "academisch schrijven"] }
};

// --- Utilities ---
const truncateForContext = (text: string, maxLength = 1000) =>
    text.length > maxLength ? text.substring(0, maxLength) + "...[truncated]" : text;

async function processInBatches<T, R>(
    items: T[],
    batchSize: number,
    fn: (item: T) => Promise<R>
): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        // Elite Optimization: Add jitter to spread the load and avoid 429 errors
        if (i > 0) {
            const jitter = 100 + Math.random() * 200;
            await new Promise(resolve => setTimeout(resolve, jitter));
        }
        const batchResults = await Promise.all(batch.map(fn));
        results.push(...batchResults);
    }
    return results;
}

export class TokenGuard {
    private static readonly COST_PER_INSIGHT = 1500;
    private static readonly SYNTHESIS_BASE = 4000;

    static validate(agentCount: number, limit = 15000) {
        const est = agentCount * this.COST_PER_INSIGHT + this.SYNTHESIS_BASE;
        let strategy: 'FULL_CROSS' | 'CIRCULAR' | 'TRIAGE' | 'ADVERSARIAL_AUDIT' = 'FULL_CROSS';

        if (agentCount > 3) strategy = 'TRIAGE';
        else if (est > limit * 0.8) strategy = 'CIRCULAR';

        return { est, strategy };
    }
}

/**
 * runMultiAgentSession (Optimized & Type-Safe)
 */
export async function* runMultiAgentSession(
    query: string,
    agentKeys: string[],
    options?: {
        sessionId?: string;
        customPersonas?: Record<string, AgentPersona>;
        persistence?: { save: (id: string, data: Record<string, unknown>) => Promise<void> };
        signal?: AbortSignal;
    }
): AsyncGenerator<SessionStatus | MultiAgentResponse> {
    const sessionId = options?.sessionId || `session-${Date.now()}`;
    const personas = { ...DEFAULT_PERSONAS, ...(options?.customPersonas || {}) };

    // Validate Agents
    const activeAgents = agentKeys
        .map(key => personas[key] ? { ...personas[key], key } : null)
        .filter((a): a is AgentPersona & { key: string } => a !== null);

    if (activeAgents.length === 0) throw new Error("Geen geldige experts geselecteerd.");

    // --- STAGE 0: STRATEGY ---
    yield { stage: 'initializing', message: "Strategie optimaliseren..." };
    BudgetManager.initialize(sessionId);
    const history = ContextManager.getHistory(sessionId);
    const optimizedQuery = await QueryOptimizer.optimize(query, history);

    // Initial Strategy Determination
    type ReviewStrategy = 'FULL_CROSS' | 'CIRCULAR' | 'TRIAGE' | 'ADVERSARIAL_AUDIT';
    let strategy: ReviewStrategy = TokenGuard.validate(activeAgents.length).strategy;

    // --- STAGE 1: RESEARCH (BATCHED) ---
    yield { stage: 'researching', agent: 'System', message: "Experts raadplegen bronnen (Batched)..." };

    // Process agents in batches of 3 to respect rate limits
    const rawResults = await processInBatches(activeAgents, 3, async (agentObj) => {
        const { key, ...agent } = agentObj;
        const sources = (await ResearchIntegrator.fetchSources(optimizedQuery, key)) || [];
        const groundedContext = ResearchIntegrator.formatForPrompt(sources);
        try {
            const prompt = `<identity>${agent.name} (${agent.role})</identity>\n<research>${groundedContext}</research>\n<query>${optimizedQuery}</query>`;
            const insight = (await aiGenerate(prompt, { preferQuality: true, signal: options?.signal })) || "[No Insight]";
            BudgetManager.addUsage(sessionId, Math.ceil((prompt.length / 3) * 1.2) + 500); // Elite: Consistent token estimate
            return { agent: agent.name, role: agent.role, insight, sources, success: true } as AgentInsight;
        } catch (e) {
            if (options?.signal?.aborted) throw e;
            console.warn(`[Elite] Expert ${agent.name} failed. Recovery engaged.`, e);
            const fallback = (await aiGenerate(`Simuleer ${agent.role}: ${optimizedQuery}`, { preferFast: true, signal: options?.signal })) || "[No Fallback]";
            return { agent: agent.name, role: agent.role, insight: `[Fallback] ${fallback}`, sources: [], success: true } as AgentInsight;
        }
    });

    // Filter valid insights strictly
    const successfulInsights = rawResults.filter(r => r.success);
    const allSources = successfulInsights.flatMap(r => r.sources);

    if (successfulInsights.length === 0) throw new Error("Critical Failure: Geen expertinzichten verzameld.");

    // --- STAGE 1.5: METRICS & STRATEGY ADJUSTMENT ---
    const influenceMatrix: ExpertInfluence[] = await Promise.all(successfulInsights.map(async (i) => {
        try {
            const scoreStr = await aiGenerate(`Rate relevance 0.0-1.0: Agent ${i.agent} for "${optimizedQuery}"`, { preferFast: true, signal: options?.signal });
            const parsed = parseFloat(scoreStr);
            return { agent: i.agent, score: Number.isNaN(parsed) ? 0.5 : parsed }; // Elite fix: 0.0 is a valid score
        } catch { return { agent: i.agent, score: 0.5 }; }
    }));

    // Diversity Check - Now affects strategy
    const { isDiverse } = ValidationGuard.checkDiversity(successfulInsights);
    if (!isDiverse) {
        console.warn(`[Elite] Low diversity detected. Forcing ADVERSARIAL review strategy.`);
        strategy = 'ADVERSARIAL_AUDIT';
    }

    yield { stage: 'insights', agent: 'System', message: `Inzichten verwerkt. Strategie: ${strategy}` };

    // --- STAGE 2: ADAPTIVE REVIEW ---
    let triageSummary = "";

    // Safe Context Preparation (Pruning)
    const contextSafeInsights = successfulInsights.map(i => ({
        agent: i.agent,
        insight: truncateForContext(i.insight, 1500)
    }));

    if (successfulInsights.length > 1) {
        if (strategy === 'TRIAGE' || strategy === 'ADVERSARIAL_AUDIT') {
            const role = strategy === 'ADVERSARIAL_AUDIT' ? 'Ruthless Critic' : 'Chief Auditor';
            yield { stage: 'reviews', strategy, message: `${role} analyseert conflicten...` };

            triageSummary = await aiGenerate(
                `Rol: ${role}. Analyseer discrepanties:\n${JSON.stringify(contextSafeInsights)}`,
                { preferQuality: true, signal: options?.signal }
            );
        } else {
            // Peer-to-Peer
            yield { stage: 'reviews', strategy, message: `Peer-to-Peer review...` };
            const reviews = await Promise.all(successfulInsights.map(async (reviewer, idx) => {
                const others = strategy === 'CIRCULAR'
                    ? [contextSafeInsights[(idx + 1) % contextSafeInsights.length]]
                    : contextSafeInsights.filter(i => i.agent !== reviewer.agent);
                return await aiGenerate(`Als ${reviewer.agent}, beoordeel: ${JSON.stringify(others)}`, { preferFast: true, signal: options?.signal });
            }));
            triageSummary = reviews.join("\n");
        }
    }

    // --- STAGE 2.5: DIALECTIC SYNTHESIS ---
    // Elite fix: Explicit guard - we know length > 0 from line 157, but be explicit
    const initialInsight = successfulInsights[0];
    if (!initialInsight) throw new Error("Critical: No insights available for synthesis.");

    let currentConsensus = triageSummary || initialInsight.insight;
    let currentCS = 0;
    let previousCS = -1; // Elite fix: Track previous score for early exit
    let iteration = 0;
    const auditTrail: DialecticRound[] = [];
    const consensusHistory = new Set<string>();

    while (currentCS < 0.9 && iteration < 2) {
        // Elite fix: Early exit if no improvement (prevents wasteful loops)
        if (iteration > 0 && currentCS <= previousCS) {
            console.log(`[Elite] Dialectic converged at ${(currentCS * 100).toFixed(1)}% - no improvement.`);
            break;
        }

        if (consensusHistory.has(currentConsensus.substring(0, 100))) break;
        consensusHistory.add(currentConsensus.substring(0, 100));

        previousCS = currentCS;
        iteration++;
        yield { stage: 'reviews', strategy: 'DIALECTIC', message: `Synthese ronde ${iteration}...` };

        const challenges = await aiGenerate(
            `Rol: Critic. Zoek gaten in:\n${truncateForContext(currentConsensus, 2000)}\nGebruik matrix: ${JSON.stringify(influenceMatrix)}`,
            { preferQuality: true, signal: options?.signal }
        );

        const rebuttal = await aiGenerate(
            `Rol: Synthesizer. Verwerk kritiek:\n${truncateForContext(challenges, 1000)}\nin consensus.`,
            { preferQuality: true, signal: options?.signal }
        );

        currentConsensus = rebuttal;

        const audit = await ValidationGuard.calculateConfidence(currentConsensus, successfulInsights, challenges, influenceMatrix);
        currentCS = audit.score;
        auditTrail.push({ challenge: challenges, rebuttal });

        yield { stage: 'validation', message: `Confidence: ${(currentCS * 100).toFixed(1)}%` };
    }

    // --- STAGE 3: OUTPUT GENERATION ---
    yield { stage: 'finalizing', message: "Resultaten verpakken..." };

    const [visualizations, security] = await Promise.all([
        DataVisualizerAgent.generate(currentConsensus), // Vision agents don't support signal yet but are synchronous/fast
        RedTeamGuard.audit(currentConsensus)
    ]);

    if (security.action === 'BLOCK') throw new Error(`SECURITY BLOCK: ${security.threats.join(", ")}`);

    const fullResponse: MultiAgentResponse = {
        consensus: currentConsensus,
        individualInsights: successfulInsights.map(i => ({ agent: i.agent, insight: i.insight })),
        visualizations,
        academicDocument: DocumentArchitect.generate(currentConsensus, allSources, visualizations, {
            title: query,
            agentsUsed: activeAgents.map(a => a.name),
            auditStatus: currentCS > 0.85 ? "GEVALIDEERD" : "GEAUDIT",
            confidenceScore: currentCS,
            auditTrail,
            influenceMatrix
        }),
        securityAudit: security,
        confidenceScore: currentCS,
        auditTrail,
        influenceMatrix
    };

    if (options?.persistence) await options.persistence.save(sessionId, fullResponse as unknown as Record<string, unknown>);

    yield fullResponse;
    return fullResponse;
}
