import { AIConfig } from "../types";
import { aiGenerate } from "./aiCascadeService";

export const generateCrashCourse = async (
  topic: string,
  weakPoints: string[],
  aiConfig: AIConfig,
): Promise<string> => {
  // Prompt optimized for Action Plans & Timelines (Micro-Learning)
  const prompt = `
        ROL: Expert Didacticus & Examentrainer VWO.
        DOEL: Maak een ultra-korte "Crash Course" (max 300 woorden) voor een VWO-student.
        ONDERWERP: ${topic}
        PROBLEEMPUNTEN: De student faalt op: ${weakPoints.join(", ")}.
        
        EISEN:
        1. Geen lappen tekst. Gebruik Markdown.
        2. Als het een proces is (zoals "Ordering" fouten), maak een genummerd STAPPENPLAN.
        3. Als het chronologie is, maak een TIJDLIJN.
        4. Gebruik Mermaid syntax voor een flowchart als dat verhelderend is (optioneel).
        5. Toon: Directief, helder en bemoedigend.
        6. Focus puur op wat de student NIET snapt (de zwakke punten).
    `;

  try {
    const response = await aiGenerate(prompt, { aiConfig });
    return (
      response || "Kon geen crash course genereren. Probeer het later opnieuw."
    );
  } catch (error) {
    console.error("Micro-learning generation failed:", error);
    return "Er ging iets mis bij het genereren van de crash course.";
  }
};
