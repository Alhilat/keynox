/**
 * Master Design System CSS Bundle
 * 
 * Composes modular CSS domains:
 * - Tokens: CSS variables, fonts, color palettes
 * - Layout: Virtual stage, bento grids, cinematic hero, timeline
 * - Cards: Obsidian glass cards, glow spotlights, accent themes
 * - Widgets: Motion pipelines, code terminals, matrix tables
 * - Canvas 3D: Three.js viewports, particle conduits, chart bars
 * - Primitives: Memory disk stripes, B-Tree topologies, arch stacks
 */

import { TOKENS_CSS } from "./tokens.css";
import { LAYOUT_CSS } from "./layout.css";
import { CARDS_CSS } from "./cards.css";
import { WIDGETS_CSS } from "./widgets.css";
import { CANVAS_3D_CSS } from "./canvas-3d.css";
import { PRIMITIVES_CSS } from "./primitives.css";

export const MASTER_DESIGN_SYSTEM_CSS = [
  TOKENS_CSS,
  LAYOUT_CSS,
  CARDS_CSS,
  WIDGETS_CSS,
  CANVAS_3D_CSS,
  PRIMITIVES_CSS,
].join("\n\n");
