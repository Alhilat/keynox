import React, { useRef, useEffect, useState } from "react";
import {
  Code,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Terminal,
  FileText,
  Loader2,
  Sparkles,
  Camera,
  Layers,
  BookOpen,
  Copy,
  Check,
  ExternalLink,
  Download,
  X,
} from "lucide-react";

export interface PhotoLogItem {
  prompt: string;
  photoUrl?: string;
  status: "rendering" | "done" | "error";
  latencyMs?: number;
}

interface GenerationProcessViewerProps {
  isStreaming: boolean;
  activeStage: 1 | 2 | 3 | "done";
  stage1Message: string;
  stage1Analysis: string;
  stage2Message: string;
  stage2Storyboard: string;
  stage3Message: string;
  stage3Reasoning: string;
  stage3Code: string;
  photoLogs?: PhotoLogItem[];
  topic: string;
  modelName?: string;
}

export const NemotronProcessViewer: React.FC<GenerationProcessViewerProps> = ({
  isStreaming,
  activeStage,
  stage1Analysis,
  stage2Storyboard,
  stage3Reasoning,
  stage3Code,
  photoLogs = [],
  topic,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<"analysis" | "storyboard" | "code" | "photos">("analysis");
  const [copied, setCopied] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<PhotoLogItem | null>(null);

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
      setActiveTab(photoLogs.length > 0 && photoLogs.some((p) => p.status === "rendering") ? "photos" : "code");
    }
  }, [activeStage, photoLogs.length]);

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
      {/* 3-Stage Progress Ribbon */}
      <div className="w-full p-3 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col gap-3 relative overflow-hidden">
        {/* Subtle Ambient Glow inside Ribbon */}
        <div className="absolute top-0 right-1/4 w-72 h-16 bg-cyan-500/10 blur-3xl pointer-events-none -z-10"></div>

        {/* Stage Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          {/* Stage 1 Pill */}
          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
              activeStage === 1
                ? "bg-cyan-500/12 border-cyan-400/50 text-cyan-300 ring-1 ring-cyan-500/30 shadow-lg shadow-cyan-500/10"
                : stage1Analysis
                ? "bg-slate-800/70 border-slate-700/70 text-slate-300"
                : "bg-slate-950/40 border-slate-800/40 text-slate-500"
            }`}
          >
            {activeStage === 1 ? (
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
            ) : stage1Analysis ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <BookOpen className="w-4 h-4 text-slate-600 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
                <span>1. Document Analyzer</span>
              </div>
              <div className="text-[11px] truncate opacity-90 font-mono">
                {activeStage === 1 ? "Extracting facts & formulas..." : "Knowledge extracted"}
              </div>
            </div>
          </div>

          {/* Stage 2 Pill */}
          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
              activeStage === 2
                ? "bg-indigo-500/12 border-indigo-400/50 text-indigo-300 ring-1 ring-indigo-500/30 shadow-lg shadow-indigo-500/10"
                : stage2Storyboard
                ? "bg-slate-800/70 border-slate-700/70 text-slate-300"
                : "bg-slate-950/40 border-slate-800/40 text-slate-500"
            }`}
          >
            {activeStage === 2 ? (
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
            ) : stage2Storyboard ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Layers className="w-4 h-4 text-slate-600 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
                <span>2. Storyboard &amp; Visuals</span>
              </div>
              <div className="text-[11px] truncate opacity-90 font-mono">
                {activeStage === 2 ? "Writing slide texts & photo specs..." : "Storyboard ready"}
              </div>
            </div>
          </div>

          {/* Stage 3 Pill */}
          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
              activeStage === 3
                ? "bg-amber-500/12 border-amber-400/50 text-amber-300 ring-1 ring-amber-500/30 shadow-lg shadow-amber-500/10"
                : activeStage === "done"
                ? "bg-emerald-500/12 border-emerald-500/40 text-emerald-300"
                : "bg-slate-950/40 border-slate-800/40 text-slate-500"
            }`}
          >
            {activeStage === 3 ? (
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
            ) : activeStage === "done" ? (
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Code className="w-4 h-4 text-slate-600 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
                <span>3. Creative Engine</span>
              </div>
              <div className="text-[11px] truncate opacity-90 font-mono">
                {activeStage === 3 ? "Dynamic visuals & FLUX photos..." : "Presentation compiled"}
              </div>
            </div>
          </div>
        </div>

        {/* Compact Status Header Bar */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2 truncate">
            <span className="text-slate-400 font-semibold truncate">{cleanDisplayTopic}</span>
          </div>

          {/* Toggle Terminal Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px] font-mono shrink-0 shadow-sm"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isExpanded ? "Collapse Stream" : "Inspect Models"}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Technical Log Drawer */}
      {isExpanded && (
        <div className="w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
          {/* Model Output Tabs */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800 text-xs flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("analysis")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                  activeTab === "analysis"
                    ? "bg-slate-800 text-cyan-300 font-bold border border-cyan-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>Model 1: Analysis ({stage1Analysis.length}c)</span>
              </button>

              <button
                onClick={() => setActiveTab("storyboard")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                  activeTab === "storyboard"
                    ? "bg-slate-800 text-indigo-300 font-bold border border-indigo-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Model 2: Storyboard &amp; Photos ({stage2Storyboard.length}c)</span>
              </button>

              <button
                onClick={() => setActiveTab("code")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                  activeTab === "code"
                    ? "bg-slate-800 text-amber-300 font-bold border border-amber-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Code className="w-3.5 h-3.5 text-amber-400" />
                <span>Model 3: Dynamic Code ({stage3Code.length || stage3Reasoning.length}c)</span>
              </button>

              {photoLogs.length > 0 && (
                <button
                  onClick={() => setActiveTab("photos")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                    activeTab === "photos"
                      ? "bg-slate-800 text-emerald-300 font-bold border border-emerald-500/30 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>AI Photos ({photoLogs.length})</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activeTab !== "photos" && (
                <button
                  onClick={handleCopyCurrent}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors text-[11px] font-mono"
                  title="Copy current tab output"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              )}

              <span className="text-[11px] font-mono text-slate-500">
                {isStreaming ? "Streaming 60FPS" : "Complete"}
              </span>
            </div>
          </div>

          {/* Terminal Viewport */}
          <div className="p-4 bg-[#060911] text-xs font-mono max-h-80 overflow-y-auto leading-relaxed select-text">
            {activeTab === "analysis" && (
              <pre ref={analysisRef} className="text-cyan-200/90 whitespace-pre-wrap font-mono">
                {stage1Analysis || "Waiting for Model 1 document analysis stream..."}
              </pre>
            )}

            {activeTab === "storyboard" && (
              <pre ref={storyboardRef} className="text-indigo-200/90 whitespace-pre-wrap font-mono">
                {stage2Storyboard || "Waiting for Model 2 slide storyboard & photo specifications..."}
              </pre>
            )}

            {activeTab === "code" && (
              <pre ref={codeRef} className="text-emerald-300/90 whitespace-pre-wrap font-mono">
                {stage3Code || stage3Reasoning || "Waiting for Model 3 creative presentation compilation..."}
              </pre>
            )}

            {activeTab === "photos" && (
              <div className="flex flex-col gap-3">
                <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
                  <span>Photos specified by Model 2 and synthesized via NVIDIA NIM FLUX:</span>
                  <span className="text-[11px] text-slate-500">Click any image to enlarge</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {photoLogs.map((p, idx) => (
                    <div
                      key={idx}
                      onClick={() => p.photoUrl && setPreviewPhoto(p)}
                      className={`p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2 transition-all ${
                        p.photoUrl ? "cursor-pointer hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-200 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                          Photo {idx + 1}
                        </span>
                        {p.status === "rendering" ? (
                          <span className="text-cyan-400 flex items-center gap-1 font-mono">
                            <Loader2 className="w-3 h-3 animate-spin" /> Rendering
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-mono flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Rendered ({p.latencyMs || 2500}ms)
                          </span>
                        )}
                      </div>
                      {p.photoUrl && (
                        <div className="relative group overflow-hidden rounded-lg">
                          <img
                            src={p.photoUrl}
                            alt="Generated"
                            className="w-full h-36 object-cover rounded-lg border border-slate-800 transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="px-3 py-1 rounded-full bg-slate-900/90 border border-white/20 text-white text-[11px] font-mono flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" /> View 8K Photo
                            </span>
                          </div>
                        </div>
                      )}
                      <p className="text-[11px] text-slate-400 line-clamp-2 italic">"{p.prompt}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Resolution Photo Lightbox Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-4 flex flex-col gap-3 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                <Camera className="w-4 h-4" />
                <span>NVIDIA NIM FLUX &bull; Photorealistic Slide Asset</span>
              </div>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {previewPhoto.photoUrl && (
              <img
                src={previewPhoto.photoUrl}
                alt="Enlarged"
                className="w-full max-h-[70vh] object-contain rounded-xl bg-slate-950 border border-slate-800"
              />
            )}

            <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-800">
              <p className="text-xs text-slate-300 italic line-clamp-2 font-mono">
                "{previewPhoto.prompt}"
              </p>
              {previewPhoto.photoUrl && (
                <a
                  href={previewPhoto.photoUrl}
                  download="hyperdeck-ai-photo.jpg"
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
