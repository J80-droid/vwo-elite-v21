
import { describe, test, expect } from "vitest";
import { GasLawEngine } from "@features/physics/ui/gym/engines/GasLawEngine";
import { LogicEngine } from "@features/philosophy/ui/gym/engines/LogicEngine";
import { ConjugationAlgoEngine } from "@features/french/ui/gym/engines/ConjugationAlgoEngine";
import { SpellingAlgoEngine } from "@features/dutch/ui/gym/engines/SpellingAlgoEngine";
import { PhPrecisionEngine } from "@features/chemistry/ui/gym/engines/PhPrecisionEngine";
import { OrbitEngine } from "@features/physics/ui/gym/engines/OrbitEngine";

describe("Gym Engine Stress Tests", () => {
    const RUNS = 1000;

    const runEngineStress = (engine: any, level: number) => {
        for (let i = 0; i < RUNS; i++) {
            const problem = engine.generate(level);

            // Basic Integrity
            expect(problem).toBeDefined();
            expect(problem.question).toBeTruthy();
            expect(problem.answer).toBeTruthy();
            expect(problem.id).toBeTruthy();

            // NaN / Infinity Checks
            if (typeof problem.answer === 'string' && !isNaN(parseFloat(problem.answer))) {
                expect(problem.answer).not.toContain("NaN");
                expect(problem.answer).not.toContain("Infinity");
            }

            // Self-Validation Check
            // The engine should validate its own generated answer as true
            const validation = engine.validate(problem.answer, problem);
            if (!validation.correct) {
                console.error(`Validation Failed for ${engine.id} at run ${i}:`, {
                    q: problem.question,
                    a: problem.answer,
                    feedback: validation.feedback
                });
            }
            expect(validation.correct).toBe(true);
        }
    };

    test("GasLawEngine (Physics) - Stress Test", () => {
        runEngineStress(GasLawEngine, 1);
        runEngineStress(GasLawEngine, 2);
    });

    test("LogicEngine (Philosophy) - Stress Test", () => {
        runEngineStress(LogicEngine, 1);
        runEngineStress(LogicEngine, 2);
    });

    test("ConjugationAlgoEngine (French) - Stress Test", () => {
        runEngineStress(ConjugationAlgoEngine, 1);
        runEngineStress(ConjugationAlgoEngine, 2);
        runEngineStress(ConjugationAlgoEngine, 3);
    });

    test("SpellingAlgoEngine (Dutch) - Stress Test", () => {
        // We expect this to FAIL initially due to the 'praat' + 't' bug
        runEngineStress(SpellingAlgoEngine, 1);
        runEngineStress(SpellingAlgoEngine, 2);
        runEngineStress(SpellingAlgoEngine, 3);
    });

    test("PhPrecisionEngine (Chemistry) - Stress Test", () => {
        runEngineStress(PhPrecisionEngine, 1);
        runEngineStress(PhPrecisionEngine, 4);
    });

    test("OrbitEngine (Physics) - Stress Test", () => {
        runEngineStress(OrbitEngine, 1);
    });

    // Specific Logic Checks
    test("SpellingAlgoEngine - No Double T", () => {
        // Manual check for the specific bug
        // We will loop until we hit "praten" or similar t-root
        for (let i = 0; i < 500; i++) {
            const problem = SpellingAlgoEngine.generate(1);
            if (problem.question.includes("praten") && problem.question.includes("Hij")) {
                // Should be 'praat', not 'praatt'
                expect(problem.answer).not.toBe("praatt");
                expect(problem.answer).toBe("praat");
            }
        }
    });

    test("ConjugationAlgoEngine - Elision Check", () => {
        for (let i = 0; i < 500; i++) {
            const problem = ConjugationAlgoEngine.generate(1);
            if (problem.answer.startsWith("a") || problem.answer.startsWith("e")) {
                if (problem.question.includes("Je/J'")) {
                    expect(problem.question).toContain("J'");
                    expect(problem.question).not.toContain("Je ");
                }
            }
        }
    });
});
