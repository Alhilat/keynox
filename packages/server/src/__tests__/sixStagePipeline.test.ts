import { describe, it, expect } from "vitest";
import { parseTolerantJson } from "../pipeline/utils/tolerantJson";
import { sanitizeSlideDeterministic } from "../pipeline/stage5-critic";
import { Stage1Extraction, Stage2Strategy, Stage3ArtDirection } from "../pipeline/types/sixStageTypes";

describe("6-Stage Production Pipeline Unit Tests", () => {
  describe("Tolerant JSON Parser", () => {
    it("parses valid JSON with markdown fence", () => {
      const input = "```json\n{\"core_thesis\": \"Testing thesis\", \"slide_count\": 10}\n```";
      const result = parseTolerantJson<{ core_thesis: string; slide_count: number }>(input);
      expect(result.data).not.toBeNull();
      expect(result.data?.core_thesis).toBe("Testing thesis");
      expect(result.data?.slide_count).toBe(10);
      expect(result.hadTruncation).toBe(false);
    });

    it("auto-repairs unclosed brackets when JSON is truncated mid-array", () => {
      const truncated = `{"slides": [
        {"index": 1, "title": "Slide One", "mood": "bold"},
        {"index": 2, "title": "Slide Two", "mood": "calm"},
        {"index": 3, "title": "Slide Three", "mo`;
      const result = parseTolerantJson<any>(truncated);
      expect(result.data).not.toBeNull();
      expect(result.hadTruncation).toBe(true);
      expect(result.data?.slides).toBeDefined();
      expect(result.data?.slides.length).toBeGreaterThanOrEqual(2);
      expect(result.data?.slides[0].title).toBe("Slide One");
    });
  });

  describe("Stage 5 Tier 3 Deterministic Sanitizer", () => {
    it("guarantees .slide-N- scoping and removes emojis", () => {
      const rawHtml = `<div class="slide">
        <h2>Hello World 🚀🔥</h2>
        <p>This is a test description</p>
      </div>`;

      const audited = sanitizeSlideDeterministic(3, rawHtml);
      expect(audited.status).toBe("sanitized");
      expect(audited.html).toContain("slide-3");
      expect(audited.html).not.toContain("🚀");
      expect(audited.html).not.toContain("🔥");
      expect(audited.html).toContain("window.initSlide_3");
      expect(audited.html).toContain("return tl");
      expect(audited.html).toContain("stagger: 0.1");
    });

    it("eradicates legacy Courier and typewriter fonts in favor of var(--font-mono)", () => {
      const courierHtml = `<div class="slide slide-4">
        <pre style="font-family: 'Courier New', Courier, monospace;"><code>code line</code></pre>
      </div>`;

      const audited = sanitizeSlideDeterministic(4, courierHtml);
      expect(audited.html).not.toContain("Courier");
      expect(audited.html).not.toContain("Courier New");
      expect(audited.html).toContain("font-family: var(--font-mono)");
    });

    it("enforces percentage bounds and vertical scroll support", () => {
      const rawHtml = `<div class="slide slide-1">
        <h1 class="slide-1-title">Title</h1>
      </div>`;

      const audited = sanitizeSlideDeterministic(1, rawHtml);
      expect(audited.html).toContain("position: absolute");
      expect(audited.html).toContain("overflow-y: auto");
      expect(audited.html).toContain("width: 100%");
      expect(audited.html).toContain("height: 100%");
    });

    it("generates deliberate pacing for mathematical step cards in GSAP initialization", () => {
      const mathSlideHtml = `<div class="slide slide-2">
        <h2 class="slide-2-title">Solving Differential Equation</h2>
        <div class="math-step-card"><span class="step-badge">STEP 01</span><div class="equation-display">$$y'' + 4y = 0$$</div></div>
        <div class="math-step-card"><span class="step-badge">STEP 02</span><div class="equation-display">$$r^2 + 4 = 0 \\implies r = \\pm 2i$$</div></div>
      </div>`;

      const audited = sanitizeSlideDeterministic(2, mathSlideHtml);
      expect(audited.html).toContain("window.initSlide_2");
      // Pacing must not be the fast 0.1s stagger; it must have deliberate step delays
      expect(audited.html).toContain("+=1.4");
      expect(audited.html).toContain("power2.out");
    });
  });

  describe("Mathematical Slide Validation & Pseudo-Math Protection", () => {
    it("preserves genuine mathematical formulas with \\implies and \\text steps in sanitizeAiTone", async () => {
      const { sanitizeAiTone } = await import("../pipeline/generator/slideValidator");
      const realMathHtml = `<div class="equation-display">$$\\text{Step 1: } x^2 - 4 = 0 \\implies x = \\pm 2$$</div>`;
      const cleaned = sanitizeAiTone(realMathHtml);
      expect(cleaned).toContain("x^2 - 4 = 0");
      expect(cleaned).toContain("\\implies");
      expect(cleaned).not.toBe("");
    });

    it("accepts genuine KaTeX equation displays in isValidSlideHtml without false rejection", async () => {
      const { isValidSlideHtml } = await import("../pipeline/generator/slideValidator");
      const mathSlide = `<section class="slide" id="slide1">
        <div class="slide-title-group"><h2 class="slide-title">Integration</h2></div>
        <div class="equation-display">$$\\int_0^1 x^2 dx = \\frac{1}{3}$$</div>
      </section>`;
      expect(isValidSlideHtml(mathSlide)).toBe(true);
    });

    it("detects math problem solving topics under physics_math domain", async () => {
      const { detectDocumentDomain } = await import("../pipeline/prompts/domainAdaptivePrompts");
      expect(detectDocumentDomain("Solve the differential equation y'' + 4y = 0")).toBe("physics_math");
      expect(detectDocumentDomain("Calculate the derivative of f(x) = x^3 - 5x + 2")).toBe("physics_math");
      expect(detectDocumentDomain("Evaluate integral using integration by parts")).toBe("physics_math");
    });

    it("synthesizes rich non-blank math step cards for equation-morpher in fallbackSlide", async () => {
      const { synthesizeFallbackSlide } = await import("../pipeline/generator/fallbackSlide");
      const fallback = synthesizeFallbackSlide(
        "Solve Quadratic Equation",
        1,
        4,
        "Derive the quadratic formula step by step",
        "Step 1: Complete the square\nStep 2: Take square roots",
        "equation-morpher",
        "physics_math"
      );
      expect(fallback).toContain("math-derivation-container");
      expect(fallback).toContain("math-step-card");
      expect(fallback).toContain("equation-display");
      expect(fallback).not.toContain("class=\"grid-split\"");
    });
  });
});
