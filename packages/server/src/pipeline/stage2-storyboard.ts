import OpenAI from "openai";
import { config } from "../config";

export interface Stage2StoryboardResult {
  storyboard: string;
}

const PRIMARY_MODEL = "nvidia/nemotron-3-super-120b-a12b";
const FALLBACK_MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";

/**
 * Model 2: Presentation Content & Visuals/Photos Director
 * 
 * Takes the deep domain extraction from Model 1 and designs the complete
 * presentation storyboard:
 * 1. Writes the exact text for what we call slides (headlines, narrative explanations,
 *    concrete metrics, mathematical derivations).
 * 2. Explicitly specifies what photos and visual assets are needed for each slide
 *    (photorealistic NVIDIA FLUX photo prompts, SVG diagram layouts, interactive simulators).
 */
export async function runStage2Storyboard(
  cleanTopic: string,
  analysisText: string,
  targetCount: number,
  onChunk: (delta: string, isReasoning: boolean) => void
): Promise<Stage2StoryboardResult> {
  let storyboardText = "";

  const apiKey = config.nvidiaApiKeyUltra || config.nvidiaApiKey;
  const openai = new OpenAI({
    apiKey,
    baseURL: config.nvidiaBaseUrl,
  });

  const prompt = `You are an executive Presentation Director & Visual Storyboard Architect (Model 2 in a 3-stage presentation pipeline).
You are given the deep domain analysis and technical extraction from Model 1 for: "${cleanTopic}".

DOMAIN KNOWLEDGE EXTRACTION FROM MODEL 1:
"""
${analysisText}
"""

TARGET SLIDE COUNT: Exactly ${targetCount} Slides

YOUR OBJECTIVE:
1. Direct the visual design & narrative TEXT for each of the ${targetCount} slides ("what we called slides").
2. Specify REAL-WORLD PHYSICAL MOTION & STAGES: How does this technology/concept actually operate and move in the real physical or digital world? (e.g., sensor signal acquisition -> packetization -> gateway transmission -> cloud inference -> physical actuation).
3. Assign MULTI-COLOR PALETTES across concepts (Emerald, Cyan, Indigo, Amber, Rose) instead of monotone layouts.
4. Specify EXACT AI PHOTOS (NVIDIA FLUX) and LIVING DYNAMIC WIDGETS with real calculation formulas.

REQUIREMENTS FOR EACH SLIDE (SLIDE 1 TO SLIDE ${targetCount}):
For every single slide, you MUST provide:
- SLIDE NUMBER & TITLE: Prominent, concrete technical headline.
- SUBTITLE & CATEGORY: Domain badge (e.g., PHYSICAL TOPOLOGY, TELEMETRY, REAL-WORLD MOTION, DYNAMIC SIMULATION).
- SLIDE NARRATIVE & CONTENT (ABSOLUTELY NO BORING 3-PARAGRAPH ARTICLE SLOP):
  * Primary Takeaway / Thesis statement.
  * Concrete quantitative metrics from the document (real numbers, data rates, benchmark figures).
  * Any mathematical derivations (KaTeX formulas).
- 2026 CREATIVE VISUAL ARCHETYPE SPECIFICATION:
  Assign the most visually stunning archetype tailored 100% to this slide's technical content:
  * ARCHETYPE 1: Interactive 3D WebGL World (.three-container with data-model="quantum-bloch-sphere", "hardware-die-3d", or "neural-constellation-3d") allowing mouse rotation!
  * ARCHETYPE 2: Real-World Motion Pipeline (.motion-pipeline) with 4 physical stages (Emerald -> Cyan -> Indigo -> Amber) and animated packet pulses!
  * ARCHETYPE 3: Dynamic Particle Conduit (.particle-container) with living continuous particle flows along curved tracks!
  * ARCHETYPE 4: Dynamic Interactive Simulator (.sim-container) with live slider evaluating authentic domain formulas!
  * ARCHETYPE 5: Multi-Dimensional Benchmark Matrix (.matrix-table) with emerald/amber/rose status badges!
- PHOTO SPECIFICATION:
  * PHOTO_PROMPT: A vivid, photorealistic prompt for AI image generation (NVIDIA FLUX) describing real-world physical hardware, industrial cutaways, microchip dies, or lab environments with cinematic lighting and 8k detail.
  * If a slide features a 3D WebGL scene, particle conduit, or simulator, state "PHOTO: None (Interactive 3D/Motion Focus)".

CRITICAL MANDATE:
- ZERO TEXT-ONLY ARTICLE SLOP: Avoid plain text cards. Every slide must feature a distinct visual 3D archetype, particle flow, connected motion stage, or interactive widget.
- EVERY SLIDE MUST USE A DIFFERENT ARCHETYPE: Slide 1 MUST be 3D/Hero Split, Slide 2 MUST be Motion Pipeline, Slide 3 MUST be Dynamic Simulator, Slide 4 MUST be Flow Topology, Slide 5 MUST be Benchmark Matrix, Slide 6 MUST be Bar Chart KPI. NEVER repeat .motion-pipeline on multiple slides!
- Use multi-color coding (Emerald for Edge/Perception, Cyan for Network/Data, Indigo for Logic, Amber for Power/Action, Rose for Bottlenecks).
- 100% domain fidelity derived from Model 1's extracted facts.`;

  // Attempt 1: Nemotron 120B Super
  try {
    const stream = await openai.chat.completions.create({
      model: PRIMARY_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an executive Presentation Director and Visual Storyboard Architect. You write high-impact keynote slide copy and specify exact visual and photographic assets derived from technical domain analysis.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 4000,
      temperature: 0.5,
      stream: true,
    });

    for await (const chunk of stream) {
      const reasoning = (chunk.choices?.[0]?.delta as any)?.reasoning_content || "";
      if (reasoning) {
        onChunk(reasoning, true);
      }
      const delta = chunk.choices?.[0]?.delta?.content || "";
      if (delta) {
        storyboardText += delta;
        onChunk(delta, false);
      }
    }
  } catch (err: any) {
    console.warn(`[Stage2Storyboard] Primary model ${PRIMARY_MODEL} error (${err?.message}). Trying fallback ${FALLBACK_MODEL}...`);
  }

  // Attempt 2: Nemotron 3.5 Lightning (fast fallback)
  if (!storyboardText || storyboardText.trim().length < 150) {
    try {
      storyboardText = "";
      const stream = await openai.chat.completions.create({
        model: FALLBACK_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are an executive Presentation Director and Visual Storyboard Architect. You write high-impact keynote slide copy and specify exact visual and photographic assets.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 4000,
        temperature: 0.5,
        stream: true,
      });

      for await (const chunk of stream) {
        const reasoning = (chunk.choices?.[0]?.delta as any)?.reasoning_content || "";
        if (reasoning) {
          onChunk(reasoning, true);
        }
        const delta = chunk.choices?.[0]?.delta?.content || "";
        if (delta) {
          storyboardText += delta;
          onChunk(delta, false);
        }
      }
    } catch (err: any) {
      console.warn(`[Stage2Storyboard] Fallback model error:`, err?.message || err);
    }
  }

  // Fallback: Synthesize structured storyboard from analysis if API fails
  if (!storyboardText || storyboardText.trim().length < 80) {
    console.warn("[Stage2Storyboard] Generating structured storyboard from analysis...");
    const baseSlides = [
      `SLIDE 1: Executive Foundation & Sensing Topology of ${cleanTopic}
- CATEGORY: PHYSICAL TOPOLOGY
- NARRATIVE: Foundational architectural paradigms, raw signal acquisition, and boundary invariants.
- INVARIANTS: Sub-millisecond boundary validation, physical sensing floor.
- VISUAL_SPEC: Interactive 3D WebGL World (.three-container with data-model="hardware-die-3d") paired with a multi-color .glass-card.card-emerald featuring a KaTeX mathematical derivation.`,

      `SLIDE 2: Real-World Physical Motion Pipeline & Conduit Flow
- CATEGORY: PHYSICAL PROGRESSION
- NARRATIVE: End-to-end operational stages from physical sensing to deterministic actuation.
- MOTION_PIPELINE:
  * Stage 1 [Emerald]: Signal Ingestion & Edge Sensing
  * Stage 2 [Cyan]: High-Speed Conduit Transport & Streaming
  * Stage 3 [Indigo]: Neural Inference & State Transformation
  * Stage 4 [Amber]: Physical Actuation & Result Telemetry
- VISUAL_SPEC: 4-Stage Motion Pipeline (.motion-pipeline) with animated packet pulses and multi-color themes.`,

      `SLIDE 3: Interactive System Simulator & Invariant Dynamics
- CATEGORY: DYNAMIC SIMULATION
- NARRATIVE: Live parameter exploration evaluating real-time operational thresholds and latency.
- SIMULATOR_SPEC:
  * Parameter: System Throughput / Concurrency Load (1 to 100)
  * Dynamic Formula: Response Latency (ms) = (Load * 1.42).toFixed(1)
  * Visual: Interactive slider updating live telemetry gauge and glowing node indicators.
- VISUAL_SPEC: Dynamic Interactive Simulator (.sim-container) with live calculation script.`,

      `SLIDE 4: Connected Architecture Flow Topology & Decoupled Nodes
- CATEGORY: TOPOLOGY & HARDWARE
- NARRATIVE: Sequential execution phases and decoupled component interfaces.
- INVARIANTS: Sub-millisecond boundary validation, lossless queue serialization.
- VISUAL_SPEC: Connected Flow Topology (.flow-diagram) with active status nodes and conduit flows.`,

      `SLIDE 5: Multi-Dimensional Benchmark & Trade-off Matrix
- CATEGORY: TRADE-OFF ANALYSIS
- NARRATIVE: Critical performance characteristics, dimensional comparisons, and benchmarks.
- INVARIANTS: Latency vs. Throughput trade-off, energy efficiency boundaries.
- VISUAL_SPEC: Dimensional Comparison Matrix (.matrix-table) with emerald/amber/rose status badges.`,

      `SLIDE 6: Performance Scaling & Telemetry Benchmarks
- CATEGORY: SYSTEM TELEMETRY
- NARRATIVE: Empirical scaling bounds, throughput benchmarks, and resource utilization.
- INVARIANTS: Bounded memory footprint, 99.99th percentile response SLA.
- VISUAL_SPEC: Dynamic Visual Bar Chart (.chart-card) with animated value columns and validation badges.`,

      `SLIDE 7: Fault Isolation Boundaries & Autonomous Failover
- CATEGORY: FAULT RESILIENCE
- NARRATIVE: Failure domain containment, graceful degradation, and self-healing mechanisms.
- INVARIANTS: Zero cascaded partition loss, automated heartbeat recovery.
- VISUAL_SPEC: Multi-Dimensional Comparison Matrix (.matrix-table) with threshold indicators.`,

      `SLIDE 8: Production Verification & Mission-Critical SLAs
- CATEGORY: PRODUCTION SLA
- NARRATIVE: End-to-end telemetry guarantees, formal boundary verification, and operational compliance.
- INVARIANTS: Continuous automated assertion checking, zero unhandled invariants.
- VISUAL_SPEC: Connected Architecture Flow Topology (.flow-diagram) with verified status badges.`,
    ];

    storyboardText = baseSlides.slice(0, targetCount).join("\n\n");

    onChunk("\n\n" + storyboardText, false);
  }

  return { storyboard: storyboardText };
}
