/**
 * Runtime KaTeX Mathematical Typography Engine
 * 
 * Auto-renders LaTeX math blocks into high-fidelity typography.
 */

export const KATEX_RUNTIME = `
    function renderSlideMath(slideEl) {
      if (window.renderMathInElement) {
        try {
          renderMathInElement(slideEl, {
            delimiters: [
              { left: "$$", right: "$$", display: true },
              { left: "\\\\[", right: "\\\\]", display: true },
              { left: "\\\\(", right: "\\\\)", display: false },
            ],
            ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
            ignoredClasses: ["terminal-card", "terminal-body", "terminal-cmd", "arch-stack", "disk-stripe", "stat-card"],
            throwOnError: false,
          });
        } catch (e) {
          console.warn("KaTeX render error:", e);
        }
      }
    }

    function initGlobalMath() {
      if (window.renderMathInElement) {
        try {
          renderMathInElement(document.body, {
            delimiters: [
              { left: "$$", right: "$$", display: true },
              { left: "\\\\[", right: "\\\\]", display: true },
              { left: "\\\\(", right: "\\\\)", display: false },
            ],
            ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
            ignoredClasses: ["terminal-card", "terminal-body", "terminal-cmd", "arch-stack", "disk-stripe", "stat-card"],
            throwOnError: false,
          });
        } catch (e) {
          console.warn("Global KaTeX error:", e);
        }
      }
    }
`;
