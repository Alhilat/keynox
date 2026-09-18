/**
 * HyperDeck Token Optimizer & Design System Specifications
 * 
 * Pre-bundles the Master Obsidian & Glassmorphism CSS design system.
 * By injecting this directly into the HTML assembler, the LLM NEVER needs to write
 * redundant CSS or boilerplates, saving ~65% of output tokens and eliminating truncations.
 */

export const MASTER_DESIGN_SYSTEM_CSS = `
:root {
  --bg-primary: #040711;
  --bg-stage: #070a14;
  --bg-card: rgba(13, 20, 36, 0.78);
  --bg-card-hover: rgba(18, 28, 52, 0.92);
  --border-subtle: rgba(255, 255, 255, 0.09);
  --border-active: rgba(56, 189, 248, 0.45);
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --accent-cyan: #38bdf8;
  --accent-indigo: #818cf8;
  --accent-emerald: #10b981;
  --accent-amber: #f59e0b;
  --accent-rose: #f43f5e;
  --accent-purple: #c084fc;
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-display: 'Outfit', 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

/* 5 Rich Dark/Neon Palette Overrides */
body.theme-cyber {
  --bg-primary: #0d051c;
  --bg-stage: #120826;
  --bg-card: rgba(26, 12, 51, 0.88);
  --bg-card-hover: rgba(36, 18, 70, 0.95);
  --border-active: #f43f5e;
  --accent-cyan: #06b6d4;
  --accent-rose: #f43f5e;
}
body.theme-ocean {
  --bg-primary: #04121d;
  --bg-stage: #061d2d;
  --bg-card: rgba(11, 40, 61, 0.88);
  --bg-card-hover: rgba(16, 56, 85, 0.95);
  --border-active: #38bdf8;
  --accent-cyan: #38bdf8;
  --accent-indigo: #0284c7;
}
body.theme-sunset {
  --bg-primary: #1a080f;
  --bg-stage: #290d18;
  --bg-card: rgba(43, 16, 28, 0.88);
  --bg-card-hover: rgba(60, 24, 40, 0.95);
  --border-active: #f59e0b;
  --accent-amber: #f59e0b;
  --accent-rose: #f43f5e;
}
body.theme-emerald {
  --bg-primary: #03150f;
  --bg-stage: #052219;
  --bg-card: rgba(8, 51, 37, 0.88);
  --bg-card-hover: rgba(12, 70, 52, 0.95);
  --border-active: #10b981;
  --accent-emerald: #10b981;
  --accent-cyan: #34d399;
}
body.theme-cosmic {
  --bg-primary: #0e041e;
  --bg-stage: #14052b;
  --bg-card: rgba(29, 8, 56, 0.88);
  --bg-card-hover: rgba(42, 14, 80, 0.95);
  --border-active: #c084fc;
  --accent-purple: #c084fc;
  --accent-amber: #fbbf24;
}

/* Interactive Archetype Keyframes from test_react_presentation.html */
@keyframes termPop {
  0% { opacity: 0; transform: scale(0.85) translateY(10px); }
  70% { transform: scale(1.05) translateY(-2px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes conduitBeamUp {
  0% { top: 100%; opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { top: 0%; opacity: 0; }
}
@keyframes conduitBeamDown {
  0% { top: 0%; opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}
@keyframes packetFlyRight {
  0% { left: 0%; opacity: 0; transform: translateY(-50%) scale(0.7); }
  20% { opacity: 1; transform: translateY(-50%) scale(1.2); }
  80% { opacity: 1; transform: translateY(-50%) scale(1.2); }
  100% { left: 100%; opacity: 0; transform: translateY(-50%) scale(0.7); }
}
@keyframes packetFlyLeft {
  0% { right: 0%; opacity: 0; transform: translateY(-50%) scale(0.7); }
  20% { opacity: 1; transform: translateY(-50%) scale(1.2); }
  80% { opacity: 1; transform: translateY(-50%) scale(1.2); }
  100% { right: 100%; opacity: 0; transform: translateY(-50%) scale(0.7); }
}

.theme-switcher {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.08);
  padding: 3px 6px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}
.theme-btn {
  background: transparent;
  border: none;
  color: #cbd5e1;
  font-size: 11px;
  font-weight: 700;
  font-family: var(--font-sans);
  padding: 3px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.theme-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: var(--bg-primary);
  color: var(--text-main);
  font-family: var(--font-sans);
  overflow: hidden;
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.hyperdeck-stage {
  position: relative;
  width: 100vw;
  height: 100vh;
  max-width: calc(100vh * 16 / 9);
  max-height: calc(100vw * 9 / 16);
  aspect-ratio: 16 / 9;
  background: radial-gradient(circle at 50% -15%, rgba(56, 189, 248, 0.12) 0%, rgba(129, 140, 248, 0.04) 40%, #070a14 100%);
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 30px 80px -20px rgba(0, 0, 0, 0.95), inset 0 1px 0 0 rgba(255, 255, 255, 0.12), 0 0 50px rgba(56, 189, 248, 0.08);
}

/* Glowing Top Accent Line */
.hyperdeck-stage::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2.5px;
  background: linear-gradient(90deg, var(--accent-cyan), var(--accent-indigo), var(--accent-purple));
  z-index: 30;
  opacity: 0.9;
}

.stage-header {
  height: 54px;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
  background: rgba(8, 12, 22, 0.88);
  backdrop-filter: blur(16px);
  z-index: 20;
  flex-shrink: 0;
}

.header-left { display: flex; align-items: center; gap: 12px; }
.deck-title { font-family: var(--font-display); font-size: 15px; font-weight: 700; color: #fff; letter-spacing: -0.01em; }
.badge {
  font-size: 10.5px;
  font-weight: 800;
  font-family: var(--font-mono);
  padding: 3.5px 10px;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: rgba(56, 189, 248, 0.12);
  color: var(--accent-cyan);
  border: 1px solid rgba(56, 189, 248, 0.35);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.15);
}
.badge-cyan { background: rgba(56, 189, 248, 0.12); color: var(--accent-cyan); border-color: rgba(56, 189, 248, 0.35); box-shadow: 0 0 12px rgba(56, 189, 248, 0.15); }
.badge-emerald { background: rgba(16, 185, 129, 0.12); color: var(--accent-emerald); border-color: rgba(16, 185, 129, 0.35); box-shadow: 0 0 12px rgba(16, 185, 129, 0.15); }
.badge-indigo { background: rgba(129, 140, 248, 0.12); color: var(--accent-indigo); border-color: rgba(129, 140, 248, 0.35); box-shadow: 0 0 12px rgba(129, 140, 248, 0.15); }
.badge-amber { background: rgba(245, 158, 11, 0.12); color: var(--accent-amber); border-color: rgba(245, 158, 11, 0.35); box-shadow: 0 0 12px rgba(245, 158, 11, 0.15); }
.badge-rose { background: rgba(244, 63, 94, 0.12); color: var(--accent-rose); border-color: rgba(244, 63, 94, 0.35); box-shadow: 0 0 12px rgba(244, 63, 94, 0.15); }
.badge-purple { background: rgba(192, 132, 252, 0.12); color: var(--accent-purple); border-color: rgba(192, 132, 252, 0.35); }

.slides-viewport {
  position: relative;
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.slide {
  position: absolute;
  inset: 0;
  display: none;
  padding: 32px 48px;
  flex-direction: column;
  overflow-y: auto;
  opacity: 0;
  transform: scale(0.985);
  transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide.active {
  display: flex;
  opacity: 1;
  transform: scale(1);
}

/* Staggered Element Entrance on Slide Activation */
@keyframes slideCardEntrance {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.slide.active .glass-card,
.slide.active .photo-card,
.slide.active .chart-card,
.slide.active .flow-diagram,
.slide.active .sim-container,
.slide.active .venn-container {
  animation: slideCardEntrance 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.slide.active .grid-2 > *:nth-child(1), .slide.active .grid-split > *:nth-child(1), .slide.active .grid-3 > *:nth-child(1) { animation-delay: 0.05s; }
.slide.active .grid-2 > *:nth-child(2), .slide.active .grid-split > *:nth-child(2), .slide.active .grid-3 > *:nth-child(2) { animation-delay: 0.12s; }
.slide.active .grid-3 > *:nth-child(3) { animation-delay: 0.2s; }

.slide-title-group { margin-bottom: 22px; }
.slide-category { font-size: 11px; font-family: var(--font-mono); font-weight: 800; color: var(--accent-cyan); text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.08em; }
.slide-title { 
  font-family: var(--font-display);
  font-size: 30px; 
  font-weight: 800; 
  color: #fff; 
  letter-spacing: -0.025em; 
  line-height: 1.2;
  background: linear-gradient(135deg, #ffffff 50%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.slide-subtitle { font-size: 14px; color: var(--text-muted); margin-top: 6px; line-height: 1.55; }

/* Fallback heading styling for LLMs emitting raw h2/h3 tags */
.slide h2:not(.slide-title) {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.02em;
  margin-bottom: 6px;
  background: linear-gradient(135deg, #ffffff 60%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.slide h3:not(.slide-subtitle) {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 18px;
}
.slide .subtitle {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 16px;
}

/* Grid Layouts */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; width: 100%; align-items: stretch; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; width: 100%; align-items: stretch; }
.grid-split { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 28px; width: 100%; align-items: stretch; }

/* Obsidian Glass Cards */
.glass-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 22px;
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.1), 0 16px 36px -12px rgba(0,0,0,0.7);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.3s ease;
}
.glass-card:hover {
  transform: translateY(-3px) scale(1.008);
  border-color: var(--border-active);
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.18), 0 24px 48px -15px rgba(0,0,0,0.85), 0 0 25px rgba(56, 189, 248, 0.14);
}
.glass-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.card-title { font-family: var(--font-display); font-size: 16.5px; font-weight: 700; color: #fff; letter-spacing: -0.01em; }
.card-desc { font-size: 13.5px; color: var(--text-muted); line-height: 1.6; margin-bottom: 14px; }

.points-list { list-style: none; display: flex; flex-direction: column; gap: 9px; font-size: 12.5px; }
.points-list li { display: flex; align-items: flex-start; gap: 9px; color: #cbd5e1; line-height: 1.5; }
.points-list li::before { 
  content: "";
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-cyan);
  box-shadow: 0 0 8px var(--accent-cyan);
  margin-top: 6px;
  flex-shrink: 0;
}

/* Multi-Color Themed Obsidian Glass Cards */
.card-emerald {
  border-color: rgba(16, 185, 129, 0.35) !important;
  box-shadow: inset 0 1px 0 0 rgba(16, 185, 129, 0.2), 0 16px 36px -12px rgba(0,0,0,0.7), 0 0 25px rgba(16, 185, 129, 0.08);
}
.card-emerald::before {
  content: ""; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, #10b981, #34d399);
}
.card-emerald .points-list li::before { background: var(--accent-emerald); box-shadow: 0 0 8px var(--accent-emerald); }
.card-emerald:hover { border-color: #10b981 !important; box-shadow: 0 0 30px rgba(16, 185, 129, 0.3); }

.card-indigo {
  border-color: rgba(129, 140, 248, 0.35) !important;
  box-shadow: inset 0 1px 0 0 rgba(129, 140, 248, 0.2), 0 16px 36px -12px rgba(0,0,0,0.7), 0 0 25px rgba(129, 140, 248, 0.08);
}
.card-indigo::before {
  content: ""; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, #818cf8, #c084fc);
}
.card-indigo .points-list li::before { background: var(--accent-indigo); box-shadow: 0 0 8px var(--accent-indigo); }
.card-indigo:hover { border-color: #818cf8 !important; box-shadow: 0 0 30px rgba(129, 140, 248, 0.3); }

.card-amber {
  border-color: rgba(245, 158, 11, 0.35) !important;
  box-shadow: inset 0 1px 0 0 rgba(245, 158, 11, 0.2), 0 16px 36px -12px rgba(0,0,0,0.7), 0 0 25px rgba(245, 158, 11, 0.08);
}
.card-amber::before {
  content: ""; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}
.card-amber .points-list li::before { background: var(--accent-amber); box-shadow: 0 0 8px var(--accent-amber); }
.card-amber:hover { border-color: #f59e0b !important; box-shadow: 0 0 30px rgba(245, 158, 11, 0.3); }

.card-rose {
  border-color: rgba(244, 63, 94, 0.35) !important;
  box-shadow: inset 0 1px 0 0 rgba(244, 63, 94, 0.2), 0 16px 36px -12px rgba(0,0,0,0.7), 0 0 25px rgba(244, 63, 94, 0.08);
}
.card-rose::before {
  content: ""; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, #f43f5e, #fb7185);
}
.card-rose .points-list li::before { background: var(--accent-rose); box-shadow: 0 0 8px var(--accent-rose); }
.card-rose:hover { border-color: #f43f5e !important; box-shadow: 0 0 30px rgba(244, 63, 94, 0.3); }

.card-cyan {
  border-color: rgba(56, 189, 248, 0.35) !important;
  box-shadow: inset 0 1px 0 0 rgba(56, 189, 248, 0.2), 0 16px 36px -12px rgba(0,0,0,0.7), 0 0 25px rgba(56, 189, 248, 0.08);
}
.card-cyan::before {
  content: ""; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, #38bdf8, #0284c7);
}
.card-cyan .points-list li::before { background: var(--accent-cyan); box-shadow: 0 0 8px var(--accent-cyan); }
.card-cyan:hover { border-color: #38bdf8 !important; box-shadow: 0 0 30px rgba(56, 189, 248, 0.3); }

/* Animated Real-World Motion Pipeline & Stages */
.motion-pipeline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 10px;
  padding: 12px 0;
  position: relative;
}
.pipeline-stage {
  flex: 1;
  background: rgba(13, 20, 36, 0.85);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
  backdrop-filter: blur(14px);
  cursor: pointer;
}
.pipeline-stage:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 14px 32px rgba(0,0,0,0.8);
}
.pipeline-stage.active-stage {
  transform: translateY(-6px) scale(1.04);
  box-shadow: 0 0 35px rgba(56, 189, 248, 0.45), inset 0 1px 0 0 rgba(255,255,255,0.3) !important;
  border-color: #fff !important;
}

/* Multi-Color Themed Stages */
.pipeline-stage.stage-emerald, .pipeline-stage.card-emerald {
  border-color: rgba(16, 185, 129, 0.4);
  box-shadow: inset 0 1px 0 0 rgba(16, 185, 129, 0.18), 0 10px 25px -8px rgba(0,0,0,0.6);
}
.pipeline-stage.stage-emerald::before, .pipeline-stage.card-emerald::before {
  content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, #10b981, #34d399);
}
.pipeline-stage.stage-emerald .stage-num { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
.pipeline-stage.stage-emerald:hover, .pipeline-stage.stage-emerald.active-stage {
  border-color: #10b981 !important;
  box-shadow: 0 14px 35px rgba(0,0,0,0.8), 0 0 32px rgba(16, 185, 129, 0.45) !important;
}

.pipeline-stage.stage-cyan, .pipeline-stage.card-cyan {
  border-color: rgba(56, 189, 248, 0.4);
  box-shadow: inset 0 1px 0 0 rgba(56, 189, 248, 0.18), 0 10px 25px -8px rgba(0,0,0,0.6);
}
.pipeline-stage.stage-cyan::before, .pipeline-stage.card-cyan::before {
  content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, #38bdf8, #0284c7);
}
.pipeline-stage.stage-cyan .stage-num { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
.pipeline-stage.stage-cyan:hover, .pipeline-stage.stage-cyan.active-stage {
  border-color: #38bdf8 !important;
  box-shadow: 0 14px 35px rgba(0,0,0,0.8), 0 0 32px rgba(56, 189, 248, 0.45) !important;
}

.pipeline-stage.stage-indigo, .pipeline-stage.card-indigo {
  border-color: rgba(129, 140, 248, 0.4);
  box-shadow: inset 0 1px 0 0 rgba(129, 140, 248, 0.18), 0 10px 25px -8px rgba(0,0,0,0.6);
}
.pipeline-stage.stage-indigo::before, .pipeline-stage.card-indigo::before {
  content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, #818cf8, #c084fc);
}
.pipeline-stage.stage-indigo .stage-num { background: rgba(129, 140, 248, 0.15); color: #a5b4fc; border: 1px solid rgba(129, 140, 248, 0.3); }
.pipeline-stage.stage-indigo:hover, .pipeline-stage.stage-indigo.active-stage {
  border-color: #818cf8 !important;
  box-shadow: 0 14px 35px rgba(0,0,0,0.8), 0 0 32px rgba(129, 140, 248, 0.45) !important;
}

.pipeline-stage.stage-amber, .pipeline-stage.card-amber {
  border-color: rgba(245, 158, 11, 0.4);
  box-shadow: inset 0 1px 0 0 rgba(245, 158, 11, 0.18), 0 10px 25px -8px rgba(0,0,0,0.6);
}
.pipeline-stage.stage-amber::before, .pipeline-stage.card-amber::before {
  content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}
.pipeline-stage.stage-amber .stage-num { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
.pipeline-stage.stage-amber:hover, .pipeline-stage.stage-amber.active-stage {
  border-color: #f59e0b !important;
  box-shadow: 0 14px 35px rgba(0,0,0,0.8), 0 0 32px rgba(245, 158, 11, 0.45) !important;
}

.pipeline-stage.stage-rose, .pipeline-stage.card-rose {
  border-color: rgba(244, 63, 94, 0.4);
  box-shadow: inset 0 1px 0 0 rgba(244, 63, 94, 0.18), 0 10px 25px -8px rgba(0,0,0,0.6);
}
.pipeline-stage.stage-rose::before, .pipeline-stage.card-rose::before {
  content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, #f43f5e, #fb7185);
}
.pipeline-stage.stage-rose .stage-num { background: rgba(244, 63, 94, 0.15); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.3); }
.pipeline-stage.stage-rose:hover, .pipeline-stage.stage-rose.active-stage {
  border-color: #f43f5e !important;
  box-shadow: 0 14px 35px rgba(0,0,0,0.8), 0 0 32px rgba(244, 63, 94, 0.45) !important;
}

.stage-num {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 4px;
  background: rgba(255,255,255,0.06);
  color: var(--text-muted);
  margin-bottom: 8px;
}
.stage-icon {
  font-size: 26px;
  margin-bottom: 6px;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));
}
.stage-title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 5px;
}
.stage-desc {
  font-size: 11.5px;
  color: var(--text-muted);
  line-height: 1.45;
}

/* Simulation Action Controls */
.pipeline-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 12px;
}
.pipeline-tag {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  display: flex;
  align-items: center;
  gap: 6px;
}
.sim-play-btn {
  padding: 5px 14px;
  border-radius: 999px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(56, 189, 248, 0.2));
  border: 1px solid var(--accent-cyan);
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.2);
}
.sim-play-btn:hover {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(56, 189, 248, 0.35));
  box-shadow: 0 0 25px rgba(56, 189, 248, 0.45);
  transform: scale(1.04);
}

/* Animated Connector with Moving Pulse */
.pipeline-connector {
  flex: 0 0 38px;
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  position: relative;
  overflow: hidden;
}
.packet-pulse {
  position: absolute;
  top: 0;
  height: 100%;
  width: 16px;
  border-radius: 999px;
  background: var(--accent-cyan);
  box-shadow: 0 0 12px var(--accent-cyan);
  animation: packetMove 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
.packet-pulse.packet-emerald { background: var(--accent-emerald); box-shadow: 0 0 14px var(--accent-emerald), 0 0 24px rgba(16, 185, 129, 0.5); }
.packet-pulse.packet-cyan { background: var(--accent-cyan); box-shadow: 0 0 14px var(--accent-cyan), 0 0 24px rgba(56, 189, 248, 0.5); }
.packet-pulse.packet-indigo { background: var(--accent-indigo); box-shadow: 0 0 14px var(--accent-indigo), 0 0 24px rgba(129, 140, 248, 0.5); }
.packet-pulse.packet-amber { background: var(--accent-amber); box-shadow: 0 0 14px var(--accent-amber), 0 0 24px rgba(245, 158, 11, 0.5); }
.packet-pulse.packet-rose { background: var(--accent-rose); box-shadow: 0 0 14px var(--accent-rose), 0 0 24px rgba(244, 63, 94, 0.5); }

@keyframes packetMove {
  0% { left: -40%; opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { left: 120%; opacity: 0; }
}

/* Animated SVG Conduit */
.svg-conduit {
  stroke-dasharray: 6 4;
  animation: flowDash 1.2s linear infinite;
}
@keyframes flowDash {
  to { stroke-dashoffset: -20; }
}

/* Interactive State Switcher */
.state-switcher {
  display: flex;
  gap: 8px;
  padding: 4px;
  background: rgba(8, 12, 22, 0.9);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  margin-bottom: 16px;
}
.state-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 700;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.state-btn:hover { color: #fff; background: rgba(255,255,255,0.05); }
.state-btn.active {
  background: rgba(56, 189, 248, 0.2);
  color: #fff;
  border: 1px solid var(--accent-cyan);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.25);
}
.state-btn.active.theme-emerald {
  background: rgba(16, 185, 129, 0.2);
  border-color: var(--accent-emerald);
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.25);
}
.state-btn.active.theme-amber {
  background: rgba(245, 158, 11, 0.2);
  border-color: var(--accent-amber);
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.25);
}

/* Matrix Tables */
.matrix-table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
.matrix-table th { padding: 12px 14px; font-size: 11px; font-weight: 800; font-family: var(--font-mono); text-transform: uppercase; color: var(--text-muted); border-bottom: 1px solid var(--border-subtle); background: rgba(255,255,255,0.03); letter-spacing: 0.05em; }
.matrix-table td { padding: 12px 14px; border-bottom: 1px solid var(--border-subtle); color: #e2e8f0; }
.matrix-table tr:hover td { background: rgba(56, 189, 248, 0.05); }

/* Obsidian Terminal Window & Code Execution Card */
.terminal-card {
  background: #080c16;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.08), 0 16px 36px -12px rgba(0, 0, 0, 0.8);
  font-family: var(--font-mono);
  display: flex;
  flex-direction: column;
  width: 100%;
}
.terminal-header {
  height: 34px;
  background: rgba(15, 23, 42, 0.85);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  padding: 0 14px;
  justify-content: space-between;
}
.terminal-dots {
  display: flex;
  align-items: center;
  gap: 6px;
}
.terminal-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
}
.dot-red { background: #ef4444; }
.dot-yellow { background: #f59e0b; }
.dot-green { background: #10b981; }
.terminal-title {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
  letter-spacing: 0.04em;
}
.terminal-body {
  padding: 16px;
  font-size: 12px;
  line-height: 1.65;
  color: #e2e8f0;
  overflow-x: auto;
  margin: 0;
  white-space: pre;
}
.terminal-cmd { color: #38bdf8; font-weight: 700; }
.terminal-flag { color: #f59e0b; }
.terminal-out { color: #94a3b8; }
.terminal-highlight { color: #10b981; font-weight: 700; }

/* ==========================================================================
   2026 Creative Primitives: Interactive 3D WebGL Scenes & Particle Conduits
   ========================================================================== */

/* 3D WebGL Scene Viewport */
.three-container {
  position: relative;
  width: 100%;
  height: 330px;
  background: radial-gradient(circle at 50% 50%, rgba(13, 20, 36, 0.92), rgba(5, 8, 16, 0.98));
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.1), 0 20px 40px -15px rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}
.three-canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
  cursor: grab;
}
.three-canvas:active { cursor: grabbing; }

.three-overlay {
  position: absolute;
  top: 14px;
  left: 16px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  pointer-events: none;
  z-index: 5;
}
.three-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 3.5px 9px;
  border-radius: 6px;
  background: rgba(8, 12, 22, 0.88);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(56, 189, 248, 0.35);
  color: var(--accent-cyan);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  width: fit-content;
}
.three-hint {
  font-size: 10.5px;
  font-family: var(--font-mono);
  color: var(--text-muted);
  pointer-events: none;
  position: absolute;
  bottom: 12px;
  right: 16px;
  background: rgba(8, 12, 22, 0.75);
  backdrop-filter: blur(6px);
  padding: 3px 9px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 5;
}

/* Canvas Particle Conduit Viewport */
.particle-container {
  position: relative;
  width: 100%;
  height: 220px;
  background: rgba(8, 12, 22, 0.9);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
}
.particle-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

/* Visual Architecture Flow & Topology */
.flow-diagram {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 24px;
  background: rgba(13, 20, 36, 0.7);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  backdrop-filter: blur(16px);
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
}
.flow-step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  z-index: 2;
}
.flow-node {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.18), rgba(129, 140, 248, 0.18));
  border: 1px solid var(--border-active);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 10px;
  box-shadow: 0 0 25px rgba(56, 189, 248, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
}
.flow-node:hover {
  transform: scale(1.1);
  box-shadow: 0 0 35px rgba(56, 189, 248, 0.45);
}
.flow-arrow {
  color: var(--accent-cyan);
  font-size: 22px;
  opacity: 0.85;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.5));
}

/* Interactive SVG Venn Diagram */
.venn-container {
  position: relative;
  width: 100%;
  height: 310px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(13, 20, 36, 0.6);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 12px;
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
}
.venn-svg {
  width: 100%;
  max-width: 520px;
  height: 290px;
  overflow: visible;
}
.venn-circle-shape {
  fill-opacity: 0.18;
  stroke-width: 2.2;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
}
.venn-circle-shape:hover {
  fill-opacity: 0.35;
  filter: drop-shadow(0 0 18px currentColor);
}

/* Dynamic Visual Bar Chart */
.chart-card {
  background: rgba(13, 20, 36, 0.8);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 14px;
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
}
.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.chart-bars-group {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  height: 180px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
  position: relative;
}
.chart-bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
  gap: 8px;
}
.chart-bar-fill {
  width: 100%;
  max-width: 38px;
  border-radius: 8px 8px 0 0;
  background: linear-gradient(180deg, var(--accent-cyan), rgba(56, 189, 248, 0.25));
  box-shadow: 0 -2px 14px rgba(56, 189, 248, 0.35);
  transition: height 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s ease, filter 0.2s ease;
  cursor: pointer;
  position: relative;
}
.chart-bar-fill:hover {
  filter: brightness(1.3);
  transform: scaleY(1.03);
  box-shadow: 0 -4px 22px var(--accent-cyan);
}
.chart-bar-fill.accent-indigo {
  background: linear-gradient(180deg, var(--accent-indigo), rgba(129, 140, 248, 0.25));
  box-shadow: 0 -2px 14px rgba(129, 140, 248, 0.35);
}
.chart-bar-fill.accent-emerald {
  background: linear-gradient(180deg, var(--accent-emerald), rgba(16, 185, 129, 0.25));
  box-shadow: 0 -2px 14px rgba(16, 185, 129, 0.35);
}
.chart-val-label {
  font-size: 11px;
  font-family: var(--font-mono);
  font-weight: 800;
  color: #fff;
}
.chart-axis-label {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-muted);
}

/* Visual Simulator Canvas / Graphic Stage */
.sim-container { 
  background: rgba(10, 16, 30, 0.92); 
  border: 1px solid var(--border-subtle); 
  border-radius: 16px; 
  padding: 22px; 
  display: flex; 
  flex-direction: column; 
  gap: 18px; 
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
}
.sim-controls { display: flex; flex-direction: column; gap: 14px; }
.sim-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; font-size: 13px; }
.sim-slider { 
  flex: 1; 
  -webkit-appearance: none; 
  appearance: none; 
  height: 6px; 
  border-radius: 999px; 
  background: #1e293b; 
  outline: none; 
}
.sim-slider::-webkit-slider-thumb { 
  -webkit-appearance: none; 
  appearance: none; 
  width: 18px; 
  height: 18px; 
  border-radius: 50%; 
  background: var(--accent-cyan); 
  cursor: pointer; 
  box-shadow: 0 0 14px var(--accent-cyan); 
  border: 2px solid #fff;
  transition: transform 0.2s ease;
}
.sim-slider::-webkit-slider-thumb:hover { transform: scale(1.15); }
.sim-slider.slider-emerald::-webkit-slider-thumb { background: var(--accent-emerald); box-shadow: 0 0 14px var(--accent-emerald); }
.sim-slider.slider-indigo::-webkit-slider-thumb { background: var(--accent-indigo); box-shadow: 0 0 14px var(--accent-indigo); }
.sim-slider.slider-amber::-webkit-slider-thumb { background: var(--accent-amber); box-shadow: 0 0 14px var(--accent-amber); }
.sim-slider.slider-rose::-webkit-slider-thumb { background: var(--accent-rose); box-shadow: 0 0 14px var(--accent-rose); }

.sim-gauge { background: #080c16; border: 1px solid var(--border-subtle); border-radius: 12px; padding: 16px; text-align: center; }
.sim-value { font-size: 28px; font-weight: 800; font-family: var(--font-mono); color: var(--accent-cyan); text-shadow: 0 0 14px rgba(56, 189, 248, 0.4); }
.sim-gauge.gauge-emerald .sim-value { color: var(--accent-emerald); text-shadow: 0 0 14px rgba(16, 185, 129, 0.4); }
.sim-gauge.gauge-indigo .sim-value { color: var(--accent-indigo); text-shadow: 0 0 14px rgba(129, 140, 248, 0.4); }
.sim-gauge.gauge-amber .sim-value { color: var(--accent-amber); text-shadow: 0 0 14px rgba(245, 158, 11, 0.4); }
.sim-gauge.gauge-rose .sim-value { color: var(--accent-rose); text-shadow: 0 0 14px rgba(244, 63, 94, 0.4); }

.sim-visual-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 10px;
  padding: 16px;
  background: rgba(5, 8, 16, 0.95);
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  min-height: 100px;
}
.sim-node-dot {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #172338;
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.sim-node-dot.active {
  background: var(--accent-cyan);
  border-color: #fff;
  box-shadow: 0 0 12px var(--accent-cyan), 0 0 20px rgba(56, 189, 248, 0.4);
  animation: pulseNode 1.5s infinite;
}

/* AI Photo Showcase Cards */
.photo-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.1), 0 16px 36px -12px rgba(0,0,0,0.7);
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.35s ease;
}
.photo-card:hover {
  transform: translateY(-4px) scale(1.01);
  border-color: rgba(56, 189, 248, 0.5);
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.2), 0 24px 50px -15px rgba(0,0,0,0.85), 0 0 30px rgba(56, 189, 248, 0.2);
}
.photo-img {
  width: 100%;
  height: 185px;
  object-fit: cover;
  background: #080c16;
  border-bottom: 1px solid var(--border-subtle);
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.photo-card:hover .photo-img {
  transform: scale(1.05);
}
.photo-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.photo-title {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 700;
  color: #fff;
}
.photo-caption {
  font-size: 12.5px;
  color: var(--text-muted);
  line-height: 1.5;
}
.photo-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(8, 12, 22, 0.88);
  backdrop-filter: blur(10px);
  padding: 3.5px 9px;
  border-radius: 6px;
  font-size: 10px;
  font-family: var(--font-mono);
  font-weight: 800;
  color: var(--accent-cyan);
  border: 1px solid rgba(56, 189, 248, 0.35);
  z-index: 2;
  letter-spacing: 0.05em;
}
@keyframes pulseNode {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.25); opacity: 1; filter: drop-shadow(0 0 8px var(--accent-cyan)); }
}

/* Floating Stage Side Chevrons */
.stage-chevron {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(8, 12, 22, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.25s ease;
  z-index: 25;
}
.stage-chevron:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: var(--accent-cyan);
  color: #fff;
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 0 20px rgba(56, 189, 248, 0.35);
}
.hyperdeck-stage:hover .stage-chevron { opacity: 0.75; }
.stage-chevron:hover { opacity: 1 !important; }
.stage-chevron-prev { left: 14px; }
.stage-chevron-next { right: 14px; }

/* Navigation Footer */
.stage-footer {
  height: 56px;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--border-subtle);
  background: rgba(8, 12, 22, 0.92);
  backdrop-filter: blur(16px);
  z-index: 20;
  flex-shrink: 0;
}

.thumbnails-bar { display: flex; align-items: center; gap: 8px; }
.thumb-btn {
  height: 28px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: rgba(15, 23, 42, 0.6);
  color: var(--text-muted);
  font-size: 11px;
  font-family: var(--font-mono);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.thumb-btn:hover { color: #fff; border-color: rgba(255,255,255,0.25); transform: translateY(-1px); }
.thumb-btn.active { 
  background: rgba(56, 189, 248, 0.18); 
  border-color: var(--accent-cyan); 
  color: #fff; 
  box-shadow: 0 0 14px rgba(56, 189, 248, 0.2);
}

.nav-actions { display: flex; align-items: center; gap: 10px; }
.btn-nav {
  height: 32px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: rgba(25, 36, 56, 0.7);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}
.btn-nav:hover { background: rgba(56, 189, 248, 0.2); border-color: var(--accent-cyan); box-shadow: 0 0 12px rgba(56, 189, 248, 0.2); }
.btn-primary { 
  background: var(--accent-cyan); 
  color: #05070e; 
  font-weight: 800; 
  border: none;
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.35);
}
.btn-primary:hover { 
  background: #7dd3fc; 
  box-shadow: 0 0 25px rgba(56, 189, 248, 0.6); 
}

.progress-bar-wrap { position: absolute; top: 0; left: 0; right: 0; height: 3px; background: rgba(255,255,255,0.05); }
.progress-bar-fill { height: 100%; width: 0%; background: linear-gradient(90deg, var(--accent-cyan), var(--accent-indigo)); transition: width 0.35s ease; box-shadow: 0 0 10px var(--accent-cyan); }
`;

