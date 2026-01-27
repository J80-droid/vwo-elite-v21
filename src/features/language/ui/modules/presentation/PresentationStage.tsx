import { useLanguageLabContext } from "@features/language/hooks/LanguageLabContext";
import { analyzeAudioEmotion } from "@shared/api/humeService";
import { useSettings } from "@shared/hooks/useSettings";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Brain, Mic, MicOff, Play, Save, Smile, Trash2, Zap } from "lucide-react";
import React, { useRef, useState } from "react";
import { toast } from "sonner";

export const PresentationStage: React.FC = () => {
    const { activeLanguage } = useLanguageLabContext();
    const { settings } = useSettings();
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{ suggestion: string; dominantEmotion: string; emotions: Record<string, number> } | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                handleAnalysis(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setAnalysisResult(null);
        } catch (err) {
            console.error("Failed to start recording:", err);
            toast.error("Microfoon toegang geweigerd.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
        }
    };

    const handleAnalysis = async (audioBlob: Blob) => {
        const apiKey = settings.aiConfig?.humeApiKey;
        if (!apiKey) {
            toast.error("Hume AI API key niet geconfigureerd.");
            return;
        }

        setIsAnalyzing(true);
        try {
            const arrayBuffer = await audioBlob.arrayBuffer();
            const result = await analyzeAudioEmotion({
                apiKey,
                audioData: arrayBuffer
            });
            setAnalysisResult(result);
            toast.success("Analyse voltooid!");
        } catch (err) {
            console.error("Analysis failed:", err);
            toast.error("Emotie-analyse mislukt.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="h-full flex flex-col p-8 md:p-12 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto w-full space-y-10">
                {/* Header */}
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                            <Mic size={32} className="text-orange-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white uppercase tracking-tight">Presentation Coach</h1>
                            <p className="text-slate-400 font-light">
                                Oefen je {activeLanguage?.toUpperCase()} presentatie en ontvang emotionele feedback via Hume AI.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Recording Visual */}
                <div className="aspect-video rounded-3xl bg-zinc-950 border border-white/5 relative overflow-hidden flex flex-col items-center justify-center p-12 transition-all duration-500">
                    {isRecording ? (
                        <div className="flex flex-col items-center gap-8">
                            <div className="relative">
                                <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                                <div className="w-24 h-24 rounded-full border-4 border-red-500 flex items-center justify-center relative z-10">
                                    <div className="w-16 h-16 bg-red-500 rounded-lg animate-pulse" />
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold text-white uppercase tracking-widest">Listening...</h3>
                                <p className="text-slate-500 text-sm font-mono uppercase tracking-tighter">Voice focus: Neural Analysis Active</p>
                            </div>
                            <button
                                onClick={stopRecording}
                                className="px-8 py-3 bg-red-500/10 border border-red-500/30 text-red-500 font-bold rounded-full hover:bg-red-500/20 transition-all flex items-center gap-2"
                            >
                                <MicOff size={18} /> Stop Recording
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-8">
                            <div className="p-8 rounded-full bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors">
                                <Mic size={48} className="text-slate-500" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold text-white uppercase tracking-widest">Ready to Record</h3>
                                <p className="text-slate-500 text-sm">Spreek je presentatie in voor AI feedback</p>
                            </div>
                            <button
                                onClick={startRecording}
                                className="px-12 py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl transition-all flex items-center gap-3 shadow-xl shadow-orange-500/20 group"
                            >
                                <Play size={20} className="fill-current" /> Start Speech
                            </button>
                        </div>
                    )}

                    {/* Analyzing Overlay */}
                    <AnimatePresence>
                        {isAnalyzing && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50 p-8 text-center"
                            >
                                <Brain size={48} className="text-orange-400 animate-bounce mb-6" />
                                <h3 className="text-2xl font-black text-white uppercase mb-2">Analyzing Neuro-Emotional state</h3>
                                <p className="text-slate-400 font-mono text-sm max-w-sm">Generating empathy-driven feedback based on Hume prosody models...</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Results Area */}
                {analysisResult && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6"
                    >
                        {/* Feedback Detail */}
                        <div className="p-8 rounded-3xl bg-zinc-950 border border-white/10 space-y-6">
                            <div className="flex items-center gap-3">
                                <Zap size={20} className="text-orange-400" />
                                <h4 className="font-bold text-white uppercase tracking-widest text-sm">Elite Feedback</h4>
                            </div>
                            <p className="text-lg text-white leading-relaxed italic">
                                "{analysisResult.suggestion}"
                            </p>
                            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-600 uppercase font-black">Dominant Emotion</span>
                                    <div className="flex items-center gap-2">
                                        <Smile size={14} className="text-emerald-400" />
                                        <span className="text-sm font-bold text-emerald-400">{analysisResult.dominantEmotion}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-colors">
                                        <Save size={18} />
                                    </button>
                                    <button className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/10 text-rose-500 transition-colors" onClick={() => setAnalysisResult(null)}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Score Breakdown */}
                        <div className="p-8 rounded-3xl bg-zinc-950 border border-white/10 space-y-6">
                            <div className="flex items-center gap-3">
                                <Brain size={20} className="text-purple-400" />
                                <h4 className="font-bold text-white uppercase tracking-widest text-sm">Neuro-Emotional Radar</h4>
                            </div>

                            <div className="space-y-4">
                                {Object.entries(analysisResult.emotions as Record<string, number>).map(([emotion, score]) => (
                                    <div key={emotion} className="space-y-2">
                                        <div className="flex justify-between text-xs font-mono uppercase tracking-tighter">
                                            <span className="text-slate-400">{emotion}</span>
                                            <span className="text-white">{(score * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${score * 100}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className="h-full bg-gradient-to-r from-orange-500 to-purple-500"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Hint Block */}
                {!analysisResult && !isRecording && (
                    <div className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/20 flex gap-4 items-start">
                        <AlertCircle className="text-orange-400 shrink-0 mt-0.5" size={20} />
                        <p className="text-sm text-orange-400/80 leading-relaxed">
                            Tip: Hume AI analyseert niet alleen wat je zegt, maar vooral <b>hoe</b> je het zegt.
                            Spreken met variatie in toon en tempo verbetert je score op "engagement".
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
