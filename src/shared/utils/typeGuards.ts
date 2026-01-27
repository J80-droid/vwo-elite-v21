import {
    type InteractiveComponentSchema,
    type QuizQuestionType,
    QuizQuestionTypeSchema,
    type StudyMaterial,
} from "@shared/types/index";
import { z } from "zod";

export type InteractiveComponent = z.infer<typeof InteractiveComponentSchema>;

// --- Component Type Guards ---

export const isPhysicsComponent = (
    c: InteractiveComponent
): c is Extract<InteractiveComponent, { type: "physics-simulation" } | { type: "physics-field" } | { type: "physics-circuit" } | { type: "physics-wave" } | { type: "physics-quantum" }> => {
    return c.type.startsWith("physics-");
};

export const isBiologyComponent = (
    c: InteractiveComponent
): c is Extract<InteractiveComponent, { type: "biology-process" } | { type: "biology-feedback" } | { type: "biology-genetics" } | { type: "biology-ecology" }> => {
    return c.type.startsWith("biology-");
};

export const isChemistryComponent = (
    c: InteractiveComponent
): c is Extract<InteractiveComponent, { type: "chemistry-molecule" } | { type: "chemistry-process" } | { type: "chemistry-analysis" } | { type: "chemistry-electro" }> => {
    return c.type.startsWith("chemistry-");
};

export const isMathComponent = (
    c: InteractiveComponent
): c is Extract<InteractiveComponent, { type: "math-analysis" } | { type: "math-geometry" } | { type: "math-motion" }> => {
    return c.type.startsWith("math-");
};

export const isLanguageComponent = (
    c: InteractiveComponent
): c is Extract<InteractiveComponent, { type: "language-text-analysis" } | { type: "language-syntax-builder" } | { type: "language-immersion" }> => {
    return c.type.startsWith("language-");
};

export const isDutchComponent = (
    c: InteractiveComponent
): c is Extract<InteractiveComponent, { type: "dutch-argumentation" } | { type: "dutch-text-anatomy" } | { type: "dutch-style" }> => {
    return c.type.startsWith("dutch-");
};

export const isPhilosophyComponent = (
    c: InteractiveComponent
): c is Extract<InteractiveComponent, { type: "philosophy-logic" } | { type: "philosophy-thought-experiment" } | { type: "philosophy-concept-map" }> => {
    return c.type.startsWith("philosophy-");
};

export const isResearchComponent = (
    c: InteractiveComponent
): c is Extract<InteractiveComponent, { type: "research-copilot" }> => {
    return c.type === "research-copilot";
};

// --- Data Type Guards ---

export const isStudyMaterial = (data: unknown): data is StudyMaterial => {
    return (
        typeof data === "object" &&
        data !== null &&
        "id" in data &&
        "content" in data &&
        "type" in data
    );
};

export const isValidQuizQuestionType = (type: string): type is QuizQuestionType => {
    return QuizQuestionTypeSchema.safeParse(type).success;
};
