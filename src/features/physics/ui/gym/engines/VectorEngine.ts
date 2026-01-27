import { Difficulty, GymProblem } from "@shared/types/gym";

// Helper: Graden naar Radialen
const degToRad = (deg: number) => deg * (Math.PI / 180);

export const VectorEngine = {
  generate: (level: Difficulty): GymProblem => {
    // Random Force (10 tot 500 N)
    const F = Math.floor(Math.random() * 49 + 1) * 10;

    // Random Hoek (oefen vooral de standaardhoeken: 30, 45, 60, maar ook 'lelijke')
    const angles = [30, 45, 60, 37, 53]; // 37-53 is de 3-4-5 driehoek
    const alpha = angles[Math.floor(Math.random() * angles.length)]!;

    let question = "";
    let answerVal = 0;
    let context = "";
    let steps: string[] = [];

    // LEVEL 1: Standaard x/y componenten (Horizontaal = cos)
    if (level === 1) {
      const askX = Math.random() > 0.5;

      question = `Een kracht $F = ${F} \\text{ N}$ maakt een hoek $\\alpha = ${alpha}^\\circ$ met de horizontale x-as.\n\nBereken $F_${askX ? "x" : "y"}$.`;

      if (askX) {
        // F_x = F * cos(alpha)
        answerVal = F * Math.cos(degToRad(alpha));
        context = "Horizontale component (aanliggend)";
        steps = [
          "De x-as is de aanliggende zijde t.o.v. de hoek.",
          "Aanliggend betekent Cosinus (SOS CAS TOA).",
          `$F_x = F \\cdot \\cos(\\alpha)$`,
          `$F_x = ${F} \\cdot \\cos(${alpha}) \\approx ${answerVal.toFixed(1)}$`,
        ];
      } else {
        // F_y = F * sin(alpha)
        answerVal = F * Math.sin(degToRad(alpha));
        context = "Verticale component (overstaand)";
        steps = [
          "De y-as is de overstaande zijde t.o.v. de hoek.",
          "Overstaand betekent Sinus (SOS CAS TOA).",
          `$F_y = F \\cdot \\sin(\\alpha)$`,
          `$F_y = ${F} \\cdot \\sin(${alpha}) \\approx ${answerVal.toFixed(1)}$`,
        ];
      }
    }

    // LEVEL 2: Hellend Vlak (Let op: F_z,x is SINUS, F_z,y is COSINUS)
    // Dit is de klassieke valkuil.
    else {
      const m = Math.floor(Math.random() * 20 + 1); // massa
      const Fz = m * 9.81;
      const askParallel = Math.random() > 0.5; // F_z,parallel (langs helling) vs F_z,loodrecht

      question = `Een blok ($m=${m} \\text{ kg}$) ligt op een helling van $\\alpha = ${alpha}^\\circ$.\n\nBereken de component van de zwaartekracht ${askParallel ? "langs de helling ($F_{z,\\parallel}$)" : "loodrecht op de helling ($F_{z,\\perp}$)"}.`;

      if (askParallel) {
        // Langs helling = Overstaande zijde = SINUS
        answerVal = Fz * Math.sin(degToRad(alpha));
        context = "Hellend Vlak (Langs)";
        steps = [
          "Eerst $F_z$ berekenen: $m \\cdot g = " + Fz.toFixed(1) + " N$",
          "De component LANGS de helling is de 'overstaande' zijde in de krachten-driehoek.",
          "Overstaand = Sinus.",
          `$F_{z,\\parallel} = F_z \\cdot \\sin(\\alpha)$`,
          `Antwoord: ${answerVal.toFixed(1)} N`,
        ];
      } else {
        // Loodrecht = Aanliggende zijde = COSINUS
        answerVal = Fz * Math.cos(degToRad(alpha));
        context = "Hellend Vlak (Loodrecht)";
        steps = [
          "Eerst $F_z$ berekenen: $m \\cdot g = " + Fz.toFixed(1) + " N$",
          "De component LOODRECHT op de helling is de 'aanliggende' zijde.",
          "Aanliggend = Cosinus.",
          `$F_{z,\\perp} = F_z \\cdot \\cos(\\alpha)$`,
          `Antwoord: ${answerVal.toFixed(1)} N`,
        ];
      }
    }

    return {
      id: "vec-" + Math.random(),
      question,
      context,
      answer: answerVal.toFixed(1), // String voor validatie (1 decimaal)
      displayAnswer: answerVal.toFixed(2) + " N",
      solutionSteps: steps,
    };
  },

  validate: (
    input: string,
    problem: GymProblem,
  ): { correct: boolean; feedback?: string } => {
    // Normaliseer input
    const cleanInput = input.replace(",", ".").replace(/[^\d.-]/g, "");
    const userVal = parseFloat(cleanInput);
    const correctVal = parseFloat(problem.answer);

    if (isNaN(userVal))
      return { correct: false, feedback: "Voer een getal in" };

    // Ruime marge (5%) omdat afronding van sin/cos kan verschillen
    // Gebruik een bodem van 0.1 voor kleine waarden
    const margin = Math.max(Math.abs(correctVal * 0.05), 0.1);

    if (Math.abs(userVal - correctVal) <= margin) {
      return { correct: true, feedback: "Correct ontbonden!" };
    }

    // Check op veelgemaakte fout: Sin/Cos verwisseld?
    // We rekenen even terug wat de 'andere' zou zijn
    // Dit is lastig generiek te checken zonder de parameters te weten,
    // maar vaak is het antwoord dan complementair.

    return {
      correct: false,
      feedback: "Niet correct. Heb je sin/cos verwisseld?",
    };
  },
};
