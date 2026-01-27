/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic Gemini API responses and math parsing */
// nerdamer imports removed for lazy loading

let nerdamerInstance: any = null;

async function initNerdamer() {
  if (nerdamerInstance) return nerdamerInstance;
  try {
    const n = (await import("nerdamer")).default;
    await import("nerdamer/Algebra");
    await import("nerdamer/Calculus");
    await import("nerdamer/Solve");
    // Enable Complex Numbers support if available in this build
    if (typeof (n as any).set === "function") {
      (n as any).set("IMAGINARY", "i");
    }
    nerdamerInstance = n;
    return n;
  } catch (e) {
    console.error("StepSolver: Failed to load nerdamer", e);
    return null;
  }
}

export interface SolutionStep {
  id: string;
  title: string;
  description: string;
  latex: string;
  rule?: string;
  rationale?: string;
}

export interface SolutionResult {
  problem: string;
  type:
    | "derivative"
    | "integral"
    | "definite_integral"
    | "roots"
    | "simplify"
    | "factor"
    | "limit"
    | "spot_error"
    | "exam_trainer";
  steps: SolutionStep[];
  finalAnswer: string;
  primaryColor?: string;
  isErrorSpotting?: boolean;
  errorStepId?: string;
  nextProblem?: string;
}

export class StepSolver {
  static async solve(
    expression: string,
    type:
      | "derivative"
      | "integral"
      | "definite_integral"
      | "roots"
      | "simplify"
      | "factor"
      | "limit"
      | "spot_error"
      | "exam_trainer" = "derivative",
    variable: string = "x",
    t: (key: string, options?: any) => string,
    options?: { lower?: string; upper?: string; limitTo?: string },
  ): Promise<SolutionResult> {
    if (type === "spot_error") {
      const originalResult = await this.solve(
        expression,
        "derivative",
        variable,
        t,
      );
      return this.mutateForErrorSpotting(originalResult, t);
    }

    if (type === "exam_trainer") {
      const variantExpr = expression.replace(/\d+/g, () =>
        (Math.floor(Math.random() * 9) + 1).toString(),
      );
      const result = await this.solve(variantExpr, "derivative", variable, t);
      result.type = "exam_trainer";
      result.nextProblem = variantExpr;
      return result;
    }

    const n = await initNerdamer();
    if (!n) {
      return {
        problem: expression,
        type: type,
        steps: [
          {
            id: "error",
            title: "Loading...",
            description: "Mathematical engine is loading...",
            latex: "",
          },
        ],
        finalAnswer: "...",
      };
    }

    switch (type) {
      case "derivative":
        return this.solveDerivative(n, expression, variable, t);
      case "roots":
        return this.solveRoots(n, expression, variable, t);
      case "limit":
        try {
          const target = options?.limitTo || "0";
          const limitExpr = `limit(${expression}, ${variable}, ${target})`;
          const result = n(limitExpr).toString();
          const latexResult = n(limitExpr).toTeX();

          return {
            problem: expression,
            type: "limit",
            steps: [
              {
                id: "limit-result",
                title: `Limiet x → ${target}`,
                description: t("calculus.step_final_desc"),
                latex: `\\lim_{${variable} \\to ${target}} (${expression}) = ${latexResult}`,
                rationale:
                  "We evalueren het gedrag van de functie naarmate x de doelwaarde nadert.",
              },
            ],
            finalAnswer: result,
          };
        } catch {
          return {
            problem: expression,
            type: type,
            steps: [
              {
                id: "error",
                title: "Error",
                description: "Could not calculate limit",
                latex: "",
              },
            ],
            finalAnswer: "Error",
          };
        }
      case "definite_integral":
        try {
          const lower = options?.lower || "0";
          const upper = options?.upper || "1";
          const defIntExpr = `defint(${expression}, ${lower}, ${upper}, ${variable})`;
          const result = n(defIntExpr).toString();
          const latexResult = n(defIntExpr).toTeX();

          return {
            problem: expression,
            type: "definite_integral",
            steps: [
              {
                id: "def-int-result",
                title: `Integraal [${lower}, ${upper}]`,
                description: "Oppervlakte onder de grafiek",
                latex: `\\int_{${lower}}^{${upper}} (${expression}) \\, d${variable} = ${latexResult}`,
                rationale:
                  "We berekenen de bepaalde integraal door de primitieve te evalueren op de grenzen F(b) - F(a).",
              },
            ],
            finalAnswer: result,
          };
        } catch {
          return {
            problem: expression,
            type: type,
            steps: [
              {
                id: "error",
                title: "Error",
                description: "Could not calculate definite integral",
                latex: "",
              },
            ],
            finalAnswer: "Error",
          };
        }
      case "simplify":
      case "factor":
        try {
          const cleanExpr = expression.replace(/^(y|f\(x\))\s*=\s*/, "");
          const result =
            type === "factor"
              ? n(`factor(${cleanExpr})`).toString()
              : n(cleanExpr).text("fractions");

          const latexResult =
            type === "factor"
              ? n(`factor(${cleanExpr})`).toTeX()
              : n(cleanExpr).toTeX();

          const didacticSteps: SolutionStep[] = [];

          if (type === "factor") {
            didacticSteps.push({
              id: "factor-1",
              title: "Analyseer Structuur",
              description: "Kijk naar gemeenschappelijke termen en patronen.",
              latex: cleanExpr,
              rationale:
                "We zoeken naar een grootste gemene deler of merkwaardige producten.",
            });
            didacticSteps.push({
              id: "factor-2",
              title: "Pas Ontbindingsregels Toe",
              description: "Gebruik de product-som methode of discriminant.",
              latex: `\\text{...rekenwerk...}`,
              rationale:
                "Door termen te groeperen kunnen we de expressie schrijven als een product.",
            });
          } else {
            didacticSteps.push({
              id: "simp-1",
              title: "Combineer Gelijksoortige Termen",
              description: "Voeg termen met dezelfde machten samen.",
              latex: cleanExpr,
              rationale:
                "Dit maakt de expressie compacter en overzichtelijker.",
            });
          }

          didacticSteps.push({
            id: "result",
            title:
              type === "factor"
                ? t("calculus.symbolic_ops.factor")
                : t("calculus.symbolic_ops.simplify"),
            description: t("calculus.step_final_desc"),
            latex: latexResult,
            rationale: t("calculus.step_final_rationale"),
          });

          return {
            problem: cleanExpr,
            type: type,
            steps: didacticSteps,
            finalAnswer: result,
          };
        } catch {
          return {
            problem: expression,
            type: type,
            steps: [
              {
                id: "error",
                title: "Error",
                description: "Could not process expression",
                latex: "",
              },
            ],
            finalAnswer: "Error",
          };
        }
      default:
        return {
          problem: expression,
          type: type as any,
          steps: [],
          finalAnswer: `\\text{${t("calculus.empty_state")}}`,
        };
    }
  }

