import React, { useState, useRef, useEffect } from "react";
import {
  Loader2,
  Send,
  XCircle,
  FileText,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Landmark,
  Compass,
  Scroll,
  ChevronDown,
  Sparkles,
  Paperclip,
  Layers,
  Zap,
  Cpu,
  LayoutGrid,
} from "lucide-react";
import { extractPdfDocument, ExtractedPdfResult } from "../utils/pdfExtractor";

export type VisualLookTheme =
  | "midnight"
  | "slate"
  | "monochrome"
  | "cobalt"
  | "emerald"
  | "crimson"
  | "oxford"
  | "cambridge"
  | "harvard"
  | "heidelberg"
  | "princeton";
export type AiEngine = "gemini" | "nvidia" | "auto";

export interface GenerationOptions {
  theme: VisualLookTheme;
  slideCount: number;
  archetypes: string[];
  engine?: AiEngine;
}

interface ConceptInputAreaProps {
  onGenerate: (prompt: string, options?: GenerationOptions) => Promise<void>;
  isLoading: boolean;
}

const VISUAL_LOOKS: {
  id: VisualLookTheme;
  name: string;
  icon: any;
  desc: string;
  swatch: string;
  badgeColor: string;
}[] = [
  {
    id: "midnight",
    name: "Midnight Obsidian",
    icon: Sparkles,
    desc: "Deep Obsidian Glass & Electric Cyan",
    swatch: "from-sky-500 to-slate-950",
    badgeColor: "bg-sky-500",
  },
  {
    id: "slate",
    name: "Slate Minimal",
    icon: Layers,
    desc: "Refined Titanium & Cool Slate",
    swatch: "from-slate-400 to-slate-900",
    badgeColor: "bg-slate-400",
  },
  {
    id: "monochrome",
    name: "Pure Monochrome",
    icon: LayoutGrid,
    desc: "High-Contrast Charcoal & Crisp White",
    swatch: "from-zinc-100 to-zinc-900",
    badgeColor: "bg-zinc-300",
  },
  {
    id: "cobalt",
    name: "Royal Cobalt",
    icon: Zap,
    desc: "Deep Navy & Electric Sapphire",
    swatch: "from-blue-500 to-blue-950",
    badgeColor: "bg-blue-500",
  },
  {
    id: "emerald",
    name: "Obsidian Emerald",
    icon: Cpu,
    desc: "Cyber Matrix & Precision Mint",
    swatch: "from-emerald-500 to-emerald-950",
    badgeColor: "bg-emerald-500",
  },
];

import { ARCHETYPE_REGISTRY, VisualArchetypeId } from "@presentation/schema";

const ARCHETYPE_OPTIONS: { id: VisualArchetypeId; label: string; desc: string }[] = Object.values(ARCHETYPE_REGISTRY).map(
  (a) => ({
    id: a.id,
    label: a.name,
    desc: a.description,
  })
);

const SLIDE_COUNT_OPTIONS = [4, 6, 8, 10, 12, 16];

