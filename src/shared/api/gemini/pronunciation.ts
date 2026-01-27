/**
 * Pronunciation Analysis Service
 * Uses Gemini 1.5 Flash (Multimodal) to critique pronunciation.
 */

import { AIConfig } from "../../types";
import { getGeminiAPI } from "../geminiBase";

export interface PronunciationResult {
  score: number; // 0-100
  feedback: string;
  mispronouncedWords: {
    word: string;
    issue: string;
    correction: string; // Phonetic or tip
  }[];
}

export const analyzePronunciation = async (
  audioBase64: string, // WAV or MP3 base64
  targetText: string,
  language: string = "Dutch", // Target language
  aiConfig?: AIConfig,
): Promise<PronunciationResult | null> => {
  try {
    const ai = await getGeminiAPI(aiConfig?.geminiApiKey);
    // Use Gemini 1.5 Flash for multimodal audio support
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Act as a strict pronunciation coach for ${language}.
      The user is trying to say: "${targetText}".
      Listen to the audio and analyze their pronunciation.
      
      Return a JSON object with:
      - score: number (0-100) based on clarity and native-ness.
      - feedback: A short constructive comment (1-2 sentences).
      - mispronouncedWords: Array of objects { word, issue, correction }.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "audio/wav",
          data: audioBase64,
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    const responseText = result.response.text();

    // Extract JSON from response (handling potential markdown code blocks)
    let jsonString = responseText;
    if (responseText.includes("```json")) {
      jsonString = responseText.split("```json")?.[1]?.split("```")?.[0] || "";
    } else if (responseText.includes("```")) {
      jsonString = responseText.split("```")?.[1]?.split("```")?.[0] || "";
    }

    return JSON.parse(jsonString.trim()) as PronunciationResult;
  } catch (error) {
    console.error("Pronunciation Analysis Failed:", error);
    return null;
  }
};
