import { RotateCcw, ShieldAlert } from "lucide-react";
import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class EngineErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center p-8 bg-obsidian-950/80 border border-red-500/20 rounded-3xl h-[400px] text-center backdrop-blur-xl">
                    <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20 mb-4 animate-pulse">
                        <ShieldAlert size={48} className="text-red-500" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                        Systeem Storing
                    </h3>
                    <p className="text-sm text-white/60 max-w-md mb-6 leading-relaxed">
                        De engine heeft een onverwachte waarde gedetecteerd. Dit kan gebeuren bij extreme inputwaarden (bijv. oneindige massa) of complexe simulaties.
                    </p>

                    {this.state.error && (
                        <div className="mb-6 p-3 bg-black/40 rounded-lg border border-white/5 text-[10px] font-mono text-red-300 w-full max-w-md overflow-x-auto text-left">
                            {this.state.error.toString()}
                        </div>
                    )}

                    <button
                        onClick={this.handleReset}
                        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-2"
                    >
                        <RotateCcw size={16} />
                        Herstart Module
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
