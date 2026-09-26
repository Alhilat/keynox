import { z } from "zod";

/**
 * Formal Visual Interaction Archetype Identifiers.
 * Each archetype represents a structural interaction & visual topology contract.
 */
export const VisualArchetypeIdSchema = z.enum([
  "interactive-simulator",
  "equation-morpher",
  "motion-pipeline",
  "benchmark-matrix",
  "code-terminal",
  "architecture-topology",
  "hero-split-overview",
  "3d-webgl-model",
  "bento-dashboard",
  "timeline-milestone",
  "hero-cinematic",
  "quote-spotlight",
  "code-diff-pane",
  "state-machine-fsm",
  "disk-memory-layout",
  "tree-hierarchy",
  "stat-dashboard-grid",
  "spatial-dual-plane",
  "mechanism-prism",
  "anatomy-map",
]);

export type VisualArchetypeId = z.infer<typeof VisualArchetypeIdSchema>;

export const ArchetypeComplexitySchema = z.enum(["simple", "complex"]);
export type ArchetypeComplexity = z.infer<typeof ArchetypeComplexitySchema>;

/**
 * Definition and structural contract for a visual archetype.
 */
export const VisualArchetypeDefinitionSchema = z.object({
  id: VisualArchetypeIdSchema,
  name: z.string(),
  category: z.enum([
    "simulation",
    "mathematics",
    "system-flow",
    "comparison",
    "software",
    "overview",
  ]),
  description: z.string(),
  requiredElements: z.array(z.string()),
  complexityLevel: ArchetypeComplexitySchema,
});

export type VisualArchetypeDefinition = z.infer<typeof VisualArchetypeDefinitionSchema>;

/**
 * The Central Registry of Visual Archetypes (Ideas Catalog).
 * Provides models with rich visual interaction patterns while maintaining 100% topic fidelity.
 */
