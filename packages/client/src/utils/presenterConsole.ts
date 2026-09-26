/**
 * Keynox Presenter Console Engine
 * 
 * Extracts slide metadata from HTML presentations and spawns a dedicated,
 * multi-window speaker console with live timer, notes, upcoming slide previews,
 * and two-way postMessage synchronization.
 */

export interface PresenterSlideData {
  index: number;
  title: string;
  subtitle: string;
  badge: string;
  customNotes: string;
  points: string[];
  archetype: string;
}

export function parseSlidesForPresenter(htmlContent: string): PresenterSlideData[] {
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
      
      const points = Array.from(s.querySelectorAll("h3, h4, .card-title, li, .key-point"))
        .map((el) => el.textContent?.trim() || "")
        .filter(Boolean)
        .slice(0, 6);

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
}

export function buildPresenterConsoleHtml(slidesData: PresenterSlideData[], safeTitle: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Keynox Presenter Console &bull; ${safeTitle}</title>
  <style>
    :root {
      --bg: #000000;
      --panel: #0a0a0a;
      --border: #262626;
      --accent: #ffffff;
      --accent-glow: rgba(255, 255, 255, 0.15);
      --text: #f8fafc;
      --text-muted: #a3a3a3;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); height: 100vh; display: flex; flex-direction: column; overflow: hidden; user-select: none; }
    
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

    .main-grid {
      flex: 1;
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      gap: 16px;
      padding: 16px 24px;
      overflow: hidden;
    }
    .grid-col { display: flex; flex-direction: column; gap: 16px; overflow: hidden; }

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
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: #38bdf8;
      font-size: 11px;
      font-family: monospace;
      font-weight: 700;
      width: fit-content;
      margin-bottom: 16px;
    }
    .points-box {
      background: rgba(0,0,0,0.3);
      border: 1px solid #1e293b;
      border-radius: 10px;
      padding: 14px 18px;
      flex: 1;
      overflow-y: auto;
    }
    .points-box ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .points-box li { display: flex; align-items: flex-start; gap: 8px; font-size: 13.5px; color: #cbd5e1; line-height: 1.45; }
    .points-box li::before { content: "•"; color: #06b6d4; font-size: 16px; line-height: 1; }

    .next-preview-card {
      height: 180px;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 10px 25px rgba(0,0,0,0.4);
    }
    .next-label { font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #818cf8; margin-bottom: 8px; }
    .next-title { font-size: 15px; font-weight: 700; color: #f1f5f9; line-height: 1.3; margin-bottom: 6px; }
    .next-sub { font-size: 12px; color: #64748b; line-height: 1.35; }

    .notes-card {
      flex: 1;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .notes-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .notes-label { font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #a855f7; }
    .notes-content { flex: 1; overflow-y: auto; font-size: 15px; line-height: 1.7; color: #e2e8f0; font-family: system-ui, -apple-system, sans-serif; }
    .notes-cue {
      margin-top: 14px;
      padding: 10px 14px;
      background: rgba(168, 85, 247, 0.1);
      border-left: 3px solid #a855f7;
      border-radius: 0 8px 8px 0;
      font-size: 12.5px;
      color: #d8b4fe;
    }

    .bottom-bar {
      height: 64px;
      background: var(--panel);
      border-top: 1px solid var(--border);
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .nav-btn-group { display: flex; gap: 10px; }
    .nav-btn {
      background: #111111;
      border: 1px solid #333333;
      color: #fff;
      font-weight: 700;
      font-size: 13px;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .nav-btn:hover { background: #262626; border-color: #525252; }
    .nav-btn-primary { background: #2563eb; border-color: #3b82f6; }
    .nav-btn-primary:hover { background: #1d4ed8; }
    .keyboard-hint { font-size: 11px; color: #64748b; font-family: monospace; }
  </style>
</head>
<body>
  <header class="top-header">
    <div class="brand-section">
      <span class="brand-badge">KEYNOX</span>
      <span class="deck-title" title="${safeTitle}">${safeTitle}</span>
    </div>

    <div class="timing-section">
      <div class="clock-display" id="wallClock">00:00:00</div>
      <div class="timer-box">
        <span style="font-size: 11px; color: #64748b;">ELAPSED</span>
        <span class="timer-digits" id="timerDigits">00:00</span>
        <button class="timer-btn" id="timerToggleBtn">Pause</button>
        <button class="timer-btn" id="timerResetBtn">Reset</button>
      </div>
      <div class="status-badge">
        <div class="status-dot"></div>
        <span>LIVE SYNC</span>
      </div>
    </div>
  </header>

  <main class="main-grid">
    <div class="grid-col">
      <div class="slide-stage-card">
        <div class="stage-label">
          <span>CURRENT SLIDE</span>
          <span id="slideCounterTag" style="color: #fff; font-family: monospace;">1 / ${slidesData.length}</span>
        </div>
        <h2 class="current-slide-title" id="currentTitle">Presentation Stage</h2>
        <p class="current-slide-sub" id="currentSubtitle"></p>
        <div class="archetype-tag" id="currentArchetype">Archetype: Content &amp; Visuals</div>
        
        <div class="points-box">
          <ul id="currentPoints"></ul>
        </div>
      </div>
    </div>

    <div class="grid-col">
      <div class="next-preview-card">
        <div class="next-label">UP NEXT</div>
        <h3 class="next-title" id="nextTitle">Next Slide</h3>
        <p class="next-sub" id="nextSubtitle"></p>
        <span id="nextArchetype" style="font-size: 10px; font-family: monospace; color: #818cf8; margin-top: auto;"></span>
      </div>

      <div class="notes-card">
        <div class="notes-header">
          <span class="notes-label">PRESENTER NOTES &amp; CUES</span>
        </div>
        <div class="notes-content" id="notesContainer">
          <p style="color: #64748b; font-style: italic;">No specific speaker notes for this slide.</p>
        </div>
      </div>
    </div>
  </main>

  <footer class="bottom-bar">
    <span class="keyboard-hint">Keyboard: [Space / →] Next &bull; [←] Prev</span>
    <div class="nav-btn-group">
      <button class="nav-btn" id="prevBtn">&larr; Previous</button>
      <button class="nav-btn nav-btn-primary" id="nextBtn">Next Slide &rarr;</button>
    </div>
  </footer>

  <script>
    const slides = ${JSON.stringify(slidesData)};
    const total = slides.length;
    let currentIndex = 0;

    function updateWallClock() {
      const now = new Date();
      document.getElementById('wallClock').textContent = now.toLocaleTimeString([], { hour12: false });
    }
    setInterval(updateWallClock, 1000);
    updateWallClock();

    let seconds = 0;
    let timerRunning = true;
    let timerInterval = setInterval(() => {
      if (timerRunning) {
        seconds++;
        const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        document.getElementById('timerDigits').textContent = mins + ':' + secs;
      }
    }, 1000);

    document.getElementById('timerToggleBtn').addEventListener('click', (e) => {
      timerRunning = !timerRunning;
      e.target.textContent = timerRunning ? 'Pause' : 'Resume';
    });

    document.getElementById('timerResetBtn').addEventListener('click', () => {
      seconds = 0;
      document.getElementById('timerDigits').textContent = '00:00';
    });

    function sendAction(action, index) {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({
          type: 'HYPERDECK_PRESENTER_ACTION',
          action: action,
          index: index
        }, '*');
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

    window.addEventListener('message', (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'HYPERDECK_PRESENTER_SYNC') {
        if (typeof e.data.currentSlide === 'number') {
          renderSlideState(e.data.currentSlide);
        }
      }
    });

    function renderSlideState(idx) {
      currentIndex = Math.max(0, Math.min(idx, total - 1));
      const cur = slides[currentIndex] || { title: 'Slide ' + (currentIndex + 1), subtitle: '', archetype: '', points: [] };
      const nxt = slides[currentIndex + 1];

      document.getElementById('slideCounterTag').textContent = (currentIndex + 1) + ' / ' + total;
      document.getElementById('currentTitle').textContent = cur.title || ('Slide ' + (currentIndex + 1));
      document.getElementById('currentSubtitle').textContent = cur.subtitle || '';
      document.getElementById('currentArchetype').textContent = 'Archetype: ' + (cur.archetype || 'Content Stage');

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

      if (nxt) {
        document.getElementById('nextTitle').textContent = nxt.title || ('Slide ' + (currentIndex + 2));
        document.getElementById('nextSubtitle').textContent = nxt.subtitle || 'Upcoming topic step';
        document.getElementById('nextArchetype').textContent = 'Next: ' + (nxt.archetype || 'Visual Stage');
      } else {
        document.getElementById('nextTitle').textContent = 'Concluding Deck';
        document.getElementById('nextSubtitle').textContent = 'Summary & Q&A Session';
        document.getElementById('nextArchetype').textContent = 'Fin';
      }

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
        cue.textContent = 'Hook the audience immediately with the core problem statement. Emphasize why legacy paradigms fail.';
      } else if (currentIndex === total - 1) {
        cue.textContent = 'Deliver the closing synthesis. Open the floor for architectural Q&A.';
      } else {
        cue.textContent = 'Walk through the core technical mechanism. Highlight key trade-offs and complexity bounds.';
      }
      notesEl.appendChild(cue);
    }

    renderSlideState(0);
  </script>
</body>
</html>`;
}

export function openPresenterConsole(html: string, title: string): Window | null {
  const slidesData = parseSlidesForPresenter(html);
  const safeTitle = title.replace(/^TOPIC:\s*["']?|["']?$/gi, "");

  const win = window.open(
    "",
    "KeynoxPresenterWindow",
    "width=1120,height=750,menubar=no,toolbar=no,location=no,status=no,resizable=yes"
  );
  if (!win) {
    alert("Popup blocked! Please allow popups for localhost to open the Presenter Console.");
    return null;
  }

  const presenterHtml = buildPresenterConsoleHtml(slidesData, safeTitle);
  win.document.open();
  win.document.write(presenterHtml);
  win.document.close();
  return win;
}
