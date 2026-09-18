import OpenAI from "openai";
import { config } from "../config";

const MODEL_SUPER = "nvidia/nemotron-3-super-120b-a12b";
const MODEL_LIGHTNING = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";

export interface Stage3Callbacks {
  onReasoning: (delta: string) => void;
  onChunk: (delta: string) => void;
  onModelSwitch?: (model: string) => void;
}

/**
 * Parses Model 2's storyboard output into distinct slide specifications.
 */
export function parseStoryboardIntoSlides(storyboardText: string, targetCount: number): string[] {
  const slideDelimiterRegex = /(?=(?:^|\n)(?:#{1,3}\s*)?(?:SLIDE|Slide)\s+\d+)/i;
  const rawSections = storyboardText
    .split(slideDelimiterRegex)
    .map((s) => s.trim())
    .filter((s) => s.length > 30);

  if (rawSections.length >= targetCount) {
    return rawSections.slice(0, targetCount);
  }

  const diverseThemes = [
    { category: "SYSTEM FOUNDATIONS", title: "Architectural Foundations & Core Primitives", desc: "Core mechanisms, fundamental isolation boundaries, and primary structural models." },
    { category: "EXECUTION PIPELINE", title: "Sequential Execution & Component Flow", desc: "Deterministic stage transitions, protocol pipelines, and state transformation." },
    { category: "DYNAMIC SIMULATION", title: "Runtime Invariant Simulator & Telemetry Evaluation", desc: "Interactive sensitivity analysis, parameter modulation, and dynamic system state feedback." },
    { category: "SYSTEM TOPOLOGY", title: "Decoupled Execution Flow & Node Topology", desc: "Connected component state progression, interface bindings, and failure isolation boundaries." },
    { category: "SYSTEM BENCHMARKS", title: "Multi-Dimensional Trade-off Matrix & SLA Boundaries", desc: "Comparative evaluation of latency, reliability, throughput bounds, and operational invariants." },
    { category: "OPERATIONAL INTEGRATION", title: "Autonomous Failover & Production Telemetry", desc: "Closed-loop feedback control, telemetry assurance, and mission-critical SLA monitoring." },
  ];

  if (rawSections.length > 0 && rawSections.length < targetCount) {
    const result = [...rawSections];
    while (result.length < targetCount) {
      const idx = result.length + 1;
      const theme = diverseThemes[(idx - 1) % diverseThemes.length];
      result.push(`SLIDE ${idx}: ${theme.title}\n- Category: ${theme.category}\n- Focus: ${theme.desc}`);
    }
    return result;
  }

  // Fallback: If no explicit "SLIDE N" tags, split by double newlines into balanced chunks
  const paragraphs = storyboardText.split(/\n\s*\n/).filter((p) => p.trim().length > 40);
  if (paragraphs.length >= targetCount) {
    const chunkSize = Math.ceil(paragraphs.length / targetCount);
    const chunks: string[] = [];
    for (let i = 0; i < targetCount; i++) {
      chunks.push(paragraphs.slice(i * chunkSize, (i + 1) * chunkSize).join("\n\n"));
    }
    return chunks;
  }

  const chunks: string[] = [];
  for (let i = 0; i < targetCount; i++) {
    chunks.push(`SLIDE ${i + 1}: Core System Execution & Invariants\n${storyboardText}`);
  }
  return chunks;
}

/**
 * Builds the prompt for a single slide section in the slide-by-slide pipeline.
 */
export function buildSingleSlidePrompt(
  cleanTopic: string,
  slideIndex: number,
  totalSlides: number,
  slideDirective: string,
  analysisSummary: string
): string {
  const isActive = slideIndex === 0;

  const archetypes = [
    {
      archetypeId: "HERO_SPLIT_OR_TERMINAL",
      title: "Architectural Split Hero or Terminal Execution View",
      mandate: `You MUST use a .grid-split layout.
IF the document covers CLI commands, Linux/system calls, Dockerfiles, or code, use a .terminal-card on the left and a .glass-card.card-emerald on the right:
<div class="grid-split">
  <div class="terminal-card">
    <div class="terminal-header">
      <div class="terminal-dots"><span class="terminal-dot dot-red"></span><span class="terminal-dot dot-yellow"></span><span class="terminal-dot dot-green"></span></div>
      <span class="terminal-title">[Exact Subsystem / Shell Context from Document]</span>
    </div>
    <pre class="terminal-body"><code><span class="terminal-cmd">$ [Exact command, system call, or directive from Document]</span>
<span class="terminal-out">[Exact output, flag, or PID from Document]</span></code></pre>
  </div>
  <div class="glass-card card-emerald">
    <div class="glass-card-header">
      <span class="card-title">[Primary Mechanism / Subsystem Title]</span>
      <span class="badge badge-emerald">[RELEVANT BADGE]</span>
    </div>
    <ul class="points-list">
      <li><strong>Core Mechanism:</strong> [Concrete fact extracted directly from Document below]</li>
      <li><strong>Concrete Metric / Parameter:</strong> [Exact number, PID, memory size, or flag from Document below]</li>
      <li><strong>Operational Invariant:</strong> [Exact rule, constraint, or equation from Document below]</li>
    </ul>
  </div>
</div>
IF the topic is physical, geometric, or quantum, you may alternatively use .three-container with data-model="neural-constellation-3d" or "quantum-bloch-sphere".`,
    },
    {
      archetypeId: "MOTION_PIPELINE",
      title: "Sequential Execution & Process Pipeline (.motion-pipeline)",
      mandate: `You MUST use a real-world .motion-pipeline with 4 sequential stages (Emerald -> Cyan -> Indigo -> Amber) and animated packet pulses:
<div class="pipeline-controls">
  <span class="pipeline-tag">⚡ SEQUENTIAL PROCESS FLOW</span>
  <button class="sim-play-btn" onclick="simulatePipelineFlow(this)">▶ Simulate Flow</button>
</div>
<div class="motion-pipeline">
  <div class="pipeline-stage stage-emerald">
    <span class="stage-num">STAGE 01</span>
    <div class="stage-icon">[Pick topic-relevant emoji: e.g. 🐧, 📦, 🔒, ⚡, 🧩, ⚙️, 🌐]</div>
    <div class="stage-title">[Exact Step 1 Name from Document]</div>
    <div class="stage-desc">[Specific action of Step 1 derived 100% from Document context]</div>
  </div>
  <div class="pipeline-connector"><div class="packet-pulse packet-emerald"></div></div>
  <div class="pipeline-stage stage-cyan">
    <span class="stage-num">STAGE 02</span>
    <div class="stage-icon">[Topic emoji]</div>
    <div class="stage-title">[Exact Step 2 Name from Document]</div>
    <div class="stage-desc">[Specific action of Step 2 derived 100% from Document context]</div>
  </div>
  <div class="pipeline-connector"><div class="packet-pulse packet-cyan"></div></div>
  <div class="pipeline-stage stage-indigo">
    <span class="stage-num">STAGE 03</span>
    <div class="stage-icon">[Topic emoji]</div>
    <div class="stage-title">[Exact Step 3 Name from Document]</div>
    <div class="stage-desc">[Specific action of Step 3 derived 100% from Document context]</div>
  </div>
  <div class="pipeline-connector"><div class="packet-pulse packet-amber"></div></div>
  <div class="pipeline-stage stage-amber">
    <span class="stage-num">STAGE 04</span>
    <div class="stage-icon">[Topic emoji]</div>
    <div class="stage-title">[Exact Step 4 Name from Document]</div>
    <div class="stage-desc">[Specific action of Step 4 derived 100% from Document context]</div>
  </div>
</div>
(CRITICAL: Never output "Physical Sensing / Ingestion" or "Conduit Transport" unless the document explicitly discusses physical sensors! Extract real steps from document!)`,
    },
    {
      archetypeId: "INTERACTIVE_SIMULATOR",
      title: "Dynamic Interactive Parameter Simulator (.sim-container)",
      mandate: `You MUST use a .grid-split featuring an interactive .sim-container with a live slider that calculates a concrete formula or metric from the document dynamically, paired with an evaluation .glass-card:
<div class="grid-split">
  <div class="sim-container card-cyan">
    <div class="glass-card-header">
      <span class="card-title">[Name of Parameter Simulator from Document]</span>
      <span class="badge badge-cyan">LIVE RUNTIME</span>
    </div>
    <div class="sim-controls">
      <div class="sim-row">
        <span style="color: #cbd5e1; font-weight: 600;">[Topic Metric Name, e.g. Allocated Quota, Subnet Mask, Queue Depth]:</span>
        <input type="range" class="sim-slider slider-cyan" min="1" max="100" value="50" oninput="updateSim${slideIndex}(this.value)" />
        <span id="display-val-${slideIndex}" style="font-family: var(--font-mono); font-weight: bold; color: var(--accent-cyan);">50</span>
      </div>
    </div>
    <div class="sim-gauge gauge-cyan">
      <div class="sim-value" id="result-val-${slideIndex}">Verified State</div>
      <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">DYNAMIC SYSTEM TELEMETRY</div>
    </div>
  </div>
  <div class="glass-card card-indigo">
    <div class="glass-card-header">
      <span class="card-title">[Operational Invariants &amp; Thresholds]</span>
      <span class="badge badge-indigo">VERIFIED</span>
    </div>
    <ul class="points-list">
      <li><strong>Operating Range:</strong> [Concrete boundary condition from Document below]</li>
      <li><strong>Governing Model:</strong> [Extract real formula, system call, or rule from Document - NEVER invent queueing formulas!]</li>
      <li><strong>State Invariance:</strong> [Specific guarantee from Document below]</li>
    </ul>
  </div>
</div>
<script>
  function updateSim${slideIndex}(val) {
    document.getElementById('display-val-${slideIndex}').textContent = val;
    document.getElementById('result-val-${slideIndex}').textContent = val > 75 ? 'Boundary Exceeded (' + val + ')' : 'Verified State (' + val + ')';
  }
</script>`,
    },
    {
      archetypeId: "FLOW_TOPOLOGY",
      title: "Connected Architecture Flow Topology (.flow-diagram)",
      mandate: `You MUST use a connected flow diagram (.flow-diagram) with active step nodes, animated conduits, and operational specifications:
<div class="flow-diagram">
  <div class="flow-step card-emerald">
    <div class="flow-node">[Emoji]</div>
    <div style="font-size: 13px; font-weight: 700; color: #fff;">[Entity 1 from Document]</div>
    <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">[Entity 1 spec from text]</div>
  </div>
  <div class="flow-arrow">➔</div>
  <div class="flow-step card-cyan">
    <div class="flow-node">[Emoji]</div>
    <div style="font-size: 13px; font-weight: 700; color: #fff;">[Entity 2 from Document]</div>
    <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">[Entity 2 spec from text]</div>
  </div>
  <div class="flow-arrow">➔</div>
  <div class="flow-step card-indigo">
    <div class="flow-node">[Emoji]</div>
    <div style="font-size: 13px; font-weight: 700; color: #fff;">[Entity 3 from Document]</div>
    <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">[Entity 3 spec from text]</div>
  </div>
  <div class="flow-arrow">➔</div>
  <div class="flow-step card-amber">
    <div class="flow-node">[Emoji]</div>
    <div style="font-size: 13px; font-weight: 700; color: #fff;">[Entity 4 from Document]</div>
    <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">[Entity 4 spec from text]</div>
  </div>
</div>`,
    },
    {
      archetypeId: "COMPARISON_MATRIX",
      title: "Multi-Dimensional Comparison Matrix (.matrix-table)",
      mandate: `You MUST use a multi-color comparison matrix (.matrix-table) inside a .glass-card with status badges:
<div class="glass-card">
  <table class="matrix-table">
    <thead>
      <tr><th>[DIMENSION FROM DOCUMENT]</th><th>STATUS</th><th>CONCRETE METRIC / FLAG</th><th>SYSTEM IMPACT</th></tr>
    </thead>
    <tbody>
      <tr><td>[Feature 1 from Document]</td><td><span class="badge badge-emerald">OPTIMAL</span></td><td>[Actual metric/flag/size from text]</td><td>[Operational impact from text]</td></tr>
      <tr><td>[Feature 2 from Document]</td><td><span class="badge badge-cyan">CONSTRAINED</span></td><td>[Actual metric/flag/size from text]</td><td>[Operational impact from text]</td></tr>
      <tr><td>[Feature 3 from Document]</td><td><span class="badge badge-amber">THRESHOLD</span></td><td>[Actual metric/flag/size from text]</td><td>[Operational impact from text]</td></tr>
      <tr><td>[Feature 4 from Document]</td><td><span class="badge badge-rose">LATENCY BOUND</span></td><td>[Actual metric/flag/size from text]</td><td>[Operational impact from text]</td></tr>
    </tbody>
  </table>
</div>`,
    },
    {
      archetypeId: "BAR_CHART_KPI",
      title: "Dynamic Visual Bar Chart (.chart-card)",
      mandate: `You MUST use an animated visual bar chart (.chart-card) showing quantitative benchmarks and throughput scaling extracted from the document:
<div class="chart-card">
  <div class="chart-header">
    <span style="font-family: var(--font-display); font-size: 15px; font-weight: 700; color: #fff;">[Quantitative Benchmark from Document]</span>
    <span class="badge badge-emerald">EXTRACTED DATA</span>
  </div>
  <div class="chart-bars-group">
    <div class="chart-bar-col"><div class="chart-val-label">[Value 1 from text]</div><div class="chart-bar-fill" style="height: 40%;"></div><div class="chart-axis-label">[Entity 1 from text]</div></div>
    <div class="chart-bar-col"><div class="chart-val-label">[Value 2 from text]</div><div class="chart-bar-fill accent-indigo" style="height: 70%;"></div><div class="chart-axis-label">[Entity 2 from text]</div></div>
    <div class="chart-bar-col"><div class="chart-val-label">[Value 3 from text]</div><div class="chart-bar-fill accent-emerald" style="height: 95%;"></div><div class="chart-axis-label">[Entity 3 from text]</div></div>
  </div>
</div>`,
    },
  ];

  const assigned = archetypes[slideIndex % archetypes.length];

  return `You are an elite Keynote Presentation Visual Designer & Creative Frontend Technologist.
Synthesize EXACTLY ONE slide section (<section class="slide${isActive ? " active" : ""}" id="slide${slideIndex}"> ... </section>) for:
Topic: "${cleanTopic}"
Slide ${slideIndex + 1} of ${totalSlides}

SLIDE STORYBOARD & VISUAL/PHOTO DIRECTIVE FROM MODEL 2:
"""
${slideDirective}
"""

DOMAIN CONTEXT FROM MODEL 1:
"""
${analysisSummary.slice(0, 1500)}
"""

MANDATORY HEADLINE REQUIREMENT:
You MUST start the slide content immediately inside <section ...> with:
<div class="slide-title-group">
  <div class="slide-category">[UPPERCASE DOMAIN CATEGORY]</div>
  <h2 class="slide-title">[Specific Technical Headline for This Slide]</h2>
  <p class="slide-subtitle">[Concrete Explanation of Invariants & Mechanics]</p>
</div>
NEVER output raw <h2>Chapter...</h2> or "Slide X of Y" in the title text!

ASSIGNED VISUAL ARCHETYPE FOR SLIDE ${slideIndex + 1} (MANDATORY):
>>> ${assigned.title} <<<
${assigned.mandate}

KaTeX mathematical formulas are supported: use \\[ formula \\] for block math, and \\( formula \\) for inline math.

ABSOLUTE 100% TOPIC FIDELITY MANDATE (ZERO TOLERANCE FOR HARDCODED PLACEHOLDERS):
1. ZERO HARDCODED / PLACEHOLDER CONTENT: NEVER output placeholder phrases like "Physical Sensing / Ingestion", "Conduit Transport", "Response latency model T = 1/(mu - lambda)", or "State_{t+1} = T(State_t, Input)" unless the document is literally about them!
2. All titles, commands, metrics, formulas, and stage names MUST BE 100% EXTRACTED from the provided document context below!
3. If the document is about Linux containers, your stages, cards, and terminals MUST discuss PID namespaces, UTS namespaces, veth pairs, sethostbyname(), Open vSwitch, Dockerfiles, and dhcpd!
4. STRICT ANTI-ARTICLE RULES: Output ONLY the <section ...> ... </section> tag. Always properly close the </section> tag at the end. Use multi-colors (.card-emerald, .card-cyan, .card-indigo, .card-amber, .card-rose).
5. DO NOT use .motion-pipeline unless this slide is explicitly assigned ARCHETYPE 2!
6. Keep internal reasoning under 80 tokens. Output valid HTML directly.`;
}

/**
 * Validates that a slide is non-empty, contains complete HTML structure, and is NOT truncated.
 */
function isValidSlideHtml(html: string): boolean {
  const trimmed = (html || "").trim();
  if (trimmed.length < 250) return false;
  // If it ends abruptly in an unclosed tag like `<span class="` or `<div`
  if (/<[a-z0-9_-]+(?:\s+[^>]*)?$/i.test(trimmed)) return false;
  // If it does not contain a closing </section> tag, it was truncated!
  if (!trimmed.includes("</section>")) return false;
  // Check that open divs are not left completely unclosed (indicates cutoff)
  const openDivs = (trimmed.match(/<div\b/gi) || []).length;
  const closeDivs = (trimmed.match(/<\/div>/gi) || []).length;
  if (openDivs > 0 && closeDivs === 0) return false;

  return (
    trimmed.includes("<section") ||
    trimmed.includes("class=\"slide") ||
    trimmed.includes("slide-title") ||
    trimmed.includes("motion-pipeline") ||
    trimmed.includes("sim-container") ||
    trimmed.includes("glass-card") ||
    trimmed.includes("matrix-table") ||
    trimmed.includes("flow-diagram")
  );
}

/**
 * Resilient synthesis fallback guaranteeing every slide has real-world motion,
 * interactive components, and multi-color themes if an AI call times out.
 */
export function synthesizeFallbackSlide(
  cleanTopic: string,
  slideIndex: number,
  totalSlides: number,
  slideDirective: string
): string {
  const isActive = slideIndex === 0;
  const slideType = slideIndex % 4;

  const titleMatch = slideDirective.match(/(?:SLIDE\s+\d+:?|Slide\s+\d+:?|TITLE:?)\s*([^\n]+)/i);
  const title = titleMatch ? titleMatch[1].replace(/^[#*\s-]+/, "").trim() : `${cleanTopic}: Component Architecture`;

  const categoryMatch = slideDirective.match(/CATEGORY:\s*([^\n]+)/i);
  const category = categoryMatch ? categoryMatch[1].trim() : "SYSTEM ARCHITECTURE";

  // Extract relevant lines from directive as content points
  const rawLines = slideDirective
    .split("\n")
    .map((l) => l.replace(/^[#*-\s]+/, "").trim())
    .filter((l) => l.length > 15 && !l.toUpperCase().startsWith("SLIDE") && !l.toUpperCase().startsWith("CATEGORY"));

  const p1 = rawLines[0] || `Primary operational mechanism of ${cleanTopic}`;
  const p2 = rawLines[1] || `Deterministic state validation and telemetry monitoring`;
  const p3 = rawLines[2] || `Production scaling threshold and boundary protection`;
  const p4 = rawLines[3] || `Autonomous failover barrier and invariant preservation`;

  function extractShortPhrase(text: string, fallback: string): string {
    if (!text) return fallback;
    const parts = text.split(/[:\-\—]/);
    if (parts.length > 1 && parts[0].trim().length > 3 && parts[0].trim().length < 35) {
      return parts[0].trim();
    }
    const words = text.replace(/^[#*\-0-9.\s]+/, "").split(/\s+/).slice(0, 4).join(" ");
    return words.length > 3 ? words : fallback;
  }

  if (slideType === 0) {
    const s1Title = extractShortPhrase(p1, "Initialization");
    const s2Title = extractShortPhrase(p2, "Execution Phase");
    const s3Title = extractShortPhrase(p3, "State Transition");
    const s4Title = extractShortPhrase(p4, "Output & Resolution");

    return `<section class="slide${isActive ? " active" : ""}" id="slide${slideIndex}">
  <div class="slide-title-group">
    <div class="slide-category">${category}</div>
    <h2 class="slide-title">${title}</h2>
    <p class="slide-subtitle">Deterministic sequential execution progression and lifecycle stages.</p>
  </div>
  <div class="pipeline-controls">
    <span class="pipeline-tag">⚡ SYSTEM EXECUTION PIPELINE</span>
    <button class="sim-play-btn" onclick="simulatePipelineFlow(this)">▶ Simulate Flow</button>
  </div>
  <div class="motion-pipeline">
    <div class="pipeline-stage stage-emerald">
      <span class="stage-num">STAGE 01</span>
      <div class="stage-icon">⚙️</div>
      <div class="stage-title">${s1Title}</div>
      <div class="stage-desc">${p1}</div>
    </div>
    <div class="pipeline-connector"><div class="packet-pulse packet-emerald"></div></div>
    <div class="pipeline-stage stage-cyan">
      <span class="stage-num">STAGE 02</span>
      <div class="stage-icon">⚡</div>
      <div class="stage-title">${s2Title}</div>
      <div class="stage-desc">${p2}</div>
    </div>
    <div class="pipeline-connector"><div class="packet-pulse packet-cyan"></div></div>
    <div class="pipeline-stage stage-indigo">
      <span class="stage-num">STAGE 03</span>
      <div class="stage-icon">🔄</div>
      <div class="stage-title">${s3Title}</div>
      <div class="stage-desc">${p3}</div>
    </div>
    <div class="pipeline-connector"><div class="packet-pulse packet-amber"></div></div>
    <div class="pipeline-stage stage-amber">
      <span class="stage-num">STAGE 04</span>
      <div class="stage-icon">✅</div>
      <div class="stage-title">${s4Title}</div>
      <div class="stage-desc">${p4}</div>
    </div>
  </div>
</section>`;
  } else if (slideType === 1) {
    const isCodeOrCli = /sudo|docker|linux|bash|command|netns|namespace|config|shell|\$ |API|endpoint|curl|ps |mount/i.test(slideDirective + " " + p1 + " " + p2);

    if (isCodeOrCli) {
      return `<section class="slide${isActive ? " active" : ""}" id="slide${slideIndex}">
  <div class="slide-title-group">
    <div class="slide-category">${category}</div>
    <h2 class="slide-title">${title}</h2>
    <p class="slide-subtitle">Command-line execution, kernel parameters, and runtime environment.</p>
  </div>
  <div class="grid-split">
    <div class="terminal-card">
      <div class="terminal-header">
        <div class="terminal-dots"><span class="t-dot dot-red"></span><span class="t-dot dot-yellow"></span><span class="t-dot dot-green"></span></div>
        <span class="terminal-title">bash — runtime environment</span>
      </div>
      <pre class="terminal-body"><span class="terminal-prompt">$</span> <span class="terminal-cmd">${p1.replace(/["`]/g, '')}</span>
<span class="terminal-out"># Invariant verification & state inspection:</span>
<span class="terminal-prompt">$</span> <span class="terminal-cmd">${p2.replace(/["`]/g, '')}</span></pre>
    </div>
    <div class="glass-card card-indigo">
      <div class="glass-card-header">
        <span class="card-title">Operational Invariants</span>
        <span class="badge badge-indigo">VERIFIED</span>
      </div>
      <ul class="points-list">
        <li>${p1}</li>
        <li>${p2}</li>
        <li>${p3}</li>
      </ul>
    </div>
  </div>
</section>`;
    }

    return `<section class="slide${isActive ? " active" : ""}" id="slide${slideIndex}">
  <div class="slide-title-group">
    <div class="slide-category">${category}</div>
    <h2 class="slide-title">${title}</h2>
    <p class="slide-subtitle">Interactive 3D spatial layout and validated state invariants.</p>
  </div>
  <div class="grid-split">
    <div class="three-container" data-model="topology-cluster-3d">
      <div class="three-overlay">
        <span class="three-badge">⚡ 3D SYSTEM TOPOLOGY</span>
        <span style="font-family: var(--font-display); font-size: 14px; font-weight: bold; color: #fff;">${title}</span>
      </div>
      <div class="three-hint">🖱️ Click &amp; Drag to Rotate 3D Model</div>
    </div>
    <div class="glass-card card-indigo">
      <div class="glass-card-header">
        <span class="card-title">Operational Invariants</span>
        <span class="badge badge-indigo">VERIFIED</span>
      </div>
      <ul class="points-list">
        <li>${p1}</li>
        <li>${p2}</li>
        <li>${p3}</li>
      </ul>
    </div>
  </div>
</section>`;
  } else if (slideType === 2) {
    return `<section class="slide${isActive ? " active" : ""}" id="slide${slideIndex}">
  <div class="slide-title-group">
    <div class="slide-category">${category}</div>
    <h2 class="slide-title">${title}</h2>
    <p class="slide-subtitle">Interactive parameter simulation and live dynamic feedback.</p>
  </div>
  <div class="grid-split">
    <div class="sim-container card-cyan">
      <div class="glass-card-header">
        <span class="card-title">${title} Dynamics</span>
        <span class="badge badge-cyan">RUNTIME SIMULATOR</span>
      </div>
      <div class="sim-controls">
        <div class="sim-row">
          <span style="color: #cbd5e1; font-weight: 600;">Modulation Scale:</span>
          <input type="range" class="sim-slider slider-cyan" min="1" max="100" value="45" oninput="updateSim${slideIndex}(this.value)" />
          <span id="display-val-${slideIndex}" style="font-family: var(--font-mono); font-weight: bold; color: var(--accent-cyan);">45%</span>
        </div>
      </div>
      <div class="sim-gauge gauge-cyan">
        <div class="sim-value" id="result-val-${slideIndex}">Normal Response</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">SYSTEM DYNAMIC STATE</div>
      </div>
    </div>
    <div class="glass-card card-emerald">
      <div class="glass-card-header">
        <span class="card-title">Evaluation Metrics</span>
        <span class="badge badge-emerald">OPTIMAL</span>
      </div>
      <ul class="points-list">
        <li>${p1}</li>
        <li>${p2}</li>
        <li>${p4}</li>
      </ul>
    </div>
  </div>
  <script>
    function updateSim${slideIndex}(val) {
      document.getElementById('display-val-${slideIndex}').textContent = val + '%';
      var status = val > 75 ? 'Peak Load Invariant' : val > 30 ? 'Normal Response' : 'Sub-Optimal Inactive';
      document.getElementById('result-val-${slideIndex}').textContent = status;
    }
  </script>
</section>`;
  } else {
    return `<section class="slide${isActive ? " active" : ""}" id="slide${slideIndex}">
  <div class="slide-title-group">
    <div class="slide-category">${category}</div>
    <h2 class="slide-title">${title}</h2>
    <p class="slide-subtitle">Architectural comparison matrix and verified invariant boundaries.</p>
  </div>
  <div class="glass-card">
    <table class="matrix-table">
      <thead>
        <tr><th>EVALUATION ATTRIBUTE</th><th>STATUS</th><th>INVARIANT DETAIL</th></tr>
      </thead>
      <tbody>
        <tr><td>Primary Foundation</td><td><span class="badge badge-emerald">ACTIVE</span></td><td>${p1}</td></tr>
        <tr><td>Runtime Performance</td><td><span class="badge badge-cyan">VERIFIED</span></td><td>${p2}</td></tr>
        <tr><td>Fault Recovery</td><td><span class="badge badge-amber">PROTECTED</span></td><td>${p3}</td></tr>
        <tr><td>System Invariant</td><td><span class="badge badge-rose">MONITORED</span></td><td>${p4}</td></tr>
      </tbody>
    </table>
  </div>
</section>`;
  }
}

/**
 * Model 3: Creative Presentation Generator (Zero AI Slop, Zero Templates)
 * 
 * Synthesizes the dynamic interactive presentation using a high-throughput,
 * concurrent slide synthesis pipeline.
 */
export async function runStage3CreativeGenerator(
  cleanTopic: string,
  storyboardText: string,
  analysisText: string,
  targetCount: number,
  callbacks: Stage3Callbacks
): Promise<{ rawSlides: string; activeModel: string }> {
  const apiKey = config.nvidiaApiKeyUltra || config.nvidiaApiKey;
  const openai = new OpenAI({
    apiKey,
    baseURL: config.nvidiaBaseUrl,
  });

  const slideSections = parseStoryboardIntoSlides(storyboardText, targetCount);
  const effectiveCount = Math.max(slideSections.length, targetCount);
  let activeModel = MODEL_SUPER;

  console.log(`[Stage3CreativeGenerator] Concurrently synthesizing ${effectiveCount} slides with isolated token budgets...`);
  callbacks.onChunk(`\n🚀 [Model 3] Initiating concurrent synthesis across ${effectiveCount} slide sections...\n`);

  // Helper to generate a single slide with watchdog and fallback
  const synthesizeSlideSection = async (i: number): Promise<string> => {
    const slideDirective = slideSections[i] || `Slide ${i + 1} of ${effectiveCount}: Technical details and synthesis.`;
    const prompt = buildSingleSlidePrompt(cleanTopic, i, effectiveCount, slideDirective, analysisText);

    const callModel = async (model: string): Promise<string> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 40000);
      let contentAcc = "";

      try {
        const stream: any = await openai.chat.completions.create(
          {
            model,
            messages: [
              {
                role: "system",
                content:
                  "You are an elite Keynote Presentation Visual Designer. You output ONLY the valid HTML <section class='slide'> block. Keep internal reasoning to under 80 tokens. Begin outputting HTML immediately.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.35,
            top_p: 0.9,
            max_tokens: 4000,
            stream: true,
          } as any,
          { signal: controller.signal }
        );

        for await (const chunk of stream) {
          const reasoning = (chunk.choices?.[0]?.delta as any)?.reasoning_content || "";
          if (reasoning) {
            callbacks.onReasoning(reasoning);
          }
          const delta = chunk.choices?.[0]?.delta?.content || "";
          if (delta) {
            contentAcc += delta;
          }
        }
        return contentAcc;
      } finally {
        clearTimeout(timer);
      }
    };

    let slideHtml = "";
    let attemptSuccess = false;

    // Attempt 1: Active Super Model
    try {
      slideHtml = await callModel(activeModel);
      if (isValidSlideHtml(slideHtml)) {
        attemptSuccess = true;
      }
    } catch (err: any) {
      console.warn(`[Stage3CreativeGenerator] Slide ${i + 1} super model error (${err?.message}). Retrying with fallback...`);
    }

    // Attempt 2: Nano Omni reasoning model
    if (!attemptSuccess) {
      try {
        slideHtml = await callModel(MODEL_LIGHTNING);
        if (isValidSlideHtml(slideHtml)) {
          attemptSuccess = true;
        }
      } catch (err: any) {
        console.warn(`[Stage3CreativeGenerator] Slide ${i + 1} fallback error:`, err?.message);
      }
    }

    // Attempt 3: Resilient structural synthesis strictly derived from directive
    if (!attemptSuccess || !isValidSlideHtml(slideHtml)) {
      console.log(`[Stage3CreativeGenerator] Using resilient structural fallback for slide ${i + 1}`);
      slideHtml = synthesizeFallbackSlide(cleanTopic, i, effectiveCount, slideDirective);
    }

    // Clean up slide tags and ensure proper </section> closing
    let cleanSlide = slideHtml.trim();
    cleanSlide = cleanSlide.replace(/^```html\s*/i, "").replace(/```\s*$/i, "").trim();

    const isActive = i === 0;
    const expectedOpen = `<section class="slide${isActive ? " active" : ""}" id="slide${i}">`;
    if (cleanSlide.startsWith("<section")) {
      cleanSlide = cleanSlide.replace(/^<section\b[^>]*>/i, expectedOpen);
    } else {
      const openIdx = cleanSlide.indexOf("<section");
      if (openIdx >= 0) {
        cleanSlide = cleanSlide.slice(openIdx).replace(/^<section\b[^>]*>/i, expectedOpen);
      } else {
        cleanSlide = `${expectedOpen}\n${cleanSlide}`;
      }
    }

    if (!cleanSlide.endsWith("</section>")) {
      const lastClose = cleanSlide.lastIndexOf("</section>");
      if (lastClose > 0) {
        cleanSlide = cleanSlide.slice(0, lastClose + 10);
      } else {
        cleanSlide = cleanSlide.replace(/<[a-z0-9_-]+(?:\s+[^>]*)?$/i, "");
        const openDivs = (cleanSlide.match(/<div\b/gi) || []).length;
        const closeDivs = (cleanSlide.match(/<\/div>/gi) || []).length;
        for (let d = 0; d < openDivs - closeDivs; d++) {
          cleanSlide += "</div>";
        }
        cleanSlide += "\n</section>";
      }
    }

    callbacks.onChunk(`\n/* Slide ${i + 1}/${effectiveCount} ready */\n${cleanSlide}\n`);
    console.log(`[Stage3CreativeGenerator] Slide ${i + 1}/${effectiveCount} ready (${cleanSlide.length} chars).`);
    return cleanSlide;
  };

  // Run all slide syntheses concurrently!
  const slidePromises = Array.from({ length: effectiveCount }, (_, idx) => synthesizeSlideSection(idx));
  const generatedSlides = await Promise.all(slidePromises);

  const combinedSlides = generatedSlides.join("\n\n");
  return { rawSlides: combinedSlides, activeModel };
}
