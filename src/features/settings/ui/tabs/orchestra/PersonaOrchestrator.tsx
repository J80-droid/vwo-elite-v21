import { personas } from "@shared/api/personas/registry";
import { UserSettings } from "@shared/types/config";
import { Bot, Save, Sparkles, Wrench, Zap } from "lucide-react";
import React, { useRef, useState } from "react";
import { toast } from "sonner";

import { EliteCard } from "../../components/EliteCard";

interface PersonaOrchestratorProps {
    settings: UserSettings;
    updateSettings: (settings: Partial<UserSettings>) => void;
}

export const PersonaOrchestrator: React.FC<PersonaOrchestratorProps> = ({
    settings,
    updateSettings,
}) => {
    const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
    const [previewText, setPreviewText] = useState("");
    const [isModified, setIsModified] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);

    const getPersonaText = (p: {
        roleDefinition: string;
        academicStandards: string;
        didacticRules: string;
    }) => {
        return `ROLE:\n${p.roleDefinition}\n\nSTANDARDS:\n${p.academicStandards}\n\nDIDACTICS:\n${p.didacticRules}`;
    };

    const handlePersonaSelect = (p: (typeof personas)[0]) => {
        setSelectedPersonaId(p.id);
        const override = settings.aiConfig.personaOverrides?.[p.id];
        const text = override ? getPersonaText(override) : getPersonaText(p);
        setPreviewText(text);
        setIsModified(!!override);
        setTimeout(() => {
            editorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
    };

    const handleSavePersona = () => {
        if (!selectedPersonaId) return;
        const roleMatch = previewText.match(/ROLE:\s*([\s\S]*?)\s*STANDARDS:/);
        const standardsMatch = previewText.match(/STANDARDS:\s*([\s\S]*?)\s*DIDACTICS:/);
        const didacticsMatch = previewText.match(/DIDACTICS:\s*([\s\S]*)/);

        if (roleMatch && standardsMatch && didacticsMatch) {
            const newPersona = {
                roleDefinition: roleMatch[1]?.trim() || "",
                academicStandards: standardsMatch[1]?.trim() || "",
                didacticRules: didacticsMatch[1]?.trim() || "",
            };

            const original = personas.find((p) => p.id === selectedPersonaId)!;

            updateSettings({
                aiConfig: {
                    ...settings.aiConfig,
                    personaOverrides: {
                        ...(settings.aiConfig.personaOverrides || {}),
                        [selectedPersonaId]: {
                            ...original,
                            ...newPersona,
                        },
                    },
                },
            });
            setIsModified(true);
            toast.success("Persona updated successfully");
        } else {
            toast.error("Invalid format. Please keep ROLE, STANDARDS, and DIDACTICS headers.");
        }
    };

    const handleResetPersona = () => {
        if (!selectedPersonaId) return;
        const newOverrides = { ...(settings.aiConfig.personaOverrides || {}) };
        delete newOverrides[selectedPersonaId];

        updateSettings({
            aiConfig: {
                ...settings.aiConfig,
                personaOverrides: newOverrides,
            },
        });

        const original = personas.find((p) => p.id === selectedPersonaId);
        if (original) {
            setPreviewText(getPersonaText(original));
            setIsModified(false);
            toast.success("Persona reset to default");
        }
    };

    return (
        <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
            {/* 1. SUBJECT PERSONAS GRID */}
            <section>
                <div className="bg-zinc-950/80 border border-white/10 rounded-3xl p-1 flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 px-4">
                        <Bot size={14} className="text-cyan-400" />
                        <span className="text-xs font-bold text-slate-300">
                            Subject Specialized Personas
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                            <Zap size={10} className="text-blue-400" />
                            <span className="text-[10px] font-mono font-bold text-blue-300">
                                MANAGED BY ORCHESTRATOR
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {personas.map((p) => {
                        const isSelected = selectedPersonaId === p.id;
                        const hasOverride = !!settings.aiConfig.personaOverrides?.[p.id];

                        return (
                            <EliteCard
                                key={p.id}
                                glowColor={isSelected ? "cyan" : "zinc"}
                                className={`cursor-pointer group hover:bg-white/5 transition-all ${isSelected ? "ring-1 ring-cyan-500/50" : ""}`}
                                onClick={() => handlePersonaSelect(p)}
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                                            {p.id.charAt(0).toUpperCase() + p.id.slice(1)}
                                        </h4>
                                        {hasOverride && (
                                            <div className="text-[9px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold uppercase border border-amber-500/30">
                                                Modified
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {p.domains.map((d) => (
                                            <span
                                                key={d}
                                                className="text-[10px] font-mono bg-white/5 px-1.5 py-0.5 rounded text-slate-400 border border-white/5"
                                            >
                                                {d}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-400 line-clamp-2 italic mb-4">
                                        "{p.roleDefinition}"
                                    </p>
                                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-[10px] text-slate-600 font-mono group-hover:text-cyan-400 transition-colors">
                                            {isSelected ? "Editing Details" : "Click to Edit"}
                                        </span>
                                        <Wrench
                                            size={14}
                                            className={`transition-colors ${isSelected ? "text-cyan-400" : "text-slate-600 group-hover:text-cyan-400"}`}
                                        />
                                    </div>
                                </div>
                            </EliteCard>
                        );
                    })}
                </div>
            </section>

            {/* 2. EDITOR */}
            <section className="flex-1 flex flex-col min-h-[400px]" ref={editorRef}>
                <div className="bg-zinc-950/80 border border-white/10 rounded-3xl p-1 flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 px-4">
                        <Sparkles size={14} className="text-amber-400" />
                        <span className="text-xs font-bold text-slate-300">
                            Persona Configuration Editor
                        </span>
                    </div>

                    {selectedPersonaId && (
                        <div className="flex items-center gap-2 pr-2">
                            <button
                                onClick={handleResetPersona}
                                className="px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                disabled={!isModified}
                            >
                                RESET DEFAULT
                            </button>
                            <button
                                onClick={handleSavePersona}
                                className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all text-[10px] font-bold"
                            >
                                <Save size={12} />
                                SAVE OVERRIDE
                            </button>
                        </div>
                    )}
                </div>

                <div className="relative flex-1 group">
                    <textarea
                        value={previewText}
                        onChange={(e) => setPreviewText(e.target.value)}
                        readOnly={!selectedPersonaId}
                        className={`
                    absolute inset-0 w-full h-full bg-black/40 border border-white/5 p-8 rounded-3xl 
                    text-sm font-mono leading-relaxed outline-none resize-none shadow-inner custom-scrollbar transition-colors
                    ${selectedPersonaId ? "text-amber-100/90 focus:bg-black/60 focus:border-amber-500/30" : "text-slate-600 cursor-not-allowed"}
                `}
                        spellCheck={false}
                        placeholder="Select a persona above to edit its neural definition..."
                    />
                    {!selectedPersonaId && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <Bot size={32} className="text-white/5 mx-auto mb-2" />
                                <div className="text-xs text-slate-600 font-mono">
                                    Select a persona to unlock editor
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};
