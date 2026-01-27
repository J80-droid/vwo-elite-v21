// Custom
export { CustomRunner, getCustomRunner } from "./customRunner";

// GPT4All
export { getGPT4AllRunner, GPT4AllRunner } from "./gpt4allRunner";

// LM Studio
export type {
  LMStudioChatMessage,
  LMStudioChatRequest,
  LMStudioChatResponse,
  LMStudioModel,
} from "./lmStudioRunner";
export {
  discoverLMStudioModels,
  getLMStudioRunner,
  inferCapabilities as inferLMStudioCapabilities,
  isLMStudioAvailable,
  LMStudioRunner,
  lmStudioToAIModel,
} from "./lmStudioRunner";

// Ollama
export type {
  OllamaEmbeddingRequest,
  OllamaEmbeddingResponse,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaModel,
} from "./ollamaRunner";
export {
  discoverOllamaModels,
  getOllamaRunner,
  inferCapabilities as inferOllamaCapabilities,
  isOllamaAvailable,
  OllamaRunner,
  ollamaToAIModel,
} from "./ollamaRunner";

// Discovery
export type {
  DiscoveryOptions,
  DiscoveryResult,
  ProviderStatus,
} from "./modelDiscovery";
export {
  checkAllProviderStatus,
  discoverAllLocalModels,
  enhanceWithKnownData,
  KNOWN_MODELS,
} from "./modelDiscovery";
