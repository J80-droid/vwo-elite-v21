export interface GapProgram {
  id: string;
  title: string;
  organization: string;
  type: "travel" | "work" | "study" | "volunteer" | "program" | "academic";
  description: string;
  costEstimate: number;
  durationWeeks: number;
  locations: string[];
  link?: string;
  requirements?: string[];
  // New Fields for Phase 2
  coordinates?: [number, number]; // [Lat, Lon]
  visaDifficulty?: "easy" | "medium" | "hard"; // Green, Orange, Red
  costIndex?: "low" | "medium" | "high"; // Heatmap
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: {
    text: string;
    scores: {
      academic?: number;
      adventure?: number;
      career?: number;
      personal?: number;
    };
  }[];
}

export const GAP_QUIZ: QuizQuestion[] = [
  {
    id: 1,
    question: "Wat is je primaire doel voor dit tussenjaar?",
    options: [
      { text: "Even helemaal weg en de wereld zien", scores: { adventure: 3 } },
      {
        text: "Mijn CV bouwen en skills leren voor werk",
        scores: { career: 3 },
      },
      { text: "Mezelf ontdekken en rust vinden", scores: { personal: 3 } },
      {
        text: "Alvast proeven aan een studie of vakgebied",
        scores: { academic: 3 },
      },
    ],
  },
  {
    id: 2,
    question: "Hoe comfortabel ben je met onzekerheid?",
    options: [
      {
        text: "Ik wil alles van tevoren geregeld hebben (veiligheid)",
        scores: { academic: 1, personal: 2 },
      },
      {
        text: "Een beetje spanning mag (netwerk/werk)",
        scores: { career: 2, adventure: 1 },
      },
      {
        text: "Gooi mij maar in het diepe (backpacken)",
        scores: { adventure: 3 },
      },
    ],
  },
  {
    id: 3,
    question: "Wat is je budget situatie?",
    options: [
      { text: "Beperkt, ik moet werken", scores: { career: 2, adventure: 1 } },
      {
        text: "Mijn ouders investeren in mijn ontwikkeling",
        scores: { personal: 2, academic: 2 },
      },
      { text: "Ik heb gespaard voor een grote reis", scores: { adventure: 2 } },
    ],
  },
  {
    id: 4,
    question: "Werk je liever alleen of in een team?",
    options: [
      { text: "Samenwerken geeft energie", scores: { career: 2, personal: 1 } },
      {
        text: "Ik trek graag mijn eigen plan",
        scores: { adventure: 2, academic: 1 },
      },
    ],
  },
  {
    id: 5,
    question: "Welke omgeving trekt je aan?",
    options: [
      { text: "Een universiteit of campus", scores: { academic: 3 } },
      { text: "Een bruisende stad / startup hub", scores: { career: 3 } },
      {
        text: "De natuur, bergen of strand",
        scores: { adventure: 3, personal: 1 },
      },
      { text: "Een retraite of rustige plek", scores: { personal: 3 } },
    ],
  },
];

export interface FinancialScenario {
  id: "A" | "B" | "C";
  title: string;
  description: string;
  savings: number;
  support: number; // Monthly
  workIncome: number; // Total
  programCosts: number;
  livingCosts: number; // Monthly avg
  travelCosts: number; // Total flights/visas
}

export const FINANCIAL_SCENARIOS: FinancialScenario[] = [
  {
    id: "A",
    title: "Thuis & Werken (Saver)",
    description:
      "Focus op sparen voor de studie. Thuis wonen, fulltime werken.",
    savings: 0,
    support: 100,
    workIncome: 18000, // 10 months * 1800
    programCosts: 0,
    livingCosts: 200, // Kostgeld?
    travelCosts: 0,
  },
  {
    id: "B",
    title: "Hybride (Balanced)",
    description: "Half jaar werken, half jaar reizen (bijv. Azië).",
    savings: 2000,
    support: 100,
    workIncome: 10000, // 6 months
    programCosts: 0,
    livingCosts: 850, // Mixed: 6mo x 200 + 3mo x 1500 + 3mo x 200 (proefstuderen) -> avg sucks here. Let's precise in comp.
    travelCosts: 1300, // Ticket + Vaccins
  },
  {
    id: "C",
    title: "Ontwikkelprogramma (Investor)",
    description:
      "Investering in jezelf via een instituut (bijv. Vrije Hogeschool).",
    savings: 5000,
    support: 500, // Likely higher parental support
    workIncome: 2000, // Summer job
    programCosts: 12995,
    livingCosts: 200,
    travelCosts: 0, // Included in program
  },
];

