import { MASTER_DESIGN_SYSTEM_CSS } from "./token-optimizer";
import { sanitizeAiTone } from "./stage3-creative-generator";

export interface AssembleOptions {
  topic: string;
  slidesHtml: string;
  outline?: string;
  targetCount: number;
  theme?: string;
}

/**
 * Robustly extracts slide sections (<section class="slide"...>...</section>) from LLM content.
 * Guarantees that internal classes like slide-title-group or slide-category are never mistaken for slides.
 */
export function extractSlidesFromContent(raw: string): string[] {
  if (!raw || typeof raw !== "string") return [];
  let clean = raw
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<html[^>]*>|<\/html>/gi, "")
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
    .replace(/<body[^>]*>|<\/body>/gi, "");

  // Strip scripts during slide parsing so they don't break tag balance
  const scriptsRemoved = clean.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");

  // Match actual slide opening boundary:
  // Must match <section> or <div> with id="slideN" or class containing standalone "slide" (not hyphenated)
  const slideDelimiterRegex = /(?=<section\b[^>]*\b(?:id=["']slide\d+["']|class=["'][^"']*(?:\s|^)slide(?:\s|["']))|<div\b[^>]*\b(?:id=["']slide\d+["']|class=["'][^"']*(?:\s|^)slide(?:\s|["'])))/i;

  const rawParts = scriptsRemoved.split(slideDelimiterRegex).map((p) => p.trim()).filter(Boolean);
  const slides: string[] = [];

  for (const part of rawParts) {
    const isSlide = /<(?:section|div)\b[^>]*\b(?:id=["']slide\d+["']|class=["'][^"']*(?:\s|^)slide(?:\s|["']))/i.test(part);
    if (isSlide) {
      let slide = part;

      if (slide.startsWith("<section")) {
        const lastClose = slide.lastIndexOf("</section>");
        if (lastClose > 0) {
          slide = slide.slice(0, lastClose + 10);
        } else {
          // Slide truncated without </section>: strip dangling incomplete tag
          slide = slide.replace(/<[a-z0-9_-]+(?:\s+[^>]*)?$/i, "");
          const openDivs = (slide.match(/<div\b/gi) || []).length;
          const closeDivs = (slide.match(/<\/div>/gi) || []).length;
          for (let d = 0; d < openDivs - closeDivs; d++) {
            slide += "</div>";
          }
          slide += "</section>";
        }
      } else if (slide.startsWith("<div")) {
        const lastClose = slide.lastIndexOf("</div>");
        if (lastClose > 0) {
          slide = slide.slice(0, lastClose + 6);
        } else {
          slide = slide.replace(/<[a-z0-9_-]+(?:\s+[^>]*)?$/i, "");
          slide += "</div>";
        }
      }

      // Normalize raw unformatted <h2>Slide X</h2> headings into standard .slide-title-group
      if (/<h2\b[^>]*>.*?<\/h2>/i.test(slide) && !slide.includes("slide-title-group")) {
        slide = slide.replace(
          /<h2\b[^>]*>(?:.*?Slide\s+\d+[^<]*[–-]\s*)?([^<]+)<\/h2>(?:\s*<h3\b[^>]*>([^<]+)<\/h3>)?(?:\s*<p class="subtitle"[^>]*>([^<]+)<\/p>)?/i,
          (_, h2Text, h3Text, subText) => {
            const cleanTitle = (h3Text || h2Text || "Component Architecture").trim();
            const subtitle = (subText || (h3Text ? h2Text : "") || "Core technical principles and runtime architecture").trim();
            return `<div class="slide-title-group">
    <div class="slide-category">SYSTEM ARCHITECTURE</div>
    <h2 class="slide-title">${cleanTitle}</h2>
    <p class="slide-subtitle">${subtitle}</p>
  </div>`;
          }
        );
      }

      slides.push(slide.trim());
    }
  }

  // If delimiter splitting found no slides, try regex fallback
  if (slides.length === 0) {
    const fallbackRegex = /<section\b[^>]*\b(?:id=["']slide\d+["']|class=["'][^"']*(?:\s|^)slide(?:\s|["']))[^>]*>([\s\S]*?)<\/section>/gi;
    let match: RegExpExecArray | null;
    while ((match = fallbackRegex.exec(clean)) !== null) {
      slides.push(match[0].trim());
    }
  }

  return slides;
}

/**
 * Extracts custom scripts from LLM output.
 */
export function extractCustomScripts(raw: string): string {
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let combinedJs = "";
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(raw)) !== null) {
    const content = match[1].trim();
    if (content && !content.includes("master-hyperdeck-controller")) {
      combinedJs += "\n" + content;
    }
  }

  return combinedJs.trim();
}

/**
 * Assembles a complete, standalone HyperDeck presentation website.
 */
export function assembleHyperDeckPresentation(options: AssembleOptions): string {
  const { topic, slidesHtml, targetCount } = options;
  const cleanSlides = extractSlidesFromContent(slidesHtml);
  const customScript = extractCustomScripts(slidesHtml);

  // If no valid slides were parsed, wrap the raw content or generate structured default
  let renderedSlidesHtml = "";
  if (cleanSlides.length > 0) {
    renderedSlidesHtml = cleanSlides.map((rawSlide, idx) => {
      // Apply comprehensive AI tone and pseudo-math sanitization
      const slide = sanitizeAiTone(rawSlide);
      // Ensure first slide is active and others are not active
      let fixed = slide.replace(/\bactive\b/g, "");
      // Normalize id to sequential index matching thumbnails and controller
      if (/\bid=["']slide\d+["']/i.test(fixed)) {
        fixed = fixed.replace(/\bid=["']slide\d+["']/i, `id="slide${idx}"`);
      } else {
        fixed = fixed.replace(/<section\b/i, `<section id="slide${idx}"`);
      }
      if (idx === 0) {
        fixed = fixed.replace(/class=["']([^"']*)["']/, 'class="$1 active"');
      }
      return fixed;
    }).join("\n\n");
  } else {
    // Fallback wrapper for raw content
    renderedSlidesHtml = `<section class="slide active" id="slide0">
      <div class="slide-title-group">
        <div class="slide-category">PRESENTATION</div>
        <h2 class="slide-title">${escapeHtml(topic)}</h2>
      </div>
      <div class="glass-card">
        <p class="card-desc">${escapeHtml(topic)}</p>
      </div>
    </section>`;
  }

  const effectiveCount = Math.max(cleanSlides.length, targetCount);

  // Build thumbnail buttons
  const thumbButtons = Array.from({ length: effectiveCount }, (_, i) => {
    return `<button class="thumb-btn ${i === 0 ? "active" : ""}" data-index="${i}" onclick="goToSlide(${i})">Slide ${i + 1}</button>`;
  }).join("\n          ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(topic)} — Onyx</title>
  
  <!-- Preconnect & Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800;900&family=Fira+Code:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- GSAP Animation Engine -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <!-- Three.js 3D WebGL Engine -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <!-- KaTeX Mathematical Typography Engine -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js"></script>
  
  <style>
${MASTER_DESIGN_SYSTEM_CSS}
  </style>
</head>
<body class="theme-${options.theme || 'oxford'}">
  <main class="hyperdeck-stage" id="hyperdeckStage">
    <!-- Progress Indicator -->
    <div class="progress-bar-wrap">
      <div class="progress-bar-fill" id="progressBar"></div>
    </div>

    <!-- Executive Header -->
    <header class="stage-header">
      <div class="header-left">
        <span class="badge">ONYX</span>
        <h1 class="deck-title">${escapeHtml(topic)}</h1>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <div class="badge" id="slideCounter">1 / ${effectiveCount}</div>
      </div>
    </header>

    <!-- Slide Content Viewport -->
    <section class="slides-viewport" id="viewport">
${renderedSlidesHtml}
    </section>

    <!-- Floating Stage Chevrons for Easy Click-Through -->
    <button class="stage-chevron stage-chevron-prev" onclick="prevSlide()" aria-label="Previous Slide" title="Previous Slide (← / K)">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
    </button>
    <button class="stage-chevron stage-chevron-next" onclick="nextSlide()" aria-label="Next Slide" title="Next Slide (→ / Space / J)">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
    </button>

    <!-- Persistent Navigation Footer -->
    <footer class="stage-footer">
      <nav class="thumbnails-bar" id="thumbsBar">
        ${thumbButtons}
      </nav>

      <div class="nav-actions">
        <button class="btn-nav" id="prevBtn" onclick="prevSlide()" title="Previous (Left Arrow / K)">◀ Prev</button>
        <button class="btn-nav btn-primary" id="nextBtn" onclick="nextSlide()" title="Next (Right Arrow / Space / J)">Next ▶</button>
        <button class="btn-nav" onclick="toggleFullscreen()" title="Fullscreen (F)">⛶</button>
      </div>
    </footer>
  </main>

  <script id="master-hyperdeck-controller">
    let currentSlide = 0;
    const slides = Array.from(document.querySelectorAll('.slide'));
    const totalSlides = slides.length;
    const progressBar = document.getElementById('progressBar');
    const slideCounter = document.getElementById('slideCounter');
    const thumbBtns = Array.from(document.querySelectorAll('.thumb-btn'));

    function setTheme(t) {
      document.body.className = 'theme-' + t;
    }

    function updatePresentationState() {
      slides.forEach((s, idx) => {
        if (idx === currentSlide) {
          s.classList.add('active');
          if (window.gsap) {
            // Animate cards and diagram containers
            gsap.fromTo(s.querySelectorAll('.glass-card, .matrix-table, .sim-container, .chart-card, .venn-container, .flow-diagram'), 
              { opacity: 0, y: 16 }, 
              { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" }
            );

            // Animate motion pipeline stages with spring bounce
            gsap.fromTo(s.querySelectorAll('.pipeline-stage'),
              { opacity: 0, y: 22, scale: 0.92 },
              { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.1, ease: "back.out(1.4)", delay: 0.05 }
            );

            // Animate pipeline connectors expanding
            gsap.fromTo(s.querySelectorAll('.pipeline-connector'),
              { scaleX: 0, transformOrigin: "left center" },
              { scaleX: 1, duration: 0.4, stagger: 0.1, ease: "power2.out", delay: 0.15 }
            );

            // Animate chart bars growing upward
            gsap.fromTo(s.querySelectorAll('.chart-bar-fill'),
              { scaleY: 0, transformOrigin: "bottom" },
              { scaleY: 1, duration: 0.65, stagger: 0.08, ease: "back.out(1.2)", delay: 0.1 }
            );

            // Animate Venn diagram circles blooming
            gsap.fromTo(s.querySelectorAll('.venn-circle-shape'),
              { scale: 0.6, opacity: 0, transformOrigin: "center" },
              { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out", delay: 0.05 }
            );

            // Animate flow nodes popping
            gsap.fromTo(s.querySelectorAll('.flow-node'),
              { scale: 0.5, opacity: 0 },
              { scale: 1, opacity: 1, duration: 0.4, stagger: 0.1, ease: "back.out(1.5)", delay: 0.1 }
            );
          }

          // Initialize 2026 Creative 3D WebGL & Particle engines on active slide
          initThreeScenes(s);
          initParticleConduits(s);

          // Render KaTeX mathematical equations on active slide
          if (window.renderMathInElement) {
            try {
              renderMathInElement(s, {
                delimiters: [
                  { left: "$$", right: "$$", display: true },
                  { left: "\\\\[", right: "\\\\]", display: true },
                  { left: "\\\\(", right: "\\\\)", display: false },
                ],
                ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
                ignoredClasses: ["terminal-card", "terminal-body", "terminal-cmd", "arch-stack", "disk-stripe", "stat-card"],
                throwOnError: false,
              });
            } catch (e) {
              console.warn("KaTeX render error:", e);
            }
          }
        } else {
          s.classList.remove('active');
        }
      });

      thumbBtns.forEach((btn, idx) => {
        btn.classList.toggle('active', idx === currentSlide);
      });

      const progress = totalSlides > 1 ? ((currentSlide + 1) / totalSlides) * 100 : 100;
      if (progressBar) progressBar.style.width = progress + '%';
      if (slideCounter) slideCounter.textContent = (currentSlide + 1) + ' / ' + totalSlides;

      // Invoke custom slide hooks if declared (e.g. initSlide1())
      if (typeof window['initSlide' + currentSlide] === 'function') {
        try { window['initSlide' + currentSlide](); } catch (e) { console.warn(e); }
      }

      // Broadcast state update for Presenter Console & iframe containers
      try {
        const activeSlide = slides[currentSlide];
        const activeTitle = activeSlide ? (activeSlide.querySelector('.slide-title')?.textContent?.trim() || ('Slide ' + (currentSlide + 1))) : '';
        const notes = activeSlide?.getAttribute('data-notes') || '';
        const syncMsg = {
          type: 'HYPERDECK_STATE_UPDATE',
          currentSlide,
          totalSlides,
          title: activeTitle,
          notes: notes,
        };
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(syncMsg, '*');
        }
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(syncMsg, '*');
        }
      } catch (err) {
        // Cross-origin safety
      }
    }

    // Bidirectional remote navigation listener (e.g. from Presenter Console)
    window.addEventListener('message', (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'HYPERDECK_NAVIGATE') {
        if (e.data.action === 'next') nextSlide();
        else if (e.data.action === 'prev') prevSlide();
        else if (e.data.action === 'goTo' && typeof e.data.index === 'number') goToSlide(e.data.index);
      }
    });

    function nextSlide() {
      if (currentSlide < totalSlides - 1) {
        currentSlide++;
        updatePresentationState();
      }
    }

    function prevSlide() {
      if (currentSlide > 0) {
        currentSlide--;
        updatePresentationState();
      }
    }

    function goToSlide(idx) {
      if (idx >= 0 && idx < totalSlides) {
        currentSlide = idx;
        updatePresentationState();
      }
    }

    function toggleFullscreen() {
      const stage = document.getElementById('hyperdeckStage');
      if (!document.fullscreenElement) {
        if (stage.requestFullscreen) stage.requestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (['ArrowRight', 'Space', 'j', 'PageDown'].includes(e.key)) {
        e.preventDefault();
        nextSlide();
      } else if (['ArrowLeft', 'k', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (!isNaN(Number(e.key)) && Number(e.key) >= 1 && Number(e.key) <= totalSlides) {
        goToSlide(Number(e.key) - 1);
      }
    });

    // Interactive Motion Pipeline Handler
    function initMotionPipelines() {
      document.querySelectorAll('.motion-pipeline').forEach((pipeline) => {
        const stages = Array.from(pipeline.querySelectorAll('.pipeline-stage'));
        stages.forEach((stg) => {
          stg.addEventListener('click', () => {
            stages.forEach(s => s.classList.remove('active-stage'));
            stg.classList.add('active-stage');
            if (window.gsap) {
              gsap.fromTo(stg, { scale: 0.96 }, { scale: 1.04, duration: 0.35, ease: "back.out(2)" });
            }
          });
        });
      });

      // State switcher buttons
      document.querySelectorAll('.state-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const parent = btn.closest('.state-switcher');
          if (parent) {
            parent.querySelectorAll('.state-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
          }
        });
      });
    }

    // Global simulation runner triggered by [▶ Simulate Flow] buttons
    window.simulatePipelineFlow = function(btn) {
      const pipeline = btn.closest('.slide')?.querySelector('.motion-pipeline') || btn.closest('.motion-pipeline');
      if (!pipeline) return;
      const stages = Array.from(pipeline.querySelectorAll('.pipeline-stage'));
      if (stages.length === 0) return;

      btn.disabled = true;
      const originalText = btn.innerHTML;
      btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline;vertical-align:-1px;margin-right:4px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>Transmitting...';

      let step = 0;
      stages.forEach(s => s.classList.remove('active-stage'));

      const interval = setInterval(() => {
        if (step < stages.length) {
          stages.forEach(s => s.classList.remove('active-stage'));
          const currentStage = stages[step];
          currentStage.classList.add('active-stage');
          if (window.gsap) {
            gsap.fromTo(currentStage, { scale: 0.94 }, { scale: 1.06, duration: 0.35, ease: "back.out(2)" });
          }
          step++;
        } else {
          clearInterval(interval);
          btn.disabled = false;
          btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline;vertical-align:-1px;margin-right:4px;"><polyline points="20 6 9 17 4 12"></polyline></svg>Complete';
          setTimeout(() => { btn.innerHTML = originalText; }, 2000);
        }
      }, 550);
    };

    // =========================================================================
    // 2026 Creative Runtime: Three.js 3D WebGL Worlds & Particle Conduits
    // =========================================================================
    const active3DScenes = new Map();

    function initThreeScenes(slideEl) {
      if (!window.THREE) return;
      const containers = slideEl.querySelectorAll('.three-container');
      containers.forEach((container) => {
        if (container.dataset.initialized) return;
        container.dataset.initialized = 'true';

        const modelType = container.getAttribute('data-model') || 'quantum-bloch-sphere';
        const width = container.clientWidth || 550;
        const height = container.clientHeight || 320;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 1.2, 4.8);

        let renderer;
        try {
          renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        } catch (e) {
          console.warn('WebGL not supported:', e);
          return;
        }

        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.domElement.className = 'three-canvas';
        container.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
        dirLight.position.set(5, 10, 7);
        scene.add(dirLight);

        const rootGroup = new THREE.Group();
        scene.add(rootGroup);

        if (modelType.includes('bloch') || modelType.includes('quantum')) {
          // 3D Quantum Bloch Sphere
          const sphereGeo = new THREE.SphereGeometry(1.5, 26, 16);
          const sphereMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.18 });
          const sphere = new THREE.Mesh(sphereGeo, sphereMat);
          rootGroup.add(sphere);

          const eqGeo = new THREE.TorusGeometry(1.5, 0.022, 16, 64);
          const eqMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
          const eqRing = new THREE.Mesh(eqGeo, eqMat);
          eqRing.rotation.x = Math.PI / 2;
          rootGroup.add(eqRing);

          const merGeo = new THREE.TorusGeometry(1.5, 0.018, 16, 64);
          const merMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
          const merRing = new THREE.Mesh(merGeo, merMat);
          rootGroup.add(merRing);

          const zPoints = [new THREE.Vector3(0, -1.8, 0), new THREE.Vector3(0, 1.8, 0)];
          const zGeo = new THREE.BufferGeometry().setFromPoints(zPoints);
          const zLine = new THREE.Line(zGeo, new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.5 }));
          rootGroup.add(zLine);

          const dir = new THREE.Vector3(0.7, 1.1, 0.6).normalize();
          const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), 1.5, 0xf59e0b, 0.28, 0.16);
          rootGroup.add(arrow);

          const partGeo = new THREE.BufferGeometry();
          const partCount = 70;
          const posArr = new Float32Array(partCount * 3);
          for (let p = 0; p < partCount * 3; p += 3) {
            const u = Math.random();
            const v = Math.random();
            const theta = u * 2.0 * Math.PI;
            const phi = Math.acos(2.0 * v - 1.0);
            const r = 1.5 + (Math.random() - 0.5) * 0.12;
            posArr[p] = r * Math.sin(phi) * Math.cos(theta);
            posArr[p + 1] = r * Math.sin(phi) * Math.sin(theta);
            posArr[p + 2] = r * Math.cos(phi);
          }
          partGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
          const partMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.045, transparent: true, opacity: 0.8 });
          rootGroup.add(new THREE.Points(partGeo, partMat));

        } else if (modelType.includes('chip') || modelType.includes('hardware') || modelType.includes('die')) {
          // 3D Silicon Microchip Die
          const substrate = new THREE.Mesh(
            new THREE.BoxGeometry(2.8, 0.12, 2.8),
            new THREE.MeshStandardMaterial({ color: 0x0b1120, roughness: 0.2, metalness: 0.8 })
          );
          rootGroup.add(substrate);

          const die = new THREE.Mesh(
            new THREE.BoxGeometry(1.6, 0.16, 1.6),
            new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.9, emissive: 0x0284c7, emissiveIntensity: 0.3 })
          );
          die.position.y = 0.05;
          rootGroup.add(die);

          for (let p = -1.2; p <= 1.2; p += 0.4) {
            const pin = new THREE.Mesh(
              new THREE.BoxGeometry(0.08, 0.08, 0.4),
              new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.5 })
            );
            pin.position.set(p, 0.08, -1.2);
            rootGroup.add(pin);
            const pinS = pin.clone();
            pinS.position.z = 1.2;
            rootGroup.add(pinS);
          }
          rootGroup.rotation.x = 0.65;
          rootGroup.rotation.y = -0.45;

        } else {
          // 3D Neural Constellation / Dynamic Node Graph
          const nodePositions = [];
          const nodeMat = new THREE.MeshStandardMaterial({ color: 0x818cf8, emissive: 0x818cf8, emissiveIntensity: 0.6 });
          for (let n = 0; n < 14; n++) {
            const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), nodeMat);
            sphere.position.set(
              (Math.random() - 0.5) * 3.2,
              (Math.random() - 0.5) * 2.2,
              (Math.random() - 0.5) * 2.2
            );
            rootGroup.add(sphere);
            nodePositions.push(sphere.position);
          }
          const linePoints = [];
          for (let a = 0; a < nodePositions.length; a++) {
            for (let b = a + 1; b < nodePositions.length; b++) {
              if (nodePositions[a].distanceTo(nodePositions[b]) < 1.6) {
                linePoints.push(nodePositions[a], nodePositions[b]);
              }
            }
          }
          const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
          const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 }));
          rootGroup.add(lines);
        }

        // Interactive Mouse/Touch Orbit Controls
        let isDragging = false;
        let prevMouseX = 0;
        let prevMouseY = 0;
        let rotSpeedX = 0;
        let rotSpeedY = 0;

        const onDown = (e) => {
          isDragging = true;
          prevMouseX = e.touches ? e.touches[0].clientX : e.clientX;
          prevMouseY = e.touches ? e.touches[0].clientY : e.clientY;
        };

        const onMove = (e) => {
          if (!isDragging) return;
          const curX = e.touches ? e.touches[0].clientX : e.clientX;
          const curY = e.touches ? e.touches[0].clientY : e.clientY;
          rotSpeedY = (curX - prevMouseX) * 0.006;
          rotSpeedX = (curY - prevMouseY) * 0.006;
          rootGroup.rotation.y += rotSpeedY;
          rootGroup.rotation.x += rotSpeedX;
          prevMouseX = curX;
          prevMouseY = curY;
        };

        const onUp = () => { isDragging = false; };

        container.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        container.addEventListener('touchstart', onDown, { passive: true });
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend', onUp);

        const animate = () => {
          requestAnimationFrame(animate);
          if (!isDragging) {
            rootGroup.rotation.y += 0.004;
            rotSpeedX *= 0.94;
            rotSpeedY *= 0.94;
            rootGroup.rotation.x += rotSpeedX;
            rootGroup.rotation.y += rotSpeedY;
          }
          renderer.render(scene, camera);
        };
        animate();
      });
    }

    // Particle Conduit 2D Canvas Engine
    function initParticleConduits(slideEl) {
      const canvases = slideEl.querySelectorAll('.particle-canvas');
      canvases.forEach(canvas => {
        if (canvas.dataset.initialized) return;
        canvas.dataset.initialized = 'true';
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width = canvas.parentElement.clientWidth || 550;
        const height = canvas.height = canvas.parentElement.clientHeight || 220;

        const particles = [];
        for (let i = 0; i < 40; i++) {
          particles.push({
            t: Math.random(),
            speed: 0.004 + Math.random() * 0.006,
            offsetY: (Math.random() - 0.5) * 35,
            size: 2.5 + Math.random() * 2.5,
            color: i % 3 === 0 ? '#10b981' : i % 3 === 1 ? '#38bdf8' : '#818cf8'
          });
        }

        function renderParticles() {
          ctx.clearRect(0, 0, width, height);

          // Draw conduit curved track
          ctx.beginPath();
          ctx.moveTo(30, height / 2);
          ctx.bezierCurveTo(width * 0.35, height * 0.2, width * 0.65, height * 0.8, width - 30, height / 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';
          ctx.stroke();

          particles.forEach(p => {
            p.t += p.speed;
            if (p.t > 1) p.t = 0;
            const t = p.t;
            const x = Math.pow(1 - t, 3) * 30 +
                      3 * Math.pow(1 - t, 2) * t * (width * 0.35) +
                      3 * (1 - t) * Math.pow(t, 2) * (width * 0.65) +
                      Math.pow(t, 3) * (width - 30);
            const y = (Math.pow(1 - t, 3) * (height / 2) +
                      3 * Math.pow(1 - t, 2) * t * (height * 0.2) +
                      3 * (1 - t) * Math.pow(t, 2) * (height * 0.8) +
                      Math.pow(t, 3) * (height / 2)) + p.offsetY;

            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.shadowBlur = 0;
          });

          requestAnimationFrame(renderParticles);
        }
        renderParticles();
      });
    }

    // Initialize
    initMotionPipelines();
    updatePresentationState();
    if (window.renderMathInElement) {
      try {
        renderMathInElement(document.body, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "\\\\[", right: "\\\\]", display: true },
            { left: "\\\\(", right: "\\\\)", display: false },
          ],
          ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
          ignoredClasses: ["terminal-card", "terminal-body", "terminal-cmd", "arch-stack", "disk-stripe", "stat-card"],
          throwOnError: false,
        });
      } catch (e) {
        console.warn("Global KaTeX error:", e);
      }
    }
  </script>

  ${customScript ? `<script id="custom-hyperdeck-widgets">\n${customScript}\n</script>` : ""}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