export const ConceptInputArea: React.FC<ConceptInputAreaProps> = ({
  onGenerate,
  isLoading,
}) => {
  const [text, setText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState("");
  const [pdfMetadata, setPdfMetadata] = useState<ExtractedPdfResult | null>(null);

  // Configuration options
  const [selectedTheme, setSelectedTheme] = useState<VisualLookTheme>("midnight");
  const [targetSlideCount, setTargetSlideCount] = useState<number>(6);
  const [selectedEngine, setSelectedEngine] = useState<AiEngine>("auto");
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([
    "interactive-simulator",
    "motion-pipeline",
    "equation-morpher",
    "benchmark-matrix",
    "code-terminal",
    "architecture-topology",
  ]);

  // Dropdown / Popover UI states
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showSlidePicker, setShowSlidePicker] = useState(false);
  const [showEnginePicker, setShowEnginePicker] = useState(false);
  const [showArchetypePicker, setShowArchetypePicker] = useState(false);

  const themePickerRef = useRef<HTMLDivElement>(null);
  const slidePickerRef = useRef<HTMLDivElement>(null);
  const enginePickerRef = useRef<HTMLDivElement>(null);
  const archetypePickerRef = useRef<HTMLDivElement>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (themePickerRef.current && !themePickerRef.current.contains(target)) {
        setShowThemePicker(false);
      }
      if (slidePickerRef.current && !slidePickerRef.current.contains(target)) {
        setShowSlidePicker(false);
      }
      if (enginePickerRef.current && !enginePickerRef.current.contains(target)) {
        setShowEnginePicker(false);
      }
      if (archetypePickerRef.current && !archetypePickerRef.current.contains(target)) {
        setShowArchetypePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleWidget = (wId: string) => {
    setSelectedWidgets((prev) =>
      prev.includes(wId) ? prev.filter((id) => id !== wId) : [...prev, wId]
    );
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading || isExtractingPdf) return;

    const options: GenerationOptions = {
      theme: selectedTheme,
      slideCount: targetSlideCount,
      archetypes: selectedWidgets,
      engine: selectedEngine,
    };

    if (pdfMetadata) {
      const userInstructions =
        text.trim() || "Synthesize complete technical architecture and key takeaways";
      const targetSlides =
        pdfMetadata.totalPages >= 8
          ? targetSlideCount
          : Math.max(4, Math.min(targetSlideCount, pdfMetadata.totalPages));

      let payload = `TOPIC: "${pdfMetadata.title}"\n`;
      payload += `TARGET SLIDE COUNT: ${targetSlides} Slides\n`;
      payload += `PREFERRED THEME: ${selectedTheme.toUpperCase()}\n`;
      payload += `ARCHETYPES: ${selectedWidgets.join(", ")}\n\n`;
      if (pdfMetadata.abstract) {
        payload += `ABSTRACT & SUMMARY:\n"""\n${pdfMetadata.abstract}\n"""\n\n`;
      }
      payload += `USER DIRECTIVE: ${userInstructions}\n\n`;
      payload += `SOURCE DOCUMENT CONTENT:\n"""\n${pdfMetadata.cleanText.slice(0, 250000)}\n"""`;

      onGenerate(payload, options);
    } else if (text.trim()) {
      let payload = `TOPIC: "${text.trim()}"\n`;
      payload += `TARGET SLIDE COUNT: ${targetSlideCount} Slides\n`;
      payload += `PREFERRED THEME: ${selectedTheme.toUpperCase()}\n`;
      payload += `ARCHETYPES: ${selectedWidgets.join(", ")}\n\n`;
      payload += `CONTENT: ${text.trim()}`;

      onGenerate(payload, options);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const processPdfFile = async (file: File) => {
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please upload a valid PDF document (.pdf)");
      return;
    }

    setIsExtractingPdf(true);
    setPdfProgress("Reading PDF document...");

    try {
      const result = await extractPdfDocument(file, 20, (curr, total, status) => {
        setPdfProgress(status || `Analyzing page ${curr} of ${total}...`);
      });

      setPdfMetadata(result);
    } catch (err: any) {
      console.error("PDF processing error:", err);
      alert("Failed to extract PDF: " + (err?.message || "Unknown error"));
    } finally {
      setIsExtractingPdf(false);
      setPdfProgress("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processPdfFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processPdfFile(file);
    }
  };

  const clearPdf = () => {
    setPdfMetadata(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const hasContent = Boolean(pdfMetadata || text.trim());
  const activeLook = VISUAL_LOOKS.find((l) => l.id === selectedTheme) || VISUAL_LOOKS[0];

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hidden File Input for PDF Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Modern Minimalist Glassmorphic Input Form */}
      <form
        onSubmit={handleSubmit}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full rounded-2xl border transition-all duration-300 p-4 sm:p-5 bg-[#0a0a0c]/90 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col gap-3 relative ${
          isDragging
            ? "border-blue-500/80 bg-blue-950/20 scale-[1.005] shadow-[0_0_25px_rgba(59,130,246,0.2)]"
            : "border-white/[0.08] hover:border-white/[0.14] focus-within:border-white/20 focus-within:shadow-[0_0_30px_rgba(255,255,255,0.03)]"
        }`}
      >
        {/* Loaded PDF Metadata Pill */}
        {pdfMetadata && (
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-white truncate text-xs">{pdfMetadata.title}</div>
                <div className="text-neutral-400 font-mono text-[10px] flex items-center gap-2">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ready
                  </span>
                  <span>&bull;</span>
                  <span>{pdfMetadata.totalPages} pages</span>
                  <span>&bull;</span>
                  <span>{pdfMetadata.wordCount.toLocaleString()} words</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={clearPdf}
              className="text-neutral-400 hover:text-red-400 p-1 rounded-md hover:bg-white/[0.05] transition-colors shrink-0"
              title="Remove PDF"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Loading PDF Extraction Spinner */}
        {isExtractingPdf && (
          <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-800/40 flex items-center gap-2 text-xs text-blue-300">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400 shrink-0" />
            <span className="font-mono text-[11px]">{pdfProgress}</span>
          </div>
        )}

        {/* Clean Spacious Prompt Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || isExtractingPdf}
          rows={3}
          placeholder={
            pdfMetadata
              ? "Add custom directives (e.g. 'Focus on system architecture, protocol state machines, and mathematical proof')..."
              : "What presentation would you like to create? Enter a topic, paste notes, or drag & drop a PDF..."
          }
          className="w-full bg-transparent text-white placeholder:text-neutral-500 text-sm sm:text-base leading-relaxed focus:outline-none resize-none min-h-[70px] max-h-[220px]"
        />

        {/* Bottom Streamlined Options & Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-white/[0.06]">
          {/* Left: Compact Configuration Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* 1. Theme Pill & Popover */}
            <div className="relative" ref={themePickerRef}>
              <button
                type="button"
                onClick={() => setShowThemePicker(!showThemePicker)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-300 hover:text-white text-xs font-medium transition-colors"
              >
                <span className={`w-2 h-2 rounded-full ${activeLook.badgeColor}`} />
                <span>{activeLook.name}</span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>

              {showThemePicker && (
                <div className="absolute left-0 bottom-full mb-2 w-56 p-1.5 rounded-xl bg-[#111116] border border-white/[0.12] shadow-2xl z-50 flex flex-col gap-1 backdrop-blur-xl">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase text-neutral-400 font-semibold tracking-wider">
                    Visual Theme
                  </div>
                  {VISUAL_LOOKS.map((theme) => {
                    const IconComp = theme.icon;
                    const isSelected = selectedTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          setSelectedTheme(theme.id);
                          setShowThemePicker(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          isSelected
                            ? "bg-white/[0.12] text-white font-semibold"
                            : "text-neutral-300 hover:bg-white/[0.05] hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <IconComp className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{theme.name}</span>
                        </div>
                        <span className={`w-2.5 h-2.5 rounded-full ${theme.badgeColor}`} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Slide Count Pill & Popover */}
            <div className="relative" ref={slidePickerRef}>
              <button
                type="button"
                onClick={() => setShowSlidePicker(!showSlidePicker)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-300 hover:text-white text-xs font-medium transition-colors"
              >
                <Layers className="w-3 h-3 text-neutral-400" />
                <span>{targetSlideCount} Slides</span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>

              {showSlidePicker && (
                <div className="absolute left-0 bottom-full mb-2 w-40 p-1.5 rounded-xl bg-[#111116] border border-white/[0.12] shadow-2xl z-50 flex flex-col gap-1 backdrop-blur-xl">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase text-neutral-400 font-semibold tracking-wider">
                    Slide Count
                  </div>
                  <div className="grid grid-cols-3 gap-1 px-1 py-0.5">
                    {SLIDE_COUNT_OPTIONS.map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => {
                          setTargetSlideCount(count);
                          setShowSlidePicker(false);
                        }}
                        className={`py-1 rounded-md text-xs font-mono font-bold transition-colors ${
                          targetSlideCount === count
                            ? "bg-white text-black"
                            : "text-neutral-300 hover:bg-white/[0.08] hover:text-white"
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. AI Engine Pill & Popover */}
            <div className="relative" ref={enginePickerRef}>
              <button
                type="button"
                onClick={() => setShowEnginePicker(!showEnginePicker)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-300 hover:text-white text-xs font-medium transition-colors"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>
                  {selectedEngine === "auto"
                    ? "Auto (Nemotron + Gemini)"
                    : selectedEngine === "nvidia"
                    ? "Nemotron 120B"
                    : "Gemini 3.8 Flash"}
                </span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>

              {showEnginePicker && (
                <div className="absolute left-0 bottom-full mb-2 w-56 p-1.5 rounded-xl bg-[#111116] border border-white/[0.12] shadow-2xl z-50 flex flex-col gap-1 backdrop-blur-xl">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase text-neutral-400 font-semibold tracking-wider">
                    AI Engine
                  </div>
                  {[
                    { id: "auto" as const, name: "Auto (Nemotron + Critic)", desc: "NVIDIA Generator + Gemini Audit (Recommended)" },
                    { id: "nvidia" as const, name: "Nemotron 120B", desc: "Pure NVIDIA NIM Synthesis" },
                    { id: "gemini" as const, name: "Gemini 3.8 Flash", desc: "Pure Google Gemini Generation" },
                  ].map((eng) => (
                    <button
                      key={eng.id}
                      type="button"
                      onClick={() => {
                        setSelectedEngine(eng.id);
                        setShowEnginePicker(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        selectedEngine === eng.id
                          ? "bg-white/[0.12] text-white font-semibold"
                          : "text-neutral-300 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      <div className="font-medium">{eng.name}</div>
                      <div className="text-[10px] text-neutral-400">{eng.desc}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Interactive Components Pill & Popover */}
            <div className="relative" ref={archetypePickerRef}>
              <button
                type="button"
                onClick={() => setShowArchetypePicker(!showArchetypePicker)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  selectedWidgets.length > 0
                    ? "bg-white/[0.04] border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/[0.08]"
                    : "bg-white/[0.02] border-white/[0.05] text-neutral-500"
                }`}
              >
                <span>Components ({selectedWidgets.length})</span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>

              {showArchetypePicker && (
                <div className="absolute left-0 bottom-full mb-2 w-56 p-1.5 rounded-xl bg-[#111116] border border-white/[0.12] shadow-2xl z-50 flex flex-col gap-1 backdrop-blur-xl">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase text-neutral-400 font-semibold tracking-wider">
                    Interactive Modules
                  </div>
                  {ARCHETYPE_OPTIONS.map((opt) => {
                    const active = selectedWidgets.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleWidget(opt.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          active
                            ? "bg-white/[0.12] text-white font-medium"
                            : "text-neutral-400 hover:bg-white/[0.05] hover:text-neutral-200"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {active && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 5. Attach PDF Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isExtractingPdf}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-300 hover:text-white text-xs font-medium transition-colors"
              title="Upload PDF document"
            >
              <Paperclip className="w-3 h-3 text-neutral-400" />
              <span>Attach PDF</span>
            </button>
          </div>

          {/* Right: Primary Generate Action Button */}
          <div className="flex items-center gap-2 ml-auto">
            {text.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setText("");
                  clearPdf();
                }}
                disabled={isLoading || isExtractingPdf}
                className="text-neutral-500 hover:text-neutral-300 text-xs px-2 py-1 transition-colors"
              >
                Clear
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || isExtractingPdf || !hasContent}
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed text-black text-xs sm:text-sm font-semibold shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <span>Generate</span>
                  <Send className="w-3 h-3 text-black" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
