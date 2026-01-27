/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppView } from "@shared/types/config";
import {
  BookOpen,
  Box,
  Brain,
  Calculator,
  Calendar,
  Camera,
  Code,
  Compass,
  Dna,
  FlaskConical,
  GraduationCap,
  Grid,
  Languages,
  Library,
  LucideIcon,
  Network,
} from "lucide-react";

export interface NavItem {
  id: AppView;
  path: string;
  icon: LucideIcon;
  iconColor: string;
  label: string;
  translationKey?: string; // Key in translations object
}

export interface NavSection {
  id: string;
  label: string;
  translationKey?: string; // Key in translations object
  items: NavItem[];
}

// Navigation configuration - single source of truth
export const NAVIGATION_SECTIONS: NavSection[] = [
  {
    id: "main",
    label: "Elite OS",
    translationKey: "main",
    items: [
      {
        id: AppView.DASHBOARD,
        path: "/",
        icon: Grid,
        iconColor: "text-sky-400",
        label: "Dashboard",
        translationKey: "dashboard",
      },
      {
        id: AppView.PLANNER,
        path: "/planner",
        icon: Calendar,
        iconColor: "text-amber-400",
        label: "Studieplanner",
        translationKey: "planner",
      },
      {
        id: AppView.SMART_LIBRARY,
        path: "/library",
        icon: Library,
        iconColor: "text-violet-400",
        label: "Bibliotheek",
        translationKey: "library",
      },
    ],
  },
  {
    id: "labs",
    label: "Labs",
    translationKey: "labs",
    items: [
      {
        id: AppView.MATH_LAB,
        path: "/math-modern",
        icon: Calculator,
        iconColor: "text-emerald-400",
        label: "Math Lab",
        translationKey: "math_lab",
      },
      {
        id: AppView.PHYSICS_LAB,
        path: "/physics",
        icon: Compass,
        iconColor: "text-blue-400",
        label: "Physics Lab",
        translationKey: "physics_lab",
      },
      {
        id: AppView.CHEM_LAB,
        path: "/chemistry",
        icon: FlaskConical,
        iconColor: "text-rose-400",
        label: "Chemistry Lab",
        translationKey: "chemistry_lab",
      },
      {
        id: AppView.BIOLOGY_LAB,
        path: "/biology",
        icon: Dna,
        iconColor: "text-teal-400",
        label: "Biology Lab",
        translationKey: "biology_lab",
      },
      {
        id: AppView.STUDIO_3D,
        path: "/3d-studio",
        icon: Box,
        iconColor: "text-cyan-400",
        label: "3D Lab",
        translationKey: "studio_3d",
      },
      {
        id: AppView.PHILOSOPHY_LAB,
        path: "/philosophy",
        icon: BookOpen,
        iconColor: "text-violet-400",
        label: "Philosophy Lab",
        translationKey: "philosophy_lab",
      },
      {
        id: AppView.PSYCHOLOGY_LAB,
        path: "/psychology",
        icon: Brain,
        iconColor: "text-amber-400",
        label: "Psychology Lab",
        translationKey: "psychology_lab",
      },
      {
        id: AppView.LANGUAGE_LAB,
        path: "/language",
        icon: Languages,
        iconColor: "text-orange-400",
        label: "Talen Lab",
        translationKey: "lang_lab",
      },
      {
        id: AppView.CODE_LAB,
        path: "/code",
        icon: Code,
        iconColor: "text-slate-400",
        label: "CodeLab",
        translationKey: "code_lab",
      },
      {
        id: AppView.AI_LAB,
        path: "/ailab",
        icon: Brain,
        iconColor: "text-electric",
        label: "AI Lab",
        translationKey: "ai_lab",
      },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    translationKey: "tools",
    items: [
      {
        id: AppView.BRAINSTORM,
        path: "/brainstorm",
        icon: Network,
        iconColor: "text-fuchsia-400",
        label: "Brainstorm",
        translationKey: "brainstorm",
      },
      {
        id: AppView.RESEARCH,
        path: "/research",
        icon: Camera,
        iconColor: "text-amber-300",
        label: "Research",
        translationKey: "research",
      },
    ],
  },
  {
    id: "testing",
    label: "Toetsing",
    translationKey: "testing",
    items: [
      {
        id: AppView.EXAM_CENTER,
        path: "/examen-centrum",
        icon: GraduationCap,
        iconColor: "text-yellow-500",
        label: "Examen Centrum",
        translationKey: "exam_center",
      },
    ],
  },
];

// Helper to get translated label
export const getNavLabel = (item: NavItem | NavSection, t: any): string => {
  if (item.translationKey && t?.nav?.[item.translationKey]) {
    return t.nav[item.translationKey];
  }
  return item.label;
};
