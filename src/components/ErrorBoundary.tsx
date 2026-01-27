import { logger } from "@shared/model/debugStore";
import { AlertCircle, AlertTriangle, RefreshCw } from "lucide-react";
import React, { ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  variant?: "full" | "card" | "minimal";
  name?: string; // Component name for logs
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console for devtools
    console.error("Uncaught error:", error, errorInfo);

    // Log to internal Debug Store
    logger.error(
      `Error in ${this.props.name || "Component"}: ${error.message}`,
      {
        stack: errorInfo.componentStack,
        variant: this.props.variant,
      },
    );
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { variant = "full" } = this.props;

      // Minimal Variant (Icons only)
      if (variant === "minimal") {
        return (
          <div
            className="flex items-center gap-2 text-rose-500 p-2 rounded bg-rose-500/10 border border-rose-500/20 text-xs"
            title={this.state.error?.message}
          >
            <AlertCircle className="w-4 h-4" />
            <span>Error</span>
            <button
              onClick={this.resetErrorBoundary}
              className="hover:text-rose-400"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        );
      }

      // Card Variant (For widgets)
      if (variant === "card") {
        return (
          <div className="h-full min-h-[200px] flex flex-col items-center justify-center p-6 bg-obsidian-900/50 border border-rose-500/20 rounded-xl text-center">
            <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="font-bold text-white mb-1">Component Error</h3>
            <p className="text-slate-400 text-sm mb-4 max-w-[250px]">
              {this.state.error?.message || "Something went wrong"}
            </p>
            <button
              onClick={this.resetErrorBoundary}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        );
      }

      // Full Variant (Default)
      return (
        <div className="min-h-screen bg-obsidian-950 flex items-center justify-center p-8 text-white">
          <div className="bg-obsidian-900 border border-obsidian-800 rounded-xl p-8 max-w-md w-full shadow-2xl">
            <div className="w-16 h-16 bg-rose-900/30 rounded-full flex items-center justify-center mb-6 mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-rose-500"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-center mb-2">
              Something went wrong
            </h1>
            <p className="text-slate-400 text-center mb-6">
              The application encountered an unexpected error. Please try
              reloading the page.
            </p>
            {this.state.error && (
              <div className="bg-obsidian-950 p-4 rounded text-xs font-mono text-rose-300 overflow-auto max-h-40 mb-6 border border-rose-900/50">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-electric hover:bg-electric-glow text-white font-bold py-3 rounded-lg transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
