import { Brain, Gavel, RefreshCw, Scale, ShieldAlert } from "lucide-react";
import { useState } from "react";

// --- TYPES ---
type EthicalFramework = "utilitarianism" | "deontology" | "virtue";

interface Dilemma {
  id: string;
  title: string;
  description: string;
  context: string; // Filosofische context
}

import { geminiGenerate } from "@shared/api/geminiBase";
import { useTranslations } from "@shared/hooks/useTranslations";

const GENERATE_DILEMMA_PROMPT = `
    Genereer een kort maar krachtig ethisch dilemma (Trolley-Problem stijl) over moderne technologie.
    
    Format (JSON):
    {
        "id": "uuid",
        "title": "Titel",
        "description": "De situatie (max 2 zinnen).",
        "context": "Examen 2025: Welke vaktermen zijn hier relevant?"
    }
`;

export const EthicsEngine = () => {
  const { t } = useTranslations();
  const [dilemma, setDilemma] = useState<Dilemma | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [framework, setFramework] =
    useState<EthicalFramework>("utilitarianism");
  const [verdict, setVerdict] = useState<string | null>(null);

  const generateDilemma = async () => {
    setIsLoading(true);
    setDilemma(null);
    setVerdict(null);
    try {
      const result = await geminiGenerate(GENERATE_DILEMMA_PROMPT, "", {
        jsonMode: true,
      });
      if (!result || !result.content) return;
      const newDilemma = JSON.parse(result.content.replace(/```json|```/g, ""));
      // Ensure ID is unique if not provided correctly
      if (!newDilemma.id) newDilemma.id = crypto.randomUUID();

      setDilemma(newDilemma);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- STATE PER THEORIE ---

  // Utilisme (Bentham's Hedonistische Calculus)
  const [utilParams, setUtilParams] = useState({
    livesSaved: 5, // Aantal mensen gered
    livesSacrificed: 1, // Aantal mensen opgeofferd
    certainty: 90, // Zekerheid van de uitkomst (%)
    duration: 50, // Duur van het geluk (Jaren levensverwachting)
  });

  // Plichtethiek (Kant)
  const [kantParams, setKantParams] = useState({
    universalizable: false, // Kan dit een algemene wet worden?
    usesHumanAsMeans: false, // Gebruik je de motorrijder als middel?
    autonomous: true, // Is de handeling vrij gekozen?
  });

  // Deugdethiek (Aristoteles)
  const [virtueVal, setVirtueVal] = useState(50); // 0 = Laf, 50 = Moed, 100 = Roekeloos

  // --- LOGICA ENGINES ---

  const calculateUtilitarian = () => {
    // Simpele calculus: (Levens * Zekerheid) - Kosten
    const happinessScore =
      utilParams.livesSaved *
      utilParams.duration *
      (utilParams.certainty / 100);
    const sufferingScore = utilParams.livesSacrificed * utilParams.duration; // Offer weegt zwaar

    if (happinessScore > sufferingScore * 2) {
      return "CONCLUSIE: Uitwijken is moreel juist. Het 'grootste geluk voor het grootste aantal' wordt gemaximaliseerd (+Netto Nut).";
    } else {
      return "CONCLUSIE: Niet uitwijken. De onzekerheid of de 'kosten' van het offer zijn te hoog in verhouding tot de winst.";
    }
  };

  const calculateDeontology = () => {
    if (kantParams.usesHumanAsMeans) {
      return "CONCLUSIE: Verboden (Onethisch). Je gebruikt de motorrijder louter als middel om anderen te redden. Dit schendt de Categorisch Imperatief.";
    }
    if (!kantParams.universalizable) {
      return "CONCLUSIE: Verboden. De regel 'offer onschuldigen op om anderen te redden' kan geen algemene natuurwet zijn zonder zichzelf tegen te spreken.";
    }
    return "CONCLUSIE: Toelaatbaar. Zolang je uit plicht handelt en de ander niet als louter middel gebruikt.";
  };

  const calculateVirtue = () => {
    if (virtueVal < 30)
      return "Oordeel: LAFHEID. Niets doen uit angst om fouten te maken is geen deugd.";
    if (virtueVal > 70)
      return "Oordeel: ROEKELOOSHEID. Blind ingrijpen zonder de situatie te overzien getuigt niet van Phronèsis (verstandigheid).";
    return "Oordeel: MOED (Het Midden). De deugdzame bestuurder (of programmeur) kiest de actie die een verstandig mens in deze situatie zou kiezen.";
  };

  const handleAnalyze = () => {
    switch (framework) {
      case "utilitarianism":
        setVerdict(calculateUtilitarian());
        break;
      case "deontology":
        setVerdict(calculateDeontology());
        break;
      case "virtue":
        setVerdict(calculateVirtue());
        break;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 font-sans text-slate-200 h-full overflow-y-auto">
      {/* HEADER */}
      <div className="mb-8 flex items-center justify-between mt-12">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Scale className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">
              {t("philosophy.ethics.engine.title")}
            </h2>
            <p className="text-sm text-slate-400">
              {t("philosophy.ethics.engine.subtitle")}
            </p>
          </div>
        </div>

        {/* Framework Selector */}
        <div className="flex bg-slate-900/60 p-1 rounded-lg border border-white/10 backdrop-blur-md">
          {(
            ["utilitarianism", "deontology", "virtue"] as EthicalFramework[]
          ).map((fw) => (
            <button
              key={fw}
              onClick={() => {
                setFramework(fw);
                setVerdict(null);
              }}
              className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                framework === fw
                  ? "bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] border border-emerald-500/20"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              {fw === "utilitarianism"
                ? "Utilisme"
                : fw === "deontology"
                  ? "Plicht"
                  : "Deugd"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
        {/* LINKS: De Casus */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900/40 rounded-2xl border border-white/10 p-6 h-full relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />

            {!dilemma && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <button
                  onClick={generateDilemma}
                  className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black uppercase rounded-xl hover:scale-105 hover:bg-emerald-500/20 hover:border-emerald-500/50 shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)] transition-all"
                >
                  {t("philosophy.ethics.engine.start_simulation")}
                </button>
                <p className="text-xs text-slate-500">
                  {t("philosophy.ethics.engine.generate_hint")}
                </p>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <RefreshCw className="animate-spin text-emerald-500" />
              </div>
            )}

            {dilemma && (
              <div className="animate-in fade-in zoom-in-95">
                <h3 className="text-lg font-bold text-white mb-2">
                  {dilemma.title}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  {dilemma.description}
                </p>
                <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 text-xs text-slate-500">
                  <strong className="text-emerald-400 block mb-1 uppercase tracking-widest text-[10px]">
                    {t("philosophy.ethics.engine.context_label")}
                  </strong>
                  {dilemma.context}
                </div>
                <div className="mt-8 flex justify-center opacity-30 group-hover:opacity-60 transition-opacity">
                  <ShieldAlert className="w-24 h-24 text-emerald-500" />
                </div>
                <button
                  onClick={generateDilemma}
                  className="absolute bottom-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* MIDDEN: De Parameters (De 'Engine') */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-slate-900/60 rounded-2xl border border-white/10 p-8 flex-1">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black mb-8 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-500" />
              {framework === "utilitarianism"
                ? "Hedonistische Calculus (Bentham)"
                : framework === "deontology"
                  ? "Categorisch Imperatief (Kant)"
                  : "Het Gulden Midden (Aristoteles)"}
            </h3>

            {/* CONTROLS: UTILISME */}
            {framework === "utilitarianism" && (
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between text-xs mb-3 font-bold uppercase tracking-widest text-slate-400">
                    <span>Levens gered (Rechtuit)</span>
                    <span className="text-emerald-400">
                      {utilParams.livesSaved}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={utilParams.livesSaved}
                    onChange={(e) =>
                      setUtilParams({
                        ...utilParams,
                        livesSaved: parseInt(e.target.value),
                      })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-3 font-bold uppercase tracking-widest text-slate-400">
                    <span>Levens geofferd (Uitwijken)</span>
                    <span className="text-rose-400">
                      {utilParams.livesSacrificed}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={utilParams.livesSacrificed}
                    onChange={(e) =>
                      setUtilParams({
                        ...utilParams,
                        livesSacrificed: parseInt(e.target.value),
                      })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 hover:accent-rose-400 transition-all"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-3 font-bold uppercase tracking-widest text-slate-400">
                    <span>Zekerheid van uitkomst</span>
                    <span className="text-emerald-400">
                      {utilParams.certainty}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={utilParams.certainty}
                    onChange={(e) =>
                      setUtilParams({
                        ...utilParams,
                        certainty: parseInt(e.target.value),
                      })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
                  />
                </div>
              </div>
            )}

            {/* CONTROLS: DEONTOLOGIE */}
            {framework === "deontology" && (
              <div className="space-y-6">
                <div
                  className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-white/5 hover:border-white/10 transition-colors group cursor-pointer"
                  onClick={() =>
                    setKantParams({
                      ...kantParams,
                      universalizable: !kantParams.universalizable,
                    })
                  }
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-widest text-white mb-1">
                      Universaliseerbaar?
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Kan dit een algemene wet worden?
                    </span>
                  </div>
                  <button
                    className={`w-12 h-6 rounded-full transition-colors relative ${kantParams.universalizable ? "bg-emerald-500" : "bg-slate-700"}`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${kantParams.universalizable ? "translate-x-6" : ""}`}
                    />
                  </button>
                </div>
                <div
                  className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-white/5 hover:border-white/10 transition-colors group cursor-pointer"
                  onClick={() =>
                    setKantParams({
                      ...kantParams,
                      usesHumanAsMeans: !kantParams.usesHumanAsMeans,
                    })
                  }
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-widest text-white mb-1">
                      Mens als middel?
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Respecteer je de waardigheid?
                    </span>
                  </div>
                  <button
                    className={`w-12 h-6 rounded-full transition-colors relative ${kantParams.usesHumanAsMeans ? "bg-rose-500" : "bg-slate-700"}`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${kantParams.usesHumanAsMeans ? "translate-x-6" : ""}`}
                    />
                  </button>
                </div>
                <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-[10px] text-slate-500 italic leading-relaxed">
                  <span className="text-emerald-500 font-bold uppercase mr-1">
                    Kant:
                  </span>
                  Je mag een mens nooit louter als middel gebruiken, ook niet om
                  5 anderen te redden. De Categorisch Imperatief is een absolute
                  morele wet.
                </div>
              </div>
            )}

            {/* CONTROLS: DEUGD */}
            {framework === "virtue" && (
              <div className="py-4">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-6">
                  <span className="text-slate-600">Lafheid (Gebrek)</span>
                  <span className="text-emerald-400">Moed (Midden)</span>
                  <span className="text-slate-600">Roekeloosheid</span>
                </div>
                <div className="relative pt-2">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-emerald-500/30" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={virtueVal}
                    onChange={(e) => setVirtueVal(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
                  />
                </div>
                <div className="mt-12 text-center">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    Gekarakteriseerde Houding
                  </div>
                  <div className="text-xl font-bold text-white italic">
                    {virtueVal < 35
                      ? "Passief / Angstig"
                      : virtueVal > 65
                        ? "Impulsief / Agressief"
                        : "Verstandig / Beheerst"}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleAnalyze}
            className="w-full py-5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/50 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(16,185,129,0.1)] hover:shadow-[0_0_50px_rgba(16,185,129,0.2)] group"
          >
            <Gavel className="w-5 h-5 group-hover:rotate-12 transition-transform drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
            <span className="drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]">
              {t("philosophy.ethics.engine.generate_verdict")}
            </span>
          </button>
        </div>

        {/* RECHTS: Het Oordeel (Verdict) */}
        <div className="lg:col-span-3">
          <div
            className={`h-full rounded-3xl border p-8 flex flex-col items-center justify-center text-center transition-all duration-700 relative overflow-hidden ${
              verdict
                ? "bg-emerald-950/20 border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.1)]"
                : "bg-slate-900/20 border-white/5 border-dashed"
            }`}
          >
            {!verdict && (
              <div className="text-slate-600 space-y-4">
                <Brain className="w-16 h-16 mx-auto mb-3 opacity-10 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-widest">
                  {t("philosophy.ethics.engine.waiting")}
                </p>
                <div className="w-12 h-0.5 bg-white/5 mx-auto" />
              </div>
            )}

            {verdict && (
              <div className="animate-in zoom-in-95 duration-500 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <Scale className="w-8 h-8 text-emerald-500" />
                </div>
                <h4 className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px] mb-4">
                  {t("philosophy.ethics.engine.verdict")}
                </h4>
                <p className="text-white text-base leading-relaxed font-medium italic">
                  "{verdict}"
                </p>

                <div className="mt-10 pt-6 border-t border-emerald-500/20 text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                  {t("philosophy.ethics.engine.validated")}
                </div>
              </div>
            )}

            {/* Background Accent */}
            <div
              className={`absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-[100px] transition-all duration-1000 ${verdict ? "bg-emerald-500/20" : "bg-transparent"}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
