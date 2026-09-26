/**
 * Runtime KaTeX Mathematical Typography Engine
 * 
 * Auto-renders LaTeX math blocks into high-fidelity typography.
 */

export const KATEX_RUNTIME = `
    function renderSlideMath(slideEl) {
      if (!slideEl) return;
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

      // Also render data-expr attributes on math spans and divs
      if (window.katex) {
        slideEl.querySelectorAll('[data-expr]').forEach(function(el) {
          var expr = el.getAttribute('data-expr');
          if (expr && !el.dataset.katexRendered) {
            try {
              window.katex.render(expr, el, {
                displayMode: el.tagName === 'DIV' || el.classList.contains('equation-display') || el.classList.contains('katex-display'),
                throwOnError: false
              });
              el.dataset.katexRendered = 'true';
            } catch (err) {
              console.warn("KaTeX data-expr render error:", err);
            }
          }
        });
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

      if (window.katex) {
        document.querySelectorAll('[data-expr]').forEach(function(el) {
          var expr = el.getAttribute('data-expr');
          if (expr && !el.dataset.katexRendered) {
            try {
              window.katex.render(expr, el, {
                displayMode: el.tagName === 'DIV' || el.classList.contains('equation-display') || el.classList.contains('katex-display'),
                throwOnError: false
              });
              el.dataset.katexRendered = 'true';
            } catch (err) {
              console.warn("Global KaTeX data-expr error:", err);
            }
          }
        });
      }
    }
`;
