import { GymEngineCard, GymSession, SessionConfigModal } from "@features/math";
import { useGymProgress } from "@shared/hooks/useGymProgress";
import {
    Activity,
    Binary,
    Brain,
    Calculator,
    Dna,
    Droplet,
    FlaskConical,
    GitMerge,
    Leaf,
    Network,
    RefreshCw,
    RotateCcw,
    Scale,
    Shield,
    TestTube,
    Zap,
} from "lucide-react";
import React, { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { BIO_ENGINES } from "./engines";

export const BiologyGymStage: React.FC = () => {
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
                engine={BIO_ENGINES[activeSession]}
                onExit={() => navigate("/biology/gym")}
                questionCount={questionCount}
            />
        );
    }

    const handleStartSession = (count: number) => {
        if (selectedEngine) {
            navigate(`/biology/gym/${selectedEngine.id}?n=${count}`);
            setSelectedEngine(null);
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto p-4 md:p-8 relative selection:bg-emerald-500/30 font-outfit">
            {/* Biology Theme Background: Emerald Glow */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/5 blur-[120px] pointer-events-none" />

            <div className="max-w-6xl mx-auto pb-32 relative z-10">
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-8 border-b border-white/5 pb-12">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1 border-l border-emerald-500/50 pl-4 py-2 bg-gradient-to-r from-emerald-500/10 to-transparent pointer-events-none w-fit">
                            <div className="text-[10px] uppercase font-black text-emerald-500 tracking-[0.2em]">
                                Biosystem Drill Engine
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono italic">
                                "Biological Mastery through Repetition"
                            </div>
                        </div>
                        <h2 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                            Biology{" "}
                            <span className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                Gym
                            </span>
                        </h2>
                        <p className="text-slate-400 max-w-lg text-lg font-medium leading-relaxed opacity-80">
                            Biologie op Elite-niveau vereist parate kennis. Automatiseer je begrippen, berekeningen en processen.
                        </p>
                    </div>

                    <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
                        <Dna className="text-emerald-500 animate-pulse" size={16} />
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Drill Status: <span className="text-white">Active</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* SPECIAL: THE BIOLOGY MILKSHAKE */}
                    <GymEngineCard
                        id="mix-bio"
                        title="Biology Milkshake"
                        description="De totale mix. Willekeurige vragen van alle biologische engines door elkaar."
                        icon={<TestTube size={32} className="text-emerald-500" />}
                        difficulty={Math.max(
                            1,
                            Math.round(
                                Object.values(stats.levels || {}).reduce((a: number, b: number) => a + b, 0) /
                                (Object.keys(stats.levels || {}).length || 1),
                            ),
                        )}
                        onClick={() =>
                            setSelectedEngine({
                                id: "mix-bio",
                                title: "Biology Milkshake",
                            })
                        }
                    />

                    {/* SPECIAL: INFINITE BIO */}
                    <GymEngineCard
                        id="infinite-bio"
                        title="Bio-Brain Unlimited"
                        description="Oneindige stroom vragen. De complete domeinen van Biologie VWO."
                        icon={<Brain size={32} className="text-purple-500" />}
                        difficulty={stats.levels?.["infinite-bio"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "infinite-bio", title: "Bio-Brain Unlimited" })
                        }
                    />

                    {/* ENGINE 1: PROTEIN SYNTHESIS */}
                    <GymEngineCard
                        id="protein-synth"
                        title="Eiwit Codekraker"
                        description="Transcriptie en translatie. Van DNA naar aminozuur zonder twijfel."
                        icon={<Binary size={32} />}
                        difficulty={stats.levels?.["protein-synth"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "protein-synth", title: "Eiwit Codekraker" })
                        }
                    />

                    {/* ENGINE 2: BIO ENERGY */}
                    <GymEngineCard
                        id="bio-energy"
                        title="ATP Centrale"
                        description="Fotosynthese en dissimilatie. Beheers de bruto-reacties en energiestromen."
                        icon={<Zap size={32} />}
                        difficulty={stats.levels?.["bio-energy"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "bio-energy", title: "ATP Centrale" })
                        }
                    />

                    {/* ENGINE 3: MEMBRANE TRANSPORT */}
                    <GymEngineCard
                        id="membrane-transport"
                        title="Membraan Poortwachter"
                        description="Osmose, diffusie en actief transport. Voorspel de waterstroom."
                        icon={<Droplet size={32} />}
                        difficulty={stats.levels?.["membrane-transport"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "membrane-transport", title: "Membraan Poortwachter" })
                        }
                    />

                    {/* ENGINE 4: GENETICS MENDEL */}
                    <GymEngineCard
                        id="genetics-mendel"
                        title="Mendel's Matrix"
                        description="Kruisingsschema's en stambomen. Monohybride en dihybride cracks."
                        icon={<Dna size={32} />}
                        difficulty={stats.levels?.["genetics-mendel"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "genetics-mendel", title: "Mendel's Matrix" })
                        }
                    />

                    {/* ENGINE 5: NEURAL NET */}
                    <GymEngineCard
                        id="neural-net"
                        title="Zenuwflits"
                        description="Actiepotentialen en synapsen. Neurotransmitters en impulsgeleiding."
                        icon={<Network size={32} />}
                        difficulty={stats.levels?.["neural-net"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "neural-net", title: "Zenuwflits" })
                        }
                    />

                    {/* ENGINE 6: HORMONE CONTROL */}
                    <GymEngineCard
                        id="hormone-control"
                        title="Endocriene Regisseur"
                        description="Regelkringen en terugkoppeling. Beheers de hormonale aansturing."
                        icon={<Scale size={32} />}
                        difficulty={stats.levels?.["hormone-control"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "hormone-control", title: "Endocriene Regisseur" })
                        }
                    />

                    {/* ENGINE 7: IMMUNO DEFENSE */}
                    <GymEngineCard
                        id="immuno-defense"
                        title="Afweer Linie"
                        description="Specifieke en a-specifieke afweer. B- en T-cellen in de aanslag."
                        icon={<Shield size={32} />}
                        difficulty={stats.levels?.["immuno-defense"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "immuno-defense", title: "Afweer Linie" })
                        }
                    />

                    {/* ENGINE 8: NITROGEN CYCLE */}
                    <GymEngineCard
                        id="nitrogen-cycle"
                        title="Stikstof Navigator"
                        description="Nitrificatie, denitrificatie en ammonificatie. Sluit de kringloop."
                        icon={<RefreshCw size={32} />}
                        difficulty={stats.levels?.["nitrogen-cycle"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "nitrogen-cycle", title: "Stikstof Navigator" })
                        }
                    />

                    {/* ENGINE 9: HARDY WEINBERG */}
                    <GymEngineCard
                        id="hardy-weinberg"
                        title="Evolutie Calculator"
                        description="Populatiegenetica. p² + 2pq + q² = 1. Reken als een biostatisticus."
                        icon={<Calculator size={32} />}
                        difficulty={stats.levels?.["hardy-weinberg"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "hardy-weinberg", title: "Evolutie Calculator" })
                        }
                    />

                    {/* ENGINE 10: CIRCULATION PUMP */}
                    <GymEngineCard
                        id="circulation-pump"
                        title="Hartslag Monitor"
                        description="Bloedsomloop en hartcyclus. Route van het bloed door het lichaam."
                        icon={<Activity size={32} />}
                        difficulty={stats.levels?.["circulation-pump"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "circulation-pump", title: "Hartslag Monitor" })
                        }
                    />

                    {/* ENGINE 11: CELL DIVISION */}
                    <GymEngineCard
                        id="cell-division"
                        title="Cell Division"
                        description="Mitose en meiose. De stadia van celverdeling zonder fouten."
                        icon={<GitMerge size={32} />}
                        difficulty={stats.levels?.["cell-division"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "cell-division", title: "Cell Division" })
                        }
                    />

                    {/* ENGINE 12: FEEDBACK LOOP */}
                    <GymEngineCard
                        id="feedback-loop"
                        title="Regelkringen Master"
                        description="Negatieve feedback en homeostase. Hormonen, vloeistoffen en temperatuur."
                        icon={<RotateCcw size={32} />}
                        difficulty={stats.levels?.["feedback-loop"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "feedback-loop", title: "Regelkringen Master" })
                        }
                    />

                    {/* ENGINE 13: ENZYMES */}
                    <GymEngineCard
                        id="enzymes"
                        title="Enzym Expert"
                        description="Katalyse, remmingsmechanismen en activiteitsmodellen."
                        icon={<FlaskConical size={32} />}
                        difficulty={stats.levels?.["enzymes"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "enzymes", title: "Enzym Expert" })
                        }
                    />

                    {/* ENGINE 14: ECOLOGY */}
                    <GymEngineCard
                        id="ecology"
                        title="Eco Systeem"
                        description="Voedselketens, energiestromen en biotische relaties in beeld."
                        icon={<Leaf size={32} />}
                        difficulty={stats.levels?.["ecology"] || 1}
                        onClick={() =>
                            setSelectedEngine({ id: "ecology", title: "Eco Systeem" })
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
