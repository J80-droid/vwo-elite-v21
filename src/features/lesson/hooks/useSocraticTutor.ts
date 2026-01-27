import { aiGenerate } from "@shared/api/aiCascadeService";
import { useSettings } from "@shared/hooks/useSettings";
import { InteractiveComponentSchema } from "@shared/types/lesson.schema";
import { useCallback, useState } from 'react';
import { z } from "zod";

type InteractiveComponent = z.infer<typeof InteractiveComponentSchema>;

interface TutorProps {
    context: string;
    studentState: InteractiveComponent['config'];
}

export const useSocraticTutor = () => {
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isThinking, setIsThinking] = useState(false);
    const { settings } = useSettings();

    const analyzeModel = useCallback(async (data: TutorProps) => {
        setIsThinking(true);
        setFeedback(null);

        // Fetch Active Persona from settings
        const persona = settings?.ai?.activePersona;
        const personaInstruction = persona
            ? `ROLE: ${persona.roleDefinition}\nSTYLE: ${persona.didacticRules}`
            : "ROLE: Socratic Tutor. Ask guiding questions. Never give the answer directly.";

        const prompt = `
            ${personaInstruction}

            CONTEXT: The student is studying the following material (excerpt): 
            "${data.context.substring(0, 1000)}..."
            
            CURRENT INTERACTIVE STATE:
            ${JSON.stringify(data.studentState, null, 2)}
            
            PEDAGOGICAL TASK:
            Analyze the student's current configuration/simulation/map against the theoretical concepts.
            
            RULES:
            1. If the configuration contradicts the theory (e.g. high supply but high price, or wrong gravity vector), ask a SPECIFIC guiding question.
            2. Do NOT explain the error. Ask "What would happen if...?" or "Look closely at..."
            3. If the state is correct, offer a "What if" challenge to deepen understanding.
            4. STRICT LENGTH LIMIT: Maximum 2 sentences.
            5. LANGUAGE: Respond in the same language as the Context text (likely Dutch or English).
        `;

        try {
            const response = await aiGenerate(prompt, {
                systemPrompt: "You are an intelligent tutor observing a student's simulation.",
                aiConfig: settings?.ai,
                maxTokens: 150 // Keep it short and fast
            });
            setFeedback(response);
        } catch (err) {
            console.error(err);
            setFeedback("Ik kan even niet meekijken. Probeer het zo nog eens.");
        } finally {
            setIsThinking(false);
        }
    }, [settings]);

    return {
        feedback,
        isThinking,
        analyzeModel
    };
};
