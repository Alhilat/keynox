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

/** Stage 3 rules: physics simulators and step-by-step mathematical problem solving. */
export function stage3PhysicsPrompt(): string {
  return `PHYSICS & MATHEMATICS CODE RULES:
1. MATHEMATICAL PROBLEM SOLVING & DERIVATIONS:
   - If solving a math problem or deriving a formula, output explicit, sequential steps (.math-step-card or .equation-card):
     * Include step badge (<span class="step-badge">STEP 01: [LAW/ACTION]</span>)
     * Display equation in KaTeX: <div class="equation-display">$$ LATEX_FORMULA $$</div>
     * Clear explanation of the algebraic transformation: <p class="step-explanation">...</p>
   - ZERO SKIPPED STEPS: Present all intermediate manipulations (factoring, substitution, integration, simplification). Never jump directly from problem to final answer.
   - DELIBERATE TIMELINE PACING (GSAP):
     Math steps must animate with at least 1.4s to 2.0s pause between steps so audience can read and follow the algebra!
     In window.initSlide_N(el):
       const tl = gsap.timeline({ paused: true });
       const steps = el.querySelectorAll(".math-step-card, .math-result-box");
       steps.forEach((st, idx) => {
         tl.fromTo(st, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.85, ease: "power2.out" }, idx === 0 ? "+=0.3" : "+=1.5");
       });
       return tl;
   - ZERO BLANK SLIDES: Ensure every slide has complete, visible layout with headings, cards, and formulas.

2. INTERACTIVE SIMULATORS (For dynamic physics parameters):
   - Use <div class="calc-workbench"> with interactive sliders (<input type="range" class="sim-slider">) and real-time calculation readouts.
   - Wire input events to live formula recalculations. Never hardcode the output.
   - Display the governing formula with the active variable highlighted.`;
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
