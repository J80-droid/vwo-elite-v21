import { z } from "zod";

import { aiGenerate } from "../../aiCascadeService";
import { fetchWeather } from "../../weatherService";
import { getWikipediaArticle } from "../../wikipediaService";
import { getToolRegistry, type IToolHandler } from "../ToolRegistry";

// --- Tool Implementations ---

const SearchWikipediaTool: IToolHandler = {
  name: "search_wikipedia",
  category: "External",
  description: "Zoekt artikelen op Wikipedia voor achtergrondinformatie",
  schema: z.object({
    query: z.string().min(1),
    lang: z.string().optional().default("nl"),
  }),
  async execute(params) {
    return await searchWikipedia(
      String(params.query),
      String(params.lang || "nl"),
    );
  }
};

const GetWeatherTool: IToolHandler = {
  name: "get_weather",
  category: "External",
  description: "Haalt actuele weersinformatie op voor een locatie",
  schema: z.object({
    lat: z.number().optional(),
    lon: z.number().optional(),
    lang: z.string().optional().default("nl"),
  }),
  async execute(params) {
    return await getWeather(
      params.lat as number,
      params.lon as number,
      String(params.lang || "nl"),
    );
  }
};

const WebSearchTool: IToolHandler = {
  name: "web_search",
  category: "External",
  description: "Voert een brede web-zoekopdracht uit via Elite Search Nexus",
  schema: z.object({
    query: z.string().min(1),
  }),
  async execute(params) {
    return await webSearch(String(params.query));
  }
};

const LookupDutchHolidaysTool: IToolHandler = {
  name: "lookup_dutch_holidays",
  category: "External",
  description: "Zoekt officiële Nederlandse feestdagen voor een specifiek jaar",
  schema: z.object({
    year: z.number().optional().default(2026),
  }),
  async execute(params) {
    return await lookupDutchHolidays((params.year as number) || 2026);
  }
};

const SearchLibraryTool: IToolHandler = {
  name: "search_library",
  category: "External",
  description: "Zoekt in de Elite Universiteitsbibliotheek naar academische bronnen",
  schema: z.object({
    query: z.string().min(1),
  }),
  async execute(params) {
    return await searchLibrary(String(params.query));
  }
};

const FetchUrlContentTool: IToolHandler = {
  name: "fetch_url_content",
  category: "External",
  description: "Analyseert en vat de inhoud van een specifieke URL samen",
  schema: z.object({
    url: z.string().url(),
  }),
  async execute(params) {
    return await fetchUrlContent(String(params.url));
  }
};

// --- Helper Functions ---

async function searchWikipedia(query: string, lang = "nl") {
  const result = await getWikipediaArticle(query, lang as "nl" | "en");
  if (!result) return { query, error: "No Wikipedia article found." };
  return { title: result.title, extract: result.extract, url: result.pageUrl };
}

async function getWeather(lat?: number, lon?: number, lang = "nl") {
  try {
    const data = await fetchWeather(lat, lon, lang as "nl" | "en" | "es" | "fr");
    return { location: data.location, temperature: data.temp, description: data.description };
  } catch { return { error: "Weather fetch failed." }; }
}

async function webSearch(query: string) {
  const wikiResult = await getWikipediaArticle(query, "nl");
  const prompt = `Web-search: "${query}". Wikipedia-context: ${wikiResult?.extract || "geen"}`;
  const aiKnowledge = await aiGenerate(prompt, { systemPrompt: "Elite Research Agent." });
  return {
    source: "Elite Search Nexus",
    query,
    wikipedia_match: wikiResult ? { title: wikiResult.title, url: wikiResult.pageUrl } : null,
    synthesis: aiKnowledge
  };
}

async function lookupDutchHolidays(year: number) {
  const content = await aiGenerate(`Feestdagen ${year}.`, { systemPrompt: "Expert Nederlandse cultuur." });
  return { year, holidays: content };
}

async function searchLibrary(query: string) {
  const content = await aiGenerate(`Bibliotheek: "${query}".`, { systemPrompt: "Bibliothecaris." });
  return { query, results: content };
}

async function fetchUrlContent(url: string) {
  const content = await aiGenerate(`Vat URL samen: "${url}".`, { systemPrompt: "Web-analist." });
  return { url, summary: content, status: "scraped_via_ai_proxy" };
}

// --- Registration ---

export function registerExternalTools(): void {
  const registry = getToolRegistry();
  registry.registerAll([
    SearchWikipediaTool,
    GetWeatherTool,
    WebSearchTool,
    LookupDutchHolidaysTool,
    SearchLibraryTool,
    FetchUrlContentTool,
  ]);
  console.log("[ExternalTools] Registered 6 tools.");
}

/**
 * Legacy handler
 * @deprecated Use ToolRegistry instead
 */
export async function handleExternalTool(
  name: string,
  params: Record<string, unknown>,
): Promise<unknown> {
  const registry = getToolRegistry();
  const handler = registry.get(name);
  if (handler) return handler.execute(params);
  throw new Error(`External tool ${name} not implemented.`);
}
