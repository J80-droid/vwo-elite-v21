/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Academic Module - PWS & Research Tools
 * Extracted from geminiService.ts for better maintainability.
 */

import { getCEFRSystemPrompt } from "@shared/lib/cefrStandards";
import { resolveModel } from "@shared/lib/modelDefaults";

import {
  AcademicSearchResult,
  AIConfig as UserAIConfig,
  Language,
  LiteratureMatrixEntry,
  MindMapData,
  SourceEvaluation,
  StudyMaterial,
} from "../../types";
import { getGeminiAPI } from "../geminiBase";
import { getLangName, retryOperation } from "./helpers";

export const evaluateSource = async (
  text: string,
  _lang: Language,
  aiConfig?: UserAIConfig,
): Promise<SourceEvaluation> => {
  const ai = await getGeminiAPI(aiConfig?.geminiApiKey);
  const prompts = aiConfig?.customPrompts || {};
  const basePrompt =
    prompts.pws_helper || "Evalueer deze bron op betrouwbaarheid:";

  const prompt = `
    ${basePrompt}
    ${text.slice(0, 5000)}
    
    Output JSON:
    {
      "score": 0-10,
      "reliability": "Low|Medium|High",
      "bias": "none|mild|significant",
      "fallacies": [{"name": "...", "description": "..."}],
      "authorIntent": "...",
      "analysis": "..."
    }
  `;

  const model = ai.getGenerativeModel({
    model: resolveModel("gemini", "chat", aiConfig),
    generationConfig: { responseMimeType: "application/json" },
  });

  const response = await model.generateContent(prompt);
  return JSON.parse(
    response.response.text() ||
      '{"score":5,"reliability":"Medium","bias":"unknown","fallacies":[],"authorIntent":"","analysis":""}',
  );
};

export const checkOriginality = async (
  text: string,
  sources: StudyMaterial[],
  _lang: Language,
  aiConfig?: UserAIConfig,
): Promise<string> => {
  const ai = await getGeminiAPI(aiConfig?.geminiApiKey);
  const sourceContent = sources
    .map((s) => s.content?.slice(0, 1000) || "")
    .join("\n---\n");

  const prompt = `
    Vergelijk deze tekst met de bronnen en identificeer overlap:
    
    TEKST:
    ${text.slice(0, 3000)}
    
    BRONNEN:
    ${sourceContent.slice(0, 5000)}
    
    Geef feedback over originaliteit en citeeradvies.
  `;

  const model = ai.getGenerativeModel({
    model: resolveModel("gemini", "chat", aiConfig),
  });

  const response = await model.generateContent(prompt);
  return response.response.text() || "Originaliteitscheck niet beschikbaar.";
};

export const generateMindMap = async (
  topic: string,
  context: string,
  _lang: Language,
  aiConfig?: UserAIConfig,
): Promise<MindMapData> => {
  const ai = await getGeminiAPI(aiConfig?.geminiApiKey);
  const prompt = `
    Genereer een mindmap voor: ${topic}
    Context: ${context}
    
    Output JSON:
    {
      "nodes": [{ "id": "1", "label": "Hoofdonderwerp", "level": 0 }],
      "edges": [{ "from": "1", "to": "2" }]
    }
  `;

  const model = ai.getGenerativeModel({
    model: resolveModel("gemini", "chat", aiConfig),
    generationConfig: { responseMimeType: "application/json" },
  });

  const response = await model.generateContent(prompt);
  return JSON.parse(response.response.text() || '{"nodes":[],"edges":[]}');
};

export const findAcademicSources = async (
  query: string,
  _lang: Language,
  aiConfig?: UserAIConfig,
): Promise<AcademicSearchResult[]> => {
  const ai = await getGeminiAPI(aiConfig?.geminiApiKey);
  const prompt = `
    Suggereer relevante academische bronnen voor onderzoek naar: ${query}
    
    Output JSON array:
    [{
      "title": "...",
      "authors": ["..."],
      "year": 2024,
      "journal": "...",
      "relevance": "high|medium|low",
      "abstract": "..."
    }]
  `;

  const model = ai.getGenerativeModel({
    model: resolveModel("gemini", "chat", aiConfig),
    generationConfig: { responseMimeType: "application/json" },
  });

  const response = await model.generateContent(prompt);
  return JSON.parse(response.response.text() || "[]");
};

