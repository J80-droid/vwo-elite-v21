/**
 * Wikipedia Service
 * Fetches article content from Wikipedia API
 */

interface WikiArticle {
  title: string;
  extract: string;
  pageUrl: string;
  thumbnail?: string;
}

/**
 * Get full article extract by title
 */
export async function getWikipediaArticle(
  title: string,
  lang: "nl" | "en" = "nl",
): Promise<WikiArticle | null> {
  try {
    const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
    url.searchParams.set("action", "query");
    url.searchParams.set("titles", title);
    url.searchParams.set("prop", "extracts|pageimages|info");
    url.searchParams.set("exintro", "0"); // Get full article, not just intro
    url.searchParams.set("explaintext", "1");
    url.searchParams.set("exsectionformat", "plain");
    url.searchParams.set("piprop", "thumbnail");
    url.searchParams.set("pithumbsize", "400");
    url.searchParams.set("inprop", "url");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    const response = await fetch(url.toString());
    const data = await response.json();

    const pages = data.query?.pages;
    if (!pages) return null;

    const pageId = Object.keys(pages)[0];
    if (!pageId || pageId === "-1") return null;

    const page = pages[pageId];

    return {
      title: page.title,
      extract: page.extract || "",
      pageUrl:
        page.fullurl ||
        `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      thumbnail: page.thumbnail?.source,
    };
  } catch (error) {
    console.error("[WikipediaService] Article fetch failed:", error);
    return null;
  }
}

/**
 * Get article extract by page ID
 */

/**
 * Quick extract for a topic (search + get first result)
 */
