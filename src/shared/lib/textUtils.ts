/**
 * Preprocesses LaTeX content to ensure compatibility with remark-math.
 * Converts \[ ... \] to $$ ... $$ (block) and \( ... \) to $ ... $ (inline).
 * Handles inconsistent output from LLMs like Gemini.
 */
export const preprocessLaTeX = (content: string | null | undefined): string => {
  if (!content) return "";

  let processed = content;

  // 1. ELITE FIX: Catch single brackets [ ... ] if they appear to be math blocks
  // This is a common failure mode where LLM forgets the backslash.
  // We look for characters that strongly suggest math (\frac, \Sigma, ^2, =, etc.)
  processed = processed.replace(
    /(^|\n)\[\s*([\s\S]*?)\s*\](\s*(\n|$))/g,
    (orig, prefix, math, suffix) => {
      // Heuristic: if it contains math-specific tokens, treat as block math
      if (math.match(/\\|\^|_|\+|-|=|\{|\}|Sigma|alpha|beta|gamma|theta|delta|phi|tau|pi/i)) {
        return `${prefix}$$${math}$$$${suffix}`;
      }
      return orig;
    },
  );

  // 2. Standard block math \[ ... \] with $$ ... $$
  processed = processed.replace(
    /\\\[([\s\S]*?)\\\]/g,
    (_, equation) => `$$${equation}$$`,
  );

  // 3. Standard inline math \( ... \) with $ ... $
  processed = processed.replace(
    /\\\(([\s\S]*?)\\\)/g,
    (_, equation) => `$${equation}$`,
  );

  // 4. ELITE RECOVERY: Auto-fix common missing backslashes for Greek letters inside math
  // Only applies if already inside $ or $$ blocks
  processed = processed.replace(/\$\$(.*?)\$\$/gs, (_, math) => {
    let fixed = math
      .replace(/\b(Sigma|alpha|beta|gamma|theta|delta|omega|phi|tau|pi|lambda|rho|zeta|eta)\b/g, '\\$1')
      .replace(/Rightarrow/g, '\\Rightarrow')
      .replace(/rightarrow/g, '\\rightarrow')
      .replace(/tan\(/g, '\\tan(')
      .replace(/cos\(/g, '\\cos(')
      .replace(/sin\(/g, '\\sin(')
      .replace(/cdot/g, '\\cdot');

    // De-duplicate backslashes if already present
    fixed = fixed.replace(/\\\\/g, '\\');
    return `$$${fixed}$$`;
  });

  // 5. Unescape escaped dollar signs \$ -> $
  processed = processed.replace(/\\\$/g, "$");

  return processed;
};
