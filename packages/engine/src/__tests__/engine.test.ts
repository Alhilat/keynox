import { describe, it, expect } from "vitest";
import { PresentationAudio } from "../sound";
import { GSAPAnimator } from "../animator";

describe("Presentation Engine Components", () => {
  it("should initialize PresentationAudio safely in headless/Node environment", () => {
    const audio = new PresentationAudio();
    expect(audio).toBeDefined();
    expect(() => audio.playStepClick()).not.toThrow();
    expect(() => audio.playMoveWhoosh()).not.toThrow();
    expect(() => audio.playSuccessChime()).not.toThrow();
  });

  it("should toggle audio enabled state", () => {
    const audio = new PresentationAudio();
    audio.setEnabled(false);
    expect(() => audio.playStepClick()).not.toThrow();
    audio.setEnabled(true);
    expect(() => audio.playStepClick()).not.toThrow();
  });

  it("should construct GSAPAnimator with custom or default audio", () => {
    const animator = new GSAPAnimator();
    expect(animator).toBeDefined();
    expect(animator.audio).toBeInstanceOf(PresentationAudio);
  });

  it("should execute move action smoothly without throwing", async () => {
    const animator = new GSAPAnimator();
    let scrolled = false;
    const target = {
      classList: { contains: () => false },
      scrollIntoView: () => { scrolled = true; },
      style: {},
    } as unknown as HTMLElement;
    const container = {
      querySelector: () => target,
      querySelectorAll: () => [target],
    } as unknown as HTMLElement;

    await expect(
      animator.executeAction(
        {
          action: "move",
          target: "test-elem",
          to: { x: 50, y: 100 },
          duration: 0.1,
          ease: "power2.out",
        },
        container
      )
    ).resolves.not.toThrow();

    expect(scrolled).toBe(true);
    animator.killAll();
  });

  it("should execute highlight action smoothly and trigger scrollIntoView", async () => {
    const animator = new GSAPAnimator();
    let scrolled = false;
    const target = {
      classList: { contains: (cls: string) => cls === "presentation-card" },
      scrollIntoView: () => { scrolled = true; },
      style: {},
    } as unknown as HTMLElement;
    const container = {
      querySelector: () => target,
      querySelectorAll: () => [target],
    } as unknown as HTMLElement;

    await animator.executeAction(
      {
        action: "highlight",
        target: "test-card",
        color: "#38bdf8",
        duration: 0.1,
        pulse: false,
      },
      container
    );

    expect(scrolled).toBe(true);
    animator.killAll();
  });
});
