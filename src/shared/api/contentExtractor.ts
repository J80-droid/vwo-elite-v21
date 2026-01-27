/**
 * Content Extractor Service
 * Extracts readable content from web pages
 */

export interface ExtractedContent {
  title: string;
  content: string;
  excerpt: string;
  siteName?: string;
  author?: string;
  publishedDate?: string;
  url: string;
}

/**
 * Extract content from a URL using a CORS proxy
 */
export async function extractFromURL(
  url: string,
): Promise<ExtractedContent | null> {
  try {
    // Validate URL
    // Validate URL (basic check is implied by URL constructor, but we handle errors in catch block)
    // const parsedUrl = new URL(url);

    // Use allorigins as CORS proxy
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

    const response = await fetch(proxyUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Parse the HTML and extract content
    return parseHTML(html, url);
  } catch (error) {
    console.error("[ContentExtractor] Failed to extract from URL:", error);
    return null;
  }
}

/**
 * Parse HTML and extract main content
 * Simplified version of Readability algorithm
 */
function parseHTML(html: string, sourceUrl: string): ExtractedContent {
  // Create a DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Extract metadata
  const title = extractTitle(doc);
  const siteName = extractSiteName(doc, sourceUrl);
  const author = extractAuthor(doc);
  const publishedDate = extractDate(doc);

  // Remove unwanted elements
  const selectorsToRemove = [
    "script",
    "style",
    "nav",
    "header",
    "footer",
    "aside",
    ".sidebar",
    ".nav",
    ".menu",
    ".advertisement",
    ".ad",
    ".ads",
    ".social-share",
    ".comments",
    ".related-posts",
    "#comments",
    '[role="navigation"]',
    '[role="banner"]',
    '[role="complementary"]',
  ];

  selectorsToRemove.forEach((selector) => {
    doc.querySelectorAll(selector).forEach((el) => el.remove());
  });

  // Find main content container
  const mainContent = findMainContent(doc);

  // Extract text content
  let content = "";
  if (mainContent) {
    content = extractTextContent(mainContent);
  } else {
    // Fallback: get body text
    content = extractTextContent(doc.body);
  }

  // Clean up the content
  content = cleanContent(content);

  // Generate excerpt
  const excerpt =
    content.substring(0, 300).trim() + (content.length > 300 ? "..." : "");

  return {
    title,
    content,
    excerpt,
    ...(siteName ? { siteName } : {}),
    ...(author ? { author } : {}),
    ...(publishedDate ? { publishedDate } : {}),
    url: sourceUrl,
  };
}

/**
 * Extract page title
 */
function extractTitle(doc: Document): string {
  // Try og:title first
  const ogTitle = doc
    .querySelector('meta[property="og:title"]')
    ?.getAttribute("content");
  if (ogTitle) return ogTitle;

  // Try article heading
  const h1 = doc.querySelector("article h1, .post-title, .entry-title, h1");
  if (h1?.textContent) return h1.textContent.trim();

  // Fallback to document title
  return doc.title?.split("|")[0]?.split("-")[0]?.trim() || "Onbekende Pagina";
}

/**
 * Extract site name
 */
function extractSiteName(doc: Document, url: string): string {
  const ogSite = doc
    .querySelector('meta[property="og:site_name"]')
    ?.getAttribute("content");
  if (ogSite) return ogSite;

  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    return hostname.charAt(0).toUpperCase() + hostname.slice(1);
  } catch {
    return "";
  }
}

/**
 * Extract author
 */
function extractAuthor(doc: Document): string | undefined {
  const authorMeta = doc
    .querySelector('meta[name="author"]')
    ?.getAttribute("content");
  if (authorMeta) return authorMeta;

  const authorEl = doc.querySelector('.author, .byline, [rel="author"]');
  if (authorEl?.textContent) return authorEl.textContent.trim();

  return undefined;
}

/**
 * Extract publish date
 */
function extractDate(doc: Document): string | undefined {
  const dateTime = doc
    .querySelector("time[datetime]")
    ?.getAttribute("datetime");
  if (dateTime) return dateTime;

  const dateMeta = doc
    .querySelector('meta[property="article:published_time"]')
    ?.getAttribute("content");
  if (dateMeta) return dateMeta;

  return undefined;
}

/**
 * Find the main content container
 */
function findMainContent(doc: Document): Element | null {
  // Priority order for content containers
  const selectors = [
    "article",
    '[role="main"]',
    "main",
    ".post-content",
    ".entry-content",
    ".article-content",
    ".content",
    "#content",
    ".post",
    ".article",
  ];

  for (const selector of selectors) {
    const el = doc.querySelector(selector);
    if (el && el.textContent && el.textContent.length > 200) {
      return el;
    }
  }

  return null;
}

/**
 * Extract text content from an element
 */
function extractTextContent(element: Element): string {
  const textParts: string[] = [];

  // Get all paragraph and heading elements
  const contentElements = element.querySelectorAll(
    "p, h1, h2, h3, h4, h5, h6, li, blockquote, pre",
  );

  contentElements.forEach((el) => {
    const text = el.textContent?.trim();
    if (text && text.length > 10) {
      // Add heading markers
      if (el.tagName.match(/^H[1-6]$/)) {
        textParts.push(`\n## ${text}\n`);
      } else if (el.tagName === "LI") {
        textParts.push(`• ${text}`);
      } else {
        textParts.push(text);
      }
    }
  });

  return textParts.join("\n\n");
}

/**
 * Clean up extracted content
 */
function cleanContent(content: string): string {
  return (
    content
      // Remove excessive whitespace
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      // Remove common artifacts
      .replace(/\s*\[.*?\]\s*/g, " ")
      .replace(/Cookie[s]? ?(policy|settings|notice)/gi, "")
      .replace(/Accept (all )?cookies?/gi, "")
      .replace(/Subscribe to our newsletter/gi, "")
      // Trim
      .trim()
  );
}

/**
 * Check if a URL is scrapeable (basic validation)
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}
