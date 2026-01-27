import { useTranslations } from "@shared/hooks/useTranslations";
import {
  Activity,
  CloudRain,
  Cloudy,
  Droplets,
  Gauge,
  MapPin,
  Search,
  Snowflake,
  Sun,
  Thermometer,
  Waves,
  Wind,
  X,
  Zap,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface WeatherMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  lat?: number;
  lon?: number;
  locationName?: string;
}

type OverlayType =
  | "rain"
  | "wind"
  | "temp"
  | "clouds"
  | "pressure"
  | "waves"
  | "cape"
  | "snow"
  | "rh"
  | "sst"
  | "thunder"
  | "no2";

export const WeatherMapModal: React.FC<WeatherMapModalProps> = ({
  isOpen,
  onClose,
  lat: initialLat = 52.0705,
  lon: initialLon = 4.3007,
  locationName: initialLocationName = "Den Haag",
}) => {
  const { lang } = useTranslations();
  const [overlay, setOverlay] = useState<OverlayType>("rain");
  const [mounted, setMounted] = useState(false);

  // Location state - syncing with props
  const [currentLat, setCurrentLat] = useState(initialLat);
  const [currentLon, setCurrentLon] = useState(initialLon);
  const [currentLocationName, setCurrentLocationName] =
    useState(initialLocationName);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Sync state with props when they change
  useEffect(() => {
    if (initialLat && !isNaN(initialLat)) setCurrentLat(initialLat);
    if (initialLon && !isNaN(initialLon)) setCurrentLon(initialLon);
    if (initialLocationName) setCurrentLocationName(initialLocationName);
  }, [initialLat, initialLon, initialLocationName]);

  // Map language codes from app language to Windy language
  const windyLanguage =
    lang === "nl" ? "nl" : lang === "fr" ? "fr" : lang === "es" ? "es" : "en";

  // Ensure we only render the portal on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Geocoding search function
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        const newLat = parseFloat(result.lat);
        const newLon = parseFloat(result.lon);
        if (!isNaN(newLat) && !isNaN(newLon)) {
          setCurrentLat(newLat);
          setCurrentLon(newLon);
          setCurrentLocationName(result.display_name.split(",")[0]);
          setSearchQuery("");
        }
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  if (!isOpen || !mounted) return null;

  const zoom = 8;
  // Sanitize coordinates for Windy (fallback to Netherlands center if NaN)
  const effectiveLat = isNaN(currentLat) ? 52.0705 : currentLat;
  const effectiveLon = isNaN(currentLon) ? 4.3007 : currentLon;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="bg-[#0f1115] w-full max-w-7xl h-[90vh] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col relative z-10 animate-scale-in">
        {/* Header Bar */}
        <div className="flex flex-col gap-2 px-4 py-3 border-b border-white/5 bg-[#13141c] shrink-0">
          {/* Top row: Location + Search + Close */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-blue-400">
              <MapPin size={14} />
              <p className="text-[10px] font-bold uppercase tracking-widest">
                {currentLocationName}
              </p>
            </div>

            {/* Search Input */}
            <div className="flex-1 max-w-xs relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={
                  lang === "nl" ? "Zoek locatie..." : "Search location..."
                }
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 pl-8 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
              />
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
              {isSearching && (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            <button
              onClick={onClose}
              className="ml-auto p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors border border-transparent hover:border-white/10 shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          {/* Layer Switcher - Full width, scrollable */}
          <div className="flex bg-black/40 rounded-lg p-1 gap-1 border border-white/5 overflow-x-auto custom-scrollbar">
            {/* Standaard Lagen */}
            <LayerButton
              active={overlay === "rain"}
              onClick={() => setOverlay("rain")}
              icon={<CloudRain size={16} />}
              label="Neerslag"
              neonColor="blue"
            />
            <LayerButton
              active={overlay === "wind"}
              onClick={() => setOverlay("wind")}
              icon={<Wind size={16} />}
              label="Wind"
              neonColor="purple"
            />
            <LayerButton
              active={overlay === "temp"}
              onClick={() => setOverlay("temp")}
              icon={<Thermometer size={16} />}
              label="Temp"
              neonColor="orange"
            />
            <LayerButton
              active={overlay === "clouds"}
              onClick={() => setOverlay("clouds")}
              icon={<Sun size={16} />}
              label="Bewolking"
              neonColor="slate"
            />

            {/* Separator */}
            <div className="w-px h-6 bg-white/10 mx-1 self-center shrink-0" />

            {/* ELITE LAGEN */}
            <LayerButton
              active={overlay === "pressure"}
              onClick={() => setOverlay("pressure")}
              icon={<Gauge size={16} />}
              label="Druk"
              neonColor="emerald"
            />
            <LayerButton
              active={overlay === "waves"}
              onClick={() => setOverlay("waves")}
              icon={<Waves size={16} />}
              label="Golven"
              neonColor="cyan"
            />
            <LayerButton
              active={overlay === "cape"}
              onClick={() => setOverlay("cape")}
              icon={<Activity size={16} />}
              label="CAPE"
              neonColor="rose"
            />

            {/* Separator - N&T LAGEN */}
            <div className="w-px h-6 bg-white/10 mx-1 self-center shrink-0" />

            <LayerButton
              active={overlay === "snow"}
              onClick={() => setOverlay("snow")}
              icon={<Snowflake size={16} />}
              label="Sneeuw"
              neonColor="sky"
            />
            <LayerButton
              active={overlay === "rh"}
              onClick={() => setOverlay("rh")}
              icon={<Droplets size={16} />}
              label="Vochtigheid"
              neonColor="teal"
            />
            <LayerButton
              active={overlay === "thunder"}
              onClick={() => setOverlay("thunder")}
              icon={<Zap size={16} />}
              label="Onweer"
              neonColor="amber"
            />
            <LayerButton
              active={overlay === "no2"}
              onClick={() => setOverlay("no2")}
              icon={<Cloudy size={16} />}
              label="NO₂"
              neonColor="lime"
            />
          </div>
        </div>

        {/* Windy Iframe Container */}
        <div className="flex-1 bg-black relative w-full h-full overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            src={`https://embed.windy.com/embed2.html?lat=${effectiveLat}&lon=${effectiveLon}&detailLat=${effectiveLat}&detailLon=${effectiveLon}&width=650&height=450&zoom=${zoom}&level=surface&overlay=${overlay}&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1&lang=${windyLanguage}`}
            frameBorder="0"
            className="w-full h-full absolute inset-0 scale-[1.02]"
            style={{ filter: "contrast(1.1) saturate(1.2)" }}
            title="Windy Weather Map"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            referrerPolicy="strict-origin-when-cross-origin"
            loading="lazy"
          ></iframe>
        </div>
      </div>
    </div>,
    document.body,
  );
};

interface LayerButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  neonColor:
    | "blue"
    | "purple"
    | "orange"
    | "slate"
    | "emerald"
    | "cyan"
    | "rose"
    | "sky"
    | "teal"
    | "amber"
    | "lime";
}

