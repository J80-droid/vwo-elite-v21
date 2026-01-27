import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorType: "generic" | "webgl";
  retryCount: number;
}

/**
 * Specialized Error Boundary for WebGL / ThreeJS components.
 * Includes auto-recovery mechanism for transient WebGL context issues.
 * Catches specific EffectComposer "alpha" errors that occur during context loss.
 */
export class WebGLErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorType: "generic",
    retryCount: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Catch WebGL errors AND specific Three.js/Post-processing crashes
    const isWebGLError =
      error.message?.toLowerCase().includes("webgl") ||
      error.message?.toLowerCase().includes("context lost") ||
      error.message?.includes("reading 'alpha'") || // EffectComposer crash
      error.message?.includes("Cannot read properties of null");

    return { hasError: true, errorType: isWebGLError ? "webgl" : "generic" };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("WebGL Error Boundary caught:", error, errorInfo);

    // AUTO-RECOVERY: Attempt immediate reset for transient WebGL issues
    if (this.state.retryCount < 3 && this.state.errorType === "webgl") {
      console.log(
        `[WebGL] Auto-recovery attempt ${this.state.retryCount + 1}/3...`,
      );
      setTimeout(
        () => {
          this.setState((prev) => ({
            hasError: false,
            retryCount: prev.retryCount + 1,
          }));
        },
        100 * (this.state.retryCount + 1),
      ); // Increasing delay: 100ms, 200ms, 300ms
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorType: "generic", retryCount: 0 });
  };

  public render() {
    if (this.state.hasError) {
      // During auto-recovery, render empty div to fully unmount Canvas
      if (this.state.retryCount < 3 && this.state.errorType === "webgl") {
        return <div className="w-full h-full bg-black animate-pulse" />;
      }

      // Use custom fallback if provided
      if (this.props.fallback) return this.props.fallback;

      // Default fallback UI with manual reset option
      return (
        <div className="w-full h-full flex items-center justify-center bg-obsidian-900/50 rounded-xl border border-white/10 backdrop-blur-sm p-8 text-center">
          <div className="max-w-xs space-y-4">
            <div className="inline-flex p-3 bg-amber-500/10 rounded-full border border-amber-500/20 text-amber-500 mb-2">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-white font-bold text-lg">
              {this.state.errorType === "webgl"
                ? "GPU Engine Herstarten"
                : "Visualisatie Grafiek Fout"}
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              De grafische kaart werd onderbroken (vaak door slaapstand of
              screenshots). Klik hieronder om te herstellen.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 font-bold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} /> Herstel Engine
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
