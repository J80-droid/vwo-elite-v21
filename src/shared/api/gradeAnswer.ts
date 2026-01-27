/* eslint-disable unused-imports/no-unused-vars */
import { AIConfig } from "../types";
import { cascadeGenerate } from "./aiCascadeService";

interface GradeAnswerParams {
  question: string;
  studentAnswer: string;
  rubric: string;
  modelAnswer: string;
  maxScore: number;
  aiConfig: AIConfig;
}

interface GradingResult {
  score: number;
  maxScore: number;
  isCorrect: boolean;
  feedback: string;
  missedKeywords?: string[];
}

const GRADING_PROMPT = `### HUIDIGE ROL: VWO EXAMINATOR
JIJ BENT: Een strenge VWO-examinator die open vragen nakijkt.

OPDRACHT: Beoordeel het antwoord van de student op een open vraag.

VRAAG: "{question}"
RUBRIC (Puntenverdeling): "{rubric}"
MODELANTWOORD (Ter referentie): "{modelAnswer}"
MAX SCORE: {maxScore}

ANTWOORD STUDENT: "{studentAnswer}"

GEEF OUTPUT IN DIT JSON FORMAAT (ALLEEN JSON, GEEN ANDERE TEKST):
{
  "score": (nummer, bijv 1.5),
  "maxScore": (nummer, gelijk aan MAX SCORE),
  "isCorrect": (boolean, true als score > 55%),
  "feedback": "Korte, directe feedback aan de student. Zeg wat er goed was en wat er mist. Spreek de student aan met 'je'.",
  "missedKeywords": ["lijst", "met", "gemiste", "termen"]
}`;

export const gradeOpenAnswer = async (
  params: GradeAnswerParams,
): Promise<GradingResult> => {
  const { question, studentAnswer, rubric, modelAnswer, maxScore, aiConfig } =
    params;

  const prompt = GRADING_PROMPT.replace("{question}", question)
    .replace("{rubric}", rubric)
    .replace("{modelAnswer}", modelAnswer)
    .replace("{maxScore}", String(maxScore))
    .replace("{studentAnswer}", studentAnswer);

  try {
    const response = await cascadeGenerate(
      `Beoordeel dit antwoord: "${studentAnswer}"`,
      prompt,
      {
        aiConfig,
        jsonMode: true,
        maxTokens: 1024,
      },
    );

    // Parse JSON response
    let result: GradingResult;
    try {
      // Robust JSON extraction
      const jsonText = extractJSON(response.content);
      result = JSON.parse(jsonText);
    } catch (e) {
      console.warn(
        "Failed to parse grading JSON:",
        response.content.substring(0, 500),
      );
      // Fallback result
      result = {
        score: 0,
        maxScore,
        isCorrect: false,
        feedback:
          "Kon het antwoord niet automatisch nakijken. Vergelijk met het modelantwoord.",
      };
    }

    return result;
  } catch (error) {
    console.error("Grading service error:", error);
    throw error;
  }
};

/**
 * Helper to extract JSON object from potentially messy AI output.
 * Strips Markdown code blocks first, then finds the outer-most brackets.
 */
function extractJSON(text: string): string {
  // 1. Remove Markdown code blocks if present
  const markdownMatch = text.match(/```(?:json)?([\s\S]*?)```/);
  const cleanText = markdownMatch && markdownMatch[1] ? markdownMatch[1] : text;

  // 2. Find the outer-most bracket pair
  const start = cleanText.indexOf("{");
  const end = cleanText.lastIndexOf("}");

  if (start !== -1 && end !== -1 && end > start) {
    return cleanText.substring(start, end + 1);
  }
  return text; // Fallback to original text if no brackets found
}
