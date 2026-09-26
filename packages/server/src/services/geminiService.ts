import OpenAI from "openai";
import { config } from "../config";

export interface StreamGeminiOptions {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  onReasoning?: (delta: string) => void;
  onChunk?: (delta: string) => void;
}

export interface GeminiVisionExtractedDocument {
  title: string;
  markdownContent: string;
  diagrams: string[];
  tables: string[];
  formulas: string[];
  pageCount: number;
}

export class GeminiService {
  private client: OpenAI | null = null;

  public isAvailable(): boolean {
    return Boolean(config.geminiApiKey && config.geminiApiKey.trim().length > 10);
  }

  public getModel(): string {
    return config.geminiModel || "gemini-3.8-flash";
  }

  public getClient(): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({
        apiKey: config.geminiApiKey,
        baseURL: config.geminiBaseUrl || "https://generativelanguage.googleapis.com/v1beta/openai",
      });
    }
    return this.client;
  }

  /**
   * High-speed streaming chat completion using Gemini 3.8 Flash
   * Includes automatic exponential backoff retry for network disconnects and connection reset errors.
   */
  public async streamChat(options: StreamGeminiOptions): Promise<string> {
    const {
      messages,
      model = this.getModel(),
      temperature = 0.35,
      maxTokens = 4000,
      signal,
      onReasoning,
      onChunk,
    } = options;

    const delays = [0, 1500, 3000];
    let lastError: any = null;

    for (let attempt = 0; attempt < delays.length; attempt++) {
      if (delays[attempt] > 0) {
        await new Promise((r) => setTimeout(r, delays[attempt]));
      }

      signal?.throwIfAborted();
      const client = this.getClient();
      let accumulatedContent = "";

      try {
        const stream = await client.chat.completions.create(
          {
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream: true,
          },
          { signal }
        );

        for await (const chunk of stream) {
          const delta = chunk.choices?.[0]?.delta;
          if (!delta) continue;

          // Extract reasoning/thoughts if present
          const reasoning =
            (delta as any)?.reasoning_content ||
            (delta as any)?.extra_content?.google?.thought_signature ||
            "";
          if (reasoning && onReasoning) {
            onReasoning(reasoning);
          }

          const content = delta.content || "";
          if (content) {
            accumulatedContent += content;
            if (onChunk) {
              onChunk(content);
            }
          }
        }

        return accumulatedContent;
      } catch (err: any) {
        if (signal?.aborted) throw err;
        lastError = err;
        const msg = String(err?.message || "");
        console.warn(`[GeminiService] streamChat attempt ${attempt + 1}/${delays.length} failed: ${msg}`);

        // If it is the last attempt, break and throw
        if (attempt === delays.length - 1) {
          break;
        }
      }
    }

    throw lastError || new Error("Gemini streamChat failed after retries");
  }

  /**
   * Multimodal Document Vision extraction using Gemini Vision API
   * Directly extracts diagrams, formulas, and structured tables from PDF page screenshots.
   */
  public async extractDocumentVision(
    pageImagesBase64: string[],
    fileName?: string
  ): Promise<GeminiVisionExtractedDocument> {
    const pagesToProcess = pageImagesBase64.slice(0, 8);
    const model = this.getModel() || "gemini-3.8-flash";
    const apiKey = config.geminiApiKey;

    const systemInstruction = `You are a Principal Scientific Document Analyst & Diagram Understanding AI.
Analyze the provided document page image with 100% technical fidelity:
1. HEADINGS & HIERARCHY: Capture titles, section numbers, and subtitles.
2. ARCHITECTURAL DIAGRAMS & TOPOLOGIES: Describe block diagrams, network topologies, state machines, and data pipelines in full detail (nodes, edges, labels, protocol names).
3. TABLES & FIGURES: Transcribe all tables into complete Markdown tables with units, headers, and numeric values.
4. EQUATIONS & MATHEMATICAL FORMULAS: Transcribe all mathematical notation in KaTeX ($...$ or $$...$$).
5. CORE INVARIANTS: List all empirical benchmarks, latency bounds, and architectural guarantees.`;

    const pageResults: string[] = [];

    // Process in batches of 2
    for (let i = 0; i < pagesToProcess.length; i += 2) {
      const batch = pagesToProcess.slice(i, i + 2);
      const promises = batch.map(async (pageBase64, batchIdx) => {
        const pageNum = i + batchIdx + 1;
        const cleanBase64 = pageBase64.includes(",") ? pageBase64.split(",")[1] : pageBase64;
        const mimeType = pageBase64.includes("image/png") ? "image/png" : "image/jpeg";

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `${systemInstruction}\n\nAnalyze Page ${pageNum} of document "${fileName || "Technical Document"}":`,
                    },
                    {
                      inline_data: {
                        mime_type: mimeType,
                        data: cleanBase64,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 2500,
              },
            }),
          });

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errText.slice(0, 120)}`);
          }

          const data = (await res.json()) as any;
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          return `--- PAGE ${pageNum} ---\n${text}`;
        } catch (err: any) {
          console.warn(`[GeminiService] Page ${pageNum} vision warning:`, err?.message || err);
          return `--- PAGE ${pageNum} ---\n[Visual extraction skipped for this page]`;
        }
      });

      const batchResults = await Promise.all(promises);
      pageResults.push(...batchResults);
    }

    const combinedMarkdown = pageResults.join("\n\n");

    let detectedTitle = (fileName || "")
      .replace(/\.pdf$/i, "")
      .replace(/^[\d\s\-_]+/, "")
      .replace(/[-_]+/g, " ")
      .trim();

    const titleMatch = combinedMarkdown.match(/#+\s+([A-Za-z0-9\s,\-\(\):]{5,90})/);
    if (titleMatch && titleMatch[1]) {
      const cand = titleMatch[1].trim();
      if (!/^(?:listing|figure|fig|table|page|step\b)/i.test(cand)) {
        detectedTitle = cand;
      }
    }

    const diagrams: string[] = [];
    const diagramRegex = /(?:Figure|Diagram|Topology|Architecture)[\s\S]*?(?=\n\n|$)/gi;
    let dMatch;
    while ((dMatch = diagramRegex.exec(combinedMarkdown)) !== null) {
      if (dMatch[0].length > 40) diagrams.push(dMatch[0].trim());
    }

    const tables: string[] = [];
    const tableRegex = /\|[^\n]+\|\n\|[\s\-:|]+\|\n(?:\|[^\n]+\|\n?)+/g;
    let tMatch;
    while ((tMatch = tableRegex.exec(combinedMarkdown)) !== null) {
      tables.push(tMatch[0].trim());
    }

    const formulas: string[] = [];
    const formulaRegex = /\$\$[\s\S]*?\$\$|\$[^\n$]+\$/g;
    let fMatch;
    while ((fMatch = formulaRegex.exec(combinedMarkdown)) !== null) {
      formulas.push(fMatch[0].trim());
    }

    return {
      title: detectedTitle,
      markdownContent: combinedMarkdown,
      diagrams,
      tables,
      formulas,
      pageCount: pagesToProcess.length,
    };
  }

  /**
   * High-Efficiency Critic & Quality Evaluator
   * Audits a draft slide produced by NVIDIA Nemotron:
   * 1. Checks mathematical/KaTeX formatting ($...$ / $$...$$).
   * 2. Checks for prompt metadata leaks or hallucinated placeholder text.
   * 3. Checks for emojis (replaces with vector SVG or removes).
   * 4. Validates HTML closing tags and design system class alignment.
   *
   * Fast & cheap: if slide is good, returns APPROVED immediately (< 20 output tokens).
   * Only outputs modified HTML if an actual formatting/KaTeX fix is needed.
   */
  public async evaluateAndAuditSlide(
    topic: string,
    slideHtml: string,
    slideIndex: number,
    totalSlides: number
  ): Promise<SlideEvaluationResult> {
    if (!this.isAvailable()) {
      return { passed: true, slideHtml };
    }

    try {
      const client = this.getClient();
      const prompt = `You are the Keynox Presentation Quality Evaluator & Executive Systems Auditor.
