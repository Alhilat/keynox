import React, { useRef, useEffect, useState } from "react";
import {
  Code,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Terminal,
  Loader2,
  Layers,
  BookOpen,
  Copy,
  Check,
} from "lucide-react";

interface GenerationProcessViewerProps {
  isStreaming: boolean;
  activeStage: 1 | 2 | 3 | "done";
  stage1Analysis: string;
  stage2Storyboard: string;
  stage3Reasoning: string;
  stage3Code: string;
  topic: string;
}

export const NemotronProcessViewer: React.FC<GenerationProcessViewerProps> = ({
  isStreaming,
  activeStage,
  stage1Analysis,
  stage2Storyboard,
  stage3Reasoning,
  stage3Code,
  topic,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<"analysis" | "storyboard" | "code">("analysis");
  const [copied, setCopied] = useState(false);

  const analysisRef = useRef<HTMLPreElement>(null);
  const storyboardRef = useRef<HTMLPreElement>(null);
  const codeRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (analysisRef.current) analysisRef.current.scrollTop = analysisRef.current.scrollHeight;
  }, [stage1Analysis]);

  useEffect(() => {
    if (storyboardRef.current) storyboardRef.current.scrollTop = storyboardRef.current.scrollHeight;
  }, [stage2Storyboard]);

  useEffect(() => {
    if (codeRef.current) codeRef.current.scrollTop = codeRef.current.scrollHeight;
  }, [stage3Code, stage3Reasoning]);

  useEffect(() => {
    if (activeStage === 1) {
      setActiveTab("analysis");
    } else if (activeStage === 2) {
      setActiveTab("storyboard");
    } else if (activeStage === 3) {
      setActiveTab("code");
    }
  }, [activeStage]);

  const cleanDisplayTopic = topic.length > 65 ? topic.slice(0, 62) + "..." : topic;

  const handleCopyCurrent = () => {
    let content = "";
    if (activeTab === "analysis") content = stage1Analysis;
    else if (activeTab === "storyboard") content = stage2Storyboard;
    else if (activeTab === "code") content = stage3Code || stage3Reasoning;

    if (content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto mb-4 flex flex-col gap-2">
      {/* Pipeline Progress Ribbon */}
      <div className="w-full p-3 rounded-xl bg-black border border-neutral-800 shadow-2xl backdrop-blur-xl flex flex-col gap-3 relative overflow-hidden">
        {/* Subtle Obsidian ambient glow */}
        <div className="absolute top-0 right-1/4 w-72 h-16 bg-neutral-800/20 blur-3xl pointer-events-none -z-10" />

        {/* Stage Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          {/* Stage 1 Pill */}
          <div
            className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition-all ${
              activeStage === 1
                ? "bg-neutral-900 border-neutral-600 text-white shadow-sm"
                : stage1Analysis
                ? "bg-[#0a0a0a] border-neutral-800 text-neutral-300"
                : "bg-black border-neutral-900 text-neutral-600"
            }`}
          >
            {activeStage === 1 ? (
              <Loader2 className="w-4 h-4 text-white animate-spin shrink-0" />
            ) : stage1Analysis ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <BookOpen className="w-4 h-4 text-neutral-600 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1">
                <span>1. Analysis</span>
              </div>
              <div className="text-[11px] truncate opacity-80 font-mono">
                {activeStage === 1 ? "Extracting knowledge..." : "Knowledge structured"}
              </div>
            </div>
          </div>

          {/* Stage 2 Pill */}
          <div
            className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition-all ${
              activeStage === 2
                ? "bg-neutral-900 border-neutral-600 text-white shadow-sm"
                : stage2Storyboard
                ? "bg-[#0a0a0a] border-neutral-800 text-neutral-300"
                : "bg-black border-neutral-900 text-neutral-600"
            }`}
          >
            {activeStage === 2 ? (
              <Loader2 className="w-4 h-4 text-white animate-spin shrink-0" />
            ) : stage2Storyboard ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Layers className="w-4 h-4 text-neutral-600 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1">
                <span>2. Storyboard</span>
              </div>
              <div className="text-[11px] truncate opacity-80 font-mono">
                {activeStage === 2 ? "Sequencing slides..." : "Sequence planned"}
              </div>
            </div>
          </div>

          {/* Stage 3 Pill */}
          <div
            className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition-all ${
              activeStage === 3
                ? "bg-neutral-900 border-neutral-600 text-white shadow-sm"
                : activeStage === "done"
                ? "bg-[#0a0a0a] border-emerald-900/60 text-emerald-300"
                : "bg-black border-neutral-900 text-neutral-600"
            }`}
          >
            {activeStage === 3 ? (
              <Loader2 className="w-4 h-4 text-white animate-spin shrink-0" />
            ) : activeStage === "done" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Code className="w-4 h-4 text-neutral-600 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1">
                <span>3. Code Generation</span>
              </div>
              <div className="text-[11px] truncate opacity-80 font-mono">
                {activeStage === 3 ? "Compiling runtime..." : "Presentation compiled"}
              </div>
            </div>
          </div>
        </div>

        {/* Compact Status Header Bar */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-900">
          <div className="flex items-center gap-2 truncate">
            <span className="text-neutral-400 font-medium truncate">{cleanDisplayTopic}</span>
          </div>

          {/* Toggle Terminal Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors text-[11px] font-mono shrink-0"
          >
            <Terminal className="w-3.5 h-3.5 text-neutral-400" />
            <span>{isExpanded ? "Collapse Stream" : "Inspect Stream"}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Technical Log Drawer */}
      {isExpanded && (
        <div className="w-full rounded-xl bg-black border border-neutral-800 overflow-hidden shadow-2xl">
          {/* Model Output Tabs */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#0a0a0a] border-b border-neutral-800 text-xs flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("analysis")}
                className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 ${
                  activeTab === "analysis"
                    ? "bg-neutral-800 text-white font-semibold border border-neutral-700"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-neutral-400" />
                <span>Analysis ({stage1Analysis.length}c)</span>
              </button>

              <button
                onClick={() => setActiveTab("storyboard")}
                className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 ${
                  activeTab === "storyboard"
                    ? "bg-neutral-800 text-white font-semibold border border-neutral-700"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-neutral-400" />
                <span>Storyboard ({stage2Storyboard.length}c)</span>
              </button>

              <button
                onClick={() => setActiveTab("code")}
                className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 ${
                  activeTab === "code"
                    ? "bg-neutral-800 text-white font-semibold border border-neutral-700"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Code className="w-3.5 h-3.5 text-neutral-400" />
                <span>Runtime Code ({stage3Code.length || stage3Reasoning.length}c)</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCurrent}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors text-[11px] font-mono"
                title="Copy current tab output"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>

              <span className="text-[11px] font-mono text-neutral-500">
                {isStreaming ? "Streaming 60FPS" : "Complete"}
              </span>
            </div>
          </div>

          {/* Terminal Viewport */}
          <div className="p-4 bg-black text-xs font-mono max-h-80 overflow-y-auto leading-relaxed select-text border-t border-neutral-900">
            {activeTab === "analysis" && (
              <pre ref={analysisRef} className="text-neutral-300 whitespace-pre-wrap font-mono">
                {stage1Analysis || "Waiting for analysis stream..."}
              </pre>
            )}

            {activeTab === "storyboard" && (
              <pre ref={storyboardRef} className="text-neutral-300 whitespace-pre-wrap font-mono">
                {stage2Storyboard || "Waiting for storyboard stream..."}
              </pre>
            )}

            {activeTab === "code" && (
              <pre ref={codeRef} className="text-emerald-400 whitespace-pre-wrap font-mono">
                {stage3Code || stage3Reasoning || "Waiting for code generation stream..."}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
