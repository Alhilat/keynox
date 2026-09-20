// @ts-ignore
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.js";
import { sanitizeTitleString } from "../pipeline/topic-extractor";

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

  // Pattern 0: Book header line with chapter number, e.g. "50 3 Containers" or "3 Containers"
  const bookHeaderMatch = firstPageText.match(/(?:^|\n)\s*(?:\d{1,4}\s+)?(?:chapter\s+)?([1-9]\d?)\s+([A-Z][A-Za-z0-9\s,\-\(\):]{2,50})(?:\n|$)/);
  if (bookHeaderMatch && bookHeaderMatch[2]) {
    const rawT = bookHeaderMatch[2].trim();
    if (!/^(?:listing|figure|fig|table|page|drwx|total|contents|run\b|we\b|root\b|inode\b|sudo\b|ls\b|cat\b|sh\b)/i.test(rawT)) {
      const secSub = firstPageText.match(/(?:\d+\.\d+\s+)([A-Z][A-Za-z\s]{3,35})/);
      if (secSub && secSub[1] && !rawT.toLowerCase().includes(secSub[1].toLowerCase().trim())) {
        return sanitizeTitleString(`${rawT}: ${secSub[1].trim()}`);
      }
      return sanitizeTitleString(rawT);
    }
  }

  // Pattern 1: Explicit "Chapter X: Title"
  const chapterMatch = cleaned.match(/^(?:chapter\s+\d+\s*[:\-—]\s*)([A-Za-z0-9\s,\-\(\):]{4,75})(?:\s+In this|\.|\n|$)/i);
  if (chapterMatch && chapterMatch[1]) {
    const rawT = chapterMatch[1].trim();
    if (!/^(?:listing|figure|fig|table|page|drwx|total|contents|run\b|we\b|root\b)/i.test(rawT)) {
      return sanitizeTitleString(rawT);
    }
  }

  // Pattern 2: Section headings like "3.1 Linux Namespaces" or "3.2 Docker"
  const sectionMatch = cleaned.match(/(?:\d+\.\d+\s+)([A-Z][A-Za-z\s]{3,40})/);
  if (sectionMatch && sectionMatch[1]) {
    const rawSec = sectionMatch[1].trim();
    if (!/^(?:listing|figure|fig|table|page|drwx|total|contents|run\b|we\b|root\b)/i.test(rawSec)) {
      return sanitizeTitleString(rawSec);
    }
  }

  // Pattern 4: Prominent non-listing lines
  const lines = cleaned.split(/[\r\n]+/).map((l) => l.trim()).filter((l) => l.length > 5);
  for (const line of lines.slice(0, 10)) {
    const lower = line.toLowerCase();
    if (
      !lower.startsWith("page") &&
      !lower.startsWith("arxiv") &&
      !lower.startsWith("listing") &&
      !lower.startsWith("figure") &&
      !lower.startsWith("fig.") &&
      !lower.startsWith("table") &&
      !lower.startsWith("$") &&
      !lower.startsWith("#") &&
      !lower.startsWith("drwx") &&
      !lower.startsWith("total ") &&
      !lower.startsWith("run ") &&
      !lower.startsWith("we ") &&
      !lower.includes("in this chapter") &&
      line.length >= 6 &&
      line.length <= 80
    ) {
      const stripped = line.replace(/^chapter\s+\d+\s*[:\-—]\s*/i, "").replace(/^\d+\s+/, "").trim();
      if (!/^(?:listing|figure|fig|table|run\b)/i.test(stripped)) {
        return sanitizeTitleString(stripped);
      }
    }
  }

  return sanitizeTitleString(fallback) || "Technical Concept Explainer";
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
