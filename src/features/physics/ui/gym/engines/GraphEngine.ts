import { Difficulty, GymProblem } from "@shared/types/gym";

export const GraphEngine = {
  generate: (_level: Difficulty): GymProblem => {
    // Database van grafiek-relaties
    const scenarios = [
      { type: "(x,t)", slope: "snelheid ($v$)", area: "geen betekenis" },
      { type: "(v,t)", slope: "versnelling ($a$)", area: "verplaatsing ($s$)" },
      {
        type: "(a,t)",
        slope: "ruk (jerk)",
        area: "snelheidsverandering ($\\Delta v$)",
      },
      {
        type: "(F,s)",
        slope: "veerconstante (alleen bij veer)",
        area: "arbeid ($W$)",
      },
      { type: "(P,t)", slope: "vermogenstoename", area: "energie ($E$)" },
      {
        type: "(u,t) [trilling]",
        slope: "trillingssnelheid",
        area: "geen betekenis",
      },
    ];

    const sc =
      scenarios[Math.floor(Math.random() * scenarios.length)] || scenarios[0]!;
    const askSlope = Math.random() > 0.5;

    // Dit is een meerkeuze-achtige drill, maar we laten ze het woord typen of selecteren
    // Voor de gym maken we er een "begripsvraag" van.
    // Omdat tekstinvoer lastig te valideren is ("snelheid" vs "de snelheid"),
    // maken we hier een simpele mappings-check van sleutelwoorden.

    const concept = askSlope ? sc.slope : sc.area;
    // Strip LaTeX voor het "antwoord" dat de user moet weten (ongeveer)
    const cleanAnswer = concept.split("(")[0]!.trim();

    return {
      id: `graph-${Math.random()}`,
      question: `Je hebt een **${sc.type}** diagram.\n\nWat stelt de **${askSlope ? "helling (raaklijn)" : "oppervlakte onder de grafiek"}** voor?`,
      context: "Grafieken Lezen (Domein A)",
      answer: cleanAnswer,
      displayAnswer: concept,
      solutionSteps: [
        askSlope
          ? "Helling = Differentiëren (delen van assen)"
          : "Oppervlakte = Integreren (vermenigvuldigen assen)",
        askSlope
          ? `Je deelt de y-as door de x-as: ${sc.type}`
          : `Je vermenigvuldigt y-as met x-as: ${sc.type}`,
        `Fysische betekenis: ${concept}`,
      ],
    };
  },

  validate: (
    input: string,
    problem: GymProblem,
  ): { correct: boolean; feedback?: string } => {
    // Fuzzy matching op sleutelwoorden
    const user = input.toLowerCase();
    // Haal keywords uit het juiste antwoord (bijv "snelheid" uit "snelheid ($v$)")
    const keywords = (problem.displayAnswer || problem.answer)
      .toLowerCase()
      .split("(")[0]!
      .trim()
      .split(" ");

    // Speciaal geval: "geen betekenis"
    if (problem.answer.includes("geen")) {
      if (
        user.includes("niet") ||
        user.includes("geen") ||
        user.includes("niks")
      )
        return { correct: true };
      return {
        correct: false,
        feedback: "In dit geval heeft het geen directe fysische betekenis.",
      };
    }

    // Check of een van de keywords erin zit (bijv "verplaatsing" of "afstand" of "weg")
    // We wezen coulant.
    const synonyms: Record<string, string[]> = {
      snelheid: ["snelheid", "speed"],
      versnelling: ["versnelling", "acceleratie"],
      verplaatsing: ["verplaatsing", "afstand", "weg", "afgelegde"],
      arbeid: ["arbeid", "energie"],
      energie: ["energie", "arbeid"],
    };

    const coreWord = keywords[0]!; // e.g. "snelheid"
    const validWords = synonyms[coreWord] || [coreWord];

    if (validWords.some((w) => user.includes(w))) {
      return { correct: true, feedback: "Correct begrepen!" };
    }

    return {
      correct: false,
      feedback: `Niet helemaal. Denk aan: ${problem.answer}`,
    };
  },
};
