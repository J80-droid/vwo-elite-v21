/**
 * Intent Classifier
 * Classifies user queries to route to the appropriate model
 */

import type { ModelCapability, TaskIntent } from "@vwo/shared-types";

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
    /bereken|calculate|solve|los op/i,
    /integreer|integraal|integral/i,
    /differentieer|afgeleide|derivative/i,
    /vergelijking|equation/i,
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
    /schrijf.*code|write.*code/i,
    /function|functie|def |class /i,
    /python|javascript|java|c\+\+|typescript/i,
    /debug|fout.*code|error.*code/i,
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
    /deze afbeelding|this image|foto|picture/i,
    /wat zie je|what do you see/i,
    /analyseer.*beeld|analyze.*image/i,
    /screenshot|diagram|grafiek|graph/i,
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
    /waarom|why|explain.*reason/i,
    /vergelijk|compare|contrast/i,
    /analyseer|analyze/i,
    /evalueer|evaluate|beoordeel/i,
    /wat.*als|what if|hypothetisch/i,
    /bewijs|prove|argument/i,
  ];

  if (reasoningPatterns.some((p) => p.test(normalizedQuery))) {
    return {
      intent: "complex_reasoning",
      confidence: 0.7,
      reasoning: "Detected reasoning/analysis keywords",
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
    case "education_help":
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
    case "education_help":
    case "translation":
    case "code_task":
      return "medium"; // 7-13B models
    case "complex_reasoning":
    case "math_problem":
    case "creative_writing":
      return "large"; // 13B+ models
    default:
      return "medium";
  }
}
