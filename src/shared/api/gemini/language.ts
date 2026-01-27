/**
 * @module language
 * @description Language learning and feedback services
 */

import { getCEFRSystemPrompt } from "@shared/lib/cefrStandards";

import {
  AIConfig as UserAIConfig,
  IdiomExercise,
  Language,
  LanguageFeedback,
} from "../../types";
import { getLangName } from "./helpers";

/**
 * Generate feedback on student's spoken language performance
 */
export const generateLanguageFeedback = async (
  transcript: string,
  lang: Language,
  aiConfig?: UserAIConfig,
): Promise<LanguageFeedback> => {
  const { aiGenerateJSON } = await import("../aiCascadeService");

  // Elite Feature: Explicit CEFR C1/C2 Alignment
  const cefrStandards = getCEFRSystemPrompt("C2");

  const prompt = `
    Analyze this student's spoken language performance in a roleplay scenario under STRICT CEFR C1/C2 STANDARDS (VWO 6 Level).
    Target Language: ${getLangName(lang)}.

    Transcript:
    """
    ${transcript}
    """

    Provide a detailed assessment JSON with:
    - grammarScore (1-10): Be strict. 10 = Native/C2, 8 = C1, 6 = B2.
    - vocabularyScore (1-10): Reward idiomatic/academic usage.
    - pronunciationScore (1-10): Estimate based on transcript fluency markers.
    - grammarFeedback: Correct specific errors.
    - vocabularyFeedback: Suggest C1/C2 synonyms for basic words used.
    - generalTips: How to sound more like a native (C2).

    Context from CEFR Standards:
    ${cefrStandards}

    Response entirely in ${getLangName(lang)}.
`;

  try {
    const systemPrompt =
      "You are an expert language tutor. Respond in valid JSON.";
    return await aiGenerateJSON(prompt, systemPrompt, {
      ...(aiConfig ? { aiConfig } : {}),
    });
  } catch (e) {
    console.error("Language feedback failed:", e);
    return {
      grammarScore: 0,
      vocabularyScore: 0,
      pronunciationScore: 0,
      grammarFeedback: "Kon geen feedback genereren.",
      vocabularyFeedback: "",
      generalTips: "",
    };
  }
};

/**
 * Generate idiom/vocabulary fill-in-the-blank exercises
 */
export const generateIdiomExercise = async (
  topic: string,
  lang: Language,
  aiConfig?: UserAIConfig,
): Promise<IdiomExercise> => {
  const { aiGenerateJSON } = await import("../aiCascadeService");

  const prompt = `
      Generate a fill-in-the-blank idiom/vocabulary exercise for: ${getLangName(lang)}.
      Topic/Context: ${topic || "General Academic"}.
      Target Audience: ELITE University Student / Academic Level (CEFR C1/C2).
      
      CRITICAL INSTRUCTIONS:
      1. Difficulty: MUST be challenging (VWO 6 / C1/C2).
      2. Vocabulary: Use sophisticated, formal words suitable for academic or professional discourse (e.g., 'Exacerbate', 'Mitigate', 'Inevitably', 'Substantial').
      3. Sentence: Must be grammatically flawless and syntactically complex (compound-complex sentences).
      4. Context: Ensure the sentence reflects a "Social Choice" (Maatschappelijk) or "Academic" theme if fitting.
      5. ERROR PREVENTION: ensure the sentence flows naturally when the blank is filled.
      
      Steps:
      1. Select a word that implies nuance.
      2. Build a sentence around it typical of a scientific paper or leading newspaper editorial.
      3. Provide 3 plausible distractors that might fit loosely but are incorrect due to connotation or register.

      Response Format (JSON):
      {
        "targetWord": "string",
        "sentence": "string",
        "options": ["string", "string", "string", "string"],
        "correctAnswer": "string",
        "translation": "string",
        "feedback": {
          "option1": "Explanation why correct/incorrect...",
          "option2": "Explanation why correct/incorrect..."
        }
      }

      INSTRUCTIONS FOR FEEDBACK:
      - For the CORRECT answer: Explain WHY it fits the context (nuance/connotation).
      - For INCORRECT answers: Explain SPECIFICALLY caused by register, grammar, or meaning (e.g. "Too informal", "False friend").
      - Level: VWO 5/6 (C1/C2).

    `;

  const systemPrompt =
    "You are an expert language teacher. Respond in valid JSON.";

  try {
    const result = await aiGenerateJSON<IdiomExercise>(prompt, systemPrompt, {
      ...(aiConfig ? { aiConfig } : {}),
    });

    // Safety checks
    if (!result.options || !Array.isArray(result.options)) {
      result.options = [
        "Option A",
        "Option B",
        "Option C",
        result.correctAnswer || "Option D",
      ];
    }

    // Ensure correct answer is in options
    if (
      result.correctAnswer &&
      !result.options.includes(result.correctAnswer)
    ) {
      result.options[0] = result.correctAnswer;
    }

    // Shuffle options
    result.options.sort(() => Math.random() - 0.5);

    return result;
  } catch (error) {
    console.error("Idiom generation failed:", error);
    return {
      targetWord: "Error",
      sentence: "Error generating exercise. Please try again.",
      options: ["Error"],
      translation: "",
      correctAnswer: "Error",
      feedback: { Error: "Er is een fout opgetreden." },
    };
  }
};