const LayerButton: React.FC<LayerButtonProps> = ({
  active,
  onClick,
  icon,
  label,
  neonColor,
}) => {
  // Neon color styles mapping
  const neonStyles: Record<
    LayerButtonProps["neonColor"],
    { active: string; hover: string; glow: string }
  > = {
    blue: {
      active: "bg-blue-500/20 border-blue-400 text-blue-300",
      hover:
        "hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-200",
      glow: "shadow-[0_0_12px_rgba(59,130,246,0.5)]",
    },
    purple: {
      active: "bg-purple-500/20 border-purple-400 text-purple-300",
      hover:
        "hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-purple-200",
      glow: "shadow-[0_0_12px_rgba(168,85,247,0.5)]",
    },
    orange: {
      active: "bg-orange-500/20 border-orange-400 text-orange-300",
      hover:
        "hover:bg-orange-500/10 hover:border-orange-500/30 hover:text-orange-200",
      glow: "shadow-[0_0_12px_rgba(249,115,22,0.5)]",
    },
    slate: {
      active: "bg-slate-500/20 border-slate-400 text-slate-300",
      hover:
        "hover:bg-slate-500/10 hover:border-slate-500/30 hover:text-slate-200",
      glow: "shadow-[0_0_12px_rgba(100,116,139,0.5)]",
    },
    emerald: {
      active: "bg-emerald-500/20 border-emerald-400 text-emerald-300",
      hover:
        "hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-200",
      glow: "shadow-[0_0_12px_rgba(16,185,129,0.5)]",
    },
    cyan: {
      active: "bg-cyan-500/20 border-cyan-400 text-cyan-300",
      hover:
        "hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-200",
      glow: "shadow-[0_0_12px_rgba(6,182,212,0.5)]",
    },
    rose: {
      active: "bg-rose-500/20 border-rose-400 text-rose-300",
      hover:
        "hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-200",
      glow: "shadow-[0_0_12px_rgba(244,63,94,0.5)]",
    },
    sky: {
      active: "bg-sky-500/20 border-sky-400 text-sky-300",
      hover: "hover:bg-sky-500/10 hover:border-sky-500/30 hover:text-sky-200",
      glow: "shadow-[0_0_12px_rgba(14,165,233,0.5)]",
    },
    teal: {
      active: "bg-teal-500/20 border-teal-400 text-teal-300",
      hover:
        "hover:bg-teal-500/10 hover:border-teal-500/30 hover:text-teal-200",
      glow: "shadow-[0_0_12px_rgba(20,184,166,0.5)]",
    },
    amber: {
      active: "bg-amber-500/20 border-amber-400 text-amber-300",
      hover:
        "hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-200",
      glow: "shadow-[0_0_12px_rgba(245,158,11,0.5)]",
    },
    lime: {
      active: "bg-lime-500/20 border-lime-400 text-lime-300",
      hover:
        "hover:bg-lime-500/10 hover:border-lime-500/30 hover:text-lime-200",
      glow: "shadow-[0_0_12px_rgba(132,204,22,0.5)]",
    },
  };

  const styles = neonStyles[neonColor] || neonStyles.blue;

  return (
    <button
      onClick={onClick}
      className={`
                px-3 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 border whitespace-nowrap shrink-0
                ${
                  active
                    ? `${styles.active} ${styles.glow}`
                    : `text-slate-500 border-transparent ${styles.hover}`
                }
            `}
      title={label}
    >
      {icon} <span className="hidden md:inline">{label}</span>
    </button>
  );
};
