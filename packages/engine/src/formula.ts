/**
 * Safe evaluation of simulator formulas (e.g. "a = F / m") against
 * live slider values. Only digits, known symbols and +-*\/(). pass.
 */

/** Error thrown when a simulator formula cannot be parsed or evaluated. */
export class PhysicsFormulaError extends Error {
  constructor(message: string) {
    super(`[PhysicsWidget] ${message}`);
    this.name = "PhysicsFormulaError";
  }
}

/**
 * Evaluates the right-hand side of a formula against live slider values.
 * Only digits, known symbols and +-*\/(). are allowed; anything else throws.
 */
export function evaluateFormula(formula: string, values: Record<string, number>): number {
  const rhs = formula.includes("=") ? formula.split("=").slice(1).join("=").trim() : formula.trim();
  const symbols = Object.keys(values).sort((a, b) => b.length - a.length);
  let expr = rhs;
  for (const s of symbols) expr = expr.replace(new RegExp(`\\b${s}\\b`, "g"), String(values[s]));
  if (!/^[0-9+\-*/().\s^]*$/.test(expr)) throw new PhysicsFormulaError(`unsafe expression "${rhs}"`);
  const result: unknown = new Function(`return (${expr.replace(/\^/g, "**")});`)();
  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new PhysicsFormulaError(`formula did not evaluate to a finite number: "${rhs}"`);
  }
  return result;
}
