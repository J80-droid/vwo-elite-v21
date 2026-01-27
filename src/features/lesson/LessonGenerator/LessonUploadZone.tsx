import { motion } from "framer-motion";
import { Cloud } from "lucide-react";
import React from "react";

interface LessonUploadZoneProps {
  lessonT: Record<string, string | undefined>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileDrop: (files: FileList) => void;
}

export const LessonUploadZone: React.FC<LessonUploadZoneProps> = ({
  lessonT,
  fileInputRef,
  handleFileUpload,
  handleFileDrop,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group w-full"
    >
      <div
        className="relative bg-white/5 border border-white/5 rounded-3xl p-4 md:px-8 flex items-center justify-between gap-6 cursor-pointer overflow-hidden transition-all duration-700 hover:border-indigo-500/20 hover:bg-white/[0.07]"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.classList.add("border-indigo-500/30", "bg-indigo-500/5");
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.classList.remove("border-indigo-500/30", "bg-indigo-500/5");
        }}
        onDrop={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.classList.remove("border-indigo-500/30", "bg-indigo-500/5");

          const files = e.dataTransfer.files;
          if (files && files.length > 0) {
            handleFileDrop(files);
          }
        }}
      >
        {/* Left: Icon & Label */}
        <div className="flex items-center gap-6">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center relative bg-black/20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-t border-indigo-500/40 rounded-full"
              />
              <Cloud className="text-indigo-400/60 group-hover:text-indigo-400 transition-all duration-700" size={20} strokeWidth={1.5} />
            </div>
            <motion.div
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-0.5 h-0.5 bg-indigo-400 rounded-full shadow-[0_0_8px_indigo]"
            />
          </div>

          <div className="flex flex-col">
            <h3 className="text-white/80 font-space font-extrabold uppercase tracking-[0.4em] text-[8px] leading-none mb-1">
              {lessonT.neural_deposit || "Aura Data Inlet"}
            </h3>
            <p className="text-white/30 text-[9px] font-bold uppercase tracking-[0.2em] leading-none group-hover:text-white/50 transition-colors">
              {lessonT.drop_files || "Inject source telemetry for synthesis"}
            </p>
          </div>
        </div>

        {/* Right: Format Tags */}
        <div className="hidden sm:flex gap-4 opacity-20 group-hover:opacity-40 transition-opacity">
          {[".PDF", ".IMG", ".TXT"].map(ext => (
            <span key={ext} className="text-[7px] font-mono font-bold tracking-[0.3em] text-white/60 border border-white/10 px-2 py-1 rounded bg-white/[0.02]">
              {ext}
            </span>
          ))}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.png,.jpg,.jpeg,.webp,.pdf"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
    </motion.div>
  );
};
