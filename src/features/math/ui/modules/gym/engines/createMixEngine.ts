import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

/**
 * Creates a mixed engine that randomly picks from a list of sub-engines.
 * Each problem generated will include a 'sourceEngineId' so validation can be delegated back.
 */
export const createMixEngine = (
  id: string,
  name: string,
  description: string,
  enginesList: GymEngine[],
): GymEngine => {
  // Fail-fast during initialization
  if (!enginesList.length) {
    throw new Error(`MixEngine '${id}' must contain at least 1 sub-engine.`);
  }

  // Interne Map voor snelle lookup tijdens validatie
  // We maken van de array een object: { "engine-id": EngineObj, ... }
  const engineMap = enginesList.reduce((acc, engine) => {
    acc[engine.id] = engine;
    return acc;
  }, {} as Record<string, GymEngine>);

  return {
    id,
    name,
    description,
    generate: (level: Difficulty) => {
      // Kies een random engine uit de lijst
      const randomEngine =
        enginesList[Math.floor(Math.random() * enginesList.length)]!;

      // Genereer de vraag
      const problem = randomEngine.generate(level);

      return {
        ...problem,
        // Prefix ID om collisions te voorkomen in de UI
        id: `${id}-${problem.id}`,
        // Voeg metadata toe zodat we weten WIE dit heeft gemaakt
        meta: {
          ...problem.meta,
          sourceEngineId: randomEngine.id, // Cruciaal voor validatie
        },
        // We passen de context iets aan zodat de leerling ziet uit welk vak dit komt
        context: `[${randomEngine.name}] ${problem.context || ""}`,
      };
    },

    validate: (input: string, problem: GymProblem) => {
      const sourceId = problem.meta?.sourceEngineId as string;
      const targetEngine = engineMap[sourceId];

      if (!sourceId || !targetEngine) {
        console.error(`[MixEngine] Source engine '${sourceId}' not found.`);
        // Fallback: simpele string match als de engine kwijt is
        const isCorrect =
          input.trim().toLowerCase() === problem.answer.toLowerCase();
        return {
          correct: isCorrect,
          feedback: isCorrect
            ? "Correct"
            : `Antwoord: ${problem.answer} (Fallback)`,
        };
      }

      // Delegeer de validatie naar de oorspronkelijke engine (bv. MathValidator of String check)
      return targetEngine.validate(input, problem);
    },
  };
};
