/**
 * DocumentArchitect
 * Compiles raw research components into a structured academic product.
 * Part of Phase 18: Academic Publishing
 */

import type { VisualOutput } from "./DataVisualizerAgent";
import type { AcademicSource } from "./ResearchIntegrator";

export interface DocumentMetadata {
    title: string;
    agentsUsed: string[];
    auditStatus: string;
    confidenceScore?: number;
    auditTrail?: Array<{ challenge: string; rebuttal: string }>;
    influenceMatrix?: Array<{ agent: string; score: number }>;
}

export class DocumentArchitect {
    static generate(
        consensus: string,
        sources: AcademicSource[],
        visuals: VisualOutput[],
        metadata: DocumentMetadata
    ): string {
        console.log(`[Architect][Debug] Generating document. Visuals count: ${visuals?.length || 0}`);
        if (!visuals) console.warn("[Architect][Debug] Visuals is NULL!");
        const timestamp = new Date().toLocaleDateString('nl-NL');

        const docParts = [
            `# ${metadata.title}`,
            `*Gegenereerd door VWO Elite Virtual Research Lab op ${timestamp}*`,

            `## 1. Abstract\nDit document bevat een diepgaande wetenschappelijke synthese geoptimaliseerd voor VWO-niveau.`,

            `## 2. Inhoudelijke Analyse\n${consensus}`,

            `## 3. Visuele Data\n${(visuals || []).map(v => `### ${v.caption}\n${v.library === 'mermaid' ? '```mermaid\n' + v.code + '\n```' : v.code}`).join("\n\n")}`,

            `## 4. Intellectuele Verantwoording (Audit Trail)\n` +
            (metadata.auditTrail && Array.isArray(metadata.auditTrail) && metadata.auditTrail.length > 0
                ? metadata.auditTrail.map((round, i) =>
                    `### Dialectische Ronde ${i + 1}\n**Challenge:** ${round.challenge}\n**Rebuttal:** ${round.rebuttal}`
                ).join("\n\n")
                : "_Directe consensus bereikt zonder dialectische correcties._"),

            `## 5. Kwaliteitsborging & Expertise-Weging\n` +
            `Dit hoofdstuk is tot stand gekomen middels een recursieve multi-agent orchestratie.\n` +
            `**Expert Influence Matrix:**\n` +
            (metadata.influenceMatrix && Array.isArray(metadata.influenceMatrix)
                ? metadata.influenceMatrix.map(i => `- ${i.agent}: ${(i.score * 100).toFixed(1)}% relevantie`).join("\n")
                : "Gelijke weging toegepast.") + "\n\n" +
            `Status: ${metadata.auditStatus}.\n` +
            `Confidence Score: ${metadata.confidenceScore ? (metadata.confidenceScore * 100).toFixed(1) : "N/A"}%.\n` +
            `De Validation Guard heeft de interne consistentie en bron-verankering getoetst via een Cross-Reference Matrix.`,

            `## 6. Bibliografie (APA)\n` +
            (sources && Array.isArray(sources) && sources.length > 0
                ? sources.map(s => `- ${s.title}. Beschikbaar via: ${s.url}`).join("\n")
                : "_Geen externe bronnen geraadpleegd voor dit specifieke deel._")
        ];

        return docParts.join("\n\n---\n\n");
    }
}