/**
 * Builds the Stage 2 Prompt enforcing rich visual drawings, SVG diagrams, and bar charts.
 */
export function buildStage2Prompt(cleanTopic: string, outlineText: string, targetCount: number): string {
  return `You are a Principal Presentation Visual Architect building a Keynote-grade explainer for: "${cleanTopic}".
TARGET SLIDE COUNT: Exactly ${targetCount} Slides

BLUEPRINT FROM REASONING EXTRACTION:
${outlineText}

========================================================================
MANDATORY VISUAL CREATIVITY DIRECTIVE (ZERO BORING BULLET LISTS):
========================================================================
Static slides with plain text bullet lists are STRICTLY FORBIDDEN! The audience demands rich, creative visual drawings, diagrams, charts, and topologies!

You MUST incorporate the following pre-styled visual drawing primitives across the slides:

1. SLIDE 0: EXECUTIVE OVERVIEW & DYNAMIC BAR CHART
   Use .grid-split:
   - Left side: High-impact overview card (.glass-card) with core invariants.
   - Right side: A VISUAL BAR CHART (.chart-card) drawing real data/years from the document:
     <div class="chart-card">
       <div class="chart-header">
         <span style="font-size: 13px; font-weight: 700; color: #fff;">Growth &amp; Scale Trajectory</span>
         <span class="badge badge-emerald">TELEMETRY</span>
       </div>
       <div class="chart-bars-group">
         <div class="chart-bar-col">
           <span class="chart-val-label">[Value 1]</span>
           <div class="chart-bar-fill" style="height: 25%;"></div>
           <span class="chart-axis-label">[Label 1]</span>
         </div>
         <div class="chart-bar-col">
           <span class="chart-val-label">[Value 2]</span>
           <div class="chart-bar-fill accent-indigo" style="height: 60%;"></div>
           <span class="chart-axis-label">[Label 2]</span>
         </div>
         <div class="chart-bar-col">
           <span class="chart-val-label">[Value 3]</span>
           <div class="chart-bar-fill accent-emerald" style="height: 95%;"></div>
           <span class="chart-axis-label">[Label 3]</span>
         </div>
       </div>
     </div>

2. SLIDE 1: VISUAL VENN DIAGRAM OR CONNECTED NODE PIPELINE
   Feature a prominent graphical drawing:
   EITHER an SVG Venn Diagram (.venn-container) with 3 glowing overlapping circles and center label:
     <div class="venn-container">
       <svg class="venn-svg" viewBox="0 0 520 290">
         <defs>
           <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#0284c7"/></linearGradient>
           <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#818cf8"/><stop offset="100%" stop-color="#4f46e5"/></linearGradient>
           <linearGradient id="g3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#c084fc"/><stop offset="100%" stop-color="#9333ea"/></linearGradient>
         </defs>
         <circle cx="200" cy="120" r="95" fill="url(#g1)" stroke="#38bdf8" class="venn-circle-shape"/>
         <circle cx="320" cy="120" r="95" fill="url(#g2)" stroke="#818cf8" class="venn-circle-shape"/>
         <circle cx="260" cy="190" r="95" fill="url(#g3)" stroke="#c084fc" class="venn-circle-shape"/>
         <text x="170" y="80" fill="#38bdf8" font-size="12" font-weight="700" text-anchor="middle">[Vision 1]</text>
         <text x="350" y="80" fill="#818cf8" font-size="12" font-weight="700" text-anchor="middle">[Vision 2]</text>
         <text x="260" y="265" fill="#c084fc" font-size="12" font-weight="700" text-anchor="middle">[Vision 3]</text>
         <text x="260" y="145" fill="#ffffff" font-size="15" font-weight="900" text-anchor="middle">[INTERSECTION]</text>
       </svg>
     </div>
   OR a Connected Flow Topology (.flow-diagram) with icons, nodes (.flow-node), and arrows (.flow-arrow).

3. SLIDE 2: LAYERED ARCHITECTURAL MATRIX / COMPARISON TABLE
   Structured dimensional matrix (.matrix-table) inside a .glass-card with status pills (<span class="badge badge-emerald">Optimal</span>) comparing engineering trade-offs directly from the source text.

4. SLIDE 3: INTERACTIVE SIMULATOR WITH LIVING VISUAL STAGE
   Interactive simulator (.sim-container) with range slider + dynamic gauge (.sim-gauge) + a live visual node grid (.sim-visual-grid) that illuminates nodes dynamically via JavaScript as the slider moves!

5. REAL-WORLD AI PHOTO CARD (.photo-card) WITH DESIGNER PROMPT:
   Whenever a slide illustrates concrete physical architecture, hardware devices, edge nodes, environments, laboratory setups, or real-world systems, incorporate a photorealistic AI Photo Card:
     <div class="photo-card">
       <div class="photo-badge">NVIDIA FLUX</div>
       <img class="photo-img" data-ai-photo="true" data-photo-prompt="[Your vivid, detailed designer prompt describing the exact entity/device/concept for NVIDIA FLUX image generation, cinematic lighting, 8k, photorealistic macro photography]" alt="[Short Title]" />
       <div class="photo-body">
         <div class="photo-title">[Entity / Mechanism Name]</div>
         <div class="photo-caption">[1-2 sentence context explaining this visual role in the concept]</div>
       </div>
     </div>
   The prompt in data-photo-prompt MUST be derived 100% specifically from the slide concept!

OUTPUT FORMAT:
Output ONLY:
1. Exactly \${targetCount} <section class="slide" id="slide\${i}"> ... </section> blocks (numbered slide0 through slide\${targetCount - 1}, slide0 must have class="slide active").
2. <script id="custom-hyperdeck-widgets"> block at the end with dynamic interactive event listeners for the slider and visual stage.
DO NOT output <!DOCTYPE html>, <html>, <head>, or <body> tags.`;
}
