import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

/**
 * Creates a mixed engine that randomly picks from a list of sub-engines.
 * Each problem generated will include a 'sourceEngineId' so validation can be delegated back.
 */
export const createMixEngine = (
  id: string,
  name: string,
  description: string,
  engines: Record<string, GymEngine>,
  engineIds: string[],
): GymEngine => {
  // Fail-fast during initialization
  if (!engineIds.length) {
    throw new Error(`MixEngine '${id}' must contain at least 1 sub-engine.`);
  }

  return {
    id,
    name,
    description,
    generate: (level: Difficulty) => {
      const randomEngineId =
        engineIds[Math.floor(Math.random() * engineIds.length)]!;
      const engine = engines[randomEngineId];
      if (!engine) {
        throw new Error(`Engine ${randomEngineId} not found in mix`);
      }

      const problem = engine.generate(level);
      return {
        ...problem,
        // Prefix ID to prevent collision with the 'real' engine
        id: `${id}-${problem.id}`,
        // Use standardized meta field for tracking
        meta: {
          ...problem.meta,
          sourceEngineId: randomEngineId,
        },
      };
    },
    validate: (input: string, problem: GymProblem) => {
      const sourceId = problem.meta?.sourceEngineId as string;
      if (!sourceId || !engines[sourceId]) {
        console.error(`[MixEngine] Source engine '${sourceId}' not found.`);
        return {
          correct: false,
          feedback: "Er is een technische fout opgetreden bij het nakijken.",
        };
      }

      return engines[sourceId].validate(input, problem);
    },
  };
};
