import { InteractiveWidgetElement, freeWidgetConfig } from "@presentation/schema";

export function renderComparisonMatrixWidget(element: InteractiveWidgetElement, container: HTMLElement): void {
    const config = freeWidgetConfig(element.config);
    const columns: string[] =
      Array.isArray(config.columns) &&
      config.columns.length > 0 &&
      config.columns.every((c) => typeof c === "string")
        ? (config.columns as string[])
        : ["Architecture", "Throughput", "Latency", "Fault Tolerance"];
    const rows: Array<{ name: string; values: string[]; status?: string }> = Array.isArray(config.rows)
      ? (config.rows as Array<{ name: string; values: string[]; status?: string }>)
      : [
      { name: "Monolithic Pattern", values: ["100K req/s", "< 1ms", "Low (Single point)", "High Efficiency"], status: "HIGH_PERF" },
      { name: "Microservices Pattern", values: ["45K req/s", "~ 15ms", "High (Isolated failures)", "Scalable Teams"], status: "MODULAR" },
      { name: "Event-Driven Stream", values: ["250K msg/s", "~ 5ms", "Guaranteed Replay", "Eventual Sync"], status: "REACTIVE" },
    ];

    const wrapper = document.createElement("div");
    wrapper.className =
      "w-full rounded-xl bg-slate-950/90 border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs";

    const table = document.createElement("table");
    table.className = "w-full text-left border-collapse";

    // Header
    const thead = document.createElement("thead");
    thead.className = "bg-slate-900/90 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400";
    let thHtml = "<tr>";
    columns.forEach((c) => {
      thHtml += `<th class="px-3.5 py-2.5">${c}</th>`;
    });
    thHtml += "</tr>";
    thead.innerHTML = thHtml;
    table.appendChild(thead);

    // Body
    const tbody = document.createElement("tbody");
    tbody.className = "divide-y divide-slate-800/60 text-[11px]";

    rows.forEach((r, idx) => {
      const tr = document.createElement("tr");
      tr.className = "hover:bg-slate-900/50 transition-colors cursor-pointer group";

      let rowHtml = `<td class="px-3.5 py-2.5 font-bold text-white flex items-center gap-2">
        <span class="w-1.5 h-1.5 rounded-full ${idx === 0 ? "bg-cyan-400" : idx === 1 ? "bg-indigo-400" : "bg-emerald-400"}"></span>
        ${r.name}
      </td>`;

      (r.values || []).forEach((v, vIdx) => {
        const isOptimal = v.toLowerCase().includes("high") || v.toLowerCase().includes("100k") || v.toLowerCase().includes("< 1ms") || v.toLowerCase().includes("guaranteed");
        rowHtml += `<td class="px-3.5 py-2.5 ${isOptimal ? "text-emerald-400 font-semibold" : "text-slate-300"}">${v}</td>`;
      });

      tr.innerHTML = rowHtml;
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
    container.appendChild(wrapper);
  }
