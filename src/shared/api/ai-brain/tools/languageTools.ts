import { z } from "zod";

import { aiGenerate } from "../../aiCascadeService";
import { getToolRegistry, type IToolHandler } from "../ToolRegistry";

// --- Tool Implementations ---

const GrammarCheckTool: IToolHandler = {
  name: "grammar_check",
  category: "Language",
  description: "Controleert tekst op grammatica, spelling en interpunctie",
  schema: z.object({
    text: z.string().min(1),
    lang: z.string().optional().default("nl"),
  }),
  async execute(params) {
    return await grammarCheck(
      String(params.text),
      String(params.lang || "nl"),
    );
  }
};

const TranslateContextualTool: IToolHandler = {
  name: "translate_contextual",
  category: "Language",
  description: "Vertaalt tekst met behoud van nuances en context",
  schema: z.object({
    text: z.string().min(1),
    to: z.string().min(2),
    context: z.string().optional().default(""),
  }),
  async execute(params) {
    return await translateContextual(
      String(params.text),
      String(params.to || "en"),
      String(params.context || ""),
    );
  }
};

const LanguageFeedbackTool: IToolHandler = {
  name: "language_feedback",
  category: "Language",
  description: "Geeft gedetailleerde feedback op taalgebruik en stijl",
  schema: z.object({
    text: z.string().min(1),
    focus: z.string().optional().default("general"),
  }),
  async execute(params) {
    return await languageFeedback(
      String(params.text),
      String(params.focus || "general"),
    );
  }
};

const GenerateIdiomExerciseTool: IToolHandler = {
  name: "generate_idiom_exercise",
  category: "Language",
  description: "Genereert oefeningen voor idiomatische uitdrukkingen",
  schema: z.object({
    lang: z.string().optional().default("en"),
  }),
  async execute(params) {
    return await generateIdiomExercise(String(params.lang || "en"));
  }
};

const PronunciationCoachTool: IToolHandler = {
  name: "pronunciation_coach",
  category: "Language",
  description: "Geeft fonetische instructies en tips voor uitspraak",
  schema: z.object({
    text: z.string().min(1),
    lang: z.string().optional().default("en"),
  }),
  async execute(params) {
    return await pronunciationCoach(
      String(params.text),
      String(params.lang || "en"),
    );
  }
};

const TextToSpeechTool: IToolHandler = {
  name: "text_to_speech",
  category: "Language",
  description: "Zet tekst om in spraak (TTS)",
  schema: z.object({
    text: z.string().min(1),
    lang: z.string().optional().default("en"),
  }),
  async execute(params) {
    return await textToSpeech(
      String(params.text),
      String(params.lang || "en"),
    );
  }
};

const SpeechToTextTool: IToolHandler = {
  name: "speech_to_text",
  category: "Language",
  description: "Transcribeert audio naar tekst (STT)",
  schema: z.object({
    audio_data: z.string().min(1),
  }),
  async execute(params) {
    return await speechToText(params.audio_data as string);
  }
};

const DebateSimulatorTool: IToolHandler = {
  name: "debate_simulator",
  category: "Language",
  description: "Start een interactief debat over een onderwerp",
  schema: z.object({
    topic: z.string().min(1),
    persona: z.string().optional().default("expert"),
  }),
  async execute(params) {
    return await debateSimulator(
      String(params.topic),
      String(params.persona || "expert"),
    );
  }
};

const AnalyzeEmotionTool: IToolHandler = {
  name: "analyze_emotion",
  category: "Language",
  description: "Analyseert emoties in spraak via Hume AI",
  schema: z.object({
    audio_data: z.string().min(1),
  }),
  async execute(params) {
    const res = await analyzeEmotion(params.audio_data as string);
    return { success: !res.error, ...res };
  }
};

// --- Helper Functions ---

async function grammarCheck(text: string, lang = "nl") {
  const prompt = `Controleer de volgende ${lang} tekst op grammatica, spelling en interpunctie: "${text}". 
  Geef de gecorrigeerde versie en leg kort uit welke fouten je hebt gevonden (focus op CEFR niveaus).`;
  const systemPrompt = "Je bent een expert in taalkunde en pedagogische feedback.";
  const content = await aiGenerate(prompt, { systemPrompt });
  return { original: text, corrected: content };
}

