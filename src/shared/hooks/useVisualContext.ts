/* eslint-disable @typescript-eslint/no-explicit-any -- html2canvas error types */
import { useCallback } from "react";

export interface VisualContextResult {
  imageBase64: string | null;
  textContext: string;
  error: string | null;
}

/**
 * Hook to capture the visual state of a DOM element for AI context.
 *
 * Features:
 * - Captures screenshots using html2canvas (lazy-loaded)
 * - Compresses to manageable JPEG size (60% quality, 0.8 scale)
 * - Privacy: Ignored elements with class 'no-ai-capture'
 * - Extracts text context as backup/supplement
 */
export const useVisualContext = () => {
  const captureContext = useCallback(
    async (elementRef: HTMLElement): Promise<VisualContextResult> => {
      if (!elementRef) {
        return {
          imageBase64: null,
          textContext: "",
          error: "No reference element provided",
        };
      }

      try {
        // 1. Text Context Scraping
        // We get strict 1500 chars to enable high-speed processing
        const textContext = elementRef.innerText?.substring(0, 1500) || "";

        // 2. Visual Capture
        // Dynamic import to avoid bundling html2canvas in the main bundle
        const html2canvas = (await import("html2canvas")).default;

        const canvas = await html2canvas(elementRef, {
          scale: 0.8, // Reduced scale for performance
          useCORS: true, // Allow external images
          logging: false, // Clean console
          ignoreElements: (element) => {
            // PRIVACY MASKING: Skip elements with specific class
            return element.classList.contains("no-ai-capture");
          },
        });

        // 3. Compression
        // JPEG 0.6 is the sweet spot for AI legibility vs bandwidth
        const imageBase64 = canvas.toDataURL("image/jpeg", 0.6).split(",")[1];

        return {
          imageBase64: imageBase64 || null,
          textContext,
          error: null,
        };
      } catch (err: any) {
        console.error("[VisualContext] Capture failed:", err);
        return {
          imageBase64: null,
          textContext: "",
          error: err.message || "Failed to capture visual context",
        };
      }
    },
    [],
  );

  return { captureContext };
};
