import { z } from "zod";

import { pythonSandbox } from "../../../lib/pythonSandbox";
import { aiGenerate } from "../../aiCascadeService";
import { getToolRegistry, type IToolHandler } from "../ToolRegistry";

// --- Tool Implementations ---

const SolveMathProblemTool: IToolHandler = {
  name: "solve_math_problem",
  category: "Math",
  description: "Lost wiskundige problemen op met stapsgewijze uitleg",
  schema: z.object({
    problem: z.string().min(1),
    show_steps: z.boolean().optional().default(true),
  }),
  parametersSchema: {
    type: "object",
    properties: {
      problem: { type: "string", description: "Het wiskundeprobleem om op te lossen" },
      show_steps: { type: "boolean", description: "Of er een stapsgewijze uitleg moet worden gegeven" }
    },
    required: ["problem"]
  },
  async execute(params) {
    const { problem, show_steps } = params as { problem: string; show_steps: boolean };
    const prompt = `Los het volgende wiskunde-probleem op: "${problem}". 
        ${show_steps ? "Laat alle stappen van de berekening zien." : "Geef alleen het eindantwoord."}`;
    const content = await aiGenerate(prompt, { systemPrompt: "Je bent een wiskunde expert." });
    return { problem, solution: content };
  }
};

const GraphFunctionTool: IToolHandler = {
  name: "graph_function",
  category: "Math",
  description: "Analyseert een functie en genereert visualisatie code",
  schema: z.object({
    expression: z.string().min(1),
    range_x: z.array(z.number()).length(2).optional().default([-10, 10]),
  }),
  parametersSchema: {
    type: "object",
    properties: {
      expression: { type: "string", description: "De functie-uitdrukking (bijv. x^2 + 2x + 1)" },
      range_x: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 }
    },
    required: ["expression"]
  },
  async execute(params) {
    const { expression, range_x } = params as { expression: string; range_x: number[] };
    const prompt = `Analyseer de functie "${expression}" voor x = [${range_x.join(", ")}]. Beschrijf nulpunten, extremen, asymptoten.`;
    const content = await aiGenerate(prompt, { systemPrompt: "Expert in functie-analyse." });
    return { expression, rangeX: range_x, analysis: content };
  }
};

const ExecutePythonTool: IToolHandler = {
  name: "execute_python",
  category: "Math",
  description: "Voert Python code uit voor berekeningen",
  schema: z.object({
    code: z.string().min(1),
  }),
  parametersSchema: {
    type: "object",
    properties: {
      code: { type: "string", description: "De Python-code om uit te voeren" }
    },
    required: ["code"]
  },
  async execute(params) {
    const { code } = params as { code: string };
    try {
      const result = await pythonSandbox.execute(code);
      return {
        code,
        output: result.output,
        error: result.error,
        result: result.result,
        plots_count: result.images?.length || 0,
        images: result.images
      };
    } catch (error: unknown) {
      return { code, status: "error", error: error instanceof Error ? error.message : String(error) };
    }
  }
};

/**
 * [ELITE LEVEL 8] Python Interpreter Tool
 * Direct alias for execute_python but registered as the primary Elite Tool
 */
const PythonInterpreterTool: IToolHandler = {
  ...ExecutePythonTool,
  name: "python_interpreter",
  description: "Elite Python Sandbox. Gebruik voor: wiskunde, data-analyse, matplotlib plots, of logische puzzels. Volledig geïsoleerd."
};

const SolveCalculusTool: IToolHandler = {
  name: "solve_calculus",
  category: "Math",
  description: "Berekent afgeleiden of integralen",
  schema: z.object({
    operation: z.enum(["differentiate", "integrate"]).optional().default("integrate"),
    expression: z.string().min(1),
    variable: z.string().optional().default("x"),
  }),
  async execute(params) {
    const { operation, expression, variable } = params as { operation: string; expression: string; variable: string };
    const opName = operation === "differentiate" ? "afgeleide" : "integraal";
    const prompt = `Bereken de ${opName} van "${expression}" naar "${variable}". Geef LaTeX en leg uit.`;
    const content = await aiGenerate(prompt, { systemPrompt: "Expert in calculus." });
    return { operation, expression, variable, result: content };
  }
};

