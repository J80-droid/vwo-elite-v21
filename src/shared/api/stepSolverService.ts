/**
 * Step Solver Service
 * AI-powered step-by-step solutions for math and science problems
 */

import { resolveModel } from "@shared/lib/modelDefaults";

import type { AIConfig } from "../types";
import { getGeminiAPI } from "./geminiBase";

export interface SolutionStep {
  stepNumber: number;
  description: string;
  calculation?: string;
  hint?: string;
  explanation?: string;
}

export interface StepSolution {
  problem: string;
  subject: string;
  topic?: string;
  steps: SolutionStep[];
  finalAnswer: string;
  methodology?: string;
  commonMistakes?: string[];
  relatedConcepts?: string[];
}

/**
 * Generate a step-by-step solution for a problem
 */
export async function solveProblemStepByStep(
  problem: string,
  subject: string,
  showAnswers: boolean = true,
  aiConfig?: AIConfig,
): Promise<StepSolution> {
  const gemini = await getGeminiAPI(aiConfig?.geminiApiKey);
  const model = gemini.getGenerativeModel({
    model: resolveModel("gemini", "reasoning", aiConfig),
  });

  const hintsOnly = !showAnswers
    ? `
BELANGRIJK: Geef ALLEEN hints en aanwijzingen, NIET de daadwerkelijke berekeningen of antwoorden.
In plaats van "2 + 3 = 5", schrijf "Tel de twee getallen bij elkaar op".
`
    : "";

  const prompt = `Je bent een VWO ${subject} docent. Los dit probleem stap voor stap op:

PROBLEEM: ${problem}

${hintsOnly}

Geef een didactisch verantwoorde uitleg die een VWO-leerling helpt het concept te begrijpen.

Antwoord ALLEEN in dit JSON formaat:
{
    "problem": "Het originele probleem",
    "subject": "${subject}",
    "topic": "Specifiek onderwerp (bijv. 'Differentiëren', 'Krachten')",
    "steps": [
        {
            "stepNumber": 1,
            "description": "Wat we in deze stap doen",
            "calculation": "De berekening of formule${showAnswers ? "" : " (optioneel bij hints-mode)"}",
            "hint": "Een hint voor de leerling",
            "explanation": "Waarom we dit doen"
        }
    ],
    "finalAnswer": "Het eindantwoord${showAnswers ? "" : ' (bij hints: "Probeer nu zelf!")'}",
    "methodology": "De algemene aanpak voor dit type probleem",
    "commonMistakes": ["Veelgemaakte fout 1", "Veelgemaakte fout 2"],
    "relatedConcepts": ["Gerelateerd concept 1", "Gerelateerd concept 2"]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid response format");

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("[StepSolverService] Failed to solve problem:", error);
    return {
      problem,
      subject,
      steps: [
        {
          stepNumber: 1,
          description: "Analyseer het probleem",
          hint: "Bekijk welke gegevens je hebt en wat je moet uitrekenen",
          explanation:
            "Begin altijd met het identificeren van bekenden en onbekenden",
        },
      ],
      finalAnswer: "Kon geen oplossing genereren. Probeer het opnieuw.",
      commonMistakes: [],
      relatedConcepts: [],
    };
  }
}

/**
 * Analyze an image of a problem (e.g., photo of textbook)
 */
export async function solveProblemFromImage(
  imageBase64: string,
  subject: string,
  showAnswers: boolean = true,
  aiConfig?: AIConfig,
): Promise<StepSolution> {
  const gemini = await getGeminiAPI(aiConfig?.geminiApiKey);
  const model = gemini.getGenerativeModel({
    model: resolveModel("gemini", "vision", aiConfig),
  });

  const hintsOnly = !showAnswers
    ? `
BELANGRIJK: Geef ALLEEN hints en aanwijzingen, NIET de daadwerkelijke antwoorden.
`
    : "";

  const prompt = `Je bent een VWO ${subject} docent. Analyseer deze afbeelding van een opgave en los het stap voor stap op.

${hintsOnly}

Antwoord in dit JSON formaat:
{
    "problem": "Het probleem zoals afgelezen van de afbeelding",
    "subject": "${subject}",
    "topic": "Specifiek onderwerp",
    "steps": [
        {
            "stepNumber": 1,
            "description": "Wat we in deze stap doen",
            "calculation": "De berekening",
            "hint": "Een hint",
            "explanation": "Waarom we dit doen"
        }
    ],
    "finalAnswer": "Het eindantwoord",
    "methodology": "De aanpak",
    "commonMistakes": [],
    "relatedConcepts": []
}`;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64,
        },
      },
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid response format");

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("[StepSolverService] Failed to solve from image:", error);
    throw new Error(
      "Kon de afbeelding niet analyseren. Probeer een duidelijkere foto.",
    );
  }
}

/**
 * Check a student's solution attempt
 */
export async function checkSolution(
  problem: string,
  studentSolution: string,
  subject: string,
  aiConfig?: AIConfig,
): Promise<{
  isCorrect: boolean;
  score: number;
  feedback: string;
  errors: string[];
  corrections: string[];
}> {
  const gemini = await getGeminiAPI(aiConfig?.geminiApiKey);
  const model = gemini.getGenerativeModel({
    model: resolveModel("gemini", "chat", aiConfig),
  });

  const prompt = `Je bent een VWO ${subject} docent. Controleer deze uitwerking:

PROBLEEM: ${problem}

UITWERKING VAN DE LEERLING:
${studentSolution}

Beoordeel de uitwerking. Antwoord in JSON:
{
    "isCorrect": true/false,
    "score": 8,
    "feedback": "Algemene feedback",
    "errors": ["Fout 1", "Fout 2"],
    "corrections": ["Correctie 1", "Correctie 2"]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid response format");

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("[StepSolverService] Failed to check solution:", error);
    return {
      isCorrect: false,
      score: 0,
      feedback: "Kon de uitwerking niet controleren.",
      errors: [],
      corrections: [],
    };
  }
}

/**
 * Get a hint for a specific step without revealing the answer
 */
export async function getHint(
  problem: string,
  currentStep: number,
  subject: string,
  aiConfig?: AIConfig,
): Promise<string> {
  const gemini = await getGeminiAPI(aiConfig?.geminiApiKey);
  const model = gemini.getGenerativeModel({
    model: resolveModel("gemini", "chat", aiConfig),
  });

  const prompt = `Je bent een VWO ${subject} docent. Een leerling zit vast bij stap ${currentStep} van dit probleem:

${problem}

Geef EEN korte hint die helpt zonder het antwoord te verraden. Max 2 zinnen.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("[StepSolverService] Failed to get hint:", error);
    return "Probeer het probleem in kleinere stappen op te delen.";
  }
}
