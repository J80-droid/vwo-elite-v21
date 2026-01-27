import React from "react";

interface ChemicalFormatterProps {
  formula: string;
  className?: string;
}

const ChemicalFormatter: React.FC<ChemicalFormatterProps> = ({
  formula,
  className = "",
}) => {
  // Helper: Detecteer of de string al 'mooie' unicode bevat
  const hasUnicode = (s: string) => /[₀₁₂₃₄₅₆₇₈₉⁺⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(s);

  const formatPart = (part: string, index: number) => {
    if (!part.trim()) return <span key={index}>{part}</span>;

    // Als de string al unicode bevat (komt uit Engine), render hem 'as is' maar fix de pijlen
    if (hasUnicode(part)) {
      // Vervang pijl-achtige tekens door mooie pijlen indien nodig
      const display = part.replace("->", "→").replace("<=>", "⇌");
      return (
        <span key={index} className="inline-block">
          {display}
        </span>
      );
    }

    // --- HIERONDER DE STANDAARD ASCII PARSER (Voor user input / search) ---

    // 1. Handle Exponents (e.g., 10^-2)
    if (part.includes("^")) {
      const [base, exp] = part.split("^");
      return (
        <span key={index} className="inline-block whitespace-nowrap">
          {formatPart(base!, 0)}
          <sup className="text-[0.8em] align-baseline relative -top-[0.4em] ml-px">
            {(exp || "").replace(/[()]/g, "")}
          </sup>
        </span>
      );
    }

    // 2. Detect Coefficient (e.g. 2H2O)
    const coefficientMatch = part.match(/^(\d+)/);
    let coefficient = "";
    let remainder = part;

    if (coefficientMatch) {
      coefficient = coefficientMatch[1]!;
      remainder = part.substring(coefficientMatch[0].length);
    }

    // 3. Detect Charge at end (e.g. Fe3+, Cl-, 2+)
    const chargeMatch = remainder.match(/(.*?)(\d*[+-]+)$/);
    let charge = "";

    if (chargeMatch) {
      charge = chargeMatch[2]!;
      remainder = chargeMatch[1]!; // Het molecuul deel
    }

    // 4. Molecule parts (Subscripts voor getallen)
    const parts = remainder.split(/(\d+|[-=≡–→⇌])/).map((subPart, i) => {
      if (!subPart) return null;

      // Cijfers worden subscripts
      if (subPart.match(/^\d+$/)) {
        return (
          <sub
            key={i}
            className="text-[0.8em] align-baseline relative top-[0.15em]"
          >
            {subPart}
          </sub>
        );
      }
      // Speciale tekens
      if (["-", "=", "≡", "–", "→", "⇌"].includes(subPart)) {
        let bondClass = "font-bold mx-[1px] ";
        if (subPart === "-") bondClass += "text-slate-400";
        if (subPart === "=") bondClass += "text-cyan-400";
        if (subPart === "≡") bondClass += "text-amber-400";
        return (
          <span key={i} className={bondClass}>
            {subPart}
          </span>
        );
      }
      return <span key={i}>{subPart}</span>;
    });

    return (
      <span key={index} className="inline-block whitespace-nowrap">
        {coefficient && <span className="mr-0.5 font-bold">{coefficient}</span>}
        {parts}
        {charge && (
          <sup className="text-[0.8em] align-baseline relative -top-[0.4em] ml-0.5 font-bold text-cyan-200">
            {charge}
          </sup>
        )}
      </span>
    );
  };

  // Split op spaties om reactieonderdelen te scheiden
  return (
    <span className={`font-mono font-medium tracking-wide ${className}`}>
      {formula.split(/(\s+)/).map((part, i) => (
        <React.Fragment key={i}>
          {part.match(/\s+/) ? (
            <span>{part}</span>
          ) : ["+", "->", "<=>", "=", ">>", "⇌", "→"].includes(part) ? (
            <span className="mx-2 text-slate-500 font-bold">
              {part.replace("->", "→").replace("<=>", "⇌")}
            </span>
          ) : (
            formatPart(part, i)
          )}
        </React.Fragment>
      ))}
    </span>
  );
};

export default ChemicalFormatter;