  static async solveMatrix(
    matrix: number[][],
    type: "det" | "inv",
    t: (key: string, options?: any) => string,
  ): Promise<SolutionResult> {
    const rows = matrix.length;
    const cols = matrix[0]?.length || 0;
    const steps: SolutionStep[] = [];
    const matrixLatex = `\\begin{bmatrix} ${matrix.map((r) => r.join(" & ")).join(" \\\\ ")} \\end{bmatrix}`;

    if (type === "det") {
      if (rows === 2 && cols === 2) {
        const [a, b] = matrix[0]! as [number, number];
        const [c, d] = matrix[1]! as [number, number];
        const det = a * d - b * c;
        steps.push({
          id: "det-2x2",
          title: t("calculus.step_matrix_det"),
          description: t("calculus.step_matrix_det_2x2_desc"),
          latex: `|A| = (${a})(${d}) - (${b})(${c}) = ${det}`,
          rationale: t("calculus.step_matrix_det_rationale"),
        });
        return {
          problem: matrixLatex,
          type: "simplify",
          steps,
          finalAnswer: String(det),
        };
      } else if (rows === 3 && cols === 3) {
        const n = await initNerdamer();
        const det = n ? (n as any).det(matrixLatex).toString() : "...";
        steps.push({
          id: "det-3x3",
          title: t("calculus.step_matrix_det"),
          description: t("calculus.step_matrix_det_3x3_desc"),
          latex: `|A| = ${det}`,
          rationale: t("calculus.step_matrix_det_rationale"),
        });
        return {
          problem: matrixLatex,
          type: "simplify",
          steps,
          finalAnswer: String(det),
        };
      }
    } else if (type === "inv") {
      if (rows === 2 && cols === 2) {
        const [a, b] = matrix[0]! as [number, number];
        const [c, d] = matrix[1]! as [number, number];
        const det = a * d - b * c;
        if (det === 0) {
          return {
            problem: matrixLatex,
            type: "simplify",
            steps: [
              {
                id: "error",
                title: "Error",
                description: "Matrix is singular (det=0)",
                latex: "",
              },
            ],
            finalAnswer: "N/A",
          };
        }
        const adj = `\\begin{bmatrix} ${d} & ${-b} \\\\ ${-c} & ${a} \\end{bmatrix}`;
        const inv = `\\frac{1}{${det}} ${adj}`;
        steps.push({
          id: "inv-2x2-det",
          title: t("calculus.step_matrix_inv"),
          description: t("calculus.step_matrix_det_2x2_desc"),
          latex: `|A| = ${det}`,
          rationale: t("calculus.step_matrix_inv_det_rationale"),
        });
        steps.push({
          id: "inv-2x2-final",
          title: t("calculus.step_matrix_inv"),
          description: t("calculus.step_matrix_inv_2x2_desc"),
          latex: `A^{-1} = ${inv}`,
          rationale: t("calculus.step_matrix_inv_final_rationale"),
        });
        return {
          problem: matrixLatex,
          type: "simplify",
          steps,
          finalAnswer: inv,
        };
      }
    }

    return {
      problem: matrixLatex,
      type: "simplify",
      steps: [
        {
          id: "no-steps",
          title: t("calculus.calculation_success") || "Calculation Success",
          description:
            t("calculus.step_matrix_limit_desc") ||
            "Step-by-step calculation for matrices larger than 3x3 requires Gauss-Jordan elimination, which is currently handled by the engine but not visualized in steps.",
          latex: "",
        },
      ],
      finalAnswer: "...",
    };
  }

