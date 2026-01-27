/**
 * Debate Service
 * Powering the 'Battle Arena' with multi-agent logic.
 */

import { AIConfig, Language } from "../../types";
import { getGeminiAPI } from "../geminiBase";

export interface DebateTurn {
  speaker: "Pro" | "Con";
  content: string;
}

export interface DebateContext {
  topic: string;
  turns: DebateTurn[];
}

export const generateDebateTurn = async (
  context: DebateContext,
  speaker: "Pro" | "Con",
  lang: Language,
  aiConfig?: AIConfig,
): Promise<string> => {
  const ai = await getGeminiAPI(aiConfig?.geminiApiKey);
  const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" }); // Speed oriented

  const historyText = context.turns
    .map((t) => `${t.speaker}: ${t.content}`)
    .join("\n\n");

  const personaPro =
    "Je bent een gepassioneerd voorstander. Gebruik logica, pathos en sterke retoriek.";
  const personaCon =
    "Je bent een kritisch tegenstander (advocaat van de duivel). Zoek gaten in elk argument en weerleg ze scherp.";

  const prompt = `
     Onderwerp: "${context.topic}"
     Taal: ${lang === "nl" ? "Nederlands" : "Engels"}
     
     Rol: ${speaker === "Pro" ? personaPro : personaCon}
     
     Huidige debat status:
     ${historyText}
     
     Jouw beurt (als ${speaker}). Reageer direct op het laatste punt van de tegenstander (indien aanwezig) en breng een nieuw argument in. Houd het kort en krachtig (max 100 woorden).
   `;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

export const judgeDebate = async (
  context: DebateContext,
  lang: Language,
  aiConfig?: AIConfig,
): Promise<{
  winner: string;
  reason: string;
  scoreProm: number;
  scoreCon: number;
}> => {
  const ai = await getGeminiAPI(aiConfig?.geminiApiKey);
  const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

  const historyText = context.turns
    .map((t) => `${t.speaker}: ${t.content}`)
    .join("\n\n");

  const prompt = `
      Je bent een onpartijdig juryvoorzitter. Evalueer dit debat over "${context.topic}".
      Taal: ${lang === "nl" ? "Nederlands" : "Engels"}
      
      Debat Transcript:
      ${historyText}
      
      Bepaal de winnaar op basis van logica, overtuigingskracht en drogredenen-vrijheid.
      Geef JSON uitvoer:
      {
        "winner": "Pro" of "Con",
        "reason": "Uitleg in 1 zin...",
        "scorePro": 0-100,
        "scoreCon": 0-100
      }
    `;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  });

  return JSON.parse(result.response.text());
};
