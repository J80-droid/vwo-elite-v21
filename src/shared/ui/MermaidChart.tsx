import React, { useEffect, useId, useState } from "react";

/**
 * MermaidChart Component
 * Renders Mermaid.js diagrams with loading skeleton and error fallback
 */

interface MermaidChartProps {
  chart: string;
  className?: string;
}

export const MermaidChart: React.FC<MermaidChartProps> = ({
  chart,
  className = "",
}) => {
  const [svg, setSvg] = useState<string>("");
  const [status, setStatus] = useState<"loading" | "rendered" | "error">(
    "loading",
  );
  const uniqueId = useId();

  useEffect(() => {
    let isMounted = true;

    const renderChart = async () => {
      // If chart is too short, still loading from stream
      if (!chart || chart.trim().length < 10) {
        setStatus("loading");
        return;
      }

      try {
        // Dynamic import to avoid SSR issues
        const mermaid = (await import("mermaid")).default;

        // Initialize with dark theme
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "loose",
          fontFamily: "Inter, system-ui, sans-serif",
          flowchart: {
            htmlLabels: true,
            useMaxWidth: true,
            curve: "basis",
            padding: 15,
            nodeSpacing: 50,
            rankSpacing: 50,
            wrappingWidth: 200,
          },
          themeVariables: {
            primaryColor: "#3b82f6",
            primaryTextColor: "#f1f5f9",
            primaryBorderColor: "#475569",
            lineColor: "#64748b",
            secondaryColor: "#1e293b",
            tertiaryColor: "#0f172a",
            background: "#020617",
            mainBkg: "#0f172a",
            nodeBorder: "#3b82f6",
            clusterBkg: "#1e293b",
            titleColor: "#f1f5f9",
            edgeLabelBackground: "#1e293b",
            fontSize: "14px",
          },
        });

        // Generate unique ID for this render
        const id = `mermaid-${uniqueId.replace(/:/g, "")}-${Date.now()}`;

        // Render the chart
        const { svg: renderedSvg } = await mermaid.render(id, chart.trim());

        if (isMounted) {
          setSvg(renderedSvg);
          setStatus("rendered");
        }
      } catch (err) {
        console.warn("[MermaidChart] Render pending or failed:", err);
        // Don't show error immediately - might still be streaming
        if (isMounted && chart.length > 50) {
          setStatus("error");
        }
      }
    };

    // Debounce to wait for streaming to complete
    const timeoutId = setTimeout(renderChart, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [chart, uniqueId]);

  return (
    <div
      className={`mermaid-wrapper my-6 relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/50 ${className}`}
    >
      {/* Loading Skeleton */}
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center h-48 animate-pulse bg-slate-900/80">
          <svg
            className="w-10 h-10 text-slate-500 mb-3 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
          </svg>
          <span className="text-xs text-slate-500 font-mono tracking-wider uppercase">
            Generating Diagram...
          </span>
        </div>
      )}

      {/* Rendered SVG */}
      {status === "rendered" && (
        <div
          className="flex justify-center p-6 transition-opacity duration-500 [&_svg]:max-w-full [&_svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}

      {/* Error Fallback */}
      {status === "error" && (
        <div className="p-4">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-medium mb-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Diagram kon niet worden gerenderd
          </div>
          <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap bg-slate-950 p-3 rounded-lg border border-slate-800 overflow-x-auto">
            {chart}
          </pre>
        </div>
      )}
    </div>
  );
};
