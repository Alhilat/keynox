import OpenAI from "openai";
import { config } from "../config";
import { jsonrepair } from "jsonrepair";
import { PresentationSchema, Presentation } from "@presentation/schema";
import { detectTargetSlideCount } from "./slideCountDetector";

const openai = new OpenAI({
  apiKey: config.nvidiaApiKey,
  baseURL: config.nvidiaBaseUrl,
});

const SYSTEM_PROMPT = `
You are a presentation compiler. Generate a presentation strictly from the user's topic,
source document, and requested constraints. Every visible title, label, description, metric,
command, equation, widget configuration, and animation label must be derived from that input.
Never invent facts, metrics, commands, equations, domain terms, or fallback content.

MATHEMATICAL QUESTIONS & PROBLEM SOLVING MANDATE:
If the user's topic asks to solve, calculate, evaluate, derive, or prove any mathematical question:
1. FULL STEP-BY-STEP SOLUTION: You MUST fully solve the mathematical problem from first principles through to the verified final result.
2. ZERO FORGOTTEN / SKIPPED STEPS: Do not jump directly from question to answer. Break down the solution into explicit scenes and EquationElement/CardElement components showing:
   - Initial problem statement & given variables
   - Law / identity / substitution applied
   - Every intermediate algebraic transformation, factoring, and term cancellation
   - Final verified answer with boxed equation.
3. DELIBERATE ANIMATION PACING: In scene.steps, sequence StepActions with deliberate pacing (duration >= 0.8s to 1.2s, ease: 'power2.out'). Never rush through mathematical steps.
4. ZERO BLANK SCENES: Every scene must have non-empty elements, clear equations, and descriptive annotations.

Output only one JSON object that conforms to PresentationSchema. It must include a non-empty
presentation title, at least one scene, and source-derived scene titles and elements. Use only
supported scene layouts, element types, widget types, and animation actions. If the source does
not contain enough information for a requested field, omit the optional field rather than
filling it with a generic example. Do not include markdown or commentary outside the JSON.
`;

export type StreamEvent =
  | { type: "phase"; phase: string; message: string }
  | { type: "reasoning"; delta: string }
  | { type: "content"; delta: string }
  | { type: "complete"; presentation: Presentation; source: string }
  | { type: "error"; message: string };

function sanitizePresentation(data: unknown, fallbackTopic: string): Presentation {
  if (!data || typeof data !== "object") {
    throw new Error("The model returned a non-object presentation payload");
  }

  const candidate = { ...(data as Record<string, unknown>) };
  const cleanTopic = fallbackTopic.trim();

  // These values come from the user's request and only fill schema metadata.
  if (!candidate.title && cleanTopic) candidate.title = cleanTopic;
  if (!candidate.metadata || typeof candidate.metadata !== "object") {
    candidate.metadata = cleanTopic ? { topic: cleanTopic } : {};
  }

  if (!Array.isArray(candidate.scenes) || candidate.scenes.length === 0) {
    throw new Error("The model returned no presentation scenes");
  }

  return PresentationSchema.parse(candidate);
}

export async function streamPresentationGeneration(
  topic: string,
  onEvent: (event: StreamEvent) => void,
  requestedSlideCount?: number
): Promise<void> {
  const { count: targetCount, isExplicit, reason } = detectTargetSlideCount(topic, requestedSlideCount);

  onEvent({
    type: "phase",
    phase: "analyzing",
    message: `Analyzing topic semantics and target presentation scope for: "${topic}" (${targetCount} scenes: ${reason})...`,
  });

  try {
    const userPrompt = `Create a presentation about the following user-provided topic or source document:
"""
${topic}
"""

Generate exactly ${targetCount} scenes (${isExplicit ? "the user explicitly requested this count" : "the count was inferred from the source scope"}).
Use only facts and terminology present in the supplied input. Every visible field must be source-derived.
If the input does not support a metric, command, equation, comparison, or interactive widget, omit it.
Output only valid JSON matching PresentationSchema.`;

    onEvent({
      type: "phase",
      phase: "synthesizing",
      message: `Streaming source-derived presentation content for ${targetCount} scenes...`,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000);

    try {
      const stream: any = await openai.chat.completions.create(
        {
          model: config.nvidiaModel,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3,
          top_p: 0.95,
          max_tokens: 3500,
          chat_template_kwargs: { thinking: true, reasoning_effort: "low" },
          stream: true,
        } as any,
        { signal: controller.signal }
      );

      let fullContent = "";
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta as any;
        if (delta?.reasoning || delta?.reasoning_content) {
          onEvent({ type: "reasoning", delta: delta.reasoning || delta.reasoning_content });
        }
        if (delta?.content) {
          fullContent += delta.content;
          onEvent({ type: "content", delta: delta.content });
        }
      }

      onEvent({
        type: "phase",
        phase: "compiling",
        message: "Parsing JSON AST and validating presentation schema...",
      });

      let jsonString = fullContent.trim();
      const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch?.[1]) jsonString = jsonMatch[1].trim();

      const repaired = jsonrepair(jsonString);
      const validated = sanitizePresentation(JSON.parse(repaired), topic);

      onEvent({
        type: "complete",
        presentation: validated,
        source: "nvidia-deepseek",
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown presentation generation error";
    console.warn("DeepSeek presentation generation failed:", message);
    onEvent({ type: "error", message });
    throw err instanceof Error ? err : new Error(message);
  }
}

export async function generatePresentationWithDeepSeek(options: {
  topic: string;
  slideCount?: number;
}) {
  let resultPresentation: Presentation | null = null;
  let resultReasoning = "";
  let resultSource = "nvidia-deepseek";

  await streamPresentationGeneration(
    options.topic,
    (event) => {
      if (event.type === "reasoning") {
        resultReasoning += event.delta;
      } else if (event.type === "complete") {
        resultPresentation = event.presentation;
        resultSource = event.source;
      }
    },
    options.slideCount
  );

  if (!resultPresentation) {
    throw new Error("Presentation generation completed without a validated presentation");
  }

  return {
    presentation: resultPresentation,
    reasoning: resultReasoning,
    source: resultSource,
  };
}
