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
  // ... (keep current)
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

/**
 * analyze_pws_sources: Specialized analysis for Profielwerkstuk
 */
const AnalyzePwsSourcesTool: IToolHandler = {
  name: "analyze_pws_sources",
  category: "Research",
  description: "Analyseert bronnen specifiek voor een Profielwerkstuk (PWS) op betrouwbaarheid en relevantie.",
  schema: z.object({
    sources: z.array(z.string()).min(1),
  }),
  async execute(params) {
    const { sources } = params as { sources: string[] };
    const prompt = `Analyseer deze PWS bronnen:\n${sources.join("\n")}. Bepaal betrouwbaarheid en bruikbaarheid.`;
    const result = await aiGenerate(prompt, { systemPrompt: "Elite PWS Begeleider." });
    return { analysis: result };
  }
};

/**
 * check_apa_citations: Validation of bibliography formatting
 */
const CheckApaCitationsTool: IToolHandler = {
  name: "check_apa_citations",
  category: "Research",
  description: "Controleert tekst op correcte APA citaties en bronvermelding.",
  schema: z.object({
    text: z.string().min(1),
  }),
  async execute(params) {
    const { text } = params as { text: string };
    const prompt = `Controleer of de volgende tekst correcte APA citaties bevat:\n"${text}". Geef verbeteringen waar nodig.`;
    const result = await aiGenerate(prompt, { systemPrompt: "Expert in academische standaarden." });
    return { verification: result };
  }
};

/**
 * check_originality: Plagiarism and uniqueness check
 */
const CheckOriginalityTool: IToolHandler = {
  name: "check_originality",
  category: "Research",
  description: "Evalueert de originaliteit van een tekst en identificeert mogelijke plagiaatrisico's.",
  schema: z.object({
    text: z.string().min(1),
  }),
  async execute(params) {
    const { text } = params as { text: string };
    const prompt = `Evalueer de originaliteit van deze tekst:\n"${text}". Geef een inschatting van de authenticiteit.`;
    const result = await aiGenerate(prompt, { systemPrompt: "Elite Academic Integrity Service." });
    return { originality_score: "AI analysis completed", feedback: result };
  }
};

/**
 * evaluate_source: Critical appraisal of source quality
 */
const EvaluateSourceTool: IToolHandler = {
  name: "evaluate_source",
  category: "Research",
  description: "Geeft een kritische beoordeling van de kwaliteit en betrouwbaarheid van een specifieke bron.",
  schema: z.object({
    source_description: z.string().min(1),
  }),
  async execute(params) {
    const { source_description } = params as { source_description: string };
    const prompt = `Beoordeel de kwaliteit van de volgende bronbeschrijving: "${source_description}". Focus op de CRAAP-methode.`;
    const result = await aiGenerate(prompt, { systemPrompt: "Expert in informatievaardigheden." });
    return { evaluation: result };
  }
};

/**
 * research_design_check: Methodological verification
 */
const ResearchDesignCheckTool: IToolHandler = {
  name: "research_design_check",
  category: "Research",
  description: "Evalueert een onderzoeksopzet op methodologische consistentie en validiteit.",
  schema: z.object({
    design: z.string().min(1),
  }),
  async execute(params) {
    const { design } = params as { design: string };
    const prompt = `Controleer deze onderzoeksopzet op methodologische validiteit:\n"${design}". Geef suggesties voor verbetering.`;
    const result = await aiGenerate(prompt, { systemPrompt: "Expert in onderzoeksmethodologie." });
    return { methodological_feedback: result };
  }
};

/**
 * generate_literature_matrix: Synthesis of multiple papers
 */
const GenerateLiteratureMatrixTool: IToolHandler = {
  name: "generate_literature_matrix",
  category: "Research",
  description: "Genereert een vergelijkende tabel (literatuurmatrix) op basis van meerdere bronnen.",
  schema: z.object({
    sources: z.array(z.string()).min(1),
  }),
  async execute(params) {
    const { sources } = params as { sources: string[] };
    const prompt = `Maak een literatuurmatrix (vergelijking op basis van thema's, methoden en resultaten) voor deze bronnen:\n${sources.join("\n")}.`;
    const result = await aiGenerate(prompt, { systemPrompt: "Synthese expert voor academisch onderzoek." });
    return { matrix_content: result };
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
    ArxivSearchTool,
    ExtractDataFromPdfTool,
    CrossReferenceTool,
    VisualizeScientificDataTool,
    SummarizePaperTool,
    DeepSearchTool,
    AnalyzePwsSourcesTool,
    CheckApaCitationsTool,
    CheckOriginalityTool,
    EvaluateSourceTool,
    ResearchDesignCheckTool,
    GenerateLiteratureMatrixTool,
  ]);

  // Register with aliases
  registry.register(DocumentSearchTool, ["find_academic_sources"]);

  console.log("[ResearchTools] Registered 8 specialized tools.");
}