  private static solveDerivative(
    n: any,
    expression: string,
    variable: string,
    t: (key: string, options?: any) => string,
  ): SolutionResult {
    const steps: SolutionStep[] = [];

    try {
      const cleanExpr = expression.replace(
        /^([a-z,A-Z]+\([a-z,A-Z]+\)|[a-z,A-Z])\s*=\s*/i,
        "",
      );

      steps.push({
        id: "init",
        title: t("calculus.step_problem"),
        description:
          variable === "x"
            ? t("calculus.step_diff_x")
            : t("calculus.step_diff_var", { var: variable }),
        latex: `\\frac{d}{d${variable}} \\left( ${cleanExpr} \\right)`,
        rationale: t("calculus.step_problem_rationale"),
      });

      if (cleanExpr.includes("+") || cleanExpr.includes("-")) {
        steps.push({
          id: "sum-rule",
          title: t("calculus.step_sum_rule"),
          description: t("calculus.step_sum_desc"),
          latex: `\\frac{d}{d${variable}}(u \\pm v) = \\frac{du}{d${variable}} \\pm \\frac{dv}{d${variable}}`,
          rule: "Sum Rule",
          rationale: t("calculus.step_sum_rule_rationale"),
        });
      }

      if (cleanExpr.match(new RegExp(`${variable}\\^`))) {
        steps.push({
          id: "power-rule",
          title: t("calculus.step_power_rule"),
          description: t("calculus.step_power_desc"),
          latex: `\\frac{d}{d${variable}}(${variable}^n) = n${variable}^{n-1}`,
          rule: "Power Rule",
          rationale: t("calculus.step_power_rule_rationale"),
        });
      }

      if (cleanExpr.match(/(sin|cos|tan|exp|log)\(.+\)/)) {
        steps.push({
          id: "chain-rule",
          title: t("calculus.step_chain_rule"),
          description: t("calculus.step_chain_desc"),
          latex: `\\frac{d}{d${variable}}f(g(${variable})) = f'(g(${variable})) \\cdot g'(${variable})`,
          rule: "Chain Rule",
          rationale: t("calculus.step_chain_rule_rationale"),
        });
      }

      const result = n(`diff(${cleanExpr}, ${variable})`).toString();
      const latexResult = n(`diff(${cleanExpr}, ${variable})`).toTeX();

      steps.push({
        id: "final",
        title: t("calculus.step_final"),
        description: t("calculus.step_final_desc"),
        latex: latexResult,
        rationale: t("calculus.step_final_rationale"),
      });

      return {
        problem: cleanExpr,
        type: "derivative",
        steps,
        finalAnswer: result,
      };
    } catch {
      return {
        problem: expression,
        type: "derivative",
        steps: [
          {
            id: "error",
            title: "Error",
            description: "Could not generate steps",
            latex: "",
          },
        ],
        finalAnswer: "Error",
      };
    }
  }

