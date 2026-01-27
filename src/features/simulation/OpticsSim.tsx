import { calculateRayPath, useOpticsEngine } from "@features/physics";
import { Maximize } from "lucide-react";
import React, { useCallback, useEffect, useRef } from "react";

interface OpticsSimProps {
  mode?: "main" | "all" | "parameters" | "analysis";
}

export const OpticsSim: React.FC<OpticsSimProps> = ({ mode = "all" }) => {
  const { state, derived, setParam } = useOpticsEngine();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Haal relevante data op uit state/derived
  const {
    focalLength,
    objectDistance,
    objectHeight,
    lensType,
    showRays,
    showValues,
    showFormula,
    scenario,
    lens2FocalLength,
    lens2Distance,
  } = state;

  const finalImageX = scenario === "system" ? derived.image2X : derived.image1X;
  const finalHasImage =
    scenario === "system" ? derived.hasImage2 : derived.hasImage1;
  const finalMag = scenario === "system" ? derived.mTotal : derived.m1;
  const imageIsVirtual =
    scenario === "system" ? derived.isVirtual2 : derived.isVirtual;

  // Helper om lenzen te definiëren voor 2D tekenen
  const getLenses = useCallback(() => {
    const lenses: { x: number; f: number; label: string }[] = [];
    // Lens 1 (Altijd op x=0 relatief tot optische as in 3D, hier centreren we dynamisch)
    let f1 = focalLength;
    if (lensType === "concave") f1 = -Math.abs(f1);
    lenses.push({ x: 0, f: f1, label: "L1" });

    if (scenario === "system") {
      lenses.push({
        x: lens2Distance || 300,
        f: lens2FocalLength || 100,
        label: "L2",
      });
    } else if (scenario === "correction") {
      // Bril op 0, Oog op 15
      if (lenses[0]) lenses[0].label = "Bril";
      lenses.push({ x: 15, f: state.eyeAccommodation || 50, label: "Oog" });
    } else if (scenario === "eye") {
      if (lenses[0]) lenses[0].label = "Oog";
    }
    return lenses;
  }, [
    focalLength,
    lensType,
    scenario,
    lens2Distance,
    lens2FocalLength,
    state.eyeAccommodation,
  ]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // --- CONFIG ---
    const width = canvas.width;
    const height = canvas.height;
    const cy = height / 2;

    // Scale & Offset bepalen
    let originX = width * 0.3;
    let scale = 1.0;

    // --- Viewport Scaling Fix ---
    if (scenario === "eye" || scenario === "correction") {
      // Zoom in omdat alles tussen -50 en 100 afspeelt
      scale = 2.5;
      originX = width * 0.2;
    }

    // Clear
    ctx.fillStyle = "#020408";
    ctx.fillRect(0, 0, width, height);

    // --- FUNCTIES ---
    const toCanvasX = (mmX: number) => originX + mmX * scale;
    const toCanvasY = (mmY: number) => cy - mmY * scale;

    // 1. Optische As
    ctx.strokeStyle = "#334155";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(width, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Lenzen Tekenen
    const lenses = getLenses();
    const lensRadius = 85;

    lenses.forEach((lens) => {
      const lx = toCanvasX(lens.x);
      const isConcave = lens.f < 0;

      ctx.fillStyle = "rgba(125, 211, 252, 0.1)";
      ctx.strokeStyle = "#7dd3fc";
      ctx.lineWidth = 2;

      ctx.beginPath();
      if (isConcave) {
        // Holle lens vorm
        ctx.moveTo(lx - 5, cy - lensRadius);
        ctx.quadraticCurveTo(lx + 5, cy, lx - 5, cy + lensRadius);
        ctx.lineTo(lx + 5, cy + lensRadius);
        ctx.quadraticCurveTo(lx - 5, cy, lx + 5, cy - lensRadius);
      } else {
        // Bolle lens vorm
        ctx.ellipse(lx, cy, 6, lensRadius, 0, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();

      // Brandpunten
      ctx.fillStyle = "#fbbf24";
      const fDist = Math.abs(lens.f) * scale;

      ctx.beginPath();
      ctx.arc(lx - fDist, cy, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lx + fDist, cy, 2, 0, Math.PI * 2);
      ctx.fill();

      // Labels
      ctx.fillStyle = "#7dd3fc";
      ctx.font = "10px monospace";
      ctx.fillText(lens.label || "L", lx - 10, cy - (lensRadius + 10));
    });

    // 3. Voorwerp (Object)
    const objX_mm = -objectDistance;
    const objX = toCanvasX(objX_mm);
    const objY_top = toCanvasY(objectHeight);

    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(objX, cy);
    ctx.lineTo(objX, objY_top);
    // Pijlpunt
    const dir = objectHeight > 0 ? -1 : 1;
    ctx.lineTo(objX - 4, objY_top + 6 * dir);
    ctx.moveTo(objX, objY_top);
    ctx.lineTo(objX + 4, objY_top + 6 * dir);
    ctx.stroke();

    if (showValues) {
      ctx.fillStyle = "#22c55e";
      ctx.fillText("Voorwerp", objX - 25, cy + 20);
    }

    // 4. Ray Tracing (met Shared Tracer)
    if (showRays) {
      // Mapping voor tracer { x, f, h }
      // Aperture hoogte h ingesteld om overeen te komen met visuele tekening
      const traceLenses = lenses.map((l) => ({
        x: l.x,
        f: l.f,
        h: lensRadius,
      }));

      const startPt = { x: objX_mm, y: objectHeight };

      const r2_dx = -startPt.x;
      const r2_dy = -startPt.y;

      const absF = Math.abs(focalLength);
      const isConcave =
        (lensType === "concave" && scenario !== "correction") ||
        (scenario === "correction" && focalLength < 0);

      // Bepaal het doelpunt voor Ray 3 (brandpunt)
      let targetX_Ray3;
      if (isConcave) {
        targetX_Ray3 = absF;
      } else {
        targetX_Ray3 = -absF;
      }

      const r3_dx = targetX_Ray3 - startPt.x;
      const r3_dy = 0 - startPt.y;

      const rayDirs = [
        { x: 1, y: 0 }, // Ray 1: Parallel
        { x: r2_dx, y: r2_dy }, // Ray 2: Door optisch midden
        { x: r3_dx, y: r3_dy }, // Ray 3: Via/naar brandpunt
      ];

      ctx.lineWidth = 1;

      rayDirs.forEach((dir, i) => {
        ctx.strokeStyle = i === 1 ? "#22c55e" : "#fbbf24";

        const path = calculateRayPath(startPt, dir, traceLenses, 1000);

        if (path && path.length > 0) {
          ctx.beginPath();
          ctx.moveTo(toCanvasX(path[0]!.x), toCanvasY(path[0]!.y));
          for (let p = 1; p < path.length; p++) {
            ctx.lineTo(toCanvasX(path[p]!.x), toCanvasY(path[p]!.y));
          }
          ctx.stroke();
        }
      });
    }

    // 5. Beeld Tekenen (Uit derived state)
    if (
      finalHasImage &&
      finalImageX !== undefined &&
      Math.abs(finalImageX!) < 2000
    ) {
      const imgX = toCanvasX(finalImageX);
      const imgH = objectHeight * (finalMag || 1);
      const imgY_top = toCanvasY(imgH);

      ctx.strokeStyle = imageIsVirtual ? "#f472b6" : "#ef4444";
      ctx.setLineDash(imageIsVirtual ? [4, 4] : []);
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(imgX, cy);
      ctx.lineTo(imgX, imgY_top);
      // Pijlpunt
      const dir = imgH > 0 ? -1 : 1;
      ctx.lineTo(imgX - 4, imgY_top + 6 * dir);
      ctx.moveTo(imgX, imgY_top);
      ctx.lineTo(imgX + 4, imgY_top + 6 * dir);
      ctx.stroke();
      ctx.setLineDash([]);

      if (showValues) {
        ctx.fillStyle = imageIsVirtual ? "#f472b6" : "#ef4444";
        ctx.fillText("Beeld", imgX - 15, cy + 20);
      }
    }

    // Formula Overlay (Simplified)
    if (showFormula) {
      ctx.fillStyle = "white";
      ctx.font = "12px monospace";
      ctx.fillText(`Mode: ${scenario.toUpperCase()}`, 20, height - 20);
      if (finalMag !== undefined)
        ctx.fillText(`Vergroting: ${finalMag!.toFixed(2)}x`, 150, height - 20);
    }
  }, [
    getLenses,
    scenario,
    objectDistance,
    objectHeight,
    showValues,
    showRays,
    focalLength,
    lensType,
    finalHasImage,
    finalImageX,
    finalMag,
    imageIsVirtual,
    showFormula,
  ]);

  useEffect(() => {
    if (mode === "main" || mode === "all") draw();
  }, [draw, mode]);

  if (mode === "parameters") {
    return (
      <div className="bg-black/20 backdrop-blur-md p-4 rounded-3xl border border-white/10 space-y-4 shadow-2xl min-w-[220px]">
        <div className="text-slate-400 text-xs text-center border-b border-white/5 pb-2">
          PARAMETERS
        </div>

        {/* Object Distance */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-emerald-400 font-bold">
            <span>VOORWERP (u)</span>
            <span>{objectDistance} mm</span>
          </div>
          <input
            type="range"
            min="50"
            max="600"
            step="10"
            value={objectDistance}
            onChange={(e) => setParam("objectDistance", Number(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500"
          />
        </div>

        {/* Focal Length */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-amber-400 font-bold">
            <span>BRANDPUNT (f)</span>
            <span>{focalLength} mm</span>
          </div>
          <input
            type="range"
            min="50"
            max="300"
            step="10"
            value={focalLength}
            onChange={(e) => setParam("focalLength", Number(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
          />
        </div>

        {scenario === "system" && (
          <div className="space-y-1 pt-2 border-t border-white/5">
            <div className="flex justify-between text-xs text-cyan-400 font-bold">
              <span>LENS 2 (f2)</span>
              <span>{lens2FocalLength || 100} mm</span>
            </div>
            <input
              type="range"
              min="50"
              max="300"
              step="10"
              value={lens2FocalLength || 100}
              onChange={(e) =>
                setParam("lens2FocalLength", Number(e.target.value))
              }
              className="w-full"
            />
          </div>
        )}
      </div>
    );
  }

  if (mode === "analysis") {
    // Placeholder
    return (
      <div className="text-white text-xs opacity-50">
        Analysis Panel (Use Sidebar Toggle)
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col p-6 gap-6 relative">
      <div className="flex-1 bg-obsidian-950/40 rounded-3xl border border-white/5 relative flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1000}
          height={600}
          className="w-full h-full object-contain"
        />
      </div>
      {/* Overlay toggle for fullscreen? */}
      <div className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors cursor-pointer">
        <Maximize size={20} />
      </div>
    </div>
  );
};
