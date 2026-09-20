import OpenAI from "openai";
import { config } from "../config";
import { sanitizeDocumentContent } from "./topic-extractor";
import { geminiService } from "../services/geminiService";

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
export function parseStoryboardIntoSlides(storyboardText: string, targetCount: number, analysisText: string = ""): string[] {
  const cleanStoryboard = sanitizeDocumentContent(storyboardText);
  const slideDelimiterRegex = /(?=(?:^|\n)(?:#{1,3}\s*)?(?:SLIDE|Slide)\s*\d+[:\-—.\s])/i;
  let rawSections = cleanStoryboard
    .split(slideDelimiterRegex)
    .map((s) => s.trim())
    .filter((s) => {
      if (s.length < 25) return false;
      const u = s.toUpperCase();
      return (
        !u.startsWith("TARGET SLIDE COUNT") &&
        !u.startsWith("PREFERRED THEME") &&
        !u.startsWith("SOURCE DOCUMENT")
      );
    });

  if (rawSections.length >= targetCount) {
    return rawSections.slice(0, targetCount);
  }

  // If the regex split produced too few slides, try markdown heading splits
  if (rawSections.length < targetCount) {
    const secondarySections = cleanStoryboard
      .split(/(?=(?:^|\n)#{1,3}\s+)/)
      .map((s) => s.trim())
      .filter((s) => s.length > 30);
    if (secondarySections.length >= targetCount) {
      return secondarySections.slice(0, targetCount);
    }
  }

  // Fallback: If still fewer than targetCount, dynamically partition the actual analysisText from the document so every slide is 100% genuine content!
  const result = [...rawSections];
  if (analysisText) {
    const cleanAnalysis = sanitizeDocumentContent(analysisText);
    const analysisSections = cleanAnalysis
      .split(/(?=(?:^|\n)#+\s+(?:SECTION|\d+))/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 40 && !s.toUpperCase().includes("CRITICAL MANDATE"));

    let aIdx = 0;
    while (result.length < targetCount && analysisSections.length > 0) {
      const idx = result.length + 1;
      const sectionSnippet = analysisSections[aIdx % analysisSections.length] || cleanAnalysis.slice(0, 800);
      result.push(`SLIDE ${idx}: Technical Deep Dive Part ${idx}\n${sectionSnippet}`);
      aIdx++;
    }
  }

  // If still fewer than targetCount (e.g. analysisText not provided in unit tests), create distinct slide sections
  while (result.length < targetCount) {
    const idx = result.length + 1;
    const baseSnippet = rawSections[0] || cleanStoryboard;
    result.push(`SLIDE ${idx}: Subsystem Execution & Architecture Part ${idx}\n${baseSnippet}`);
  }

  return result.slice(0, targetCount);
}

export interface VisualTemplate {
  id: string;
  name: string;
  description: string;
  guidelines: string;
}

export const VISUAL_TEMPLATES: Record<string, VisualTemplate> = {
  TEMPLATE_01_HERO_SPLIT_OVERVIEW: {
    id: "TEMPLATE_01_HERO_SPLIT_OVERVIEW",
    name: "Hero Concept Split Overview",
    description: "High-impact thesis card on left + key mechanisms in glass-card on right (.grid-split)",
    guidelines: `Use .grid-split:
<div class="grid-split">
  <div class="glass-card card-emerald">
    <div class="glass-card-header"><span class="card-title">[Primary Domain Thesis]</span><span class="badge badge-emerald">PRIMARY</span></div>
    <p class="card-desc">[Core foundational mechanism extracted from document]</p>
    <ul class="points-list"><li>[Key Mechanism 1]</li><li>[Key Mechanism 2]</li></ul>
  </div>
  <div class="glass-card card-cyan">
    <div class="glass-card-header"><span class="card-title">Core Principles</span><span class="badge badge-cyan">VERIFIED</span></div>
    <ul class="points-list"><li>[Key Mechanism 1]</li><li>[Key Mechanism 2]</li><li>[Key Mechanism 3]</li></ul>
  </div>
</div>`,
  },
  TEMPLATE_02_TERMINAL_CODE_EXPLORER: {
    id: "TEMPLATE_02_TERMINAL_CODE_EXPLORER",
    name: "CLI Shell & Code Execution Explorer",
    description: "Syntax-highlighted terminal window on left + parameter breakdown card on right (.grid-split)",
    guidelines: `Use .grid-split:
<div class="grid-split">
  <div class="terminal-card">
    <div class="terminal-header"><div class="terminal-dots"><span class="terminal-dot dot-red"></span><span class="terminal-dot dot-yellow"></span><span class="terminal-dot dot-green"></span></div><span class="terminal-title">[Subsystem / Shell Context]</span></div>
    <pre class="terminal-body"><code><span class="terminal-cmd">$ [Exact Command / System Call from Document]</span>
<span class="terminal-out">[Exact output, flag, or PID from Document]</span></code></pre>
  </div>
  <div class="glass-card card-indigo">
    <div class="glass-card-header"><span class="card-title">[Flag / Execution Breakdown]</span><span class="badge badge-indigo">RUNTIME</span></div>
    <ul class="points-list"><li><strong>[Flag/Param 1]:</strong> [Description from text]</li><li><strong>[Flag/Param 2]:</strong> [Description from text]</li></ul>
  </div>
</div>`,
  },
  TEMPLATE_03_CODE_DIFF_EVOLUTION: {
    id: "TEMPLATE_03_CODE_DIFF_EVOLUTION",
    name: "Side-by-Side Code Diff Evolution",
    description: "Two code/terminal panes side-by-side (.diff-container) comparing host vs container, or before vs after",
    guidelines: `Use .diff-container:
<div class="diff-container">
  <div class="diff-pane">
    <div class="diff-header"><span style="color:#f43f5e;font-weight:700;">[Baseline / Host View]</span><span class="badge badge-rose">UNISOLATED</span></div>
    <pre class="terminal-body"><code><span class="terminal-cmd">$ [Baseline Host Command]</span>
<span class="terminal-out">[Baseline Output from text]</span></code></pre>
  </div>
  <div class="diff-pane" style="border-color:rgba(16,185,129,0.4);">
    <div class="diff-header"><span style="color:#10b981;font-weight:700;">[Contained / Isolated View]</span><span class="badge badge-emerald">ISOLATED</span></div>
    <pre class="terminal-body"><code><span class="terminal-cmd">$ [Contained Command with Isolation Flags]</span>
<span class="terminal-highlight">[Isolated Output showing separation]</span></code></pre>
  </div>
</div>`,
  },
  TEMPLATE_04_SEQUENTIAL_PIPELINE_4: {
    id: "TEMPLATE_04_SEQUENTIAL_PIPELINE_4",
    name: "4-Stage Sequential Process Pipeline",
    description: "4-stage pipeline with packet pulses and vector SVG icons (.motion-pipeline)",
    guidelines: `Use .motion-pipeline:
<div class="pipeline-controls"><span class="pipeline-tag"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polyline></svg>SEQUENTIAL PROGRESSION</span><button class="sim-play-btn" onclick="simulatePipelineFlow(this)"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>Simulate Flow</button></div>
<div class="motion-pipeline">
  <div class="pipeline-stage stage-emerald"><span class="stage-num">STAGE 01</span><div class="stage-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line></svg></div><div class="stage-title">[Step 1 Name]</div><div class="stage-desc">[Step 1 Action from text]</div></div>
  <div class="pipeline-connector"><div class="packet-pulse packet-emerald"></div></div>
  <div class="pipeline-stage stage-cyan"><span class="stage-num">STAGE 02</span><div class="stage-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg></div><div class="stage-title">[Step 2 Name]</div><div class="stage-desc">[Step 2 Action from text]</div></div>
  <div class="pipeline-connector"><div class="packet-pulse packet-cyan"></div></div>
  <div class="pipeline-stage stage-indigo"><span class="stage-num">STAGE 03</span><div class="stage-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline></svg></div><div class="stage-title">[Step 3 Name]</div><div class="stage-desc">[Step 3 Action from text]</div></div>
  <div class="pipeline-connector"><div class="packet-pulse packet-amber"></div></div>
  <div class="pipeline-stage stage-amber"><span class="stage-num">STAGE 04</span><div class="stage-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div><div class="stage-title">[Step 4 Name]</div><div class="stage-desc">[Step 4 Action from text]</div></div>
</div>`,
  },
  TEMPLATE_05_STREAMLINED_PIPELINE_3: {
    id: "TEMPLATE_05_STREAMLINED_PIPELINE_3",
    name: "3-Stage Streamlined Workflow",
    description: "3-stage focused pipeline for setup -> execution -> latching",
    guidelines: `Use .motion-pipeline with 3 stages (Emerald -> Cyan -> Indigo).`,
  },
  TEMPLATE_06_CONNECTED_TOPOLOGY_FLOW: {
    id: "TEMPLATE_06_CONNECTED_TOPOLOGY_FLOW",
    name: "Connected Architecture Flow Topology",
    description: "Horizontal node graph with 4 interconnected entity nodes (.flow-diagram)",
    guidelines: `Use .flow-diagram:
<div class="flow-diagram">
  <div class="flow-step card-emerald"><div class="flow-node"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg></div><div style="font-size:15px;font-weight:700;color:#fff;">[Entity 1]</div><div style="font-size:13px;color:var(--text-muted);margin-top:4px;">[Spec 1]</div></div>
  <div class="flow-arrow"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></div>
  <div class="flow-step card-cyan"><div class="flow-node"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="6" height="6" rx="1"></rect><rect x="16" y="2" width="6" height="6" rx="1"></rect><rect x="9" y="16" width="6" height="6" rx="1"></rect><path d="M5 8v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"></path><line x1="12" y1="13" x2="12" y2="16"></line></svg></div><div style="font-size:15px;font-weight:700;color:#fff;">[Entity 2]</div><div style="font-size:13px;color:var(--text-muted);margin-top:4px;">[Spec 2]</div></div>
  <div class="flow-arrow"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></div>
  <div class="flow-step card-indigo"><div class="flow-node"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div><div style="font-size:15px;font-weight:700;color:#fff;">[Entity 3]</div><div style="font-size:13px;color:var(--text-muted);margin-top:4px;">[Spec 3]</div></div>
  <div class="flow-arrow"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></div>
  <div class="flow-step card-amber"><div class="flow-node"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line></svg></div><div style="font-size:15px;font-weight:700;color:#fff;">[Entity 4]</div><div style="font-size:13px;color:var(--text-muted);margin-top:4px;">[Spec 4]</div></div>
</div>`,
  },
  TEMPLATE_07_DUAL_STREAM_CONVERGENCE: {
    id: "TEMPLATE_07_DUAL_STREAM_CONVERGENCE",
    name: "Dual Stream Convergence",
    description: "Two parallel inputs merging into a central processing engine (.grid-split)",
    guidelines: `Use .grid-split with two stacked sub-cards on left merging into main engine card on right.`,
  },
  TEMPLATE_08_INTERACTIVE_SLIDER_SIMULATOR: {
    id: "TEMPLATE_08_INTERACTIVE_SLIDER_SIMULATOR",
    name: "Interactive Parameter Simulator",
    description: "Live range slider with reactive calculation gauge (.sim-container) + explanation card (.grid-split)",
    guidelines: `Use .grid-split with .sim-container on left and .glass-card on right. Include inline <script> to update DOM.`,
  },
  TEMPLATE_09_COMPARISON_MATRIX_TABLE: {
    id: "TEMPLATE_09_COMPARISON_MATRIX_TABLE",
    name: "Multi-Dimensional Comparison Matrix",
    description: "Full-width table with colored status badges (.matrix-table)",
    guidelines: `Use .glass-card containing <table class="matrix-table"> with 4 evaluation rows and multi-colored status badges.`,
  },
  TEMPLATE_10_DYNAMIC_BAR_CHART_BENCHMARK: {
    id: "TEMPLATE_10_DYNAMIC_BAR_CHART_BENCHMARK",
    name: "Dynamic Visual Bar Chart Benchmark",
    description: "Quantitative bar chart with animated fills and value labels (.chart-card)",
    guidelines: `Use .chart-card with .chart-bars-group and .chart-bar-fill columns.`,
  },
  TEMPLATE_11_TRI_CARD_CONCEPT_GRID: {
    id: "TEMPLATE_11_TRI_CARD_CONCEPT_GRID",
    name: "Tri-Card Thematic Concept Grid",
    description: "3 side-by-side thematic glass cards (.grid-3)",
    guidelines: `Use .grid-3 with 3 cards: .card-emerald, .card-cyan, .card-indigo.`,
  },
  TEMPLATE_12_QUAD_METRIC_DASHBOARD: {
    id: "TEMPLATE_12_QUAD_METRIC_DASHBOARD",
    name: "Quad Metric KPI Dashboard",
    description: "2x2 grid of glowing KPI metric cards (.stat-grid)",
    guidelines: `Use <div class="stat-grid"> with 4 .stat-card elements containing .stat-val and .stat-lbl.`,
  },
  TEMPLATE_13_MATHEMATICAL_DERIVATION_STEP: {
    id: "TEMPLATE_13_MATHEMATICAL_DERIVATION_STEP",
    name: "Mathematical Derivation Step",
    description: "Prominent KaTeX formula block + term transformation list (.grid-split)",
    guidelines: `Use .grid-split with KaTeX block equation \\[ ... \\] on left and transformation steps on right.`,
  },
  TEMPLATE_14_STATE_MACHINE_TRANSITION: {
    id: "TEMPLATE_14_STATE_MACHINE_TRANSITION",
    name: "State Machine Transition Diagram",
    description: "3 state blocks with transition criteria (.state-diagram)",
    guidelines: `Use <div class="state-diagram"> with 3 .state-node elements separated by .state-arrow.`,
  },
  TEMPLATE_15_HIERARCHICAL_LAYER_STACK: {
    id: "TEMPLATE_15_HIERARCHICAL_LAYER_STACK",
    name: "Hierarchical Architecture Layer Stack",
    description: "Vertical architectural tier stack (.layer-stack)",
    guidelines: `Use <div class="layer-stack"> with 4 .layer-item elements from User/App level down to Kernel/Hardware level.`,
  },
  TEMPLATE_16_INTERACTIVE_SVG_VENN: {
    id: "TEMPLATE_16_INTERACTIVE_SVG_VENN",
    name: "Interactive SVG Venn Diagram",
    description: "Overlapping SVG circles with hover glow (.venn-container)",
    guidelines: `Use .venn-container with .venn-svg and .venn-circle-shape elements.`,
  },
  TEMPLATE_17_THREE_JS_SPATIAL_WORLD: {
    id: "TEMPLATE_17_THREE_JS_SPATIAL_WORLD",
    name: "Interactive 3D WebGL World",
    description: "Interactive Three.js orbit viewport (.three-container)",
    guidelines: `Use .grid-split with .three-container on left (data-model="topology-cluster-3d") and spec card on right.`,
  },
  TEMPLATE_18_CHRONOLOGICAL_TIMELINE: {
    id: "TEMPLATE_18_CHRONOLOGICAL_TIMELINE",
    name: "Chronological Milestone Track",
    description: "Horizontal progression track with milestone deliverable points",
    guidelines: `Use .motion-pipeline with phase milestones and status badges.`,
  },
  TEMPLATE_19_PRO_CON_TRADE_OFF_STUDY: {
    id: "TEMPLATE_19_PRO_CON_TRADE_OFF_STUDY",
    name: "Pro-Con Architecture Trade-Off Study",
    description: "Side-by-side benefits vs constraints (.grid-2)",
    guidelines: `Use .grid-2 with .card-emerald (Architectural Advantages) on left and .card-rose (Constraints & Trade-offs) on right.`,
  },
  TEMPLATE_20_EXECUTIVE_CHECKLIST_SUMMARY: {
    id: "TEMPLATE_20_EXECUTIVE_CHECKLIST_SUMMARY",
    name: "Executive Summary & Verification Checklist",
    description: "Full-width checklist group (.checklist-group) with vector SVG check icons",
    guidelines: `Use <div class="checklist-group"> with 4 .check-item elements containing .check-icon (SVG) and .check-content.`,
  },
};

/**
 * Autonomously selects the best visual template from the 20-template catalog based on directive and text semantics.
 */
export function resolveVisualTemplate(slideDirective: string, slideIndex: number): VisualTemplate {
  // 1. Check if Model 2 explicitly recommended a template
  const explicitMatch = slideDirective.match(/TEMPLATE:\s*(TEMPLATE_\w+)/i);
  if (explicitMatch && VISUAL_TEMPLATES[explicitMatch[1].toUpperCase()]) {
    return VISUAL_TEMPLATES[explicitMatch[1].toUpperCase()];
  }

  // 2. Semantic detection based on content
  const lower = slideDirective.toLowerCase();
  if (lower.includes("terminal") || lower.includes("sudo") || lower.includes("docker") || lower.includes("command") || lower.includes("shell") || lower.includes("cgroup") || lower.includes("unshare") || lower.includes("mkdir")) {
    return VISUAL_TEMPLATES.TEMPLATE_02_TERMINAL_CODE_EXPLORER;
  }
  if (lower.includes("diff") || lower.includes("before vs after") || lower.includes("host vs container")) {
    return VISUAL_TEMPLATES.TEMPLATE_03_CODE_DIFF_EVOLUTION;
  }
  if (lower.includes("layer") || lower.includes("stack") || lower.includes("hierarchy") || lower.includes("levels")) {
    return VISUAL_TEMPLATES.TEMPLATE_15_HIERARCHICAL_LAYER_STACK;
  }
  if (lower.includes("table") || lower.includes("matrix") || lower.includes("comparison grid") || lower.includes("benchmark table")) {
    return VISUAL_TEMPLATES.TEMPLATE_09_COMPARISON_MATRIX_TABLE;
  }
  if (lower.includes("trade-off") || lower.includes("pros and cons") || lower.includes("advantages vs")) {
    return VISUAL_TEMPLATES.TEMPLATE_19_PRO_CON_TRADE_OFF_STUDY;
  }
  if (lower.includes("metric") || lower.includes("kpi") || lower.includes("throughput") || lower.includes("dashboard")) {
    return VISUAL_TEMPLATES.TEMPLATE_12_QUAD_METRIC_DASHBOARD;
  }
  if (lower.includes("bar chart") || lower.includes("chart") || lower.includes("scaling")) {
    return VISUAL_TEMPLATES.TEMPLATE_10_DYNAMIC_BAR_CHART_BENCHMARK;
  }
  if (lower.includes("state machine") || lower.includes("transition") || lower.includes("lifecycle")) {
    return VISUAL_TEMPLATES.TEMPLATE_14_STATE_MACHINE_TRANSITION;
  }
  if (lower.includes("venn") || lower.includes("overlap") || lower.includes("intersection")) {
    return VISUAL_TEMPLATES.TEMPLATE_16_INTERACTIVE_SVG_VENN;
  }
  if (lower.includes("formula") || lower.includes("equation") || lower.includes("math") || lower.includes("derivation")) {
    return VISUAL_TEMPLATES.TEMPLATE_13_MATHEMATICAL_DERIVATION_STEP;
  }
  if (lower.includes("simulation") || lower.includes("slider") || lower.includes("interactive")) {
    return VISUAL_TEMPLATES.TEMPLATE_08_INTERACTIVE_SLIDER_SIMULATOR;
  }
  if (lower.includes("checklist") || lower.includes("summary") || lower.includes("conclusion") || lower.includes("takeaways")) {
    return VISUAL_TEMPLATES.TEMPLATE_20_EXECUTIVE_CHECKLIST_SUMMARY;
  }
  if (lower.includes("flow") || lower.includes("topology") || lower.includes("network") || lower.includes("bus")) {
    return VISUAL_TEMPLATES.TEMPLATE_06_CONNECTED_TOPOLOGY_FLOW;
  }
  if (lower.includes("pipeline") || lower.includes("stages") || lower.includes("step 1")) {
    return VISUAL_TEMPLATES.TEMPLATE_04_SEQUENTIAL_PIPELINE_4;
  }

  // 3. Fallback: Diverse rotational defaults across 20-template catalog
  const diverseDefaults = [
    "TEMPLATE_01_HERO_SPLIT_OVERVIEW",
    "TEMPLATE_02_TERMINAL_CODE_EXPLORER",
    "TEMPLATE_04_SEQUENTIAL_PIPELINE_4",
    "TEMPLATE_09_COMPARISON_MATRIX_TABLE",
    "TEMPLATE_11_TRI_CARD_CONCEPT_GRID",
    "TEMPLATE_12_QUAD_METRIC_DASHBOARD",
    "TEMPLATE_15_HIERARCHICAL_LAYER_STACK",
    "TEMPLATE_19_PRO_CON_TRADE_OFF_STUDY",
  ];
  return VISUAL_TEMPLATES[diverseDefaults[slideIndex % diverseDefaults.length]];
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
  const cleanDirective = sanitizeDocumentContent(slideDirective);
  const cleanAnalysis = sanitizeDocumentContent(analysisSummary);
  const assigned = resolveVisualTemplate(cleanDirective, slideIndex);

  return `You are an elite Keynote Presentation Visual Designer & Creative Frontend Technologist.
Synthesize EXACTLY ONE slide section (<section class="slide${isActive ? " active" : ""}" id="slide${slideIndex}"> ... </section>) for:
Topic: "${cleanTopic}"
Slide ${slideIndex + 1} of ${totalSlides}

SLIDE STORYBOARD & VISUAL/PHOTO DIRECTIVE FROM MODEL 2:
"""
${cleanDirective}
"""

DOMAIN CONTEXT FROM MODEL 1:
"""
${cleanAnalysis.slice(0, 25000)}
"""

MANDATORY HEADLINE REQUIREMENT:
You MUST start the slide content immediately inside <section ...> with:
<div class="slide-title-group">
  <div class="slide-category">[1-3 WORD UPPERCASE CATEGORY]</div>
  <h2 class="slide-title">[Specific Technical Headline for This Slide]</h2>
  <p class="slide-subtitle">[Natural, Clear Human Explanation]</p>
</div>
HEADLINE RULES:
- CATEGORY: Short, clean 1-3 words (e.g. "COMPUTER SECURITY", "ACCESS CONTROL", "CRYPTOGRAPHY"). NEVER use pipe characters ("|"). NEVER stack buzzwords like "ARCHITECTURE | INVARIANTS" or "TAXONOMIES".
- SUBTITLE: Write a natural, human explanatory sentence (how an Oxford or MIT professor would explain it to students). NEVER start with robotic "-ing" participles ("Establishing foundational...", "Analyzing structural...", "Incorporating...", "Leveraging...", "Facilitating..."). NEVER use robot filler words ("systemic invariants", "enterprise asset protection", "topologies", "telemetry", "paradigms").
- TITLE: Direct, human, clear technical title. NEVER output raw "Chapter...", "Slide X of Y", or prompt metadata in the title!

RECOMMENDED COMPOSABLE VISUAL PRIMITIVES & TEMPLATE:
Baseline: ${assigned.name} (${assigned.id})

COMPOSABLE DESIGN SYSTEM PALETTE (Choose and compose the best primitives for this slide's domain):
1. Disk & Memory Block Stripe:
   <div class="disk-stripe">
     <div class="stripe-block stripe-cyan"><span class="block-tag">BLOCK 0</span><span class="block-title">Superblock</span><span class="block-size">Fixed Parameters</span></div>
     <div class="stripe-block stripe-emerald"><span class="block-tag">BLOCK 1</span><span class="block-title">Group Descriptors</span><span class="block-size">Block Counts</span></div>
     <div class="stripe-block stripe-indigo"><span class="block-tag">BLOCK 2</span><span class="block-title">Block Bitmap</span><span class="block-size">Allocation Map</span></div>
     <div class="stripe-block stripe-amber"><span class="block-tag">BLOCK 3</span><span class="block-title">Inode Bitmap</span><span class="block-size">Inode Usage</span></div>
     <div class="stripe-block stripe-purple"><span class="block-tag">BLOCK 4–N</span><span class="block-title">Inode Table</span><span class="block-size">Metadata Array</span></div>
     <div class="stripe-block stripe-rose"><span class="block-tag">DATA</span><span class="block-title">Data Blocks</span><span class="block-size">File Contents</span></div>
   </div>

2. Pointer & Tree Hierarchy Topology:
   <div class="pointer-topology">
     <div class="pointer-row">
       <div class="pointer-node"><span class="pointer-node-title">Inode Metadata</span><span class="pointer-node-sub">Mode, Ownership, Timestamps, 15 Pointers</span></div>
       <svg class="pointer-arrow-svg" width="36" height="20" viewBox="0 0 36 20" fill="none" stroke="currentColor" stroke-width="2"><line x1="2" y1="10" x2="30" y2="10"></line><polyline points="24 4 30 10 24 16"></polyline></svg>
       <div class="pointer-node"><span class="pointer-node-title">Direct Pointers (0–11)</span><span class="pointer-node-sub">4KB File Data Blocks</span></div>
     </div>
   </div>

3. Multi-Tier Subsystem Stack:
   <div class="arch-stack">
     <div class="stack-tier"><div class="tier-left"><span class="tier-badge badge-cyan">TIER 01</span><div><div class="tier-name">User Applications</div><div class="tier-sub">POSIX System Calls: open(), read(), stat()</div></div></div><div class="tier-chips"><span class="tier-chip">glibc</span><span class="tier-chip">VFS API</span></div></div>
   </div>

4. Terminal Shell with Real Commands:
   <div class="terminal-card">
     <div class="terminal-header"><div class="terminal-dots"><span class="terminal-dot dot-red"></span><span class="terminal-dot dot-yellow"></span><span class="terminal-dot dot-green"></span></div><span class="terminal-title">bash — storage runtime</span></div>
     <pre class="terminal-body"><code><span class="terminal-cmd">$ mkfs.ext4 testfs</span>
<span class="terminal-out">Creating filesystem with 65536 1k blocks and 16384 inodes...</span></code></pre>
   </div>

You have complete creative freedom to compose these primitives or generate clean inline SVGs to match the real technical data structures described in the document.

ABSOLUTE 100% TOPIC FIDELITY & SCHOLARLY HUMAN STANDARDS:
1. ZERO HARDCODED / PLACEHOLDER CONTENT: All titles, commands, flags, and cards MUST BE 100% EXTRACTED from the provided document context!
2. ZERO PROMPT METADATA: Never output "TARGET SLIDE COUNT", "PREFERRED THEME", or prompt directives in any slide!
3. ABSOLUTELY NO EMOJIS: Never output emojis anywhere. Use crisp inline SVG vector icons (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">...</svg>) or clean typography badges instead.
4. Output ONLY the <section class="slide${isActive ? " active" : ""}" id="slide${slideIndex}"> ... </section> tag. Always close the </section> tag.
5. MATHEMATICAL FORMULAS & NOTATION:
   - STRICT ZERO PSEUDO-MATH RULE: ONLY include a KaTeX equation block (<div class="equation-display">$$ ... $$</div>) if the source topic inherently involves genuine mathematical equations, formulas, or algorithmic complexity (e.g. RSA cryptography c = m^e mod n, calculus, linear algebra, physics dynamics, or Big-O bounds O(n log n)).
   - NEVER INVENT FAKE PSEUDO-MATH FOR CONCEPTUAL SLIDES: NEVER write formulas like "$$ S = \\text{Secure} \\iff (\\text{Confidentiality} \\cap \\text{Integrity}) $$" or boolean operations on English conceptual words. If a slide does not have genuine mathematics, DO NOT OUTPUT ANY equation-display or KaTeX block!
6. REAL TECHNICAL MECHANISMS (NO SYNTHETIC MOCK DATA):
   - Do NOT invent fake percentages (e.g. "30% Probability"), fake demographic ranges (e.g. "Ages 10–100"), or fake bracketed identifiers (e.g. "[User_X]", "[Database_Table_Y]"). If exact figures are not in the document, explain the concepts authoritatively using real domain terminology without making up numbers.
7. CLASSIC ACADEMIC RESTRAINT & ZERO INLINE RAINBOW OVERRIDES:
   - Rely strictly on clean pre-bundled CSS classes (.glass-card, .card-indigo, .card-emerald, .card-amber, .card-rose, .arch-stack, .stack-tier, .terminal-card, .points-list).
   - NEVER write inline rainbow overrides like style="border-top: 3px solid #f59e0b", style="color: #0ea5e9", or style="background: rgba(...)". Keep the styling dignified, authoritative, and clean (Oxford academic aesthetic).
8. Keep internal reasoning under 80 tokens. Output valid HTML directly.`;
}

/**
 * Validates that a slide is non-empty, contains complete HTML structure, and is NOT truncated.
 */
function isValidSlideHtml(html: string): boolean {
  if (!html) return false;
  let clean = html.trim().replace(/^```html\s*/i, "").replace(/```\s*$/i, "").trim();
  if (clean.length < 150) return false;

  // Check that it contains structural HTML content
  const hasContent =
    clean.includes("<div") ||
    clean.includes("<section") ||
    clean.includes("<table") ||
    clean.includes("<h2") ||
    clean.includes("slide-title") ||
    clean.includes("glass-card") ||
    clean.includes("terminal-card") ||
    clean.includes("motion-pipeline") ||
    clean.includes("layer-stack") ||
    clean.includes("stat-grid") ||
    clean.includes("flow-diagram") ||
    clean.includes("comparison-matrix");

  // Reject if it contains reasoning leak indicators or raw unfilled prompt templates
  const lower = clean.toLowerCase();
  if (
    lower.includes("from the storyboard") ||
    lower.includes("looking at the narrative") ||
    lower.includes("let's break down") ||
    lower.includes("we are to extract") ||
    lower.includes("[uppercase domain category]") ||
    lower.includes("[specific technical headline") ||
    lower.includes("[1-3 word uppercase category]") ||
    lower.includes("[natural, clear human explanation") ||
    lower.includes("[concrete explanation of invariants")
  ) {
    return false;
  }

  return hasContent;
}

/**
 * Post-processes slide HTML to eliminate AI buzzword slop, pseudo-math,
 * robotic participle subtitle clichés, and inline rainbow color overrides.
 */
export function sanitizeAiTone(slideHtml: string): string {
  if (!slideHtml || typeof slideHtml !== "string") return "";
  let clean = slideHtml;

  // 1. Sanitize category headers: remove pipe "|" and buzzwords like INVARIANTS, TAXONOMIES, TOPOLOGIES
  clean = clean.replace(
    /(<div class="slide-category">)([\s\S]*?)(<\/div>)/gi,
    (_, open, content, close) => {
      let cat = content.replace(/<[^>]*>/g, "").trim();
      if (cat.includes("|")) {
        cat = cat.split("|")[0].trim();
      } else if (cat.includes("—")) {
        cat = cat.split("—")[0].trim();
      }
      cat = cat.replace(/\s+(?:INVARIANTS?|TAXONOM(?:Y|IES)|TOPOLOG(?:Y|IES)|PRIMITIVES?|PARADIGMS?|SYSTEMICS?)\b/gi, "").trim();
      if (!cat) cat = "SYSTEM ARCHITECTURE";
      return `${open}${cat.toUpperCase()}${close}`;
    }
  );

  // 2. Strip pseudo-math equations (e.g. $$ S = \text{Secure} \iff (\text{Confidentiality} \cap \text{Integrity}) $$)
  clean = clean.replace(
    /(?:<div[^>]*>)?\s*<div class="equation-display"[^>]*>[\s\S]*?\$\$[\s\S]*?\$\$[\s\S]*?<\/div>\s*(?:<\/div>)?/gi,
    (fullEquationBlock) => {
      if (
        /\\text\{(?:Secure|Confidentiality|Integrity|Availability|Protection|Privacy|Trust|Safety|Defense|Authentication|Authorization)\}/i.test(fullEquationBlock) ||
        (/\\text\{[A-Za-z\s]{4,}\}/i.test(fullEquationBlock) && /(?:\\cap|\\cup|\\iff|\\implies|\\land|\\lor)/.test(fullEquationBlock))
      ) {
        return ""; // Strip pseudo-math block completely
      }
      return fullEquationBlock;
    }
  );

  // 3. Naturalize robotic participle subtitles
  clean = clean.replace(
    /(<p class="slide-subtitle">)([\s\S]*?)(<\/p>)/gi,
    (_, open, sub, close) => {
      let s = sub.trim();
      s = s.replace(/^(?:Establishing|Analyzing|Incorporating|Leveraging|Facilitating|Orchestrating|Delivering|Implementing)\s+(?:foundational\s+)?(?:enterprise\s+)?(?:systemic\s+)?/i, "");
      if (s.length > 0) {
        s = s.charAt(0).toUpperCase() + s.slice(1);
      }
      s = s.replace(/\bsystemic invariants\b/gi, "security guarantees");
      s = s.replace(/\boperational invariants\b/gi, "operational guarantees");
      s = s.replace(/\badversary threat taxonomies\b/gi, "adversary threat models");
      s = s.replace(/\bthreat taxonomies\b/gi, "threat models");
      s = s.replace(/\bstructural defense asymmetry\b/gi, "defense challenges");
      s = s.replace(/\bdefense asymmetry and threat topologies\b/gi, "defense challenges and attack surfaces");
      s = s.replace(/\blifecycle vulnerability vectors\b/gi, "vulnerability lifecycle");
      s = s.replace(/\bverification taxonomies\b/gi, "verification methods");
      s = s.replace(/\bruntime telemetry\b/gi, "runtime metrics");
      s = s.replace(/\bindividual privacy invariants\b/gi, "individual privacy boundaries");
      s = s.replace(/\bpervasive checks\b/gi, "cross-layer verification");
      return `${open}${s}${close}`;
    }
  );

  // 4. Strip hilarious AI demographic hallucinations and mock percentages
  clean = clean.replace(/Ages\s+10[–-]100,\s*/gi, "");
  clean = clean.replace(/<span\b[^>]*>\s*(?:30|40|20)%\s*Probability\s*<\/span>/gi, '<span class="badge badge-amber">CRITICAL</span>');

  // 5. Convert inline styled rainbow cards to classic academic classes
  clean = clean.replace(/<div class="card" style="border-top:\s*3px\s+solid\s+#f59e0b;[^"]*">/gi, '<div class="glass-card card-amber">');
  clean = clean.replace(/<div class="card" style="border-top:\s*3px\s+solid\s+#0ea5e9;[^"]*">/gi, '<div class="glass-card card-cyan">');
  clean = clean.replace(/<div class="card" style="border-top:\s*3px\s+solid\s+#f43f5e;[^"]*">/gi, '<div class="glass-card card-rose">');
  clean = clean.replace(/<div class="card" style="border-top:\s*3px\s+solid\s+#10b981;[^"]*">/gi, '<div class="glass-card card-emerald">');
  clean = clean.replace(/<div class="card" style="border-top:\s*3px\s+solid\s+#6366f1;[^"]*">/gi, '<div class="glass-card card-indigo">');

  // Strip inline background/border tints on stack-tier
  clean = clean.replace(/class="stack-tier" style="border-color:\s*rgba\([^)]+\);\s*background:\s*rgba\([^)]+\);?"/gi, 'class="stack-tier"');
  clean = clean.replace(/class="stack-tier" style="border-color:\s*rgba\([^)]+\);?"/gi, 'class="stack-tier"');

  // Strip bright inline color overrides on text that override academic themes
  clean = clean.replace(/style="color:\s*#(?:38bdf8|0ea5e9|818cf8|c7d2fe|cffafe|d1fae5);?"/gi, "");

  // Clean remaining instances of "invariants" in titles & table headers
  clean = clean.replace(/<span class="card-title">System Invariants<\/span>/gi, '<span class="card-title">Core Principles</span>');
  clean = clean.replace(/<span class="card-title">Operational Invariants<\/span>/gi, '<span class="card-title">Operational Guarantees</span>');
  clean = clean.replace(/<th>INVARIANT DETAIL<\/th>/gi, '<th>TECHNICAL SPECIFICATION</th>');
  clean = clean.replace(/<td>System Invariant<\/td>/gi, '<td>System Specification</td>');
  clean = clean.replace(/Privacy vs\.\s*Confidentiality Invariant/gi, "Privacy vs. Confidentiality Principles");

  return clean;
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
  const cleanDirective = sanitizeDocumentContent(slideDirective).replace(/\*\*/g, "").replace(/#{1,4}\s*/g, "");

  // Extract category
  let category = "SYSTEM ARCHITECTURE";
  const catMatch = cleanDirective.match(/(?:CATEGORY|SUBTITLE\s*&?\s*CATEGORY)\s*[:\-—]\s*([^\n]+)/i);
  if (catMatch && catMatch[1].trim().length >= 3) {
    category = catMatch[1].replace(/^[#*\s-]+/, "").trim().toUpperCase();
  }

  // Extract title cleanly
  let title = "";
  const titleMatches = Array.from(cleanDirective.matchAll(/(?:(?:^|\n)\s*(?:SLIDE\s+\d+|TITLE)\s*[:\-—]\s*)([^\n]+)/gi));
  for (const m of titleMatches) {
    let candidate = m[1].replace(/^[#*\s-]+/, "").trim();
    candidate = candidate.replace(/^(?:primary principle|operational focus|key parameters|invariants|visual spec)\s*[:\-—]\s*/i, "").trim();
    if (
      candidate.length >= 4 &&
      !/^(?:category|subtitle|narrative|content|photo|primary takeaway)/i.test(candidate) &&
      !/target\s+slide\s+count/i.test(candidate) &&
      !/preferred\s+theme/i.test(candidate) &&
      !/source\s+document/i.test(candidate) &&
      !/derived\s+directly/i.test(candidate)
    ) {
      title = candidate;
      break;
    }
  }
  if (!title) {
    const candidateLines = cleanDirective
      .split("\n")
      .map((l) => l.replace(/^[#*-\s0-9.:]+/, "").trim())
      .map((l) => l.replace(/^(?:primary principle|operational focus|key parameters|invariants|visual spec)\s*[:\-—]\s*/i, "").trim())
      .filter((l) =>
        l.length >= 6 &&
        !/^(?:slide|category|subtitle|narrative|content|photo|primary takeaway)/i.test(l) &&
        !/target\s+slide\s+count/i.test(l) &&
        !/preferred\s+theme/i.test(l) &&
        !/source\s+document/i.test(l) &&
        !/derived\s+directly/i.test(l)
      );
    title = candidateLines[0] || `${cleanTopic}: Technical Architecture`;
  }

  // Extract real content bullet points (filtering out meta-directives, but KEEPING the actual narrative and invariants!)
  const contentLines = cleanDirective
    .split("\n")
    .map((l) => l.replace(/^[\s*#\-–—0-9.:]+/, "").trim())
    .filter((l) => {
      if (l.length < 8) return false;
      const u = l.toUpperCase();
      return (
        !u.startsWith("SLIDE ") &&
        !u.startsWith("TARGET") &&
        !u.includes("SLIDE COUNT") &&
        !u.includes("PREFERRED THEME") &&
        !u.includes("SOURCE DOCUMENT")
      );
    })
    .map((l) => l.replace(/^(?:primary takeaway|takeaway|metric|formula|point|focus|narrative|invariants|visual_spec|visual|category|directive)\s*[:\-—]\s*/i, "").trim())
    .filter((l) => l.length >= 8);

  const p1 = contentLines[0] || `${cleanTopic}: Technical Architecture and Core Principles`;
  const p2 = contentLines[1] || `${cleanTopic}: Core Operational Mechanisms and Runtime Isolation`;
  const p3 = contentLines[2] || `${cleanTopic}: Quantitative Parameters, Commands and Configurations`;
  const p4 = contentLines[3] || `${cleanTopic}: Production Verification and Boundary Guarantees`;

  function extractShortPhrase(text: string, fallback: string): string {
    if (!text) return fallback;
    const parts = text.split(/[:\-\—]/);
    if (parts.length > 1 && parts[0].trim().length > 3 && parts[0].trim().length < 35) {
      return parts[0].trim();
    }
    const words = text.replace(/^[#*\-0-9.\s]+/, "").split(/\s+/).slice(0, 4).join(" ");
    return words.length > 3 ? words : fallback;
  }

  const cleanLower = cleanDirective.toLowerCase();
  const assigned = resolveVisualTemplate(cleanDirective, slideIndex);

  // Explicit Terminal Explorer always takes precedence
  if (assigned.id === "TEMPLATE_02_TERMINAL_CODE_EXPLORER") {
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
      <pre class="terminal-body"><span class="terminal-prompt">$</span> <span class="terminal-cmd">${p1.replace(/["`]/g, "")}</span>
<span class="terminal-out"># State inspection & verification:</span>
<span class="terminal-prompt">$</span> <span class="terminal-cmd">${p2.replace(/["`]/g, "")}</span></pre>
    </div>
    <div class="glass-card card-indigo">
      <div class="glass-card-header">
        <span class="card-title">Operational Guarantees</span>
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

  // Composable Primitive: Disk Block Stripe (ext4 block groups, superblocks, disk layouts)
  if (cleanLower.includes("block group") || cleanLower.includes("superblock") || cleanLower.includes("disk stripe") || cleanLower.includes("group descriptor")) {
    return `<section class="slide${isActive ? " active" : ""}" id="slide${slideIndex}">
  <div class="slide-title-group">
    <div class="slide-category">${category}</div>
    <h2 class="slide-title">${title}</h2>
    <p class="slide-subtitle">Structured on-disk layout and physical partition geometry.</p>
  </div>
  <div class="disk-stripe">
    <div class="stripe-block stripe-cyan"><span class="block-tag">BLOCK 0</span><span class="block-title">Superblock</span><span class="block-size">${extractShortPhrase(p1, "Fixed Parameters")}</span></div>
    <div class="stripe-block stripe-emerald"><span class="block-tag">BLOCK 1</span><span class="block-title">Group Descriptors</span><span class="block-size">${extractShortPhrase(p2, "Block Counts")}</span></div>
    <div class="stripe-block stripe-indigo"><span class="block-tag">BLOCK 2</span><span class="block-title">Block Bitmap</span><span class="block-size">Allocation Map</span></div>
    <div class="stripe-block stripe-amber"><span class="block-tag">BLOCK 3</span><span class="block-title">Inode Bitmap</span><span class="block-size">Inode Status</span></div>
    <div class="stripe-block stripe-purple"><span class="block-tag">BLOCK 4–N</span><span class="block-title">Inode Table</span><span class="block-size">${extractShortPhrase(p3, "Metadata Array")}</span></div>
    <div class="stripe-block stripe-rose"><span class="block-tag">DATA BLOCKS</span><span class="block-title">Data Storage</span><span class="block-size">${extractShortPhrase(p4, "File Contents")}</span></div>
  </div>
  <div class="glass-card card-cyan" style="margin-top:14px;">
    <div class="glass-card-header"><span class="card-title">Partition Structure</span><span class="badge badge-cyan">VERIFIED</span></div>
    <ul class="points-list"><li>${p1}</li><li>${p2}</li><li>${p3}</li></ul>
  </div>
</section>`;
  }

  // Composable Primitive: Pointer & Tree Hierarchy (Inodes, Directory trees, Pointers)
  if (cleanLower.includes("pointer") || cleanLower.includes("indirect") || cleanLower.includes("direct blocks") || cleanLower.includes("inode hierarchy") || cleanLower.includes("inode structure") || cleanLower.includes("inodes")) {
    const n1 = extractShortPhrase(p1, "Inode (Index Node)");
    const n2 = extractShortPhrase(p2, "Direct Pointers (0–11)");
    const n3 = extractShortPhrase(p3, "Single Indirect");
    const n4 = extractShortPhrase(p4, "Double Indirect");

    return `<section class="slide${isActive ? " active" : ""}" id="slide${slideIndex}">
  <div class="slide-title-group">
    <div class="slide-category">${category}</div>
    <h2 class="slide-title">${title}</h2>
    <p class="slide-subtitle">Hierarchical pointer resolution and direct/indirect block indexing.</p>
  </div>
  <div class="pointer-topology">
    <div class="pointer-row">
      <div class="pointer-node" style="border-color: rgba(56,189,248,0.4);"><span class="pointer-node-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:-2px;margin-right:6px;"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>${n1}</span><span class="pointer-node-sub">${p1}</span></div>
      <svg class="pointer-arrow-svg" width="36" height="20" viewBox="0 0 36 20" fill="none" stroke="currentColor" stroke-width="2"><line x1="2" y1="10" x2="30" y2="10"></line><polyline points="24 4 30 10 24 16"></polyline></svg>
      <div class="pointer-node" style="border-color: rgba(16,185,129,0.4);"><span class="pointer-node-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:-2px;margin-right:6px;"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>${n2}</span><span class="pointer-node-sub">${p2}</span></div>
    </div>
    <div class="pointer-row">
      <div class="pointer-node" style="border-color: rgba(129,140,248,0.4);"><span class="pointer-node-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:-2px;margin-right:6px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>${n3}</span><span class="pointer-node-sub">${p3}</span></div>
      <svg class="pointer-arrow-svg" width="36" height="20" viewBox="0 0 36 20" fill="none" stroke="currentColor" stroke-width="2"><line x1="2" y1="10" x2="30" y2="10"></line><polyline points="24 4 30 10 24 16"></polyline></svg>
      <div class="pointer-node" style="border-color: rgba(245,158,11,0.4);"><span class="pointer-node-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:-2px;margin-right:6px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>${n4}</span><span class="pointer-node-sub">${p4}</span></div>
    </div>
  </div>
</section>`;
  }

  // Composable Primitive: Subsystem Architecture Stack (VFS, virtual filesystem, mount hierarchy)
  if (cleanLower.includes("vfs") || cleanLower.includes("virtual filesystem") || cleanLower.includes("mount hierarchy") || cleanLower.includes("mount point") || cleanLower.includes("filesystem mount")) {
    return `<section class="slide${isActive ? " active" : ""}" id="slide${slideIndex}">
  <div class="slide-title-group">
    <div class="slide-category">${category}</div>
    <h2 class="slide-title">${title}</h2>
    <p class="slide-subtitle">Multi-tier subsystem abstraction and unified filesystem interface.</p>
  </div>
  <div class="arch-stack">
    <div class="stack-tier" style="border-color:rgba(56,189,248,0.3);"><div class="tier-left"><span class="tier-badge badge-cyan">TIER 01</span><div><div class="tier-name">User Applications</div><div class="tier-sub">POSIX System Calls: open(), read(), write(), stat()</div></div></div><div class="tier-chips"><span class="tier-chip">glibc</span><span class="tier-chip">API Interface</span></div></div>
    <div class="stack-tier" style="border-color:rgba(16,185,129,0.3);"><div class="tier-left"><span class="tier-badge badge-emerald">TIER 02</span><div><div class="tier-name">Virtual Filesystem Switch (VFS) &amp; Caches</div><div class="tier-sub">Uniform abstraction layer over all concrete filesystem drivers</div></div></div><div class="tier-chips"><span class="tier-chip">Page Cache</span><span class="tier-chip">Dentry Cache</span><span class="tier-chip">Inode Cache</span></div></div>
    <div class="stack-tier" style="border-color:rgba(129,140,248,0.3);"><div class="tier-left"><span class="tier-badge badge-indigo">TIER 03</span><div><div class="tier-name">Concrete Filesystem Drivers</div><div class="tier-sub">${p1}</div></div></div><div class="tier-chips"><span class="tier-chip">ext4</span><span class="tier-chip">Reiser4</span><span class="tier-chip">procfs</span><span class="tier-chip">tmpfs</span></div></div>
    <div class="stack-tier" style="border-color:rgba(245,158,11,0.3);"><div class="tier-left"><span class="tier-badge badge-amber">TIER 04</span><div><div class="tier-name">Block Layer &amp; Storage Hardware</div><div class="tier-sub">${p2}</div></div></div><div class="tier-chips"><span class="tier-chip">Buffer Cache</span><span class="tier-chip">Device Drivers</span></div></div>
  </div>
</section>`;
  }

  if (assigned.id === "TEMPLATE_03_CODE_DIFF_EVOLUTION") {
    return `<section class="slide${isActive ? " active" : ""}" id="slide${slideIndex}">
  <div class="slide-title-group">
    <div class="slide-category">${category}</div>
    <h2 class="slide-title">${title}</h2>
    <p class="slide-subtitle">Comparative environment execution and boundary enforcement.</p>
  </div>
  <div class="diff-container">
    <div class="diff-pane">
      <div class="diff-header"><span style="color:#f43f5e;font-weight:700;">Baseline / Host View</span><span class="badge badge-rose">UNISOLATED</span></div>
      <pre class="terminal-body"><span class="terminal-prompt">$</span> <span class="terminal-cmd">${p1.replace(/["`]/g, "")}</span>
<span class="terminal-out"># Shared host environment state</span></pre>
    </div>
    <div class="diff-pane" style="border-color:rgba(16,185,129,0.4);">
      <div class="diff-header"><span style="color:#10b981;font-weight:700;">Isolated Namespace View</span><span class="badge badge-emerald">ISOLATED</span></div>
      <pre class="terminal-body"><span class="terminal-prompt">$</span> <span class="terminal-cmd">${p2.replace(/["`]/g, "")}</span>
<span class="terminal-highlight"># Encapsulated state partition</span></pre>
    </div>
  </div>
</section>`;
  }

  if (assigned.id === "TEMPLATE_15_HIERARCHICAL_LAYER_STACK") {
    return `<section class="slide${isActive ? " active" : ""}" id="slide${slideIndex}">
  <div class="slide-title-group">
    <div class="slide-category">${category}</div>
    <h2 class="slide-title">${title}</h2>
    <p class="slide-subtitle">Hierarchical abstraction layers and encapsulation boundaries.</p>
  </div>
  <div class="layer-stack">
    <div class="layer-item card-cyan"><div class="layer-left"><span class="layer-num">TIER 01</span><div><div class="layer-title">Application Layer</div><div class="layer-desc">${p1}</div></div></div><span class="badge badge-cyan">USERSPACE</span></div>
    <div class="layer-item card-emerald"><div class="layer-left"><span class="layer-num">TIER 02</span><div><div class="layer-title">Runtime & Isolation Boundary</div><div class="layer-desc">${p2}</div></div></div><span class="badge badge-emerald">CONTAINER</span></div>
    <div class="layer-item card-indigo"><div class="layer-left"><span class="layer-num">TIER 03</span><div><div class="layer-title">Kernel Subsystems (Namespaces & cgroups)</div><div class="layer-desc">${p3}</div></div></div><span class="badge badge-indigo">KERNEL</span></div>
    <div class="layer-item card-amber"><div class="layer-left"><span class="layer-num">TIER 04</span><div><div class="layer-title">Physical Hardware & Network Fabric</div><div class="layer-desc">${p4}</div></div></div><span class="badge badge-amber">HOST</span></div>
  </div>
</section>`;
  }

  if (assigned.id === "TEMPLATE_12_QUAD_METRIC_DASHBOARD") {
    return `<section class="slide${isActive ? " active" : ""}" id="slide${slideIndex}">
  <div class="slide-title-group">
    <div class="slide-category">${category}</div>
    <h2 class="slide-title">${title}</h2>
    <p class="slide-subtitle">Quantitative operational parameters and benchmark metrics.</p>
  </div>
  <div class="stat-grid">
    <div class="stat-card card-emerald"><span class="stat-lbl">Primary Mechanism</span><span class="stat-val val-emerald">01</span><span class="stat-sub">${p1}</span></div>
    <div class="stat-card card-cyan"><span class="stat-lbl">Execution Performance</span><span class="stat-val val-cyan">100%</span><span class="stat-sub">${p2}</span></div>
    <div class="stat-card card-indigo"><span class="stat-lbl">Isolation Boundary</span><span class="stat-val val-indigo">SECURE</span><span class="stat-sub">${p3}</span></div>
    <div class="stat-card card-amber"><span class="stat-lbl">Reliability Threshold</span><span class="stat-val val-amber">VERIFIED</span><span class="stat-sub">${p4}</span></div>
  </div>
</section>`;
  }

  if (assigned.id === "TEMPLATE_11_TRI_CARD_CONCEPT_GRID") {
    return `<section class="slide${isActive ? " active" : ""}" id="slide${slideIndex}">
  <div class="slide-title-group">
    <div class="slide-category">${category}</div>
    <h2 class="slide-title">${title}</h2>
    <p class="slide-subtitle">Tri-pillar conceptual breakdown and structural properties.</p>
  </div>
  <div class="grid-3">
    <div class="glass-card card-emerald">
      <div class="glass-card-header"><span class="card-title">Foundational Tier</span><span class="badge badge-emerald">ACTIVE</span></div>
      <p class="card-desc">${p1}</p>
    </div>
    <div class="glass-card card-cyan">
      <div class="glass-card-header"><span class="card-title">Runtime Mechanics</span><span class="badge badge-cyan">VERIFIED</span></div>
      <p class="card-desc">${p2}</p>
    </div>
    <div class="glass-card card-indigo">
      <div class="glass-card-header"><span class="card-title">System Guarantee</span><span class="badge badge-indigo">ENFORCED</span></div>
      <p class="card-desc">${p3}</p>
    </div>
  </div>
</section>`;
  }

  if (assigned.id === "TEMPLATE_19_PRO_CON_TRADE_OFF_STUDY") {
    return `<section class="slide${isActive ? " active" : ""}" id="slide${slideIndex}">
  <div class="slide-title-group">
    <div class="slide-category">${category}</div>
    <h2 class="slide-title">${title}</h2>
    <p class="slide-subtitle">Architectural advantages balanced against operational constraints.</p>
  </div>
  <div class="grid-2">
    <div class="glass-card card-emerald">
      <div class="glass-card-header"><span class="card-title">Architectural Advantages</span><span class="badge badge-emerald">BENEFITS</span></div>
      <ul class="points-list"><li>${p1}</li><li>${p2}</li></ul>
    </div>
    <div class="glass-card card-rose">
      <div class="glass-card-header"><span class="card-title">Operational Constraints</span><span class="badge badge-rose">TRADE-OFFS</span></div>
      <ul class="points-list"><li>${p3}</li><li>${p4}</li></ul>
    </div>
  </div>
</section>`;
  }

  if (assigned.id === "TEMPLATE_20_EXECUTIVE_CHECKLIST_SUMMARY") {
    return `<section class="slide${isActive ? " active" : ""}" id="slide${slideIndex}">
  <div class="slide-title-group">
    <div class="slide-category">${category}</div>
    <h2 class="slide-title">${title}</h2>
    <p class="slide-subtitle">Key architectural takeaways, verified guarantees, and deployment specifications.</p>
  </div>
  <div class="checklist-group">
    <div class="check-item"><div class="check-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg></div><div class="check-content"><div class="check-title">Foundational Principle</div><div class="check-desc">${p1}</div></div></div>
    <div class="check-item"><div class="check-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg></div><div class="check-content"><div class="check-title">Runtime Isolation</div><div class="check-desc">${p2}</div></div></div>
    <div class="check-item"><div class="check-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg></div><div class="check-content"><div class="check-title">Boundary Verification</div><div class="check-desc">${p3}</div></div></div>
    <div class="check-item"><div class="check-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg></div><div class="check-content"><div class="check-title">Operational Guarantee</div><div class="check-desc">${p4}</div></div></div>
  </div>
</section>`;
  }

  if (assigned.id === "TEMPLATE_04_SEQUENTIAL_PIPELINE_4" || assigned.id === "TEMPLATE_05_STREAMLINED_PIPELINE_3") {
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
    <span class="pipeline-tag"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline;vertical-align:-1px;margin-right:4px;"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polyline></svg>SYSTEM EXECUTION PIPELINE</span>
    <button class="sim-play-btn" onclick="simulatePipelineFlow(this)"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="display:inline;vertical-align:-1px;margin-right:4px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>Simulate Flow</button>
  </div>
  <div class="motion-pipeline">
    <div class="pipeline-stage stage-emerald">
      <span class="stage-num">STAGE 01</span>
      <div class="stage-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg></div>
      <div class="stage-title">${s1Title}</div>
      <div class="stage-desc">${p1}</div>
    </div>
    <div class="pipeline-connector"><div class="packet-pulse packet-emerald"></div></div>
    <div class="pipeline-stage stage-cyan">
      <span class="stage-num">STAGE 02</span>
      <div class="stage-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg></div>
      <div class="stage-title">${s2Title}</div>
      <div class="stage-desc">${p2}</div>
    </div>
    <div class="pipeline-connector"><div class="packet-pulse packet-cyan"></div></div>
    <div class="pipeline-stage stage-indigo">
      <span class="stage-num">STAGE 03</span>
      <div class="stage-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg></div>
      <div class="stage-title">${s3Title}</div>
      <div class="stage-desc">${p3}</div>
    </div>
    <div class="pipeline-connector"><div class="packet-pulse packet-amber"></div></div>
    <div class="pipeline-stage stage-amber">
      <span class="stage-num">STAGE 04</span>
      <div class="stage-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>
      <div class="stage-title">${s4Title}</div>
      <div class="stage-desc">${p4}</div>
    </div>
  </div>
</section>`;
  }

  if (assigned.id === "TEMPLATE_09_COMPARISON_MATRIX_TABLE") {
    return `<section class="slide${isActive ? " active" : ""}" id="slide${slideIndex}">
  <div class="slide-title-group">
    <div class="slide-category">${category}</div>
    <h2 class="slide-title">${title}</h2>
    <p class="slide-subtitle">Architectural comparison matrix and verified specifications.</p>
  </div>
  <div class="glass-card">
    <table class="matrix-table">
      <thead>
        <tr><th>EVALUATION ATTRIBUTE</th><th>STATUS</th><th>TECHNICAL SPECIFICATION</th></tr>
      </thead>
      <tbody>
        <tr><td>Primary Foundation</td><td><span class="badge badge-emerald">ACTIVE</span></td><td>${p1}</td></tr>
        <tr><td>Runtime Performance</td><td><span class="badge badge-cyan">VERIFIED</span></td><td>${p2}</td></tr>
        <tr><td>Fault Recovery</td><td><span class="badge badge-amber">PROTECTED</span></td><td>${p3}</td></tr>
        <tr><td>System Specification</td><td><span class="badge badge-rose">MONITORED</span></td><td>${p4}</td></tr>
      </tbody>
    </table>
  </div>
</section>`;
  }

  if (assigned.id === "TEMPLATE_06_CONNECTED_TOPOLOGY_FLOW") {
    const e1 = extractShortPhrase(p1, "Client / Input Node");
    const e2 = extractShortPhrase(p2, "Gateway / Ingress");
    const e3 = extractShortPhrase(p3, "Execution Engine");
    const e4 = extractShortPhrase(p4, "Storage / Persistence");

    return `<section class="slide${isActive ? " active" : ""}" id="slide${slideIndex}">
  <div class="slide-title-group">
    <div class="slide-category">${category}</div>
    <h2 class="slide-title">${title}</h2>
    <p class="slide-subtitle">Connected architectural flow topology and subsystem interfaces.</p>
  </div>
  <div class="flow-diagram">
    <div class="flow-step card-emerald">
      <div class="flow-node"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg></div>
      <div style="font-size:15px;font-weight:700;color:#fff;">${e1}</div>
      <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">${p1}</div>
    </div>
    <div class="flow-arrow"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></div>
    <div class="flow-step card-cyan">
      <div class="flow-node"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="6" height="6" rx="1"></rect><rect x="16" y="2" width="6" height="6" rx="1"></rect><rect x="9" y="16" width="6" height="6" rx="1"></rect><path d="M5 8v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"></path><line x1="12" y1="13" x2="12" y2="16"></line></svg></div>
      <div style="font-size:15px;font-weight:700;color:#fff;">${e2}</div>
      <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">${p2}</div>
    </div>
    <div class="flow-arrow"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></div>
    <div class="flow-step card-indigo">
      <div class="flow-node"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div>
      <div style="font-size:15px;font-weight:700;color:#fff;">${e3}</div>
      <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">${p3}</div>
    </div>
    <div class="flow-arrow"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></div>
    <div class="flow-step card-amber">
      <div class="flow-node"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line></svg></div>
      <div style="font-size:15px;font-weight:700;color:#fff;">${e4}</div>
      <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">${p4}</div>
    </div>
  </div>
</section>`;
  }

  // Default: TEMPLATE_01_HERO_SPLIT_OVERVIEW
  return `<section class="slide${isActive ? " active" : ""}" id="slide${slideIndex}">
  <div class="slide-title-group">
    <div class="slide-category">${category}</div>
    <h2 class="slide-title">${title}</h2>
    <p class="slide-subtitle">Core architectural principles and operational mechanisms.</p>
  </div>
  <div class="grid-split">
    <div class="glass-card card-emerald">
      <div class="glass-card-header">
        <span class="card-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:-3px;margin-right:6px;"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>${extractShortPhrase(p1, "Core Principle")}</span>
        <span class="badge badge-emerald">PRIMARY</span>
      </div>
      <p class="card-desc">${p1}</p>
      <ul class="points-list"><li>${p2}</li><li>${p3}</li></ul>
    </div>
    <div class="glass-card card-cyan">
      <div class="glass-card-header">
        <span class="card-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:-3px;margin-right:6px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>Operational Principles</span>
        <span class="badge badge-cyan">VERIFIED</span>
      </div>
      <ul class="points-list"><li>${p3}</li><li>${p4}</li></ul>
    </div>
  </div>
</section>`;
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
  callbacks: Stage3Callbacks,
  engine: "gemini" | "nvidia" | "auto" = "auto"
): Promise<{ rawSlides: string; activeModel: string }> {
  const apiKey = config.nvidiaApiKeyUltra || config.nvidiaApiKey;
  const openai = new OpenAI({
    apiKey,
    baseURL: config.nvidiaBaseUrl,
  });

  const slideSections = parseStoryboardIntoSlides(storyboardText, targetCount, analysisText);
  const effectiveCount = Math.max(slideSections.length, targetCount);
  const shouldUseGemini = (engine === "gemini" || engine === "auto") && geminiService.isAvailable();
  let activeModel = shouldUseGemini ? `google/${geminiService.getModel()}` : MODEL_SUPER;

  console.log(`[Stage3CreativeGenerator] Concurrently synthesizing ${effectiveCount} slides with ${activeModel}...`);
  callbacks.onChunk(`\n[Model 3: ${activeModel}] Initiating concurrent synthesis across ${effectiveCount} slide sections...\n`);

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

    // Attempt 0: Gemini 3.8 Flash (Ultra-fast concurrent generation)
    if (shouldUseGemini) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 35000);
        let contentAcc = "";
        try {
          contentAcc = await geminiService.streamChat({
            messages: [
              {
                role: "system",
                content:
                  "You are an elite Keynote Presentation Visual Designer. You output ONLY the valid HTML <section class='slide'> block. Keep internal reasoning to under 80 tokens. Begin outputting HTML immediately.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.35,
            maxTokens: 4000,
            signal: controller.signal,
            onReasoning: (reasoning) => callbacks.onReasoning(reasoning),
            onChunk: (delta) => {
              contentAcc += delta;
            },
          });
        } finally {
          clearTimeout(timer);
        }

        if (isValidSlideHtml(contentAcc)) {
          slideHtml = contentAcc;
          attemptSuccess = true;
        }
      } catch (geminiErr: any) {
        console.warn(`[Stage3CreativeGenerator] Slide ${i + 1} Gemini error (${geminiErr?.message}). Retrying with Nemotron...`);
      }
    }

    // Attempt 1: Active Super Model
    if (!attemptSuccess) {
      try {
        slideHtml = await callModel(MODEL_SUPER);
        if (isValidSlideHtml(slideHtml)) {
          attemptSuccess = true;
          activeModel = MODEL_SUPER;
        }
      } catch (err: any) {
        console.warn(`[Stage3CreativeGenerator] Slide ${i + 1} super model error (${err?.message}). Retrying with fallback...`);
      }
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

    // Clean up slide tags, eliminate CoT monologue, and ensure proper </section> closing
    let cleanSlide = slideHtml.trim();
    cleanSlide = cleanSlide.replace(/^```html\s*/i, "").replace(/```\s*$/i, "").trim();

    const isActive = i === 0;
    const expectedOpen = `<section class="slide${isActive ? " active" : ""}" id="slide${i}">`;

    // 1. Locate opening <section> or first opening tag
    const openSecIdx = cleanSlide.indexOf("<section");
    if (openSecIdx >= 0) {
      cleanSlide = cleanSlide.slice(openSecIdx);
    }
    // Strip opening section tag to inspect body
    cleanSlide = cleanSlide.replace(/^<section\b[^>]*>/i, "").trim();

    // 2. Strip any preamble before the first opening <div
    const firstDivIdx = cleanSlide.indexOf("<div");
    if (firstDivIdx > 0) {
      const preamble = cleanSlide.slice(0, firstDivIdx);
      if (!preamble.includes("<h") && !preamble.includes("<p")) {
        cleanSlide = cleanSlide.slice(firstDivIdx).trim();
      }
    }

    // 3. Remove raw CoT monologue paragraphs/lines that leak into the slide
    cleanSlide = cleanSlide.replace(/(?:^|\n)\s*(?:From the storyboard|Looking at the narrative|We are to extract|Let's break down|We can form|Note that:|In this slide)[^\n<]+(?:\n|$)/gi, "\n");

    cleanSlide = `${expectedOpen}\n${cleanSlide}`;

    // 4. Ensure proper </section> closing
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

    // 5. Sanitize AI tone: strip pseudo-math, buzzwords, and inline rainbow overrides
    cleanSlide = sanitizeAiTone(cleanSlide);

    callbacks.onChunk(`\n/* Slide ${i + 1}/${effectiveCount} ready */\n${cleanSlide}\n`);
    console.log(`[Stage3CreativeGenerator] Slide ${i + 1}/${effectiveCount} ready (${cleanSlide.length} chars).`);
    return cleanSlide;
  };

  // Run slide syntheses with pooled concurrency (up to 6 parallel workers) for resilience up to 20+ slides
  const generatedSlides: string[] = new Array(effectiveCount);
  const queue = Array.from({ length: effectiveCount }, (_, idx) => idx);
  const CONCURRENCY_LIMIT = 6;

  const worker = async () => {
    while (queue.length > 0) {
      const idx = queue.shift();
      if (idx !== undefined) {
        generatedSlides[idx] = await synthesizeSlideSection(idx);
      }
    }
  };

  const workers = Array.from(
    { length: Math.min(CONCURRENCY_LIMIT, effectiveCount) },
    () => worker()
  );
  await Promise.all(workers);

  const combinedSlides = generatedSlides.join("\n\n");
  return { rawSlides: combinedSlides, activeModel };
}
