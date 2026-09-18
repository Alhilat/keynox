// @ts-ignore
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.js";

export interface ExtractedPdfData {
  title: string;
  cleanText: string;
  totalPages: number;
  wordCount: number;
  abstract?: string;
  sections: { pageNumber: number; text: string }[];
}

export function detectCleanTitle(firstPageText: string, fileName?: string): string {
  const fallback = (fileName || "")
    .replace(/\.pdf$/i, "")
    .replace(/^[\d\s\-_]+/, "")
    .replace(/[-_]+/g, " ")
    .trim();

  // Strip page indicators like "1 | P a g e" or "Page 1"
  const cleaned = firstPageText
    .replace(/^\s*\d+\s*\|\s*p\s*a\s*g\s*e\s*/i, "")
    .replace(/^[\d\s\|\.\-\/]+(?:page)?[\d\s\|\.\-\/]*/i, "")
    .trim();

  // Pattern 1: "Chapter X: Title"
  const chapterMatch = cleaned.match(/^(?:chapter\s+\d+\s*[:\-—]\s*)([A-Za-z0-9\s,\-\(\):]{4,75})(?:\s+In this|\.|\n|$)/i);
  if (chapterMatch && chapterMatch[1]) {
    return chapterMatch[1].trim();
  }

  // Pattern 2: First prominent sentence or heading
  const lines = cleaned.split(/[\r\n]+/).map((l) => l.trim()).filter((l) => l.length > 5);
  for (const line of lines.slice(0, 3)) {
    if (
      !line.toLowerCase().startsWith("page") &&
      !line.toLowerCase().startsWith("arxiv") &&
      !line.toLowerCase().includes("in this chapter") &&
      line.length >= 6 &&
      line.length <= 80
    ) {
      // Remove leading Chapter X: if present
      const stripped = line.replace(/^chapter\s+\d+\s*[:\-—]\s*/i, "").trim();
      return stripped;
    }
  }

  return fallback || "Technical Concept Explainer";
}

export interface ExtractedPdfData {
  title: string;
  cleanText: string;
  totalPages: number;
  wordCount: number;
  abstract?: string;
  sections: { pageNumber: number; text: string }[];
  visionExtracted?: boolean;
  diagrams?: string[];
  tables?: string[];
  formulas?: string[];
}

export async function extractTextFromPdfBuffer(
  buffer: Buffer,
  fileName?: string,
  maxPages: number = 25,
  pageImages?: string[]
): Promise<ExtractedPdfData> {
  let visionData: any = null;

  // If page images are provided, run NVIDIA NIM Multimodal Vision (meta/llama-3.2-11b-vision-instruct)
  if (pageImages && pageImages.length > 0) {
    try {
      const { extractDocumentWithNvidiaVision } = await import("./pdfVisionService");
      visionData = await extractDocumentWithNvidiaVision(pageImages, fileName);
    } catch (vErr: any) {
      console.warn("[pdfService] NVIDIA NIM Vision extraction failed, continuing with text extraction:", vErr?.message);
    }
  }

  const data = new Uint8Array(buffer);
  const doc = await pdfjs.getDocument({ data }).promise;
  const numPages = Math.min(doc.numPages, maxPages);

  const sections: { pageNumber: number; text: string }[] = [];
  let fullText = "";
  let firstPageClean = "";
  let abstractText = "";

  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    
    // Group text items by vertical position (Y coordinate) to preserve lines & tables
    const lineMap = new Map<number, string[]>();
    for (const item of content.items as any[]) {
      if (item.str && item.str.trim().length > 0) {
        // Round Y to nearest 3px to group items on same line
        const y = Math.round((item.transform?.[5] || 0) / 3) * 3;
        const line = lineMap.get(y) || [];
        line.push(item.str);
        lineMap.set(y, line);
      }
    }

    // Sort lines from top to bottom (descending Y in PDF coordinates)
    const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);
    const pageLines: string[] = [];
    for (const y of sortedYs) {
      const row = (lineMap.get(y) || []).join(" ").trim();
      if (row) pageLines.push(row);
    }

    let pageText = pageLines.join("\n").trim();

    // Clean page artifacts (e.g., "1 | P a g e")
    pageText = pageText.replace(/^\s*\d+\s*\|\s*p\s*a\s*g\s*e\s*/i, "");
    pageText = pageText.replace(/^[\d\s\-\–\|\.\/]+/, "");
    pageText = pageText.replace(/\bPage\s+\d+\s+(?:of\s+\d+)?\b/gi, "");

    if (i === 1) {
      firstPageClean = pageText;
    }

    // Extract abstract if present in first 2 pages
    if (!abstractText && i <= 2) {
      const absMatch = pageText.match(/abstract[:\s—\-]+(.*?)(?=(?:1[\.\s]|introduction|keywords|$))/i);
      if (absMatch && absMatch[1]) {
        abstractText = absMatch[1].trim().slice(0, 1000);
      }
    }

    // Stop before references/bibliography to conserve tokens
    const refIdx = pageText.toLowerCase().search(/\b(references|bibliography|works cited)\b/);
    if (refIdx !== -1 && i > 2) {
      pageText = pageText.slice(0, refIdx).trim();
      if (pageText.length > 50) {
        sections.push({ pageNumber: i, text: pageText });
        fullText += (fullText ? "\n\n" : "") + pageText;
      }
      break;
    }

    if (pageText.length > 50) {
      sections.push({ pageNumber: i, text: pageText });
      fullText += (fullText ? "\n\n" : "") + pageText;
    }
  }

  const title = visionData?.title || detectCleanTitle(firstPageClean, fileName);

  // If NVIDIA Vision extracted deep multimodal content, append it with prominence
  if (visionData && visionData.markdownContent) {
    fullText = `### MULTIMODAL EXTRACTION (NVIDIA NIM VISION meta/llama-3.2-11b-vision):\n${visionData.markdownContent}\n\n### RAW EXTRACTED DOCUMENT TEXT:\n${fullText}`;
  }

  const wordCount = fullText.split(/\s+/).filter(Boolean).length;

  return {
    title,
    cleanText: fullText.trim(),
    totalPages: sections.length || (visionData ? visionData.pageCount : 1),
    wordCount,
    abstract: abstractText,
    sections,
    visionExtracted: Boolean(visionData),
    diagrams: visionData?.diagrams || [],
    tables: visionData?.tables || [],
    formulas: visionData?.formulas || [],
  };
}
