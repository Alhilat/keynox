import React, { useEffect, useRef, useState } from "react";
import { Presentation } from "@presentation/schema";
import { PresentationEngine, EngineState } from "@presentation/engine";
import { StepScrubber } from "./StepScrubber";
import { JsonModal } from "./JsonModal";
import confetti from "canvas-confetti";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Layers,
  Keyboard,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Code,
  Crosshair,
  Sliders,
  PanelLeft,
} from "lucide-react";
import { SlideNavigator } from "./SlideNavigator";

interface PresentationPlayerProps {
  presentation: Presentation;
  source?: string;
  onOpenStudio?: () => void;
}

export const PresentationPlayer: React.FC<PresentationPlayerProps> = ({
  presentation,
  source,
  onOpenStudio,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageViewportRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<PresentationEngine | null>(null);
  const [engineState, setEngineState] = useState<EngineState | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isLaserPointer, setIsLaserPointer] = useState(false);
  const [laserPos, setLaserPos] = useState({ x: -100, y: -100 });
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

  const [showSlideSidebar, setShowSlideSidebar] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Presentation Engine
    const engine = new PresentationEngine(containerRef.current);
    engineRef.current = engine;

    const unsubscribe = engine.onStateChange((state) => {
      setEngineState(state);
      setIsSoundEnabled(state.soundEnabled);

      // Check if user reached final step of final scene: celebrate!
      if (
        state.currentSceneIndex === state.totalScenes - 1 &&
        state.currentStepIndex === state.totalStepsInScene - 1 &&
        state.totalStepsInScene > 1
      ) {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.65 },
          colors: ["#38bdf8", "#10b981", "#f59e0b", "#a855f7"],
        });
      }
    });

    engine.loadPresentation(presentation);

    return () => {
      unsubscribe();
      engine.destroy();
      engineRef.current = null;
    };
  }, [presentation]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleNext = () => engineRef.current?.nextStep();
  const handlePrev = () => engineRef.current?.prevStep();
  const handleRestart = () => engineRef.current?.goToStep(0);
  const handleSelectStep = (index: number) => engineRef.current?.goToStep(index);
  const handleSelectScene = (index: number) => engineRef.current?.goToScene(index);

  const toggleSound = () => {
    if (engineRef.current) {
      const nextVal = !isSoundEnabled;
      engineRef.current.setSoundEnabled(nextVal);
      setIsSoundEnabled(nextVal);
    }
  };

  const toggleFullscreen = async () => {
    if (!stageViewportRef.current) return;
    if (!document.fullscreenElement) {
      await stageViewportRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isLaserPointer) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setLaserPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const currentStep = engineState?.currentStep;
  const currentStepNum = (engineState?.currentStepIndex ?? 0) + 1;
  const totalSteps = engineState?.totalStepsInScene || 1;
  const progressPercent = ((currentStepNum - 1) / Math.max(1, totalSteps - 1)) * 100;
  const currentSceneSteps = engineState?.currentScene?.steps || [];
  const currentSceneNum = (engineState?.currentSceneIndex ?? 0) + 1;
  const totalScenes = presentation.scenes.length || 1;

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto items-center">
      {/* Presentation Header Bar */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 rounded-2xl shadow-lg shadow-cyan-500/10">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              {presentation.title}
              {source && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 font-mono font-semibold">
                  {source}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Slide {currentSceneNum} of {totalScenes}: <span className="text-slate-300 font-medium">{engineState?.currentScene?.title || "Overview"}</span>
            </p>
          </div>
        </div>

        {/* Action Toolset (Sound, Laser, Fullscreen, JSON, Studio) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSlideSidebar(!showSlideSidebar)}
            title={showSlideSidebar ? "Hide Slide Deck Sidebar" : "Show Slide Deck Sidebar"}
            className={`px-3 py-2 rounded-xl border transition-all text-xs flex items-center gap-1.5 ${
              showSlideSidebar
                ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-sm"
                : "bg-slate-900/80 text-slate-400 hover:text-white border-slate-800 hover:bg-slate-800"
            }`}
          >
            <PanelLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Deck</span>
          </button>

          <button
            onClick={() => setIsLaserPointer(!isLaserPointer)}
            title="Toggle Presenter Laser Pointer"
            className={`px-3 py-2 rounded-xl border transition-all text-xs flex items-center gap-1.5 ${
              isLaserPointer
                ? "bg-red-500/20 text-red-400 border-red-500/50 shadow-lg shadow-red-500/25 animate-pulse"
                : "bg-slate-900/80 text-slate-400 hover:text-white border-slate-800 hover:bg-slate-800"
            }`}
          >
            <Crosshair className="w-4 h-4" />
            <span className="hidden sm:inline">Laser</span>
          </button>

          <button
            onClick={toggleSound}
            title={isSoundEnabled ? "Mute Sound Effects" : "Enable Sound Effects"}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            {isSoundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          <button
            onClick={() => setIsJsonModalOpen(true)}
            title="Inspect Presentation JSON"
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            <Code className="w-4 h-4" />
          </button>

          {onOpenStudio && (
            <button
              onClick={onOpenStudio}
              title="Edit Slide Deck in Visual Studio"
              className="px-3.5 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-500/10"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Studio</span>
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            title="Fullscreen Presentation"
            className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-mono text-slate-300">
            <span className="text-cyan-400 font-bold">Step {currentStepNum}</span>
            <span className="text-slate-600">/</span>
            <span>{totalSteps}</span>
          </div>
        </div>
      </div>

      {/* Slide / Scene Navigation Tabs */}
      {presentation.scenes.length > 1 && (
        <div className="w-full flex items-center gap-2 overflow-x-auto pb-2.5 mb-2 scrollbar-thin">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider pl-1 shrink-0">
            Slides:
          </span>
          {presentation.scenes.map((scene, sIdx) => {
            const isCurrent = (engineState?.currentSceneIndex ?? 0) === sIdx;
            return (
              <button
                key={scene.id || sIdx}
                onClick={() => handleSelectScene(sIdx)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                  isCurrent
                    ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/25 font-bold"
                    : "bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-900 border-slate-800/80"
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  isCurrent ? "bg-slate-950/20 text-slate-950 font-black" : "bg-slate-800 text-slate-400"
                }`}>
                  {sIdx + 1}
                </span>
                <span className="truncate max-w-[140px]">{scene.title}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Presentation Stage & Deck Navigator Layout */}
      <div className="w-full flex items-start gap-5">
        {/* Left Slide Deck Sidebar Navigator */}
        {showSlideSidebar && !isFullscreen && (
          <SlideNavigator
            scenes={presentation.scenes}
            currentSceneIndex={engineState?.currentSceneIndex ?? 0}
            onSelectScene={handleSelectScene}
          />
        )}

        {/* Center Stage & Controls Column */}
        <div className="flex-1 flex flex-col items-center min-w-0">
          {/* Cinema Ambilight Container */}
          <div className="relative w-full group">
            <div className="absolute -inset-3 bg-gradient-to-r from-blue-600/15 via-cyan-600/10 to-indigo-600/15 rounded-3xl blur-2xl opacity-70 pointer-events-none transition-opacity group-hover:opacity-100" />
            
            {/* 16:9 Presentation Stage Viewport */}
            <div
              ref={stageViewportRef}
              onMouseMove={handleMouseMove}
              className={`relative w-full aspect-[16/9] max-h-[580px] bg-[#07090e] rounded-2xl overflow-hidden shadow-2xl border border-slate-800/90 flex flex-col ring-1 ring-white/5 ${
                isLaserPointer ? "cursor-none" : ""
              }`}
            >
              {/* The DOM Presentation Engine Container */}
              <div ref={containerRef} className="w-full h-full relative" />

              {/* Laser Pointer Glowing Dot */}
              {isLaserPointer && (
                <div
                  className="pointer-events-none absolute w-5 h-5 rounded-full bg-red-500 shadow-[0_0_20px_#ef4444,0_0_35px_#ef4444] transform -translate-x-1/2 -translate-y-1/2 z-30 transition-transform duration-75"
                  style={{ left: `${laserPos.x}px`, top: `${laserPos.y}px` }}
                />
              )}

              {/* Top Floating Progress Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900/60 z-20">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Fullscreen Floating Exit & Navigation Overlay */}
              {isFullscreen && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-950/85 backdrop-blur-md border border-slate-800 px-5 py-2.5 rounded-2xl flex items-center gap-4 z-40 shadow-2xl">
                  <span className="text-xs font-mono text-slate-300">
                    Slide {currentSceneNum}/{totalScenes} &bull; Step {currentStepNum}/{totalSteps}
                  </span>
                  <button
                    onClick={handlePrev}
                    disabled={engineState?.currentStepIndex === 0 && engineState?.currentSceneIndex === 0}
                    className="p-1.5 rounded-xl bg-slate-800 text-white disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="p-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Step Scrubber */}
          {currentSceneSteps.length > 0 && (
            <StepScrubber
              steps={currentSceneSteps}
              currentStepIndex={engineState?.currentStepIndex || 0}
              onSelectStep={handleSelectStep}
            />
          )}

          {/* Presenter Step HUD & Controls */}
          <div className="w-full bg-slate-950/80 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-1 relative overflow-hidden">
            {/* Top glowing accent line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-cyan-500/30 via-blue-500/20 to-transparent" />

            {/* Step Title & Description */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Active Step
                </span>
                <span className="text-sm font-semibold text-slate-100">
                  {currentStep?.title || "Initial State"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {currentStep?.description || "Presenter controls the step flow"}
              </p>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRestart}
                title="Restart Presentation"
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-800"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handlePrev}
                disabled={engineState?.currentStepIndex === 0 && engineState?.currentSceneIndex === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 hover:text-white font-medium text-sm transition-colors border border-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>

              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <Keyboard className="w-3.5 h-3.5 text-slate-400" /> Shortcuts:
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">Space</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">→</kbd> Next Step
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">←</kbd> Prev Step
            </span>
          </div>
        </div>
      </div>

      {/* JSON Schema Inspection Modal */}
      <JsonModal
        presentation={presentation}
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
      />
    </div>
  );
};
