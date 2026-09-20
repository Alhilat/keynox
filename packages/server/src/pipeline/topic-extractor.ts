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
 * Checks if a title candidate is generic, a placeholder, a date, or OCR boilerplate.
 */
export function isPlaceholderOrGenericTitle(title: string): boolean {
  if (!title) return true;
  const t = title.trim().toLowerCase();
  if (t.length < 3) return true;

  // Pure dates (e.g. 15/11/1446, 2024-05-12, 10/04/2025)
  if (/^\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,4}$/.test(t)) return true;

  // Pure numbers or slide/page markers (e.g. "1", "Slide 1", "Page 2")
  if (/^(?:page|slide)?\s*\d+$/i.test(t)) return true;

  // Literal generic placeholders
  if (/^(?:title|untitled|presentation|deck|slides?|document|doc|notes|file|syllabus|text|txt|content|contents|input|prompt|raw|body|pdf|page|code|snippet|source|context|string|undefined|null|sample)$/i.test(t)) return true;

  // Prefixed placeholders: e.g. "Title (Lecture 3)", "Title: Lecture 3", "Title - Week 6", "Topic (Part 1)", "Text: ..."
  if (/^(?:title|topic|subject|presentation|text|content|source)\s*[:\-—\(]/i.test(t)) {
    const rest = t.replace(/^(?:title|topic|subject|presentation|text|content|source)\s*[:\-—\(]\s*/i, "").replace(/[\)]+$/, "").trim();
    if (!rest || /^(?:week|chapter|lecture|unit|module|lab|assignment|part|section|class|session|day|notes|doc|document|text|content)\s*\d*$/i.test(rest)) {
      return true;
    }
  }

  // Generic syllabus labels: e.g. "Lecture 3", "Week 7", "Chapter 1 part 3", "(Lecture 3)"
  if (/^\(?\s*(?:week|chapter|lecture|unit|module|lab|assignment|part|section|class|session|day|notes|doc|document)\s*\d*(?:[\s\-_]*(?:part|section)\s*\d*)?\s*\)?$/i.test(t)) {
    return true;
  }

  // Academic institution / department boilerplate or faculty name
  if (/\b(?:dept\.?|department|university|college|faculty|institute|school)\b/i.test(t) && /\b(?:computer|science|engineering|cyber)\b/i.test(t)) {
    return true;
  }
  if (/\b(?:dr\.?|prof\.?|professor|instructor|lecturer)\b/i.test(t)) {
    return true;
  }

  // OCR/UI noise
  if (/==start\s+of|==end\s+of|screenshot|ocr/i.test(t)) return true;

  return false;
}

/**
 * Scans document body text to discover the true primary subject title and subtopic,
 * filtering out university headers, course codes, dates, and instructor names.
 */
