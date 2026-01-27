import { aiGenerate } from "../../aiCascadeService";

/**
 * Legacy education tools handler
 * @deprecated Use registerEducationTools() and ToolRegistry instead
 */
export async function handleEducationTool(
  name: string,
  params: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case "generate_lesson":
      return await generateLesson(
        String(params.topic),
        String(params.level),
        String(params.format || "detailed"),
      );
    case "generate_study_plan":
      return await generateStudyPlan(
        String(params.subject),
        String(params.deadline),
        Number(params.hours_per_week || 5),
      );
    case "generate_flashcards":
      return await generateFlashcards(
        String(params.content),
        Number(params.count || 10),
      );
    case "generate_quiz":
      return await generateQuiz(
        String(params.topic),
        Number(params.count || 5),
        String(params.difficulty || "medium"),
      );
    case "explain_concept":
      return await explainConcept(
        String(params.concept),
        String(params.audience || "VWO leerling"),
      );
    case "socratic_coach":
      return await socraticCoach(String(params.problem));
    case "analyze_weak_points":
      return await analyzeWeakPoints(String(params.subject || "general"));
    case "generate_mind_map": {
      const res = await generateMindMap(String(params.topic));
      return { success: true, ...res };
    }
    default:
      throw new Error(`Education tool ${name} not implemented.`);
  }
}

async function generateLesson(topic: string, level: string, format = "detailed") {
  const prompt = `Genereer een ${format} les over het onderwerp "${topic}" voor niveau ${level}.`;
  const content = await aiGenerate(prompt, { systemPrompt: "Je bent een expert docent." });
  return { topic, level, content };
}

async function generateStudyPlan(subject: string, deadline: string, hoursPerWeek: number) {
  const prompt = `Maak een studieplan voor "${subject}" met deadline ${deadline}. ${hoursPerWeek} uur/week beschikbaar.`;
  const content = await aiGenerate(prompt, { systemPrompt: "Je bent een studiecoach." });
  return { subject, deadline, plan: content };
}

async function generateFlashcards(content: string, count = 10) {
  const prompt = `Maak ${count} flashcards: "${content}"`;
  const result = await aiGenerate(prompt, { systemPrompt: "Flashcard expert." });
  return { flashcards: result };
}

async function generateQuiz(topic: string, count = 5, difficulty = "medium") {
  const prompt = `Genereer ${count} quiz vragen over "${topic}" (${difficulty}).`;
  const result = await aiGenerate(prompt, { systemPrompt: "Toetsenmaker." });
  return { topic, difficulty, quiz: result };
}

async function explainConcept(concept: string, audience = "VWO leerling") {
  const prompt = `Leg "${concept}" uit aan ${audience}.`;
  const result = await aiGenerate(prompt, { systemPrompt: "Uitleg expert." });
  return { concept, explanation: result };
}

async function socraticCoach(problem: string) {
  const prompt = `Socratische vraag voor: "${problem}"`;
  const result = await aiGenerate(prompt, { systemPrompt: "Socratische coach." });
  return { question: result };
}

async function analyzeWeakPoints(subject: string) {
  const prompt = `Analyseer zwakke punten voor "${subject}"`;
  const analysis = await aiGenerate(prompt, { systemPrompt: "Didactisch expert." });
  return { subject, analysis };
}

async function generateMindMap(topic: string) {
  const prompt = `Mermaid mindmap voor "${topic}"`;
  const content = await aiGenerate(prompt, { systemPrompt: "Mindmap expert." });
  return { topic, mind_map_code: content, type: "mermaid_mindmap" };
}
