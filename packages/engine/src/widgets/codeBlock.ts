import { InteractiveWidgetElement, freeWidgetConfig, textOr } from "@presentation/schema";

export function renderCodeBlockWidget(element: InteractiveWidgetElement, container: HTMLElement): void {
    const config = freeWidgetConfig(element.config);
    const legacyCode: unknown = (element as unknown as { code?: unknown }).code;
    const code = (textOr(config.code) ?? textOr(legacyCode)) || `// Production Architecture Implementation
function evaluateConsensus(quorum: number, nodes: Node[]): ConsensusState {
  const activeVotes = nodes.filter(n => n.hasVoted && n.isHealthy).length;
  const isSupermajority = activeVotes >= Math.floor(quorum / 2) + 1;
  return { committed: isSupermajority, timestamp: Date.now() };
}`;
    const language = textOr(config.language) ?? "typescript";
    const filename = textOr(config.filename) ?? `${language}_impl.${language === "python" ? "py" : language === "rust" ? "rs" : "ts"}`;

    const wrapper = document.createElement("div");
    wrapper.className =
      "w-full rounded-xl bg-slate-950/90 border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs";

    // Code Window Top Bar
    const topBar = document.createElement("div");
    topBar.className =
      "px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between";
    topBar.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
          <span class="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
        </div>
        <span class="text-slate-400 text-[11px] font-semibold ml-2">${filename}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">${language}</span>
        <button class="btn-copy-code px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] transition-colors">Copy</button>
      </div>
    `;
    wrapper.appendChild(topBar);

    // Code Content with Line Numbers
    const codeBody = document.createElement("div");
    codeBody.className = "p-3.5 max-h-56 overflow-y-auto flex gap-3 text-[11px] leading-relaxed select-text";

    const lines = code.split("\n");
    const lineNums = document.createElement("div");
    lineNums.className = "text-slate-600 select-none text-right pr-2 border-r border-slate-800/80";
    lineNums.innerHTML = lines.map((_: string, i: number) => `<div>${i + 1}</div>`).join("");

    const codeLines = document.createElement("pre");
    codeLines.className = "flex-1 text-slate-200 overflow-x-auto whitespace-pre font-mono";
    
    // Highlight syntax tokens lightly
    const formatted = code
      .replace(/(function|const|let|var|return|if|else|import|export|class|type|interface)\b/g, '<span class="text-purple-400 font-bold">$1</span>')
      .replace(/(true|false|null|undefined|\d+)/g, '<span class="text-amber-300">$1</span>')
      .replace(/(".*?"|'.*?'|`.*?`)/g, '<span class="text-emerald-300">$1</span>')
      .replace(/(\/\/.*$)/gm, '<span class="text-slate-500 italic">$1</span>');

    codeLines.innerHTML = formatted;

    codeBody.appendChild(lineNums);
    codeBody.appendChild(codeLines);
    wrapper.appendChild(codeBody);

    const copyBtn = topBar.querySelector(".btn-copy-code") as HTMLButtonElement;
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(code);
      copyBtn.textContent = "Copied!";
      copyBtn.className = "btn-copy-code px-2 py-0.5 rounded bg-emerald-600/30 text-emerald-300 text-[10px]";
      setTimeout(() => {
        copyBtn.textContent = "Copy";
        copyBtn.className = "btn-copy-code px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]";
      }, 1500);
    });

    container.appendChild(wrapper);
  }
