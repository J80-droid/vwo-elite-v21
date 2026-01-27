import { Difficulty, GymProblem } from "@shared/types/gym";

// Helper: Tel significante cijfers van een string (user input)
export const countSigFigs = (str: string): number => {
  // 1. Simpele heuristiek voor leerlingen (werkt voor 99% van schoolgevallen):
  // Verwijder punt. Verwijder leading zeros. Tel wat overblijft.
  let clean = str.toLowerCase().split("e")[0]!.split("*")[0]!.trim();
  if (clean.includes(".")) {
    clean = clean.replace(".", "");
    // Verwijder leading zeros
    while (clean.startsWith("0") && clean.length > 1) clean = clean.slice(1);
    if (clean.startsWith("0")) return 0; // Pure 0
    return clean.length;
  } else {
    // Integer (ambigue, maar we tellen alles tenzij trailing zero context)
    // Voor de gym nemen we aan: 2500 -> 2 sig figs? Nee, in NL onderwijs vaak ambigue.
    // We zullen in de GENERATOR ambigue getallen vermijden.
    // Bij VALIDATIE tellen we gewoon de cijfers.
    clean = clean.replace(/^[0]+/, ""); // strip leading
    return clean.length;
  }
};

export const toSigFig = (num: number, sigFigs: number): string => {
  return num.toPrecision(sigFigs).replace("+", ""); // verwijdert + in exponent
};

