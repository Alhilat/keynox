import OpenAI from "openai";
import { config } from "../config";
import { sanitizeDocumentContent } from "./topic-extractor";
import { geminiService } from "../services/geminiService";

export interface Stage2StoryboardResult {
  storyboard: string;
  usedModel?: string;
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
  onChunk: (delta: string, isReasoning: boolean) => void,
  engine: "gemini" | "nvidia" | "auto" = "auto"
): Promise<Stage2StoryboardResult> {
  let storyboardText = "";
  let usedModel = PRIMARY_MODEL;
  const cleanAnalysis = sanitizeDocumentContent(analysisText);

  const apiKey = config.nvidiaApiKeyUltra || config.nvidiaApiKey;
  const openai = new OpenAI({
    apiKey,
    baseURL: config.nvidiaBaseUrl,
  });

  const prompt = `You are an executive Presentation Director & Visual Storyboard Architect (Model 2 in a 3-stage presentation pipeline).
You are given the deep domain analysis and technical extraction from Model 1 for: "${cleanTopic}".

DOMAIN KNOWLEDGE EXTRACTION FROM MODEL 1:
"""
${cleanAnalysis}
"""

TARGET SLIDE COUNT: Exactly ${targetCount} Slides

YOUR OBJECTIVE:
1. Direct the visual architecture & narrative TEXT for each of the ${targetCount} slides.
2. FULL DOCUMENT CHRONOLOGICAL SPAN: Distribute the ${targetCount} slides across the ENTIRE document from page 1 to the end. Never restrict all slides to a single section or listing. If the document covers Namespaces, Docker Architecture, Dockerfile Builds, and Open vSwitch Network Namespaces, each distinct technical pillar MUST receive its own dedicated slide.
3. ZERO PROMPT NOISE & ZERO BUZZWORDS: Never output prompt metadata ("TARGET SLIDE COUNT", "PREFERRED THEME") or canned filler ("Deterministic state validation", "Production scaling threshold") in your titles or content!
4. MANDATORY AUTHENTIC VISUAL MODEL: For each slide, define the exact technical visual entity from the document:
   - Architectural Subsystem Stack (e.g. Docker Architecture: App Layer -> Bin/Libs -> Docker Engine -> Host OS -> Hardware)
   - Dual-PID Namespace Mapping (e.g. ntpd: Container PID 3 vs Host PID 5836)
   - Image Build & Commit Pipeline (e.g. Dockerfile -> Build v0 -> Run & Install -> Commit v1 -> Final Image)
   - Open vSwitch SDN Network Topology (e.g. Container eth0-d <-> veth0-d <-> ovsbr <-> veth0-e <-> eth0-e in emxns)
   - Protocol Lease Sequence (e.g. DHCPDISCOVER -> DHCPOFFER 192.168.1.24 -> DHCPREQUEST -> DHCPACK)
   - Terminal Shell Execution (e.g. real commands, flags, and outputs like $ docker run busybox date UTC vs BST)
5. CLASSIC ACADEMIC RESTRAINT: Use consistent, restrained, dignified academic layouts (Oxford Blue, Slate, White). Do NOT use flashy neon colors, rainbow palettes, or AI buzzword badges.

REQUIREMENTS FOR EACH SLIDE (SLIDE 1 TO SLIDE ${targetCount}):
You MUST generate EXACTLY ${targetCount} slides numbered SLIDE 1 to SLIDE ${targetCount}. Never stop early!
For every single slide, you MUST provide:
- SLIDE NUMBER & TITLE: Direct, human, clear technical headline (e.g. "Linux Namespaces & Process Isolation"). NEVER force the word "Invariant", "Taxonomy", or corporate buzzwords into titles!
- SUBTITLE & CATEGORY: Short, concise category (e.g., KERNEL INTERNALS, DOCKER ARCHITECTURE, NETWORK PROTOCOLS). Never use pipe "|" or buzzwords like "ARCHITECTURE | INVARIANTS". Subtitles must be natural, informative, human explanations—NEVER robotic participle filler ("Establishing foundational enterprise asset protection through...").
- SLIDE NARRATIVE & CONTENT (100% CONCRETE FACTS):
  * Primary technical mechanism extracted from that section of the document.
  * Real commands, flags, configuration snippets, and numeric metrics (e.g. 1.13MB, 158MB, 192.168.1.24, 0.425ms).
- VISUAL MODEL & COMPONENT DIRECTIVE:
  Specify the visual model and recommend the optimal template:
  * TEMPLATE_01_HERO_SPLIT_OVERVIEW: Hero concept card + 3 key takeaways (.grid-split)
  * TEMPLATE_02_TERMINAL_CODE_EXPLORER: Syntax-highlighted CLI terminal + explanation card (.terminal-card)
  * TEMPLATE_03_CODE_DIFF_EVOLUTION: Side-by-side terminal/code cards (.diff-container)
  * TEMPLATE_04_SEQUENTIAL_PIPELINE_4: 4-stage pipeline with packet pulses & SVG icons (.motion-pipeline)
  * TEMPLATE_05_STREAMLINED_PIPELINE_3: 3-stage streamlined progression (.motion-pipeline)
  * TEMPLATE_06_CONNECTED_TOPOLOGY_FLOW: Horizontal 4-node flow with arrows (.flow-diagram)
  * TEMPLATE_07_DUAL_STREAM_CONVERGENCE: Parallel inputs merging into core engine (.flow-diagram)
  * TEMPLATE_08_INTERACTIVE_SLIDER_SIMULATOR: Dynamic slider + telemetry gauge (.sim-container)
  * TEMPLATE_09_COMPARISON_MATRIX_TABLE: Multi-dimension matrix table with status badges (.matrix-table)
  * TEMPLATE_10_DYNAMIC_BAR_CHART_BENCHMARK: Quantitative bar chart with value labels (.chart-card)
  * TEMPLATE_11_TRI_CARD_CONCEPT_GRID: 3 thematic cards side-by-side (.grid-3)
  * TEMPLATE_12_QUAD_METRIC_DASHBOARD: 2x2 grid of key quantitative figures (.stat-grid)
  * TEMPLATE_13_MATHEMATICAL_DERIVATION_STEP: KaTeX equation block ONLY IF real mathematical equations exist in the domain. NEVER invent fake pseudo-math for conceptual topics!
  * TEMPLATE_14_STATE_MACHINE_TRANSITION: 3-state transition nodes with triggers (.state-diagram)
  * TEMPLATE_15_HIERARCHICAL_LAYER_STACK: Vertical architectural layers (.layer-stack)
  * TEMPLATE_16_INTERACTIVE_SVG_VENN: Overlapping SVG Venn diagram (.venn-container)
  * TEMPLATE_17_THREE_JS_SPATIAL_WORLD: Interactive 3D WebGL orbit canvas (.three-container)
  * TEMPLATE_18_CHRONOLOGICAL_TIMELINE: Milestone progression track (.timeline-track)
  * TEMPLATE_19_PRO_CON_TRADE_OFF_STUDY: Academic benefits vs operational constraints (.grid-2)
  * TEMPLATE_20_EXECUTIVE_CHECKLIST_SUMMARY: Verification and compliance checklist (.checklist-group)

CRITICAL MANDATES:
- NATURAL HUMAN VOICE: Write like a leading computer science professor at MIT, Stanford, or Oxford. Direct, clear, and dignified.
- ZERO PSEUDO-MATH: Do NOT create fake boolean or set formulas for non-mathematical topics.
- DIVERSITY: Vary templates across slides (do not use the same template twice in a row).
- ZERO TEXT-ONLY ARTICLE SLOP: Every slide must feature an engaging, authentic visual structure from the catalog.
- ABSOLUTELY NO EMOJIS: Maintain clean, professional, executive typography.
- 100% domain fidelity derived from Model 1's extracted facts.`;

  // Attempt 0: Gemini 3.8 Flash (if engine is gemini or auto)
  const shouldTryGemini = (engine === "gemini" || engine === "auto") && geminiService.isAvailable();
  if (shouldTryGemini) {
    try {
      usedModel = `google/${geminiService.getModel()}`;
      await geminiService.streamChat({
        messages: [
          {
            role: "system",
            content:
              "You are an executive Presentation Director and Visual Storyboard Architect. You write high-impact keynote slide copy and specify exact visual and photographic assets derived from technical domain analysis.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
        maxTokens: 4000,
        onReasoning: (delta) => onChunk(delta, true),
        onChunk: (delta) => {
          storyboardText += delta;
          onChunk(delta, false);
        },
      });

      if (storyboardText && storyboardText.trim().length >= 150) {
        return { storyboard: storyboardText, usedModel };
      }
    } catch (geminiErr: any) {
      console.warn(`[Stage2Storyboard] Gemini 3.8 Flash error (${geminiErr?.message}). Falling back to Nemotron...`);
      storyboardText = "";
    }
  }

  // Attempt 1: Nemotron 120B Super
  try {
    usedModel = PRIMARY_MODEL;
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
      { cat: "SYSTEM ARCHITECTURE", arche: "Terminal Window or Split Hero Card", getPoint: () => getConcept(0, "Core architectural design and primary mechanisms") },
      { cat: "EXECUTION PIPELINE", arche: "4-Stage Sequential Motion Pipeline (.motion-pipeline)", getPoint: () => getConcept(1, "Phase transitions and operational sequence") },
      { cat: "DYNAMIC SIMULATION", arche: "Interactive Parameter Simulator (.sim-container)", getPoint: () => getConcept(2, "Operational parameter space and sensitivity evaluation") },
      { cat: "SYSTEM TOPOLOGY", arche: "Connected Flow Topology (.flow-diagram)", getPoint: () => getConcept(3, "Component interaction graph and interface boundaries") },
      { cat: "TRADE-OFF MATRIX", arche: "Dimensional Comparison Matrix (.matrix-table)", getPoint: () => getConcept(4, "Empirical benchmarks and resource trade-offs") },
      { cat: "PERFORMANCE SCALING", arche: "Dynamic Visual Bar Chart (.chart-card)", getPoint: () => getConcept(5, "Throughput characteristics and quantitative bounds") },
      { cat: "FAULT RESILIENCE", arche: "Multi-Dimensional Comparison Matrix (.matrix-table)", getPoint: () => getConcept(6, "Failure domain containment and recovery mechanisms") },
      { cat: "PRODUCTION STANDARDS", arche: "Connected Architecture Flow Topology (.flow-diagram)", getPoint: () => getConcept(7, "Operational guarantees and verification") },
    ];

    for (let i = 0; i < targetCount; i++) {
      const t = themes[i % themes.length];
      const point = t.getPoint();
      const slideTitle = point.length > 55 ? point.slice(0, 52) + "..." : point;
      dynamicSlides.push(`SLIDE ${i + 1}: ${slideTitle}
- CATEGORY: ${t.cat}
- NARRATIVE: ${point}.
- TECHNICAL_SPECS: Key mechanisms extracted from ${cleanTopic} domain analysis.
- VISUAL_SPEC: ${t.arche} with authentic domain data.`);
    }

    storyboardText = dynamicSlides.join("\n\n");

    onChunk("\n\n" + storyboardText, false);
  }

  return { storyboard: storyboardText, usedModel };
}
