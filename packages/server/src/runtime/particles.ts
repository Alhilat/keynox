/**
 * Runtime 2D Particle Conduit Engine
 * 
 * Draws curved bezier transit conduits with floating glowing particles.
 */

export const PARTICLES_RUNTIME = `
    function initParticleConduits(slideEl) {
      const canvases = slideEl.querySelectorAll('.particle-canvas');
      canvases.forEach(canvas => {
        if (canvas.dataset.initialized) return;
        canvas.dataset.initialized = 'true';
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width = canvas.parentElement.clientWidth || 550;
        const height = canvas.height = canvas.parentElement.clientHeight || 220;

        const particles = [];
        for (let i = 0; i < 40; i++) {
          particles.push({
            t: Math.random(),
            speed: 0.004 + Math.random() * 0.006,
            offsetY: (Math.random() - 0.5) * 35,
            size: 2.5 + Math.random() * 2.5,
            color: i % 3 === 0 ? '#10b981' : i % 3 === 1 ? '#38bdf8' : '#818cf8'
          });
        }

        function renderParticles() {
          ctx.clearRect(0, 0, width, height);

          ctx.beginPath();
          ctx.moveTo(30, height / 2);
          ctx.bezierCurveTo(width * 0.35, height * 0.2, width * 0.65, height * 0.8, width - 30, height / 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';
          ctx.stroke();

          particles.forEach(p => {
            p.t += p.speed;
            if (p.t > 1) p.t = 0;
            const t = p.t;
            const x = Math.pow(1 - t, 3) * 30 +
                      3 * Math.pow(1 - t, 2) * t * (width * 0.35) +
                      3 * (1 - t) * Math.pow(t, 2) * (width * 0.65) +
                      Math.pow(t, 3) * (width - 30);
            const y = (Math.pow(1 - t, 3) * (height / 2) +
                      3 * Math.pow(1 - t, 2) * t * (height * 0.2) +
                      3 * (1 - t) * Math.pow(t, 2) * (height * 0.8) +
                      Math.pow(t, 3) * (height / 2)) + p.offsetY;

            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.shadowBlur = 0;
          });

          requestAnimationFrame(renderParticles);
        }
        renderParticles();
      });
    }
`;
