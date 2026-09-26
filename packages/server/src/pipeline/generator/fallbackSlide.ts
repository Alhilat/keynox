import { VisualArchetypeId } from "@presentation/schema";
import { DocumentDomain } from "../prompts/domainAdaptivePrompts";
import { sanitizeDocumentContent } from "../topic-extractor";

export function synthesizeFallbackSlide(
  cleanTopic: string,
  slideIndex: number,
  totalSlides: number,
  slideDirective: string,
  analysisText: string = "",
  archetypeId?: VisualArchetypeId,
  domain?: DocumentDomain
): string {
  const isActive = slideIndex === 0;
  const cleanDirective = sanitizeDocumentContent(slideDirective)
    .replace(/\*\*/g, "")
    .replace(/#{1,4}\s*/g, "")
    .trim();
  const cleanAnalysis = sanitizeDocumentContent(analysisText)
    .replace(/\*\*/g, "")
    .replace(/#{1,4}\s*/g, "")
    .trim();
  const sourceText = [cleanDirective, cleanAnalysis].filter(Boolean).join("\n");

  const escapeHtml = (value: string): string =>
    value.replace(/[&<>"']/g, (character) => {
      const entities: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return entities[character];
    });

  const meaningfulLines = sourceText
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s*#\-–—0-9.:]+/, "").trim())
    .map((line) => line.replace(/^(?:title|category|subtitle|narrative|content|directive|primary takeaway|takeaway|point|focus|visual(?:_spec)?)\s*[:\-—]\s*/i, "").trim())
    .filter((line) => {
      const upper = line.toUpperCase();
      return (
        line.length >= 8 &&
        !upper.startsWith("SLIDE ") &&
        !upper.startsWith("TARGET ") &&
        !upper.startsWith("PREFERRED THEME") &&
        !upper.startsWith("SOURCE DOCUMENT") &&
        !upper.includes("CRITICAL MANDATE")
      );
    });

  const uniqueLines = [...new Set(meaningfulLines)];
  const titleMatch = cleanDirective.match(/(?:^|\n)\s*(?:SLIDE\s+\d+|TITLE)\s*[:\-—]\s*([^\n]+)/i);
  const title = (titleMatch?.[1] || uniqueLines[0] || cleanTopic || "Technical Architecture")
    .replace(/^[#*\s-]+/, "")
    .trim();
  const categoryMatch = cleanDirective.match(/(?:CATEGORY|SUBTITLE\s*&?\s*CATEGORY)\s*[:\-—]\s*([^\n]+)/i);
  const category = (categoryMatch?.[1] || (domain ? domain.toUpperCase().replace("_", " / ") : "CORE ARCHITECTURE"))
    .replace(/^[#*\s-]+/, "")
    .trim()
    .toUpperCase();
  const excerpts = uniqueLines
    .filter(
      (line) =>
        line.toLowerCase() !== title.toLowerCase() &&
        line.toLowerCase() !== category.toLowerCase()
    )
    .slice(0, 5);
  const primaryExcerpt = excerpts[0] || title || cleanTopic || "Key technical mechanism and domain invariants.";
  const supportingExcerpts = excerpts.slice(1);

  // Dynamic layout body based on planned archetype
  let layoutBody = "";

  if (archetypeId === "code-terminal") {
    const codeLines = excerpts.map((line) => escapeHtml(line)).join("\n");
    layoutBody = `
  <div class="terminal-card">
    <div class="terminal-header">
      <div class="terminal-dots"><span class="terminal-dot dot-red"></span><span class="terminal-dot dot-yellow"></span><span class="terminal-dot dot-green"></span></div>
      <span class="terminal-title">system-console — ${escapeHtml(category.toLowerCase())}</span>
    </div>
    <pre class="terminal-body"><code><span class="terminal-cmd">$ # Verified technical commands from source</span>
${codeLines}</code></pre>
  </div>`;
  } else if (archetypeId === "timeline-milestone" && supportingExcerpts.length >= 2) {
    const steps = excerpts.slice(0, 3).map((step, sIdx) => `
    <div class="timeline-step">
      <div class="timeline-node">0${sIdx + 1}</div>
      <div class="card-title">Phase ${sIdx + 1}</div>
      <p class="card-desc">${escapeHtml(step)}</p>
    </div>`).join("");
    layoutBody = `<div class="timeline-journey">${steps}\n  </div>`;
  } else if (archetypeId === "stat-dashboard-grid" && excerpts.length >= 2) {
    const cards = excerpts.slice(0, 4).map((stat, sIdx) => {
      const colors = ["cyan", "emerald", "amber", "indigo"];
      const col = colors[sIdx % colors.length];
      return `
    <div class="stat-card card-${col}">
      <span class="stat-lbl">${escapeHtml(category)} ${sIdx + 1}</span>
      <span class="stat-val val-${col}">${escapeHtml(stat.slice(0, 16))}</span>
      <span class="stat-delta stat-delta-up">${escapeHtml(stat.slice(0, 60))}</span>
    </div>`;
    }).join("");
    layoutBody = `<div class="stat-grid">${cards}\n  </div>`;
  } else if (archetypeId === "spatial-dual-plane") {
    const hostNodes = excerpts.slice(0, 2).map((n) => `<div class="plane-node">${escapeHtml(n)}</div>`).join("");
    const isoNodes = excerpts.slice(2, 4).map((n) => `<div class="plane-node">${escapeHtml(n)}</div>`).join("") || `<div class="plane-node">${escapeHtml(primaryExcerpt)}</div>`;
    layoutBody = `
  <div class="dual-plane">
    <div class="plane-zone plane-zone-host">
      <div class="plane-header"><span class="plane-tag" style="color:var(--accent-cyan)">HOST / GLOBAL PLANE</span><span class="badge badge-cyan">ROOT SCOPE</span></div>
      <div class="plane-nodes">${hostNodes}</div>
    </div>
    <div class="boundary-barrier">═══ ISOLATION BOUNDARY &amp; ENFORCEMENT MEMBRANE ═══</div>
    <div class="plane-zone plane-zone-isolated">
      <div class="plane-header"><span class="plane-tag" style="color:var(--accent-emerald)">ISOLATED / LOCAL PLANE</span><span class="badge badge-emerald">VIRTUAL SCOPE</span></div>
      <div class="plane-nodes">${isoNodes}</div>
    </div>
  </div>`;
  } else if (archetypeId === "mechanism-prism") {
    layoutBody = `
  <div class="mechanism-prism">
    <div class="prism-input"><span class="badge badge-cyan">INPUT STATE</span><div class="card-title">${escapeHtml(excerpts[0] || "Ingress Vector")}</div><p class="card-desc">${escapeHtml(excerpts[1] || primaryExcerpt)}</p></div>
    <div class="prism-core"><div class="stage-icon">⚡</div><div class="card-title">${escapeHtml(title)}</div><div class="badge badge-indigo">CORE MECHANISM</div></div>
    <div class="prism-output"><span class="badge badge-emerald">OUTPUT STATE</span><div class="card-title">${escapeHtml(excerpts[2] || "Transformed State")}</div><p class="card-desc">${escapeHtml(excerpts[3] || "Deterministic outcome")}</p></div>
  </div>`;
  } else if (archetypeId === "anatomy-map") {
    const callouts = excerpts.slice(0, 3).map((c, i) => `
      <div class="callout-item"><b>0${i + 1} Point:</b> ${escapeHtml(c)}</div>`).join("");
    layoutBody = `
  <div class="anatomy-map">
    <div class="anatomy-stage">
      <div class="card-title">${escapeHtml(title)}</div>
      <p class="card-desc">${escapeHtml(primaryExcerpt)}</p>
    </div>
    <div class="callout-list">${callouts}\n    </div>
  </div>`;
  } else if (archetypeId === "hero-cinematic" || (slideIndex === 0 && supportingExcerpts.length === 0)) {
    layoutBody = `
  <div class="hero-cinematic">
    <span class="badge badge-cyan">${escapeHtml(category)}</span>
    <h1 class="hero-headline">${escapeHtml(title)}</h1>
    <p class="hero-subhead">${escapeHtml(primaryExcerpt)}</p>
  </div>`;
  } else {
    // Default structured grid-split
    const supportingMarkup = supportingExcerpts.length > 0
      ? `<ul class="points-list">${supportingExcerpts.map((excerpt) => `<li>${escapeHtml(excerpt)}</li>`).join("")}</ul>`
      : `<p class="card-desc">${escapeHtml(primaryExcerpt)}</p>`;

    layoutBody = `
  <div class="grid-split">
    <div class="glass-card card-cyan">
      <div class="glass-card-header">
        <span class="card-title">${escapeHtml(title)}</span>
        <span class="badge badge-cyan">${escapeHtml(category.slice(0, 14))}</span>
      </div>
      <p class="card-desc">${escapeHtml(primaryExcerpt)}</p>
    </div>
    <div class="glass-card card-indigo">
      <div class="glass-card-header">
        <span class="card-title">Core Specifications</span>
        <span class="badge badge-indigo">ANALYSIS</span>
      </div>
      ${supportingMarkup}
    </div>
  </div>`;
  }

  return `<section class="slide${isActive ? " active" : ""}" id="slide${slideIndex}">
  <div class="slide-title-group">
    <div class="slide-category">${escapeHtml(category)}</div>
    <h2 class="slide-title">${escapeHtml(title)}</h2>
    <p class="slide-subtitle">${escapeHtml(primaryExcerpt)}</p>
  </div>
  ${layoutBody}
</section>`;
}
