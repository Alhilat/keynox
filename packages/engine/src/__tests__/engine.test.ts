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
});
