import { extractArchetypeFromSection } from "../prompts/archetypePrompts";
import { sanitizeDocumentContent } from "../topic-extractor";

export function parseStoryboardIntoSlides(storyboardText: string, targetCount: number, analysisText: string = ""): string[] {
  const cleanStoryboard = sanitizeDocumentContent(storyboardText);
  const slideDelimiterRegex = /(?=(?:^|\n)(?:#{1,3}\s*)?(?:SLIDE|Slide)\s*\d+[:\-—.\s])/i;
  let rawSections = cleanStoryboard
    .split(slideDelimiterRegex)
    .map((s: string) => s.trim())
    .filter((s: string) => {
      if (s.length < 25) return false;
      const u = s.toUpperCase();
      return (
        !u.startsWith("TARGET SLIDE COUNT") &&
        !u.startsWith("PREFERRED THEME") &&
        !u.startsWith("SOURCE DOCUMENT")
      );
    });

  // Deduplicate: filter out duplicate slides that have identical or near-identical headlines
  const seenTitles = new Set<string>();
  const deduplicatedSections: string[] = [];
  for (const sec of rawSections) {
    const titleMatch = sec.match(/(?:SLIDE\s*\d+[:\-—.\s]*|TITLE[:\-—.\s]*)([^\n]+)/i);
    const titleNorm = titleMatch ? titleMatch[1].replace(/[^a-zA-Z0-9]/g, "").toLowerCase() : "";
    if (titleNorm && seenTitles.has(titleNorm)) {
      continue;
    }
    if (titleNorm) seenTitles.add(titleNorm);
    deduplicatedSections.push(sec);
  }
  rawSections = deduplicatedSections;

  if (rawSections.length >= targetCount) {
    return rawSections.slice(0, targetCount);
  }

  // If the regex split produced too few slides, try markdown heading splits
  if (rawSections.length < targetCount) {
    const secondarySections = cleanStoryboard
      .split(/(?=(?:^|\n)#{1,3}\s+)/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 30);
    if (secondarySections.length >= targetCount) {
      return secondarySections.slice(0, targetCount);
    }
  }

  // Fallback: If still fewer than targetCount, dynamically partition the actual analysisText from the document
  const result = [...rawSections];
  if (analysisText) {
    const cleanAnalysis = sanitizeDocumentContent(analysisText);
    const analysisSections = cleanAnalysis
      .split(/(?=(?:^|\n)#+\s+(?:SECTION|\d+))/i)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 40 && !s.toUpperCase().includes("CRITICAL MANDATE"));

    const unusedSections = analysisSections.filter((sec: string) => {
      const heading = sec.split("\n")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      return !result.some((r: string) => r.toLowerCase().replace(/[^a-z0-9]/g, "").includes(heading.slice(0, 20)));
    });
    const pool = unusedSections.length > 0 ? unusedSections : analysisSections;

    let aIdx = 0;
    while (result.length < targetCount && pool.length > 0) {
      const idx = result.length + 1;
      const sectionSnippet = pool[aIdx % pool.length] || cleanAnalysis.slice(0, 800);
      const sourceHeading = sectionSnippet
        .split(/\r?\n/)
        .map((line: string) => line.replace(/^[#*\-–—0-9.:]+/, "").trim())
        .find((line: string) => line.length >= 4);
      const heading = sourceHeading ? sourceHeading.slice(0, 96) : `Slide ${idx}`;
      result.push(`SLIDE ${idx}: ${heading}\n${sectionSnippet}`);
      aIdx++;
    }
  }

  // Partition remaining source material evenly so every padded slide covers distinct content
  if (result.length < targetCount) {
    const sourceMaterial = (analysisText ? sanitizeDocumentContent(analysisText) : "") || cleanStoryboard;
    const paragraphs = sourceMaterial
      .split(/\n{2,}/)
      .map((p: string) => p.trim())
      .filter((p: string) => p.length >= 50 && !p.toUpperCase().includes("CRITICAL MANDATE") && !p.toUpperCase().startsWith("TARGET"));

    const needed = targetCount - result.length;
    const chunkSize = Math.max(1, Math.floor(paragraphs.length / Math.max(1, needed)));

    for (let i = 0; i < needed; i++) {
      const idx = result.length + 1;
      const start = (i * chunkSize) % Math.max(1, paragraphs.length);
      const sliceParagraphs = paragraphs.slice(start, start + chunkSize);
      const snippet = sliceParagraphs.join("\n\n") || paragraphs[i % Math.max(1, paragraphs.length)] || sourceMaterial.slice(0, 600);

      const sourceHeading = snippet
        .split(/\r?\n/)
        .map((line: string) => line.replace(/^[#*\-–—0-9.:]+/, "").trim())
        .find((line: string) => line.length >= 4);
      const heading = sourceHeading ? sourceHeading.slice(0, 96) : `Technical Architecture (Part ${idx})`;
      result.push(`SLIDE ${idx}: ${heading}\n[ARCHETYPE: hero-split-overview]\n${snippet}`);
    }
  }

  return result.slice(0, targetCount);
}
