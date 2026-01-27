/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { StudyMaterial } from "@features/library/types";
import React, { createContext, ReactNode, useContext, useState } from "react";

type LibraryModule = "browse" | "search" | "network";

interface LibraryContextType {
  activeModule: LibraryModule;
  setActiveModule: (module: LibraryModule) => void;

  // UI State
  isConsoleOpen: boolean;
  setIsConsoleOpen: (isOpen: boolean) => void;
  consoleHeight: number;
  setConsoleHeight: (height: number) => void;

  // Shared Data
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedSubject: string | null;
  setSelectedSubject: (subject: string | null) => void;

  // UI Actions State
  generatingId: string | null;
  setGeneratingId: (id: string | null) => void;
  summarizingId: string | null;
  setSummarizingId: (id: string | null) => void;

  // Results State
  quizResult: { flashcards: any[]; quiz: any[] } | null;
  setQuizResult: (result: { flashcards: any[]; quiz: any[] } | null) => void;
  summaryResult: { id: string; text: string } | null;
  setSummaryResult: (result: { id: string; text: string } | null) => void;

  // Data (can be populated by the main component or a hook)
  materials: StudyMaterial[];
  setMaterials: (materials: StudyMaterial[]) => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activeModule, setActiveModule] = useState<LibraryModule>("browse");
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [consoleHeight, setConsoleHeight] = useState(300);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);

  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<{
    flashcards: any[];
    quiz: any[];
  } | null>(null);
  const [summaryResult, setSummaryResult] = useState<{
    id: string;
    text: string;
  } | null>(null);

  return (
    <LibraryContext.Provider
      value={{
        activeModule,
        setActiveModule,
        isConsoleOpen,
        setIsConsoleOpen,
        consoleHeight,
        setConsoleHeight,
        searchQuery,
        setSearchQuery,
        selectedSubject,
        setSelectedSubject,
        materials,
        setMaterials,
        generatingId,
        setGeneratingId,
        summarizingId,
        setSummarizingId,
        quizResult,
        setQuizResult,
        summaryResult,
        setSummaryResult,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibraryContext = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibraryContext must be used within a LibraryProvider");
  }
  return context;
};
