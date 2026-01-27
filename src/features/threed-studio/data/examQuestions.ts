/* eslint-disable @typescript-eslint/no-explicit-any */
// VWO Spatial Insight Exam Questions Database
// Based on real VWO entrance exam patterns

export interface ExamQuestion {
  id: string;
  year: number;
  type: "rotation" | "folding" | "cross-section" | "pattern" | "mirror";
  difficulty: "easy" | "medium" | "hard";
  question: string;
  imageUrl?: string; // Would be actual exam images
  options: string[];
  correctAnswer: number; // 0-indexed
  explanation: string;
  subject: "wiskunde" | "natuurkunde" | "scheikunde" | "algemeen";
  simulation?: {
    view: string; // Using string to avoid circular dependency with AppView enum if likely. But let's try to import it or use string literal.
    label: string;
    context?: any;
  };
}

export const EXAM_QUESTIONS: ExamQuestion[] = [
  // Rotation Questions
  {
    id: "rot-001",
    year: 2023,
    type: "rotation",
    difficulty: "easy",
    question:
      "Welke figuur ontstaat als je de getoonde kubus 90° naar rechts draait om de verticale as?",
    options: ["Figuur A", "Figuur B", "Figuur C", "Figuur D"],
    correctAnswer: 1,
    explanation:
      "Bij een rotatie van 90° naar rechts om de verticale as verschuift het voorvlak naar links.",
    subject: "algemeen",
  },
  {
    id: "rot-002",
    year: 2023,
    type: "rotation",
    difficulty: "medium",
    question:
      "Een dobbelsteen met 1=oog tegenover 6, 2 tegenover 5, 3 tegenover 4. Als 1 boven ligt en 2 naar voren wijst, welk getal is rechts?",
    options: ["3", "4", "5", "6"],
    correctAnswer: 0,
    explanation:
      "Bij een standaard dobbelsteen met 1 boven en 2 voor, wijst 3 naar rechts.",
    subject: "wiskunde",
  },

  // Folding Questions
  {
    id: "fold-001",
    year: 2022,
    type: "folding",
    difficulty: "medium",
    question:
      "Welke kubus kan gemaakt worden van het getoonde uitgevouwen patroon?",
    options: ["Kubus A", "Kubus B", "Kubus C", "Kubus D"],
    correctAnswer: 2,
    explanation:
      "Let op de positie van de symbolen ten opzichte van elkaar bij het vouwen.",
    subject: "wiskunde",
  },
  {
    id: "fold-002",
    year: 2024,
    type: "folding",
    difficulty: "hard",
    question:
      "Een vel papier wordt twee keer gevouwen en er wordt een driehoek uitgeknipt. Welk patroon ontstaat na uitvouwen?",
    options: [
      "4 driehoeken in een rij",
      "4 driehoeken in een vierkant",
      "2 driehoeken",
      "8 driehoeken",
    ],
    correctAnswer: 1,
    explanation:
      "Twee keer vouwen geeft 4 lagen. De driehoek herhaalt zich symmetrisch in een 2x2 patroon.",
    subject: "wiskunde",
  },

  // Cross-Section Questions
  {
    id: "cross-001",
    year: 2023,
    type: "cross-section",
    difficulty: "easy",
    question:
      "Welke vorm krijg je als je een kubus precies door het midden snijdt, parallel aan het bovenvlak?",
    options: ["Vierkant", "Rechthoek", "Driehoek", "Cirkel"],
    correctAnswer: 0,
    explanation:
      "Een horizontale doorsnede door een kubus geeft altijd een vierkant.",
    subject: "wiskunde",
    simulation: {
      view: "CROSS_SECTION_CHALLENGE",
      label: "Open Doorsnede Simulator",
    },
  },
  {
    id: "cross-002",
    year: 2022,
    type: "cross-section",
    difficulty: "hard",
    question:
      "Een kubus wordt gesneden door een vlak dat precies door alle 6 zijvlakken gaat. Welke vorm heeft de doorsnede?",
    options: [
      "Driehoek",
      "Vierkant",
      "Regelmatige zeshoek",
      "Onregelmatige zeshoek",
    ],
    correctAnswer: 2,
    explanation:
      "Een vlak door het midden van alle 12 ribben snijdt alle 6 vlakken en vormt een regelmatige zeshoek.",
    subject: "wiskunde",
    simulation: {
      view: "CROSS_SECTION_CHALLENGE",
      label: "Open Doorsnede Simulator",
    },
  },

  // Pattern Recognition
  {
    id: "pat-001",
    year: 2024,
    type: "pattern",
    difficulty: "medium",
    question:
      "Welke 3D-figuur past bij deze drie aanzichten: boven=cirkel, voor=vierkant, zij=vierkant?",
    options: ["Kubus", "Cilinder", "Bol", "Kegel"],
    correctAnswer: 1,
    explanation:
      "Een cilinder heeft een cirkel van boven en vierkanten/rechthoeken van voor en opzij.",
    subject: "wiskunde",
    simulation: {
      view: "PROJECTION_CHALLENGE",
      label: "Open 2D → 3D Trainer",
    },
  },

  // Mirror Questions
  {
    id: "mir-001",
    year: 2023,
    type: "mirror",
    difficulty: "medium",
    question: "Welke letter ziet er hetzelfde uit in een spiegel?",
    options: ["R", "A", "G", "P"],
    correctAnswer: 1,
    explanation:
      "De letter A is symmetrisch over de verticale as en ziet er hetzelfde uit in een spiegel.",
    subject: "algemeen",
  },
  {
    id: "mir-002",
    year: 2022,
    type: "mirror",
    difficulty: "hard",
    question:
      "Je staat voor twee spiegels die een hoek van 90° maken. Hoeveel spiegelbeelden van jezelf zie je?",
    options: ["1", "2", "3", "4"],
    correctAnswer: 2,
    explanation:
      "Bij twee spiegels onder 90°: je ziet je directe spiegelbeeld in beide spiegels (2) plus één meervoudig spiegelbeeld (totaal 3).",
    subject: "natuurkunde",
  },

  // Chemistry specific
  {
    id: "chem-001",
    year: 2024,
    type: "mirror",
    difficulty: "hard",
    question: "Welke bewering over enantiomeren is correct?",
    options: [
      "Ze zijn identiek",
      "Ze zijn spiegelbeelden die niet overlappen",
      "Ze hebben verschillende molecuulformules",
      "Ze hebben verschillende smeltpunten",
    ],
    correctAnswer: 1,
    explanation:
      "Enantiomeren zijn spiegelbeeldisomeren van chirale moleculen die niet superponeerbaar zijn.",
    subject: "scheikunde",
    simulation: {
      view: "STEREO_TRAINER",
      label: "Open Stereoïsomere Trainer",
    },
  },

  // Additional Rotation Questions
  {
    id: "rot-003",
    year: 2024,
    type: "rotation",
    difficulty: "hard",
    question:
      "Een L-vormig object wordt eerst 90° om de x-as gedraaid, dan 90° om de y-as. Welke oriëntatie heeft het nu?",
    options: ["Positie A", "Positie B", "Positie C", "Positie D"],
    correctAnswer: 2,
    explanation:
      "Bij gecombineerde rotaties is de volgorde belangrijk. X-rotatie eerst, dan Y-rotatie.",
    subject: "wiskunde",
  },
  {
    id: "rot-004",
    year: 2023,
    type: "rotation",
    difficulty: "easy",
    question:
      "Hoeveel graden moet je een vierkant draaien voordat het er hetzelfde uitziet?",
    options: ["45°", "90°", "180°", "360°"],
    correctAnswer: 1,
    explanation:
      "Een vierkant heeft 4-voudige rotatie-symmetrie: elke 90° ziet het er hetzelfde uit.",
    subject: "wiskunde",
  },

  // Additional Cross-Section Questions
  {
    id: "cross-003",
    year: 2024,
    type: "cross-section",
    difficulty: "medium",
    question:
      "Welke vorm krijg je als je een kegel snijdt met een vlak evenwijdig aan de zijkant?",
    options: ["Cirkel", "Ellips", "Parabool", "Hyperbool"],
    correctAnswer: 2,
    explanation:
      "Een vlak evenwijdig aan de zijkant van een kegel geeft een parabool (kegelsnede).",
    subject: "wiskunde",
    simulation: {
      view: "CROSS_SECTION_CHALLENGE",
      label: "Bekijk Kegelsnedes",
    },
  },
  {
    id: "cross-004",
    year: 2022,
    type: "cross-section",
    difficulty: "easy",
    question:
      "Welke vorm krijg je als je een bol precies door het midden snijdt?",
    options: ["Ellips", "Cirkel", "Ovaal", "Halve cirkel"],
    correctAnswer: 1,
    explanation:
      "Elke doorsnede door het midden van een bol is een grote cirkel.",
    subject: "wiskunde",
    simulation: {
      view: "CROSS_SECTION_CHALLENGE",
      label: "Open Bol Simulator",
    },
  },

  // Additional Pattern Questions
  {
    id: "pat-002",
    year: 2023,
    type: "pattern",
    difficulty: "hard",
    question:
      "Welke 3D-figuur past bij: boven=driehoek, voor=driehoek, zij=vierkant?",
    options: ["Piramide", "Prisma", "Tetraëder", "Antiprisme"],
    correctAnswer: 1,
    explanation:
      "Een driehoekig prisma heeft driehoekige boven- en vooraanzichten en een rechthoekig zijaanzicht.",
    subject: "wiskunde",
    simulation: {
      view: "PROJECTION_CHALLENGE",
      label: "Open 2D → 3D Trainer",
    },
  },
  {
    id: "pat-003",
    year: 2024,
    type: "pattern",
    difficulty: "easy",
    question: "Hoeveel vlakken heeft een kubus?",
    options: ["4", "6", "8", "12"],
    correctAnswer: 1,
    explanation:
      "Een kubus heeft 6 vierkante vlakken: boven, onder, voor, achter, links, rechts.",
    subject: "wiskunde",
    simulation: {
      view: "BUILD_MODE",
      label: "Bouw een Kubus",
    },
  },

  // Additional Folding Questions
  {
    id: "fold-003",
    year: 2023,
    type: "folding",
    difficulty: "easy",
    question: "Welk net vouwt NIET tot een kubus?",
    options: [
      "Kruis-vorm (6 vierkanten)",
      "T-vorm (6 vierkanten)",
      "Z-vorm (6 vierkanten)",
      "Lijnvorm (6 vierkanten in rij)",
    ],
    correctAnswer: 3,
    explanation:
      "6 vierkanten op een rij kunnen niet tot een kubus gevouwen worden - er ontbreekt deksel en bodem overlap.",
    subject: "wiskunde",
  },

  // Physics Questions
  {
    id: "phys-001",
    year: 2024,
    type: "pattern",
    difficulty: "medium",
    question:
      "Een lichtstraal valt onder 45° op een vlakke spiegel. Onder welke hoek wordt hij gereflecteerd?",
    options: ["0°", "45°", "90°", "135°"],
    correctAnswer: 1,
    explanation:
      "Wet van reflectie: invalshoek = reflectiehoek. Beide zijn 45° t.o.v. de normaal.",
    subject: "natuurkunde",
  },
  {
    id: "phys-002",
    year: 2023,
    type: "rotation",
    difficulty: "medium",
    question: "Een magneet draait 180°. Welke pool wijst nu naar het noorden?",
    options: [
      "Noordpool",
      "Zuidpool",
      "Geen verschil",
      "Hangt af van de snelheid",
    ],
    correctAnswer: 1,
    explanation:
      "Na 180° rotatie wijst de zuidpool naar waar eerst de noordpool wees.",
    subject: "natuurkunde",
  },
];

// Helper functions
export const getQuestionsByType = (
  type: ExamQuestion["type"],
): ExamQuestion[] => EXAM_QUESTIONS.filter((q) => q.type === type);

export const getQuestionsByDifficulty = (
  difficulty: ExamQuestion["difficulty"],
): ExamQuestion[] => EXAM_QUESTIONS.filter((q) => q.difficulty === difficulty);

export const getQuestionsBySubject = (
  subject: ExamQuestion["subject"],
): ExamQuestion[] => EXAM_QUESTIONS.filter((q) => q.subject === subject);

export const getRandomQuestion = (filters?: {
  type?: ExamQuestion["type"];
  difficulty?: ExamQuestion["difficulty"];
  subject?: ExamQuestion["subject"];
}): ExamQuestion => {
  let pool = [...EXAM_QUESTIONS];
  if (filters?.type) pool = pool.filter((q) => q.type === filters.type);
  if (filters?.difficulty)
    pool = pool.filter((q) => q.difficulty === filters.difficulty);
  if (filters?.subject)
    pool = pool.filter((q) => q.subject === filters.subject);
  return pool[Math.floor(Math.random() * pool.length)]!;
};
