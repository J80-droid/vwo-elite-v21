import { useTranslations } from "@shared/hooks/useTranslations";
import { Plus } from "lucide-react";
import React from "react";

export const AddSubjectTile: React.FC = () => {
  const { t } = useTranslations();

  return (
    <button className="group relative w-full h-56 rounded-3xl border-2 border-dashed border-slate-700 hover:border-slate-500 bg-transparent hover:bg-white/[0.02] flex flex-col items-center justify-center gap-4 transition-all duration-300 cursor-pointer text-slate-600 hover:text-slate-300">
      <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center group-hover:bg-slate-700/50 transition-colors">
        <Plus
          size={32}
          className="stroke-current transition-transform duration-500 group-hover:rotate-90"
        />
      </div>
      <div className="text-center">
        <div className="font-black text-sm uppercase tracking-widest mb-1">
          {t("library.library.add_subject")}
        </div>
        <div className="text-[10px] uppercase font-bold text-slate-600 group-hover:text-slate-500">
          {t("library.library.add_subject_desc")}
        </div>
      </div>
    </button>
  );
};
