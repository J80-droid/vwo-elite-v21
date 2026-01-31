import { Difficulty, GymEngine, GymProblem } from "@shared/types/gym";

import { validateScientific } from "./ScientificValidator";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const round = (num: number, dec: number) => Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);

// Mini Periodiek Systeem
const ATOMS: Record<string, number> = {
    H: 1.008,
    C: 12.01,
    N: 14.01,
    O: 16.00,
    Na: 22.99,
    Mg: 24.31,
    S: 32.06,
    Cl: 35.45,
    Ca: 40.08,
};

const MOLECULES: { name: string; formula: string; elements: Record<string, number> }[] = [
    { name: "Water", formula: "H_2O", elements: { H: 2, O: 1 } },
    { name: "Methaan", formula: "CH_4", elements: { C: 1, H: 4 } },
    { name: "Ammoniak", formula: "NH_3", elements: { N: 1, H: 3 } },
    { name: "Koolstofdioxide", formula: "CO_2", elements: { C: 1, O: 2 } },
    { name: "Zwavelzuur", formula: "H_2SO_4", elements: { H: 2, S: 1, O: 4 } },
    { name: "Glucose", formula: "C_6H_{12}O_6", elements: { C: 6, H: 12, O: 6 } },
];

const getMolarMass = (elements: Record<string, number>) => {
    return Object.entries(elements).reduce((acc, [el, count]) => acc + ATOMS[el]! * count, 0);
};

