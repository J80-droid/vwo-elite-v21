import { useEngineState } from "@shared/hooks/useEngineState";
import { InteractiveComponentSchema } from "@shared/types/lesson.schema";
import { AnimatePresence, motion } from "framer-motion";
import {
    BookOpen,
    ClipboardList,
    FileText,
    HelpCircle,
    MessageSquare,
    Quote,
    Search,
    Send
} from "lucide-react";
import React, { useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import { z } from "zod";

type ResearchComponent = Extract<z.infer<typeof InteractiveComponentSchema>, { type: 'research-copilot' }>;

/**
 * APA Citation Generator Module
 * Auto-formats sources into APA 7th Edition style.
 */
const APACitationModule: React.FC = () => {
    const [type, setType] = useEngineState<'website' | 'book'>('apa-type', 'website');
    const [fields, setFields] = useEngineState('apa-fields', {
        author: '',
        date: '',
        title: '',
        source: '',
        url: ''
    });

    const citation = useMemo(() => {
        if (!fields.author || !fields.title) return "Vul minimaal auteur en titel in...";

        const authorPart = fields.author.split(' ').map((n, i, arr) => i === arr.length - 1 ? n : n[0] + '.').join(' ');
        const datePart = fields.date ? `(${fields.date})` : '(z.d.)';
        const titlePart = type === 'book' ? `*${fields.title}*` : fields.title;

        if (type === 'website') {
            return `${authorPart} ${datePart}. ${titlePart}. Geraadpleegd van ${fields.source || 'Website'}: ${fields.url}`;
        }
        return `${authorPart} ${datePart}. ${titlePart}. ${fields.source || 'Uitgever'}.`;
    }, [fields, type]);

    return (
        <div className="flex flex-col gap-6 p-6 bg-obsidian-900/50 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <Quote className="w-4 h-4" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-tight">APA-Generator (7e editie)</h4>
                    <p className="text-[10px] text-white/40 font-medium">Bronvermelding Automatisering</p>
                </div>
            </div>

            <div className="flex gap-2 mb-2">
                <button
                    onClick={() => setType('website')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${type === 'website' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-400'}`}
                >
                    Website
                </button>
                <button
                    onClick={() => setType('book')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${type === 'book' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-400'}`}
                >
                    Boek
                </button>
            </div>

            <div className="space-y-3">
                <input
                    placeholder="Auteur (bijv. Jansen, P.)"
                    className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                    value={fields.author}
                    onChange={e => setFields({ ...fields, author: e.target.value })}
                />
                <input
                    placeholder="Jaar / Datum"
                    className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                    value={fields.date}
                    onChange={e => setFields({ ...fields, date: e.target.value })}
                />
                <input
                    placeholder="Titel"
                    className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                    value={fields.title}
                    onChange={e => setFields({ ...fields, title: e.target.value })}
                />
                {type === 'website' && (
                    <input
                        placeholder="URL"
                        className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                        value={fields.url}
                        onChange={e => setFields({ ...fields, url: e.target.value })}
                    />
                )}
            </div>

            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <span className="text-[10px] text-indigo-300 font-bold uppercase block mb-2">Resultaat</span>
                <p className="text-sm font-serif text-white/90 italic select-all cursor-copy">
                    {citation}
                </p>
            </div>
        </div>
    );
};

/**
 * Survey Analyzer Module
 * Visualizes correlation in mock survey data.
 */
const SurveyAnalyzerModule: React.FC = () => {
    // Mock data mimicking a student survey
    const data = [
        { subject: 'Slaap', score: 8, stress: 3 },
        { subject: 'Sport', score: 7, stress: 4 },
        { subject: 'Huiswerk', score: 4, stress: 8 },
        { subject: 'Gaming', score: 9, stress: 2 },
        { subject: 'Socials', score: 6, stress: 5 },
    ];

    return (
        <div className="flex flex-col gap-6 p-6 bg-obsidian-900/50 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-tight">Enquête Analyzer</h4>
                    <p className="text-[10px] text-white/40 font-medium">Correlatie & Data Visualisatie</p>
                </div>
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="subject" stroke="#666" fontSize={10} />
                        <YAxis stroke="#666" fontSize={10} />
                        <Tooltip
                            contentStyle={{ background: '#0a0a0c', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' }}
                        />
                        <Legend />
                        <Bar dataKey="score" name="Tevredenheid" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="stress" name="Stress Niveau" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex gap-3 items-start">
                <Search className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-white/40 font-medium leading-relaxed">
                    Check of je steekproef representatief is (N &gt; 30). In dit voorbeeld zien we een negatieve correlatie tussen 'Huiswerk' en 'Tevredenheid'.
                </p>
            </div>
        </div>
    );
};

/**
 * Research Question Refiner
 * Socratic interface to sharpen the "Hoofdvraag".
 */
const QuestionRefinerModule: React.FC = () => {
    const [question, setQuestion] = useEngineState('research-question', '');
    const [feedback, setFeedback] = useState<string | null>(null);

    const handleCheck = () => {
        if (question.length < 10) {
            setFeedback("Je vraag is te kort. Wees specifieker.");
            return;
        }
        if (question.endsWith('?')) {
            if (question.toLowerCase().startsWith('wat is')) {
                setFeedback("Pas op: 'Wat is'-vragen zijn vaak beschrijvend. Probeer een verklarende vraag ('Hoe...', 'In hoeverre...').");
            } else {
                setFeedback("Goede start! Is deze vraag meetbaar? Heb je de variabelen (afhankelijk/onafhankelijk) helder?");
            }
        } else {
            setFeedback("Een hoofdvraag moet eindigen met een vraagteken.");
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 bg-obsidian-900/50 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                    <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-tight">Hoofdvraag Refiner</h4>
                    <p className="text-[10px] text-white/40 font-medium">Socratische Vraagstelling</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="relative">
                    <textarea
                        value={question}
                        onChange={e => setQuestion(e.target.value)}
                        placeholder="Typ je hoofdvraag hier..."
                        className="w-full h-32 p-4 bg-black/20 border border-white/10 rounded-xl text-sm text-white focus:border-amber-500 outline-none transition-colors resize-none"
                    />
                    <button
                        onClick={handleCheck}
                        className="absolute bottom-4 right-4 p-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition-all font-bold text-xs flex items-center gap-2"
                    >
                        <Send size={14} />
                        Check
                    </button>
                </div>

                <AnimatePresence>
                    {feedback && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 items-start"
                        >
                            <MessageSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-100 font-medium">{feedback}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export const ResearchEngine: React.FC<{ component: ResearchComponent; mastery?: string }> = ({ component, mastery }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl mx-auto"
        >
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-white">
                    <BookOpen size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">PWS Co-Pilot</h3>
                    <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Research & Academic Skills</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {component.config.module === 'apa-generator' && <APACitationModule />}
                {component.config.module === 'survey-analyzer' && <SurveyAnalyzerModule />}
                {component.config.module === 'question-refiner' && <QuestionRefinerModule />}

                {/* Contextual Tip */}
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-3 text-indigo-400">
                            <FileText size={16} />
                            <span className="text-xs font-black uppercase tracking-widest">Research Tip</span>
                        </div>
                        <p className="text-sm text-white/60 leading-relaxed">
                            {component.config.module === 'apa-generator' && "Wees consistent! Een slordige literatuurlijst kost je punten op Domein A (Vaardigheden)."}
                            {component.config.module === 'survey-analyzer' && "Correlatie is geen causaliteit. Als A en B samen stijgen, betekent dat niet dat A B veroorzaakt."}
                            {component.config.module === 'question-refiner' && "Een goede hoofdvraag is 'enkelvoudig' (niet twee vragen in één) en 'open' (geen ja/nee)."}
                        </p>
                    </div>
                    {mastery === 'expert' && (
                        <div className="mt-6 pt-4 border-t border-white/5">
                            <span className="text-[10px] text-white/30 uppercase font-black tracking-widest">Expert Mode Enabled</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
