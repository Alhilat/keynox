/**
 * Electric field-line tracing for Keynox physics simulators.
 * Split from ./drawingHelpers to respect the 150-line module budget.
 */

/** A 2D point charge used by {@link drawFieldLines}. */
export interface FieldCharge {
  x: number;
  y: number;
  /** Polarity and relative magnitude; sign determines field direction. */
  charge: number;
}

/** Renders electric field lines for point charges via gradient-descent tracing. */
export function drawFieldLines(
  ctx: CanvasRenderingContext2D,
  charges: FieldCharge[],
  width: number,
  height: number
): void {
  const positives = charges.filter((c) => c.charge > 0);
  const seeds = positives.length > 0 ? positives : charges;
  ctx.lineWidth = 1.2;
  for (const s of seeds) {
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      let px = s.x + Math.cos(a) * 6;
      let py = s.y + Math.sin(a) * 6;
      ctx.strokeStyle = s.charge >= 0 ? "#38bdf8" : "#f472b6";
      ctx.beginPath();
      ctx.moveTo(px, py);
      for (let step = 0; step < 60; step++) {
        const f = fieldAt(charges, px, py);
        const mag = Math.hypot(f.x, f.y);
        if (mag === 0) break;
        px += (f.x / mag) * 6;
        py += (f.y / mag) * 6;
        if (px < 0 || px > width || py < 0 || py > height) break;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }
}
/** Computes the net electric field vector at a point from all charges. */
function fieldAt(charges: FieldCharge[], x: number, y: number): { x: number; y: number } {
  let fx = 0;
  let fy = 0;
  for (const c of charges) {
    const dx = x - c.x;
    const dy = y - c.y;
    const r = Math.sqrt(dx * dx + dy * dy) + 1e-6;
    const e = c.charge / (r * r);
    fx += (e * dx) / r;
    fy += (e * dy) / r;
  }
  return { x: fx, y: fy };
}
