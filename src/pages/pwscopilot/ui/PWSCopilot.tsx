/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic project state and AI response types */
import { ChatPanel, ChecklistWidget, SourcesPanel } from "@features/pws";
import {
  analyzePWSSources,
  checkAcademicWriting,
  checkOriginality,
  checkResearchDesign,
  findAcademicSources,
  generateAPACitations,
  generateLiteratureMatrix,
  summarizePaper,
} from "@shared/api/gemini";
import {
  useDeletePWSProject,
  usePWSProjects,
  useSavePWSProject,
  useSaveStudyMaterial,
  useStudyMaterialsByIds,
} from "@shared/hooks/useLocalData";
import { useSettings } from "@shared/hooks/useSettings";
import { useTranslations } from "@shared/hooks/useTranslations";
import {
  AcademicSearchResult,
  LiteratureMatrixEntry,
  PWS_CHECKLISTS,
  PWSLogEntry,
  PWSProject,
  StudyMaterial,
} from "@shared/types";
import React, { useEffect, useRef, useState } from "react";

interface PWSCopilotProps { }

export const PWSCopilot: React.FC<PWSCopilotProps> = () => {
  const { lang } = useTranslations();
  const { settings } = useSettings();
  const { data: projects = [], refetch: refetchProjects } = usePWSProjects();
  const saveProjectMutation = useSavePWSProject();
  const deleteProjectMutation = useDeletePWSProject();
  const saveMaterialMutation = useSaveStudyMaterial();

  const [activeProject, setActiveProject] = useState<PWSProject | null>(null);
  const [projectSources, setProjectSources] = useState<StudyMaterial[]>([]);
  const [activeTab, setActiveTab] = useState<
    "chat" | "writing" | "search" | "matrix" | "logbook" | "design"
  >("chat");

  // Phase Management
  const currentPhase = activeProject?.currentPhase || "Oriëntatie";
  const checklists = PWS_CHECKLISTS;

  // Chat state
  const [chatQuery, setChatQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { role: "user" | "ai"; content: string }[]
  >([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Writing state
  const [draftText, setDraftText] = useState("");
  const [writingFeedback, setWritingFeedback] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // New Project State
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectSubject, setNewProjectSubject] = useState("");
  const [newProjectQuestion, setNewProjectQuestion] = useState("");

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AcademicSearchResult[]>(
    [],
  );
  const [isSearching, setIsSearching] = useState(false);

  // Matrix State
  const [matrix, setMatrix] = useState<LiteratureMatrixEntry[]>([]);
  const [isGeneratingMatrix, setIsGeneratingMatrix] = useState(false);

  // Design Validator State
  const [designFeedback, setDesignFeedback] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [subQuestions, setSubQuestions] = useState("");

  // Summary State
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Ethics State
  const [originalityReport, setOriginalityReport] = useState<string | null>(
    null,
  );
  const [apaList, setApaList] = useState<string | null>(null);
  const [isCheckingEthics, setIsCheckingEthics] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch sources using hook based on active project
  const sourceIds = activeProject?.sources || [];
  const { data: fetchedSources = [] } = useStudyMaterialsByIds(sourceIds);

  // Sync sources when active project changes - using stable comparison
  const fetchedSourcesJSON = JSON.stringify(fetchedSources.map((s) => s.id));
  useEffect(() => {
    if (activeProject) {
      setProjectSources(fetchedSources);
    } else {
      setProjectSources([]);
      setChatHistory([]);
      setDraftText("");
      setWritingFeedback(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject?.id, fetchedSourcesJSON]);

  const handleCreateProject = async () => {
    if (!newProjectTitle || !newProjectSubject) return;

    const newProject: PWSProject = {
      id: crypto.randomUUID(),
      title: newProjectTitle,
      subject: newProjectSubject,
      researchQuestion: newProjectQuestion,
      sources: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveProjectMutation.mutateAsync(newProject);
    refetchProjects();
    setActiveProject(newProject);
    setIsCreating(false);
    setNewProjectTitle("");
    setNewProjectSubject("");
    setNewProjectQuestion("");
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Weet je zeker dat je dit project wilt verwijderen?")) {
      await deleteProjectMutation.mutateAsync(id);
      refetchProjects();
      if (activeProject?.id === id) setActiveProject(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !activeProject) return;

    const files: File[] = Array.from(e.target.files);
    const newSourceIds: string[] = [];

    for (const file of files) {
      const reader = new FileReader();

      await new Promise<void>((resolve) => {
        reader.onload = async (event) => {
          if (event.target?.result) {
            const base64 = (event.target.result as string).split(",")[1] || "";
            const material: StudyMaterial = {
              id: crypto.randomUUID(),
              name: file.name,
              subject: activeProject.subject,
              type: file.type === "application/pdf" ? "pdf" : "txt",
              content: base64,
              date: new Date().toISOString(),
              createdAt: Date.now(),
            };

            await saveMaterialMutation.mutateAsync(material);
            newSourceIds.push(material.id);
            resolve();
          }
        };

        if (file.type === "application/pdf") {
          reader.readAsDataURL(file); // Store full base64 for PDF
        } else {
          reader.readAsText(file); // Logic needs refining for text if we want base64, but keeping consistent
        }
      });
    }

    // Update Project Link
    const updatedProject = {
      ...activeProject,
      sources: [...activeProject.sources, ...newSourceIds],
      updatedAt: Date.now(),
    };

    await saveProjectMutation.mutateAsync(updatedProject);
    setActiveProject(updatedProject);

    // Reload list to update timestamps
    refetchProjects();
  };

  const handleChat = async () => {
    if (!chatQuery.trim() || !activeProject) return;

    const userMsg = chatQuery;
    setChatHistory((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatQuery("");
    setIsAnalyzing(true);

    try {
      const response = await analyzePWSSources(
        userMsg,
        projectSources,
        lang,
        settings.aiConfig,
      );
      setChatHistory((prev) => [...prev, { role: "ai", content: response }]);
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [
        ...prev,
        { role: "ai", content: "Fout bij analyseren van bronnen." },
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleWritingCheck = async () => {
    if (!draftText.trim()) return;
    setIsChecking(true);
    try {
      const feedback = await checkAcademicWriting(
        draftText,
        lang,
        settings.aiConfig,
      );
      setWritingFeedback(feedback);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChecking(false);
    }
  };

  const logAction = async (action: PWSLogEntry["action"], details: string) => {
    if (!activeProject) return;
    const entry: PWSLogEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      action,
      details,
      duration: 0,
    };
    const updated = {
      ...activeProject,
      logbook: [...(activeProject.logbook || []), entry],
      updatedAt: Date.now(),
    };
    await saveProjectMutation.mutateAsync(updated);
    setActiveProject(updated);
  };

  const handlePhaseChange = async (phase: any) => {
    if (!activeProject) return;
    const updated = {
      ...activeProject,
      currentPhase: phase,
      updatedAt: Date.now(),
    };
    await saveProjectMutation.mutateAsync(updated);
    setActiveProject(updated);
    logAction("research", `Fase gewijzigd naar ${phase}`);
  };

  const toggleChecklistItem = async (item: string) => {
    if (!activeProject) return;
    const currentChecks = activeProject.checklistProgress || {};
    const updatedChecks = { ...currentChecks, [item]: !currentChecks[item] };

    const updated = {
      ...activeProject,
      checklistProgress: updatedChecks,
      updatedAt: Date.now(),
    };
    await saveProjectMutation.mutateAsync(updated);
    setActiveProject(updated);
  };

  const handleOriginalityCheck = async () => {
    if (!draftText.trim()) return;
    setIsCheckingEthics(true);
    try {
      const res = await checkOriginality(
        draftText,
        projectSources,
        lang,
        settings.aiConfig,
      );
      setOriginalityReport(res);
      logAction("write", "Originaliteitscheck uitgevoerd");
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingEthics(false);
    }
  };

  const handleApaGen = async () => {
    if (!projectSources.length) return;
    setIsCheckingEthics(true);
    try {
      const res = await generateAPACitations(projectSources, settings.aiConfig);
      setApaList(res);
      logAction("research", "APA lijst gegenereerd");
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingEthics(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await findAcademicSources(
        searchQuery,
        lang,
        settings.aiConfig,
      );
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddSearchResult = async (result: AcademicSearchResult) => {
    if (!activeProject) return;
    const material: StudyMaterial = {
      id: crypto.randomUUID(),
      name: `[WEB] ${result.title}`,
      subject: activeProject.subject,
      type: "txt", // Treat as text for now
      content: `SOURCE: ${result.url}\nSNIPPET: ${result.snippet}\n\n(Full text not available unless PDF is uploaded)`,
      date: new Date().toISOString(),
      createdAt: Date.now(),
    };
    await saveMaterialMutation.mutateAsync(material);

    const updatedProject = {
      ...activeProject,
      sources: [...activeProject.sources, material.id],
      updatedAt: Date.now(),
    };
    await saveProjectMutation.mutateAsync(updatedProject);
    setActiveProject(updatedProject);
    // loadProjects(); // refresh not strictly needed if we update local state correct, but safe
    // Sources will auto-sync via hook when setActiveProject triggers re-render
    logAction("source", `Bron toegevoegd: ${result.title}`);
  };

  const handleGenerateMatrix = async () => {
    if (!projectSources.length) return;
    setIsGeneratingMatrix(true);
    try {
      const res = await generateLiteratureMatrix(
        projectSources,
        lang,
        settings.aiConfig,
      );
      setMatrix(res);
      logAction("research", "Literatuurmatrix gegenereerd");
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingMatrix(false);
    }
  };

  const handleSummarize = async (source: StudyMaterial) => {
    setIsSummarizing(true);
    setSummary(null); // Reset prev
    try {
      const text = await summarizePaper(
        source.content,
        lang,
        settings.aiConfig,
      );
      setSummary(text);
      logAction("research", `Samenvatting gegenereerd voor ${source.name}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleValidateDesign = async () => {
    if (!activeProject?.researchQuestion) return;
    setIsValidating(true);
    try {
      const feedback = await checkResearchDesign(
        activeProject.researchQuestion,
        subQuestions,
        activeProject.subject,
        lang,
        settings.aiConfig,
      );
      setDesignFeedback(feedback);
      logAction("research", "Onderzoeksopzet gevalideerd");
    } catch (e) {
      console.error(e);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 px-4 pb-12 max-w-7xl mx-auto">
      {/* Header with Phase Stepper */}
      <div className="flex flex-col mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <span className="text-3xl">✈️</span> PWS Co-Piloot
          </h1>
          <div className="flex gap-2">
            {activeProject &&
              Object.keys(PWS_CHECKLISTS).map((phase) => (
                <button
                  key={phase}
                  onClick={() => handlePhaseChange(phase)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${currentPhase === phase
                    ? "bg-electric text-obsidian-950"
                    : "bg-white/10 text-slate-400 hover:bg-white/20"
                    }`}
                >
                  {phase}
                </button>
              ))}
          </div>
        </div>
      </div>

      {!activeProject ? (
        // Project List & Creation
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create New Card */}
          <div
            onClick={() => setIsCreating(true)}
            className="glass p-8 rounded-xl border-2 border-dashed border-obsidian-800 hover:border-electric/50 cursor-pointer flex flex-col items-center justify-center text-center group h-64"
          >
            <div className="w-16 h-16 rounded-full bg-electric/10 flex items-center justify-center mb-4 group-hover:bg-electric/20 transition-colors">
              <span className="text-3xl text-electric">+</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Nieuw Project</h3>
            <p className="text-slate-500 text-sm">
              Start een nieuw PWS onderzoek
            </p>
          </div>

          {/* Existing Projects */}
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={() => setActiveProject(p)}
              className="glass p-6 rounded-xl border border-white/5 hover:border-electric/50 cursor-pointer transition-all flex flex-col h-64 relative group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-mono text-electric bg-electric/10 px-2 py-1 rounded">
                  {p.subject}
                </span>
                <button
                  onClick={(e) => handleDeleteProject(p.id, e)}
                  className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                {p.title}
              </h3>
              <p className="text-slate-400 text-sm mb-4 line-clamp-2 italic">
                "{p.researchQuestion || "Geen onderzoeksvraag"}"
              </p>
              <div className="mt-auto flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  {p.sources.length} bronnen
                </span>
                <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Active Project View
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[80vh]">
          {/* Left Sidebar: Sources & Checklist */}
          <div className="glass rounded-xl p-4 flex flex-col h-full lg:col-span-1 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setActiveProject(null)}
                className="text-slate-400 hover:text-white"
              >
                ← Projecten
              </button>
              <span className="text-xs text-slate-500">
                {projectSources.length} bronnen
              </span>
            </div>

            <h2
              className="font-bold text-white mb-2 line-clamp-1"
              title={activeProject.title}
            >
              {activeProject.title}
            </h2>
            <div className="text-xs text-electric mb-4 px-2 py-1 bg-electric/10 rounded inline-block self-start">
              Fase: {currentPhase}
            </div>

            {/* Checklist Widget - Using extracted component */}
            <ChecklistWidget
              currentPhase={currentPhase}
              checklist={
                checklists[currentPhase as keyof typeof checklists] || []
              }
              checklistProgress={activeProject.checklistProgress || {}}
              onToggle={toggleChecklistItem}
            />

            {/* Sources Panel - Using extracted component */}
            <SourcesPanel
              sources={projectSources}
              onSummarize={handleSummarize}
              onUpload={() => fileInputRef.current?.click()}
              fileInputRef={fileInputRef}
              onFileChange={handleFileUpload}
            />
          </div>

          {/* Main Area */}
          <div className="glass rounded-xl p-6 lg:col-span-3 flex flex-col h-full overflow-hidden">
            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10 mb-6 overflow-x-auto">
              {["chat", "writing", "search", "matrix", "logbook"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`pb-3 px-2 font-medium transition-colors capitalize whitespace-nowrap ${activeTab === tab
                    ? "text-electric border-b-2 border-electric"
                    : "text-slate-400 hover:text-white"
                    }`}
                >
                  {tab === "chat" && "Chat"}
                  {tab === "writing" && "Writing Lab"}
                  {tab === "search" && "Zoeken"}
                  {tab === "matrix" && "Literatuurmatrix"}
                  {tab === "design" && "Onderzoeksopzet"}
                  {tab === "logbook" && "Logboek"}
                </button>
              ))}
            </div>

            {/* Chat Tab - Using extracted component */}
            {activeTab === "chat" && (
              <ChatPanel
                chatHistory={chatHistory}
                chatQuery={chatQuery}
                isAnalyzing={isAnalyzing}
                onQueryChange={setChatQuery}
                onSend={handleChat}
              />
            )}

            {/* Writing Tab */}
            {activeTab === "writing" && (
              <div className="flex-1 flex gap-4 overflow-hidden">
                <div className="flex-1 flex flex-col">
                  <textarea
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    placeholder="Plak hier je concept tekst (inleiding, conclusie, etc.)..."
                    className="flex-1 bg-obsidian-950/50 border border-white/10 rounded-xl p-4 text-white resize-none outline-none focus:border-electric/50 focus:ring-2 focus:ring-electric/20 font-mono text-sm leading-relaxed transition-all"
                  />
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleWritingCheck}
                      disabled={isChecking || !draftText.trim()}
                      className="
                        flex-1 relative py-3 rounded-xl overflow-hidden 
                        bg-white/5 border border-gold/30 backdrop-blur-3xl
                        text-gold font-bold transition-all duration-300
                        hover:scale-[1.02] active:scale-[0.98] 
                        hover:border-gold/60 hover:shadow-[0_0_30px_rgba(234,179,8,0.15)]
                        disabled:opacity-50 disabled:hover:scale-100
                      "
                    >
                      <div className="absolute inset-0 bg-gold/5 opacity-0 hover:opacity-100 transition-opacity" />
                      <span className="relative z-10">{isChecking ? "Tekst Analyseren..." : "Tooncheck"}</span>
                    </button>
                    <button
                      onClick={handleOriginalityCheck}
                      disabled={isCheckingEthics || !draftText.trim()}
                      className="
                        flex-1 relative py-3 rounded-xl overflow-hidden 
                        bg-white/5 border border-white/10 backdrop-blur-3xl
                        text-white font-bold transition-all duration-300
                        hover:scale-[1.02] active:scale-[0.98] 
                        hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]
                        disabled:opacity-50 disabled:hover:scale-100
                      "
                    >
                      <span className="relative z-10">Originaliteit</span>
                    </button>
                    <button
                      onClick={handleApaGen}
                      disabled={isCheckingEthics || projectSources.length === 0}
                      className="
                        flex-1 relative py-3 rounded-xl overflow-hidden 
                        bg-white/5 border border-white/10 backdrop-blur-3xl
                        text-white font-bold transition-all duration-300
                        hover:scale-[1.02] active:scale-[0.98] 
                        hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]
                        disabled:opacity-50 disabled:hover:scale-100
                      "
                    >
                      <span className="relative z-10">Bronnenlijst (APA)</span>
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4">
                  {writingFeedback && (
                    <div className="bg-obsidian-950 border border-white/10 rounded-lg p-6">
                      <h3 className="text-lg font-bold text-white mb-4">
                        Feedback Rapport
                      </h3>
                      <div className="prose prose-invert prose-sm">
                        <div className="whitespace-pre-wrap text-slate-300">
                          {writingFeedback}
                        </div>
                      </div>
                    </div>
                  )}
                  {originalityReport && (
                    <div className="bg-obsidian-950 border border-red-500/30 rounded-lg p-6">
                      <h3 className="text-lg font-bold text-red-400 mb-4">
                        Originaliteits Rapport
                      </h3>
                      <div className="prose prose-invert prose-sm">
                        <div className="whitespace-pre-wrap text-slate-300">
                          {originalityReport}
                        </div>
                      </div>
                    </div>
                  )}
                  {apaList && (
                    <div className="bg-obsidian-950 border border-blue-500/30 rounded-lg p-6">
                      <h3 className="text-lg font-bold text-blue-400 mb-4">
                        APA Literatuurlijst
                      </h3>
                      <pre className="whitespace-pre-wrap text-slate-300 text-xs font-mono bg-black/20 p-4 rounded">
                        {apaList}
                      </pre>
                      <button
                        onClick={() => navigator.clipboard.writeText(apaList)}
                        className="mt-2 text-xs text-electric hover:underline"
                      >
                        Kopiëren naar klembord
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "search" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Onderzoeksvraag or onderwerp..."
                    className="flex-1 bg-obsidian-950/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-electric/50 focus:ring-2 focus:ring-electric/20 transition-all"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="
                      group relative px-8 py-3 rounded-xl overflow-hidden 
                      bg-white/5 border border-indigo-500/30 backdrop-blur-3xl
                      text-white font-bold transition-all duration-300
                      hover:scale-[1.05] active:scale-[0.95] 
                      hover:border-indigo-500/60 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]
                      disabled:opacity-50
                      flex items-center justify-center
                    "
                  >
                    <div className="absolute inset-0 bg-indigo-500/5 group-hover:opacity-100 opacity-0 transition-opacity" />
                    <span className="relative z-10">
                      {isSearching ? (
                        <span className="animate-spin inline-block">⌛</span>
                      ) : (
                        "Zoeken"
                      )}
                    </span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {searchResults.length === 0 && !isSearching && (
                    <div className="text-center text-slate-500 mt-20">
                      <p className="text-lg">
                        Zoek naar wetenschappelijke bronnen.
                      </p>
                      <p className="text-sm">
                        Resultaten worden Powered by Google.
                      </p>
                    </div>
                  )}
                  {searchResults.map((result) => (
                    <div
                      key={result.url}
                      className="bg-obsidian-950 p-4 rounded-xl border border-white/10 hover:border-electric/50 transition-colors"
                    >
                      <h3 className="text-lg font-bold text-white mb-1">
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-electric hover:underline"
                        >
                          {result.title}
                        </a>
                      </h3>
                      <p className="text-xs text-green-400 mb-2 truncate">
                        {result.url}
                      </p>
                      <p className="text-sm text-slate-300 mb-3">
                        {result.snippet}
                      </p>
                      <button
                        onClick={() => handleAddSearchResult(result)}
                        className="text-xs bg-white/10 hover:bg-electric hover:text-obsidian-950 text-white px-3 py-1.5 rounded transition-all"
                      >
                        + Toevoegen aan bronnen
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "logbook" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">
                    Logboek & Voortgang
                  </h3>
                  <div className="text-sm text-slate-400">
                    Totaal: {(activeProject.logbook || []).length} items
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 bg-obsidian-950 rounded-xl border border-white/10 p-4">
                  {(!activeProject.logbook ||
                    activeProject.logbook.length === 0) && (
                      <div className="text-center text-slate-500 py-10">
                        Nog geen activiteiten gelogd. Start met onderzoek!
                      </div>
                    )}
                  {[...(activeProject.logbook || [])].reverse().map((entry) => (
                    <div
                      key={entry.id}
                      className="flex gap-4 p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                    >
                      <div className="w-24 text-xs text-slate-500 font-mono">
                        {new Date(entry.timestamp).toLocaleDateString()}
                        <br />
                        {new Date(entry.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded uppercase font-bold
                                                        ${entry.action === "source" ? "bg-green-500/20 text-green-400" : ""}
                                                        ${entry.action === "write" ? "bg-blue-500/20 text-blue-400" : ""}
                                                        ${entry.action === "research" ? "bg-purple-500/20 text-purple-400" : ""}
                                                        ${entry.action === "chat" ? "bg-yellow-500/20 text-yellow-400" : ""}
                                                    `}
                          >
                            {entry.action}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm">
                          {entry.details}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "matrix" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">
                    Literatuur Matrix
                  </h3>
                  <button
                    onClick={handleGenerateMatrix}
                    disabled={isGeneratingMatrix || projectSources.length === 0}
                    className="bg-electric hover:bg-electric-glow text-obsidian-950 font-bold px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {isGeneratingMatrix
                      ? "Genereren..."
                      : "Matrix Genereren met AI"}
                  </button>
                </div>

                <div className="flex-1 overflow-auto border border-white/10 rounded-xl bg-obsidian-950">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-white/5 text-white sticky top-0">
                      <tr>
                        <th className="p-3">Titel</th>
                        <th className="p-3">Jaar</th>
                        <th className="p-3">Methode</th>
                        <th className="p-3">Resultaten</th>
                        <th className="p-3">Conclusie</th>
                        <th className="p-3">Relevantie</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {matrix.map((row, i) => (
                        <tr key={i} className="hover:bg-white/5">
                          <td className="p-3 font-medium text-white">
                            {row.title}
                          </td>
                          <td className="p-3">{row.year}</td>
                          <td className="p-3 text-xs">{row.method}</td>
                          <td className="p-3 text-xs">{row.results}</td>
                          <td className="p-3 text-xs">{row.conclusion}</td>
                          <td className="p-3 text-xs text-electric">
                            {row.relevance}
                          </td>
                        </tr>
                      ))}
                      {matrix.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-8 text-center text-slate-500"
                          >
                            Nog geen matrix. Klik op genereren om je bronnen te
                            vergelijken.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "design" && (
              <div className="flex-1 flex gap-6 overflow-hidden">
                <div className="w-1/2 flex flex-col space-y-4 overflow-y-auto pr-2">
                  <h3 className="text-lg font-bold text-white">
                    Onderzoeksopzet
                  </h3>

                  <div>
                    <label className="block text-slate-400 text-sm mb-1">
                      Hoofdvraag
                    </label>
                    <textarea
                      value={activeProject.researchQuestion}
                      onChange={(e) => {
                        const updated = {
                          ...activeProject,
                          researchQuestion: e.target.value,
                        };
                        setActiveProject(updated as any);
                        saveProjectMutation.mutate(updated as any);
                      }}
                      className="w-full bg-obsidian-950/50 border border-white/10 rounded-xl p-3 text-white h-24 resize-none focus:border-electric/50 focus:ring-2 focus:ring-electric/20 outline-none transition-all"
                      placeholder="Wat is de invloed van..."
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-sm mb-1">
                      Deelvragen (één per regel)
                    </label>
                    <textarea
                      value={subQuestions}
                      onChange={(e) => setSubQuestions(e.target.value)}
                      className="w-full bg-obsidian-950/50 border border-white/10 rounded-xl p-3 text-white h-32 resize-none focus:border-electric/50 focus:ring-2 focus:ring-electric/20 outline-none transition-all"
                      placeholder="- Wat is X?\n- Hoe werkt Y?"
                    />
                  </div>

                  <button
                    onClick={handleValidateDesign}
                    disabled={isValidating || !activeProject.researchQuestion}
                    className="w-full bg-electric hover:bg-electric-glow text-obsidian-950 font-bold py-3 rounded-lg transition-all disabled:opacity-50"
                  >
                    {isValidating ? "Beoordelen..." : "Valideer Mijn Opzet 🕵️‍♂️"}
                  </button>
                </div>

                <div className="w-1/2 bg-obsidian-950 border border-white/10 rounded-xl p-6 overflow-y-auto">
                  <h3 className="text-lg font-bold text-white mb-4">
                    Feedback & Hypotheses
                  </h3>
                  {!designFeedback ? (
                    <div className="text-center text-slate-500 py-10">
                      Voer je vragen in en klik op Valideer om AI-feedback te
                      krijgen.
                    </div>
                  ) : (
                    <div className="prose prose-invert prose-sm">
                      <div className="whitespace-pre-wrap text-slate-300">
                        {designFeedback}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {summary && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSummary(null)}
        >
          <div
            className="glass p-6 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">
                Samenvatting (VWO Niveau)
              </h2>
              <button
                onClick={() => setSummary(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-slate-300">
                {summary}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay Summary */}
      {isSummarizing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-obsidian-950 p-4 rounded-xl border border-white/10 text-white flex gap-3">
            <span className="animate-spin">⌛</span> Paper vertalen &
            samenvatten...
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="glass p-8 rounded-xl max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-6">
              Nieuw PWS Project
            </h2>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-slate-400 text-sm mb-1">
                  Titel
                </label>
                <input
                  type="text"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="Bijv. De Energietransitie"
                  className="w-full bg-obsidian-950 border border-obsidian-800 rounded px-4 py-2 text-white outline-none focus:border-electric"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">Vak</label>
                <select
                  value={newProjectSubject}
                  onChange={(e) => setNewProjectSubject(e.target.value)}
                  className="w-full bg-obsidian-950/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-electric/50 focus:ring-2 focus:ring-electric/20 appearance-none transition-all"
                >
                  <option value="">Kies een vak...</option>
                  <option value="Natuurkunde">Natuurkunde</option>
                  <option value="Scheikunde">Scheikunde</option>
                  <option value="Biologie">Biologie</option>
                  <option value="Wiskunde B">Wiskunde B</option>
                  <option value="Geschiedenis">Geschiedenis</option>
                  <option value="Aardrijkskunde">Aardrijkskunde</option>
                  <option value="Economie">Economie</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">
                  Onderzoeksvraag
                </label>
                <textarea
                  value={newProjectQuestion}
                  onChange={(e) => setNewProjectQuestion(e.target.value)}
                  placeholder="Wat is de hoofdvraag van je onderzoek?"
                  className="w-full bg-obsidian-950 border border-obsidian-800 rounded px-4 py-2 text-white outline-none focus:border-electric h-24 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsCreating(false)}
                className="flex-1 bg-obsidian-800 text-white py-3 rounded-lg hover:bg-obsidian-700 font-medium"
              >
                Annuleren
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectTitle || !newProjectSubject}
                className="flex-1 bg-electric text-obsidian-950 py-3 rounded-lg hover:bg-electric-glow font-bold disabled:opacity-50"
              >
                Project Starten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
