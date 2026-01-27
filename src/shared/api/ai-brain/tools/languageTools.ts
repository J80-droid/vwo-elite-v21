import { aiGenerate } from "../../aiCascadeService";

/**
 * Handle Language tool execution
 */
export async function handleLanguageTool(
  name: string,
  params: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case "grammar_check":
      return await grammarCheck(
        String(params.text),
        String(params.lang || "nl"),
      );
    case "translate_contextual":
      return await translateContextual(
        String(params.text),
        String(params.to || "en"),
        String(params.context || ""),
      );
    case "language_feedback":
      return await languageFeedback(
        String(params.text),
        String(params.focus || "general"),
      );
    case "generate_idiom_exercise":
      return await generateIdiomExercise(String(params.lang || "en"));
    case "pronunciation_coach":
      return await pronunciationCoach(
        String(params.text),
        String(params.lang || "en"),
      );
    case "text_to_speech":
      return await textToSpeech(
        String(params.text),
        String(params.lang || "en"),
      );
    case "speech_to_text":
      return await speechToText(params.audio_data as string);
    case "debate_simulator":
      return await debateSimulator(
        String(params.topic),
        String(params.persona || "expert"),
      );
    case "analyze_emotion": {
      const res = await analyzeEmotion(params.audio_data as string);
      return { success: !res.error, ...res };
    }
    default:
      throw new Error(`Language tool ${name} not implemented.`);
  }
}

async function grammarCheck(text: string, lang = "nl") {
  const prompt = `Controleer de volgende ${lang} tekst op grammatica, spelling en interpunctie: "${text}". 
  Geef de gecorrigeerde versie en leg kort uit welke fouten je hebt gevonden (focus op CEFR niveaus).`;
  const systemPrompt =
    "Je bent een expert in taalkunde en pedagogische feedback.";

  const content = await aiGenerate(prompt, { systemPrompt });
  return { original: text, corrected: content };
}

async function translateContextual(text: string, to = "en", context = "") {
  const prompt = `Vertaal de volgende tekst naar het ${to}: "${text}". 
  Context: ${context || "geen"}. 
  Zorg dat de vertaling de juiste toon en nuances behoudt die passen bij de context.`;
  const systemPrompt =
    "Je bent een polyglot vertaler die expert is in contextuele nuances.";

  const content = await aiGenerate(prompt, { systemPrompt });
  return { original: text, translated: content };
}

async function languageFeedback(text: string, focus = "general") {
  const prompt = `Geef gedetailleerde feedback op de volgende tekst: "${text}". 
  Focus op: ${focus}. Kijk naar woordgebruik, zinsstructuur en stijl.`;
  const systemPrompt = "Je bent een ervaren taalcoach.";

  const content = await aiGenerate(prompt, { systemPrompt });
  return { feedback: content };
}

async function generateIdiomExercise(lang = "en") {
  const prompt = `Genereer een idioom-oefening voor de taal ${lang}. 
  Kies 3 veelvoorkomende uitdrukkingen, leg ze uit en vraag de leerling om ze in een zin te gebruiken.`;

  const content = await aiGenerate(prompt, {
    systemPrompt: "Je bent een expert in vreemdetalenonderwijs.",
  });
  return { exercise: content };
}
async function pronunciationCoach(text: string, lang = "en") {
  const prompt = `Geef fonetische instructies en tips voor de uitspraak van: "${text}" in het ${lang}. 
  Wijs specifiek op veelvoorkomende fouten voor Nederlandstaligen.`;
  const systemPrompt = "Je bent een expert in fonetiek en taalonderwijs.";

  const content = await aiGenerate(prompt, { systemPrompt });
  return { text, instructions: content };
}

async function textToSpeech(text: string, lang = "en") {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
    return {
      text,
      lang,
      status: "playing",
      provider: "Web Speech API (Native)",
      message: `Audio wordt nu afgespeeld via de systeem-stem.`,
    };
  }
  return { error: "Speech synthesis not supported in this environment." };
}

