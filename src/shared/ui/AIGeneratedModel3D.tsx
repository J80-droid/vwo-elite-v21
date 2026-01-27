import { OrbitControls, Stage, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Loader2 } from "lucide-react";
import React, { Suspense } from "react";

interface ModelProps {
    url: string;
}

const Model: React.FC<ModelProps> = ({ url }) => {
    const { scene } = useGLTF(url);
    return <primitive object={scene} />;
};

interface AIGeneratedModel3DProps {
    modelUrl: string | null;
    isLoading?: boolean;
    error?: string | null;
    prompt?: string;
    className?: string;
}

/**
 * 3D Viewer component for AI-generated models (Shap-E GLB)
 */
export const AIGeneratedModel3D: React.FC<AIGeneratedModel3DProps> = ({
    modelUrl,
    isLoading,
    error,
    prompt,
    className = "",
}) => {
    if (error) {
        return (
            <div className={`flex flex-col items-center justify-center bg-zinc-950/50 rounded-2xl border border-red-500/20 p-8 ${className}`}>
                <div className="text-red-400 text-sm font-bold mb-2">3D Generation Failed</div>
                <div className="text-slate-500 text-xs text-center">{error}</div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className={`flex flex-col items-center justify-center bg-zinc-950/50 rounded-2xl border border-white/5 p-8 ${className}`}>
                <div className="relative mb-4">
                    <div className="absolute inset-0 bg-blue-500/20 blur-2xl animate-pulse rounded-full" />
                    <Loader2 size={32} className="text-blue-500 animate-spin relative" />
                </div>
                <div className="text-white text-sm font-bold animate-pulse">
                    Constructing neural mesh...
                </div>
                {prompt && (
                    <div className="text-slate-500 text-[10px] mt-2 font-mono uppercase tracking-widest">
                        "{prompt}"
                    </div>
                )}
            </div>
        );
    }

    if (!modelUrl) {
        return (
            <div className={`flex flex-col items-center justify-center bg-zinc-950/50 rounded-2xl border border-dashed border-white/10 p-8 ${className}`}>
                <div className="text-slate-600 text-sm italic">Generate a prompt to visualize in 3D</div>
            </div>
        );
    }

    return (
        <div className={`relative bg-black rounded-2xl border border-white/10 overflow-hidden ${className}`}>
            <Canvas shadows camera={{ position: [2, 2, 2], fov: 45 }}>
                <Suspense fallback={null}>
                    <Stage environment="city" intensity={0.5} shadows="contact">
                        <Model url={modelUrl} />
                    </Stage>
                    <OrbitControls autoRotate autoRotateSpeed={2} enablePan={false} />
                </Suspense>
            </Canvas>

            {/* Overlay Info */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter mb-0.5">
                        Neural Object
                    </div>
                    <div className="text-xs text-white font-bold leading-tight truncate max-w-[200px]">
                        {prompt || "Generated Model"}
                    </div>
                </div>
                <div className="bg-blue-500/20 backdrop-blur-md px-2 py-1 rounded text-[9px] font-mono text-blue-300 border border-blue-500/30">
                    SHAP-E / R3F
                </div>
            </div>
        </div>
    );
};
