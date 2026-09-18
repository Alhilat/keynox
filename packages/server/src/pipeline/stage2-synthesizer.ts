import OpenAI from "openai";
import { config } from "../config";
import { buildStage2Prompt } from "./token-optimizer";

const MODEL_SUPER = "nvidia/nemotron-3-super-120b-a12b";
const MODEL_LIGHTNING = "nvidia/nemotron-3.5-lightning-30b-a3b";

export interface Stage2Callbacks {
  onReasoning: (delta: string) => void;
  onChunk: (delta: string) => void;
  onModelSwitch?: (model: string) => void;
}

export async function runStage2Synthesizer(
  cleanTopic: string,
  outlineText: string,
  targetCount: number,
  callbacks: Stage2Callbacks
): Promise<{ rawSlides: string; activeModel: string }> {
  const apiKey = config.nvidiaApiKeyUltra || config.nvidiaApiKey;
  const openai = new OpenAI({
    apiKey,
    baseURL: config.nvidiaBaseUrl,
  });

  const prompt = buildStage2Prompt(cleanTopic, outlineText, targetCount);
  let activeModel = MODEL_SUPER;
  let accumulated = "";

  async function streamWithWatchdog(
    createStream: (signal: AbortSignal) => Promise<any>,
    maxDurationMs = 120000,
    inactivityTimeoutMs = 15000
  ): Promise<string> {
    const controller = new AbortController();
    let contentAcc = "";
    let reasoningAcc = "";
    let overallTimer: NodeJS.Timeout | null = null;
    let inactivityTimer: NodeJS.Timeout | null = null;

    const resetInactivity = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        console.warn(`[Stage2Synthesizer] Chunk inactivity (${inactivityTimeoutMs}ms). Finalizing stream.`);
        controller.abort();
      }, inactivityTimeoutMs);
    };

    overallTimer = setTimeout(() => {
      console.warn(`[Stage2Synthesizer] Max stream duration reached (${maxDurationMs}ms). Finalizing.`);
      controller.abort();
    }, maxDurationMs);

    try {
      resetInactivity();
      const stream = await createStream(controller.signal);
      resetInactivity();

      for await (const chunk of stream) {
        resetInactivity();
        const reasoning = (chunk.choices?.[0]?.delta as any)?.reasoning_content || "";
        if (reasoning) {
          reasoningAcc += reasoning;
          callbacks.onReasoning(reasoning);
          // If reasoning contains slide HTML, also stream to onChunk so code tab is populated
          if (reasoning.includes("<section") || reasoningAcc.includes("<section")) {
            callbacks.onChunk(reasoning);
          }
        }
        const delta = chunk.choices?.[0]?.delta?.content || "";
        if (delta) {
          contentAcc += delta;
          callbacks.onChunk(delta);
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError" || controller.signal.aborted) {
        console.log(`[Stage2Synthesizer] Stream safely finalized.`);
      } else {
        console.warn("[Stage2Synthesizer] Stream warning:", err?.message || err);
      }
    } finally {
      if (overallTimer) clearTimeout(overallTimer);
      if (inactivityTimer) clearTimeout(inactivityTimer);
    }

    // If contentAcc is empty or missing slide tags, check if reasoningAcc contains the slide sections
    const contentSlideCount = (contentAcc.match(/class=["'][^"']*\bslide\b/g) || []).length;
    const reasoningSlideCount = (reasoningAcc.match(/class=["'][^"']*\bslide\b/g) || []).length;

    if (contentSlideCount < 2 && reasoningSlideCount >= 2) {
      console.log(`[Stage2Synthesizer] Using slide content from reasoning stream (${reasoningSlideCount} slides found).`);
      return reasoningAcc;
    }

    return contentAcc;
  }

  // Primary attempt with Nemotron 120B Super
  try {
    activeModel = MODEL_SUPER;
    accumulated = await streamWithWatchdog(
      (signal) =>
        openai.chat.completions.create(
          {
            model: MODEL_SUPER,
            messages: [
              {
                role: "system",
                content:
                  "You are a Principal Presentation Architect. Generate semantic presentation slide sections (<section class=\"slide\">) using pre-bundled HyperDeck CSS utilities. Do not output outer page boilerplate.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.6,
            top_p: 0.95,
            max_tokens: 6000,
            stream: true,
          } as any,
          { signal }
        ),
      120000,
      15000
    );
  } catch (err: any) {
    console.warn(`[Stage2Synthesizer] Model ${MODEL_SUPER} error (${err?.message}). Trying fallback ${MODEL_LIGHTNING}...`);
  }

  // Fallback to Nemotron 3.5 Lightning if Super output was empty or insufficient
  const slideCount = (accumulated.match(/class=["'][^"']*\bslide\b/g) || []).length;
  if (slideCount < 2) {
    try {
      activeModel = MODEL_LIGHTNING;
      if (callbacks.onModelSwitch) callbacks.onModelSwitch(activeModel);
      accumulated = "";
      accumulated = await streamWithWatchdog(
        (signal) =>
          openai.chat.completions.create(
            {
              model: MODEL_LIGHTNING,
              messages: [
                {
                  role: "system",
                  content:
                    "You are a Principal Presentation Architect. Generate semantic presentation slide sections (<section class=\"slide\">) using pre-bundled HyperDeck CSS utilities. Do not output outer page boilerplate.",
                },
                { role: "user", content: prompt },
              ],
              temperature: 0.6,
              top_p: 0.95,
              max_tokens: 6000,
              stream: true,
            } as any,
            { signal }
          ),
        120000,
        15000
      );
    } catch (err: any) {
      console.warn(`[Stage2Synthesizer] Fallback model error:`, err?.message || err);
    }
  }

  return { rawSlides: accumulated, activeModel };
}
