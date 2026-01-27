import { InteractiveComponentSchema } from "@shared/types/lesson.schema";
import { AlertTriangle, Brain, CheckCircle, RefreshCw, Sparkles, Target } from "lucide-react";
import React, { useMemo } from 'react';
import { z } from "zod";

import { useChallengeMode } from "../hooks/useChallengeMode";
import { InteractiveComponentRenderer } from "./InteractiveComponentRenderer";

type InteractiveComponent = z.infer<typeof InteractiveComponentSchema>;

interface AdaptorProps {
    component: InteractiveComponent;
    studentMastery: 'novice' | 'competent' | 'expert';
    contextContent: string;
    onInteraction?: (newConfig: InteractiveComponent['config']) => void;
}

export const DidacticRenderer: React.FC<AdaptorProps> = ({
    component,
    studentMastery,
    contextContent,
    onInteraction
}) => {
    // 1. Initialize Challenge Mode Hook
    const challengeMode = useChallengeMode(contextContent, component.type);

    // 2. Handler to start challenge
    const handleStartChallenge = async () => {
        const brokenConfig = await challengeMode.startChallenge();
        if (brokenConfig) {
            // Inject broken state into the component
            // We assume 'parameters' exists for those that support challenges
            const newConfig = { ...component.config, parameters: brokenConfig };
            onInteraction?.(newConfig);
        }
    };

    // 3. Logic: Filter parameters based on mastery
    // This creates the "Adaptive UI"
    const allowedControls = useMemo(() => {
        if (studentMastery === 'novice') {
            // Only allow basic controls for novices
            return ['gravity', 'mass', 'angle'];
        }
        return 'all';
    }, [studentMastery]);

    // 4. Adapt Configuration
    // If we were modifying values, we'd do it here. For now, we leave config as is
    // but InteractiveComponentRenderer uses allowedControls to hide inputs.

    // Determine the current config to render: Challenge config (if active) or regular config
    // Note: The 'startChallenge' logic updates the PARENT state via onInteraction, 
    // so 'component.config' will already contain the broken state when it re-renders.

    return (
        <div className={`my-6 transition-all duration-500 relative ${challengeMode.isActive ? 'px-1' : ''}`}>

            {/* CHALLENGE OVERLAY FRAME */}
            {challengeMode.isActive && (
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-amber-900/40 to-amber-500/20 rounded-xl blur-sm animate-pulse z-0 pointer-events-none" />
            )}

            <div className={`relative z-10 ${challengeMode.isActive ? 'bg-obsidian-950 border border-amber-500/50 rounded-xl overflow-hidden shadow-2xl shadow-amber-900/20' : ''}`}>

                {/* CHALLENGE HEADER - Only visible in active mode */}
                {challengeMode.isActive && (
                    <div className="bg-gradient-to-r from-amber-950/80 to-obsidian-900/80 border-b border-amber-500/20 p-4 animate-in slide-in-from-top-2">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-3">
                                <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                    <Target className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <h5 className="font-bold flex items-center gap-2 text-amber-100">
                                        Foutenjacht Modus
                                    </h5>
                                    {challengeMode.isLoading && !challengeMode.challenge ? (
                                        <div className="flex items-center gap-2 text-sm text-amber-500/70 mt-1">
                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                            De AI bedenkt een sabotage...
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-sm font-medium mt-1 text-amber-500">{challengeMode.challenge?.scenario}</p>
                                            <div className="text-xs mt-2 text-amber-200/60 bg-black/40 px-3 py-1.5 rounded inline-block border border-white/5">
                                                Doel: {challengeMode.challenge?.goal}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    challengeMode.stopChallenge();
                                    // Optionally could reset to 'good' config here if we saved it
                                }}
                                className="text-xs text-slate-400 hover:text-white transition-colors"
                            >
                                Stoppen
                            </button>
                        </div>
                    </div>
                )}

                {/* THE COMPONENT */}
                <div className="relative">
                    {/* Mastery Badge (Scaffolding) */}
                    {!challengeMode.isActive && studentMastery === 'novice' && (
                        <div className="absolute -top-3 left-4 bg-blue-600/90 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded-full shadow-lg z-20 flex items-center gap-1 border border-white/10">
                            <Brain className="w-3 h-3" />
                            Focus: Basisprincipes
                        </div>
                    )}

                    <InteractiveComponentRenderer
                        component={component}
                        onInteraction={onInteraction}
                        // We pass the mastery-based allowed controls, unless in challenge mode (then show all for debugging)
                        allowedControls={challengeMode.isActive ? 'all' : allowedControls}
                        mastery={studentMastery}
                    />

                    {/* Loading Overlay */}
                    {challengeMode.isLoading && !challengeMode.feedback && (
                        <div className="absolute inset-0 bg-obsidian-950/60 z-30 flex items-center justify-center backdrop-blur-[2px]">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                        </div>
                    )}
                </div>

                {/* BOTTOM ACTION BAR */}
                <div className={`flex gap-3 justify-end items-center ${challengeMode.isActive ? 'p-4 bg-obsidian-900/50 border-t border-white/5' : 'mt-2'}`}>

                    {!challengeMode.isActive ? (
                        <button
                            onClick={handleStartChallenge}
                            className="group text-xs text-slate-400 hover:text-amber-400 border border-transparent hover:border-amber-500/30 hover:bg-amber-500/10 px-3 py-1.5 rounded-lg transition-all flex items-center gap-2"
                            title="Start Foutenjacht"
                        >
                            <AlertTriangle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            Daag mij uit
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                // Type-safe extraction of state for the Tutor to analyze
                                let fixedState: Record<string, number> = {};

                                if ('parameters' in component.config) {
                                    fixedState = (component.config.parameters as Record<string, number>) || {};
                                } else if (component.type === 'market-graph' && 'equilibrium' in component.config && component.config.equilibrium) {
                                    fixedState = {
                                        price: component.config.equilibrium.price || 0,
                                        quantity: component.config.equilibrium.quantity || 0
                                    } as Record<string, number>;
                                } else if (component.type === 'concept-map' && 'nodes' in component.config) {
                                    fixedState = { nodeCount: (component.config.nodes as unknown[]).length } as Record<string, number>;
                                } else if (component.type === 'chemistry-electro' && 'voltage' in component.config) {
                                    fixedState = { voltage: (component.config.voltage as number) || 0 };
                                } else if (component.type === 'chemistry-analysis' && 'targetPoint' in component.config) {
                                    fixedState = { targetPoint: (component.config.targetPoint as number) || 0 };
                                } else if (component.type === 'language-text-analysis' && 'highlights' in component.config) {
                                    fixedState = { highlightCount: (component.config.highlights as unknown[]).length } as Record<string, number>;
                                } else if (component.type === 'language-syntax-builder' && 'sentenceParts' in component.config) {
                                    fixedState = { wordCount: (component.config.sentenceParts as string[]).length } as Record<string, number>;
                                } else if (component.type === 'dutch-argumentation' && 'nodes' in component.config) {
                                    fixedState = { nodeCount: (component.config.nodes as unknown[]).length } as Record<string, number>;
                                } else if (component.type === 'dutch-text-anatomy' && 'paragraphs' in component.config) {
                                    fixedState = { paragraphCount: (component.config.paragraphs as string[]).length } as Record<string, number>;
                                } else if (component.type === 'philosophy-logic' && 'premises' in component.config) {
                                    fixedState = { premisesCount: (component.config.premises as string[]).length } as Record<string, number>;
                                } else if (component.type === 'philosophy-concept-map' && 'relatedConcepts' in component.config) {
                                    fixedState = { conceptsCount: (component.config.relatedConcepts as string[]).length } as Record<string, number>;
                                } else if (component.type === 'physics-field' && 'strength' in component.config) {
                                    fixedState = { strength: (component.config.strength as number) || 0 };
                                } else if (component.type === 'physics-circuit' && 'components' in component.config) {
                                    fixedState = { componentCount: (component.config.components as unknown[]).length } as Record<string, number>;
                                } else if (component.type === 'physics-wave' && 'mode' in component.config) {
                                    fixedState = { wavelength: (component.config.wavelength as number) || 0 };
                                } else if (component.type === 'physics-quantum' && 'experiment' in component.config) {
                                    fixedState = { frequency: (component.config.frequency as number) || 0 };
                                } else if (component.type === 'data-analysis' && 'data' in component.config) {
                                    fixedState = { count: (component.config.data as unknown[]).length } as Record<string, number>;
                                } else if (component.type === 'model-fitting' && 'data' in component.config) {
                                    fixedState = { modelType: 1 }; // 1 for active
                                }

                                challengeMode.validateSolution(fixedState);
                            }}
                            disabled={challengeMode.isLoading}
                            className="text-xs bg-amber-500 hover:bg-amber-400 text-obsidian-950 font-bold px-6 py-2 rounded-lg shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Controleer Oplossing
                        </button>
                    )}
                </div>

                {/* FEEDBACK AREA - Only in active mode */}
                {challengeMode.feedback && (
                    <div className="p-4 bg-emerald-900/10 border-t border-emerald-500/20 text-emerald-100 text-sm leading-relaxed animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex gap-3">
                            <div className="mt-1">
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                                <span className="font-bold block text-xs mb-1 text-emerald-400 uppercase tracking-wider">Jury Rapport</span>
                                {challengeMode.feedback}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
