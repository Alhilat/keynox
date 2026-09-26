/**
 * Keynox Design System — Stage & Grid Layouts
 */

export const LAYOUT_CSS = `@keyframes packetFlyLeft {
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
  user-select: text;
  -webkit-user-select: text;
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
  user-select: text;
  -webkit-user-select: text;
}

.slide.active {
  display: flex;
  opacity: 1;
  transform: scale(1);
}

.glass-card, .photo-card, .chart-card, .flow-diagram, .sim-container, .venn-container, p, span, h1, h2, h3, h4, h5, h6, li {
  user-select: text;
  -webkit-user-select: text;
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
.grid-split { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 28px; width: 100%; align-items: stretch; }`;
