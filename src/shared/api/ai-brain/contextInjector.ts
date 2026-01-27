import {
  getSemanticSearch,
  type SearchContext,
} from "../memory/semanticSearch";
import { getWeakPointTracker } from "./weakPointTracker";

export interface InjectionResult {
  systemPromptAddendum: string;
  hasContext: boolean;
}

export class ContextInjector {
  /**
   * Check if memory system is operational
   */
  async checkHealth(): Promise<boolean> {
    try {
      // Perform a lightweight search to verify DB access
      await getSemanticSearch().search("health_check", { limit: 1 });
      return true;
    } catch (error) {
      console.warn("[ContextInjector] Health check failed:", error);
      return false;
    }
  }

  /**
   * Build a comprehensive context block for the AI prompt
   */
  async buildContext(
    query: string,
    options: {
      subject?: string;
      topic?: string;
      enableMemory?: boolean;
      enableWeakPoints?: boolean;
    } = {},
  ): Promise<InjectionResult> {
    const sections: string[] = [];

    // 1. Memory Retrieval (Semantic Search)
    if (options.enableMemory !== false) {
      try {
        const searchContext: SearchContext = {
          subject: options.subject,
          topic: options.topic,
        };
        const memoryContext = await getSemanticSearch().buildContextInjection(
          query,
          searchContext,
        );
        if (memoryContext && memoryContext.length > 50) {
          sections.push(`### RELEVANTE BIBLIOTHEEK CONTEXT\n${memoryContext}`);
        }
      } catch (e) {
        console.error("[ContextInjector] Memory search failed:", e);
      }
    }

    // 2. Weak Point Injection
    if (options.enableWeakPoints !== false) {
      try {
        const tracker = getWeakPointTracker();
        const weakPoints = await tracker.getWeakPoints(options.subject);
        // Filter to find weak points related to the current query/topic
        const relevantWP = weakPoints
          .filter(
            (wp) =>
              wp.errorRate > 0.3 &&
              (query.toLowerCase().includes(wp.topic.toLowerCase()) ||
                wp.topic === options.topic),
          )
          .slice(0, 2);

        if (relevantWP.length > 0) {
          let wpSection = "### AANDACHTSPUNTEN VOOR DEZE STUDENT\n";
          relevantWP.forEach((wp) => {
            wpSection += `- **${wp.topic}**: De student heeft hier een foutpercentage van ${(wp.errorRate * 100).toFixed(0)}%. `;
            if (wp.suggestedFocus) {
              wpSection += `Focus op: ${wp.suggestedFocus}`;
            }
            wpSection += "\n";
          });
          sections.push(wpSection);
        }
      } catch (e) {
        console.error("[ContextInjector] Weak point retrieval failed:", e);
      }
    }

    if (sections.length === 0) {
      return { systemPromptAddendum: "", hasContext: false };
    }

    const fullContext = `
[GEPERSONALISEERDE CONTEXT]
Gebruik onderstaande informatie om je antwoord beter af te stemmen op de student. 
Verwijs alleen naar de bibliotheek-context als dat relevant is voor de vraag.

${sections.join("\n\n")}
[/GEPERSONALISEERDE CONTEXT]
        `.trim();

    return {
      systemPromptAddendum: fullContext,
      hasContext: true,
    };
  }
}

// Singleton
let injectorInstance: ContextInjector | null = null;

export function getContextInjector(): ContextInjector {
  if (!injectorInstance) {
    injectorInstance = new ContextInjector();
  }
  return injectorInstance;
}
