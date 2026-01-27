import { Difficulty, GymProblem } from "@shared/types/gym";

export const CircuitEngine = {
  generate: (_level: Difficulty): GymProblem => {
    // We genereren mooie getallen voor parallelrekenen (bijv. 60 en 30 -> 20)
    const pairs = [
      [10, 10, 5],
      [60, 30, 20],
      [12, 4, 3],
      [100, 25, 20],
      [20, 20, 10],
      [100, 100, 50],
    ];

    const mode = Math.random() > 0.5 ? "serie" : "parallel";
    let r1 = 0,
      r2 = 0,
      rTotal = 0;
    let question = "";
    let steps: string[] = [];

    if (mode === "serie") {
      r1 = Math.floor(Math.random() * 50) + 10;
      r2 = Math.floor(Math.random() * 50) + 10;
      rTotal = r1 + r2;

      question = `Twee weerstanden van $${r1}\\ \\Omega$ en $${r2}\\ \\Omega$ staan in **serie**.\n\nBereken de vervangingsweerstand $R_{v}$.`;
      steps = ["Serie: $R_v = R_1 + R_2$", `${r1} + ${r2} = ${rTotal}`];
    } else {
      // Parallel: Kies een mooi paar
      const set = pairs[Math.floor(Math.random() * pairs.length)]!;
      r1 = set[0]!;
      r2 = set[1]!;
      rTotal = set[2]!;

      // Hussel r1 en r2 soms
      if (Math.random() > 0.5) [r1, r2] = [r2, r1];

      question = `Twee weerstanden van $${r1}\\ \\Omega$ en $${r2}\\ \\Omega$ staan **parallel**.\n\nBereken de vervangingsweerstand $R_{v}$.`;
      steps = [
        "Parallel: $\\frac{1}{R_v} = \\frac{1}{R_1} + \\frac{1}{R_2}$",
        "Of sneller: $R_v = \\frac{R_1 \\cdot R_2}{R_1 + R_2}$",
        `$R_v = \\frac{${r1} \\cdot ${r2}}{${r1} + ${r2}} = \\frac{${r1 * r2}}{${r1 + r2}} = ${rTotal}`,
      ];
    }

    return {
      id: `circ-${Math.random()}`,
      question,
      context: `Schakelingen (${mode})`,
      answer: rTotal.toString(),
      displayAnswer: `${rTotal} \\Omega`,
      solutionSteps: steps,
    };
  },

  validate: (
    input: string,
    problem: GymProblem,
  ): { correct: boolean; feedback?: string } => {
    // Strip alle niet-cijfer karakters behalve komma/punt
    const cleanInput = input.replace(",", ".").replace(/[^\d.-]/g, "");
    const val = parseFloat(cleanInput);
    const ans = parseFloat(problem.answer);
    if (Math.abs(val - ans) < 0.1) return { correct: true, feedback: "Juist!" };
    return {
      correct: false,
      feedback: "Fout. Check je formules voor serie/parallel.",
    };
  },
};
