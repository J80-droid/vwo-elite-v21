/**
 * Vision Module - Image & Video Analysis
 * Extracted from geminiService.ts for better maintainability.
 */

import { MODEL_IMAGEN } from "@shared/lib/constants";
import { resolveModel } from "@shared/lib/modelDefaults";
import { AIConfig as UserAIConfig, Language } from "@shared/types";

import { getGeminiAPI } from "../geminiBase";

export const solveProblem = async (
  imageBase64: string,
  _lang: Language,
  mode: "solution" | "socratic" = "solution",
  aiConfig?: UserAIConfig,
): Promise<string> => {
  const ai = await getGeminiAPI(aiConfig?.geminiApiKey);
  const prompts = aiConfig?.customPrompts || {};

  const basePrompt =
    mode === "socratic"
      ? prompts.socratic_mentor ||
      "Begeleid de leerling stap-voor-stap naar het antwoord zonder het direct te geven."
      : "Los dit probleem volledig op met duidelijke stappen.";

  const model = ai.getGenerativeModel({
    model: resolveModel("gemini", "chat", aiConfig),
  });
  const response = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { text: basePrompt },
          { inlineData: { mimeType: "image/png", data: imageBase64 } },
        ],
      },
    ],
  });

  return response.response.text() || "Kon de afbeelding niet analyseren.";
};

export const analyzeSnapshot = async (
  imageBase64: string,
  subject: string,
  lang: Language,
  aiConfig?: UserAIConfig,
): Promise<string> => {
  const ai = await getGeminiAPI(aiConfig?.geminiApiKey);
  const prompt = `
    Analyseer deze afbeelding in de context van ${subject}.
    Beschrijf wat je ziet en leg de relevante concepten uit.
    Taal: ${lang === "nl" ? "Nederlands" : "Engels"}
  `;

  const model = ai.getGenerativeModel({
    model: resolveModel("gemini", "chat", aiConfig),
  });
  const response = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/png", data: imageBase64 } },
        ],
      },
    ],
  });

  return response.response.text() || "Analyse niet beschikbaar.";
};

export const analyzeVideo = async (
  videoBase64: string,
  mimeType: string,
  lang: Language,
  aiConfig?: UserAIConfig,
): Promise<string> => {
  const ai = await getGeminiAPI(aiConfig?.geminiApiKey);
  const prompts = aiConfig?.customPrompts || {};
  const basePrompt =
    prompts.video_generator ||
    "Analyseer deze video voor een VWO student. Wat gebeurt er?";

  const model = ai.getGenerativeModel({
    model: resolveModel("gemini", "chat", aiConfig),
  });
  const response = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${basePrompt}\nTaal: ${lang === "nl" ? "Nederlands" : "Engels"}`,
          },
          { inlineData: { mimeType, data: videoBase64 } },
        ],
      },
    ],
  });

  return response.response.text() || "Video-analyse niet beschikbaar.";
};

/**
 * Extracts a mathematical function from an image of a graph.
 * Returns the function definition (e.g., "f(x) = x^2 + 2x + 1").
 */
export const extractMathFunction = async (
  imageBase64: string,
  aiConfig?: UserAIConfig,
): Promise<string> => {
  const ai = await getGeminiAPI(aiConfig?.geminiApiKey);
  const model = ai.getGenerativeModel({
    model: resolveModel("gemini", "chat", aiConfig),
  });

  const prompt = `
      Analyze this graph.
      Determine the mathematical function f(x) that best describes the curve.
      Return ONLY the function definition in standard mathematical notation or LaTeX.
      Do not include explanations.
      Example: f(x) = sin(x)
      Example: y = 2x + 5
    `;

  const response = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/png", data: imageBase64 } },
        ],
      },
    ],
  });

  return response.response.text().trim().replace(/`/g, "") || "";
};

/**
 * Transcribes handwritten notes with high accuracy using Vision.
 */
export const transcribeHandwriting = async (
  imageBase64: string,
  aiConfig?: UserAIConfig,
): Promise<string> => {
  const ai = await getGeminiAPI(aiConfig?.geminiApiKey);
  const model = ai.getGenerativeModel({
    model: resolveModel("gemini", "chat", aiConfig),
  });

  const prompt = `
      Transcribe the handwritten text in this image.
      Maintain the original formatting, indentation, and structure as much as possible.
      Correct obvious spelling mistakes if they are clearly slips of the pen, but strictly preserve the content.
      If a word is illegible, mark it as [?].
    `;

  const response = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/png", data: imageBase64 } },
        ],
      },
    ],
  });

  return response.response.text() || "";
};

export const generateEducationalImage = async (
  prompt: string,
  aiConfig?: UserAIConfig,
  _size: "1K" | "2K" = "1K",
): Promise<string | null> => {
  try {
    const ai = await getGeminiAPI(aiConfig?.geminiApiKey);
    // Uses specialized Imagen model, not generic chat model
    const model = ai.getGenerativeModel({
      model: MODEL_IMAGEN,
      generationConfig: {
        aspectRatio: "16:9",
        numberOfImages: 1,
      } as Record<string, unknown>,
    });

    const response = await model.generateContent(
      `Educational diagram: ${prompt}`,
    );
    const candidates = response.response.candidates;

    // Extract Inline Data (Base64)
    if (candidates && candidates.length > 0) {
      const parts = candidates[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }
    return null;
  } catch (err) {
    console.error("[generateEducationalImage] Failed:", err);
    return null;
  }
};
