import { geminiGenerate } from "@shared/api/geminiBase";
import { GymProblem } from "@shared/types/gym";

export interface AIGymRequest {
  topic: string;
  context: string;
  count: number;
  difficulty: number;
}

interface AIGymResponseItem {
  id?: string;
  question: string;
  answer: string;
  context?: string;
  explanation?: string;
  alternatives?: string[];
}

export const AIGymService = {
  /**
   * Generates new Gym questions using the AI Brain.
   * This is used when the local pool runs dry or for "God Mode" infinite practice.
   */
  generateQuestions: async (req: AIGymRequest): Promise<GymProblem[]> => {
    const prompt = `
      Create ${req.count} multiple-choice/open questions for VWO (Pre-University) students.
      Subject Limit: ${req.topic}
      Context: ${req.context}
      Difficulty: Level ${req.difficulty} (1=Fact recall, 5=Complex Synthesis)

      Output strict JSON format:
      [
        {
          "id": "ai-gen-[random]",
          "question": "The question text. Use Markdown for bold (**bold**) and ALWAYS wrap math/chemical formulas in $ sign, e.g. $H_2O$ or $x^2$.",
          "answer": "The correct answer",
          "context": "Brief context or title",
          "explanation": "A DEEP explanation (in Dutch) of WHY this answer is correct and why other common misconceptions are wrong. Minimum 2 sentences. Use $ for math.",
          "alternatives": ["Common synonym 1", "Common synonym 2"]
        }
      ]
    `;

    try {
      // Use the cheapest/fastest model available for speed (Gemini Flash usually)
      const result = await geminiGenerate(prompt, "", { jsonMode: true });

      let response: AIGymResponseItem[] = [];
      try {
        // geminiGenerate returns a string wrapper object { content, ... }
        // We need to parse content. 
        // However, geminiGenerate might just return the text depending on implementation details in other files, 
        // but checking geminiBase.ts, it returns { content: string ... }.
        // Wait, let's double check implementation of geminiGenerate in previous turn.
        // It returns { content: response.text() ... }.
        // So result.content is the JSON string.

        // Sometimes the model wraps in ```json ... ```
        const cleanJson = result.content.replace(/```json/g, "").replace(/```/g, "").trim();
        response = JSON.parse(cleanJson);
      } catch {
        console.error("Failed to parse AI JSON:", result.content);
        return [];
      }

      // Basic validation
      if (!Array.isArray(response)) throw new Error("AI did not return an array");

      return response.map((q: AIGymResponseItem) => ({
        id: q.id || `ai-${Date.now()}-${Math.random()}`,
        question: q.question,
        answer: q.answer,
        displayAnswer: q.answer,
        context: q.context || req.topic,
        explanation: q.explanation,
        acceptedAnswers: q.alternatives || [],
        solutionSteps: q.explanation ? [q.explanation] : []
      }));
    } catch (e) {
      console.error("AIGymService Failed:", e);
      // Fallback to empty -> The Gym Engine should handle empty states by showing a "Retry" or "Offline" message
      return [];
    }
  },
  /**
   * Solves a specific problem step-by-step using AI.
   * This is used when the user clicks "Show Solution" and no static explanation exists.
   */
  solveProblem: async (problem: string, context: string, subject: string): Promise<GymProblem['stepSolverResult']> => {
    const prompt = `
      Je bent een VWO ${subject} docent. Los deze opgave stap voor stap op voor een leerling.
      
      OPGAVE: ${problem}
      CONTEXT: ${context}
      
      Antwoord ALLEEN in dit JSON formaat zodat de app het direct kan renderen:
      {
        "problem": "De opgave tekst. Gebruik $ voor alle formules.",
        "type": "exam_trainer",
        "steps": [
          {
            "id": "step-1",
            "title": "Stap Titel (bijv. 'Identificeer de Oxidator')",
            "description": "Uitleg in gewone tekst. Gebruik $ voor formules.",
            "latex": "De pure formule in LaTeX, ALTIJD tussen $ tekens (bijv. '$E=mc^2$')",
            "rationale": "Waarom doen we dit?"
          }
        ],
        "finalAnswer": "Het antwoord, gebruik $ indien nodig.",
        "primaryColor": "#10b981"
      }
    `;

    try {
      const result = await geminiGenerate(prompt, "", { jsonMode: true });
      let response;
      try {
        const cleanJson = result.content
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        response = JSON.parse(cleanJson);
      } catch (parseError) {
        console.warn("[AIGymService] JSON parse failed, attempting manual extraction", parseError);
        // Fallback: try to finding the first { and last }
        const start = result.content.indexOf("{");
        const end = result.content.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          const raw = result.content.substring(start, end + 1);
          response = JSON.parse(raw);
        } else {
          throw parseError;
        }
      }

      return {
        problem: response.problem || problem,
        type: response.type || "exam_trainer",
        steps: response.steps || [],
        finalAnswer: response.finalAnswer || "",
        primaryColor: response.primaryColor || "#10b981"
      };
    } catch (e) {
      console.error("AIGymService solveProblem Failed:", e);
      // Even if AI fails, we could return a simple one-step solution as fallback?
      return {
        problem: problem,
        type: "exam_trainer",
        steps: [{
          id: "fallback",
          title: "Analyse",
          description: "De AI kon geen gedetailleerde stappen genereren voor deze specifieke vraag.",
          latex: "",
          rationale: "Systeemfout of limiet bereikt."
        }],
        finalAnswer: "Raadpleeg je BINAS of theorieboek voor meer details.",
        primaryColor: "#ef4444"
      };
    }
  }
};
