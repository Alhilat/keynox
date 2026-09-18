import { useState } from "react";
import { ConceptInputArea, GenerationOptions } from "./components/ConceptInputArea";
import { NemotronProcessViewer } from "./components/NemotronProcessViewer";
import { HtmlPresentationViewer } from "./components/HtmlPresentationViewer";
import { PresentationPlayer } from "./components/PresentationPlayer";
import { EditorStudio } from "./components/EditorStudio";
import { useStreamThrottler } from "./hooks/useStreamThrottler";
import {
  booleanLogicDeck,
  equationSolverDeck,
  physicsDeck,
  osKernelDeck,
} from "./data/showcaseDecks";
import { Presentation } from "@presentation/schema";
import {
  Layers,
  AlertCircle,
  Play,
  LayoutGrid,
  SlidersHorizontal,
  FileCode2,
  Binary,
  Activity,
  Sparkles,
  Cpu,
  ArrowRight,
  Zap,
} from "lucide-react";

export function App() {
  // Navigation Mode: "studio" (generator) | "player" (keynote) | "editor" (visual studio)
  const [activeMode, setActiveMode] = useState<"studio" | "player" | "editor">("studio");

  // Presentation State for Native GSAP Player / Editor
  const [currentDeck, setCurrentDeck] = useState<Presentation>(booleanLogicDeck);

  // Standalone HTML Explainer Site State
  // Standalone HTML Explainer Site State
  const [htmlSite, setHtmlSite] = useState<string>("");
  const [currentTitle, setCurrentTitle] = useState<string>("");
  const [modelName, setModelName] = useState<string>("HyperDeck 3-Stage Engine");
  const [outlineText, setOutlineText] = useState<string>("");

  // Streaming Process State (3-Stage LLM Pipeline)
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeStage, setActiveStage] = useState<1 | 2 | 3 | "done">("done");
  const [activeSentences, setActiveSentences] = useState<string>("");
  const [stage1Message, setStage1Message] = useState<string>("");
  const [stage2Message, setStage2Message] = useState<string>("");
  const [stage3Message, setStage3Message] = useState<string>("");
  const [photoLogs, setPhotoLogs] = useState<{ prompt: string; photoUrl?: string; status: "rendering" | "done" | "error"; latencyMs?: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 60FPS RAF Throttlers for smooth token streaming
  const stage1Analysis = useStreamThrottler("");
  const stage2Storyboard = useStreamThrottler("");
  const stage3Reasoning = useStreamThrottler("");
  const stage3Code = useStreamThrottler("");

  const handleGenerate = async (sentences: string, options?: GenerationOptions) => {
    setIsStreaming(true);
    setActiveStage(1);
    setActiveSentences(sentences);

    // Extract clean title from TOPIC or first sentence
    let title = "Interactive Keynote";
    const explicitMatch = sentences.match(/TOPIC:\s*["']?([^"'\n\r]+)["']?/i);
    if (explicitMatch && explicitMatch[1]) {
      title = explicitMatch[1].trim();
    } else {
      const firstLine = sentences.split(/[.\n]/)[0].trim();
      title = firstLine.length > 60 ? firstLine.slice(0, 57) + "..." : firstLine;
    }
    title = title.replace(/^\[SECTION:[^\]]*\]\s*/i, "").trim();
    setCurrentTitle(title || "Interactive Keynote");

    setStage1Message("Model 1: Deeply reading document & extracting knowledge...");
    stage1Analysis.reset("");
    setStage2Message("");
    stage2Storyboard.reset("");
    setStage3Message("");
    stage3Reasoning.reset("");
    stage3Code.reset("");
    setPhotoLogs([]);
    setError(null);

    try {
      const response = await fetch("/api/ai/stream-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: sentences,
          theme: options?.theme || "cyber",
          slideCount: options?.slideCount || 5,
          archetypes: options?.archetypes || [],
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to connect to presentation compiler stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === "cache_hit") {
                setStage1Message(event.message || "Loaded instant cached presentation");
              } else if (event.type === "stage1_start") {
                setActiveStage(1);
                setStage1Message(event.message || "Model 1: Extracting deep technical concepts & metrics...");
              } else if (event.type === "stage1_chunk") {
                stage1Analysis.append(event.delta || "");
              } else if (event.type === "stage1_complete") {
                stage1Analysis.reset(event.analysis || event.outline || "");
                setActiveStage(2);
                setStage2Message("Model 2: Writing slide narrative & specifying required AI photos...");
              } else if (event.type === "stage2_start") {
                setActiveStage(2);
                setStage2Message(event.message || "Model 2: Writing slide narrative & specifying required AI photos...");
              } else if (event.type === "stage2_chunk") {
                stage2Storyboard.append(event.delta || "");
              } else if (event.type === "stage2_complete") {
                stage2Storyboard.reset(event.storyboard || event.outline || "");
                setActiveStage(3);
                setStage3Message("Model 3: Synthesizing creative presentation (zero templates / zero slop)...");
              } else if (event.type === "stage3_start") {
                setActiveStage(3);
                setStage3Message(event.message || "Model 3: Generating presentation & widgets...");
              } else if (event.type === "stage3_reasoning") {
                stage3Reasoning.append(event.delta || "");
              } else if (event.type === "stage3_chunk") {
                stage3Code.append(event.delta || "");
              } else if (event.type === "photo_start") {
                setPhotoLogs((prev) => [
                  ...prev,
                  { prompt: event.message || "AI Photo", status: "rendering" },
                ]);
              } else if (event.type === "photo_done") {
                setPhotoLogs((prev) => {
                  const copy = [...prev];
                  const last = copy[copy.length - 1];
                  if (last) {
                    last.status = "done";
                    last.photoUrl = event.photoUrl;
                  }
                  return copy;
                });
              } else if (event.type === "complete") {
                setPhotoLogs((prev) =>
                  prev.map((p) => (p.status === "rendering" ? { ...p, status: "done" } : p))
                );
                if (event.html) {
                  setHtmlSite(event.html);
                }
                if (event.outline || event.storyboard) {
                  setOutlineText(event.outline || event.storyboard || "");
                }
                if (event.model) {
                  setModelName(event.model);
                }
                if (event.presentation) {
                  setCurrentDeck(event.presentation);
                }
                setActiveStage("done");
              } else if (event.type === "error") {
                throw new Error(event.message);
              }
            } catch (err) {
              console.error("Failed to parse SSE line:", line);
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err?.message || "Failed to generate presentation");
    } finally {
      setIsStreaming(false);
      setActiveStage("done");
    }
  };

  const handleSelectShowcase = (deck: Presentation) => {
    setCurrentDeck(deck);
    setActiveMode("player");
  };

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col items-center pb-20">
      {/* Executive Keynote Studio Header */}
      <header className="w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-2xl sticky top-0 z-30 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Name & Glowing Monogram */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/80 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/15 relative overflow-hidden group">
              <div className="absolute inset-0 bg-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Layers className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-black text-white tracking-tight">
                  HyperDeck
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  STUDIO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Interactive Presentation Engine &bull; 3-Stage AI Synthesis
              </p>
            </div>
          </div>

          {/* Engine Status Badges (Hidden on tiny screens) */}
          <div className="hidden md:flex items-center gap-2.5">
            <div className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>3-Stage LLM Pipeline</span>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>NVIDIA FLUX 8K</span>
            </div>
          </div>

          {/* Mode Navigation */}
          <nav className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner">
            <button
              onClick={() => setActiveMode("studio")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeMode === "studio"
                  ? "bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-md border border-slate-600"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Studio</span>
            </button>
            <button
              onClick={() => setActiveMode("player")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeMode === "player"
                  ? "bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-md border border-slate-600"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>Present</span>
            </button>
            <button
              onClick={() => setActiveMode("editor")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeMode === "editor"
                  ? "bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-md border border-slate-600"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
              <span>Editor</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Mode 1: Studio Workspace */}
      {activeMode === "studio" && (
        <main className="w-full max-w-6xl px-4 sm:px-8 flex flex-col items-center mt-6">
          {/* Input Area */}
          <div className="w-full mb-4">
            <ConceptInputArea onGenerate={handleGenerate} isLoading={isStreaming} />
          </div>

          {/* Error Alert */}
          {error && (
            <div className="w-full mb-4 p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 flex items-start gap-3 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-200">Compilation Error</p>
                <p className="text-red-300/90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* 3-Stage Generation Monitor (Model 1, Model 2, Model 3) */}
          {(isStreaming || stage1Analysis.value || stage2Storyboard.value || stage3Code.value) && (
            <div className="w-full">
              <NemotronProcessViewer
                isStreaming={isStreaming}
                activeStage={activeStage}
                stage1Message={stage1Message}
                stage1Analysis={stage1Analysis.value}
                stage2Message={stage2Message}
                stage2Storyboard={stage2Storyboard.value}
                stage3Message={stage3Message}
                stage3Reasoning={stage3Reasoning.value}
                stage3Code={stage3Code.value}
                photoLogs={photoLogs}
                topic={activeSentences}
                modelName={modelName}
              />
            </div>
          )}

          {/* Generated Explainer Site Viewport OR Clean Initial State */}
          {htmlSite ? (
            <div className="w-full mt-2">
              <HtmlPresentationViewer
                html={htmlSite}
                title={currentTitle}
                modelName={modelName}
                outline={outlineText || stage2Storyboard.value || stage1Analysis.value}
                onPresentKeynote={() => setActiveMode("player")}
                onOpenStudio={() => setActiveMode("editor")}
              />
            </div>
          ) : !isStreaming ? (
            /* Premium Interactive Showcase Gallery */
            <div className="w-full max-w-5xl mt-8 p-7 rounded-3xl border border-slate-800/90 bg-slate-950/60 backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col items-center">
              {/* Background ambient lighting */}
              <div className="absolute top-0 right-1/4 w-96 h-48 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/4 w-96 h-48 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

              <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6 border-b border-slate-800/60 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                      Curated Interactive Systems
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Zero-latency executable models ready to inspect in Keynote Player or Visual Studio.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700/80 font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-amber-400" />
                    4 Verified Showcases
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                {/* 1: Boolean Logic */}
                <button
                  onClick={() => handleSelectShowcase(booleanLogicDeck)}
                  className="p-5 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 text-left transition-all duration-300 group flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
                        <Binary className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        CIRCUIT
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white mb-1.5 group-hover:text-cyan-300 transition-colors">
                      Boolean Logic
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      Interactive digital logic gates with live toggles &amp; reactive truth table row tracking.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-cyan-400">
                    <span className="text-[11px] font-mono text-slate-500 group-hover:text-slate-300 transition-colors">Launch Deck</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* 2: Physics Dynamics */}
                <button
                  onClick={() => handleSelectShowcase(physicsDeck)}
                  className="p-5 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 text-left transition-all duration-300 group flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                        <Activity className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        PHYSICS
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white mb-1.5 group-hover:text-emerald-300 transition-colors">
                      Physics Dynamics
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      Newtonian mechanics running acceleration $a = F/m$ with live mass and force sliders.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-emerald-400">
                    <span className="text-[11px] font-mono text-slate-500 group-hover:text-slate-300 transition-colors">Launch Deck</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* 3: Equation Solver */}
                <button
                  onClick={() => handleSelectShowcase(equationSolverDeck)}
                  className="p-5 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 text-left transition-all duration-300 group flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        GSAP MORPH
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white mb-1.5 group-hover:text-indigo-300 transition-colors">
                      Equation Solver
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      Fine-grained mathematical derivations with animated terms visibly morphing across steps.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-400">
                    <span className="text-[11px] font-mono text-slate-500 group-hover:text-slate-300 transition-colors">Launch Deck</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* 4: OS Kernel */}
                <button
                  onClick={() => handleSelectShowcase(osKernelDeck)}
                  className="p-5 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 text-left transition-all duration-300 group flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        TOPOLOGY
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white mb-1.5 group-hover:text-amber-300 transition-colors">
                      OS Kernel Arch
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      Memory paging, Ring 0-3 privilege architectures, and context switching workflows.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-amber-400">
                    <span className="text-[11px] font-mono text-slate-500 group-hover:text-slate-300 transition-colors">Launch Deck</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>
            </div>
          ) : null}
        </main>
      )}

      {/* Mode 2: Present (Keynote Player) */}
      {activeMode === "player" && (
        <main className="w-full max-w-7xl px-4 sm:px-6 flex flex-col items-center mt-4">
          <PresentationPlayer
            presentation={currentDeck}
            source="HyperDeck Keynote"
            onOpenStudio={() => setActiveMode("editor")}
          />
        </main>
      )}

      {/* Mode 3: Editor (Visual Studio) */}
      {activeMode === "editor" && (
        <main className="w-full max-w-7xl px-4 sm:px-6 flex flex-col items-center mt-4">
          <EditorStudio
            presentation={currentDeck}
            onChange={(updated) => setCurrentDeck(updated)}
            onSwitchToPlayer={() => setActiveMode("player")}
          />
        </main>
      )}
    </div>
  );
}

export default App;
