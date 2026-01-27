import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  ShieldAlert,
} from "lucide-react";
import React, { useState } from "react";

interface WizardState {
  durationMonths: number;
  destination: "EU" | "Outside-EU" | "UK" | "Australia";
  working: boolean;
  age: number;
  returnPlan: boolean;
}

export const GapYearAdminWizard: React.FC = () => {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>({
    durationMonths: 6,
    destination: "Outside-EU",
    working: false,
    age: 18,
    returnPlan: true,
  });

  const updateState = <K extends keyof WizardState>(
    key: K,
    value: WizardState[K],
  ) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const next = () => setStep((prev) => prev + 1);
  const prev = () => setStep((prev) => prev - 1);

  const checkCompliance = () => {
    const issues = [];
    const warnings = [];
    const actions = [];

    // 1. BRP (8 Month Rule)
    if (state.durationMonths > 8) {
      issues.push({
        title: "Uitschrijven BRP Verplicht",
        desc: "Je gaat langer dan 8 maanden weg. Volgens de wet MOET je je uitschrijven bij de gemeente.",
        severity: "critical",
      });
      actions.push("Maak afspraak gemeente (5 dgn voor vertrek)");
    } else {
      actions.push("Blijf ingeschreven op huisadres");
    }

    // 2. Insurance / WLZ
    if (state.working) {
      issues.push({
        title: "Vervallen NL Zorgverzekering",
        desc: "Omdat je werkt in het buitenland, kan je NL verzekeringsplicht vervallen. Check dit bij de SVB!",
        severity: "warning",
      });
      actions.push("Vraag Wlz-beoordeling aan bij SVB");
      actions.push('Regel "Globetrotter" verzekering');
    } else if (state.durationMonths > 8) {
      issues.push({
        title: "Check Zorgverzekering",
        desc: "Bij uitschrijving BRP vervalt vaak je basisverzekering. Je hebt een particuliere polis nodig.",
        severity: "warning",
      });
      actions.push("Regel Particuliere Verzekering (bijv. Allianz/JoHo)");
    }

    // 3. Financial
    if (state.age >= 18 && state.durationMonths > 8) {
      warnings.push("Let op: Geen opbouw AOW (2% korting per jaar)");
      warnings.push("Geen recht op Zorgtoeslag indien verzekering stopt");
    }

    // 4. Visa Check
    if (state.destination === "Outside-EU") {
      actions.push("Check Visumvoorwaarden (werkvisum vs toerist)");
    }
    if (state.destination === "Australia" && state.working) {
      // Implicit check if selection allows
      actions.push("Check Subclass 417 voorwaarden + $5000 bewijs");
    }
    if (state.destination === "UK") {
      warnings.push(
        'Brexit Alert: VK is "Derde Land". Hoge studiekosten & Visumplicht voor werk.',
      );
    }

    return { issues, warnings, actions };
  };

  const result = checkCompliance();

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white">
              Hoe lang ga je weg?
            </h3>
            <p className="text-slate-400">
              Het totaal aantal maanden in het buitenland in een periode van 12
              maanden.
            </p>
            <div className="flex flex-col gap-4">
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={state.durationMonths}
                onChange={(e) =>
                  updateState("durationMonths", parseInt(e.target.value))
                }
                className="w-full accent-blue-500"
              />
              <div className="text-center font-bold text-4xl text-blue-400">
                {state.durationMonths} Maanden
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updateState("durationMonths", 5)}
                className="px-4 py-2 rounded bg-white/5 hover:bg-white/10 text-sm"
              >
                Kort (&lt;8 mnd)
              </button>
              <button
                onClick={() => updateState("durationMonths", 9)}
                className="px-4 py-2 rounded bg-white/5 hover:bg-white/10 text-sm"
              >
                Lang (&gt;8 mnd)
              </button>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white">
              Wat zijn je plannen?
            </h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10">
                <span>Ga je werken (betaald)?</span>
                <input
                  type="checkbox"
                  checked={state.working}
                  onChange={(e) => updateState("working", e.target.checked)}
                  className="w-6 h-6 rounded accent-blue-500"
                />
              </label>

              <div className="space-y-2">
                <label className="block text-sm text-slate-400">
                  Bestemming
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["EU", "UK", "Australia", "Outside-EU"] as const).map(
                    (dest) => (
                      <button
                        key={dest}
                        onClick={() => updateState("destination", dest)}
                        className={`p-3 rounded-lg border text-sm font-bold ${state.destination === dest ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-white/5 border-white/10 text-slate-500"}`}
                      >
                        {dest === "Outside-EU" ? "Wereld (Overig)" : dest}
                      </button>
                    ),
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm text-slate-400">
                  Leeftijd bij vertrek
                </label>
                <div className="flex items-center gap-4 bg-white/5 p-3 rounded-lg">
                  <button
                    onClick={() =>
                      updateState("age", Math.max(16, state.age - 1))
                    }
                    className="text-xl font-bold"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-bold">
                    {state.age} Jaar
                  </span>
                  <button
                    onClick={() =>
                      updateState("age", Math.min(25, state.age + 1))
                    }
                    className="text-xl font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white mb-6">
              Jouw Admin Check 2026
            </h3>

            {/* Critical Issues */}
            {result.issues.length > 0 ? (
              <div className="space-y-3">
                {result.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border ${issue.severity === "critical" ? "bg-red-500/10 border-red-500/50" : "bg-amber-500/10 border-amber-500/50"}`}
                  >
                    <div className="flex items-center gap-2 font-bold mb-1">
                      {issue.severity === "critical" ? (
                        <ShieldAlert className="text-red-500" />
                      ) : (
                        <AlertTriangle className="text-amber-500" />
                      )}
                      <span
                        className={
                          issue.severity === "critical"
                            ? "text-red-400"
                            : "text-amber-400"
                        }
                      >
                        {issue.title}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">{issue.desc}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
                <CheckCircle className="text-emerald-400" />
                <span className="text-emerald-400 font-bold">
                  Geen grote administratieve obstakels gevonden!
                </span>
              </div>
            )}

            {/* Action Checklist */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                <FileText size={16} /> Actiepunten
              </h4>
              <ul className="space-y-2">
                {result.actions.map((action, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-300"
                  >
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    {action}
                  </li>
                ))}
                {result.warnings.map((warn, i) => (
                  <li
                    key={`w-${i}`}
                    className="flex items-start gap-2 text-sm text-slate-400 italic"
                  >
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                    {warn}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-3xl p-8 backdrop-blur-sm max-w-2xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${i === step ? "bg-blue-500 shadow-[0_0_10px_#3b82f6]" : i < step ? "bg-blue-900/50" : "bg-white/10"}`}
            />
          ))}
        </div>
        <h2 className="text-xs font-bold uppercase text-slate-500 tracking-widest">
          Bureaucratie Wizard 2026
        </h2>
      </div>

      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
        <button
          onClick={prev}
          disabled={step === 0}
          className="px-6 py-2 rounded-lg text-slate-400 font-bold hover:text-white disabled:opacity-30 transition-colors"
        >
          Terug
        </button>
        {step < 2 ? (
          <button
            onClick={next}
            className="px-8 py-2 bg-blue-500/10 border border-blue-500/50 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg font-bold shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] transition-all"
          >
            Volgende
          </button>
        ) : (
          <button
            onClick={() => setStep(0)}
            className="px-8 py-2 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20 rounded-lg font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all"
          >
            Opnieuw
          </button>
        )}
      </div>
    </div>
  );
};
