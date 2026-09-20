import React, { useState, useRef } from "react";
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
  Layers,
  Sliders,
  Cpu,
  Radio,
  Activity,
  Palette,
} from "lucide-react";
import { extractPdfDocument, ExtractedPdfResult } from "../utils/pdfExtractor";

export type VisualLookTheme = "oxford" | "cambridge" | "harvard" | "heidelberg" | "princeton";
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
  activeBorder: string;
  glow: string;
}[] = [
  {
    id: "oxford",
    name: "Oxford Navy",
    icon: Landmark,
    desc: "Academic Navy & Crisp Slate",
    swatch: "from-blue-700 via-blue-900 to-slate-900",
    activeBorder: "border-blue-500 ring-1 ring-blue-500/50",
    glow: "bg-blue-500/10",
  },
  {
    id: "cambridge",
    name: "Cambridge Slate",
    icon: BookOpen,
    desc: "Minimalist Academic Silver & Chalk",
    swatch: "from-slate-400 via-slate-600 to-neutral-900",
    activeBorder: "border-slate-300 ring-1 ring-slate-300/50",
    glow: "bg-slate-400/10",
  },
  {
    id: "harvard",
    name: "Harvard Crimson",
    icon: GraduationCap,
    desc: "Ivy League Burgundy & Warm Slate",
    swatch: "from-red-700 via-red-900 to-neutral-900",
    activeBorder: "border-red-600 ring-1 ring-red-600/50",
    glow: "bg-red-600/10",
  },
  {
    id: "heidelberg",
    name: "Heidelberg Scholar",
    icon: Compass,
    desc: "Classical Botanical & Forest Green",
    swatch: "from-emerald-700 via-emerald-900 to-neutral-900",
    activeBorder: "border-emerald-600 ring-1 ring-emerald-600/50",
    glow: "bg-emerald-600/10",
  },
  {
    id: "princeton",
    name: "Princeton Bronze",
    icon: Scroll,
    desc: "Antique Scholar Bronze & Warm Ochre",
    swatch: "from-amber-700 via-amber-900 to-neutral-900",
    activeBorder: "border-amber-600 ring-1 ring-amber-600/50",
    glow: "bg-amber-600/10",
  },
];

const TOPIC_PRESETS = [
  {
    label: "Quantum Qubits & Transmons",
    prompt:
      "Superconducting Artificial Atoms: Transmon qubits, Josephson junction non-linearities, and microwave dispersive readout in circuit QED",
  },
  {
    label: "Distributed Raft Consensus",
    prompt:
      "Distributed Consensus: Raft protocol leader election, log replication safety invariants, and joint consensus cluster membership",
  },
  {
    label: "Attention & Vision Transformers",
    prompt:
      "Self-Attention Architectures: Multi-Head Attention equations, scaled dot-product computation, and Vision Transformer patch projections",
  },
  {
    label: "Edge IoT & LoRaWAN Networks",
    prompt:
      "IoT System Architecture: Low-power sensor telemetry, LoRaWAN chirped spread spectrum, and edge MQTT brokers",
  },
];

