/**
 * Slide Count Detector & Dynamic Sizing Utility
 * Detects explicit user slide requests (e.g. "6 slides", "5 pages", "create 7 slides")
 * or dynamically determines optimal slide count (4 to 7 slides) based on content depth.
 */

export interface DetectedSlideCount {
  count: number;
  isExplicit: boolean;
  reason: string;
}

export function detectTargetSlideCount(
  topic: string,
  providedCount?: number
): DetectedSlideCount {
  // If explicitly passed through API
  if (typeof providedCount === "number" && !isNaN(providedCount)) {
    const clamped = Math.min(8, Math.max(3, Math.round(providedCount)));
    return {
      count: clamped,
      isExplicit: true,
      reason: `Explicit API parameter requested ${clamped} slides`,
    };
  }

  const clean = topic.trim();
  const lower = clean.toLowerCase();

  // 1. Check for numeric patterns: "6 slides", "5 pages", "7 scenes", "in 6 slides", "create 5 slides"
  const digitRegex = /(?:(?:create|generate|make|build|in|with)\s+)?(\d+)\s*[- ]*(?:slides?|pages?|scenes?|parts?)/i;
  const digitMatch = lower.match(digitRegex);
  if (digitMatch && digitMatch[1]) {
    const parsed = parseInt(digitMatch[1], 10);
    if (!isNaN(parsed)) {
      const clamped = Math.min(8, Math.max(3, parsed));
      return {
        count: clamped,
        isExplicit: true,
        reason: `Explicit user prompt specified "${digitMatch[0].trim()}" -> ${clamped} slides`,
      };
    }
  }

  // 2. Check for English word numbers: "three slides", "four slides", "five slides", "six slides", "seven slides", "eight slides"
  const wordMap: Record<string, number> = {
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
  };
  const wordRegex = /\b(three|four|five|six|seven|eight)\s*[- ]*(?:slides?|pages?|scenes?)\b/i;
  const wordMatch = lower.match(wordRegex);
  if (wordMatch && wordMap[wordMatch[1].toLowerCase()]) {
    const count = wordMap[wordMatch[1].toLowerCase()];
    return {
      count,
      isExplicit: true,
      reason: `Explicit user word specified "${wordMatch[0]}" -> ${count} slides`,
    };
  }

  // 3. Dynamic Determination based on content depth, sentence structure, and vocabulary complexity
  const sentences = clean
    .split(/[.\n!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);
  const words = clean.split(/\s+/).filter(Boolean).length;

  // Rich multi-paragraph or deep technical explanation (4+ sentences or 65+ words) -> 6 slides
  if (sentences.length >= 4 || words >= 65) {
    return {
      count: 6,
      isExplicit: false,
      reason: `Deep technical content detected (${sentences.length} sentences, ${words} words) -> dynamically allocating 6 slides`,
    };
  }

  // Moderate technical concept (2-3 sentences or 25-64 words) -> 5 slides
  if (sentences.length >= 2 || words >= 25) {
    return {
      count: 5,
      isExplicit: false,
      reason: `Multi-sentence concept detected (${sentences.length} sentences, ${words} words) -> dynamically allocating 5 slides`,
    };
  }

  // Default focused keynote -> 4 slides
  return {
    count: 4,
    isExplicit: false,
    reason: `Standard concept prompt -> dynamically allocating 4 slides`,
  };
}