export const StoichiometryEngine: GymEngine = {
    id: "mol-mastery",
    name: "Stoichiometrie Sprint",
    description: "Van gram naar mol naar molariteit. De heilige graal van het chemisch rekenen.",

    generate: (level: Difficulty): GymProblem | Promise<GymProblem> => {
        const timestamp = Date.now();
        const molecule = MOLECULES[rand(0, MOLECULES.length - 1)]!;
        const M = getMolarMass(molecule.elements);

        const genLevel = level || (rand(1, 4) as Difficulty);
        switch (genLevel) {
            case 1: {
                const mol = rand(2, 10) / 2;
                const mass = mol * M;
                const ans = round(mass, 2).toString().replace(".", ",");
                const optionsPool = new Set<string>();
                optionsPool.add(ans);
                optionsPool.add(round(mol / M, 4).toString().replace(".", ",")); // Division mistake
                optionsPool.add(round(mass * 1.1, 2).toString().replace(".", ","));
                optionsPool.add(mol.toString().replace(".", ",")); // Just the mol value

                const options = Array.from(optionsPool).sort(() => Math.random() - 0.5);

                return {
                    id: `st-1-${timestamp}`,
                    question: `Bereken de massa van **${mol} mol** ${molecule.name} ($${molecule.formula}$).`,
                    answer: ans,
                    displayAnswer: `$${ans}$`,
                    context: `Molaire massa's: H=1.008, C=12.01, N=14.01, O=16.00, S=32.06`,
                    solutionSteps: [
                        `1. Bereken de molaire massa (M) van $${molecule.formula}$: $${round(M, 2)}$ g/mol.`,
                        `2. Gebruik formule: $m = n \\times M$`,
                        `3. $m = ${mol} \\times ${round(M, 2)} = ${round(mass, 2)}$ gram.`,
                    ],
                    type: "multiple-choice",
                    options
                };
            }
            case 2: {
                const mass = rand(10, 200);
                const mol = mass / M;
                const ans = round(mol, 2).toString().replace(".", ",");
                const optionsPool = new Set<string>();
                optionsPool.add(ans);
                optionsPool.add(round(mass * M, 0).toString().replace(".", ",")); // Multiplication mistake
                optionsPool.add(round(mol * 1.5, 2).toString().replace(".", ","));
                optionsPool.add(round(1 / mol, 2).toString().replace(".", ","));

                const options = Array.from(optionsPool).sort(() => Math.random() - 0.5);

                return {
                    id: `st-2-${timestamp}`,
                    question: `Hoeveel **mol** komt overeen met **${mass} gram** ${molecule.name} ($${molecule.formula}$)?`,
                    answer: ans,
                    displayAnswer: `$${ans}\\ \\text{mol}$`,
                    context: "Rond af op 2 decimalen.",
                    solutionSteps: [
                        `1. Molaire massa $${molecule.formula}$ = $${round(M, 2)}$ g/mol.`,
                        `2. Formule: $n = m / M$`,
                        `3. $n = ${mass} / ${round(M, 2)} \\approx ${round(mol, 2)}$ mol.`,
                    ],
                    type: "multiple-choice",
                    options
                };
            }
            case 3: {
                const volumeL = rand(1, 5);
                const targetMolarity = rand(1, 20) / 10;
                const molNeeded = targetMolarity * volumeL;
                const massNeeded = molNeeded * M;
                const ans = round(massNeeded, 1).toString().replace(".", ",");
                const optionsPool = new Set<string>();
                optionsPool.add(ans);
                optionsPool.add(round(molNeeded, 1).toString().replace(".", ",")); // Just mol
                optionsPool.add(round(massNeeded / 10, 1).toString().replace(".", ",")); // Volume trick
                optionsPool.add(round(massNeeded * 2, 1).toString().replace(".", ","));

                const options = Array.from(optionsPool).sort(() => Math.random() - 0.5);

                return {
                    id: `st-3-${timestamp}`,
                    question: `Je wilt **${volumeL} liter** van een **${targetMolarity} M** oplossing ${molecule.name} maken. Hoeveel **gram** stof moet je afwegen?`,
                    answer: ans,
                    displayAnswer: `$${ans}\\ \\text{g}$`,
                    context: "Rond af op 1 decimaal.",
                    solutionSteps: [
                        `1. Bereken benodigde mol: $n = M \\times V = ${targetMolarity} \\times ${volumeL} = ${round(molNeeded, 2)}$ mol.`,
                        `2. Molaire massa $${molecule.formula}$ = $${round(M, 2)}$ g/mol.`,
                        `3. Massa: $m = n \\times M = ${round(molNeeded, 2)} \\times ${round(M, 2)} \\approx ${round(massNeeded, 1)}$ gram.`,
                    ],
                    type: "multiple-choice",
                    options
                };
            }
            case 4: {
                const vTitrant = rand(100, 250) / 10;
                const cTitrant = 0.1;
                const vSample = 10.0;
                const nTitrant = (vTitrant / 1000) * cTitrant;
                const nSample = nTitrant / 2;
                const cSample = nSample / (vSample / 1000);
                return {
                    id: `st-4-${timestamp}`,
                    question: `Bij een titratie van **${vSample} mL** zwavelzuur ($H_2SO_4$) is **${vTitrant.toString().replace('.', ',')} mL** van een **0,100 M** $NaOH$-oplossing nodig voor het omslagpunt.\n\nDe reactievergelijking is: $2 NaOH + H_2SO_4 \to Na_2SO_4 + 2 H_2O$\n\nBereken de **molariteit** van het zwavelzuur.`,
                    answer: round(cSample, 3).toString().replace(".", ","),
                    context: "Ratio 2:1 | 3 significante cijfers",
                    solutionSteps: [
                        `1. Bereken $n(NaOH) = V \times c = ${vTitrant / 1000} \times 0,100 = ${nTitrant.toExponential(2)}$ mol.`,
                        `2. Reactieverhouding $NaOH : H_2SO_4 = 2 : 1$.`,
                        `3. $n(H_2SO_4) = ${nTitrant.toExponential(2)} / 2 = ${nSample.toExponential(2)}$ mol.`,
                        `4. $c(H_2SO_4) = n / V = ${nSample.toExponential(2)} / 0,0100 = ${round(cSample, 3)}$ M.`
                    ]
                };
            }
            default: {
                const fallbackLevel = (rand(1, 3) as Difficulty);
                return StoichiometryEngine.generate(fallbackLevel);
            }
        }
    },

    validate: (input: string, problem: GymProblem) => {
        const isLevel4 = problem.id.includes("-4-");
        return validateScientific(input, problem.answer, isLevel4 ? 3 : undefined);
    },
};
