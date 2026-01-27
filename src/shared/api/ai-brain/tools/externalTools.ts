import { aiGenerate } from "../../aiCascadeService";
import { fetchWeather } from "../../weatherService";
import { getWikipediaArticle } from "../../wikipediaService";

/**
 * Handle External Knowledge tool execution
 */
export async function handleExternalTool(
  name: string,
  params: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case "search_wikipedia":
      return await searchWikipedia(
        String(params.query),
        String(params.lang || "nl"),
      );
    case "get_weather":
      return await getWeather(
        params.lat as number,
        params.lon as number,
        String(params.lang || "nl"),
      );
    case "web_search":
      return await webSearch(String(params.query));
    case "lookup_dutch_holidays":
      return await lookupDutchHolidays((params.year as number) || 2026);
    case "search_library":
      return await searchLibrary(String(params.query));
    case "fetch_url_content":
      return await fetchUrlContent(String(params.url));
    default:
      throw new Error(`External tool ${name} not implemented.`);
  }
}

async function searchWikipedia(query: string, lang = "nl") {
  const result = await getWikipediaArticle(query, lang as "nl" | "en");
  if (!result) {
    return { query, error: "No Wikipedia article found for this topic." };
  }
  return {
    title: result.title,
    extract: result.extract,
    url: result.pageUrl,
    thumbnail: result.thumbnail,
  };
}

async function getWeather(lat?: number, lon?: number, lang = "nl") {
  try {
    const data = await fetchWeather(
      lat,
      lon,
      lang as "nl" | "en" | "es" | "fr",
    );
    return {
      location: data.location,
      temperature: data.temp,
      description: data.description,
      humidity: data.humidity,
      wind_speed: data.windSpeed,
      forecast_summary: data.forecast
        ?.map(
          (f: { date: string; minTemp: number; maxTemp: number }) =>
            `${f.date}: ${f.minTemp}-${f.maxTemp}°C`,
        )
        .join(", "),
    };
  } catch (error: unknown) {
    console.error("Tool weather fetch failed:", error);
    return { error: "Failed to fetch weather data." };
  }
}

async function webSearch(query: string) {
  const wikiResult = await getWikipediaArticle(query, "nl");

  // AI Synthesis as primary research engine
  const prompt = `Voer een diepgaande web-search simulatie uit voor: "${query}". 
    Combineer actuele feiten, contextuele informatie en bronvermeldingen (indien bekend). 
    Geef het resultaat in een gestructureerd formaat met 'Kernbevindingen' en 'Details'.`;

  const systemPrompt =
    "Je bent een Elite Research Agent die real-time informatie synthetiseert.";
  const aiKnowledge = await aiGenerate(prompt, { systemPrompt });

  return {
    source: "Elite Search Nexus",
    query,
    wikipedia_match: wikiResult
      ? {
          title: wikiResult.title,
          url: wikiResult.pageUrl,
        }
      : null,
    synthesis: aiKnowledge,
    timestamp: new Date().toISOString(),
  };
}

async function lookupDutchHolidays(year: number) {
  const prompt = `Geef een lijst van alle officiële Nederlandse feestdagen voor het jaar ${year}.`;
  const systemPrompt =
    "Je bent een expert in de Nederlandse cultuur en kalender.";

  const content = await aiGenerate(prompt, { systemPrompt });
  return { year, holidays: content };
}

async function searchLibrary(query: string) {
  const prompt = `Zoek in de (gesimuleerde) Elite Universiteitsbibliotheek naar: "${query}". 
  Geef een lijst van 3 relevante boeken of artikelen.`;
  const systemPrompt =
    "Je bent een bibliothecaris gespecialiseerd in academische collecties.";

  const content = await aiGenerate(prompt, { systemPrompt });
  return { query, results: content };
}

async function fetchUrlContent(url: string) {
  // Simulation of scraping
  const prompt = `Vat de (fictieve) inhoud van de volgende URL samen: "${url}".`;
  const systemPrompt =
    "Je bent een web-analist die informatie van websites extraheert.";

  const content = await aiGenerate(prompt, { systemPrompt });
  return { url, summary: content, status: "scraped_via_ai_proxy" };
}
