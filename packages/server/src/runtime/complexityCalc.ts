/**
 * Quantitative Complexity & Space/Time Calculator Runtime for Keynox
 * 
 * Automatically initializes .calc-workbench elements:
 * Reads sliders for Branching Factor (b) and Depth (d) and calculates
 * Nodes Expanded, Execution Time, and Memory Allocation in real-time!
 */

export const COMPLEXITY_CALC_RUNTIME = `
    function initComplexityCalculators(container = document) {
      const calcs = container.querySelectorAll('.calc-workbench');
      calcs.forEach((el) => {
        if (el.dataset.initialized === 'true') return;
        el.dataset.initialized = 'true';

        const bSlider = el.querySelector('.slider-branching');
        const dSlider = el.querySelector('.slider-depth');
        const bValReadout = el.querySelector('.readout-branching');
        const dValReadout = el.querySelector('.readout-depth');

        const nodesReadout = el.querySelector('.calc-val-nodes');
        const timeReadout = el.querySelector('.calc-val-time');
        const memoryReadout = el.querySelector('.calc-val-memory');

        const nodeRate = Number(el.getAttribute('data-nodes-per-sec') || 1000);
        const bytesPerNode = Number(el.getAttribute('data-bytes-per-node') || 100);

        function update() {
          const b = bSlider ? Number(bSlider.value) : 10;
          const d = dSlider ? Number(dSlider.value) : 4;

          if (bValReadout) bValReadout.textContent = b;
          if (dValReadout) dValReadout.textContent = d;

          const totalNodes = Math.pow(b, d);

          if (nodesReadout) {
            nodesReadout.textContent = totalNodes >= 1e9 ? totalNodes.toExponential(2) : totalNodes.toLocaleString();
          }

          const totalSeconds = totalNodes / nodeRate;
          if (timeReadout) {
            timeReadout.textContent = formatTimeString(totalSeconds);
          }

          const totalBytes = totalNodes * bytesPerNode;
          if (memoryReadout) {
            memoryReadout.textContent = formatBytesString(totalBytes);
          }
        }

        if (bSlider) bSlider.addEventListener('input', update);
        if (dSlider) dSlider.addEventListener('input', update);

        update();
      });
    }

    function formatTimeString(sec) {
      if (sec < 0.001) return '< 1 ms';
      if (sec < 1) return Math.round(sec * 1000) + ' ms';
      if (sec < 60) return Math.round(sec * 10) / 10 + ' seconds';
      if (sec < 3600) return Math.round(sec / 60) + ' minutes';
      if (sec < 86400) return Math.round(sec / 3600) + ' hours';
      if (sec < 31536000) return Math.round(sec / 86400) + ' days';
      return Math.round(sec / 31536000) + ' years';
    }

    function formatBytesString(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
      if (bytes < 1073741824) return Math.round(bytes / 1048576) + ' MB';
      if (bytes < 1099511627776) return Math.round((bytes / 1073741824) * 10) / 10 + ' GB';
      return Math.round((bytes / 1099511627776) * 10) / 10 + ' TB';
    }
`;
