import type { VisualOutput } from "../multiAgentTypes";
import { aiGenerate } from "./orchestrator";

/**
 * DataVisualizerAgent
 * Transforms technical consensus into visual infographics.
 * Part of Phase 17: Visual Intelligence
 */
export class DataVisualizerAgent {
    static async generate(consensus: string): Promise<VisualOutput[]> {
        const visualPrompt = `
            Jij bent de 'Elite Data Analyst'. Analyseer de volgende wetenschappelijke consensus op data die visueel gemaakt kan worden.
            
            SOORTEN VISUALISATIE:
            1. Mermaid.js Flowchart (voor processen of oorzaak-gevolg).
            2. Mermaid.js Timeline (voor historische ontwikkelingen).
            3. Markdown Table (voor vergelijkingen of numerieke data).
            
            DATA OM TE ANALYSEREN:
            "${consensus}"
            
            TAAK:
            Genereer maximaal 2 relevante visualisaties in JSON formaat.
            Output MOET exact dit formaat zijn:
            {
                "visualizations": [
                    {
                        "type": "chart" | "diagram" | "timeline" | "table",
                        "library": "mermaid" | "markdown",
                        "code": "DE_CODE_HIER",
                        "caption": "Korte beschrijving van de visual"
                    }
                ]
            }
        `;

        try {
            const response = await aiGenerate(visualPrompt, { preferQuality: true });
            const jsonStr = response.match(/\{[\s\S]*\}/)?.[0] || '{"visualizations": []}';
            const parsed = JSON.parse(jsonStr);
            return parsed.visualizations || [];
        } catch (e) {
            console.error("[DataVisualizer] Failed to generate visuals:", e);
            return [];
        }
    }
}