export const generateLiteratureMatrix = async (
  materials: StudyMaterial[],
  _lang: Language,
  aiConfig?: UserAIConfig,
): Promise<LiteratureMatrixEntry[]> => {
  const ai = await getGeminiAPI(aiConfig?.geminiApiKey);
  const content = materials
    .map((m) => `[${m.name || "Source"}]: ${m.content?.slice(0, 500) || ""}`)
    .join("\n\n");

  const prompt = `
    Creëer een literatuurmatrix van deze bronnen:
    ${content.slice(0, 8000)}
    
    Output JSON array:
    [{
      "source": "Bron Titel",
      "mainFindings": "...",
      "methodology": "...",
      "relevance": "..."
    }]
  `;

  const model = ai.getGenerativeModel({
    model: resolveModel("gemini", "chat", aiConfig),
    generationConfig: { responseMimeType: "application/json" },
  });

  const response = await model.generateContent(prompt);
  return JSON.parse(response.response.text() || "[]");
};

export const checkAcademicWriting = async (
  text: string,
  lang: Language,
  aiConfig?: UserAIConfig,
): Promise<string> => {
  const ai = await getGeminiAPI(aiConfig?.geminiApiKey);

  // CEFR Injection
  const cefrSystem = [
    "engels",
    "frans",
    "duits",
    "spaans",
    "nederlands",
  ].includes(lang)
    ? `\nAssess against CEFR C1/C2 Academic Writing Standards:\n${getCEFRSystemPrompt("C1")}`
    : "";

  const prompt = `
    Controleer deze academische tekst op:
    - Formeel taalgebruik (Academic Register)
    - Correcte citeerwijze
    - Logische structuur
    - Wetenschappelijke onderbouwing
    ${cefrSystem}
    
    Tekst: ${text.slice(0, 5000)}
    
    Geef concrete verbeterpunten en herschrijf suggesties voor C1/C2 niveau.
  `;

  const model = ai.getGenerativeModel({
    model: resolveModel("gemini", "chat", aiConfig),
  });

  const response = await model.generateContent(prompt);
  return response.response.text() || "Schrijfcheck niet beschikbaar.";
};

// --- PWS Analysis Functions ---
export const analyzePWSSources = async (
  query: string,
  materials: StudyMaterial[],
  lang: Language,
  aiConfig?: UserAIConfig,
): Promise<string> => {
  const { aiGenerate } = await import("../aiCascadeService");

  // NOTE: If materials include PDF/Images, we MUST use Gemini.
  const hasMultimodal = materials.some(
    (m) => m.type !== "txt" && m.type !== "text",
  );

  if (!hasMultimodal) {
    const sourceContext = materials
      .map((m) => `[SOURCE ID: ${m.name}]\n${m.content.substring(0, 15000)}`)
      .join("\n\n");
    const prompt = `
        You are an expert Research Assistant helping a student with their PWS(Profielwerkstuk).
        Your task is to analyze the provided sources and answer the user's question based ONLY on these sources.

Sources:
        ${sourceContext}

Question: "${query}"

Rules:
1. Cite your sources explicitly using[Source Name]format.
        2. Where sources agree, mention the consensus.
        3. Where sources disagree, highlight the contrast(e.g., "Bron A zegt X, terwijl Bron B stelt dat Y...").
        4. If the answer is not in the sources, state that clearly.
        5. Respond in ${getLangName(lang)}.
`;
    return await aiGenerate(prompt, {
      systemPrompt: "You are a research assistant.",
      ...(aiConfig ? { aiConfig } : {}),
    });
  }

  // --- Gemini Fallback for Multimodal ---
  const parts: any[] = [];

  if (materials.length > 20) {
    parts.push({
      text: "[SYSTEM WARNING: Analyzing first 20 sources only due to limit]",
    });
  }

  for (const mat of materials.slice(0, 20)) {
    if (mat.type === "txt") {
      parts.push({
        text: `[SOURCE ID: ${mat.name}]\n${mat.content.substring(0, 50000)}...`,
      });
    } else if (mat.type === "pdf") {
      parts.push({
        inlineData: { mimeType: "application/pdf", data: mat.content },
      });
      parts.push({ text: `[SOURCE ID: ${mat.name}]` });
    }
  }

  parts.push({
    text: `
        You are an expert Research Assistant helping a student with their PWS(Profielwerkstuk).
        Your task is to analyze the provided sources and answer the user's question based ONLY on these sources.

Question: "${query}"

Rules:
1. Cite your sources explicitly using[Source Name]format.
        2. Where sources agree, mention the consensus.
        3. Where sources disagree, highlight the contrast.
        4. If the answer is not in the sources, state that clearly.
        5. Respond in ${getLangName(lang)}.
`,
  });

  return retryOperation(async () => {
    const ai = await getGeminiAPI(aiConfig?.geminiApiKey);
    const model = ai.getGenerativeModel({
      model: resolveModel("gemini", "reasoning", aiConfig),
    });

    // For multimodal parts
    const response = await model.generateContent(parts);
    return response.response.text() || "Geen antwoord gegenereerd.";
  });
};

