/**
 * Master HyperDeck Presentation Runtime Orchestrator
 * 
 * Assembles modular, single-responsibility runtime controllers:
 * - navigation: Slide state machine, keyboard controls, fullscreen, postMessage sync
 * - annotation: Canvas pen/highlighter, undo/redo, drawing storage, stage zoom
 * - motion: Animated pipeline transitions, packet pulses, and simulation runners
 * - webgl: Three.js 3D perspective scenes and drag-orbit controls
 * - particles: 2D curved bezier conduits with floating luminous particles
 * - katex: Mathematical formula rendering engine
 */

import { NAVIGATION_RUNTIME } from "./navigation";
import { ANNOTATION_RUNTIME } from "./annotation";
import { MOTION_RUNTIME } from "./motion";
import { WEBGL_RUNTIME } from "./webgl";
import { PARTICLES_RUNTIME } from "./particles";
import { KATEX_RUNTIME } from "./katex";
import { GRAPH_STEPPER_RUNTIME } from "./graphStepper";
import { COMPLEXITY_CALC_RUNTIME } from "./complexityCalc";

export function getPresentationRuntimeScript(): string {
  return [
    NAVIGATION_RUNTIME,
    ANNOTATION_RUNTIME,
    MOTION_RUNTIME,
    WEBGL_RUNTIME,
    PARTICLES_RUNTIME,
    KATEX_RUNTIME,
    GRAPH_STEPPER_RUNTIME,
    COMPLEXITY_CALC_RUNTIME,
    `
    // Global Lifecycle Bootstrap
    initMotionPipelines();
    initDrawingEngine();
    initGraphSteppers();
    initComplexityCalculators();
    updatePresentationState();
    initGlobalMath();
    `,
  ].join("\n");
}

export const HYPERDECK_CONTROLLER_SCRIPT = getPresentationRuntimeScript();
