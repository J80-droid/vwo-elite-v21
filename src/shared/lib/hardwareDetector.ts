/**
 * Hardware Detector
 * Detects system specifications to recommend appropriate AI models
 */

export interface SystemSpecs {
  // CPU
  cpuCores: number;
  cpuModel: string;

  // Memory
  ramTotalGB: number;
  ramAvailableGB: number;

  // GPU (if available)
  gpu: {
    available: boolean;
    name?: string;
    vramGB?: number;
    cudaSupport?: boolean;
  };

  // Storage
  availableDiskGB: number;

  // Computed Tier
  tier: "low" | "medium" | "high" | "ultra";
}

export interface ModelOption {
  id: string;
  name: string;
  url: string;
}

export interface ModelRecommendation {
  category: "fast" | "reasoning" | "vision" | "code" | "embedding";
  recommended: ModelOption[];
  maxParams: string; // e.g., "7B", "13B", "70B"
  explanation: string;
}

/**
 * Detect system hardware specifications
 * Uses navigator API and estimation heuristics
 */
export async function detectSystemSpecs(): Promise<SystemSpecs> {
  const specs: SystemSpecs = {
    cpuCores: navigator.hardwareConcurrency || 4,
    cpuModel: "Unknown",
    ramTotalGB: 8, // Conservative default
    ramAvailableGB: 4,
    gpu: { available: false },
    availableDiskGB: 50,
    tier: "medium",
  };

  // Try to get more accurate memory info
  if ("deviceMemory" in navigator) {
    // deviceMemory returns approximate RAM in GB (capped at 8 in some browsers)
    const deviceMemory = (navigator as { deviceMemory?: number }).deviceMemory;
    if (deviceMemory) {
      // deviceMemory is often capped, so we estimate higher for capable systems
      specs.ramTotalGB = deviceMemory >= 8 ? 16 : deviceMemory;
      specs.ramAvailableGB = Math.floor(specs.ramTotalGB * 0.6);
    }
  }

  // Try to detect GPU via WebGL
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");

    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        specs.gpu = {
          available: true,
          name: renderer,
          // Estimate VRAM based on GPU name
          vramGB: estimateVRAM(renderer),
          cudaSupport: /nvidia/i.test(renderer),
        };
      }
    }
  } catch {
    // WebGL not available
  }

  // Try to estimate available disk via StorageManager
  if ("storage" in navigator && "estimate" in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota) {
        specs.availableDiskGB = Math.floor(estimate.quota / 1024 ** 3);
      }
    } catch {
      // Storage API not available
    }
  }

  // Calculate tier based on specs
  specs.tier = calculateTier(specs);

  return specs;
}

/**
 * Estimate VRAM based on GPU name
 */
function estimateVRAM(gpuName: string): number {
  const name = gpuName.toLowerCase();

  // NVIDIA RTX 40 series
  if (/4090/.test(name)) return 24;
  if (/4080/.test(name)) return 16;
  if (/4070/.test(name)) return 12;
  if (/4060/.test(name)) return 8;

  // NVIDIA RTX 30 series
  if (/3090/.test(name)) return 24;
  if (/3080/.test(name)) return 10;
  if (/3070/.test(name)) return 8;
  if (/3060/.test(name)) return 12;

  // NVIDIA RTX 20 series
  if (/2080/.test(name)) return 8;
  if (/2070/.test(name)) return 8;
  if (/2060/.test(name)) return 6;

  // AMD Radeon
  if (/rx 7900/.test(name)) return 20;
  if (/rx 7800/.test(name)) return 16;
  if (/rx 6800/.test(name)) return 16;
  if (/rx 6700/.test(name)) return 12;

  // Apple Silicon (integrated)
  if (/apple/.test(name)) return 8; // Shared memory

  // Intel integrated
  if (/intel/.test(name)) return 2;

  // Default for unknown
  return 4;
}

/**
 * Calculate system tier based on specs
 */
function calculateTier(
  specs: SystemSpecs,
): "low" | "medium" | "high" | "ultra" {
  const score =
    specs.cpuCores * 2 + specs.ramTotalGB * 3 + (specs.gpu.vramGB || 0) * 5;

  if (score >= 100) return "ultra"; // 32GB+ RAM, RTX 3080+
  if (score >= 60) return "high"; // 16GB RAM, GTX 1080+
  if (score >= 30) return "medium"; // 8GB RAM, basic GPU
  return "low"; // < 8GB RAM
}

/**
 * Get model recommendations based on system tier
 */
