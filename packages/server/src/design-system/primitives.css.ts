/**
 * Keynox Design System — Semantic Topologies & Stacks
 */

export const PRIMITIVES_CSS = `/* Composable Semantic Primitives: Disk Stripes, Pointer Trees, Stacks & Calculators
   ========================================================================== */

/* Whiteboard Spatial Primitive: Dual-Plane / Horizon Split (Top/Bottom or Left/Right Boundary) */
.dual-plane {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-top: 8px;
}
.plane-zone {
  background: #080c16;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.06);
}
.plane-zone-host {
  border-color: rgba(56, 189, 248, 0.35);
  background: linear-gradient(180deg, rgba(56, 189, 248, 0.05) 0%, rgba(8, 12, 22, 0.95) 100%);
}
.plane-zone-isolated {
  border-color: rgba(16, 185, 129, 0.35);
  background: linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, rgba(8, 12, 22, 0.95) 100%);
}
.plane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.plane-tag {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
}
.plane-nodes {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.plane-node {
  padding: 8px 14px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
}
.boundary-barrier {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px dashed rgba(245, 158, 11, 0.4);
  border-radius: 8px;
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: #fbbf24;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* Whiteboard Spatial Primitive: Mechanism Prism (Input -> Transform Engine -> Output) */
.mechanism-prism {
  display: grid;
  grid-template-columns: 1fr 1.3fr 1fr;
  gap: 14px;
  align-items: stretch;
  width: 100%;
  margin-top: 10px;
}
.prism-input, .prism-output {
  background: #080c16;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.prism-core {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(129, 140, 248, 0.12) 100%);
  border: 1.5px solid rgba(56, 189, 248, 0.4);
  border-radius: 14px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: 0 0 30px -5px rgba(56, 189, 248, 0.15);
}

/* Whiteboard Spatial Primitive: Anatomy Map with Callout Nodes */
.anatomy-map {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 18px;
  align-items: center;
  width: 100%;
  margin-top: 8px;
}
.anatomy-stage {
  background: #080c16;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.callout-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.callout-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--border-subtle);
  border-radius: 9px;
  font-size: 12.5px;
}

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

/* Resilient Structural Fallbacks & Aliases for Synthesized Topologies, Cards & Checklists */
.tri-card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
}
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 20px;
  backdrop-filter: blur(14px);
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
}
.card h3 {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12px;
}
.card-emerald { border-color: rgba(16, 185, 129, 0.35); }
.card-cyan { border-color: rgba(56, 189, 248, 0.35); }
.card-indigo { border-color: rgba(129, 140, 248, 0.35); }
.card-amber { border-color: rgba(245, 158, 11, 0.35); }
.card-rose { border-color: rgba(244, 63, 94, 0.35); }

.checklist {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}
.checklist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 11px;
  font-size: 13.5px;
  color: var(--text-main);
  backdrop-filter: blur(12px);
  transition: all 0.2s ease;
}
.checklist-item:hover {
  transform: translateX(4px);
  border-color: var(--border-active);
}
.checklist-item svg {
  color: var(--accent-emerald);
  flex-shrink: 0;
}

.topology-flow, .topology-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  width: 100%;
  align-items: stretch;
}
.topology-bus, .topology-star, .topology-ring, .topology-mesh, .topology-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 18px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  text-align: center;
  gap: 12px;
  transition: all 0.25s ease;
  backdrop-filter: blur(14px);
}
.topology-bus:hover, .topology-star:hover, .topology-ring:hover, .topology-mesh:hover, .topology-card:hover {
  transform: translateY(-3px);
  border-color: var(--border-active);
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
}
.topology-bus svg, .topology-star svg, .topology-ring svg, .topology-mesh svg {
  color: var(--accent-cyan);
}
.topology-label, caption {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  display: block;
  margin: 0;
  padding: 0;
}

/* Fallbacks for Diff, Pipeline & Code Containers */
.code-diff {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  width: 100%;
}
.annotation {
  grid-column: 1 / -1;
  padding: 12px 18px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  font-size: 13.5px;
  color: var(--text-muted);
}
.pipeline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  width: 100%;
  margin-top: 16px;
}
.stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 16px 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  gap: 8px;
}
.label {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--accent-cyan);
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.card-body {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.55;
}
.code-block {
  font-family: var(--font-mono);
  font-size: 13.5px;
  padding: 14px 18px;
  background: #080c16;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  color: #e2e8f0;
  overflow-x: auto;
}
`;
