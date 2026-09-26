import { InteractiveWidgetElement, freeWidgetConfig } from "@presentation/schema";

export function renderBooleanSimulatorWidget(element: InteractiveWidgetElement, container: HTMLElement): void {
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col gap-3 w-full";

    let stateA = true;
    let stateB = false;

    // Signal Controls Row
    const controlsRow = document.createElement("div");
    controlsRow.className = "grid grid-cols-2 gap-3";

    const btnA = document.createElement("button");
    btnA.type = "button";
    btnA.className =
      "p-2.5 rounded-xl border flex items-center justify-between transition-all duration-200 cursor-pointer shadow-md active:scale-95";

    const btnB = document.createElement("button");
    btnB.type = "button";
    btnB.className =
      "p-2.5 rounded-xl border flex items-center justify-between transition-all duration-200 cursor-pointer shadow-md active:scale-95";

    controlsRow.appendChild(btnA);
    controlsRow.appendChild(btnB);
    wrapper.appendChild(controlsRow);

    // Gates Grid (4 gates: AND, OR, NOT, XOR)
    const gatesGrid = document.createElement("div");
    gatesGrid.className = "grid grid-cols-4 gap-2";

    const createGateBox = (name: string, formula: string, rule: string) => {
      const box = document.createElement("div");
      box.className =
        "p-2.5 rounded-xl border transition-all duration-200 flex flex-col justify-between";
      box.innerHTML = `
        <div class="flex items-center justify-between mb-1">
          <span class="text-[10px] font-mono font-bold text-slate-400">${name}</span>
          <div class="gate-led w-2 h-2 rounded-full transition-all"></div>
        </div>
        <div class="gate-val text-sm font-mono font-black my-0.5 transition-all"></div>
        <div class="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-0.5">
          <span>${formula}</span>
          <span class="truncate max-w-[65px]">${rule}</span>
        </div>
      `;
      return box;
    };

    const andBox = createGateBox("AND", "A ∧ B", "Both 1");
    const orBox = createGateBox("OR", "A ∨ B", "Either 1");
    const notBox = createGateBox("NOT", "¬A", "Invert A");
    const xorBox = createGateBox("XOR", "A ⊕ B", "Strictly 1");

    gatesGrid.appendChild(andBox);
    gatesGrid.appendChild(orBox);
    gatesGrid.appendChild(notBox);
    gatesGrid.appendChild(xorBox);
    wrapper.appendChild(gatesGrid);

    // Live Interactive Truth Table
    const ttWrapper = document.createElement("div");
    ttWrapper.className =
      "p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] font-mono";
    ttWrapper.innerHTML = `
      <div class="flex items-center justify-between text-slate-500 font-bold border-b border-slate-800 pb-1 mb-1 px-2">
        <span>A</span><span>B</span><span>A ∧ B</span><span>A ∨ B</span><span>¬A</span><span>A ⊕ B</span><span>TRUTH STATE</span>
      </div>
      <div class="tt-rows flex flex-col gap-0.5">
        <div data-state="00" class="tt-row flex items-center justify-between px-2 py-0.5 rounded transition-all">
          <span>0</span><span>0</span><span>0</span><span>0</span><span>1</span><span>0</span><span class="tt-tag opacity-0 text-[9px] font-bold text-cyan-400">ACTIVE ROW</span>
        </div>
        <div data-state="01" class="tt-row flex items-center justify-between px-2 py-0.5 rounded transition-all">
          <span>0</span><span>1</span><span>0</span><span>1</span><span>1</span><span>1</span><span class="tt-tag opacity-0 text-[9px] font-bold text-cyan-400">ACTIVE ROW</span>
        </div>
        <div data-state="10" class="tt-row flex items-center justify-between px-2 py-0.5 rounded transition-all">
          <span>1</span><span>0</span><span>0</span><span>1</span><span>0</span><span>1</span><span class="tt-tag opacity-0 text-[9px] font-bold text-cyan-400">ACTIVE ROW</span>
        </div>
        <div data-state="11" class="tt-row flex items-center justify-between px-2 py-0.5 rounded transition-all">
          <span>1</span><span>1</span><span>1</span><span>1</span><span>0</span><span>0</span><span class="tt-tag opacity-0 text-[9px] font-bold text-cyan-400">ACTIVE ROW</span>
        </div>
      </div>
    `;
    wrapper.appendChild(ttWrapper);

    const updateUI = () => {
      // Button A
      if (stateA) {
        btnA.className =
          "p-2.5 rounded-xl border border-emerald-500/60 bg-emerald-950/40 text-white flex items-center justify-between shadow-lg shadow-emerald-500/15 cursor-pointer transition-all";
        btnA.innerHTML = `
          <div class="text-left">
            <span class="text-[9px] font-mono text-emerald-400 uppercase font-bold block">SIGNAL A (HIGH)</span>
            <span class="text-xs font-mono font-bold">Input A: 1 (TRUE)</span>
          </div>
          <span class="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-mono font-black">HIGH</span>
        `;
      } else {
        btnA.className =
          "p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-400 flex items-center justify-between cursor-pointer hover:border-slate-700 transition-all";
        btnA.innerHTML = `
          <div class="text-left">
            <span class="text-[9px] font-mono text-slate-500 uppercase font-bold block">SIGNAL A (LOW)</span>
            <span class="text-xs font-mono font-bold">Input A: 0 (FALSE)</span>
          </div>
          <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono font-bold">LOW</span>
        `;
      }

      // Button B
      if (stateB) {
        btnB.className =
          "p-2.5 rounded-xl border border-emerald-500/60 bg-emerald-950/40 text-white flex items-center justify-between shadow-lg shadow-emerald-500/15 cursor-pointer transition-all";
        btnB.innerHTML = `
          <div class="text-left">
            <span class="text-[9px] font-mono text-emerald-400 uppercase font-bold block">SIGNAL B (HIGH)</span>
            <span class="text-xs font-mono font-bold">Input B: 1 (TRUE)</span>
          </div>
          <span class="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-mono font-black">HIGH</span>
        `;
      } else {
        btnB.className =
          "p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-400 flex items-center justify-between cursor-pointer hover:border-slate-700 transition-all";
        btnB.innerHTML = `
          <div class="text-left">
            <span class="text-[9px] font-mono text-slate-500 uppercase font-bold block">SIGNAL B (LOW)</span>
            <span class="text-xs font-mono font-bold">Input B: 0 (FALSE)</span>
          </div>
          <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono font-bold">LOW</span>
        `;
      }

      const andVal = stateA && stateB;
      const orVal = stateA || stateB;
      const notVal = !stateA;
      const xorVal = (stateA || stateB) && !(stateA && stateB);

      const updateGateBox = (box: HTMLElement, val: boolean) => {
        const led = box.querySelector(".gate-led") as HTMLElement;
        const text = box.querySelector(".gate-val") as HTMLElement;
        if (val) {
          box.className =
            "p-2.5 rounded-xl border border-emerald-500/60 bg-emerald-950/30 text-white shadow-lg shadow-emerald-500/15 flex flex-col justify-between transition-all";
          led.className =
            "gate-led w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981] animate-pulse";
          text.className = "gate-val text-sm font-mono font-black my-0.5 text-emerald-400";
          text.textContent = "TRUE (1)";
        } else {
          box.className =
            "p-2.5 rounded-xl border border-slate-800 bg-slate-950/50 text-slate-400 flex flex-col justify-between transition-all";
          led.className = "gate-led w-2 h-2 rounded-full bg-slate-700";
          text.className = "gate-val text-sm font-mono font-black my-0.5 text-slate-500";
          text.textContent = "FALSE (0)";
        }
      };

      updateGateBox(andBox, andVal);
      updateGateBox(orBox, orVal);
      updateGateBox(notBox, notVal);
      updateGateBox(xorBox, xorVal);

      // Truth Table Highlight
      const activeStateKey = `${stateA ? "1" : "0"}${stateB ? "1" : "0"}`;
      ttWrapper.querySelectorAll(".tt-row").forEach((row) => {
        const el = row as HTMLElement;
        const tag = el.querySelector(".tt-tag") as HTMLElement;
        if (el.getAttribute("data-state") === activeStateKey) {
          el.className =
            "tt-row flex items-center justify-between px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/50 text-cyan-200 font-bold transition-all shadow-sm";
          if (tag) tag.style.opacity = "1";
        } else {
          el.className =
            "tt-row flex items-center justify-between px-2 py-0.5 rounded text-slate-400 opacity-50 transition-all";
          if (tag) tag.style.opacity = "0";
        }
      });
    };

    btnA.addEventListener("click", () => {
      stateA = !stateA;
      updateUI();
    });

    btnB.addEventListener("click", () => {
      stateB = !stateB;
      updateUI();
    });

    updateUI();
    container.appendChild(wrapper);
  }
