import { VisualArchetypeId, ARCHETYPE_REGISTRY } from "@presentation/schema";
import { DocumentDomain } from "../prompts/domainAdaptivePrompts";
import { geminiService } from "../../services/geminiService";

export interface SlideRewardBreakdown {
  archetypeScore: number;     // [0, 1] Adherence to planned visual archetype contract
  fidelityScore: number;      // [0, 1] Domain specificity & factual grounding
  syntaxScore: number;        // [0, 1] HTML tag balance & KaTeX integrity
  antiSlopScore: number;      // [0, 1] Absence of corporate/AI filler buzzwords
  diversityScore: number;     // [0, 1] Distinctness from immediately preceding slides
  totalReward: number;        // [0, 1] Weighted scalar reward
  critique: string;           // Formatted feedback for policy refinement
}

/**
 * Fast Rule-Based Reward Evaluator.
 * Computes deterministic reward signals in <1ms without LLM latency.
 */
export function computeRuleReward(
  slideHtml: string,
  archetypeId: VisualArchetypeId,
  analysisSnippet: string,
  precedingArchetypes: string[] = []
): Omit<SlideRewardBreakdown, "totalReward" | "critique"> & { ruleCritique: string[] } {
  const issues: string[] = [];
  const trimmed = (slideHtml || "").trim();
  const lowerHtml = trimmed.toLowerCase();

  // 1. Archetype Adherence Reward (Weight ~0.35)
  let archetypeScore = 0.5; // baseline
  const def = ARCHETYPE_REGISTRY[archetypeId];
  if (def && def.requiredElements) {
    let matchedReqs = 0;
    for (const req of def.requiredElements) {
      const cleanReq = req.replace(/^[.#]/, "").replace(/\[.*?\]/, "").trim().toLowerCase();
      if (lowerHtml.includes(cleanReq)) {
        matchedReqs++;
      }
    }
    const matchRatio = def.requiredElements.length > 0 ? matchedReqs / def.requiredElements.length : 0.8;
    archetypeScore = 0.4 + 0.6 * matchRatio;
    if (matchRatio < 0.3) {
      issues.push(`Failed archetype contract for "${archetypeId}"`);
    }
  }

  // 2. Syntax & Tag Integrity (Weight ~0.20)
  let syntaxScore = 1.0;
  if (!trimmed.startsWith("<section")) {
    syntaxScore -= 0.3;
    issues.push("Missing opening <section> tag");
  }
  if (!trimmed.endsWith("</section>")) {
    syntaxScore -= 0.3;
    issues.push("Missing closing </section> tag");
  }
  const openDivs = (trimmed.match(/<div\b/gi) || []).length;
  const closeDivs = (trimmed.match(/<\/div>/gi) || []).length;
  if (Math.abs(openDivs - closeDivs) > 1) {
    syntaxScore -= 0.2;
    issues.push(`Unbalanced div tags (${openDivs} open, ${closeDivs} close)`);
  }
  // Check KaTeX integrity
  if (slideHtml.includes("$$")) {
    const displayCount = (slideHtml.match(/\$\$/g) || []).length;
    if (displayCount % 2 !== 0) {
      syntaxScore -= 0.3;
      issues.push("Unclosed KaTeX display equation ($$)");
    }
  }
  syntaxScore = Math.max(0.1, syntaxScore);

  // 3. Anti-Slop & Buzzwords (Weight ~0.20)
  let antiSlopScore = 1.0;
  const slopPatterns = [
    /\bsystemic invariants\b/i,
    /\badversary threat taxonomies\b/i,
    /\boperational paradigms\b/i,
    /\bholistic synergy\b/i,
    /\bthis slide (?:explores|outlines|examines|compares)\b/i,
    /\bseamlessly integrates\b/i,
    /\bdelivering value\b/i,
  ];
  for (const pat of slopPatterns) {
    if (pat.test(slideHtml)) {
      antiSlopScore -= 0.2;
      issues.push(`Contains AI slop buzzword matching ${pat}`);
    }
  }
  antiSlopScore = Math.max(0.1, antiSlopScore);

  // 4. Visual Diversity (Weight ~0.15)
  let diversityScore = 1.0;
  if (precedingArchetypes.length > 0) {
    const lastArchetype = precedingArchetypes[precedingArchetypes.length - 1];
    if (lastArchetype === archetypeId) {
      diversityScore -= 0.4;
      issues.push(`Repeated identical archetype "${archetypeId}" from immediately preceding slide`);
    }
    const recentGlassCards = (slideHtml.match(/class=["'][^"']*glass-card/g) || []).length;
    if (recentGlassCards >= 3 && lastArchetype === "hero-split-overview") {
      diversityScore -= 0.2;
      issues.push("Repeated 3-card grid structure");
    }
  }
  diversityScore = Math.max(0.1, diversityScore);

  // 5. Fidelity heuristic: check presence of extracted keywords
  let fidelityScore = 0.7;
  if (analysisSnippet) {
    const rawTokens = analysisSnippet
      .split(/\s+/)
      .map((t) => t.replace(/[^a-zA-Z0-9]/g, "").toLowerCase())
      .filter((t) => t.length >= 6);
    const uniqueTokens = Array.from(new Set(rawTokens)).slice(0, 20);
    const lowerHtml = slideHtml.toLowerCase();
    const hits = uniqueTokens.filter((token) => lowerHtml.includes(token)).length;
    const hitRate = uniqueTokens.length > 0 ? hits / uniqueTokens.length : 0.5;
    fidelityScore = 0.4 + 0.6 * hitRate;
  }

  return {
    archetypeScore,
    syntaxScore,
    antiSlopScore,
    diversityScore,
    fidelityScore,
    ruleCritique: issues,
  };
}

/**
 * Combined Neural + Rule Reward Model.
 * Evaluates candidate slide HTML and returns scalar reward $R \in [0, 1]$.
 */
export async function evaluateSlideReward(params: {
  slideHtml: string;
  topic: string;
  slideIndex: number;
  totalSlides: number;
  archetypeId: VisualArchetypeId;
  analysisSnippet: string;
  precedingArchetypes?: string[];
  domain?: DocumentDomain;
}): Promise<SlideRewardBreakdown> {
  const {
    slideHtml,
    topic,
    slideIndex,
    totalSlides,
    archetypeId,
    analysisSnippet,
    precedingArchetypes = [],
    domain,
  } = params;

  // 1. Fast deterministic rule rewards
  const rules = computeRuleReward(slideHtml, archetypeId, analysisSnippet, precedingArchetypes);

  // 2. Neural Judge Reward via Gemini Flash (if available)
  let neuralFidelity = rules.fidelityScore;
  let neuralCritique = "";

  if (geminiService.isAvailable()) {
    try {
      const client = geminiService.getClient();
      const prompt = `You are a strict Reinforcement Learning Reward Model evaluating Keynote slide quality.
Score this slide draft (0.0 to 1.0) on TOPIC FIDELITY & TECHNICAL SPECIFICITY.

TOPIC: "${topic}" (Domain: ${domain || "general"})
TARGET ARCHETYPE: "${archetypeId}"
SLIDE POSITION: ${slideIndex + 1} of ${totalSlides}

DOMAIN KNOWLEDGE BASE (Must ground all claims):
"""
${analysisSnippet.slice(0, 2000)}
"""

SLIDE HTML CANDIDATE:
"""
${slideHtml}
"""

REWARD METRICS (Output JSON only):
{
  "fidelityScore": <number 0.0 to 1.0>,
  "visualDensityScore": <number 0.0 to 1.0>,
  "conciseCritique": "<1-sentence summary of strongest defect or approval>"
}`;

      const res = await client.chat.completions.create({
        model: geminiService.getModel(),
        messages: [
          { role: "system", content: "You are a specialized RL reward scoring model. Output valid JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 300,
        response_format: { type: "json_object" } as any,
      });

      const parsed = JSON.parse(res.choices?.[0]?.message?.content || "{}");
      if (typeof parsed.fidelityScore === "number") {
        neuralFidelity = Math.max(0, Math.min(1, parsed.fidelityScore));
      }
      if (parsed.conciseCritique) {
        neuralCritique = parsed.conciseCritique;
      }
    } catch {
      // Fallback seamlessly to rule-based fidelity
      neuralFidelity = rules.fidelityScore;
    }
  }

  // 3. Compute weighted scalar reward R in [0, 1]
  const fidelityScore = Number((0.4 * rules.fidelityScore + 0.6 * neuralFidelity).toFixed(2));
  const archetypeScore = Number(rules.archetypeScore.toFixed(2));
  const syntaxScore = Number(rules.syntaxScore.toFixed(2));
  const antiSlopScore = Number(rules.antiSlopScore.toFixed(2));
  const diversityScore = Number(rules.diversityScore.toFixed(2));

  const totalReward = Number(
    (
      0.35 * archetypeScore +
      0.30 * fidelityScore +
      0.15 * syntaxScore +
      0.10 * antiSlopScore +
      0.10 * diversityScore
    ).toFixed(2)
  );

  const critiqueParts = [...rules.ruleCritique];
  if (neuralCritique) critiqueParts.push(neuralCritique);
  const critique = critiqueParts.length > 0 ? critiqueParts.join("; ") : "Slide meets all excellence criteria.";

  return {
    archetypeScore,
    fidelityScore,
    syntaxScore,
    antiSlopScore,
    diversityScore,
    totalReward,
    critique,
  };
}