export const summarizePaper = async (
  text: string,
  lang: Language,
  aiConfig?: UserAIConfig,
): Promise<string> => {
  const prompt = `
    Summarize the following academic text for a VWO (pre-university) student.
    Language: ${getLangName(lang)}.
    
    Text:
    "${text.substring(0, 20000)}" 
    
    Structure:
    1. **Onderzoeksvraag**: What did they investigate?
    2. **Methode**: How did they do it?
    3. **Resultaten**: What did they find?
    4. **Conclusie**: What does it mean?
    
    Keep it concise and understandable (VWO 5/6 level).
  `;

  const systemPrompt = "You are an expert academic summarizer.";

  try {
    const { cascadeGenerate, getAvailableProviders } =
      await import("../aiCascadeService");
    if (getAvailableProviders(aiConfig).length > 0) {
      console.log("[summarizePaper] Using AI cascade");
      const response = await cascadeGenerate(prompt, systemPrompt, {
        ...(aiConfig ? { aiConfig } : {}),
      });
      return response.content;
    }
  } catch (err) {
    console.warn("[summarizePaper] Cascade failed:", err);
  }

  try {
    const ai = await getGeminiAPI(aiConfig?.geminiApiKey);
    const model = ai.getGenerativeModel({
      model: resolveModel("gemini", "chat", aiConfig),
    });

    const response = await model.generateContent(prompt);
    return response.response.text() || "Kon geen samenvatting genereren.";
  } catch (error) {
    console.error("Summarization failed:", error);
    return "Fout bij samenvatten.";
  }
};

export const generateAPACitations = async (
  sources: StudyMaterial[],
  aiConfig?: UserAIConfig,
): Promise<string> => {
  if (!sources.length) return "Geen bronnen om te citeren.";
  const { aiGenerate } = await import("../aiCascadeService");
  try {
    const sourcesList = sources
      .map((s) => `Typ: ${s.type}, Titel: ${s.name}, Datum: ${s.date}`)
      .join("\n");
    const prompt = `
      Generate a valid APA 7 reference list for the following sources.
      If information is missing, make a reasonable assumption or leave a placeholder.
      Format nicely.

  Sources:
      ${sourcesList}
`;

    return await aiGenerate(prompt, {
      systemPrompt: "You are a helpful assistant that generates APA citations.",
      ...(aiConfig ? { aiConfig } : {}),
    });
  } catch (error) {
    console.error("APA gen failed:", error);
    return "Fout bij genereren APA.";
  }
};

export const checkResearchDesign = async (
  mainQuestion: string,
  subQuestions: string,
  subject: string,
  lang: Language,
  aiConfig?: UserAIConfig,
): Promise<string> => {
  const ai = await getGeminiAPI(aiConfig?.geminiApiKey);
  const prompt = `
    Je bent een strenge PWS (Profielwerkstuk) begeleider voor VWO-leerlingen.
    Beoordeel de volgende onderzoeksopzet voor het vak ${subject}.

    Hoofdvraag: "${mainQuestion}"
    Deelvragen: "${subQuestions}"

    Geef kritische feedback op:
    1. **Haalbaarheid:** Kan een scholier dit in 80 uur onderzoeken?
    2. **Meetbaarheid:** Is het een echte onderzoeksvraag of alleen literatuurstudie?
    3. **Specificiteit:** Is de vraag goed afgebakend?
    
    Geef daarna 3 suggesties voor een sterke **Hypothese** die de leerling kan toetsen.
    Schrijf in het ${lang === "nl" ? "Nederlands" : "Engels"}.
    Gebruik Markdown.
  `;

  const model = ai.getGenerativeModel({
    model: resolveModel("gemini", "chat", aiConfig),
  });

  const result = await model.generateContent(prompt);
  return result.response.text() || "Geen feedback gegenereerd.";
};
