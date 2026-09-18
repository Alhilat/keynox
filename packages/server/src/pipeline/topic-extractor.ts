/**
 * Dynamic Topic and Title Extractor
 * Strictly dynamic parsing from input strings with ZERO hardcoded topics.
 */

export function extractCleanTopic(rawInput: string): { title: string; summary: string } {
  const clean = (rawInput || "").trim();
  if (!clean) {
    return { title: "Technical Presentation", summary: "Overview of key concepts and principles." };
  }

  // Check explicit TOPIC: "..." tag first
  const explicit = clean.match(/(?:title|topic|subject)\s*:\s*([^\n\.]+)/i);
  if (explicit && explicit[1] && explicit[1].trim().length >= 4) {
    let t = explicit[1].trim().replace(/^["']+|["']+$/g, "").trim();
    // Remove "Chapter X:" prefix if present
    t = t.replace(/^chapter\s+\d+\s*[:\-—]\s*/i, "").trim();

    // If title was a generic file-like name (e.g. "Chapter1Part1"), extract the first meaningful heading line from the body
    if (/^chapter\s*\d*(?:part\s*\d*)?$/i.test(t) || /^chapter\d+part\d+$/i.test(t)) {
      const lines = clean
        .split(/[\r\n]+/)
        .map((l) => l.trim())
        .filter((l) => l.length > 5 && !l.toLowerCase().startsWith("topic:") && !l.toLowerCase().startsWith("target:"));
      if (lines[0]) {
        t = lines[0].replace(/^chapter\s+\d+\s*[:\-—]\s*/i, "").trim();
      }
    }
    return { title: t, summary: clean.slice(0, 160) };
  }

  // Strip generic imperative prefixes
  const stripped = clean
    .replace(/^(?:please\s+)?(?:create|generate|make|build|design|write)?\s*(?:a\s+)?(?:presentation|slides|deck|explainer)?\s*(?:about|on|for|explaining|discussing|regarding)?\s*/i, "")
    .trim();
  const effective = stripped.length >= 4 ? stripped : clean;

  if (effective.length <= 80 && !effective.includes("\n")) {
    return { title: effective.replace(/^["']+|["']+$/g, ""), summary: clean.slice(0, 160) };
  }

  const sentences = effective.split(/[\n\.\?\!]+/).map((s) => s.trim()).filter(Boolean);
  if (sentences.length > 0 && sentences[0].length >= 6 && sentences[0].length <= 80) {
    return { title: sentences[0].replace(/^["']+|["']+$/g, ""), summary: clean.slice(0, 160) };
  }

  const words = effective.split(/\s+/).slice(0, 8).join(" ");
  return { title: words.length > 60 ? words.slice(0, 57) + "..." : words, summary: clean.slice(0, 160) };
}
