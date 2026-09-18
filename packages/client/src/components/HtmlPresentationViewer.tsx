import React, { useState, useRef, useEffect } from "react";
import {
  Maximize2,
  Minimize2,
  ExternalLink,
  Download,
  Copy,
  Check,
  Code,
  Layers,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Monitor,
  Play,
  LayoutGrid,
} from "lucide-react";
import { ImageGeneratorModal } from "./ImageGeneratorModal";

interface HtmlPresentationViewerProps {
  html: string;
  title: string;
  modelName?: string;
  outline?: string;
  onPresentKeynote?: () => void;
  onOpenStudio?: () => void;
}

export const HtmlPresentationViewer: React.FC<HtmlPresentationViewerProps> = ({
  html,
  title,
  modelName,
  outline,
  onPresentKeynote,
  onOpenStudio,
}) => {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [totalSlidesCount, setTotalSlidesCount] = useState(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const presenterWinRef = useRef<Window | null>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Listen for navigation & sync messages from presentation iframe and presenter window
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;

      if (e.data.type === "HYPERDECK_STATE_UPDATE") {
        setCurrentSlideIndex(e.data.currentSlide);
        if (typeof e.data.totalSlides === "number") {
          setTotalSlidesCount(e.data.totalSlides);
        }
        // Relay to Presenter Console window if open
        if (presenterWinRef.current && !presenterWinRef.current.closed) {
          presenterWinRef.current.postMessage(
            {
              type: "HYPERDECK_PRESENTER_SYNC",
              currentSlide: e.data.currentSlide,
              totalSlides: e.data.totalSlides,
              title: e.data.title,
              notes: e.data.notes,
            },
            "*"
          );
        }
      } else if (e.data.type === "HYPERDECK_PRESENTER_ACTION") {
        // Relay action from Presenter Console to the presentation iframe
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            {
              type: "HYPERDECK_NAVIGATE",
              action: e.data.action,
              index: e.data.index,
            },
            "*"
          );
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Extract structured slide data from raw HTML for the Presenter Display
  const parseSlidesForPresenter = (htmlContent: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, "text/html");
      const slideNodes = Array.from(doc.querySelectorAll(".slide"));
      if (slideNodes.length === 0) return [];

      return slideNodes.map((s, idx) => {
        const slideTitle = s.querySelector(".slide-title")?.textContent?.trim() || `Slide ${idx + 1}`;
        const subtitle = s.querySelector(".slide-subtitle")?.textContent?.trim() || "";
        const badge = s.querySelector(".slide-badge, .badge")?.textContent?.trim() || "";
        const customNotes = s.getAttribute("data-notes") || "";
        
        // Extract card points
        const points = Array.from(s.querySelectorAll("h3, h4, .card-title, li, .key-point"))
          .map((el) => el.textContent?.trim() || "")
          .filter(Boolean)
          .slice(0, 6);

        // Detect visual archetype
        let archetype = "Content & Visuals";
        if (s.querySelector(".three-container")) archetype = "3D WebGL Model";
        else if (s.querySelector(".particle-container")) archetype = "Particle Flow Conduit";
        else if (s.querySelector(".motion-pipeline")) archetype = "Interactive Motion Pipeline";
        else if (s.querySelector(".sim-container")) archetype = "Interactive Simulator";
        else if (s.querySelector(".matrix-table")) archetype = "Benchmark Comparison Matrix";

        return {
          index: idx,
          title: slideTitle,
          subtitle,
          badge,
          customNotes,
          points,
          archetype,
        };
      });
    } catch {
      return [];
    }
  };

  const handleOpenPresenterConsole = () => {
    const slidesData = parseSlidesForPresenter(html);
    const safeTitle = title.replace(/^TOPIC:\s*["']?|["']?$/gi, "");

    const win = window.open(
      "",
      "HyperdeckPresenterWindow",
      "width=1120,height=750,menubar=no,toolbar=no,location=no,status=no,resizable=yes"
    );
    if (!win) {
      alert("Popup blocked! Please allow popups for localhost to open the Presenter Console.");
      return;
    }

    presenterWinRef.current = win;

    const presenterHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HyperDeck Presenter Console &bull; ${safeTitle}</title>
  <style>
    :root {
      --bg: #07090e;
      --panel: #0d121d;
      --border: #1e293b;
      --accent: #06b6d4;
      --accent-glow: rgba(6, 182, 212, 0.25);
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); height: 100vh; display: flex; flex-direction: column; overflow: hidden; user-select: none; }
    
    /* Top Header Bar */
    .top-header {
      background: var(--panel);
      border-bottom: 1px solid var(--border);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 60px;
    }
    .brand-section { display: flex; align-items: center; gap: 12px; }
    .brand-badge {
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      color: #000;
      font-weight: 900;
      font-size: 11px;
      letter-spacing: 1px;
      padding: 4px 8px;
      border-radius: 6px;
    }
    .deck-title { font-size: 14px; font-weight: 700; color: #fff; max-width: 320px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    
    .timing-section { display: flex; align-items: center; gap: 24px; }
    .clock-display { font-family: monospace; font-size: 18px; font-weight: 700; color: #38bdf8; }
    .timer-box { display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.4); padding: 4px 12px; border-radius: 8px; border: 1px solid #1e293b; }
    .timer-digits { font-family: monospace; font-size: 20px; font-weight: 900; color: #10b981; min-width: 65px; }
    .timer-btn { background: transparent; border: 1px solid #334155; color: #94a3b8; border-radius: 4px; padding: 2px 8px; font-size: 11px; cursor: pointer; transition: all 0.2s; }
    .timer-btn:hover { background: #334155; color: #fff; }

    .status-badge { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #10b981; font-weight: 600; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 10px #10b981; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

    /* Main Console Grid */
    .main-grid {
      flex: 1;
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      gap: 16px;
      padding: 16px 24px;
      overflow: hidden;
    }
    .grid-col { display: flex; flex-direction: column; gap: 16px; overflow: hidden; }

    /* Current Slide Stage */
    .slide-stage-card {
      flex: 1;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      position: relative;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .stage-label {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #06b6d4;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .current-slide-title { font-size: 24px; font-weight: 800; color: #fff; line-height: 1.25; margin-bottom: 8px; }
    .current-slide-sub { font-size: 13px; color: #94a3b8; margin-bottom: 20px; line-height: 1.4; }
    .archetype-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 6px;
      background: rgba(6, 182, 212, 0.12);
      border: 1px solid rgba(6, 182, 212, 0.3);
      color: #38bdf8;
      font-size: 11px;
      font-weight: 700;
      align-self: flex-start;
      margin-bottom: 16px;
    }
    .points-list {
      flex: 1;
      overflow-y: auto;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .points-list li {
      background: rgba(255,255,255,0.03);
      border-left: 3px solid #06b6d4;
      padding: 10px 14px;
      border-radius: 0 8px 8px 0;
      font-size: 13px;
      color: #e2e8f0;
      line-height: 1.4;
    }

    /* Right Column Cards */
    .next-preview-card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 18px 20px;
      height: 180px;
      display: flex;
      flex-direction: column;
    }
    .next-label { font-size: 10px; font-weight: 800; letter-spacing: 1px; color: #a855f7; text-transform: uppercase; margin-bottom: 8px; }
    .next-title { font-size: 16px; font-weight: 700; color: #f1f5f9; line-height: 1.3; margin-bottom: 6px; }
    .next-sub { font-size: 12px; color: #64748b; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .next-tag { margin-top: auto; font-size: 10px; font-weight: 700; color: #c084fc; }

    .notes-card {
      flex: 1;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .notes-label { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #10b981; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; }
    .notes-content { flex: 1; overflow-y: auto; font-size: 13px; color: #cbd5e1; line-height: 1.6; }
    .notes-content p { margin-bottom: 10px; }
    .notes-cue { background: rgba(16, 185, 129, 0.08); border-left: 3px solid #10b981; padding: 8px 12px; border-radius: 0 6px 6px 0; margin-bottom: 10px; font-size: 12px; }

    /* Bottom Controller Bar */
    .bottom-bar {
      background: var(--panel);
      border-top: 1px solid var(--border);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 70px;
    }
    .nav-btn-group { display: flex; gap: 12px; }
    .nav-btn {
      background: #1e293b;
      border: 1px solid #334155;
      color: #fff;
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .nav-btn:hover { background: #334155; border-color: #06b6d4; }
    .nav-btn.primary {
      background: linear-gradient(135deg, #06b6d4, #2563eb);
      border: none;
      box-shadow: 0 4px 15px var(--accent-glow);
    }
    .nav-btn.primary:hover { opacity: 0.92; transform: translateY(-1px); }

    .slide-pills { display: flex; align-items: center; gap: 6px; overflow-x: auto; max-width: 450px; padding: 4px 0; }
    .slide-pill {
      background: #1e293b;
      color: #94a3b8;
      border: 1px solid transparent;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .slide-pill:hover { background: #334155; color: #fff; }
    .slide-pill.active { background: #06b6d4; color: #000; border-color: #38bdf8; font-weight: 900; }
    
    .kbd-hints { font-size: 11px; color: #64748b; font-family: monospace; }
  </style>
</head>
<body>
  <div class="top-header">
    <div class="brand-section">
      <span class="brand-badge">PRESENTER</span>
      <span class="deck-title">${safeTitle}</span>
    </div>

    <div class="timing-section">
      <div class="clock-display" id="wallClock">--:--:--</div>
      <div class="timer-box">
        <span class="timer-digits" id="timerDigits">00:00</span>
        <button class="timer-btn" id="timerToggle">Pause</button>
        <button class="timer-btn" id="timerReset">Reset</button>
      </div>
      <div class="status-badge">
        <div class="status-dot"></div>
        <span>Synced with Projector</span>
      </div>
    </div>
  </div>

  <div class="main-grid">
    <!-- Left Column: Current Slide -->
    <div class="grid-col">
      <div class="slide-stage-card">
        <div class="stage-label">
          <span>CURRENT SLIDE</span>
          <span id="slideCounterTag">1 / 1</span>
        </div>
        <div class="archetype-tag" id="currentArchetype">3D WebGL / Interactive</div>
        <h1 class="current-slide-title" id="currentTitle">Loading...</h1>
        <p class="current-slide-sub" id="currentSubtitle"></p>
        <ul class="points-list" id="currentPoints"></ul>
      </div>
    </div>

    <!-- Right Column: Next Slide & Speaker Notes -->
    <div class="grid-col">
      <div class="next-preview-card">
        <div class="next-label">UPCOMING NEXT &bull; ADVANCE PEEK</div>
        <div class="next-title" id="nextTitle">End of presentation</div>
        <div class="next-sub" id="nextSubtitle">No more slides</div>
        <div class="next-tag" id="nextArchetype"></div>
      </div>

      <div class="notes-card">
        <div class="notes-label">
          <span>SPEAKER TALKING POINTS & CUES</span>
          <span style="font-weight: normal; font-size: 10px; color: #64748b;">AI Real-Time Teleprompter</span>
        </div>
        <div class="notes-content" id="notesContainer">
          <div class="notes-cue">💡 Speak with high energy. Anchor on core metric benefits before diving into architectural nuances.</div>
        </div>
      </div>
    </div>
  </div>

  <div class="bottom-bar">
    <div class="nav-btn-group">
      <button class="nav-btn" id="prevBtn">&larr; Previous</button>
      <button class="nav-btn primary" id="nextBtn">Next Slide &rarr;</button>
    </div>

    <div class="slide-pills" id="slidePills"></div>

    <div class="kbd-hints">Space / &rarr; Next &bull; &larr; Prev</div>
  </div>

  <script>
    const slides = ${JSON.stringify(slidesData)};
    let currentIndex = 0;
    const total = Math.max(slides.length, 1);

    // Wall Clock
    function updateClock() {
      const now = new Date();
      document.getElementById('wallClock').textContent = now.toLocaleTimeString();
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Elapsed Timer
    let elapsedSeconds = 0;
    let timerRunning = true;
    let timerInterval = setInterval(() => {
      if (timerRunning) {
        elapsedSeconds++;
        const mins = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
        const secs = String(elapsedSeconds % 60).padStart(2, '0');
        document.getElementById('timerDigits').textContent = mins + ':' + secs;
      }
    }, 1000);

    document.getElementById('timerToggle').addEventListener('click', () => {
      timerRunning = !timerRunning;
      document.getElementById('timerToggle').textContent = timerRunning ? 'Pause' : 'Resume';
    });
    document.getElementById('timerReset').addEventListener('click', () => {
      elapsedSeconds = 0;
      document.getElementById('timerDigits').textContent = '00:00';
    });

    // Render Slide Pills
    const pillsContainer = document.getElementById('slidePills');
    pillsContainer.innerHTML = '';
    slides.forEach((s, idx) => {
      const pill = document.createElement('button');
      pill.className = 'slide-pill' + (idx === 0 ? ' active' : '');
      pill.textContent = (idx + 1) + '. ' + (s.title ? s.title.slice(0, 14) + (s.title.length > 14 ? '...' : '') : 'Slide ' + (idx + 1));
      pill.addEventListener('click', () => sendAction('goTo', idx));
      pillsContainer.appendChild(pill);
    });

    function renderSlideState(idx) {
      currentIndex = Math.max(0, Math.min(idx, total - 1));
      const cur = slides[currentIndex] || { title: 'Slide ' + (currentIndex + 1), subtitle: '', archetype: '', points: [] };
      const nxt = slides[currentIndex + 1];

      document.getElementById('slideCounterTag').textContent = (currentIndex + 1) + ' / ' + total;
      document.getElementById('currentTitle').textContent = cur.title || ('Slide ' + (currentIndex + 1));
      document.getElementById('currentSubtitle').textContent = cur.subtitle || '';
      document.getElementById('currentArchetype').textContent = 'Archetype: ' + (cur.archetype || 'Content Stage');

      // Points list
      const pointsEl = document.getElementById('currentPoints');
      pointsEl.innerHTML = '';
      if (cur.points && cur.points.length > 0) {
        cur.points.forEach(pt => {
          const li = document.createElement('li');
          li.textContent = pt;
          pointsEl.appendChild(li);
        });
      } else {
        const li = document.createElement('li');
        li.textContent = 'Active presentation slide in session.';
        pointsEl.appendChild(li);
      }

      // Next preview
      if (nxt) {
        document.getElementById('nextTitle').textContent = nxt.title || ('Slide ' + (currentIndex + 2));
        document.getElementById('nextSubtitle').textContent = nxt.subtitle || 'Upcoming topic step';
        document.getElementById('nextArchetype').textContent = 'Next: ' + (nxt.archetype || 'Visual Stage');
      } else {
        document.getElementById('nextTitle').textContent = 'Concluding Deck';
        document.getElementById('nextSubtitle').textContent = 'Summary & Q&A Session';
        document.getElementById('nextArchetype').textContent = 'Fin';
      }

      // Notes
      const notesEl = document.getElementById('notesContainer');
      notesEl.innerHTML = '';
      if (cur.customNotes) {
        const p = document.createElement('p');
        p.textContent = cur.customNotes;
        notesEl.appendChild(p);
      }
      
      const cue = document.createElement('div');
      cue.className = 'notes-cue';
      if (currentIndex === 0) {
        cue.textContent = '🎙️ Hook the audience immediately with the core problem statement. Emphasize why legacy paradigms fail.';
      } else if (currentIndex === total - 1) {
        cue.textContent = '🏁 Summarize final outcomes, synthesis conclusions, and open the floor for technical Q&A.';
      } else {
        cue.textContent = '🎯 Walk through each visual stage deliberately. Interact with the live 3D models or sliders to keep engagement high.';
      }
      notesEl.appendChild(cue);

      // Highlight active pill
      const allPills = pillsContainer.querySelectorAll('.slide-pill');
      allPills.forEach((p, pIdx) => p.classList.toggle('active', pIdx === currentIndex));
    }

    function sendAction(action, index) {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'HYPERDECK_PRESENTER_ACTION', action, index }, '*');
      }
    }

    document.getElementById('nextBtn').addEventListener('click', () => sendAction('next'));
    document.getElementById('prevBtn').addEventListener('click', () => sendAction('prev'));

    window.addEventListener('keydown', (e) => {
      if (['ArrowRight', 'Space', 'j', 'PageDown'].includes(e.key)) {
        e.preventDefault();
        sendAction('next');
      } else if (['ArrowLeft', 'k', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        sendAction('prev');
      }
    });

    // Listen for sync updates from presentation stage
    window.addEventListener('message', (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'HYPERDECK_PRESENTER_SYNC') {
        if (typeof e.data.currentSlide === 'number') {
          renderSlideState(e.data.currentSlide);
        }
      }
    });

    renderSlideState(0);
  <\/script>
</body>
</html>`;

    win.document.open();
    win.document.write(presenterHtml);
    win.document.close();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-presentation.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenNewTab = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col items-center animate-fadeIn">
      {/* Top Presentation Toolbar */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 px-1">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 truncate">
              <span className="truncate">{title.replace(/^TOPIC:\s*["']?|["']?$/gi, "")}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-semibold uppercase shrink-0">
                16:9 Keynote
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Interactive Web Application &bull; GSAP Animations &bull; Offline Ready
            </p>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {outline && (
            <button
              onClick={() => setShowOutline(!showOutline)}
              className={`p-2 rounded-lg border transition-all text-xs flex items-center gap-1.5 ${
                showOutline
                  ? "bg-blue-600/20 text-blue-400 border-blue-500/40"
                  : "bg-slate-800/80 text-slate-400 hover:text-white border-slate-700/80 hover:bg-slate-700"
              }`}
              title="View Nemotron Nano Outline"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Outline</span>
            </button>
          )}

          <button
            onClick={() => setShowCode(!showCode)}
            className={`p-2 rounded-lg border transition-all text-xs flex items-center gap-1.5 ${
              showCode
                ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/40"
                : "bg-slate-800/80 text-slate-400 hover:text-white border-slate-700/80 hover:bg-slate-700"
            }`}
            title="Inspect Generated HTML/CSS/JS Source"
          >
            <Code className="w-4 h-4" />
            <span className="hidden sm:inline">Code</span>
          </button>

          <button
            onClick={handleCopy}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/80 transition-colors text-xs flex items-center gap-1.5"
            title="Copy HTML to Clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline">{copied ? "Copied!" : "Copy"}</span>
          </button>

          <button
            onClick={handleDownload}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/80 transition-colors text-xs flex items-center gap-1.5"
            title="Download Standalone Presentation HTML"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Download</span>
          </button>

          <button
            onClick={handleOpenNewTab}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/80 transition-colors text-xs flex items-center gap-1.5"
            title="Open Presentation in New Browser Tab"
          >
            <ExternalLink className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">New Tab</span>
          </button>

          {onPresentKeynote && (
            <button
              onClick={onPresentKeynote}
              className="p-2 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/40 transition-all text-xs flex items-center gap-1.5 font-bold shadow-sm shadow-emerald-500/15"
              title="Present in Keynote Player with GSAP Step Animations"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
              <span className="hidden sm:inline">Keynote Player</span>
            </button>
          )}

          {onOpenStudio && (
            <button
              onClick={onOpenStudio}
              className="p-2 rounded-lg bg-indigo-600/25 hover:bg-indigo-600/35 text-indigo-300 border border-indigo-500/40 transition-all text-xs flex items-center gap-1.5 font-bold shadow-sm shadow-indigo-500/15"
              title="Edit Slide Components and Animation Steps in Visual Studio"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Visual Studio</span>
            </button>
          )}

          <button
            onClick={() => setShowImageModal(true)}
            className="p-2 rounded-lg bg-cyan-600/15 hover:bg-cyan-600/25 text-cyan-400 border border-cyan-500/30 transition-colors text-xs flex items-center gap-1.5 font-medium"
            title="Generate Photorealistic Presentation Visual with NVIDIA FLUX"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="hidden sm:inline">AI Photo</span>
          </button>

          <button
            onClick={handleOpenPresenterConsole}
            className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 transition-colors text-xs flex items-center gap-1.5 font-bold"
            title="Open Dual-Screen Presenter Console (Timer, Speaker Notes, Slide Peek)"
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden sm:inline">Presenter Console</span>
          </button>

          <button
            onClick={handleFullscreen}
            className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-500/30 transition-colors text-xs flex items-center gap-1.5 font-bold"
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Present Fullscreen (F)"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </button>
        </div>
      </div>

      {/* Code Inspector Drawer */}
      {showCode && (
        <div className="w-full mb-4 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="font-bold text-slate-200">Generated Presentation Source Code</span>
            <span className="text-[11px] text-slate-500">{html.length} characters</span>
          </div>
          <pre className="p-4 max-h-72 overflow-y-auto text-xs font-mono text-emerald-300/90 leading-relaxed whitespace-pre-wrap select-text">
            {html}
          </pre>
        </div>
      )}

      {/* Slide Outline Drawer */}
      {showOutline && outline && (
        <div className="w-full mb-4 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="font-bold text-slate-200">Nemotron 30B Nano Slide Outline</span>
            <span className="text-[11px] text-slate-500">Stage 1 Blueprint</span>
          </div>
          <pre className="p-4 max-h-60 overflow-y-auto text-xs font-mono text-blue-200/90 leading-relaxed whitespace-pre-wrap select-text">
            {outline}
          </pre>
        </div>
      )}

      {/* 16:9 Responsive Presentation Stage with Cinema Ambilight */}
      <div className="relative w-full flex items-center justify-center my-1">
        {/* Cinema Ambilight Ambient Glow Effect */}
        {!isFullscreen && (
          <div className="absolute -inset-3 sm:-inset-6 bg-gradient-to-r from-cyan-500/18 via-indigo-500/14 to-purple-500/18 rounded-3xl blur-2xl opacity-80 pointer-events-none -z-10 transition-all duration-700"></div>
        )}

        <div
          ref={containerRef}
          className={
            isFullscreen
              ? "fixed inset-0 w-screen h-screen z-50 bg-[#07090e] flex flex-col m-0 p-0 rounded-none border-0"
              : "w-full aspect-[16/9] mx-auto bg-[#07090e] rounded-2xl overflow-hidden shadow-2xl border border-slate-800/90 flex flex-col relative transition-all ring-1 ring-white/5"
          }
          style={
            isFullscreen
              ? {}
              : {
                  maxHeight: "calc(100vh - 160px)",
                  maxWidth: "calc((100vh - 160px) * 16 / 9)",
                }
          }
        >
          <iframe
            ref={iframeRef}
            srcDoc={html}
            title={title}
            className="w-full h-full border-0 bg-[#07090e]"
            sandbox="allow-scripts allow-modals allow-fullscreen"
          />
        </div>
      </div>

      {/* Quick Navigation & Interaction Tip */}
      <div className="w-full mt-3 px-2 flex items-center justify-between text-xs text-slate-500 font-mono">
        <span>Click inside slide to enable keyboard shortcuts: Space / → (Next), ← (Prev), F (Fullscreen)</span>
        <span className="text-emerald-400 font-bold">✓ Executable Web App</span>
      </div>

      {/* NVIDIA NIM Photo Studio Modal */}
      <ImageGeneratorModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        slideTitle={title}
        onInsertImage={(img) => {
          const a = document.createElement("a");
          a.href = img.src;
          a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-photo.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }}
      />
    </div>
  );
};
