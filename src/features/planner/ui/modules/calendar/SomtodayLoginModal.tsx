/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { somtodayService } from "@shared/api/somtodayService";
import { SomtodaySchool } from "@shared/types/somtodayTypes";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardPaste,
  ExternalLink,
  Loader2,
  School,
  Search,
  X,
} from "lucide-react";
import React, { useState } from "react";

interface SomtodayLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SomtodayLoginModal: React.FC<SomtodayLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Stage 1: School Selection, Stage 2: Manual OAuth Flow
  const [stage, setStage] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // School Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SomtodaySchool[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<SomtodaySchool | null>(
    null,
  );

  // Manual OAuth State
  const [pastedUrl, setPastedUrl] = useState("");
  const [popupOpened, setPopupOpened] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const results = await somtodayService.searchSchools(query);
      setSearchResults(results);
    } catch (err) {
      console.error("School zoeken mislukt", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSchool = (school: SomtodaySchool) => {
    setSelectedSchool(school);
    setStage(2);
    setError(null);
    setPastedUrl("");
    setPopupOpened(false);
  };

  const handleOpenLogin = async () => {
    if (!selectedSchool) return;
    setError(null);

    try {
      const url = await somtodayService.getLoginUrl(selectedSchool);
      window.open(url, "somtoday-login", "width=600,height=700,scrollbars=yes");
      setPopupOpened(true);
    } catch (err: any) {
      setError("Kon inlogscherm niet openen: " + err.message);
    }
  };

  const handleVerifyCode = async () => {
    if (!selectedSchool || !pastedUrl) return;
    setIsLoading(true);
    setError(null);

    try {
      await somtodayService.exchangeCode(pastedUrl, selectedSchool);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ongeldige code of URL");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.includes("somtoday://") || text.includes("code=")) {
        setPastedUrl(text);
        setError(null);
      } else {
        setError("Geen geldige Somtoday URL gevonden in klembord");
      }
    } catch (err) {
      setError("Kon niet van klembord lezen. Plak handmatig met Ctrl+V");
    }
  };

  const handleReset = () => {
    setStage(1);
    setSelectedSchool(null);
    setPastedUrl("");
    setPopupOpened(false);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-obsidian-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-obsidian-900/50">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <School className="w-5 h-5 text-orange-400" />
              </span>
              Somtoday Inloggen
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {stage === 1 ? "Selecteer je school" : `${selectedSchool?.naam}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <AnimatePresence mode="wait">
            {stage === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Zoek op schoolnaam of plaats..."
                    className="w-full bg-obsidian-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                    autoFocus
                  />
                </div>

                <div className="space-y-2 mt-4">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((school) => (
                      <button
                        key={school.uuid}
                        onClick={() => handleSelectSchool(school)}
                        className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-orange-500/30 transition-all group"
                      >
                        <div className="font-medium text-white group-hover:text-orange-400 transition-colors">
                          {school.naam}
                        </div>
                        <div className="text-sm text-slate-400">
                          {school.plaats}
                        </div>
                      </button>
                    ))
                  ) : searchQuery.length >= 3 ? (
                    <div className="text-center py-8 text-slate-500">
                      Geen scholen gevonden
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      Typ minstens 3 letters om te zoeken
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <button
                  onClick={handleReset}
                  className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-4 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Terug naar scholen
                </button>

                <div className="bg-obsidian-900/50 border border-slate-800 rounded-xl p-5 space-y-5">
                  <h3 className="text-lg font-bold text-white">
                    Inloggen bij {selectedSchool?.naam}
                  </h3>

                  {/* Info Banner */}
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300">
                    <strong>Let op:</strong> Je school gebruikt Microsoft om in
                    te loggen. Na het inloggen krijg je een "mislukt" scherm -
                    dat is normaal!
                  </div>

                  {/* Step 1: Open Login */}
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400">
                      <span className="font-bold text-white">Stap 1:</span> Klik
                      op onderstaande knop en log in via Microsoft.
                    </p>
                    <button
                      onClick={handleOpenLogin}
                      className="w-full py-3 bg-transparent border border-orange-500/50 text-orange-400 font-bold hover:bg-orange-500/10 hover:border-orange-500 hover:text-orange-300 rounded-xl transition-all shadow-[0_0_15px_rgba(249,115,22,0.1)] hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Inlogscherm
                    </button>
                    {popupOpened && (
                      <div className="flex items-center gap-2 text-green-400 text-xs mt-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Popup geopend - log daar in bij Microsoft
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-slate-700/50" />

                  {/* Step 2: Paste URL */}
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400">
                      <span className="font-bold text-white">Stap 2:</span> Na
                      het inloggen zie je een foutmelding of leeg scherm.
                      <br />
                      <span className="text-orange-400">
                        Kopieer de volledige URL
                      </span>{" "}
                      die jij kunt vinden in jouw console en plak hem hier:
                    </p>
                    <div className="relative">
                      <ClipboardPaste className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={pastedUrl}
                        onChange={(e) => setPastedUrl(e.target.value)}
                        placeholder="Plak hier: somtoday://nl.topicus..."
                        className="w-full bg-black/30 border border-slate-600 rounded-xl py-3 pl-10 pr-4 text-white focus:border-orange-500 outline-none font-mono text-xs focus:ring-1 focus:ring-orange-500/50"
                      />
                    </div>
                    <button
                      onClick={handlePasteFromClipboard}
                      className="w-full py-2 bg-transparent border border-white/10 hover:border-white/30 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                    >
                      <ClipboardPaste className="w-4 h-4" />
                      Plak van Klembord
                    </button>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2 text-sm text-red-400">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleVerifyCode}
                    disabled={!pastedUrl || isLoading}
                    className="w-full py-3 bg-transparent border border-cyan-500/50 text-cyan-400 font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-500/10 hover:border-cyan-500 hover:text-cyan-300 transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] flex justify-center items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin w-5 h-5" />
                        Verifiëren...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Verifiëren & Verbinden
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
