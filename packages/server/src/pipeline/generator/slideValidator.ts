export function isValidSlideHtml(html: string): boolean {
  if (!html) return false;
  let clean = html.trim().replace(/^```html\s*/i, "").replace(/```\s*$/i, "").trim();
  if (clean.length < 150) return false;

  // Check that it contains structural HTML content
  const hasContent =
    clean.includes("<div") ||
    clean.includes("<section") ||
    clean.includes("<table") ||
    clean.includes("<h2") ||
    clean.includes("slide-title") ||
    clean.includes("glass-card") ||
    clean.includes("terminal-card") ||
    clean.includes("motion-pipeline") ||
    clean.includes("layer-stack") ||
    clean.includes("stat-grid") ||
    clean.includes("flow-diagram") ||
    clean.includes("comparison-matrix") ||
    clean.includes("bento-grid") ||
    clean.includes("timeline-journey") ||
    clean.includes("diff-container") ||
    clean.includes("quote-spotlight") ||
    clean.includes("disk-stripe") ||
    clean.includes("pointer-topology") ||
    clean.includes("hero-cinematic") ||
    clean.includes("dual-plane") ||
    clean.includes("mechanism-prism") ||
    clean.includes("anatomy-map") ||
    clean.includes("graph-stepper-container") ||
    clean.includes("calc-workbench") ||
    clean.includes("sim-container");

  if (!hasContent) return false;

  // Reject if it contains reasoning leak indicators or raw unfilled prompt templates
  const lower = clean.toLowerCase();
  if (
    lower.includes("from the storyboard") ||
    lower.includes("looking at the narrative") ||
    lower.includes("let's break down") ||
    lower.includes("we are to extract") ||
    lower.includes("[uppercase domain category]") ||
    lower.includes("[specific technical headline") ||
    lower.includes("[1-3 word uppercase category]") ||
    lower.includes("[natural, clear human explanation") ||
    lower.includes("[concrete explanation of invariants")
  ) {
    return false;
  }

  // Reject hollow arch-stacks: arch-stack with fewer than 2 tiers or with empty inner divs
  if (clean.includes("arch-stack") || clean.includes("layer-stack")) {
    const tiers = clean.match(/class=["'](?:stack-tier|layer-item)["']/gi) || [];
    if (tiers.length < 2) return false;
    // Check for empty tier body: e.g. <span class="tier-badge...">...</span><div></div>
    if (/<span\s+class=["']tier-badge[^"']*["']>[^<]*<\/span>\s*<div>\s*<\/div>/i.test(clean)) {
      return false;
    }
  }

  // Ensure substantive text content (strip tags and check character count)
  const textContent = clean.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (textContent.length < 60) {
    return false;
  }

  return true;
}

/**
 * Post-processes slide HTML to eliminate AI buzzword slop, pseudo-math,
 * robotic participle subtitle clichés, fake CLI commands, hallucinated CSS classes,
 * and inline rainbow color overrides.
 */
export function sanitizeAiTone(slideHtml: string): string {
  if (!slideHtml || typeof slideHtml !== "string") return "";
  let clean = slideHtml;

  // 1. Sanitize category headers: remove pipe "|" and buzzwords like INVARIANTS, TAXONOMIES, TOPOLOGIES
  clean = clean.replace(
    /(<div class="slide-category">)([\s\S]*?)(<\/div>)/gi,
    (_, open, content, close) => {
      let cat = content.replace(/<[^>]*>/g, "").trim();
      if (cat.includes("|")) {
        cat = cat.split("|")[0].trim();
      } else if (cat.includes("—")) {
        cat = cat.split("—")[0].trim();
      }
      cat = cat.replace(/\s+(?:INVARIANTS?|TAXONOM(?:Y|IES)|TOPOLOG(?:Y|IES)|PRIMITIVES?|PARADIGMS?|SYSTEMICS?)\b/gi, "").trim();
      if (!cat) cat = "SOURCE MATERIAL";
      return `${open}${cat.toUpperCase()}${close}`;
    }
  );

  // 2. Strip pseudo-math equations (e.g. $$ S = \text{Secure} \iff (\text{Confidentiality} \cap \text{Integrity}) $$)
  clean = clean.replace(
    /(?:<div[^>]*>)?\s*<div class="equation-display"[^>]*>[\s\S]*?\$\$[\s\S]*?\$\$[\s\S]*?<\/div>\s*(?:<\/div>)?/gi,
    (fullEquationBlock) => {
      if (
        /\\text\{(?:Secure|Confidentiality|Integrity|Availability|Protection|Privacy|Trust|Safety|Defense|Authentication|Authorization)\}/i.test(fullEquationBlock) ||
        (/\\text\{[A-Za-z\s]{4,}\}/i.test(fullEquationBlock) && /(?:\\cap|\\cup|\\iff|\\implies|\\land|\\lor)/.test(fullEquationBlock))
      ) {
        return ""; // Strip pseudo-math block completely
      }
      return fullEquationBlock;
    }
  );

  // 3. Naturalize robotic participle subtitles & strip "This slide compares / outlines / explores..."
  clean = clean.replace(
    /(<p class="slide-subtitle">)([\s\S]*?)(<\/p>)/gi,
    (_, open, sub, close) => {
      let s = sub.trim();
      // Strip index-card introductory prefixes
      s = s.replace(/^(?:This slide (?:compares|contrasts|explores|examines|categorizes|explains|details|illustrates|presents|highlights|outlines|describes|focuses on|discusses)|In this slide,? (?:we|the|it)|This section (?:covers|details|examines|focuses on))\s+/i, "");
      // Strip participle clichés
      s = s.replace(/^(?:Establishing|Analyzing|Incorporating|Leveraging|Facilitating|Orchestrating|Delivering|Implementing)\s+(?:foundational\s+)?(?:enterprise\s+)?(?:systemic\s+)?/i, "");
      if (s.length > 0) {
        s = s.charAt(0).toUpperCase() + s.slice(1);
      }
      s = s.replace(/\bsystemic invariants\b/gi, "security guarantees");
      s = s.replace(/\boperational invariants\b/gi, "operational guarantees");
      s = s.replace(/\badversary threat taxonomies\b/gi, "adversary threat models");
      s = s.replace(/\bthreat taxonomies\b/gi, "threat models");
      s = s.replace(/\bstructural defense asymmetry\b/gi, "defense challenges");
      s = s.replace(/\bdefense asymmetry and threat topologies\b/gi, "defense challenges and attack surfaces");
      s = s.replace(/\blifecycle vulnerability vectors\b/gi, "vulnerability lifecycle");
      s = s.replace(/\bverification taxonomies\b/gi, "verification methods");
      s = s.replace(/\bruntime telemetry\b/gi, "runtime metrics");
      s = s.replace(/\bindividual privacy invariants\b/gi, "individual privacy boundaries");
      s = s.replace(/\bpervasive checks\b/gi, "cross-layer verification");
      return `${open}${s}${close}`;
    }
  );

  // 4. Strip AI demographic hallucinations and mock percentages
  clean = clean.replace(/Ages\s+10[–-]100,\s*/gi, "");
  clean = clean.replace(/<span\b[^>]*>\s*(?:30|40|20)%\s*Probability\s*<\/span>/gi, '<span class="badge badge-amber">CRITICAL</span>');

  // 5. Auto-repair hallucinated CSS class names
  clean = clean.replace(/class=["']tri-card-grid["']/gi, 'class="grid-3"');
  clean = clean.replace(/class=["']card card-/gi, 'class="glass-card card-');
  clean = clean.replace(/class=["']card(["'\s>])/gi, 'class="glass-card$1');
  clean = clean.replace(/class=["']checklist["']/gi, 'class="checklist-group"');
  clean = clean.replace(/class=["']checklist-item["']/gi, 'class="check-item"');
  clean = clean.replace(/class=["']topology-flow["']/gi, 'class="topology-grid"');
  clean = clean.replace(/class=["']code-diff["']/gi, 'class="diff-container"');
  clean = clean.replace(/class=["']card-header["']/gi, 'class="glass-card-header"');
  clean = clean.replace(/class=["']card-body["']/gi, 'class="card-desc"');
  clean = clean.replace(/class=["']code-block["']/gi, 'class="terminal-body"');
  clean = clean.replace(/class=["']pipeline["']/gi, 'class="motion-pipeline"');
  clean = clean.replace(/class=["']stage["']/gi, 'class="pipeline-stage"');
  clean = clean.replace(/class=["']label["']/gi, 'class="stage-title"');

  // 6. Fix invalid <caption> inside <div>
  clean = clean.replace(/<caption\b[^>]*>([\s\S]*?)<\/caption>/gi, '<div class="topology-label">$1</div>');

  // 7. Convert inline styled rainbow cards to classic academic classes
  clean = clean.replace(/<div class="glass-card" style="border-top:\s*3px\s+solid\s+#f59e0b;[^"]*">/gi, '<div class="glass-card card-amber">');
  clean = clean.replace(/<div class="glass-card" style="border-top:\s*3px\s+solid\s+#0ea5e9;[^"]*">/gi, '<div class="glass-card card-cyan">');
  clean = clean.replace(/<div class="glass-card" style="border-top:\s*3px\s+solid\s+#f43f5e;[^"]*">/gi, '<div class="glass-card card-rose">');
  clean = clean.replace(/<div class="glass-card" style="border-top:\s*3px\s+solid\s+#10b981;[^"]*">/gi, '<div class="glass-card card-emerald">');
  clean = clean.replace(/<div class="glass-card" style="border-top:\s*3px\s+solid\s+#6366f1;[^"]*">/gi, '<div class="glass-card card-indigo">');

  // Strip inline background/border tints on stack-tier
  clean = clean.replace(/class="stack-tier" style="border-color:\s*rgba\([^)]+\);\s*background:\s*rgba\([^)]+\);?"/gi, 'class="stack-tier"');
  clean = clean.replace(/class="stack-tier" style="border-color:\s*rgba\([^)]+\);?"/gi, 'class="stack-tier"');

  // Strip bright inline color overrides on text that override academic themes
  clean = clean.replace(/style="color:\s*#(?:38bdf8|0ea5e9|818cf8|c7d2fe|cffafe|d1fae5);?"/gi, "");

  // Clean remaining instances of "invariants" in titles & table headers
  clean = clean.replace(/<span class="card-title">System Invariants<\/span>/gi, '<span class="card-title">Core Principles</span>');
  clean = clean.replace(/<span class="card-title">Operational Invariants<\/span>/gi, '<span class="card-title">Operational Guarantees</span>');
  clean = clean.replace(/<th>INVARIANT DETAIL<\/th>/gi, '<th>TECHNICAL SPECIFICATION</th>');
  clean = clean.replace(/<td>System Invariant<\/td>/gi, '<td>System Specification</td>');
  clean = clean.replace(/Privacy vs\.\s*Confidentiality Invariant/gi, "Privacy vs. Confidentiality Principles");

  return clean;
}

/**
 * Produces a minimal structural slide using only the provided topic, directive,
 * and analysis text. It deliberately does not select domain templates or invent
 * technical labels, metrics, commands, equations, or visual semantics.
 */