export const ConceptInputArea: React.FC<ConceptInputAreaProps> = ({
  onGenerate,
  isLoading,
}) => {
  const [text, setText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState("");
  const [pdfMetadata, setPdfMetadata] = useState<ExtractedPdfResult | null>(null);

  // Pre-generation look & style choices
  const [selectedTheme, setSelectedTheme] = useState<VisualLookTheme>("oxford");
  const [targetSlideCount, setTargetSlideCount] = useState<number>(5);
  const [selectedEngine, setSelectedEngine] = useState<AiEngine>("gemini");
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([
    "equations",
    "architecture-stack",
    "protocol-matrix",
    "telemetry-cable",
  ]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const targetSlides = pdfMetadata.totalPages >= 8 ? targetSlideCount : Math.max(4, Math.min(targetSlideCount, pdfMetadata.totalPages));

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

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Hidden File Input for PDF Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Preset Topics Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono shrink-0">
          Presets:
        </span>
        {TOPIC_PRESETS.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading || isExtractingPdf}
            onClick={() => {
              setText(preset.prompt);
              clearPdf();
            }}
            className="text-xs px-3 py-1.5 rounded-full bg-[#0d0d0d] hover:bg-[#1a1a1a] border border-neutral-800 hover:border-neutral-600 text-neutral-300 hover:text-white transition-all shrink-0 active:scale-95 disabled:opacity-40 shadow-sm"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Main Input Form with Dropzone */}
      <form
        onSubmit={handleSubmit}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full rounded-2xl border transition-all p-4 bg-[#0a0a0a] backdrop-blur-xl shadow-2xl flex flex-col gap-3 relative ${
          isDragging
            ? "border-cyan-400 bg-[#0d141f] scale-[1.01]"
            : "border-neutral-800 hover:border-neutral-700 focus-within:border-cyan-500/80 focus-within:shadow-cyan-500/10"
        }`}
      >
        {/* Top Header info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              {pdfMetadata ? "PDF Document Loaded" : "Interactive Keynote Generator"}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
            {(text.length > 0 || pdfMetadata) && (
              <button
                type="button"
                onClick={() => {
                  setText("");
                  clearPdf();
                }}
                disabled={isLoading || isExtractingPdf}
                className="flex items-center gap-1 text-slate-400 hover:text-red-400 transition-colors"
                title="Clear input"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
            <span>{text.length} chars</span>
          </div>
        </div>

        {/* Loaded PDF Metadata Card */}
        {pdfMetadata && (
          <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-indigo-950/40 border border-cyan-500/35 flex items-center justify-between gap-3 text-xs shadow-lg">
            <div className="flex items-center gap-2.5 text-cyan-300 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-white truncate text-sm">{pdfMetadata.title}</div>
                <div className="text-slate-400 font-mono text-[11px] flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> High-Fidelity Extracted
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
              className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              title="Remove PDF"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Loading PDF Extraction Spinner */}
        {isExtractingPdf && (
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-2.5 text-xs text-cyan-300">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />
            <span className="font-mono">{pdfProgress}</span>
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || isExtractingPdf}
          rows={3}
          placeholder={
            pdfMetadata
              ? "Add optional custom instructions (e.g. 'Focus on the Multi-Head Attention mechanism and benchmarks')..."
              : "Enter topic, paste technical notes, or drag & drop a PDF paper here...&#10;e.g. 'Chapter 1: Introduction to Internet of Things: Equations, 4-Stage Layered Architecture, 11 Communication Protocols, and Data Sources.'"
          }
          className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm leading-relaxed focus:outline-none resize-y min-h-[75px] max-h-[220px]"
        />

        {/* ========================================================== */}
        {/* PRE-GENERATION SELECTOR: CHOOSE YOUR LOOK & ARCHETYPES */}
        {/* ========================================================== */}
        <div className="pt-3 border-t border-slate-800/90 flex flex-col gap-3">
          {/* Visual Look / Palette Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>CHOOSE VISUAL LOOK / PALETTE:</span>
              </span>
              <span className="text-[11px] font-mono text-cyan-400 font-bold">
                {VISUAL_LOOKS.find((l) => l.id === selectedTheme)?.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {VISUAL_LOOKS.map((look) => {
                const IconComp = look.icon;
                const isSelected = selectedTheme === look.id;
                return (
                  <button
                    key={look.id}
                    type="button"
                    onClick={() => setSelectedTheme(look.id)}
                    className={`p-2.5 rounded-xl border-2 transition-all flex flex-col items-start gap-1.5 text-left relative overflow-hidden shadow-sm ${
                      isSelected
                        ? `${look.activeBorder} ${look.glow} scale-[1.03] shadow-lg`
                        : "border-slate-700/70 bg-slate-800/60 hover:bg-slate-800 hover:border-slate-600 text-slate-300"
                    }`}
                  >
                    <div className="w-full flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <IconComp className="w-3.5 h-3.5 text-white" />
                        <span className="text-xs font-black text-white">{look.name}</span>
                      </div>
                      <span
                        className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${look.swatch} border border-white/40`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight line-clamp-1">
                      {look.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Options: Slide Count & Widgets */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-800">
            {/* Target Slide Count */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-neutral-400">SLIDES:</span>
              <div className="flex items-center gap-1 bg-[#111111] p-1 rounded-lg border border-neutral-800 overflow-x-auto max-w-[280px] sm:max-w-none scrollbar-none">
                {[4, 6, 8, 10, 12, 14, 16, 18, 20].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setTargetSlideCount(count)}
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all ${
                      targetSlideCount === count
                        ? "bg-white text-black shadow-md font-black"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Engine Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-neutral-400">ENGINE:</span>
              <div className="flex items-center gap-1 bg-[#111111] p-1 rounded-lg border border-neutral-800">
                {[
                  { id: "gemini" as const, label: "Gemini 3.8 Flash", activeClass: "bg-amber-400 text-black font-bold shadow-sm" },
                  { id: "nvidia" as const, label: "Nemotron 120B", activeClass: "bg-emerald-400 text-black font-bold shadow-sm" },
                  { id: "auto" as const, label: "Auto Hybrid", activeClass: "bg-cyan-400 text-black font-bold shadow-sm" },
                ].map((eng) => (
                  <button
                    key={eng.id}
                    type="button"
                    onClick={() => setSelectedEngine(eng.id)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                      selectedEngine === eng.id
                        ? eng.activeClass
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    {eng.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Widget Archetypes */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-mono font-bold text-neutral-400 hidden sm:inline">
                COMPONENTS:
              </span>
              {[
                { id: "equations", label: "Formulas" },
                { id: "architecture-stack", label: "Architecture Stack" },
                { id: "protocol-matrix", label: "Matrix Grid" },
                { id: "telemetry-cable", label: "Data Flow" },
              ].map((w) => {
                const isActive = selectedWidgets.includes(w.id);
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => toggleWidget(w.id)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold transition-all border ${
                      isActive
                        ? "bg-neutral-800 border-neutral-600 text-white"
                        : "bg-[#111111] border-neutral-800 text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-1 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isExtractingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 hover:border-cyan-500/40 text-xs font-semibold text-slate-300 hover:text-white transition-all active:scale-95 shadow-sm"
              title="Upload academic paper, slides, or technical PDF"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Attach PDF</span>
            </button>

            <span className="text-[11px] text-slate-500 hidden md:inline font-mono">
              or drop a .pdf file directly here
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading || isExtractingPdf || !hasContent}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-cyan-500/25 transition-all active:scale-95 hover:shadow-cyan-500/40"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Synthesizing in {selectedTheme.toUpperCase()}...</span>
              </>
            ) : (
              <>
                <span>Generate Presentation</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