async function translateContextual(text: string, to = "en", context = "") {
  const prompt = `Vertaal naar ${to}: "${text}". Context: ${context || "geen"}.`;
  const content = await aiGenerate(prompt, { systemPrompt: "Polyglot vertaler." });
  return { original: text, translated: content };
}

async function languageFeedback(text: string, focus = "general") {
  const prompt = `Feedback op: "${text}". Focus: ${focus}.`;
  const content = await aiGenerate(prompt, { systemPrompt: "Ervaren taalcoach." });
  return { feedback: content };
}

async function generateIdiomExercise(lang = "en") {
  const prompt = `Idioom oefening ${lang}.`;
  const content = await aiGenerate(prompt, { systemPrompt: "Expert vreemdetalenonderwijs." });
  return { exercise: content };
}

async function pronunciationCoach(text: string, lang = "en") {
  const prompt = `Uitspraak tips voor: "${text}" (${lang}).`;
  const content = await aiGenerate(prompt, { systemPrompt: "Expert fonetiek." });
  return { text, instructions: content };
}

async function textToSpeech(text: string, lang = "en") {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
    return { text, lang, status: "playing", message: "Audio wordt afgespeeld." };
  }
  return { error: "Speech synthesis not supported." };
}

async function speechToText(audioData: string) {
  let openaiApiKey: string | undefined;
  try {
    const backup = localStorage.getItem("vwo_elite_settings_backup");
    if (backup) {
      const settings = JSON.parse(backup);
      openaiApiKey = settings?.aiConfig?.openaiApiKey;
    }
  } catch { /* ignore */ }

  const { isWhisperConfigured, transcribeAudio, base64ToArrayBuffer, getMimeType } = await import("../../whisperService");

  if (isWhisperConfigured({ apiKey: openaiApiKey })) {
    try {
      const audioBuffer = base64ToArrayBuffer(audioData);
      const mimeType = getMimeType(audioData);
      const audioBlob = new Blob([audioBuffer], { type: mimeType });
      const result = await transcribeAudio(audioBlob, { apiKey: openaiApiKey!, language: "nl" });
      return { transcription: result.text, language: result.language, duration: result.duration, status: "success", provider: "OpenAI Whisper" };
    } catch { /* fallback */ }
  }

  return { transcription: "Whisper niet geconfigureerd.", status: "simulated" };
}

async function debateSimulator(topic: string, persona = "expert") {
  const prompt = `Debat over "${topic}" als ${persona}.`;
  const result = await aiGenerate(prompt, { systemPrompt: "Scherpe debater." });
  return { topic, persona, opening_statement: result };
}

async function analyzeEmotion(audioData: string) {
  let humeApiKey: string | undefined;
  try {
    const backup = localStorage.getItem("vwo_elite_settings_backup");
    if (backup) {
      const settings = JSON.parse(backup);
      humeApiKey = settings?.aiConfig?.humeApiKey;
    }
  } catch { /* ignore */ }

  if (!humeApiKey) return { error: "Hume API Key vereist." };

  try {
    const { analyzeAudioEmotion } = await import("../../humeService");
    const { base64ToArrayBuffer } = await import("../../whisperService");
    const audioBuffer = base64ToArrayBuffer(audioData);
    const result = await analyzeAudioEmotion({ apiKey: humeApiKey, audioData: audioBuffer });
    return { emotions: result.emotions, dominantEmotion: result.dominantEmotion, status: "success" };
  } catch (error) {
    return { error: String(error) };
  }
}

// --- Registration ---

export function registerLanguageTools(): void {
  const registry = getToolRegistry();
  registry.registerAll([
    GrammarCheckTool,
    TranslateContextualTool,
    LanguageFeedbackTool,
    GenerateIdiomExerciseTool,
    PronunciationCoachTool,
    TextToSpeechTool,
    SpeechToTextTool,
    DebateSimulatorTool,
    AnalyzeEmotionTool,
  ]);
  console.log("[LanguageTools] Registered 9 tools.");
}

/**
 * Legacy handler
 * @deprecated Use ToolRegistry instead
 */
export async function handleLanguageTool(
  name: string,
  params: Record<string, unknown>,
): Promise<unknown> {
  const registry = getToolRegistry();
  const handler = registry.get(name);
  if (handler) return handler.execute(params);
  throw new Error(`Language tool ${name} not implemented.`);
}
