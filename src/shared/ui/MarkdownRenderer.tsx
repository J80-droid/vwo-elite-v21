import React, { Suspense } from "react";

// Lazy load the heavy implementation
const MarkdownRendererInner = React.lazy(() =>
  import("./MarkdownRendererInner").then((m) => ({
    default: m.MarkdownRendererInner,
  })),
);

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = (props) => {
  return (
    <Suspense
      fallback={
        <div className={`markdown-content ${props.className} animate-pulse`}>
          <div className="h-4 bg-slate-800 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-slate-800 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-slate-800 rounded w-5/6"></div>
        </div>
      }
    >
      <MarkdownRendererInner {...props} />
    </Suspense>
  );
};