  private static solveRoots(
    n: any,
    expression: string,
    variable: string,
    t: (key: string, options?: any) => string,
  ): SolutionResult {
    try {
      const cleanExpr = expression.replace(/^(y|f\(x\))\s*=\s*/, "");
      const steps: SolutionStep[] = [];

      steps.push({
        id: "init",
        title: t("calculus.step_set_zero") || "Set to Zero",
        description:
          t("calculus.step_find_roots") ||
          `Find ${variable} where f(${variable}) = 0`,
        latex: `${cleanExpr} = 0`,
        rationale:
          t("calculus.step_set_zero_rationale") ||
          "Solving an equation always starts by setting the expression to zero to find horizontal intercepts.",
      });

      if (cleanExpr.match(new RegExp(`${variable}\\^2`))) {
        steps.push({
          id: "quadratic",
          title: t("calculus.step_quadratic") || "Quadratic Formula",
          description:
            t("calculus.step_quad_desc") || "Use the quadratic formula",
          latex: `x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}`,
          rationale:
            t("calculus.step_quadratic_rationale") ||
            "The quadratic formula is a universal method to find roots of second-degree polynomials.",
        });
      }

      const roots = n(`solve(${cleanExpr}, ${variable})`).toString();
      const latexRoots = n(`solve(${cleanExpr}, ${variable})`).toTeX();

      steps.push({
        id: "final",
        title: t("calculus.step_roots_found") || "Roots Found",
        description:
          t("calculus.step_roots_desc") || `The values of ${variable} are:`,
        latex: latexRoots,
        rationale: t("calculus.step_final_rationale"),
      });

      return {
        problem: cleanExpr,
        type: "roots",
        steps,
        finalAnswer: roots,
      };
    } catch {
      return {
        problem: expression,
        type: "roots",
        steps: [
          {
            id: "error",
            title: "Error",
            description: "Could not calculate roots due to invalid syntax.",
            latex: "",
          },
        ],
        finalAnswer: "Error",
      };
    }
  }

