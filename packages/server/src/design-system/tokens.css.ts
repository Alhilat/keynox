/**
 * Keynox Design System — Design Tokens & Palettes
 */

export const TOKENS_CSS = `:root {
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
}`;
