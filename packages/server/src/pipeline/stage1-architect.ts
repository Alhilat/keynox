import OpenAI from "openai";
import { config } from "../config";
import { extractCleanTopic, sanitizeDocumentContent } from "./topic-extractor";

export interface Stage1Result {
  outline: string;
  cleanTopic: string;
}

const PRIMARY_MODEL = "nvidia/nemotron-3-super-120b-a12b";
const FALLBACK_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b";

export async function runStage1Architect(
  topic: string,
  targetCount: number,
  isExplicit: boolean,
  reason: string,
  onChunk: (delta: string, isReasoning: boolean) => void
): Promise<Stage1Result> {
  const { title: cleanTopic } = extractCleanTopic(topic);
  const cleanDocument = sanitizeDocumentContent(topic);
  let outlineText = "";

  const apiKey = config.nvidiaApiKeyUltra || config.nvidiaApiKey;
  const openai = new OpenAI({
    apiKey,
    baseURL: config.nvidiaBaseUrl,
  });

  const prompt = `You are a Principal Presentation Architect. Synthesize a ${targetCount}-slide technical presentation blueprint strictly derived from the provided document content for "${cleanTopic}".

SOURCE DOCUMENT & CONTEXT:
"""
${cleanDocument}
"""

TARGET SLIDE COUNT: Exactly ${targetCount} Slides (${isExplicit ? "Explicit user request" : reason})

CRITICAL VISUAL DESIGN MANDATE (ZERO GENERIC SLIDES, 100% DOMAIN ACCURACY):
1. EXTRACT AUTHENTIC TECHNICAL ENTITIES: Look directly at the data structures, topologies, hierarchies, and commands in the document.
2. ZERO PROMPT LEAKAGE: Never mention "TARGET SLIDE COUNT", "PREFERRED THEME", or prompt metadata in your slide titles or outlines!
3. MANDATORY VISUAL MODEL FOR EVERY SLIDE: Every slide must specify an authentic visual entity derived directly from the document:
   - Data Structures & Pointer Graphs (e.g. Inode Direct/Indirect pointers, Directory mount trees, Hash tables)
   - Architectural Subsystem Stacks (e.g. VFS layer, Caches, Filesystem drivers, Kernel subsystems)
   - Memory & Disk Block Stripes (e.g. Superblock, Descriptors, Inode/Block Bitmaps, Inode Tables, Data Blocks)
   - Terminal CLI Executions (e.g. authentic shell commands with exact flags and realistic outputs from the document)
   - Domain Calculations & Math (e.g. Inode addressing capacity calculations, bandwidth/latency formulas)

Synthesize a bespoke ${targetCount}-slide visual explainer blueprint (SLIDE 1 through SLIDE ${targetCount}) where every slide has:
- SLIDE NUMBER & TITLE: Concrete technical headline naming the specific mechanism or data structure (e.g. "Inode Pointer Hierarchy: Direct & Indirect Addressing").
- CATEGORY: Domain badge (e.g. "STORAGE ARCHITECTURE", "KERNEL SUBSYSTEMS", "HIERARCHICAL MOUNTING").
- CORE VISUAL ENTITY: Explicit description of the authentic diagram, block stripe, pointer tree, or terminal execution to render.
- KEY TECHNICAL FACTS: 3-4 concrete facts, numbers, inode sizes, commands, or invariants extracted 100% from the text.`;

  // Attempt 1: Nemotron 120B Super
  try {
    const stream = await openai.chat.completions.create({
      model: PRIMARY_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a Principal Presentation Architect. Synthesize rich, highly technical slide outlines derived 100% from user documents. Never output generic boilerplate or placeholder variables.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 2500,
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
        outlineText += delta;
        onChunk(delta, false);
      }
    }
  } catch (err: any) {
    console.warn(`[Stage1Architect] Primary model ${PRIMARY_MODEL} error (${err?.message}). Trying fallback ${FALLBACK_MODEL}...`);
  }

  // Attempt 2: Nemotron 3.5 Lightning (fast fallback)
  if (!outlineText || outlineText.trim().length < 80) {
    try {
      outlineText = "";
      const stream = await openai.chat.completions.create({
        model: FALLBACK_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a Principal Presentation Architect. Synthesize rich, highly technical slide outlines derived 100% from user documents. Never output generic boilerplate or placeholder variables.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 2500,
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
          outlineText += delta;
          onChunk(delta, false);
        }
      }
    } catch (err: any) {
      console.warn(`[Stage1Architect] Fallback model error:`, err?.message || err);
    }
  }

  // Fallback: ZERO-SHOT DYNAMIC EXTRACTION directly from user sentences (NEVER Greek letters!)
  if (!outlineText || outlineText.trim().length < 60) {
    console.warn("[Stage1Architect] Generating dynamic extractive outline directly from source sentences...");
    const rawSentences = topic
      .replace(/#{1,6}\s+/g, "")
      .split(/[\n\.\?\!]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15 && !s.toLowerCase().startsWith("topic:") && !s.toLowerCase().startsWith("target:"));

    const s1 = rawSentences[0] || `Understanding the fundamental principles of ${cleanTopic}.`;
    const s2 = rawSentences[1] || `Key architectural structures and operational mechanisms.`;
    const s3 = rawSentences[2] || `Comparative trade-offs and scaling characteristics.`;
    const s4 = rawSentences[3] || `Key empirical findings and practical takeaways.`;

    outlineText = `SLIDE 1: Executive Overview & Foundation of ${cleanTopic}
- Primary Concept: ${s1}
- Scope & Scale: Critical operational principles directly from source text

SLIDE 2: Architectural Mechanisms & Operational Categories
- Mechanism: ${s2}
- Core Structure: Technical separation of concerns and data flow

SLIDE 3: Technical Challenges & Evaluation Matrix
- Key Factor: ${s3}
- Dimensional Trade-offs: Detailed analysis from the document

SLIDE 4: Strategic Takeaways & Interactive Simulation
- Core Takeaway: ${s4}
- Interactive Model: Direct parameter evaluation of ${cleanTopic}`;

    onChunk("\n\n" + outlineText, false);
  }

  return { outline: outlineText, cleanTopic };
}