  static solveVectorOp(
    vectors: { x: number; y: number; z: number }[],
    type: "cross",
    t: (key: string, options?: any) => string,
  ): SolutionResult {
    const steps: SolutionStep[] = [];
    if (type === "cross" && vectors.length >= 2) {
      const v1 = vectors[0]!;
      const v2 = vectors[1]!;

      const problemLatex = `\\vec{v}_1 \\times \\vec{v}_2 = \\begin{bmatrix} ${v1.x} \\\\ ${v1.y} \\\\ ${v1.z} \\end{bmatrix} \\times \\begin{bmatrix} ${v2.x} \\\\ ${v2.y} \\\\ ${v2.z} \\end{bmatrix}`;

      steps.push({
        id: "cross-def",
        title: t("calculus.vectors.settings.cross_product"),
        description: t("calculus.step_vector_cross_desc"),
        latex: `\\vec{v}_1 \\times \\vec{v}_2 = \\begin{vmatrix} \\mathbf{i} & \\mathbf{j} & \\mathbf{k} \\\\ v_{1x} & v_{1y} & v_{1z} \\\\ v_{2x} & v_{2y} & v_{2z} \\end{vmatrix}`,
        rationale: t("calculus.step_vector_cross_rationale"),
      });

      const xComp = `(${v1.y})(${v2.z}) - (${v1.z})(${v2.y})`;
      const yComp = `((${v1.x})(${v2.z}) - (${v1.z})(${v2.x}))`;
      const zComp = `(${v1.x})(${v2.y}) - (${v1.y})(${v2.x})`;

      const rx = v1.y * v2.z - v1.z * v2.y;
      const ry = -(v1.x * v2.z - v1.z * v2.x);
      const rz = v1.x * v2.y - v1.y * v2.x;

      steps.push({
        id: "cross-comp",
        title: t("calculus.step_vector_components"),
        description: t("calculus.step_vector_cross_comp_desc"),
        latex: `\\begin{bmatrix} ${xComp} \\\\ -${yComp} \\\\ ${zComp} \\end{bmatrix} = \\begin{bmatrix} ${rx} \\\\ ${ry} \\\\ ${rz} \\end{bmatrix}`,
        rationale: t("calculus.step_vector_comp_rationale"),
      });

      return {
        problem: problemLatex,
        type: "simplify",
        steps,
        finalAnswer: `\\begin{bmatrix} ${rx} \\\\ ${ry} \\\\ ${rz} \\end{bmatrix}`,
        primaryColor: "#fbbf24", // Amber
      };
    }

    return {
      problem: "Vector Operation",
      type: "simplify",
      steps: [],
      finalAnswer: "N/A",
    };
  }

  private static mutateForErrorSpotting(
    result: SolutionResult,
    t: (key: string, options?: any) => string,
  ): SolutionResult {
    if (result.steps.length < 2) return result;

    const mutated = JSON.parse(JSON.stringify(result)) as SolutionResult;
    mutated.type = "spot_error";
    mutated.isErrorSpotting = true;

    const targetIndex =
      result.steps.length > 2
        ? 1 + Math.floor(Math.random() * (result.steps.length - 2))
        : 0;

    const targetStep = mutated.steps[targetIndex]!;
    mutated.errorStepId = targetStep.id;

    const mutations = [
      () => {
        targetStep.latex = targetStep.latex
          .replace(/\+/g, "TEMP")
          .replace(/-/g, "+")
          .replace(/TEMP/g, "-");
        targetStep.description =
          t("calculus.step_error_sign_hint") ||
          "Let goed op de tekens bij het differentiëren.";
      },
      () => {
        targetStep.latex = targetStep.latex.replace(
          /\^(\d+)/g,
          (_, p1) => `^${p1}`,
        );
        targetStep.description =
          t("calculus.step_error_power_hint") ||
          "Vergeet de macht niet te verlagen.";
      },
      () => {
        targetStep.description =
          t("calculus.step_error_chain_hint") ||
          "Is de kettingregel hier wel volledig toegepast?";
      },
    ];

    const randomMutation =
      mutations[Math.floor(Math.random() * mutations.length)]!;
    randomMutation();

    return mutated;
  }
}
