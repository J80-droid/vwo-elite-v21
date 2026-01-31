import { GymEngineCard, GymSession, SessionConfigModal } from "@features/math";
import { useGymProgress } from "@shared/hooks/useGymProgress";
import {
    GraduationCap,
    Languages,
    Library,
    MoveHorizontal,
    Music,
    PenTool,
    RefreshCw,
    Repeat,
    Search,
    Sparkles,
    Target,
    Type,
    Zap,
} from "lucide-react";
import React, { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { ENGLISH_ENGINES } from "./engines";

export const EnglishGymStage: React.FC = () => {
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
                engine={ENGLISH_ENGINES[activeSession as keyof typeof ENGLISH_ENGINES]}
                onExit={() => navigate("/language/en/gym")}
                questionCount={questionCount}
            />
        );
    }

    const handleStartSession = (count: number) => {
        if (selectedEngine) {
            navigate(`/language/en/gym/${selectedEngine.id}?n=${count}`);
            setSelectedEngine(null);
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto p-4 md:p-8 relative selection:bg-orange-500/30 font-outfit">
            {/* English Theme Background: Orange/Indigo Glow */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/5 blur-[120px] pointer-events-none" />

            <div className="max-w-6xl mx-auto pb-32 relative z-10">
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-8 border-b border-white/5 pb-12">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1 border-l border-orange-500/50 pl-4 py-2 bg-gradient-to-r from-orange-500/10 to-transparent pointer-events-none w-fit">
                            <div className="text-[10px] uppercase font-black text-orange-500 tracking-[0.2em]">
                                Linguistic Drill Engine
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono italic">
                                "Native Fluency through Discipline"
                            </div>
                        </div>
                        <h2 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                            English{" "}
                            <span className="text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                                Gym
                            </span>
                        </h2>
                        <p className="text-slate-400 max-w-lg text-lg font-medium leading-relaxed opacity-80">
                            Beheers de nuances van de Engelse taal. Van academisch vocabulair tot literaire analyse.
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
                    {/* SPECIAL: THE ENGLISH BREAKFAST */}
                    <GymEngineCard
                        id="mix-english"
                        title="English Breakfast"
                        description="The ultimate blend. Random drills covering grammar, vocab and analysis."
                        icon={<Languages size={32} className="text-orange-500" />}
                        difficulty={Math.max(
                            1,
                            Math.round(
                                Object.values(stats.levels || {}).reduce((a: number, b: number) => a + b, 0) /
                                (Object.keys(stats.levels || {}).length || 1),
                            ),
                        )}
                        onClick={() =>
                            setSelectedEngine({
                                id: "mix-english",
                                title: "English Breakfast",
                            })
                        }
                    />

                    {/* SPECIAL: INFINITE ENGLISH (AI) */}
                    <GymEngineCard
                        id="infinite-english"
                        title="Oxford AI Unlimited"
                        description="Grammar, Vocab & Idioms. Never the same question twice."
                        icon={<Sparkles size={32} className="text-orange-500" />}
                        difficulty={stats.levels?.["infinite-english"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "infinite-english", title: "Oxford AI Unlimited" })
                        }
                    />

                    {/* ENGINE 1: GRAMMAR */}
                    <GymEngineCard
                        id="grammar-precision"
                        title="Grammar Police"
                        description="Tenses, conditionals and syntax. Stop making rookie mistakes."
                        icon={<Type size={32} />}
                        difficulty={stats.levels?.["grammar-precision"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "grammar-precision", title: "Grammar Police" })
                        }
                    />

                    {/* ENGINE 2: IRREGULAR VERBS */}
                    <GymEngineCard
                        id="irregular-verbs"
                        title="Verb Vibe"
                        description="Master the irregular verbs once and for all. Infinite drill patterns."
                        icon={<RefreshCw size={32} />}
                        difficulty={stats.levels?.["irregular-verbs"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "irregular-verbs", title: "Verb Vibe" })
                        }
                    />

                    {/* ENGINE 3: STYLE SHIFTER */}
                    <GymEngineCard
                        id="sentence-shifter"
                        title="Style Shifter"
                        description="Passive Voice and Inversion. Elite level writing skills for VWO."
                        icon={<Repeat size={32} />}
                        difficulty={stats.levels?.["sentence-shifter"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "sentence-shifter", title: "Style Shifter" })
                        }
                    />

                    {/* ENGINE 3: VOCAB ACADEMIC */}
                    <GymEngineCard
                        id="vocab-academic"
                        title="Academic Vocab"
                        description="Master the 1000 most common academic words for VWO exams."
                        icon={<Library size={32} />}
                        difficulty={stats.levels?.["vocab-academic"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "vocab-academic", title: "Academic Vocab" })
                        }
                    />

                    {/* ENGINE 4: SIGNAL DETECTIVE */}
                    <GymEngineCard
                        id="signal-detective"
                        title="Signaal Scanner"
                        description="Connectors and transitions. Understand the flow of any text."
                        icon={<Target size={32} />}
                        difficulty={stats.levels?.["signal-detective"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "signal-detective", title: "Signaal Scanner" })
                        }
                    />

                    {/* ENGINE 5: FORMAL WRITER */}
                    <GymEngineCard
                        id="formal-writer"
                        title="Essay Engineer"
                        description="Master formal register for essays and correspondence. Perfect for school exams."
                        icon={<PenTool size={32} />}
                        difficulty={stats.levels?.["formal-writer"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "formal-writer", title: "Essay Engineer" })
                        }
                    />

                    {/* ENGINE 5: IDIOMS */}
                    <GymEngineCard
                        id="idiom-impact"
                        title="Idiom Impact"
                        description="Unlock the secrets of English idioms and figurative language."
                        icon={<Sparkles size={32} />}
                        difficulty={stats.levels?.["idiom-impact"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "idiom-impact", title: "Idiom Impact" })
                        }
                    />

                    {/* ENGINE 6: LIT TERMS */}
                    <GymEngineCard
                        id="lit-terms"
                        title="Literary Lens"
                        description="Similes, metaphors, and omniscient narrators. Analyse like a pro."
                        icon={<Sparkles size={32} />}
                        difficulty={stats.levels?.["lit-terms"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "lit-terms", title: "Literary Lens" })
                        }
                    />

                    {/* ENGINE 7: REFERENCE WORDS */}
                    <GymEngineCard
                        id="reference-radar"
                        title="Reference Radar"
                        description="Track down what 'this', 'that' and 'which' actually refer to."
                        icon={<Zap size={32} />}
                        difficulty={stats.levels?.["reference-radar"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "reference-radar", title: "Reference Radar" })
                        }
                    />

                    {/* ENGINE 9: FUNCTION FINDER */}
                    <GymEngineCard
                        id="function-finder"
                        title="Function Factory"
                        description="Determine the role of paragraphs and sentences in the text."
                        icon={<Search size={32} />}
                        difficulty={stats.levels?.["function-finder"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "function-finder", title: "Function Factory" })
                        }
                    />

                    {/* ENGINE 10: TONE TUNER */}
                    <GymEngineCard
                        id="tone-tuner"
                        title="Tone Tuner"
                        description="Identify mocking, laudatory, or detached tones in Cito texts."
                        icon={<Music size={32} />}
                        difficulty={stats.levels?.["tone-tuner"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "tone-tuner", title: "Tone Tuner" })
                        }
                    />

                    {/* ENGINE 11: COLLOCATION KING */}
                    <GymEngineCard
                        id="collocation-king"
                        title="Collocation King"
                        description="Learn to speak naturally. Stop 'making' homework and start 'doing' it."
                        icon={<MoveHorizontal size={32} />}
                        difficulty={stats.levels?.["collocation-king"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "collocation-king", title: "Collocation King" })
                        }
                    />

                    {/* ENGINE 12: LIT HISTORY */}
                    <GymEngineCard
                        id="lit-history-en"
                        title="Lit History"
                        description="Van Shakespeare tot Orwell. Master the periods of English literature."
                        icon={<GraduationCap size={32} />}
                        difficulty={stats.levels?.["lit-history-en"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "lit-history-en", title: "Lit History" })
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
