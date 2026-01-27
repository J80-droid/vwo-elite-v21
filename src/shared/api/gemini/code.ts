/**
 * @module code
 * @description Code explanation and math/calculus solving services
 */

import { resolveModel } from "@shared/lib/modelDefaults";

import { AIConfig as UserAIConfig, Language } from "../../types";
import { getGeminiAPI } from "../geminiBase";
import { getLangName } from "./helpers";

/**
 * Explain code with line-by-line analysis
 */
export const explainCode = async (
  code: string,
  language: string,
  lang: Language,
  aiConfig?: UserAIConfig,
): Promise<string> => {
  const prompt = `
    You are a coding tutor for a VWO 5 / 6(pre - university) student.
    Explain the following ${language} code in ${getLangName(lang)}.

Code:
\`\`\`${language}
    ${code}
    \`\`\`
    
    Provide:
    1. A brief summary of what the code does
    2. Line-by-line explanation of key parts
    3. Any potential improvements or common mistakes to avoid
    
    Keep explanations clear and suitable for a high school student.
  `;

  const systemPrompt = `You are an expert coding tutor. Explain code clearly for high school students in ${getLangName(lang)}.`;

  // Try cascade first (Groq/HuggingFace), fall back to Gemini
  try {
    const { cascadeGenerate, getAvailableProviders } =
      await import("../aiCascadeService");

    // Only use cascade if at least one provider is configured
    if (getAvailableProviders(aiConfig).length > 0) {
      console.log("[explainCode] Using AI cascade");
      const response = await cascadeGenerate(prompt, systemPrompt, {
        ...(aiConfig ? { aiConfig } : {}),
      });
      return response.content;
    }
  } catch (cascadeError) {
    console.warn(
      "[explainCode] Cascade failed, falling back to Gemini:",
      cascadeError,
    );
  }

  // Fallback to Gemini
  try {
    console.log("[explainCode] Using Gemini fallback");
    const ai = await getGeminiAPI(aiConfig?.geminiApiKey);
    const model = ai.getGenerativeModel({
      model: resolveModel("gemini", "chat", aiConfig),
    });
    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    return response.response.text() || "Geen uitleg beschikbaar.";
  } catch (error) {
    console.error("Code explanation failed:", error);
    return "Fout bij het analyseren van de code.";
  }
};

/**
 * Solve calculus problems with step-by-step explanation
 */
export const solveCalculus = async (
  problem: string,
  aiConfig?: UserAIConfig,
): Promise<{ steps: string[]; finalAnswer: string; rule: string }> => {
  try {
    const ai = await getGeminiAPI(aiConfig?.geminiApiKey);
    const prompt = `
        You are a Calculus Tutor for VWO students.
        PROBLEM: "${problem}"
        
        TASK:
        1. Identify the primary rule needed (e.g., Chain Rule, Product Rule).
        2. Solve step-by-step, explaining each logical leap.
        3. Provide the final simplified answer.
        
        OUTPUT JSON:
        {
            "rule": "string (e.g. Kettingregel)",
            "steps": ["string (markdown allowed)", "string"],
            "finalAnswer": "string (LaTeX allowed)"
        }
        `;

    const response = await ai
      .getGenerativeModel({
        model: resolveModel("gemini", "reasoning", aiConfig),
        generationConfig: { responseMimeType: "application/json" },
      })
      .generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

    const text = response.response.text() || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Calculus solver failed:", error);
    return {
      steps: ["Error solving problem."],
      finalAnswer: "",
      rule: "Error",
    };
  }
};
