import React from "react";
import { Scene } from "@presentation/schema";
import { Layers, ChevronRight, Sparkles, Activity } from "lucide-react";

interface SlideNavigatorProps {
  scenes: Scene[];
  currentSceneIndex: number;
  onSelectScene: (index: number) => void;
}

export const SlideNavigator: React.FC<SlideNavigatorProps> = ({
  scenes,
  currentSceneIndex,
  onSelectScene,
}) => {
  return (
    <div className="w-68 bg-slate-950/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl flex flex-col p-3 shrink-0 select-none overflow-y-auto hidden md:flex shadow-xl max-h-[620px] custom-scrollbar">
      <div className="flex items-center justify-between px-2 py-2 mb-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
          <span>Slide Deck</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
          {scenes.length} Slides
        </span>
      </div>

      <div className="space-y-2.5">
        {scenes.map((scene, idx) => {
          const isActive = idx === currentSceneIndex;
          return (
            <button
              key={scene.id || idx}
              onClick={() => onSelectScene(idx)}
              className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1.5 relative group ${
                isActive
                  ? "bg-cyan-500/10 border-cyan-500/60 shadow-lg shadow-cyan-500/10"
                  : "bg-slate-900/50 border-slate-800/70 hover:border-slate-700 hover:bg-slate-850/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? "bg-cyan-500 text-slate-950 font-black shadow-sm"
                      : "bg-slate-800 text-slate-400 group-hover:text-slate-200"
                  }`}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-800">
                  {scene.category || scene.layout || "SLIDE"}
                </span>
              </div>

              <h4
                className={`text-xs font-bold truncate leading-snug ${
                  isActive ? "text-cyan-300" : "text-slate-200 group-hover:text-white"
                }`}
              >
                {scene.title || `Slide ${idx + 1}`}
              </h4>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>{scene.elements.length} components</span>
                <span>{scene.steps.length} steps</span>
              </div>

              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-r shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
