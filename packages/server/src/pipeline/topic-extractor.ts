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
      const body = clean.replace(/^(?:TOPIC|TITLE|SUBJECT):[^\n]+/i, "").trim();
      const sectionMatch = body.match(/(?:\d+\.\d+\s+|\d+\s+)([A-Z][A-Za-z\s]{3,40})/);
      const headingMatch = body.match(/(?:^|\n)\s*(?:\d+\s+)?([A-Z][A-Za-z0-9\s\-–—:]{4,50})(?:\n|$)/);
      const foundHeading = (sectionMatch ? sectionMatch[1] : (headingMatch ? headingMatch[1] : "")).trim();
      if (foundHeading && foundHeading.length >= 4 && !/^(?:page|fig|figure|table|contents|index|start|ocr)/i.test(foundHeading)) {
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

  // If first line is a generic label (e.g. "(week 6)" or "week 6"), find true section heading in remaining body
  const genericMatch = firstLine.match(/^(?:\(?\s*(?:week|chapter|lecture|unit|module|lab|assignment)\s*\d+\s*\)?|\b(?:week|chapter|lecture)\s*\d+\b)/i);
  if (genericMatch) {
    const body = effective.slice(firstLine.length).trim();
    const sectionMatch = body.match(/(?:\d+\.\d+\s+|\d+\s+)([A-Z][A-Za-z\s]{3,40})/);
    const headingMatch = body.match(/(?:^|\n)\s*(?:\d+\s+)?([A-Z][A-Za-z0-9\s\-–—:]{4,50})(?:\n|$)/);
    const foundHeading = (sectionMatch ? sectionMatch[1] : (headingMatch ? headingMatch[1] : "")).trim();
    if (foundHeading && foundHeading.length >= 4 && !/^(?:page|fig|figure|table|contents|index|start|ocr)/i.test(foundHeading)) {
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
