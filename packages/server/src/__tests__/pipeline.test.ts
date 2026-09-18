import { describe, it, expect } from "vitest";
import { extractSlidesFromContent, extractCustomScripts, assembleHyperDeckPresentation } from "../pipeline/html-assembler";
import { parseStoryboardIntoSlides, synthesizeFallbackSlide, resolveVisualTemplate, VISUAL_TEMPLATES } from "../pipeline/stage3-creative-generator";
import { detectTargetSlideCount } from "../services/slideCountDetector";
import { presentationCache } from "../pipeline/cache";
import { convertHtmlToPresentationAst } from "../pipeline/html-to-ast";
import { extractCleanTopic } from "../pipeline/topic-extractor";
import { PresentationSchema } from "@presentation/schema";

describe("HyperDeck Pipeline & Engine Test Suite", () => {
  describe("extractSlidesFromContent", () => {
    it("should extract discrete <section class='slide'> elements correctly", () => {
      const mockHtml = `
        <section class="slide active" id="slide0">
          <div class="slide-title-group">
            <h2 class="slide-title">Slide One</h2>
          </div>
        </section>
        <section class="slide" id="slide1">
          <div class="slide-title-group">
            <h2 class="slide-title">Slide Two</h2>
          </div>
        </section>
      `;

      const slides = extractSlidesFromContent(mockHtml);
      expect(slides).toHaveLength(2);
      expect(slides[0]).toContain('id="slide0"');
      expect(slides[1]).toContain('id="slide1"');
    });

    it("should auto-close unclosed section tags and strip dangling incomplete tags", () => {
      const truncatedHtml = `<section class="slide" id="slide0"><div class="motion-pipeline"><div class="pipeline-stage"><span class="`;
      const slides = extractSlidesFromContent(truncatedHtml);
      expect(slides).toHaveLength(1);
      expect(slides[0]).not.toContain('<span class="');
      expect(slides[0]).toContain("</div></div></section>");
    });
  });

  describe("20-Template Visual Catalog & Autonomous Selection", () => {
    it("should contain exactly 20 rich production visual templates", () => {
      const keys = Object.keys(VISUAL_TEMPLATES);
      expect(keys.length).toBe(20);
      expect(keys).toContain("TEMPLATE_01_HERO_SPLIT_OVERVIEW");
      expect(keys).toContain("TEMPLATE_02_TERMINAL_CODE_EXPLORER");
      expect(keys).toContain("TEMPLATE_03_CODE_DIFF_EVOLUTION");
      expect(keys).toContain("TEMPLATE_04_SEQUENTIAL_PIPELINE_4");
      expect(keys).toContain("TEMPLATE_05_STREAMLINED_PIPELINE_3");
      expect(keys).toContain("TEMPLATE_06_CONNECTED_TOPOLOGY_FLOW");
      expect(keys).toContain("TEMPLATE_07_DUAL_STREAM_CONVERGENCE");
      expect(keys).toContain("TEMPLATE_08_INTERACTIVE_SLIDER_SIMULATOR");
      expect(keys).toContain("TEMPLATE_09_COMPARISON_MATRIX_TABLE");
      expect(keys).toContain("TEMPLATE_10_DYNAMIC_BAR_CHART_BENCHMARK");
      expect(keys).toContain("TEMPLATE_11_TRI_CARD_CONCEPT_GRID");
      expect(keys).toContain("TEMPLATE_12_QUAD_METRIC_DASHBOARD");
      expect(keys).toContain("TEMPLATE_13_MATHEMATICAL_DERIVATION_STEP");
      expect(keys).toContain("TEMPLATE_14_STATE_MACHINE_TRANSITION");
      expect(keys).toContain("TEMPLATE_15_HIERARCHICAL_LAYER_STACK");
      expect(keys).toContain("TEMPLATE_16_INTERACTIVE_SVG_VENN");
      expect(keys).toContain("TEMPLATE_17_THREE_JS_SPATIAL_WORLD");
      expect(keys).toContain("TEMPLATE_18_CHRONOLOGICAL_TIMELINE");
      expect(keys).toContain("TEMPLATE_19_PRO_CON_TRADE_OFF_STUDY");
      expect(keys).toContain("TEMPLATE_20_EXECUTIVE_CHECKLIST_SUMMARY");
    });

    it("should prioritize explicit Model 2 TEMPLATE directives", () => {
      const directive = `SLIDE 3: Execution Runtime\nTEMPLATE: TEMPLATE_02_TERMINAL_CODE_EXPLORER\nRun container demo with -pu flags`;
      const template = resolveVisualTemplate(directive, 2);
      expect(template.id).toBe("TEMPLATE_02_TERMINAL_CODE_EXPLORER");
    });

    it("should autonomously infer templates from semantic keywords", () => {
      // CLI / Docker commands -> Terminal
      const cliTemplate = resolveVisualTemplate("Inspect PID namespaces with sudo unshare -p -f --mount-proc", 1);
      expect(cliTemplate.id).toBe("TEMPLATE_02_TERMINAL_CODE_EXPLORER");

      // Layer stack / hierarchy -> Hierarchical Layer Stack
      const layerTemplate = resolveVisualTemplate("Hierarchical abstraction layers from hardware to user space", 3);
      expect(layerTemplate.id).toBe("TEMPLATE_15_HIERARCHICAL_LAYER_STACK");

      // Metrics / KPIs -> Quad Metric Dashboard
      const metricTemplate = resolveVisualTemplate("Throughput benchmarks and latency KPI dashboard metrics", 4);
      expect(metricTemplate.id).toBe("TEMPLATE_12_QUAD_METRIC_DASHBOARD");

      // Checklist / takeaways -> Executive Checklist Summary
      const summaryTemplate = resolveVisualTemplate("Executive summary and key architectural takeaways checklist", 5);
      expect(summaryTemplate.id).toBe("TEMPLATE_20_EXECUTIVE_CHECKLIST_SUMMARY");
    });
  });

  describe("assembleHyperDeckPresentation", () => {
    it("should include KaTeX CSS and auto-render JS in presentation head", () => {
      const html = assembleHyperDeckPresentation({
        topic: "Quantum Superposition",
        slidesHtml: '<section class="slide" id="slide0"><h2>Quantum</h2></section>',
        targetCount: 1,
      });

      expect(html).toContain("katex.min.css");
      expect(html).toContain("katex.min.js");
      expect(html).toContain("renderMathInElement");
    });
  });

  describe("parseStoryboardIntoSlides", () => {
    it("should generate distinct diverse slide blueprints when targetCount exceeds storyboard length", () => {
      const shortStoryboard = `SLIDE 1: Introduction to IoT\n- Focus: Sensor acquisition`;
      const slides = parseStoryboardIntoSlides(shortStoryboard, 4);
      expect(slides).toHaveLength(4);

      // Verify that slides 2, 3, 4 are not duplicate copies of each other
      expect(slides[1]).not.toBe(slides[2]);
      expect(slides[2]).not.toBe(slides[3]);
      expect(slides[1]).toContain("SLIDE 2:");
      expect(slides[2]).toContain("SLIDE 3:");
    });
  });

  describe("detectTargetSlideCount", () => {
    it("should extract explicit count from topic string", () => {
      const res = detectTargetSlideCount("Distributed Systems in 6 slides", undefined);
      expect(res.count).toBe(6);
      expect(res.isExplicit).toBe(true);
    });

    it("should enforce boundaries between 3 and 8 slides", () => {
      const tooSmall = detectTargetSlideCount("Physics in 1 slide", undefined);
      expect(tooSmall.count).toBe(3);

      const tooLarge = detectTargetSlideCount("Compiler design in 25 slides", undefined);
      expect(tooLarge.count).toBe(8);
    });
  });

  describe("presentationCache", () => {
    it("should cache and retrieve presentations by topic", () => {
      presentationCache.clear();
      const topic = "Distributed Hash Tables";
      presentationCache.set(topic, {
        topic,
        html: "<section class='slide' id='slide0'><h2>DHT</h2></section>",
        model: "nemotron-test",
      });

      const cached = presentationCache.get(topic);
      expect(cached).not.toBeNull();
      expect(cached?.topic).toBe(topic);
    });

    it("should reject and evict items matching the placeholder poison filter", () => {
      presentationCache.clear();
      const topic = "Fault Tolerance";
      presentationCache.set(topic, {
        topic,
        html: "<section class='slide'>Intensity Factor (α)</section>",
        model: "nemotron-test",
      });

      const cached = presentationCache.get(topic);
      expect(cached).toBeNull();
    });
  });

  describe("convertHtmlToPresentationAst", () => {
    it("should convert slide HTML into valid PresentationSchema AST", () => {
      const generatedHtml = `
        <section class="slide active" id="slide0">
          <div class="slide-title-group">
            <span class="slide-category">ARCHITECTURE</span>
            <h2 class="slide-title">Transmon Qubits</h2>
            <p class="slide-subtitle">Superconducting artificial atom dynamics</p>
          </div>
          <div class="glass-card card-cyan">
            <span class="card-title">Josephson Non-Linearity</span>
            <p class="card-desc">Provides anharmonic ladder spacing</p>
            <ul class="points-list">
              <li>Cooper pair tunneling across insulating oxide barrier</li>
              <li>Cos(φ) potential isolates |0⟩ to |1⟩ transition</li>
            </ul>
          </div>
        </section>
      `;

      const ast = convertHtmlToPresentationAst("Transmon Qubits", generatedHtml);
      expect(ast.title).toBe("Transmon Qubits");
      expect(ast.scenes).toHaveLength(1);
      expect(ast.scenes[0].title).toBe("Transmon Qubits");
      expect(ast.scenes[0].elements.length).toBeGreaterThanOrEqual(1);

      // Validate through Zod PresentationSchema
      const validated = PresentationSchema.safeParse(ast);
      expect(validated.success).toBe(true);
    });
  });

  describe("extractCleanTopic", () => {
    it("should keep clean standard topic as is", () => {
      const res = extractCleanTopic("CRDTs and Eventual Consistency");
      expect(res.title).toBe("CRDTs and Eventual Consistency");
    });

    it("should extract true document topic when given generic week/chapter label", () => {
      const input = "TOPIC: week 7\n50 3 Containers\n3.1 Linux Namespaces\nRun container_demo without any options...";
      const res = extractCleanTopic(input);
      expect(res.title).toContain("Containers");
      expect(res.title).toContain("week 7");
    });

    it("should strip UI prompt noise words like Slides and PREFERRED THEME", () => {
      const input = "Slides\nPREFERRED THEME (week 6)\n3 Containers\nContainers are a form of operating system virtualisation...";
      const res = extractCleanTopic(input);
      expect(res.title).toContain("Containers");
      expect(res.title).not.toContain("PREFERRED THEME");
      expect(res.title).not.toContain("Slides");
    });
  });

  describe("synthesizeFallbackSlide", () => {
    it("should strip markdown asterisks and never produce empty slide titles", () => {
      const directive = `
- SLIDE NUMBER & TITLE:**
TITLE:** Linux Namespaces – Kernel-Level Isolation
- SUBTITLE & CATEGORY:** PHYSICAL TOPOLOGY
- NARRATIVE & CONTENT**
Primary Takeaway:** Containers achieve OS-level virtualisation by creating restricted views of system resources.
      `;
      const html = synthesizeFallbackSlide("Containers", 0, 5, directive);
      expect(html).toContain('<h2 class="slide-title">Linux Namespaces – Kernel-Level Isolation</h2>');
      expect(html).toContain('<div class="slide-category">PHYSICAL TOPOLOGY</div>');
      expect(html).not.toContain('**');
      expect(html).toContain('<svg');
      expect(html).not.toContain('⚙️');
      expect(html).not.toContain('⚡');
    });

    it("should synthesize terminal explorer template without emojis and with clean code spans", () => {
      const directive = `
TITLE: Container Isolation CLI
TEMPLATE: TEMPLATE_02_TERMINAL_CODE_EXPLORER
sudo unshare --fork --pid --mount-proc /bin/bash
ls /proc confirms new PID space
      `;
      const html = synthesizeFallbackSlide("Linux Containers", 1, 5, directive);
      expect(html).toContain('class="terminal-card"');
      expect(html).toContain('terminal-prompt');
      expect(html).not.toContain('📦');
      expect(html).not.toContain('🔧');
      expect(html).not.toContain('💻');
    });
  });
});
