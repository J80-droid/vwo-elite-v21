import { InteractiveComponentSchema } from "@shared/types/lesson.schema";
import { motion, Reorder } from "framer-motion";
import {
    AudioLines,
    BookOpen,
    CheckCircle2,
    Languages,
    MessageSquare,
    Play,
    Search,
    Type
} from "lucide-react";
import React, { useState } from "react";
import { z } from "zod";

type LanguageComponent = Extract<z.infer<typeof InteractiveComponentSchema>, { type: 'language-text-analysis' | 'language-syntax-builder' | 'language-immersion' }>;

interface LanguageEngineProps {
    component: LanguageComponent;
    mastery?: 'novice' | 'competent' | 'expert';
}

/**
 * Cito-Cracker: Text Analysis Module
 * Interactive text highlighting for connectors and references.
 */
const TextAnalysisModule: React.FC<{ config: Extract<LanguageComponent, { type: 'language-text-analysis' }>['config'] }> = ({ config }) => {
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [feedback, setFeedback] = useState<string | null>(null);

    const handleWordClick = (index: number) => {
        const highlight = config.highlights.find(h => index >= h.start && index <= h.end);
        if (highlight) {
            if (!selectedIndices.includes(index)) {
                setSelectedIndices([...selectedIndices, index]);
                setFeedback(highlight.hint);
            }
        } else {
            setFeedback("Try looking for connectors or references.");
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 bg-obsidian-900/50 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 font-bold text-xs uppercase tracking-tighter">
                        {config.language.toUpperCase()}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white capitalize">{config.focus} Analysis</h4>
                        <p className="text-[10px] text-white/40 font-medium">Identify key logical structures in the text</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <span className="text-[10px] text-white/30 uppercase tracking-widest font-black">Cito-Cracker v1.0</span>
                </div>
            </div>

            <div className="text-sm leading-relaxed text-white/80 font-serif select-none whitespace-pre-wrap">
                {config.textSnippet.split(" ").map((word, i) => {
                    const isHighlighted = config.highlights.some(h => i >= h.start && i <= h.end);
                    const isSelected = selectedIndices.includes(i);

                    return (
                        <span
                            key={i}
                            onClick={() => handleWordClick(i)}
                            className={`
                                cursor-pointer px-0.5 rounded transition-all duration-300
                                ${isSelected ? 'bg-indigo-500/40 text-white ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-500/20' : ''}
                                ${!isSelected && isHighlighted ? 'hover:bg-white/5' : ''}
                            `}
                        >
                            {word}{" "}
                        </span>
                    );
                })}
            </div>

            {feedback && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-start gap-3"
                >
                    <Search className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-indigo-100 italic">{feedback}</p>
                </motion.div>
            )}
        </div>
    );
};

/**
 * Syntax Architect: Block-based Sentence Builder
 */
const SyntaxBuilderModule: React.FC<{ config: Extract<LanguageComponent, { type: 'language-syntax-builder' }>['config'] }> = ({ config }) => {
    const [words, setWords] = useState(config.sentenceParts);
    const [isCorrect, setIsCorrect] = useState(false);

    // Simplified "correctness" check based on original order (mock behavior)
    React.useEffect(() => {
        if (JSON.stringify(words) === JSON.stringify(config.sentenceParts)) {
            // This is just a placeholder logic, in real use the "correct" order would be defined in config
        }
    }, [words, config.sentenceParts]);

    return (
        <div className="flex flex-col gap-6 p-6 bg-obsidian-900/50 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
                        <Type className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-tight">Syntax Architect</h4>
                        <p className="text-[10px] text-white/40 font-medium">Reorder blocks to fix the {config.constraint}</p>
                    </div>
                </div>
            </div>

            <Reorder.Group axis="x" values={words} onReorder={setWords} className="flex flex-wrap gap-2">
                {words.map((word) => (
                    <Reorder.Item
                        key={word}
                        value={word}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors"
                    >
                        <span className="text-sm font-medium text-white">{word}</span>
                    </Reorder.Item>
                ))}
            </Reorder.Group>

            <div className="flex justify-center pt-2">
                <button
                    onClick={() => setIsCorrect(true)}
                    className="px-6 py-2 bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 rounded-full border border-pink-500/30 text-xs font-bold transition-all flex items-center gap-2"
                >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Check Syntax
                </button>
            </div>

            {isCorrect && (
                <p className="text-center text-[10px] text-emerald-400 uppercase tracking-widest font-black animate-pulse">
                    Syntax Correct: VWO Level C1
                </p>
            )}
        </div>
    );
};

/**
 * Immersion Simulator: Audio & Roleplay
 */
const ImmersionModule: React.FC<{ config: Extract<LanguageComponent, { type: 'language-immersion' }>['config'] }> = ({ config }) => {
    return (
        <div className="flex flex-col gap-6 p-6 bg-obsidian-900/50 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                        <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-tight">Immersion Simulator</h4>
                        <p className="text-[10px] text-white/40 font-medium">Interactive scenario: {config.roleplayScenario || 'General Conversation'}</p>
                    </div>
                </div>
            </div>

            <div className="aspect-video w-full bg-obsidian-950 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-4 relative overflow-hidden group">
                {/* Mock Waveform Animation */}
                <div className="flex items-end gap-1 h-12">
                    {[...Array(12)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{ height: [4, 24, 8, 36, 12, 4] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                            className="w-1.5 bg-emerald-500/40 rounded-full"
                        />
                    ))}
                </div>

                <button className="p-4 bg-emerald-500 text-obsidian-950 rounded-full shadow-2xl shadow-emerald-500/40 transform group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 fill-current" />
                </button>

                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center px-4 py-2 bg-black/40 backdrop-blur-md rounded-lg border border-white/5">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-white/40 uppercase font-black">Audio Source</span>
                        <span className="text-[10px] text-white font-medium truncate max-w-[150px]">{config.mediaUrl || 'Syllabus_2025_Audio_01.mp3'}</span>
                    </div>
                    <div className="p-1 px-2 bg-white/10 rounded text-emerald-400 text-[9px] font-bold">LIVE</div>
                </div>
            </div>

            {config.transcript && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest font-black">
                        <AudioLines className="w-3 h-3" />
                        Transcript Explorer
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-xs text-white/60 leading-relaxed italic">
                        {config.transcript}
                    </div>
                </div>
            )}
        </div>
    );
};

export const LanguageEngine: React.FC<LanguageEngineProps> = ({ component, mastery }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6 w-full"
        >
            <div className="flex items-center gap-3 mb-2 px-1">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Languages className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                        MVT Core Engine
                    </h3>
                    <p className="text-xs text-white/40 font-medium">
                        Moderne Vreemde Talen • CE/SE Curriculum 2025
                    </p>
                </div>
            </div>

            <div className="w-full">
                {component.type === 'language-text-analysis' && (
                    <TextAnalysisModule config={component.config} />
                )}
                {component.type === 'language-syntax-builder' && (
                    <SyntaxBuilderModule config={component.config} />
                )}
                {component.type === 'language-immersion' && (
                    <ImmersionModule config={component.config} />
                )}
            </div>

            {/* Socratic Context Footer */}
            {mastery && (
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-white/20 px-2">
                    <BookOpen className="w-3 h-3" />
                    <span>Mode: {mastery} Immersion-Depth Active</span>
                </div>
            )}
        </motion.div>
    );
};
