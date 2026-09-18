import React, { useState } from "react";
import { Presentation, Scene, Element, Step, StepAction } from "@presentation/schema";
import {
  Play,
  Plus,
  Trash2,
  Copy,
  Layers,
  Sparkles,
  Zap,
  Code,
  Type,
  Square,
  Activity,
  ChevronRight,
  Move,
  Eye,
  Sliders,
  Image as ImageIcon,
} from "lucide-react";
import { ImageGeneratorModal } from "./ImageGeneratorModal";

interface EditorStudioProps {
  presentation: Presentation;
  onChange: (updated: Presentation) => void;
  onSwitchToPlayer: () => void;
}

export const EditorStudio: React.FC<EditorStudioProps> = ({
  presentation,
  onChange,
  onSwitchToPlayer,
}) => {
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"elements" | "steps" | "json">("steps");
  const [previewingStepIndex, setPreviewingStepIndex] = useState<number | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const currentScene: Scene | undefined = presentation.scenes[selectedSceneIndex];

  const handleInsertPhoto = (image: { src: string; alt: string; title: string }) => {
    if (!currentScene) return;
    const elId = `el-${Date.now()}`;
    const newElement: Element = {
      id: elId,
      type: "image",
      src: image.src,
      alt: image.alt,
      tag: "AI PHOTO",
      title: image.title,
      accentColor: "#38bdf8",
    } as any;

    updateCurrentScene((sc) => ({
      ...sc,
      elements: [...sc.elements, newElement],
    }));
    setSelectedElementId(elId);
  };

  const updateCurrentScene = (updater: (scene: Scene) => Scene) => {
    if (!currentScene) return;
    const updatedScenes = [...presentation.scenes];
    updatedScenes[selectedSceneIndex] = updater({ ...currentScene });
    onChange({ ...presentation, scenes: updatedScenes });
  };

  // Add a new slide
  const handleAddScene = () => {
    const newSceneIndex = presentation.scenes.length + 1;
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      title: `Slide ${newSceneIndex}`,
      subtitle: "New interactive slide",
      category: "CONCEPTS",
      layout: "cards",
      elements: [
        {
          id: `card-${Date.now()}-1`,
          type: "card",
          title: "Core Concept",
          tag: "KEY POINT",
          badge: "01",
          description: "Enter your explanation here.",
          points: ["Point 1: Key insight", "Point 2: Supporting detail"],
          accentColor: "#38bdf8",
        },
      ],
      steps: [
        {
          id: `step-${Date.now()}-1`,
          title: "Initial Overview",
          description: "Introduction to this slide",
          actions: [],
        },
      ],
    };

    onChange({
      ...presentation,
      scenes: [...presentation.scenes, newScene],
    });
    setSelectedSceneIndex(presentation.scenes.length);
  };

  // Delete current slide
  const handleDeleteScene = (idx: number) => {
    if (presentation.scenes.length <= 1) return;
    const updated = presentation.scenes.filter((_, i) => i !== idx);
    onChange({ ...presentation, scenes: updated });
    setSelectedSceneIndex(Math.max(0, idx - 1));
  };

  // Add Element to current slide
  const handleAddElement = (type: "card" | "text" | "equation" | "interactive-widget") => {
    if (!currentScene) return;
    const elId = `el-${Date.now()}`;
    let newElement: Element;

    if (type === "card") {
      newElement = {
        id: elId,
        type: "card",
        title: "New Concept Card",
        tag: "TOPIC",
        description: "Explain your mechanism here.",
        points: ["Key aspect A", "Key aspect B"],
        accentColor: "#818cf8",
      };
    } else if (type === "equation") {
      newElement = {
        id: elId,
        type: "equation",
        rawEquation: "E = mc^2",
        tokens: [
          { id: `${elId}-t1`, text: "E", type: "variable", color: "#38bdf8" },
          { id: `${elId}-t2`, text: "=", type: "operator" },
          { id: `${elId}-t3`, text: "m", type: "variable", color: "#34d399" },
          { id: `${elId}-t4`, text: "c^2", type: "constant", color: "#f8fafc" },
        ],
      };
    } else if (type === "interactive-widget") {
      newElement = {
        id: elId,
        type: "interactive-widget",
        widgetType: "boolean-simulator",
        title: "Live Hardware Logic Simulator",
        config: {},
      };
    } else {
      newElement = {
        id: elId,
        type: "text",
        content: "New Text Block\n- Bullet item 1\n- Bullet item 2",
        fontSize: 20,
        color: "#ffffff",
      };
    }

    updateCurrentScene((sc) => ({
      ...sc,
      elements: [...sc.elements, newElement],
    }));
    setSelectedElementId(elId);
  };

  // Add Animation Step to current slide
  const handleAddStep = () => {
    if (!currentScene) return;
    const stepCount = currentScene.steps.length + 1;
    const firstElementId = currentScene.elements[0]?.id || "target";

    const newStep: Step = {
      id: `step-${Date.now()}`,
      title: `Step ${stepCount}: Highlight Focus`,
      description: "Draw attention to the active concept",
      actions: [
        {
          action: "highlight",
          target: firstElementId,
          color: "#38bdf8",
          duration: 0.6,
          pulse: true,
        },
      ],
    };

    updateCurrentScene((sc) => ({
      ...sc,
      steps: [...sc.steps, newStep],
    }));
  };

  // Delete a Step
  const handleDeleteStep = (stepIdx: number) => {
    if (!currentScene) return;
    updateCurrentScene((sc) => ({
      ...sc,
      steps: sc.steps.filter((_, i) => i !== stepIdx),
    }));
  };

  // Add an Action to a Step
  const handleAddActionToStep = (stepIdx: number) => {
    if (!currentScene) return;
    const targetEl = currentScene.elements[0]?.id || "element";
    const newAction: StepAction = {
      action: "highlight",
      target: targetEl,
      color: "#818cf8",
      duration: 0.5,
      pulse: true,
    };

    updateCurrentScene((sc) => {
      const updatedSteps = [...sc.steps];
      const step = { ...updatedSteps[stepIdx] };
      step.actions = [...step.actions, newAction];
      updatedSteps[stepIdx] = step;
      return { ...sc, steps: updatedSteps };
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col h-[820px] bg-[#07090e] border border-slate-800/90 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn relative">
      {/* Top Ambient Glow */}
      <div className="absolute -top-32 left-1/3 w-96 h-48 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Studio Top Control Bar */}
      <div className="w-full h-15 px-6 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 rounded-xl shadow-lg shadow-cyan-500/10">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                VISUAL STUDIO &bull; ARCHITECT
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono font-semibold">
                {presentation.scenes.length} Slides
              </span>
            </div>
            <input
              type="text"
              value={presentation.title}
              onChange={(e) => onChange({ ...presentation, title: e.target.value })}
              className="bg-transparent text-sm font-bold text-white focus:outline-none focus:border-b border-cyan-400 max-w-sm"
              placeholder="Presentation Title"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleAddScene}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Add Slide</span>
          </button>

          <button
            onClick={onSwitchToPlayer}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Present Keynote</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Left Thumbnails + Center Stage Preview + Right Inspector */}
      <div className="flex-1 flex overflow-hidden z-10">
        {/* Left Slide Thumbnails Strip */}
        <div className="w-60 bg-slate-950/60 backdrop-blur-md border-r border-slate-800/80 flex flex-col p-3.5 overflow-y-auto shrink-0 custom-scrollbar">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Slide Sequence
            </span>
            <button
              onClick={handleAddScene}
              className="p-1 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800 transition-colors"
              title="Add New Slide"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {presentation.scenes.map((scene, sIdx) => {
              const isSelected = sIdx === selectedSceneIndex;
              return (
                <div
                  key={scene.id || sIdx}
                  onClick={() => setSelectedSceneIndex(sIdx)}
                  className={`group relative p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? "bg-cyan-500/10 border-cyan-500/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/20"
                      : "bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-850/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                        isSelected
                          ? "bg-cyan-500 text-slate-950 font-black shadow-sm"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {String(sIdx + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                      {scene.layout || "cards"}
                    </span>
                  </div>
                  <h4
                    className={`text-xs font-bold truncate mb-1 ${
                      isSelected ? "text-cyan-300" : "text-white"
                    }`}
                  >
                    {scene.title}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>{scene.elements.length} Components</span>
                    <span>{scene.steps.length} Steps</span>
                  </div>

                  {/* Delete Button on Hover */}
                  {presentation.scenes.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteScene(sIdx);
                      }}
                      title="Delete Slide"
                      className="opacity-0 group-hover:opacity-100 absolute top-2.5 right-2.5 p-1 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}

                  {isSelected && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-r shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Canvas Preview Area */}
        <div className="flex-1 bg-[#06080e] flex flex-col p-6 overflow-hidden items-center justify-center relative">
          {currentScene ? (
            <div className="relative w-full h-full max-w-4xl max-h-[500px] flex flex-col">
              {/* Canvas backlight */}
              <div className="absolute -inset-2 bg-gradient-to-r from-cyan-600/10 via-blue-600/5 to-purple-600/10 rounded-3xl blur-2xl opacity-60 pointer-events-none" />

              <div className="relative w-full h-full aspect-[16/9] bg-[#090d16] border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col p-6 select-none ring-1 ring-white/5">
                {/* Slide Top Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
                      {currentScene.category || "SLIDE"}
                    </span>
                    <input
                      type="text"
                      value={currentScene.title}
                      onChange={(e) =>
                        updateCurrentScene((sc) => ({ ...sc, title: e.target.value }))
                      }
                      className="bg-transparent text-base font-bold text-white focus:outline-none focus:border-b border-cyan-400"
                    />
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    Slide {selectedSceneIndex + 1} of {presentation.scenes.length}
                  </span>
                </div>

                {/* Slide Elements Layout Grid */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3.5 items-stretch overflow-y-auto custom-scrollbar">
                  {currentScene.elements.map((el, eIdx) => {
                    const isSelected = el.id === selectedElementId;
                    return (
                      <div
                        key={el.id || eIdx}
                        onClick={() => setSelectedElementId(el.id)}
                        className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all relative group ${
                          isSelected
                            ? "bg-slate-900 border-cyan-500 ring-2 ring-cyan-500/20 shadow-lg shadow-cyan-500/10"
                            : "bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80"
                        }`}
                        style={{
                          borderTop: `3px solid ${(el as any).accentColor || "#38bdf8"}`,
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                            {(el as any).tag || `0${eIdx + 1}`}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">{el.type}</span>
                        </div>

                        {el.type === "image" ? (
                          <div className="my-auto space-y-1.5">
                            <img
                              src={(el as any).src}
                              alt={(el as any).alt || "AI Photo"}
                              className="w-full h-20 object-cover rounded-lg border border-slate-800 shadow-md"
                            />
                            <p className="text-[10px] font-mono text-cyan-400 truncate">
                              {(el as any).alt || "NVIDIA NIM Photo"}
                            </p>
                          </div>
                        ) : (
                          <div className="my-auto">
                            <h5 className="text-sm font-bold text-white mb-1 truncate">
                              {(el as any).title || (el as any).content || "Element"}
                            </h5>
                            <p className="text-[11px] text-slate-400 line-clamp-2">
                              {(el as any).description || "Interactive slide component"}
                            </p>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>ID: {el.id.slice(-6)}</span>
                          <span style={{ color: (el as any).accentColor || "#38bdf8" }}>Active</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Quick Toolbar */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">Insert:</span>
                    <button
                      onClick={() => handleAddElement("card")}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-300 border border-slate-800 transition-colors"
                    >
                      + Card
                    </button>
                    <button
                      onClick={() => handleAddElement("equation")}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-300 border border-slate-800 transition-colors"
                    >
                      + Equation
                    </button>
                    <button
                      onClick={() => handleAddElement("text")}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-300 border border-slate-800 transition-colors"
                    >
                      + Text
                    </button>
                    <button
                      onClick={() => handleAddElement("interactive-widget")}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold transition-colors"
                    >
                      + Simulator
                    </button>
                    <button
                      onClick={() => setIsImageModalOpen(true)}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>+ Photo</span>
                    </button>
                  </div>

                  <button
                    onClick={handleAddStep}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>+ Step Action</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 font-mono text-sm">No slide selected</div>
          )}
        </div>

        {/* Right Inspector & Sequencer Panel */}
        <div className="w-80 bg-slate-950/70 backdrop-blur-md border-l border-slate-800/80 flex flex-col shrink-0 overflow-hidden">
          {/* Tabs Header */}
          <div className="flex border-b border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveTab("steps")}
              className={`flex-1 py-3 text-center font-bold border-b-2 transition-colors ${
                activeTab === "steps"
                  ? "border-cyan-400 text-cyan-300 bg-cyan-500/5"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              Step Sequencer ({currentScene?.steps.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("elements")}
              className={`flex-1 py-3 text-center font-bold border-b-2 transition-colors ${
                activeTab === "elements"
                  ? "border-cyan-400 text-cyan-300 bg-cyan-500/5"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              Components ({currentScene?.elements.length || 0})
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {activeTab === "steps" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
                    Animation Sequence
                  </span>
                  <button
                    onClick={handleAddStep}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition-colors shadow-sm shadow-cyan-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Step</span>
                  </button>
                </div>

                {currentScene?.steps.map((step, stIdx) => (
                  <div
                    key={step.id || stIdx}
                    className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-left relative group transition-all hover:border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
                        STEP {stIdx + 1}
                      </span>
                      <button
                        onClick={() => handleDeleteStep(stIdx)}
                        className="text-slate-500 hover:text-red-400 p-1 rounded-md hover:bg-slate-800 transition-colors"
                        title="Delete Step"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) =>
                        updateCurrentScene((sc) => {
                          const updated = [...sc.steps];
                          updated[stIdx] = { ...step, title: e.target.value };
                          return { ...sc, steps: updated };
                        })
                      }
                      className="w-full bg-transparent text-xs font-bold text-white focus:outline-none border-b border-transparent focus:border-cyan-400 mb-1"
                    />

                    <input
                      type="text"
                      value={step.description || ""}
                      placeholder="Narration or transition description..."
                      onChange={(e) =>
                        updateCurrentScene((sc) => {
                          const updated = [...sc.steps];
                          updated[stIdx] = { ...step, description: e.target.value };
                          return { ...sc, steps: updated };
                        })
                      }
                      className="w-full bg-transparent text-[11px] text-slate-400 focus:outline-none border-b border-transparent focus:border-cyan-400 mb-2"
                    />

                    {/* Actions List */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span>Actions ({step.actions.length})</span>
                        <button
                          onClick={() => handleAddActionToStep(stIdx)}
                          className="text-cyan-400 hover:underline flex items-center gap-0.5 font-bold"
                        >
                          + Action
                        </button>
                      </div>

                      {step.actions.map((act, aIdx) => (
                        <div
                          key={aIdx}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800/60 text-[11px] font-mono text-slate-300"
                        >
                          <span className="text-cyan-300 font-bold">{act.action}</span>
                          <span className="text-slate-400 truncate max-w-[100px]">
                            {(act as any).target || (act as any).targets?.join(", ") || "element"}
                          </span>
                          <span className="text-slate-500">{act.duration}s</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider mb-2 block">
                  Elements on Slide
                </span>
                {currentScene?.elements.map((el, eIdx) => (
                  <div
                    key={el.id || eIdx}
                    onClick={() => setSelectedElementId(el.id)}
                    className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-left hover:border-slate-700 hover:bg-slate-900/80 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">
                        {(el as any).title || el.id}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">{el.type}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {(el as any).description || (el as any).content || "Interactive slide component"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NVIDIA NIM Photo Studio Modal */}
      <ImageGeneratorModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        slideTitle={currentScene?.title}
        slideCategory={currentScene?.category}
        onInsertImage={handleInsertPhoto}
      />
    </div>
  );
};
