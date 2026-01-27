/* eslint-disable no-useless-escape */
/* eslint-disable unused-imports/no-unused-vars */
import "katex/dist/katex.min.css";

import katex from "katex";
import { useEffect, useRef } from "react";

export const MathRenderer = ({ text }: { text: string }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current || !text) return;

    // We bouwen de HTML string op door tekst en LaTeX te splitsen
    const parts = text.split(/(\$[^\$]+\$)/g);

    // Clear previous content
    containerRef.current.innerHTML = "";

    parts.forEach((part) => {
      const span = document.createElement("span");
      if (part.startsWith("$") && part.endsWith("$")) {
        try {
          // Render LaTeX in de span
          katex.render(part.slice(1, -1), span, {
            throwOnError: false,
            displayMode: false, // Inline math
          });
        } catch (e) {
          span.innerText = part; // Fallback
        }
      } else {
        span.innerText = part;
      }
      containerRef.current?.appendChild(span);
    });
  }, [text]);

  return <span ref={containerRef} />;
};
