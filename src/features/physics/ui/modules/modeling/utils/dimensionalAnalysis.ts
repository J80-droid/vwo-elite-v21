import * as math from "mathjs";

import { ErrorCategory, NumericalModel, SocraticErrorContext } from "../types";

export const analyzeDimensionalConsistency = (
  model: NumericalModel,
): SocraticErrorContext => {
  try {
    const unitScope: Record<string, math.Unit> = {};

    // 1. Setup Scope (zoals eerder)
    unitScope["dt"] = math.unit("s");
    unitScope["t"] = math.unit("s");

    // Populate constants & initials
    [...model.constants, ...model.initialValues].forEach((item) => {
      const u = item.unit && item.unit !== "-" ? item.unit : "1";
      try {
        unitScope[item.symbol] = math.unit(u);
      } catch {
        // Silent fail voor scope setup, wordt later wel gevangen
      }
    });

    // 2. Regel-voor-regel analyse
    const lines = model.equations; // Array van strings

    for (const line of lines) {
      if (!line.trim() || line.trim().startsWith("//")) continue;

      const [lhs, rhs] = line.split("=").map((s) => s.trim());
      if (!lhs || !rhs) continue;

      try {
        const rhsNode = math.parse(rhs);
        const rhsUnit = rhsNode.evaluate(unitScope);

        // Bestaat LHS al? (Iteratief proces: v = v + ...)
        if (unitScope[lhs]) {
          const lhsUnit = unitScope[lhs];

          // PROBEER OP TE TELLEN (De Lakmoesproef)
          try {
            math.add(lhsUnit, rhsUnit);
          } catch {
            // HIT! Hier zit een conflict.
            // Nu analyseren we welk type conflict het is.

            const lhsStr = lhsUnit.formatUnits();
            const rhsStr = rhsUnit.formatUnits();

            // Detecteer "Missing dt" patroon:
            // Als LHS = [X] en RHS = [X]/[T] (of andersom)
            // Bijv: m/s vs m/s^2
            const ratio = math.divide(rhsUnit, lhsUnit) as math.Unit;

            if (
              ratio.equals(math.unit("1/s")) ||
              ratio.equals(math.unit("s"))
            ) {
              return {
                hasError: true,
                category: ErrorCategory.MISSING_DT,
                studentCodeSnippet: line,
                conflictingUnits: { left: lhsStr, right: rhsStr },
                technicalDetails: `Integratiefout gedetecteerd.`,
                aiSystemPrompt: `
                                    De leerling probeert een variabele met eenheid '${lhsStr}' te updaten met een waarde van '${rhsStr}'. 
                                    Dit is een klassieke fout bij differentievergelijkingen (Domein A14). 
                                    De leerling vergeet vermoedelijk de tijdstap 'dt'.
                                    VRAAG: Geef NIET het antwoord "je moet * dt doen".
                                    SOCRATISCHE AANPAK: Vraag de leerling wat de definitie is van de verandering (bijv. versnelling). 
                                    Vraag: "Als a = ${rhsStr} is, hoeveel snelheid komt er dan in 1 seconde bij? En hoeveel in 0,1 seconde?"
                                `,
              };
            }

            // Generieke mismatch (Appels + Peren)
            return {
              hasError: true,
              category: ErrorCategory.DIMENSION_MISMATCH,
              studentCodeSnippet: line,
              conflictingUnits: { left: lhsStr, right: rhsStr },
              aiSystemPrompt: `
                                De leerling probeert '${lhsStr}' en '${rhsStr}' bij elkaar op te tellen of gelijk te stellen.
                                Dit is fysisch onmogelijk.
                                SOCRATISCHE AANPAK: Vraag de leerling om de eenheden van beide kanten van het gelijkteken te controleren.
                                Gebruik een analogie: "Kun je euro's optellen bij kilogrammen?"
                            `,
            };
          }
        } else {
          // Eerste definitie van variabele
          unitScope[lhs] = rhsUnit;
        }
      } catch (err: unknown) {
        // Syntax errors of MathJS parse errors
        return {
          hasError: true,
          category: ErrorCategory.SYNTAX,
          studentCodeSnippet: line,
          technicalDetails: err instanceof Error ? err.message : String(err),
          aiSystemPrompt: `De leerling heeft een syntaxfout gemaakt in de regel: "${line}". Help ze de syntax te corrigeren zonder de code direct voor te zeggen.`,
        };
      }
    }

    return { hasError: false };
  } catch (e: unknown) {
    return {
      hasError: true,
      category: ErrorCategory.SYNTAX,
      technicalDetails: `General parse error: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
};
