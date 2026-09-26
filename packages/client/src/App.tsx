import { useState } from "react";
import { ConceptInputArea, GenerationOptions } from "./components/ConceptInputArea";
import { NemotronProcessViewer } from "./components/NemotronProcessViewer";
import { HtmlPresentationViewer } from "./components/HtmlPresentationViewer";
import { PresentationPlayer } from "./components/PresentationPlayer";
import { EditorStudio } from "./components/EditorStudio";
import { useStreamThrottler } from "./hooks/useStreamThrottler";
import { booleanLogicDeck } from "./data/showcaseDecks";
import { Presentation } from "@presentation/schema";
import { KeynoxLogo } from "./components/KeynoxLogo";
import {
  AlertCircle,
} from "lucide-react";

export function App() {
  // Navigation Mode: "studio" (generator) | "player" (keynote) | "editor" (visual studio)
  const [activeMode, setActiveMode] = useState<"studio" | "player" | "editor">("studio");

  // Presentation State for Native GSAP Player / Editor
  const [currentDeck, setCurrentDeck] = useState<Presentation>(booleanLogicDeck);

  // Standalone HTML Explainer Site State
  const [htmlSite, setHtmlSite] = useState<string>("");
  const [currentTitle, setCurrentTitle] = useState<string>("");
  const [outlineText, setOutlineText] = useState<string>("");

  // Streaming Process State (3-Stage LLM Pipeline)
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeStage, setActiveStage] = useState<1 | 2 | 3 | "done">("done");
  const [activeSentences, setActiveSentences] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [slideProgress, setSlideProgress] = useState<{ index: number; total: number } | null>(null);

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

    stage1Analysis.reset("");
    stage2Storyboard.reset("");
    stage3Reasoning.reset("");
    stage3Code.reset("");
    setError(null);
    setWarning(null);
    setSlideProgress(null);

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

              if (event.type === "stage1_start") {
                setActiveStage(1);
              } else if (event.type === "stage1_chunk") {
                stage1Analysis.append(event.delta || "");
              } else if (event.type === "stage1_complete") {
                stage1Analysis.reset(event.analysis || event.outline || "");
                setActiveStage(2);
              } else if (event.type === "stage2_start") {
                setActiveStage(2);
              } else if (event.type === "stage2_chunk") {
                stage2Storyboard.append(event.delta || "");
              } else if (event.type === "stage2_complete") {
                stage2Storyboard.reset(event.storyboard || event.outline || "");
                setActiveStage(3);
              } else if (event.type === "stage3_start") {
                setActiveStage(3);
              } else if (event.type === "stage3_reasoning") {
                stage3Reasoning.append(event.delta || "");
              } else if (event.type === "stage3_chunk") {
                stage3Code.append(event.delta || "");
              } else if (event.type === "slide_ready") {
                if (event.slideIndex !== undefined && event.totalSlides) {
                  setSlideProgress({ index: event.slideIndex + 1, total: event.totalSlides });
                }
              } else if (event.type === "warn") {
                setWarning(event.warning || event.message || "Compilation warning");
              } else if (event.type === "complete") {
                if (event.html) {
                  setHtmlSite(event.html);
                }
                if (event.outline || event.storyboard) {
                  setOutlineText(event.outline || event.storyboard || "");
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

          {/* Warning Alert */}
          {warning && (
            <div className="w-full mb-4 p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 flex items-start gap-3 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-200">Compilation Warning</p>
                <p className="text-amber-300/90 mt-0.5">{warning}</p>
              </div>
            </div>
          )}

          {/* 3-Stage Generation Monitor (Model 1, Model 2, Model 3) */}
          {(isStreaming || stage1Analysis.value || stage2Storyboard.value || stage3Code.value) && (
            <div className="w-full">
              <NemotronProcessViewer
                isStreaming={isStreaming}
                activeStage={activeStage}
                stage1Analysis={stage1Analysis.value}
                stage2Storyboard={stage2Storyboard.value}
                stage3Reasoning={stage3Reasoning.value}
                stage3Code={stage3Code.value}
                topic={activeSentences}
              />
            </div>
          )}

          {/* Generated Explainer Site Viewport */}
          {htmlSite ? (
            <div className="w-full mt-2">
              <HtmlPresentationViewer
                html={htmlSite}
                title={currentTitle}
                outline={outlineText || stage2Storyboard.value || stage1Analysis.value}
                onPresentKeynote={() => setActiveMode("player")}
                onOpenStudio={() => setActiveMode("editor")}
              />
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