export const ARCHETYPE_REGISTRY: Record<VisualArchetypeId, VisualArchetypeDefinition> = {
  "interactive-simulator": {
    id: "interactive-simulator",
    name: "Interactive Slider & Canvas Simulator",
    category: "simulation",
    description: "Range inputs driving dynamic calculations and live 2D canvas visualization (physics, signal processing, parameter dynamics).",
    requiredElements: ["<input type='range'>", "<canvas>", "recalculate() function", "live readouts"],
    complexityLevel: "complex",
  },
  "equation-morpher": {
    id: "equation-morpher",
    name: "Step-by-Step Mathematical Derivation",
    category: "mathematics",
    description: "Deep mathematical formulation with highlighted variable tokens, LaTeX formulas, and step-by-step term transformations.",
    requiredElements: [".equation-block", "KaTeX formulas", ".math-token", "transformation breakdown"],
    complexityLevel: "complex",
  },
  "motion-pipeline": {
    id: "motion-pipeline",
    name: "Connected Data Topology Conduit",
    category: "system-flow",
    description: "Multi-stage execution conduit with connected stages, glowing packet pulses, and state transition badges.",
    requiredElements: [".motion-pipeline", ".pipeline-stage", ".stage-num", ".stage-desc"],
    complexityLevel: "complex",
  },
  "benchmark-matrix": {
    id: "benchmark-matrix",
    name: "Interactive Benchmark & Tradeoff Matrix",
    category: "comparison",
    description: "High-density technical comparison table highlighting structural tradeoffs, complexity bounds, and metrics.",
    requiredElements: [".matrix-table", "th headers", "td cells with metric badges", ".tradeoff-summary"],
    complexityLevel: "simple",
  },
  "code-terminal": {
    id: "code-terminal",
    name: "Live CLI Terminal & Code Explorer",
    category: "software",
    description: "Syntax-highlighted executable code block paired with an active command line interface and execution console.",
    requiredElements: [".terminal-card", ".code-header", ".terminal-dots", "syntax-highlighted code"],
    complexityLevel: "complex",
  },
  "architecture-topology": {
    id: "architecture-topology",
    name: "Hierarchical Architecture Stack",
    category: "system-flow",
    description: "Layered subsystem stack showing isolation boundaries, containment tiers, and component interaction channels.",
    requiredElements: [".arch-stack", ".arch-tier", ".tier-label", ".boundary-indicator"],
    complexityLevel: "complex",
  },
  "hero-split-overview": {
    id: "hero-split-overview",
    name: "Executive Overview & Takeaway Grid",
    category: "overview",
    description: "High-impact visual split layout pairing the core problem statement with structured takeaway cards.",
    requiredElements: [".grid-split", ".glass-card", ".badge", "structured bullet points"],
    complexityLevel: "simple",
  },
  "3d-webgl-model": {
    id: "3d-webgl-model",
    name: "3D Spatial & Vector Field Visualizer",
    category: "simulation",
    description: "Three.js interactive WebGL canvas visualizing spatial geometry, vector fields, or particle flow dynamics.",
    requiredElements: [".three-container", "WebGL renderer initialization", "requestAnimationFrame loop"],
    complexityLevel: "complex",
  },
  "bento-dashboard": {
    id: "bento-dashboard",
    name: "Multi-Metric Bento Visual Dashboard",
    category: "overview",
    description: "Asymmetric grid of mixed-size cards, stat widgets, and telemetry panels providing an executive high-density visual summary.",
    requiredElements: [".bento-grid", ".bento-wide or .bento-tall", ".stat-val", "metric telemetry panels"],
    complexityLevel: "simple",
  },
  "timeline-milestone": {
    id: "timeline-milestone",
    name: "Sequential Process & Milestone Journey",
    category: "system-flow",
    description: "Horizontal stepped progression showing evolutionary phases, sequence numbers, connected milestone nodes, and state descriptions.",
    requiredElements: [".timeline-journey", ".timeline-step", ".timeline-node", "sequential phase descriptions"],
    complexityLevel: "simple",
  },
  "hero-cinematic": {
    id: "hero-cinematic",
    name: "Cinematic Full-Bleed Executive Statement",
    category: "overview",
    description: "Massive centered title typography, subtle glowing backdrop mesh, and single high-impact technical directive block without repetitive cards.",
    requiredElements: [".hero-cinematic", ".hero-headline", ".hero-subhead", "single takeaway panel"],
    complexityLevel: "simple",
  },
  "quote-spotlight": {
    id: "quote-spotlight",
    name: "Thesis & Domain Core Concept Spotlight",
    category: "overview",
    description: "High-contrast thesis callout panel with bold typography, vertical cyan border accent, paired with domain context details.",
    requiredElements: [".quote-spotlight", ".quote-text", ".quote-author", "context detail panel"],
    complexityLevel: "simple",
  },
  "code-diff-pane": {
    id: "code-diff-pane",
    name: "Side-by-Side Code Diff & Evolution",
    category: "software",
    description: "Split panel showing before/after code evolution with syntax highlighting, deletion/addition markers, and architectural annotations.",
    requiredElements: [".diff-container", ".diff-pane", "before vs after panels", "diff annotations"],
    complexityLevel: "complex",
  },
  "state-machine-fsm": {
    id: "state-machine-fsm",
    name: "State Transition Diagram & FSM Engine",
    category: "system-flow",
    description: "Visual state machine showing discrete system states, transition conditions, trigger events, and interactive active state switcher.",
    requiredElements: [".state-diagram", ".state-node", ".state-arrow", ".state-switcher"],
    complexityLevel: "complex",
  },
  "disk-memory-layout": {
    id: "disk-memory-layout",
    name: "Memory Block & Physical Layout Stripe",
    category: "system-flow",
    description: "Horizontal segment stripe illustrating memory layouts, disk block partitions, packet byte headers, or cache line structures.",
    requiredElements: [".disk-stripe", ".stripe-block", ".block-tag", ".block-size"],
    complexityLevel: "simple",
  },
  "tree-hierarchy": {
    id: "tree-hierarchy",
    name: "Hierarchical Tree & Index Topology",
    category: "system-flow",
    description: "Connected node-pointer tree hierarchy showing parent-child node relationships, B-Tree splits, or AST syntactic decompositions.",
    requiredElements: [".pointer-topology", ".pointer-row", ".pointer-node", "connecting arrows"],
    complexityLevel: "complex",
  },
  "stat-dashboard-grid": {
    id: "stat-dashboard-grid",
    name: "Executive KPI & Metric Dashboard",
    category: "comparison",
    description: "High-impact visual telemetry grid with oversized metric callouts, trend indicators, and domain benchmark counters.",
    requiredElements: [".stat-grid", ".stat-card", ".stat-val", ".stat-lbl"],
    complexityLevel: "simple",
  },
  "spatial-dual-plane": {
    id: "spatial-dual-plane",
    name: "Dual-Plane Spatial Isolation & Horizon Membrane",
    category: "system-flow",
    description: "Dual spatial zones (e.g. Host vs Isolated, Kernel vs User, Cytoplasm vs Nucleus) separated by a dashed boundary membrane with interacting entities.",
    requiredElements: [".dual-plane", ".plane-zone-host", ".plane-zone-isolated", ".boundary-barrier", ".plane-node"],
    complexityLevel: "complex",
  },
  "mechanism-prism": {
    id: "mechanism-prism",
    name: "Transformation Mechanism Prism",
    category: "system-flow",
    description: "Three-stage visual conduit mapping an input data/state stream through an active central transformation prism core into a new output state.",
    requiredElements: [".mechanism-prism", ".prism-input", ".prism-core", ".prism-output"],
    complexityLevel: "complex",
  },
  "anatomy-map": {
    id: "anatomy-map",
    name: "Visual Anatomy Map & Spatial Callout Model",
    category: "system-flow",
    description: "Prominent 2D physical, biological, or digital model occupying the majority of the slide with numbered callout pins and precision annotations.",
    requiredElements: [".anatomy-map", ".anatomy-stage", ".callout-list", ".callout-item"],
    complexityLevel: "complex",
  },
};

