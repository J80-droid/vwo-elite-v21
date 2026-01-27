import { z } from "zod";

/**
 * Zod Schemas for Lesson Generator
 * Consistent validation for materials, lessons, and quiz questions.
 */

export const LessonMaterialSchema = z.object({
    id: z.string(),
    name: z.string().optional(),
    type: z.enum([
        "note",
        "flashcard",
        "summary",
        "diagram",
        "quiz",
        "pdf",
        "txt",
        "text",
        "image",
        "chat",
    ]),
    title: z.string().optional(),
    content: z.string(),
    subject: z.string(),
    date: z.string().optional(),
    tags: z.array(z.string()).optional(),
    createdAt: z.number(),
    updatedAt: z.number().optional(),
});

export const InteractiveComponentSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("physics-simulation"),
        config: z.object({
            scene: z.enum(["slope", "pendulum", "spring", "projectile"]),
            parameters: z.record(z.string(), z.number()),
            showVectors: z.boolean().optional(),
            complexity: z.enum(['novice', 'competent', 'expert']).optional(),
            scaffolding: z.boolean().optional(),
        }),
    }),
    z.object({
        type: z.literal("concept-map"),
        config: z.object({
            nodes: z.array(z.object({
                id: z.string(),
                label: z.string(),
                type: z.string().optional(),
                x: z.number().optional(),
                y: z.number().optional()
            })),
            edges: z.array(z.object({ source: z.string(), target: z.string(), label: z.string().optional() })),
        }),
    }),
    z.object({
        type: z.literal("market-graph"),
        config: z.object({
            lines: z.array(z.object({ label: z.string(), equation: z.string() })),
            equilibrium: z.object({ price: z.number(), quantity: z.number() }).optional(),
        }),
    }),
    z.object({
        type: z.literal("chemistry-molecule"),
        config: z.object({
            type: z.enum(["vsepr", "lattice", "protein"]),
            moleculeData: z.string(),
            showLabels: z.boolean().optional(),
        }),
    }),
    z.object({
        type: z.literal("chemistry-process"),
        config: z.object({
            type: z.enum(["mechanism", "industrial", "equilibrium"]),
            nodes: z.array(z.record(z.string(), z.any())).optional(),
            edges: z.array(z.record(z.string(), z.any())).optional(),
            parameters: z.record(z.string(), z.number()).optional(),
        }),
    }),
    z.object({
        type: z.literal("chemistry-analysis"),
        config: z.object({
            instrument: z.enum(["mass-spec", "ir-spec", "chromatography", "titration", "energy"]),
            data: z.array(z.record(z.string(), z.any())),
            targetPoint: z.number().optional(),
        }),
    }),
    z.object({
        type: z.literal("chemistry-electro"),
        config: z.object({
            type: z.enum(["galvanic", "electrolysis"]),
            anode: z.string(),
            cathode: z.string(),
            electrolyte: z.string(),
            voltage: z.number().optional(),
        }),
    }),
    z.object({
        type: z.literal("biology-process"),
        config: z.object({
            process: z.enum(["protein-synthesis", "photosynthesis", "membrane-transport", "virus-entry"]),
            mastery: z.enum(["novice", "competent", "expert"]).optional(),
            steps: z.array(z.string()).optional(),
            moleculeData: z.string().optional(), // For NGL proteins
        }),
    }),
    z.object({
        type: z.literal("biology-feedback"),
        config: z.object({
            system: z.enum(["glucose", "thermo", "osmosis", "blood-pressure"]),
            nodes: z.array(z.record(z.string(), z.any())).optional(),
            edges: z.array(z.record(z.string(), z.any())).optional(),
        }),
    }),
    z.object({
        type: z.literal("biology-genetics"),
        config: z.object({
            mode: z.enum(["punnett", "pedigree", "cladogram"]),
            traits: z.array(z.string()),
            populationData: z.array(z.record(z.string(), z.any())).optional(),
        }),
    }),
    z.object({
        type: z.literal("biology-ecology"),
        config: z.object({
            type: z.enum(["food-web", "population-dynamics"]),
            species: z.array(z.string()),
            parameters: z.record(z.string(), z.number()).optional(),
        }),
    }),
    z.object({
        type: z.literal("math-analysis"),
        config: z.object({
            function: z.string(),
            features: z.array(z.enum(["tangent", "integral", "limit", "asymptote"])),
            range: z.tuple([z.number(), z.number()]).optional(),
            parameters: z.record(z.string(), z.number()).optional(),
        }),
    }),
    z.object({
        type: z.literal("math-geometry"),
        config: z.object({
            mode: z.enum(["vector", "circle", "line", "locus"]),
            interaction: z.enum(["dot-product", "intersection", "locus-trace"]),
            objects: z.array(z.record(z.string(), z.any())).optional(),
        }),
    }),
    z.object({
        type: z.literal("math-motion"),
        config: z.object({
            mode: z.enum(["unit-circle", "parametric", "lissajous"]),
            equations: z.object({ x: z.string(), y: z.string() }).optional(),
            showVectors: z.boolean().optional(),
            parameters: z.record(z.string(), z.number()).optional(),
        }),
    }),
    z.object({
        type: z.literal("language-text-analysis"),
        config: z.object({
            language: z.enum(["en", "de", "fr", "es"]),
            textSnippet: z.string(),
            focus: z.enum(["connectors", "references", "tone"]),
            highlights: z.array(z.object({ start: z.number(), end: z.number(), hint: z.string() })),
        }),
    }),
    z.object({
        type: z.literal("language-syntax-builder"),
        config: z.object({
            language: z.enum(["en", "de", "fr", "es"]),
            sentenceParts: z.array(z.string()),
            constraint: z.enum(["word-order", "conjugation", "case"]),
        }),
    }),
    z.object({
        type: z.literal("language-immersion"),
        config: z.object({
            language: z.enum(["en", "de", "fr", "es"]),
            mediaUrl: z.string().optional(),
            transcript: z.string().optional(),
            roleplayScenario: z.string().optional(),
        }),
    }),
    z.object({
        type: z.literal("dutch-argumentation"),
        config: z.object({
            textSnippet: z.string(),
            structureType: z.enum(["toulmin", "syllogism", "fallacy-hunt"]),
            nodes: z.array(z.record(z.string(), z.any())).optional(),
            edges: z.array(z.record(z.string(), z.any())).optional(),
        }),
    }),
    z.object({
        type: z.literal("dutch-text-anatomy"),
        config: z.object({
            paragraphs: z.array(z.string()),
            mode: z.enum(["reorder", "function-labeling", "summarize"]),
            labels: z.array(z.string()).optional(),
        }),
    }),
    z.object({
        type: z.literal("dutch-style"),
        config: z.object({
            task: z.enum(["fix-sentence", "identify-figure"]),
            problemType: z.enum(["contamination", "passive-voice", "metaphor"]),
            inputSentence: z.string(),
        }),
    }),
    z.object({
        type: z.literal("philosophy-logic"),
        config: z.object({
            task: z.enum(["reconstruct", "fallacy-check", "validity-test"]),
            premises: z.array(z.string()),
            conclusion: z.string().optional(),
            nodes: z.array(z.record(z.string(), z.any())).optional(),
            edges: z.array(z.record(z.string(), z.any())).optional(),
        }),
    }),
    z.object({
        type: z.literal("philosophy-thought-experiment"),
        config: z.object({
            scenario: z.enum(["trolley", "chinese-room", "experience-machine", "custom"]),
            dilemma: z.string(),
            perspectives: z.array(z.string()),
        }),
    }),
    z.object({
        type: z.literal("philosophy-concept-map"),
        config: z.object({
            centralConcept: z.string(),
            relatedConcepts: z.array(z.string()),
            mode: z.enum(["define", "relate", "distinguish"]),
        }),
    }),
    z.object({
        type: z.literal("physics-field"),
        config: z.object({
            type: z.enum(["magnetic", "electric", "lorentz"]),
            strength: z.number().optional(),
            particleCharge: z.number().optional(),
            particleMass: z.number().optional(),
            velocity: z.number().optional(),
        }),
    }),
    z.object({
        type: z.literal("physics-circuit"),
        config: z.object({
            components: z.array(z.object({
                type: z.enum(["resistor", "capacitor", "inductor", "source", "meter"]),
                value: z.number(),
                id: z.string(),
            })),
            frequency: z.number().optional(),
            showGraph: z.boolean().optional(),
        }),
    }),
    z.object({
        type: z.literal("physics-wave"),
        config: z.object({
            mode: z.enum(["interference", "standing-wave", "diffraction", "doppler"]),
            wavelength: z.number().optional(),
            slitWidth: z.number().optional(),
            frequency: z.number().optional(),
        }),
    }),
    z.object({
        type: z.literal("physics-quantum"),
        config: z.object({
            experiment: z.enum(["photoelectric", "bohr-model", "uncertainty"]),
            frequency: z.number().optional(),
            intensity: z.number().optional(),
            workFunction: z.number().optional(),
            targetElement: z.string().optional(),
        }),
    }),
    z.object({
        type: z.literal("data-analysis"),
        config: z.object({
            type: z.enum(["regression", "distribution"]),
            data: z.array(z.object({ x: z.number(), y: z.number(), label: z.string().optional() })),
            xAxisLabel: z.string().optional(),
            yAxisLabel: z.string().optional(),
        }),
    }),
    z.object({
        type: z.literal("model-fitting"),
        config: z.object({
            modelType: z.enum(["linear", "exponential", "power"]),
            data: z.array(z.object({ x: z.number(), y: z.number() })),
            initialParams: z.record(z.string(), z.number()).optional(),
        }),
    }),
    z.object({
        type: z.literal("research-copilot"),
        config: z.object({
            module: z.enum(["apa-generator", "survey-analyzer", "question-refiner"]),
            // APA Config
            sourceUrl: z.string().optional(),
            sourceType: z.enum(["website", "book", "journal"]).optional(),
            // Survey Config
            surveyData: z.array(z.record(z.string(), z.union([z.string(), z.number()]))).optional(),
            // Question Config
            currentQuestion: z.string().optional(),
            feedbackHistory: z.array(z.string()).optional(),
        }),
    }),
]);

