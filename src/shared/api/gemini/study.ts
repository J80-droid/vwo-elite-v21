/* eslint-disable @typescript-eslint/no-explicit-any */
import { SchemaType } from "@google/generative-ai";
import { resolveModel } from "@shared/lib/modelDefaults";
import {
  AIConfig as UserAIConfig,
  GeneratedLesson,
  Language,
  StudyMaterial,
  StudyPlanItem,
} from "@shared/types/index";

import { aiGenerateJSON, getAvailableProviders } from "../aiCascadeService";
import { getGeminiAPI } from "../geminiBase";
import { knowledgeProcessor } from "../lesson/KnowledgeProcessor";
import { getLangName } from "./helpers";

// --- Study Planning ---

export const generateStudyPlan = async (
  subject: string,
  examDate: string,
  chapters: string,
  timePerDay: string,
  energyLevel: string,
  _lang: Language,
  daysBehind: number = 0,
  _files: File[] = [],
  aiConfig?: UserAIConfig,
): Promise<StudyPlanItem[] | null> => {
  const ai = await getGeminiAPI(aiConfig?.geminiApiKey);
  const prompts = aiConfig?.customPrompts || {};
  const basePrompt =
    prompts.study_planner ||
    "Je bent een elite studieplanner voor VWO scholieren.";

  const prompt = `
    ${basePrompt}
    Vak: ${subject}
    Hoofdstukken/Stof: ${chapters}
    Datum Toets: ${examDate}
    Beschikbare tijd per dag: ${timePerDay}
    Huidige Energielevel: ${energyLevel}
    Aantal dagen achterstand: ${daysBehind}

    GENEREER JSON ARRAY van studiemomenten met:
    - id, subject, topic, date (YYYY-MM-DD), durationMinutes, type (read|practice|review), completed
    
    Gebruik Spaced Repetition (1-3-7 methode) en splits lange taken op.
  `;

  const schema = {
    type: SchemaType.ARRAY,
    items: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING },
        subject: { type: SchemaType.STRING },
        topic: { type: SchemaType.STRING },
        date: { type: SchemaType.STRING },
        durationMinutes: { type: SchemaType.NUMBER },
        type: { type: SchemaType.STRING, enum: ["read", "practice", "review"] },
        completed: { type: SchemaType.BOOLEAN },
      },
      required: ["subject", "topic", "date", "durationMinutes", "type"],
    },
  };

  try {
    if (getAvailableProviders(aiConfig).length > 0) {
      const result = await aiGenerateJSON(prompt, "You are a study planner.", {
        ...(aiConfig ? { aiConfig } : {}),
      });
      if (Array.isArray(result)) return mapToStudyPlan(result);
      const resAny = result as Record<string, unknown>;
      const arrayKey = Object.keys(resAny).find((key) =>
        Array.isArray(resAny[key]),
      );
      if (arrayKey) return mapToStudyPlan(resAny[arrayKey] as unknown[]);
      return [];
    }
  } catch (err) {
    console.warn("[generateStudyPlan] Cascade failed:", err);
  }

  // Fallback to direct Gemini
  const modelName = resolveModel("gemini", "reasoning", aiConfig);
  const model = ai.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema as any,
    },
  });

  const response = await model.generateContent(prompt);
  const resultText = response.response.text() || "[]";
  return JSON.parse(resultText);
};

const mapToStudyPlan = (items: unknown[]): StudyPlanItem[] => {
  return (items as Record<string, unknown>[]).map((item, idx) => ({
    id: (item.id as string) || `plan-${Date.now()}-${idx}`,
    title: (item.title as string) || (item.topic as string) || "Studie Taak",
    subject: (item.subject as string) || "Studie",
    topic: (item.topic as string) || (item.title as string) || "Zelfstudie",
    date: (item.date as string) || new Date().toISOString().split("T")[0]!,
    durationMinutes: (item.durationMinutes as number) || 30,
    type: (["read", "practice", "review"].includes(item.type as string)
      ? item.type
      : "read") as "read" | "practice" | "review",
    completed: !!item.completed,
    priority: "Medium" as const,
    estimatedHours: ((item.durationMinutes as number) || 30) / 60,
  }));
};

// --- Lesson Generation ---

