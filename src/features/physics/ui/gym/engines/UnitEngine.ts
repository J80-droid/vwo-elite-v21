import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

// Helper: Genereer 'mooie' getallen (geen 3.19284)
const getRandom = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const round = (num: number, decimals = 4) =>
  Number(Math.round(Number(num + "e" + decimals)) + "e-" + decimals);

// Definities van prefixes en eenheden voor generatie
const PREFIXES = {
  T: { val: 12, name: "tera" },
  G: { val: 9, name: "giga" },
  M: { val: 6, name: "mega" },
  k: { val: 3, name: "kilo" },
  "": { val: 0, name: "basis" },
  d: { val: -1, name: "deci" },
  c: { val: -2, name: "centi" },
  m: { val: -3, name: "milli" },
  µ: { val: -6, name: "micro" },
  n: { val: -9, name: "nano" },
  p: { val: -12, name: "pico" },
};

type PrefixKey = keyof typeof PREFIXES;

export const UnitEngine: GymEngine = {
  id: "units",
  name: "Eenheden",
  description: "Conversies: van micro tot giga.",
  generate: (level: Difficulty): GymProblem => {
    let question = "";
    let answerStr = "";
    let context = "";
    let steps: string[] = [];

    // LEVEL 1: Basis Conversies (cm <-> m, g <-> kg)
    // Focus: De 'standaard' stapjes van 10, 100, 1000.
    if (level === 1) {
      const types = [
        { base: "m", prefixes: ["c", "m", "k", ""] },
        { base: "g", prefixes: ["k", "m", ""] }, // gram, kilogram, milligram
        { base: "s", prefixes: ["m", ""] },
      ];

      const type = types[getRandom(0, types.length - 1)]!;
      const p1 = type.prefixes[
        getRandom(0, type.prefixes.length - 1)
      ] as PrefixKey;
      let p2 = type.prefixes[
        getRandom(0, type.prefixes.length - 1)
      ] as PrefixKey;
      while (p1 === p2)
        p2 = type.prefixes[getRandom(0, type.prefixes.length - 1)] as PrefixKey;

      const val = getRandom(1, 999) / (Math.random() > 0.5 ? 10 : 1); // soms decimalen

      const expDiff = PREFIXES[p1].val - PREFIXES[p2].val;
      const factor = Math.pow(10, expDiff);
      const ans = round(val * factor);

      question = `$$${val} \\text{ ${p1}${type.base}} = \\dots \\text{ ${p2}${type.base}}$$`;
      answerStr = ans.toString();
      context = "Basis Conversies";

      steps = [
        `\\text{Van } ${p1 || "\\text{basis}"} (10^{${PREFIXES[p1].val}}) \\text{ naar } ${p2 || "\\text{basis}"} (10^{${PREFIXES[p2].val}})`,
        `Verschil in machten van 10: $${PREFIXES[p1].val} - ${PREFIXES[p2].val} = ${expDiff}$`,
        `Factor: $10^{${expDiff}} = ${factor > 1 ? factor : factor.toExponential()}$`,
        `Berekening: $${val} \\times ${factor > 0.01 ? factor : factor.toExponential()} = ${ans}$`,
      ].map(s => s.startsWith("$") ? s : `$${s}$`);
    }

    // LEVEL 2: Exotic Prefixes (Nano, Giga, Micro)
    // Focus: Werken met wetenschappelijke notatie en grote sprongen.
    else if (level === 2) {
      const base = ["J", "W", "V", "m"][getRandom(0, 3)];
      // Kies willekeurige ver uiteen liggende prefixes (bijv Giga naar Milli)
      const keys = Object.keys(PREFIXES) as PrefixKey[];
      const p1 = keys[getRandom(0, keys.length - 1)]!;
      let p2 = keys[getRandom(0, keys.length - 1)]!;
      while (Math.abs(PREFIXES[p1].val - PREFIXES[p2].val) < 3)
        p2 = keys[getRandom(0, keys.length - 1)]!; // Minimaal factor 1000 verschil

      let val = getRandom(1, 99) / 10;
      let expDiff = PREFIXES[p1].val - PREFIXES[p2].val;

      // Wetenschappelijke notatie normaliseren: altijd 1 cijfer voor de komma (1.0 - 9.9)
      if (val < 1) {
        val *= 10;
        expDiff -= 1;
      }

      // We slaan het antwoord op als string in wetenschappelijke notatie voor validatie flexibiliteit
      // Maar de 'schone' string voor weergave:
      answerStr = `${round(val, 2)} \\cdot 10^{${expDiff}}`;

      question = `$$${val} \\text{ ${p1}${base}} = \\dots \\text{ ${p2}${base}}$$`;
      context = "Grote Sprongen (BINAS T2)";

      steps = [
        `Bepaal de exponenten uit Binas Tabel 2`,
        `\\text{${PREFIXES[p1].name}}: 10^{${PREFIXES[p1].val}} \\quad \\text{${PREFIXES[p2].name}}: 10^{${PREFIXES[p2].val}}`,
        `Stappen: $${PREFIXES[p1].val} - ${PREFIXES[p2].val} = ${expDiff}$`,
        `Antwoord: $${round(val, 2)} \\cdot 10^{${expDiff}}$`,
      ].map(s => s.startsWith("$") ? s : `$${s}$`);
    }

    // LEVEL 3: Kwadraten en Derde Machten (Area/Volume)
    // Focus: De grootste valkuil. cm^2 -> m^2 is factor 10^-4, niet 10^-2.
    else if (level === 3) {
      const isVolume = Math.random() > 0.5;
      const power = isVolume ? 3 : 2;
      // const unit = isVolume ? 'm^3' : 'm^2';

      const options = isVolume ? ["m", "c", "d"] : ["m", "c", "k", ""]; // km^3 doen we zelden
      const p1 = options[getRandom(0, options.length - 1)] as PrefixKey;
      let p2 = options[getRandom(0, options.length - 1)] as PrefixKey;
      while (p1 === p2)
        p2 = options[getRandom(0, options.length - 1)] as PrefixKey;

      const val = getRandom(1, 500);

      const linearDiff = PREFIXES[p1].val - PREFIXES[p2].val;
      const totalExp = linearDiff * power; // De cruciale stap

      question = `$$${val} \\text{ ${p1}m}^${power} = \\dots \\text{ ${p2}m}^${power}$$`;
      answerStr = `${val} \\cdot 10^{${totalExp}}`;
      context = (isVolume as boolean) ? "Volume Conversies" : "Oppervlakte Conversies";

      steps = [
        `Lineaire stap van ${p1}m naar ${p2}m is $10^{${linearDiff}}$`,
        `Omdat het tot de macht ${power} is, moet je de stap ook tot de macht ${power} doen.`,
        `Factor: $(10^{${linearDiff}})^${power} = 10^{${linearDiff * power}}$`,
        `Berekening: $${val} \\cdot 10^{${totalExp}}$`,
      ].map(s => s.startsWith("$") ? s : `$${s}$`);
    }

    // LEVEL 4: Snelheid (km/h <-> m/s) en Tijd (h <-> s)
    // Focus: Factor 3.6 en factor 60/3600.
    else if (level === 4) {
      const mode = Math.random() > 0.5 ? "speed" : "time";

      if (mode === "speed") {
        const toMS = Math.random() > 0.5; // True: km/h -> m/s
        const val = toMS ? getRandom(10, 150) : getRandom(5, 40); // Realistische snelheden

        const ans = toMS ? val / 3.6 : val * 3.6;
        question = toMS
          ? `$$${val} \\text{ km/h} = \\dots \\text{ m/s}$$`
          : `$$${val} \\text{ m/s} = \\dots \\text{ km/h}$$`;

        answerStr = round(ans).toString();
        context = "Snelheid (Factor 3.6)";
        steps = [
          toMS
            ? `Van km/h naar m/s: DELEN door 3,6`
            : `Van m/s naar km/h: VERMENIGVULDIGEN met 3,6`,
          toMS
            ? `$${val} / 3,6 = ${round(ans)}$`
            : `$${val} \\times 3,6 = ${round(ans)}$`,
        ].map(s => s.startsWith("$") ? s : `$${s}$`);
      } else {
        // Time
        const val = getRandom(1, 120); // minuten of uren
        // Simpele uur naar seconde
        question = `$$${val} \\text{ h} = \\dots \\text{ s}$$`;
        const ans = val * 3600;
        answerStr = ans.toString();
        context = "Tijd Conversies";
        steps = [
          `1 uur = 60 minuten = 3600 seconden`,
          `$${val} \\times 3600 = ${ans}$`,
        ].map(s => s.startsWith("$") ? s : `$${s}$`);
      }
    }

    // LEVEL 5: De Nachtmerrie (Combinaties & Wetenschappelijke notatie)
    // Focus: 520 nm^2 naar mm^2 in wetenschappelijke notatie.
    else {
      // Hardcoded complexe cases voor de "Elite" feel
      const cases = [
        {
          q: "$350 \\text{ nm} = \\dots \\text{ m}$",
          a: "3.5 \\cdot 10^{-7}",
          s: [
            "Nano is $10^{-9}$",
            "$350 \\cdot 10^{-9}$",
            "Wetenschappelijke notatie: $3,5 \\cdot 10^{-7}$",
          ],
        },
        {
          q: "$0,5 \\text{ GW} = \\dots \\text{ kW}$",
          a: "5 \\cdot 10^5",
          s: [
            "Giga ($10^9$) naar Kilo ($10^3$) is factor $10^6$",
            "$0,5 \\cdot 10^6 = 5 \\cdot 10^5$",
          ],
        },
        {
          q: "$1200 \\text{ cm}^3 = \\dots \\text{ m}^3$",
          a: "1.2 \\cdot 10^{-3}",
          s: [
            "Stap cm naar m is $10^{-2}$",
            "Volume is macht 3: $(10^{-2})^3 = 10^{-6}$",
            "$1200 \\cdot 10^{-6} = 1,2 \\cdot 10^{-3}$",
          ],
        },
      ];
      const pick = cases[getRandom(0, cases.length - 1)]!;
      question = pick.q;
      answerStr = pick.a;
      context = "Elite Conversies";
      steps = pick.s;
    }

    return {
      id: "unit-" + Math.random(),
      question,
      context,
      solutionSteps: steps,
      answer: answerStr, // Voor interne check
      displayAnswer: `$${answerStr}$`, // Voor UI display
    };
  },

  validate: (
    input: string,
    problem: GymProblem,
  ): { correct: boolean; feedback?: string } => {
    // Normaliseer input: vervang komma's door punten, 'x' of '*' door 'e' voor berekening
    // Leerlingen typen vaak: "3,5*10^5" of "3.5e5"
    let cleanInput = input.replace(",", ".").replace(/\s/g, "");

    // Handle wetenschappelijke notatie user input: "3*10^5" -> "3e5"
    cleanInput = cleanInput
      .toLowerCase()
      .replace(/\*10\^?/g, "e")
      .replace(/x10\^?/g, "e");

    // Parse problem answer (aanname: problem.answer is clean of wetenschappelijk)
    let cleanAnswer = problem.answer
      .replace(",", ".")
      .replace(/\\cdot/g, "")
      .replace(/[{}]/g, "")
      .replace(/\s/g, "");
    cleanAnswer = cleanAnswer.toLowerCase().replace(/\*10\^?/g, "e");

    const numInput = parseFloat(cleanInput);
    const numAns = parseFloat(cleanAnswer);

    if (isNaN(numInput))
      return { correct: false, feedback: "Geen geldig getal" };

    // Marge check (1% tolerantie voor afrondingsfouten)
    const margin = Math.abs(numAns * 0.01);
    const isCorrect = Math.abs(numInput - numAns) <= (margin || 0.0000001); // fallback voor 0

    if (isCorrect) return { correct: true };

    // Specifieke feedback voor veelgemaakte fouten
    if (Math.abs(numInput - numAns * 100) < margin)
      return { correct: false, feedback: "Factor 100 fout! (cm vs m?)" };
    if (Math.abs(numInput - numAns * 1000) < margin)
      return { correct: false, feedback: "Factor 1000 fout! (kilo/milli?)" };
    if (
      Math.abs(numInput - numAns / 3.6) < margin ||
      Math.abs(numInput - numAns * 3.6) < margin
    )
      return {
        correct: false,
        feedback: "Verkeerd gedeeld/vermenigvuldigd met 3,6",
      };

    return { correct: false, feedback: "Onjuist. Check je machten van 10." };
  },
};
