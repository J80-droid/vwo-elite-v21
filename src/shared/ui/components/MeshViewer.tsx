import {
    Center,
    ContactShadows,
    Environment,
    Float,
    MeshDistortMaterial,
    OrbitControls,
    Stage,
    useGLTF,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Loader2 } from "lucide-react";
import React, { Suspense } from "react";

/**
 * Basic Error Boundary for 3D Components
 */
class ThreeErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: unknown, errorInfo: unknown) {
        console.error("[MeshViewer] 3D Error caught:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }
        return this.props.children;
    }
}

interface MeshViewerProps {
    url: string;
    autoRotate?: boolean;
    shadows?: boolean;
}

/**
 * A Pulsating Energy Sphere used as a fallback when GLB fails to load.
 */
function FallbackMesh() {
    return (
        <Float speed={4} rotationIntensity={1} floatIntensity={1}>
            <mesh>
                <sphereGeometry args={[1, 64, 64]} />
                <MeshDistortMaterial
                    color="#8b5cf6"
                    speed={5}
                    distort={0.4}
                    radius={1}
                />
            </mesh>
        </Float>
    );
}

function Model({ url }: { url: string }) {
    const { scene } = useGLTF(url);
    return <primitive object={scene} />;
}

/**
 * Simple hook to check if an asset exists before R3F tries to load it.
 * This prevents the "Unexpected token <" console noise from 404 pages.
 */
function useAssetReady(url: string) {
    const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading");

    React.useEffect(() => {
        let isMounted = true;
        setStatus("loading");

        fetch(url, { method: "HEAD" })
            .then((res) => {
                if (!isMounted) return;
                // GLBs should return application/octet-stream or similar, but checking ok is enough
                if (res.ok && res.headers.get("content-type")?.includes("html") === false) {
                    setStatus("ready");
                } else {
                    setStatus("error");
                }
            })
            .catch(() => {
                if (!isMounted) return;
                setStatus("error");
            });

        return () => { isMounted = false; };
    }, [url]);

    return status;
}

export function MeshViewer({ url, autoRotate = true, shadows = true }: MeshViewerProps) {
    const assetStatus = useAssetReady(url);

    if (!url) return null;

    // Fast path: if asset is known to be missing, show fallback immediately WITHOUT a Canvas
    if (assetStatus === "error") {
        return (
            <div className="w-full h-full relative bg-zinc-950/50 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center">
                <FallbackMesh />
            </div>
        );
    }

    return (
        <div className="w-full h-full relative bg-zinc-950/50 rounded-2xl overflow-hidden border border-white/5">
            <Suspense fallback={
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Initializing 3D...</span>
                    </div>
                </div>
            }>
                {assetStatus === "ready" && (
                    <Canvas
                        key={url}
                        dpr={[1, 1.2]} // Lowered for 8GB RAM
                        shadows={shadows}
                        gl={{
                            antialias: false, // Save memory
                            powerPreference: "low-power", // Critical for 8GB RAM hubs
                            alpha: true,
                            stencil: false,
                            depth: true,
                        }}
                        camera={{ position: [0, 0, 4], fov: 45 }}
                        onCreated={({ gl }) => {
                            // Suggest to GC after unmount
                            return () => {
                                gl.dispose();
                            };
                        }}
                    >
                        <Environment preset="city" />

                        <Stage intensity={0.5} environment="city" adjustCamera={1.2} shadows={shadows ? "contact" : false}>
                            <Center>
                                <ThreeErrorBoundary fallback={<FallbackMesh />}>
                                    <Model url={url} />
                                </ThreeErrorBoundary>
                            </Center>
                        </Stage>

                        <OrbitControls
                            makeDefault
                            autoRotate={autoRotate}
                            autoRotateSpeed={0.5}
                            enablePan={false}
                            enableZoom={false}
                            minPolarAngle={0}
                            maxPolarAngle={Math.PI / 1.75}
                        />

                        {shadows && (
                            <ContactShadows
                                rotation={[Math.PI / 2, 0, 0]}
                                position={[0, -1.5, 0]}
                                opacity={0.4}
                                width={10}
                                height={10}
                                blur={2.5}
                                far={4.5}
                            />
                        )}
                    </Canvas>
                )}
            </Suspense>
        </div>
    );
}