// ELITE THRESHOLDS (Synced for 1M context models like Flash)
const HEAVY_MAP_REDUCE_THRESHOLD = 4000000; // ~1M tokens. Below this, use Direct Path.

export const generateLesson = async (
  materials: StudyMaterial[],
  subject: string,
  lang: Language,
  aiConfig?: UserAIConfig,
  onProgress?: (stage: string, percentage: number) => void,
  onStatus?: (status: string, message: string) => void,
): Promise<GeneratedLesson> => {
  const ai = await getGeminiAPI(aiConfig?.geminiApiKey);
  if (!ai) {
    throw new Error("Gemini AI service is niet correct geïnitialiseerd.");
  }

  // --- Subject Persona Injection ---
  const personaInstr = aiConfig?.activePersona
    ? `
      [SUBJECT PERSONA ACTIVE]
      ROLE: ${aiConfig.activePersona.roleDefinition}
      ACADEMIC STANDARDS: ${aiConfig.activePersona.academicStandards}
      DIDACTIC RULES: ${aiConfig.activePersona.didacticRules}
    `
    : "";

  // --- Didactic Context Injection ---
  const dnc = (aiConfig as any)?.didacticConfig;
  const didacticInstr = dnc ? `
    [DIDACTIC CONFIGURATION ACTIVE]
    DEPTH: ${dnc.depth} (${dnc.depth === "espresso" ? "Short, punchy, high energy, focus on basics." : dnc.depth === "deep-dive" ? "Extensive, complex connections, academic depth." : "Balanced VWO level."})
    SCAFFOLDING: ${dnc.scaffolding} (${dnc.scaffolding === "high" ? "Guided learning, simplified complex terms." : dnc.scaffolding === "none" ? "Exam mode - strict academic tone, no hand-holding." : "Moderate support."})
    ROLE: ${dnc.role} (${dnc.role === "teaching" ? "The content should prepare the student to TEACH this topic. Focus on explaining 'why' and using analogies." : dnc.role === "devil" ? "Pro-Contra style, focus on debates and critical thinking." : "Standard student role."})
    MASTERY: ${dnc.mastery || 'competent'} (${dnc.mastery === "novice" ? "User is new to the topic. Explain basic terms, use simple interactive settings, and high scaffolding." : dnc.mastery === "expert" ? "User has high mastery. Use complex parameters in simulations, omit basic explanations, focus on advanced edge cases." : "Standard VWO complexity."})
    FOCUS: ${dnc.focus}
  ` : "";

  const prompts = aiConfig?.customPrompts || {};
  const basePrompt =
    prompts.lesson_generator ||
    "Je bent een ervaren eerstegraads docent aan het vwo (bovenbouw). Je bent gespecialiseerd in examentraining en didactiek. Je antwoordt altijd in het Nederlands. Gebruik LaTeX voor alle formules. Je doel is om conceptueel inzicht te creëren, niet alleen om het antwoord te geven.";

  const hasMultimodalContent = materials.some(
    (m) => m.type !== "txt" && m.type !== "text",
  );

  // LOG: Using multimodal capabilities if detected: ${hasMultimodalContent}
  console.log(`[generateLesson] Model resolve with base: ${basePrompt.substring(0, 20)}... Multimodal: ${hasMultimodalContent}`);

  const parts: any[] = [];
  const inlineImages: { mimeType: string; data: string }[] = [];
  const inlineMedia: { mimeType: string; data: string }[] = [];

  // --- Knowledge Digestion (Elite Map-Reduce Strategy) ---
  const totalChars = materials.reduce((acc, m) => acc + (m.content?.length || 0), 0);
  const isHeavyLoad = totalChars > HEAVY_MAP_REDUCE_THRESHOLD;

  console.log(`[generateLesson] Digesting ${materials.length} materials. Heavy Mode: ${isHeavyLoad}`);

  const processedContext = await knowledgeProcessor.digestMaterials(
    materials.map(m => ({ id: m.id, content: m.content, name: m.name || "Unnamed Material" })),
    {
      topic: subject,
      intent: basePrompt,
      aiConfig,
      onProgress,
      onStatus: (status, msg) => {
        // Relay inner status (like rate limits)
        onStatus?.(status, msg);
      }
    }
  );

  // Transition stage manually if we had a cache hit
  onStatus?.("cache", "Kennis gesynchroniseerd.");
  onProgress?.("Voorbereiden van lesstructuur...", 80);

  // ELITE RECOVERY: Small pause to let RPM bucket refill after Map-Reduce
  await new Promise(r => setTimeout(r, 2000));

  // We gather multimodal content. 
  // ELITE FIX: In heavy mode, we omit raw PDF blobs to save tokens as the text is already captured in processedContext.
  for (const mat of materials) {
    if (mat.type === "image") {
      // Elite optimization: limit images in heavy mode to preserve context window
      if (!isHeavyLoad || inlineImages.length < 5) {
        inlineImages.push({ mimeType: "image/jpeg", data: mat.content });
        parts.push({ text: `[Image Context: ${mat.name}]` });
      }
    } else if (mat.type === "pdf") {
      // ELITE OPTIMIZATION: Always skip raw PDF binary for non-Gemini or large files to avoid "Double Dipping".
      // But for SMALL PDFs on Gemini, we include them so the model can SEE diagrams/graphs.
      const sizeBytes = mat.content.length * (3 / 4); // Rough base64 to bytes
      if (sizeBytes < 2000000) {
        console.log(`[generateLesson] Multimodal: Including PDF '${mat.name}' blob for vision-enhanced processing.`);
        inlineMedia.push({ mimeType: "application/pdf", data: mat.content });
      } else {
        console.log(`[generateLesson] Optimized: Skipping raw PDF '${mat.name}' blob (>2MB). Text context is already in summary.`);
      }
      parts.push({ text: `[Source: PDF '${mat.name}']` });
    }
  }

  // Prepend the digested knowledge to parts
  parts.unshift({ text: processedContext });

  // CEFR Injection for Languages
  const isLanguageSubject = [
    "engels",
    "frans",
    "duits",
    "spaans",
    "nederlands",
  ].some((s) => subject.toLowerCase().includes(s));
  const cefrContext = isLanguageSubject
    ? `\n\n    IMPORTANT: This is a language lesson. Align strictly with CEFR C1/C2 standards (VWO Final Exam Level). Use academic vocabulary and complex sentence structures suitable for this level.`
    : "";

  const finalPrompt = `
    ${parts.map(p => p.text).join("\n\n")}

    ${personaInstr}
    ${didacticInstr}
    
    ${basePrompt} for ${subject}.
    
    The lesson MUST be entirely in ${getLangName(lang)}.
    
    **INTERACTIVE COMPONENTS (GenUI):**
    If a concept involves dynamic systems, generate an 'interactive' object. 
    Allowed types: simulation, field, circuit, wave, quantum, molecule, analysis, electro, process, feedback, genetics, ecology, market-graph, concept-map, math-analysis, math-geometry, math-motion, language-text-analysis, language-syntax-builder, language-immersion, dutch-argumentation, dutch-text-anatomy, dutch-style, philosophy-logic, philosophy-thought-experiment, philosophy-concept-map.

    ${cefrContext}

    **JSON STRUCTURE (STRICT):**
    {
      "title": "Main Lesson Title",
      "summary": "Brief pedagogical summary",
      "keyConcepts": ["concept1", "concept2"],
      "pitfalls": ["mistake1", "mistake2"],
      "sections": [
        {
          "heading": "Section Title",
          "content": "Detailed explanation with LaTeX formulas. Use \\( formula \\) for inline and \\[ formula \\] for blocks.",
          "imagePrompt": "English short description for a diagram",
          "examples": ["example 1"],
          "interactive": { "type": "ALLOWED_TYPE", "config": { ... } }
        }
      ],
      "subjectConnections": ["Topic A (Physics): Connection description...", "Topic B (Math): ..."],
      "crossCurricularConnections": ["Chemistry: description...", "Biology: ..."],
      "quiz": [
        { 
          "id": "q1", 
          "type": "multiple-choice", 
          "text": "...", 
          "options": ["A", "B", "C", "D"], 
          "correctAnswerIndex": 0, 
          "explanation": "High-quality academic explanation",
          "hint": "Subtle nudge",
          "solutionSteps": ["Step 1...", "Step 2..."] 
        }
      ]
    }

    **CONTENT REQUIREMENTS:**
    1. EXAMPLES: Provide EXACTLY 5 high-quality real-world examples in total across all sections. Distribute them where they fit best.
    2. CONNECTIONS: The 'subjectConnections' and 'crossCurricularConnections' MUST be filled with at least 2 relevant items each.
    
    **STRUCTURAL FORMATTING (STRICT):**
    - LABELS/TITLES: If you use a label or bolded title at the start of a point (e.g., **Systeembegrenzing:**), you MUST put a double newline after it so the explanation starts on a NEW line. Never put text on the same line as a bolded label.
    - FORMULA DERIVATIONS: Each step of a formula derivation MUST be on its own separate line to create a clear vertical flow. Never wrap multiple steps on one line with arrows. Use block math \\[ ... \\] for EVERY individual step.
    - LATEX COMMANDS: NEVER omit the backslash (\\) for Greek letters (\\alpha, \\Sigma, etc.) or mathematical functions (\\tan, \\sin, \\frac). If you write "Sigma" or "alpha" without a backslash inside math delimiters, the rendering will fail.
    - TEXT IN MATH: Use \\text{...} for any descriptive words inside a math block.
    - LISTS: Use bulleted lists ( - ) for multiple characteristics, properties, or variables under a label.
    - NO BACKTICKS FOR TITLES: Never use inline code (backticks) for labels or titles. Use bold or H3 headers.
    
    **PROMPT LEAK PREVENTION:**
    Do NOT include any internal metadata, instruction headers, segment markers, or tags (like [SUBJECT PERSONA ACTIVE] or [DIDACTIC CONFIGURATION ACTIVE]) in the final text. The content must be professional, clean, and directly academic.

    Format as valid JSON matching this schema precisely. Use LaTeX for ALL mathematical formulas. IMPORTANT: Always wrap LaTeX formulas in \\( ... \\) for inline or \\[ ... \\] for block rendering. Never use raw LaTeX without delimiters.`;
  onStatus?.("generating", "Elite Engine: Les opbouwen...");

  // ELITE UX: Granular status updates to keep user informed during long generations
  let isWaiting = false;
  const statusInterval = setInterval(() => {
    if (isWaiting) return;
    const messages = [
      "Didactische flow verfijnen...",
      "Interactieve componenten configureren...",
      "LaTeX formules valideren...",
      "Examenrelevantie controleren...",
      "Pitfalls identificeren...",
      "Structuur optimaliseren..."
    ];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    onStatus?.("generating", `Elite Engine: ${randomMsg}`);
  }, 6000);

  try {
    return await aiGenerateJSON<GeneratedLesson>(finalPrompt, "You are a professional lesson generator.", {
      aiConfig,
      requiresMultimodal: hasMultimodalContent,
      inlineImages,
      inlineMedia,
      maxTokens: 16384, // ELITE FIX: Ensure enough headroom for massive chapters
      onStatus: (status, msg) => {
        isWaiting = (status === "waiting");
        onStatus?.(status, msg);
      },
      onProgress: (stage, pct) => onProgress?.(stage, pct)
    });
  } finally {
    clearInterval(statusInterval);
  }
};

// --- Gap Analyzer ---
// ... (unchanged generateGapAnalysis and analyzeBlurting already use cascade)

export const generateGapAnalysis = async (
  subject: string,
  libraryTopics: string[],
  lang: Language,
  aiConfig?: UserAIConfig,
): Promise<any> => {
  const prompts = aiConfig?.customPrompts || {};
  const basePrompt = prompts.gap_analyzer || "Compare topics against syllabus.";

  const prompt = `
    ${basePrompt}
    Subject: ${subject}
    Student Topics: ${libraryTopics.join(", ")}
    Output coveredTopics, missingTopics, overallCoverage.
    Language: ${getLangName(lang)}.
  `;

  return await aiGenerateJSON(prompt, "You are a curriculum gap analyzer.", { aiConfig });
};

// --- Blurting Analysis ---

export const analyzeBlurting = async (
  topic: string,
  userContent: string,
  aiConfig?: UserAIConfig,
): Promise<any> => {
  const prompt = `
      Evaluate Active Recall for topic: "${topic}"
      INPUT: "${userContent}"
      Format JSON: score, missingPoints, misconceptions, feedback.
   `;
  return await aiGenerateJSON(prompt, "Teacher evaluating active recall.", { aiConfig });
};
