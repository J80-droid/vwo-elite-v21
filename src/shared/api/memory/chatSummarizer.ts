/**
 * Chat Summarizer
 * Summarizes chat sessions before embedding to avoid storing noise
 */

import type { ChatSession } from "../../types/ai-brain";
import { aiGenerate } from "../ai-brain/orchestrator";

// =============================================================================
// SUMMARIZATION
// =============================================================================

const SUMMARY_PROMPT = `Vat dit tutorsessiegesprek samen in 3-5 korte bullets.
Focus op:
- Welk onderwerp werd besproken
- Waar de student moeite mee had
- Belangrijke inzichten of doorbraken
- Eventuele misvattingen die zijn gecorrigeerd

Gesprek:
{CONVERSATION}

Geef ALLEEN de samenvatting in het Nederlands, geen extra tekst:`;

/**
 * Summarize a chat session for embedding
 */
export async function summarizeChat(session: ChatSession): Promise<string> {
  // Format conversation
  const conversation = session.messages
    .map((m) => {
      const role = m.role === "user" ? "Student" : "Tutor";
      // Truncate very long messages
      const content =
        m.content.length > 500 ? m.content.slice(0, 500) + "..." : m.content;
      return `${role}: ${content}`;
    })
    .join("\n\n");

  // Truncate entire conversation if too long
  const maxConversationLength = 4000;
  const truncatedConversation =
    conversation.length > maxConversationLength
      ? conversation.slice(0, maxConversationLength) +
        "\n\n[... gesprek ingekort ...]"
      : conversation;

  const prompt = SUMMARY_PROMPT.replace(
    "{CONVERSATION}",
    truncatedConversation,
  );

  try {
    const summary = await aiGenerate(prompt, {
      preferFast: true, // Use fast model for summarization
      systemPrompt:
        "Je bent een assistent die gesprekken samenvat. Wees beknopt en focus op het leerproces.",
    });

    return cleanSummary(summary);
  } catch (error) {
    console.error("[ChatSummarizer] Failed to summarize:", error);

    // Fallback: create basic summary from first and last messages
    return createFallbackSummary(session);
  }
}

/**
 * Clean up the summary output
 */
function cleanSummary(summary: string): string {
  // Remove any markdown formatting
  let cleaned = summary
    .replace(/^#+\s*/gm, "") // Remove headers
    .replace(/\*\*/g, "") // Remove bold
    .replace(/\*/g, "") // Remove italics
    .trim();

  // Ensure bullet points are consistent
  cleaned = cleaned
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("-") && !trimmed.startsWith("•")) {
        return "- " + trimmed;
      }
      return trimmed.replace(/^•/, "-");
    })
    .filter((line) => line.length > 0)
    .join("\n");

  return cleaned;
}

/**
 * Create a fallback summary when AI summarization fails
 */
function createFallbackSummary(session: ChatSession): string {
  const userMessages = session.messages.filter((m) => m.role === "user");

  if (userMessages.length === 0) {
    return "- Tutorsessie zonder specifieke vragen";
  }

  // Extract key topics from first few user messages
  const topics: string[] = [];

  for (const msg of userMessages.slice(0, 3)) {
    // Look for question words
    const content = msg.content.toLowerCase();

    if (
      content.includes("hoe") ||
      content.includes("wat") ||
      content.includes("waarom")
    ) {
      // Truncate to first sentence or 100 chars
      const firstSentence = msg.content.split(/[.!?]/)[0] || msg.content;
      const truncated = firstSentence.slice(0, 100);
      topics.push(truncated + (firstSentence.length > 100 ? "..." : ""));
    }
  }

  if (topics.length === 0) {
    // Just use first user message
    const firstMsg = userMessages[0]?.content || "";
    topics.push(firstMsg.slice(0, 100) + (firstMsg.length > 100 ? "..." : ""));
  }

  // Format as bullets
  const bullets = topics.map((t) => `- Vraag: ${t}`).join("\n");

  // Add context
  const subject = session.subject ? `\n- Vak: ${session.subject}` : "";
  const topic = session.topic ? `\n- Onderwerp: ${session.topic}` : "";

  return bullets + subject + topic;
}

// =============================================================================
// BATCH SUMMARIZATION
// =============================================================================

/**
 * Summarize multiple chat sessions
 */
export async function summarizeChatBatch(
  sessions: ChatSession[],
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  // Process sequentially to avoid rate limits
  for (const session of sessions) {
    try {
      const summary = await summarizeChat(session);
      results.set(session.id, summary);
    } catch (error) {
      console.error(
        `[ChatSummarizer] Failed to summarize ${session.id}:`,
        error,
      );
      results.set(session.id, createFallbackSummary(session));
    }
  }

  return results;
}

// =============================================================================
// EXTRACTION UTILITIES
// =============================================================================

/**
 * Extract key entities/topics from a chat session
 * Useful for tagging and categorization
 */
export function extractTopics(session: ChatSession): string[] {
  const topics: Set<string> = new Set();

  // Common subject keywords
  const subjectPatterns: Record<string, RegExp[]> = {
    wiskunde: [
      /integraal|differentiaal|vergelijking|functie|grafiek|afgeleide/i,
    ],
    natuurkunde: [/kracht|energie|beweging|elektriciteit|magnetisme|newton/i],
    scheikunde: [/molecuul|atoom|reactie|zuur|base|redox|mol/i],
    biologie: [/cel|dna|eiwit|evolutie|ecosysteem|fotosynthese/i],
    economie: [/markt|vraag|aanbod|kosten|winst|bbp/i],
    geschiedenis: [/oorlog|revolutie|koning|republiek|eeuw/i],
  };

  for (const msg of session.messages) {
    const content = msg.content.toLowerCase();

    for (const [subject, patterns] of Object.entries(subjectPatterns)) {
      if (patterns.some((p) => p.test(content))) {
        topics.add(subject);
      }
    }
  }

  // Add session's explicit subject/topic if present
  if (session.subject) topics.add(session.subject);
  if (session.topic) topics.add(session.topic);

  return Array.from(topics);
}

/**
 * Extract mentioned formulas or equations
 */
export function extractFormulas(session: ChatSession): string[] {
  const formulas: Set<string> = new Set();

  const formulaPatterns = [
    /\$[^$]+\$/g, // LaTeX inline
    /\\\([^)]+\\\)/g, // LaTeX inline alt
    /\\\[[^\]]+\\\]/g, // LaTeX display
    /[a-z]\s*=\s*[^,.\n]+/gi, // Simple equations
    /∫|∑|√|∂|∇|∞/g, // Math symbols
  ];

  for (const msg of session.messages) {
    for (const pattern of formulaPatterns) {
      const matches = msg.content.match(pattern);
      if (matches) {
        matches.forEach((m) => formulas.add(m.trim()));
      }
    }
  }

  return Array.from(formulas);
}
