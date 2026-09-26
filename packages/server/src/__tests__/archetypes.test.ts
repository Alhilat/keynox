import { describe, it, expect } from "vitest";
import {
  ARCHETYPE_REGISTRY,
  VisualArchetypeId,
  normalizeArchetypeId,
} from "@presentation/schema";
import {
  extractArchetypeFromSection,
  getArchetypeDomContract,
  buildStage2ArchetypeMenuPrompt,
} from "../pipeline/prompts/archetypePrompts";
import { ModelRouter } from "../pipeline/modelRouter";

describe("Visual Interaction Archetypes & Ideas Registry", () => {
  it("should define complete metadata and DOM contracts for all archetypes", () => {
    const archetypes: VisualArchetypeId[] = [
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
    ];

    for (const id of archetypes) {
      const def = ARCHETYPE_REGISTRY[id];
      expect(def).toBeDefined();
      expect(def.name.length).toBeGreaterThan(3);
      expect(def.description.length).toBeGreaterThan(10);
      expect(def.requiredElements.length).toBeGreaterThanOrEqual(2);
      expect(["simple", "complex"]).toContain(def.complexityLevel);

      const contract = getArchetypeDomContract(id);
      expect(contract).toContain("[ARCHETYPE CONTRACT:");
      expect(contract.length).toBeGreaterThan(50);
    }
  });

  it("should normalize arbitrary string hints to valid archetype IDs", () => {
    expect(normalizeArchetypeId("interactive-simulator")).toBe("interactive-simulator");
    expect(normalizeArchetypeId("physics slider and dynamic values")).toBe("interactive-simulator");
    expect(normalizeArchetypeId("KaTeX equation derivation")).toBe("equation-morpher");
    expect(normalizeArchetypeId("4-stage packet flow pipeline")).toBe("motion-pipeline");
    expect(normalizeArchetypeId("tradeoff benchmark comparison table")).toBe("benchmark-matrix");
    expect(normalizeArchetypeId("terminal shell cli execution")).toBe("code-terminal");
    expect(normalizeArchetypeId("subsystem architecture stack")).toBe("architecture-topology");
    expect(normalizeArchetypeId("Three.js 3D WebGL particle model")).toBe("3d-webgl-model");
    expect(normalizeArchetypeId("unknown template")).toBe("hero-split-overview");
  });

  it("should extract [ARCHETYPE: <id>] tag from storyboard slide sections", () => {
    const section1 = `
      SLIDE 3: Raft Consensus Replication Pipeline
      [ARCHETYPE: motion-pipeline]
      SUBTITLE: Leader appends log entries and broadcasts AppendEntries RPCs.
    `;
    expect(extractArchetypeFromSection(section1)).toBe("motion-pipeline");

    const section2 = `
      SLIDE 5: Hooke's Law & Spring Oscillations
      ARCHETYPE: interactive-simulator
      SUBTITLE: Restoring force proportional to displacement.
    `;
    expect(extractArchetypeFromSection(section2)).toBe("interactive-simulator");

    const section3 = `
      SLIDE 1: Distributed Subsystem Architecture Stack
      Tiered kernel and network hierarchy.
    `;
    expect(extractArchetypeFromSection(section3)).toBe("architecture-topology");
  });

  it("should route complex archetypes to Super 120B and simple archetypes to Nano 30B", () => {
    const router = new ModelRouter();

    // Complex archetypes → Super 120B
    expect(router.routeStage3("interactive-simulator")).toBe(router.complexModelId);
    expect(router.routeStage3("motion-pipeline")).toBe(router.complexModelId);
    expect(router.routeStage3("equation-morpher")).toBe(router.complexModelId);
    expect(router.routeStage3("code-terminal")).toBe(router.complexModelId);
    expect(router.routeStage3("architecture-topology")).toBe(router.complexModelId);
    expect(router.routeStage3("3d-webgl-model")).toBe(router.complexModelId);

    // Simple archetypes → Nano 30B
    expect(router.routeStage3("hero-split-overview")).toBe(router.simpleModelId);
    expect(router.routeStage3("benchmark-matrix")).toBe(router.simpleModelId);
  });

  it("should build Stage 2 prompt containing all registry archetypes and invariant rules", () => {
    const prompt = buildStage2ArchetypeMenuPrompt();
    expect(prompt).toContain("MANDATORY VISUAL ARCHETYPE REGISTRY");
    expect(prompt).toContain("interactive-simulator");
    expect(prompt).toContain("motion-pipeline");
    expect(prompt).toContain("equation-morpher");
    expect(prompt).toContain("benchmark-matrix");
    expect(prompt).toContain("code-terminal");
    expect(prompt).toContain("architecture-topology");
    expect(prompt).toContain("hero-split-overview");
    expect(prompt).toContain("3d-webgl-model");
    expect(prompt).toContain("STORYBOARD ARCHETYPE INVARIANTS");
  });
});
