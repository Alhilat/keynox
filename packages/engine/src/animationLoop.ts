/**
 * requestAnimationFrame loop helper for Keynox physics simulators.
 * Split from ./drawingHelpers to respect the 150-line module budget.
 */

/** Wraps requestAnimationFrame; returns a function that cancels the loop. */
export function animateLoop(drawFn: (timestamp: number) => void): () => void {
  let rafId = 0;
  let cancelled = false;
  const tick = (t: number): void => {
    if (cancelled) return;
    drawFn(t);
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
  };
}
