import { GymEngineCard, GymSession, SessionConfigModal } from "@features/math";
import { useGymProgress } from "@shared/hooks/useGymProgress";
import {
    Brain,
    Compass,
    FileText,
    History,
    Lightbulb,
    Scale,
    Scroll,
    Sword,
    Zap,
} from "lucide-react";
import React, { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { PHILOSOPHY_ENGINES } from "./engines";

interface PhilosophyGymStageProps {
    embedded?: boolean;
}

export const PhilosophyGymStage: React.FC<PhilosophyGymStageProps> = ({ embedded = false }) => {
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
                engine={PHILOSOPHY_ENGINES[activeSession as keyof typeof PHILOSOPHY_ENGINES]}
                onExit={() => navigate("/philosophy/gym")}
                questionCount={questionCount}
            />
        );
    }

    const handleStartSession = (count: number) => {
        if (selectedEngine) {
            navigate(`/philosophy/gym/${selectedEngine.id}?n=${count}`);
            setSelectedEngine(null);
        }
    };

    const containerClasses = embedded
        ? "w-full"
        : "h-full w-full overflow-y-auto p-4 md:p-8 relative selection:bg-purple-500/30 font-outfit";

    return (
        <div className={containerClasses}>
            {/* Philosophy Theme Background: Purple Glow - Only if not embedded */}
            {!embedded && <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/5 blur-[120px] pointer-events-none" />}

            <div className={`${embedded ? "" : "max-w-6xl mx-auto pb-32 relative z-10"}`}>
                {!embedded && (
                    <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-8 border-b border-white/5 pb-12">
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1 border-l border-purple-500/50 pl-4 py-2 bg-gradient-to-r from-purple-500/10 to-transparent pointer-events-none w-fit">
                                <div className="text-[10px] uppercase font-black text-purple-500 tracking-[0.2em]">
                                    Socratic Drill Engine
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono italic">
                                    "Thought through Repetition"
                                </div>
                            </div>
                            <h2 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                                Philosophy{" "}
                                <span className="text-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                                    Gym
                                </span>
                            </h2>
                            <p className="text-slate-400 max-w-lg text-lg font-medium leading-relaxed opacity-80">
                                Train je kritisch denkvermogen. Automatiseer drogredenen, ethische tradities en antropologische concepten.
                            </p>
                        </div>

                        <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
                            <Brain className="text-purple-500 animate-pulse" size={16} />
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Drill Status: <span className="text-white">Active</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* SPECIAL: THE PHILOSOPHY SHAKE */}
                    <GymEngineCard
                        id="mix-philosophy"
                        title="Socratische Shake"
                        description="De totale verwarring. Een mix van alle filosofische domeinen."
                        icon={<Brain size={32} className="text-purple-500" />}
                        difficulty={Math.max(
                            1,
                            Math.round(
                                Object.values(stats.levels || {}).reduce((a: number, b: number) => a + b, 0) /
                                (Object.keys(stats.levels || {}).length || 1),
                            ),
                        )}
                        onClick={() =>
                            setSelectedEngine({
                                id: "mix-philosophy",
                                title: "Socratische Shake",
                            })
                        }
                    />

                    {/* ENGINE 1: LOGIC */}
                    <GymEngineCard
                        id="logic-engine"
                        title="Socrates' Syllogisme"
                        description="Master formal logic: Modus Ponens, Tollens and Syllogisms."
                        icon={<Zap size={32} />}
                        difficulty={stats.levels?.["logic-engine"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "logic-engine", title: "Socrates' Syllogisme" })
                        }
                    />

                    {/* ENGINE 2: SOCIAL PHILOSOPHY */}
                    <GymEngineCard
                        id="social-philosophy"
                        title="Utopia Builder"
                        description="Social and Political Philosophy. Justice, Power and the State."
                        icon={<Scale size={32} />}
                        difficulty={stats.levels?.["social-philosophy"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "social-philosophy", title: "Utopia Builder" })
                        }
                    />

                    {/* ENGINE 3: THOUGHT EXPERIMENTS */}
                    <GymEngineCard
                        id="thought-experiment"
                        title="De Denktank"
                        description="From Trolley Problem to Chinese Room. Applied theoretical logic."
                        icon={<Lightbulb size={32} />}
                        difficulty={stats.levels?.["thought-experiment"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "thought-experiment", title: "De Denktank" })
                        }
                    />

                    {/* ENGINE 4: EXAM 2025 */}
                    <GymEngineCard
                        id="tech-exam-2025"
                        title="Examen 2025 Special"
                        description="Plessner, Foucault and the Philosophy of Technology & Science."
                        icon={<History size={32} />}
                        difficulty={stats.levels?.["tech-exam-2025"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "tech-exam-2025", title: "Examen 2025 Special" })
                        }
                    />

                    {/* ENGINE 5: ANTHRO IDENTITY */}
                    <GymEngineCard
                        id="anthro-identity"
                        title="Anthro Identity"
                        description="The self, mind and human nature. Body/Mind dualism to Monism."
                        icon={<Brain size={32} />}
                        difficulty={stats.levels?.["anthro-identity"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "anthro-identity", title: "Anthro Identity" })
                        }
                    />

                    {/* ENGINE 6: ETHICS CLASH */}
                    <GymEngineCard
                        id="ethics-clash"
                        title="Ethics Clash"
                        description="Kant, Mill or Aristotle? Deontology, Utilitarianism and Virtue."
                        icon={<Sword size={32} />}
                        difficulty={stats.levels?.["ethics-clash"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "ethics-clash", title: "Ethics Clash" })
                        }
                    />

                    {/* ENGINE 7: KNOWLEDGE LAB */}
                    <GymEngineCard
                        id="knowledge-lab"
                        title="Truth Seeker"
                        description="Epistemology: Falsification, Paradigms and the Cogito."
                        icon={<Scroll size={32} />}
                        difficulty={stats.levels?.["knowledge-lab"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "knowledge-lab", title: "Truth Seeker" })
                        }
                    />

                    {/* ENGINE 8: EASTERN PHILOSOPHY */}
                    <GymEngineCard
                        id="eastern-phil"
                        title="Oosterse Wijsheid"
                        description="Taoism, Buddhism and the art of Wu Wei."
                        icon={<Compass size={32} />}
                        difficulty={stats.levels?.["eastern-phil"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "eastern-phil", title: "Oosterse Wijsheid" })
                        }
                    />

                    {/* ENGINE 9: PRIMARY TEXTS */}
                    <GymEngineCard
                        id="primary-text"
                        title="Source Decoder"
                        description="Philosophical jargon and terminology (Dasein, res cogitans)."
                        icon={<FileText size={32} />}
                        difficulty={stats.levels?.["primary-text"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "primary-text", title: "Source Decoder" })
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
