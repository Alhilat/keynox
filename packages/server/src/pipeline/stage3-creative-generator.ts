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

  if (rawSections.length > 0 && rawSections.length < targetCount) {
    const result = [...rawSections];
    while (result.length < targetCount) {
      const idx = result.length + 1;
      result.push(`SLIDE ${idx}: Advanced Architecture & Component Invariants\n- Category: SYSTEM INVARIANTS\n- Real-world operations, dynamic invariants, and telemetry guarantees.`);
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

DESIGN SYSTEM UTILITIES AVAILABLE (DO NOT REDEFINE CSS):
- Multi-Color Themed Obsidian Glass Cards (USE MULTI-COLORS, NEVER MONOTONE CYAN):
  * .glass-card.card-emerald (Perception / Sensing / Success / Optimal)
  * .glass-card.card-cyan (Network / Transport / Conduit / Streaming Protocol)
  * .glass-card.card-indigo (Cognitive / Logic / AI Model / Cloud Processing)
  * .glass-card.card-amber (Actuation / Power Invariants / Alert Threshold)
  * .glass-card.card-rose (Bottleneck / Latency / Trade-off / Fault)
  (Every card features radiant gradient top borders and glowing bullets in its respective color!)

- Interactive 3D WebGL World (.three-container) — ROTATABLE WITH MOUSE (USE FOR QUANTUM, HARDWARE, NEURAL, PHYSICS):
  <div class="grid-split">
    <div class="three-container" data-model="quantum-bloch-sphere">
      <div class="three-overlay">
        <span class="three-badge">⚡ 3D INTERACTIVE WEBGL</span>
        <span style="font-family: var(--font-display); font-size: 14px; font-weight: bold; color: #fff;">[3D Model Title]</span>
      </div>
      <div class="three-hint">🖱️ Click &amp; Drag to Rotate 3D Model</div>
    </div>
    <div class="glass-card card-cyan">
      <div class="glass-card-header">
        <span class="card-title">[Physical Dimension &amp; Invariants]</span>
        <span class="badge badge-cyan">MODEL STATE</span>
      </div>
      <ul class="points-list">
        <li>[Invariant 1: Real-world metric or mathematical derivation]</li>
        <li>[Invariant 2: Operational boundary or state fidelity]</li>
      </ul>
    </div>
  </div>
  (Available models: "quantum-bloch-sphere", "hardware-die-3d", "neural-constellation-3d")

- Dynamic Particle Conduit (.particle-container) — 60FPS CONTINUOUS PARTICLE FLOW:
  <div class="particle-container">
    <canvas class="particle-canvas"></canvas>
  </div>

- Real-World Motion Pipeline (.motion-pipeline) — USE FOR PHYSICAL PROCESSES & ARCHITECTURE:
  Shows physical progression stages with animated glowing packets and a live simulation runner:
  <div class="pipeline-controls">
    <span class="pipeline-tag">⚡ PHYSICAL PROGRESSION &amp; CONDUIT FLOW</span>
    <button class="sim-play-btn" onclick="simulatePipelineFlow(this)">▶ Simulate Flow</button>
  </div>
  <div class="motion-pipeline">
    <div class="pipeline-stage stage-emerald">
      <span class="stage-num">STAGE 01</span>
      <div class="stage-icon">📡</div>
      <div class="stage-title">[Input / Physical Sensing]</div>
      <div class="stage-desc">[How signals/inputs are captured in the real world]</div>
    </div>
    <div class="pipeline-connector"><div class="packet-pulse packet-emerald"></div></div>
    <div class="pipeline-stage stage-cyan">
      <span class="stage-num">STAGE 02</span>
      <div class="stage-icon">⚡</div>
      <div class="stage-title">[Conduit / Transport]</div>
      <div class="stage-desc">[High-speed packetized streaming]</div>
    </div>
    <div class="pipeline-connector"><div class="packet-pulse packet-cyan"></div></div>
    <div class="pipeline-stage stage-indigo">
      <span class="stage-num">STAGE 03</span>
      <div class="stage-icon">🧠</div>
      <div class="stage-title">[Inference / Logic]</div>
      <div class="stage-desc">[Transformation & state evaluation]</div>
    </div>
    <div class="pipeline-connector"><div class="packet-pulse packet-amber"></div></div>
    <div class="pipeline-stage stage-amber">
      <span class="stage-num">STAGE 04</span>
      <div class="stage-icon">🚀</div>
      <div class="stage-title">[Actuation / Output]</div>
      <div class="stage-desc">[Physical execution & telemetry]</div>
    </div>
  </div>

- Dynamic Interactive Simulators (.sim-container):
  Must feature an interactive slider that calculates a real formula and dynamically animates gauges or indicators:
  <div class="sim-container card-indigo">
    <div class="glass-card-header">
      <span class="card-title">Dynamic Interactive Simulator</span>
      <span class="badge badge-indigo">LIVE RUNTIME</span>
    </div>
    <div class="sim-controls">
      <div class="sim-row">
        <span style="color: #cbd5e1; font-weight: 600;">System Parameter:</span>
        <input type="range" class="sim-slider slider-indigo" min="1" max="100" value="35" oninput="updateSim${slideIndex}(this.value)" />
        <span id="display-val-${slideIndex}" style="font-family: var(--font-mono); font-weight: bold; color: var(--accent-indigo);">35</span>
      </div>
    </div>
    <div class="sim-gauge gauge-indigo">
      <div class="sim-value" id="result-val-${slideIndex}">49.7 ms</div>
      <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">REAL-TIME DYNAMIC TELEMETRY</div>
    </div>
  </div>
  <script>
    function updateSim${slideIndex}(val) {
      document.getElementById('display-val-${slideIndex}').textContent = val;
      document.getElementById('result-val-${slideIndex}').textContent = (val * 1.42).toFixed(1) + ' ms';
    }
  </script>

- Multi-Color Comparison Matrix (.matrix-table):
  <div class="glass-card">
    <table class="matrix-table">
      <thead>
        <tr><th>DIMENSION</th><th>STATUS</th><th>INVARIANT VALUE</th></tr>
      </thead>
      <tbody>
        <tr><td>[Dimension 1]</td><td><span class="badge badge-emerald">OPTIMAL</span></td><td>[Concrete Metric]</td></tr>
        <tr><td>[Dimension 2]</td><td><span class="badge badge-amber">MODERATE</span></td><td>[Concrete Metric]</td></tr>
        <tr><td>[Dimension 3]</td><td><span class="badge badge-rose">LATENCY BOUND</span></td><td>[Concrete Metric]</td></tr>
      </tbody>
    </table>
  </div>

- NVIDIA FLUX Photo Card:
  <div class="photo-card">
    <div class="photo-badge">NVIDIA FLUX</div>
    <img class="photo-img" data-ai-photo="true" data-photo-prompt="[Insert photorealistic prompt from Model 2]" alt="[Photo Title]" />
    <div class="photo-body">
      <div class="photo-title">[Photo Title]</div>
      <div class="photo-caption">[Photo Caption]</div>
    </div>
  </div>

STRICT ANTI-ARTICLE RULES:
1. Output ONLY the <section class="slide${isActive ? " active" : ""}" id="slide${slideIndex}"> ... </section> tag.
2. Always properly close the </section> tag at the end.
3. NEVER generate plain text articles or bullet-point essay cards!
   - Every slide MUST feature a rich visual shape: .motion-pipeline, .sim-container, .flow-diagram, or .matrix-table!
   - If using text cards, pair them in a .grid-split alongside a visual shape or simulator—NEVER generate a slide with only text cards!
4. USE MULTI-COLORS: Assign different colors to stages and cards (.card-emerald, .card-cyan, .card-indigo, .card-amber, .card-rose). Never make the slide monotone cyan!
5. Keep internal reasoning under 80 tokens. Output valid HTML directly.`;
}

/**
 * Validates that a slide is non-empty, contains HTML structure, and meets the minimum length.
 */
function isValidSlideHtml(html: string): boolean {
  const trimmed = (html || "").trim();
  if (trimmed.length < 250) return false;
  return (
    trimmed.includes("<section") ||
    trimmed.includes("class=\"slide") ||
    trimmed.includes("slide-title") ||
    trimmed.includes("motion-pipeline") ||
    trimmed.includes("sim-container") ||
    trimmed.includes("glass-card")
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
            max_tokens: 2500,
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
