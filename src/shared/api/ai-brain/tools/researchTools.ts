import { z } from "zod";

import { aiGenerate } from "../../aiCascadeService";
import { DataVisualizerAgent } from "../DataVisualizerAgent";
import { ResearchIntegrator } from "../ResearchIntegrator";
import { getToolRegistry, type IToolHandler } from "../ToolRegistry";

// --- Tool Implementations ---

/**
 * document_search: RAG-based search across local library and academic sources
 */
const DocumentSearchTool: IToolHandler = {
  name: "document_search",
  category: "Research",
  description: "Zoekt in de lokale bibliotheek en academische bronnen (arXiv, etc.) naar relevante informatie.",
  schema: z.object({
    query: z.string().min(1),
    agentKey: z.enum(["biologist", "historian", "mathematician", "economist", "data_scientist", "scientific_researcher"]).optional().default("scientific_researcher"),
  }),
  async execute(params) {
    const { query, agentKey } = params as { query: string; agentKey: string };
    const sources = await ResearchIntegrator.fetchSources(query, agentKey);
    return {
      query,
      agentKey,
      sources: sources.map(s => ({
        title: s.title,
        url: s.url,
        snippet: s.snippet,
        type: s.sourceType,
        relevance: s.score
      }))
    };
  }
};

/**
 * arxiv_search: Specialized academic search for preprints
 */
const ArxivSearchTool: IToolHandler = {
  name: "arxiv_search",
  category: "Research",
  description: "Zoekt specifiek in de arXiv database naar wetenschappelijke preprints en papers.",
  schema: z.object({
    query: z.string().min(1),
  }),
  async execute(params) {
    const { query } = params as { query: string };
    const sources = await ResearchIntegrator.fetchSources(`${query} paper`, "scientific_researcher");
    const arxivSources = sources.filter(s => s.sourceType === 'preprint' || s.url.includes("arxiv.org"));
    return { query, sources: arxivSources };
  }
};

/**
 * extract_data_from_pdf: Harvesting structured info from documents
 */
const ExtractDataFromPdfTool: IToolHandler = {
  name: "extract_data_from_pdf",
  category: "Research",
  description: "Extraheert gestructureerde data, tabellen of kerngetallen uit een document.",
  schema: z.object({
    sourceId: z.string().min(1),
    focus: z.enum(["tables", "citations", "methodology", "results", "all"]).optional().default("all"),
  }),
  async execute(params) {
    const { sourceId, focus } = params as { sourceId: string; focus: string };
    const data = await ResearchIntegrator.extractData(sourceId);
    return { sourceId, focus, extractedData: data };
  }
};

/**
 * cross_reference: Correlating findings between multiple sources
 */
const CrossReferenceTool: IToolHandler = {
  name: "cross_reference",
  category: "Research",
  description: "Vergelijkt verschillende bronnen om tegenstrijdigheden of overeenkomsten te vinden.",
  schema: z.object({
    findings: z.array(z.string()).min(2),
  }),
  async execute(params) {
    const { findings } = params as { findings: string[] };
    const prompt = `Analyseer de volgende bevindingen uit verschillende bronnen:\n${findings.map((f, i) => `Bron ${i + 1}: ${f}`).join('\n')}\n\nIdentificeer overeenkomsten, tegenstrijdigheden en hiaten.`;
    const result = await aiGenerate(prompt, { systemPrompt: "Je bent een expert in synthetische analyse." });
    return { analysis: result };
  }
};

/**
 * visualize_scientific_data: Generating charts for data
 */
const VisualizeScientificDataTool: IToolHandler = {
  name: "visualize_scientific_data",
  category: "Research",
  description: "Genereert visuele representaties (Mermaid/Chart.js) van wetenschappelijke data of procesbeschrijvingen.",
  schema: z.object({
    content: z.string().min(1),
  }),
  async execute(params) {
    const { content } = params as { content: string };
    const visualizations = await DataVisualizerAgent.generate(content);
    return { visualizations };
  }
};

/**
 * summarize_paper: Summarization of academic texts
 */
const SummarizePaperTool: IToolHandler = {
  name: "summarize_paper",
  category: "Research",
  description: "Vat een academisch artikel of fragment samen met focus op methode en resultaten.",
  schema: z.object({
    content: z.string().min(1),
  }),
  async execute(params) {
    const { content } = params as { content: string };
    const prompt = `Vat het volgende academische artikel samen:\n${content}\n\nFocus op: Onderzoeksvraag, Methodologie, Resultaten en Conclusie.`;
    const summary = await aiGenerate(prompt, { systemPrompt: "Je bent een expert in het samenvatten van academische teksten." });
    return { summary };
  }
};

/**
 * deep_search: Multi-step investigative search
 */
const DeepSearchTool: IToolHandler = {
  name: "deep_search",
  category: "Research",
  description: "Voert een diepgaand onderzoek uit in meerdere stappen. Zoekt eerst breed, analyseert resultaten, en graaft dan dieper in op relevante sub-onderwerpen.",
  schema: z.object({
    query: z.string().min(1),
    agentKey: z.enum(["biologist", "historian", "mathematician", "economist", "data_scientist", "scientific_researcher"]).optional().default("scientific_researcher"),
  }),
  async execute(params) {
    const { query, agentKey } = params as { query: string; agentKey: string };
    const sources = await ResearchIntegrator.deepSearch(query, agentKey);
    return {
      query,
      agentKey,
      mode: "Deep Research",
      sources: sources.map(s => ({
        title: s.title,
        url: s.url,
        snippet: s.snippet,
        type: s.sourceType,
        relevance: s.score
      }))
    };
  }
};

// --- Registration Function ---

export function handleResearchTool(name: string, params: Record<string, unknown>) {
  const registry = getToolRegistry();
  const handler = registry.get(name);
  if (handler) return handler.execute(params);
  throw new Error(`Tool ${name} not found in ResearchTools registry.`);
}

export function registerResearchTools(): void {
  const registry = getToolRegistry();
  registry.registerAll([
    DocumentSearchTool,
    ArxivSearchTool,
    ExtractDataFromPdfTool,
    CrossReferenceTool,
    VisualizeScientificDataTool,
    SummarizePaperTool,
    DeepSearchTool
  ]);
  console.log("[ResearchTools] Registered 6 specialized tools.");
}
