/* eslint-disable react-hooks/exhaustive-deps */
import {
  Calendar,
  Camera,
  Check,
  Clock,
  MapPin,
  ScanLine,
  Upload,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Tesseract from "tesseract.js";

interface ScheduleEvent {
  day?: string;
  time?: string;
  subject: string;
  location?: string;
}

interface RoosterScannerProps {
  onScheduleDetected?: (events: ScheduleEvent[]) => void;
  onClose: () => void;
}

export const RoosterScanner: React.FC<RoosterScannerProps> = ({
  onScheduleDetected,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [_scanResult, setScanResult] = useState<string | null>(null);
  const [detectedEvents, setDetectedEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [cameraActive, setCameraActive] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      // Fallback: Don't alert immediately, user can use upload
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      setCameraActive(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const processImage = async (imageSource: CanvasImageSource | string) => {
    setLoading(true);
    setLoadingMessage("Foto analyseren...");

    // Prepare canvas if needed
    let dataUrl: string;
    if (typeof imageSource === "string") {
      dataUrl = imageSource;
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Draw is handled by caller usually, but if imageSource is video
      // we might need to draw. For simplicity, assume caller handles drawing to canvas or we use Tesseract directly on URL.
      // Actually, consistency: let's use the canvasRef which should already have the image
      dataUrl = canvasRef.current?.toDataURL("image/png") || "";
    }

    try {
      setLoadingMessage("Tekst herkennen (OCR)...");
      const result = await Tesseract.recognize(
        dataUrl,
        "nld", // Dutch for schedule subjects
        {
          logger: (m) => {
            if (m.status === "recognizing text") {
              setLoadingMessage(`OCR: ${(m.progress * 100).toFixed(0)}%`);
            }
          },
        },
      );

      const text = result.data.text;
      setScanResult(text);
      parseSchedule(text);
    } catch (e) {
      console.error("OCR Error:", e);
      setScanResult("Fout bij scannen. Probeer opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      processImage(video); // Use video frame
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const img = new Image();
          img.onload = () => {
            if (canvasRef.current) {
              canvasRef.current.width = img.width;
              canvasRef.current.height = img.height;
              const ctx = canvasRef.current.getContext("2d");
              ctx?.drawImage(img, 0, 0);
              processImage(canvasRef.current.toDataURL("image/png"));
            }
          };
          img.src = event.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const parseSchedule = (text: string) => {
    setLoadingMessage("Rooster structureren...");
    // Heuristic parsing: look for times, days, subjects
    const lines = text.split("\n").filter((l) => l.trim().length > 2);
    const events: ScheduleEvent[] = [];

    // Dictionary of days
    const days = [
      "ma",
      "di",
      "wo",
      "do",
      "vr",
      "za",
      "zo",
      "maandag",
      "dinsdag",
      "woensdag",
      "donderdag",
      "vrijdag",
    ];

    let currentDay = "Onbekend";

    lines.forEach((line) => {
      const lower = line.toLowerCase();

      // Check for day headers
      const dayMatch = days.find((d) => lower.includes(d));
      if (dayMatch) {
        currentDay = dayMatch;
        return; // Probably a header line
      }

      // Check for time format (HH:MM or H.MM)
      const timeMatch = line.match(/(\d{1,2}[:.]\d{2})/);

      if (timeMatch || lower.length > 5) {
        // If line has time, or just content, try to interpret as event
        // This is very rough, assuming row-based
        const time = timeMatch ? timeMatch[0].replace(".", ":") : undefined;

        // Clean line removes time
        let subject = line;
        if (time) subject = subject.replace(timeMatch![0], "");
        subject = subject.trim();

        if (subject.length > 2) {
          events.push({
            day: currentDay,
            time: time || "??:??",
            subject: subject.substring(0, 20), // Truncate
            location: "Lokaal ?",
          });
        }
      }
    });

    setDetectedEvents(events.slice(0, 6)); // Show top matches
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-obsidian-950 rounded-[40px] overflow-hidden border border-white/10 shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-white font-black text-xl italic uppercase tracking-wider flex items-center gap-3">
              <ScanLine className="w-6 h-6 animate-pulse" /> Rooster Scanner{" "}
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white/80 not-italic align-top">
                KIJS OCR
              </span>
            </h3>
            <p className="text-blue-100 text-xs font-bold mt-1">
              Converteer foto naar digitaal rooster
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-black/20 rounded-full hover:bg-black/40 text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col md:flex-row">
          {/* Left: Input */}
          <div className="flex-1 p-6 flex flex-col border-b md:border-b-0 md:border-r border-white/10">
            <div className="relative aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-white/20 shadow-inner group">
              {cameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center flex-col gap-4 text-slate-500">
                  <Camera size={48} />
                  <span className="text-xs font-bold uppercase">
                    Camera Inactief
                  </span>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />

              {loading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-white rounded-full animate-spin mb-4"></div>
                  <p className="text-blue-400 font-bold text-xs uppercase animate-pulse">
                    {loadingMessage}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleCapture}
                disabled={loading || !cameraActive}
                className="flex-1 py-4 bg-white hover:bg-slate-200 text-black rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera size={16} /> Scan
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Upload size={16} /> Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>

          {/* Right: Output */}
          <div className="flex-1 p-6 bg-white/5 space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Calendar size={14} /> Gedetecteerde Blokken
            </h4>

            {detectedEvents.length > 0 ? (
              <div className="space-y-3">
                {detectedEvents.map((evt, idx) => (
                  <div
                    key={idx}
                    className="bg-black/40 border border-white/10 p-4 rounded-xl flex items-start justify-between group hover:border-blue-500/40 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                        <span className="bg-blue-500/10 px-1.5 rounded">
                          {evt.day}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> {evt.time}
                        </span>
                      </div>
                      <div className="text-white font-bold">{evt.subject}</div>
                      <div className="text-slate-500 text-xs flex items-center gap-1">
                        <MapPin size={10} /> {evt.location}
                      </div>
                    </div>
                    <button className="p-2 bg-blue-500/10 text-blue-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-500 hover:text-white">
                      <Check size={14} />
                    </button>
                  </div>
                ))}
                <div className="pt-4">
                  <button
                    onClick={() => onScheduleDetected?.(detectedEvents)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20"
                  >
                    Importeer {detectedEvents.length} Blokken
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 min-h-[200px]">
                <ScanLine size={48} className="opacity-20" />
                <p className="text-xs font-bold text-center max-w-[200px]">
                  Scan een rooster om digitale blokken te genereren.
                </p>
              </div>
            )}

            {/* Raw text toggle for debug could go here */}
          </div>
        </div>
      </div>
    </div>
  );
};
