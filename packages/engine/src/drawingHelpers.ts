/**
 * Vanilla canvas drawing primitives for Keynox physics simulators.
 * Every helper takes an explicit 2D context — no global state, no framework.
 * Field-line tracing lives in ./fieldHelpers to keep this module focused.
 */

/** Draws an arrow from (x, y) along direction (dx, dy) with a text label. */
export function drawVector(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number,
  color: string,
  label: string
): void {
  const len = Math.hypot(dx, dy);
  if (len === 0) return;
  const ux = dx / len;
  const uy = dy / len;
  drawArrow(ctx, x, y, Math.atan2(uy, ux), len, color);
  drawLabel(ctx, x + dx + 8 * ux, y + dy + 8 * uy, label, color, 12);
}

/** Draws a zigzag spring between two points with the given coil count. */
export function drawSpring(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  coils: number
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len === 0) return;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const segments = Math.max(2, Math.round(coils) * 2);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const off = i % 2 === 0 ? 0 : 12;
    ctx.lineTo(x1 + dx * t + px * off, y1 + dy * t + py * off);
  }
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/** Draws a sine wave across the canvas with the given phase. */
export function drawWave(
  ctx: CanvasRenderingContext2D,
  frequency: number,
  amplitude: number,
  phase: number,
  color: string,
  width: number,
  height: number
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= width; x += 2) {
    const y = height / 2 + Math.sin((x / width) * Math.PI * 2 * frequency + phase) * amplitude;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

/** Draws a single directional arrow starting at (x, y) at the given angle. */
export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number,
  color: string,
  label?: string
): void {
  const ex = x + Math.cos(angle) * length;
  const ey = y + Math.sin(angle) * length;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(ex, ey);
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - 10 * Math.cos(angle - 0.4), ey - 10 * Math.sin(angle - 0.4));
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - 10 * Math.cos(angle + 0.4), ey - 10 * Math.sin(angle + 0.4));
  ctx.stroke();
  if (label !== undefined) drawLabel(ctx, ex + 6, ey - 6, label, color, 12);
}

/** Draws a reference grid across the canvas. */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  spacing: number,
  color: string
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= width; x += spacing) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = 0; y <= height; y += spacing) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();
}

/** Draws a text label with a background pill at the given position. */
export function drawLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
  fontSize: number
): void {
  ctx.font = `${fontSize}px JetBrains Mono, monospace`;
  const w = ctx.measureText(text).width + 12;
  const h = fontSize + 10;
  const r = h / 2;
  ctx.fillStyle = "rgba(2, 6, 23, 0.85)";
  ctx.beginPath();
  ctx.arc(x, y - h / 2, r, Math.PI / 2, (Math.PI * 3) / 2);
  ctx.arc(x + w, y - h / 2, r, -Math.PI / 2, Math.PI / 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillText(text, x + 6, y - fontSize / 2 + 4);
}

/** Scales a canvas element and its context for high-DPI (Retina) screens. */
export function setupHiDPICanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
): CanvasRenderingContext2D | null {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.scale(dpr, dpr);
  }
  return ctx;
}

/** Wraps requestAnimationFrame; returns a function that cancels the loop. */
export { animateLoop } from "./animationLoop";

