import React from "react";
import { useTranslation } from "react-i18next";

interface EmissionSpectrumProps {
  symbol: string;
  lines: number[]; // Wavelengths in nm
}

const wavelengthToColor = (wavelength: number) => {
  let r, g, b;
  if (wavelength >= 380 && wavelength < 440) {
    r = -(wavelength - 440) / (440 - 380);
    g = 0;
    b = 1;
  } else if (wavelength >= 440 && wavelength < 490) {
    r = 0;
    g = (wavelength - 440) / (490 - 440);
    b = 1;
  } else if (wavelength >= 490 && wavelength < 510) {
    r = 0;
    g = 1;
    b = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
    r = (wavelength - 510) / (580 - 510);
    g = 1;
    b = 0;
  } else if (wavelength >= 580 && wavelength < 645) {
    r = 1;
    g = -(wavelength - 645) / (645 - 580);
    b = 0;
  } else if (wavelength >= 645 && wavelength <= 780) {
    r = 1;
    g = 0;
    b = 0;
  } else {
    r = 0;
    g = 0;
    b = 0;
  }

  // Intensity correction
  const intensity = 0.8; // Uniform intensity for now
  return `rgb(${Math.round(r * 255 * intensity)}, ${Math.round(g * 255 * intensity)}, ${Math.round(b * 255 * intensity)})`;
};

export const EmissionSpectrum: React.FC<EmissionSpectrumProps> = ({
  symbol,
  lines,
}) => {
  const { t } = useTranslation("chemistry");
  return (
    <div className="w-full bg-black rounded-lg border border-white/20 p-2 shadow-inner">
      <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 flex justify-between">
        <span>{t("periodic_table.emission_spectrum")}</span>
        <span>{symbol}</span>
      </div>
      <div className="relative h-12 w-full bg-black overflow-hidden rounded border border-white/10">
        {/* Background gradient hint */}
        <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-violet-900 via-green-900 to-red-900" />

        {lines.map((nm, i) => {
          const percent = ((nm - 380) / (750 - 380)) * 100;
          if (percent < 0 || percent > 100) return null;
          return (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-[2px] shadow-[0_0_4px_currentColor]"
              style={{
                left: `${percent}%`,
                backgroundColor: wavelengthToColor(nm),
                color: wavelengthToColor(nm),
              }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[9px] text-slate-600 font-mono mt-1 px-1">
        <span>380nm</span>
        <span>750nm</span>
      </div>
    </div>
  );
};
