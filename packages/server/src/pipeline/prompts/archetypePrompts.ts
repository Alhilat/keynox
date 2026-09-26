import {
  ARCHETYPE_REGISTRY,
  VisualArchetypeId,
  normalizeArchetypeId,
} from "@presentation/schema";

/**
 * Builds the Visual Archetypes Catalog prompt injection for Model 2 (Storyboarding).
 */
export function buildStage2ArchetypeMenuPrompt(): string {
  const menuLines = Object.values(ARCHETYPE_REGISTRY)
    .map(
      (a) =>
        `- ${a.id} ("${a.name}") [${a.category.toUpperCase()}]: ${a.description} Required DOM: [${a.requiredElements.join(", ")}]`
    )
    .join("\n");

  return `
MANDATORY VISUAL ARCHETYPE REGISTRY ("IDEAS CATALOG"):
You must assign one concrete Visual Archetype to every slide based on the technical concept of that slide:
${menuLines}

STORYBOARD ARCHETYPE INVARIANTS:
1. Every slide MUST explicitly declare its archetype on its own line: "[ARCHETYPE: <archetype-id>]"
   (e.g., "[ARCHETYPE: motion-pipeline]" or "[ARCHETYPE: interactive-simulator]").
2. VARIETY LAW: NEVER use the exact same archetype for more than 2 consecutive slides.
3. HIGH IMPACT MANDATE: At least 50% of the slides in the presentation must use dynamic interaction or technical topology archetypes ("interactive-simulator", "motion-pipeline", "equation-morpher", "code-terminal", or "architecture-topology").
`;
}

/**
 * Returns the strict DOM and JS contract for Stage 3 to synthesize the selected archetype.
 */
