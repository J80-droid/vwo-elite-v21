export async function scrapeUrl(
  url: string,
): Promise<{ title: string; content: string }> {
  try {
    // Use a CORS proxy to avoid issues in the browser
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();

    // Use DOMParser (Browser Native)
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Remove clutter
    const selectors = "script, style, nav, footer, iframe, svg, path, noscript";
    doc.querySelectorAll(selectors).forEach((el) => el.remove());

    const title = doc.querySelector("title")?.textContent?.trim() || url;
    // Get main content simply
    const content = doc.body.innerText
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 10000);

    return { title, content };
  } catch (error: unknown) {
    console.error("[Scraper] Failed:", error);
    return {
      title: new URL(url).hostname,
      content: `URL: ${url}\n\n(Content kon niet worden opgehaald door CORS of netwerkfout)`,
    };
  }
}
