/**
 * Pre-compiled standalone HTML/CSS/JS presentation websites
 * Used for zero-wait instant loading and showcase demonstrations
 */

export const booleanLogicHtmlSite = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Boolean Logic & Digital Circuit Architecture</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #07090e;
      --card-bg: rgba(15, 23, 42, 0.85);
      --card-border: rgba(51, 65, 85, 0.8);
      --accent: #38bdf8;
      --accent-green: #10b981;
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Inter', -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      user-select: none;
    }
    .stage-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      background: #090d16;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .progress-bar-container {
      height: 4px;
      width: 100%;
      background: rgba(30, 41, 59, 0.6);
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #38bdf8, #818cf8, #34d399);
      width: 25%;
      transition: width 0.4s ease-out;
    }
    .stage-header {
      padding: 18px 36px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(51, 65, 85, 0.5);
      background: rgba(11, 15, 25, 0.7);
    }
    .badge {
      font-family: 'Fira Code', 'JetBrains Mono', 'Cascadia Code', 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'DejaVu Sans Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
      text-transform: uppercase;
    }
    .header-title {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
    }
    .slide-counter {
      font-family: 'Fira Code', 'JetBrains Mono', 'Cascadia Code', 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'DejaVu Sans Mono', monospace;
      font-size: 12px;
      color: var(--text-muted);
      background: rgba(15, 23, 42, 0.8);
      padding: 4px 10px;
      border-radius: 8px;
      border: 1px solid rgba(51, 65, 85, 0.7);
    }
    .slides-viewport {
      flex: 1;
      position: relative;
      overflow: hidden;
    }
    .slide {
      position: absolute;
      inset: 0;
      padding: 32px 48px;
      display: flex;
      flex-direction: column;
      opacity: 0;
      visibility: hidden;
      transform: scale(0.98);
      transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .slide.active {
      opacity: 1;
      visibility: visible;
      transform: scale(1);
    }
    .slide-title {
      font-size: 30px;
      font-weight: 900;
      letter-spacing: -0.03em;
      margin-bottom: 4px;
      background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .slide-subtitle {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 20px;
    }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 18px;
      flex: 1;
      align-items: stretch;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
    }
    .card-title {
      font-size: 17px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #fff;
    }
    .card-desc {
      font-size: 12px;
      line-height: 1.6;
      color: #cbd5e1;
      margin-bottom: 12px;
    }
    .points-list {
      list-style: none;
      margin-top: auto;
      padding-top: 10px;
      border-top: 1px solid rgba(51, 65, 85, 0.5);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .points-list li {
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #38bdf8;
      flex-shrink: 0;
    }
    /* Interactive Simulator */
    .simulator-box {
      background: rgba(8, 12, 20, 0.95);
      border: 1px solid rgba(56, 189, 248, 0.4);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .sim-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .btn-signal {
      padding: 12px 16px;
      border-radius: 10px;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(51, 65, 85, 0.9);
      color: #fff;
      font-family: 'Fira Code', 'JetBrains Mono', 'Cascadia Code', 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'DejaVu Sans Mono', monospace;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.2s;
    }
    .btn-signal.active {
      background: rgba(16, 185, 129, 0.2);
      border-color: #10b981;
      color: #34d399;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
    }
    .gates-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }
    .gate-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(51, 65, 85, 0.7);
      border-radius: 10px;
      padding: 10px;
      text-align: center;
      transition: all 0.2s;
    }
    .gate-card.active {
      background: rgba(16, 185, 129, 0.2);
      border-color: #10b981;
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.2);
    }
    .gate-title {
      font-family: 'Fira Code', 'JetBrains Mono', 'Cascadia Code', 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'DejaVu Sans Mono', monospace;
      font-size: 10px;
      color: #94a3b8;
      margin-bottom: 4px;
    }
    .gate-val {
      font-family: 'Fira Code', 'JetBrains Mono', 'Cascadia Code', 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'DejaVu Sans Mono', monospace;
      font-size: 14px;
      font-weight: 900;
      color: #64748b;
    }
    .gate-card.active .gate-val {
      color: #34d399;
    }
    .truth-table {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(51, 65, 85, 0.6);
      border-radius: 8px;
      padding: 8px 12px;
      font-family: 'Fira Code', 'JetBrains Mono', 'Cascadia Code', 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'DejaVu Sans Mono', monospace;
      font-size: 10px;
      color: #94a3b8;
    }
    .tt-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 4px;
      border-radius: 4px;
    }
    .tt-row.active {
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      font-weight: 700;
    }
    /* Footer Bar */
    .stage-footer {
      padding: 12px 36px;
      border-top: 1px solid rgba(51, 65, 85, 0.5);
      background: rgba(11, 15, 25, 0.8);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .thumb-btn {
      padding: 5px 12px;
      border-radius: 6px;
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(51, 65, 85, 0.7);
      color: #94a3b8;
      font-family: 'Fira Code', 'JetBrains Mono', 'Cascadia Code', 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'DejaVu Sans Mono', monospace;
      font-size: 11px;
      cursor: pointer;
      margin-right: 6px;
      transition: all 0.2s;
    }
    .thumb-btn.active {
      background: #38bdf8;
      color: #080c14;
      font-weight: 800;
    }
    .btn-nav {
      padding: 7px 16px;
      border-radius: 8px;
      background: rgba(30, 41, 59, 0.9);
      border: 1px solid rgba(51, 65, 85, 0.9);
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-nav.primary {
      background: linear-gradient(135deg, #2563eb, #4f46e5);
      border-color: #3b82f6;
    }
  </style>
</head>
<body>

  <div class="stage-wrapper" id="stage">
    <div class="progress-bar-container">
      <div class="progress-bar" id="progressBar"></div>
    </div>

    <div class="stage-header">
      <div style="display:flex; align-items:center; gap:12px;">
        <span class="badge" id="slideBadge">FOUNDATION</span>
        <span class="header-title">Boolean Logic & Digital Circuit Architecture</span>
      </div>
      <div class="slide-counter" id="slideCounter">Slide 1 / 4</div>
    </div>

    <div class="slides-viewport">
      <!-- Slide 1 -->
      <div class="slide active" data-badge="FOUNDATION">
        <h2 class="slide-title">The Binary State Machine</h2>
        <p class="slide-subtitle">How discrete high/low voltages construct the universal foundation of modern computing</p>
        <div class="cards-grid">
          <div class="card" style="border-top: 3px solid #38bdf8;">
            <h3 class="card-title">George Boole's Discrete Algebra</h3>
            <p class="card-desc">Formulated in 1847, Boolean algebra replaces infinite continuous numbers with two discrete states: TRUE (1, High Voltage) and FALSE (0, Ground).</p>
            <ul class="points-list">
              <li><span class="dot"></span>Eliminates analog drift through discrete noise thresholds</li>
              <li><span class="dot"></span>Bedrock of microcode and arithmetic processors</li>
            </ul>
          </div>
          <div class="card" style="border-top: 3px solid #818cf8;">
            <h3 class="card-title">The Transistor as a Switch</h3>
            <p class="card-desc">Billions of nanoscale CMOS transistors act as voltage-controlled switches, physically evaluating logical expressions in picoseconds.</p>
            <ul class="points-list">
              <li><span class="dot" style="background:#818cf8"></span>Nanosecond gate latency</li>
              <li><span class="dot" style="background:#818cf8"></span>Universal NAND and NOR gate completeness</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Slide 2: Interactive Simulator -->
      <div class="slide" data-badge="LIVE SIMULATOR">
        <h2 class="slide-title">Interactive Hardware Logic Simulator</h2>
        <p class="slide-subtitle">Click the input signal switches below to test logic evaluations and truth table in real time</p>
        <div class="simulator-box">
          <div class="sim-buttons">
            <button class="btn-signal active" id="btnSigA" onclick="toggleSignal('A')">
              <span>SIGNAL A: [HIGH]</span>
              <span>1</span>
            </button>
            <button class="btn-signal" id="btnSigB" onclick="toggleSignal('B')">
              <span>SIGNAL B: [LOW]</span>
              <span>0</span>
            </button>
          </div>

          <div class="gates-grid">
            <div class="gate-card" id="cardAND">
              <div class="gate-title">AND (A & B)</div>
              <div class="gate-val" id="valAND">0</div>
            </div>
            <div class="gate-card active" id="cardOR">
              <div class="gate-title">OR (A | B)</div>
              <div class="gate-val" id="valOR">1</div>
            </div>
            <div class="gate-card" id="cardNOT">
              <div class="gate-title">NOT (!A)</div>
              <div class="gate-val" id="valNOT">0</div>
            </div>
            <div class="gate-card active" id="cardXOR">
              <div class="gate-title">XOR (A ^ B)</div>
              <div class="gate-val" id="valXOR">1</div>
            </div>
          </div>

          <div class="truth-table">
            <div style="display:flex; justify-content:space-between; font-weight:700; border-bottom:1px solid #334155; padding-bottom:4px; margin-bottom:4px;">
              <span>A</span><span>B</span><span>AND</span><span>OR</span><span>NOT(A)</span><span>XOR</span><span>STATUS</span>
            </div>
            <div class="tt-row" id="tt00"><span>0</span><span>0</span><span>0</span><span>0</span><span>1</span><span>0</span><span>(0,0)</span></div>
            <div class="tt-row" id="tt01"><span>0</span><span>1</span><span>0</span><span>1</span><span>1</span><span>1</span><span>(0,1)</span></div>
            <div class="tt-row active" id="tt10"><span>1</span><span>0</span><span>0</span><span>1</span><span>0</span><span>1</span><span>ACTIVE</span></div>
            <div class="tt-row" id="tt11"><span>1</span><span>1</span><span>1</span><span>1</span><span>0</span><span>0</span><span>(1,1)</span></div>
          </div>
        </div>
      </div>

      <!-- Slide 3 -->
      <div class="slide" data-badge="APPLICATIONS">
        <h2 class="slide-title">Software Flow vs Silicon ALU Hardware</h2>
        <p class="slide-subtitle">From conditional control branching in code to arithmetic half-adders in silicon</p>
        <div class="cards-grid">
          <div class="card" style="border-top: 3px solid #10b981;">
            <h3 class="card-title">Software Conditional Execution</h3>
            <p class="card-desc">Compilers evaluate Boolean guards to generate branch instructions, safe null navigation, and default fallbacks.</p>
            <ul class="points-list">
              <li><span class="dot" style="background:#10b981"></span>Short-circuit evaluation: skips right operand if condition decided</li>
              <li><span class="dot" style="background:#10b981"></span>Branch prediction buffers in modern CPU cores</li>
            </ul>
          </div>
          <div class="card" style="border-top: 3px solid #f59e0b;">
            <h3 class="card-title">Binary Half-Adder Circuit</h3>
            <p class="card-desc">Combining a single XOR gate (for sum bit) and AND gate (for carry bit) allows microprocessors to perform binary addition.</p>
            <ul class="points-list">
              <li><span class="dot" style="background:#f59e0b"></span>Sum = A ⊕ B | Carry = A ∧ B</li>
              <li><span class="dot" style="background:#f59e0b"></span>Cascaded into Full-Adders to power 64-bit ALU registers</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Slide 4 -->
      <div class="slide" data-badge="DE MORGAN">
        <h2 class="slide-title">De Morgan's Laws & Transformations</h2>
        <p class="slide-subtitle">Algebraic equivalences that allow engineers to optimize and simplify complex logic</p>
        <div class="cards-grid">
          <div class="card" style="border-top: 3px solid #38bdf8;">
            <h3 class="card-title">Law 1: Conjunction Inversion</h3>
            <p class="card-desc">The negation of a conjunction is the disjunction of the negations: !(A && B) === (!A || !B).</p>
            <ul class="points-list">
              <li><span class="dot"></span>Simplifies nested negative conditions</li>
              <li><span class="dot"></span>Directly reduces gate transistor count</li>
            </ul>
          </div>
          <div class="card" style="border-top: 3px solid #818cf8;">
            <h3 class="card-title">Law 2: Disjunction Inversion</h3>
            <p class="card-desc">The negation of a disjunction is the conjunction of the negations: !(A || B) === (!A && !B).</p>
            <ul class="points-list">
              <li><span class="dot" style="background:#818cf8"></span>Used in security guards and firewall rule evaluations</li>
              <li><span class="dot" style="background:#818cf8"></span>Eliminates branch race conditions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="stage-footer">
      <div>
        <button class="thumb-btn active" onclick="goToSlide(0)">01 Overview</button>
        <button class="thumb-btn" onclick="goToSlide(1)">02 Simulator</button>
        <button class="thumb-btn" onclick="goToSlide(2)">03 Silicon ALU</button>
        <button class="thumb-btn" onclick="goToSlide(3)">04 De Morgan</button>
      </div>
      <div>
        <button class="btn-nav" onclick="prevSlide()">← Prev</button>
        <button class="btn-nav primary" onclick="nextSlide()">Next Step →</button>
      </div>
    </div>
  </div>

  <script>
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;
    const progressBar = document.getElementById('progressBar');
    const slideCounter = document.getElementById('slideCounter');
    const slideBadge = document.getElementById('slideBadge');
    const thumbBtns = document.querySelectorAll('.thumb-btn');

    function updateSlide() {
      slides.forEach((s, idx) => s.classList.toggle('active', idx === currentSlide));
      thumbBtns.forEach((btn, idx) => btn.classList.toggle('active', idx === currentSlide));
      progressBar.style.width = ((currentSlide + 1) / totalSlides * 100) + '%';
      slideCounter.textContent = 'Slide ' + (currentSlide + 1) + ' / ' + totalSlides;
      const activeSlide = slides[currentSlide];
      if (activeSlide) {
        slideBadge.textContent = activeSlide.getAttribute('data-badge') || 'KEYNOTE';
      }
    }

    function nextSlide() { currentSlide = (currentSlide + 1) % totalSlides; updateSlide(); }
    function prevSlide() { currentSlide = (currentSlide - 1 + totalSlides) % totalSlides; updateSlide(); }
    function goToSlide(idx) { currentSlide = idx; updateSlide(); }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      else if (e.key === 'ArrowLeft') prevSlide();
      else if (e.key === 'f' || e.key === 'F') {
        const stage = document.getElementById('stage');
        if (!document.fullscreenElement) stage.requestFullscreen();
        else document.exitFullscreen();
      }
    });

    let sigA = true;
    let sigB = false;

    function toggleSignal(name) {
      if (name === 'A') sigA = !sigA;
      if (name === 'B') sigB = !sigB;

      const btnA = document.getElementById('btnSigA');
      const btnB = document.getElementById('btnSigB');

      btnA.className = 'btn-signal ' + (sigA ? 'active' : '');
      btnA.innerHTML = '<span>SIGNAL A: [' + (sigA ? 'HIGH' : 'LOW') + ']</span><span>' + (sigA ? '1' : '0') + '</span>';

      btnB.className = 'btn-signal ' + (sigB ? 'active' : '');
      btnB.innerHTML = '<span>SIGNAL B: [' + (sigB ? 'HIGH' : 'LOW') + ']</span><span>' + (sigB ? '1' : '0') + '</span>';

      const andVal = sigA && sigB;
      const orVal = sigA || sigB;
      const notVal = !sigA;
      const xorVal = (sigA || sigB) && !(sigA && sigB);

      updateGate('cardAND', 'valAND', andVal);
      updateGate('cardOR', 'valOR', orVal);
      updateGate('cardNOT', 'valNOT', notVal);
      updateGate('cardXOR', 'valXOR', xorVal);

      // Truth table active row
      const key = (sigA ? '1' : '0') + (sigB ? '1' : '0');
      ['00', '01', '10', '11'].forEach(k => {
        const row = document.getElementById('tt' + k);
        if (row) row.classList.toggle('active', k === key);
      });
    }

    function updateGate(cardId, valId, val) {
      const card = document.getElementById(cardId);
      const txt = document.getElementById(valId);
      card.classList.toggle('active', val);
      txt.textContent = val ? '1' : '0';
    }

    updateSlide();
  </script>
</body>
</html>`;

export const showcaseHtmlSites = {
  booleanLogic: {
    title: "Boolean Logic & Digital Circuit Architecture",
    topic: "Boolean Logic & Digital Circuits",
    model: "NVIDIA Nemotron 550B Ultra",
    html: booleanLogicHtmlSite,
  },
};