export function getArchetypeDomContract(archetypeId: VisualArchetypeId): string {
  const def = ARCHETYPE_REGISTRY[archetypeId] || ARCHETYPE_REGISTRY["hero-split-overview"];

  switch (archetypeId) {
    case "interactive-simulator":
      return `
[ARCHETYPE CONTRACT: ${def.name}]
- Render a declarative interactive container based on the topic structure:
  (a) If the slide involves graph/tree/network topologies or step-by-step state search:
      <div class="graph-stepper-container" data-graph='{"nodes":[...],"edges":[[...]]}' data-algorithm="<name>" data-start-node="<id>"></div>
  (b) If the slide involves parameter formulas or quantitative dynamics:
      <div class="calc-workbench"> with <input type="range" class="sim-slider"> and real-time calculation cells.
- STRICT IRON LAW: NEVER write inline <script> or canvas 2D rendering code. The Keynox engine renders the interactive SVG and recalculations automatically from your declarative HTML attributes!
`;

    case "equation-morpher":
      return `
[ARCHETYPE CONTRACT: ${def.name}]
- DOM Architecture for Pedagogical Mathematical Derivations & Problem Solving:
  <div class="math-derivation-container">
    <div class="math-step-list">
      <!-- Explicit Step 1: Initial Formulation / Problem Statement -->
      <div class="math-step-card step-card-1">
        <div class="step-header">
          <span class="step-badge">STEP 01</span>
          <span class="step-rule">Initial Formula &amp; Given Variables</span>
        </div>
        <div class="equation-display">$$ FORMULA_STEP_1 $$</div>
        <p class="step-explanation">Explicit reason explaining the starting conditions and target goal.</p>
      </div>

      <!-- Explicit Step 2: Principle, Identity, or Substitution Applied -->
      <div class="math-step-card step-card-2">
        <div class="step-header">
          <span class="step-badge">STEP 02</span>
          <span class="step-rule">Apply Law / Substitution / Transformation</span>
        </div>
        <div class="equation-display">$$ FORMULA_STEP_2 $$</div>
        <p class="step-explanation">Explanation of algebraic manipulation or identity substitution applied.</p>
      </div>

      <!-- Explicit Step 3: Intermediate Simplification / Factoring -->
      <div class="math-step-card step-card-3">
        <div class="step-header">
          <span class="step-badge">STEP 03</span>
          <span class="step-rule">Simplify &amp; Evaluate Terms</span>
        </div>
        <div class="equation-display">$$ FORMULA_STEP_3 $$</div>
        <p class="step-explanation">Clear intermediate simplification showing where terms cancel or collect.</p>
      </div>

      <!-- Explicit Step 4: Final Evaluated Result -->
      <div class="math-result-box step-card-final">
        <div class="step-header">
          <span class="step-badge badge-emerald">FINAL RESULT</span>
          <span class="step-rule">Verified Solution</span>
        </div>
        <div class="equation-display">$$ FINAL_EVALUATED_RESULT $$</div>
        <p class="step-explanation">Verification, physical interpretation, or edge case analysis.</p>
      </div>
    </div>
  </div>

- DELIBERATE ANIMATION PACING (GSAP TIMELINE MANDATE):
  In window.initSlide_N(el):
  const tl = gsap.timeline({ paused: true });
  tl.fromTo(el.querySelectorAll(".slide-title-group, h2"), { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.6 });
  const steps = el.querySelectorAll(".math-step-card, .math-result-box");
  steps.forEach((st, idx) => {
    // Deliberate 1.5s reading delay between steps so viewers can read and comprehend each step!
    tl.fromTo(st,
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.85, ease: "power2.out" },
      idx === 0 ? "+=0.3" : "+=1.5"
    );
  });
  return tl;
- NO BLANK SLIDES LAW: All equations MUST be enclosed in $$ ... $$ delimiters. Never leave empty divs or spans without content.
`;

    case "motion-pipeline":
      return `
[ARCHETYPE CONTRACT: ${def.name}]
- Render a multi-stage conduit: <div class="motion-pipeline"> containing 3-5 <div class="pipeline-stage"> elements.
- Each stage must have: <span class="stage-num">01</span>, <div class="stage-icon">, <div class="stage-title">, and <div class="stage-desc">.
- Connect stages with animated <div class="pipeline-connector"><div class="packet-pulse"></div></div> elements.
- Reflect the true sequential lifecycle or data transmission steps of the topic.
`;

    case "benchmark-matrix":
      return `
[ARCHETYPE CONTRACT: ${def.name}]
- Render a high-density comparison matrix: <div class="matrix-container"><table class="matrix-table">.
- Provide distinct column headers (<th>) comparing mechanisms, complexity classes, or protocols.
- Include formatted data rows (<tr>) with status badges (<span class="badge badge-emerald">, <span class="badge badge-amber">) and numeric bounds.
- Highlight the winning tradeoff row with .highlight-row.
`;

    case "code-terminal":
      return `
[ARCHETYPE CONTRACT: ${def.name}]
- Render a dark developer terminal console: <div class="terminal-card">.
- Include a macOS/Unix style header bar: <div class="terminal-header"><div class="terminal-dots"><span class="terminal-dot dot-red"></span><span class="terminal-dot dot-yellow"></span><span class="terminal-dot dot-green"></span></div><span class="terminal-title">system-console</span></div>.
- Include syntax-highlighted code or CLI execution sequence with realistic flags, arguments, and sample console output.
`;

    case "architecture-topology":
      return `
[ARCHETYPE CONTRACT: ${def.name}]
- Render a layered subsystem hierarchy: <div class="arch-stack">.
- Include 3-4 distinct tiers (<div class="stack-tier">) showing isolation boundaries, privilege rings, or abstraction levels.
- Clearly label tier boundaries, data bus interaction arrows, and subsystem roles.
`;

    case "3d-webgl-model":
      return `
[ARCHETYPE CONTRACT: ${def.name}]
- Render a spatial WebGL viewport: <div class="three-container" data-model="<model-type>"><div class="three-overlay"><span class="three-badge">3D SPATIAL MODEL</span></div></div>.
- The Keynox engine automatically initializes the 3D rotating geometry or particle field.
`;

    case "bento-dashboard":
      return `
[ARCHETYPE CONTRACT: ${def.name}]
- Render an asymmetric metric bento dashboard: <div class="bento-grid">.
- Combine 1 .bento-wide or .bento-tall feature card with 2-3 compact stat tiles or metric telemetry cards (.stat-card).
- High visual contrast: use distinct badge colors (.badge-cyan, .badge-rose, .badge-emerald) and real domain values.
`;

    case "timeline-milestone":
      return `
[ARCHETYPE CONTRACT: ${def.name}]
- Render a horizontal stepped milestone journey: <div class="timeline-journey">.
- Include 3-4 sequential steps (<div class="timeline-step">) with numbered milestone nodes (<div class="timeline-node">01</div>, 02, 03).
- Provide a clear phase title and concise technical mechanism for each milestone node.
`;

    case "hero-cinematic":
      return `
[ARCHETYPE CONTRACT: ${def.name}]
- Render a full-bleed cinematic hero slide: <div class="hero-cinematic">.
- Use a massive headline: <h1 class="hero-headline">Headline Topic Name</h1>.
- Include a single high-impact takeaway statement (<p class="hero-subhead">) and 1 anchor metric card or key highlight badge.
- DO NOT render repetitive 3-card grids on this slide. Keep it cinematic and focused.
`;

    case "quote-spotlight":
      return `
[ARCHETYPE CONTRACT: ${def.name}]
- Render a high-contrast thesis spotlight layout: <div class="quote-spotlight">.
- Primary block: <p class="quote-text">Core domain thesis or principle statement</p><span class="quote-author">TECHNICAL SPECIFICATION</span>.
- Secondary block: a single structured panel providing concrete proof points or key technical context.
`;

    case "code-diff-pane":
      return `
[ARCHETYPE CONTRACT: ${def.name}]
- Render a side-by-side code evolution diff: <div class="diff-container"> with two panels (<div class="diff-pane">).
- Left pane: "BEFORE / LEGACY" with red/subtle highlight lines (<span class="diff-line-del">).
- Right pane: "AFTER / REFACTORED" with emerald/green highlight lines (<span class="diff-line-add">).
- Include line-by-line real code/config and an architectural annotation summarizing the exact technical improvement.
`;

    case "state-machine-fsm":
      return `
[ARCHETYPE CONTRACT: ${def.name}]
- Render a state transition diagram: <div class="state-diagram"> with 3-5 state nodes (<div class="state-node">).
- Connect states with transition arrows (<div class="state-arrow">→</div>) labeled with condition triggers.
- Include an interactive state switcher (<div class="state-switcher"><button class="state-btn active">...</button></div>) allowing click-to-highlight state inspection.
`;

    case "disk-memory-layout":
      return `
[ARCHETYPE CONTRACT: ${def.name}]
- Render a horizontal memory block stripe: <div class="disk-stripe"> containing 4-6 partitioned segments (<div class="stripe-block stripe-cyan">, .stripe-emerald, .stripe-amber, etc.).
- Each block must show: <div class="block-tag">TAG/OFFSET</div>, <div class="block-title">Field Name</div>, and <div class="block-size">Size/Bytes</div>.
- Below the stripe, include 2 focused detail cards explaining cache alignment, memory paging, or protocol serialization tradeoffs.
`;

    case "tree-hierarchy":
      return `
[ARCHETYPE CONTRACT: ${def.name}]
- Render a hierarchical tree or B-Tree index topology: <div class="pointer-topology">.
- Root node row -> Branch nodes row -> Leaf nodes row with labeled pointer vectors (<div class="pointer-node">).
- Reflect true tree structures from the domain (e.g. B-Tree index branching, DOM/AST parser tree, or routing Trie).
`;

    case "stat-dashboard-grid":
      return `
[ARCHETYPE CONTRACT: ${def.name}]
- Render an executive KPI telemetry dashboard: <div class="stat-grid"> with 4 distinct metric cards (<div class="stat-card card-cyan">, .card-emerald, etc.).
- Each card must display: <span class="stat-lbl">Metric Name</span>, a massive number <span class="stat-val val-cyan">Value</span>, and <span class="stat-sub">Domain context / delta</span>.
- 100% concrete numbers from the source material.
`;

    case "spatial-dual-plane":
      return `
[ARCHETYPE CONTRACT: ${def.name}]
- Render a 2D spatial dual-plane architecture: <div class="dual-plane">.
- Plane 1 (<div class="plane-zone plane-zone-host">): Contains header with tag/badge and .plane-nodes (<div class="plane-node">Node Label</div>).
- Separation Barrier (<div class="boundary-barrier">═══ BARRIER NAME / ISOLATION MEMBRANE ═══</div>).
- Plane 2 (<div class="plane-zone plane-zone-isolated">): Contains virtualized or isolated domain entities with .plane-nodes.
- Focus: Dedicate ≥60% of the slide to the spatial dual-plane schematic. Keep annotations concise.
`;

    case "mechanism-prism":
      return `
[ARCHETYPE CONTRACT: ${def.name}]
- Render a 3-conduit transformation mechanism: <div class="mechanism-prism">.
- Left Conduit (<div class="prism-input">): Input state/stream with badges and parameter values.
- Central Core (<div class="prism-core">): Active transformation engine with icon and processing rules.
- Right Conduit (<div class="prism-output">): Synthesized/translated output state with outcome properties.
- Connect the flow clearly using domain-specific entities from the source material.
`;

    case "anatomy-map":
      return `
[ARCHETYPE CONTRACT: ${def.name}]
- Render an anatomy diagram layout: <div class="anatomy-map">.
- Left/Primary Stage (<div class="anatomy-stage">): Central architectural, physical, or biological structural model.
- Right Column (<div class="callout-list">): 2-3 precision numbered callouts (<div class="callout-item"><b>01 Pointer:</b> Specific invariant detail</div>) pointing to features of the stage.
`;

    case "hero-split-overview":
    default:
      return `
[ARCHETYPE CONTRACT: ${def.name}]
- Render an executive visual split: <div class="grid-split">.
- Left column: Key thesis diagram or hero structure with badge and high-impact visual representation.
- Right column: 2 structured specification panels (.glass-card) with concrete parameter badges and metric callouts.
- FORBIDDEN: Do NOT render generic unformatted bullet lists. Use structured metric badges, chips, or sub-diagrams.
`;
  }
}

/**
 * Parses the [ARCHETYPE: <id>] tag from a storyboard slide section.
 * Restricts heuristic fallback scanning to the header/directive lines (first 3 lines)
 * to prevent body text words (like "code" or "simulate") from triggering false positives.
 */
export function extractArchetypeFromSection(sectionText: string): VisualArchetypeId {
  if (!sectionText) return "hero-split-overview";

  const match =
    sectionText.match(/\[ARCHETYPE:\s*([a-zA-Z0-9_\-]+)\]/i) ||
    sectionText.match(/(?:^|\n)\s*ARCHETYPE\s*[:\-—]\s*([a-zA-Z0-9_\-]+)/i) ||
    sectionText.match(/(?:VISUAL MODEL|VISUAL ARCHETYPE|LAYOUT|VISUAL SPEC)[^:]*:\s*([a-zA-Z0-9_\-]+)/i);

  if (match && match[1]) {
    return normalizeArchetypeId(match[1]);
  }

  // Scan only the header/directive lines (first 3 lines), not the full slide narrative body
  const headerLines = sectionText
    .split(/\r?\n/)
    .slice(0, 3)
    .join(" ");

  return normalizeArchetypeId(headerLines);
}
