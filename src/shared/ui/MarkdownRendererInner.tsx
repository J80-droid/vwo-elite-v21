/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable react-hooks/error-boundaries */
/* eslint-disable @typescript-eslint/no-explicit-any -- react-markdown component props */
import { preprocessLaTeX } from "@shared/lib/textUtils";
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Lightbulb,
  Loader2,
} from "lucide-react";
import React from "react";
import ReactMarkdown from "react-markdown";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

// Lazy load heavy components
const SyntaxHighlighter = React.lazy(() =>
  import("react-syntax-highlighter").then((mod) => ({ default: mod.Prism })),
);
const MermaidChart = React.lazy(() =>
  import("./MermaidChart").then((mod) => ({ default: mod.MermaidChart })),
);
const ResearchVisualizer = React.lazy(() =>
  import("./ResearchVisualizer").then((mod) => ({ default: mod.ResearchVisualizer })),
);

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Custom Blockquote component to handle callouts
 */
const CustomBlockquote = ({ children }: any) => {
  // Flatten children to text to find callout markers
  const contentText = React.Children.toArray(children)
    .map((child: any) => {
      if (typeof child === "string") return child;
      if (child.props && child.props.children) {
        // Handle nested structure from react-markdown (usually p > text)
        const nested = child.props.children;
        if (typeof nested === "string") return nested;
        if (Array.isArray(nested))
          return nested.filter((n) => typeof n === "string").join("");
      }
      return "";
    })
    .join("");

  // Check for markers like [!INFO], [!WARNING], etc.
  const markers: Record<string, { class: string; icon: any; label: string }> = {
    "[!INFO]": {
      class: "callout-info",
      icon: <Info size={16} />,
      label: "Informatie",
    },
    "[!SUCCESS]": {
      class: "callout-success",
      icon: <CheckCircle size={16} />,
      label: "Succes",
    },
    "[!WARNING]": {
      class: "callout-warning",
      icon: <AlertTriangle size={16} />,
      label: "Let op",
    },
    "[!TIP]": {
      class: "callout-tip",
      icon: <Lightbulb size={16} />,
      label: "Tip",
    },
    "[!NOTE]": {
      class: "callout-info",
      icon: <Info size={16} />,
      label: "Notitie",
    },
  };

  let matchedMarker = null;
  for (const marker in markers) {
    if (contentText.trim().startsWith(marker)) {
      matchedMarker = marker;
      break;
    }
  }

  if (matchedMarker) {
    const config = markers[matchedMarker];
    if (!config) return <blockquote>{children}</blockquote>;

    // Remove the marker from the actual visible content
    const cleanChildren = React.Children.map(children, (child: any) => {
      if (child.props && child.props.children) {
        const nested = child.props.children;
        if (
          typeof nested === "string" &&
          nested.trim().startsWith(matchedMarker)
        ) {
          return React.cloneElement(child, {
            ...child.props,
            children: nested.replace(matchedMarker, "").trim(),
          });
        }
        if (
          Array.isArray(nested) &&
          typeof nested[0] === "string" &&
          nested[0].trim().startsWith(matchedMarker)
        ) {
          const newNested = [...nested];
          newNested[0] = newNested[0]!.replace(matchedMarker, "").trim();
          return React.cloneElement(child, {
            ...child.props,
            children: newNested,
          });
        }
      }
      return child;
    });

    return (
      <blockquote className={`callout ${config.class}`}>
        <div className="callout-title">
          {config.icon}
          <span>{config.label}</span>
        </div>
        <div className="callout-body">{cleanChildren}</div>
      </blockquote>
    );
  }

  return <blockquote>{children}</blockquote>;
};

/**
 * Custom Code component to handle Mermaid diagrams and syntax highlighting
 */
