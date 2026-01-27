/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Quiz Generation Service
 * Uses Groq as primary AI for structured quiz generation (cheaper, faster)
 * Falls back to Gemini only if Groq fails
 */

import { cascadeGenerate } from "@shared/api/aiCascadeService";
import { QUIZ_GENERATOR_PROMPT } from "@shared/constants/prompts";
import { useQuizProgressStore } from "@shared/model/quizProgressStore";
import { AIConfig } from "@shared/types/config";

// Type definitions for quiz generation
export interface QuizGenerationOptions {
  topic?: string | undefined;
  questionCount: number;
  sources: ("curriculum" | "chat" | "upload" | "library")[];
  chatContext?: string | undefined;
  uploadedContent?: string | undefined;
  libraryContent?: string | undefined;
  quizType?:
  | "multiple_choice"
  | "error_spotting"
  | "ordering"
  | "fill_blank"
  | "open_question"
  | undefined;
  aiConfig?: AIConfig | undefined;
}

export interface GeneratedQuestion {
  id: string;
  question: string;
  type: string;
  options?: string[];
  correctAnswer?: string | number;
  explanation?: string;
  [key: string]: any; // Allow additional properties from AI
}

/**
 * Generate quiz questions using Groq-first cascade
 */
export const generateQuizQuestions = async (
  options: QuizGenerationOptions,
): Promise<GeneratedQuestion[]> => {
  const {
    topic,
    questionCount,
    sources,
    chatContext,
    uploadedContent,
    libraryContent,
    quizType,
    aiConfig,
  } = options;

  // Build context based on selected sources
  let contextInfo = "";
  if (sources.includes("curriculum")) {
    contextInfo += "Gebruik je eigen VWO-curriculum kennis.\n";
  }
  if (sources.includes("chat") && chatContext) {
    contextInfo += `Context uit ons gesprek:\n${chatContext}\n`;
  }
  if (sources.includes("upload") && uploadedContent) {
    contextInfo += `Geüpload materiaal:\n${uploadedContent}\n`;
  }
  if (sources.includes("library") && libraryContent) {
    contextInfo += `Bronmateriaal uit bibliotheek:\n${libraryContent}\n`;
  }

  // Build question type instruction
  const typeMap: Record<string, string> = {
    multiple_choice: "ALLEEN meerkeuze vragen (multiple_choice)",
    error_spotting: "ALLEEN foutenjager vragen (error_spotting)",
    ordering: "ALLEEN ordeningsvragen (ordering)",
    fill_blank: "ALLEEN invulvragen (fill_blank)",
    open_question: "ALLEEN open vragen (open_question)",
  };
  const typeInstruction = quizType
    ? typeMap[quizType]
    : "Mix van types: multiple_choice, error_spotting, ordering, fill_blank, open_question.";

  const prompt = `
Onderwerp: "${topic || "Bepaal zelf onderwerpen uit het bronmateriaal"}"
Aantal vragen: ${questionCount}
${contextInfo}

Instructie: Genereer ${questionCount} VWO-examenniveau vragen.
${typeInstruction}
Output: A JSON object with a "questions" array containing the generated questions.
Example format: { "questions": [...] }
Output: ONLY the JSON object, NO other text.
`;

  const response = await cascadeGenerate(prompt, QUIZ_GENERATOR_PROMPT, {
    ...(aiConfig ? { aiConfig } : {}),
    jsonMode: true,
    maxTokens: 4096,
  });

  // Parse JSON response
  let parsed: any;
  try {
    // Handle potential markdown code blocks
    const jsonMatch =
      response.content.match(/```json\s*([\s\S]*?)\s*```/) ||
      response.content.match(/```\s*([\s\S]*?)\s*```/);
    const jsonString = (jsonMatch ? jsonMatch[1] : response.content) as string;
    parsed = JSON.parse(jsonString.trim());
  } catch (e) {
    console.error(
      "Failed to parse quiz JSON:",
      response.content.substring(0, 500),
    );
    throw new Error("Kon quiz niet parsen. Probeer opnieuw.");
  }

  // Extract questions array (it might be in an object or a direct array)
  let questionsArray: any[] = [];
  if (Array.isArray(parsed)) {
    questionsArray = parsed;
  } else if (parsed && typeof parsed === "object") {
    // Try to find an array in the object (usually under "questions" or "data")
    questionsArray =
      parsed.questions ||
      parsed.data ||
      Object.values(parsed).find((v) => Array.isArray(v)) ||
      [];
  }

  if (!Array.isArray(questionsArray) || questionsArray.length === 0) {
    console.error("No questions array found in AI response:", parsed);
    throw new Error("AI heeft geen geldige vragenlijst geretourneerd.");
  }

  // Add IDs to questions
  const generatedQuestions = questionsArray.map((q, i) => ({
    ...q,
    id: `q-${Date.now()}-${i}`,
  }));

  // --- UNIQUENESS CHECK ---
  // Load history to prevent exact duplicates
  try {
    const { history } = useQuizProgressStore.getState();
    const previousQuestionTexts = new Set<string>();

    // Collect all previous question texts
    history.forEach((h) => {
      if (h.questions) {
        h.questions.forEach((q) =>
          previousQuestionTexts.add(q.question || q.text),
        );
      }
    });

    const uniqueQuestions = generatedQuestions.filter((q) => {
      const text = q.question || q.text || "";
      if (!text) return true;
      return !previousQuestionTexts.has(text);
    });

    if (uniqueQuestions.length < generatedQuestions.length) {
      console.log(
        `Filtered ${generatedQuestions.length - uniqueQuestions.length} duplicate questions.`,
      );
    }

    return uniqueQuestions.length > 0 ? uniqueQuestions : generatedQuestions;
  } catch (e) {
    console.warn("Uniqueness check failed:", e);
    return generatedQuestions;
  }
};
