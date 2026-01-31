/* eslint-disable no-useless-escape */
/* eslint-disable unused-imports/no-unused-vars */
import "katex/dist/katex.min.css";

import katex from "katex";
import { useEffect, useRef } from "react";

export const MathRenderer = ({ text }: { text: string }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current || !text) return;

    // We bouwen de HTML string op door tekst, LaTeX en bold te splitsen
    const parts = text.split(/(\$[^\$]+\$|\*\*[^\*]+\*\*)/g);

    // Clear previous content
    containerRef.current.innerHTML = "";

    parts.forEach((part) => {
      if (part.startsWith("$") && part.endsWith("$")) {
        const span = document.createElement("span");
        try {
          katex.render(part.slice(1, -1), span, {
            throwOnError: false,
            displayMode: false,
          });
        } catch (e) {
          span.innerText = part;
        }
        containerRef.current?.appendChild(span);
      } else if (part.startsWith("**") && part.endsWith("**")) {
        const strong = document.createElement("strong");
        strong.className = "font-black text-amber-500";
        strong.innerText = part.slice(2, -2);
        containerRef.current?.appendChild(strong);
      } else {
        const span = document.createElement("span");
        span.innerText = part;
        containerRef.current?.appendChild(span);
      }
    });
  }, [text]);

  return <span ref={containerRef} />;
};
