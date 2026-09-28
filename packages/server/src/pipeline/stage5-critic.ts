import OpenAI from "openai";
import { config } from "../config";
import { geminiService } from "../services/geminiService";
import { Stage3SlideBrief, Stage5AuditResult } from "./types/sixStageTypes";

const TIER2_MODEL = config.nvidiaModel || "nvidia/nemotron-3-super-120b-a12b";

/**
 * Pure TypeScript Deterministic Sanitizer (Stage 5 Tier 3)
 * Guarantees zero AI failure, zero timeout, and zero pipeline stall.
 */
export function sanitizeSlideDeterministic(
  index: number,
  rawHtml: string
): Stage5AuditResult {
  let html = rawHtml.trim();

  // Strip markdown fences if present
  if (html.startsWith("```html")) {
    html = html.replace(/^```html\s*/i, "").replace(/\s*```[\s\S]*$/, "");
  } else if (html.startsWith("```")) {
    html = html.replace(/^```\s*/, "").replace(/\s*```[\s\S]*$/, "");
  }

  // Ensure root div starts and ends properly
  if (!html.startsWith("<div") && html.includes("<div")) {
    html = html.slice(html.indexOf("<div"));
  }

  // Ensure class has slide and slide-${index}
  if (!html.includes(`class="slide slide-${index}"`) && !html.includes(`class="slide slide-${index} `)) {
    html = html.replace(/<div\s+class="([^"]*)"/i, `<div class="slide slide-${index} $1"`);
    if (!html.includes(`slide-${index}`)) {
      html = `<div class="slide slide-${index}">\n${html}\n</div>`;
    }
  }

  // Strip emojis (Unicode ranges)
  html = html.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "");

  // Strip prompt comments like <!-- Slide Brief ... -->
  html = html.replace(/<!--[\s\S]*?-->/g, "");

  // Strictly eradicate Courier, Courier New, and typewriter fonts that cause jagged Linux font rendering
  html = html.replace(/font-family:\s*['"]?(?:Courier(?:\s+New)?|Consolas|Monaco|monospace|serif)['"]?[^;}"']*/gi, "font-family: var(--font-mono)");
  html = html.replace(/font-family:\s*[^;}"']*(?:Courier|courier-new)[^;}"']*/gi, "font-family: var(--font-mono)");

  // Check 1: Replace forbidden --color-* variables with global design system tokens
  html = html
    .replace(/var\(--color-bg(?:,[^)]+)?\)/g, 'var(--bg-stage)')
    .replace(/var\(--color-text(?:,[^)]+)?\)/g, 'var(--text-main)')
    .replace(/var\(--color-muted(?:,[^)]+)?\)/g, 'var(--text-muted)')
    .replace(/var\(--color-accent(?:,[^)]+)?\)/g, 'var(--border-active)')
    .replace(/var\(--color-primary(?:,[^)]+)?\)/g, 'var(--accent-cyan)')
    .replace(/var\(--color-secondary(?:,[^)]+)?\)/g, 'var(--accent-indigo)')
    .replace(/var\(--color-bg\)/g,      'var(--bg-stage)')
    .replace(/var\(--color-text\)/g,    'var(--text-main)')
    .replace(/var\(--color-muted\)/g,   'var(--text-muted)')
    .replace(/var\(--color-accent\)/g,  'var(--border-active)')
    .replace(/var\(--color-primary\)/g, 'var(--accent-cyan)')
    .replace(/var\(--color-secondary\)/g,'var(--accent-indigo)');

  // Check 2: Replace forbidden viewport units
  html = html
    .replace(/(\d*\.?\d+)vw/g, (_, n) => `${n}%`)
    .replace(/(\d*\.?\d+)vh/g, (_, n) => `${n}%`)
    .replace(/(\d*\.?\d+)vmin/g, (_, n) => `${n}%`)
    .replace(/(\d*\.?\d+)vmax/g, (_, n) => `${n}%`);

  // Ensure mandatory styling container with vertical scrolling support
  if (!html.includes("position: absolute")) {
    html = html.replace(
      new RegExp(`<div([\\s\\S]*?)class="([^"]*slide-${index}[^"]*)"`, "i"),
      `<div$1class="$2" style="position: absolute; inset: 0; width: 100%; height: 100%; overflow-y: auto; overflow-x: hidden; padding-bottom: 84px;"`
    );
  } else {
    // Replace restrictive overflow: hidden with vertical scroll support so content is never cut off
    html = html.replace(/overflow:\s*hidden/gi, "overflow-y: auto; overflow-x: hidden; padding-bottom: 84px");
  }

  // Ensure GSAP initialization function exists
  if (!html.includes(`window.initSlide_${index}`)) {
    html += `
<script>
window.initSlide_${index} = function(el) {
  const tl = gsap.timeline({ paused: true });
  const mathSteps = el.querySelectorAll(".math-step-card, .math-result-box");
  if (mathSteps.length > 0) {
    tl.fromTo(el.querySelectorAll(".slide-${index}-title, .slide-${index}-subtitle, h1, h2"), 
      { opacity: 0, y: -10 }, 
      { opacity: 1, y: 0, duration: 0.6 }
    );
    mathSteps.forEach((st, i) => {
      // Deliberate 1.4s pacing ONLY for genuine math derivation steps so audience can read each formula
      tl.fromTo(st, 
        { opacity: 0, y: 16 }, 
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.8, 
          ease: "power2.out",
          onStart: function() {
            try {
              st.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } catch(e) {}
          }
        }, 
        i === 0 ? "+=0.3" : "+=1.4"
      );
    });
  } else {
    // The previous GREAT animation: snappy, energetic, immediate reveal
    tl.from(el.querySelectorAll(".slide-${index}-title, .slide-${index}-content, h1, h2, p"), {
      opacity: 0,
      y: 20,
      stagger: 0.1,
      duration: 0.6,
      ease: "power2.out"
    });
  }
  return tl;
};
</script>`;
  }

  return {
    index,
    status: "sanitized",
    html,
  };
}