Audit this slide HTML generated by the model for topic "${topic}".

SLIDE DRAFT (${slideIndex + 1}/${totalSlides}):
"""
${slideHtml}
"""

AUDIT RULES:
1. MATHEMATICAL FORMULAS: If KaTeX equations exist, ensure valid LaTeX syntax without double-escaped backslashes or broken delimiters ($...$ for inline, $$...$$ for display).
2. ZERO PROMPT NOISE: Ensure no leaked prompt metadata ("TARGET SLIDE COUNT", "PREFERRED THEME", "SOURCE DOCUMENT", "TEMPLATE_").
3. ZERO EMOJIS: Strict visual elegance—replace any emojis with clean SVG icons or concise text.
4. VALID HTML: Ensure all <section>, <div>, <span> tags are properly balanced and closed.
5. NO HOLLOW CONTAINERS: If an .arch-stack or .layer-stack has missing layers, fewer than 2 tiers, or empty <div></div> tags, populate all genuine layers with real topic data.
6. NO FAKE CLI COMMANDS: Replace pseudo-commands like "$ network scan" or "$ port scan" with authentic tools (e.g. "$ nmap -sn 192.168.1.0/24", "$ nmap -sS -p 1-1024 192.168.1.50").
7. NO ROBOTIC SUBTITLES: Strip introductory clichés ("This slide compares...", "This slide outlines...", "In this slide...") from <p class="slide-subtitle"> so it states direct facts.
8. PRESERVE ORIGINAL CONTENT: Do not rewrite the slide if it is already clean. Never invent new corporate fluff.

OUTPUT FORMAT INSTRUCTION:
- If the slide PASSES all checks, output EXACTLY one word: "APPROVED".
- ONLY if repairs were required, output the repaired <section class="slide ...">...</section> block directly with no conversational markdown or backticks.`;

      const response = await client.chat.completions.create({
        model: this.getModel(),
        messages: [
          {
            role: "system",
            content: "You are an elite keynote presentation auditor and KaTeX/HTML validator. Be concise.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 1500,
      });

      const reply = response.choices?.[0]?.message?.content?.trim() || "";
      if (!reply || reply.toUpperCase().startsWith("APPROVED")) {
        return {
          passed: true,
          slideHtml,
          notes: "Approved with zero modifications",
          tokensUsed: response.usage?.total_tokens,
        };
      }

      // If Gemini returned a repaired section, clean any markdown wrapper and verify it's a slide
      let repairedHtml = reply;
      if (repairedHtml.startsWith("```html")) {
        repairedHtml = repairedHtml.replace(/^```html\s*/i, "").replace(/\s*```$/, "");
      } else if (repairedHtml.startsWith("```")) {
        repairedHtml = repairedHtml.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      if (repairedHtml.includes("<section") && repairedHtml.includes("</section>")) {
        return {
          passed: true,
          slideHtml: repairedHtml,
          notes: "Repaired KaTeX or tag structure",
          tokensUsed: response.usage?.total_tokens,
        };
      }

      return { passed: true, slideHtml };
    } catch (err: any) {
      console.warn(`[GeminiCritic] Audit pass skipped (${err?.message}). Keeping NVIDIA generation.`);
      return { passed: true, slideHtml };
    }
  }
}

export interface SlideEvaluationResult {
  passed: boolean;
  slideHtml: string;
  notes?: string;
  tokensUsed?: number;
}

export const geminiService = new GeminiService();
