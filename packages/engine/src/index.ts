import { Presentation, Scene, Step } from "@presentation/schema";
import { DOMRenderer } from "./renderer";
import { GSAPAnimator } from "./animator";
import { PresentationAudio } from "./sound";

export interface EngineState {
  currentSceneIndex: number;
  currentStepIndex: number;
  totalScenes: number;
  totalStepsInScene: number;
  currentScene?: Scene;
  currentStep?: Step;
  soundEnabled: boolean;
}

export type StateChangeCallback = (state: EngineState) => void;

export class PresentationEngine {
  private container: HTMLElement;
  private renderer: DOMRenderer;
  private animator: GSAPAnimator;
  private audio: PresentationAudio;
  private presentation: Presentation | null = null;
  private currentSceneIndex: number = 0;
  private currentStepIndex: number = 0;
  private stateListeners: StateChangeCallback[] = [];
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private isAnimating: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.audio = new PresentationAudio();
    this.renderer = new DOMRenderer();
    this.animator = new GSAPAnimator(this.audio);
    this.setupKeyboardListeners();
  }

  /**
   * Load presentation data and mount scene 0, step 0
   */
  public loadPresentation(presentation: Presentation): void {
    this.presentation = presentation;
    this.currentSceneIndex = 0;
    this.currentStepIndex = 0;
    this.animator.killAll();
    this.renderCurrentScene();
    this.notifyState();
  }

  public getPresentation(): Presentation | null {
    return this.presentation;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.audio.setEnabled(enabled);
    this.notifyState();
  }

  public isSoundEnabled(): boolean {
    return this.audio.isEnabled();
  }

  /**
   * Advance to the next sequential step or next scene
   */
  public async nextStep(): Promise<void> {
    if (!this.presentation || this.isAnimating) return;

    const currentScene = this.presentation.scenes[this.currentSceneIndex];
    if (!currentScene) return;

    // Check if there is another step in the current scene
    if (this.currentStepIndex < currentScene.steps.length - 1) {
      this.currentStepIndex++;
      const nextStep = currentScene.steps[this.currentStepIndex];
      this.notifyState();

      if (nextStep && nextStep.actions.length > 0) {
        this.isAnimating = true;
        for (const action of nextStep.actions) {
          await this.animator.executeAction(action, this.container);
        }
        this.isAnimating = false;
      }
    } else if (this.currentSceneIndex < this.presentation.scenes.length - 1) {
      // Transition to next scene
      this.currentSceneIndex++;
      this.currentStepIndex = 0;
      this.renderCurrentScene();
      this.notifyState();
    }
  }

  /**
   * Go back to the previous step or previous scene
   */
  public async prevStep(): Promise<void> {
    if (!this.presentation || this.isAnimating) return;

    if (this.currentStepIndex > 0) {
      const targetStep = this.currentStepIndex - 1;
      await this.goToStep(targetStep);
    } else if (this.currentSceneIndex > 0) {
      this.currentSceneIndex--;
      const scene = this.presentation.scenes[this.currentSceneIndex];
      const lastStepIndex = Math.max(0, scene.steps.length - 1);
      this.renderCurrentScene();
      await this.goToStep(lastStepIndex);
    }
  }

  public async goToScene(sceneIndex: number): Promise<void> {
    if (!this.presentation || sceneIndex < 0 || sceneIndex >= this.presentation.scenes.length) return;
    this.animator.killAll();
    this.currentSceneIndex = sceneIndex;
    this.currentStepIndex = 0;
    this.renderCurrentScene();
    this.notifyState();
  }

  /**
   * Jump directly to a step by resetting and re-applying steps
   */
  public async goToStep(targetStepIndex: number): Promise<void> {
    if (!this.presentation) return;
    const currentScene = this.presentation.scenes[this.currentSceneIndex];
    if (!currentScene || targetStepIndex < 0 || targetStepIndex >= currentScene.steps.length) return;

    this.animator.killAll();
    this.renderCurrentScene();

    this.isAnimating = true;
    for (let i = 1; i <= targetStepIndex; i++) {
      const step = currentScene.steps[i];
      if (step && step.actions.length > 0) {
        for (const action of step.actions) {
          const instantAction = { ...action, duration: 0 };
          await this.animator.executeAction(instantAction, this.container);
        }
      }
    }
    this.isAnimating = false;

    this.currentStepIndex = targetStepIndex;
    this.notifyState();
  }

  public onStateChange(callback: StateChangeCallback): () => void {
    this.stateListeners.push(callback);
    this.notifyState();
    return () => {
      this.stateListeners = this.stateListeners.filter((cb) => cb !== callback);
    };
  }

  public getState(): EngineState {
    const currentScene = this.presentation?.scenes[this.currentSceneIndex];
    const currentStep = currentScene?.steps[this.currentStepIndex];

    return {
      currentSceneIndex: this.currentSceneIndex,
      currentStepIndex: this.currentStepIndex,
      totalScenes: this.presentation?.scenes.length || 0,
      totalStepsInScene: currentScene?.steps.length || 0,
      currentScene,
      currentStep,
      soundEnabled: this.audio.isEnabled(),
    };
  }

  private renderCurrentScene(): void {
    if (!this.presentation) return;
    const scene = this.presentation.scenes[this.currentSceneIndex];
    if (scene) {
      this.renderer.renderScene(scene, this.container);
    }
  }

  private notifyState(): void {
    const state = this.getState();
    this.stateListeners.forEach((cb) => cb(state));
  }

  private setupKeyboardListeners(): void {
    this.keydownHandler = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        this.nextStep();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        this.prevStep();
      }
    };

    window.addEventListener("keydown", this.keydownHandler);
  }

  public destroy(): void {
    if (this.keydownHandler) {
      window.removeEventListener("keydown", this.keydownHandler);
    }
    this.animator.killAll();
    this.renderer.destroy();
    this.container.innerHTML = "";
    this.stateListeners = [];
  }
}
