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
    const lines = (analysisText || cleanTopic)
      .split(/[\r\n]+/)
      .map((l) => l.replace(/^[#*\-\s\d\.]+/, "").trim())
      .filter((l) => l.length > 20 && !l.toUpperCase().startsWith("SECTION"));

    const getConcept = (idx: number, fallback: string) => lines[idx] || `${fallback} of ${cleanTopic}`;

    const dynamicSlides: string[] = [];
    const themes = [
      { cat: "ARCHITECTURAL FOUNDATIONS", arche: "Terminal Window or Split Hero Card", getPoint: () => getConcept(0, "Foundational architectural thesis and primary mechanisms") },
      { cat: "EXECUTION PIPELINE", arche: "4-Stage Sequential Motion Pipeline (.motion-pipeline)", getPoint: () => getConcept(1, "Deterministic phase transitions and operational sequence") },
      { cat: "DYNAMIC SIMULATION", arche: "Interactive Parameter Simulator (.sim-container)", getPoint: () => getConcept(2, "Operational parameter space and sensitivity evaluation") },
      { cat: "SYSTEM TOPOLOGY", arche: "Connected Flow Topology (.flow-diagram)", getPoint: () => getConcept(3, "Component interaction graph and interface boundaries") },
      { cat: "TRADE-OFF MATRIX", arche: "Dimensional Comparison Matrix (.matrix-table)", getPoint: () => getConcept(4, "Empirical benchmarks, scaling invariants, and resource trade-offs") },
      { cat: "PERFORMANCE SCALING", arche: "Dynamic Visual Bar Chart (.chart-card)", getPoint: () => getConcept(5, "Throughput characteristics and quantitative bounds") },
      { cat: "FAULT RESILIENCE", arche: "Multi-Dimensional Comparison Matrix (.matrix-table)", getPoint: () => getConcept(6, "Failure domain containment and recovery mechanisms") },
      { cat: "PRODUCTION SLA", arche: "Connected Architecture Flow Topology (.flow-diagram)", getPoint: () => getConcept(7, "Operational guarantees and mission-critical verification") },
    ];

    for (let i = 0; i < targetCount; i++) {
      const t = themes[i % themes.length];
      const point = t.getPoint();
      const slideTitle = point.length > 55 ? point.slice(0, 52) + "..." : point;
      dynamicSlides.push(`SLIDE ${i + 1}: ${slideTitle}
- CATEGORY: ${t.cat}
- NARRATIVE: ${point}.
- INVARIANTS: Derived directly from ${cleanTopic} domain analysis.
- VISUAL_SPEC: ${t.arche} with authentic domain data.`);
    }

    storyboardText = dynamicSlides.join("\n\n");

    onChunk("\n\n" + storyboardText, false);
  }

  return { storyboard: storyboardText };
}
