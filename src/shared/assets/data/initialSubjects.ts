import { LibrarySubject } from "@shared/types/library";
import {
  BookOpen,
  Brain,
  Cpu,
  Heart,
  Languages,
  Navigation,
  Search,
  Zap,
} from "lucide-react";

// Data aligned with NavigationData and user screenshot
// Mock Data "Elite" style
export const INITIAL_SUBJECTS: LibrarySubject[] = [
  {
    id: "1",
    name: "library.subjects.math_b",
    legacyName: "Wiskunde B",
    theme: "blue",
    icon: Zap,
  },
  {
    id: "2",
    name: "library.subjects.physics",
    legacyName: "Natuurkunde",
    theme: "red",
    icon: BookOpen,
  },
  {
    id: "3",
    name: "library.subjects.chem",
    legacyName: "Scheikunde",
    theme: "yellow",
    icon: Search,
  },
  {
    id: "7",
    name: "library.subjects.french",
    legacyName: "Frans",
    theme: "orange",
    icon: Navigation,
  },
  {
    id: "6",
    name: "library.subjects.english",
    legacyName: "Engels",
    theme: "purple",
    icon: Languages,
  },
  {
    id: "5",
    name: "library.subjects.dutch",
    legacyName: "Nederlands",
    theme: "cyan",
    icon: BookOpen,
  },
  {
    id: "8",
    name: "library.subjects.philosophy",
    legacyName: "Filosofie",
    theme: "pink",
    icon: Brain,
  },
  {
    id: "psychology",
    name: "library.subjects.psychology",
    legacyName: "Psychologie",
    theme: "red",
    icon: Heart,
  },
  {
    id: "10",
    name: "library.subjects.cs",
    legacyName: "Informatica",
    theme: "emerald",
    icon: Cpu,
  },
];
