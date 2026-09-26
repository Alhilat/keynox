import OpenAI from "openai";
import { config } from "../../config";
import { VisualArchetypeId } from "@presentation/schema";
import { DocumentDomain } from "../prompts/domainAdaptivePrompts";
import { evaluateSlideReward, SlideRewardBreakdown } from "./rewardModel";
import { geminiService } from "../../services/geminiService";

export interface RlOptimizationResult {
  optimalSlideHtml: string;
  initialReward: SlideRewardBreakdown;
  finalReward: SlideRewardBreakdown;
  refined: boolean;
}

export class RlSlideOptimizer {
  private readonly openai: OpenAI;
  private readonly REWARD_ACCEPTANCE_THRESHOLD = 0.82;

  constructor() {
    const apiKey = config.nvidiaApiKeyUltra || config.nvidiaApiKey;
    this.openai = new OpenAI({
      apiKey,
      baseURL: config.nvidiaBaseUrl,
    });
  }

  /**
   * Evaluates a candidate slide and conditionally triggers an Actor-Critic refinement
   * step if the initial reward falls below the quality threshold.
   */
  public async optimizeSlide(params: {
    candidateHtml: string;
    topic: string;
    slideIndex: number;
    totalSlides: number;
    archetypeId: VisualArchetypeId;
    analysisSnippet: string;
    precedingArchetypes?: string[];
    domain?: DocumentDomain;
    actorModel: string;
    signal?: AbortSignal;
    onRewardProgress?: (reward: SlideRewardBreakdown) => void;
  }): Promise<RlOptimizationResult> {
    const {
      candidateHtml,
      topic,
      slideIndex,
      totalSlides,
      archetypeId,
      analysisSnippet,
      precedingArchetypes = [],
      domain,
      actorModel,
      signal,
      onRewardProgress,
    } = params;

    // 1. Initial State Evaluation: Compute Reward Vector R0
    const initialReward = await evaluateSlideReward({
      slideHtml: candidateHtml,
      topic,
      slideIndex,
      totalSlides,
      archetypeId,
      analysisSnippet,
      precedingArchetypes,
      domain,
    });

    onRewardProgress?.(initialReward);

    console.log(
      `[RL Optimizer] Slide ${slideIndex + 1} initial reward: ${initialReward.totalReward} ` +
      `(Fidelity: ${initialReward.fidelityScore}, Archetype: ${initialReward.archetypeScore}, Syntax: ${initialReward.syntaxScore})`
    );

    // 2. Policy Acceptance Gate: If reward is high, accept immediately
    if (initialReward.totalReward >= this.REWARD_ACCEPTANCE_THRESHOLD) {
      return {
        optimalSlideHtml: candidateHtml,
        initialReward,
        finalReward: initialReward,
        refined: false,
      };
    }

    // 3. Policy Refinement Step (Actor Revision with Reward Feedback)
    console.log(
      `[RL Optimizer] Slide ${slideIndex + 1} scored ${initialReward.totalReward} < ${this.REWARD_ACCEPTANCE_THRESHOLD}. ` +
      `Triggering policy gradient refinement: "${initialReward.critique}"`
    );

    try {
      signal?.throwIfAborted();
      const refinementPrompt = `You are an elite Keynote Visual Designer receiving automated Reinforcement Learning reward feedback.
Your draft for Slide ${slideIndex + 1} ("${topic}") received a sub-optimal reward score (${initialReward.totalReward}/1.0).

REWARD CRITIQUE:
"${initialReward.critique}"

TARGET ARCHETYPE: "${archetypeId}"
DOMAIN KNOWLEDGE TO GROUND ALL CLAIMS:
"""
${analysisSnippet.slice(0, 3000)}
"""

PREVIOUS SUB-OPTIMAL DRAFT:
"""
${candidateHtml}
"""

REVISION GOAL:
Output the corrected, high-reward <section class="slide ...">...</section> HTML block that directly addresses every defect in the critique.
- Ensure strict adherence to archetype "${archetypeId}".
- Extract real commands, numbers, and equations from the domain knowledge.
- Eliminate all buzzwords and generic card layouts.
- Output ONLY the valid <section> block.`;

      let revisedHtml = "";

      // Attempt revision with Gemini if available, else actorModel
      if (geminiService.isAvailable()) {
        const client = geminiService.getClient();
        const res = await client.chat.completions.create({
          model: geminiService.getModel(),
          messages: [
            { role: "system", content: "You are an elite keynote visual designer executing reward-guided refinement. Output ONLY <section>...</section>." },
            { role: "user", content: refinementPrompt },
          ],
          temperature: 0.25,
          max_tokens: 3500,
        });
        revisedHtml = res.choices?.[0]?.message?.content?.trim() || "";
      } else {
        const res = await this.openai.chat.completions.create({
          model: actorModel,
          messages: [
            { role: "system", content: "You are an elite keynote visual designer executing reward-guided refinement. Output ONLY <section>...</section>." },
            { role: "user", content: refinementPrompt },
          ],
          temperature: 0.25,
          max_tokens: 3500,
        });
        revisedHtml = res.choices?.[0]?.message?.content?.trim() || "";
      }

      revisedHtml = revisedHtml.replace(/^```html\s*/i, "").replace(/```\s*$/i, "").trim();

      if (revisedHtml.includes("<section") && revisedHtml.includes("</section>")) {
        // 4. Score Revised Candidate R1
        const finalReward = await evaluateSlideReward({
          slideHtml: revisedHtml,
          topic,
          slideIndex,
          totalSlides,
          archetypeId,
          analysisSnippet,
          precedingArchetypes,
          domain,
        });

        console.log(
          `[RL Optimizer] Slide ${slideIndex + 1} refined reward: ${finalReward.totalReward} ` +
          `(Delta: ${(finalReward.totalReward - initialReward.totalReward).toFixed(2)})`
        );

        // 5. ArgMax Selection: Pick candidate with highest scalar reward
        if (finalReward.totalReward >= initialReward.totalReward) {
          onRewardProgress?.(finalReward);
          return {
            optimalSlideHtml: revisedHtml,
            initialReward,
            finalReward,
            refined: true,
          };
        }
      }
    } catch (refineErr: any) {
      console.warn(`[RL Optimizer] Refinement pass skipped for slide ${slideIndex + 1}:`, refineErr?.message);
    }

    return {
      optimalSlideHtml: candidateHtml,
      initialReward,
      finalReward: initialReward,
      refined: false,
    };
  }
}

export const rlSlideOptimizer = new RlSlideOptimizer();
