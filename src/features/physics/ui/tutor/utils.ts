import { ChatMessage } from "./types";

// Use native crypto for UUID to avoid dependency issues
export const uuidv4 = () => crypto.randomUUID();

// Mock API call (vervang later door echte LLM fetch)
export const mockLLMCall = async (
  _messages: Pick<ChatMessage, "role" | "content">[],
  _systemPrompt: string,
): Promise<string> => {
  await new Promise((r) => setTimeout(r, 1500)); // Fake latency
  return "Dit is een interessante waarneming. Als je kijkt naar de formule van Stefan-Boltzmann ($L = \\sigma A T^4$), wat verwacht je dan dat er gebeurt met de lichtkracht als je de straal verdubbelt?";
};
