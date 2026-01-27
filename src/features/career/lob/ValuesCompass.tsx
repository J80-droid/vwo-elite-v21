import { VALUES_LIST } from "@shared/assets/data/valuesData";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, Save, Star, Trophy } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useLOBContext } from "./LOBContext";

// Back Button Component
const BackButton = () => (
  <Link
    to="/research/career"
    className="fixed top-24 left-8 z-50 p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-slate-400 hover:text-white transition-all"
  >
    <ArrowLeft size={24} />
  </Link>
);

export const ValuesCompass: React.FC = () => {
  const { valuesScores, saveValuesScores } = useLOBContext();
  const navigate = useNavigate();

  // Steps: 0 = Intro, 1 = Selection (pick 5-10), 2 = Ranking (Top 3), 3 = Results
  const [step, setStep] = useState(0);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [rankedValues, setRankedValues] = useState<string[]>([]); // Ordered top 3

  useEffect(() => {
    if (valuesScores && step === 0) {
      // Restore state logic if needed
    }
  }, [valuesScores, step]);

  const toggleSelection = (id: string) => {
    if (selectedValues.includes(id)) {
      setSelectedValues((prev) => prev.filter((v) => v !== id));
    } else {
      if (selectedValues.length >= 10) return; // Max 10 limit
      setSelectedValues((prev) => [...prev, id]);
    }
  };

  const handleSave = () => {
    // Save to DB
    saveValuesScores({ selected: selectedValues, top3: rankedValues });
    setStep(3);
  };

  // Helper to get value object
  const getVal = (id: string) => VALUES_LIST.find((v) => v.id === id);

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-black font-outfit text-white p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      <BackButton />

      <div className="max-w-4xl mx-auto relative z-10 pt-12">
        {/* --- INTRO --- */}
        {step === 0 && (
          <div className="text-center space-y-8 mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 mb-4 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
              <Star size={48} className="text-purple-400" />
            </div>
            <h1 className="text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
              Waarden Kompas
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Ontdek wat écht belangrijk voor je is. Jouw kernwaarden zijn het
              anker voor toekomstige keuzes in studie en carrière.
            </p>
            <button
              onClick={() => setStep(1)}
              className="px-8 py-4 bg-transparent border border-purple-400 text-purple-400 font-bold text-lg rounded-full hover:bg-purple-400/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all uppercase tracking-widest"
            >
              Start Ontdekking
            </button>
          </div>
        )}

        {/* --- SELECTION STEP --- */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold">
                Kies je top 5 tot 10 waarden
              </h2>
              <p className="text-slate-400 mt-2">
                Selecteer de woorden die jou het meest aanspreken. (
                {selectedValues.length}/10)
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {VALUES_LIST.map((val) => {
                const isSelected = selectedValues.includes(val.id);
                return (
                  <button
                    key={val.id}
                    onClick={() => toggleSelection(val.id)}
                    className={`p-4 rounded-xl border text-left transition-all duration-300 group relative overflow-hidden
                                            ${
                                              isSelected
                                                ? "bg-purple-500/20 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                                                : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10"
                                            }`}
                  >
                    <div
                      className={`font-bold mb-1 ${isSelected ? "text-white" : "text-slate-300 group-hover:text-white"}`}
                    >
                      {val.label}
                    </div>
                    <div className="text-xs text-slate-500 leading-tight">
                      {val.description}
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 text-purple-400">
                        <CheckCircle size={16} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="fixed bottom-8 left-0 right-0 flex justify-center p-4 bg-gradient-to-t from-black via-black/90 to-transparent z-20">
              <button
                disabled={selectedValues.length < 5}
                onClick={() => setStep(2)}
                className="px-10 py-3 bg-black border border-purple-500 text-purple-400 hover:bg-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded-full transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] uppercase tracking-widest"
              >
                Volgende Stap ({selectedValues.length})
              </button>
            </div>
            <div className="h-24" /> {/* Spacer */}
          </motion.div>
        )}

        {/* --- RANKING STEP --- */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold mb-2">Jouw Top 3</h2>
            <p className="text-slate-400 mb-8">
              Selecteer uit je vorige keuzes de allerbelangrijkste 3 waarden.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {[0, 1, 2].map((idx) => {
                const valId = rankedValues[idx];
                const val = valId ? getVal(valId) : null;
                return (
                  <div
                    key={idx}
                    className={`p-6 rounded-2xl border-2 border-dashed ${val ? "border-purple-500 bg-purple-500/10" : "border-white/10 bg-white/5"} flex flex-col items-center justify-center min-h-[160px] relative transition-colors`}
                  >
                    <div className="absolute -top-4 bg-black px-3 py-1 rounded-full border border-white/10 text-xs font-bold uppercase tracking-widest text-slate-500">
                      Nummer {idx + 1}
                    </div>
                    {val ? (
                      <>
                        <Trophy
                          className={`mb-3 ${idx === 0 ? "text-yellow-400" : idx === 1 ? "text-slate-300" : "text-amber-600"}`}
                          size={32}
                        />
                        <span className="text-xl font-bold">{val.label}</span>
                        <button
                          onClick={() =>
                            setRankedValues((prev) =>
                              prev.filter((id) => id !== valId),
                            )
                          }
                          className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded-full text-slate-500"
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <span className="text-slate-600">
                        Selecteer hieronder
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 text-left">
                Beschikbare Opties
              </h3>
              <div className="flex flex-wrap gap-3">
                {selectedValues
                  .filter((id) => !rankedValues.includes(id))
                  .map((id) => {
                    const val = getVal(id);
                    if (!val) return null;
                    return (
                      <button
                        key={id}
                        onClick={() => {
                          if (rankedValues.length < 3) {
                            setRankedValues([...rankedValues, id]);
                          }
                        }}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                      >
                        {val.label}
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="mt-12">
              <button
                disabled={rankedValues.length !== 3}
                onClick={handleSave}
                className="px-12 py-4 bg-transparent border border-blue-400 text-blue-400 disabled:opacity-50 font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:bg-blue-400/10 uppercase tracking-widest"
              >
                <span className="flex items-center gap-2">
                  <Save size={20} /> Opslaan & Resultaat
                </span>
              </button>
            </div>
          </motion.div>
        )}

        {/* --- RESULTS STEP --- */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="inline-block px-4 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 text-xs font-bold uppercase tracking-widest mb-6">
              Resultaten Opgeslagen
            </div>
            <h2 className="text-4xl font-black mb-12">Jouw Morele Kompas</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {rankedValues.map((id, idx) => {
                const val = getVal(id);
                return (
                  <div key={id} className="relative group">
                    <div
                      className={`absolute inset-0 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${idx === 0 ? "bg-yellow-500" : idx === 1 ? "bg-slate-300" : "bg-amber-600"}`}
                    />
                    <div className="relative bg-white/5 border border-white/10 p-8 rounded-3xl h-full hover:bg-white/10 transition-colors">
                      <div className="text-8xl font-black opacity-5 absolute top-4 right-4">
                        {idx + 1}
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{val?.label}</h3>
                      <p className="text-slate-400 text-sm">
                        {val?.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-16 p-8 bg-white/5 rounded-3xl border border-white/5 text-left max-w-3xl mx-auto">
              <h3 className="text-lg font-bold mb-4 text-slate-300">
                Overige Belangrijke Waarden
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedValues
                  .filter((id) => !rankedValues.includes(id))
                  .map((id) => (
                    <span
                      key={id}
                      className="px-3 py-1 bg-black/40 rounded-md text-slate-400 text-sm"
                    >
                      {getVal(id)?.label}
                    </span>
                  ))}
              </div>
            </div>

            <div className="flex justify-center gap-4 pt-12">
              <button
                onClick={() => navigate("/research/career")}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold uppercase tracking-widest transition-colors"
              >
                Terug naar Career Hub
              </button>
              <button
                onClick={() => {
                  setStep(0);
                  setSelectedValues([]);
                  setRankedValues([]);
                }}
                className="px-6 py-3 bg-purple-500/10 border border-purple-500/50 hover:bg-purple-500/20 text-purple-400 rounded-xl font-bold uppercase tracking-widest transition-all"
              >
                Opnieuw Starten
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
