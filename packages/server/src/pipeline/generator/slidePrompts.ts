import { sanitizeDocumentContent } from "../topic-extractor";
import { getArchetypeDomContract, extractArchetypeFromSection } from "../prompts/archetypePrompts";
import { detectDocumentDomain, getDomainExtractionPrompt, DocumentDomain } from "../prompts/domainAdaptivePrompts";
import { stage3PhysicsPrompt } from "../prompts/physics";

export const DESIGN_SYSTEM_VOCABULARY = `
KEYNOX MASTER COMPOSITION GUIDE — PREMIUM VISUAL DESIGN STANDARDS
You are composing for a 1280×720 dark-obsidian keynote stage viewed on 4K displays by a technical audience.
Every slide must have VISUAL DENSITY ≥ 3 distinct visual regions and INFORMATION DEPTH that rewards close reading.
Derive the layout from the content's natural structure — never pick a layout first and fill it with generic text.

━━━ NON-NEGOTIABLE QUALITY & ANTI-TEMPLATE LAWS ━━━
• ANTI-MONOTONY MANDATE: NEVER make all slides look like 3 glass cards in a row. Rotate layouts aggressively!
• VARY SLIDE TOPOLOGY: Use full-bleed hero statements (.hero-cinematic), bento grids (.bento-grid), horizontal milestone timelines (.timeline-journey), thesis spotlights (.quote-spotlight), interactive simulators, code terminals, architecture stacks, and comparison matrices.
• ZERO SKELETON SLIDES: Never emit a slide where cards say generic placeholder text ("Key Points", "Features", "Benefits"). Each card must make a distinct, substantive, domain-specific claim.
• REAL NUMBERS ONLY: Use actual values from the document (latencies, bit widths, step counts, complexity classes). Never invent ranges like "X% faster" or "up to N×".
• ICONS OVER EMOJIS: Use inline SVG stroke icons (viewBox="0 0 24 24", stroke-width="2", fill="none") for all visual accents. Never use emoji.

━━━ LAYOUT ANATOMY GUIDE ━━━

SLIDE STRUCTURE OPTIONS:
  Option A (Standard/Detail Slides):
    1. .slide-title-group — headline block (slide-category, slide-title, slide-subtitle)
    2. Primary visual region — pipeline / bento grid / timeline / topology / terminal / simulator / matrix
  Option B (Hero & Cinematic Slides):
    1. .hero-cinematic — centered bold presentation statement with .hero-headline and .hero-subhead

━━━ LAYOUT PRIMITIVES ━━━
• .hero-cinematic   — centered full-bleed hero title statement (use for Slide 1 or major section breaks)
  <div class="hero-cinematic">
    <h1 class="hero-headline">Bold Domain Title</h1>
    <p class="hero-subhead">Authoritative thesis statement from the domain</p>
  </div>
• .bento-grid       — asymmetric mixed grid layout (.bento-wide = 2 cols, .bento-tall = 2 rows)
  <div class="bento-grid">
    <div class="glow-card bento-wide glow-cyan">Primary mechanism deep dive</div>
    <div class="glow-card glow-indigo">Telemetry stat 1</div>
    <div class="glow-card glow-emerald">Telemetry stat 2</div>
  </div>
• .diff-container   — side-by-side code evolution comparison
  <div class="diff-container">
    <div class="diff-pane"><div class="diff-header">BEFORE / UNINDEXED</div><pre><code><span class="diff-line-del">- Full Table Scan (120ms)</span></code></pre></div>
    <div class="diff-pane"><div class="diff-header">AFTER / B-TREE INDEXED</div><pre><code><span class="diff-line-add">+ Index Scan O(log N) (2.4ms)</span></code></pre></div>
    <div class="diff-annotation">Summary of exact latency or complexity delta</div>
  </div>
• .state-diagram    — FSM state machine with transition arrows & interactive state switcher
  <div class="state-diagram">
    <div class="state-node"><div class="state-name">IDLE</div><div class="state-desc">Waiting for trigger</div></div>
    <div class="state-arrow">→ [SYN] →</div>
    <div class="state-node"><div class="state-name">ACTIVE</div><div class="state-desc">Processing request</div></div>
  </div>
• .dual-plane       — top/bottom or left/right planes separated by an isolation/boundary barrier
  <div class="dual-plane">
    <div class="plane-zone plane-zone-host">
      <div class="plane-header"><span class="plane-tag" style="color:var(--accent-cyan)">HOST KERNEL VIEW</span><span class="badge badge-cyan">GLOBAL SCOPE</span></div>
      <div class="plane-nodes"><div class="plane-node">PID 1: systemd</div><div class="plane-node">PID 1084: nginx</div></div>
    </div>
    <div class="boundary-barrier">═══ CLONE_NEWPID ISOLATION MEMBRANE ═══</div>
    <div class="plane-zone plane-zone-isolated">
      <div class="plane-header"><span class="plane-tag" style="color:var(--accent-emerald)">CONTAINER VIEW</span><span class="badge badge-emerald">VIRTUAL SCOPE</span></div>
      <div class="plane-nodes"><div class="plane-node">PID 1: nginx (Self-Root)</div></div>
    </div>
  </div>
• .mechanism-prism  — 3-column input conduit -> central transformation engine -> output state
  <div class="mechanism-prism">
    <div class="prism-input"><span class="badge badge-cyan">INPUT STREAM</span><div class="card-title">Virtual Address 0x7FFF</div><p class="card-desc">Continuous 4KB pages</p></div>
    <div class="prism-core"><div class="stage-icon">⚡</div><div class="card-title">MMU Page Table</div><div class="badge badge-indigo">TRANSLATION ENGINE</div></div>
    <div class="prism-output"><span class="badge badge-emerald">PHYSICAL RAM</span><div class="card-title">Frame 0x1A40</div><p class="card-desc">Fragmented DRAM allocation</p></div>
  </div>
• .anatomy-map      — central visual model with structured spatial callouts
  <div class="anatomy-map">
    <div class="anatomy-stage"><div class="card-title">Core Subsystem Architecture</div><!-- diagram nodes --></div>
    <div class="callout-list"><div class="callout-item"><b>01 Pointer:</b> Specific invariant detail</div></div>
  </div>
• .disk-stripe      — memory block layout stripe / protocol packet byte header
  <div class="disk-stripe">
    <div class="stripe-block stripe-cyan"><div class="block-tag">OFFSET 0x00</div><div class="block-title">Header</div><div class="block-size">16 Bytes</div></div>
    <div class="stripe-block stripe-emerald"><div class="block-tag">OFFSET 0x10</div><div class="block-title">Payload</div><div class="block-size">64 Bytes</div></div>
  </div>
• .pointer-topology — B-tree or node pointer hierarchy
  <div class="pointer-topology">
    <div class="pointer-row"><div class="pointer-node"><div class="pointer-node-title">Root Node [Key: 50]</div></div></div>
  </div>
• .timeline-journey — horizontal stepped milestone timeline with numbered nodes (.timeline-step, .timeline-node)
  <div class="timeline-journey">
    <div class="timeline-step"><div class="timeline-node">01</div><div class="card-title">Phase Name</div><p class="card-desc">Mechanism description</p></div>
    <div class="timeline-step"><div class="timeline-node">02</div><div class="card-title">Phase Name</div><p class="card-desc">Mechanism description</p></div>
  </div>
• .quote-spotlight   — thesis spotlight layout with vertical cyan accent border
  <div class="quote-spotlight"><p class="quote-text">Domain thesis statement</p><span class="quote-author">ARCHITECTURAL SPECIFICATION</span></div>
• .grid-split       — asymmetric 60/40 or 55/45; use for problem/solution or narrative/detail split
• .grid-2 / .grid-3 — equal column grids for parallel comparisons or triads

━━━ CONTENT CARDS & GLOW SPOTLIGHTS ━━━
Glow card anatomy:
  <div class="glow-card glow-cyan"> ← accent signals role (.glow-cyan, .glow-emerald, .glow-rose, .glow-amber, .glow-indigo)
    <div class="glass-card-header">
      <span class="card-title">Specific Technical Name</span>
      <span class="badge badge-cyan">TYPE TAG</span>  ← mono-font badge with specific type ("O(log n)", "RFC 793", "TLS 1.3", "ACID")
    </div>
    <p class="card-desc">Authoritative 1-2 sentence explanation with domain-specific terminology.</p>
    <ul class="points-list">
      <li>Concrete detail with real value or mechanism</li>
      <li>Second detail that is complementary, not redundant</li>
    </ul>
  </div>

━━━ TERMINAL & CODE WINDOWS ━━━
<div class="terminal-card">
  <div class="terminal-header">
    <div class="terminal-dots"><span class="terminal-dot dot-red"></span><span class="terminal-dot dot-yellow"></span><span class="terminal-dot dot-green"></span></div>
    <span class="terminal-title">bash — specific context label</span>
  </div>
  <pre class="terminal-body"><code><span class="terminal-cmd">$ real-command --with real-flags value</span>
<span class="terminal-out">exact output line from document</span>
<span class="terminal-cmd">$ second-command arg1 arg2</span>
<span class="terminal-highlight">success: concrete result</span></code></pre>
</div>

━━━ ARCHITECTURE STACKS (requires ≥ 3 tiers, each with real technical names) ━━━
<div class="arch-stack">
  <div class="stack-tier">
    <div class="tier-left">
      <span class="tier-badge badge-rose">RING 0</span>
      <div><div class="tier-name">Kernel Mode</div><div class="tier-sub">Privileged instruction set, direct hardware access</div></div>
    </div>
    <div class="tier-chips"><span class="tier-chip">irq_handler</span><span class="tier-chip">page_fault</span><span class="tier-chip">sys_write</span></div>
  </div>
  ... (3–5 tiers with real names from the topic, not placeholders)
</div>

━━━ ANIMATED MOTION PIPELINES (requires ≥ 3 stages, each with a distinct SVG icon) ━━━
<div class="motion-pipeline">
  <div class="pipeline-stage stage-emerald">
    <span class="stage-num">01</span>
    <div class="stage-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>
    <div class="stage-title">Exact Phase Name</div>
    <div class="stage-desc">Specific mechanism in 1 line</div>
  </div>
  <div class="pipeline-connector"><div class="packet-pulse packet-emerald"></div></div>
  ... (at least 3 stages, different colors: emerald → cyan → indigo → amber)
</div>

━━━ DATA VISUALIZATIONS & TELEMETRY ━━━
• .stat-grid — 4-cell KPI dashboard; cells need REAL values (NOT "N/A" or "TBD")
  <div class="stat-grid">
    <div class="stat-card card-cyan"><span class="stat-lbl">Throughput</span><span class="stat-val val-cyan">500 tx/s</span><span class="stat-delta stat-delta-up">+25x</span></div>
  </div>
• .matrix-table inside .glass-card — comparison tables; minimum 4 rows, minimum 3 columns
• .chart-card > .chart-bars-group > .chart-bar-fill — animated bar chart using height % from real data

━━━ INTERACTIVE GRAPH & TOPOLOGY STEPPER PRIMITIVE ━━━
• .graph-stepper-container — Declarative interactive 2D graph visualizer & step-by-step algorithm engine:
  <div class="graph-stepper-container" 
       data-graph='{"nodes":[{"id":"node1","label":"Node 1 Label"},{"id":"node2","label":"Node 2 Label"}],"edges":[["node1","node2"]]}' 
       data-algorithm="<algorithm_name_from_document>" 
       data-start-node="<start_node_id>" 
       data-goal-node="<optional_target_id>">
  </div>
  * ZERO JAVASCRIPT REQUIRED: The Keynox runtime automatically renders the interactive 2D SVG graph, level step controls (Prev / Next / Auto Play), frontier queues, and populates the step-by-step trace table dynamically from the document's graph!

━━━ QUANTITATIVE CALCULATION & PARAMETER WORKBENCH ━━━
• .calc-workbench — Interactive quantitative parameter & dynamic relationship calculator:
  <div class="calc-workbench" data-rate="<rate_value>" data-unit="<unit_name>">
    <div class="sim-row">
      <label><Param 1 Name>: <b class="readout-param1"><default_val></b></label>
      <input type="range" class="sim-slider slider-param1" min="<min>" max="<max>" value="<default>">
    </div>
    <div class="calc-grid">
      <div class="calc-cell"><span class="calc-cell-label"><METRIC 1 NAME></span><span class="calc-val-primary"><val></span></div>
      <div class="calc-cell"><span class="calc-cell-label"><METRIC 2 NAME></span><span class="calc-val-secondary"><val></span></div>
    </div>
  </div>
  * ZERO JAVASCRIPT REQUIRED: The Keynox runtime automatically recalculates dependent variables live as the user moves the sliders based on the governing formulas in the document!
`;

