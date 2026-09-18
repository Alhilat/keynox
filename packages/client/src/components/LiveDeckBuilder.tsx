import React from "react";
import { Sparkles, BrainCircuit, Cpu, Layers, CheckCircle2 } from "lucide-react";

interface LiveDeckBuilderProps {
  topic: string;
  phaseMessage?: string;
  reasoningSnippet?: string;
}

export const LiveDeckBuilder: React.FC<LiveDeckBuilderProps> = ({
  topic,
  phaseMessage,
  reasoningSnippet,
}) => {
  return (
    <div className="relative w-full aspect-[16/9] max-h-[580px] bg-[#090d16] rounded-2xl overflow-hidden shadow-2xl border border-blue-500/30 flex flex-col p-8 md:p-10 select-none justify-between animate-fadeIn">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />

      {/* Top Accent Gradient Bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 animate-pulse" />

      {/* Header Bar */}
      <div className="flex items-center justify-between z-10 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                LIVE COMPILER
              </span>
              <span className="text-xs text-slate-400 font-mono">Building Keynote Presentation</span>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white tracking-tight truncate max-w-lg mt-0.5">
              {topic}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400">
          <Cpu className="w-3.5 h-3.5 animate-pulse" />
          <span>DeepSeek Synthesis</span>
        </div>
      </div>

      {/* Live Skeleton Deck Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-auto z-10">
        {/* Card 1 Blueprint */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-blue-500/30 shadow-xl flex flex-col justify-between h-44 relative overflow-hidden backdrop-blur">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500/60" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
              SLIDE 01 &bull; OVERVIEW
            </span>
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          </div>
          <div className="space-y-2 my-auto">
            <div className="h-4 bg-slate-800 rounded w-4/5 animate-pulse" />
            <div className="h-2.5 bg-slate-800/60 rounded w-full animate-pulse" />
            <div className="h-2.5 bg-slate-800/60 rounded w-3/4 animate-pulse" />
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Executive Brief</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
          </div>
        </div>

        {/* Card 2 Blueprint */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-indigo-500/30 shadow-xl flex flex-col justify-between h-44 relative overflow-hidden backdrop-blur">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500/60" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
              SLIDE 02 &bull; ARCHITECTURE
            </span>
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          </div>
          <div className="space-y-2 my-auto">
            <div className="h-4 bg-slate-800 rounded w-3/5 animate-pulse" />
            <div className="h-2.5 bg-slate-800/60 rounded w-full animate-pulse" />
            <div className="h-2.5 bg-slate-800/60 rounded w-2/3 animate-pulse" />
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Core Pillars</span>
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
          </div>
        </div>

        {/* Card 3 Blueprint */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-emerald-500/30 shadow-xl flex flex-col justify-between h-44 relative overflow-hidden backdrop-blur">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500/60" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              SLIDE 03 &bull; APPLICATIONS
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="space-y-2 my-auto">
            <div className="h-4 bg-slate-800 rounded w-2/3 animate-pulse" />
            <div className="h-2.5 bg-slate-800/60 rounded w-full animate-pulse" />
            <div className="h-2.5 bg-slate-800/60 rounded w-4/5 animate-pulse" />
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Execution & Impact</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Real-Time Telemetry & Progress Footer */}
      <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2.5 text-xs text-slate-300 font-mono">
          <BrainCircuit className="w-4 h-4 text-blue-400 shrink-0 animate-pulse" />
          <span className="text-blue-300 font-medium">
            {phaseMessage || "Structuring responsive slide cards & step timelines..."}
          </span>
        </div>

        {reasoningSnippet && (
          <div className="text-[11px] text-slate-400 font-mono truncate max-w-sm sm:text-right">
            &ldquo;{reasoningSnippet.slice(-60)}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
};
