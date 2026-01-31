import { GymEngineCard, GymSession, SessionConfigModal } from "@features/math";
import { useGymProgress } from "@shared/hooks/useGymProgress";
import {
    BookOpen,
    FileText,
    GitBranch,
    Languages,
    Library,
    PenTool,
    Search,
    Type,
    Zap,
} from "lucide-react";
import React, { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { DUTCH_ENGINES } from "./engines";

export const DutchGymStage: React.FC = () => {
    const { stats } = useGymProgress();
    const { submodule: activeSession } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [selectedEngine, setSelectedEngine] = useState<{
        id: string;
        title: string;
    } | null>(null);

    const questionCount = parseInt(searchParams.get("n") || "10");

    if (activeSession) {
        return (
            <GymSession
                engineId={activeSession}
                engine={DUTCH_ENGINES[activeSession as keyof typeof DUTCH_ENGINES]}
                onExit={() => navigate("/language/nl/gym")}
                questionCount={questionCount}
            />
        );
    }

    const handleStartSession = (count: number) => {
        if (selectedEngine) {
            navigate(`/language/nl/gym/${selectedEngine.id}?n=${count}`);
            setSelectedEngine(null);
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto p-4 md:p-8 relative selection:bg-orange-500/30 font-outfit">
            {/* Dutch Theme Background: Orange/Cyan Glow */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/5 blur-[120px] pointer-events-none" />

            <div className="max-w-6xl mx-auto pb-32 relative z-10">
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-8 border-b border-white/5 pb-12">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1 border-l border-orange-500/50 pl-4 py-2 bg-gradient-to-r from-orange-500/10 to-transparent pointer-events-none w-fit">
                            <div className="text-[10px] uppercase font-black text-orange-500 tracking-[0.2em]">
                                Taalbeheersing Engine
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono italic">
                                "Meesterschap in de Moerstaal"
                            </div>
                        </div>
                        <h2 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                            Nederlands{" "}
                            <span className="text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                                Gym
                            </span>
                        </h2>
                        <p className="text-slate-400 max-w-lg text-lg font-medium leading-relaxed opacity-80">
                            Slijp je vaardigheden voor het centraal examen. Van tekstverklaren tot foutloze spelling.
                        </p>
                    </div>

                    <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
                        <Languages className="text-orange-500 animate-pulse" size={16} />
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Drill Status: <span className="text-white">Active</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* SPECIAL: THE DUTCH SHAKE */}
                    <GymEngineCard
                        id="mix-dutch"
                        title="Hollandse Nieuwe"
                        description="De totale test. Een vlijmscherpe mix van spelling, argumentatie, woordenschat en literatuur."
                        icon={<BookOpen size={32} className="text-orange-500" />}
                        difficulty={Math.max(
                            1,
                            Math.round(
                                Object.values(stats.levels || {}).reduce((a: number, b: number) => a + b, 0) /
                                (Object.keys(stats.levels || {}).length || 1),
                            ),
                        )}
                        onClick={() =>
                            setSelectedEngine({
                                id: "mix-dutch",
                                title: "Hollandse Nieuwe",
                            })
                        }
                    />

                    {/* ENGINE 1: ARGUMENTATIE */}
                    <GymEngineCard
                        id="argumentation-logic"
                        title="Drogreden Detector"
                        description="Herken cirkelredeneringen en drogredenen in een oogwenk."
                        icon={<GitBranch size={32} />}
                        difficulty={stats.levels?.["argumentation-logic"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "argumentation-logic", title: "Drogreden Detector" })
                        }
                    />

                    {/* ENGINE 2: SPELLING ALGO */}
                    <GymEngineCard
                        id="spelling-algo"
                        title="Spelling Specialist"
                        description="Wordt of wordt? Oneindig oefenen met werkwoordspelling en 't kofschip."
                        icon={<Type size={32} />}
                        difficulty={stats.levels?.["spelling-algo"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "spelling-algo", title: "Spelling Specialist" })
                        }
                    />

                    {/* ENGINE 3: ZINSONTLEDING */}
                    <GymEngineCard
                        id="sentence-analysis"
                        title="Zinsontleder"
                        description="Vind de PV en het onderwerp. Cruciaal voor foutloze zinnen en congruentie."
                        icon={<Search size={32} />}
                        difficulty={stats.levels?.["sentence-analysis"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "sentence-analysis", title: "Zinsontleder" })
                        }
                    />

                    {/* ENGINE 4: VOCAB EXPERT */}
                    <GymEngineCard
                        id="vocab-expert"
                        title="Cito Woordenschat"
                        description="Beheers de academische taal van het examen. Bagatelliseren tot nuanceren."
                        icon={<Zap size={32} />}
                        difficulty={stats.levels?.["vocab-expert"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "vocab-expert", title: "Cito Woordenschat" })
                        }
                    />

                    {/* ENGINE 5: STIJLFOUUTEN */}
                    <GymEngineCard
                        id="style-polish"
                        title="Stijl Politie"
                        description="Spoor pleonasmen, contaminaties en tautologieën op."
                        icon={<PenTool size={32} />}
                        difficulty={stats.levels?.["style-polish"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "style-polish", title: "Stijl Politie" })
                        }
                    />

                    {/* ENGINE 6: LITERATURE */}
                    <GymEngineCard
                        id="literature-quiz"
                        title="Canon Kenner"
                        description="Test je kennis over stromingen, klassieke werken en literaire begrippen."
                        icon={<Library size={32} />}
                        difficulty={stats.levels?.["literature-quiz"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "literature-quiz", title: "Canon Kenner" })
                        }
                    />

                    {/* ENGINE 7: TEXT ANATOMY */}
                    <GymEngineCard
                        id="text-anatomy"
                        title="Tekst Anatomie"
                        description="Signaalwoorden, tekstdoelen en de structuur van complexe teksten."
                        icon={<FileText size={32} />}
                        difficulty={stats.levels?.["text-anatomy"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "text-anatomy", title: "Tekst Anatomie" })
                        }
                    />
                </div>
            </div>

            <SessionConfigModal
                isOpen={!!selectedEngine}
                title={selectedEngine?.title || ""}
                onClose={() => setSelectedEngine(null)}
                onSelect={handleStartSession}
            />
        </div>
    );
};