export const GAP_PROGRAMS: GapProgram[] = [
  // --- BINNENLAND (Domestic) ---
  {
    id: "vh-liberal-arts",
    title: "Liberal Arts Tussenjaar",
    organization: "Vrije Hogeschool",
    type: "program",
    description:
      "Ontdek wie je bent in een jaar vol filosofie, kunst en reizen. locaties: Zeist.",
    costEstimate: 12995, // Midden tarief 2026/2026
    durationWeeks: 40,
    locations: ["Zeist", "International"],
    link: "https://vrijehogeschool.nl",
    requirements: ["Inkomen afhankelijk tarief (€6.995 - €15.995)"],
    coordinates: [52.09, 5.23], // Zeist
    visaDifficulty: "easy",
    costIndex: "medium",
  },
  {
    id: "breekjaar-xl",
    title: "Breekjaar XL",
    organization: "Stichting Breekjaar",
    type: "program",
    description:
      "Jaarprogramma voor de zoekende student. Breek uit je bubbel en vind je richting.",
    costEstimate: 8970,
    durationWeeks: 40, // 10 months
    locations: ["Utrecht", "Amsterdam"],
    link: "https://breekjaar.nl",
    coordinates: [52.09, 5.12], // Utrecht
    visaDifficulty: "easy",
    costIndex: "medium",
  },
  {
    id: "team-academy",
    title: "TA Quest (Ondernemen)",
    organization: "Team Academy",
    type: "program",
    description:
      "Leer ondernemen door te doen. Start je eigen projecten en verdien geld.",
    costEstimate: 9500, // Est
    durationWeeks: 40,
    locations: ["Amsterdam"],
    link: "https://teamacademy.nl",
    coordinates: [52.36, 4.9],
    visaDifficulty: "easy",
    costIndex: "medium",
  },
  {
    id: "bildung-academie",
    title: "Bildung Halfjaar",
    organization: "De Bildung Academie",
    type: "academic",
    description:
      "Academisch vormingsprogramma over maatschappelijke vraagstukken.",
    costEstimate: 1750,
    durationWeeks: 20,
    locations: ["Amsterdam"],
    link: "https://debildungacademie.nl",
    coordinates: [52.37, 4.89],
    visaDifficulty: "easy",
    costIndex: "low",
  },

  // --- INTERNATIONAAL (International) ---
  {
    id: "esc-volunteering",
    title: "European Solidarity Corps (ESC)",
    organization: "European Union",
    type: "volunteer",
    description:
      'De "Golden Opportunity": Vrijwilligerswerk volledig vergoed door de EU + zakgeld.',
    costEstimate: 0, // Costs covered!
    durationWeeks: 52, // Up to 12 months
    locations: ["Europe", "Neighbouring Countries"],
    link: "https://pje.europa.eu",
    requirements: ["18-30 jaar", "EU Burger"],
    coordinates: [48.0, 10.0], // Central EU
    visaDifficulty: "easy",
    costIndex: "low",
  },
  {
    id: "ef-language",
    title: "Taalreis Engels",
    organization: "EF Education First",
    type: "study",
    description:
      "Verbeter je Engels in Oxford, New York of Sydney. Intensieve lessen + cultuur.",
    costEstimate: 12000, // Semester/Year estimate
    durationWeeks: 24,
    locations: ["UK", "USA", "Australia"],
    requirements: ["Visum vereist buiten EU", "VK: International Fee"],
    coordinates: [51.75, -1.25], // Oxford
    visaDifficulty: "medium",
    costIndex: "high",
  },
  {
    id: "work-holiday-aus",
    title: "Working Holiday Australië",
    organization: "Self-Organized",
    type: "work",
    description:
      "Werken en reizen Down Under. Let op: 88-dagen regel voor 2e jaar.",
    costEstimate: 3000, // Start capital required ($5000 AUD)
    durationWeeks: 52,
    locations: ["Australia"],
    requirements: ["Visum Subclass 417", "Spaargeld > AUD 5000"],
    coordinates: [-25.27, 133.77], // Outback
    visaDifficulty: "medium",
    costIndex: "high",
  },
  {
    id: "projects-abroad-med",
    title: "Medisch Vrijwilligerswerk",
    organization: "Projects Abroad",
    type: "volunteer",
    description:
      "Loop mee in een ziekenhuis in Ghana of Tanzania. Voorbereiding Geneeskunde.",
    costEstimate: 2500,
    durationWeeks: 4,
    locations: ["Ghana", "Tanzania"],
    coordinates: [7.94, -1.02], // Ghana
    visaDifficulty: "medium",
    costIndex: "medium",
  },
  {
    id: "interrail",
    title: "Interrail Europa",
    organization: "Interrail",
    type: "travel",
    description: "Ontdek Europa per trein. Ultieme vrijheid en flexibiliteit.",
    costEstimate: 1000,
    durationWeeks: 4,
    locations: ["Europe"],
    coordinates: [48.85, 2.35], // Paris
    visaDifficulty: "easy",
    costIndex: "medium",
  },

  // --- ACADEMIC BRIDGE ---
  {
    id: "foundation-twente",
    title: "Twente Pathway College",
    organization: "Universiteit Twente",
    type: "academic",
    description:
      "Foundation year voor Engineering/Social Sciences. Check status 2026 ivm wervingsstop!",
    costEstimate: 14000,
    durationWeeks: 40,
    locations: ["Enschede"],
    coordinates: [52.22, 6.89],
    visaDifficulty: "easy",
    costIndex: "medium",
  },
  {
    id: "proefstuderen-general",
    title: "Proefstuderen & Meeloopdag",
    organization: "Universiteiten NL",
    type: "academic",
    description:
      "Intensieve kennismaking modules in mrt/apr. Cruciaal voor definitieve keuze.",
    costEstimate: 0, // Usually free or cheap
    durationWeeks: 1,
    locations: ["Leiden", "Utrecht", "Amsterdam", "Delft"],
    coordinates: [52.16, 4.49], // Leiden
    visaDifficulty: "easy",
    costIndex: "low",
  },
];

export const MONTHS = [
  "Sept",
  "Okt",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mrt",
  "Apr",
  "Mei",
  "Juni",
  "Juli",
  "Aug",
];
