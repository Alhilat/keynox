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
 * Sanitizes and normalizes presentation titles by stripping internal PDF bookmarks,
 * trailing unclosed parentheses, (cont.), and metadata tags.
 */
export function sanitizeTitleString(title: string): string {
  let t = (title || "").trim();
  t = t.replace(/^[*_`#]+|[*_`#]+$/g, "").trim();

  // Strip "Document Analysis: Page X (..." noise and "Slide X:" prefixes
  t = t.replace(/^Document\s+Analysis\s*[:\-—]\s*(?:Page\s*\d+\s*)?/i, "").trim();
  t = t.replace(/^(?:Page|Slide)\s*\d+\s*[:\-—]?\s*/i, "").trim();
  t = t.replace(/\s*\((?:cont(?:inued)?\.?|part|\d+)\s*\)?\s*$/i, "").trim();
  t = t.replace(/[\(\[\{:\-—,\s]+$/, "").trim();

  // Balance parentheses: if there's an opening '(' without closing ')', clean it
  const openCount = (t.match(/\(/g) || []).length;
  const closeCount = (t.match(/\)/g) || []).length;
  if (openCount > closeCount) {
    const lastOpen = t.lastIndexOf("(");
    if (lastOpen >= 0 && lastOpen > t.length - 15) {
      t = t.slice(0, lastOpen).trim();
    } else {
      t = t + ")".repeat(openCount - closeCount);
    }
  }

  t = t.replace(/[:\-—,\s]+$/, "").trim();
  return t;
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
    t = sanitizeTitleString(t);

    // If title starts with a sub-element (e.g. "Listing 1", "Figure 3.2", "Slide 1"), extract the true chapter/document topic from the body
    if (/^(?:listing|figure|fig\.|table|slide|page)\s*\d*/i.test(t)) {
      const body = sanitizeDocumentContent(clean.replace(/^(?:TOPIC|TITLE|SUBJECT):[^\n]+/i, "").trim());
      const chapterMatch = body.match(/(?:^|\n)\s*(?:\d{1,4}\s+)?(?:chapter\s+)?([1-9]\d?)\s+([A-Z][A-Za-z0-9\s,\-\(\):]{2,50})(?:\n|$)/);
      const sectionMatch = body.match(/(?:\d+\.\d+\s+)([A-Z][A-Za-z\s]{3,40})/);
      if (chapterMatch && chapterMatch[2] && !/^(?:listing|figure|fig|table|page|slide|step\b|run\b|root\b|inode\b|sudo\b)/i.test(chapterMatch[2])) {
        const rawC = chapterMatch[2].trim();
        if (sectionMatch && sectionMatch[1] && !rawC.toLowerCase().includes(sectionMatch[1].toLowerCase().trim())) {
          t = `${rawC}: ${sectionMatch[1].trim()}`;
        } else {
          t = rawC;
        }
      } else if (sectionMatch && sectionMatch[1]) {
        t = sectionMatch[1].trim();
      } else {
        // Strip the sub-element prefix from t itself
        t = t.replace(/^(?:listing|figure|fig\.|table|slide|page)\s*\d+\s*[:\-—]?\s*/i, "").trim();
      }
    }

    // If title is a generic label (e.g. "Week 7", "Chapter 1 part 3", "Lecture 4"), extract the real topic heading from document text
    const isGeneric = /^(?:week|chapter|lecture|unit|module|lab|assignment|part|section|class|session|day|notes|doc|document)\s*\d*(?:[\s\-_]*(?:part|section)\s*\d*)?$/i.test(t) || /^(?:week|chapter|lecture|unit|module|lab|assignment)\d+$/i.test(t);
    if (isGeneric) {
      const body = sanitizeDocumentContent(clean.replace(/^(?:TOPIC|TITLE|SUBJECT):[^\n]+/i, "").trim());
      const sectionMatch = body.match(/(?:\d+\.\d+\s+|\d+\s+)([A-Z][A-Za-z\s]{3,40})/);
      const headingMatch = body.match(/(?:^|\n)\s*(?:\d+\s+)?([A-Z][A-Za-z0-9\s\-–—:]{4,50})(?:\n|$)/);
      const foundHeading = (sectionMatch ? sectionMatch[1] : (headingMatch ? headingMatch[1] : "")).trim();
      if (foundHeading && foundHeading.length >= 4 && !/^(?:page|fig|figure|table|slide|contents|index|start|ocr|screenshot|listing)/i.test(foundHeading)) {
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
  firstLine = firstLine.replace(/^(?:Slide|Page)\s*\d+\s*[:\-—]?\s*/i, "").trim();

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

  // Pattern: Book chapter header in text, e.g. "50 3 Containers" or "3 Containers"
  const bookHeaderMatch = clean.match(/(?:^|\n)\s*(?:\d{1,4}\s+)?(?:chapter\s+)?([1-9]\d?)\s+([A-Z][A-Za-z0-9\s,\-\(\):]{2,50})(?:\n|$)/);
  if (bookHeaderMatch && bookHeaderMatch[2]) {
    const rawT = bookHeaderMatch[2].trim();
    if (!/^(?:listing|figure|fig|table|page|drwx|total|contents|run\b|we\b|root\b|inode\b|sudo\b|ls\b|cat\b|sh\b)/i.test(rawT)) {
      const secSub = clean.match(/(?:\d+\.\d+\s+)([A-Z][A-Za-z\s]{3,35})/);
      const fullT = (secSub && secSub[1] && !rawT.toLowerCase().includes(secSub[1].toLowerCase().trim()))
        ? `${rawT}: ${secSub[1].trim()}`
        : rawT;
      return { title: sanitizeTitleString(fullT), summary: clean.slice(0, 160) };
    }
  }

  if (effective.length <= 80 && !effective.includes("\n")) {
    return { title: sanitizeTitleString(effective), summary: clean.slice(0, 160) };
  }

  if (sentences.length > 0 && sentences[0].length >= 4 && sentences[0].length <= 80) {
    return { title: sanitizeTitleString(sentences[0]), summary: clean.slice(0, 160) };
  }

  const words = effective.split(/\s+/).slice(0, 8).join(" ");
  return { title: sanitizeTitleString(words), summary: clean.slice(0, 160) };
}
