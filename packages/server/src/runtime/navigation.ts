/**
 * Runtime Presentation Navigation & Transition Controller
 * 
 * Manages slide state machine, GSAP activation animations,
 * keyboard shortcuts, fullscreen mode, and bidirectional postMessage sync.
 */

export const NAVIGATION_RUNTIME = `
    let currentSlide = 0;
    const slides = Array.from(document.querySelectorAll('.slide'));
    const totalSlides = slides.length;
    const progressBar = document.getElementById('progressBar');
    const slideCounter = document.getElementById('slideCounter');
    const thumbBtns = Array.from(document.querySelectorAll('.thumb-btn'));

    function setTheme(t) {
      document.body.className = 'theme-' + t;
    }

    function updatePresentationState() {
      slides.forEach((s, idx) => {
        if (idx === currentSlide) {
          s.classList.add('active');
          if (window.gsap) {
            gsap.fromTo(s.querySelectorAll('.glass-card, .glow-card, .matrix-table, .sim-container, .chart-card, .venn-container, .flow-diagram, .diff-container, .state-diagram, .disk-stripe, .pointer-topology'), 
              { opacity: 0, y: 16 }, 
              { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" }
            );

            gsap.fromTo(s.querySelectorAll('.pipeline-stage'),
              { opacity: 0, y: 22, scale: 0.92 },
              { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.1, ease: "back.out(1.4)", delay: 0.05 }
            );

            gsap.fromTo(s.querySelectorAll('.pipeline-connector'),
              { scaleX: 0, transformOrigin: "left center" },
              { scaleX: 1, duration: 0.4, stagger: 0.1, ease: "power2.out", delay: 0.15 }
            );

            gsap.fromTo(s.querySelectorAll('.chart-bar-fill'),
              { scaleY: 0, transformOrigin: "bottom" },
              { scaleY: 1, duration: 0.65, stagger: 0.08, ease: "back.out(1.2)", delay: 0.1 }
            );

            gsap.fromTo(s.querySelectorAll('.venn-circle-shape'),
              { scale: 0.6, opacity: 0, transformOrigin: "center" },
              { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out", delay: 0.05 }
            );

            gsap.fromTo(s.querySelectorAll('.flow-node'),
              { scale: 0.5, opacity: 0 },
              { scale: 1, opacity: 1, duration: 0.4, stagger: 0.1, ease: "back.out(1.5)", delay: 0.1 }
            );
          }

          if (typeof initThreeScenes === 'function') initThreeScenes(s);
          if (typeof initParticleConduits === 'function') initParticleConduits(s);
          if (typeof renderSlideMath === 'function') renderSlideMath(s);
        } else {
          s.classList.remove('active');
          if (s._activeTl && typeof s._activeTl.pause === 'function') {
            try { s._activeTl.pause(0); } catch (e) {}
          }
        }
      });

      if (thumbBtns && thumbBtns.length > 0) {
        thumbBtns.forEach((btn, idx) => {
          btn.classList.toggle('active', idx === currentSlide);
        });
      }

      const progress = totalSlides > 1 ? ((currentSlide + 1) / totalSlides) * 100 : 100;
      if (progressBar) progressBar.style.width = progress + '%';
      if (slideCounter) slideCounter.textContent = (currentSlide + 1) + ' / ' + totalSlides;
      const footerCur = document.getElementById('footerCurrent');
      if (footerCur) {
        const curNum = currentSlide + 1;
        footerCur.textContent = curNum < 10 ? '0' + curNum : String(curNum);
      }

      if (typeof resetZoom === 'function' && typeof currentScale !== 'undefined' && currentScale !== 1.0) {
        resetZoom();
      }
      if (typeof loadSlideDrawing === 'function') {
        loadSlideDrawing(currentSlide);
      }

      // Execute dynamic slide scripts if not yet executed
      document.querySelectorAll('.slide script').forEach(scr => {
        if (!scr.dataset.executed) {
          scr.dataset.executed = 'true';
          try { new Function(scr.textContent)(); } catch (e) { console.warn(e); }
        }
      });

      const activeSlide = slides[currentSlide];
      const slideIdx = currentSlide + 1;
      const initFn = window['initSlide_' + slideIdx] || window['initSlide_' + currentSlide] || window['initSlide' + currentSlide];
      if (typeof initFn === 'function' && activeSlide) {
        try {
          if (!activeSlide._activeTl) {
            activeSlide._activeTl = initFn(activeSlide);
          }
          if (activeSlide._activeTl && typeof activeSlide._activeTl.play === 'function') {
            activeSlide._activeTl.play();
          }
        } catch (e) {
          console.warn('[Navigation] Slide init error:', e);
        }
      }

      try {
        const activeSlide = slides[currentSlide];
        const activeTitle = activeSlide ? (activeSlide.querySelector('.slide-title')?.textContent?.trim() || ('Slide ' + (currentSlide + 1))) : '';
        const notes = activeSlide?.getAttribute('data-notes') || '';
        const syncMsg = {
          type: 'HYPERDECK_STATE_UPDATE',
          currentSlide,
          totalSlides,
          title: activeTitle,
          notes: notes,
        };
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(syncMsg, '*');
        }
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(syncMsg, '*');
        }
      } catch (err) {
        // Cross-origin safety
      }
    }

    window.addEventListener('message', (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'HYPERDECK_NAVIGATE') {
        if (e.data.action === 'next') nextSlide();
        else if (e.data.action === 'prev') prevSlide();
        else if (e.data.action === 'goTo' && typeof e.data.index === 'number') goToSlide(e.data.index);
      }
    });

    function nextSlide() {
      if (currentSlide < totalSlides - 1) {
        if (typeof saveSlideDrawing === 'function') saveSlideDrawing(currentSlide);
        currentSlide++;
        updatePresentationState();
      }
    }

    function prevSlide() {
      if (currentSlide > 0) {
        if (typeof saveSlideDrawing === 'function') saveSlideDrawing(currentSlide);
        currentSlide--;
        updatePresentationState();
      }
    }

    function goToSlide(idx) {
      if (idx >= 0 && idx < totalSlides) {
        if (typeof saveSlideDrawing === 'function') saveSlideDrawing(currentSlide);
        currentSlide = idx;
        updatePresentationState();
      }
    }

    function toggleFullscreen() {
      const stage = document.getElementById('hyperdeckStage');
      if (!document.fullscreenElement) {
        if (stage && stage.requestFullscreen) stage.requestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    }

    // Explicitly expose on window for inline onclick handlers
    window.nextSlide = nextSlide;
    window.prevSlide = prevSlide;
    window.goToSlide = goToSlide;
    window.toggleFullscreen = toggleFullscreen;

    window.addEventListener('keydown', (e) => {
      if (['ArrowRight', 'Space', 'j', 'PageDown'].includes(e.key)) {
        e.preventDefault();
        nextSlide();
      } else if (['ArrowLeft', 'k', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (!isNaN(Number(e.key)) && Number(e.key) >= 1 && Number(e.key) <= totalSlides) {
        goToSlide(Number(e.key) - 1);
      } else if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) { if (typeof window.redo === 'function') window.redo(); }
        else { if (typeof window.undo === 'function') window.undo(); }
      } else if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        if (typeof window.redo === 'function') window.redo();
      } else if (!e.ctrlKey && !e.altKey && !e.metaKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        if (e.key === 'p' || e.key === 'P') {
          if (typeof toggleAnnotationBar === 'function') { toggleAnnotationBar(true); setTool('pen'); }
        } else if (e.key === 'h' || e.key === 'H') {
          if (typeof toggleAnnotationBar === 'function') { toggleAnnotationBar(true); setTool('highlighter'); }
        } else if (e.key === 's' || e.key === 'S') {
          if (typeof setTool === 'function') setTool('scroll');
        } else if (e.key === 'Escape') {
          if (typeof setTool === 'function') setTool('scroll');
          if (typeof toggleAnnotationBar === 'function') toggleAnnotationBar(false);
        }
      }
    });
`;
