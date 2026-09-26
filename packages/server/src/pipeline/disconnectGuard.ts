import type { FastifyRequest } from "fastify";

/** Handle returned by {@link createDisconnectGuard}. */
export interface DisconnectGuard {
  signal: AbortSignal;
  isAborted: () => boolean;
  onAbort: (fn: () => void) => void;
  dispose: () => void;
}

/**
 * Binds an AbortController to the client socket so a browser disconnect
 * aborts the in-flight LLM stream. Pass `signal` to every NVIDIA fetch
 * call so orphaned streams are killed instead of burning tokens.
 */
export function createDisconnectGuard(request: FastifyRequest): DisconnectGuard {
  const controller = new AbortController();
  const socket: unknown =
    request.socket ?? (request.raw as unknown as { socket?: unknown }).socket;

  const onClose = (): void => {
    if (!controller.signal.aborted) {
      request.log.info("Client disconnected — aborting LLM stream");
      controller.abort();
    }
  };

  if (socket !== null && typeof socket === "object" && "on" in socket) {
    (socket as { on: (event: string, fn: () => void) => void }).on("close", onClose);
  }

  return {
    signal: controller.signal,
    isAborted: () => controller.signal.aborted,
    onAbort: (fn: () => void) => controller.signal.addEventListener("abort", fn, { once: true }),
    dispose: () => {
      if (socket !== null && typeof socket === "object" && "off" in socket) {
        (socket as { off: (event: string, fn: () => void) => void }).off("close", onClose);
      }
    },
  };
}
