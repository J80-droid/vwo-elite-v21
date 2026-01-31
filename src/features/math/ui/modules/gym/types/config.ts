import { LucideIcon } from "lucide-react";

export type GymThemeColor =
    | 'indigo' | 'cyan' | 'rose' | 'amber' | 'emerald' | 'blue'
    | 'purple' | 'orange' | 'lime' | 'fuchsia' | 'teal' | 'slate' | 'pink' | 'violet' | 'red';

export type ExamDomainType =
    // Exacte Vakken
    | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I"
    // Talen (A=Lezen, D=Schrijven, E=Literatuur)
    | "L-A" | "L-B" | "L-C" | "L-D" | "L-E"
    // Filosofie
    | "PH-A" | "PH-B" | "PH-C" | "PH-D" | "PH-E";

export type GymInputMode = 'text' | 'decimal' | 'fraction' | 'multiple-choice';

export interface GymModuleConfig {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    category: "math" | "physics" | "biology" | "english" | "philosophy" | "french" | "chemistry" | "dutch" | "economics" | "history" | "geography";

    // Centralized metadata
    isSpecial?: boolean;
    themeColor: GymThemeColor;
    examDomain?: ExamDomainType;
    inputMode: GymInputMode;
    rttiType?: 'R' | 'T1' | 'T2' | 'I'; // Cognitive Level (Reproductie, Training-1, Training-2, Inzicht)

    // Strategic Metadata
    examWeight?: number; // 1-10 priority
    isReadingIntensive?: boolean; // For WPM calculation
}
