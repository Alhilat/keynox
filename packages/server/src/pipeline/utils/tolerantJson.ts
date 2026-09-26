export interface TolerantParseResult<T> {
  data: T | null;
  hadTruncation: boolean;
  recoveredCount?: number;
  rawParsedText?: string;
}

/**
 * Resilient JSON Parser with Automatic Repair
 * - Strips Markdown fences (```json ... ```)
 * - Auto-closes unclosed brackets, braces, and strings if truncated
 * - Recovers all completed array items if an array was cut off mid-item
 */
export function parseTolerantJson<T = any>(raw: string): TolerantParseResult<T> {
  if (!raw || typeof raw !== "string") {
    return { data: null, hadTruncation: false };
  }

  // 1. Clean markdown code fences and extraneous preambles
  let clean = raw.trim();
  if (clean.startsWith("```json")) {
    clean = clean.replace(/^```json\s*/i, "").replace(/\s*```[\s\S]*$/, "");
  } else if (clean.startsWith("```")) {
    clean = clean.replace(/^```\s*/, "").replace(/\s*```[\s\S]*$/, "");
  }
  clean = clean.trim();

  // Find the first opening brace or bracket
  const firstBrace = clean.indexOf("{");
  const firstBracket = clean.indexOf("[");
  let startIndex = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIndex = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIndex = firstBrace;
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
  }

  if (startIndex > 0) {
    clean = clean.slice(startIndex);
  }

  // 2. Direct Parse Attempt
  try {
    const direct = JSON.parse(clean);
    return { data: direct as T, hadTruncation: false, rawParsedText: clean };
  } catch (initialErr) {
    // Proceed to repair
  }

  // 3. Tolerant Repair Strategy
  let hadTruncation = true;
  let repaired = clean;

  // If ends with unclosed quote, close it
  // Count unescaped double quotes
  let inString = false;
  let escaped = false;
  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];
    if (char === "\\" && !escaped) {
      escaped = true;
      continue;
    }
    if (char === '"' && !escaped) {
      inString = !inString;
    }
    escaped = false;
  }

  if (inString) {
    repaired += '"';
  }

  // If trailing comma or trailing key like "special_element":, remove incomplete trailing pair
  repaired = repaired.replace(/,\s*$/g, "");
  repaired = repaired.replace(/,\s*"[^"]*"\s*:\s*$/g, "");
  repaired = repaired.replace(/,\s*"[^"]*"\s*$/g, "");

  // Now count missing closing brackets and braces
  const openStack: string[] = [];
  inString = false;
  escaped = false;

  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];
    if (char === "\\" && !escaped) {
      escaped = true;
      continue;
    }
    if (char === '"' && !escaped) {
      inString = !inString;
    }
    if (!inString) {
      if (char === "{" || char === "[") {
        openStack.push(char);
      } else if (char === "}") {
        if (openStack[openStack.length - 1] === "{") {
          openStack.pop();
        }
      } else if (char === "]") {
        if (openStack[openStack.length - 1] === "[") {
          openStack.pop();
        }
      }
    }
    escaped = false;
  }

  // Close remaining open brackets in reverse order
  let closingSuffix = "";
  while (openStack.length > 0) {
    const open = openStack.pop();
    if (open === "{") closingSuffix += "}";
    if (open === "[") closingSuffix += "]";
  }

  try {
    const repairedJson = JSON.parse(repaired + closingSuffix);
    let recoveredCount: number | undefined;
    if (repairedJson && typeof repairedJson === "object") {
      if (Array.isArray(repairedJson.slides)) {
        recoveredCount = repairedJson.slides.length;
      }
    }
    return {
      data: repairedJson as T,
      hadTruncation: true,
      recoveredCount,
      rawParsedText: repaired + closingSuffix,
    };
  } catch (repairErr) {
    // If that still failed, try isolating array elements if "slides": [...]
    try {
      const matchSlides = clean.match(/"slides"\s*:\s*\[([\s\S]*)/);
      if (matchSlides) {
        const slidesContent = matchSlides[1];
        // Split by slide objects: e.g. look for individual {...}
        const slideMatches = slidesContent.match(/\{[\s\S]*?\}(?=\s*,\s*\{|\s*\]|\s*$)/g);
        if (slideMatches && slideMatches.length > 0) {
          const recoveredSlides: any[] = [];
          for (const sStr of slideMatches) {
            try {
              recoveredSlides.push(JSON.parse(sStr));
            } catch {}
          }
          if (recoveredSlides.length > 0) {
            return {
              data: { slides: recoveredSlides } as unknown as T,
              hadTruncation: true,
              recoveredCount: recoveredSlides.length,
            };
          }
        }
      }
    } catch {}
  }

  return { data: null, hadTruncation: true };
}
