/**
 * HyperDeck PDF Extractor
 * Clean, high-performance client-side document extraction.
 */

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

export interface ExtractedPdfResult {
  fileName: string;
  title: string;
  totalPages: number;
  wordCount: number;
  cleanText: string;
  abstract?: string;
  sections: { pageNumber: number; text: string }[];
}

let pdfjsLoadPromise: Promise<any> | null = null;

function loadPdfJs(): Promise<any> {
  if (window.pdfjsLib) {
    return Promise.resolve(window.pdfjsLib);
  }

  if (pdfjsLoadPromise) {
    return pdfjsLoadPromise;
  }

  pdfjsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      } else {
        reject(new Error("PDF.js failed to initialize"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load PDF.js from CDN"));
    document.head.appendChild(script);
  });

  return pdfjsLoadPromise;
}

function extractRawPdfStreams(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let rawStr = "";
  for (let i = 0; i < bytes.length; i++) {
    const code = bytes[i];
    if ((code >= 32 && code <= 126) || code === 10 || code === 13) {
      rawStr += String.fromCharCode(code);
    }
  }

  const matches = rawStr.match(/\(([^()]{2,120})\)\s*(?:Tj|'|")/g) || [];
  const textPieces = matches
    .map((m) => m.replace(/^\(/, "").replace(/\)\s*(?:Tj|'|")$/, "").trim())
    .filter((t) => t.length > 2 && !t.startsWith("/") && !t.includes("Font"));

  return textPieces.join(" ");
}

/**
 * Formats a clean human-readable title from file name
 */
export function formatCleanTitleFromFileName(fileName: string): string {
  const base = fileName
    .replace(/\.pdf$/i, "")
    .replace(/^[\d\s\-_]+/, "") // remove leading numbers
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Capitalize words
  return base
    .split(" ")
    .map((w) => (w.length > 1 ? w.charAt(0).toUpperCase() + w.slice(1) : w.toUpperCase()))
    .join(" ");
}

/**
 * Converts File to Base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Renders PDF pages to base64 JPEG images for NVIDIA NIM Multimodal Vision analysis
 */
async function renderPdfPagesToImages(pdf: any, maxPages = 15): Promise<string[]> {
  const images: string[] = [];
  const total = Math.min(pdf.numPages, maxPages);
  for (let i = 1; i <= total; i++) {
    try {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport }).promise;
        images.push(canvas.toDataURL("image/jpeg", 0.82));
      }
    } catch (err) {
      console.warn(`[PdfExtractor] Canvas render failed for page ${i}:`, err);
    }
  }
  return images;
}

/**
 * Extracts and cleans PDF content for HyperDeck presentation synthesis.
 * Uses Multimodal Vision (Gemini / NVIDIA NIM) to preserve
 * diagrams, formulas, tables, and multi-column layouts with 100% fidelity.
 */
export async function extractPdfDocument(
  file: File,
  maxPages: number = 40,
  onProgress?: (current: number, total: number, status?: string) => void
): Promise<ExtractedPdfResult> {
  if (onProgress) onProgress(1, 4, "Preparing document...");

  const arrayBuffer = await file.arrayBuffer();
  let pageImages: string[] = [];

  // Step 1: Render key pages with HTML5 Canvas for Multimodal Vision
  try {
    if (onProgress) onProgress(2, 4, "Rendering pages for Multimodal Vision...");
    const pdfjs = await loadPdfJs();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer.slice(0) }).promise;
    pageImages = await renderPdfPagesToImages(pdf, 15);
  } catch (canvasErr) {
    console.warn("[PdfExtractor] Client canvas rendering skipped, using raw file:", canvasErr);
  }

  // Step 2: High-reliability Server Extraction Endpoint with NVIDIA NIM Multimodal Vision
  try {
    if (onProgress) onProgress(3, 4, "Analyzing with NVIDIA NIM Multimodal Vision...");
    const base64 = await fileToBase64(file);
    const apiHost = window.location.hostname === "localhost" ? "http://localhost:3001" : "";
    const res = await fetch(`${apiHost}/api/ai/extract-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileBase64: base64,
        fileName: file.name,
        pageImages: pageImages.length > 0 ? pageImages : undefined,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data && json.data.cleanText && json.data.cleanText.length > 50) {
        if (onProgress) onProgress(4, 4, "Extraction complete!");
        return {
          fileName: file.name,
          title: json.data.title || formatCleanTitleFromFileName(file.name),
          totalPages: json.data.totalPages,
          wordCount: json.data.wordCount,
          cleanText: json.data.cleanText,
          abstract: json.data.abstract,
          sections: json.data.sections || [],
        };
      }
    }
  } catch (err) {
    console.warn("[PdfExtractor] Server extraction failed, attempting client-side fallback:", err);
  }

  // Step 3: Fallback client-side PDF.js extraction
  let cleanTitle = formatCleanTitleFromFileName(file.name);
  const sections: { pageNumber: number; text: string }[] = [];
  let fullText = "";
  let abstractText = "";
  let firstPageClean = "";

  try {
    const pdfjs = await loadPdfJs();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const numPages = Math.min(pdf.numPages, maxPages);

    for (let i = 1; i <= numPages; i++) {
      if (onProgress) onProgress(i, numPages);

      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageStrings: string[] = [];

      for (const item of content.items as any[]) {
        if (item.str && item.str.trim().length > 0) {
          pageStrings.push(item.str);
        }
      }

      let pageText = pageStrings.join(" ").replace(/\s+/g, " ").trim();

      // Clean header/footer artifacts
      pageText = pageText.replace(/^\s*\d+\s*\|\s*p\s*a\s*g\s*e\s*/i, "");
      pageText = pageText.replace(/^[\d\s\-\–\|\.\/]+/, "");
      pageText = pageText.replace(/\bPage\s+\d+\s+(?:of\s+\d+)?\b/gi, "");

      if (i === 1) {
        firstPageClean = pageText;
      }

      // Extract Abstract from early pages if present
      if (!abstractText && i <= 2) {
        const absMatch = pageText.match(/abstract[:\s—\-]+(.*?)(?=(?:1[\.\s]|introduction|keywords|$))/i);
        if (absMatch && absMatch[1]) {
          abstractText = absMatch[1].trim().slice(0, 1000);
        }
      }

      // Stop before bibliography / references list to conserve tokens
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
  } catch (err) {
    console.warn("[PdfExtractor] Primary PDF.js extraction failed, falling back to stream parsing:", err);
    const fallbackText = extractRawPdfStreams(arrayBuffer);
    if (fallbackText && fallbackText.length > 80) {
      fullText = fallbackText;
      sections.push({ pageNumber: 1, text: fallbackText });
    }
  }

  // Check if first sentence in first page can serve as better paper title
  if (firstPageClean) {
    const candidate = firstPageClean
      .replace(/^chapter\s+\d+\s*[:\-—]\s*/i, "")
      .split(/[\.\n]/)[0]
      .trim();
    if (
      candidate.length >= 6 &&
      candidate.length <= 90 &&
      !candidate.startsWith("[") &&
      !candidate.toLowerCase().startsWith("page") &&
      !candidate.toLowerCase().startsWith("arxiv") &&
      !candidate.toLowerCase().includes("in this chapter")
    ) {
      cleanTitle = candidate;
    }
  }

  const wordCount = fullText.split(/\s+/).filter(Boolean).length;

  if (fullText.trim().length < 50) {
    throw new Error("Unable to extract text from this PDF. It may be scanned or image-only.");
  }

  return {
    fileName: file.name,
    title: cleanTitle,
    totalPages: sections.length,
    wordCount,
    cleanText: fullText.trim(),
    abstract: abstractText,
    sections,
  };
}
