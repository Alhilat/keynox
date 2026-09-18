import React, { useState } from "react";
import {
  Sparkles,
  Image as ImageIcon,
  Loader2,
  X,
  Check,
  RefreshCw,
  Sliders,
  Zap,
} from "lucide-react";

interface ImageGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  slideTitle?: string;
  slideCategory?: string;
  onInsertImage: (image: { src: string; alt: string; title: string }) => void;
}

export const ImageGeneratorModal: React.FC<ImageGeneratorModalProps> = ({
  isOpen,
  onClose,
  slideTitle = "",
  slideCategory = "",
  onInsertImage,
}) => {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "1:1">("16:9");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generationMeta, setGenerationMeta] = useState<{
    model?: string;
    latencyMs?: number;
    seed?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto-suggest a high-fidelity photorealistic prompt from the slide context
  const handleSuggestPrompt = () => {
    const topic = slideTitle || "advanced technological system";
    const category = slideCategory || "engineering";
    const suggestion = `A photorealistic cinematic macro photograph of ${topic.toLowerCase()} in a modern high-tech laboratory environment, illuminated by cyan and deep blue fiber optics, highly detailed 8k resolution, professional studio lighting`;
    setPrompt(suggestion);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a photo prompt");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);
    setGenerationMeta(null);

    const width = aspectRatio === "16:9" ? 1024 : 1024;
    const height = aspectRatio === "16:9" ? 576 : 1024;

    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          width,
          height,
          steps: 2,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Image generation failed");
      }

      setGeneratedImage(data.imageUrl);
      setGenerationMeta({
        model: data.model || "FLUX.2-klein-4b",
        latencyMs: data.latencyMs,
        seed: data.seed,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to connect to NVIDIA NIM image generation endpoint");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsert = () => {
    if (!generatedImage) return;
    onInsertImage({
      src: generatedImage,
      alt: prompt.slice(0, 100),
      title: slideTitle ? `${slideTitle} Visual` : "NVIDIA AI Visual",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0b0f19] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Accent Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500"></div>

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/25">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  NVIDIA NIM Photo Studio
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  FLUX.2-klein-4b
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Generate domain-specific photorealistic presentation imagery in ~2 seconds
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Prompt Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Photo Prompt
              </label>
              <button
                type="button"
                onClick={handleSuggestPrompt}
                className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Suggest from Slide</span>
              </button>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A photorealistic high-speed optical transceiver module on a gold-plated PCB, macro lens, cinematic blue reflections, 8k resolution..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
            />
          </div>

          {/* Aspect Ratio & Options */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Aspect Ratio:</span>
              <button
                type="button"
                onClick={() => setAspectRatio("16:9")}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-colors border ${
                  aspectRatio === "16:9"
                    ? "bg-blue-600/20 text-blue-400 border-blue-500/40 font-bold"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                16:9 Keynote (1024x576)
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio("1:1")}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-colors border ${
                  aspectRatio === "1:1"
                    ? "bg-blue-600/20 text-blue-400 border-blue-500/40 font-bold"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                1:1 Card (1024x1024)
              </button>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all active:scale-95 shrink-0"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Generate Photo</span>
                </>
              )}
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
              {error}
            </div>
          )}

          {/* Live Preview Area */}
          <div className="pt-2">
            <div className="w-full min-h-[220px] rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col items-center justify-center overflow-hidden relative">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-3 p-8 text-center">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
                    <Sparkles className="w-5 h-5 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">
                      Generating with NVIDIA FLUX.2-klein-4b...
                    </p>
                    <p className="text-[11px] font-mono text-slate-400">
                      Processing 4B rectified flow diffusion steps
                    </p>
                  </div>
                </div>
              ) : generatedImage ? (
                <div className="relative w-full group">
                  <img
                    src={generatedImage}
                    alt="Generated Preview"
                    className="w-full max-h-[340px] object-cover rounded-xl shadow-2xl"
                  />
                  {generationMeta && (
                    <div className="absolute bottom-2 left-2 right-2 px-3 py-1.5 rounded-lg bg-black/75 backdrop-blur border border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-300">
                      <span>Model: {generationMeta.model}</span>
                      {generationMeta.latencyMs && (
                        <span>Speed: {(generationMeta.latencyMs / 1000).toFixed(2)}s</span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 p-8 text-slate-500 text-center">
                  <ImageIcon className="w-10 h-10 stroke-1 opacity-50" />
                  <p className="text-xs">Generated photo preview will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleInsert}
            disabled={!generatedImage}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Insert into Slide</span>
          </button>
        </div>
      </div>
    </div>
  );
};
