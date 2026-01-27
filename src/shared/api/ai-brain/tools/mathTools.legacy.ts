import { aiGenerate } from "../../aiCascadeService";
import { pythonService } from "../../pythonService";

/**
 * Legacy math tools handler
 * @deprecated Use registerMathTools() and ToolRegistry instead
 */
export async function handleMathTool(
    name: string,
    params: Record<string, unknown>,
): Promise<unknown> {
    switch (name) {
        case "solve_math_problem":
            return await solveMathProblem(String(params.expression), Boolean(params.show_steps ?? true));
        case "graph_function":
            return await graphFunction(String(params.equation), (params.range_x as number[]) || [-10, 10]);
        case "execute_python":
            return await executePython(String(params.code));
        case "solve_calculus":
            return await solveCalculus(String(params.operation), String(params.expression), String(params.variable || "x"));
        case "get_hint":
            return await getMathHint(String(params.problem), String(params.context || ""));
        case "check_solution":
            return await checkMathSolution(String(params.problem), String(params.solution));
        case "image_to_formula":
            return await imageToFormula(params.image_data as string);
        case "graph_to_function": {
            const res = await graphToFunction(params.image_data as string);
            return { success: true, ...res };
        }
        default:
            throw new Error(`Math tool ${name} not implemented.`);
    }
}

async function solveMathProblem(expression: string, showSteps = true) {
    const prompt = `Los op: "${expression}". ${showSteps ? "Toon stappen." : "Alleen antwoord."}`;
    const content = await aiGenerate(prompt, { systemPrompt: "Wiskunde expert." });
    return { expression, solution: content };
}

async function graphFunction(equation: string, rangeX = [-10, 10]) {
    const prompt = `Analyseer "${equation}" voor x = [${rangeX.join(", ")}].`;
    const content = await aiGenerate(prompt, { systemPrompt: "Functie-analyse expert." });
    return { equation, rangeX, analysis: content };
}

async function executePython(code: string) {
    try {
        await pythonService.init();
        const result = await pythonService.run(code);
        return { code, output: result.output, error: result.error };
    } catch (error: unknown) {
        return { code, status: "error", error: error instanceof Error ? error.message : String(error) };
    }
}

async function solveCalculus(operation: string, expression: string, variable = "x") {
    const opName = operation === "differentiate" ? "afgeleide" : "integraal";
    const prompt = `Bereken ${opName} van "${expression}" naar "${variable}".`;
    const content = await aiGenerate(prompt, { systemPrompt: "Calculus expert." });
    return { operation, expression, variable, result: content };
}

async function getMathHint(problem: string, context?: string) {
    const prompt = `Hint voor: "${problem}". Context: ${context || "geen"}.`;
    const content = await aiGenerate(prompt, { systemPrompt: "Wiskunde-coach." });
    return { hint: content };
}

async function checkMathSolution(problem: string, solution: string) {
    const prompt = `Check: "${problem}" = "${solution}". Correct?`;
    const feedback = await aiGenerate(prompt, { systemPrompt: "Corrector." });
    return { problem, solution, feedback };
}

async function imageToFormula(imageData: string) {
    const base64Data = imageData.includes(",") ? imageData.split(",")[1] : imageData;
    const mimeType = imageData.includes("image/png") ? "image/png" : "image/jpeg";
    const latex = await aiGenerate("Extraheer formule (LaTeX).", {
        systemPrompt: "OCR expert.",
        inlineImages: [{ mimeType, data: base64Data as string }],
    });
    return { latex, source: "Elite Vision OCR" };
}

async function graphToFunction(imageData: string) {
    const base64Data = imageData.includes(",") ? imageData.split(",")[1] : imageData;
    const mimeType = imageData.includes("image/png") ? "image/png" : "image/jpeg";
    const content = await aiGenerate("Analyseer grafiek, geef functievoorschrift.", {
        systemPrompt: "Grafiek analyzer.",
        inlineImages: [{ mimeType, data: base64Data as string }],
    });
    return { analysis: content, source: "Elite Graph Analyzer" };
}
