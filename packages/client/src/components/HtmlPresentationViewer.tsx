import React, { useState, useRef, useEffect } from "react";
import { openPresenterConsole } from "../utils/presenterConsole";
import {
  Maximize2,
  Minimize2,
  ExternalLink,
  Download,
  Copy,
  Check,
  Code,
  Layers,
} from "lucide-react";

interface HtmlPresentationViewerProps {
  html: string;
  title: string;
  outline?: string;
  onPresentKeynote?: () => void;
  onOpenStudio?: () => void;
}

export const HtmlPresentationViewer: React.FC<HtmlPresentationViewerProps> = ({
  html,
  title,
  outline,
  onPresentKeynote,
  onOpenStudio,
}) => {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [totalSlidesCount, setTotalSlidesCount] = useState(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const presenterWinRef = useRef<Window | null>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setIsFullscreen(isFs);
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          {
            type: "HYPERDECK_SET_FULLSCREEN",
            isFullscreen: isFs,
          },
          "*"
        );
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Listen for navigation & sync messages from presentation iframe and presenter window
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;

      if (e.data.type === "HYPERDECK_STATE_UPDATE") {
        setCurrentSlideIndex(e.data.currentSlide);
        if (typeof e.data.totalSlides === "number") {
          setTotalSlidesCount(e.data.totalSlides);
        }
        // Relay to Presenter Console window if open
        if (presenterWinRef.current && !presenterWinRef.current.closed) {
          presenterWinRef.current.postMessage(
            {
              type: "HYPERDECK_PRESENTER_SYNC",
              currentSlide: e.data.currentSlide,
              totalSlides: e.data.totalSlides,
              title: e.data.title,
              notes: e.data.notes,
            },
            "*"
          );
        }
      } else if (e.data.type === "HYPERDECK_PRESENTER_ACTION") {
        // Relay action from Presenter Console to the presentation iframe
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            {
              type: "HYPERDECK_NAVIGATE",
              action: e.data.action,
              index: e.data.index,
            },
            "*"
          );
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleOpenPresenterConsole = () => {
    const win = openPresenterConsole(html, title);
    if (win) {
      presenterWinRef.current = win;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-presentation.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPptx = async () => {
    try {
      const response = await fetch("/api/ai/export-pptx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          html,
        }),
      });

      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[HtmlPresentationViewer] PPTX Export error:", err);
      alert("PPTX export failed. Check server log.");
    }
  };

  const handleOpenNewTab = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col items-center animate-fadeIn">
      {/* Top Presentation Toolbar Box */}
      <div className="w-full bg-slate-900/90 border border-slate-800/90 backdrop-blur-xl rounded-2xl p-3 sm:px-4 sm:py-3 shadow-xl mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 shrink-0 shadow-inner">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2 truncate">
              <span className="truncate">{title.replace(/^TOPIC:\s*["']?|["']?$/gi, "")}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold uppercase tracking-wider shrink-0 shadow-sm">
                16:9 Keynote
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span>Interactive Web App &bull; GSAP Animations &bull; Offline Ready</span>
            </p>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setShowCode(!showCode)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              showCode
                ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/50 shadow-indigo-500/10"
                : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border-slate-700/80"
            }`}
            title="Inspect Generated HTML/CSS/JS Source"
          >
            <Code className="w-3.5 h-3.5 text-indigo-400" />
            <span>Code</span>
          </button>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Copy HTML to Clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Download Standalone Presentation HTML"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download HTML</span>
          </button>

          <button
            onClick={handleExportPptx}
            className="px-3 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            title="Export to PowerPoint (.pptx)"
          >
            <Download className="w-3.5 h-3.5 text-orange-400" />
            <span>Export PPTX</span>
          </button>

          <button
            onClick={handleOpenNewTab}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Open Presentation in New Browser Tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span>New Tab</span>
          </button>

          <button
            onClick={handleFullscreen}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 active:scale-95"
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Present Fullscreen (F)"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </button>
        </div>
      </div>

      {/* Code Inspector Drawer */}
      {showCode && (
        <div className="w-full mb-4 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="font-bold text-slate-200">Generated Presentation Source Code</span>
            <span className="text-[11px] text-slate-500">{html.length} characters</span>
          </div>
          <pre className="p-4 max-h-72 overflow-y-auto text-xs font-mono text-emerald-300/90 leading-relaxed whitespace-pre-wrap select-text">
            {html}
          </pre>
        </div>
      )}

      {/* 16:9 Responsive Presentation Stage with Cinema Ambilight */}
      <div className="relative w-full flex items-center justify-center my-1">
        {/* Cinema Ambilight Ambient Glow Effect */}
        {!isFullscreen && (
          <div className="absolute -inset-3 sm:-inset-6 bg-gradient-to-r from-cyan-500/18 via-indigo-500/14 to-purple-500/18 rounded-3xl blur-2xl opacity-80 pointer-events-none -z-10 transition-all duration-700"></div>
        )}

        <div
          ref={containerRef}
          className={
            isFullscreen
              ? "fixed inset-0 w-screen h-screen z-50 bg-[#07090e] flex flex-col m-0 p-0 rounded-none border-0"
              : "w-full aspect-[16/9] mx-auto bg-[#07090e] rounded-2xl overflow-hidden shadow-2xl border border-slate-800/90 flex flex-col relative transition-all ring-1 ring-white/5"
          }
          style={
            isFullscreen
              ? {}
              : {
                  maxHeight: "calc(100vh - 160px)",
                  maxWidth: "calc((100vh - 160px) * 16 / 9)",
                }
          }
        >
          <iframe
            ref={iframeRef}
            srcDoc={html}
            title={title}
            className="w-full h-full border-0 bg-[#07090e]"
            sandbox="allow-scripts allow-modals allow-fullscreen allow-same-origin"
          />
        </div>
      </div>

      {/* Quick Navigation & Interaction Tip */}
      <div className="w-full mt-3 px-2 flex items-center justify-between text-xs text-neutral-500 font-mono">
        <span>Click inside slide to enable keyboard shortcuts: Space / → (Next), ← (Prev), F (Fullscreen)</span>
        <span className="text-emerald-400 font-bold font-mono text-[11px]">Executable Runtime</span>
      </div>
    </div>
  );
};
