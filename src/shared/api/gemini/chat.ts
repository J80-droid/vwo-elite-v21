/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Chat & Socratic Coaching Module
 * Extracted from geminiService.ts for better maintainability.
 */

import { getCEFRSystemPrompt } from "@shared/lib/cefrStandards";
import { MODEL_FLASH } from "@shared/lib/constants";
import {
  buildSystemPrompt,
  PromptRole,
} from "@shared/lib/constants/systemPrompts";

import {
  AIConfig as UserAIConfig,
  ChatSessionSummary,
  CoachRole,
  Language,
  PersonaType,
} from "../../types";
import { getGeminiAPI } from "../geminiBase";
import { getLangName } from "./helpers";

export const chatWithSocraticCoach = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  lang: Language,
  coachRole: CoachRole = "socratic",
  _persona: "mentor" | "strict" | "socratic" = "socratic",
  aiConfig?: UserAIConfig,
  additionalContext?: string,
  basePromptOverride?: string,
): Promise<string> => {
  const { aiGenerate } = await import("../ai-brain/orchestrator");

  // Map coach role to prompt role
  const roleMap: Record<PersonaType, PromptRole> = {
    socratic: "socratic_mentor",
    strict: "socratic_strict",
    peer: "socratic_peer",
    eli5: "eli5",
    strategist: "strategist",
    debater: "debater",
    feynman: "eli5",
  };
  const promptRole = roleMap[coachRole] || "socratic_mentor";

  // Build the complete system prompt with BASE + ROLE
  let systemPrompt = buildSystemPrompt(
    promptRole,
    lang,
    additionalContext,
    basePromptOverride,
  );

  // CEFR Injection (Elite Feature)
  if (
    additionalContext &&
    /engels|frans|duits|spaans|nederlands/i.test(additionalContext)
  ) {
    const cefrPrompt = getCEFRSystemPrompt("C1"); // Default to C1 (Effectief) for VWO Coach
    systemPrompt += `\n\n[CEFR INTEGRATION]\n${cefrPrompt}\nEnsure your dialogue sophistication matches this level.`;
  }

  // --- PERSONA INJECTION ---
  if (aiConfig?.activePersona) {
    systemPrompt += `
    
    [SUBJECT PERSONA ACTIVE]
    (THIS SECTION OVERRIDES ALL PREVIOUS INSTRUCTIONS)
    
    ROLE: ${aiConfig.activePersona.roleDefinition}
    ACADEMIC STANDARDS:
    ${aiConfig.activePersona.academicStandards}
    DIDACTIC RULES:
    ${aiConfig.activePersona.didacticRules}
    `;
  }

  // Convert history to standard LLM messages
  const messages = history.map(h => ({
    role: (h.role === "model" ? "assistant" : "user") as any,
    content: h.parts[0]?.text || ""
  }));

  try {
    // Execute via Elite Orchestrator for multi-model support and intelligent routing
    return await aiGenerate(message, {
      systemPrompt,
      context: additionalContext,
      preferQuality: true,
      intent: "socratic_coaching" as any,
      messages: messages
    });
  } catch (error: unknown) {
    console.error("[SocraticCoach] Orchestrator failed, falling back to basic Gemini:", error);
    // Fallback to basic Gemini if Orchestrator fails
    const ai = await getGeminiAPI(aiConfig?.geminiApiKey);
    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      ...history,
      { role: "user", parts: [{ text: message }] },
    ];
    const model = ai.getGenerativeModel({ model: MODEL_FLASH });
    const response = await model.generateContent({
      contents: contents as any,
    });
    return response.response.text() || "Ik kon geen antwoord genereren.";
  }
};

export const generateChatSummary = async (
  history: { role: string; parts: { text: string }[] }[],
  lang: Language,
  aiConfig?: UserAIConfig,
): Promise<ChatSessionSummary> => {
  const ai = await getGeminiAPI(aiConfig?.geminiApiKey);
  const transcript = history
    .map((h) => `${h.role}: ${h.parts[0]?.text || ""}`)
    .join("\n");

  const prompt =
    lang === "nl"
      ? `
    Analyseer dit gesprek en genereer een samenvatting:
    ${transcript.slice(0, 5000)}
    
    Output JSON:
    {
      "topic": "Korte titel",
      "summary": "Samenvatting in 2-3 zinnen",
      "actionItems": ["actie1", "actie2"]
    }
    `
      : `
    Analyze this conversation and generate a summary in ${lang === "es" ? "Spanish" : lang === "fr" ? "French" : "English"}:
    ${transcript.slice(0, 5000)}
    
    Output JSON:
    {
      "topic": "Short title",
      "summary": "Summary in 2-3 sentences",
      "actionItems": ["action1", "action2"]
    }
    `;

  try {
    const model = ai.getGenerativeModel({
      model: MODEL_FLASH,
      generationConfig: { responseMimeType: "application/json" },
    });
    const response = await model.generateContent(prompt);
    return JSON.parse(
      response.response.text() ||
      '{"topic":"Gesprek","summary":"","actionItems":[]}',
    );
  } catch (error: unknown) {
    // Fallback to gemini-1.5-flash on 429 rate limit
    const err = error as { status?: number; message?: string };
    if (
      err?.status === 429 ||
      err?.message?.includes("429") ||
      err?.message?.includes("RESOURCE_EXHAUSTED")
    ) {
      console.warn(
        "[Chat] Rate limited on primary model, falling back to secondary",
      );
      console.warn(
        "[Chat] Rate limited on primary model, falling back to secondary",
      );
      const model = ai.getGenerativeModel({
        model: MODEL_FLASH,
        generationConfig: { responseMimeType: "application/json" },
      });
      const fallbackResponse = await model.generateContent(prompt);
      return JSON.parse(
        fallbackResponse.response.text() ||
        '{"topic":"Gesprek","summary":"","actionItems":[]}',
      );
    }
    throw error;
  }
};

export const generateSocraticAnalysis = async (
  materialContent: string,
  lang: Language,
  aiConfig?: UserAIConfig,
): Promise<{
  summary: string;
  questions: string[];
  devilsAdvocate: string;
}> => {
  const langName = getLangName(lang);
  const prompt = `
      Act as a Socratic Tutor. Analyze the following text in ${langName}:
      "${materialContent.substring(0, 10000)}"

      Provide:
      1. A concise summary (max 3 sentences).
      2. 3 Socratic Questions that challenge the student to think deeper about the implications or assumptions.
      3. A "Devil's Advocate" argument that challenges the main premise of the text.

      Format strictly as JSON.
    `;

  try {
    const { aiGenerateJSON } = await import("../aiCascadeService");
    const result = (await aiGenerateJSON(
      prompt,
      "You are a Socratic tutor. Generate valid JSON.",
      { ...(aiConfig ? { aiConfig } : {}) },
    )) as { summary: string; questions: string[]; devilsAdvocate: string };
    return (
      result || {
        summary: "Analysis failed.",
        questions: [],
        devilsAdvocate: "",
      }
    );
  } catch (error) {
    console.error("Socratic analysis failed:", error);
    return {
      summary: "Error generating analysis.",
      questions: [],
      devilsAdvocate: "",
    };
  }
};
