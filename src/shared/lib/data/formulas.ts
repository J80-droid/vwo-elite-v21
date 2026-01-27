// Comprehensive Binas Database for VWO (Physics, Chemistry, Math)
// Contains core formulas with solver logic and metadata

export type DifficultyLevel = "Basis" | "Gemiddeld" | "Expert";

export interface FormulaUnit {
  symbol: string;
  name: string;
  unit: string;
  input: boolean;
}

export interface FormulaEntry {
  id: string;
  name: string;
  formula: string;
  latex: string;
  description: string;
  context: string;
  difficulty: DifficultyLevel;
  related: string[];
  units: FormulaUnit[];
  commonMistakes: string;
  category?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  calculate?: (vals: any) => number;
  symbolic?: string; // Nerdamer parsable format (e.g. "F=m*a")
  binasTable?: string; // Reference to Binas table (e.g. "35-A1")
  vis?: {
    type: "plot" | "diagram" | "table" | "vector";
    fn: string; // Function string for plotter (e.g. "a * x^2 + b * x + c")
  };
}

export const FORMULAS: FormulaEntry[] = [
  // --- OPTICA (Licht & Lenzen) ---
  {
    id: "opt_lens",
    name: "Lenzenformule",
    formula: "1/f = 1/v + 1/b",
    latex: "\\frac{1}{f} = \\frac{1}{v} + \\frac{1}{b}",
    description:
      "Relatie tussen brandpuntsafstand, voorwerpsafstand en beeldafstand.",
    context: "Natuurkunde - Optica",
    difficulty: "Basis",
    symbolic: "1/f = 1/v + 1/b",
    binasTable: "35-B2",
    vis: {
      type: "plot",
      fn: "1 / (1/f - 1/x)",
    },
    related: ["Lenzen", "Oog", "Camera"],
    units: [
      { symbol: "f", name: "Brandpuntsafstand", unit: "m", input: false },
      { symbol: "v", name: "Voorwerpsafstand", unit: "m", input: true },
      { symbol: "b", name: "Beeldafstand", unit: "m", input: true },
    ],
    commonMistakes:
      "Voorwerpsafstand is positief. Beeldafstand negatief bij virtueel beeld.",
    calculate: (vals) => 1 / (1 / vals["v"] + 1 / vals["b"]),
  },
  {
    id: "opt_vergroting",
    name: "Vergroting",
    formula: "N = |b/v|",
    latex: "N = \\left| \\frac{b}{v} \\right|",
    description: "De verhouding grootte beeld t.o.v. grootte voorwerp.",
    context: "Natuurkunde - Optica",
    difficulty: "Basis",
    related: ["Lenzen", "Microscoop"],
    units: [
      { symbol: "N", name: "Vergroting", unit: "-", input: false },
      { symbol: "b", name: "Beeldafstand", unit: "m", input: true },
      { symbol: "v", name: "Voorwerpsafstand", unit: "m", input: true },
    ],
    commonMistakes: "N heeft geen eenheid.",
    calculate: (vals) => Math.abs(vals["b"] / vals["v"]),
  },

  // --- GELUID & TRILLINGEN (Verdieping) ---
  {
    id: "sound_intensity",
    name: "Geluidsniveau (dB)",
    formula: "L = 10 * log(I / I0)",
    latex: "L = 10 \\cdot \\log_{10}\\left(\\frac{I}{I_0}\\right)",
    description: "Geluidssterkte in decibel ten opzichte van de gehoordrempel.",
    context: "Natuurkunde - Geluid",
    difficulty: "Gemiddeld",
    symbolic: "L = 10 * log(I / I0)",
    binasTable: "35-B2",
    vis: {
      type: "plot",
      fn: "10 * log10(x / I_0)",
    },
    related: ["Geluid", "Logaritmen", "Oren"],
    units: [
      { symbol: "L", name: "Geluidsniveau", unit: "dB", input: false },
      { symbol: "I", name: "Intensiteit", unit: "W/m²", input: true },
      {
        symbol: "I_0",
        name: "Gehoordrempel",
        unit: "W/m² (1e-12)",
        input: true,
      },
    ],
    commonMistakes: "Verdubbeling van intensiteit is +3 dB.",
    calculate: (vals) => 10 * Math.log10(vals["I"] / vals["I_0"]),
  },
  {
    id: "sound_kwadraat",
    name: "Kwadratenwet (Intensiteit)",
    formula: "I = P / (4 * pi * r^2)",
    latex: "I = \\frac{P_{\\text{bron}}}{4 \\pi r^2}",
    description: "Afname van intensiteit met de afstand bij een puntbron.",
    context: "Natuurkunde - Geluid/Straling",
    difficulty: "Gemiddeld",
    related: ["Afstand", "Energie", "Straling"],
    units: [
      { symbol: "I", name: "Intensiteit", unit: "W/m²", input: false },
      { symbol: "P", name: "Vermogen Bron", unit: "W", input: true },
      { symbol: "r", name: "Afstand", unit: "m", input: true },
    ],
    commonMistakes:
      "r is afstand tot de bron. Geldt voor bolvormige uitstraling.",
    calculate: (vals) => vals["P"] / (4 * Math.PI * Math.pow(vals["r"], 2)),
    symbolic: "I = P / (4 * pi * r^2)",
    binasTable: "35-B2",
    vis: {
      type: "plot",
      fn: "P / (4 * pi * x^2)",
    },
  },

  // --- KERNFYSICA & RADIOACTIVITEIT ---
  {
    id: "nuc_halvering",
    name: "Halveringsformule (Aantal)",
    formula: "N(t) = N0 * (1/2)^(t/t_half)",
    latex: "N(t) = N_0 \\cdot \\left(\\frac{1}{2}\\right)^{t/t_{1/2}}",
    description: "Verval van radioactieve kernen in de tijd.",
    context: "Natuurkunde - Kernfysica",
    difficulty: "Gemiddeld",
    related: ["Verval", "Isotopen"],
    units: [
      { symbol: "N", name: "Aantal over", unit: "-", input: false }, // Calc result
      { symbol: "N_0", name: "Begin aantal", unit: "-", input: true },
      { symbol: "t", name: "Tijd", unit: "s", input: true },
      { symbol: "t_h", name: "Halveringstijd", unit: "s", input: true },
    ],
    commonMistakes: "t en t_half moeten in dezelfde eenheid (s, min, jaar).",
    calculate: (vals) => vals["N_0"] * Math.pow(0.5, vals["t"] / vals["t_h"]),
    symbolic: "N = N_0 * (1/2)^(t/t_h)",
    binasTable: "35-E2",
    vis: {
      type: "plot",
      fn: "N_0 * (0.5)^(x / t_h)",
    },
  },
  {
    id: "nuc_activiteit",
    name: "Activiteit",
    formula: "A = ln(2)/t_half * N",
    latex: "A = \\frac{\\ln(2)}{t_{1/2}} \\cdot N",
    description: "Aantal vervalsreacties per seconde (Becquerel).",
    context: "Natuurkunde - Kernfysica",
    difficulty: "Expert",
    related: ["Becquerel", "Veiligheid"],
    units: [
      { symbol: "A", name: "Activiteit", unit: "Bq", input: false },
      { symbol: "t_h", name: "Halveringstijd", unit: "s", input: true },
      { symbol: "N", name: "Aantal kernen", unit: "-", input: true },
    ],
    commonMistakes: "Hier MOET t_half in seconden!",
    calculate: (vals) => (Math.log(2) / vals["t_h"]) * vals["N"],
    symbolic: "A = ln(2)/t_h * N",
    binasTable: "35-E2",
  },
  {
    id: "nuc_dosis",
    name: "Equivalente Dosis",
    formula: "H = wR * D",
    latex: "H = w_R \\cdot D",
    description: "Maat voor de biologische schade van straling.",
    context: "Natuurkunde - Medische Beeldvorming",
    difficulty: "Gemiddeld",
    related: ["Straling", "Gezondheid", "Sievert"],
    units: [
      { symbol: "H", name: "Dosis", unit: "Sv (Sievert)", input: false },
      { symbol: "w_R", name: "Weegfactor", unit: "-", input: true },
      { symbol: "D", name: "Absorptiedosis", unit: "Gy (Gray)", input: true },
    ],
    commonMistakes:
      "w_R hangt af van het soort straling (Alfa=20, Beta/Gamma=1).",
    calculate: (vals) => vals["w_R"] * vals["D"],
    symbolic: "H = w_R * D",
    binasTable: "35-E3",
  },

  // --- RELATIVITEIT (Einstein) ---
  {
    id: "rel_gamma",
    name: "Gammafactor (Lorentz)",
    formula: "gamma = 1 / sqrt(1 - v^2/c^2)",
    latex: "\\gamma = \\frac{1}{\\sqrt{1 - \\frac{v^2}{c^2}}}",
    description: "Factor waarmee tijd en lengte veranderen bij hoge snelheid.",
    context: "Natuurkunde - Relativiteit",
    difficulty: "Expert",
    related: ["Einstein", "Lichtsnelheid"],
    units: [
      { symbol: "γ", name: "Gammafactor", unit: "-", input: false },
      { symbol: "v", name: "Snelheid", unit: "m/s", input: true },
      { symbol: "c", name: "Lichtsnelheid", unit: "m/s (3e8)", input: true },
    ],
    commonMistakes: "Kan niet kleiner zijn dan 1. Als v > c werkt het niet.",
    calculate: (vals) => 1 / Math.sqrt(1 - Math.pow(vals["v"] / vals["c"], 2)),
    symbolic: "gamma = 1 / sqrt(1 - v^2/c^2)",
    binasTable: "35-A5",
    vis: {
      type: "plot",
      fn: "1 / sqrt(1 - (x/c)^2)",
    },
  },
  {
    id: "rel_tijd",
    name: "Tijddilatatie",
    formula: "dt_b = gamma * dt_e",
    latex: "\\Delta t_b = \\gamma \\cdot \\Delta t_e",
    description: "Tijd gaat langzamer voor een bewegende waarnemer.",
    context: "Natuurkunde - Relativiteit",
    difficulty: "Expert",
    related: ["Tijd", "Ruimte"],
    units: [
      { symbol: "Δt_b", name: "Bewegende tijd", unit: "s", input: false },
      { symbol: "γ", name: "Gammafactor", unit: "-", input: true },
      { symbol: "Δt_e", name: "Eigen tijd", unit: "s", input: true },
    ],
    commonMistakes: "Eigen tijd is in het stelsel in rust t.o.v. de klok.",
    calculate: (vals) => vals["γ"] * vals["Δt_e"],
    symbolic: "dt_b = gamma * dt_e",
    binasTable: "35-A5",
  },

  // --- ELEKTRICITEIT (VERVOLG/MAGNETISME) ---
  {
    id: "magn_flux",
    name: "Magnetische Flux",
    formula: "Phi = B * A_loodrecht",
    latex: "\\Phi = B \\cdot A_{\\perp}",
    description: "Aantal veldlijnen door een oppervlak.",
    context: "Natuurkunde - Magnetisme",
    difficulty: "Expert",
    related: ["Inductie", "Veldsterkte"],
    units: [
      { symbol: "Φ", name: "Flux", unit: "Wb (Weber)", input: false },
      { symbol: "B", name: "Veldsterkte", unit: "T", input: true },
      { symbol: "A", name: "Oppervlak", unit: "m²", input: true },
    ],
    commonMistakes: "A moet loodrecht op B staan. Anders * cos(alpha).",
    calculate: (vals) => vals["B"] * vals["A"],
    symbolic: "Phi = B * A",
    binasTable: "35-D3",
  },
  {
    id: "elec_inductie",
    name: "Inductiespanning (Wet van Faraday)",
    formula: "U_ind = -N * dPhi/dt",
    latex: "U_{\\text{ind}} = -N \\cdot \\frac{d\\Phi}{dt}",
    description: "Spanning opgewekt door veranderende magnetische flux.",
    context: "Natuurkunde - Magnetisme",
    difficulty: "Expert",
    related: ["Flux", "Dynamo"],
    units: [
      { symbol: "U_i", name: "Inductiespanning", unit: "V", input: false },
      { symbol: "N", name: "Windingen", unit: "-", input: true },
      { symbol: "dΦ", name: "Verandering Flux", unit: "Wb", input: true },
      { symbol: "dt", name: "Tijfsduur", unit: "s", input: true },
    ],
    commonMistakes: "Min-teken geeft richting aan (Wet van Lenz).",
    calculate: (vals) => -vals["N"] * (vals["dΦ"] / vals["dt"]),
    symbolic: "U_i = -N * dPhi / dt",
    binasTable: "35-D3",
  },

  // --- VLOEISTOFFEN & GASSEN (Roel Hendriks) ---
  {
    id: "fluid_archimedes",
    name: "Wet van Archimedes",
    formula: "F_opw = rho_v * V * g",
    latex: "F_{\\text{opw}} = \\rho_v \\cdot V_{\\text{onder}} \\cdot g",
    description:
      "De opwaartse kracht is gelijk aan het gewicht van de verplaatste vloeistof.",
    context: "Natuurkunde - Vloeistoffen",
    difficulty: "Gemiddeld",
    related: ["Drijven", "Dichtheid", "Kracht"],
    units: [
      { symbol: "F_opw", name: "Opwaartse Kracht", unit: "N", input: false },
      {
        symbol: "ρ_v",
        name: "Dichtheid Vloeistof",
        unit: "kg/m³",
        input: true,
      },
      { symbol: "V", name: "Volume ondergedompeld", unit: "m³", input: true },
      { symbol: "g", name: "Valversnelling", unit: "m/s²", input: true },
    ],
    commonMistakes:
      "Gebruik de dichtheid van de vloeistof, niet van het voorwerp!",
    calculate: (vals) => vals["ρ_v"] * vals["V"] * vals["g"],
    symbolic: "F_opw = rho_v * V * g",
    binasTable: "35-A2",
  },
  {
    id: "fluid_bernoulli",
    name: "Wet van Bernoulli (Vereenvoudigd)",
    formula: "P + 0.5 * rho * v^2 = constant",
    latex: "p + \\frac{1}{2} \\rho v^2 = \\text{constant}",
    description:
      "Verband tussen druk en snelheid in een stromende vloeistof (energiebehoud).",
    context: "Natuurkunde - Stroming",
    difficulty: "Expert",
    related: ["Druk", "Snelheid", "Energie"],
    units: [
      { symbol: "p", name: "Druk", unit: "Pa", input: true },
      { symbol: "ρ", name: "Dichtheid", unit: "kg/m³", input: true },
      { symbol: "v", name: "Snelheid", unit: "m/s", input: true },
    ],
    commonMistakes:
      "Alleen geldig voor niet-viskeuze, onsamendrukbare vloeistoffen.",
    // Bernoulli: Calculating total pressure (H) = p + 0.5 * rho * v^2 + rho * g * h
    calculate: (vals) => {
      const staticP = vals["p"] || 0;
      const dynamicP = 0.5 * (vals["ρ"] || 0) * Math.pow(vals["v"] || 0, 2);
      return staticP + dynamicP;
    },
    symbolic: "constant = p + 0.5 * rho * v^2",
    binasTable: "35-A2",
  },
  {
    id: "fluid_hydrostatic",
    name: "Hydrostatische Druk",
    formula: "p = rho * g * h",
    latex: "p = \\rho \\cdot g \\cdot h",
    description: "Druk uitgeoefend door een vloeistofkolom.",
    context: "Natuurkunde - Vloeistoffen",
    difficulty: "Basis",
    related: ["Druk", "Diepte"],
    units: [
      { symbol: "p", name: "Druk", unit: "Pa", input: false },
      { symbol: "ρ", name: "Dichtheid", unit: "kg/m³", input: true },
      { symbol: "g", name: "Valversnelling", unit: "m/s²", input: true },
      { symbol: "h", name: "Diepte/Hoogte", unit: "m", input: true },
    ],
    commonMistakes: "h is de diepte onder het oppervlak.",
    calculate: (vals) => vals["ρ"] * vals["g"] * vals["h"],
    symbolic: "p = rho * g * h",
    binasTable: "35-A2",
    vis: {
      type: "plot",
      fn: "rho * g * x",
    },
  },

  // --- ELEKTRONICA & WISSELSTROOM ---
  {
    id: "elec_ac_effective",
    name: "Effectieve Spanning (Wisselstroom)",
    formula: "U_eff = U_max / sqrt(2)",
    latex: "U_{\\text{eff}} = \\frac{1}{2}\\sqrt{2} \\cdot U_{\\text{max}}",
    description: "De effectieve waarde van een sinusoïdale wisselspanning.",
    context: "Natuurkunde - Wisselstromen",
    difficulty: "Gemiddeld",
    related: ["Wisselspanning", "Lichtnet"],
    units: [
      { symbol: "U_eff", name: "Effectieve Spanning", unit: "V", input: false },
      { symbol: "U_max", name: "Maximale Spanning", unit: "V", input: true },
    ],
    commonMistakes:
      "Lichtnet 230V is de effectieve waarde, de top is hoger (ca 325V).",
    calculate: (vals) => 0.5 * Math.sqrt(2) * vals["U_max"],
    symbolic: "U_eff = U_max / sqrt(2)",
    binasTable: "35-D1",
  },
  {
    id: "elec_capacitor",
    name: "Capaciteit Condensator",
    formula: "C = Q / U",
    latex: "C = \\frac{Q}{U}",
    description: "De opslagcapaciteit van lading per volt spanning.",
    context: "Natuurkunde - Elektronica",
    difficulty: "Gemiddeld",
    related: ["Lading", "Spanning", "Condensator"],
    units: [
      { symbol: "C", name: "Capaciteit", unit: "F (Farad)", input: false },
      { symbol: "Q", name: "Lading", unit: "C", input: true },
      { symbol: "U", name: "Spanning", unit: "V", input: true },
    ],
    commonMistakes: "Farad is een zeer grote eenheid, vaak µF of nF.",
    calculate: (vals) => vals["Q"] / vals["U"],
    symbolic: "C = Q / U",
    binasTable: "35-D1",
  },
  {
    id: "elec_energy_cap",
    name: "Energie Condensator",
    formula: "E = 0.5 * C * U^2",
    latex: "E = \\frac{1}{2} C \\cdot U^2",
    description: "Energie opgeslagen in een condensator.",
    context: "Natuurkunde - Elektronica",
    difficulty: "Gemiddeld",
    related: ["Energie", "Condensator"],
    units: [
      { symbol: "E", name: "Energie", unit: "J", input: false },
      { symbol: "C", name: "Capaciteit", unit: "F", input: true },
      { symbol: "U", name: "Spanning", unit: "V", input: true },
    ],
    commonMistakes: "Vergeet het kwadraat niet.",
    calculate: (vals) => 0.5 * vals["C"] * Math.pow(vals["U"], 2),
    symbolic: "E = 0.5 * C * U^2",
    binasTable: "35-D1",
  },

  // --- MECHANICA: BEWEGING ---
  {
    id: "mech_eenparig_s",
    name: "Eenparige Beweging (Afstand)",
    formula: "s = v * t",
    latex: "s = v \\cdot t",
    description: "Afstand bij constante snelheid.",
    context: "Natuurkunde - Mechanica (Beweging)",
    difficulty: "Basis",
    related: ["Snelheid", "Tijd", "Plaats"],
    units: [
      { symbol: "s", name: "Afstand", unit: "m", input: false },
      { symbol: "v", name: "Snelheid", unit: "m/s", input: true },
      { symbol: "t", name: "Tijd", unit: "s", input: true },
    ],
    commonMistakes: "v moet in m/s, niet km/h (delen door 3.6).",
    calculate: (vals) => vals["v"] * vals["t"],
    symbolic: "s = v * t",
    binasTable: "35-A1",
    vis: {
      type: "plot",
      fn: "v * x",
    },
  },
  {
    id: "mech_versneld_s",
    name: "Eenparig Versneld (Afstand)",
    formula: "s = 0.5 * a * t^2",
    latex: "s = \\frac{1}{2} a \\cdot t^2",
    description: "Afstand afgelegd vanuit stilstand bij constante versnelling.",
    context: "Natuurkunde - Mechanica (Beweging)",
    difficulty: "Gemiddeld",
    related: ["Versnelling", "Remweg", "Vrije val"],
    units: [
      { symbol: "s", name: "Afstand", unit: "m", input: false },
      { symbol: "a", name: "Versnelling", unit: "m/s²", input: true },
      { symbol: "t", name: "Tijd", unit: "s", input: true },
    ],
    commonMistakes: "Alleen geldig als beginsnelheid 0 is.",
    calculate: (vals) => 0.5 * vals["a"] * Math.pow(vals["t"], 2),
    symbolic: "s = 0.5 * a * t^2",
    binasTable: "35-A1",
    vis: {
      type: "plot",
      fn: "0.5 * a * x^2",
    },
  },
  {
    id: "mech_versneld_v",
    name: "Snelheid bij Versnelling",
    formula: "v = a * t",
    latex: "v = a \\cdot t",
    description:
      "Snelheid op tijdstip t bij constante versnelling vanuit stilstand.",
    context: "Natuurkunde - Mechanica (Beweging)",
    difficulty: "Basis",
    related: ["Versnelling", "Snelheid"],
    units: [
      { symbol: "v", name: "Snelheid", unit: "m/s", input: false },
      { symbol: "a", name: "Versnelling", unit: "m/s²", input: true },
      { symbol: "t", name: "Tijd", unit: "s", input: true },
    ],
    commonMistakes: "Alleen voor v_begin = 0. Anders v = v_begin + a*t.",
    calculate: (vals) => vals["a"] * vals["t"],
    symbolic: "v = a * t",
    binasTable: "35-A1",
    vis: {
      type: "plot",
      fn: "a * x",
    },
  },

  // --- MECHANICA: KRACHT ---
  {
    id: "phys_newton_2",
    name: "Tweede Wet van Newton",
    formula: "F_res = m * a",
    latex: "F_{\\text{res}} = m \\cdot a",
    description:
      "De resulterende kracht is evenredig met de massa en de versnelling.",
    context: "Natuurkunde - Mechanica (Kracht)",
    difficulty: "Basis",
    related: ["Newton", "Traagheid", "Versnelling"],
    units: [
      { symbol: "F", name: "Kracht", unit: "N", input: false },
      { symbol: "m", name: "Massa", unit: "kg", input: true },
      { symbol: "a", name: "Versnelling", unit: "m/s²", input: true },
    ],
    commonMistakes:
      "Vergeet niet alle krachten vectorieel op te tellen voor F_res.",
    calculate: (vals) => vals["m"] * vals["a"],
    symbolic: "F = m * a",
    binasTable: "35-A1",
    vis: {
      type: "plot",
      fn: "m * x",
    },
  },
  {
    id: "mech_zwaartekracht",
    name: "Zwaartekracht",
    formula: "Fz = m * g",
    latex: "F_z = m \\cdot g",
    description: "De aantrekkingskracht van de aarde op een voorwerp.",
    context: "Natuurkunde - Mechanica (Kracht)",
    difficulty: "Basis",
    related: ["Gewicht", "Valversnelling"],
    units: [
      { symbol: "F_z", name: "Zwaartekracht", unit: "N", input: false },
      { symbol: "m", name: "Massa", unit: "kg", input: true },
      { symbol: "g", name: "Valversnelling", unit: "m/s²", input: true },
    ],
    commonMistakes: "g is op aarde 9.81 m/s², op de maan 1.62 m/s².",
    calculate: (vals) => vals["m"] * vals["g"],
    symbolic: "Fz = m * g",
    binasTable: "35-A1",
    vis: {
      type: "plot",
      fn: "m * x",
    },
  },
  {
    id: "mech_gravitatie",
    name: "Algemene Gravitatiewet",
    formula: "Fg = G * (m1*m2)/r^2",
    latex: "F_g = G \\cdot \\frac{m \\cdot M}{r^2}",
    description: "Aantrekkingskracht tussen twee massa's.",
    context: "Natuurkunde - Mechanica (Heelal)",
    difficulty: "Gemiddeld",
    symbolic: "F_g = G * (m * M) / r^2",
    binasTable: "35-A2",
    vis: {
      type: "plot",
      fn: "(G * m * M) / x^2",
    },
    related: ["Newton", "Planeten", "Banen"],
    units: [
      { symbol: "F_g", name: "Gravitatiekracht", unit: "N", input: false },
      {
        symbol: "G",
        name: "Gravitatieconstante",
        unit: "Nm²/kg²",
        input: true,
      },
      { symbol: "m", name: "Massa object", unit: "kg", input: true },
      { symbol: "M", name: "Massa hemellichaam", unit: "kg", input: true },
      { symbol: "r", name: "Afstand", unit: "m", input: true },
    ],
    commonMistakes:
      "r is afstand tussen de zwaartepunten (dus straal planeet meerekenen!). G = 6.674e-11.",
    calculate: (vals) =>
      (vals["G"] * (vals["m"] * vals["M"])) / Math.pow(vals["r"], 2),
  },
  {
    id: "mech_arbeid",
    name: "Arbeid",
    formula: "W = F * s",
    latex: "W = F \\cdot s",
    description: "Energie overgedragen door een kracht over een afstand.",
    context: "Natuurkunde - Mechanica (Arbeid)",
    difficulty: "Gemiddeld",
    related: ["Energie", "Kracht", "Verplaatsing"],
    units: [
      { symbol: "W", name: "Arbeid", unit: "J (Nm)", input: false },
      { symbol: "F", name: "Kracht", unit: "N", input: true },
      { symbol: "s", name: "Afstand", unit: "m", input: true },
    ],
    commonMistakes:
      "Kracht en afstand moeten in dezelfde richting werken (of cos(alpha) gebruiken).",
    calculate: (vals) => vals["F"] * vals["s"],
    symbolic: "W = F * s",
    binasTable: "35-A4",
  },

  // --- ENERGIE ---
  {
    id: "phys_kinetic_energy",
    name: "Kinetische Energie",
    formula: "Ek = 0.5 * m * v^2",
    latex: "E_k = \\frac{1}{2} m \\cdot v^2",
    description: "De bewegingsenergie van een voorwerp.",
    context: "Natuurkunde - Mechanica (Energie)",
    difficulty: "Basis",
    symbolic: "Ek = 0.5 * m * v^2",
    binasTable: "35-A4",
    related: ["Snelheid", "Arbeid"],
    units: [
      { symbol: "E_k", name: "Kinetische Energie", unit: "J", input: false },
      { symbol: "m", name: "Massa", unit: "kg", input: true },
      { symbol: "v", name: "Snelheid", unit: "m/s", input: true },
    ],
    commonMistakes: "Vergeet het kwadraat bij de snelheid niet.",
    calculate: (vals) => 0.5 * vals["m"] * Math.pow(vals["v"], 2),
    vis: {
      type: "plot",
      fn: "0.5 * m * x^2",
    },
  },
  {
    id: "phys_grav_energy",
    name: "Zwaarte-energie",
    formula: "Ez = m * g * h",
    latex: "E_z = m \\cdot g \\cdot h",
    description: "De potentiële energie t.g.v. de zwaartekracht.",
    context: "Natuurkunde - Energie",
    difficulty: "Basis",
    related: ["Hoogte", "Potentiële energie"],
    units: [
      { symbol: "E_z", name: "Zwaarte-energie", unit: "J", input: false },
      { symbol: "m", name: "Massa", unit: "kg", input: true },
      { symbol: "g", name: "Valversnelling", unit: "m/s²", input: true },
      { symbol: "h", name: "Hoogte", unit: "m", input: true },
    ],
    commonMistakes: "Hoogte moet in meters, g is op aarde ca. 9.81 m/s².",
    calculate: (vals) => vals["m"] * vals["g"] * vals["h"],
    symbolic: "E_z = m * g * h",
    binasTable: "35-A4",
  },
  {
    id: "mech_rendement",
    name: "Rendement",
    formula: "eta = E_nuttig / E_in",
    latex: "\\eta = \\frac{E_{\\text{nuttig}}}{E_{\\text{in}}} \\cdot 100\\%",
    description: "Percentage energie dat nuttig wordt gebruikt.",
    context: "Natuurkunde - Energie",
    difficulty: "Basis",
    related: ["Energieverbruik", "Duurzaamheid"],
    units: [
      { symbol: "η", name: "Rendement", unit: "%", input: false },
      { symbol: "E_n", name: "Nuttige Energie", unit: "J", input: true },
      { symbol: "E_i", name: "Ingevoerde Energie", unit: "J", input: true },
    ],
    commonMistakes: "Kan nooit groter zijn dan 100%. P_nuttig/P_in werkt ook.",
    calculate: (vals) => (vals["E_n"] / vals["E_i"]) * 100,
    symbolic: "eta = (E_n / E_i) * 100",
    binasTable: "35-A4",
  },

  // --- ELEKTRICITEIT ---
  {
    id: "phys_ohm",
    name: "Wet van Ohm",
    formula: "U = I * R",
    latex: "U = I \\cdot R",
    description: "De relatie tussen spanning, stroomsterkte en weerstand.",
    context: "Natuurkunde - Elektriciteit",
    difficulty: "Basis",
    symbolic: "U = I * R",
    binasTable: "35-D1",
    related: ["Weerstand", "Schakelingen"],
    units: [
      { symbol: "U", name: "Spanning", unit: "V", input: false },
      { symbol: "I", name: "Stroomsterkte", unit: "A", input: true },
      { symbol: "R", name: "Weerstand", unit: "Ω", input: true },
    ],
    commonMistakes: "Geldt alleen voor Ohmse weerstanden (constante R).",
    calculate: (vals) => vals["I"] * vals["R"],
    vis: {
      type: "plot",
      fn: "R * x",
    },
  },
  {
    id: "elec_geleidbaarheid",
    name: "Geleidbaarheid",
    formula: "G = 1/R",
    latex: "G = \\frac{1}{R}",
    description: "Het gemak waarmee een component stroom doorlaat.",
    context: "Natuurkunde - Elektriciteit",
    difficulty: "Gemiddeld",
    related: ["Weerstand", "Siemens"],
    units: [
      {
        symbol: "G",
        name: "Geleidbaarheid",
        unit: "S (Siemens)",
        input: false,
      },
      { symbol: "R", name: "Weerstand", unit: "Ω", input: true },
    ],
    commonMistakes: "Unit is Siemens (S), niet te verwarren met seconde (s).",
    calculate: (vals) => 1 / vals["R"],
    symbolic: "G = 1 / R",
    binasTable: "35-D1",
  },
  {
    id: "phys_power_elec",
    name: "Elektrisch Vermogen",
    formula: "P = U * I",
    latex: "P = U \\cdot I",
    description: "Het vermogen geleverd of verbruikt door een component.",
    context: "Natuurkunde - Elektriciteit",
    difficulty: "Basis",
    related: ["Energie", "Elektriciteit"],
    units: [
      { symbol: "P", name: "Vermogen", unit: "W", input: false },
      { symbol: "U", name: "Spanning", unit: "V", input: true },
      { symbol: "I", name: "Stroomsterkte", unit: "A", input: true },
    ],
    commonMistakes: "Verwar P (Watt) niet met E (Joule). E = P * t.",
    calculate: (vals) => vals["U"] * vals["I"],
    symbolic: "P = U * I",
    binasTable: "35-D1",
  },
  {
    id: "elec_weerstand_draad",
    name: "Soortelijke Weerstand",
    formula: "R = rho * L / A",
    latex: "R = \\rho \\cdot \\frac{L}{A}",
    description:
      "Weerstand van een draad afhankelijk van materiaal en afmetingen.",
    context: "Natuurkunde - Elektriciteit",
    difficulty: "Expert",
    related: ["Materialen", "Geleiding"],
    units: [
      { symbol: "R", name: "Weerstand", unit: "Ω", input: false },
      { symbol: "ρ", name: "Soortelijke weerstand", unit: "Ωm", input: true },
      { symbol: "L", name: "Lengte draad", unit: "m", input: true },
      { symbol: "A", name: "Doorsnede", unit: "m²", input: true },
    ],
    commonMistakes:
      "Let op de eenheid van ρ (Binas/ScienceData). A vaak in mm² gegeven => omrekenen naar m² (x 10^-6)!",
    calculate: (vals) => (vals["ρ"] * vals["L"]) / vals["A"],
    symbolic: "R = rho * L / A",
    binasTable: "35-D1",
  },
  {
    id: "elec_transfo",
    name: "Transformator",
    formula: "Up/Us = Np/Ns",
    latex: "\\frac{U_p}{U_s} = \\frac{N_p}{N_s}",
    description:
      "Verhouding spanningen en windingen bij een ideale transformator.",
    context: "Natuurkunde - Elektriciteit",
    difficulty: "Gemiddeld",
    related: ["Wisselspanning", "Magnetisme"],
    units: [
      { symbol: "U_s", name: "Secundaire Spanning", unit: "V", input: false },
      { symbol: "U_p", name: "Primaire Spanning", unit: "V", input: true },
      { symbol: "N_p", name: "Windingen Primair", unit: "-", input: true },
      { symbol: "N_s", name: "Windingen Secundair", unit: "-", input: true },
    ],
    commonMistakes: "Alleen voor wisselspanning. P_in = P_uit (ideaal).",
    calculate: (vals) => (vals["U_p"] * vals["N_s"]) / vals["N_p"],
    symbolic: "U_p / U_s = N_p / N_s",
    binasTable: "35-D3",
  },
  {
    id: "elec_lorentzkracht",
    name: "Lorentzkracht (Draad)",
    formula: "Fl = B * I * L",
    latex: "F_L = B \\cdot I \\cdot L",
    description:
      "Kracht op een stroomvoerende draad in een magnetisch veld (loodrecht).",
    context: "Natuurkunde - Magnetisme",
    difficulty: "Expert",
    related: ["Magnetische velden", "Elektromotor"],
    units: [
      { symbol: "F_L", name: "Lorentzkracht", unit: "N", input: false },
      { symbol: "B", name: "Magnetische Inductie", unit: "T", input: true },
      { symbol: "I", name: "Stroomsterkte", unit: "A", input: true },
      { symbol: "L", name: "Lengte in veld", unit: "m", input: true },
    ],
    commonMistakes:
      "B, I en L moeten loodrecht staan. Gebruik linkerhandregel.",
    calculate: (vals) => vals["B"] * vals["I"] * vals["L"],
    symbolic: "F_L = B * I * L",
    binasTable: "35-D2",
  },

  // --- STRALING & QUANTUM ---
  {
    id: "phys_photon_energy",
    name: "Fotonenergie",
    formula: "E = h * f",
    latex: "E = h \\cdot f",
    description: "Energie van een lichtkwantum (foton).",
    context: "Natuurkunde - Quantum",
    difficulty: "Gemiddeld",
    related: ["Licht", "Plank", "Energie"],
    units: [
      { symbol: "E", name: "Energie", unit: "J", input: false },
      {
        symbol: "h",
        name: "Constante van Planck",
        unit: "Js (6.626e-34)",
        input: true,
      },
      { symbol: "f", name: "Frequentie", unit: "Hz", input: true },
    ],
    commonMistakes:
      "h is een zeer klein getal. E vaak in eV gevraagd (1 eV = 1.602e-19 J).",
    calculate: (vals) => vals["h"] * vals["f"],
    symbolic: "E = h * f",
    binasTable: "35-E1",
  },

  {
    id: "quant_emc2",
    name: "Massa-Energie Relatie",
    formula: "E = m * c^2",
    latex: "E = m \\cdot c^2",
    description: "Equivalentie van massa en energie (Einstein).",
    context: "Natuurkunde - Relativiteit",
    difficulty: "Expert",
    related: ["Einstein", "Kernfysica"],
    units: [
      { symbol: "E", name: "Energie", unit: "J", input: false },
      { symbol: "m", name: "Massa", unit: "kg", input: true },
      {
        symbol: "c",
        name: "Lichtsnelheid",
        unit: "m/s (2.998e8)",
        input: true,
      },
    ],
    commonMistakes: "m is het 'massa-defect' bij kernreacties.",
    calculate: (vals) => vals["m"] * Math.pow(vals["c"], 2),
    symbolic: "E = m * c^2",
    binasTable: "35-E4",
  },

  // --- STOFEIGENSCHAPPEN (GAS/WARMTE) ---
  {
    id: "phys_density",
    name: "Dichtheid",
    formula: "rho = m / V",
    latex: "\\rho = \\frac{m}{V}",
    description: "De massa per volume-eenheid van een stof.",
    context: "Natuurkunde - Stof",
    difficulty: "Basis",
    related: ["Massa", "Volume", "Materiaal"],
    units: [
      { symbol: "ρ", name: "Dichtheid", unit: "kg/m³", input: false },
      { symbol: "m", name: "Massa", unit: "kg", input: true },
      { symbol: "V", name: "Volume", unit: "m³", input: true },
    ],
    commonMistakes: "Let op eenheden: vaak g/cm³ gegeven, SI is kg/m³.",
    calculate: (vals) => vals["m"] / vals["V"],
    symbolic: "rho = m / V",
    binasTable: "35-H",
  },
  {
    id: "therm_gaswet",
    name: "Algemene Gaswet",
    formula: "pV = nRT",
    latex: "p \\cdot V = n \\cdot R \\cdot T",
    description: "Toestandsvergelijking voor een ideaal gas.",
    context: "Natuurkunde - Warmte",
    difficulty: "Expert",
    related: ["Gassen", "Druk", "Temperatuur"],
    units: [
      { symbol: "p", name: "Druk", unit: "Pa", input: false },
      { symbol: "V", name: "Volume", unit: "m³", input: true },
      { symbol: "n", name: "Mol", unit: "mol", input: true },
      { symbol: "R", name: "Gasconstante", unit: "J/molK", input: true },
      { symbol: "T", name: "Temperatuur", unit: "K", input: true },
    ],
    commonMistakes: "Alles in SI eenheden! T in Kelvin, p in Pascal.",
    calculate: (vals) => (vals["n"] * vals["R"] * vals["T"]) / vals["V"],
    symbolic: "p * V = n * R * T",
    binasTable: "35-C",
  },

  // --- TRILLINGEN ---
  {
    id: "phys_spring_period",
    name: "Trillingstijd Massa-Veer",
    formula: "T = 2pi * sqrt(m/C)",
    latex: "T = 2\\pi \\sqrt{\\frac{m}{C}}",
    description:
      "De periode van een harmonische trilling van een massa aan een veer.",
    context: "Natuurkunde - Trillingen",
    difficulty: "Gemiddeld",
    related: ["Harmonisch", "Veer", "Periode"],
    units: [
      { symbol: "T", name: "Trillingstijd", unit: "s", input: false },
      { symbol: "m", name: "Massa", unit: "kg", input: true },
      { symbol: "C", name: "Veerconstante", unit: "N/m", input: true },
    ],
    commonMistakes: "Wortel over de hele breuk. C in N/m.",
    calculate: (vals) => 2 * Math.PI * Math.sqrt(vals["m"] / vals["C"]),
    symbolic: "T = 2 * pi * sqrt(m / C)",
    binasTable: "35-B1",
  },
  {
    id: "phys_wave_speed",
    name: "Golfsnelheid",
    formula: "v = f * lambda",
    latex: "v = f \\cdot \\lambda",
    description: "Snelheid van een golf.",
    context: "Natuurkunde - Golven",
    difficulty: "Basis",
    related: ["Golflengte", "Frequentie"],
    units: [
      { symbol: "v", name: "Snelheid", unit: "m/s", input: false },
      { symbol: "f", name: "Frequentie", unit: "Hz", input: true },
      { symbol: "λ", name: "Golflengte", unit: "m", input: true },
    ],
    commonMistakes: "v hangt af van het medium, f van de bron.",
    calculate: (vals) => vals["f"] * vals["λ"],
  },

  // --- CHEMIE ---
  {
    id: "chem_molar_mass",
    name: "Molmassa",
    formula: "m = n * M",
    latex: "m = n \\cdot M",
    description: "Massa uitgerekend met mol en molmassa.",
    context: "Scheikunde",
    difficulty: "Basis",
    related: ["Mol", "Massa"],
    symbolic: "m = n * M",
    units: [
      { symbol: "m", name: "Massa", unit: "g", input: false },
      { symbol: "n", name: "Mol", unit: "mol", input: true },
      { symbol: "M", name: "Molmassa", unit: "g/mol", input: true },
    ],
    commonMistakes: "Chemie gebruikt gram, natuurkunde kilogram.",
    calculate: (vals) => vals["n"] * vals["M"],
  },
  {
    id: "chem_concentration",
    name: "Molariteit",
    formula: "c = n / V",
    latex: "c = \\frac{n}{V}",
    description: "Concentratie in mol per liter.",
    context: "Scheikunde",
    difficulty: "Gemiddeld",
    related: ["Oplossingen", "Concentratie"],
    symbolic: "c = n / V",
    units: [
      { symbol: "c", name: "Concentratie", unit: "M", input: false },
      { symbol: "n", name: "Mol", unit: "mol", input: true },
      { symbol: "V", name: "Volume", unit: "L", input: true },
    ],
    commonMistakes: "Volume in Liters.",
    calculate: (vals) => vals["n"] / vals["V"],
  },

  // --- WISKUNDE ---
  {
    id: "math_pythagoras",
    name: "Stelling van Pythagoras",
    formula: "c = sqrt(x^2 + y^2)",
    latex: "c = \\sqrt{x^2 + y^2}",
    description: "Schuine zijde berekenen.",
    context: "Wiskunde",
    difficulty: "Basis",
    related: ["Driehoeken", "Meetkunde"],
    symbolic: "x^2 + y^2 = c^2",
    units: [
      { symbol: "c", name: "Schuine zijde", unit: "-", input: false },
      { symbol: "x", name: "Zijde A", unit: "-", input: true },
      { symbol: "y", name: "Zijde B", unit: "-", input: true },
    ],
    commonMistakes: "Rechthoekige driehoek vereist.",
    calculate: (vals) =>
      Math.sqrt(Math.pow(vals["x"], 2) + Math.pow(vals["y"], 2)),
    vis: {
      type: "plot",
      fn: "sqrt(x^2 + y^2)",
    },
  },
  {
    id: "math_abc",
    name: "ABC-Formule",
    formula: "abc",
    latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
    description: "Oplossen van kwadratische vergelijkingen.",
    context: "Wiskunde",
    difficulty: "Gemiddeld",
    related: ["Algebra", "Vergelijkingen"],
    symbolic: "a * x^2 + b * x + c = 0",
    units: [
      { symbol: "x", name: "x (Oplossing)", unit: "-", input: false },
      { symbol: "a", name: "a", unit: "-", input: true },
      { symbol: "b", name: "b", unit: "-", input: true },
      { symbol: "c", name: "c", unit: "-", input: true },
    ],
    commonMistakes:
      "Zet de vergelijking altijd eerst in de vorm ax² + bx + c = 0.",
    calculate: (vals) => {
      const D = Math.pow(vals["b"], 2) - 4 * vals["a"] * vals["c"];
      if (D < 0) return NaN;
      return (-vals["b"] + Math.sqrt(D)) / (2 * vals["a"]);
    },
    vis: {
      type: "plot",
      fn: "a * x^2 + b * x + c",
    },
  },
  // --- MECHANICA: CIRKELBEWEGING & KRACHT (Extra) ---
  {
    id: "mech_fmpz",
    name: "Middelpuntzoekende Kracht",
    formula: "F_mpz = m * v^2 / r",
    latex: "F_{\\text{mpz}} = \\frac{m \\cdot v^2}{r}",
    description:
      "De kracht die nodig is om een voorwerp in een cirkelbaan te houden.",
    context: "Natuurkunde - Cirkelbeweging",
    difficulty: "Gemiddeld",
    related: ["Cirkelbeweging", "Newton", "Planeten"],
    symbolic: "F = m * v^2 / r",
    units: [
      { symbol: "F", name: "Kracht", unit: "N", input: false },
      { symbol: "m", name: "Massa", unit: "kg", input: true },
      { symbol: "v", name: "Baansnelheid", unit: "m/s", input: true },
      { symbol: "r", name: "Straal", unit: "m", input: true },
    ],
    commonMistakes:
      "Verwar F_mpz niet met een extra kracht; het is de resultante.",
    calculate: (vals) => (vals["m"] * Math.pow(vals["v"], 2)) / vals["r"],
  },
  {
    id: "mech_hooke",
    name: "Wet van Hooke (Veerkracht)",
    formula: "Fv = C * u",
    latex: "F_v = C \\cdot u",
    description: "De kracht die een veer uitoefent bij uitrekking u.",
    context: "Natuurkunde - Kracht",
    difficulty: "Basis",
    related: ["Veer", "Kracht"],
    symbolic: "F_v = C * u",
    units: [
      { symbol: "F_v", name: "Veerkracht", unit: "N", input: false },
      { symbol: "C", name: "Veerconstante", unit: "N/m", input: true },
      { symbol: "u", name: "Uitrekking", unit: "m", input: true },
    ],
    commonMistakes: "u moet in meters, niet cm.",
    calculate: (vals) => vals["C"] * vals["u"],
  },
  {
    id: "mech_moment",
    name: "Moment (Hefboomwet)",
    formula: "M = F * r",
    latex: "M = F \\cdot r",
    description: "Het draai-effect van een kracht (kracht x arm).",
    context: "Natuurkunde - Statica",
    difficulty: "Gemiddeld",
    related: ["Evenwicht", "Draaiing"],
    symbolic: "M = F * r",
    units: [
      { symbol: "M", name: "Moment", unit: "Nm", input: false },
      { symbol: "F", name: "Kracht", unit: "N", input: true },
      { symbol: "r", name: "Arm", unit: "m", input: true },
    ],
    commonMistakes:
      "De arm r is de loodrechte afstand tot de werklijn van de kracht.",
    calculate: (vals) => vals["F"] * vals["r"],
  },

  // --- WARMTE & THERMODYNAMICA (Compleet) ---
  {
    id: "therm_warmte_soort",
    name: "Soortelijke Warmte (Q)",
    formula: "Q = m * c * dT",
    latex: "Q = m \\cdot c \\cdot \\Delta T",
    description:
      "Energie nodig om de temperatuur van een stof te laten stijgen.",
    context: "Natuurkunde - Warmte",
    difficulty: "Gemiddeld",
    related: ["Energie", "Temperatuur", "Opwarming"],
    symbolic: "Q = m * c * dT",
    units: [
      { symbol: "Q", name: "Warmte", unit: "J", input: false },
      { symbol: "m", name: "Massa", unit: "kg", input: true },
      {
        symbol: "c",
        name: "Soortelijke warmte",
        unit: "J/(kg·K)",
        input: true,
      },
      { symbol: "dT", name: "Temp. Verschil", unit: "K", input: true },
    ],
    commonMistakes:
      "Zoek c op in Binas. ΔT mag in Celsius of Kelvin (verschil is gelijk).",
    calculate: (vals) => vals["m"] * vals["c"] * vals["dT"],
  },
  // --- QUANTUM & GOLVEN (Advanced VWO) ---

  {
    id: "opt_tralie",
    name: "Tralieformule",
    formula: "d * sin(alpha) = n * lambda",
    latex: "d \\cdot \\sin(\\alpha) = n \\cdot \\lambda",
    description: "Interferentie bij een tralie (diffractierooster).",
    context: "Natuurkunde - Optica",
    difficulty: "Expert",
    related: ["Licht", "Interferentie"],
    symbolic: "d * sin(alpha) = n * lam",
    units: [
      { symbol: "lam", name: "Golflengte", unit: "m", input: false },
      { symbol: "d", name: "Tralieconstante", unit: "m", input: true },
      { symbol: "alpha", name: "Hoek", unit: "graden", input: true },
      { symbol: "n", name: "Orde", unit: "-", input: true },
    ],
    commonMistakes: "d is 1 / aantal lijnen per meter.",
    calculate: (vals) =>
      (vals["d"] * Math.sin(vals["alpha"] * (Math.PI / 180))) / vals["n"],
  },
  {
    id: "wave_phase",
    name: "Faseverschil",
    formula: "dphi = dx / lambda",
    latex: "\\Delta \\varphi = \\frac{\\Delta x}{\\lambda}",
    description: "Verschil in fase tussen twee punten op een golf.",
    context: "Natuurkunde - Golven",
    difficulty: "Gemiddeld",
    related: ["Trillingen", "Fase"],
    units: [
      { symbol: "Δφ", name: "Faseverschil", unit: "-", input: false },
      { symbol: "Δx", name: "Afstand", unit: "m", input: true },
      { symbol: "λ", name: "Golflengte", unit: "m", input: true },
    ],
    commonMistakes:
      "Faseverschil bepaalt interferentie (constructief als geheel getal).",
    calculate: (vals) => vals["Δx"] / vals["λ"],
  },

  // --- WISKUNDE B (Meetkunde & Vectoren) ---
  {
    id: "math_vec_angle",
    name: "Hoek tussen vectoren",
    formula: "cos(alpha) = (a . b) / (|a|*|b|)",
    latex:
      "\\cos(\\alpha) = \\frac{\\vec{a} \\cdot \\vec{b}}{|\\vec{a}| \\cdot |\\vec{b}|}",
    description: "De hoek berekenen tussen twee vectoren via het inproduct.",
    context: "Wiskunde B - Vectoren",
    difficulty: "Expert",
    related: ["Vectoren", "Goniometrie"],
    units: [
      { symbol: "α", name: "Hoek", unit: "graden", input: false },
      { symbol: "a_x", name: "ax", unit: "-", input: true },
      { symbol: "a_y", name: "ay", unit: "-", input: true },
      { symbol: "b_x", name: "bx", unit: "-", input: true },
      { symbol: "b_y", name: "by", unit: "-", input: true },
    ],
    commonMistakes: "Rekenmachine op graden (deg) of radialen (rad) checken.",
    calculate: (vals) => {
      const dot = vals["a_x"] * vals["b_x"] + vals["a_y"] * vals["b_y"];
      const magA = Math.sqrt(vals["a_x"] ** 2 + vals["a_y"] ** 2);
      const magB = Math.sqrt(vals["b_x"] ** 2 + vals["b_y"] ** 2);
      return (Math.acos(dot / (magA * magB)) * 180) / Math.PI;
    },
  },
  {
    id: "math_dist_point_line",
    name: "Afstand Punt tot Lijn",
    formula: "d = |ax+by-c| / sqrt(a^2+b^2)",
    latex: "d(P, l) = \\frac{|ax_P + by_P - c|}{\\sqrt{a^2+b^2}}",
    description: "Kortste afstand van punt P(x,y) tot lijn l: ax+by=c.",
    context: "Wiskunde B - Meetkunde",
    difficulty: "Expert",
    related: ["Afstand", "Lijnen", "Analytische Meetkunde"],
    units: [
      { symbol: "d", name: "Afstand", unit: "-", input: false },
      { symbol: "a", name: "a (lijn)", unit: "-", input: true },
      { symbol: "b", name: "b (lijn)", unit: "-", input: true },
      { symbol: "c", name: "c (lijn)", unit: "-", input: true },
      { symbol: "x_P", name: "x (punt)", unit: "-", input: true },
      { symbol: "y_P", name: "y (punt)", unit: "-", input: true },
    ],
    commonMistakes: "Lijn moet in de vorm ax + by = c staan (of -c = 0).",
    calculate: (vals) =>
      Math.abs(vals["a"] * vals["x_P"] + vals["b"] * vals["y_P"] - vals["c"]) /
      Math.sqrt(vals["a"] ** 2 + vals["b"] ** 2),
  },
  {
    id: "math_circle_eq",
    name: "Cirkelvergelijking (Middelpunt)",
    formula: "(x-xM)^2 + (y-yM)^2 = r^2",
    latex: "(x-x_M)^2 + (y-y_M)^2 = r^2",
    description: "Vergelijking van een cirkel met middelpunt M en straal r.",
    context: "Wiskunde B - Meetkunde",
    difficulty: "Gemiddeld",
    related: ["Cirkel", "Meetkunde"],
    units: [
      { symbol: "r", name: "Straal", unit: "-", input: true },
      { symbol: "x_M", name: "x (Middelpunt)", unit: "-", input: true },
      { symbol: "y_M", name: "y (Middelpunt)", unit: "-", input: true },
    ],
    commonMistakes: "Straal is r, formule gebruikt r-kwadraat.",
    // For a circle, we calculate the Area as a useful derived property
    calculate: (vals) => Math.PI * Math.pow(vals["r"], 2),
  },

  // --- WISKUNDE B (Goniometrie & Calculus) ---
  {
    id: "math_gonio_sin2",
    name: "Verdubbelingsformule Sinus",
    formula: "sin(2x) = 2sin(x)cos(x)",
    latex: "\\sin(2x) = 2 \\sin(x) \\cos(x)",
    description: "Goniometrische identiteit voor de dubbele hoek.",
    context: "Wiskunde B - Goniometrie",
    difficulty: "Gemiddeld",
    related: ["Sinus", "Verdubbelingsformules"],
    units: [
      { symbol: "Res", name: "sin(2x)", unit: "-", input: false },
      { symbol: "x", name: "Hoek x", unit: "graden", input: true },
    ],
    commonMistakes: "Geldt voor elke x.",
    calculate: (vals) => Math.sin(2 * vals["x"] * (Math.PI / 180)),
  },
  {
    id: "math_gonio_cos2",
    name: "Verdubbelingsformule Cosinus",
    formula: "cos(2x) = cos^2(x) - sin^2(x)",
    latex: "\\cos(2x) = \\cos^2(x) - \\sin^2(x)",
    description: "Goniometrische identiteit voor de dubbele hoek.",
    context: "Wiskunde B - Goniometrie",
    difficulty: "Gemiddeld",
    related: ["Cosinus", "Verdubbelingsformules"],
    units: [
      { symbol: "Res", name: "cos(2x)", unit: "-", input: false },
      { symbol: "x", name: "Hoek x", unit: "graden", input: true },
    ],
    commonMistakes: "Alternatief: 2cos^2(x)-1 of 1-2sin^2(x).",
    calculate: (vals) => Math.cos(2 * vals["x"] * (Math.PI / 180)),
  },
  {
    id: "math_diff_ln",
    name: "Afgeleide logaritme",
    formula: "f(x)=ln(x) -> f'(x)=1/x",
    latex: "f(x) = \\ln(x) \\rightarrow f'(x) = \\frac{1}{x}",
    description: "Standaardafgeleide van de natuurlijke logaritme.",
    context: "Wiskunde B - Differentiaalrekening",
    difficulty: "Basis",
    related: ["Logaritme", "Afgeleide"],
    units: [
      { symbol: "f'", name: "Helling", unit: "-", input: false },
      { symbol: "x", name: "x", unit: "-", input: true },
    ],
    commonMistakes: "Alleen voor x > 0.",
    calculate: (vals) => 1 / vals["x"],
  },
  {
    id: "math_diff_exp",
    name: "Afgeleide e-macht",
    formula: "f(x)=e^x -> f'(x)=e^x",
    latex: "f(x) = e^x \\rightarrow f'(x) = e^x",
    description: "De e-macht is zijn eigen afgeleide.",
    context: "Wiskunde B - Differentiaalrekening",
    difficulty: "Basis",
    related: ["Exponentieel", "Afgeleide"],
    units: [
      { symbol: "f'", name: "Helling", unit: "-", input: false },
      { symbol: "x", name: "x", unit: "-", input: true },
    ],
    commonMistakes: "Vergeet de kettingregel niet bij e^(u(x)).",
    calculate: (vals) => Math.exp(vals["x"]),
  },
  // --- SCHEIKUNDE: ZUUR-BASE ---
  {
    id: "chem_ph",
    name: "pH berekening",
    formula: "pH = -log([H3O+])",
    latex: "pH = -\\log_{10}([H_3O^+])",
    description: "De zuurgraad van een oplossing.",
    context: "Scheikunde - Zuur-Base",
    difficulty: "Basis",
    related: ["Zuur", "Concentratie", "Logaritme"],
    units: [
      { symbol: "pH", name: "pH-waarde", unit: "-", input: false },
      {
        symbol: "[H3O+]",
        name: "H3O+ concentratie",
        unit: "mol/L",
        input: true,
      },
    ],
    commonMistakes: "Vergeet de min voor de log niet. [H3O+] moet in mol/L.",
    calculate: (vals) => -Math.log10(vals["[H3O+]"]),
  },
  {
    id: "chem_poh",
    name: "pOH berekening",
    formula: "pOH = -log([OH-])",
    latex: "pOH = -\\log_{10}([OH^-])",
    description: "De basegraad van een oplossing.",
    context: "Scheikunde - Zuur-Base",
    difficulty: "Basis",
    related: ["Base", "Concentratie"],
    units: [
      { symbol: "pOH", name: "pOH-waarde", unit: "-", input: false },
      { symbol: "[OH-]", name: "OH- concentratie", unit: "mol/L", input: true },
    ],
    commonMistakes: "Verband met pH: pH + pOH = 14 (bij 298K).",
    calculate: (vals) => -Math.log10(vals["[OH-]"]),
  },
  {
    id: "chem_kw",
    name: "Waterconstante (Kw)",
    formula: "Kw = [H3O+] * [OH-]",
    latex: "K_w = [H_3O^+] \\cdot [OH^-] = 1.0 \\cdot 10^{-14}",
    description: "Het evenwicht van water (bij 298K).",
    context: "Scheikunde - Zuur-Base",
    difficulty: "Gemiddeld",
    related: ["Water", "Evenwicht"],
    units: [
      { symbol: "Kw", name: "Kw", unit: "-", input: false },
      { symbol: "[H3O+]", name: "H3O+", unit: "mol/L", input: true },
      { symbol: "[OH-]", name: "OH-", unit: "mol/L", input: true },
    ],
    commonMistakes: "Kw verandert met de temperatuur (zie Binas tabel 50A).",
    calculate: (vals) => vals["[H3O+]"] * vals["[OH-]"],
  },
  {
    id: "chem_ka",
    name: "Zuurconstante (Ka)",
    formula: "Ka = ([H3O+] * [Ac-]) / [HAc]",
    latex: "K_z = \\frac{[H_3O^+][A^-]}{[HA]}",
    description: "Maat voor de sterkte van een zwak zuur.",
    context: "Scheikunde - Zuur-Base",
    difficulty: "Expert",
    related: ["Zwak zuur", "Evenwicht"],
    units: [
      { symbol: "Kz", name: "Zuurconstante", unit: "-", input: false },
      { symbol: "[H3O+]", name: "H3O+", unit: "mol/L", input: true },
      { symbol: "[A-]", name: "Geconj. base", unit: "mol/L", input: true },
      { symbol: "[HA]", name: "Zuur", unit: "mol/L", input: true },
    ],
    commonMistakes: "Alleen voor zwakke zuren. Sterke zuren reageren aflopend.",
    calculate: (vals) => (vals["[H3O+]"] * vals["[A-]"]) / vals["[HA]"],
  },

  // --- SCHEIKUNDE: EVENWICHT & SNELHEID ---
  {
    id: "chem_kc",
    name: "Evenwichtsconstante (Kc)",
    formula: "Kc = [C]^c * [D]^d / ([A]^a * [B]^b)",
    latex: "K_c = \\frac{[C]^c [D]^d}{[A]^a [B]^b}",
    description: "Verhouding concentraties in een chemisch evenwicht.",
    context: "Scheikunde - Evenwicht",
    difficulty: "Expert",
    related: ["Evenwicht", "Le Chatelier"],
    units: [
      { symbol: "Kc", name: "Kc", unit: "-", input: false },
      { symbol: "[Prod]", name: "Producten", unit: "mol/L", input: true },
      { symbol: "[Reac]", name: "Reactanten", unit: "mol/L", input: true },
    ],
    commonMistakes:
      "Alleen gasvormige en opgeloste stoffen (geen vaste stoffen of vloeistof als oplosmiddel).",
    // Calculating Kc = ([C]^c * [D]^d) / ([A]^a * [B]^b)
    // Simplified: product of product-concentrations / product of reactant-concentrations
    calculate: (vals) => (vals["[Prod]"] || 1) / (vals["[Reac]"] || 1),
  },

  // --- GROENE CHEMIE ---
  {
    id: "chem_atoomeconomie",
    name: "Atoomeconomie",
    formula: "AE = (mass_product / mass_reactants) * 100",
    latex:
      "\\text{Atoomeconomie} = \\frac{M_{\\text{gewenst product}}}{\\sum M_{\\text{beginstoffen}}} \\cdot 100\\%",
    description: "Maat voor hoe efficiënt atomen worden gebruikt.",
    context: "Scheikunde - Duurzaamheid",
    difficulty: "Gemiddeld",
    related: ["Groene Chemie", "Efficiëntie"],
    units: [
      { symbol: "AE", name: "Atoomeconomie", unit: "%", input: false },
      { symbol: "Mg", name: "Massa gewenst", unit: "g", input: true },
      { symbol: "Mb", name: "Massa begin", unit: "g", input: true },
    ],
    commonMistakes: "Kijk naar de molecuulformules en de stoichiometrie.",
    calculate: (vals) => (vals["Mg"] / vals["Mb"]) * 100,
  },
  {
    id: "chem_efactor",
    name: "E-factor",
    formula: "E = (mass_begin - mass_product) / mass_product",
    latex:
      "E = \\frac{m_{\\text{beginstoffen}} - m_{\\text{werkelijk product}}}{m_{\\text{werkelijk product}}}",
    description: "Maat voor de hoeveelheid afval per kg product.",
    context: "Scheikunde - Duurzaamheid",
    difficulty: "Gemiddeld",
    related: ["Afval", "Milieu"],
    units: [
      { symbol: "E", name: "E-factor", unit: "-", input: false },
      { symbol: "Mb", name: "Massa begin", unit: "kg", input: true },
      { symbol: "Mw", name: "Massa werkelijk", unit: "kg", input: true },
    ],
    commonMistakes:
      "Hoe lager de E-factor, hoe milieuvriendelijker het proces.",
    calculate: (vals) => (vals["Mb"] - vals["Mw"]) / vals["Mw"],
  },
  {
    id: "chem_yield",
    name: "Rendement (Chemie)",
    formula: "R = (werkelijk / theoretisch) * 100",
    latex:
      "\\text{Rendement} = \\frac{\\text{opbrengst werkelijk}}{\\text{opbrengst theoretisch}} \\cdot 100\\%",
    description:
      "Percentage van de theoretische opbrengst dat echt is behaald.",
    context: "Scheikunde - Stoichiometrie",
    difficulty: "Basis",
    related: ["Opbrengst", "Reactie"],
    units: [
      { symbol: "R", name: "Rendement", unit: "%", input: false },
      { symbol: "Rw", name: "Werkelijk", unit: "g", input: true },
      { symbol: "Rt", name: "Theoretisch", unit: "g", input: true },
    ],
    commonMistakes:
      "Theoretische opbrengst bereken je via de beperkende reactant.",
    calculate: (vals) => (vals["Rw"] / vals["Rt"]) * 100,
  },

  // --- ELEKTROCHEMIE ---
  {
    id: "chem_faraday",
    name: "Wet van Faraday (Lading)",
    formula: "Q = n * z * F",
    latex: "Q = n \\cdot z \\cdot F",
    description: "Relatie tussen elektrische lading en hoeveelheid stof.",
    context: "Scheikunde - Elektrochemie",
    difficulty: "Expert",
    related: ["Elektrolyse", "Lading"],
    units: [
      { symbol: "Q", name: "Lading", unit: "C", input: false },
      { symbol: "n", name: "Hoeveelheid stof", unit: "mol", input: true },
      { symbol: "z", name: "Z-getal (e-)", unit: "-", input: true },
      { symbol: "F", name: "Faraday Const.", unit: "C/mol", input: true },
    ],
    commonMistakes: "F = 96485 C/mol. z is het aantal elektronen per deeltje.",
    calculate: (vals) => vals["n"] * vals["z"] * vals["F"],
    symbolic: "Q = n * z * F",
    vis: {
      type: "plot",
      fn: "x * z * F",
    },
  },

  // --- NEW PHYSICS ADDITIONS ---
  {
    id: "magn_lorentz_particle",
    name: "Lorentzkracht (Deeltje)",
    formula: "Fl = B * q * v",
    latex: "F_L = B \\cdot q \\cdot v",
    description:
      "Kracht op een bewegend geladen deeltje in een magnetisch veld.",
    context: "Natuurkunde - Magnetisme",
    difficulty: "Expert",
    related: ["Deeltjesversneller", "Cyclotron"],
    symbolic: "F_L = B * q * v",
    binasTable: "35-D2",
    units: [
      { symbol: "F_L", name: "Lorentzkracht", unit: "N", input: false },
      { symbol: "B", name: "Velsterkte", unit: "T", input: true },
      { symbol: "q", name: "Lading", unit: "C", input: true },
      { symbol: "v", name: "Snelheid", unit: "m/s", input: true },
    ],
    commonMistakes:
      "Snelheid moet loodrecht op B staan. Gebruik de rechterhandregel.",
    calculate: (vals) => vals["B"] * vals["q"] * vals["v"],
    vis: {
      type: "plot",
      fn: "B * q * x", // Plot F_L vs v
    },
  },
  {
    id: "magn_solenoid",
    name: "Magnetisch veld (Spoel)",
    formula: "B = mu0 * N * I / L",
    latex: "B = \\mu_0 \\cdot \\frac{N \\cdot I}{l}",
    description:
      "Magnetische veldsterkte binnenin een lange spoel (solenoïde).",
    context: "Natuurkunde - Magnetisme",
    difficulty: "Expert",
    related: ["Elektromagneet", "Solenoïde"],
    symbolic: "B = mu0 * N * I / L",
    binasTable: "35-D2",
    units: [
      { symbol: "B", name: "Veldsterkte", unit: "T", input: false },
      {
        symbol: "mu0",
        name: "Permeabiliteit",
        unit: "H/m (4pi e-7)",
        input: true,
      },
      { symbol: "N", name: "Aantal windingen", unit: "-", input: true },
      { symbol: "I", name: "Stroomsterkte", unit: "A", input: true },
      { symbol: "L", name: "Lengte spoel", unit: "m", input: true },
    ],
    commonMistakes: "L is de lengte van de spoel zelf, niet de draadlengte.",
    calculate: (vals) => (vals["mu0"] * vals["N"] * vals["I"]) / vals["L"],
  },
  {
    id: "rel_momentum",
    name: "Relativistische Impuls",
    formula: "p = gamma * m * v",
    latex: "p = \\gamma \\cdot m \\cdot v",
    description: "Impuls van een deeltje bij zeer hoge snelheden.",
    context: "Natuurkunde - Relativiteit",
    difficulty: "Expert",
    related: ["Einstein", "Impuls"],
    symbolic: "p = gamma * m * v",
    binasTable: "35-A5",
    units: [
      { symbol: "p", name: "Impuls", unit: "kg m/s", input: false },
      { symbol: "gamma", name: "Gammafactor", unit: "-", input: true },
      { symbol: "m", name: "Massa", unit: "kg", input: true },
      { symbol: "v", name: "Snelheid", unit: "m/s", input: true },
    ],
    commonMistakes: "Voor lage snelheden (v << c) is gamma ongeveer 1.",
    calculate: (vals) => vals["gamma"] * vals["m"] * vals["v"],
  },
  {
    id: "rel_length",
    name: "Lengtecontractie",
    formula: "L = L0 / gamma",
    latex: "L = L_0 / \\gamma",
    description:
      "Voorwerpen lijken korter in de richting van hun beweging bij hoge snelheid.",
    context: "Natuurkunde - Relativiteit",
    difficulty: "Expert",
    related: ["Einstein", "Ruimte"],
    symbolic: "L = L0 / gamma",
    binasTable: "35-A5",
    units: [
      { symbol: "L", name: "Bewegende lengte", unit: "m", input: false },
      { symbol: "L0", name: "Eigenlengte", unit: "m", input: true },
      { symbol: "gamma", name: "Gammafactor", unit: "-", input: true },
    ],
    commonMistakes: "L is altijd kleiner dan L0.",
    calculate: (vals) => vals["L0"] / vals["gamma"],
  },
  {
    id: "mech_grav_field",
    name: "Gravitatieveldsterkte",
    formula: "g = G * M / r^2",
    latex: "g = G \\cdot \\frac{M}{r^2}",
    description:
      "De versnelling van de zwaartekracht op afstand r van een massa M.",
    context: "Natuurkunde - Heelal",
    difficulty: "Gemiddeld",
    related: ["Zwaartekracht", "Planeten"],
    symbolic: "g = G * M / r^2",
    binasTable: "35-A2",
    units: [
      { symbol: "g", name: "Veldsterkte", unit: "m/s²", input: false },
      {
        symbol: "G",
        name: "Gravitatieconstante",
        unit: "Nm²/kg²",
        input: true,
      },
      { symbol: "M", name: "Massa bron", unit: "kg", input: true },
      { symbol: "r", name: "Afstand", unit: "m", input: true },
    ],
    commonMistakes: "Op het oppervlak van de aarde is g ongeveer 9.81 m/s².",
    calculate: (vals) => (vals["G"] * vals["M"]) / Math.pow(vals["r"], 2),
  },
  {
    id: "therm_heat_power",
    name: "Warmtevermogen",
    formula: "P = Q / t",
    latex: "P = \\frac{Q}{t}",
    description: "De hoeveelheid warmte-energie per tijdseenheid.",
    context: "Natuurkunde - Warmte",
    difficulty: "Basis",
    related: ["Vermogen", "Energie"],
    symbolic: "P = Q / t",
    binasTable: "35-C1",
    units: [
      { symbol: "P", name: "Vermogen", unit: "W", input: false },
      { symbol: "Q", name: "Warmte", unit: "J", input: true },
      { symbol: "t", name: "Tijd", unit: "s", input: true },
    ],
    commonMistakes: "P is hetzelfde als Watt (J/s).",
    calculate: (vals) => vals["Q"] / vals["t"],
  },
  {
    id: "mech_circular_v",
    name: "Baansnelheid",
    formula: "v = 2 * pi * r / T",
    latex: "v = \\frac{2\\pi r}{T}",
    description: "Snelheid van een object in een eenparige cirkelbeweging.",
    context: "Natuurkunde - Cirkelbeweging",
    difficulty: "Basis",
    related: ["Cirkel", "Frequentie"],
    symbolic: "v = 2 * pi * r / T",
    binasTable: "35-A1",
    units: [
      { symbol: "v", name: "Snelheid", unit: "m/s", input: false },
      { symbol: "r", name: "Straal", unit: "m", input: true },
      { symbol: "T", name: "Omlooptijd", unit: "s", input: true },
    ],
    commonMistakes: "T is de tijd voor één volledige omwenteling.",
    calculate: (vals) => (2 * Math.PI * vals["r"]) / vals["T"],
  },

  // --- NEW CHEMISTRY ADDITIONS ---
  {
    id: "chem_gas_density",
    name: "Gasdichtheid",
    formula: "rho = p * M / (R * T)",
    latex: "\\rho = \\frac{p \\cdot M}{R \\cdot T}",
    description: "Dichtheid van een ideaal gas bij druk p en temperatuur T.",
    context: "Scheikunde - Gaswetten",
    difficulty: "Expert",
    related: ["Gaswet", "Dichtheid"],
    symbolic: "rho = p * M / (R * T)",
    binasTable: "37G",
    units: [
      { symbol: "rho", name: "Dichtheid", unit: "kg/m³", input: false },
      { symbol: "p", name: "Druk", unit: "Pa", input: true },
      { symbol: "M", name: "Molmassa", unit: "kg/mol", input: true },
      {
        symbol: "R",
        name: "Gasconstante",
        unit: "J/molK (8.314)",
        input: true,
      },
      { symbol: "T", name: "Temperatuur", unit: "K", input: true },
    ],
    commonMistakes: "Massa moet in kg/mol voor SI, T in Kelvin.",
    calculate: (vals) => (vals["p"] * vals["M"]) / (vals["R"] * vals["T"]),
  },
  {
    id: "chem_kp",
    name: "Druk-evenwicht (Kp)",
    formula: "Kp = Pp^p / Pr^r",
    latex: "K_p = \\frac{(p_C)^c (p_D)^d}{(p_A)^a (p_B)^b}",
    description:
      "Evenwichtsconstante op basis van partieeldrukken voor gasreacties.",
    context: "Scheikunde - Evenwicht",
    difficulty: "Expert",
    related: ["Evenwicht", "Gassen"],
    symbolic: "Kp = Pprod / Preac",
    binasTable: "37H",
    units: [
      { symbol: "Kp", name: "Kp", unit: "-", input: false },
      { symbol: "Pprod", name: "Prod. deeldruk", unit: "Pa", input: true },
      { symbol: "Preac", name: "Reac. deeldruk", unit: "Pa", input: true },
    ],
    commonMistakes: "Alleen voor stoffen in de gasfase.",
    calculate: (vals) => vals["Pprod"] / vals["Preac"],
  },
  {
    id: "chem_ph_poh_14",
    name: "pH + pOH Relatie",
    formula: "pH + pOH = 14",
    latex: "pH + pOH = 14",
    description: "De som van pH en pOH is 14 bij 298 Kelvin.",
    context: "Scheikunde - Zuur-Base",
    difficulty: "Basis",
    related: ["pH", "pOH"],
    symbolic: "pH + pOH = 14",
    binasTable: "38A",
    units: [
      { symbol: "pH", name: "pH", unit: "-", input: true },
      { symbol: "pOH", name: "pOH", unit: "-", input: true },
    ],
    commonMistakes: "Geldt alleen bij kamertemperatuur (T = 298 K).",
    calculate: (vals) => 14 - (vals["pH"] || 0) || vals["pOH"] || 0,
  },

  // --- NEW MATH B ADDITIONS ---
  {
    id: "math_tan_identity",
    name: "Tangens Definitie",
    formula: "tan(x) = sin(x) / cos(x)",
    latex: "\\tan(x) = \\frac{\\sin(x)}{\\cos(x)}",
    description: "Verband tussen tangens, sinus en cosinus.",
    context: "Wiskunde B - Goniometrie",
    difficulty: "Basis",
    related: ["Goniometrie", "Tangens"],
    symbolic: "tan(x) = sin(x) / cos(x)",
    binasTable: "36",
    units: [
      { symbol: "x", name: "Hoek", unit: "rad", input: true },
      { symbol: "tan", name: "tan(x)", unit: "-", input: false },
    ],
    commonMistakes: "Niet gedefinieerd voor cos(x) = 0 (x = 0.5pi + k*pi).",
    calculate: (vals) => Math.tan(vals["x"]),
    vis: {
      type: "plot",
      fn: "tan(x)",
    },
  },
  {
    id: "math_gonio_sum_sin",
    name: "Somformule Sinus",
    formula: "sin(a+b) = sin(a)cos(b) + cos(a)sin(b)",
    latex: "\\sin(a+b) = \\sin(a)\\cos(b) + \\cos(a)\\sin(b)",
    description: "Bereken de sinus van een som van twee hoeken.",
    context: "Wiskunde B - Goniometrie",
    difficulty: "Expert",
    related: ["Goniometrie", "Somformules"],
    symbolic: "sin_sum = sin(a)*cos(b) + cos(a)*sin(b)",
    binasTable: "36",
    units: [
      { symbol: "sin_sum", name: "sin(a+b)", unit: "-", input: false },
      { symbol: "a", name: "Hoek a", unit: "rad", input: true },
      { symbol: "b", name: "Hoek b", unit: "rad", input: true },
    ],
    commonMistakes:
      "Check of je de juiste tekens gebruikt (+ voor sin, - voor cos).",
    calculate: (vals) => Math.sin(vals["a"] + vals["b"]),
    vis: {
      type: "plot",
      fn: "sin(x)", // Simplified for 1-var plot
    },
  },
  {
    id: "math_gonio_sum_cos",
    name: "Somformule Cosinus",
    formula: "cos(a+b) = cos(a)cos(b) - sin(a)sin(b)",
    latex: "\\cos(a+b) = \\cos(a)\\cos(b) - \\sin(a)\\sin(b)",
    description: "Bereken de cosinus van een som van twee hoeken.",
    context: "Wiskunde B - Goniometrie",
    difficulty: "Expert",
    related: ["Goniometrie", "Somformules"],
    symbolic: "cos_sum = cos(a)*cos(b) - sin(a)*sin(b)",
    binasTable: "36",
    units: [
      { symbol: "cos_sum", name: "cos(a+b)", unit: "-", input: false },
      { symbol: "a", name: "Hoek a", unit: "rad", input: true },
      { symbol: "b", name: "Hoek b", unit: "rad", input: true },
    ],
    commonMistakes: "Let op de min in de formule voor de cosinus!",
    calculate: (vals) => Math.cos(vals["a"] + vals["b"]),
    vis: {
      type: "plot",
      fn: "cos(x)",
    },
  },
  {
    id: "math_int_exp",
    name: "Integraal van e^x",
    formula: "int e^x dx = e^x + C",
    latex: "\\int e^x dx = e^x + C",
    description:
      "Onbepaalde integraal van de natuurlijke exponentiële functie.",
    context: "Wiskunde B - Integraalrekening",
    difficulty: "Basis",
    related: ["Calculus", "Integralen"],
    symbolic: "F = exp(x)",
    binasTable: "36",
    units: [
      { symbol: "F", name: "Primitieve", unit: "-", input: false },
      { symbol: "x", name: "waarde x", unit: "-", input: true },
    ],
    commonMistakes:
      "Vergeet de integratieconstante C niet bij onbepaalde integralen.",
    calculate: (vals) => Math.exp(vals["x"]),
    vis: {
      type: "plot",
      fn: "exp(x)",
    },
  },
  {
    id: "math_int_inv",
    name: "Integraal van 1/x",
    formula: "int 1/x dx = ln|x| + C",
    latex: "\\int \\frac{1}{x} dx = \\ln|x| + C",
    description: "Onbepaalde integraal van de reciproque functie.",
    context: "Wiskunde B - Integraalrekening",
    difficulty: "Basis",
    related: ["Calculus", "Logaritme"],
    symbolic: "F = ln(abs(x))",
    binasTable: "36",
    units: [
      { symbol: "F", name: "Primitieve", unit: "-", input: false },
      { symbol: "x", name: "waarde x", unit: "-", input: true },
    ],
    commonMistakes:
      "Alleen gedefinieerd voor x niet gelijk aan 0. Gebruik de absolute waarde.",
    calculate: (vals) => Math.log(Math.abs(vals["x"])),
    vis: {
      type: "plot",
      fn: "log(abs(x))",
    },
  },

  // --- GAP FILLERS (BATCH 2) ---
  {
    id: "phys_coulomb",
    name: "Wet van Coulomb",
    formula: "Fel = f * (q1 * q2) / r^2",
    latex: "F_{\\text{el}} = f \\cdot \\frac{q_1 \\cdot q_2}{r^2}",
    description: "Elektrische kracht tussen twee puntladingen.",
    context: "Natuurkunde - Elektriciteit",
    difficulty: "Gemiddeld",
    related: ["Lading", "Kracht", "Elektrisch veld"],
    symbolic: "Fel = f * (q1 * q2) / r^2",
    binasTable: "35-D1",
    units: [
      { symbol: "F_el", name: "Elektrische kracht", unit: "N", input: false },
      { symbol: "f", name: "Coulomb constante", unit: "Nm²/C²", input: true },
      { symbol: "q_1", name: "Lading 1", unit: "C", input: true },
      { symbol: "q_2", name: "Lading 2", unit: "C", input: true },
      { symbol: "r", name: "Afstand", unit: "m", input: true },
    ],
    commonMistakes:
      "f = 8.988e9 Nm²/C². Teken geeft aantrekking/afstoting aan.",
    calculate: (vals) =>
      (vals["f"] * vals["q_1"] * vals["q_2"]) / Math.pow(vals["r"], 2),
    vis: {
      type: "plot",
      fn: "(f * q1 * q2) / x^2",
    },
  },
  {
    id: "phys_doppler",
    name: "Dopplereffect (Geluid)",
    formula: "fv = fb * v / (v - vb)",
    latex: "f_w = f_b \\cdot \\frac{v}{v - v_b}",
    description:
      "Waargenomen frequentie bij een bewegende bron (naar waarnemer toe).",
    context: "Natuurkunde - Golven",
    difficulty: "Expert",
    related: ["Geluid", "Frequentie", "Snelheid"],
    symbolic: "fv = fb * v / (v - vb)",
    binasTable: "35-B2",
    units: [
      { symbol: "f_w", name: "Waargenomen freq.", unit: "Hz", input: false },
      { symbol: "f_b", name: "Bronfrequentie", unit: "Hz", input: true },
      { symbol: "v", name: "Geluidsnelheid", unit: "m/s", input: true },
      { symbol: "v_b", name: "Snelheid bron", unit: "m/s", input: true },
    ],
    commonMistakes: "Let op de min/plus tekens. Als bron weg beweegt: v + vb.",
    calculate: (vals) => vals["f_b"] * (vals["v"] / (vals["v"] - vals["v_b"])),
  },
  {
    id: "therm_latent",
    name: "Latente Warmte (Faseovergang)",
    formula: "Q = m * L",
    latex: "Q = m \\cdot L",
    description:
      "Energie nodig voor faseovergang (smelten/verdampen) zonder temp. stijging.",
    context: "Natuurkunde - Warmte",
    difficulty: "Basis",
    related: ["Smeltwarmte", "Verdampingswarmte"],
    symbolic: "Q = m * L",
    binasTable: "35-C4",
    units: [
      { symbol: "Q", name: "Warmte", unit: "J", input: false },
      { symbol: "m", name: "Massa", unit: "kg", input: true },
      { symbol: "L", name: "Latente warmte", unit: "J/kg", input: true },
    ],
    commonMistakes: "Geen delta-T gebruiken! Temperatuur blijft constant.",
    calculate: (vals) => vals["m"] * vals["L"],
    vis: {
      type: "plot",
      fn: "L * x",
    },
  },
  {
    id: "chem_gibbs",
    name: "Gibbs Vrije Energie",
    formula: "dG = dH - T * dS",
    latex: "\\Delta G = \\Delta H - T \\cdot \\Delta S",
    description: "Bepaalt of een reactie spontaan verloopt (< 0).",
    context: "Scheikunde - Thermodynamica",
    difficulty: "Expert",
    related: ["Entropie", "Enthalpie", "Spontaniteit"],
    symbolic: "dG = dH - T * dS",
    binasTable: "38",
    units: [
      { symbol: "ΔG", name: "Gibbs energie", unit: "J/mol", input: false },
      { symbol: "ΔH", name: "Enthalpie", unit: "J/mol", input: true },
      { symbol: "T", name: "Temperatuur", unit: "K", input: true },
      { symbol: "ΔS", name: "Entropie", unit: "J/(mol·K)", input: true },
    ],
    commonMistakes: "ΔS is vaak in J, ΔH in kJ. Reken om!",
    calculate: (vals) => vals["ΔH"] - vals["T"] * vals["ΔS"],
    vis: {
      type: "plot",
      fn: "dH - x * dS",
    },
  },
  {
    id: "math_diff_poly",
    name: "Afgeleide Machtsfunctie",
    formula: "f(x)=x^n -> f'(x)=n*x^(n-1)",
    latex: "f(x) = x^n \\rightarrow f'(x) = n \\cdot x^{n-1}",
    description: "De basisregel voor het differentiëren van polynomen.",
    context: "Wiskunde B - Differentiaalrekening",
    difficulty: "Basis",
    related: ["Afgeleide", "Machtsfunctie"],
    units: [
      { symbol: "f'", name: "Helling", unit: "-", input: false },
      { symbol: "n", name: "Macht", unit: "-", input: true },
      { symbol: "x", name: "x", unit: "-", input: true },
    ],
    commonMistakes: "n wordt de coëfficiënt, nieuwe macht is n-1.",
    calculate: (vals) => vals["n"] * Math.pow(vals["x"], vals["n"] - 1),
  },
  {
    id: "math_vol_sphere",
    name: "Volume Bol",
    formula: "V = 4/3 * pi * r^3",
    latex: "V = \\frac{4}{3} \\pi r^3",
    description: "Inhoud van een bol.",
    context: "Wiskunde B - Meetkunde",
    difficulty: "Gemiddeld",
    related: ["Volume", "Bol", "Meetkunde"],
    symbolic: "V = 4/3 * pi * r^3",
    units: [
      { symbol: "V", name: "Volume", unit: "m³", input: false },
      { symbol: "r", name: "Straal", unit: "m", input: true },
    ],
    commonMistakes: "Tot de macht 3, niet 2 (oppervlakte)!",
    calculate: (vals) => (4 / 3) * Math.PI * Math.pow(vals["r"], 3),
    vis: {
      type: "plot",
      fn: "(4/3) * pi * x^3",
    },
  },

  // --- VWO 5/6 ADDITIONS (Physics, Chem, Math) ---
  // NATUURKUNDE - OPTICA
  {
    id: "phys_snellius",
    name: "Wet van Snellius",
    formula: "n1 * sin(i) = n2 * sin(r)",
    latex: "n_1 \\cdot \\sin(i) = n_2 \\cdot \\sin(r)",
    description:
      "Breking van licht bij overgang tussen twee stoffen (Wet van Snellius).",
    context: "Natuurkunde - Licht",
    difficulty: "Gemiddeld",
    related: ["Breking", "Licht", "Lenzen"],
    symbolic: "n1 * sin(i) = n2 * sin(r)",
    binasTable: "35-E1",
    units: [
      { symbol: "n_1", name: "Brekingsindex 1", unit: "-", input: true },
      { symbol: "i", name: "Hoek van inval", unit: "rad", input: true },
      { symbol: "n_2", name: "Brekingsindex 2", unit: "-", input: true },
      { symbol: "r", name: "Hoek van breking", unit: "rad", input: false },
    ],
    commonMistakes:
      "Vergeet niet hoeken in radialen te zetten voor berekeningen (hoewel graden vaak gegeven zijn).",
    calculate: (vals) =>
      Math.asin((vals["n_1"] * Math.sin(vals["i"])) / vals["n_2"]),
  },

  // NATUURKUNDE - MECHANICA
  {
    id: "mech_impuls",
    name: "Impuls",
    formula: "p = m * v",
    latex: "p = m \\cdot v",
    description: "De hoeveelheid beweging van een voorwerp.",
    context: "Natuurkunde - Mechanica",
    difficulty: "Basis",
    related: ["Snelheid", "Massa", "Botsingen"],
    symbolic: "p = m * v",
    binasTable: "35-A3",
    units: [
      { symbol: "p", name: "Impuls", unit: "kg m/s", input: false },
      { symbol: "m", name: "Massa", unit: "kg", input: true },
      { symbol: "v", name: "Snelheid", unit: "m/s", input: true },
    ],
    commonMistakes: "Impuls is een vectorgrootheid (heeft richting).",
    calculate: (vals) => vals["m"] * vals["v"],
    vis: {
      type: "plot",
      fn: "m * x", // Plot p vs v
    },
  },

  // NATUURKUNDE - ELEKTROMAGNETISME

  // NATUURKUNDE - QUANTUM
  {
    id: "quant_photoelectric",
    name: "Foto-elektrisch Effect",
    formula: "Ek = h * f - W",
    latex: "E_k = h \\cdot f - W_{\\text{uittree}}",
    description: "Kinetische energie van vrijgemaakte elektronen door licht.",
    context: "Natuurkunde - Quantum",
    difficulty: "Expert",
    related: ["Licht", "Fotonen", "Energie"],
    symbolic: "Ek = h * f - W",
    binasTable: "35-E2",
    units: [
      { symbol: "E_k", name: "Kinetische Energie", unit: "J", input: false },
      { symbol: "h", name: "Constante v. Planck", unit: "Js", input: true },
      { symbol: "f", name: "Frequentie", unit: "Hz", input: true },
      { symbol: "W", name: "Uittree-energie", unit: "J", input: true },
    ],
    commonMistakes: "Als h*f < W, dan gebeurt er niets (geen elektronen).",
    calculate: (vals) => vals["h"] * vals["f"] - vals["W"],
    vis: {
      type: "plot",
      fn: "h * x - W", // Plot Ek vs f
    },
  },
  {
    id: "quant_heisenberg",
    name: "Onzekerheidsrelatie",
    formula: "dx * dp >= h / 4pi",
    latex: "\\Delta x \\cdot \\Delta p \\ge \\frac{h}{4\\pi}",
    description:
      "Fundamentele limiet aan de nauwkeurigheid van plaats en impuls.",
    context: "Natuurkunde - Quantum",
    difficulty: "Expert",
    related: ["Heisenberg", "Quantum"],
    symbolic: "product = h / (4 * pi)",
    units: [
      {
        symbol: "product",
        name: "Onzekerheidsproduct",
        unit: "Js",
        input: false,
      },
      { symbol: "h", name: "Constante v. Planck", unit: "Js", input: true },
    ],
    commonMistakes: "Vergeet de factor 4pi niet.",
    calculate: (vals) => vals["h"] / (4 * Math.PI),
  },

  // SCHEIKUNDE - KINETIEK
  {
    id: "chem_arrhenius",
    name: "Arrhenius Vergelijking",
    formula: "k = A * e^(-Ea / RT)",
    latex: "k = A \\cdot e^{\\frac{-E_a}{R \\cdot T}}",
    description: "Verband tussen reactiesnelheidsconstante en temperatuur.",
    context: "Scheikunde - Kinetiek",
    difficulty: "Expert",
    related: ["Snelheid", "Activeringsenergie"],
    symbolic: "k = A * exp(-Ea / (R * T))",
    binasTable: "37",
    units: [
      { symbol: "k", name: "Reactieconstante", unit: "s^-1", input: false },
      {
        symbol: "A",
        name: "Pre-exponentiële factor",
        unit: "s^-1",
        input: true,
      },
      { symbol: "E_a", name: "Activeringsenergie", unit: "J/mol", input: true },
      { symbol: "R", name: "Gasconstante", unit: "J/molK", input: true },
      { symbol: "T", name: "Temperatuur", unit: "K", input: true },
    ],
    commonMistakes: "Ea in Joul, niet kJ! T in Kelvin.",
    calculate: (vals) =>
      vals["A"] * Math.exp(-vals["E_a"] / (vals["R"] * vals["T"])),
    vis: {
      type: "plot",
      fn: "A * exp(-Ea / (R * x))", // Plot k vs T
    },
  },

  // WISKUNDE B - VECTOREN & MEETKUNDE
  {
    id: "math_vec_dot",
    name: "Inproduct (Dot Product)",
    formula: "a . b = |a||b|cos(phi)",
    latex:
      "\\vec{a} \\cdot \\vec{b} = |\\vec{a}| \\cdot |\\vec{b}| \\cdot \\cos(\\varphi)",
    description: "Scalair product van twee vectoren.",
    context: "Wiskunde B - Vectoren",
    difficulty: "Gemiddeld",
    related: ["Hoek", "Vectoren"],
    symbolic: "dot = ax*bx + ay*by",
    units: [
      { symbol: "dot", name: "Inproduct", unit: "-", input: false },
      { symbol: "ax", name: "a_x", unit: "-", input: true },
      { symbol: "ay", name: "a_y", unit: "-", input: true },
      { symbol: "bx", name: "b_x", unit: "-", input: true },
      { symbol: "by", name: "b_y", unit: "-", input: true },
    ],
    commonMistakes:
      "Als het inproduct 0 is, staan de vectoren loodrecht op elkaar.",
    calculate: (vals) => vals["ax"] * vals["bx"] + vals["ay"] * vals["by"],
  },
  {
    id: "math_vec_len",
    name: "Lengte van een Vector",
    formula: "|v| = sqrt(x^2 + y^2 + z^2)",
    latex: "|\\vec{v}| = \\sqrt{x^2 + y^2 + z^2}",
    description: "De grootte (norm) van een vector in 3D ruimte.",
    context: "Wiskunde B - Vectoren",
    difficulty: "Basis",
    related: ["Pythagoras", "Afstand"],
    symbolic: "len = sqrt(x^2 + y^2 + z^2)",
    units: [
      { symbol: "len", name: "Lengte", unit: "-", input: false },
      { symbol: "x", name: "x-component", unit: "-", input: true },
      { symbol: "y", name: "y-component", unit: "-", input: true },
      { symbol: "z", name: "z-component", unit: "-", input: true },
    ],
    commonMistakes: "Vergeet de wortel niet!",
    calculate: (vals) =>
      Math.sqrt(
        Math.pow(vals["x"], 2) +
          Math.pow(vals["y"], 2) +
          Math.pow(vals["z"] || 0, 2),
      ),
    vis: {
      type: "vector",
      fn: "",
    },
  },
  // --- NEW VWO ELITE ADDITIONS ---
  {
    id: "math_sin_rule",
    name: "Sinusregel",
    formula: "a / sin(alpha) = b / sin(beta)",
    latex:
      "\\frac{a}{\\sin(\\alpha)} = \\frac{b}{\\sin(\\beta)} = \\frac{c}{\\sin(\\gamma)}",
    description:
      "Verband tussen zijden en overstaande hoeken in een willekeurige driehoek.",
    context: "Wiskunde B - Meetkunde",
    difficulty: "Gemiddeld",
    related: ["Driehoeken", "Cosinusregel"],
    symbolic: "a / sin(alpha) = b / sin(beta)",
    binasTable: "36",
    units: [
      { symbol: "a", name: "Zijde a", unit: "-", input: true },
      { symbol: "alpha", name: "Hoek α", unit: "graden", input: true },
      { symbol: "b", name: "Zijde b", unit: "-", input: true },
      { symbol: "beta", name: "Hoek β", unit: "graden", input: false }, // Output target
    ],
    commonMistakes:
      "Let op de instelling van je rekenmachine (Graden/Radialen).",
    calculate: (vals) =>
      (Math.asin(
        (vals["b"] * Math.sin(vals["alpha"] * (Math.PI / 180))) / vals["a"],
      ) *
        180) /
      Math.PI,
  },
  {
    id: "math_cos_rule",
    name: "Cosinusregel (Zijde)",
    formula: "a^2 = b^2 + c^2 - 2bc*cos(alpha)",
    latex: "a^2 = b^2 + c^2 - 2bc \\cos(\\alpha)",
    description:
      "Bereken een zijde als je twee zijden en de ingesloten hoek weet.",
    context: "Wiskunde B - Meetkunde",
    difficulty: "Gemiddeld",
    related: ["Driehoeken", "Pythagoras"],
    symbolic: "a^2 = b^2 + c^2 - 2*b*c*cos(alpha)",
    binasTable: "36",
    units: [
      { symbol: "a", name: "Zijde a", unit: "-", input: false },
      { symbol: "b", name: "Zijde b", unit: "-", input: true },
      { symbol: "c", name: "Zijde c", unit: "-", input: true },
      { symbol: "alpha", name: "Hoek α", unit: "graden", input: true },
    ],
    commonMistakes: "Vergeet de wortel aan het eind niet te trekken voor a.",
    calculate: (vals) =>
      Math.sqrt(
        Math.pow(vals["b"], 2) +
          Math.pow(vals["c"], 2) -
          2 * vals["b"] * vals["c"] * Math.cos(vals["alpha"] * (Math.PI / 180)),
      ),
  },
  {
    id: "phys_pendulum",
    name: "Slinger (Trillingstijd)",
    formula: "T = 2pi * sqrt(L/g)",
    latex: "T = 2\\pi \\sqrt{\\frac{L}{g}}",
    description: "Periode van een mathematische slinger.",
    context: "Natuurkunde - Trillingen",
    difficulty: "Gemiddeld",
    related: ["Harmonisch", "Slinger"],
    symbolic: "T = 2 * pi * sqrt(L / g)",
    binasTable: "35-B1",
    units: [
      { symbol: "T", name: "Trillingstijd", unit: "s", input: false },
      { symbol: "L", name: "Lengte touw", unit: "m", input: true },
      { symbol: "g", name: "Valversnelling", unit: "m/s²", input: true },
    ],
    commonMistakes:
      "De massa van het gewichtje maakt niet uit voor de trillingstijd.",
    calculate: (vals) => 2 * Math.PI * Math.sqrt(vals["L"] / vals["g"]),
  },
  {
    id: "mech_energy_spring",
    name: "Veerenergie",
    formula: "Ev = 0.5 * C * u^2",
    latex: "E_v = \\frac{1}{2} C \\cdot u^2",
    description: "Potentiële energie opgeslagen in een uitgerekte veer.",
    context: "Natuurkunde - Energie",
    difficulty: "Gemiddeld",
    related: ["Veer", "Arbeid"],
    symbolic: "Ev = 0.5 * C * u^2",
    binasTable: "35-A4",
    vis: { type: "plot", fn: "0.5 * C * x^2" },
    units: [
      { symbol: "E_v", name: "Veerenergie", unit: "J", input: false },
      { symbol: "C", name: "Veerconstante", unit: "N/m", input: true },
      { symbol: "u", name: "Uitrekking", unit: "m", input: true },
    ],
    commonMistakes: "u moet in meters, niet centimeters.",
    calculate: (vals) => 0.5 * vals["C"] * Math.pow(vals["u"], 2),
  },
  {
    id: "chem_kb",
    name: "Baseconstante (Kb)",
    formula: "Kb = ([HB+] * [OH-]) / [B]",
    latex: "K_b = \\frac{[HB^+][OH^-]}{[B]}",
    description: "Maat voor de sterkte van een zwakke base.",
    context: "Scheikunde - Zuur-Base",
    difficulty: "Expert",
    related: ["Zwakke base", "Evenwicht"],
    symbolic: "Kb = (HB * OH) / B",
    binasTable: "49",
    units: [
      { symbol: "Kb", name: "Baseconstante", unit: "-", input: false },
      { symbol: "[OH-]", name: "OH-", unit: "mol/L", input: true },
      { symbol: "[HB+]", name: "Geconj. zuur", unit: "mol/L", input: true },
      { symbol: "[B]", name: "Base", unit: "mol/L", input: true },
    ],
    commonMistakes: "Verwar Kb niet met pKb (-log Kb).",
    calculate: (vals) => (vals["[OH-]"] * vals["[HB+]"]) / vals["[B]"],
  },

  // --- ASTROFYSICA (VWO Elite) ---
  {
    id: "astro_wien",
    name: "Wet van Wien",
    formula: "lambda_max * T = kw",
    latex: "\\lambda_{max} \\cdot T = k_w",
    description:
      "Verband tussen de temperatuur van een ster en de golflengte waarbij deze het meeste straling uitzendt (kleur).",
    context: "Natuurkunde - Astrofysica",
    difficulty: "Expert",
    related: ["Straling", "Sterren"],
    symbolic: "lambda_max = kw / T",
    binasTable: "35-E1",
    vis: { type: "plot", fn: "2.898e-3 / x" }, // Plot T vs Lambda
    units: [
      {
        symbol: "lambda_max",
        name: "Golflengte (max)",
        unit: "m",
        input: false,
      },
      { symbol: "T", name: "Temperatuur", unit: "K", input: true },
      { symbol: "kw", name: "Constante van Wien", unit: "m·K", input: true }, // 2.898 x 10^-3
    ],
    commonMistakes: "T moet in Kelvin. Lambda_max is de TOP van de kromme.",
    calculate: (vals) => 2.89777e-3 / vals["T"],
  },
  {
    id: "astro_stefan_boltzmann",
    name: "Wet van Stefan-Boltzmann",
    formula: "P = sigma * A * T^4",
    latex: "P = \\sigma \\cdot A \\cdot T^4",
    description: "Het totale vermogen (lichtkracht) dat een ster uitstraalt.",
    context: "Natuurkunde - Astrofysica",
    difficulty: "Expert",
    related: ["Lichtkracht", "Sterren"],
    symbolic: "P = sigma * A * T^4",
    binasTable: "35-E1",
    units: [
      { symbol: "P", name: "Bronvermogen", unit: "W", input: false },
      {
        symbol: "sigma",
        name: "Cst. Stefan-Boltzmann",
        unit: "W/m²K⁴",
        input: true,
      }, // 5.67 x 10^-8
      { symbol: "A", name: "Oppervlakte", unit: "m²", input: true },
      { symbol: "T", name: "Temperatuur", unit: "K", input: true },
    ],
    commonMistakes: "Vergeet de macht 4 niet! T moet in Kelvin.",
    calculate: (vals) => 5.67037e-8 * vals["A"] * Math.pow(vals["T"], 4),
  },
  {
    id: "astro_schwarzschild",
    name: "Schwarzschildstraal (Zwart Gat)",
    formula: "Rs = (2 * G * M) / c^2",
    latex: "R_s = \\frac{2GM}{c^2}",
    description:
      "De straal van de waarnemingshorizon van een zwart gat. Niets kan hieruit ontsnappen, zelfs licht niet.",
    context: "Natuurkunde - Relativiteit",
    difficulty: "Expert",
    related: ["Gravitatie", "Zwarte Gaten"],
    symbolic: "Rs = (2 * G * M) / c^2",
    binasTable: "35-A", // Algemene constanten
    units: [
      { symbol: "Rs", name: "Schwarzschildstraal", unit: "m", input: false },
      {
        symbol: "G",
        name: "Gravitatieconstante",
        unit: "Nm²/kg²",
        input: true,
      },
      { symbol: "M", name: "Massa object", unit: "kg", input: true },
      { symbol: "c", name: "Lichtsnelheid", unit: "m/s", input: true },
    ],
    commonMistakes: "Dit is de straal van de horizon, niet het 'oppervlak'.",
    calculate: (vals) => (2 * 6.674e-11 * vals["M"]) / Math.pow(2.998e8, 2),
  },

  // --- QUANTUMFYSICA ---
  {
    id: "quant_de_broglie",
    name: "De Broglie Golflengte",
    formula: "lambda = h / p",
    latex: "\\lambda = \\frac{h}{p} = \\frac{h}{m \\cdot v}",
    description:
      "Golfeigenschappen van materie. Elk deeltje met impuls heeft een golflengte.",
    context: "Natuurkunde - Quantum",
    difficulty: "Expert",
    related: ["Golf-deeltje dualiteit"],
    symbolic: "lambda = h / (m * v)",
    binasTable: "35-E4",
    units: [
      { symbol: "lambda", name: "Golflengte", unit: "m", input: false },
      { symbol: "h", name: "Cst. van Planck", unit: "Js", input: true },
      { symbol: "m", name: "Massa", unit: "kg", input: true },
      { symbol: "v", name: "Snelheid", unit: "m/s", input: true },
    ],
    commonMistakes:
      "Geldt voor deeltjes met massa (niet voor fotonen met rustmassa 0, die hebben p=h/lambda).",
    calculate: (vals) => 6.626e-34 / (vals["m"] * vals["v"]),
  },
  {
    id: "quant_box_energy",
    name: "Energie in een put (1D)",
    formula: "En = (n^2 * h^2) / (8 * m * L^2)",
    latex: "E_n = n^2 \\frac{h^2}{8mL^2}",
    description:
      "De energieniveaus van een deeltje opgesloten in een eendimensionale doos.",
    context: "Natuurkunde - Quantum",
    difficulty: "Expert",
    related: ["Energielevels", "Quantum"],
    symbolic: "En = (n^2 * h^2) / (8 * m * L^2)",
    binasTable: "35-E4",
    units: [
      { symbol: "En", name: "Energie", unit: "J", input: false },
      { symbol: "n", name: "Quantumgetal", unit: "-", input: true },
      { symbol: "h", name: "Cst. van Planck", unit: "Js", input: true },
      { symbol: "m", name: "Massa", unit: "kg", input: true },
      { symbol: "L", name: "Breedte put", unit: "m", input: true },
    ],
    commonMistakes: "n mag niet 0 zijn (alleen 1, 2, 3...).",
    calculate: (vals) =>
      (Math.pow(vals["n"], 2) * Math.pow(6.626e-34, 2)) /
      (8 * vals["m"] * Math.pow(vals["L"], 2)),
  },

  // --- SCHEIKUNDE VERDIEPING ---
];