/**
 * Stage 5: Critic (Gemini 3.8 Flash / Nemotron 120B / Deterministic Sanitizer)
 * Audits slide HTML and applies direct in-place repair.
 */
export async function auditAndRepairSlide(
  index: number,
  slideBrief: Stage3SlideBrief,
  stage4Html: string,
  signal?: AbortSignal,
  engine?: "gemini" | "nvidia" | "auto"
): Promise<Stage5AuditResult> {
  const prompt = `You are a ruthless production auditor for cinematic HTML slides.
You have ONE job: guarantee unbreakable quality.

Audit checklist — fail on ANY violation:
□ All CSS classes start with .slide-${index}-
□ No global CSS selectors
□ GSAP in window.initSlide_${index} function returning tl
□ No querySelector without scoping to el parameter
□ No hardcoded hex colors — CSS variables only
□ No --color-* variable references anywhere in HTML
□ No vw/vh/vmin/vmax units anywhere in CSS
□ Slide supports vertical scroll if content overflows (overflow-y: auto, overflow-x: hidden) — percentage dimensions only (no vw/vh)
□ No emojis or placeholder text
□ No prompt metadata or comments
□ KaTeX formulas wrapped in $$ ... $$ or data-expr and are non-empty
□ Math derivation steps are deliberately paced (gap >= 1.2s between steps, never fast staggers)
□ Zero blank slide (contains visible non-empty content, formulas, and cards)
□ ZERO Courier, Courier New, or typewriter fonts — all code blocks and terminals MUST use var(--font-mono)
□ No unclosed HTML tags
□ Animation timing matches brief sequence

Brief:
${JSON.stringify(slideBrief, null, 2)}

HTML to audit:
${stage4Html}

If ALL pass → return exactly: APPROVED

If ANY fail:
- Fix every violation directly in the HTML
- Return complete corrected HTML only starting with <div class="slide slide-${index}">
- No explanation. Never return APPROVED with fixed HTML.`;

  // Step 1: Deterministic Pre-Flight Gatekeeper (Zero API Requests)
  // If the slide is already clean and sound, approve immediately without burning LLM quota.
  const deterministicResult = sanitizeSlideDeterministic(index, stage4Html);
  if (!config.geminiCriticEnabled) {
    return deterministicResult;
  }

  const isStructurallySound =
    deterministicResult.html.startsWith("<div") &&
    deterministicResult.html.includes(`slide-${index}`) &&
    deterministicResult.html.includes(`window.initSlide_${index}`) &&
    !deterministicResult.html.includes("```");

  // If already 100% clean and well-formed, approve with zero API requests
  if (isStructurallySound && deterministicResult.html.length >= 100 && deterministicResult.html === stage4Html.trim()) {
    return { index, status: "approved", html: deterministicResult.html };
  }

  const systemInstruction =
    "You are a strict code quality auditor. Return either the word APPROVED or the complete corrected HTML starting with <div. Zero explanation. Zero markdown.";

  // Tier 1: Gemini Critic (only if enabled, available, and engine allows it)
  if (config.geminiCriticEnabled && engine !== "nvidia" && geminiService.isAvailable()) {
    try {
      signal?.throwIfAborted();
      const models = geminiService.getCompilerModels(index);
      const reply = await geminiService.streamChat({
        models,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        maxTokens: 3500,
        signal,
      });

      const cleanReply = reply.trim();
      if (cleanReply.toUpperCase() === "APPROVED") {
        return { index, status: "approved", html: stage4Html };
      }

      let repairedHtml = cleanReply;
      if (repairedHtml.startsWith("```html")) {
        repairedHtml = repairedHtml.replace(/^```html\s*/i, "").replace(/\s*```[\s\S]*$/, "");
      } else if (repairedHtml.startsWith("```")) {
        repairedHtml = repairedHtml.replace(/^```\s*/, "").replace(/\s*```[\s\S]*$/, "");
      }

      if (repairedHtml.startsWith("<div") && repairedHtml.includes(`slide-${index}`)) {
        return { index, status: "repaired", html: repairedHtml };
      }
    } catch (err: any) {
      if (signal?.aborted) throw err;
      console.warn(`[Stage5Critic] Slide ${index} Tier 1 (Gemini) failed: ${err?.message}. Trying Tier 2...`);
    }
  }

  // Tier 2: Nemotron 120B Super Critic
  try {
    signal?.throwIfAborted();
    const apiKey = config.nvidiaApiKeyUltra || config.nvidiaApiKey;
    const openai = new OpenAI({
      apiKey,
      baseURL: config.nvidiaBaseUrl,
      timeout: 15000,
    });

    const response = await openai.chat.completions.create({
      model: TIER2_MODEL,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
      max_tokens: 3500,
      temperature: 0.1,
    }, { signal });

    const reply = response.choices?.[0]?.message?.content?.trim() || "";
    if (reply.toUpperCase() === "APPROVED") {
      return { index, status: "approved", html: stage4Html };
    }

    let repairedHtml = reply;
    if (repairedHtml.startsWith("```html")) {
      repairedHtml = repairedHtml.replace(/^```html\s*/i, "").replace(/\s*```[\s\S]*$/, "");
    } else if (repairedHtml.startsWith("```")) {
      repairedHtml = repairedHtml.replace(/^```\s*/, "").replace(/\s*```[\s\S]*$/, "");
    }

    if (repairedHtml.startsWith("<div") && repairedHtml.includes(`slide-${index}`)) {
      return { index, status: "repaired", html: repairedHtml };
    }
  } catch (err: any) {
    if (signal?.aborted) throw err;
    console.warn(`[Stage5Critic] Slide ${index} Tier 2 (Nemotron 120B) failed: ${err?.message}. Applying Tier 3 Deterministic Sanitizer...`);
  }

  // Tier 3: Deterministic TypeScript Sanitizer (zero failure rate)
  return sanitizeSlideDeterministic(index, stage4Html);
}

