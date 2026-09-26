/**
 * Physics prompt injections for the 3-stage Keynox generation pipeline.
 * Pure string builders — no topic-specific branching, the model does the work.
 */

/** Stage 1 addition: forces mental-model, equation and visual extraction. */
export function stage1PhysicsPrompt(topic: string): string {
  return `PHYSICS DOMAIN EXTRACTION for "${topic}":
1. MENTAL MODELS: list the 2-4 physical mental models governing this topic
   (e.g. free-body diagrams, energy flow, field picture).
2. EQUATIONS: identify every governing equation with each variable's
   symbol, physical meaning, SI unit, and plausible min/max/default range.
3. WHITEBOARD VISUALS: describe one drawable visual per equation
   (vectors, springs, waves, field lines) as if sketching on a whiteboard.
OUTPUT FORMAT (strict JSON):
{ "mentalModels": string[], "equations": { "formula": string, "variables": { "symbol": string, "label": string, "unit": string, "min": number, "max": number, "default": number, "step": number }[] }[], "visuals": string[], "narrativeArc": { "hook": string, "build": string, "payoff": string } }`;
}

/** Stage 2 rules: every deck gets typed visuals and at least one simulator. */
export function stage2PhysicsPrompt(): string {
  return `PHYSICS STORYBOARD RULES:
- Every slide MUST specify a visualType from: projectile, wave, circuit,
  vector-field, spring-mass, pendulum, collision, field-lines.
- Every simulator slide MUST list variables with symbol, min, max, default, unit.
- REQUIRED: at least one interactive-simulator slide per deck.
- FORBIDDEN: bullet-only slides. A slide with no visualType is rejected.`;
}

/** Stage 3 rules: vanilla-JS simulators built only from drawingHelpers. */
export function stage3PhysicsPrompt(): string {
  return `PHYSICS CODE RULES:
- Vanilla JS only. Use ONLY these helpers from drawingHelpers.ts:
  drawVector, drawSpring, drawWave, drawArrow, drawFieldLines,
  drawGrid, drawLabel, animateLoop.
- Compute ALL values from live slider state via a recalculate() function
  wired to every input's "input" event. Never hardcode the output.
- Display the formula with the active variable highlighted.
GOOD (do this):
<section class="slide"><div class="phys-widget">
<div class="phys-formula">a = F / m</div><canvas></canvas>
<input type="range" id="F" min="0" max="100" value="20">
<script>const recalculate=()=>{const F=+FEl.value,M=+MEl.value;
out.textContent="a = "+(F/M).toFixed(2);};</script></div></section>
BAD — NEVER DO THIS:
<section class="slide"><h2>Newton's Laws</h2>
<ul><li>First law: inertia</li><li>Second law: F = ma</li>
<li>Third law: action-reaction</li></ul></section>`;
}

/** Per-slide quality gate prompt for the Nano critic model. */
export function critiquePrompt(slideHtml: string): string {
  return `Audit this slide HTML and reply with exactly one line.
CHECKS: has an interactive element (<input>, <canvas>, or <button>);
fewer than 4 bullets; the visual supports the title;
displayed values are computed from slider state, not hardcoded.
OUTPUT: "PASS" or "REGENERATE: {reason}".
SLIDE:\n${slideHtml}`;
}
