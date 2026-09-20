/**
 * HyperDeck Token Optimizer & Design System Specifications
 * 
 * Pre-bundles the Master Obsidian & Glassmorphism CSS design system.
 * By injecting this directly into the HTML assembler, the LLM NEVER needs to write
 * redundant CSS or boilerplates, saving ~65% of output tokens and eliminating truncations.
 */

export const MASTER_DESIGN_SYSTEM_CSS = `
:root {
  --bg-primary: #000000;
  --bg-stage: #050507;
  --bg-card: rgba(14, 15, 19, 0.94);
  --bg-card-hover: rgba(22, 24, 30, 0.98);
  --border-subtle: #222226;
  --border-active: #3b82f6;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --accent-blue: #2563eb;
  --accent-cyan: #3b82f6;
  --accent-indigo: #475569;
  --accent-emerald: #15803d;
  --accent-amber: #b45309;
  --accent-rose: #b91c1c;
  --accent-purple: #475569;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans', sans-serif;
  --font-display: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'SF Mono', 'DejaVu Sans Mono', monospace;
}

/* Classic Academic Palettes (Oxford, Cambridge, Harvard, Heidelberg, Princeton) */
body.theme-oxford, body.theme-cyber {
  --bg-primary: #000000;
  --bg-stage: #05060a;
  --bg-card: rgba(12, 14, 20, 0.95);
  --bg-card-hover: rgba(18, 22, 32, 0.98);
  --border-subtle: #1e2430;
  --border-active: #2563eb;
  --accent-cyan: #2563eb;
  --accent-indigo: #475569;
}

body.theme-cambridge, body.theme-ocean {
  --bg-primary: #000000;
  --bg-stage: #050505;
  --bg-card: rgba(15, 15, 15, 0.95);
  --bg-card-hover: rgba(24, 24, 24, 0.98);
  --border-subtle: #262626;
  --border-active: #e2e8f0;
  --accent-cyan: #94a3b8;
  --accent-indigo: #e2e8f0;
}

body.theme-harvard, body.theme-sunset {
  --bg-primary: #000000;
  --bg-stage: #090304;
  --bg-card: rgba(18, 10, 12, 0.95);
  --bg-card-hover: rgba(28, 14, 18, 0.98);
  --border-subtle: #2d161a;
  --border-active: #b91c1c;
  --accent-amber: #b91c1c;
  --accent-rose: #991b1b;
  --accent-cyan: #ef4444;
}

body.theme-heidelberg, body.theme-emerald {
  --bg-primary: #000000;
  --bg-stage: #030805;
  --bg-card: rgba(10, 18, 13, 0.95);
  --bg-card-hover: rgba(16, 28, 20, 0.98);
  --border-subtle: #18281d;
  --border-active: #15803d;
  --accent-emerald: #15803d;
  --accent-cyan: #16a34a;
}

body.theme-princeton, body.theme-cosmic {
  --bg-primary: #000000;
  --bg-stage: #080603;
  --bg-card: rgba(18, 14, 8, 0.95);
  --bg-card-hover: rgba(28, 22, 12, 0.98);
  --border-subtle: #2b2112;
  --border-active: #b45309;
  --accent-purple: #b45309;
  --accent-amber: #d97706;
  --accent-cyan: #d97706;
}

/* Interactive Archetype Keyframes */
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

* { 
  box-sizing: border-box; 
  margin: 0; 
  padding: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
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
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

pre, code, kbd, samp, .terminal-card, .terminal-body {
  font-family: var(--font-mono);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-feature-settings: "liga" 1, "calt" 1;
}

.hyperdeck-stage {
  position: relative;
  width: 100vw;
  height: 100vh;
  max-width: calc(100vh * 16 / 9);
  max-height: calc(100vw * 9 / 16);
  aspect-ratio: 16 / 9;
  background: var(--bg-stage);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 60px -12px rgba(0, 0, 0, 0.95);
}

/* Classic Academic Top Rule */
.hyperdeck-stage::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--border-active, #2563eb);
  z-index: 30;
  opacity: 0.95;
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
.deck-title { font-family: var(--font-display); font-size: 16.5px; font-weight: 700; color: #fff; letter-spacing: -0.01em; }
.badge {
  font-size: 11px;
  font-weight: 700;
  font-family: var(--font-mono);
  padding: 3px 9px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.15);
}
.badge-cyan { background: rgba(37, 99, 235, 0.12); color: #60a5fa; border-color: rgba(37, 99, 235, 0.35); }
.badge-emerald { background: rgba(21, 128, 61, 0.14); color: #4ade80; border-color: rgba(21, 128, 61, 0.35); }
.badge-indigo { background: rgba(71, 85, 105, 0.16); color: #cbd5e1; border-color: rgba(71, 85, 105, 0.4); }
.badge-amber { background: rgba(180, 83, 9, 0.14); color: #fbbf24; border-color: rgba(180, 83, 9, 0.35); }
.badge-rose { background: rgba(185, 28, 28, 0.14); color: #f87171; border-color: rgba(185, 28, 28, 0.35); }
.badge-purple { background: rgba(100, 116, 139, 0.14); color: #e2e8f0; border-color: rgba(100, 116, 139, 0.35); }

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
.slide-category { font-size: 13px; font-family: var(--font-mono); font-weight: 800; color: var(--accent-cyan); text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.08em; }
.slide-title { 
  font-family: var(--font-display);
  font-size: 34px; 
  font-weight: 800; 
  color: #fff; 
  letter-spacing: -0.025em; 
  line-height: 1.2;
  background: linear-gradient(135deg, #ffffff 50%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.slide-subtitle { font-size: 16.5px; color: var(--text-muted); margin-top: 6px; line-height: 1.55; }

/* Fallback heading styling for LLMs emitting raw h2/h3 tags */
.slide h2:not(.slide-title) {
  font-family: var(--font-display);
  font-size: 28px;
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
  font-size: 16px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 18px;
}
.slide .subtitle {
  font-size: 14.5px;
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
.card-title { font-family: var(--font-display); font-size: 18px; font-weight: 700; color: #fff; letter-spacing: -0.01em; }
.card-desc { font-size: 15px; color: var(--text-muted); line-height: 1.6; margin-bottom: 14px; }

.points-list { list-style: none; display: flex; flex-direction: column; gap: 10px; font-size: 14.5px; }
.points-list li { display: flex; align-items: flex-start; gap: 10px; color: #cbd5e1; line-height: 1.55; }
.points-list li::before { 
  content: "";
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #64748b;
  margin-top: 7px;
  flex-shrink: 0;
}

/* Classic Academic Structured Cards */
.card-emerald {
  border-left: 3px solid var(--accent-emerald) !important;
  border-color: var(--border-subtle);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
}
.card-emerald .points-list li::before { background: var(--accent-emerald); }
.card-emerald:hover { border-color: var(--accent-emerald) !important; }

.card-indigo {
  border-left: 3px solid var(--accent-indigo) !important;
  border-color: var(--border-subtle);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
}
.card-indigo .points-list li::before { background: var(--accent-indigo); }
.card-indigo:hover { border-color: var(--accent-indigo) !important; }

.card-amber {
  border-left: 3px solid var(--accent-amber) !important;
  border-color: var(--border-subtle);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
}
.card-amber .points-list li::before { background: var(--accent-amber); }
.card-amber:hover { border-color: var(--accent-amber) !important; }

.card-rose {
  border-left: 3px solid var(--accent-rose) !important;
  border-color: var(--border-subtle);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
}
.card-rose .points-list li::before { background: var(--accent-rose); }
.card-rose:hover { border-color: var(--accent-rose) !important; }

.card-cyan {
  border-left: 3px solid var(--accent-cyan) !important;
  border-color: var(--border-subtle);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
}
.card-cyan .points-list li::before { background: var(--accent-cyan); }
.card-cyan:hover { border-color: var(--accent-cyan) !important; }

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
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}
.stage-emerald .stage-icon, .card-emerald .stage-icon { color: var(--accent-emerald); border-color: rgba(16, 185, 129, 0.35); background: rgba(16, 185, 129, 0.12); }
.stage-cyan .stage-icon, .card-cyan .stage-icon { color: var(--accent-cyan); border-color: rgba(56, 189, 248, 0.35); background: rgba(56, 189, 248, 0.12); }
.stage-indigo .stage-icon, .card-indigo .stage-icon { color: var(--accent-indigo); border-color: rgba(129, 140, 248, 0.35); background: rgba(129, 140, 248, 0.12); }
.stage-amber .stage-icon, .card-amber .stage-icon { color: var(--accent-amber); border-color: rgba(245, 158, 11, 0.35); background: rgba(245, 158, 11, 0.12); }
.stage-rose .stage-icon, .card-rose .stage-icon { color: var(--accent-rose); border-color: rgba(244, 63, 94, 0.35); background: rgba(244, 63, 94, 0.12); }
.stage-icon svg { width: 22px; height: 22px; stroke: currentColor; filter: drop-shadow(0 0 6px currentColor); }
.stage-title {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 5px;
}
.stage-desc {
  font-size: 13.5px;
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
.matrix-table { width: 100%; border-collapse: collapse; font-size: 14.5px; text-align: left; }
.matrix-table th { padding: 12px 14px; font-size: 13px; font-weight: 800; font-family: var(--font-mono); text-transform: uppercase; color: var(--text-muted); border-bottom: 1px solid var(--border-subtle); background: rgba(255,255,255,0.03); letter-spacing: 0.05em; }
.matrix-table td { padding: 12px 14px; border-bottom: 1px solid var(--border-subtle); color: #e2e8f0; font-size: 14.5px; }
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
  height: 38px;
  background: rgba(15, 23, 42, 0.85);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  padding: 0 16px;
  justify-content: space-between;
}
.terminal-dots {
  display: flex;
  align-items: center;
  gap: 7px;
}
.terminal-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  display: inline-block;
}
.dot-red { background: #ef4444; }
.dot-yellow { background: #f59e0b; }
.dot-green { background: #10b981; }
.terminal-title {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 600;
  letter-spacing: 0.04em;
  font-family: var(--font-mono);
}
.terminal-body {
  padding: 22px 26px;
  font-size: 15px;
  line-height: 1.7;
  color: #e2e8f0;
  overflow-x: auto;
  margin: 0;
  white-space: pre;
  font-family: var(--font-mono);
  font-weight: 500;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
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
.flow-node svg { width: 24px; height: 24px; stroke: currentColor; filter: drop-shadow(0 0 6px currentColor); }
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
.sim-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; font-size: 15px; }
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
.sim-slider.slider-emerald::-webkit-slider-thumb { background: var(--accent-emerald); }
.sim-slider.slider-indigo::-webkit-slider-thumb { background: var(--accent-indigo); }
.sim-slider.slider-amber::-webkit-slider-thumb { background: var(--accent-amber); }
.sim-slider.slider-rose::-webkit-slider-thumb { background: var(--accent-rose); }

.sim-gauge { background: #080c16; border: 1px solid var(--border-subtle); border-radius: 8px; padding: 16px; text-align: center; }
.sim-value { font-size: 28px; font-weight: 800; font-family: var(--font-mono); color: var(--accent-cyan); }
.sim-gauge.gauge-emerald .sim-value { color: var(--accent-emerald); }
.sim-gauge.gauge-indigo .sim-value { color: var(--accent-indigo); }
.sim-gauge.gauge-amber .sim-value { color: var(--accent-amber); }
.sim-gauge.gauge-rose .sim-value { color: var(--accent-rose); }

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

.thumbnails-bar { 
  display: flex; 
  align-items: center; 
  gap: 6px; 
  overflow-x: auto; 
  max-width: 68vw; 
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 2px 0;
}
.thumbnails-bar::-webkit-scrollbar { display: none; }
.thumb-btn {
  height: 28px;
  padding: 0 10px;
  border-radius: 7px;
  border: 1px solid var(--border-subtle);
  background: rgba(15, 23, 42, 0.6);
  color: var(--text-muted);
  font-size: 11.5px;
  font-family: var(--font-mono);
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.thumb-btn:hover { color: #fff; border-color: rgba(255,255,255,0.25); transform: translateY(-1px); }
.thumb-btn.active { 
  background: rgba(37, 99, 235, 0.2); 
  border-color: #3b82f6; 
  color: #fff; 
}

.nav-actions { display: flex; align-items: center; gap: 10px; }
.btn-nav {
  height: 34px;
  padding: 0 15px;
  border-radius: 6px;
  border: 1px solid #333333;
  background: #111111;
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}
.btn-nav:hover { background: #262626; border-color: #525252; color: #fff; }
.btn-primary { 
  background: var(--accent-blue, #2563eb); 
  color: #ffffff; 
  font-weight: 700; 
  border: 1px solid #3b82f6;
}
.btn-primary:hover { 
  background: #1d4ed8; 
}

.progress-bar-wrap { position: absolute; top: 0; left: 0; right: 0; height: 3px; background: rgba(255,255,255,0.05); }
.progress-bar-fill { height: 100%; width: 0%; background: var(--accent-blue, #2563eb); transition: width 0.35s ease; }

/* ==========================================================================
   2026 Creative Primitives: Layer Stacks, Dashboards, Diffs, State Diagrams
   ========================================================================== */

/* 15. Hierarchical Architecture Layer Stack */
.layer-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}
.layer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  backdrop-filter: blur(14px);
  transition: transform 0.25s ease, border-color 0.25s ease;
}
.layer-item:hover {
  transform: translateX(4px);
  border-color: var(--border-active);
}
.layer-left { display: flex; align-items: center; gap: 14px; }
.layer-num { font-family: var(--font-mono); font-size: 12.5px; font-weight: 800; color: var(--text-muted); }
.layer-title { font-family: var(--font-display); font-size: 16px; font-weight: 700; color: #fff; }
.layer-desc { font-size: 14px; color: var(--text-muted); }

/* 12. Quad Metric Dashboard */
.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;
}
.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 18px 22px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
  transition: transform 0.25s ease, border-color 0.25s ease;
}
.stat-card:hover {
  transform: translateY(-3px);
  border-color: var(--border-active);
}
.stat-val {
  font-family: var(--font-mono);
  font-size: 34px;
  font-weight: 900;
  color: #fff;
  letter-spacing: -0.02em;
}
.stat-val.val-emerald { color: var(--accent-emerald); }
.stat-val.val-cyan { color: var(--accent-cyan); }
.stat-val.val-indigo { color: var(--accent-indigo); }
.stat-val.val-amber { color: var(--accent-amber); }
.stat-lbl {
  font-size: 13px;
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.stat-sub { font-size: 13.5px; color: #94a3b8; line-height: 1.4; }

/* 03. Code Diff Evolution */
.diff-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  width: 100%;
}
.diff-pane {
  display: flex;
  flex-direction: column;
  background: #080c16;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  overflow: hidden;
}
.diff-header {
  height: 38px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(15, 23, 42, 0.85);
  border-bottom: 1px solid var(--border-subtle);
  font-family: var(--font-mono);
  font-size: 13px;
}

/* 14. State Machine Transition Diagram */
.state-diagram {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 24px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
}
.state-node {
  flex: 1;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
}
.state-name { font-family: var(--font-mono); font-size: 15px; font-weight: 800; color: #fff; }
.state-desc { font-size: 13px; color: var(--text-muted); }
.state-arrow { color: var(--accent-cyan); font-size: 20px; }

/* 20. Executive Summary Checklist */
.checklist-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}
.check-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 18px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  backdrop-filter: blur(14px);
}
.check-icon {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.35);
  color: var(--accent-emerald);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}
.check-content { display: flex; flex-direction: column; gap: 4px; }
.check-title { font-family: var(--font-display); font-size: 14px; font-weight: 700; color: #fff; }
.check-desc { font-size: 12.5px; color: var(--text-muted); line-height: 1.5; }

/* ==========================================================================
   Composable Semantic Primitives: Disk Stripes, Pointer Trees, Stacks & Calculators
   ========================================================================== */

/* Composable Primitive: Disk & Memory Block Stripe */
.disk-stripe {
  display: flex;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  background: #080c16;
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.08), 0 12px 28px -10px rgba(0,0,0,0.7);
  margin: 12px 0;
}
.stripe-block {
  flex: 1;
  padding: 13px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.25s ease;
  cursor: pointer;
  position: relative;
}
.stripe-block:last-child { border-right: none; }
.stripe-block:hover {
  filter: brightness(1.25);
  transform: scaleY(1.04);
  z-index: 2;
}
.stripe-block .block-tag { font-family: var(--font-mono); font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; }
.stripe-block .block-title { font-family: var(--font-display); font-size: 14px; font-weight: 700; color: #fff; line-height: 1.25; }
.stripe-block .block-size { font-family: var(--font-mono); font-size: 12px; color: var(--accent-cyan); margin-top: 3px; }
.stripe-emerald { background: rgba(16, 185, 129, 0.12); border-top: 2.5px solid #10b981; }
.stripe-cyan { background: rgba(56, 189, 248, 0.12); border-top: 2.5px solid #38bdf8; }
.stripe-indigo { background: rgba(129, 140, 248, 0.12); border-top: 2.5px solid #818cf8; }
.stripe-amber { background: rgba(245, 158, 11, 0.12); border-top: 2.5px solid #f59e0b; }
.stripe-rose { background: rgba(244, 63, 94, 0.12); border-top: 2.5px solid #f43f5e; }
.stripe-purple { background: rgba(192, 132, 252, 0.12); border-top: 2.5px solid #c084fc; }

/* Composable Primitive: Pointer & Tree Hierarchy Topology */
.pointer-topology {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  padding: 18px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  backdrop-filter: blur(16px);
}
.pointer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.pointer-node {
  padding: 10px 14px;
  background: #080c16;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.06);
  min-width: 130px;
}
.pointer-node-title { font-family: var(--font-display); font-size: 15px; font-weight: 700; color: #fff; }
.pointer-node-sub { font-family: var(--font-mono); font-size: 12.5px; color: var(--text-muted); }
.pointer-arrow-svg {
  flex: 0 0 auto;
  color: var(--accent-cyan);
  filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.4));
}

/* Composable Primitive: Multi-Tier Subsystem Stack */
.arch-stack {
  display: flex;
  flex-direction: column;
  gap: 9px;
  width: 100%;
}
.stack-tier {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border-radius: 11px;
  background: #080c16;
  border: 1px solid var(--border-subtle);
  transition: all 0.25s ease;
}
.stack-tier:hover { transform: translateX(4px); border-color: var(--border-active); }
.tier-left { display: flex; align-items: center; gap: 12px; }
.tier-badge { font-family: var(--font-mono); font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 5px; }
.tier-name { font-family: var(--font-display); font-size: 13.5px; font-weight: 700; color: #fff; }
.tier-sub { font-size: 11.5px; color: var(--text-muted); margin-top: 1px; }
.tier-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.tier-chip { font-family: var(--font-mono); font-size: 10px; padding: 2px 7px; border-radius: 5px; background: rgba(255,255,255,0.06); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.08); }

/* Composable Primitive: Quantitative Calculation Workbench */
.calc-workbench {
  background: #080c16;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.08);
}
.calc-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.calc-cell {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--border-subtle);
  border-radius: 9px;
  padding: 11px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.calc-cell-label { font-family: var(--font-mono); font-size: 9.5px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
.calc-cell-val { font-family: var(--font-mono); font-size: 15px; font-weight: 800; color: var(--accent-cyan); }
.calc-formula-banner {
  padding: 9px 13px;
  background: rgba(56, 189, 248, 0.08);
  border-left: 3px solid var(--accent-cyan);
  border-radius: 0 8px 8px 0;
  font-size: 12px;
  color: #cbd5e1;
}

/* Mathematical Typography & Equation Card System */
.equation-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.1), 0 16px 36px -12px rgba(0,0,0,0.7);
}
.equation-display {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 24px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 14px;
  font-size: 24px;
  color: #fff;
  margin: 10px 0;
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.08), 0 0 25px rgba(56, 189, 248, 0.08);
}
.katex {
  font-size: 1.15em !important;
  color: #f8fafc !important;
  text-rendering: optimizeLegibility;
}
.katex-display {
  margin: 0.5em 0 !important;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px 0;
}
.katex-display > .katex {
  color: #f8fafc !important;
}
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
