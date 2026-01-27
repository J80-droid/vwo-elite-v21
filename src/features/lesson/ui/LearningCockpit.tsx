import { useLessonContext } from "@shared/hooks/lesson/LessonGeneratorContext";
import { useLessonProgressStore } from "@shared/model/lessonProgressStore";
import { DidacticConfig, LearningIntent, SourceReliability } from "@shared/types/index";
import { motion } from "framer-motion";
import {
    Brain,
    Coffee,
    Compass,
    Glasses,
    GraduationCap,
    Layers,
    MonitorPlay,
    Scale,
    Sparkles,
    Target,
    UserPlus,
    Zap,
} from "lucide-react";
import React, { useState } from "react";

interface MixerOption {
    label: string;
    icon: React.ElementType;
    color: string;
}

interface MixerSliderProps {
    label: string;
    value: number;
    onChange: (val: number) => void;
    options: MixerOption[];
}

const MixerSlider: React.FC<MixerSliderProps> = ({ label, value, onChange, options }) => {
    const activeOption = options[value] || options[0] || { label: "Standard", icon: Zap, color: "text-slate-400" };

    return (
        <div className="space-y-4 group/item font-outfit">
            <div className="flex justify-between items-baseline px-1">
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 group-hover/item:text-white/40 transition-colors">{label}</span>
                <motion.span
                    key={activeOption.label}
                    initial={{ opacity: 0, x: 5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`text-[9px] font-black uppercase tracking-[0.2em] ${activeOption.color} opacity-80`}
                >
                    {activeOption.label}
                </motion.span>
            </div>
            <div className="relative h-10 flex items-center px-1">
                {/* Logic: Hidden Native Range for Real Slider Behavior */}
                <input
                    type="range"
                    min={0}
                    max={options.length - 1}
                    step={1}
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                />

                {/* Track: Ultra Thin Hairline */}
                <div className="absolute inset-x-0 h-[1px] bg-white/5" />

                {/* Active Segment: Subtle Pulse Line */}
                <motion.div
                    animate={{
                        left: 0,
                        width: `${(value / (options.length - 1)) * 100}%`
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={`absolute h-[1px] ${activeOption.color.replace('text', 'bg')} shadow-[0_0_10px_currentColor] transition-colors`}
                />

                {/* Thumb: Minimalist Wireframe Ring */}
                <motion.div
                    animate={{ left: `${(value / (options.length - 1)) * 100}%` }}
                    initial={false}
                    className="absolute w-8 h-8 -ml-4 flex items-center justify-center pointer-events-none z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                    <div className={`w-4 h-4 rounded-full border border-current bg-obsidian-950 ${activeOption.color} shadow-[0_0_15px_rgba(255,255,255,0.05)] flex items-center justify-center transition-colors`}>
                        <div className="w-1 h-1 rounded-full bg-current" />
                    </div>
                    {/* Atmospheric Glow */}
                    <div className={`absolute inset-0 blur-xl opacity-20 ${activeOption.color.replace('text', 'bg')} transition-colors`} />
                </motion.div>

                {/* Markers: Subtle Ticks */}
                <div className="absolute inset-x-0 flex justify-between pointer-events-none px-1">
                    {options.map((_, i) => (
                        <div key={i} className={`w-[1px] h-1 ${i <= value ? 'bg-white/10' : 'bg-white/5'}`} />
                    ))}
                </div>
            </div>
        </div>
    );
};



export const LearningCockpit: React.FC<{
    subject: string;
    onGenerate: (config: DidacticConfig, intent: LearningIntent, sourceCheck: SourceReliability) => void;
}> = ({ subject, onGenerate }) => {
    const { loading } = useLessonContext();
    const { getSubjectMastery } = useLessonProgressStore();

    const [depth, setDepth] = useState(1);
    const [scaffolding, setScaffolding] = useState(1);
    const [role, setRole] = useState(0);
    const [focus, setFocus] = useState<string>("standard");
    const [intent, setIntent] = useState<LearningIntent>("summarize");
    const [sourceCheck, setSourceCheck] = useState<SourceReliability>("high");

    const subjectMasteryScore = getSubjectMastery(subject);
    const initialMasteryIndex = subjectMasteryScore > 75 ? 2 : subjectMasteryScore > 40 ? 1 : 0;
    const [mastery, setMastery] = useState(initialMasteryIndex);


    const depthOptions: MixerOption[] = [
        { label: "Espresso", icon: Zap, color: "text-amber-400" },
        { label: "Standard", icon: Coffee, color: "text-emerald-400" },
        { label: "Deep Dive", icon: Glasses, color: "text-indigo-400" },
    ];

    const masteryOptions: MixerOption[] = [
        { label: "Novice", icon: Brain, color: "text-blue-400" },
        { label: "Competent", icon: Target, color: "text-emerald-400" },
        { label: "Expert", icon: Sparkles, color: "text-amber-400" },
    ];

    const scaffoldOptions: MixerOption[] = [
        { label: "Guided", icon: Compass, color: "text-cyan-400" },
        { label: "Collab", icon: UserPlus, color: "text-blue-400" },
        { label: "Exam Mode", icon: Target, color: "text-rose-400" },
    ];

    const roleOptions: MixerOption[] = [
        { label: "Learning", icon: GraduationCap, color: "text-slate-300" },
        { label: "Teaching", icon: MonitorPlay, color: "text-purple-400" },
        { label: "Devil's Adv.", icon: Scale, color: "text-orange-400" },
    ];

    const focusAreas = [
        { id: "concepts", label: "Core Concepts", icon: Target },
        { id: "connections", label: "Neural Links", icon: Layers },
        { id: "calculation", label: "Mechanics", icon: Zap },
        { id: "standard", label: "Full Spectrum", icon: Sparkles }
    ];

    const intentOptions = [
        { id: "summarize", label: "Synthesize", desc: "Core structure" },
        { id: "apply", label: "Practice", desc: "Challenges" },
        { id: "criticize", label: "Analyze", desc: "Audit logic" }
    ];

    const handleGenerate = () => {
        onGenerate({
            depth: (["espresso", "filter", "deep-dive"][depth] as "espresso" | "filter" | "deep-dive") || "filter",
            scaffolding: (["high", "medium", "none"][scaffolding] as "high" | "medium" | "none") || "medium",
            role: (["receiving", "teaching", "devil"][role] as "receiving" | "teaching" | "devil") || "receiving",
            focus,
            mastery: (["novice", "competent", "expert"][mastery] as "novice" | "competent" | "expert")
        }, intent, sourceCheck);
    };

    return (
        <div className="w-full space-y-12 animate-in fade-in duration-1000">
            {/* Minimalist Header */}
            <div className="flex flex-col items-center gap-4">
                <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                <span className="text-[8px] font-black uppercase tracking-[0.5em] text-white/20">System Parameters</span>
            </div>

            <div className="relative">
                {/* Thin Outline Container */}
                <div className="p-8 md:p-14 rounded-[4rem] border border-white/5 bg-black/10 backdrop-blur-sm flex flex-col gap-12">

                    {/* Controls Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                        <MixerSlider label="Research Depth" value={depth} onChange={setDepth} options={depthOptions} />
                        <MixerSlider label="Structural Support" value={scaffolding} onChange={setScaffolding} options={scaffoldOptions} />
                        <MixerSlider label="Cognitive Lens" value={role} onChange={setRole} options={roleOptions} />
                        <MixerSlider label="Mastery Target" value={mastery} onChange={setMastery} options={masteryOptions} />
                    </div>

                    <div className="h-[1px] w-full bg-white/5" />

                    {/* Intent & Focus Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Intent Ghost Selectors */}
                        <div className="space-y-6">
                            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20">Learning Objective</span>
                            <div className="flex flex-wrap gap-2">
                                {intentOptions.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setIntent(opt.id as LearningIntent)}
                                        className={`
                                            px-6 py-3 rounded-full border transition-all duration-500 flex flex-col items-center gap-0.5
                                            ${intent === opt.id
                                                ? "border-indigo-500/50 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)] bg-indigo-500/5"
                                                : "border-white/5 text-white/30 hover:border-white/20"}
                                        `}
                                    >
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">{opt.label}</span>
                                        <span className="text-[7px] font-bold opacity-30 tracking-tight uppercase">{opt.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Focus Ghost Selectors */}
                        <div className="space-y-6">
                            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20">Neural Focus</span>
                            <div className="flex flex-wrap gap-2">
                                {focusAreas.map((area) => (
                                    <button
                                        key={area.id}
                                        onClick={() => setFocus(area.id)}
                                        className={`
                                            px-5 py-3 rounded-full border transition-all duration-500 flex items-center gap-3
                                            ${focus === area.id
                                                ? "border-emerald-500/50 text-white shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-emerald-500/5"
                                                : "border-white/5 text-white/30 hover:border-white/20"}
                                        `}
                                    >
                                        <area.icon size={12} className={focus === area.id ? "text-emerald-400" : "text-white/20"} />
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">{area.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-10 pt-4">
                        {/* Minimal Reliability Toggle */}
                        <div className="space-y-4 w-full md:w-auto">
                            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 px-1">Source Filter</span>
                            <div className="flex gap-2 p-1 bg-white/5 rounded-full border border-white/5">
                                {(["high", "medium", "low"] as const).map(lvl => (
                                    <button
                                        key={lvl}
                                        onClick={() => setSourceCheck(lvl)}
                                        className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${sourceCheck === lvl
                                            ? "bg-white/10 text-white shadow-lg"
                                            : "text-white/20 hover:text-white/40"
                                            }`}
                                    >
                                        Lvl {lvl === "high" ? "01" : lvl === "medium" ? "02" : "03"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* MAIN ZEN ACTION */}
                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="
                                group relative px-12 h-16 rounded-full overflow-hidden
                                bg-transparent border border-indigo-500/30
                                transition-all duration-700 hover:border-indigo-500 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]
                                disabled:opacity-20 disabled:grayscale
                            "
                        >
                            <span className="relative z-10 flex items-center justify-center gap-6 text-indigo-400 group-hover:text-white transition-colors">
                                <h4 className="text-[10px] font-space font-extrabold text-white/30 uppercase tracking-[0.4em]">
                                    Didactic Target
                                </h4>
                                <span className="text-xs font-space font-extrabold uppercase tracking-[.4em]">
                                    {loading ? "Engaging..." : "Initialize Synthesis"}
                                </span>
                                <Zap className="group-hover:scale-125 transition-transform duration-700" size={18} />
                            </span>

                            {/* Subtle Breathing Glow */}
                            <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-colors duration-700" />
                            <motion.div
                                animate={{ opacity: [0.1, 0.3, 0.1] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute inset-0 border border-indigo-400/20 rounded-full"
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
