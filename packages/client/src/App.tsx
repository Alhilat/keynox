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
import { KeynoxLogo } from "./components/KeynoxLogo";
import {
  Layers,
  AlertCircle,
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
  const [modelName, setModelName] = useState<string>("Keynox Engine");
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
          engine: options?.engine || "gemini",
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
    <div className="min-h-screen bg-[#000000] text-slate-100 flex flex-col items-center pb-20">
      {/* Executive Keynote Studio Header */}
      <header className="w-full border-b border-white/[0.06] bg-black/80 backdrop-blur-2xl sticky top-0 z-30 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Name & Glowing Monogram */}
          <div className="relative flex items-center gap-3.5 group">
            {/* Radiant ambient backlight behind the logo and name */}
            <div className="absolute -left-3 -top-2.5 -bottom-2.5 -right-4 bg-gradient-to-r from-blue-600/20 via-indigo-500/15 to-purple-600/10 blur-xl opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl -z-10" />

            <KeynoxLogo size={38} />

            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-black text-white tracking-tight">
                  Keynox
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-300 border border-white/[0.1] tracking-wide">
                  STUDIO
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                Interactive Presentation Runtime &bull; Executable Visual Studio
              </p>
            </div>
          </div>
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
            /* Clean Interactive Showcase Gallery */
            <div className="w-full max-w-5xl mt-6 p-6 rounded-2xl border border-white/[0.06] bg-[#08080a]/80 backdrop-blur-xl shadow-xl flex flex-col items-center">
              <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-5 border-b border-white/[0.06] pb-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <h3 className="text-xs font-semibold text-neutral-300 tracking-wider uppercase font-mono">
                      Interactive Showcases
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Live executable demonstration decks ready to present or inspect in studio.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] font-mono text-neutral-400 font-semibold">
                    4 Decks
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full">
                {/* 1: Boolean Logic */}
                <button
                  onClick={() => handleSelectShowcase(booleanLogicDeck)}
                  className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.14] text-left transition-all duration-200 group flex flex-col justify-between relative overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                        <Binary className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        CIRCUIT
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-white mb-1 group-hover:text-cyan-300 transition-colors">
                      Boolean Logic
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
                      Interactive digital logic gates with live toggles &amp; reactive truth table tracking.
                    </p>
                  </div>
                  <div className="mt-4 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-cyan-400">
                    <span className="text-[11px] font-mono text-neutral-500 group-hover:text-neutral-300 transition-colors">Launch Deck</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* 2: Physics Dynamics */}
                <button
                  onClick={() => handleSelectShowcase(physicsDeck)}
                  className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.14] text-left transition-all duration-200 group flex flex-col justify-between relative overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                        <Activity className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        PHYSICS
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-white mb-1 group-hover:text-emerald-300 transition-colors">
                      Physics Dynamics
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
                      Newtonian mechanics calculating acceleration with live mass and force sliders.
                    </p>
                  </div>
                  <div className="mt-4 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-emerald-400">
                    <span className="text-[11px] font-mono text-neutral-500 group-hover:text-neutral-300 transition-colors">Launch Deck</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* 3: Equation Solver */}
                <button
                  onClick={() => handleSelectShowcase(equationSolverDeck)}
                  className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.14] text-left transition-all duration-200 group flex flex-col justify-between relative overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        MORPH
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                      Equation Solver
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
                      Mathematical derivations with animated terms visibly morphing across steps.
                    </p>
                  </div>
                  <div className="mt-4 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-indigo-400">
                    <span className="text-[11px] font-mono text-neutral-500 group-hover:text-neutral-300 transition-colors">Launch Deck</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* 4: OS Kernel */}
                <button
                  onClick={() => handleSelectShowcase(osKernelDeck)}
                  className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.14] text-left transition-all duration-200 group flex flex-col justify-between relative overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        SYSTEMS
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-white mb-1 group-hover:text-amber-300 transition-colors">
                      OS Kernel Arch
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
                      Memory paging, Ring 0-3 privilege architectures, and context switching workflows.
                    </p>
                  </div>
                  <div className="mt-4 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-amber-400">
                    <span className="text-[11px] font-mono text-neutral-500 group-hover:text-neutral-300 transition-colors">Launch Deck</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
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
          <div className="w-full flex items-center justify-between mb-3">
            <button
              onClick={() => setActiveMode("studio")}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              &larr; Return to Workspace
            </button>
          </div>
          <PresentationPlayer
            presentation={currentDeck}
            source="Keynox Keynote"
            onOpenStudio={() => setActiveMode("editor")}
          />
        </main>
      )}

      {/* Mode 3: Editor (Visual Studio) */}
      {activeMode === "editor" && (
        <main className="w-full max-w-7xl px-4 sm:px-6 flex flex-col items-center mt-4">
          <div className="w-full flex items-center justify-between mb-3">
            <button
              onClick={() => setActiveMode("studio")}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              &larr; Return to Workspace
            </button>
          </div>
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