/**
 * Extracts a valid VisualArchetypeId from an arbitrary text string (or returns fallback).
 */
export function normalizeArchetypeId(rawString?: string): VisualArchetypeId {
  if (!rawString) return "hero-split-overview";
  const cleaned = rawString.trim().toLowerCase();
  if (cleaned in ARCHETYPE_REGISTRY) {
    return cleaned as VisualArchetypeId;
  }
  if (/\b(?:dual-plane|isolation-membrane|barrier|host-isolated|kernel-user)\b/i.test(cleaned)) {
    return "spatial-dual-plane";
  }
  if (/\b(?:mechanism-prism|translation-prism|prism-core|transform(?:ation)?-prism)\b/i.test(cleaned)) {
    return "mechanism-prism";
  }
  if (/\b(?:anatomy-map|spatial-anatomy|callout-map|schematic-map)\b/i.test(cleaned)) {
    return "anatomy-map";
  }
  if (/\b(?:simulat(?:or|ion)?|slider|physics-slider|live-sim)\b/i.test(cleaned)) {
    return "interactive-simulator";
  }
  if (/\b(?:equation(?:s)?|math(?:ematical)?|formula(?:s)?|derivation|katex)\b/i.test(cleaned)) {
    return "equation-morpher";
  }
  if (/\b(?:pipeline|flow-pipeline|conduit|multi-stage)\b/i.test(cleaned)) {
    return "motion-pipeline";
  }
  if (/\b(?:benchmark|matrix|comparison-matrix|tradeoff(?:s)?)\b/i.test(cleaned)) {
    return "benchmark-matrix";
  }
  if (/\b(?:terminal|console|bash|cli|shell-command)\b/i.test(cleaned)) {
    return "code-terminal";
  }
  if (/\b(?:(?:architecture|system|layer)[\s\-_]+stack|architecture-topology|system-stack|layer-stack|topology|tiers)\b/i.test(cleaned)) {
    return "architecture-topology";
  }
  if (/\b(?:3d|webgl|threejs|mesh)\b/i.test(cleaned)) {
    return "3d-webgl-model";
  }
  if (/\b(?:bento|dashboard-grid)\b/i.test(cleaned)) {
    return "bento-dashboard";
  }
  if (/\b(?:timeline|milestone(?:s)?|journey|roadmap)\b/i.test(cleaned)) {
    return "timeline-milestone";
  }
  if (/\b(?:cinematic|hero-title|title-hero|hero-headline)\b/i.test(cleaned)) {
    return "hero-cinematic";
  }
  if (/\b(?:quote|spotlight|thesis-spotlight)\b/i.test(cleaned)) {
    return "quote-spotlight";
  }
  if (/\b(?:diff|code-diff|evolution|before-after)\b/i.test(cleaned)) {
    return "code-diff-pane";
  }
  if (/\b(?:state-machine|fsm|transition-diagram)\b/i.test(cleaned)) {
    return "state-machine-fsm";
  }
  if (/\b(?:memory-layout|disk-layout|byte-stripe|packet-header)\b/i.test(cleaned)) {
    return "disk-memory-layout";
  }
  if (/\b(?:tree-hierarchy|btree|trie|ast-tree)\b/i.test(cleaned)) {
    return "tree-hierarchy";
  }
  if (/\b(?:stat-dashboard|kpi-grid|telemetry-grid|metrics-dashboard)\b/i.test(cleaned)) {
    return "stat-dashboard-grid";
  }
  return "hero-split-overview";
}