export function getModelRecommendations(
  specs: SystemSpecs,
): ModelRecommendation[] {
  const recommendations: ModelRecommendation[] = [];

  const getUrl = (modelId: string) =>
    `https://ollama.com/library/${modelId.split(":")[0]}`;

  switch (specs.tier) {
    case "ultra":
      recommendations.push(
        {
          category: "fast",
          recommended: [
            {
              id: "llama3.2:3b",
              name: "Llama 3.2 3B",
              url: getUrl("llama3.2"),
            },
            { id: "phi3:mini", name: "Phi-3 Mini", url: getUrl("phi3") },
            { id: "qwen2.5:3b", name: "Qwen 2.5 3B", url: getUrl("qwen2.5") },
          ],
          maxParams: "70B",
          explanation:
            "Je systeem kan grote modellen aan. Gebruik 3B voor snelheid, 70B voor kwaliteit.",
        },
        {
          category: "reasoning",
          recommended: [
            { id: "qwen2.5:32b", name: "Qwen 2.5 32B", url: getUrl("qwen2.5") },
            {
              id: "llama3.1:70b",
              name: "Llama 3.1 70B",
              url: getUrl("llama3.1"),
            },
            {
              id: "deepseek-coder-v2:33b",
              name: "DeepSeek Coder V2",
              url: getUrl("deepseek-coder-v2"),
            },
          ],
          maxParams: "70B",
          explanation:
            "Voor complexe wiskunde en redeneren, gebruik grotere modellen.",
        },
        {
          category: "vision",
          recommended: [
            { id: "llava:34b", name: "LLaVA 34B", url: getUrl("llava") },
            {
              id: "llava-llama3:latest",
              name: "LLaVA Llama3",
              url: getUrl("llava-llama3"),
            },
          ],
          maxParams: "34B",
          explanation: "Vision modellen voor afbeeldingsanalyse.",
        },
        {
          category: "code",
          recommended: [
            {
              id: "deepseek-coder-v2:33b",
              name: "DeepSeek Coder V2",
              url: getUrl("deepseek-coder-v2"),
            },
            {
              id: "codellama:34b",
              name: "CodeLlama 34B",
              url: getUrl("codellama"),
            },
          ],
          maxParams: "34B",
          explanation: "Gespecialiseerde code modellen.",
        },
        {
          category: "embedding",
          recommended: [
            {
              id: "nomic-embed-text",
              name: "Nomic Embed",
              url: getUrl("nomic-embed-text"),
            },
            {
              id: "mxbai-embed-large",
              name: "MxBai Large",
              url: getUrl("mxbai-embed-large"),
            },
          ],
          maxParams: "N/A",
          explanation: "Lokale embeddings voor je memory systeem.",
        },
      );
      break;

    case "high":
      recommendations.push(
        {
          category: "fast",
          recommended: [
            {
              id: "llama3.2:3b",
              name: "Llama 3.2 3B",
              url: getUrl("llama3.2"),
            },
            { id: "phi3:mini", name: "Phi-3 Mini", url: getUrl("phi3") },
            { id: "gemma2:2b", name: "Gemma 2 2B", url: getUrl("gemma2") },
          ],
          maxParams: "13B",
          explanation:
            "Gebruik kleine modellen voor snelle taken, tot 13B voor kwaliteit.",
        },
        {
          category: "reasoning",
          recommended: [
            { id: "qwen2.5:14b", name: "Qwen 2.5 14B", url: getUrl("qwen2.5") },
            {
              id: "llama3.1:8b",
              name: "Llama 3.1 8B",
              url: getUrl("llama3.1"),
            },
            { id: "mistral:7b", name: "Mistral 7B", url: getUrl("mistral") },
          ],
          maxParams: "14B",
          explanation: "7-14B modellen bieden goede balans.",
        },
        {
          category: "vision",
          recommended: [
            { id: "llava:13b", name: "LLaVA 13B", url: getUrl("llava") },
            {
              id: "bakllava:latest",
              name: "BakLLaVA",
              url: getUrl("bakllava"),
            },
          ],
          maxParams: "13B",
          explanation: "Vision modellen tot 13B parameters.",
        },
        {
          category: "code",
          recommended: [
            {
              id: "deepseek-coder:6.7b",
              name: "DeepSeek Coder 6.7B",
              url: getUrl("deepseek-coder"),
            },
            {
              id: "codellama:7b",
              name: "CodeLlama 7B",
              url: getUrl("codellama"),
            },
          ],
          maxParams: "7B",
          explanation: "Code modellen optimized voor 7B.",
        },
        {
          category: "embedding",
          recommended: [
            {
              id: "nomic-embed-text",
              name: "Nomic Embed",
              url: getUrl("nomic-embed-text"),
            },
            { id: "all-minilm", name: "All MiniLM", url: getUrl("all-minilm") },
          ],
          maxParams: "N/A",
          explanation: "Efficiënte embedding modellen.",
        },
      );
      break;

    case "medium":
      recommendations.push(
        {
          category: "fast",
          recommended: [
            { id: "phi3:mini", name: "Phi-3 Mini", url: getUrl("phi3") },
            { id: "gemma2:2b", name: "Gemma 2 2B", url: getUrl("gemma2") },
            { id: "tinyllama", name: "TinyLlama", url: getUrl("tinyllama") },
          ],
          maxParams: "3B",
          explanation: "Focus op kleine, snelle modellen (1-3B parameters).",
        },
        {
          category: "reasoning",
          recommended: [
            { id: "phi3:mini", name: "Phi-3 Mini", url: getUrl("phi3") },
            { id: "qwen2.5:3b", name: "Qwen 2.5 3B", url: getUrl("qwen2.5") },
            {
              id: "llama3.2:3b",
              name: "Llama 3.2 3B",
              url: getUrl("llama3.2"),
            },
          ],
          maxParams: "7B",
          explanation:
            "3B modellen voor dagelijks gebruik, 7B alleen als nodig.",
        },
        {
          category: "vision",
          recommended: [
            { id: "llava:7b", name: "LLaVA 7B", url: getUrl("llava") },
            { id: "moondream", name: "Moondream", url: getUrl("moondream") },
          ],
          maxParams: "7B",
          explanation: "Lichtgewicht vision modellen.",
        },
        {
          category: "code",
          recommended: [
            {
              id: "deepseek-coder:1.3b",
              name: "DeepSeek Coder 1.3B",
              url: getUrl("deepseek-coder"),
            },
            {
              id: "starcoder2:3b",
              name: "StarCoder2 3B",
              url: getUrl("starcoder2"),
            },
          ],
          maxParams: "3B",
          explanation: "Kleine code modellen.",
        },
        {
          category: "embedding",
          recommended: [
            { id: "all-minilm", name: "All MiniLM", url: getUrl("all-minilm") },
            {
              id: "nomic-embed-text",
              name: "Nomic Embed",
              url: getUrl("nomic-embed-text"),
            },
          ],
          maxParams: "N/A",
          explanation: "Compacte embedding modellen.",
        },
      );
      break;

    case "low":
      recommendations.push(
        {
          category: "fast",
          recommended: [
            { id: "tinyllama", name: "TinyLlama", url: getUrl("tinyllama") },
            { id: "phi3:mini", name: "Phi-3 Mini", url: getUrl("phi3") },
          ],
          maxParams: "1.5B",
          explanation:
            "Alleen de kleinste modellen (<2B parameters) worden aanbevolen.",
        },
        {
          category: "reasoning",
          recommended: [
            { id: "tinyllama", name: "TinyLlama", url: getUrl("tinyllama") },
            { id: "gemma2:2b", name: "Gemma 2 2B", url: getUrl("gemma2") },
          ],
          maxParams: "2B",
          explanation: "Overweeg cloud APIs voor complexe taken.",
        },
        {
          category: "vision",
          recommended: [
            { id: "moondream", name: "Moondream", url: getUrl("moondream") },
          ],
          maxParams: "1.6B",
          explanation: "Alleen moondream is licht genoeg.",
        },
        {
          category: "code",
          recommended: [
            {
              id: "deepseek-coder:1.3b",
              name: "DeepSeek Coder 1.3B",
              url: getUrl("deepseek-coder"),
            },
          ],
          maxParams: "1.3B",
          explanation: "Minimale code ondersteuning.",
        },
        {
          category: "embedding",
          recommended: [
            { id: "all-minilm", name: "All MiniLM", url: getUrl("all-minilm") },
          ],
          maxParams: "N/A",
          explanation: "Gebruik cloud embeddings als lokaal te traag is.",
        },
      );
      break;
  }

  return recommendations;
}

/**
 * Check if a specific model can run on this system
 */
export function canRunModel(
  specs: SystemSpecs,
  modelSizeGB: number,
  _modelParams: string,
): { canRun: boolean; warning?: string } {
  // Parse model params (e.g., "7B" -> 7, "70B" -> 70)
  // const params = parseInt(modelParams.replace(/[^0-9]/g, ""), 10) || 0;

  // Rough estimation: model needs ~1.5x its size in RAM/VRAM
  const requiredMemory = modelSizeGB * 1.5;

  // Check VRAM first (preferred for inference)
  if (specs.gpu.available && specs.gpu.vramGB) {
    if (specs.gpu.vramGB >= requiredMemory) {
      return { canRun: true };
    }
  }

  // Check RAM as fallback (CPU inference)
  if (specs.ramAvailableGB >= requiredMemory) {
    return {
      canRun: true,
      warning: "Dit model draait op CPU (trager). GPU wordt aanbevolen.",
    };
  }

  // Can't run
  return {
    canRun: false,
    warning: `Onvoldoende geheugen. Nodig: ${requiredMemory.toFixed(1)}GB, Beschikbaar: ${specs.ramAvailableGB}GB RAM / ${specs.gpu.vramGB || 0}GB VRAM`,
  };
}