/**
 * Builds the creative free-composition prompt for a single slide.
 * The AI receives the full design system vocabulary and composes the layout itself
 * from scratch — no fixed template skeleton is imposed.
 */
export function buildSingleSlidePrompt(
  cleanTopic: string,
  slideIndex: number,
  totalSlides: number,
  slideDirective: string,
  analysisSummary: string,
  precedingArchetypes: string[] = [],
  domain?: DocumentDomain
): string {
  const isActive = slideIndex === 0;
  const cleanDirective = sanitizeDocumentContent(slideDirective);
  const cleanAnalysis = sanitizeDocumentContent(analysisSummary);
  const archetypeId = extractArchetypeFromSection(cleanDirective);
  const archetypeContract = getArchetypeDomContract(archetypeId);

  const slideNum = slideIndex + 1;

  // Build strong visual diversity constraint based on what was already used
  let diversityGuard = "";
  if (precedingArchetypes.length > 0) {
    const recentLayouts = precedingArchetypes.slice(-4).join(", ");
    diversityGuard = `
━━━ VISUAL DIVERSITY GUARD (CRITICAL RULE) ━━━
The preceding slides in this deck used these archetypes: [${recentLayouts}].
You MUST NOT repeat the same visual layout structure as the immediately preceding slide.
If recent slides used 3-card grids, you MUST use a pipeline, terminal, bento grid, timeline, or hero statement instead! Rotate layouts aggressively so every slide looks distinct.`;
  }

  const heroDirective = slideIndex === 0
    ? `
HERO SLIDE STANDARDS (Slide 1 of ${totalSlides} — sets the entire visual tone):
• Choose between a bold .hero-cinematic centered statement layout OR a .grid-split layout with strong visual contrast.
• The title must be specific to the domain (e.g. "TCP/IP Congestion Control" not just "Introduction").
• At least one element must convey a concrete technical metric or mechanism.
• Include a badge in the header showing the domain category (e.g. "NETWORK PROTOCOL", "QUANTUM ALGORITHM", "OS KERNEL").`
    : `
SLIDE ${slideNum} OF ${totalSlides} — ARCHETYPE: "${archetypeId}"
Position context: ${slideNum <= Math.ceil(totalSlides * 0.33) ? "EARLY — Establish domain foundations with crisp definitions and the key problem statement." : slideNum <= Math.ceil(totalSlides * 0.66) ? "MIDDLE — Deep technical mechanisms. This is the highest-density region. Expert detail expected." : "LATE — Synthesis, implications, tradeoffs, or forward-looking conclusions."}`;

  return `You are a world-class Keynote Presentation Designer and Senior Visual Systems Architect.
Your presentations are celebrated for:
  (a) Visual density, structural variety, and clarity that reward technical readers
  (b) Layouts that make the information structure immediately obvious without repeating templates
  (c) Zero corporate filler or AI buzzwords — every element conveys concrete domain substance

Your task: Synthesize EXACTLY ONE slide:
  <section class="slide${isActive ? " active" : ""}" id="slide${slideIndex}"> ... </section>

TOPIC: "${cleanTopic}"
${heroDirective}
${diversityGuard}

━━━ SLIDE STORYBOARD DIRECTIVE (Stage 2 authored) ━━━
"""
${cleanDirective}
"""

━━━ DOMAIN KNOWLEDGE BASE (Stage 1 extracted — cite from this, never invent) ━━━
"""
${cleanAnalysis.slice(0, 28000)}
"""

━━━ SLIDE HEADLINE STRUCTURE ━━━
For standard detail slides, begin the slide body with:
<div class="slide-title-group">
  <div class="slide-category">DOMAIN AREA</div>  ← 1–3 words, ALL CAPS (e.g. "MEMORY HIERARCHY", "CONSENSUS PROTOCOL")
  <h2 class="slide-title">Specific Technical Headline That Names The Mechanism</h2>
  <p class="slide-subtitle">One authoritative factual statement</p>
</div>
━━━ WHITEBOARD METAPHOR & SPATIAL SCHEMATIC DIRECTIVE ━━━
Read the Stage 2 directive above and implement the conceived physical/digital mental model:
• [WHITEBOARD_METAPHOR]: Understand the intuitive 2D mental model conceived by Stage 2.
• [SPATIAL_STAGE]: Structure the slide using the assigned spatial layout (.dual-plane, .mechanism-prism, .anatomy-map, .motion-pipeline, .arch-stack, .pointer-topology, .disk-stripe, .diff-container, or .bento-grid).
• [FOCAL_GRAPHIC]: Render the concrete nodes, components, isolation barriers, memory blocks, and flags directly from the document. The focal graphic MUST occupy ≥60% of the slide viewport.
• [ANNOTATIONS]: Integrate the 2-3 technical callouts as precision badges or pointer notes on the graphic.
• STRICT LAW: NEVER collapse the focal schematic into 3 generic text cards. The spatial diagram is the primary content!

${DESIGN_SYSTEM_VOCABULARY}

${archetypeContract}

━━━ IRON LAWS OF KEYNOX SLIDE QUALITY ━━━
1. FOCAL SCHEMATIC FIRST: Dedicate ≥60% of the viewport to the spatial diagram, topology, or simulator. Never reduce a slide to text boxes.
2. DOMAIN SPECIFICITY: Every data point, command, metric, equation, and node label must come from the provided domain knowledge. Zero invention.
3. NO TEMPLATE MONOTONY: Never output 3 identical glass cards unless explicitly requested by a grid archetype. Vary card spans, badges, and layout containers!
4. NO PROMPT LEAKAGE: Never output "TARGET SLIDE COUNT", "TEMPLATE_", "PREFERRED THEME", "[ARCHETYPE:", "[WHITEBOARD_METAPHOR:", or prompt metadata inside the HTML.
5. SVG OVER EMOJI: Use <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"> for all visual icons. No emoji.
6. COMPLETE STRUCTURES: .arch-stack needs ≥ 3 tiers. .motion-pipeline needs ≥ 3 stages. .timeline-journey needs ≥ 3 milestone nodes. Tables need ≥ 4 rows.
7. REAL CLI: Terminal cards use actual extracted commands with real flags and realistic output. Never use <tool_name> --flag <value>.
8. MATH GATE: KaTeX <div class="equation-display">$$ ... $$</div> for genuine symbolic math (calculus, probability, complexity, physics, algebra). Always enclose formulas in $$ ... $$ delimiters. Never output empty math containers.
9. MATHEMATICAL PROBLEM SOLVING & DERIVATIONS:
   If solving a math problem or presenting a derivation:
   - Present every step in its own .math-step-card with a step badge (<span class="step-badge">STEP 01: [LAW/ACTION]</span>), KaTeX equation (<div class="equation-display">$$ ... $$</div>), and step explanation (<p class="step-explanation">...</p>).
   - ZERO SKIPPED STEPS: Walk through all intermediate algebraic manipulations, factoring, substitution, and simplification. Never jump straight from problem to solution.
   - ZERO BLANK SLIDES: Every slide must be rich with headings, equation displays, cards, and descriptive notes.
10. CSS PURITY: Use design system classes only. No inline style="color:#hex" overrides.
11. OUTPUT GATE: Output ONLY the <section> block. No markdown, no explanation, no code fences. Start with <section.
12. CLOSE IT: The section must end with </section>. No dangling tags.

${domain === "physics_math" ? stage3PhysicsPrompt() : `INTERACTIVE SIMULATOR RULES:
- If your archetype is "interactive-simulator", you MUST derive all slider parameters, formulas, and output values 100% from the slide's topic content.
- The recalculate() function MUST read live slider values and compute results — never hardcode outputs.
- Label every slider with the real variable name, unit, and range from the domain knowledge base.
- Display the governing formula with the active variable highlighted using inline <span> styling.
- FORBIDDEN: generic "value = slider * factor" computations. Always use the actual relationship from the domain.`}`;
}

/**
 * Validates that a slide is non-empty, contains complete HTML structure, has substantive text,
 * and does NOT contain hollow/empty containers or truncation.
 */
