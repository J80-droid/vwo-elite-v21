import { z } from "zod";

import { aiGenerate } from "../../aiCascadeService";
import { getToolRegistry,type IToolHandler } from "../ToolRegistry";

// --- Tool Implementations ---

const GenerateLessonTool: IToolHandler = {
  name: "generate_lesson",
  category: "Education",
  description: "Genereert een gestructureerde les over een onderwerp",
  schema: z.object({
    topic: z.string().min(1),
    level: z.string().default("VWO"),
    format: z.string().optional().default("detailed"),
  }),
  async execute(params) {
    const { topic, level, format } = params as { topic: string; level: string; format: string };
    const prompt = `Genereer een ${format} les over het onderwerp "${topic}" voor niveau ${level}. 
        Zorg voor een duidelijke structuur met leerdoelen, uitleg, en een korte samenvatting.`;
    const systemPrompt = "Je bent een expert docent die complexe onderwerpen begrijpelijk uitlegt voor VWO leerlingen.";
    const content = await aiGenerate(prompt, { systemPrompt });
    return { topic, level, content };
  }
};

const GenerateStudyPlanTool: IToolHandler = {
  name: "generate_study_plan",
  category: "Education",
  description: "Maakt een studieplan voor examenvoorbereiding",
  schema: z.object({
    subject: z.string().min(1),
    deadline: z.string(),
    hours_per_week: z.number().optional().default(5),
  }),
  async execute(params) {
    const { subject, deadline, hours_per_week } = params as { subject: string; deadline: string; hours_per_week: number };
    const prompt = `Maak een studieplan voor het vak "${subject}" met examen deadline op ${deadline}. 
        Ik heb ${hours_per_week} uur per week beschikbaar. Verdeel de onderwerpen logisch over de tijd.`;
    const systemPrompt = "Je bent een studiecoach gespecialiseerd in examenvoorbereiding en planning.";
    const content = await aiGenerate(prompt, { systemPrompt });
    return { subject, deadline, plan: content };
  }
};

const GenerateFlashcardsTool: IToolHandler = {
  name: "generate_flashcards",
  category: "Education",
  description: "Maakt active recall flashcards van content",
  schema: z.object({
    content: z.string().min(1),
    count: z.number().optional().default(10),
  }),
  async execute(params) {
    const { content, count } = params as { content: string; count: number };
    const prompt = `Maak maximaal ${count} active recall flashcards gebaseerd op de volgende tekst:
        "${content}"
        Formatteer als een lijst met 'Vraag' en 'Antwoord'.`;
    const result = await aiGenerate(prompt, { systemPrompt: "Je bent een expert in active recall en flashcard creatie." });
    return { flashcards: result };
  }
};

const GenerateQuizTool: IToolHandler = {
  name: "generate_quiz",
  category: "Education",
  description: "Genereert meerkeuzevragen over een onderwerp",
  schema: z.object({
    topic: z.string().min(1),
    count: z.number().optional().default(5),
    difficulty: z.string().optional().default("medium"),
  }),
  async execute(params) {
    const { topic, count, difficulty } = params as { topic: string; count: number; difficulty: string };
    const prompt = `Genereer ${count} meerkeuzevragen over "${topic}" op ${difficulty} niveau. 
        Geef voor elke vraag de opties en het juiste antwoord met een korte uitleg.`;
    const result = await aiGenerate(prompt, { systemPrompt: "Je bent een toetsenmaker gespecialiseerd in formatieve evaluatie." });
    return { topic, difficulty, quiz: result };
  }
};

const ExplainConceptTool: IToolHandler = {
  name: "explain_concept",
  category: "Education",
  description: "Legt een concept uit met analogieën",
  schema: z.object({
    concept: z.string().min(1),
    audience: z.string().optional().default("VWO leerling"),
  }),
  async execute(params) {
    const { concept, audience } = params as { concept: string; audience: string };
    const prompt = `Leg het concept "${concept}" uit aan een ${audience}. Gebruik analogieën waar mogelijk.`;
    const result = await aiGenerate(prompt, { systemPrompt: "Je bent een expert in educatieve communicatie en analogieën." });
    return { concept, explanation: result };
  }
};

const SocraticCoachTool: IToolHandler = {
  name: "socratic_coach",
  category: "Education",
  description: "Stelt socratische vragen om zelfreflectie te stimuleren",
  schema: z.object({
    problem: z.string().min(1),
  }),
  async execute(params) {
    const { problem } = params as { problem: string };
    const prompt = `De leerling heeft een probleem met: "${problem}". 
        Stel één socratische vraag die de leerling helpt om zelf naar het antwoord te navigeren. Geef niet direct de oplossing.`;
    const result = await aiGenerate(prompt, { systemPrompt: "Je bent een Socratische coach die leerlingen helpt zelf na te denken." });
    return { question: result };
  }
};

const AnalyzeWeakPointsTool: IToolHandler = {
  name: "analyze_weak_points",
  category: "Education",
  description: "Analyseert zwakke punten van de student",
  schema: z.object({
    subject: z.string().optional().default("general"),
  }),
  async execute(params) {
    const { subject } = params as { subject: string };
    const studentData = JSON.stringify({ skillMatrix: {}, recentHistory: [] });
    const prompt = `Hier is de actuele voortgangsdata van de student: ${studentData}
        Analyseer specifiek voor het vak "${subject}" de zwakke punten. 
        Geef 3 concrete verbeterpunten en oefensuggesties.`;
    const analysis = await aiGenerate(prompt, { systemPrompt: "Je bent een data-gedreven didactisch expert die studenten-performance analyseert." });
    return { subject, analysis, basedOnData: true, source: "Elite Diagnostics Engine" };
  }
};

const GenerateMindMapTool: IToolHandler = {
  name: "generate_mind_map",
  category: "Education",
  description: "Genereert Mermaid mindmap code",
  schema: z.object({
    topic: z.string().min(1),
  }),
  async execute(params) {
    const { topic } = params as { topic: string };
    const prompt = `Genereer Mermaid mindmap code voor het onderwerp: "${topic}". 
        Maak een logische boomstructuur met minstens 3 niveaus diep. Geef ALLEEN de Mermaid code terug.`;
    const content = await aiGenerate(prompt, { systemPrompt: "Je bent een expert in visuele kennisorganisatie en Mermaid mindmap syntax." });
    return { success: true, topic, mind_map_code: content, type: "mermaid_mindmap" };
  }
};

// --- Registration Function ---

export function registerEducationTools(): void {
  const registry = getToolRegistry();
  registry.registerAll([
    GenerateLessonTool,
    GenerateStudyPlanTool,
    GenerateFlashcardsTool,
    GenerateQuizTool,
    ExplainConceptTool,
    SocraticCoachTool,
    AnalyzeWeakPointsTool,
    GenerateMindMapTool,
  ]);
  console.log("[EducationTools] Registered 8 tools.");
}
