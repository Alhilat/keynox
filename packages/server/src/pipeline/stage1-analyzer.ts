import OpenAI from "openai";
import { config } from "../config";
import { extractCleanTopic } from "./topic-extractor";
import { geminiService } from "../services/geminiService";

export interface Stage1AnalysisResult {
  analysis: string;
  cleanTopic: string;
  usedModel?: string;
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
  onChunk: (delta: string, isReasoning: boolean) => void,
  engine: "gemini" | "nvidia" | "auto" = "auto"
): Promise<Stage1AnalysisResult> {
  const { title: cleanTopic } = extractCleanTopic(rawContent);
  let analysisText = "";
  let usedModel = PRIMARY_MODEL;

  const apiKey = config.nvidiaApiKeyUltra || config.nvidiaApiKey;
  const openai = new OpenAI({
    apiKey,
    baseURL: config.nvidiaBaseUrl,
  });

  const prompt = `You are a Principal Scientific & Technical Analyst (Model 1 in a 3-stage presentation pipeline).
Your mission is to deeply analyze the ENTIRE provided document/topic and extract all foundational domain knowledge, facts, commands, listings, formulas, and diagrams with 100% fidelity.

SOURCE DOCUMENT / TOPIC CONTENT:
"""
${rawContent}
"""

TARGET PRESENTATION SCOPE: ${targetCount} Keynote Slides

INSTRUCTIONS FOR DEEP KNOWLEDGE EXTRACTION:
1. DOCUMENT TITLE & SCOPE: Identify the true overarching document title (e.g. "Chapter 3: Linux Containers, Namespaces & Docker Architecture"). Do NOT use a single listing number or sub-figure caption as the document title!
2. CHRONOLOGICAL SECTION BREAKDOWN: Walk through the ENTIRE document from page 1 to the end. List every major section, subsystem, and protocol covered (e.g. 3.1 Namespaces, 3.2 Docker Engine, 3.2.3 Dockerfile & Build, 3.2.4 Open vSwitch & Network Namespaces).
3. AUTHENTIC CODE LISTINGS, COMMANDS & OUTPUTS: Extract exact terminal commands, flags, configurations, and outputs from the text (e.g. $ sudo ./container_demo root/ -u, $ ls -di root: 10240432, container PID 1 vs host PID 5836, docker run busybox date UTC vs BST, Dockerfile directives, ovs-vsctl commands, dhcpd.conf, DORA lease exchange 192.168.1.24, ping latency 0.425ms).
4. CONCRETE ARCHITECTURAL DIAGRAMS & TOPOLOGIES: Describe the exact diagrams and system topologies present in the document (e.g. Fig 3.1 Docker Layered Architecture, Fig 3.3 Open vSwitch Virtual Network with veth pairs, Dual-PID mapping table, Dockerfile Build & Commit pipeline).
5. HARD QUANTITATIVE METRICS: Real image sizes (1.13MB, 158MB), PIDs, IP addresses (192.168.1.6, 192.168.1.24), ping round-trip times (0.425ms), and NTP offsets (0.000020s).

OUTPUT FORMAT:
Synthesize a comprehensive, highly technical Domain Knowledge Extraction Report with structured sections:
# SECTION 1: TRUE DOCUMENT TITLE & DOMAIN THESIS
# SECTION 2: CHRONOLOGICAL SECTION-BY-SECTION COVERAGE
# SECTION 3: AUTHENTIC ARCHITECTURAL DIAGRAMS & SYSTEM TOPOLOGIES
# SECTION 4: REAL TERMINAL COMMANDS, LISTINGS, CODE & CONFIGURATIONS
# SECTION 5: CONCRETE METRICS, PIDS, ADDRESSES & BENCHMARK FIGURES
# SECTION 6: KEY DOMAIN CONCEPTS & CORE PRINCIPLES

CRITICAL MANDATE:
Extract 100% concrete facts directly from the document. Cover the entire text from start to finish so no section is lost. Write in clear, natural academic English. Strictly avoid generic AI filler buzzwords (e.g. repetitive "invariants", "taxonomies", "paradigms", "telemetry") unless they are the actual technical terminology in the source text. Never output generic corporate buzzwords or placeholder templates.`;

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
              "You are an elite Principal Technical Analyst. Your mission is to analyze technical papers and documents with 100% topic fidelity and extract detailed mathematical, quantitative, and architectural models. Never output shallow summaries or boilerplate filler.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        maxTokens: 3500,
        onReasoning: (delta) => onChunk(delta, true),
        onChunk: (delta) => {
          analysisText += delta;
          onChunk(delta, false);
        },
      });

      if (analysisText && analysisText.trim().length >= 150) {
        return { analysis: analysisText, cleanTopic, usedModel };
      }
    } catch (geminiErr: any) {
      console.warn(`[Stage1Analyzer] Gemini 3.8 Flash error (${geminiErr?.message}). Falling back to Nemotron...`);
      analysisText = "";
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

    const p1 = sentences[0] || `Core architecture and mechanisms for ${cleanTopic}`;
    const p2 = sentences[1] || `Operational execution and protocol flow`;
    const p3 = sentences[2] || `Verification, security boundaries, and state resolution`;
    const p4 = sentences[3] || `Output emission and operational feedback`;

    analysisText = `# SECTION 1: DOMAIN THESIS & CORE MECHANISMS
- Primary Mechanism: ${p1}
- Operational Focus: ${p2}

# SECTION 2: HARD QUANTITATIVE METRICS & BENCHMARK FIGURES
- Target Scope: ${targetCount} Slide technical deep dive
- Key Parameters: ${sentences[4] || `Direct empirical metrics and operational limits`}

# SECTION 3: CORE ARCHITECTURAL PRINCIPLES & SPECIFICATIONS
- System Specifications: Functional state preservation and boundary validation
- Formulation: Direct parameter evaluation derived from domain context

# SECTION 4: SYSTEM ARCHITECTURE, PIPELINE FLOW & HARDWARE ENTITIES
- Architectural Pipeline: ${p1.slice(0, 28)} -> ${p2.slice(0, 28)} -> ${p3.slice(0, 28)} -> ${p4.slice(0, 28)}
- Entity Model: Technical components and execution runtime

# SECTION 5: KEY TAKEAWAYS & EMPIRICAL TRADE-OFFS
- Takeaway: ${sentences[5] || `Critical operational considerations for ${cleanTopic}`}`;

    onChunk("\n\n" + analysisText, false);
  }

  return { analysis: analysisText, cleanTopic, usedModel };
}
