import { aiGenerate } from "./orchestrator";

/**
 * QueryOptimizer
 * Transforms vague student queries into high-fidelity research prompts
 * Part of Phase 14: Enterprise Agentic Hardening
 */
export class QueryOptimizer {
    static async optimize(originalQuery: string, history?: string): Promise<string> {
        const optimizationPrompt = `
      Jij bent een Senior Research Consultant voor VWO Elite. Je krijgt een ruwe vraag van een student.
      Je taak is om deze vraag te transformeren naar een 'High-Fidelity' prompt voor een team van wetenschappelijke experts.
      
      ORIGINELE VRAAG: "${originalQuery}"
      ${history ? `\nCONTEXT UIT VORIGE GESPREKKEN:\n${history}` : ""}
      
      DOELSTELLINGEN:
      1. Verduidelijk de kernvraag (verwijder vaagheid).
      2. Voeg academische kaders toe (bijv. vergelijkend onderzoek, ethische implicaties).
      3. Specificeer de gewenste diepgang (VWO Elite niveau: analytisch, niet beschrijvend).
      4. Definieer de context (PWS/wetenschappelijk kader).

      Output ALLEEN de verbeterde, uitgebreide vraagstelling in het Nederlands. Geef geen inleiding of uitleg.
    `;

        try {
            // Use 'preferFast' as this is a meta-optimization step
            const optimized = await aiGenerate(optimizationPrompt, { preferFast: true });
            return optimized || originalQuery;
        } catch (e) {
            console.warn("[QueryOptimizer] Optimalisatie gefaald, gebruik originele query:", e);
            return originalQuery;
        }
    }

    /**
     * Generates a falsification query for the Adversarial Critic
     */
    static async generateCounterQuery(consensus: string): Promise<string> {
        const prompt = `
            Jij bent de 'Falsification Specialist'. Hieronder staat een wetenschappelijke consensus.
            Genereer énkel een zoekopdracht die specifiek op zoek gaat naar bewijs dat deze claims weerspreekt of nuanceert.
            
            CONSENSUS: "${consensus}"
            
            OUTPUT: Een scherpe zoekterm voor Google Scholar of ArXiv.
        `;
        try {
            return await aiGenerate(prompt, { preferFast: true });
        } catch {
            return `limitations of ${consensus.substring(0, 50)}`;
        }
    }
}
