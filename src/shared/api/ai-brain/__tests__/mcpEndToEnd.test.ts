import * as dotenv from "dotenv";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { initializeAIBrain } from "../bootstrap";
import { getToolRunner } from "../toolRunner";

// Load environment variables for AI services
dotenv.config();

// Mock Whisper Service
vi.mock("../../whisperService", () => ({
  isWhisperConfigured: vi.fn().mockReturnValue(true),
  transcribeAudio: vi.fn().mockResolvedValue({ text: "Mocked transcription", language: "nl", duration: 10 }),
  base64ToArrayBuffer: vi.fn().mockReturnValue(new ArrayBuffer(0)),
  getMimeType: vi.fn().mockReturnValue("audio/mp3"),
}));

// Mock Hume Service
vi.mock("../../humeService", () => ({
  analyzeAudioEmotion: vi.fn().mockResolvedValue({ emotions: [], dominantEmotion: "happy" }),
}));

// Mock Python Service
vi.mock("../../pythonService", () => ({
  pythonService: {
    init: vi.fn().mockResolvedValue(undefined),
    run: vi.fn().mockResolvedValue({ output: "4", variables: [] }),
  },
}));

// Mock Python Sandbox
vi.mock("../../../lib/pythonSandbox", () => ({
  pythonSandbox: {
    execute: vi.fn().mockResolvedValue({ output: "42", error: null, result: 42, images: [] }),
  },
}));

// Mock Weather Service
vi.mock("../../weatherService", () => ({
  fetchWeather: vi.fn().mockResolvedValue({
    location: "Amsterdam",
    temp: 18,
    description: "Zonnig",
    icon: "Sun",
    lat: 52.3,
    lon: 4.9,
  }),
}));

// Mock Wikipedia Service
vi.mock("../../wikipediaService", () => ({
  getWikipediaArticle: vi.fn().mockResolvedValue({
    title: "Mock Title",
    extract: "Mock content from Wikipedia",
    url: "https://wikipedia.org",
  }),
}));

// Mock YouTube Service
vi.mock("../../youtubeService", () => ({
  extractYouTubeContent: vi.fn().mockResolvedValue({
    metadata: { title: "Mock Video" },
    transcript: "Mock transcript",
  }),
}));

// Mock AlphaFold Service
vi.mock("../../alphafoldService", () => ({
  searchProteins: vi.fn().mockResolvedValue([{ uniprotId: "P12345", proteinName: "Mock Protein" }]),
  getProteinStructure: vi.fn().mockResolvedValue({
    entryName: "MOCK",
    organism: "Homo sapiens",
    confidenceLevel: "High",
    averageConfidence: 95,
  }),
  getAlphaFoldViewerUrl: vi.fn().mockReturnValue("https://alphafold.test"),
}));


// Mock AI generation to avoid requiring real API keys for logic verification
vi.mock("../../aiCascadeService", () => ({
  aiGenerate: vi.fn().mockResolvedValue("Mocked AI Response"),
  aiGenerateJSON: vi
    .fn()
    .mockResolvedValue({ status: "success", reasoning: "Mocked AI Reasoning" }),
  cascadeGenerate: vi
    .fn()
    .mockResolvedValue({ content: "Mocked AI Content", functionCalls: [] }),
}));

// Mock SQLite Service to prevent WASM loading issues
vi.mock("@shared/api/sqliteService", () => ({
  initDatabase: vi.fn().mockResolvedValue({}),
  getAllGeneratedMediaSQL: vi.fn().mockResolvedValue([]),
  saveGeneratedMediaSQL: vi.fn().mockResolvedValue(true),
  deleteGeneratedMediaSQL: vi.fn().mockResolvedValue(true),
  // Add other necessary exports as stubs
  saveStudyMaterialSQL: vi.fn(),
  getAllStudyMaterialsSQL: vi.fn().mockResolvedValue([]),
  saveFlashcardSQL: vi.fn(),
  getAllFlashcardsSQL: vi.fn().mockResolvedValue([]),
  savePWSProjectSQL: vi.fn(),
  getAllPWSProjectsSQL: vi.fn().mockResolvedValue([]),
  saveQuizHistorySQL: vi.fn(),
  getAllQuizHistorySQL: vi.fn().mockResolvedValue([]),
  saveQuestionSQL: vi.fn(),
  getAllSavedQuestionsSQL: vi.fn().mockResolvedValue([]),
  deleteStudyMaterialSQL: vi.fn(),
  deletePWSProjectSQL: vi.fn(),
  deleteSavedQuestionSQL: vi.fn(),
  getDueFlashcardsSQL: vi.fn().mockResolvedValue([]),
  getMaterialsBySubjectSQL: vi.fn().mockResolvedValue([]),
  getStudyMaterialsByIdsSQL: vi.fn().mockResolvedValue([]),
  // Needed for ToolRunner
  sqliteInsert: vi.fn().mockResolvedValue(true),
  sqliteSelect: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../../sqliteService", () => ({
  initDatabase: vi.fn().mockResolvedValue({}),
  getAllGeneratedMediaSQL: vi.fn().mockResolvedValue([]),
  saveGeneratedMediaSQL: vi.fn().mockResolvedValue(true),
  deleteGeneratedMediaSQL: vi.fn().mockResolvedValue(true),
  // Add other necessary exports as stubs
  saveStudyMaterialSQL: vi.fn(),
  getAllStudyMaterialsSQL: vi.fn().mockResolvedValue([]),
  saveFlashcardSQL: vi.fn(),
  getAllFlashcardsSQL: vi.fn().mockResolvedValue([]),
  savePWSProjectSQL: vi.fn(),
  getAllPWSProjectsSQL: vi.fn().mockResolvedValue([]),
  saveQuizHistorySQL: vi.fn(),
  getAllQuizHistorySQL: vi.fn().mockResolvedValue([]),
  saveQuestionSQL: vi.fn(),
  getAllSavedQuestionsSQL: vi.fn().mockResolvedValue([]),
  deleteStudyMaterialSQL: vi.fn(),
  deletePWSProjectSQL: vi.fn(),
  deleteSavedQuestionSQL: vi.fn(),
  getDueFlashcardsSQL: vi.fn().mockResolvedValue([]),
  getMaterialsBySubjectSQL: vi.fn().mockResolvedValue([]),
  getStudyMaterialsByIdsSQL: vi.fn().mockResolvedValue([]),
  // Needed for ToolRunner
  sqliteInsert: vi.fn().mockResolvedValue(true),
  sqliteSelect: vi.fn().mockResolvedValue([]),
}));

