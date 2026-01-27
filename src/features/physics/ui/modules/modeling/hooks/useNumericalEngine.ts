import * as math from "mathjs";
import { useCallback, useState } from "react";

import {
  ModelConstant,
  ModelVariable,
  NumericalModel,
  SimulationStep,
  SocraticErrorContext,
} from "../types";
import { analyzeDimensionalConsistency } from "../utils/dimensionalAnalysis";

export const useNumericalEngine = () => {
  const [results, setResults] = useState<SimulationStep[]>([]);
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] =
    useState<SocraticErrorContext | null>(null);

  const runSimulation = useCallback((model: NumericalModel) => {
    setIsComputing(true);
    setError(null);
    setAnalysisResult(null);

    // 1. VOER ANALYSE UIT
    const analysis = analyzeDimensionalConsistency(model);
    setAnalysisResult(analysis);

    if (analysis.hasError) {
      setIsComputing(false);
      return; // Stop simulatie direct, dwing leerling tot reflectie
    }

    try {
      const steps: SimulationStep[] = [];
      let t = 0;

      // 2. Initialiseer scope met startwaarden en constanten
      const scope: SimulationStep = { t: 0, dt: model.timeStep };
      model.constants.forEach(
        (c: ModelConstant) => (scope[c.symbol] = c.value),
      );
      model.initialValues.forEach(
        (v: ModelVariable) => (scope[v.symbol] = v.value),
      );

      // 3. Compileer de regels voor snelheid
      const compiledRules = model.equations
        .filter((eq: string) => eq.trim() !== "" && !eq.trim().startsWith("//")) // Filter empty lines and comments
        .map((eq: string) => {
          const parts = eq.split("=");
          if (parts.length < 2) throw new Error(`Ongeldige regel: "${eq}"`);

          const lhs = parts[0]!.trim();
          const rhs = parts.slice(1).join("=").trim();

          if (!lhs || !rhs) throw new Error(`Ongeldige regel: "${eq}"`);

          return {
            lhs,
            code: math.compile(rhs),
          };
        });

      // 4. De Time-Loop (Euler methode)
      while (t <= model.duration) {
        // Sla huidige staat op inclusief t
        const stepResult = { ...scope, t: Number(t.toFixed(4)) };
        steps.push(stepResult);

        // Bereken nieuwe waarden (Modelregels uitvoeren)
        // Let op: Volgorde is belangrijk in Coach-modellen!
        compiledRules.forEach((rule) => {
          scope[rule.lhs] = rule.code.evaluate(scope);
        });

        // Update tijd
        t += model.timeStep;
        scope.t = t;

        // Veiligheid: Voorkom oneindige loops bij bugs of te kleine dt
        if (steps.length > 20000) {
          console.warn(
            "Simulatie afgebroken: limiet van 20.000 stappen bereikt.",
          );
          break;
        }
      }

      setResults(steps);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fout in modelberekening");
      console.error(err);
    } finally {
      setIsComputing(false);
    }
  }, []);

  return { results, runSimulation, isComputing, error, analysisResult };
};