const CustomCode = ({ node, inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : null;
  const codeString = String(children).replace(/\n$/, "");

  // Mermaid diagrams
  if (!inline && language === "mermaid") {
    return (
      <React.Suspense
        fallback={
          <div className="h-40 flex items-center justify-center bg-obsidian-950 rounded-xl border border-white/5">
            <Loader2 className="w-6 h-6 animate-spin text-electric/50" />
          </div>
        }
      >
        <MermaidChart chart={codeString} />
      </React.Suspense>
    );
  }

  // Research Visualizations
  if (!inline && language === "research") {
    try {
      const researchParams = JSON.parse(codeString);
      return (
        <React.Suspense
          fallback={
            <div className="h-40 flex items-center justify-center bg-obsidian-950 rounded-xl border border-white/5">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400/50" />
            </div>
          }
        >
          <ResearchVisualizer {...researchParams} />
        </React.Suspense>
      );
    } catch (e) {
      console.error("Failed to parse research data:", e);
      return <pre className="text-[10px] text-red-400 p-4 font-mono bg-red-400/10 rounded-xl">Error rendering research visualization.</pre>;
    }
  }

  // Regular code blocks with syntax highlighting
  if (!inline && language) {
    return (
      <div className="relative my-4 rounded-xl overflow-hidden border border-slate-700/50 min-h-[50px]">
        <div className="absolute top-0 right-0 px-3 py-1 text-[10px] font-mono text-slate-500 uppercase tracking-wider z-10">
          {language}
        </div>
        <React.Suspense
          fallback={
            <div className="p-6 bg-[#0d1117] font-mono text-sm text-slate-500 animate-pulse whitespace-pre">
              {codeString}
            </div>
          }
        >
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={language}
            PreTag="div"
            showLineNumbers={codeString.split("\n").length > 3}
            wrapLongLines={true}
            customStyle={{
              margin: 0,
              padding: "1.5rem",
              paddingTop: "2rem",
              background: "#0d1117",
              fontSize: "0.875rem",
            }}
            {...props}
          >
            {codeString}
          </SyntaxHighlighter>
        </React.Suspense>
      </div>
    );
  }

  // Inline code
  return (
    <code
      className="px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-sm shadow-[0_0_10px_-5px_rgba(245,158,11,0.2)]"
      {...props}
    >
      {children}
    </code>
  );
};

export const MarkdownRendererInner: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
}) => {
  // Defensive check for empty/null content
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return <div className={`markdown-content ${className}`}></div>;
  }

  try {
    return (
      <div className={`markdown-content ${className}`}>
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            blockquote: CustomBlockquote,
            code: CustomCode,
            p: ({ children }) => (
              <p className="mb-4 text-slate-300 leading-relaxed [font-feature-settings:'ss01'] last:mb-0">
                {children}
              </p>
            ),
            strong: ({ children }) => (
              <strong className="text-white font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/10 mx-0.5">
                {children}
              </strong>
            ),
            h1: ({ children }) => (
              <h1 className="text-3xl font-black text-white mb-8 border-b border-white/10 pb-4 tracking-tight">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-bold text-indigo-300 mt-10 mb-6 border-l-4 border-indigo-500 pl-4 py-1 bg-indigo-500/10 rounded-r-lg shadow-[0_0_15px_-5px_rgba(99,102,241,0.3)]">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-bold text-[#39ff14] mt-8 mb-4 flex items-center gap-2 text-glow">
                <span className="w-2 h-2 rounded-full bg-[#39ff14] shadow-[0_0_10px_#39ff14]" />
                {children}
              </h3>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-6">
                <table className="min-w-full border border-slate-700 rounded-lg overflow-hidden">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-slate-800">{children}</thead>
            ),
            th: ({ children }) => (
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-600">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-3 text-sm text-slate-300 border-b border-slate-700/50">
                {children}
              </td>
            ),
            li: ({ children }) => (
              <li className="mb-2 flex items-start gap-3 text-slate-300 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] mt-2 shrink-0" />
                <span>{children}</span>
              </li>
            ),
          }}
        >
          {preprocessLaTeX(content)}
        </ReactMarkdown>
      </div>
    );
  } catch (error) {
    console.error("[MarkdownRenderer] Error rendering content:", error);
    // Fallback to plain text
    return (
      <div className={`markdown-content ${className}`}>
        <p className="text-slate-300 whitespace-pre-wrap">{content}</p>
      </div>
    );
  }
};
