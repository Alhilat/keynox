/**
 * Runtime Motion Pipeline & Flow Simulator Engine
 * 
 * Handles multi-stage interactive pipelines, packet pulses,
 * automated transmission animations, and state switcher tabs.
 */

export const MOTION_RUNTIME = `
    function initMotionPipelines() {
      document.querySelectorAll('.motion-pipeline').forEach((pipeline) => {
        const stages = Array.from(pipeline.querySelectorAll('.pipeline-stage'));
        stages.forEach((stg) => {
          stg.addEventListener('click', () => {
            stages.forEach(s => s.classList.remove('active-stage'));
            stg.classList.add('active-stage');
            if (window.gsap) {
              gsap.fromTo(stg, { scale: 0.96 }, { scale: 1.04, duration: 0.35, ease: "back.out(2)" });
            }
          });
        });
      });

      document.querySelectorAll('.state-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const parent = btn.closest('.state-switcher');
          if (parent) {
            parent.querySelectorAll('.state-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
          }
        });
      });
    }

    window.simulatePipelineFlow = function(btn) {
      const pipeline = btn.closest('.slide')?.querySelector('.motion-pipeline') || btn.closest('.motion-pipeline');
      if (!pipeline) return;
      const stages = Array.from(pipeline.querySelectorAll('.pipeline-stage'));
      if (stages.length === 0) return;

      btn.disabled = true;
      const originalText = btn.innerHTML;
      btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline;vertical-align:-1px;margin-right:4px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>Transmitting...';

      let step = 0;
      stages.forEach(s => s.classList.remove('active-stage'));

      const interval = setInterval(() => {
        if (step < stages.length) {
          stages.forEach(s => s.classList.remove('active-stage'));
          const currentStage = stages[step];
          currentStage.classList.add('active-stage');
          if (window.gsap) {
            gsap.fromTo(currentStage, { scale: 0.94 }, { scale: 1.06, duration: 0.35, ease: "back.out(2)" });
          }
          step++;
        } else {
          clearInterval(interval);
          btn.disabled = false;
          btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline;vertical-align:-1px;margin-right:4px;"><polyline points="20 6 9 17 4 12"></polyline></svg>Complete';
          setTimeout(() => { btn.innerHTML = originalText; }, 2000);
        }
      }, 550);
    };
`;
