import { aiGenerate } from "./orchestrator";

export interface ValidationResult {
    isValid: boolean;
    consistencyScore: number; // 0 to 1
    discrepancies: string[];
    action: 'APPROVE' | 'REVISE' | 'FLAG';
}

/**
 * ValidationGuard
 * Audits the final consensus against expert insights to ensure logical integrity.
 * Part of Phase 15: High Availability & QA
 */
export class ValidationGuard {
    /**
     * Sharpened Audit (Phase 20)
     * Performs a cross-reference matrix check for deep dialectical validation.
     */
    static async calculateConfidence(
        consensus: string,
        insights: Array<{ agent: string, insight: string }>,
        challenges: string,
        influenceMatrix?: Array<{ agent: string, score: number }>
    ): Promise<{ score: number, discrepancies: string[] }> {
        const auditPrompt = `
            Jij bent de 'Scientific Integrity Officer'. Bereken de Confidence Score (0.0 - 1.0).
            
            EXPERTS: ${JSON.stringify(insights)}
            INFLUENCE: ${JSON.stringify(influenceMatrix || "Equal weight")}
            UITDAGINGEN: ${challenges}
            SYNHESE: ${consensus}
            
            CHECKLIST:
            1. Source Anchoring: Zijn alle claims herleidbaar?
            2. Expert Alignment: Worden de meest relevante experts (hoogste influence) gevolgd?
            3. Challenge Rebuttal: Zijn kritieke punten beantwoord?
            
            Output MOET in JSON:
            {
                "score": 0.85,
                "discrepancies": ["Lijst met zwakke plekken"]
            }
        `;

        try {
            const response = await aiGenerate(auditPrompt, { preferFast: true });
            const jsonStr = response.match(/\{[\s\S]*\}/)?.[0] || '{"score": 0.5, "discrepancies": ["Audit error"]}';
            const result = JSON.parse(jsonStr);
            return {
                score: result.score || 0.5,
                discrepancies: result.discrepancies || []
            };
        } catch {
            return { score: 0.5, discrepancies: ["Score computation failed"] };
        }
    }

    static async validate(
        query: string,
        consensus: string,
        insights: Array<{ agent: string, insight: string }>
    ): Promise<ValidationResult> {

        const validationPrompt = `
            Jij bent de 'Elite Intelligence Auditor'. Controleer de SYNTHESE tegen de EXPERT INZICHTEN voor de vraag: "${query}"
            
            EXPERT INZICHTEN:
            ${(insights || []).map(i => `[Expert: ${i.agent}]: ${i.insight}`).join("\n")}
            
            GEGENEREERDE SYNTHESE (CONSENSUS):
            ${consensus}
            
            JOUW TAAK:
            1. Identificeer tegenstrijdigheden (bijv. Expert zegt 'duurzaam', Synthese zegt 'niet duurzaam').
            2. Check op 'Hallucinated Consensus' (claims die door geen enkele expert zijn gemaakt).
            3. Beoordeel of het 'Elite Advies' daadwerkelijk gefundeerd is op de expert-data.
            
            Output MOET in valide JSON formaat zijn:
            {
                "consistencyScore": 0.0 tot 1.0,
                "discrepancies": ["lijst met fouten"],
                "action": "APPROVE" | "REVISE" | "FLAG"
            }
        `;

        try {
            const response = await aiGenerate(validationPrompt, { preferQuality: true });
            // Simple JSON extractor
            const jsonStr = response.match(/\{[\s\S]*\}/)?.[0] || '{"consistencyScore": 0.5, "discrepancies": ["JSON Parse Error"], "action": "FLAG"}';
            const result = JSON.parse(jsonStr);

            return {
                isValid: result.consistencyScore > 0.85,
                consistencyScore: result.consistencyScore,
                discrepancies: result.discrepancies || [],
                action: result.action || 'FLAG'
            };
        } catch (e) {
            console.error("[ValidationGuard] Audit failed:", e);
            return {
                isValid: false,
                consistencyScore: 0,
                discrepancies: ["Audit service error"],
                action: 'FLAG'
            };
        }
    }

    /**
     * Diversity Check (Audit Remediation)
     * Detects 'Echo Chambers' by measuring semantic overlap.
     * If overlap is too high, it signals for a 'Devil's Advocate' intervention.
     */
    static checkDiversity(insights: Array<{ agent: string, insight: string }>): { isDiverse: boolean; similarityScore: number } {
        if (insights.length < 2) return { isDiverse: true, similarityScore: 0 };

        // Simple heuristic: overlapping keywords and length similarity
        // In production, this would use embeddings.
        let totalSim = 0;
        let pairs = 0;

        for (let i = 0; i < insights.length; i++) {
            for (let j = i + 1; j < insights.length; j++) {
                const textA = insights[i]!.insight.toLowerCase();
                const textB = insights[j]!.insight.toLowerCase();

                const wordsA = new Set(textA.split(/\W+/));
                const wordsB = new Set(textB.split(/\W+/));
                const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));

                const similarity = intersection.size / Math.max(wordsA.size, wordsB.size);
                totalSim += similarity;
                pairs++;
            }
        }

        const avgSimilarity = totalSim / pairs;
        return {
            isDiverse: avgSimilarity < 0.85,
            similarityScore: avgSimilarity
        };
    }
}
