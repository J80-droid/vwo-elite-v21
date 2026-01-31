import { createInfiniteEngine } from "../../../../math/ui/modules/gym/engines/AIGymAdapter";

const SCENARIOS = [
    { id: "soc-rawls", type: "Rawls", context: "Sluier van onwetendheid", q: "Je moet een samenleving inrichten, maar weet niet of je rijk of arm zult zijn. Waar kies je voor?", a: "gelijkheid", hint: "Maximin-strategie", alternatives: ["eerlijkheid", "gelijke verdeling"] },
    { id: "soc-nozick", type: "Nozick", context: "Libertarisme", q: "De staat pakt geld van rijken om armen te helpen. Is dit rechtvaardig volgens Nozick?", a: "nee", hint: "Belasting is dwangarbeid/diefstal", alternatives: ["onrechtvaardig", "diefstal"] },
    { id: "soc-rousseau", type: "Rousseau", context: "Sociaal Contract", q: "We leveren onze natuurlijke vrijheid in ruil voor...", a: "burgerlijke vrijheid", hint: "Algemene Wil" },
    { id: "soc-hobbes", type: "Hobbes", context: "Natuurtoestand", q: "Hoe ziet het leven eruit zonder staat volgens Hobbes?", a: "oorlog van allen tegen allen", hint: "Nasty, brutish and short", alternatives: ["oorlog", "chaos"] },
    { id: "soc-plato", type: "Plato", context: "De Ideale Staat", q: "Wie moeten volgens Plato de staat regeren?", a: "filosofen", hint: "Filosoof-koning", alternatives: ["filosoof", "de wijzen"] }
];

const STARTUP_SET = SCENARIOS.map(p => ({
    id: p.id,
    question: p.q,
    answer: p.a,
    context: `${p.type}: ${p.context}`,
    solutionSteps: [`Volgens ${p.type} is het antwoord: ${p.a}. (${p.hint})`],
    alternatives: p.alternatives
}));

export const SocialPhilosophyEngine = createInfiniteEngine(
    "social-philosophy",
    "Utopia Builder",
    "Sociale en Politieke Filosofie",
    "Theorieën over rechtvaardigheid, macht en de ideale staat",
    STARTUP_SET
);
