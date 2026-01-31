import { GymEngineCard, GymSession, SessionConfigModal } from "@features/math";
import { useGymProgress } from "@shared/hooks/useGymProgress";
import {
    Atom,
    Beaker,
    Boxes,
    Calculator,
    Droplet,
    FlaskConical,
    Hexagon,
    Link,
    Recycle,
    Scale,
    Search,
    Timer,
    Zap,
} from "lucide-react";
import React, { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { CHEM_ENGINES } from "./engines";

export const ChemistryGymStage: React.FC = () => {
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
                engine={CHEM_ENGINES[activeSession]}
                onExit={() => navigate("/chemistry/gym")}
                questionCount={questionCount}
            />
        );
    }

    const handleStartSession = (count: number) => {
        if (selectedEngine) {
            navigate(`/chemistry/gym/${selectedEngine.id}?n=${count}`);
            setSelectedEngine(null);
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto p-4 md:p-8 relative selection:bg-cyan-500/30 font-outfit">
            {/* Chemistry Theme Background: Cyan Glow */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 blur-[120px] pointer-events-none" />

            <div className="max-w-6xl mx-auto pb-32 relative z-10">
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-8 border-b border-white/5 pb-12">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1 border-l border-cyan-500/50 pl-4 py-2 bg-gradient-to-r from-cyan-500/10 to-transparent pointer-events-none w-fit">
                            <div className="text-[10px] uppercase font-black text-cyan-500 tracking-[0.2em]">
                                Molecular Drill Engine
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono italic">
                                "Precision in Every Reaction"
                            </div>
                        </div>
                        <h2 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                            Chemistry{" "}
                            <span className="text-cyan-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                                Gym
                            </span>
                        </h2>
                        <p className="text-slate-400 max-w-lg text-lg font-medium leading-relaxed opacity-80">
                            Scheikunde is de kunst van het rekenen en begrijpen van structuren. Train je parate kennis.
                        </p>
                    </div>

                    <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
                        <Beaker className="text-cyan-500 animate-pulse" size={16} />
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Drill Status: <span className="text-white">Active</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* SPECIAL: THE CHEMISTRY SHAKE */}
                    <GymEngineCard
                        id="mix-chemistry"
                        title="Scheikunde Shake"
                        description="De ultieme reactie. Een explosieve mix van rekenen, organisch en redox."
                        icon={<Beaker size={32} className="text-cyan-500" />}
                        difficulty={Math.max(
                            1,
                            Math.round(
                                Object.values(stats.levels || {}).reduce((a: number, b: number) => a + b, 0) /
                                (Object.keys(stats.levels || {}).length || 1),
                            ),
                        )}
                        onClick={() =>
                            setSelectedEngine({
                                id: "mix-chemistry",
                                title: "Scheikunde Shake",
                            })
                        }
                    />

                    {/* SPECIAL: INFINITE CHEM */}
                    <GymEngineCard
                        id="infinite-chem"
                        title="Chem-Lab Unlimited"
                        description="Oneindige scheikunde training. Reacties, berekeningen en theorie."
                        icon={<Atom size={32} className="text-purple-500" />}
                        difficulty={stats.levels?.["infinite-chem"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "infinite-chem", title: "Chem-Lab Unlimited" })
                        }
                    />

                    {/* ENGINE 1: STOICHIOMETRY */}
                    <GymEngineCard
                        id="mol-mastery"
                        title="Mol Mastery"
                        description="Van gram naar mol naar molariteit. De heilige graal van het chemisch rekenen."
                        icon={<FlaskConical size={32} />}
                        difficulty={stats.levels?.["mol-mastery"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "mol-mastery", title: "Mol Mastery" })
                        }
                    />

                    {/* ENGINE 2: PH PRECISION */}
                    <GymEngineCard
                        id="ph-precision"
                        title="Proton Pump"
                        description="pH, pOH en Kz/Kb. Beheers de logaritmen van de zuurgraad."
                        icon={<Droplet size={32} />}
                        difficulty={stats.levels?.["ph-precision"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "ph-precision", title: "Proton Pump" })
                        }
                    />

                    {/* ENGINE 3: REDOX RELAY */}
                    <GymEngineCard
                        id="redox-relay"
                        title="Electron Exchange"
                        description="Halfreacties en totaalvergelijkingen. Volg het pad van de elektronen."
                        icon={<Zap size={32} />}
                        difficulty={stats.levels?.["redox-relay"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "redox-relay", title: "Electron Exchange" })
                        }
                    />

                    {/* ENGINE 4: NOMENCLATURE NINJA */}
                    <GymEngineCard
                        id="carbon-code"
                        title="Nomenclatuur Ninja"
                        description="IUPAC regels voor koolwaterstoffen, esters en meer. Kraak de naam."
                        icon={<Hexagon size={32} />}
                        difficulty={stats.levels?.["carbon-code"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "carbon-code", title: "Nomenclatuur Ninja" })
                        }
                    />

                    {/* ENGINE 5: BONDING BUILDER */}
                    <GymEngineCard
                        id="bonding-builder"
                        title="Bonding Basics"
                        description="H-bruggen en Van der Waals. Verklaar eigenschappen vanuit de structuur."
                        icon={<Link size={32} />}
                        difficulty={stats.levels?.["bonding-builder"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "bonding-builder", title: "Bonding Basics" })
                        }
                    />

                    {/* ENGINE 6: POLYMER PUZZLE */}
                    <GymEngineCard
                        id="polymer-puzzle"
                        title="Polymer Power"
                        description="Additie en condensatie. Maak kunststoffen van losse monomeren."
                        icon={<Boxes size={32} />}
                        difficulty={stats.levels?.["polymer-puzzle"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "polymer-puzzle", title: "Polymer Power" })
                        }
                    />

                    {/* ENGINE 7: GREEN GAUGE */}
                    <GymEngineCard
                        id="green-gauge"
                        title="Green Gauge"
                        description="Atoomeconomie en rendement. Reken aan duurzame chemie."
                        icon={<Recycle size={32} />}
                        difficulty={stats.levels?.["green-gauge"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "green-gauge", title: "Green Gauge" })
                        }
                    />

                    {/* ENGINE 8: EQUILIBRIUM EXPERT */}
                    <GymEngineCard
                        id="equilibrium-expert"
                        title="Le Chatelier's Balance"
                        description="Verschuivingen in evenwichten door druk, temp of concentratie."
                        icon={<Scale size={32} />}
                        difficulty={stats.levels?.["equilibrium-expert"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "equilibrium-expert", title: "Le Chatelier's Balance" })
                        }
                    />

                    {/* ENGINE 9: EQUILIBRIUM CALC */}
                    <GymEngineCard
                        id="equilibrium-calc"
                        title="Kc Calculator"
                        description="Reken aan evenwichtsvoorwaarden en concentraties (Kc en Qc)."
                        icon={<Calculator size={32} />}
                        difficulty={stats.levels?.["equilibrium-calc"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "equilibrium-calc", title: "Kc Calculator" })
                        }
                    />

                    {/* ENGINE 10: KINETICS MASTER */}
                    <GymEngineCard
                        id="kinetics-master"
                        title="Snelheids Duivel"
                        description="Botsingen, activeringsenergie en reactie-orde. Timing is alles."
                        icon={<Timer size={32} />}
                        difficulty={stats.levels?.["kinetics-master"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "kinetics-master", title: "Snelheids Duivel" })
                        }
                    />

                    {/* ENGINE 11: ANALYSIS DETECTIVE */}
                    <GymEngineCard
                        id="analysis-detective"
                        title="Spectra Sherlock"
                        description="Krijg grip op MS, IR en H-NMR. Identificeer moleculen uit data."
                        icon={<Search size={32} />}
                        difficulty={stats.levels?.["analysis-detective"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "analysis-detective", title: "Spectra Sherlock" })
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
