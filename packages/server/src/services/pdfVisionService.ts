import OpenAI from "openai";
import { config } from "../config";
import { geminiService } from "./geminiService";

export interface VisionExtractedDocument {
  title: string;
  markdownContent: string;
  diagrams: string[];
  tables: string[];
  formulas: string[];
  pageCount: number;
}

const VISION_MODEL = "meta/llama-3.2-11b-vision-instruct";

/**
 * Uses Gemini Multimodal Vision (or NVIDIA NIM meta/llama-3.2-11b-vision-instruct fallback)
 * to perform deep document understanding on rendered PDF page images.
 * 
 * Captures:
 * 1. Architecture diagrams, figures, block diagrams, and system topologies.
 * 2. Complex tables with exact column alignment, numbers, and units.
 * 3. Mathematical formulas and equations typeset in KaTeX.
 * 4. Multi-column text with preserved reading order and hierarchy.
 */
export async function extractDocumentWithNvidiaVision(
  pageImagesBase64: string[],
  fileName?: string
): Promise<VisionExtractedDocument> {
  // Attempt 0: Gemini Multimodal Vision (superior document OCR, tables & formulas)
  if (geminiService.isAvailable()) {
    try {
      const geminiResult = await geminiService.extractDocumentVision(pageImagesBase64, fileName);
      if (geminiResult && geminiResult.markdownContent && geminiResult.markdownContent.length > 100) {
        console.log(`[pdfVisionService] Extracted ${geminiResult.pageCount} pages using Gemini Vision.`);
        return geminiResult;
      }
    } catch (gErr: any) {
      console.warn("[pdfVisionService] Gemini Vision failed, falling back to NVIDIA NIM:", gErr?.message);
    }
  }

  const apiKey = config.nvidiaApiKeyUltra || config.nvidiaApiKey;
  const openai = new OpenAI({
    apiKey,
    baseURL: config.nvidiaBaseUrl,
  });

  // Process key pages (up to 6 pages for comprehensive technical coverage)
  const pagesToProcess = pageImagesBase64.slice(0, 6);
  const pageResults: string[] = [];

  const systemPrompt = `You are an elite Document Understanding & Technical Architecture AI running on NVIDIA NIM.
Analyze the provided document page image with maximum technical precision:
1. DOCUMENT TITLE & HEADINGS: Identify the primary technical title and section hierarchy.
2. SYSTEM ARCHITECTURE & DIAGRAMS: If there are block diagrams, flowcharts, hardware schematics, or network topologies, transcribe them in full detail (describe nodes, interfaces, protocols, directional arrows, and state machines).
3. TABLES & METRICS: Transcribe all tables into clean Markdown tables with all rows, column headers, units, and numerical values.
4. MATHEMATICAL FORMULAS: Transcribe all equations using LaTeX notation ($...$ or $$...$$).
5. TEXT & NARRATIVE: Transcribe the text while strictly preserving multi-column reading order and paragraph boundaries.
6. INVARIANTS: List any quantitative guarantees, latency thresholds, or architectural constraints.

Do NOT omit figures or tables. Transcribe everything faithfully.`;

  // Process pages in parallel batches of 2 to balance latency and rate limits
  for (let i = 0; i < pagesToProcess.length; i += 2) {
    const batch = pagesToProcess.slice(i, i + 2);
    const promises = batch.map(async (pageBase64, batchIdx) => {
      const pageNum = i + batchIdx + 1;
      const cleanBase64 = pageBase64.includes(",") ? pageBase64.split(",")[1] : pageBase64;
      const imageUrl = `data:image/jpeg;base64,${cleanBase64}`;

      try {
        const response = await openai.chat.completions.create({
          model: VISION_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze Page ${pageNum} of document "${fileName || "Technical Document"}":`,
                },
                {
                  type: "image_url",
                  image_url: { url: imageUrl },
                },
              ],
            },
          ],
          max_tokens: 1800,
          temperature: 0.2,
        });

        const text = response.choices[0]?.message?.content || "";
        return `--- PAGE ${pageNum} ---\n${text}`;
      } catch (err: any) {
        console.warn(`[NvidiaVision] Page ${pageNum} extraction warning:`, err?.message || err);
        return `--- PAGE ${pageNum} ---\n[Visual extraction skipped for this page]`;
      }
    });

    const batchResults = await Promise.all(promises);
    pageResults.push(...batchResults);
  }

  const combinedMarkdown = pageResults.join("\n\n");

  // Extract detected title
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

  // Extract diagrams, tables, formulas for structured presentation usage
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