/**
 * Stage 5: Coalesced Batch Deck Critic
 * Audits all presentation slides together in ONE unified request.
 * Utilizes Gemini's 1M-token context window to eliminate the N+1 request problem.
 */
export async function auditAndRepairDeckBatch(
  slides: Array<{ index: number; html: string; brief?: Stage3SlideBrief }>,
  signal?: AbortSignal,
  engine: "gemini" | "nvidia" | "auto" = "auto"
): Promise<Stage5AuditResult[]> {
  // Step 1: Pre-sanitize all slides deterministically (0 API requests)
  const results = slides.map((s) => sanitizeSlideDeterministic(s.index, s.html));

  // If critic is disabled, return deterministic sanitization directly
  if (!config.geminiCriticEnabled) {
    return results;
  }

  // If all slides are already clean and well-formed, return without making any API calls
  const allClean = slides.every((s, i) => results[i].html === s.html.trim());
  if (allClean) {
    return results;
  }

  // Step 2: Unified Batch AI Audit for any presentation requiring deep review
  try {
    signal?.throwIfAborted();
    const systemInstruction =
      "You are a master keynote presentation auditor. Review this collection of presentation slides. Return the complete corrected presentation with all slides separated by <!-- SLIDE_BREAK -->.";

    const bundlePrompt = slides
      .map((s) => `<!-- SLIDE_BREAK -->\n<!-- SLIDE ${s.index} -->\n${s.html}`)
      .join("\n\n");

    let auditedBundle = "";

    // Tier 1: Gemini Reasoning (Single Request for Entire Presentation)
    if (engine === "gemini" && geminiService.isAvailable()) {
      const models = geminiService.getReasoningModels();
      auditedBundle = await geminiService.streamChat({
        models,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: `Audit and fix this entire deck:\n\n${bundlePrompt}` },
        ],
        temperature: 0.1,
        maxTokens: 6000,
        signal,
      });
    }

    if (auditedBundle && auditedBundle.includes("<!-- SLIDE_BREAK -->")) {
      const chunks = auditedBundle.split("<!-- SLIDE_BREAK -->").map((c) => c.trim()).filter(Boolean);
      chunks.forEach((chunk) => {
        const match = chunk.match(/slide-(\d+)/);
        if (match) {
          const slideIdx = parseInt(match[1], 10);
          const res = results.find((r) => r.index === slideIdx);
          if (res && chunk.startsWith("<div")) {
            res.html = chunk;
            res.status = "repaired";
          }
        }
      });
    }
  } catch (err: any) {
    console.warn(`[Stage5Critic] Batch audit warning: ${err?.message}. Using deterministic sanitization.`);
  }

  return results;
}

