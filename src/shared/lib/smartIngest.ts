import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Worker configuration for Elite Performance
// ELITE FIX: Gebruik een lokale worker import (Vite syntax).
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export type IngestedContent =
    | { type: "text"; content: string; name: string }
    | { type: "image"; content: string; mimeType: string; name: string };

/**
 * Smart Ingest Pipeline
 * Converts any file into the most token-efficient format for the AI.
 */
export const smartIngest = async (file: File): Promise<IngestedContent> => {
    const isPDF = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");
    const isText = file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".txt");

    // 1. TEXT FILES (Fastest path)
    if (isText) {
        const text = await file.text();
        return { type: "text", content: formatText(file.name, text), name: file.name };
    }

    // 2. IMAGES (Base64 conversion)
    if (isImage) {
        const base64 = await fileToBase64(file);
        return { type: "image", content: base64, mimeType: file.type, name: file.name };
    }

    // 3. PDF INTELLIGENCE
    if (isPDF) {
        try {
            console.log(`[SmartIngest] Analysing PDF: ${file.name}`);
            const extractedText = await extractPdfText(file);

            // Heuristic: If we find less than 100 characters, it might be an image-scan.
            if (extractedText.length > 100) {
                return {
                    type: "text",
                    content: formatText(file.name, extractedText),
                    name: file.name
                };
            } else {
                console.warn(`[SmartIngest] PDF ${file.name} appears to be empty or an image scan. Falling back.`);
                // Note: Full PDF-to-Image vision fallback would happen here
                return {
                    type: "text",
                    content: `[ALERT: Source file '${file.name}' contains no readable text. It might be a scanned image. AI visual analysis required.]`,
                    name: file.name
                };
            }
        } catch (e) {
            console.error("PDF Parse Error:", e);
            throw new Error(`Failed to read PDF: ${file.name}`);
        }
    }

    throw new Error(`Unsupported file type: ${file.type}`);
};

// --- HELPERS ---

const formatText = (filename: string, content: string): string => {
    return `\n--- START SOURCE: ${filename} ---\n${content}\n--- END SOURCE ---\n`;
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

const extractPdfText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfStatus = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";

    // Performance Limit: Max 50 pages per ingestion to avoid browser lock
    const maxPages = Math.min(pdfStatus.numPages, 50);

    for (let i = 1; i <= maxPages; i++) {
        const page = await pdfStatus.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .filter((item): item is import("pdfjs-dist/types/src/display/api").TextItem => "str" in item)
            .map((item) => item.str)
            .join(" ");

        fullText += `[Page ${i}]\n${pageText}\n\n`;
    }

    if (pdfStatus.numPages > 50) {
        fullText += `\n... [TRUNCATED: Only first 50 pages extracted for Elite performance] ...`;
    }

    return fullText;
};