// Mock Planner Store to avoid state issues
vi.mock("../../../model/plannerStore", () => ({
  usePlannerEliteStore: {
    getState: () => ({
      addTask: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

/**
 * MCP End-to-End Verification
 * This function programmatically tests all 42 tools.
 */
describe("MCP Tools End-to-End Verification", () => {
  let originalFetch: typeof global.fetch;

  beforeAll(async () => {
    await initializeAIBrain();
    originalFetch = global.fetch;

    // Mock window.fetch for relative URLs (internal services)
    global.fetch = vi.fn().mockImplementation((url, init) => {
      if (typeof url === "string" && url.startsWith("/")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: "mocked",
              message: "Mocked internal service response",
            }),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        }) as unknown as Promise<Response>;
      }
      return originalFetch(url, init); // Fallback to real fetch for absolute URLs (AI services)
    });

    // Mock localStorage for Somtoday and AI Keys
    global.localStorage = {
      getItem: vi.fn().mockImplementation((key) => {
        if (key === "vwo_elite_settings_backup") {
          return JSON.stringify({
            aiConfig: {
              openaiApiKey: "mock-openai-key",
              humeApiKey: "mock-hume-key",
              hfToken: "mock-hf-token",
              replicateApiKey: "mock-replicate-key",
            },
          });
        }
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    } as Storage;
  });

  it("should execute all 42 tools successfully without returning stubs", async () => {
    // High timeout for 60 tools
    const toolRunner = getToolRunner();
    const toolsToTest = [
      // 📚 Education
      {
        name: "generate_lesson",
        params: { topic: "Photosynthese", level: "VWO 5" },
      },
      {
        name: "generate_study_plan",
        params: {
          subject: "Wiskunde B",
          deadline: "2026-05-15",
          hours_per_week: 10,
        },
      },
      {
        name: "generate_flashcards",
        params: {
          content:
            "Mitose is celverdeling waarbij twee identieke dochtercellen ontstaan.",
          count: 5,
        },
      },
      { name: "generate_quiz", params: { topic: "De Koude Oorlog", count: 3 } },
      { name: "analyze_weak_points", params: { subject: "Scheikunde" } },
      { name: "generate_mind_map", params: { topic: "Ecosystemen" } },
      {
        name: "explain_concept",
        params: { concept: "Quantum Verstrengeling" },
      },
      {
        name: "socratic_coach",
        params: { problem: "Ik begrijp de wet van behoud van energie niet." },
      },

      // 🧮 Math
      {
        name: "solve_math_problem",
        params: { problem: "f(x) = x^2, wat is f'(x)?" },
      },
      { name: "graph_function", params: { expression: "x^2 - 4" } },
      { name: "solve_calculus", params: { expression: "int x dx" } },
      {
        name: "check_solution",
        params: { problem: "2x = 4", solution: "x = 2" },
      },
      {
        name: "get_hint",
        params: { problem: "Hoe bereken ik de omtrek van een cirkel?" },
      },
      { name: "image_to_formula", params: { image_data: "base64..." } },
      { name: "graph_to_function", params: { image_data: "base64..." } },
      { name: "execute_python", params: { code: "print(2+2)" } },

      // 🔬 Science
      { name: "balance_equation", params: { equation: "H2 + O2 -> H2O" } },
      { name: "lookup_periodic_table", params: { symbol: "Au" } },
      { name: "lookup_binas", params: { query: "smeltpunt van goud" } },
      {
        name: "physics_formula_helper",
        params: { problem: "versnelling berekenen" },
      },
      { name: "simulate_physics", params: { scenario: "vrije val vanaf 10m" } },
      { name: "molecule_visualizer", params: { name: "Alanine" } },
      { name: "biology_diagram", params: { concept: "Cyclys van Krebs" } },

      // 🌍 Language
      {
        name: "grammar_check",
        params: { text: "ik heeft een appel", lang: "nl" },
      },
      {
        name: "translate_contextual",
        params: { text: "Hello world", to: "nl" },
      },
      {
        name: "pronunciation_coach",
        params: { text: "Through the tough thoroughfare", lang: "en" },
      },
      { name: "generate_idiom_exercise", params: { lang: "fr" } },
      { name: "text_to_speech", params: { text: "Goeiemorgen", lang: "nl" } },
      { name: "speech_to_text", params: { audio_data: "..." } },
      { name: "language_feedback", params: { text: "This is a great essay." } },
      { name: "debate_simulator", params: { topic: "AI in onderwijs" } },

      // 📖 Academic/Research
      {
        name: "find_academic_sources",
        params: { query: "Impact van microplastics op zeeleven" },
      },
      {
        name: "summarize_paper",
        params: { content: "Abstract: This research shows..." },
      },
      {
        name: "check_apa_citations",
        params: { text: "(Jansen, 2020) zegt dat..." },
      },
      { name: "check_originality", params: { text: "To be or not to be..." } },
      {
        name: "generate_literature_matrix",
        params: { sources: ["Bron A", "Bron B"] },
      },
      {
        name: "evaluate_source",
        params: { source_description: "Blogpost van een student" },
      },
      {
        name: "research_design_check",
        params: { design: "Enquête onder 10 mensen" },
      },
      {
        name: "analyze_pws_sources",
        params: { sources: ["Bron 1", "Bron 2"] },
      },

      // 📅 Planning
      { name: "sync_somtoday", params: {} },
      {
        name: "get_schedule",
        params: { start_date: "2026-01-20", end_date: "2026-01-20" },
      },
      {
        name: "create_task",
        params: { title: "Huiswerk Wiskunde", due_date: "2026-01-22" },
      },
      { name: "get_deadlines", params: {} },
      { name: "optimize_schedule", params: { entries: [] } },
      { name: "sync_calendar", params: { provider: "google" } },
      { name: "track_progress", params: { subject: "Biologie" } },
      {
        name: "proactive_reminder",
        params: { context: "Deadline PWS komt eraan" },
      },

      // 🎨 Media
      {
        name: "generate_diagram",
        params: { description: "Watertoevoer systeem" },
      },
      {
        name: "generate_image",
        params: { prompt: "Een futuristische school" },
      },
      { name: "analyze_image", params: { image_url: "..." } },
      { name: "analyze_video", params: { video_url: "..." } },
      {
        name: "extract_youtube_transcript",
        params: { url: "https://youtube.com/..." },
      },
      { name: "render_3d_model", params: { model_name: "DNA" } },
      { name: "audio_to_notes", params: { audio_url: "..." } },

      // 🔌 External
      { name: "search_wikipedia", params: { query: "Napoleon" } },
      { name: "search_library", params: { query: "Gouden Eeuw" } },
      { name: "get_weather", params: { lat: 52.3, lon: 4.9 } },
      {
        name: "web_search",
        params: { query: "Huidige status klimaatverdrag" },
      },
      { name: "fetch_url_content", params: { url: "https://wikipedia.org" } },
      { name: "lookup_dutch_holidays", params: { year: 2026 } },
    ];

    console.log(`Starting E2E Verification for ${toolsToTest.length} tools...`);
    const results = [];

    for (const tool of toolsToTest) {
      try {
        console.log(`Testing tool: ${tool.name}...`);
        const result = await toolRunner.executeTool({
          toolName: tool.name,
          parameters: tool.params,
        });

        // Check for stubs
        const resultStr = JSON.stringify(result);
        if (
          resultStr.toLowerCase().includes("coming soon") ||
          resultStr.toLowerCase().includes("not implemented")
        ) {
          results.push({
            name: tool.name,
            status: "FAIL",
            error: "Returned stub message",
          });
        } else if (result.error) {
          results.push({
            name: tool.name,
            status: "ERROR",
            error: result.error,
          });
        } else {
          results.push({ name: tool.name, status: "PASS" });
        }
      } catch (error: unknown) {
        results.push({
          name: tool.name,
          status: "ERROR",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const failures = results.filter((r) => r.status !== "PASS");
    console.log(
      `Verification Complete. Passes: ${results.length - failures.length}, Failures: ${failures.length}`,
    );

    if (failures.length > 0) {
      console.error("FAILURES DETECTED:", JSON.stringify(failures, null, 2));
    }

    expect(failures.length).toBe(0);
  }, 120000);
});
