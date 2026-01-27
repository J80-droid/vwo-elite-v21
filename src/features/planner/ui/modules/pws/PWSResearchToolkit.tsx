import { EliteTask } from "@entities/planner/model/task";
import { usePlannerEliteStore } from "@shared/model/plannerStore";
import { usePWSStore } from "@shared/model/pwsStore";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Brain,
  Check,
  Copy,
  ExternalLink,
  FlaskConical,
  PenTool,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";

type ToolTab = "project" | "apa" | "hypothesis" | "tips" | "craap";

export const PWSResearchToolkit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ToolTab>("project");

  return (
    <div className="flex flex-col h-full bg-black/40 border-l border-white/5 backdrop-blur-md">
      {/* Elite Tab Header */}
      <div className="flex border-b border-white/5 bg-white/[0.02] overflow-x-auto no-scrollbar">
        {[
          { id: "project", icon: Target, label: "PROJECT" },
          { id: "apa", icon: BookOpen, label: "APA" },
          { id: "hypothesis", icon: FlaskConical, label: "HYPO" },
          { id: "craap", icon: ShieldCheck, label: "CRAAP" },
          { id: "tips", icon: PenTool, label: "TIPS" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ToolTab)}
            className={`flex-1 p-4 flex flex-col items-center justify-center gap-1.5 transition-all relative group
                            ${activeTab === tab.id ? "text-rose-400" : "text-slate-500 hover:text-slate-300"}`}
          >
            <tab.icon
              size={16}
              className={`transition-transform duration-300 ${activeTab === tab.id ? "scale-110" : "group-hover:scale-105"}`}
            />
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="active-tab-toolkit"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content Body */}
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="h-full"
          >
            {activeTab === "project" && <ProjectProgress />}
            {activeTab === "apa" && <ApaGenerator />}
            {activeTab === "hypothesis" && <HypothesisBuilder />}
            {activeTab === "craap" && <SourceEvaluator />}
            {activeTab === "tips" && <ResearchTips />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Subcomponents ---

const ProjectProgress: React.FC = () => {
  const { addTask } = usePlannerEliteStore();
  const { project } = usePWSStore();

  const getLocalDateStr = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleAddMilestone = () => {
    const now = new Date().toISOString();
    const newTask: EliteTask = {
      id: `pws-${Date.now()}`,
      title: "Nieuwe Mijlpaal",
      date: getLocalDateStr(new Date()),
      duration: 60,
      type: "pws",
      priority: "high",
      energyRequirement: "medium",
      isFixed: false,
      isAllDay: false,
      completed: false,
      status: "todo",
      createdAt: now,
      updatedAt: now,
      source: "manual",
    };
    addTask(newTask);
  };

  return (
    <div className="space-y-8 pb-32">
      <div className="space-y-1">
        <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
          <Target size={16} className="text-rose-500" />
          Project Management
        </h4>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">
          Beheer je PWS voortgang
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={handleAddMilestone}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/60 rounded-2xl text-[10px] text-rose-400 font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_15px_rgba(244,63,94,0.1)] hover:shadow-[0_0_20px_rgba(244,63,94,0.25)]"
        >
          <Plus className="w-4 h-4" />
          Mijlpaal Toevoegen
        </button>

        <button className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] text-slate-300 font-black uppercase tracking-[0.2em] transition-all group">
          <Brain className="w-4 h-4 text-cyan-400 group-hover:animate-pulse" />
          AI Thesis Advisor
        </button>
      </div>

      {/* Checklist */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1 h-4 bg-rose-500 rounded-full" />
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
            Checklist
          </h4>
        </div>

        <div className="grid gap-2">
          <CheckItem label="Onderwerpskeuze" checked />
          <CheckItem label="Onderzoeksplan" checked />
          <CheckItem label="Hoofdvraag- & Deelvragen" checked />
          <CheckItem label="Literatuuronderzoek" checked={false} />
          <CheckItem label="Dataverzameling" checked={false} />
          <CheckItem label="Analyse" checked={false} />
          <CheckItem label="Conclusie & Reflectie" checked={false} />
        </div>
      </div>

      {/* Citations Preview (if any) */}
      {project?.citations && project.citations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-amber-500 rounded-full" />
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                Bronnen ({project.citations.length})
              </h4>
            </div>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl group cursor-pointer hover:bg-white/10 transition-all">
            <div className="flex items-center gap-3">
              <BookOpen className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-[10px] text-slate-400 truncate font-serif italic">
                {project.citations[0]}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CheckItem: React.FC<{ label: string; checked: boolean }> = ({
  label,
  checked,
}) => (
  <div className="group flex items-center gap-4 px-5 py-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all cursor-pointer">
    <div
      className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${
        checked
          ? "bg-emerald-500 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
          : "border-white/10 group-hover:border-rose-500/50"
      }`}
    >
      {checked && <Check size={12} className="text-white" />}
    </div>
    <span
      className={`text-xs font-bold uppercase tracking-widest transition-colors ${checked ? "text-slate-600 line-through" : "text-slate-300 group-hover:text-white"}`}
    >
      {label}
    </span>
  </div>
);

const ApaGenerator: React.FC = () => {
  const { addCitation, project, removeCitation } = usePWSStore();
  const citations = project?.citations || [];
  const [type, setType] = useState<"website" | "book">("website");
  const [fields, setFields] = useState({
    author: "",
    year: "",
    title: "",
    source: "",
    url: "",
  });
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const generate = () => {
    let cit = "";
    if (type === "website") {
      cit = `${fields.author || "Anoniem"} (${fields.year || "n.d."}). ${fields.title}. Geraadpleegd op ${new Date().toLocaleDateString("nl-NL")}, van ${fields.url}`;
    } else {
      cit = `${fields.author}. (${fields.year}). ${fields.title}. ${fields.source}.`;
    }
    setResult(cit);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!result) return;
    addCitation(result);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
          <BookOpen size={16} className="text-rose-500" />
          APA 7th Generator
        </h4>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">
          Citeer je bronnen perfect
        </p>
      </div>

      <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5 shadow-inner">
        <button
          onClick={() => setType("website")}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${type === "website" ? "bg-rose-500/10 text-rose-400 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]" : "bg-transparent text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5"}`}
        >
          Website
        </button>
        <button
          onClick={() => setType("book")}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${type === "book" ? "bg-rose-500/10 text-rose-400 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]" : "bg-transparent text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5"}`}
        >
          Boek
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Auteur(s)
          </span>
          <input
            placeholder="Bijv. Jansen, J."
            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:border-rose-500/50 focus:outline-none transition-colors"
            value={fields.author}
            onChange={(e) => setFields({ ...fields, author: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Jaar
            </span>
            <input
              placeholder="2024"
              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:border-rose-500/50 focus:outline-none transition-colors"
              value={fields.year}
              onChange={(e) => setFields({ ...fields, year: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">
              {type === "website" ? "Naam Website" : "Uitgever"}
            </span>
            <input
              placeholder={type === "website" ? "NOS.nl" : "Meulenhoff"}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:border-rose-500/50 focus:outline-none transition-colors"
              value={fields.source}
              onChange={(e) => setFields({ ...fields, source: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Titel
          </span>
          <input
            placeholder="De impact van AI..."
            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:border-rose-500/50 focus:outline-none transition-colors"
            value={fields.title}
            onChange={(e) => setFields({ ...fields, title: e.target.value })}
          />
        </div>

        {type === "website" && (
          <div className="space-y-1.5">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">
              URL
            </span>
            <input
              placeholder="https://example.com/..."
              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:border-rose-500/50 focus:outline-none transition-colors"
              value={fields.url}
              onChange={(e) => setFields({ ...fields, url: e.target.value })}
            />
          </div>
        )}
      </div>

      <button
        onClick={generate}
        className="w-full py-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/60 rounded-2xl text-[10px] text-rose-400 font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_15px_rgba(244,63,94,0.1)] hover:shadow-[0_0_20px_rgba(244,63,94,0.25)] hover:scale-[1.02] active:scale-95"
      >
        Genereer Bronvermelding
      </button>

      {result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-3"
        >
          <div className="p-6 bg-rose-500/5 border border-rose-500/20 rounded-3xl relative group">
            <p className="text-xs text-rose-100 font-serif italic leading-relaxed pr-8">
              {result}
            </p>
            <button
              onClick={() => copyToClipboard(result)}
              className="absolute top-4 right-4 p-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl text-rose-400 transition-all opacity-0 group-hover:opacity-100"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          <button
            onClick={handleSave}
            className={`w-full py-4 border rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3
                            ${saved ? "bg-emerald-500 text-white border-emerald-500" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"}`}
          >
            {saved ? <Check size={16} /> : <Save size={16} />}
            {saved ? "Bewaard!" : "Opslaan in lijst"}
          </button>
        </motion.div>
      )}

      {/* Saved Citations List */}
      {citations.length > 0 && (
        <div className="pt-8 border-t border-white/5 space-y-4">
          <h5 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
            Opgeslagen Bronnen
          </h5>
          <div className="space-y-3">
            {citations.map((cit, idx) => (
              <div
                key={idx}
                className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-2 relative group hover:bg-white/[0.04] transition-all"
              >
                <p className="text-[10px] text-slate-400 font-serif leading-relaxed line-clamp-2">
                  {cit}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(cit)}
                    className="text-[8px] font-black text-rose-400 uppercase tracking-widest hover:text-rose-300 transition-colors"
                  >
                    Copy
                  </button>
                  <span className="text-slate-800 text-[8px]">•</span>
                  <button
                    onClick={() => removeCitation(idx)}
                    className="text-[8px] font-black text-slate-600 uppercase tracking-widest hover:text-rose-500 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const HypothesisBuilder: React.FC = () => {
  const { addHypothesis } = usePWSStore();
  const [data, setData] = useState({ claim: "", counter: "", arguments: "" });
  const [saved, setSaved] = useState(false);

  const formula = `Ondanks ${data.counter || "[tegenargument]"}, is het aannemelijk dat ${data.claim || "[stelling]"}, omdat ${data.arguments || "[argumenten]"}.`;

  const handleSave = () => {
    if (!data.claim || !data.counter) return;
    addHypothesis({
      claim: data.claim,
      counter: data.counter,
      arguments: data.arguments,
      formula,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
          <FlaskConical size={16} className="text-amber-500" />
          Hypothese Architect
        </h4>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">
          Bouw een waterdichte stelling
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1 font-mono">
            STEP 01: De Stelling
          </span>
          <textarea
            className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-4 text-xs text-white focus:border-amber-500/50 outline-none h-24 resize-none transition-all"
            placeholder="Bijv: Het gebruik van AI in het onderwijs leidt tot een afname van kritisch denkvermogen bij leerlingen."
            value={data.claim}
            onChange={(e) => setData({ ...data, claim: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1 font-mono">
            STEP 02: Tegenargument
          </span>
          <input
            className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-4 text-xs text-white focus:border-amber-500/50 outline-none transition-all"
            placeholder="Bijv: De verhoogde efficiëntie voor docenten"
            value={data.counter}
            onChange={(e) => setData({ ...data, counter: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1 font-mono">
            STEP 03: Onderbouwing
          </span>
          <textarea
            className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-4 text-xs text-white focus:border-amber-500/50 outline-none h-24 resize-none transition-all"
            placeholder="Omdat leerlingen minder zelf hoeven te structureren..."
            value={data.arguments}
            onChange={(e) => setData({ ...data, arguments: e.target.value })}
          />
        </div>
      </div>

      <div className="p-8 bg-amber-500/[0.03] border border-amber-500/10 rounded-[2rem] relative overflow-hidden group">
        <div className="relative z-10">
          <h5 className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Sparkles size={12} />
            Elite Formule
          </h5>
          <p className="text-sm text-white font-serif italic leading-relaxed">
            "{formula}"
          </p>
        </div>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <FlaskConical size={80} className="text-amber-500" />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!data.claim || !data.counter}
        className={`w-full py-4 border rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-30 disabled:pointer-events-none
                    ${saved ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:border-amber-500/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:scale-[1.02]"}`}
      >
        {saved ? <Check size={18} /> : <Save size={18} />}
        {saved ? "Hypothese Bewaard" : "Hypothese Initialiseren"}
      </button>
    </div>
  );
};

const SourceEvaluator: React.FC = () => {
  const [scores, setScores] = useState({ c: 5, r: 5, a: 5, acc: 5, p: 5 });

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const percentage = Math.round((total / 50) * 100);

  const getVerdict = () => {
    if (percentage < 50)
      return {
        text: "REJECTED: ONBETROUWBAAR",
        color: "text-rose-500",
        bg: "bg-rose-500/5",
        border: "border-rose-500/20",
      };
    if (percentage < 80)
      return {
        text: "CAUTION: GEBRUIK MET MATE",
        color: "text-amber-500",
        bg: "bg-amber-500/5",
        border: "border-amber-500/20",
      };
    return {
      text: "ELITE: ZEER BETROUWBAAR",
      color: "text-emerald-500",
      bg: "bg-emerald-500/5",
      border: "border-emerald-500/20",
    };
  };

  const verdict = getVerdict();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
            <ShieldCheck size={16} className="text-cyan-400" />
            CRAAP Validator
          </h4>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">
            Bron-kwaliteit analyse
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[32px] font-black text-white leading-none tracking-tighter">
            {percentage}%
          </span>
          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
            Score
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {[
          {
            key: "c",
            label: "CURRENCY",
            desc: "Is de informatie nog steeds relevant of verouderd?",
            color: "bg-rose-500",
          },
          {
            key: "r",
            label: "RELEVANCE",
            desc: "Past deze bron direct bij je onderzoeksvragen?",
            color: "bg-indigo-500",
          },
          {
            key: "a",
            label: "AUTHORITY",
            desc: "Zijn de credentials van de auteur verifieerbaar?",
            color: "bg-emerald-500",
          },
          {
            key: "acc",
            label: "ACCURACY",
            desc: "Worden beweringen ondersteund door refs?",
            color: "bg-amber-500",
          },
          {
            key: "p",
            label: "PURPOSE",
            desc: "Is er een verborgen agenda of commercieel doel?",
            color: "bg-cyan-500",
          },
        ].map((item) => (
          <div key={item.key} className="space-y-3 group">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <div className={`w-1 h-1 rounded-full ${item.color}`} />
                  {item.label}
                </span>
              </div>
              <span className="text-[10px] font-black text-white font-mono">
                {scores[item.key as keyof typeof scores]}/10
              </span>
            </div>
            <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${scores[item.key as keyof typeof scores] * 10}%`,
                }}
                className={`h-full ${item.color} shadow-[0_0_10px_rgba(255,255,255,0.2)]`}
              />
              <input
                type="range"
                min="0"
                max="10"
                value={scores[item.key as keyof typeof scores]}
                onChange={(e) =>
                  setScores({ ...scores, [item.key]: parseInt(e.target.value) })
                }
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0 duration-300">
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      <div
        className={`p-6 rounded-[2rem] border ${verdict.bg} ${verdict.border} transition-all duration-700`}
      >
        <div className="text-center space-y-2">
          <p
            className={`text-[10px] font-black uppercase tracking-[0.3em] ${verdict.color}`}
          >
            {verdict.text}
          </p>
          <div className="h-0.5 w-12 bg-white/10 mx-auto rounded-full" />
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">
            Gevalideerd door Elite VWO Engine
          </p>
        </div>
      </div>
    </div>
  );
};

const ResearchTips: React.FC = () => (
  <div className="space-y-8">
    <div className="space-y-1">
      <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
        <PenTool size={16} className="text-purple-400" />
        Elite Research Tips
      </h4>
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">
        Geheimen van de hoogste cijfers
      </p>
    </div>

    <ul className="space-y-4">
      {[
        {
          title: "Triangulatie",
          text: "Gebruik altijd minstens 3 onafhankelijke bronnen voor een grote claim om je validiteit te versterken.",
          color: "purple",
          icon: <Target size={14} />,
        },
        {
          title: 'De "So What?" Test',
          text: 'Vraag bij elke alinea: "Waarom is dit relevant voor mijn hoofdvraag?". Draagt het niet bij? Schrappen.',
          color: "emerald",
          icon: <ExternalLink size={14} />,
        },
        {
          title: "Kill your darlings",
          text: "Wees niet bang om tekst weg te gooien als het de structuur vertroebelt. Kwaliteit boven kwantiteit.",
          color: "rose",
          icon: <Trash2 size={14} />,
        },
      ].map((tip, i) => (
        <motion.li
          key={i}
          whileHover={{ x: 5 }}
          className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-3 hover:bg-white/[0.04] transition-all"
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 bg-${tip.color}-500/10 rounded-xl text-${tip.color}-400`}
            >
              {tip.icon}
            </div>
            <h6 className="text-[10px] font-black text-white uppercase tracking-widest">
              {tip.title}
            </h6>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
            {tip.text}
          </p>
        </motion.li>
      ))}
    </ul>
  </div>
);
