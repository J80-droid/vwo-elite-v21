import { describe, expect, it, vi } from "vitest";

import { AIConfig,ChatMessage } from "../../../types/config";
import { PhysicsPersona } from "../../personas/definitions/PhysicsPersona";
import { chatWithSocraticCoach } from "../chat";

// Mock the Gemini API to prevent actual network calls during stress testing
vi.mock("../../geminiBase", () => ({
  getGeminiAPI: vi.fn().mockReturnValue({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi
        .fn()
        .mockImplementation(
          async ({ contents }: { contents: ChatMessage[] }) => {
            // Return the system prompt so we can inspect it in the test
            const systemPrompt = contents[0].parts[0].text;
            return {
              response: {
                text: () => systemPrompt, // Echo back the prompt for verification
              },
            };
          },
        ),
    }),
  }),
}));

describe("Academic Rigor Stress Test (Architectural Verification)", () => {
  const mockConfig = {
    geminiApiKey: "test-key",
    activePersona: PhysicsPersona,
  } as AIConfig;

  it("Phase 1: Component Conflict & Override Logic", async () => {
    // Execute chat with Physics Persona
    const promptEcho = await chatWithSocraticCoach(
      [],
      "Test Message",
      "nl",
      "socratic",
      "socratic",
      mockConfig,
    );

    // 1. Verify the Sandwich Structure: Base Prompt -> Override
    const basePromptIndex = promptEcho.indexOf("JIJ BENT: VWO Elite AI");
    const overrideIndex = promptEcho.indexOf(
      "(THIS SECTION OVERRIDES ALL PREVIOUS INSTRUCTIONS)",
    );

    expect(basePromptIndex).toBeGreaterThan(-1);
    expect(overrideIndex).toBeGreaterThan(-1);
    expect(overrideIndex).toBeGreaterThan(basePromptIndex); // Override MUST be after Base

    // 2. Verify Subject Persona is Active
    expect(promptEcho).toContain("[SUBJECT PERSONA ACTIVE]");
    expect(promptEcho).toContain(
      "ROLE: VWO 6 Academic Excellence Team [NATUURKUNDE]",
    );
  });

  it("Phase 2: Teleological & Scientific Integrity", async () => {
    const promptEcho = await chatWithSocraticCoach(
      [],
      "Test Message",
      "nl",
      "socratic",
      "socratic",
      mockConfig,
    );

    // Verify Science-Specific VWO Standards are present
    expect(promptEcho).toContain("First Principles:");
    expect(promptEcho).toContain("Mathematization");
    expect(promptEcho).toContain("Significant Figures:");
    expect(promptEcho).toContain("### CRITICAL: Gebruik significante cijfers");
  });

  it("Phase 3: Emotional Noise Filtering (Standards Check)", async () => {
    const promptEcho = await chatWithSocraticCoach(
      [],
      "Test Message",
      "nl",
      "socratic",
      "socratic",
      mockConfig,
    );

    // Verify OutputParser instructions are present
    expect(promptEcho).toContain("Neutraliseer stelligheid");
    expect(promptEcho).toContain("Maximaliseer informatiedichtheid");
  });

  it("Comprehensive Persona Check: Biology (Teleology & Rigor)", async () => {
    const { BiologyPersona } =
      await import("../../personas/definitions/BiologyPersona");
    const promptEcho = await chatWithSocraticCoach(
      [],
      "Test",
      "nl",
      "socratic",
      "socratic",
      { ...mockConfig, activePersona: BiologyPersona },
    );

    expect(promptEcho).toContain("Avoid teleological language");
    expect(promptEcho).toContain("System Dynamics:");
    expect(promptEcho).toContain("### FORBIDDEN: Geen sturende hoorcolleges.");
  });

  it("Comprehensive Persona Check: Philosophy (Ethics & Paradigms)", async () => {
    const { PhilosophyPersona } =
      await import("../../personas/definitions/PhilosophyPersona");
    const promptEcho = await chatWithSocraticCoach(
      [],
      "Test",
      "nl",
      "socratic",
      "socratic",
      { ...mockConfig, activePersona: PhilosophyPersona },
    );

    expect(promptEcho).toContain("Demarcatieprobleem");
    expect(promptEcho).toContain(
      "### MANDATORY: Accepteer geen standpunten zonder logische bewijsvoering.",
    );
  });

  it("Comprehensive Persona Check: English (CEFR & Academic Discourse)", async () => {
    const { ForeignLanguagesPersona } =
      await import("../../personas/definitions/ForeignLanguagesPersona");
    // Trigger English context
    const promptEcho = await chatWithSocraticCoach(
      [],
      "Test",
      "nl",
      "socratic",
      "socratic",
      { ...mockConfig, activePersona: ForeignLanguagesPersona },
      "Vak: Engels",
    );

    expect(promptEcho).toContain("[CEFR INTEGRATION]");
    expect(promptEcho).toContain("Nominalization");
  });

  it("Comprehensive Persona Check: Psychology (Methodology & Integrity)", async () => {
    const { PsychologyPersona } =
      await import("../../personas/definitions/PsychologyPersona");
    const promptEcho = await chatWithSocraticCoach(
      [],
      "Test",
      "nl",
      "socratic",
      "socratic",
      { ...mockConfig, activePersona: PsychologyPersona },
    );

    expect(promptEcho).toContain("Replication Crisis");
    expect(promptEcho).toContain(
      "### CRITICAL: Strikte bronvermelding (APA/MLA)",
    );
  });

  it("Comprehensive Persona Check: Math B (Logic & Proofs)", async () => {
    const { MathPersona } =
      await import("../../personas/definitions/MathPersona");
    const promptEcho = await chatWithSocraticCoach(
      [],
      "Test",
      "nl",
      "socratic",
      "socratic",
      { ...mockConfig, activePersona: MathPersona },
    );

    expect(promptEcho).toContain("Algebraic Manipulation:");
    expect(promptEcho).toContain("Axiomatic Reasoning:");
  });
});
