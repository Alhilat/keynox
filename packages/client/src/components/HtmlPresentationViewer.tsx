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

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(html);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
      throw new Error("Clipboard API unavailable");
    } catch {
      // Robust fallback using textarea selection for HTTP and restricted iframes
      try {
        const textarea = document.createElement("textarea");
        textarea.value = html;
        textarea.style.position = "fixed";
        textarea.style.top = "0";
        textarea.style.left = "0";
        textarea.style.opacity = "0";
        textarea.style.pointerEvents = "none";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          return;
        }
      } catch (err) {
        console.error("[HtmlPresentationViewer] Copy fallback failed:", err);
      }
      // If clipboard write is completely blocked by browser, open the code inspector
      setShowCode(true);
    }
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
      <div className="w-full bg-[#0a0a0c]/90 border border-white/[0.08] backdrop-blur-2xl rounded-2xl p-3 sm:px-4 sm:py-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all relative overflow-hidden">
        {/* Subtle top ambient sheen */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent pointer-events-none" />

        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/90 shrink-0 shadow-sm">
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight flex items-center gap-2 truncate">
              <span className="truncate">{title.replace(/^TOPIC:\s*["']?|["']?$/gi, "")}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.1] text-neutral-300 font-semibold uppercase tracking-wider shrink-0 shadow-sm">
                16:9 Keynote
              </span>
            </h2>
            <p className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
              <span>Interactive Web App &bull; GSAP Animations &bull; Offline Ready</span>
            </p>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setShowCode(!showCode)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
              showCode
                ? "bg-white/[0.12] text-white border-white/[0.2] shadow-white/5"
                : "bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white border-white/[0.08] hover:border-white/[0.16]"
            }`}
            title="Inspect Generated HTML/CSS/JS Source"
          >
            <Code className="w-3.5 h-3.5 text-neutral-400" />
            <span>Code</span>
          </button>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white border border-white/[0.08] hover:border-white/[0.16] text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Copy HTML to Clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white border border-white/[0.08] hover:border-white/[0.16] text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Download Standalone Presentation HTML"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span>Download HTML</span>
          </button>

          <button
            onClick={handleExportPptx}
            className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white border border-white/[0.08] hover:border-white/[0.16] text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Export to PowerPoint (.pptx)"
          >
            <Download className="w-3.5 h-3.5 text-amber-400/90" />
            <span>Export PPTX</span>
          </button>

          <button
            onClick={handleOpenNewTab}
            className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white border border-white/[0.08] hover:border-white/[0.16] text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Open Presentation in New Browser Tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
            <span>New Tab</span>
          </button>

          <button
            onClick={handleFullscreen}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_16px_rgba(255,255,255,0.12)] active:scale-95"
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Present Fullscreen (F)"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-black" /> : <Maximize2 className="w-3.5 h-3.5 text-black" />}
            <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </button>
        </div>
      </div>

      {/* Code Inspector Drawer */}
      {showCode && (
        <div className="w-full mb-4 rounded-2xl bg-[#0a0a0c] border border-white/[0.08] overflow-hidden shadow-2xl">
          <div className="px-4 py-2 bg-white/[0.02] border-b border-white/[0.08] flex items-center justify-between text-xs font-mono text-neutral-400">
            <span className="font-semibold text-neutral-200">Generated Presentation Source Code</span>
            <span className="text-[11px] text-neutral-500">{html.length} characters</span>
          </div>
          <pre className="p-4 max-h-72 overflow-y-auto text-xs font-mono text-emerald-400/90 leading-relaxed whitespace-pre-wrap select-text">
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
              : "w-full aspect-[16/9] mx-auto bg-[#07090e] rounded-2xl overflow-hidden shadow-2xl border border-white/[0.08] flex flex-col relative transition-all ring-1 ring-white/5"
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
            sandbox="allow-scripts allow-modals allow-fullscreen allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
            allow="clipboard-read; clipboard-write; fullscreen"
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
