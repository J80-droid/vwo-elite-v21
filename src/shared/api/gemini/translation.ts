/**
 * Translation Service
 * Provides high-quality translation and language detection using Gemini.
 */

import { AIConfig, Language } from "../../types";
import { getGeminiAPI } from "../geminiBase";

export interface TranslationResult {
  translatedText: string;
  detectedSourceLanguage?: string;
  confidence?: number;
}

/**
 * Translates text maintaining tone, context and nuance.
 */
export const translateText = async (
  text: string,
  targetLang: Language | string,
  sourceLang?: string,
  aiConfig?: AIConfig,
): Promise<TranslationResult> => {
  try {
    const ai = await getGeminiAPI(aiConfig?.geminiApiKey);
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    const target =
      targetLang === "nl"
        ? "Dutch"
        : targetLang === "en"
          ? "English"
          : targetLang;
    const source = sourceLang
      ? `from ${sourceLang}`
      : "detecting the source language";

    const prompt = `
      Translate the following text ${source} to ${target}.
      Maintain the original tone, formatting, and cultural nuance.
      
      Input Text:
      "${text}"
      
      Return JSON:
      {
        "translatedText": "...",
        "detectedSourceLanguage": "..." (if detected)
      }
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("Translation Failed:", error);
    return { translatedText: text }; // Fallback to original
  }
};

/**
 * Rapid language detection
 */
export const detectLanguage = async (
  text: string,
  aiConfig?: AIConfig,
): Promise<string> => {
  try {
    const ai = await getGeminiAPI(aiConfig?.geminiApiKey);
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(
      `Detect the language of this text. Return ONLY the ISO 639-1 code (e.g. 'en', 'nl', 'fr'). Text: "${text.substring(0, 100)}"`,
    );
    return result.response.text().trim().toLowerCase();
  } catch {
    return "unknown";
  }
};
