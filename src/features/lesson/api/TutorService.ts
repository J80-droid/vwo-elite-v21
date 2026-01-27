import { aiGenerate, aiGenerateJSON } from "@shared/api/aiCascadeService";
import { z } from "zod";

const ChallengeSchema = z.object({
    scenario: z.string(),
    misconception: z.string(),
    brokenConfig: z.record(z.string(), z.number()),
    goal: z.string(),
});

export type Challenge = z.infer<typeof ChallengeSchema>;

export const TutorService = {
    /**
     * Generates a "Find the Error" challenge for the student.
     */
    generateChallenge: async (
        context: string,
        componentType: string
    ): Promise<Challenge> => {
        const prompt = `
      Je bent een simulatie-engine voor VWO-onderwijs.
      CONTEXT: ${context}
      TYPE: ${componentType}
      
      OPDRACHT:
      Genereer een "Foutenjacht" uitdaging.
      Doe alsof je een leerling bent die de stof niet helemaal snapt.
      Creëer een configuratie voor de simulatie die *bijna* goed is, maar één cruciale, veelgemaakte conceptuele fout bevat (bijv. wrijving vergeten, massa irrelevant gemaakt, verkeerde richting).
      
      Geef terug in JSON formaat:
      1. scenario: Een scenario beschrijving.
      2. brokenConfig: De foutieve parameters (zorg dat deze past in het schema van de component).
      3. goal: Wat moet de student bereiken?
      4. misconception: Interne notitie voor de AI: "Verwarring massa vs gewicht"
    `;

        try {
            const challenge = await aiGenerateJSON<Challenge>(prompt, "Je bent een expert VWO-docent.", {
                temperature: 0.7, // Creative mistakes
            });
            return ChallengeSchema.parse(challenge);
        } catch (error) {
            console.error("Failed to generate challenge:", error);
            throw error;
        }
    },

    /**
     * Analyzes the student's interaction and provides Socratic feedback.
     */
    analyzeInteraction: async (
        context: string,
        studentState: Record<string, number>,
        componentType: string,
        isChallengeSubmission: boolean = false
    ): Promise<string> => {
        // Note: LanceDB retrieval would go here via IPC in a full backend implementation.
        // For now, we rely on the context passed in (which might already be enriched).

        const checkType = isChallengeSubmission ? "CHALLENGE OPLOSSING REVIEW" : "REGULIERE BEGELEIDING";

        const systemPrompt = `
      Je bent een expert VWO-docent (Natuurkunde/Economie). Je doel is NIET om het antwoord te geven, maar om het mentale model van de student te corrigeren via "Guided Discovery".

      CONTEXT VAN DE LES:
      ${context}

      MODUS: ${checkType}
      TYPE OEFENING: ${componentType}

      HUIDIGE STATUS VAN DE STUDENT (Simulatie Parameters):
      ${JSON.stringify(studentState, null, 2)}

      INSTRUCTIES:
      1. Analyseer of de ingestelde parameters natuurkundig/economisch logisch zijn gezien de context.
      2. Als de staat FOUT of ONLOGISCH is:
         - Geef NIET de oplossing.
         - Stel een kritische vraag die de student dwingt naar een specifieke parameter te kijken.
         - Voorbeeld: "Ik zie dat je de wrijving op 0 hebt gezet. Wat betekent dat voor de remweg in de echte wereld?"
      3. Als de staat CORRECT is:
         - Bevestig kort.
         - Geef een verdiepende uitdaging ("Wat als je nu de massa verdubbelt?").
      4. Houd de toon bemoedigend maar scherp. Maximaal 3 zinnen.
      5. Antwoord in de taal van de context (Nederlands).
    `;

        try {
            const response = await aiGenerate("Analyseer mijn huidige opstelling.", {
                systemPrompt,
                temperature: 0.3, // Consistent feedback
                maxTokens: 150,
            });
            return response;
        } catch (error) {
            console.error("Tutor analysis failed:", error);
            return "Ik kan je opstelling even niet analyseren. Probeer het opnieuw.";
        }
    },
};