export const LessonSectionSchema = z.preprocess((data: unknown) => {
    if (!data || typeof data !== "object") return data;
    const d = data as Record<string, unknown>;

    // Map common aliases to match schema
    return {
        ...d,
        heading: d.heading || d.title || d.label || "Nieuw Onderwerp",
        content: d.content || d.text || d.description || "",
        examples: Array.isArray(d.examples) ? d.examples : d.examples ? [d.examples] : [],
    };
}, z.object({
    id: z.string().optional(),
    heading: z.string(),
    content: z.string(),
    imageUrl: z.string().optional(),
    imagePrompt: z.string().optional(),
    imageError: z.string().optional(),
    examples: z.array(z.string()).optional().default([]),
    interactive: InteractiveComponentSchema.optional().catch(undefined),
}));

export const QuizQuestionTypeSchema = z.enum([
    "multiple-choice",
    "open-question",
    "true-false",
    "error-spotting",
    "source-analysis",
    "ordering",
    "fill-blank",
]);

export type QuizQuestionType = z.infer<typeof QuizQuestionTypeSchema>;

const QuizQuestionSchemaBase = z.object({
    id: z.string(),
    text: z.string(),
    question: z.string().optional(),
    type: z.preprocess((val) => {
        if (typeof val !== "string") return val;
        // Normalize snake_case to kebab-case
        const normalized = val.replace(/_/g, "-");
        // Special case for open -> open-question
        if (normalized === "open") return "open-question";
        return normalized;
    }, QuizQuestionTypeSchema),
    options: z.array(z.string()).optional().default([]),
    correctAnswerIndex: z.number().optional(),
    explanation: z.string().optional(),
    hint: z.string().optional(),
    solutionSteps: z.array(z.string()).optional(),
    contextReference: z.string().optional(),
    feedback: z.record(z.string(), z.string()).optional(),
    modelAnswer: z.string().optional(),
    context: z.string().optional(),

    // Extended fields for specific question types
    correction: z.string().optional(),
    items: z.array(z.object({
        id: z.string(),
        text: z.string()
    })).optional().default([]),
    correctSequence: z.array(z.string()).optional().default([]),
    blanks: z.array(z.object({
        index: z.number(),
        answer: z.string(),
        options: z.array(z.string()).optional().default([])
    })).optional().default([]),
    sourceTitle: z.string().optional(),
    sourceText: z.string().optional(),
    rubric: z.string().optional(),
    maxScore: z.number().optional(),

    subject: z.string(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional().default("medium"),
    topic: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
});

export const QuizQuestionSchema = z.preprocess((data: unknown) => {
    if (!data || typeof data !== "object") return data;

    const d = data as Record<string, unknown>;
    // Consolidate correctAnswerIndex from multiple possible fields
    const index = (d.correctAnswerIndex as number | undefined) ?? (d.correctIndex as number | undefined);

    // Handle correctAnswer if it's a number (legacy) or index-like string
    let finalIndex = index;
    if (finalIndex === undefined && d.correctAnswer !== undefined) {
        if (typeof d.correctAnswer === "number") {
            finalIndex = d.correctAnswer;
        } else if (typeof d.correctAnswer === "string" && Array.isArray(d.options)) {
            const foundIndex = (d.options as string[]).indexOf(d.correctAnswer);
            if (foundIndex !== -1) finalIndex = foundIndex;
        }
    }

    return {
        ...d,
        correctAnswerIndex: finalIndex,
    };
}, QuizQuestionSchemaBase)
    .refine((data) => {
        if (data.type === "multiple-choice") {
            return (
                typeof data.correctAnswerIndex === "number" &&
                data.options &&
                data.correctAnswerIndex >= 0 &&
                data.correctAnswerIndex < data.options.length
            );
        }
        return true;
    }, {
        message: "Multiple-choice questions must have a valid correctAnswerIndex within options range.",
        path: ["correctAnswerIndex"],
    });

export const DidacticConfigSchema = z.object({
    depth: z.enum(["espresso", "filter", "deep-dive"]),
    scaffolding: z.enum(["high", "medium", "none"]),
    role: z.enum(["receiving", "teaching", "devil"]),
    focus: z.union([
        z.enum(["concepts", "connections", "calculation", "standard"]),
        z.string()
    ]),
    mastery: z.enum(['novice', 'competent', 'expert']).optional(),
});

export const SavedLessonSchema = z.object({
    id: z.string(),
    title: z.string(),
    subject: z.string(),
    language: z.string().optional(),
    summary: z.string().optional(),
    sections: z.array(LessonSectionSchema.catch({
        heading: "Error Loading Section",
        content: "This section could not be loaded due to an AI formatting error.",
        examples: []
    })).default([]),
    keyConcepts: z.array(z.string()).catch([]).default([]),
    pitfalls: z.array(z.string()).catch([]).default([]),
    subjectConnections: z.array(z.string()).catch([]).default([]),
    crossCurricularConnections: z.array(z.string()).catch([]).default([]),
    quiz: z.array(QuizQuestionSchema).catch([]).default([]),
    practiceQuestions: z.array(z.string()).catch([]).default([]),
    createdAt: z.number(),
    updatedAt: z.number().optional(),
    didacticConfig: DidacticConfigSchema.optional().catch(undefined),
});

// Types derived from schemas
export type LessonMaterial = z.infer<typeof LessonMaterialSchema>;
export type LessonSection = z.infer<typeof LessonSectionSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type DidacticConfig = z.infer<typeof DidacticConfigSchema>;
export type SavedLesson = z.infer<typeof SavedLessonSchema>;
