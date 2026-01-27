import {
  AIConfig as UserAIConfig,
  Flashcard,
  Language,
  QuizQuestion,
  QuizResponse,
  StudyMaterial,
} from "../../types";
import { aiGenerateJSON } from "../aiCascadeService";

export const generateQuizFromMaterials = async (
  materials: StudyMaterial[],
  lang: Language,
  aiConfig?: UserAIConfig,
  options?: { stressTest?: boolean; difficulty?: "easy" | "medium" | "hard" },
): Promise<QuizResponse> => {
  const content = materials.map((m) => m.content).join("\n\n");

  // CEFR Injection
  const subject = materials[0]?.subject || "";
  const isLanguageSubject = [
    "engels",
    "frans",
    "duits",
    "spaans",
    "nederlands",
  ].some(
    (s) => typeof subject === "string" && subject.toLowerCase().includes(s),
  );

  // Stress Test Injection
  const stressPrompt = options?.stressTest
    ? "\nSTRESS TEST MODE ACTIVATED: Generate EXTREMELY DIFFICULT questions (VWO 6 Exam Level). Use trick questions, complex distractors, and require deep insight. NO basic knowledge retrieval."
    : "";

  // Difficulty Injection
  const difficultyPrompt = `\nMOEILIJKHEID: ${options?.difficulty || "medium"}. ${options?.difficulty === "hard" ? "Bied complexe vragen aan op VWO-eindexamen niveau." : ""}`;

  const prompt = `
    Genereer een quiz gebaseerd op de volgende studiematerialen:
    ${content.slice(0, 10000)}
    
    Output JSON met:
    - questions: array van { question, options: string[4], correctAnswer: 0-3, explanation }
    
    Maak 5-10 vragen in het ${lang === "nl" ? "Nederlands" : "Engels"}.${isLanguageSubject ? " Focus on analyzing the text structure, arguments, and vocabulary (C1/C2 level)." : ""}
    ${difficultyPrompt}
    ${stressPrompt}
  `;

  try {
    const result = await aiGenerateJSON(prompt, "You are a quiz generator.", {
      ...(aiConfig ? { aiConfig } : {}),
    });
    return result as QuizResponse;
  } catch (err) {
    console.error("[generateQuizFromMaterials] failed:", err);
    throw err;
  }
};

export const generateQuizQuestions = async (
  topic: string,
  difficulty: "easy" | "hard",
  lang: Language,
  aiConfig?: UserAIConfig,
): Promise<QuizResponse> => {
  const prompt = `
    Genereer een ${difficulty === "easy" ? "eenvoudige" : "moeilijke"} quiz over: ${topic}
    Maak 5 multiple-choice vragen in het ${lang === "nl" ? "Nederlands" : "Engels"}.
    Output JSON: { questions: [{ question, options, correctAnswer, explanation }] }
  `;

  try {
    const result = await aiGenerateJSON(prompt, "You are a quiz generator.", {
      aiConfig,
    });
    return result as QuizResponse;
  } catch (err) {
    console.error("[generateQuizQuestions] failed:", err);
    throw err;
  }
};

export const generateQuizFromMaterial = async (
  materialContent: string,
  _lang: Language,
  aiConfig?: UserAIConfig,
): Promise<{ flashcards: Flashcard[]; quiz: QuizQuestion[] }> => {
  const prompt = `
    Analyseer deze studiestof en genereer:
    1. 5-10 flashcards (term + definitie)
    2. 5 quizvragen (multiple choice)
    
    Stof: ${materialContent.slice(0, 8000)}
    
    Output JSON:
    {
      "flashcards": [{ "term": "...", "definition": "..." }],
      "quiz": [{ "question": "...", "options": ["A","B","C","D"], "correctAnswer": 0, "explanation": "..." }]
    }
  `;

  try {
    const result = await aiGenerateJSON(prompt, "You are a flashcard and quiz generator.", {
      aiConfig,
    });
    return result as { flashcards: Flashcard[]; quiz: QuizQuestion[] };
  } catch (err) {
    console.error("[generateQuizFromMaterial] failed:", err);
    throw err;
  }
};
