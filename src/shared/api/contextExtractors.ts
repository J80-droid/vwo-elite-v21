/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic extraction and PDF parsing types */
/**
 * Context Extractors Service
 * Utility functions for extracting content from various sources
 */

// =====================================
// PDF EXTRACTION (using pdf.js)
// =====================================

export const extractFromPDF = async (
  file: File,
): Promise<{ title: string; content: string }> => {
  try {
    // Dynamic import to avoid SSR issues
    const pdfjsLib = await import("pdfjs-dist");

    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";
    const numPages = pdf.numPages;

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += `\n--- Pagina ${i} ---\n${pageText}`;
    }

    return {
      title: file.name.replace(".pdf", ""),
      content: fullText.trim() || "Kon geen tekst uit PDF halen",
    };
  } catch (error) {
    console.error("[PDF Extractor] Error:", error);
    throw new Error(
      "Kon PDF niet lezen. Zorg dat het een geldig PDF bestand is.",
    );
  }
};

// =====================================
// YOUTUBE TRANSCRIPT EXTRACTION
// =====================================

export const extractFromYouTube = async (
  url: string,
): Promise<{ title: string; content: string }> => {
  try {
    // Extract video ID from URL
    const videoIdMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    );
    if (!videoIdMatch) {
      throw new Error("Ongeldige YouTube URL");
    }
    const videoId = videoIdMatch[1];

    // Try to get transcript via our API endpoint
    const response = await fetch(`/api/youtube-transcript?videoId=${videoId}`);

    if (!response.ok) {
      // Fallback: just store the video URL with a note
      return {
        title: `YouTube: ${videoId}`,
        content: `YouTube Video: ${url}\n\n(Transcript niet beschikbaar - de AI kan mogelijk zelf de video analyseren als je een screenshot deelt)`,
      };
    }

    const data = await response.json();
    return {
      title: data.title || `YouTube: ${videoId}`,
      content: data.transcript || "Transcript niet beschikbaar",
    };
  } catch (error) {
    console.error("[YouTube Extractor] Error:", error);
    return {
      title: "YouTube Video",
      content: `YouTube URL: ${url}\n\n(Transcript kon niet worden opgehaald)`,
    };
  }
};

// =====================================
// WIKIPEDIA ARTICLE EXTRACTION
// =====================================

export const extractFromWikipedia = async (
  searchTerm: string,
): Promise<{ title: string; content: string }> => {
  try {
    // Clean the search term - could be a URL or a topic
    let articleTitle = searchTerm;

    // If it's a Wikipedia URL, extract the title
    if (searchTerm.includes("wikipedia.org")) {
      const urlMatch = searchTerm.match(/wikipedia\.org\/wiki\/([^?#]+)/);
      if (urlMatch) {
        articleTitle = decodeURIComponent(urlMatch[1]!.replace(/_/g, " "));
      }
    }

    // Use Wikipedia API to get article extract
    const apiUrl = `https://nl.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(articleTitle)}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      // Try English Wikipedia as fallback
      const enApiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(articleTitle)}`;
      const enResponse = await fetch(enApiUrl);

      if (!enResponse.ok) {
        throw new Error("Artikel niet gevonden");
      }

      const enData = await enResponse.json();
      return {
        title: enData.title,
        content: `${enData.extract}\n\n[Bron: Wikipedia EN - ${enData.content_urls?.desktop?.page || "wikipedia.org"}]`,
      };
    }

    const data = await response.json();

    // Get more detailed content
    const fullContentUrl = `https://nl.wikipedia.org/api/rest_v1/page/mobile-sections/${encodeURIComponent(data.title)}`;
    const fullResponse = await fetch(fullContentUrl);

    let fullContent = data.extract;

    if (fullResponse.ok) {
      const fullData = await fullResponse.json();
      // Extract text from sections (simplified)
      const sections = fullData.remaining?.sections || [];
      const sectionTexts = sections
        .slice(0, 5) // First 5 sections
        .map(
          (s: any) => `## ${s.line}\n${s.text?.replace(/<[^>]+>/g, "") || ""}`,
        )
        .join("\n\n");

      if (sectionTexts) {
        fullContent = `${data.extract}\n\n${sectionTexts}`;
      }
    }

    return {
      title: data.title,
      content: `# ${data.title}\n\n${fullContent}\n\n[Bron: Wikipedia NL - ${data.content_urls?.desktop?.page || "wikipedia.org"}]`,
    };
  } catch (error) {
    console.error("[Wikipedia Extractor] Error:", error);
    throw new Error(
      "Kon Wikipedia artikel niet ophalen. Controleer de zoekterm.",
    );
  }
};

import { scrapeUrl } from "../../api/scrape-url";

export const extractFromUrl = async (
  url: string,
): Promise<{ title: string; content: string }> => {
  try {
    const data = await scrapeUrl(url);
    return {
      title: data.title,
      content: data.content,
    };
  } catch {
    // Fallback: just store the URL
    const hostname = new URL(url).hostname;
    return {
      title: hostname,
      content: `URL: ${url}\n\n(Content kon niet worden opgehaald - de AI kan de URL mogelijk zelf bezoeken)`,
    };
  }
};
