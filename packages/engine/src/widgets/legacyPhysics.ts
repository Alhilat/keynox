import { InteractiveWidgetElement } from "@presentation/schema";

export function renderLegacyPhysicsWidget(element: InteractiveWidgetElement, container: HTMLElement): void {
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col gap-3 w-full";

    let mass = 2; // kg
    let force = 10; // N

    const controls = document.createElement("div");
    controls.className = "grid grid-cols-2 gap-3";
    controls.innerHTML = `
      <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
        <div class="flex justify-between text-xs font-mono mb-1.5">
          <span class="text-slate-400">Mass (m):</span>
          <span class="mass-val text-blue-400 font-bold">2 kg</span>
        </div>
        <input type="range" min="0.5" max="10" step="0.5" value="2" class="mass-slider w-full accent-blue-500 cursor-pointer" />
      </div>
      <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
        <div class="flex justify-between text-xs font-mono mb-1.5">
          <span class="text-slate-400">Force (F):</span>
          <span class="force-val text-emerald-400 font-bold">10 N</span>
        </div>
        <input type="range" min="1" max="50" step="1" value="10" class="force-slider w-full accent-emerald-500 cursor-pointer" />
      </div>
    `;
    wrapper.appendChild(controls);

    const readout = document.createElement("div");
    readout.className =
      "p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between";
    readout.innerHTML = `
      <div class="font-mono text-xs text-slate-300">
        Newton's 2nd Law: <span class="text-white font-bold">a = F / m</span>
      </div>
      <div class="accel-val px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-sm">
        a = 5.0 m/s²
      </div>
    `;
    wrapper.appendChild(readout);

    const massSlider = controls.querySelector(".mass-slider") as HTMLInputElement;
    const forceSlider = controls.querySelector(".force-slider") as HTMLInputElement;
    const massVal = controls.querySelector(".mass-val") as HTMLElement;
    const forceVal = controls.querySelector(".force-val") as HTMLElement;
    const accelVal = readout.querySelector(".accel-val") as HTMLElement;

    const updatePhysics = () => {
      mass = parseFloat(massSlider.value);
      force = parseFloat(forceSlider.value);
      const accel = (force / Math.max(0.1, mass)).toFixed(1);
      massVal.textContent = `${mass} kg`;
      forceVal.textContent = `${force} N`;
      accelVal.textContent = `a = ${accel} m/s²`;
    };

    massSlider.addEventListener("input", updatePhysics);
    forceSlider.addEventListener("input", updatePhysics);

    container.appendChild(wrapper);
  }
