import {
  ARCHETYPE_REGISTRY,
  VisualArchetypeId,
  normalizeArchetypeId,
} from "@presentation/schema";

/**
 * Thrown when a slide type or archetype cannot be mapped to any known model tier.
 */
export class ModelRoutingError extends Error {
  constructor(slideType: string) {
    super(`[ModelRouter] unknown slide type "${slideType}"`);
    this.name = "ModelRoutingError";
  }
}

/**
 * Picks the model ID for each pipeline stage based on slide complexity.
 * Uses ARCHETYPE_REGISTRY definitions to route complex visual synthesis
 * to Nemotron Super 120B and lightweight overview/comparisons to Nano 30B.
 */
import { config } from "../config";

export class ModelRouter {
  private readonly stage1Model: string;
  private readonly stage2Model: string;
  private readonly complexModel: string;
  private readonly simpleModel: string;

  constructor() {
    const fastModel = process.env.NVIDIA_MODEL || config.nvidiaModel || "meta/llama-3.3-70b-instruct";
    const reasoningModel = process.env.NVIDIA_REASONING_MODEL || config.nvidiaReasoningModel || "deepseek-ai/deepseek-r1";
    this.stage1Model = process.env.STAGE1_MODEL ?? reasoningModel;
    this.stage2Model = process.env.STAGE2_MODEL ?? reasoningModel;
    this.complexModel = process.env.STAGE3_COMPLEX_MODEL ?? fastModel;
    this.simpleModel = process.env.STAGE3_SIMPLE_MODEL ?? fastModel;
  }

  /** Model ID for complex visual synthesis (simulators, topologies, code consoles). */
  get complexModelId(): string {
    return this.complexModel;
  }

  /** Model ID for simple slides (stats, comparisons, overviews). */
  get simpleModelId(): string {
    return this.simpleModel;
  }

  /**
   * Returns the Stage 3 model ID for an archetype or slide type string.
   */
  routeStage3(slideTypeOrArchetype: string | VisualArchetypeId): string {
    if (!slideTypeOrArchetype || slideTypeOrArchetype.trim().length === 0) {
      throw new ModelRoutingError(slideTypeOrArchetype || "");
    }

    const archetypeId = normalizeArchetypeId(slideTypeOrArchetype);
    const def = ARCHETYPE_REGISTRY[archetypeId];

    if (def && def.complexityLevel === "simple") {
      this.logRouting("stage3", this.simpleModel, `simple archetype "${archetypeId}"`);
      return this.simpleModel;
    }

    this.logRouting("stage3", this.complexModel, `complex archetype "${archetypeId}"`);
    return this.complexModel;
  }

  /** Returns the configured model for Stage 1 analysis. */
  routeStage1(): string {
    return this.stage1Model;
  }

  /** Returns the configured model for Stage 2 storyboarding. */
  routeStage2(): string {
    return this.stage2Model;
  }

  /** Structured log of which stage used which model and why. */
  logRouting(stage: string, model: string, reason: string): void {
    console.log(JSON.stringify({ event: "model-routing", stage, model, reason }));
  }
}
