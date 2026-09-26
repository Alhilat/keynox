import type { PhysicsSliderConfig, PhysicsVisualType } from "@presentation/schema";
import { animateLoop } from "./animationLoop";
import { evaluateFormula, PhysicsFormulaError } from "./formula";
import {
  drawArrow,
  drawGrid,
  drawLabel,
  drawSpring,
  drawVector,
  drawWave,
} from "./drawingHelpers";
import { drawFieldLines } from "./fieldHelpers";

/** Visual types that animate continuously and need a running rAF loop. */
const ANIMATED_TYPES: ReadonlySet<string> = new Set([
  "projectile",
  "wave",
  "spring-mass",
  "pendulum",
  "collision",
]);

const CANVAS_W = 640;
const CANVAS_H = 360;

/** Escapes text interpolated into widget markup. */
function esc(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Mounts a vanilla-DOM physics simulator into a container and returns cleanup.
 * Builds one range slider per variable, a live equation block, and a canvas
 * visualization driven by the config visualType. All values recompute live.
 */
export function renderPhysicsWidget(
  container: HTMLElement,
  config: PhysicsSliderConfig
): () => void {
  container.innerHTML = `
    <div class="phys-widget">
      <div class="phys-formula">${esc(config.formula)}</div>
      <canvas class="phys-canvas" width="${CANVAS_W}" height="${CANVAS_H}"></canvas>
      <div class="phys-output"></div>
      <div class="phys-sliders">${config.variables
        .map(
          (v) => `<label class="phys-slider"><span>${esc(v.symbol)} (${esc(v.label)}, ${esc(v.unit)})</span>
          <input type="range" data-symbol="${esc(v.symbol)}" min="${v.min}" max="${v.max}" step="${v.step}" value="${v.default}">
          <b data-readout="${esc(v.symbol)}">${v.default}</b></label>`
        )
        .join("")}</div>
    </div>`;
  const canvas = container.querySelector("canvas");
  const outputEl = container.querySelector(".phys-output");
  if (!(canvas instanceof HTMLCanvasElement) || !outputEl) {
    throw new PhysicsFormulaError("widget markup failed to mount");
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new PhysicsFormulaError("2D canvas context unavailable");
  const sliders = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="range"]'));

  /** Reads slider state, recomputes the output, and refreshes all readouts. */
  const recalculate = (): number => {
    const values: Record<string, number> = {};
    for (const s of sliders) {
      const v = Number(s.value);
      values[s.dataset.symbol ?? ""] = v;
      const readout = container.querySelector(`[data-readout="${s.dataset.symbol}"]`);
      if (readout) readout.textContent = String(v);
    }
    const out = evaluateFormula(config.formula, values);
    outputEl.textContent = `${config.output.symbol} = ${out.toFixed(3)} ${config.output.unit}`;
    drawScene(ctx, config.visualType, values, out, performance.now() / 1000);
    return out;
  };
  for (const s of sliders) s.addEventListener("input", recalculate);
  recalculate();

  if (!ANIMATED_TYPES.has(config.visualType)) return () => undefined;
  const cancel = animateLoop(() => {
    const values: Record<string, number> = {};
    for (const s of sliders) values[s.dataset.symbol ?? ""] = Number(s.value);
    try {
      const out = evaluateFormula(config.formula, values);
      drawScene(ctx, config.visualType, values, out, performance.now() / 1000);
    } catch {
      return;
    }
  });
  return () => cancel();
}

/** Dispatches the canvas paint to the helper matching the visual type. */
function drawScene(
  ctx: CanvasRenderingContext2D,
  type: PhysicsVisualType,
  values: Record<string, number>,
  out: number,
  t: number
): void {
  const nums = Object.values(values);
  const a = nums[0] ?? 1;
  const b = nums[1] ?? out;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  switch (type) {
    case "wave":
      drawGrid(ctx, CANVAS_W, CANVAS_H, 32, "rgba(148,163,184,0.15)");
      drawWave(ctx, Math.max(1, Math.abs(a)), Math.min(120, Math.abs(b)), t * 2, "#38bdf8", CANVAS_W, CANVAS_H);
      break;
    case "spring-mass":
      drawGrid(ctx, CANVAS_W, CANVAS_H, 32, "rgba(148,163,184,0.15)");
      drawSpring(ctx, 60, 180, 60 + 200 + Math.sin(t * 2) * Math.min(80, Math.abs(out)), 180, 8);
      drawVector(ctx, 60, 240, Math.min(200, Math.abs(out) * 10), 0, "#34d399", `F=${out.toFixed(2)}`);
      break;
    case "pendulum":
      drawGrid(ctx, CANVAS_W, CANVAS_H, 32, "rgba(148,163,184,0.15)");
      drawArrow(ctx, 320, 60, Math.PI / 2 + Math.sin(t) * 0.6, 180 + Math.abs(a) * 4, "#818cf8", `θ=${a}`);
      break;
    case "projectile":
      drawGrid(ctx, CANVAS_W, CANVAS_H, 32, "rgba(148,163,184,0.15)");
      drawVector(ctx, 60, 300, Math.abs(a) * 6, -Math.abs(b) * 6, "#38bdf8", `v (${out.toFixed(1)})`);
      break;
    case "collision":
      drawGrid(ctx, CANVAS_W, CANVAS_H, 32, "rgba(148,163,184,0.15)");
      drawArrow(ctx, 120 + Math.sin(t * 3) * 60, 180, 0, Math.abs(a) * 5, "#38bdf8", "m1");
      drawArrow(ctx, 520 - Math.sin(t * 3) * 60, 180, Math.PI, Math.abs(b) * 5, "#f472b6", "m2");
      break;
    default:
      drawFieldLines(ctx, [{ x: 220, y: 180, charge: a }, { x: 420, y: 180, charge: -b }], CANVAS_W, CANVAS_H);
      drawLabel(ctx, 24, 40, `E ∝ ${out.toFixed(2)}`, "#38bdf8", 13);
      break;
  }
}
