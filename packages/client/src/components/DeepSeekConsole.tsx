import React, { useEffect, useRef } from "react";
import { Terminal, BrainCircuit, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

interface DeepSeekConsoleProps {
  isStreaming: boolean;
  reasoning: string;
  source?: string;
  isComplete: boolean;
}

export const DeepSeekConsole: React.FC<DeepSeekConsoleProps> = ({
  isStreaming,
  reasoning,
  source,
  isComplete,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Auto-scroll while streaming
  useEffect(() => {
    if (isStreaming && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [reasoning, isStreaming]);

  if (!isStreaming && !reasoning) {
    return null;
  }

  // If streaming, always show
  const showBody = isStreaming || isExpanded;

  return (
    <div className="w-full max-w-5xl mx-auto mb-5">
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md transition-all">
        {/* Console Header */}
        <div
          onClick={() => !isStreaming && setIsExpanded(!isExpanded)}
          className={`flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 ${
            !isStreaming ? "cursor-pointer hover:bg-slate-850" : ""
          }`}
        >
          <div className="flex items-center gap-2.5">
            {isStreaming ? (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono font-semibold text-emerald-400 flex items-center gap-1.5">
                  <BrainCircuit className="w-4 h-4" />
                  DeepSeek is working...
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-medium text-slate-300">
                  DeepSeek {source ? `(${source})` : ""} reasoning output
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-500">
              {isStreaming ? "Streaming from NVIDIA NIM" : "Click to toggle reasoning"}
            </span>
            {!isStreaming && (
              isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>

        {/* Console Body */}
        {showBody && (
          <div
            ref={scrollRef}
            className="p-4 max-h-56 overflow-y-auto font-mono text-xs text-slate-300 bg-slate-950/90 leading-relaxed whitespace-pre-wrap select-text"
          >
            <div className="flex items-start gap-2 text-slate-500 mb-1.5">
              <Terminal className="w-3.5 h-3.5 mt-0.5 text-blue-400 shrink-0" />
              <span className="text-[11px] text-blue-400/80">deepseek-v4-flash / reasoning trace:</span>
            </div>
            <p className="text-slate-200">{reasoning}</p>
            {isStreaming && (
              <span className="inline-block w-2 h-3.5 bg-emerald-400 animate-pulse ml-1 align-middle" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
