/**
 * Dynamic Graph & Algorithm Execution Stepper Runtime for Keynox
 * 
 * Automatically initializes .graph-stepper-container elements:
 * 1. Reads data-graph='{"nodes":[{"id":"A","label":"A"},...],"edges":[["A","B"],...]}'
 * 2. Calculates 2D spatial layout and renders an interactive SVG graph with directed arrows.
 * 3. Runs dynamic step-by-step BFS, DFS, or custom traversal algorithms.
 * 4. Animates active node highlighting, OPEN queue, CLOSED set, and step trace table.
 */

export const GRAPH_STEPPER_RUNTIME = `
    function initGraphSteppers(container = document) {
      const steppers = container.querySelectorAll('.graph-stepper-container');
      steppers.forEach((el) => {
        if (el.dataset.initialized === 'true') return;
        el.dataset.initialized = 'true';

        try {
          const rawGraph = el.getAttribute('data-graph') || '{"nodes":[],"edges":[]}';
          const graphData = JSON.parse(rawGraph);
          const algorithm = (el.getAttribute('data-algorithm') || 'bfs').toLowerCase();
          const startNodeId = el.getAttribute('data-start-node') || (graphData.nodes[0] ? graphData.nodes[0].id : '');
          const goalNodeId = el.getAttribute('data-goal-node') || '';

          if (!graphData.nodes || graphData.nodes.length === 0) return;

          const steps = computeGraphAlgorithmSteps(graphData, algorithm, startNodeId, goalNodeId);
          let currentStepIdx = 0;

          setupStepperDom(el, graphData, steps, (newIdx) => {
            currentStepIdx = newIdx;
            renderStepState(el, graphData, steps[currentStepIdx], currentStepIdx, steps.length);
          });

          renderStepState(el, graphData, steps[0], 0, steps.length);
        } catch (err) {
          console.warn('[KeynoxGraphStepper] Setup error:', err);
        }
      });
    }

    function computeGraphAlgorithmSteps(graphData, algorithm, startId, goalId) {
      const nodes = graphData.nodes;
      const edges = graphData.edges || [];
      
      const adj = {};
      nodes.forEach(n => { adj[n.id] = []; });
      edges.forEach(([u, v]) => {
        if (adj[u] && !adj[u].includes(v)) adj[u].push(v);
      });

      const steps = [];

      if (algorithm === 'bfs' || algorithm === 'breadth-first') {
        let open = [startId];
        let closed = [];
        
        steps.push({
          stepIdx: 0,
          activeNode: null,
          open: [...open],
          closed: [...closed],
          desc: \`Initialized OPEN queue with start node [\${startId}]\`
        });

        let iter = 1;
        while (open.length > 0) {
          const x = open.shift();
          closed.push(x);
          
          const children = (adj[x] || []).filter(c => !open.includes(c) && !closed.includes(c));
          open.push(...children);

          steps.push({
            stepIdx: iter,
            activeNode: x,
            open: [...open],
            closed: [...closed],
            children: [...children],
            desc: \`Iteration \${iter}: Dequeued X = \${x}. Enqueued children [\${children.join(', ')}]\`
          });

          if (x === goalId) break;
          iter++;
        }
      } else if (algorithm === 'dfs' || algorithm === 'depth-first') {
        let open = [startId];
        let closed = [];

        steps.push({
          stepIdx: 0,
          activeNode: null,
          open: [...open],
          closed: [...closed],
          desc: \`Initialized OPEN stack with start node [\${startId}]\`
        });

        let iter = 1;
        while (open.length > 0) {
          const x = open.pop();
          closed.push(x);

          const children = (adj[x] || []).filter(c => !open.includes(c) && !closed.includes(c));
          open.push(...children.slice().reverse());

          steps.push({
            stepIdx: iter,
            activeNode: x,
            open: [...open],
            closed: [...closed],
            children: [...children],
            desc: \`Iteration \${iter}: Popped X = \${x}. Pushed children [\${children.join(', ')}]\`
          });

          if (x === goalId) break;
          iter++;
        }
      } else {
        steps.push({
          stepIdx: 0,
          activeNode: startId,
          open: [startId],
          closed: [],
          desc: 'Graph topology overview'
        });
      }

      return steps;
    }

    function setupStepperDom(container, graphData, steps, onStepChange) {
      let controls = container.querySelector('.stepper-controls');
      let viewport = container.querySelector('.stepper-visual-viewport');
      let stateBuffer = container.querySelector('.stepper-state-buffer');
      let traceTable = container.querySelector('.stepper-trace-table');

      if (!controls) {
        controls = document.createElement('div');
        controls.className = 'stepper-controls';
        controls.style.cssText = 'display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; gap:12px;';
        controls.innerHTML = \`
          <div style="display:flex; gap:8px; align-items:center;">
            <button class="sim-play-btn btn-prev-step" style="padding:4px 12px;">◀ Prev</button>
            <button class="sim-play-btn btn-next-step" style="padding:4px 12px;">Next ▶</button>
            <button class="sim-play-btn btn-auto-play" style="padding:4px 12px;">▶ Auto Play</button>
          </div>
          <span class="stepper-status-badge badge badge-cyan" style="font-family:var(--font-mono); font-size:11px;">Step 0 / \${steps.length - 1}</span>
        \`;
        container.insertBefore(controls, container.firstChild);
      }

      let currentStep = 0;
      let autoPlayTimer = null;

      const update = (idx) => {
        currentStep = Math.max(0, Math.min(steps.length - 1, idx));
        const badge = controls.querySelector('.stepper-status-badge');
        if (badge) badge.textContent = \`Step \${currentStep} / \${steps.length - 1}\`;
        onStepChange(currentStep);
      };

      const btnPrev = controls.querySelector('.btn-prev-step');
      const btnNext = controls.querySelector('.btn-next-step');
      const btnAuto = controls.querySelector('.btn-auto-play');

      if (btnPrev) btnPrev.onclick = () => { stopAuto(); update(currentStep - 1); };
      if (btnNext) btnNext.onclick = () => { stopAuto(); update(currentStep + 1); };
      if (btnAuto) {
        btnAuto.onclick = () => {
          if (autoPlayTimer) {
            stopAuto();
          } else {
            btnAuto.textContent = '⏸ Pause';
            autoPlayTimer = setInterval(() => {
              if (currentStep < steps.length - 1) {
                update(currentStep + 1);
              } else {
                stopAuto();
              }
            }, 850);
          }
        };
      }

      function stopAuto() {
        if (autoPlayTimer) {
          clearInterval(autoPlayTimer);
          autoPlayTimer = null;
          if (btnAuto) btnAuto.textContent = '▶ Auto Play';
        }
      }

      if (!viewport) {
        viewport = document.createElement('div');
        viewport.className = 'stepper-visual-viewport';
        viewport.style.cssText = 'width:100%; height:240px; background:#080c16; border:1px solid var(--border-subtle); border-radius:12px; position:relative; margin-bottom:12px; overflow:hidden;';
        container.appendChild(viewport);
      }

      renderGraphSvg(viewport, graphData);

      if (!stateBuffer) {
        stateBuffer = document.createElement('div');
        stateBuffer.className = 'stepper-state-buffer';
        stateBuffer.style.cssText = 'display:grid; grid-template-columns:1.4fr 1fr 1fr; gap:10px; margin-bottom:12px;';
        stateBuffer.innerHTML = \`
          <div class="glass-card" style="padding:10px 14px;"><span style="font-size:10px; color:var(--text-muted); font-family:var(--font-mono); font-weight:800;">OPEN QUEUE (FIFO)</span><div class="buffer-open" style="font-family:var(--font-mono); font-weight:700; color:var(--accent-cyan); font-size:13.5px; margin-top:3px;">[]</div></div>
          <div class="glass-card" style="padding:10px 14px;"><span style="font-size:10px; color:var(--text-muted); font-family:var(--font-mono); font-weight:800;">EXPANDED NODE (X)</span><div class="buffer-active" style="font-family:var(--font-mono); font-weight:700; color:var(--accent-amber); font-size:13.5px; margin-top:3px;">None</div></div>
          <div class="glass-card" style="padding:10px 14px;"><span style="font-size:10px; color:var(--text-muted); font-family:var(--font-mono); font-weight:800;">CLOSED SET</span><div class="buffer-closed" style="font-family:var(--font-mono); font-weight:700; color:var(--accent-emerald); font-size:13.5px; margin-top:3px;">[]</div></div>
        \`;
        container.appendChild(stateBuffer);
      }

      if (!traceTable) {
        traceTable = document.createElement('table');
        traceTable.className = 'matrix-table stepper-trace-table';
        traceTable.style.cssText = 'width:100%; margin-top:6px; font-size:13px;';
        traceTable.innerHTML = \`
          <thead>
            <tr><th>Iteration (i)</th><th>Expanded (X)</th><th>[OPEN] Queue</th><th>CLOSED Set</th></tr>
          </thead>
          <tbody></tbody>
        \`;
        container.appendChild(traceTable);

        const tbody = traceTable.querySelector('tbody');
        steps.forEach((stg, i) => {
          if (i === 0) return;
          const tr = document.createElement('tr');
          tr.setAttribute('data-step-idx', i);
          tr.style.cursor = 'pointer';
          tr.onclick = () => update(i);
          tr.innerHTML = \`
            <td><b>\${stg.stepIdx}</b></td>
            <td><span class="badge badge-amber">\${stg.activeNode || '-'}</span></td>
            <td><code style="color:var(--accent-cyan);">[\${stg.open.join(', ')}]</code></td>
            <td><code style="color:var(--accent-emerald);">[\${stg.closed.join(', ')}]</code></td>
          \`;
          tbody.appendChild(tr);
        });
      }
    }

    function renderGraphSvg(viewport, graphData) {
      const width = viewport.clientWidth || 550;
      const height = 240;
      
      const nodes = graphData.nodes;
      const edges = graphData.edges || [];
      
      const levels = {};
      const rootId = nodes[0] ? nodes[0].id : '';
      levels[rootId] = 0;
      const q = [rootId];
      while (q.length > 0) {
        const curr = q.shift();
        const currLvl = levels[curr];
        edges.forEach(([u, v]) => {
          if (u === curr && levels[v] === undefined) {
            levels[v] = currLvl + 1;
            q.push(v);
          }
        });
      }

      const levelGroups = {};
      nodes.forEach(n => {
        const lvl = levels[n.id] !== undefined ? levels[n.id] : 1;
        if (!levelGroups[lvl]) levelGroups[lvl] = [];
        levelGroups[lvl].push(n);
      });

      const maxLvl = Math.max(...Object.keys(levelGroups).map(Number), 0);
      const nodeCoords = {};

      Object.keys(levelGroups).forEach(lvlStr => {
        const lvl = Number(lvlStr);
        const group = levelGroups[lvl];
        const y = 40 + (lvl / (maxLvl || 1)) * (height - 80);
        group.forEach((node, idx) => {
          const x = ((idx + 1) / (group.length + 1)) * width;
          nodeCoords[node.id] = { x, y, label: node.label || node.id };
        });
      });

      let svg = viewport.querySelector('svg');
      if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', \`0 0 \${width} \${height}\`);
        viewport.appendChild(svg);
      }
      svg.innerHTML = '';

      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      defs.innerHTML = \`
        <marker id="arrowhead" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
        </marker>
      \`;
      svg.appendChild(defs);

      edges.forEach(([u, v]) => {
        const c1 = nodeCoords[u];
        const c2 = nodeCoords[v];
        if (c1 && c2) {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', c1.x);
          line.setAttribute('y1', c1.y);
          line.setAttribute('x2', c2.x);
          line.setAttribute('y2', c2.y);
          line.setAttribute('stroke', 'rgba(255,255,255,0.25)');
          line.setAttribute('stroke-width', '1.8');
          line.setAttribute('marker-end', 'url(#arrowhead)');
          svg.appendChild(line);
        }
      });

      nodes.forEach(n => {
        const coord = nodeCoords[n.id];
        if (!coord) return;

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('data-node-id', n.id);
        g.setAttribute('transform', \`translate(\${coord.x}, \${coord.y})\`);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', '17');
        circle.setAttribute('fill', '#0f172a');
        circle.setAttribute('stroke', '#38bdf8');
        circle.setAttribute('stroke-width', '2');
        circle.style.transition = 'all 0.3s ease';

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dy', '4.5');
        text.setAttribute('fill', '#fff');
        text.setAttribute('font-family', 'var(--font-mono, monospace)');
        text.setAttribute('font-size', '11.5');
        text.setAttribute('font-weight', 'bold');
        text.textContent = n.id;

        g.appendChild(circle);
        g.appendChild(text);
        svg.appendChild(g);
      });
    }

    function renderStepState(container, graphData, stepState, stepIdx, totalSteps) {
      if (!stepState) return;

      const bufOpen = container.querySelector('.buffer-open');
      const bufClosed = container.querySelector('.buffer-closed');
      const bufActive = container.querySelector('.buffer-active');

      if (bufOpen) bufOpen.textContent = \`[\${stepState.open.join(', ')}]\`;
      if (bufClosed) bufClosed.textContent = \`[\${stepState.closed.join(', ')}]\`;
      if (bufActive) bufActive.textContent = stepState.activeNode ? stepState.activeNode : 'None';

      const svg = container.querySelector('svg');
      if (svg) {
        graphData.nodes.forEach(n => {
          const nodeG = svg.querySelector(\`[data-node-id="\${n.id}"]\`);
          if (!nodeG) return;
          const circle = nodeG.querySelector('circle');
          if (!circle) return;

          if (n.id === stepState.activeNode) {
            circle.setAttribute('fill', '#f59e0b');
            circle.setAttribute('stroke', '#fff');
            circle.setAttribute('stroke-width', '3.5');
            circle.style.filter = 'drop-shadow(0 0 10px #f59e0b)';
          } else if (stepState.open.includes(n.id)) {
            circle.setAttribute('fill', 'rgba(56, 189, 248, 0.25)');
            circle.setAttribute('stroke', '#38bdf8');
            circle.setAttribute('stroke-width', '2.5');
            circle.style.filter = 'drop-shadow(0 0 6px #38bdf8)';
          } else if (stepState.closed.includes(n.id)) {
            circle.setAttribute('fill', 'rgba(16, 185, 129, 0.25)');
            circle.setAttribute('stroke', '#10b981');
            circle.setAttribute('stroke-width', '2');
            circle.style.filter = 'drop-shadow(0 0 4px #10b981)';
          } else {
            circle.setAttribute('fill', '#0f172a');
            circle.setAttribute('stroke', 'rgba(255,255,255,0.2)');
            circle.setAttribute('stroke-width', '1.5');
            circle.style.filter = 'none';
          }
        });
      }

      const table = container.querySelector('.stepper-trace-table');
      if (table) {
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(tr => {
          const rowIdx = Number(tr.getAttribute('data-step-idx'));
          if (rowIdx === stepIdx) {
            tr.style.background = 'rgba(56, 189, 248, 0.15)';
            tr.style.borderLeft = '3px solid var(--accent-cyan)';
          } else {
            tr.style.background = 'transparent';
            tr.style.borderLeft = 'none';
          }
        });
      }
    }
`;
