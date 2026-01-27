import {
    Boxes,
    Brain,
    Code2,
    Database,
    Eye,
    FlaskConical,
    Heart,
    LucideIcon,
    MessageSquare,
    Mic,
    Search,
    Sparkles,
    Target,
    Video,
    Wrench,
} from "lucide-react";

import { ModelCapability } from "./ai-brain";

export type IntelligenceTier = "foundation" | "upgrade" | "frontier";

export interface IntelligenceDefinition {
    id: string;
    name: string;
    description: string;
    useCase: string;
    techStack: string[];
    capability: ModelCapability; // Real data mapping
    icon: LucideIcon;
    tier: IntelligenceTier;
}

export const ELITE_INTELLIGENCES: IntelligenceDefinition[] = [
    // Tier 1: De Fundering
    {
        id: "text",
        name: "Fast (Text)",
        description: "Snel tekst genereren en begrijpen.",
        useCase: "Chatten, samenvatten, vertalen.",
        techStack: ["gemini-1.5-flash", "gpt-4o-mini", "llama-3-8b"],
        capability: "fast",
        icon: MessageSquare,
        tier: "foundation"
    },
    {
        id: "logic",
        name: "Reasoning (Logic)",
        description: "Stapsgewijs redeneren (Chain of Thought).",
        useCase: "Wiskunde problems, logica, argumentatie.",
        techStack: ["deepseek-r1", "o1-preview", "gemini-1.5-pro"],
        capability: "reasoning",
        icon: Brain,
        tier: "foundation"
    },
    {
        id: "vision",
        name: "Vision (Analysis)",
        description: "Beeldherkenning & OCR.",
        useCase: "Huiswerk foto's, grafieken uitleggen.",
        techStack: ["gemini-1.5-flash-vision", "gpt-4o-vision"],
        capability: "vision",
        icon: Eye,
        tier: "foundation"
    },
    {
        id: "code",
        name: "Code (Syntax)",
        description: "Schrijven en uitleggen van code.",
        useCase: "Informatica, data-analyse, Python.",
        techStack: ["qwen-2.5-coder", "deepseek-coder", "gpt-4o"],
        capability: "code",
        icon: Code2,
        tier: "foundation"
    },
    {
        id: "embedding",
        name: "Embedding (Semantic)",
        description: "Betekenis omzetten in vectoren.",
        useCase: "Semantic search door PDFs.",
        techStack: ["text-embedding-004", "all-minilm-l6-v2"],
        capability: "embedding",
        icon: Database,
        tier: "foundation"
    },

    // Tier 2: De Extensies
    {
        id: "speech",
        name: "Auditief (Speech)",
        description: "Horen (STT) en Spreken (TTS).",
        useCase: "Hoorcolleges transcriberen, voorlezen.",
        techStack: ["whisper-large-v3", "eleven-multilingual-v2"],
        capability: "audio",
        icon: Mic,
        tier: "upgrade"
    },
    {
        id: "visual_gen",
        name: "Generatief Visueel",
        description: "Beelden creëren uit tekst.",
        useCase: "Illustraties voor verslagen.",
        techStack: ["flux-1-dev", "stable-diffusion-3"],
        capability: "fast", // Closest for generation speed
        icon: Sparkles,
        tier: "upgrade"
    },
    {
        id: "agentic",
        name: "Agentic (Action)",
        description: "Tools gebruiken & acties uitvoeren.",
        useCase: "Somtoday Proxy, agenda, API's.",
        techStack: ["gemini-1.5-pro-fc", "gpt-4o-tools"],
        capability: "function_calling",
        icon: Wrench,
        tier: "upgrade"
    },
    {
        id: "reranking",
        name: "Discriminatieve Reranking",
        description: "Precisie-selectie van resultaten.",
        useCase: "Perfecte bron vinden in 50+ PDFs.",
        techStack: ["cohere-rerank-v3", "bge-reranker-v2"],
        capability: "embedding",
        icon: Search,
        tier: "upgrade"
    },

    // Tier 3: De Frontier
    {
        id: "scientific",
        name: "Wetenschappelijk (Bio/Chem)",
        description: "Natuurwetten & moleculaire structuren.",
        useCase: "Eiwitvouwing visualiseren.",
        techStack: ["alphafold-3", "esmfold-v1"],
        capability: "reasoning",
        icon: FlaskConical,
        tier: "frontier"
    },
    {
        id: "spatial",
        name: "Ruimtelijk (3D)",
        description: "3D-objecten begrijpen/genereren.",
        useCase: "3D modellen tempels, Wiskunde D.",
        techStack: ["shap-e", "tripo-sr"],
        capability: "vision",
        icon: Boxes,
        tier: "frontier"
    },
    {
        id: "temporal",
        name: "Temporeel (Video)",
        description: "Tijd & Beweging simuleren.",
        useCase: "Natuurkunde simulaties in video.",
        techStack: ["sora-v1", "runway-gen-3"],
        capability: "vision",
        icon: Video,
        tier: "frontier"
    },
    {
        id: "emotional",
        name: "Emotioneel (Affective)",
        description: "Emoties & intonatie herkennen.",
        useCase: "Spreekbeurt feedback op toon.",
        techStack: ["hume-evi-2", "prosody-high-res"],
        capability: "audio",
        icon: Heart,
        tier: "frontier"
    },
    {
        id: "strategic",
        name: "Strategisch (RL)",
        description: "Lange termijn planning & RL.",
        useCase: "Studieplanning optimalisatie.",
        techStack: ["deep-rl-v5", "gpt-4o-long-context"],
        capability: "long_context",
        icon: Target,
        tier: "frontier"
    }
];
