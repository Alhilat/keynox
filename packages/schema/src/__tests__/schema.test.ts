import { describe, it, expect } from "vitest";
import { PresentationSchema, SceneSchema, CardElementSchema, InteractiveWidgetElementSchema } from "../presentation";
import { StepActionSchema } from "../actions";

describe("PresentationSchema Validation Suite", () => {
  it("should validate a well-formed Presentation AST", () => {
    const validDeck = {
      version: 1,
      title: "Quantum Information Systems",
      metadata: {
        topic: "Quantum Information",
        generator: "HyperDeck",
      },
      scenes: [
        {
          id: "scene-1",
          title: "Qubit Superposition",
          subtitle: "Linear combination of computational basis states",
          category: "FOUNDATIONS",
          layout: "hero",
          elements: [
            {
              id: "card-1",
              type: "card",
              title: "Bloch Sphere State Vector",
              tag: "PHYSICAL STATE",
              badge: "01",
              description: "State |ψ⟩ = α|0⟩ + β|1⟩ normalized with |α|² + |β|² = 1.",
              points: [
                "Unit radius sphere in Hilbert space",
                "Phase angle φ and polar angle θ parameterize state",
              ],
              accentColor: "#38bdf8",
            },
          ],
          steps: [
            {
              id: "step-1-1",
              title: "Initial Overview",
              actions: [],
            },
            {
              id: "step-1-2",
              title: "Highlight State Vector",
              actions: [
                {
                  action: "highlight",
                  target: "card-1",
                  color: "#38bdf8",
                  duration: 0.6,
                  pulse: true,
                },
              ],
            },
          ],
        },
      ],
    };

    const parsed = PresentationSchema.safeParse(validDeck);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toBe("Quantum Information Systems");
      expect(parsed.data.scenes).toHaveLength(1);
      expect(parsed.data.scenes[0].elements[0].type).toBe("card");
    }
  });

  it("should reject invalid layout types", () => {
    const invalidScene = {
      id: "scene-x",
      title: "Invalid Layout Scene",
      layout: "non-existent-layout",
      elements: [],
      steps: [],
    };

    const parsed = SceneSchema.safeParse(invalidScene);
    expect(parsed.success).toBe(false);
  });

  it("should validate interactive simulator widgets", () => {
    const widget = {
      id: "sim-1",
      type: "interactive-widget",
      widgetType: "physics-slider",
      title: "Newtonian Accelerator",
      config: {
        formula: "a = F/m",
      },
    };

    const parsed = InteractiveWidgetElementSchema.safeParse(widget);
    expect(parsed.success).toBe(true);
  });

  it("should validate GSAP step actions", () => {
    const highlightAction = {
      action: "highlight",
      target: "target-card-id",
      color: "#10b981",
      duration: 0.5,
      pulse: true,
    };

    const parsed = StepActionSchema.safeParse(highlightAction);
    expect(parsed.success).toBe(true);
  });
});
