import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const GeneticsMendelEngine: GymEngine = {
    id: "genetics-mendel",
    name: "Mendel's Matrix",
    description: "Kruisingsschema's en kansberekening. Van monohybride tot dihybride systemen.",

    generate: (level: Difficulty): GymProblem => {
        const timestamp = Date.now();

        switch (level) {
            case 1: {
                // LEVEL 1: Monohybride Kruising (Eén eigenschap)
                // Scenario: Aa x Aa (Heterozygoot) of Aa x aa
                const isHeteroCross = Math.random() > 0.4; // 60% kans op Aa x Aa
                const p1 = "Aa";
                const p2 = isHeteroCross ? "Aa" : "aa";

                const question = isHeteroCross
                    ? "We kruisen twee heterozygote individuen ($Aa \\times Aa$). Hoeveel procent van de nakomelingen heeft het **recessieve fenotype** (aa)?"
                    : "We kruisen een heterozygoot met een recessief individu ($Aa \\times aa$). Hoeveel procent van de nakomelingen is **homozygoot dominant** (AA)?";

                const answer = isHeteroCross ? "25" : "0";

                return {
                    id: `gm-1-${timestamp}`,
                    question,
                    answer,
                    context: "Monohybride kruising",
                    solutionSteps: isHeteroCross
                        ? [
                            "Kruising: $Aa \\times Aa$.",
                            "Mogelijke zygoten: $AA$, $Aa$, $Aa$, $aa$.",
                            "Alleen $aa$ geeft het recessieve fenotype.",
                            "Kans is 1 op 4 = 25%.",
                        ]
                        : [
                            "Kruising: $Aa \\times aa$.",
                            "Mogelijke zygoten: $Aa$, $aa$.",
                            "Er kan geen $AA$ ontstaan omdat de tweede ouder geen 'A' heeft.",
                            "Kans is dus 0%.",
                        ],
                };
            }

            case 2: {
                // LEVEL 2: Dihybride Kruising (Onafhankelijke overerving)
                // Scenario: AaBb x AaBb (Klassieke 9:3:3:1)

                // Variatie in vraagstelling:
                // 1. Kans op volledig recessief (aabb) -> 1/16
                // 2. Kans op volledig dominant fenotype (A-B-) -> 9/16
                // 3. Kans op genotype AaBb -> 4/16 (1/4)

                const type = rand(1, 3);
                let q = "";
                let ans = "";
                let explanation: string[] = [];

                if (type === 1) {
                    q = "Bij een dihybride kruising ($AaBb \\times AaBb$) met onafhankelijke overerving: wat is de kans op een nakomeling die voor beide eigenschappen **recessief** is ($aabb$)?";
                    ans = "6.25"; // 1/16
                    explanation = [
                        "Kans op $aa$ uit $Aa \\times Aa$ is $1/4$.",
                        "Kans op $bb$ uit $Bb \\times Bb$ is $1/4$.",
                        "Productregel: $1/4 \\times 1/4 = 1/16$.",
                        "$1/16 = 0,0625 = 6,25\\%$.",
                    ];
                } else if (type === 2) {
                    q = "Bij een dihybride kruising ($AaBb \\times AaBb$): wat is de kans op een nakomeling die voor beide eigenschappen het **dominante fenotype** toont?";
                    ans = "56.25"; // 9/16
                    explanation = [
                        "Kans op dominant fenotype A (AA of Aa) is $3/4$.",
                        "Kans op dominant fenotype B (BB of Bb) is $3/4$.",
                        "Productregel: $3/4 \\times 3/4 = 9/16$.",
                        "$9/16 = 0,5625 = 56,25\\%$.",
                    ];
                } else {
                    q = "Bij een dihybride kruising ($AaBb \\times AaBb$): wat is de kans op het genotype **AaBb**?";
                    ans = "25"; // 4/16
                    explanation = [
                        "Kans op genotype $Aa$ is $1/2$ (of 2/4).",
                        "Kans op genotype $Bb$ is $1/2$ (of 2/4).",
                        "Productregel: $1/2 \\times 1/2 = 1/4$.",
                        "$1/4 = 25\\%$.",
                    ];
                }

                return {
                    id: `gm-2-${timestamp}`,
                    question: q,
                    answer: ans,
                    context: "Dihybride kruising (Vul % in of breuk)",
                    solutionSteps: explanation,
                };
            }

            case 3: {
                // LEVEL 3: X-chromosomale overerving (Geslachtsgebonden)
                // Scenario: Gezonde vader x Draagster moeder
                const q = "Een vader is gezond ($X^AY$), de moeder is draagster van kleurenblindheid ($X^AX^a$). Ze krijgen een kind. Wat is de kans dat het een **kleurenblinde zoon** is?";

                // Let op: "Kans dat het een kleurenblinde zoon is" (op totaal aantal kinderen) = 1/4.
                // "Kans dat een zoon kleurenblind is" (gegeven dat het een zoon is) = 1/2.
                // De vraagstelling hierboven impliceert P(Zoon EN Ziek).

                return {
                    id: `gm-3-${timestamp}`,
                    question: q,
                    answer: "25",
                    context: "Kans t.o.v. alle mogelijke kinderen",
                    solutionSteps: [
                        "Mogelijke kinderen:",
                        "1. $X^AX^A$ (Dochter, gezond)",
                        "2. $X^AX^a$ (Dochter, draagster)",
                        "3. $X^AY$ (Zoon, gezond)",
                        "4. $X^aY$ (Zoon, ziek)",
                        "Slechts 1 van de 4 opties is een zieke zoon.",
                        "Kans is $1/4 = 25\\%$.",
                    ],
                };
            }

            default:
                return GeneticsMendelEngine.generate(1);
        }
    },

    validate: (input: string, problem: GymProblem) => {
        // Normaliseer input: vervang komma door punt, verwijder %, trim spaties
        const clean = input.trim().replace(",", ".").replace("%", "");

        // Check 1: Is het een breuk? (bijv. "1/16")
        if (clean.includes("/")) {
            const parts = clean.split("/");
            if (parts.length === 2) {
                const teller = parseFloat(parts[0]!);
                const noemer = parseFloat(parts[1]!);
                const fractionVal = teller / noemer;
                const targetVal = parseFloat(problem.answer) / 100; // problem.answer is in procenten (bijv 6.25)

                // Marge van 0.01 voor afrondingen
                if (Math.abs(fractionVal - targetVal) < 0.001) {
                    return { correct: true };
                }
            }
        }

        // Check 2: Is het een decimaal getal? (bijv 0.0625)
        // Sommige leerlingen vullen de fractie in ipv percentage
        const numInput = parseFloat(clean);
        const numAnswer = parseFloat(problem.answer);

        // Directe match (bijv. 6.25 === 6.25)
        if (Math.abs(numInput - numAnswer) < 0.1) return { correct: true };

        // Factor 100 fout (bijv. 0.0625 invullen terwijl 6.25% wordt gevraagd)
        // We rekenen dit goed, want wiskundig is het correct.
        if (Math.abs(numInput * 100 - numAnswer) < 0.1) {
            return { correct: true, feedback: "Correct! (Volgende keer graag in procenten)" };
        }

        return {
            correct: false,
            feedback: `Helaas. Het juiste antwoord was ${problem.answer}% (of de breuk).`,
        };
    },
};
