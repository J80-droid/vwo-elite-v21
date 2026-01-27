import { AnimatePresence, motion } from "framer-motion";
import { Anchor, Check, Pin, X } from "lucide-react";
import React from "react";
import { createPortal } from "react-dom";

interface TaskbarPinPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

const getPlatform = (): "win" | "mac" | "linux" => {
    const ua = window.navigator.userAgent.toLowerCase();
    if (ua.includes("mac")) return "mac";
    if (ua.includes("linux")) return "linux";
    return "win";
};

export const TaskbarPinPopup: React.FC<TaskbarPinPopupProps> = ({ isOpen, onClose }) => {
    const platform = getPlatform();

    const getPlatformInstructions = () => {
        switch (platform) {
            case "mac":
                return "Sleep het VWO-Elite icoon van je Applications map naar je Dock en kies 'Keep in Dock'.";
            case "linux":
                return "Klik met de rechtermuisknop op het icoon in je launcher en kies 'Vastzetten' (Add to Favorites).";
            default:
                return "Klik met de rechtermuisknop op het VWO-Elite icoon in je taakbalk en kies 'Aan taakbalk vastmaken'.";
        }
    };

    const platformIcon = () => {
        switch (platform) {
            case "mac": return <Anchor size={24} />;
            default: return <Pin size={24} />;
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-end justify-center px-4 pb-12 sm:pb-20 pointer-events-none">
                    {/* Backdrop (Light) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-auto"
                    />

                    {/* Popup */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 50 }}
                        className="relative w-full max-w-md bg-zinc-950/90 border border-blue-500/30 rounded-3xl p-6 shadow-[0_0_40px_rgba(59,130,246,0.2)] backdrop-blur-xl pointer-events-auto"
                    >
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)] mb-2">
                                {platformIcon()}
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
                                    Mis nooit meer een sessie
                                </h3>
                                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                    {getPlatformInstructions()} Zo heb je VWO-Elite altijd met één klik bij de hand.
                                </p>
                            </div>

                            <div className="flex gap-3 w-full pt-4">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 group"
                                >
                                    <Check size={18} className="group-hover:scale-110 transition-transform" />
                                    Begrepen
                                </button>
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Accent Line */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body,
    );
};