async function speechToText(audioData: string) {
  // Get OpenAI API key from localStorage (settings backup)
  let openaiApiKey: string | undefined;
  try {
    const backup = localStorage.getItem("vwo_elite_settings_backup");
    if (backup) {
      const settings = JSON.parse(backup);
      openaiApiKey = settings?.aiConfig?.openaiApiKey;
    }
  } catch {
    // Settings not available, continue without
  }

  // Import Whisper service
  const {
    isWhisperConfigured,
    transcribeAudio,
    base64ToArrayBuffer,
    getMimeType,
  } = await import("../../whisperService");

  // Try Whisper first if configured
  if (isWhisperConfigured(openaiApiKey)) {
    try {
      console.log("[STT] Using OpenAI Whisper for transcription...");

      // Convert base64 to ArrayBuffer
      const audioBuffer = base64ToArrayBuffer(audioData);
      const mimeType = getMimeType(audioData);

      // Create blob with correct MIME type
      const audioBlob = new Blob([audioBuffer], { type: mimeType });

      const result = await transcribeAudio(audioBlob, {
        apiKey: openaiApiKey!,
        language: "nl", // Dutch default for VWO students
      });

      return {
        transcription: result.text,
        language: result.language,
        duration: result.duration,
        segments: result.segments,
        confidence: 0.95,
        status: "success",
        provider: "OpenAI Whisper",
      };
    } catch (error) {
      console.warn("[STT] Whisper failed, falling back to simulation:", error);
    }
  }

  // Fallback: AI simulation (original behavior)
  console.log("[STT] Using AI simulation (Whisper not configured)");
  const prompt = `Simuleer een transcriptie van audio data. 
  Dit is een fallback omdat Whisper niet geconfigureerd is.
  Geef een placeholder tekst terug die aangeeft dat de gebruiker een OpenAI API key moet configureren.`;
  const systemPrompt =
    "Je bent een expert in spraakherkenning en transcriptie.";

  const content = await aiGenerate(prompt, {
    systemPrompt,
  });

  return {
    transcription:
      content ||
      "Whisper niet geconfigureerd. Voeg een OpenAI API key toe in Instellingen.",
    confidence: 0.5, // Lower confidence for simulation
    status: "simulated",
    provider: "AI Simulation (Configure OpenAI key for real STT)",
  };
}

async function debateSimulator(topic: string, persona = "expert") {
  const prompt = `Start een debat over het onderwerp "${topic}". 
  Jij bent een ${persona} en jij opent het debat met een sterk argument.`;
  const systemPrompt =
    "Je bent een scherpe debater die logische argumentatie en retoriek gebruikt.";

  const openingInput = await aiGenerate(prompt, { systemPrompt });
  return { topic, persona, opening_statement: openingInput };
}

async function analyzeEmotion(audioData: string) {
  let humeApiKey: string | undefined;
  try {
    const backup = localStorage.getItem("vwo_elite_settings_backup");
    if (backup) {
      const settings = JSON.parse(backup);
      humeApiKey = settings?.aiConfig?.humeApiKey;
    }
  } catch {
    // Settings not available
  }

  if (!humeApiKey) {
    return {
      error: "Hume API Key is vereist voor emotie-analyse. Voeg deze toe in Instellingen.",
    };
  }

  try {
    const { analyzeAudioEmotion, isHumeConfigured } = await import("../../humeService");
    const { base64ToArrayBuffer } = await import("../../whisperService");

    if (!isHumeConfigured(humeApiKey)) {
      throw new Error("Hume API is niet correct geconfigureerd.");
    }

    const audioBuffer = base64ToArrayBuffer(audioData);
    const result = await analyzeAudioEmotion({
      apiKey: humeApiKey,
      audioData: audioBuffer,
    });

    return {
      emotions: result.emotions,
      dominantEmotion: result.dominantEmotion,
      suggestion: result.suggestion,
      provider: "Hume AI",
      status: "success",
    };
  } catch (error: unknown) {
    console.error("[Hume] Emotion analysis failed:", error);
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
