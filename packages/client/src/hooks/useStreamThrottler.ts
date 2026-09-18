import { useRef, useState, useCallback, useEffect } from "react";

/**
 * useStreamThrottler
 * 
 * Batches high-velocity streaming text tokens using requestAnimationFrame,
 * keeping the UI locked at a butter-smooth 60 FPS without React virtual DOM thrashing.
 */
export function useStreamThrottler(initialValue: string = "") {
  const [value, setValue] = useState<string>(initialValue);
  const queueRef = useRef<string>("");
  const rafIdRef = useRef<number | null>(null);

  const flush = useCallback(() => {
    if (queueRef.current.length > 0) {
      const pending = queueRef.current;
      queueRef.current = "";
      setValue((prev) => prev + pending);
    }
    rafIdRef.current = null;
  }, []);

  const append = useCallback((chunk: string) => {
    queueRef.current += chunk;
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(flush);
    }
  }, [flush]);

  const reset = useCallback((newValue: string = "") => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    queueRef.current = "";
    setValue(newValue);
  }, []);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return { value, append, reset, setValue };
}
