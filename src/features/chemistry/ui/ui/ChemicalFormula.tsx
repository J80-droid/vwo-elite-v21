/* eslint-disable no-useless-escape */
import "katex/dist/katex.min.css";

import React from "react";
import { InlineMath } from "react-katex";

interface ChemicalFormulaProps {
  formula: string;
  mode?: "latex" | "text";
  className?: string;
  big?: boolean;
}

export const ChemicalFormula: React.FC<ChemicalFormulaProps> = ({
  formula,
  mode = "text",
  className = "",
}) => {
  // Text mode parser (Rich Text)
  const renderText = () => {
    const parts = formula.split(/(\d+|\+|\-)/g);
    return (
      <span
        className={`font-outfit tracking-wide inline-flex items-baseline ${className}`}
      >
        {parts.map((part, i) => {
          if (!part) return null;
          // Number -> Subscript
          if (/^\d+$/.test(part)) {
            return (
              <sub key={i} className="text-[0.7em] leading-none opacity-80">
                {part}
              </sub>
            );
          }
          // Charge -> Superscript
          if (part === "+" || part === "-") {
            return (
              <sup key={i} className="text-[0.7em] leading-none">
                {part}
              </sup>
            );
          }
          return (
            <span key={i} className="font-medium">
              {part}
            </span>
          );
        })}
      </span>
    );
  };

  if (mode === "latex") {
    const latexStr = `\\text{${formula.replace(/(\d+)/g, "}_{$1}")}}`;
    return (
      <span className={className}>
        <InlineMath math={latexStr} />
      </span>
    );
  }

  return renderText();
};
