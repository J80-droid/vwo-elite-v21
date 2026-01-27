
import "./WeatherWidget.css";

import { useTranslations } from "@shared/hooks/useTranslations";
import { useWeather } from "@shared/hooks/useWeather";
import {
  CloudRain, Droplets,
  Eye, Gauge, Map, Moon, RefreshCw, Thermometer, Wind,
  X
} from "lucide-react";
import React from "react";
import { createPortal } from "react-dom";

import { AQIRing } from "./weather/AQIRing";
import { ForecastDay } from "./weather/ForecastDay";
import { HourlyTrendGraph } from "./weather/HourlyTrendGraph";
import { StormGauge } from "./weather/StormGauge";
import { SunPathGraph } from "./weather/SunPathGraph";
import { WeatherIcon } from "./weather/WeatherIcon";
import { WeatherMetric } from "./weather/WeatherMetric";
import { WeatherMapModal } from "./WeatherMapModal";

export const WeatherWidget: React.FC = () => {
  const { lang } = useTranslations();
  const {
    weather, isOpen, setIsOpen, showMap, setShowMap,
    isRefreshing, lastUpdated, updateWeather,
    widgetRef, portalRef
  } = useWeather(lang);

  if (!weather) return null;

  return (
    <div className="relative" ref={widgetRef}>
      <button
        className={`ud-weather-widget ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="ud-weather-icon">
          <WeatherIcon iconName={weather.icon} size={20} />
        </div>
        <div className="ud-weather-info text-left relative">
          <span className="ud-weather-temp flex items-center gap-1.5">
            {weather.temp}°C {weather.location}
            {isRefreshing && (
              <span className="w-1 h-1 rounded-full bg-blue-400 animate-ping" />
            )}
          </span>
          <span className="ud-weather-desc uppercase">
            {weather.description}
          </span>
        </div>
      </button>

      {isOpen && weather.forecast && (
        createPortal(
          <div
            ref={portalRef}
            className="fixed top-0 right-0 w-[50vw] h-screen bg-[#05070a] backdrop-blur-3xl border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] p-10 z-[9999] animate-slide-in-right overflow-y-auto custom-scrollbar"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-3">
                  <h4 className="text-xl font-black text-white uppercase tracking-[0.2em]">
                    {weather.location}
                  </h4>
                  <button
                    onClick={() => updateWeather(true)}
                    className={`p-1.5 hover:bg-white/5 rounded-full transition-all text-slate-500 hover:text-white ${isRefreshing ? "animate-spin" : ""}`}
                    title={lang === "nl" ? "Vernieuwen" : "Refresh"}
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                  {lang === "nl" ? "7-Daagse Voorspelling" : "7-Day Forecast"} •
                  <span className="opacity-60 ml-1">
                    {lang === "nl" ? "Bijgewerkt:" : "Updated:"} {lastUpdated.toLocaleTimeString(lang === "nl" ? "nl-NL" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all">
                <X size={24} />
              </button>
            </div>

            {/* Forecast Grid */}
            <div className="flex justify-between items-center mb-6 px-1">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Periode</span>
              <div className="flex gap-6 pr-2">
                {["N", "O", "M", "A"].map(s => <span key={s} className="text-[10px] font-bold text-slate-600 w-6 text-center">{s}</span>)}
              </div>
            </div>

            <div className="space-y-4">
              {weather.forecast.map(day => <ForecastDay key={day.date} day={day} lang={lang} />)}
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => { setIsOpen(false); setShowMap(true); }}
              className="w-full py-2 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 border border-blue-500/30 rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-blue-100 transition-all group mt-3"
            >
              <Map size={14} className="group-hover:scale-110 transition-transform" />
              {lang === "nl" ? "OPEN RADAR & KAART" : "OPEN RADAR & MAP"}
            </button>

            {/* Sub-Metrics Grid */}
            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-3">
              <SunPathGraph sunrise={weather.sunrise} sunset={weather.sunset} lang={lang} />

              <div className="bg-black/30 rounded-xl p-4 border border-white/5 flex flex-col justify-between h-full">
                <WeatherMetric label={lang === "nl" ? "Gevoel" : "Feels"} value={weather.feelsLike ?? weather.temp} unit="°" icon={<Thermometer size={20} className="text-rose-400" />} />
                <WeatherMetric label={lang === "nl" ? "Neerslag" : "Rain"} value={weather.rain?.toFixed(1) || 0} unit="mm" icon={<CloudRain size={20} className="text-blue-400" />} />

                <div className="flex flex-col pt-3 gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Wind size={20} className="text-cyan-400" />
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{lang === "nl" ? "Wind" : "Wind"}</span>
                        <span className="text-base font-bold text-white">{weather.windSpeed} <span className="text-[9px] text-slate-500">km/u</span></span>
                      </div>
                    </div>
                    {/* Interactive Compass */}
                    <div className="relative w-10 h-10 border border-white/10 rounded-full flex items-center justify-center bg-black/20">
                      <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[8px] border-b-cyan-400 transform origin-center"
                        style={{ transform: `rotate(${weather.windDirection || 0}deg)` }} />
                    </div>
                  </div>
                </div>
              </div>

              <HourlyTrendGraph trend={weather.hourlyTrend} lang={lang} />

              <AQIRing aqi={weather.aqi} lang={lang} />
              <StormGauge cape={weather.cape} lang={lang} />

              <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-between min-h-[120px]">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider self-start">Maan</span>
                <Moon size={32} className="text-slate-200 drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]" />
                <div className="w-full flex justify-between text-[8px] text-slate-500 font-mono mt-1 border-t border-white/5 pt-2">
                  <span>↑ {weather.moonrise || "--:--"}</span>
                  <span>↓ {weather.moonset || "--:--"}</span>
                </div>
              </div>

              {/* Final Row: Extras */}
              <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex items-center gap-4">
                <Droplets size={16} className="text-blue-400" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{lang === "nl" ? "Vocht" : "Hum"}</span>
                  <span className="text-sm font-bold text-white">{weather.humidity}%</span>
                </div>
              </div>
              <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex items-center gap-4">
                <Gauge size={16} className="text-amber-400" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{lang === "nl" ? "Druk" : "Pres"}</span>
                  <span className="text-sm font-bold text-white">{weather.pressure} <span className="text-[8px] opacity-60">hPa</span></span>
                </div>
              </div>
              <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex items-center gap-4">
                <Eye size={16} className="text-emerald-400" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{lang === "nl" ? "Zicht" : "Vis"}</span>
                  <span className="text-sm font-bold text-white">{weather.visibility} <span className="text-[8px] opacity-60">km</span></span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      )}

      {showMap && (
        <WeatherMapModal
          isOpen={showMap}
          onClose={() => setShowMap(false)}
          locationName={weather.location}
          lat={weather.lat}
          lon={weather.lon}
        />
      )}
    </div>
  );
};
