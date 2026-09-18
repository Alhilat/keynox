import React, { useState } from "react";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";

interface PromptBarProps {
  onGenerate: (topic: string) => Promise<void>;
  isLoading: boolean;
}

export const PromptBar: React.FC<PromptBarProps> = ({
  onGenerate,
  isLoading,
}) => {
  const [topic, setTopic] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !isLoading) {
      onGenerate(topic.trim());
    }
  };

  const handlePreset = (presetText: string) => {
    setTopic(presetText);
    onGenerate(presetText);
  };

  return (
    <div className="w-full max-w-5xl mx-auto mb-5">
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2 shadow-2xl backdrop-blur-lg focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all"
      >
        <div className="pl-3 pr-2 text-blue-400">
          <Sparkles className="w-5 h-5" />
        </div>

        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="What would you like to present? (e.g. 'Create 6 slides on Raft consensus', '5 slides on Quantum Circuits', or auto-scale)..."
          disabled={isLoading}
          className="flex-1 bg-transparent px-2 py-2 text-sm md:text-base text-white placeholder-slate-500 focus:outline-none disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all active:scale-95 shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <span>Generate</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Suggested Topics */}
      <div className="flex items-center flex-wrap gap-2 mt-2.5 px-1 text-xs text-slate-400">
        <span className="text-slate-500 text-[11px] font-medium">Try asking:</span>
        <button
          type="button"
          onClick={() => handlePreset("Create 6 slides about distributed Raft consensus and leader election")}
          disabled={isLoading}
          className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/70 transition-colors"
        >
          6 Slides: Raft Consensus
        </button>
        <button
          type="button"
          onClick={() => handlePreset("5 slides on Quantum Computing: Superposition, Entanglement, and Qubits")}
          disabled={isLoading}
          className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/70 transition-colors"
        >
          5 Slides: Quantum Computing
        </button>
        <button
          type="button"
          onClick={() => handlePreset("4 slides on Boolean Logic: AND, OR, and NOT Operators")}
          disabled={isLoading}
          className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/70 transition-colors"
        >
          4 Slides: Boolean Logic
        </button>
        <button
          type="button"
          onClick={() => handlePreset("How Operating System Kernels Work: Memory Management and Syscalls")}
          disabled={isLoading}
          className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/70 transition-colors"
        >
          OS Kernels (Dynamic)
        </button>
      </div>
    </div>
  );
};
