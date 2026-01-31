import { AnimatePresence, motion } from "framer-motion";
import { Key, Lock, Shield, Unlock, Zap } from "lucide-react";
import React, { useState } from "react";
import { createPortal } from "react-dom";

import { useVaultStore } from "../model/vaultStore";

export const VaultUnlockModal: React.FC = () => {
    const { isLocked, isInitialized, error, actions } = useVaultStore();
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isLocked) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return;

        setIsSubmitting(true);
        if (!isInitialized) {
            await actions.initialize(password);
        } else {
            await actions.unlock(password);
        }
        setIsSubmitting(false);
    };

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                {/* Backdrop overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-obsidian-950/90 backdrop-blur-xl"
                />

                {/* Modal content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="relative w-full max-w-md bg-zinc-950 border border-electric/20 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,242,255,0.1)]"
                >
                    {/* Decorative scanner line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-electric to-transparent opacity-20 animate-pulse" />

                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-2xl bg-electric/10 flex items-center justify-center border border-electric/20 text-electric shadow-[0_0_20px_rgba(0,242,255,0.1)]">
                                {isInitialized ? <Lock size={36} /> : <Shield size={36} />}
                            </div>
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-electric/20 flex items-center justify-center border border-electric/40"
                            >
                                <Key size={12} className="text-electric" />
                            </motion.div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-white tracking-widest uppercase italic">
                                {isInitialized ? "Elite Security Vault" : "Initialize Secure Vault"}
                            </h2>
                            <p className="text-sm text-slate-400 max-w-[280px]">
                                {isInitialized
                                    ? "Uw API-sleutels zijn versleuteld in het RAM-geheugen. Voer uw wachtwoord in om de AI te activeren."
                                    : "Stel een wachtwoord in om uw API-sleutels lokaal te beveiligen met Zero-Trust encryptie."}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="w-full space-y-4 pt-4">
                            <div className="relative group">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={isInitialized ? "Wachtwoord invullen..." : "Kies een sterk wachtwoord..."}
                                    className="w-full bg-obsidian-900 border border-white/5 rounded-2xl px-5 py-4 text-white outline-none focus:border-electric/50 focus:ring-1 focus:ring-electric/20 transition-all placeholder:text-slate-600 group-hover:border-white/10"
                                    autoFocus
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                                    <Zap size={18} />
                                </div>
                            </div>

                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs text-rose-500 font-bold uppercase tracking-wider"
                                >
                                    {error}
                                </motion.p>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting || !password}
                                className="w-full bg-electric hover:bg-electric-glow text-obsidian-950 font-black py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group uppercase tracking-widest"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-obsidian-950 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Unlock size={20} className="group-hover:scale-110 transition-transform" />
                                        {isInitialized ? "Unlock Neural Core" : "Activeer Beveiliging"}
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">
                            Security Protocol: PBKDF2 + AES-256-GCM (Elite v5)
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};
