import { ImageOff, Loader2 } from "lucide-react";
import React, { useState } from "react";

interface Smiles2DProps {
  smiles?: string;
  cid?: number;
  width?: number;
  height?: number;
  className?: string;
  label?: string;
  dark?: boolean;
}

export const Smiles2D: React.FC<Smiles2DProps> = ({
  smiles,
  cid,
  width = 300,
  height = 300,
  className = "",
  label,
  dark = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Prefer CID if available (faster/safer), else SMILES
  let url = "";
  if (cid) {
    url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG?record_type=2d&image_size=large`;
  } else if (smiles) {
    // Encode special chars in SMILES
    const encoded = encodeURIComponent(smiles);
    url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encoded}/PNG?record_type=2d&image_size=large`;
  }

  if (!url) return null;

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-xl p-2 overflow-hidden ${!dark ? "bg-white" : ""} ${className}`}
      style={{ width, height: height + (label ? 24 : 0) }}
    >
      {loading && !error && (
        <div
          className={`absolute inset-0 flex items-center justify-center z-10 ${dark ? "bg-slate-900/50" : "bg-gray-50"}`}
        >
          <Loader2 className="animate-spin text-slate-400" />
        </div>
      )}

      {!error ? (
        <img
          src={url}
          alt={label || "Molecuulstructuur"}
          className={`object-contain transition-opacity duration-300 ${loading ? "opacity-0" : "opacity-100"}`}
          style={{
            maxWidth: "100%",
            maxHeight: height,
            filter: dark
              ? "invert(1) grayscale(1) brightness(2) contrast(1.1)"
              : "none",
          }}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      ) : (
        <div className="flex flex-col items-center text-slate-400 text-xs">
          <ImageOff size={24} className="mb-1 opacity-50" />
          <span>Geen structuur</span>
        </div>
      )}

      {label && (
        <div className="mt-1 text-xs text-slate-900 font-bold font-mono">
          {label}
        </div>
      )}
    </div>
  );
};