const GetHintTool: IToolHandler = {
  name: "get_hint",
  category: "Math",
  description: "Geeft een subtiele hint bij een wiskundeprobleem",
  schema: z.object({
    problem: z.string().min(1),
    context: z.string().optional().default(""),
  }),
  async execute(params) {
    const { problem, context } = params as { problem: string; context: string };
    const prompt = `Leerling zit vast bij: "${problem}". Context: ${context || "geen"}. Geef een hint zonder oplossing.`;
    const content = await aiGenerate(prompt, { systemPrompt: "Geduldige wiskunde-coach." });
    return { hint: content };
  }
};

const CheckSolutionTool: IToolHandler = {
  name: "check_solution",
  category: "Math",
  description: "Controleert of een wiskundige oplossing correct is",
  schema: z.object({
    problem: z.string().min(1),
    solution: z.string().min(1),
  }),
  async execute(params) {
    const { problem, solution } = params as { problem: string; solution: string };
    const prompt = `Controleer: probleem "${problem}", oplossing "${solution}". Is het correct? Zo niet, waar zit de fout?`;
    const feedback = await aiGenerate(prompt, { systemPrompt: "Scherpe wiskunde-corrector." });
    return { problem, solution, feedback };
  }
};

const ImageToFormulaTool: IToolHandler = {
  name: "image_to_formula",
  category: "Math",
  description: "Extraheert wiskundige formule uit afbeelding (OCR)",
  schema: z.object({
    image_data: z.string().min(1),
  }),
  async execute(params) {
    const { image_data } = params as { image_data: string };
    const base64Data = image_data.includes(",") ? image_data.split(",")[1] : image_data;
    const mimeType = image_data.includes("image/png") ? "image/png" : "image/jpeg";
    const latex = await aiGenerate("Extraheer de formule uit deze afbeelding. Geef ALLEEN LaTeX.", {
      systemPrompt: "Expert in wiskundig OCR.",
      inlineImages: [{ mimeType, data: base64Data as string }],
    });
    return { latex, source: "Elite Vision OCR" };
  }
};

const GraphToFunctionTool: IToolHandler = {
  name: "graph_to_function",
  category: "Math",
  description: "Analyseert een grafiek en bepaalt het functievoorschrift",
  schema: z.object({
    image_data: z.string().min(1),
  }),
  async execute(params) {
    const { image_data } = params as { image_data: string };
    const base64Data = image_data.includes(",") ? image_data.split(",")[1] : image_data;
    const mimeType = image_data.includes("image/png") ? "image/png" : "image/jpeg";
    const content = await aiGenerate("Analyseer de grafiek en bepaal het functievoorschrift.", {
      systemPrompt: "Expert in grafiekanalyse.",
      inlineImages: [{ mimeType, data: base64Data as string }],
    });
    return { success: true, analysis: content, source: "Elite Graph Analyzer" };
  }
};

// --- Registration Function ---

export function handleMathTool(name: string, params: Record<string, unknown>) {
  const registry = getToolRegistry();
  const handler = registry.get(name);
  if (handler) return handler.execute(params);
  throw new Error(`Tool ${name} not found in MathTools registry.`);
}

export function registerMathTools(): void {
  const registry = getToolRegistry();
  registry.registerAll([
    SolveMathProblemTool,
    GraphFunctionTool,
    SolveCalculusTool,
    GetHintTool,
    CheckSolutionTool,
    ImageToFormulaTool,
    GraphToFunctionTool,
  ]);

  // Register with aliases
  registry.register(PythonInterpreterTool, ["execute_python"]);

  console.log("[MathTools] Registered 8 tools (with aliases).");
}
