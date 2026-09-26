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
    });

    it("enforces percentage bounds and overflow hidden", () => {
      const rawHtml = `<div class="slide slide-1">
        <h1 class="slide-1-title">Title</h1>
      </div>`;

      const audited = sanitizeSlideDeterministic(1, rawHtml);
      expect(audited.html).toContain("position: absolute");
      expect(audited.html).toContain("overflow: hidden");
      expect(audited.html).toContain("width: 100%");
      expect(audited.html).toContain("height: 100%");
    });
  });
});
