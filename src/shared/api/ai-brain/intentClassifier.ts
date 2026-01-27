/**
 * Intent Classifier
 * Classifies user queries to route to the appropriate model
 */

import type { ModelCapability, TaskIntent } from "../../types/ai-brain";

// =============================================================================
// RULE-BASED CLASSIFICATION
// =============================================================================

interface ClassificationResult {
  intent: TaskIntent;
  confidence: number;
  reasoning?: string;
}

/**
 * Fast rule-based intent classification
 * Uses keyword matching and patterns for common cases
 */
export function classifyIntentByRules(query: string): ClassificationResult {
  const normalizedQuery = query.toLowerCase().trim();

  // Math/Calculus patterns
  const mathPatterns = [
    /bereken|calculate|solve|los op|résoudre|calcular/i,
    /integreer|integraal|integral|intégrale/i,
    /differentieer|afgeleide|derivative|dérivée|derivada/i,
    /vergelijking|equation|équation|ecuación/i,
    /\d+\s*[+\-*/^]\s*\d+/, // Simple arithmetic
    /\\frac|\\int|\\sum|\\lim/i, // LaTeX math
    /x\^2|x²|√|sin|cos|tan|log/i, // Math functions
  ];

  if (mathPatterns.some((p) => p.test(normalizedQuery))) {
    return {
      intent: "math_problem",
      confidence: 0.9,
      reasoning: "Detected math keywords or expressions",
    };
  }

  // Code patterns
  const codePatterns = [
    /schrijf.*code|write.*code|écris.*code|escribe.*código/i,
    /function|functie|def |class |fonction|función/i,
    /python|javascript|java|c\+\+|typescript/i,
    /debug|fout.*code|error.*code|erreur.*code|error.*código/i,
    /```|<code>|<script>/i,
    /import |export |const |let |var /i,
  ];

  if (codePatterns.some((p) => p.test(normalizedQuery))) {
    return {
      intent: "code_task",
      confidence: 0.85,
      reasoning: "Detected code keywords or syntax",
    };
  }

  // Vision patterns (requires image context)
  const visionPatterns = [
    /deze afbeelding|this image|foto|picture|cette image|esta imagen/i,
    /wat zie je|what do you see|que vois-tu|qué ves/i,
    /analyseer.*beeld|analyze.*image|analyser.*image|analizar.*imagen/i,
    /screenshot|diagram|grafiek|graph|graphique|gráfico/i,
  ];

  if (visionPatterns.some((p) => p.test(normalizedQuery))) {
    return {
      intent: "vision_task",
      confidence: 0.8,
      reasoning: "Detected vision-related keywords",
    };
  }

  // Translation patterns
  const translationPatterns = [
    /vertaal|translate/i,
    /naar.*engels|to english/i,
    /naar.*nederlands|to dutch/i,
    /naar.*frans|to french/i,
    /naar.*duits|to german/i,
    /naar.*spaans|to spanish/i,
  ];

  if (translationPatterns.some((p) => p.test(normalizedQuery))) {
    return {
      intent: "translation",
      confidence: 0.9,
      reasoning: "Detected translation request",
    };
  }

  // Summarization patterns
  const summarizationPatterns = [
    /vat samen|samenvatting|summarize|summary/i,
    /kort.*beschrijf|briefly describe/i,
    /hoofdpunten|key points|main points/i,
    /tl;dr|tldr/i,
  ];

  if (summarizationPatterns.some((p) => p.test(normalizedQuery))) {
    return {
      intent: "summarization",
      confidence: 0.85,
      reasoning: "Detected summarization request",
    };
  }

  // Creative writing patterns
  const creativePatterns = [
    /schrijf.*verhaal|write.*story/i,
    /schrijf.*essay|write.*essay/i,
    /maak.*tekst|create.*text/i,
    /bedenk|invent|imagine/i,
    /gedicht|poem|poetry/i,
  ];

  if (creativePatterns.some((p) => p.test(normalizedQuery))) {
    return {
      intent: "creative_writing",
      confidence: 0.8,
      reasoning: "Detected creative writing request",
    };
  }

  // Complex reasoning patterns
  const reasoningPatterns = [
    /waarom|why|explain.*reason|pourquoi|por qué/i,
    /vergelijk|compare|contrast|comparer|comparar/i,
    /analyseer|analyze|analyser|analizar/i,
    /evalueer|evaluate|beoordeel|évaluer|evaluar/i,
    /wat.*als|what if|et si|qué pasa si|hypothetisch/i,
    /bewijs|prove|argument|preuve|prueba/i,
  ];

  if (reasoningPatterns.some((p) => p.test(normalizedQuery))) {
    return {
      intent: "complex_reasoning",
      confidence: 0.7,
      reasoning: "Detected reasoning/analysis keywords",
    };
  }

  // Somtoday patterns
  const somtodayPatterns = [
    /somtoday|rooster|cijfers|huiswerk|agenda|absentie/i,
    /welk lokaal|hoe laat.*les|volgende uur/i,
    /wat heb ik.*vandaag/i,
  ];

  if (somtodayPatterns.some((p) => p.test(normalizedQuery))) {
    return {
      intent: "somtoday_action",
      confidence: 0.95,
      reasoning: "Detected Somtoday/School related keywords",
    };
  }

  // Image Generation patterns
  const imageGenPatterns = [
    /teken|draw|generate.*image|maak.*afbeelding/i,
    /visualiseer|illustreer|illustration|illustratie/i,
    /schets|sketch/i,
    /creeer.*beeld|create.*image/i,
  ];

  if (imageGenPatterns.some((p) => p.test(normalizedQuery))) {
    return {
      intent: "image_generation",
      confidence: 0.9,
      reasoning: "Detected image generation keywords",
    };
  }

  // Speech Output patterns
  const speechOutputPatterns = [
    /lees.*voor|speak|voorlezen|vertel.*hardop/i,
    /spreek.*uit|audio.*uitleg/i,
    /laat.*horen|luisteren naar/i,
  ];

  if (speechOutputPatterns.some((p) => p.test(normalizedQuery))) {
    return {
      intent: "speech_output",
      confidence: 0.85,
      reasoning: "Detected speech/audio output keywords",
    };
  }

  // Video Generation patterns
  const videoPatterns = [
    /maak.*video|generate.*video|simuleer.*beweging/i,
    /video.*uitleg|cinematic|filmpje/i,
  ];

  if (videoPatterns.some((p) => p.test(normalizedQuery))) {
    return {
      intent: "video_generation",
      confidence: 0.9,
      reasoning: "Detected video generation request",
    };
  }

  // Multi-Agent patterns
  const agentPatterns = [
    /pws.*analyse|expert.*debat|meerdere.*experts/i,
    /combineer.*perspectieven|bioloog.*historicus/i,
  ];

  if (agentPatterns.some((p) => p.test(normalizedQuery))) {
    return {
      intent: "multi_agent_collab",
      confidence: 0.95,
      reasoning: "Detected multi-agent collaboration request",
    };
  }

  // Research patterns
  const researchPatterns = [
    /onderzoek|research|bronnen.*vinden|academic.*sources/i,
    /literatuuronderzoek|literature.*review|vind.*papers/i,
    /wetenschappelijke.*onderbouwing|scientific.*evidence/i,
    /arxiv|pubmed|jstor|scholar/i,
  ];

  if (researchPatterns.some((p) => p.test(normalizedQuery))) {
    return {
      intent: "research",
      confidence: 0.9,
      reasoning: "Detected research/academic source keywords",
    };
  }

  // Quantum Reasoning patterns
  const quantumPatterns = [
    /complexe.*getallen|wiskunde.*d|quantummechanica/i,
    /bewijs.*formeel|abstracte.*logica/i,
  ];

  if (quantumPatterns.some((p) => p.test(normalizedQuery))) {
    return {
      intent: "quantum_reasoning",
      confidence: 0.95,
      reasoning: "Detected high-order abstract reasoning request",
    };
  }

  // Complex Goal / Planning patterns
  const goalPatterns = [
    /maak een plan|plan maken|stappenplan/i,
    /roadmap|projectplan|leerpad/i,
    /hoe kan ik.*bereiken|how to achieve/i,
    /stap voor stap|step by step/i,
    /ontwikkel een.*voor mij/i,
  ];

  if (goalPatterns.some((p) => p.test(normalizedQuery)) || normalizedQuery.length > 200) {
    return {
      intent: "complex_goal",
      confidence: 0.75,
      reasoning: "Query indicates a complex multi-step goal or project",
    };
  }

  // Simple question (short queries, basic questions)
  if (
    normalizedQuery.length < 50 &&
    /^(wat|wie|waar|wanneer|hoe|what|who|where|when|how)\b/i.test(
      normalizedQuery,
    )
  ) {
    return {
      intent: "simple_question",
      confidence: 0.6,
      reasoning: "Short query starting with question word",
    };
  }

  // Default: unknown (will use LLM classification)
  return {
    intent: "unknown",
    confidence: 0.3,
    reasoning: "No clear pattern matched",
  };
}

// =============================================================================
// LLM-BASED CLASSIFICATION
// =============================================================================

const CLASSIFICATION_PROMPT = `Je bent een intent classifier. Classificeer de volgende gebruikersvraag in één van deze categorieën:

- simple_question: Simpele feitelijke vraag die snel beantwoord kan worden
- complex_reasoning: Vraag die diep nadenken, analyse of argumentatie vereist
- math_problem: Wiskundige berekening of probleem
- code_task: Programmeren, debugging of code uitleg
- vision_task: Vraag over een afbeelding of visuele analyse
- creative_writing: Creatief schrijven (essay, verhaal, tekst)
- translation: Vertaling van tekst
- summarization: Samenvatten van tekst
- image_generation: Genereren van een afbeelding of illustratie
- speech_output: Omzetten van tekst naar spraak (voorlezen)
- somtoday_action: Acties uitvoeren of informatie ophalen uit Somtoday (rooster, cijfers)
- video_generation: Genereren van een video simulatie of animatie
- multi_agent_collab: Samenwerking tussen meerdere gespecialiseerde AI experts
- quantum_reasoning: Abstracte logica en wiskundige bewijsvoering (Wiskunde D)
- complex_goal: Een complex doel dat een stappenplan of meerdere acties vereist
- research: Onderzoek doen naar een onderwerp, bronnen vinden, wetenschappelijke papers analyseren
- unknown: Gebruik dit als de vraag niet in bovenstaande categories past

Gebruikersvraag: "{query}"

Antwoord ALLEEN met de categorie naam (in lowercase), niets anders.`;

/**
 * LLM-based intent classification for complex cases
 * Uses a fast model to classify when rules are uncertain
 */
export async function classifyIntentByLLM(
  query: string,
  generateFn: (prompt: string) => Promise<string>,
): Promise<ClassificationResult> {
  try {
    const prompt = CLASSIFICATION_PROMPT.replace("{query}", query);
    const response = await generateFn(prompt);

    const intent = response.trim().toLowerCase() as TaskIntent;

    // Validate the response
    const validIntents: TaskIntent[] = [
      "simple_question",
      "complex_reasoning",
      "math_problem",
      "code_task",
      "vision_task",
      "creative_writing",
      "translation",
      "summarization",
      "image_generation",
      "speech_output",
      "somtoday_action",
      "video_generation",
      "multi_agent_collab",
      "quantum_reasoning",
      "complex_goal",
      "research",
    ];

    if (validIntents.includes(intent)) {
      return {
        intent,
        confidence: 0.85,
        reasoning: "Classified by LLM",
      };
    }

    // Invalid response from LLM
    return {
      intent: "unknown",
      confidence: 0.5,
      reasoning: "LLM returned invalid category",
    };
  } catch (error) {
    console.error("[IntentClassifier] LLM classification failed:", error);
    return {
      intent: "unknown",
      confidence: 0.3,
      reasoning: "LLM classification error",
    };
  }
}

// =============================================================================
// COMBINED CLASSIFIER
// =============================================================================

/**
 * Classify intent using rules first, fallback to LLM if uncertain
 */
export async function classifyIntent(
  query: string,
  options?: {
    llmFallback?: boolean;
    generateFn?: (prompt: string) => Promise<string>;
  },
): Promise<ClassificationResult> {
  // First try rule-based classification
  const ruleResult = classifyIntentByRules(query);

  // If confident enough, use rule result
  if (ruleResult.confidence >= 0.7) {
    return ruleResult;
  }

  // Try LLM classification if enabled and available
  if (options?.llmFallback && options?.generateFn) {
    const llmResult = await classifyIntentByLLM(query, options.generateFn);

    // Use LLM result if it's more confident
    if (llmResult.confidence > ruleResult.confidence) {
      return llmResult;
    }
  }

  // Return rule result as fallback
  return ruleResult;
}

// =============================================================================
// CAPABILITY MAPPING
// =============================================================================

/**
 * Map intent to required model capability
 */
export function intentToCapability(intent: TaskIntent): ModelCapability {
  switch (intent) {
    case "vision_task":
      return "vision";
    case "math_problem":
    case "complex_reasoning":
      return "reasoning";
    case "code_task":
      return "code";
    case "simple_question":
    case "summarization":
      return "fast";
    case "translation":
    case "creative_writing":
      return "reasoning"; // Use reasoning models for quality
    case "embedding":
      return "embedding";
    case "image_generation":
      return "vision"; // Generative vision
    case "speech_output":
      return "audio";
    case "video_generation":
      return "vision"; // Temporal/Vision
    case "multi_agent_collab":
      return "reasoning";
    case "quantum_reasoning":
      return "reasoning";
    case "complex_goal":
    case "research":
      return "reasoning";
    default:
      return "fast"; // Default to fast for unknown
  }
}

/**
 * Get recommended model size based on intent
 */
export function getRecommendedModelSize(
  intent: TaskIntent,
): "small" | "medium" | "large" {
  switch (intent) {
    case "simple_question":
    case "summarization":
      return "small"; // 1-3B models
    case "translation":
    case "code_task":
      return "medium"; // 7-13B models
    case "complex_reasoning":
    case "math_problem":
    case "creative_writing":
    case "research":
      return "large"; // 13B+ models
    default:
      return "medium";
  }
}
