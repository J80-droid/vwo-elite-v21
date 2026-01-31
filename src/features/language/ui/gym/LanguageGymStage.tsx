import React, { Suspense } from "react";

import { DutchGymStage } from "@features/dutch/ui/gym/DutchGymStage";
import { EnglishGymStage } from "@features/english/ui/gym/EnglishGymStage";
import { FrenchGymStage } from "@features/french/ui/gym/FrenchGymStage";
import { useLanguageLabContext } from "@features/language/hooks/LanguageLabContext";

export const LanguageGymStage: React.FC = () => {
    const { activeLanguage } = useLanguageLabContext();

    return (
        <Suspense fallback={<div className="p-10 text-orange-400 animate-pulse font-mono tracking-widest text-xs uppercase">Initializing Gym Mode...</div>}>
            {activeLanguage === "en" ? (
                <EnglishGymStage />
            ) : activeLanguage === "fr" ? (
                <FrenchGymStage />
            ) : activeLanguage === "nl" ? (
                <DutchGymStage />
            ) : (
                <div className="flex h-full items-center justify-center text-slate-500 font-medium">
                    Select English, French or Dutch to use the Gym.
                </div>
            )}
        </Suspense>
    );
};
