import React, { useState } from "react";
import { Zap, Cpu, ArrowRight, Check, X, RotateCcw, Play } from "lucide-react";

interface InteractiveWidgetProps {
  type?: "boolean-simulator" | "physics-slider" | "equation-solver";
  title?: string;
}

export const InteractiveWidget: React.FC<InteractiveWidgetProps> = ({
  type = "boolean-simulator",
  title,
}) => {
  // Boolean Simulator State
  const [inputA, setInputA] = useState(true);
  const [inputB, setInputB] = useState(false);

  // Physics Slider State
  const [mass, setMass] = useState(2); // kg
  const [force, setForce] = useState(10); // N

  const acceleration = (force / Math.max(0.1, mass)).toFixed(1);

  // Boolean Calculations
  const andResult = inputA && inputB;
  const orResult = inputA || inputB;
  const notResult = !inputA;
  const xorResult = (inputA || inputB) && !(inputA && inputB);

  return (
    <div className="w-full rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl p-5 select-none transition-all">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">
              {title || "Live Interactive Simulator Sandbox"}
            </h4>
            <p className="text-[11px] text-slate-400 font-mono">
              Click toggles to execute logic dynamically on this slide
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>LIVE ENGINE</span>
        </div>
      </div>

      {type === "boolean-simulator" ? (
        <div className="flex flex-col gap-4">
          {/* Interactive Inputs */}
          <div className="grid grid-cols-2 gap-4">
            {/* Input A Toggle */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase block">
                  SIGNAL A
                </span>
                <span className="text-sm font-mono font-bold text-white">
                  Input A: {inputA ? "1 (TRUE)" : "0 (FALSE)"}
                </span>
              </div>
              <button
                onClick={() => setInputA(!inputA)}
                className={`px-4 py-1.5 rounded-lg font-mono text-xs font-bold transition-all shadow-md active:scale-95 ${
                  inputA
                    ? "bg-emerald-500 text-slate-950 shadow-emerald-500/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}
              >
                {inputA ? "TRUE" : "FALSE"}
              </button>
            </div>

            {/* Input B Toggle */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase block">
                  SIGNAL B
                </span>
                <span className="text-sm font-mono font-bold text-white">
                  Input B: {inputB ? "1 (TRUE)" : "0 (FALSE)"}
                </span>
              </div>
              <button
                onClick={() => setInputB(!inputB)}
                className={`px-4 py-1.5 rounded-lg font-mono text-xs font-bold transition-all shadow-md active:scale-95 ${
                  inputB
                    ? "bg-emerald-500 text-slate-950 shadow-emerald-500/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}
              >
                {inputB ? "TRUE" : "FALSE"}
              </button>
            </div>
          </div>

          {/* Dynamic Evaluation Output Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* AND Gate */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                andResult
                  ? "bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-500/20"
                  : "bg-slate-950/50 border-slate-800 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold text-slate-400">AND (A && B)</span>
                {andResult ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-600" />
                )}
              </div>
              <div
                className={`text-lg font-mono font-black ${
                  andResult ? "text-emerald-400" : "text-slate-600"
                }`}
              >
                {andResult ? "TRUE (1)" : "FALSE (0)"}
              </div>
              <span className="text-[9px] font-mono text-slate-500 block mt-1">Both must be 1</span>
            </div>

            {/* OR Gate */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                orResult
                  ? "bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-500/20"
                  : "bg-slate-950/50 border-slate-800 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold text-slate-400">OR (A || B)</span>
                {orResult ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-600" />
                )}
              </div>
              <div
                className={`text-lg font-mono font-black ${
                  orResult ? "text-emerald-400" : "text-slate-600"
                }`}
              >
                {orResult ? "TRUE (1)" : "FALSE (0)"}
              </div>
              <span className="text-[9px] font-mono text-slate-500 block mt-1">Either is 1</span>
            </div>

            {/* NOT Gate */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                notResult
                  ? "bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-500/20"
                  : "bg-slate-950/50 border-slate-800 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold text-slate-400">NOT (!A)</span>
                {notResult ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-600" />
                )}
              </div>
              <div
                className={`text-lg font-mono font-black ${
                  notResult ? "text-emerald-400" : "text-slate-600"
                }`}
              >
                {notResult ? "TRUE (1)" : "FALSE (0)"}
              </div>
              <span className="text-[9px] font-mono text-slate-500 block mt-1">Inverts A</span>
            </div>

            {/* XOR Gate */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                xorResult
                  ? "bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-500/20"
                  : "bg-slate-950/50 border-slate-800 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold text-slate-400">XOR (A ^ B)</span>
                {xorResult ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-600" />
                )}
              </div>
              <div
                className={`text-lg font-mono font-black ${
                  xorResult ? "text-emerald-400" : "text-slate-600"
                }`}
              >
                {xorResult ? "TRUE (1)" : "FALSE (0)"}
              </div>
              <span className="text-[9px] font-mono text-slate-500 block mt-1">Strictly different</span>
            </div>
          </div>
        </div>
      ) : (
        /* Physics F=ma Simulator */
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-slate-400">Mass (m):</span>
                <span className="text-blue-400 font-bold">{mass} kg</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={mass}
                onChange={(e) => setMass(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-slate-400">Force (F):</span>
                <span className="text-emerald-400 font-bold">{force} N</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={force}
                onChange={(e) => setForce(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="font-mono text-sm">
              <span className="text-slate-400">Equation: </span>
              <span className="text-white font-bold">a = F / m = {force} / {mass}</span>
            </div>
            <div className="px-4 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-base">
              a = {acceleration} m/s²
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
