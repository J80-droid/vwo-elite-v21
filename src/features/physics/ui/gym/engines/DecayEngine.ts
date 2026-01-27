import { Difficulty, GymProblem } from "@shared/types/gym";

// Kleine database van isotopen voor realistische oefeningen
const ISOTOPES = [
  { el: "U", a: 238, z: 92 },
  { el: "Pu", a: 239, z: 94 },
  { el: "Ra", a: 226, z: 88 },
  { el: "Rn", a: 222, z: 86 },
  { el: "Po", a: 210, z: 84 },
  { el: "C", a: 14, z: 6 },
  { el: "K", a: 40, z: 19 },
  { el: "I", a: 131, z: 53 },
  { el: "Cs", a: 137, z: 55 },
  { el: "Sr", a: 90, z: 38 },
];

export const DecayEngine = {
  generate: (level: Difficulty): GymProblem => {
    // Kies willekeurige moederkern
    const parent =
      ISOTOPES[Math.floor(Math.random() * ISOTOPES.length)] || ISOTOPES[0]!;

    // Kies vervaltype: Alpha (a), Beta-min (b-), Beta-plus (b+), Gamma (g)
    const types = ["alpha", "beta-"];
    if (level > 1) types.push("beta+", "gamma");

    const type = types[Math.floor(Math.random() * types.length)];

    let d_a = 0,
      d_z = 0,
      part = "";
    let steps: string[] = [];

    if (type === "alpha") {
      // Alpha: He-kern (4, 2)
      d_a = parent.a - 4;
      d_z = parent.z - 2;
      part = "\\alpha";
      steps = [
        "Alfistraling is een Heliumkern ($^4_2\\text{He}$).",
        `Massagetal A: ${parent.a} - 4 = ${d_a}`,
        `Atoomnummer Z: ${parent.z} - 2 = ${d_z}`,
      ];
    } else if (type === "beta-") {
      // Beta-: Elektron (0, -1). Dus Z gaat +1 om lading te behouden!
      d_a = parent.a;
      d_z = parent.z + 1;
      part = "\\beta^-";
      steps = [
        "Bèta-min is een elektron ($^{\\hphantom{-}0}_{-1}\\text{e}$).",
        "Massagetal A verandert niet.",
        "Lading blijft behouden: Z moet +1 worden (want $Z_{nieuw} + (-1) = Z_{oud}$).",
        `Atoomnummer Z: ${parent.z} + 1 = ${d_z}`,
      ];
    } else if (type === "gamma") {
      // Gamma: Foton (0,0). Niets verandert.
      d_a = parent.a;
      d_z = parent.z;
      part = "\\gamma";
      steps = ["Gammastraling is energie (foton). A en Z veranderen niet."];
    } else if (type === "beta+") {
      // Beta+: Positron (0, +1). Z gaat -1
      d_a = parent.a;
      d_z = parent.z - 1;
      part = "\\beta^+";
      steps = [
        "Bèta-plus is een positron ($^{\\hphantom{+}0}_{+1}\\text{e}$).",
        "Massagetal A verandert niet.",
        "Lading blijft behouden: Z moet -1 worden (want $Z_{nieuw} + 1 = Z_{oud}$).",
        `Atoomnummer Z: ${parent.z} - 1 = ${d_z}`,
      ];
    }

    // Vraagformaten
    const qType = Math.random();
    let question = "";
    let answer = "";

    if (qType < 0.5) {
      // Vraag naar het nieuwe atoomnummer Z
      question = `Een $^{${parent.a}}_{${parent.z}}\\text{${parent.el}}$ kern vervalt via $${part}$-verval.\n\nWat is het atoomnummer ($Z$) van de dochterkern?`;
      answer = d_z.toString();
    } else {
      // Vraag naar het nieuwe massagetal A
      question = `Een $^{${parent.a}}_{${parent.z}}\\text{${parent.el}}$ kern vervalt via $${part}$-verval.\n\nWat is het massagetal ($A$) van de dochterkern?`;
      answer = d_a.toString();
    }

    return {
      id: `decay-${Math.random()}`,
      question,
      context: `Vervalreacties (${type})`,
      answer,
      displayAnswer: answer,
      solutionSteps: steps,
    };
  },

  validate: (
    input: string,
    problem: GymProblem,
  ): { correct: boolean; feedback?: string } => {
    const val = parseInt(input.trim());
    const ans = parseInt(problem.answer);

    if (isNaN(val))
      return { correct: false, feedback: "Voer een geheel getal in." };
    if (val === ans) return { correct: true, feedback: "Correct behouden!" };

    // Check op verwisseling Beta- en Beta+
    if (
      problem.context?.includes("beta-") ||
      problem.context?.includes("beta+")
    ) {
      const isZQuestion = problem.question.includes("atoomnummer");
      if (isZQuestion) {
        // Als ze de andere kant op zijn gegaan (bijv +1 ipv -1)
        const parentZMatch = problem.question.match(/_{(\d+)}/);
        const parentZ = parentZMatch ? parseInt(parentZMatch[1]!) : 0;
        const alternativeZ = (problem.context || "").includes("beta-")
          ? parentZ - 1
          : parentZ + 1;
        if (val === alternativeZ) {
          return {
            correct: false,
            feedback:
              "Heb je Beta- en Beta+ verwisseld? Check de lading van de straling.",
          };
        }
      }
    }

    return {
      correct: false,
      feedback: "Niet correct. Check massa- en ladingsbehoud.",
    };
  },
};
