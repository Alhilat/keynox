import { describe, it, expect } from "vitest";
import { extractSlidesFromContent, extractCustomScripts, assembleHyperDeckPresentation } from "../pipeline/html-assembler";
import { parseStoryboardIntoSlides, synthesizeFallbackSlide, resolveVisualTemplate, VISUAL_TEMPLATES, sanitizeAiTone, isValidSlideHtml } from "../pipeline/stage3-creative-generator";
import { detectTargetSlideCount } from "../services/slideCountDetector";
import { presentationCache } from "../pipeline/cache";
import { convertHtmlToPresentationAst } from "../pipeline/html-to-ast";
import { extractCleanTopic, sanitizeDocumentContent, sanitizeTitleString } from "../pipeline/topic-extractor";
import { PresentationSchema } from "@presentation/schema";

describe("HyperDeck Pipeline & Engine Test Suite", () => {
  describe("extractSlidesFromContent", () => {
    it("should extract discrete <section class='slide'> elements correctly", () => {
      const mockHtml = `
        <section class="slide active" id="slide0">
          <div class="slide-title-group">
            <h2 class="slide-title">Slide One</h2>
          </div>
        </section>
        <section class="slide" id="slide1">
          <div class="slide-title-group">
            <h2 class="slide-title">Slide Two</h2>
          </div>
        </section>
      `;

      const slides = extractSlidesFromContent(mockHtml);
      expect(slides).toHaveLength(2);
      expect(slides[0]).toContain('id="slide0"');
      expect(slides[1]).toContain('id="slide1"');
    });

    it("should auto-close unclosed section tags and strip dangling incomplete tags", () => {
      const truncatedHtml = `<section class="slide" id="slide0"><div class="motion-pipeline"><div class="pipeline-stage"><span class="`;
      const slides = extractSlidesFromContent(truncatedHtml);
      expect(slides).toHaveLength(1);
      expect(slides[0]).not.toContain('<span class="');
      expect(slides[0]).toContain("</div></div></section>");
    });
  });

  describe("20-Template Visual Catalog & Autonomous Selection", () => {
    it("should contain exactly 20 rich production visual templates", () => {
      const keys = Object.keys(VISUAL_TEMPLATES);
      expect(keys.length).toBe(20);
      expect(keys).toContain("TEMPLATE_01_HERO_SPLIT_OVERVIEW");
      expect(keys).toContain("TEMPLATE_02_TERMINAL_CODE_EXPLORER");
      expect(keys).toContain("TEMPLATE_03_CODE_DIFF_EVOLUTION");
      expect(keys).toContain("TEMPLATE_04_SEQUENTIAL_PIPELINE_4");
      expect(keys).toContain("TEMPLATE_05_STREAMLINED_PIPELINE_3");
      expect(keys).toContain("TEMPLATE_06_CONNECTED_TOPOLOGY_FLOW");
      expect(keys).toContain("TEMPLATE_07_DUAL_STREAM_CONVERGENCE");
      expect(keys).toContain("TEMPLATE_08_INTERACTIVE_SLIDER_SIMULATOR");
      expect(keys).toContain("TEMPLATE_09_COMPARISON_MATRIX_TABLE");
      expect(keys).toContain("TEMPLATE_10_DYNAMIC_BAR_CHART_BENCHMARK");
      expect(keys).toContain("TEMPLATE_11_TRI_CARD_CONCEPT_GRID");
      expect(keys).toContain("TEMPLATE_12_QUAD_METRIC_DASHBOARD");
      expect(keys).toContain("TEMPLATE_13_MATHEMATICAL_DERIVATION_STEP");
      expect(keys).toContain("TEMPLATE_14_STATE_MACHINE_TRANSITION");
      expect(keys).toContain("TEMPLATE_15_HIERARCHICAL_LAYER_STACK");
      expect(keys).toContain("TEMPLATE_16_INTERACTIVE_SVG_VENN");
      expect(keys).toContain("TEMPLATE_17_THREE_JS_SPATIAL_WORLD");
      expect(keys).toContain("TEMPLATE_18_CHRONOLOGICAL_TIMELINE");
      expect(keys).toContain("TEMPLATE_19_PRO_CON_TRADE_OFF_STUDY");
      expect(keys).toContain("TEMPLATE_20_EXECUTIVE_CHECKLIST_SUMMARY");
    });

    it("should prioritize explicit Model 2 TEMPLATE directives", () => {
      const directive = `SLIDE 3: Execution Runtime\nTEMPLATE: TEMPLATE_02_TERMINAL_CODE_EXPLORER\nRun container demo with -pu flags`;
      const template = resolveVisualTemplate(directive, 2);
      expect(template.id).toBe("TEMPLATE_02_TERMINAL_CODE_EXPLORER");
    });

    it("should autonomously infer templates from semantic keywords", () => {
      // CLI / Docker commands -> Terminal
      const cliTemplate = resolveVisualTemplate("Inspect PID namespaces with sudo unshare -p -f --mount-proc", 1);
      expect(cliTemplate.id).toBe("TEMPLATE_02_TERMINAL_CODE_EXPLORER");

      // Layer stack / hierarchy -> Hierarchical Layer Stack
      const layerTemplate = resolveVisualTemplate("Hierarchical abstraction layers from hardware to user space", 3);
      expect(layerTemplate.id).toBe("TEMPLATE_15_HIERARCHICAL_LAYER_STACK");

      // Metrics / KPIs -> Quad Metric Dashboard
      const metricTemplate = resolveVisualTemplate("Throughput benchmarks and latency KPI dashboard metrics", 4);
      expect(metricTemplate.id).toBe("TEMPLATE_12_QUAD_METRIC_DASHBOARD");

      // Checklist / takeaways -> Executive Checklist Summary
      const summaryTemplate = resolveVisualTemplate("Executive summary and key architectural takeaways checklist", 5);
      expect(summaryTemplate.id).toBe("TEMPLATE_20_EXECUTIVE_CHECKLIST_SUMMARY");
    });
  });

  describe("assembleHyperDeckPresentation", () => {
    it("should include KaTeX CSS and auto-render JS in presentation head", () => {
      const html = assembleHyperDeckPresentation({
        topic: "Quantum Superposition",
        slidesHtml: '<section class="slide" id="slide0"><h2>Quantum</h2></section>',
        targetCount: 1,
      });

      expect(html).toContain("katex.min.css");
      expect(html).toContain("katex.min.js");
      expect(html).toContain("renderMathInElement");
      expect(html).toContain("ignoredTags");
      expect(html).toContain("ignoredClasses");
      // Verify delimiters do not match plain brackets or parentheses
      expect(html).toContain('\\\\[');
      expect(html).toContain('\\\\(');
    });

    it("should use modern developer font stack, anti-aliasing, and enlarged keynote font sizes", () => {
      const html = assembleHyperDeckPresentation({
        topic: "Embedded Systems Architecture",
        slidesHtml: '<section class="slide" id="slide0"><div class="terminal-card"><pre class="terminal-body"><code>void setup() {}</code></pre></div></section>',
        targetCount: 1,
      });

      // Verify Google Fonts includes modern crisp developer typography
      expect(html).toContain("family=Fira+Code");
      expect(html).toContain("family=Plus+Jakarta+Sans");
      expect(html).toContain("family=JetBrains+Mono");

      // Verify font stack includes modern fallbacks and Linux vector fonts
      expect(html).toContain("'Fira Code'");
      expect(html).toContain("'DejaVu Sans Mono'");
      expect(html).toContain("'Cascadia Code'");
      expect(html).toContain("'SF Mono'");

      // Verify hardware anti-aliasing is enabled
      expect(html).toContain("-webkit-font-smoothing: antialiased");
      expect(html).toContain("text-rendering: optimizeLegibility");

      // Verify comfortable enlarged presentation font sizes
      expect(html).toContain("font-size: 15px"); // .terminal-body
      expect(html).toContain("font-size: 34px"); // .slide-title
      expect(html).toContain("font-size: 16.5px"); // .slide-subtitle
    });

    it("should bundle interactive annotation drawing canvas, bottom toolbar, and zoom controls", () => {
      const html = assembleHyperDeckPresentation({
        topic: "Neural Network Architecture",
        slidesHtml: '<section class="slide" id="slide0"><h2>Neural Layers</h2></section>',
        targetCount: 1,
      });

      // Canvas element
      expect(html).toContain('id="drawingCanvas"');
      expect(html).toContain('class="drawing-canvas"');

      // Top zoom controls
      expect(html).toContain('id="topZoomControls"');
      expect(html).toContain('onclick="zoomIn()"');
      expect(html).toContain('onclick="zoomOut()"');
      expect(html).toContain('onclick="resetZoom()"');

      // Bottom annotation toolbar
      expect(html).toContain('id="controlsBar"');
      expect(html).toContain('onclick="setTool(\'pen\')"');
      expect(html).toContain('onclick="setTool(\'highlighter\')"');
      expect(html).toContain('onclick="setTool(\'scroll\')"');
      expect(html).toContain('id="penColor"');
      expect(html).toContain('onclick="undo()"');
      expect(html).toContain('onclick="redo()"');
      expect(html).toContain('onclick="saveDrawings()"');
      expect(html).toContain('onclick="clearDrawings()"');
      expect(html).toContain('id="annotateToggleBtn"');

      // Footer indicator & controls-bar floating position
      expect(html).toContain('id="footerSlideCounter"');
      expect(html).toContain('id="footerCurrent"');
      expect(html).not.toContain('class="thumbnails-bar"');
      expect(html).toContain('bottom: max(74px');

      // Engine controller functions
      expect(html).toContain('function initDrawingEngine()');
      expect(html).toContain('window.setTool = function(tool)');
      expect(html).toContain('function saveSlideDrawing(');
      expect(html).toContain('function loadSlideDrawing(');
      expect(html).toContain('function applyZoom()');
      expect(html).toContain('HYPERDECK_SET_FULLSCREEN');
      expect(html).toContain(':fullscreen .controls-bar');
      expect(html).toContain(':fullscreen .top-zoom-controls');
    });
  });

  describe("parseStoryboardIntoSlides", () => {
    it("should generate distinct diverse slide blueprints when targetCount exceeds storyboard length", () => {
      const shortStoryboard = `SLIDE 1: Introduction to IoT\n- Focus: Sensor acquisition`;
      const slides = parseStoryboardIntoSlides(shortStoryboard, 4);
      expect(slides).toHaveLength(4);

      // Verify that slides 2, 3, 4 are not duplicate copies of each other
      expect(slides[1]).not.toBe(slides[2]);
      expect(slides[2]).not.toBe(slides[3]);
      expect(slides[1]).toContain("SLIDE 2:");
      expect(slides[2]).toContain("SLIDE 3:");
    });

    it("should never include prompt metadata like TARGET SLIDE COUNT in generated slide sections", () => {
      const polluted = `
TARGET SLIDE COUNT: 4 Slides
PREFERRED THEME: EMERALD
SOURCE DOCUMENT CONTENT:
SLIDE 1: Inode Hierarchy
- Category: STORAGE
SLIDE 2: VFS Subsystem
- Category: KERNEL
      `;
      const slides = parseStoryboardIntoSlides(polluted, 2);
      expect(slides).toHaveLength(2);
      expect(slides[0]).not.toContain("TARGET SLIDE COUNT");
      expect(slides[0]).not.toContain("PREFERRED THEME");
      expect(slides[0]).not.toContain("SOURCE DOCUMENT CONTENT");
      expect(slides[0]).toContain("Inode Hierarchy");
    });
  });

  describe("detectTargetSlideCount", () => {
    it("should extract explicit count from topic string", () => {
      const res = detectTargetSlideCount("Distributed Systems in 6 slides", undefined);
      expect(res.count).toBe(6);
      expect(res.isExplicit).toBe(true);
    });

    it("should enforce boundaries between 3 and 20 slides", () => {
      const tooSmall = detectTargetSlideCount("Physics in 1 slide", undefined);
      expect(tooSmall.count).toBe(3);

      const tooLarge = detectTargetSlideCount("Compiler design in 25 slides", undefined);
      expect(tooLarge.count).toBe(20);
    });
  });

  describe("presentationCache", () => {
    it("should cache and retrieve presentations by topic", () => {
      presentationCache.clear();
      const topic = "Distributed Hash Tables";
      presentationCache.set(topic, {
        topic,
        html: "<section class='slide' id='slide0'><h2>DHT</h2></section>",
        model: "nemotron-test",
      });

      const cached = presentationCache.get(topic);
      expect(cached).not.toBeNull();
      expect(cached?.topic).toBe(topic);
    });

    it("should reject and evict items matching the placeholder poison filter", () => {
      presentationCache.clear();
      const topic = "Fault Tolerance";
      presentationCache.set(topic, {
        topic,
        html: "<section class='slide'>Intensity Factor (α)</section>",
        model: "nemotron-test",
      });

      const cached = presentationCache.get(topic);
      expect(cached).toBeNull();
    });
  });

  describe("convertHtmlToPresentationAst", () => {
    it("should convert slide HTML into valid PresentationSchema AST", () => {
      const generatedHtml = `
        <section class="slide active" id="slide0">
          <div class="slide-title-group">
            <span class="slide-category">ARCHITECTURE</span>
            <h2 class="slide-title">Transmon Qubits</h2>
            <p class="slide-subtitle">Superconducting artificial atom dynamics</p>
          </div>
          <div class="glass-card card-cyan">
            <span class="card-title">Josephson Non-Linearity</span>
            <p class="card-desc">Provides anharmonic ladder spacing</p>
            <ul class="points-list">
              <li>Cooper pair tunneling across insulating oxide barrier</li>
              <li>Cos(φ) potential isolates |0⟩ to |1⟩ transition</li>
            </ul>
          </div>
        </section>
      `;

      const ast = convertHtmlToPresentationAst("Transmon Qubits", generatedHtml);
      expect(ast.title).toBe("Transmon Qubits");
      expect(ast.scenes).toHaveLength(1);
      expect(ast.scenes[0].title).toBe("Transmon Qubits");
      expect(ast.scenes[0].elements.length).toBeGreaterThanOrEqual(1);

      // Validate through Zod PresentationSchema
      const validated = PresentationSchema.safeParse(ast);
      expect(validated.success).toBe(true);
    });
  });

  describe("extractCleanTopic", () => {
    it("should keep clean standard topic as is", () => {
      const res = extractCleanTopic("CRDTs and Eventual Consistency");
      expect(res.title).toBe("CRDTs and Eventual Consistency");
    });

    it("should extract true document topic when given generic week/chapter label", () => {
      const input = "TOPIC: week 7\n50 3 Containers\n3.1 Linux Namespaces\nRun container_demo without any options...";
      const res = extractCleanTopic(input);
      expect(res.title).toContain("Containers");
      expect(res.title).toContain("week 7");
    });

    it("should strip UI prompt noise words like Slides and PREFERRED THEME", () => {
      const input = "Slides\nPREFERRED THEME (week 6)\n3 Containers\nContainers are a form of operating system virtualisation...";
      const res = extractCleanTopic(input);
      expect(res.title).toContain("Containers");
      expect(res.title).not.toContain("PREFERRED THEME");
      expect(res.title).not.toContain("Slides");
    });

    it("should sanitize unclosed parentheses and trailing cont from titles", () => {
      expect(sanitizeTitleString("Document Analysis: Page 18 (")).toBe("");
      expect(sanitizeTitleString("Linux Source Tree Descriptions (cont")).toBe("Linux Source Tree Descriptions");
      expect(sanitizeTitleString("Overview of GNU/Linux (cont.)")).toBe("Overview of GNU/Linux");
      expect(sanitizeTitleString("Chapter 2: Bootloader Mechanics -")).toBe("Chapter 2: Bootloader Mechanics");
    });
  });

  describe("synthesizeFallbackSlide", () => {
    it("should strip markdown asterisks and never produce empty slide titles", () => {
      const directive = `
- SLIDE NUMBER & TITLE:**
TITLE:** Linux Namespaces – Kernel-Level Isolation
- SUBTITLE & CATEGORY:** PHYSICAL TOPOLOGY
- NARRATIVE & CONTENT**
Primary Takeaway:** Containers achieve OS-level virtualisation by creating restricted views of system resources.
      `;
      const html = synthesizeFallbackSlide("Containers", 0, 5, directive);
      expect(html).toContain('<h2 class="slide-title">Linux Namespaces – Kernel-Level Isolation</h2>');
      expect(html).toContain('<div class="slide-category">PHYSICAL TOPOLOGY</div>');
      expect(html).not.toContain('**');
      expect(html).toContain('<svg');
      expect(html).not.toContain('⚙️');
      expect(html).not.toContain('⚡');
    });

    it("should synthesize terminal explorer template without emojis and with clean code spans", () => {
      const directive = `
TITLE: Container Isolation CLI
TEMPLATE: TEMPLATE_02_TERMINAL_CODE_EXPLORER
sudo unshare --fork --pid --mount-proc /bin/bash
ls /proc confirms new PID space
      `;
      const html = synthesizeFallbackSlide("Linux Containers", 1, 5, directive);
      expect(html).toContain('class="terminal-card"');
      expect(html).toContain('terminal-prompt');
      expect(html).not.toContain('📦');
      expect(html).not.toContain('🔧');
      expect(html).not.toContain('💻');
    });

    it("should never let prompt metadata like TARGET SLIDE COUNT or PREFERRED THEME become slide titles", () => {
      const pollutedDirective = `
TARGET SLIDE COUNT: 4 Slides
PREFERRED THEME: EMERALD
SOURCE DOCUMENT CONTENT:
TITLE: Inode Pointer Resolution
Direct pointers link to 4KB blocks
Single indirect pointer addresses 1024 blocks
      `;
      const html = synthesizeFallbackSlide("The Filesystem", 0, 4, pollutedDirective);
      expect(html).not.toContain("TARGET SLIDE COUNT");
      expect(html).not.toContain("PREFERRED THEME");
      expect(html).not.toContain("SOURCE DOCUMENT");
      expect(html).toContain("Inode Pointer Resolution");
    });

    it("should synthesize pointer-topology for Inode data structures", () => {
      const inodeDirective = `
TITLE: Inode Pointer Hierarchy
Inodes contain 15 disk block pointers
Direct pointers 0-11 link to 4KB blocks
Single indirect pointer addresses 4MB of data
Double indirect pointer addresses 4GB
      `;
      const html = synthesizeFallbackSlide("The Filesystem", 2, 4, inodeDirective);
      expect(html).toContain('class="pointer-topology"');
      expect(html).toContain("pointer-node");
      expect(html).toContain("pointer-arrow-svg");
    });

    it("should synthesize disk-stripe for block group and superblock layouts", () => {
      const stripeDirective = `
TITLE: Ext4 Disk Block Group Layout
Superblock stores fixed filesystem creation parameters
Group Descriptors store block allocations
Block Bitmap and Inode Bitmap track usage
Inode Table contains file metadata
Data Blocks contain file contents
      `;
      const html = synthesizeFallbackSlide("The Filesystem", 3, 4, stripeDirective);
      expect(html).toContain('class="disk-stripe"');
      expect(html).toContain('stripe-block stripe-cyan');
      expect(html).toContain('Superblock');
      expect(html).toContain('Group Descriptors');
    });

    it("should synthesize arch-stack for Virtual Filesystem (VFS) architecture", () => {
      const vfsDirective = `
TITLE: Virtual Filesystem (VFS) Abstraction
User applications use POSIX open and read calls
VFS provides a uniform switch layer over 50+ filesystems
Concrete drivers like ext4, procfs, and tmpfs manage disk structures
Device drivers and buffer cache handle physical storage
      `;
      const html = synthesizeFallbackSlide("The Filesystem", 1, 4, vfsDirective);
      expect(html).toContain('class="arch-stack"');
      expect(html).toContain('stack-tier');
      expect(html).toContain('Virtual Filesystem Switch');
    });
  });

  describe("sanitizeDocumentContent", () => {
    it("should strip OCR and PDF banners and prompt directives", () => {
      const raw = `
==Start of PDF==
page 1==Screenshot for page 1==
==Start of OCR for page 1==
4.4 The Filesystem
The GNU/Linux file space comprises one or more filesystems.
==End of OCR for page 1==
TARGET SLIDE COUNT: 4 Slides
PREFERRED THEME: EMERALD
SOURCE DOCUMENT CONTENT:
GNU/Linux supports over 50 types of filesystem.
==End of PDF==
      `;
      const sanitized = sanitizeDocumentContent(raw);
      expect(sanitized).not.toContain("==Start of PDF==");
      expect(sanitized).not.toContain("==End of PDF==");
      expect(sanitized).not.toContain("==Start of OCR for page 1==");
      expect(sanitized).not.toContain("TARGET SLIDE COUNT");
      expect(sanitized).not.toContain("PREFERRED THEME");
      expect(sanitized).not.toContain("SOURCE DOCUMENT CONTENT");
      expect(sanitized).toContain("4.4 The Filesystem");
      expect(sanitized).toContain("The GNU/Linux file space comprises one or more filesystems.");
      expect(sanitized).toContain("GNU/Linux supports over 50 types of filesystem.");
    });
  });

  describe("sanitizeAiTone", () => {
    it("should strip pipe separators and buzzword suffixes from slide categories", () => {
      const raw = `<div class="slide-category">CORE SECURITY ARCHITECTURE | CIA TRIAD INVARIANTS</div>`;
      const cleaned = sanitizeAiTone(raw);
      expect(cleaned).toBe(`<div class="slide-category">CORE SECURITY ARCHITECTURE</div>`);
    });

    it("should strip pseudo-math formulas on conceptual security topics", () => {
      const raw = `
        <div class="slide-title-group">
          <div class="slide-category">SECURITY ARCHITECTURE</div>
          <h2 class="slide-title">CIA Triad</h2>
        </div>
        <div style="margin-top: 1.25rem;">
          <div class="equation-display" style="background: rgba(245, 158, 11, 0.08); padding: 0.85rem;">
            $$ S = \\text{Secure} \\iff (\\text{Confidentiality} \\cap \\text{Integrity} \\cap \\text{Availability}) $$
          </div>
        </div>
      `;
      const cleaned = sanitizeAiTone(raw);
      expect(cleaned).not.toContain("equation-display");
      expect(cleaned).not.toContain("\\text{Secure}");
      expect(cleaned).toContain("CIA Triad");
    });

    it("should naturalize robotic participle subtitle clichés and replace buzzwords", () => {
      const raw = `<p class="slide-subtitle">Establishing foundational enterprise asset protection through strict cryptographic boundaries and systemic invariants.</p>`;
      const cleaned = sanitizeAiTone(raw);
      expect(cleaned).not.toContain("Establishing");
      expect(cleaned).not.toContain("systemic invariants");
      expect(cleaned).toContain("security guarantees");
    });

    it("should convert inline styled rainbow cards to clean academic classes", () => {
      const raw = `<div class="card" style="border-top: 3px solid #f59e0b; background: rgba(15, 23, 42, 0.6); padding: 1.25rem; border-radius: 8px;">`;
      const cleaned = sanitizeAiTone(raw);
      expect(cleaned).toBe(`<div class="glass-card card-amber">`);
    });

    it("should auto-repair hallucinated CSS classes and invalid captions", () => {
      const raw = `
        <div class="tri-card-grid">
          <div class="card card-indigo"><h3>Reconnaissance</h3></div>
        </div>
        <div class="checklist">
          <div class="checklist-item">Rigorous access controls</div>
        </div>
        <div class="topology-flow">
          <div class="topology-bus"><svg></svg><caption>Bus</caption></div>
        </div>
      `;
      const cleaned = sanitizeAiTone(raw);
      expect(cleaned).toContain('class="grid-3"');
      expect(cleaned).toContain('class="glass-card card-indigo"');
      expect(cleaned).toContain('class="checklist-group"');
      expect(cleaned).toContain('class="check-item"');
      expect(cleaned).toContain('class="topology-grid"');
      expect(cleaned).toContain('<div class="topology-label">Bus</div>');
      expect(cleaned).not.toContain("<caption>");
    });

    it("should upgrade pseudo-CLI commands and childish binary chips", () => {
      const raw = `
        <span class="terminal-cmd">$ network scan</span>
        <span class="terminal-cmd">$ port scan</span>
        <span class="terminal-cmd">$ vulnerability scan</span>
        <div class="tier-chips"><span class="tier-chip">0</span><span class="tier-chip">1</span></div>
      `;
      const cleaned = sanitizeAiTone(raw);
      expect(cleaned).toContain("$ nmap -sn 192.168.1.0/24");
      expect(cleaned).toContain("$ nmap -sS -p 1-1024 192.168.1.50");
      expect(cleaned).toContain("$ nmap --script=vuln 192.168.1.50");
      expect(cleaned).toContain("NRZ / Manchester");
      expect(cleaned).toContain("Binary Framing");
    });

    it("should strip robotic index-card prefixes from slide subtitles", () => {
      const raw1 = `<p class="slide-subtitle">This slide compares the seven-layer OSI reference model with the four-layer TCP/IP stack.</p>`;
      expect(sanitizeAiTone(raw1)).toBe(`<p class="slide-subtitle">The seven-layer OSI reference model with the four-layer TCP/IP stack.</p>`);

      const raw2 = `<p class="slide-subtitle">This slide contrasts protocols that send data in clear text with encrypted communications.</p>`;
      expect(sanitizeAiTone(raw2)).toBe(`<p class="slide-subtitle">Protocols that send data in clear text with encrypted communications.</p>`);

      const raw3 = `<p class="slide-subtitle">This slide categorizes common network attack vectors into reconnaissance and injection.</p>`;
      expect(sanitizeAiTone(raw3)).toBe(`<p class="slide-subtitle">Common network attack vectors into reconnaissance and injection.</p>`);
    });
  });

  describe("isValidSlideHtml", () => {
    it("should accept substantive slides with multiple tiers", () => {
      const valid = `
        <section class="slide active" id="slide0">
          <div class="slide-title-group">
            <h2 class="slide-title">OSI Reference Model</h2>
            <p class="slide-subtitle">Seven-layer architectural abstraction for network communications.</p>
          </div>
          <div class="arch-stack">
            <div class="stack-tier"><div class="tier-left"><span class="tier-badge badge-cyan">LAYER 7</span><div><div class="tier-name">Application</div><div class="tier-sub">HTTP/HTTPS</div></div></div></div>
            <div class="stack-tier"><div class="tier-left"><span class="tier-badge badge-indigo">LAYER 4</span><div><div class="tier-name">Transport</div><div class="tier-sub">TCP/UDP</div></div></div></div>
          </div>
        </section>
      `;
      expect(isValidSlideHtml(valid)).toBe(true);
    });

    it("should reject hollow/empty arch-stacks with only 1 tier or empty inner divs", () => {
      const hollow1 = `
        <section class="slide" id="slide3">
          <div class="slide-title-group">
            <div class="slide-category">PROTOCOL STACK</div>
            <h2 class="slide-title">OSI vs TCP/IP Model Comparison</h2>
            <p class="slide-subtitle">Seven-layer OSI reference model compared with the TCP/IP stack.</p>
          </div>
          <div class="arch-stack">
            <div class="stack-tier"><div class="tier-left"><span class="tier-badge badge-cyan">LAYER 7</span><div></div></div></div>
          </div>
        </section>
      `;
      expect(isValidSlideHtml(hollow1)).toBe(false);
    });

    it("should reject slides with insufficient text substance", () => {
      const tooShort = `
        <section class="slide" id="slide0">
          <div class="glass-card">Hi</div>
        </section>
      `;
      expect(isValidSlideHtml(tooShort)).toBe(false);
    });
  });

  describe("Dynamic Academic Title Extraction", () => {
    it("should extract true title from OCR text and reject dates and boilerplate", () => {
      const ocrInput = `
15/11/1446
1
Dept. Computer and Cyber Security Cybersecurity Fundamentals - 509201 Dr. Ali Al Mazari @ Jadara University
Cybersecurity Fundamentals
Network Security
Agenda
• Networking World
– Concepts, Components, Topology, Types, Architectures, Protocols
      `;
      const res = extractCleanTopic(ocrInput);
      expect(res.title).toBe("Cybersecurity Fundamentals: Network Security");
      expect(res.title).not.toContain("15/11/1446");
      expect(res.title).not.toContain("Mazari");
      expect(res.title).not.toContain("509201");
    });

    it("should reject generic Title (Lecture 3) and extract actual title with lecture qualifier", () => {
      const input = `TOPIC: Title (Lecture 3)
15/11/1446
1
Dept. Computer and Cyber Security Cybersecurity Fundamentals - 509201 Dr. Ali Al Mazari @ Jadara University
Cybersecurity Fundamentals
Network Security`;
      const res = extractCleanTopic(input);
      expect(res.title).toBe("Cybersecurity Fundamentals: Network Security (Lecture 3)");
    });

    it("should reject generic Text placeholder and extract true book chapter title", () => {
      const input = `Text:\n3 Containers\nContainers are a form of operating system virtualisation...\n3.1 Linux Namespaces\nNamespaces facilitate containers.`;
      const res = extractCleanTopic(input);
      expect(res.title).toBe("Containers: Linux Namespaces");
      expect(res.title).not.toBe("Text");
    });

    it("should normalize code-diff, pipeline, and card-header classes in sanitizeAiTone", () => {
      const raw = `
        <div class="code-diff">
          <div class="card-header"><span class="card-title">Title</span></div>
          <div class="card-body"><p>Description</p></div>
          <pre class="code-block"><code>echo hello</code></pre>
        </div>
        <div class="pipeline">
          <div class="stage"><div class="label">Step 1</div></div>
        </div>
      `;
      const cleaned = sanitizeAiTone(raw);
      expect(cleaned).toContain('class="diff-container"');
      expect(cleaned).toContain('class="glass-card-header"');
      expect(cleaned).toContain('class="card-desc"');
      expect(cleaned).toContain('class="terminal-body"');
      expect(cleaned).toContain('class="motion-pipeline"');
      expect(cleaned).toContain('class="pipeline-stage"');
      expect(cleaned).toContain('class="stage-title"');
    });
  });
});

