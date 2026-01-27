export interface PhysicsTerm {
  term: string;
  definition: string;
  category:
    | "mechanics"
    | "waves"
    | "electricity"
    | "nuclear"
    | "quantum"
    | "astro";
  cloze: string; // "De [term] is de eenheid van..."
}

export const PHYSICS_DEFINITIONS: PhysicsTerm[] = [
  {
    term: "Resonantie",
    definition:
      "Het verschijnsel waarbij een trillend voorwerp een ander voorwerp doet meetrillen.",
    category: "waves",
    cloze:
      "Bij [...] gaat een voorwerp heftig meetrillen met een externe trilling.",
  },
  {
    term: "Interferentie",
    definition:
      "Het samenstellen van twee of meer golven die tegelijkertijd op dezelfde plaats zijn.",
    category: "waves",
    cloze:
      "[...] is het verschijnsel waarbij golven elkaar versterken of uitdoven.",
  },
  {
    term: "Halveringstijd",
    definition: "De tijd waarin de helft van de radioactieve kernen vervalt.",
    category: "nuclear",
    cloze: "De [...] is de tijdsduur waarin de activiteit tot 50% afneemt.",
  },
  {
    term: "Foton",
    definition:
      "Een pakketje energie waaruit elektromagnetische straling bestaat.",
    category: "quantum",
    cloze: "Een [...] is een energiepakketje van licht.",
  },
  {
    term: "Isotopen",
    definition:
      "Atomen van hetzelfde element met een verschillend aantal neutronen.",
    category: "nuclear",
    cloze:
      "Atomen met hetzelfde atoomnummer maar verschillende massagetallen noemen we [...].",
  },
  {
    term: "Hoofdreeks",
    definition:
      "De band in het Hertzsprung-Russell diagram waar sterren waterstof fuseren.",
    category: "astro",
    cloze:
      "Sterren die stabiel waterstof fuseren bevinden zich op de [...] in het HR-diagram.",
  },
];
