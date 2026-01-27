import * as math from "mathjs";

/**
 * Checks if two mathematical expressions are symbolically equivalent
 * by evaluating them at multiple random points.
 */
export const checkEquivalence = (expr1: string, expr2: string): boolean => {
  if (!expr1 || !expr2) return false;

  try {
    const node1 = math.parse(expr1);
    const node2 = math.parse(expr2);
    const compiled1 = node1.compile();
    const compiled2 = node2.compile();

    // Test at 5 random positive points to avoid domain errors (like log(-1))
    for (let i = 0; i < 5; i++) {
      const scope = {
        x: Math.random() * 10 + 1,
        y: Math.random() * 10 + 1,
        a: Math.random() * 10 + 1,
        b: Math.random() * 10 + 1,
        p: Math.random() * 10 + 1,
        q: Math.random() * 10 + 1,
        n: Math.random() * 10 + 1,
        k: Math.random() * 10 + 1,
      };

      const val1 = compiled1.evaluate(scope);
      const val2 = compiled2.evaluate(scope);

      // Allow for small floating point errors
      if (Math.abs(val1 - val2) > 1e-4) {
        return false;
      }
    }
    return true;
  } catch (e) {
    // Fallback to simple string comparison if parsing fails
    console.warn(
      "MathValidator symbolic check failed, falling back to string match",
      e,
    );
    return expr1.replace(/\s/g, "") === expr2.replace(/\s/g, "");
  }
};
