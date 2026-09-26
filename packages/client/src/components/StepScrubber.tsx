import React from "react";
import { Step } from "@presentation/schema";
import { Check } from "lucide-react";

interface StepScrubberProps {
  steps: Step[];
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
}

export const StepScrubber: React.FC<StepScrubberProps> = ({
  steps,
  currentStepIndex,
  onSelectStep,
}) => {
  return (
    <div className="w-full bg-slate-950/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-3.5 my-3 shadow-lg">
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          <span className="font-bold tracking-wider uppercase text-slate-300">Sequential Step Flow</span>
        </div>
        <span className="text-[10px] text-slate-500 font-sans">Click step to jump</span>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
        {steps.map((step, idx) => {
          const isPassed = idx < currentStepIndex;
          const isActive = idx === currentStepIndex;

          return (
            <button
              key={step.id || idx}
              onClick={() => onSelectStep(idx)}
              className={`group flex-shrink-0 flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                isActive
                  ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/60 shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-500/30 font-semibold"
                  : isPassed
                  ? "bg-slate-900/70 text-slate-300 border-slate-800 hover:bg-slate-850 hover:border-slate-700"
                  : "bg-slate-950/40 text-slate-500 border-slate-900 hover:text-slate-400 hover:border-slate-800"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isActive
                    ? "bg-cyan-400 text-slate-950 shadow-sm shadow-cyan-400/50"
                    : isPassed
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {isPassed ? <Check className="w-2.5 h-2.5" /> : idx + 1}
              </div>
              <span className="truncate max-w-[130px]">{step.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
