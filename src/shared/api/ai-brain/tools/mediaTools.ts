import { z } from "zod";

import { aiGenerate } from "../../aiCascadeService";
import { extractYouTubeContent } from "../../youtubeService";
import { getToolRegistry, type IToolHandler } from "../ToolRegistry";

// --- Tool Implementations ---

const ExtractYouTubeTranscriptTool: IToolHandler = {
  name: "extract_youtube_transcript",
  category: "Media",
  description: "Extraheert transcriptie en metadata van een YouTube video",
  schema: z.object({
    url: z.string().url(),
  }),
  async execute(params) {
    return await extractYouTube(String(params.url));
  }
};

const GenerateDiagramTool: IToolHandler = {
  name: "generate_diagram",
  category: "Media",
  description: "Genereert Mermaid diagram code voor visualisaties",
  schema: z.object({
    description: z.string().min(1),
    type: z.string().optional().default("mermaid"),
  }),
  async execute(params) {
    return await generateDiagram(
      String(params.description),
      String(params.type || "mermaid"),
    );
  }
};

const GenerateImageTool: IToolHandler = {
  name: "generate_image",
  category: "Media",
  description: "Genereert een afbeelding op basis van een tekstuele prompt",
  schema: z.object({
    prompt: z.string().min(1),
  }),
  async execute(params) {
    return await generateImage(String(params.prompt));
  }
};

const AnalyzeImageTool: IToolHandler = {
  name: "analyze_image",
  category: "Media",
  description: "Analyseert een afbeelding en beantwoordt vragen erover",
  schema: z.object({
    image_url: z.string().min(1),
    query: z.string().optional().default("Wat staat er op deze afbeelding?"),
  }),
  async execute(params) {
    return await analyzeImage(
      String(params.image_url),
      String(params.query || "Wat staat er op deze afbeelding?"),
    );
  }
};

const Render3DModelTool: IToolHandler = {
  name: "render_3d_model",
  category: "Media",
  description: "Configureert en rendert een 3D model in de Protein Explorer",
  schema: z.object({
    model_name: z.string().min(1),
  }),
  async execute(params) {
    return await render3DModel(String(params.model_name));
  }
};

const Generate3DModelTool: IToolHandler = {
  name: "generate_3d_model",
  category: "Media",
  description: "Genereert een 3D mesh (GLB) via Replicate API",
  schema: z.object({
    prompt: z.string().min(1),
  }),
  async execute(params) {
    return await generate3DModelTool(String(params.prompt));
  }
};

const AnalyzeVideoTool: IToolHandler = {
  name: "analyze_video",
  category: "Media",
  description: "Analyseert video content via AI proxy",
  schema: z.object({
    video_url: z.string().optional(),
    video_id: z.string().optional(),
    query: z.string().optional().default("Vat de video samen."),
  }),
  async execute(params) {
    return await analyzeVideo(
      String(params.video_url || params.video_id || ""),
      String(params.query || "Vat de video samen."),
    );
  }
};

const AudioToNotesTool: IToolHandler = {
  name: "audio_to_notes",
  category: "Media",
  description: "Zet audio input om naar gestructureerde samenvattingen",
  schema: z.object({
    audio_url: z.string().optional(),
    audio_data: z.string().optional(),
  }),
  async execute(params) {
    const res = await audioToNotes(String(params.audio_url || params.audio_data || ""));
    return { success: true, ...res };
  }
};

// --- Helper Functions ---

async function extractYouTube(url: string) {
  try {
    const result = await extractYouTubeContent(url);
    if (!result) return { error: "Extraction failed." };
    return { title: result.metadata.title, transcript: result.transcript.substring(0, 500) + "..." };
  } catch (e: any) { return { error: e.message }; }
}

async function generateDiagram(description: string, type = "mermaid") {
  const code = await aiGenerate(`Diagram: "${description}" (${type}).`, { systemPrompt: "Expert visualisatie." });
  return { description, type, code };
}

async function generateImage(prompt: string) {
  // Check for API keys in localStorage
  let hfToken: string | undefined;
  try {
    const backup = localStorage.getItem("vwo_elite_settings_backup");
    if (backup) {
      const settings = JSON.parse(backup);
      hfToken = settings?.aiConfig?.hfToken;
    }
  } catch { /* ignore */ }

  if (hfToken) {
    try {
      const { generateImageHF } = await import("../../huggingFaceService");
      const url = await generateImageHF(prompt, "black-forest-labs/FLUX.1-schnell", "nl", hfToken);
      if (url) return { prompt, url, provider: "HuggingFace FLUX" };
    } catch { /* fallback */ }
  }

  const svgCode = await aiGenerate(`Modern flat SVG for: "${prompt}".`, { systemPrompt: "Expert SVG." });
  return { prompt, content: svgCode, format: "svg", provider: "AI SVG Generator" };
}

async function analyzeImage(imageUrl: string, query: string) {
  const base64Data = imageUrl.includes(",") ? imageUrl.split(",")[1] : imageUrl;
  const mimeType = imageUrl.includes("image/png") ? "image/png" : "image/jpeg";
  const analysis = await aiGenerate(query, { systemPrompt: "Expert computer vision.", inlineImages: [{ mimeType: mimeType!, data: base64Data! }] });
  return { analysis };
}

async function render3DModel(modelName: string) {
  return { modelName, status: "rendering", engine: "React-Three-Fiber" };
}

async function generate3DModelTool(prompt: string) {
  let replicateApiKey: string | undefined;
  try {
    const backup = localStorage.getItem("vwo_elite_settings_backup");
    if (backup) {
      const settings = JSON.parse(backup);
      replicateApiKey = settings?.aiConfig?.replicateApiKey;
    }
  } catch { /* ignore */ }

  if (!replicateApiKey) return { error: "Replicate API Key vereist." };

  try {
    const { generate3DModel } = await import("../../shape3dService");
    const result = await generate3DModel({ replicateApiKey, prompt });
    return { prompt, meshUrl: result.meshUrl, provider: "Replicate" };
  } catch (e: any) { return { error: e.message }; }
}

async function analyzeVideo(url: string, query: string) {
  const analysis = await aiGenerate(`Analyze video: ${url}. Query: ${query}`, { systemPrompt: "Expert video-analyse." });
  return { analysis };
}

async function audioToNotes(audio: string) {
  const base64Data = audio.includes(",") ? audio.split(",")[1] : audio;
  const mimeType = audio.includes("audio/") ? audio.substring(audio.indexOf(":") + 1, audio.indexOf(";")) : "audio/mp3";
  const content = await aiGenerate("Vat audio samen.", { systemPrompt: "Expert transcriptie.", inlineMedia: [{ mimeType: mimeType!, data: base64Data! }] });
  return { notes: content };
}

// --- Registration ---

export function registerMediaTools(): void {
  const registry = getToolRegistry();
  registry.registerAll([
    ExtractYouTubeTranscriptTool,
    GenerateDiagramTool,
    GenerateImageTool,
    AnalyzeImageTool,
    Render3DModelTool,
    Generate3DModelTool,
    AnalyzeVideoTool,
    AudioToNotesTool,
  ]);
  console.log("[MediaTools] Registered 8 tools.");
}

/**
 * Legacy handler
 * @deprecated Use ToolRegistry instead
 */
export async function handleMediaTool(
  name: string,
  params: Record<string, unknown>,
): Promise<unknown> {
  const registry = getToolRegistry();
  const handler = registry.get(name);
  if (handler) return handler.execute(params);
  throw new Error(`Media tool ${name} not implemented.`);
}
