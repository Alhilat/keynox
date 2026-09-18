import OpenAI from "openai";
import { config } from "../config";
import { extractCleanTopic } from "./topic-extractor";

export interface Stage1AnalysisResult {
  analysis: string;
  cleanTopic: string;
}

const PRIMARY_MODEL = "nvidia/nemotron-3-super-120b-a12b";
const FALLBACK_MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";

/**
 * Model 1: Deep Document & Topic Analysis & Information Extractor
 * 
 * Takes the raw uploaded PDF document text or topic and performs an exhaustive
 * domain extraction:
 * - Domain thesis, core breakthrough, and operational objectives
 * - Exact quantitative metrics, benchmark figures, and dataset specifics
 * - Mathematical formulas, KaTeX equations, and technical derivations
 * - Architectural components, system invariants, and state transitions
 * - Comparative trade-offs and empirical findings
 */
export async function runStage1Analyzer(
  rawContent: string,
  targetCount: number,
  onChunk: (delta: string, isReasoning: boolean) => void
): Promise<Stage1AnalysisResult> {
  const { title: cleanTopic } = extractCleanTopic(rawContent);
  let analysisText = "";

  const apiKey = config.nvidiaApiKeyUltra || config.nvidiaApiKey;
  const openai = new OpenAI({
    apiKey,
    baseURL: config.nvidiaBaseUrl,
  });

  const prompt = `You are a Principal Scientific & Technical Analyst (Model 1 in a 3-stage presentation pipeline).
Your sole objective is to deeply analyze the provided document/topic and extract all foundational domain knowledge, facts, formulas, and metrics.

SOURCE DOCUMENT / TOPIC CONTENT:
"""
${rawContent}
"""

TARGET PRESENTATION SCOPE: ${targetCount} Keynote Slides

INSTRUCTIONS FOR DEEP KNOWLEDGE EXTRACTION:
1. DOMAIN THESIS & CORE PROBLEM: What exact technical, scientific, or practical problem does this document address? What is the primary breakthrough or mechanism?
2. CONCRETE QUANTITATIVE DATA & METRICS: Extract all real numbers, benchmark percentages, latency figures, speedups, and dimensions mentioned in the text. (Never invent placeholder numbers).
3. MATHEMATICAL FORMULAS & INVARIANTS: Extract all operational formulas, loss functions, algorithms, or equations. Format them clearly with mathematical terms.
4. ARCHITECTURAL COMPONENTS & PIPELINE FLOW: Detail the exact modules, physical layers, data pipelines, or hardware setups described.
5. DOMAIN TRADE-OFFS & INSIGHTS: Detail the key trade-offs, empirical limitations, and practical takeaways.

OUTPUT FORMAT:
Synthesize a comprehensive, highly technical Domain Knowledge Extraction Report with structured sections:
# SECTION 1: DOMAIN THESIS & CORE MECHANISM
# SECTION 2: HARD QUANTITATIVE METRICS & BENCHMARK FIGURES
# SECTION 3: MATHEMATICAL FORMULAS, INVARIANTS & EQUATIONS
# SECTION 4: SYSTEM ARCHITECTURE, PIPELINE FLOW & HARDWARE ENTITIES
# SECTION 5: KEY TAKEAWAYS & EMPIRICAL TRADE-OFFS

CRITICAL MANDATE:
Extract 100% concrete facts directly from the document. Do not summarize with generic high-level fluff or corporate buzzwords. Output exhaustive, high-density technical analysis for Model 2.`;

  // Attempt 1: Nemotron 120B Super
  try {
    const stream = await openai.chat.completions.create({
      model: PRIMARY_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an elite Principal Technical Analyst. Your mission is to analyze technical papers and documents with 100% topic fidelity and extract detailed mathematical, quantitative, and architectural models. Never output shallow summaries or boilerplate filler.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 3500,
      temperature: 0.4,
      stream: true,
    });

    for await (const chunk of stream) {
      const reasoning = (chunk.choices?.[0]?.delta as any)?.reasoning_content || "";
      if (reasoning) {
        onChunk(reasoning, true);
      }
      const delta = chunk.choices?.[0]?.delta?.content || "";
      if (delta) {
        analysisText += delta;
        onChunk(delta, false);
      }
    }
  } catch (err: any) {
    console.warn(`[Stage1Analyzer] Primary model ${PRIMARY_MODEL} error (${err?.message}). Trying fallback ${FALLBACK_MODEL}...`);
  }

  // Attempt 2: Nemotron 3.5 Lightning (fast fallback)
  if (!analysisText || analysisText.trim().length < 120) {
    try {
      analysisText = "";
      const stream = await openai.chat.completions.create({
        model: FALLBACK_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are an elite Principal Technical Analyst. Your mission is to analyze technical papers and documents with 100% topic fidelity and extract detailed mathematical, quantitative, and architectural models.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 3500,
        temperature: 0.4,
        stream: true,
      });

      for await (const chunk of stream) {
        const reasoning = (chunk.choices?.[0]?.delta as any)?.reasoning_content || "";
        if (reasoning) {
          onChunk(reasoning, true);
        }
        const delta = chunk.choices?.[0]?.delta?.content || "";
        if (delta) {
          analysisText += delta;
          onChunk(delta, false);
        }
      }
    } catch (err: any) {
      console.warn(`[Stage1Analyzer] Fallback model error:`, err?.message || err);
    }
  }

  // Fallback: Direct extractive analysis if network/API fails
  if (!analysisText || analysisText.trim().length < 80) {
    console.warn("[Stage1Analyzer] Generating direct extractive analysis from source content...");
    const sentences = rawContent
      .split(/[\n\.\?\!]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20 && !s.toLowerCase().startsWith("topic:") && !s.toLowerCase().startsWith("target:"));

    const p1 = sentences[0] || `Initialization and boundary setup for ${cleanTopic}`;
    const p2 = sentences[1] || `Core operational execution and transformation`;
    const p3 = sentences[2] || `Verification, invariant enforcement, and state resolution`;
    const p4 = sentences[3] || `Output emission and operational feedback`;

    analysisText = `# SECTION 1: DOMAIN THESIS & CORE MECHANISM
- Primary Principle: ${p1}
- Operational Focus: ${p2}

# SECTION 2: HARD QUANTITATIVE METRICS & BENCHMARK FIGURES
- Target Scope: ${targetCount} Slide architectural deep dive
- Key Parameters: ${sentences[4] || `Direct empirical metrics and scaling thresholds`}

# SECTION 3: MATHEMATICAL FORMULAS, INVARIANTS & EQUATIONS
- System Invariant: Functional state preservation and boundary validation
- Formulation: Direct parameter evaluation derived from domain context

# SECTION 4: SYSTEM ARCHITECTURE, PIPELINE FLOW & HARDWARE ENTITIES
- Architectural Pipeline: ${p1.slice(0, 28)} -> ${p2.slice(0, 28)} -> ${p3.slice(0, 28)} -> ${p4.slice(0, 28)}
- Entity Model: Technical components and execution runtime

# SECTION 5: KEY TAKEAWAYS & EMPIRICAL TRADE-OFFS
- Takeaway: ${sentences[5] || `Critical operational considerations for ${cleanTopic}`}`;

    onChunk("\n\n" + analysisText, false);
  }

  return { analysis: analysisText, cleanTopic };
}