export function extractTrueTitleFromDocumentText(body: string, genericLabel?: string): string {
  const cleanBody = sanitizeDocumentContent(body);

  // 1. Check for Book chapter pattern: e.g. "50 3 Containers" or "Chapter 3 Containers"
  const bookHeaderMatch = cleanBody.match(/(?:^|\n)\s*(?:\d{1,4}\s+)?(?:chapter\s+)?([1-9]\d?)\s+([A-Z][A-Za-z0-9\s,\-\(\):]{2,50})(?:\n|$)/);
  if (bookHeaderMatch && bookHeaderMatch[2]) {
    const rawT = bookHeaderMatch[2].trim();
    if (!/^(?:listing|figure|fig|table|page|drwx|total|contents|run\b|we\b|root\b|inode\b|sudo\b|ls\b|cat\b|sh\b)/i.test(rawT)) {
      const secSub = cleanBody.match(/(?:\d+\.\d+\s+)([A-Z][A-Za-z0-9 \t\-_]{2,35})(?:\r?\n|$)/);
      let fullT = (secSub && secSub[1] && !rawT.toLowerCase().includes(secSub[1].toLowerCase().trim()))
        ? `${rawT}: ${secSub[1].trim()}`
        : rawT;
      if (genericLabel) {
        const cleanLabel = genericLabel.replace(/[\(\)]/g, "").trim();
        fullT = `${fullT} (${cleanLabel})`;
      }
      return sanitizeTitleString(fullT);
    }
  }

  // 2. Scan lines from the top of the document (first 30 lines)
  const lines = cleanBody
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 30);

  const candidates: string[] = [];

  for (const line of lines) {
    const raw = line.trim();
    // Reject pure numbers or slide markers
    if (/^(?:page|slide)?\s*\d+$/i.test(raw)) continue;
    // Reject dates (e.g. 15/11/1446 or 2024-05-12 or 10/12/2023)
    if (/\b\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,4}\b/.test(raw) || /^[\d\/\-\.]+$/.test(raw)) continue;
    // Reject university / department / course metadata lines
    if (/\b(?:dept\.?|department|university|college|faculty|institute)\b/i.test(raw)) continue;
    if (/\b(?:dr\.?|prof\.?|professor|instructor|lecturer)\b/i.test(raw)) continue;
    if (/^[a-z]{0,4}\s*[-_]?\s*\d{4,8}\b/i.test(raw)) continue;
    // Reject meta labels
    if (/^(?:agenda|contents|table of contents|summary|outline|overview|part|page|slide|figure|table)\b/i.test(raw)) continue;
    // Reject lines that look like shell commands or filesystem output
    if (/^(?:\$|#|>|drwx|total\s+\d+)/i.test(raw)) continue;

    // Strip leading bullets / numbers / punctuation
    const stripped = raw.replace(/^[•\-\*\–—0-9.:\s]+/, "").trim();
    if (stripped.length < 4 || stripped.length > 70) continue;

    // Reject standalone dates if any remain
    if (/^\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,4}$/.test(stripped) || /^[\d\/\-\.]+$/.test(stripped)) continue;

    candidates.push(stripped);
    if (candidates.length >= 3) break;
  }

  if (candidates.length >= 2) {
    const c1 = candidates[0];
    const c2 = candidates[1];
    // If the two candidates are distinct and complementary (e.g. "Cybersecurity Fundamentals" and "Network Security")
    if (!c1.toLowerCase().includes(c2.toLowerCase()) && !c2.toLowerCase().includes(c1.toLowerCase())) {
      let combined = `${c1}: ${c2}`;
      if (genericLabel) {
        const cleanLabel = genericLabel.replace(/[\(\)]/g, "").trim();
        combined = `${combined} (${cleanLabel})`;
      }
      return sanitizeTitleString(combined);
    }
    return sanitizeTitleString(c1);
  }

  if (candidates.length === 1) {
    let result = candidates[0];
    if (genericLabel) {
      const cleanLabel = genericLabel.replace(/[\(\)]/g, "").trim();
      result = `${result} (${cleanLabel})`;
    }
    return sanitizeTitleString(result);
  }

  return genericLabel ? sanitizeTitleString(genericLabel) : "Technical Presentation";
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

  // Strip UI artifacts, theme selections, and noise labels (e.g. "Slides", "Text:", "PREFERRED THEME (week 6)")
  clean = clean
    .replace(/^(?:slides?|presentation|deck|explainer|text|content|source)\s*[:\-—\n]/i, "")
    .replace(/(?:preferred\s+theme|theme|style)\s*(?:\([^)]*\)|:[^\n]+)?/gi, "")
    .replace(/(?:TARGET\s+SLIDE\s+COUNT|SLIDE\s+COUNT)\s*[:\-—]\s*\d+\s*(?:slides?)?[^\n]*/gi, "")
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .trim();

  // Check explicit TOPIC: "..." or TITLE: "..." or TEXT: "..." tag first
  const explicit = clean.match(/(?:title|topic|subject|text|content|source)\s*:\s*([^\n\.]+)/i);
  if (explicit && explicit[1] && explicit[1].trim().length >= 3) {
    let t = explicit[1].trim().replace(/^["']+|["']+$/g, "").trim();
    t = t.replace(/^chapter\s+\d+\s*[:\-—]\s*/i, "").trim();
    t = sanitizeTitleString(t);

    // If explicit title is generic or placeholder (e.g. "Text", "Title (Lecture 3)", "Lecture 3", "Week 7"),
    // recover true document title from the document body!
    if (isPlaceholderOrGenericTitle(t)) {
      const body = clean.replace(/(?:title|topic|subject|text|content|source)\s*:\s*[^\n]+/i, "").trim();
      // Extract generic label if present, e.g. "Lecture 3"
      const labelMatch = t.match(/(?:week|chapter|lecture|unit|module|lab|part)\s*\d+/i);
      const recovered = extractTrueTitleFromDocumentText(body, labelMatch ? labelMatch[0] : undefined);
      if (recovered && recovered !== "Technical Presentation") {
        return { title: recovered, summary: clean.slice(0, 160) };
      }
    } else {
      // If title starts with a sub-element (e.g. "Listing 1", "Figure 3.2"), recover from body
      if (/^(?:listing|figure|fig\.|table|slide|page)\s*\d*/i.test(t)) {
        const body = clean.replace(/^(?:TOPIC|TITLE|SUBJECT):[^\n]+/i, "").trim();
        const recovered = extractTrueTitleFromDocumentText(body);
        if (recovered && recovered !== "Technical Presentation") {
          return { title: recovered, summary: clean.slice(0, 160) };
        }
      }
      return { title: t, summary: clean.slice(0, 160) };
    }
  }

  // Strip generic imperative prefixes
  const stripped = clean
    .replace(/^(?:please\s+)?(?:create|generate|make|build|design|write)?\s*(?:a\s+)?(?:presentation|slides|deck|explainer)?\s*(?:about|on|for|explaining|discussing|regarding)?\s*/i, "")
    .trim();
  const effective = stripped.length >= 4 ? stripped : clean;

  // Check if first line is generic or a placeholder
  const sentences = effective.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  let firstLine = (sentences[0] || "").replace(/^["']+|["']+$/g, "").trim();
  firstLine = firstLine.replace(/^(?:Slide|Page)\s*\d+\s*[:\-—]?\s*/i, "").trim();

  if (isPlaceholderOrGenericTitle(firstLine)) {
    const recovered = extractTrueTitleFromDocumentText(effective);
    if (recovered && recovered !== "Technical Presentation") {
      return { title: recovered, summary: clean.slice(0, 160) };
    }
  }

  // Pattern: Book chapter header in text, e.g. "50 3 Containers" or "3 Containers"
  const bookHeaderMatch = clean.match(/(?:^|\n)\s*(?:\d{1,4}\s+)?(?:chapter\s+)?([1-9]\d?)\s+([A-Z][A-Za-z0-9\s,\-\(\):]{2,50})(?:\n|$)/);
  if (bookHeaderMatch && bookHeaderMatch[2]) {
    const rawT = bookHeaderMatch[2].trim();
    if (!/^(?:listing|figure|fig|table|page|drwx|total|contents|run\b|we\b|root\b|inode\b|sudo\b|ls\b|cat\b|sh\b)/i.test(rawT)) {
      const secSub = clean.match(/(?:\d+\.\d+\s+)([A-Z][A-Za-z0-9 \t\-_]{2,35})(?:\r?\n|$)/);
      const fullT = (secSub && secSub[1] && !rawT.toLowerCase().includes(secSub[1].toLowerCase().trim()))
        ? `${rawT}: ${secSub[1].trim()}`
        : rawT;
      return { title: sanitizeTitleString(fullT), summary: clean.slice(0, 160) };
    }
  }

  // If effective input is a short clean title (under 80 chars, no newline)
  if (effective.length <= 80 && !effective.includes("\n") && !isPlaceholderOrGenericTitle(effective)) {
    return { title: sanitizeTitleString(effective), summary: clean.slice(0, 160) };
  }

  // If sentences[0] is clean and non-generic
  if (sentences.length > 0 && sentences[0].length >= 4 && sentences[0].length <= 80 && !isPlaceholderOrGenericTitle(sentences[0])) {
    return { title: sanitizeTitleString(sentences[0]), summary: clean.slice(0, 160) };
  }

  // Try extracting from document body
  const docRecovered = extractTrueTitleFromDocumentText(effective);
  if (docRecovered && docRecovered !== "Technical Presentation") {
    return { title: docRecovered, summary: clean.slice(0, 160) };
  }

  const words = effective.split(/\s+/).slice(0, 8).join(" ");
  return { title: sanitizeTitleString(words), summary: clean.slice(0, 160) };
}

