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
    { category: "PHYSICAL ARCHITECTURE", title: "Physical Architecture & Sensing Mechanism", desc: "Heterogeneous signal acquisition, edge physical boundaries, and raw telemetry ingestion." },
    { category: "CONDUIT TRANSPORT", title: "Low-Latency Conduit & Protocol Pipeline", desc: "Packetized serialization, deterministic transport latency, and gateway streaming invariants." },
    { category: "DYNAMIC SIMULATION", title: "Runtime Invariant Simulator & Telemetry Evaluation", desc: "Interactive sensitivity analysis, load parameter modulation, and dynamic system state feedback." },
    { category: "ARCHITECTURE FLOW", title: "Decoupled Execution Flow & Node Topology", desc: "Connected component state progression, event bus distribution, and failure isolation boundaries." },
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
      archetypeId: "3D_WORLD_OR_HERO_SPLIT",
      title: "Interactive 3D WebGL World or Split Hero Topology",
      mandate: `You MUST use a .grid-split featuring an interactive 3D WebGL World (.three-container with data-model="hardware-die-3d" or "quantum-bloch-sphere" or "neural-constellation-3d") on the left, and a multi-color .glass-card.card-emerald on the right with a KaTeX mathematical equation:
<div class="grid-split">
  <div class="three-container" data-model="hardware-die-3d">
    <div class="three-overlay">
      <span class="three-badge">⚡ 3D INTERACTIVE WEBGL</span>
      <span style="font-family: var(--font-display); font-size: 14px; font-weight: bold; color: #fff;">Physical Topology</span>
    </div>
    <div class="three-hint">🖱️ Click &amp; Drag to Rotate 3D Model</div>
  </div>
  <div class="glass-card card-emerald">
    <div class="glass-card-header">
      <span class="card-title">Physical Topology &amp; Invariants</span>
      <span class="badge badge-emerald">PHYSICAL TOPOLOGY</span>
    </div>
    <ul class="points-list">
      <li><strong>Primary Takeaway:</strong> Core foundational architecture and operational mechanisms.</li>
      <li><strong>Quantitative Metric:</strong> Validated throughput and low-latency boundary parameters.</li>
      <li><strong>Mathematical Derivation (KaTeX):</strong><br>\\[ \\text{State}_{t+1} = \\mathcal{T}(\\text{State}_t, \\text{Input}) \\]</li>
    </ul>
  </div>
</div>`,
    },
    {
      archetypeId: "MOTION_PIPELINE",
      title: "Real-World Physical Motion Pipeline (.motion-pipeline)",
      mandate: `You MUST use a real-world .motion-pipeline with 4 physical sequential stages (Emerald -> Cyan -> Indigo -> Amber) and animated packet pulses:
<div class="pipeline-controls">
  <span class="pipeline-tag">⚡ PHYSICAL PROGRESSION &amp; CONDUIT FLOW</span>
  <button class="sim-play-btn" onclick="simulatePipelineFlow(this)">▶ Simulate Flow</button>
</div>
<div class="motion-pipeline">
  <div class="pipeline-stage stage-emerald">
    <span class="stage-num">STAGE 01</span>
    <div class="stage-icon">📡</div>
    <div class="stage-title">[Physical Sensing / Ingestion]</div>
    <div class="stage-desc">[How signals/inputs are captured in the physical world]</div>
  </div>
  <div class="pipeline-connector"><div class="packet-pulse packet-emerald"></div></div>
  <div class="pipeline-stage stage-cyan">
    <span class="stage-num">STAGE 02</span>
    <div class="stage-icon">⚡</div>
    <div class="stage-title">[Conduit / Streaming Transport]</div>
    <div class="stage-desc">[High-speed packetized streaming via gateway]</div>
  </div>
  <div class="pipeline-connector"><div class="packet-pulse packet-cyan"></div></div>
  <div class="pipeline-stage stage-indigo">
    <span class="stage-num">STAGE 03</span>
    <div class="stage-icon">🧠</div>
    <div class="stage-title">[Inference &amp; State Logic]</div>
    <div class="stage-desc">[Transformation, state evaluation, invariant checks]</div>
  </div>
  <div class="pipeline-connector"><div class="packet-pulse packet-amber"></div></div>
  <div class="pipeline-stage stage-amber">
    <span class="stage-num">STAGE 04</span>
    <div class="stage-icon">🚀</div>
    <div class="stage-title">[Actuation &amp; Telemetry Output]</div>
    <div class="stage-desc">[Physical execution, feedback, and telemetry guarantees]</div>
  </div>
</div>
(CRITICAL: This is the ONLY slide in the entire presentation allowed to use .motion-pipeline!)`,
    },
    {
      archetypeId: "INTERACTIVE_SIMULATOR",
      title: "Dynamic Interactive Parameter Simulator (.sim-container)",
      mandate: `You MUST use a .grid-split featuring an interactive .sim-container with a live slider that calculates a concrete domain formula and updates dynamic gauges, paired with an evaluation .glass-card:
<div class="grid-split">
  <div class="sim-container card-cyan">
    <div class="glass-card-header">
      <span class="card-title">Interactive Parameter Simulator</span>
      <span class="badge badge-cyan">RUNTIME SIMULATOR</span>
    </div>
    <div class="sim-controls">
      <div class="sim-row">
        <span style="color: #cbd5e1; font-weight: 600;">System Parameter:</span>
        <input type="range" class="sim-slider slider-cyan" min="1" max="100" value="45" oninput="updateSim${slideIndex}(this.value)" />
        <span id="display-val-${slideIndex}" style="font-family: var(--font-mono); font-weight: bold; color: var(--accent-cyan);">45%</span>
      </div>
    </div>
    <div class="sim-gauge gauge-cyan">
      <div class="sim-value" id="result-val-${slideIndex}">Optimal State</div>
      <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">DYNAMIC SYSTEM TELEMETRY</div>
    </div>
  </div>
  <div class="glass-card card-indigo">
    <div class="glass-card-header">
      <span class="card-title">Dynamic Invariants &amp; Thresholds</span>
      <span class="badge badge-indigo">VERIFIED</span>
    </div>
    <ul class="points-list">
      <li><strong>Operating Boundary:</strong> Telemetry values remain within guaranteed invariant bounds.</li>
      <li><strong>Formula:</strong> Response latency model \\( T_{\\text{resp}} = \\frac{1}{\\mu - \\lambda} \\).</li>
      <li><strong>State Invariance:</strong> Closed-loop parameter adjustment preserves steady-state fidelity.</li>
    </ul>
  </div>
</div>
<script>
  function updateSim${slideIndex}(val) {
    document.getElementById('display-val-${slideIndex}').textContent = val + '%';
    document.getElementById('result-val-${slideIndex}').textContent = val > 80 ? 'Critical Load (' + val + '%)' : 'Optimal (' + val + '%)';
  }
</script>`,
    },
    {
      archetypeId: "FLOW_TOPOLOGY",
      title: "Connected Architecture Flow Topology (.flow-diagram)",
      mandate: `You MUST use a connected flow diagram (.flow-diagram) with active step nodes, animated conduits, and state telemetry:
<div class="flow-diagram">
  <div class="flow-step">
    <div class="flow-node">📡</div>
    <div style="font-size: 13px; font-weight: 700; color: #fff;">[Ingress Node]</div>
    <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">[Ingestion specs]</div>
  </div>
  <div class="flow-arrow">➔</div>
  <div class="flow-step">
    <div class="flow-node">⚡</div>
    <div style="font-size: 13px; font-weight: 700; color: #fff;">[Transport Conduit]</div>
    <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">[Streaming protocol]</div>
  </div>
  <div class="flow-arrow">➔</div>
  <div class="flow-step">
    <div class="flow-node">🧠</div>
    <div style="font-size: 13px; font-weight: 700; color: #fff;">[Inference Core]</div>
    <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">[Model execution]</div>
  </div>
  <div class="flow-arrow">➔</div>
  <div class="flow-step">
    <div class="flow-node">🚀</div>
    <div style="font-size: 13px; font-weight: 700; color: #fff;">[Actuation Gateway]</div>
    <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">[Verified output]</div>
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
      <tr><th>EVALUATION DIMENSION</th><th>STATUS</th><th>CONCRETE METRIC</th><th>ARCHITECTURAL IMPACT</th></tr>
    </thead>
    <tbody>
      <tr><td>[Dimension 1]</td><td><span class="badge badge-emerald">OPTIMAL</span></td><td>[Concrete Metric 1]</td><td>[Operational impact 1]</td></tr>
      <tr><td>[Dimension 2]</td><td><span class="badge badge-cyan">CONSTRAINED</span></td><td>[Concrete Metric 2]</td><td>[Operational impact 2]</td></tr>
      <tr><td>[Dimension 3]</td><td><span class="badge badge-amber">THRESHOLD</span></td><td>[Concrete Metric 3]</td><td>[Operational impact 3]</td></tr>
      <tr><td>[Dimension 4]</td><td><span class="badge badge-rose">LATENCY BOUND</span></td><td>[Concrete Metric 4]</td><td>[Operational impact 4]</td></tr>
    </tbody>
  </table>
</div>`,
    },
    {
      archetypeId: "BAR_CHART_KPI",
      title: "Dynamic Visual Bar Chart (.chart-card)",
      mandate: `You MUST use an animated visual bar chart (.chart-card) showing quantitative benchmarks and throughput scaling:
<div class="chart-card">
  <div class="chart-header">
    <span style="font-family: var(--font-display); font-size: 15px; font-weight: 700; color: #fff;">[Performance &amp; Throughput Benchmark]</span>
    <span class="badge badge-emerald">BENCHMARK DATA</span>
  </div>
  <div class="chart-bars-group">
    <div class="chart-bar-col"><div class="chart-val-label">[Val 1]</div><div class="chart-bar-fill" style="height: 45%;"></div><div class="chart-axis-label">[Config A]</div></div>
    <div class="chart-bar-col"><div class="chart-val-label">[Val 2]</div><div class="chart-bar-fill accent-indigo" style="height: 75%;"></div><div class="chart-axis-label">[Config B]</div></div>
    <div class="chart-bar-col"><div class="chart-val-label">[Val 3]</div><div class="chart-bar-fill accent-emerald" style="height: 95%;"></div><div class="chart-axis-label">[Optimized]</div></div>
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

STRICT ANTI-ARTICLE RULES:
1. Output ONLY the <section class="slide${isActive ? " active" : ""}" id="slide${slideIndex}"> ... </section> tag.
2. Always properly close the </section> tag at the end.
3. NEVER generate plain text articles or bullet-point essay cards! Use the assigned visual archetype above.
4. USE MULTI-COLORS: Assign different colors to stages and cards (.card-emerald, .card-cyan, .card-indigo, .card-amber, .card-rose).
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

  if (slideType === 0) {
    return `<section class="slide${isActive ? " active" : ""}" id="slide${slideIndex}">
  <div class="slide-title-group">
    <div class="slide-category">${category}</div>
    <h2 class="slide-title">${title}</h2>
    <p class="slide-subtitle">Deterministic sequential execution pipeline and component transitions.</p>
  </div>
  <div class="pipeline-controls">
    <span class="pipeline-tag">⚡ PHYSICAL PROGRESSION &amp; CONDUIT FLOW</span>
    <button class="sim-play-btn" onclick="simulatePipelineFlow(this)">▶ Simulate Flow</button>
  </div>
  <div class="motion-pipeline">
    <div class="pipeline-stage stage-emerald">
      <span class="stage-num">STAGE 01</span>
      <div class="stage-icon">📡</div>
      <div class="stage-title">Ingestion &amp; Perception</div>
      <div class="stage-desc">${p1}</div>
    </div>
    <div class="pipeline-connector"><div class="packet-pulse packet-emerald"></div></div>
    <div class="pipeline-stage stage-cyan">
      <span class="stage-num">STAGE 02</span>
      <div class="stage-icon">⚡</div>
      <div class="stage-title">Conduit Transport</div>
      <div class="stage-desc">${p2}</div>
    </div>
    <div class="pipeline-connector"><div class="packet-pulse packet-cyan"></div></div>
    <div class="pipeline-stage stage-indigo">
      <span class="stage-num">STAGE 03</span>
      <div class="stage-icon">🧠</div>
      <div class="stage-title">State Evaluation</div>
      <div class="stage-desc">${p3}</div>
    </div>
    <div class="pipeline-connector"><div class="packet-pulse packet-amber"></div></div>
    <div class="pipeline-stage stage-amber">
      <span class="stage-num">STAGE 04</span>
      <div class="stage-icon">🚀</div>
      <div class="stage-title">Commit &amp; Actuation</div>
      <div class="stage-desc">${p4}</div>
    </div>
  </div>
</section>`;
  } else if (slideType === 1) {
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
        <tr><td>Conduit Performance</td><td><span class="badge badge-cyan">VERIFIED</span></td><td>${p2}</td></tr>
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
