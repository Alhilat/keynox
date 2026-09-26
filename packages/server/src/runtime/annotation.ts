/**
 * Runtime Annotation & Zoom Canvas Engine
 * 
 * Provides interactive drawing, pen/highlighter modes, undo/redo,
 * local storage drawing persistence, and stage zoom/pan controls.
 */

export const ANNOTATION_RUNTIME = `
    let currentTool = 'scroll';
    let currentScale = 1.0;
    let drawingCanvas = null;
    let drawCtx = null;
    let isPainting = false;
    let undoStack = [];
    let redoStack = [];
    const slideDrawings = new Map();
    const storageKey = 'keynox_drawings_' + (window.location.pathname.replace(/[^a-zA-Z0-9]/g, '_') || 'deck');

    function initDrawingEngine() {
      drawingCanvas = document.getElementById('drawingCanvas');
      if (!drawingCanvas) return;
      drawCtx = drawingCanvas.getContext('2d', { alpha: true, desynchronized: true });
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.entries(parsed).forEach(([idx, dataUrl]) => {
            slideDrawings.set(Number(idx), dataUrl);
          });
        }
      } catch (e) {
        // Safe fallback
      }

      loadSlideDrawing(currentSlide);
      if (drawingCanvas) {
        drawingCanvas.style.pointerEvents = 'none';
      }

      drawingCanvas.addEventListener('mousedown', startPosition);
      window.addEventListener('mouseup', stopPosition);
      drawingCanvas.addEventListener('mousemove', draw);
      drawingCanvas.addEventListener('mouseleave', () => { if (isPainting) stopPosition(); });

      drawingCanvas.addEventListener('touchstart', startPosition, { passive: false });
      window.addEventListener('touchend', stopPosition);
      drawingCanvas.addEventListener('touchmove', draw, { passive: false });
    }

    function resizeCanvas() {
      const vp = document.getElementById('viewport');
      if (!drawingCanvas || !vp || !drawCtx) return;
      const rect = vp.getBoundingClientRect();
      const prevData = drawingCanvas.width > 0 && drawingCanvas.height > 0 ? drawingCanvas.toDataURL() : null;
      drawingCanvas.width = rect.width;
      drawingCanvas.height = rect.height;
      drawingCanvas.style.width = rect.width + 'px';
      drawingCanvas.style.height = rect.height + 'px';
      if (prevData) {
        const img = new Image();
        img.src = prevData;
        img.onload = () => { drawCtx.drawImage(img, 0, 0, drawingCanvas.width, drawingCanvas.height); };
      }
    }

    function getCoords(e) {
      const rect = drawingCanvas.getBoundingClientRect();
      let clientX = e.clientX;
      let clientY = e.clientY;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
      const scaleX = drawingCanvas.width / (rect.width || 1);
      const scaleY = drawingCanvas.height / (rect.height || 1);
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    }

    function saveState() {
      if (drawingCanvas) {
        undoStack.push(drawingCanvas.toDataURL());
        if (undoStack.length > 30) undoStack.shift();
      }
    }

    function restoreState(dataUrl) {
      if (!drawingCanvas || !drawCtx) return;
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        drawCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        drawCtx.drawImage(img, 0, 0, drawingCanvas.width, drawingCanvas.height);
      };
    }

    function startPosition(e) {
      if (currentTool === 'scroll') return;
      isPainting = true;
      const coords = getCoords(e);
      drawCtx.beginPath();
      drawCtx.moveTo(coords.x, coords.y);
      e.preventDefault();
    }

    function stopPosition() {
      if (!isPainting) return;
      isPainting = false;
      drawCtx.beginPath();
      redoStack = [];
      saveState();
      slideDrawings.set(currentSlide, drawingCanvas.toDataURL());
    }

    function draw(e) {
      if (!isPainting || currentTool === 'scroll') return;
      const coords = getCoords(e);
      if (currentTool === 'highlighter') {
        drawCtx.globalCompositeOperation = 'source-over';
        drawCtx.lineWidth = 24;
        drawCtx.lineCap = 'round';
        drawCtx.lineJoin = 'round';
        drawCtx.strokeStyle = 'rgba(255, 235, 59, 0.65)';
      } else {
        drawCtx.globalCompositeOperation = 'source-over';
        drawCtx.lineWidth = 3.5;
        drawCtx.lineCap = 'round';
        drawCtx.lineJoin = 'round';
        drawCtx.strokeStyle = document.getElementById('penColor')?.value || '#ef4444';
      }
      drawCtx.lineTo(coords.x, coords.y);
      drawCtx.stroke();
      e.preventDefault();
    }

    window.setTool = function(tool) {
      currentTool = tool;
      const penBtn = document.getElementById('penBtn');
      const hlBtn = document.getElementById('highlighterBtn');
      const scrollBtn = document.getElementById('scrollBtn');
      if (penBtn) penBtn.classList.toggle('active', tool === 'pen');
      if (hlBtn) hlBtn.classList.toggle('active', tool === 'highlighter');
      if (scrollBtn) scrollBtn.classList.toggle('active', tool === 'scroll');

      if (drawingCanvas) {
        drawingCanvas.style.pointerEvents = (tool === 'scroll') ? 'none' : 'auto';
        drawingCanvas.style.cursor = (tool === 'scroll') ? 'default' : 'crosshair';
        drawingCanvas.style.zIndex = (tool === 'scroll') ? '5' : '999';
      }
    };

    window.undo = function() {
      if (undoStack.length > 1) {
        redoStack.push(undoStack.pop());
        const target = undoStack[undoStack.length - 1];
        restoreState(target);
        slideDrawings.set(currentSlide, target);
      }
    };

    window.redo = function() {
      if (redoStack.length > 0) {
        const nextState = redoStack.pop();
        undoStack.push(nextState);
        restoreState(nextState);
        slideDrawings.set(currentSlide, nextState);
      }
    };

    window.saveDrawings = function() {
      if (!drawingCanvas) return;
      slideDrawings.set(currentSlide, drawingCanvas.toDataURL());
      try {
        const payload = JSON.stringify(Object.fromEntries(slideDrawings));
        localStorage.setItem(storageKey, payload);
      } catch (err) {
        console.warn('Storage error:', err);
      }
      const saveBtn = document.getElementById('saveBtn');
      if (saveBtn) {
        const orig = saveBtn.innerHTML;
        saveBtn.innerHTML = '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg> Saved!';
        setTimeout(() => { saveBtn.innerHTML = orig; }, 2000);
      }
    };

    window.clearDrawings = function() {
      if (!drawingCanvas || !drawCtx) return;
      drawCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
      slideDrawings.delete(currentSlide);
      try {
        const payload = JSON.stringify(Object.fromEntries(slideDrawings));
        localStorage.setItem(storageKey, payload);
      } catch (err) {
        console.warn('Storage error:', err);
      }
      undoStack = [];
      redoStack = [];
      saveState();

      const clearBtn = document.getElementById('clearBtn');
      if (clearBtn) {
        const orig = clearBtn.innerHTML;
        clearBtn.innerHTML = '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg> Cleared';
        clearBtn.style.backgroundColor = '#475569';
        setTimeout(() => {
          clearBtn.innerHTML = orig;
          clearBtn.style.backgroundColor = '#334155';
        }, 1200);
      }
    };

    function saveSlideDrawing(idx) {
      if (drawingCanvas && drawCtx) {
        slideDrawings.set(idx, drawingCanvas.toDataURL());
      }
    }

    function loadSlideDrawing(idx) {
      if (!drawingCanvas || !drawCtx) return;
      drawCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
      undoStack = [];
      redoStack = [];
      saveState();
      const dataUrl = slideDrawings.get(idx);
      if (dataUrl) {
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
          drawCtx.drawImage(img, 0, 0, drawingCanvas.width, drawingCanvas.height);
          saveState();
        };
      }
    }

    window.zoomIn = function() {
      currentScale = Math.min(currentScale + 0.15, 2.5);
      applyZoom();
    };

    window.zoomOut = function() {
      currentScale = Math.max(currentScale - 0.15, 0.4);
      applyZoom();
    };

    window.resetZoom = function() {
      currentScale = 1.0;
      applyZoom();
    };

    function applyZoom() {
      const activeSlide = document.querySelector('.slide.active');
      if (activeSlide) {
        activeSlide.style.transform = 'scale(' + currentScale + ')';
        activeSlide.style.transformOrigin = 'center center';
        activeSlide.style.transition = 'transform 0.2s ease-out';
      }
      const resetBtn = document.getElementById('zoomResetBtn');
      if (resetBtn) {
        resetBtn.textContent = Math.round(currentScale * 100) + '%';
      }
    }

    window.toggleAnnotationBar = function(force) {
      const bar = document.getElementById('controlsBar');
      const zoom = document.getElementById('topZoomControls');
      const toggleBtn = document.getElementById('annotateToggleBtn');
      const isCurrentlyVisible = bar ? (bar.classList.contains('visible') && !bar.classList.contains('hidden') && bar.style.display !== 'none') : false;
      const nextVisible = typeof force === 'boolean' ? force : !isCurrentlyVisible;

      if (bar) {
        if (nextVisible) {
          bar.classList.remove('hidden');
          bar.classList.add('visible');
          bar.style.setProperty('display', 'flex', 'important');
        } else {
          bar.classList.remove('visible');
          bar.classList.add('hidden');
          bar.style.setProperty('display', 'none', 'important');
        }
      }
      if (zoom) {
        if (nextVisible) {
          zoom.classList.remove('hidden');
          zoom.classList.add('visible');
          zoom.style.setProperty('display', 'flex', 'important');
        } else {
          zoom.classList.remove('visible');
          zoom.classList.add('hidden');
          zoom.style.setProperty('display', 'none', 'important');
        }
      }
      if (toggleBtn) {
        toggleBtn.classList.toggle('active', nextVisible);
      }
      if (!nextVisible) {
        setTool('scroll');
      } else if (currentTool === 'scroll') {
        setTool('pen');
      }
    };

    window.addEventListener('message', (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'HYPERDECK_SET_FULLSCREEN') {
        window.__isFullscreen = Boolean(e.data.isFullscreen);
        // Drawing bar must not open by default until explicitly clicked by user.
      }
    });
`;
