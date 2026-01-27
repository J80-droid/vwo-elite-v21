/**
 * ZIP Service
 * Extracts files from ZIP archives using JSZip
 */

import JSZip from "jszip";
import mammoth from "mammoth";

export interface ExtractedFile {
  name: string;
  path: string;
  content: string;
  type: "txt" | "image" | "pdf" | "other";
  size: number;
}

// Supported file extensions for extraction
const TEXT_EXTENSIONS = [
  "txt",
  "md",
  "json",
  "xml",
  "html",
  "htm",
  "css",
  "js",
  "ts",
  "tsx",
  "jsx",
  "py",
  "java",
  "c",
  "cpp",
  "h",
];
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg"];
const PDF_EXTENSIONS = ["pdf"];
const DOC_EXTENSIONS = ["docx"];

/**
 * Determine file type from extension
 */
function getFileType(
  filename: string,
): "txt" | "image" | "pdf" | "docx" | "other" {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  if (TEXT_EXTENSIONS.includes(ext)) return "txt";
  if (IMAGE_EXTENSIONS.includes(ext)) return "image";
  if (PDF_EXTENSIONS.includes(ext)) return "pdf";
  if (DOC_EXTENSIONS.includes(ext)) return "docx";
  return "other";
}

/**
 * Extract all supported files from a ZIP archive
 */
export async function extractZip(file: File): Promise<ExtractedFile[]> {
  try {
    const zip = await JSZip.loadAsync(file);
    const extractedFiles: ExtractedFile[] = [];

    const filePromises: Promise<void>[] = [];

    zip.forEach((relativePath, zipEntry) => {
      // Skip directories and hidden files
      if (
        zipEntry.dir ||
        relativePath.startsWith("__MACOSX") ||
        relativePath.startsWith(".")
      ) {
        return;
      }

      const fileType = getFileType(relativePath);
      const fileName = relativePath.split("/").pop() || relativePath;

      // Skip unsupported files
      if (fileType === "other") return;

      const promise = (async () => {
        try {
          let content: string;
          let finalType: "txt" | "image" | "pdf" | "other" = "other";

          if (fileType === "image" || fileType === "pdf") {
            // Get as base64 for binary files
            const blob = await zipEntry.async("blob");
            content = await blobToBase64(blob);
            finalType = fileType;
          } else if (fileType === "docx") {
            // Extract text from DOCX
            const arrayBuffer = await zipEntry.async("arraybuffer");
            const result = await mammoth.extractRawText({ arrayBuffer });
            content = result.value;
            finalType = "txt";
          } else {
            // Get as text for text files
            content = await zipEntry.async("string");
            finalType = "txt";
          }

          extractedFiles.push({
            name: fileName,
            path: relativePath,
            content,
            type: finalType,
            size: content.length,
          });
        } catch (err) {
          console.warn(`[ZipService] Could not extract ${relativePath}:`, err);
        }
      })();

      filePromises.push(promise);
    });

    await Promise.all(filePromises);

    // Sort by path for consistent ordering
    extractedFiles.sort((a, b) => a.path.localeCompare(b.path));

    console.log(
      `[ZipService] Extracted ${extractedFiles.length} files from ${file.name}`,
    );
    return extractedFiles;
  } catch (error) {
    console.error("[ZipService] Failed to extract ZIP:", error);
    throw new Error(
      "Kon ZIP-bestand niet uitpakken. Is het een geldig ZIP-archief?",
    );
  }
}

/**
 * Helper to convert Blob to base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix to get pure base64
      const base64 = result.split(",")[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Get summary of ZIP contents without extracting
 */