export const SigFigEngine = {
  generate: (level: Difficulty): GymProblem => {
    let question = "";
    let answerStr = "";
    let context = "";
    let steps: string[] = [];

    // Helper Randoms
    const rand = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    // LEVEL 1: Tellen & Wetenschappelijke Notatie
    // Vraag: "Hoeveel significante cijfers heeft ...?" of "Schrijf in wet. notatie"
    if (level === 1) {
      const mode = Math.random() > 0.5 ? "count" : "notation";

      if (mode === "count") {
        // Genereer getallen met valkuilen (leading/trailing zeros)
        const cases = [
          "0.00450",
          "2.050",
          "10.0",
          "0.0001",
          "3.40 \\cdot 10^5",
        ];
        const raw = cases[rand(0, cases.length - 1)]!;
        // Bereken antwoord
        let ans = 0;
        if (raw === "0.00450") ans = 3;
        else if (raw === "2.050") ans = 4;
        else if (raw === "10.0") ans = 3;
        else if (raw === "0.0001") ans = 1;
        else if (raw.includes("3.40")) ans = 3;

        question = `Hoeveel significante cijfers heeft:\n\n$$${raw}$$`;
        answerStr = ans.toString();
        context = "Tellen (Regels)";
        steps = [
          "Regel 1: Nullen vooraan tellen nooit mee.",
          "Regel 2: Nullen achteraan tellen WEL mee als er een komma staat.",
          "Regel 3: Machten van 10 tellen niet mee voor significantie.",
        ];
      } else {
        // Notation: Schrijf 0.0045 in 2 sig figs (wetenschappelijk)
        const num = rand(1, 99) / 10000; // e.g. 0.0045
        question = `Schrijf $$${num}$$ in wetenschappelijke notatie met 2 significante cijfers.`;
        // Antwoord e.g. "4.5*10^-3"
        const [coeff, exp] = num.toExponential(1).split("e");
        // parse int to avoid 'NaN' in prompt
        const expInt = parseInt(exp!);
        answerStr = `${coeff} \\cdot 10^{${expInt}}`;
        context = "Wetenschappelijke Notatie";
        steps = [
          `Verschuif de komma tot er 1 cijfer voor staat: ${coeff}`,
          `Je hebt ${Math.abs(expInt)} plekken verschoven naar rechts, dus macht is ${expInt}.`,
        ];
      }
    }

    // LEVEL 2: Vermenigvuldigen & Delen (Kleinste aantal sig figs)
    else if (level === 2) {
      const sf1 = rand(2, 4);
      const sf2 = rand(2, 3); // Zorg voor verschil
      const minSf = Math.min(sf1, sf2);

      // Genereer getallen met exact die sig figs
      // Truc: genereer integer en deel door macht van 10
      const n1 =
        rand(Math.pow(10, sf1 - 1), Math.pow(10, sf1) - 1) /
        Math.pow(10, rand(0, 2));
      const n2 =
        rand(Math.pow(10, sf2 - 1), Math.pow(10, sf2) - 1) /
        Math.pow(10, rand(0, 2));

      const isMult = Math.random() > 0.5;
      const res = isMult ? n1 * n2 : n1 / n2;

      question = isMult
        ? `Bereken: $$${n1} \\times ${n2}$$`
        : `Bereken: $$${n1} / ${n2}$$`;

      // Format met toPrecision (handelt afronding en sig figs correct af)
      // Fix: toPrecision might return exponent notation which we should handle
      // For now, accept whatever JS returns, as long as validate accepts it.
      answerStr = Number(res).toPrecision(minSf);
      // If answerStr contains 'e', convert 'e+...' to proper display if needed in 'displayAnswer'
      // but for 'answer' (ground truth for validator) we keep it machine friendly or standard string.
      // Actually, validate expects specific formats. Let's rely on standard toPrecision behavior.

      context = "Vermenigvuldigen/Delen";
      steps = [
        `${n1} heeft ${sf1} sig. cijfers.`,
        `${n2} heeft ${sf2} sig. cijfers.`,
        `De regel is: antwoord krijgt het *kleinste* aantal (${minSf}).`,
        `Ruw antwoord: ${res}`,
        `Afronden op ${minSf} cijfers: ${answerStr}`,
      ];
    }

    // LEVEL 3: Optellen & Aftrekken (Kleinste aantal decimalen)
    else {
      const dec1 = rand(1, 3);
      const dec2 = rand(0, 2);
      const minDec = Math.min(dec1, dec2);

      const n1 = rand(100, 999) / Math.pow(10, dec1); // e.g. 4.52
      const n2 = rand(100, 999) / Math.pow(10, dec2); // e.g. 2.1

      const isAdd = Math.random() > 0.5;
      const res = isAdd ? n1 + n2 : n1 - n2;

      question = isAdd
        ? `Bereken: $$${n1} + ${n2}$$`
        : `Bereken: $$${n1} - ${n2}$$`;

      answerStr = res.toFixed(minDec);
      context = "Optellen/Aftrekken (Decimalenregel)";
      steps = [
        `${n1} heeft ${dec1} decimalen.`,
        `${n2} heeft ${dec2} decimalen.`,
        `De regel is: antwoord krijgt het *kleinste* aantal decimalen (${minDec}).`,
        `Ruw antwoord: ${res}`,
        `Afronden op ${minDec} decimalen: ${answerStr}`,
      ];
    }

    return {
      id: "sigfig-" + Math.random(),
      question: `${question}\n\n*(Let op significantie!)*`,
      context,
      answer: answerStr,
      displayAnswer: answerStr,
      solutionSteps: steps.map((s) =>
        s.includes("\\") || s.includes("^")
          ? s.startsWith("$")
            ? s
            : `$${s}$`
          : s,
      ),
    };
  },

  validate: (
    input: string,
    problem: GymProblem,
  ): { correct: boolean; feedback?: string } => {
    // Normaliseer user input
    // Vervang komma door punt, x10^ door e
    const cleanInput = input
      .replace(",", ".")
      .toLowerCase()
      .replace(/\s/g, "")
      .replace(/\*10\^?/g, "e")
      .replace(/x10\^?/g, "e"); // support x10^5

    // Parse de waarden
    const userVal = parseFloat(cleanInput);

    // Parse het verwachte antwoord (dit is de string met correcte sig figs)
    const expectedStr = problem.answer
      .replace(",", ".")
      .toLowerCase()
      .replace(/\\cdot/g, "") // remove LaTeX formatting
      .replace(/[{}]/g, "")
      .replace(/\s/g, "")
      .replace(/\*10\^?/g, "e");

    const expectedVal = parseFloat(expectedStr);

    // 1. Check op WAARDE (met kleine marge)
    const margin = Math.abs(expectedVal * 0.001) || 0.0000001; // 0.1% marge
    if (Math.abs(userVal - expectedVal) > margin) {
      return { correct: false, feedback: "De getalswaarde klopt niet." };
    }

    // 2. Check op SIGNIFICANTIE (String matching)
    // Als de waarde klopt, moeten we kijken of de formattering klopt.
    // We vergelijken het aantal significante cijfers van de input met het antwoord.

    // Uitzondering: Level 1 (Tellen) -> Input is gewoon een integer (e.g. "3")
    if (problem.context?.includes("Tellen")) {
      // Bij tel-opdrachten is de waarde (userVal) gelijk aan het aantal sig figs
      // Dus value check hierboven is al voldoende.
      return { correct: true, feedback: "Correct!" };
    }

    // Voor rekenopdrachten:
    // Input "5.0" vs Expected "5.00" -> Fout
    // Input "1.2e2" vs Expected "120" (ambigue) -> Wees strikt of gebruik wetenschappelijke notatie

    // Genormaliseerde user string voor vergelijking (zonder +)
    const userNorm = cleanInput.replace("+", "");
    const expectedNorm = expectedStr.replace("+", "");

    // Als strings exact matchen (na normalisatie): Goed.
    if (userNorm === expectedNorm)
      return { correct: true, feedback: "Correct!" };

    // Als wetenschappelijke notatie anders is (e.g. 1.5e2 vs 1.50e2)
    // Check sig fig count.
    // HACK: We gebruiken de lengte van de string *zonder* exponent en punt en leading zeros.
    // Simpelere check: Als de waarden kloppen maar strings niet, is het waarschijnlijk significantie.
    return {
      correct: false,
      feedback:
        "Waarde is goed, maar significantie niet. Te veel of te weinig cijfers?",
    };
  },
};
