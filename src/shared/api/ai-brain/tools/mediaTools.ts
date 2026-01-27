import { aiGenerate } from "../../aiCascadeService";
import { extractYouTubeContent } from "../../youtubeService";

/**
 * Handle Media & Visualization tool execution
 */
export async function handleMediaTool(
  name: string,
  params: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case "extract_youtube_transcript":
      return await extractYouTube(String(params.url));
    case "generate_diagram":
      return await generateDiagram(
        String(params.description),
        String(params.type || "mermaid"),
      );
    case "generate_image":
      return await generateImage(String(params.prompt));
    case "analyze_image":
      return await analyzeImage(
        String(params.image_url),
        String(params.query || "Wat staat er op deze afbeelding?"),
      );
    case "render_3d_model":
      return await render3DModel(String(params.model_name));
    case "generate_3d_model":
      return await generate3DModelTool(String(params.prompt));
    case "analyze_video":
      return await analyzeVideo(
        String(params.video_url || params.video_id),
        String(params.query || "Vat de video samen."),
      );
    case "audio_to_notes": {
      const res = await audioToNotes(String(params.audio_url || params.audio_data));
      return { success: true, ...res };
    }
    default:
      throw new Error(`Media tool ${name} not implemented.`);
  }
}

async function extractYouTube(url: string) {
  try {
    const result = await extractYouTubeContent(url);
    if (!result)
      return { url, error: "Failed to extract content from YouTube." };

    return {
      title: result.metadata.title,
      channel: result.metadata.channelTitle,
      transcript: result.transcript.substring(0, 1000) + "...",
      full_transcript_length: result.transcript.length,
      videoId: result.videoId,
    };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

async function generateDiagram(description: string, type = "mermaid") {
  const prompt = `Genereer een ${type} diagram code voor de volgende beschrijving: "${description}". 
  Zorg dat de code direct bruikbaar is in een Mermaid renderer.`;

  const code = await aiGenerate(prompt, {
    systemPrompt:
      "Je bent een expert in visualisatie en Mermaid.js diagrammen.",
  });

  return {
    description,
    type,
    code,
  };
}
async function generateImage(prompt: string) {
  // Get API keys from localStorage (settings backup)
  let hfToken: string | undefined;
  let geminiApiKey: string | undefined;

  try {
    const backup = localStorage.getItem("vwo_elite_settings_backup");
    if (backup) {
      const settings = JSON.parse(backup);
      hfToken = settings?.aiConfig?.hfToken;
      geminiApiKey = settings?.aiConfig?.geminiApiKey;
    }
  } catch {
    // Settings not available
  }

  // Try HuggingFace FLUX first (best quality)
  if (hfToken) {
    try {
      console.log("[ImageGen] Using HuggingFace FLUX...");
      const { generateImageHF } = await import("../../huggingFaceService");

      const imageUrl = await generateImageHF(
        prompt,
        "black-forest-labs/FLUX.1-schnell",
        "nl", // Dutch language for labels
        hfToken,
      );

      if (imageUrl) {
        return {
          prompt,
          status: "generated_bitmap",
          format: "png",
          url: imageUrl,
          provider: "HuggingFace FLUX",
          message: "Afbeelding succesvol gegenereerd via FLUX.",
        };
      }
    } catch (error) {
      console.warn("[ImageGen] FLUX failed:", error);
    }
  }

  // Try Gemini Imagen as second option
  if (geminiApiKey) {
    try {
      console.log("[ImageGen] Using Gemini Imagen...");
      const { generateEducationalImage } = await import("../../gemini/vision");

      // generateEducationalImage only uses geminiApiKey from the config
      const base64 = await generateEducationalImage(prompt, {
        geminiApiKey,
      } as Parameters<typeof generateEducationalImage>[1]);

      if (base64) {
        return {
          prompt,
          status: "generated_bitmap",
          format: "png",
          content: `data:image/png;base64,${base64}`,
          provider: "Gemini Imagen",
          message: "Afbeelding gegenereerd via Gemini Imagen.",
        };
      }
    } catch (error) {
      console.warn("[ImageGen] Gemini Imagen failed:", error);
    }
  }

  // Final fallback: SVG generation via AI
  console.log("[ImageGen] Using SVG fallback (no API keys configured)");
  const svgPrompt = `Genereer een SVG-afbeelding voor de volgende beschrijving: "${prompt}". 
    Geef ALLEEN de valide <svg> code terug zonder markdown blocks. Zorg voor een modern, flat design.`;

  const svgCode = await aiGenerate(svgPrompt, {
    systemPrompt:
      "Je bent een expert in SVG-vector graphics en generatieve kunst.",
  });

  return {
    prompt,
    status: "generated_svg",
    format: "svg",
    content: svgCode,
    provider: "AI SVG Generator",
    message:
      "SVG afbeelding gegenereerd. Voeg een HuggingFace of Gemini key toe voor bitmap afbeeldingen.",
  };
}

async function analyzeImage(imageUrl: string, query: string) {
  const prompt = `Analyseer deze afbeelding en beantwoord de vraag: "${query}".`;
  const systemPrompt =
    "Je bent een expert in computer vision en het analyseren van visuele content.";

  // Convert data URL if needed
  const base64Data = imageUrl.includes(",") ? imageUrl.split(",")[1] : imageUrl;
  const mimeType = imageUrl.includes("image/png") ? "image/png" : "image/jpeg";

  const analysis = await aiGenerate(prompt, {
    systemPrompt,
    inlineImages: [
      { mimeType: mimeType as string, data: base64Data as string },
    ],
  });
  return { imageUrl, query, analysis, source: "Elite Vision Engine" };
}

async function render3DModel(modelName: string) {
  // In a real scenario, this would load a GLB or configure a scene.
  return {
    modelName,
    status: "rendering",
    engine: "React-Three-Fiber",
  };
}

async function generate3DModelTool(prompt: string) {
  let replicateApiKey: string | undefined;

  try {
    const backup = localStorage.getItem("vwo_elite_settings_backup");
    if (backup) {
      const settings = JSON.parse(backup);
      replicateApiKey = settings?.aiConfig?.replicateApiKey;
    }
  } catch {
    // Settings not available
  }

  if (!replicateApiKey) {
    return {
      error: "Replicate API Key is vereist voor 3D generatie. Voeg deze toe in Instellingen.",
    };
  }

  try {
    console.log("[3DGen] Generating with Shap-E...");
    const { generate3DModel } = await import("../../shape3dService");

    const result = await generate3DModel({
      replicateApiKey,
      prompt,
    });

    return {
      prompt,
      status: "generated_3d",
      meshUrl: result.meshUrl,
      format: result.format,
      provider: "Replicate Shap-E",
      message: "3D model succesvol gegenereerd.",
    };
  } catch (error: unknown) {
    console.error("[3DGen] Generation failed:", error);
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function analyzeVideo(videoSource: string, query: string) {
  const prompt = `Analyseer de video op bron "${videoSource}" en beantwoord: "${query}". 
  Vat de belangrijkste visuele en auditieve elementen samen.`;
  const systemPrompt =
    "Je bent een expert in video-analyse en multimedia content editing.";

  const analysis = await aiGenerate(prompt, { systemPrompt });
  return { videoSource, query, analysis, status: "analyzed_via_ai_proxy" };
}

async function audioToNotes(audioString: string) {
  // Handle Data URL or raw Base64
  const base64Data = audioString.includes(",")
    ? audioString.split(",")[1]
    : audioString;
  const mimeType = audioString.includes("audio/")
    ? audioString.substring(
      audioString.indexOf(":") + 1,
      audioString.indexOf(";"),
    )
    : "audio/mp3";

  const prompt = `Transcribeer de audio en vat de belangrijkste punten samen als gestructureerde notities.`;
  const systemPrompt =
    "Je bent een expert in transcriptie en het maken van samenvattingen van colleges.";

  const content = await aiGenerate(prompt, {
    systemPrompt,
    inlineMedia: [{ mimeType: mimeType!, data: base64Data! }],
  });
  return {
    audio_received: true,
    notes: content,
    status: "audio_processed_via_ai",
  };
}
