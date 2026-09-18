/**
 * Sanitizes raw document text by stripping OCR banners, PDF markers,
 * prompt directives (e.g. TARGET SLIDE COUNT, PREFERRED THEME), and UI noise.
 */
export function sanitizeDocumentContent(rawText: string): string {
  if (!rawText) return "";
  return rawText
    .replace(/==Start of (?:PDF|OCR for page \d+)==/gi, "")
    .replace(/==End of (?:PDF|OCR for page \d+)==/gi, "")
    .replace(/page\s+\d+==Screenshot for page \d+==/gi, "")
    .replace(/(?:TARGET\s+SLIDE\s+COUNT|SLIDE\s+COUNT)\s*[:\-—]\s*\d+\s*(?:slides?)?[^\n]*/gi, "")
    .replace(/PREFERRED\s+THEME\s*[:\-—]\s*[A-Za-z0-9_()\- ]+/gi, "")
    .replace(/SOURCE\s+DOCUMENT\s+(?:CONTENT|CONTEXT)\s*[:\-—]*/gi, "")
    .replace(/(?:INVARIANTS|VISUAL_SPEC)\s*[:\-—]\s*(?:Derived directly|Sequential Motion|\.motion-pipeline|\.flow-diagram|\.matrix-table)[^\n]*/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Dynamic Topic and Title Extractor
 * Strictly dynamic parsing from input strings with ZERO hardcoded topics.
 */
export function extractCleanTopic(rawInput: string): { title: string; summary: string } {
  let clean = (rawInput || "").trim();
  if (!clean) {
    return { title: "Technical Presentation", summary: "Overview of key concepts and principles." };
  }

  // Strip UI artifacts, theme selections, and noise labels (e.g. "Slides", "PREFERRED THEME (week 6)")
  clean = clean
    .replace(/^(?:slides?|presentation|deck|explainer)\s*[:\-—\n]/i, "")
    .replace(/(?:preferred\s+theme|theme|style)\s*(?:\([^)]*\)|:[^\n]+)?/gi, "")
    .replace(/(?:TARGET\s+SLIDE\s+COUNT|SLIDE\s+COUNT)\s*[:\-—]\s*\d+\s*(?:slides?)?[^\n]*/gi, "")
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .trim();

  // Check explicit TOPIC: "..." tag first
  const explicit = clean.match(/(?:title|topic|subject)\s*:\s*([^\n\.]+)/i);
  if (explicit && explicit[1] && explicit[1].trim().length >= 4) {
    let t = explicit[1].trim().replace(/^["']+|["']+$/g, "").trim();
    // Remove "Chapter X:" prefix if present
    t = t.replace(/^chapter\s+\d+\s*[:\-—]\s*/i, "").trim();

    // If title is a generic label (e.g. "Week 7", "Chapter 1 part 3", "Lecture 4"), extract the real topic heading from document text
    const isGeneric = /^(?:week|chapter|lecture|unit|module|lab|assignment|part|section|class|session|day|notes|doc|document)\s*\d*(?:[\s\-_]*(?:part|section)\s*\d*)?$/i.test(t) || /^(?:week|chapter|lecture|unit|module|lab|assignment)\d+$/i.test(t);
    if (isGeneric) {
      const body = sanitizeDocumentContent(clean.replace(/^(?:TOPIC|TITLE|SUBJECT):[^\n]+/i, "").trim());
      const sectionMatch = body.match(/(?:\d+\.\d+\s+|\d+\s+)([A-Z][A-Za-z\s]{3,40})/);
      const headingMatch = body.match(/(?:^|\n)\s*(?:\d+\s+)?([A-Z][A-Za-z0-9\s\-–—:]{4,50})(?:\n|$)/);
      const foundHeading = (sectionMatch ? sectionMatch[1] : (headingMatch ? headingMatch[1] : "")).trim();
      if (foundHeading && foundHeading.length >= 4 && !/^(?:page|fig|figure|table|contents|index|start|ocr|screenshot)/i.test(foundHeading)) {
        t = `${foundHeading} (${t})`;
      }
    }
    return { title: t, summary: clean.slice(0, 160) };
  }

  // Strip generic imperative prefixes
  const stripped = clean
    .replace(/^(?:please\s+)?(?:create|generate|make|build|design|write)?\s*(?:a\s+)?(?:presentation|slides|deck|explainer)?\s*(?:about|on|for|explaining|discussing|regarding)?\s*/i, "")
    .trim();
  const effective = stripped.length >= 4 ? stripped : clean;

  // Check if first line contains a generic week/chapter label or file name
  const sentences = effective.split(/[\n\.\?\!]+/).map((s) => s.trim()).filter(Boolean);
  let firstLine = (sentences[0] || "").replace(/^["']+|["']+$/g, "").trim();

  // If first line is a generic label (e.g. "(week 6)" or "week 6" or "week 10 the file system"), find true section heading
  const genericMatch = firstLine.match(/^(?:\(?\s*(?:week|chapter|lecture|unit|module|lab|assignment)\s*\d+\b[^\n]*)/i);
  if (genericMatch) {
    const rawLabel = genericMatch[0].trim();
    // If the label contains substantive words beyond "week 10", e.g. "week 10 the file system", clean it
    const subWords = rawLabel.replace(/^(?:week|chapter|lecture|unit|module|lab)\s*\d+\s*(?:[:\-—]\s*)?/i, "").trim();
    if (subWords.length >= 4) {
      const capitalized = subWords.charAt(0).toUpperCase() + subWords.slice(1);
      const weekPart = rawLabel.match(/^(?:week|chapter|lecture)\s*\d+/i)?.[0];
      return { title: weekPart ? `${capitalized} (${weekPart})` : capitalized, summary: clean.slice(0, 160) };
    }

    const body = sanitizeDocumentContent(effective.slice(firstLine.length).trim());
    const sectionMatch = body.match(/(?:\d+\.\d+\s+|\d+\s+)([A-Z][A-Za-z\s]{3,40})/);
    const headingMatch = body.match(/(?:^|\n)\s*(?:\d+\s+)?([A-Z][A-Za-z0-9\s\-–—:]{4,50})(?:\n|$)/);
    const foundHeading = (sectionMatch ? sectionMatch[1] : (headingMatch ? headingMatch[1] : "")).trim();
    if (foundHeading && foundHeading.length >= 4 && !/^(?:page|fig|figure|table|contents|index|start|ocr|screenshot)/i.test(foundHeading)) {
      const label = firstLine.replace(/[\(\)]/g, "").trim();
      return { title: `${foundHeading} (${label})`, summary: clean.slice(0, 160) };
    }
  }

  if (effective.length <= 80 && !effective.includes("\n")) {
    return { title: effective.replace(/^["']+|["']+$/g, ""), summary: clean.slice(0, 160) };
  }

  if (sentences.length > 0 && sentences[0].length >= 4 && sentences[0].length <= 80) {
    return { title: sentences[0].replace(/^["']+|["']+$/g, ""), summary: clean.slice(0, 160) };
  }

  const words = effective.split(/\s+/).slice(0, 8).join(" ");
  return { title: words.length > 60 ? words.slice(0, 57) + "..." : words, summary: clean.slice(0, 160) };
}
