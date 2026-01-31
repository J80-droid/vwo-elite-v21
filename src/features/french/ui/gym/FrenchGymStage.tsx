import { GymEngineCard, GymSession, SessionConfigModal } from "@features/math";
import { useGymProgress } from "@shared/hooks/useGymProgress";
import {
    BookOpen,
    Languages,
    Library,
    Music,
    Palette,
    PenTool,
    RefreshCw,
    Search,
    Target,
    Zap,
} from "lucide-react";
import React, { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { FRENCH_ENGINES } from "./engines";

export const FrenchGymStage: React.FC = () => {
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
                engine={FRENCH_ENGINES[activeSession as keyof typeof FRENCH_ENGINES]}
                onExit={() => navigate("/language/fr/gym")}
                questionCount={questionCount}
            />
        );
    }

    const handleStartSession = (count: number) => {
        if (selectedEngine) {
            navigate(`/language/fr/gym/${selectedEngine.id}?n=${count}`);
            setSelectedEngine(null);
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto p-4 md:p-8 relative selection:bg-blue-500/30 font-outfit">
            {/* French Theme Background: Blue/White/Red Glow */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 blur-[120px] pointer-events-none" />

            <div className="max-w-6xl mx-auto pb-32 relative z-10">
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-8 border-b border-white/5 pb-12">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1 border-l border-blue-500/50 pl-4 py-2 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none w-fit">
                            <div className="text-[10px] uppercase font-black text-blue-500 tracking-[0.2em]">
                                Moteur d'entraînement linguistique
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono italic">
                                "Excellence par la pratique"
                            </div>
                        </div>
                        <h2 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                            Français{" "}
                            <span className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                Gym
                            </span>
                        </h2>
                        <p className="text-slate-400 max-w-lg text-lg font-medium leading-relaxed opacity-80">
                            Perfectionnez votre français. Du vocabulaire CITO à la littérature classique.
                        </p>
                    </div>

                    <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
                        <BookOpen className="text-blue-500 animate-pulse" size={16} />
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Drill Status: <span className="text-white">Prêt</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* SPECIAL: THE FRENCH SHAKE */}
                    <GymEngineCard
                        id="mix-french"
                        title="Café au Lait"
                        description="Tout ensemble. Grammatica, Vocabulaire en Literatuur mix."
                        icon={<Languages size={32} className="text-blue-500" />}
                        difficulty={Math.max(
                            1,
                            Math.round(
                                Object.values(stats.levels || {}).reduce((a: number, b: number) => a + b, 0) /
                                (Object.keys(stats.levels || {}).length || 1),
                            ),
                        )}
                        onClick={() =>
                            setSelectedEngine({
                                id: "mix-french",
                                title: "Café au Lait",
                            })
                        }
                    />

                    {/* SPECIAL: INFINITE FRENCH (AI) */}
                    <GymEngineCard
                        id="infinite-french"
                        title="Sorbonne AI Unlimited"
                        description="Infini. Grammaire, Vocabulaire & Conjugaison."
                        icon={<BookOpen size={32} className="text-blue-500" />}
                        difficulty={stats.levels?.["infinite-french"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "infinite-french", title: "Sorbonne AI Unlimited" })
                        }
                    />

                    {/* ENGINE 1: CONJUGATION */}
                    <GymEngineCard
                        id="conjugation-algo"
                        title="Verbe Vitesse"
                        description="Drill de onregelmatige werkwoorden (Avoir, Être, Aller, Faire...). Infinite drills."
                        icon={<RefreshCw size={32} />}
                        difficulty={stats.levels?.["conjugation-algo"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "conjugation-algo", title: "Verbe Vitesse" })
                        }
                    />

                    {/* ENGINE 2: SUBJONCTIF */}
                    <GymEngineCard
                        id="subjonctif-sniper"
                        title="Subjonctif Sniper"
                        description="Indicatif of Subjonctif? Master the triggers of the mood."
                        icon={<Zap size={32} />}
                        difficulty={stats.levels?.["subjonctif-sniper"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "subjonctif-sniper", title: "Subjonctif Sniper" })
                        }
                    />

                    {/* ENGINE 3: PRONOUN PUZZLE */}
                    <GymEngineCard
                        id="pronoun-puzzle"
                        title="Pronoun Puzzle"
                        description="Lequel, Auquel, Duquel of Dont? Master relative pronouns with logic."
                        icon={<Palette size={32} />}
                        difficulty={stats.levels?.["pronoun-puzzle"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "pronoun-puzzle", title: "Pronoun Puzzle" })
                        }
                    />

                    {/* ENGINE 4: VOCAB CITO */}
                    <GymEngineCard
                        id="vocab-cito"
                        title="Vocabulaire Stratégique"
                        description="Examenwoorden & Signaalwoorden voor Frans."
                        icon={<Library size={32} />}
                        difficulty={stats.levels?.["vocab-cito"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "vocab-cito", title: "Vocabulaire Stratégique" })
                        }
                    />

                    {/* ENGINE 5: CONNECTORS */}
                    <GymEngineCard
                        id="connector-code"
                        title="Connecteur Scanner"
                        description="Tekstverbanden en signaalwoorden."
                        icon={<Search size={32} />}
                        difficulty={stats.levels?.["connector-code"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "connector-code", title: "Connecteur Scanner" })
                        }
                    />

                    {/* ENGINE 6: FALSE FRIENDS */}
                    <GymEngineCard
                        id="false-friends"
                        title="Faux Amis"
                        description="Instinkers. Reizen of werken? Gebruiken of verslijten?"
                        icon={<Target size={32} />}
                        difficulty={stats.levels?.["false-friends"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "false-friends", title: "Faux Amis" })
                        }
                    />

                    {/* ENGINE 7: TONE DETECTIVE */}
                    <GymEngineCard
                        id="tone-detective"
                        title="Ton & Attitude"
                        description="Houding van de auteur (élogieux, indigné, sceptique)."
                        icon={<Music size={32} />}
                        difficulty={stats.levels?.["tone-detective"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "tone-detective", title: "Ton & Attitude" })
                        }
                    />

                    {/* ENGINE 8: LIT HISTORY */}
                    <GymEngineCard
                        id="lit-history"
                        title="Bibliothèque Élite"
                        description="Literatuur & Stromingen (Camus, Victor Hugo, Alexandrin)."
                        icon={<Library size={32} />}
                        difficulty={stats.levels?.["lit-history"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "lit-history", title: "Bibliothèque Élite" })
                        }
                    />

                    {/* ENGINE 9: ESSAY EXPERT */}
                    <GymEngineCard
                        id="essay-expert"
                        title="Stylo Formel"
                        description="Formeel schrijven en briefconventies."
                        icon={<PenTool size={32} />}
                        difficulty={stats.levels?.["essay-expert"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "essay-expert", title: "Stylo Formel" })
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
