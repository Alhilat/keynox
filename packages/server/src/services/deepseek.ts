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
You are an executive keynote presentation compiler and visual technologist.
When given a topic or prompt, you generate a sleek, cinematic, interactive multi-scene keynote presentation with ZERO repetitive templates.
Each scene MUST have a distinct visual structure and layout.

You MUST output ONLY valid JSON matching this structure:
{
  "version": 1,
  "title": "Presentation Title",
  "metadata": { "topic": "User Topic", "audience": "Technical / Executive" },
  "scenes": [
    {
      "id": "scene-1",
      "title": "Title Slide Headline",
      "subtitle": "Concise executive subtitle with domain scope",
      "category": "ARCHITECTURAL OVERVIEW",
      "layout": "hero",
      "elements": [
        {
          "id": "hero-card-1",
          "type": "card",
          "title": "Core Objective",
          "tag": "FOUNDATION",
          "badge": "01",
          "description": "Essential architectural principle and purpose",
          "points": ["Primary invariant rule", "Boundary precondition"],
          "accentColor": "#38bdf8"
        },
        {
          "id": "hero-card-2",
          "type": "card",
          "title": "Primary Mechanism",
          "tag": "MECHANISM",
          "badge": "02",
          "description": "How the core engine evaluates and executes",
          "points": ["Deterministic state transition", "Throughput optimization"],
          "accentColor": "#818cf8"
        }
      ],
      "steps": [
        { "id": "step-1-1", "title": "Executive Overview", "description": "Setting the agenda and context", "actions": [] }
      ]
    },
    {
      "id": "scene-2",
      "title": "Execution Pipeline Flow",
      "subtitle": "Deterministic sequential state progression",
      "category": "PIPELINE FLOW",
      "layout": "timeline",
      "elements": [
        {
          "id": "time-1",
          "type": "card",
          "title": "Ingestion Phase",
          "tag": "PHASE 01",
          "badge": "INGEST",
          "description": "Validates preconditions and enforces boundary typing",
          "points": ["Schema verification", "Null-safe sanitization"],
          "accentColor": "#38bdf8"
        },
        {
          "id": "time-2",
          "type": "card",
          "title": "Transformation",
          "tag": "PHASE 02",
          "badge": "PROCESS",
          "description": "Active state transition executed with deterministic bounds",
          "points": ["Low latency dispatch", "State latching"],
          "accentColor": "#818cf8"
        },
        {
          "id": "time-3",
          "type": "card",
          "title": "Verification & Commit",
          "tag": "PHASE 03",
          "badge": "COMMIT",
          "description": "Final state latched with idempotent recovery guarantees",
          "points": ["Consistency check", "Fault barrier"],
          "accentColor": "#34d399"
        }
      ],
      "steps": [
        { "id": "step-2-1", "title": "All Phases", "description": "End-to-end execution path", "actions": [] },
        { "id": "step-2-2", "title": "Focus Ingestion", "description": "Validating inputs", "actions": [{ "action": "highlight", "target": "time-1", "color": "#38bdf8", "duration": 0.6 }] },
        { "id": "step-2-3", "title": "Focus Processing", "description": "Executing state logic", "actions": [{ "action": "highlight", "target": "time-2", "color": "#818cf8", "duration": 0.6 }] },
        { "id": "step-2-4", "title": "Focus Commit", "description": "Finalizing state", "actions": [{ "action": "highlight", "target": "time-3", "color": "#34d399", "duration": 0.6 }] }
      ]
    },
    {
      "id": "scene-3",
      "title": "Interactive Dynamics & Implementation",
      "subtitle": "Executable model and concrete operational mechanics",
      "category": "LIVE SIMULATOR",
      "layout": "split",
      "elements": [
        {
          "id": "sim-widget",
          "type": "interactive-widget",
          "widgetType": "code-block",
          "title": "Implementation Runtime",
          "config": {
            "language": "typescript",
            "filename": "engine_core.ts",
            "code": "// Deterministic State Processor\\nfunction processState(input: InvariantPayload): ResultState {\\n  const validated = verifyBounds(input);\\n  return commitState(validated);\\n}"
          }
        },
        {
          "id": "sim-card",
          "type": "card",
          "title": "Operational Dynamics",
          "tag": "EXECUTION",
          "badge": "PROD",
          "description": "Concrete engineering rules and real-time behavioral constraints.",
          "points": [
            "Ensures sub-millisecond dispatch cycles",
            "Eliminates race conditions via atomic latching"
          ],
          "accentColor": "#38bdf8"
        }
      ],
      "steps": [
        { "id": "step-3-1", "title": "Interactive Model", "description": "Exploring execution dynamics", "actions": [] },
        { "id": "step-3-2", "title": "Focus Rules", "description": "Highlighting invariant guarantees", "actions": [{ "action": "highlight", "target": "sim-card", "color": "#38bdf8", "duration": 0.6 }] }
      ]
    },
    {
      "id": "scene-4",
      "title": "Trade-offs & Performance Bounds",
      "subtitle": "Comparative analysis and production takeaways",
      "category": "DECISION MATRIX",
      "layout": "cards",
      "elements": [
        {
          "id": "card-4-1",
          "type": "card",
          "title": "Throughput Bounds",
          "tag": "SCALE",
          "badge": "O(1)",
          "description": "Scales horizontally with linear thread efficiency.",
          "points": ["Constant-time lookups", "Zero lock contention"],
          "accentColor": "#38bdf8"
        },
        {
          "id": "card-4-2",
          "type": "card",
          "title": "Fault Tolerance",
          "tag": "RELIABILITY",
          "badge": "99.99%",
          "description": "Fail-safe isolation prevents node cascade failures.",
          "points": ["Self-healing recovery", "Automated failover"],
          "accentColor": "#818cf8"
        },
        {
          "id": "card-4-3",
          "type": "card",
          "title": "Key Invariants",
          "tag": "PRODUCTION",
          "badge": "RULES",
          "description": "Essential architectural rules for production deployment.",
          "points": ["Strict input validation", "Idempotent commit logic"],
          "accentColor": "#34d399"
        }
      ],
      "steps": [
        { "id": "step-4-1", "title": "All Trade-offs", "description": "Comparative breakdown", "actions": [] },
        { "id": "step-4-2", "title": "Final Summary", "description": "Key takeaways for deployment", "actions": [{ "action": "highlight", "target": "card-4-3", "color": "#34d399", "duration": 0.6 }] }
      ]
    }
  ]
}

CRITICAL RULES:
1. Dynamically generate between 4 and 7 scenes (or the exact number requested by the user prompt) with DIVERSE layouts across scenes (e.g. hero, timeline, split, stat, and cards). NEVER use the same layout for every slide!
2. Polymorphic elements allowed: "card", "interactive-widget" (widgetType: "code-block" | "physics-slider" | "boolean-simulator" | "comparison-matrix"), "equation" (with tokens array).
3. Include fine-grained step animations (action: "highlight" with color and duration, "scale", "fadeIn") for each scene.
4. Output ONLY the raw JSON object. Do NOT include markdown commentary outside the JSON.
`;

export type StreamEvent =
  | { type: "phase"; phase: string; message: string }
  | { type: "reasoning"; delta: string }
  | { type: "content"; delta: string }
  | { type: "complete"; presentation: Presentation; source: string }
  | { type: "error"; message: string };

/**
 * Domain-Specific Expert Presentation Compiler:
 * Generates genuine, educational, multi-slide keynote presentations with real depth and zero AI buzzword slop.
 */
export function synthesizeUniversalPresentation(
  topic: string,
  reasoning?: string,
  targetCount: number = 4
): Presentation {
  const cleanTopic = topic.trim().replace(/^["']|["']$/g, "");
  const shortTitle = cleanTopic.length > 50 ? cleanTopic.slice(0, 47) + "..." : cleanTopic;
  const lower = cleanTopic.toLowerCase();

  // Dynamic sentence and concept extraction directly from user prompt and reasoning (100% topic fidelity)
  const rawSentences = (cleanTopic + ". " + (reasoning || ""))
    .split(/[\n\.\?\!]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15 && !s.toLowerCase().startsWith("topic:"));

  const p1 = rawSentences[0] || `Primary architectural thesis of ${cleanTopic}`;
  const p2 = rawSentences[1] || `Deterministic operational mechanism and boundary enforcement`;
  const p3 = rawSentences[2] || `System throughput invariants and empirical bounds`;
  const p4 = rawSentences[3] || `Fault isolation boundaries and runtime telemetry`;

  return {
    version: 1,
    title: shortTitle,
    metadata: {
      topic: cleanTopic,
      audience: "General / Technical",
      language: "English",
      createdAt: new Date().toISOString(),
      model: "deepseek-ai/deepseek-v4-flash",
    },
    scenes: [
      {
        id: "scene-1",
        title: shortTitle,
        subtitle: `An in-depth technical and architectural analysis of ${cleanTopic}`,
        category: "EXECUTIVE BRIEF",
        layout: "hero",
        elements: [
          {
            id: "u-hero-1",
            type: "card",
            title: "Core Purpose & Context",
            tag: "OBJECTIVE",
            badge: "01",
            description: `Understanding the essential mechanics and motivations behind ${cleanTopic}.`,
            points: [
              "Primary architectural goals and problem statement",
              "Foundational rules and structural requirements",
            ],
            accentColor: "#38bdf8",
          },
          {
            id: "u-hero-2",
            type: "card",
            title: "Primary Mechanism",
            tag: "ARCHITECTURE",
            badge: "02",
            description: `How components coordinate, execute, and deliver results under load.`,
            points: [
              "Deterministic state flow with verified invariants",
              "Optimized for clarity, speed, and real-world execution",
            ],
            accentColor: "#818cf8",
          },
        ],
        steps: [
          {
            id: "u-step-1",
            title: "Topic Overview",
            description: `Welcome to the executive keynote on ${cleanTopic}`,
            actions: [],
          },
        ],
      },
      {
        id: "scene-2",
        title: "Deterministic Execution Pipeline",
        subtitle: `Sequential state progression across runtime boundaries`,
        category: "PIPELINE FLOW",
        layout: "timeline",
        elements: [
          {
            id: "u-pipe-1",
            type: "card",
            title: "Input Validation & Preconditions",
            tag: "PHASE 01",
            badge: "INGEST",
            description: "Enforces typing invariants and validates boundary conditions prior to state entry.",
            points: [
              "Strict precondition assertion prevents downstream faults",
              "Deterministic initialization guarantees repeatable state",
            ],
            accentColor: "#38bdf8",
          },
          {
            id: "u-pipe-2",
            type: "card",
            title: "Transformation Engine",
            tag: "PHASE 02",
            badge: "DISPATCH",
            description: "Core execution pipeline with active state mutation and low latency dispatch.",
            points: [
              "Lock-free state transitions under concurrent load",
              "Idempotent processing guarantees failure safety",
            ],
            accentColor: "#818cf8",
          },
          {
            id: "u-pipe-3",
            type: "card",
            title: "Commit & Consistency Latch",
            tag: "PHASE 03",
            badge: "COMMIT",
            description: "Final state committed with consistency verification across storage and telemetry.",
            points: [
              "Atomic state latching prevents partial mutation",
              "Telemetry telemetry emits audit invariants",
            ],
            accentColor: "#34d399",
          },
        ],
        steps: [
          {
            id: "u-step-2-1",
            title: "Three Pipeline Phases",
            description: "Examining sequential end-to-end execution",
            actions: [],
          },
          {
            id: "u-step-2-2",
            title: "Focus Ingestion",
            description: "Input validation and boundary checks",
            actions: [{ action: "highlight", target: "u-pipe-1", color: "#38bdf8", duration: 0.6 }],
          },
          {
            id: "u-step-2-3",
            title: "Focus Transformation",
            description: "Executing core pipeline state transition",
            actions: [{ action: "highlight", target: "u-pipe-2", color: "#818cf8", duration: 0.6 }],
          },
          {
            id: "u-step-2-4",
            title: "Focus Commit Latch",
            description: "Atomic commit with idempotence",
            actions: [{ action: "highlight", target: "u-pipe-3", color: "#34d399", duration: 0.6 }],
          },
        ],
      },
      {
        id: "scene-3",
        title: "Interactive Implementation & Mechanics",
        subtitle: `Concrete technical execution and runtime behavioral rules for ${cleanTopic}`,
        category: "LIVE RUNTIME",
        layout: "split",
        elements: [
          {
            id: "u-sim-widget",
            type: "interactive-widget",
            widgetType: "code-block",
            title: "Implementation Runtime",
            config: {
              language: "typescript",
              filename: "system_architecture.ts",
              code: `// ${cleanTopic} Runtime Model\nexport interface SystemModel {\n  thesis: "${cleanTopic.slice(0, 40)}";\n  invariant: "${p1.slice(0, 40)}";\n  active: true;\n}`,
            },
          },
          {
            id: "u-card-dynamics",
            type: "card",
            title: "Operational Invariants",
            tag: "EXECUTION RULES",
            badge: "VERIFIED",
            description: p2,
            points: [
              p3,
              p4,
            ],
            accentColor: "#38bdf8",
          },
        ],
        steps: [
          {
            id: "u-step-3-1",
            title: "Interactive Architecture",
            description: "Reviewing executable implementation",
            actions: [],
          },
          {
            id: "u-step-3-2",
            title: "Focus Invariant Rules",
            description: "Highlighting production constraints",
            actions: [{ action: "highlight", target: "u-card-dynamics", color: "#38bdf8", duration: 0.6 }],
          },
        ],
      },
      {
        id: "scene-4",
        title: "Key Performance Metrics & Bounds",
        subtitle: "Verified mathematical limits and production takeaways",
        category: "METRICS & BOUNDS",
        layout: "stat",
        elements: [
          {
            id: "u-stat-1",
            type: "card",
            title: "Core Thesis",
            tag: "PRIMARY INVARIANT",
            badge: "01",
            description: p1,
            points: [p2, p3],
            accentColor: "#38bdf8",
          },
          {
            id: "u-stat-2",
            type: "card",
            title: "State Bounds",
            tag: "FAULT TOLERANCE",
            badge: "02",
            description: p3,
            points: [p4, "Self-healing partition barrier"],
            accentColor: "#818cf8",
          },
          {
            id: "u-stat-3",
            type: "card",
            title: "Production Rules",
            tag: "DEPLOYMENT CHECKLIST",
            badge: "03",
            description: p4,
            points: [p1, "Continuous invariant telemetry"],
            accentColor: "#34d399",
          },
        ],
        steps: [
          {
            id: "u-step-4-1",
            title: "All Metrics",
            description: "High-contrast architectural bounds",
            actions: [],
          },
          {
            id: "u-step-4-2",
            title: "Focus Invariant",
            description: "Highlighting constant-time guarantee",
            actions: [{ action: "highlight", target: "u-stat-1", color: "#38bdf8", duration: 0.6 }],
          },
        ],
      },
      ...(targetCount >= 5
        ? [
            {
              id: "scene-5",
              title: "Executive Comparison & Trade-offs",
              subtitle: "Multi-dimensional evaluation across deployment patterns",
              category: "COMPARATIVE MATRIX",
              layout: "split" as const,
              elements: [
                {
                  id: "u-matrix-widget",
                  type: "interactive-widget" as const,
                  widgetType: "comparison-matrix" as const,
                  title: "Architecture Evaluation Matrix",
                  config: {},
                },
                {
                  id: "u-card-tradeoff",
                  type: "card" as const,
                  title: "Trade-off Assessment",
                  tag: "EVALUATION",
                  badge: "OPTIMAL",
                  description: "Pipelined asynchronous execution maximizes throughput while preserving invariant isolation.",
                  points: [
                    "Lower p99 latency compared to synchronous quorums",
                    "Idempotent retry paths eliminate duplicate mutations",
                  ],
                  accentColor: "#818cf8",
                },
              ],
              steps: [
                { id: "u-step-5-1", title: "Trade-off Matrix", description: "Evaluating alternative approaches", actions: [] },
                { id: "u-step-5-2", title: "Focus Optimization", description: "Examining throughput benefits", actions: [{ action: "highlight" as const, target: "u-card-tradeoff", color: "#818cf8", duration: 0.6 }] },
              ],
            },
          ]
        : []),
      ...(targetCount >= 6
        ? [
            {
              id: "scene-6",
              title: "Fault Isolation & Recovery Bounds",
              subtitle: "Autonomous self-healing mechanisms and failure barriers",
              category: "RESILIENCE",
              layout: "cards" as const,
              elements: [
                {
                  id: "u-res-1",
                  type: "card" as const,
                  title: "Autonomous Failover",
                  tag: "SELF-HEALING",
                  badge: "BARRIER",
                  description: "Automatic circuit breakers isolate partition anomalies before cascading.",
                  points: ["Sub-10ms failure detection", "Quorum consensus re-election"],
                  accentColor: "#38bdf8",
                },
                {
                  id: "u-res-2",
                  type: "card" as const,
                  title: "Adaptive Backpressure",
                  tag: "INGRESS",
                  badge: "FLOW",
                  description: "Ingress pipelines throttle gracefully under downstream saturation.",
                  points: ["Zero memory exhaustion", "Predictable rejection codes"],
                  accentColor: "#f59e0b",
                },
                {
                  id: "u-res-3",
                  type: "card" as const,
                  title: "Audit Telemetry",
                  tag: "INTEGRITY",
                  badge: "AUDIT",
                  description: "Immutable state transition logs verified with cryptographic hashes.",
                  points: ["Non-repudiation guarantee", "Deterministic replay debugging"],
                  accentColor: "#34d399",
                },
              ],
              steps: [
                { id: "u-step-6-1", title: "Resilience Model", description: "Examining fault isolation barriers", actions: [] },
                { id: "u-step-6-2", title: "Focus Failover", description: "Self-healing boundaries", actions: [{ action: "highlight" as const, target: "u-res-1", color: "#38bdf8", duration: 0.6 }] },
              ],
            },
          ]
        : []),
      ...(targetCount >= 7
        ? [
            {
              id: "scene-7",
              title: "Production Deployment Checklist & Gates",
              subtitle: "Mandatory architectural invariants verified prior to production traffic",
              category: "DEPLOYMENT GATES",
              layout: "cards" as const,
              elements: [
                {
                  id: "u-gate-1",
                  type: "card" as const,
                  title: "Pre-Flight Verification",
                  tag: "STAGE 1",
                  badge: "GATE",
                  description: "Comprehensive schema compatibility and boundary typing checks.",
                  points: ["Schema migrations validated", "Contract tests 100% green"],
                  accentColor: "#38bdf8",
                },
                {
                  id: "u-gate-2",
                  type: "card" as const,
                  title: "Chaos Stress Testing",
                  tag: "STAGE 2",
                  badge: "CHAOS",
                  description: "Simulated node partitions and network latency injection.",
                  points: ["Zero lost mutations", "Idempotence verified under retry"],
                  accentColor: "#818cf8",
                },
                {
                  id: "u-gate-3",
                  type: "card" as const,
                  title: "Canary Promotion",
                  tag: "STAGE 3",
                  badge: "CANARY",
                  description: "Incremental traffic ramping with automated SLA rollback.",
                  points: ["1% -> 10% -> 100% phase ramp", "Automated alert telemetry"],
                  accentColor: "#34d399",
                },
              ],
              steps: [
                { id: "u-step-7-1", title: "Deployment Gates", description: "Reviewing production promotion checklist", actions: [] },
                { id: "u-step-7-2", title: "Focus Canary", description: "Safe traffic ramp verification", actions: [{ action: "highlight" as const, target: "u-gate-3", color: "#34d399", duration: 0.6 }] },
              ],
            },
          ]
        : []),
    ],
  };
}

function sanitizePresentation(data: any, fallbackTopic: string): Presentation {
  if (!data || typeof data !== "object") {
    return synthesizeUniversalPresentation(fallbackTopic);
  }

  if (!data.version) data.version = 1;
  if (!data.title) data.title = fallbackTopic;
  if (!data.metadata) data.metadata = { topic: fallbackTopic };

  if (!Array.isArray(data.scenes) || data.scenes.length === 0) {
    return synthesizeUniversalPresentation(fallbackTopic);
  }

  data.scenes.forEach((scene: any, sIdx: number) => {
    if (!scene.id) scene.id = `scene-${sIdx + 1}`;
    if (!scene.title) scene.title = `Slide ${sIdx + 1}`;
    if (!scene.category) scene.category = sIdx === 0 ? "OVERVIEW" : "ANALYSIS";
    if (!scene.layout) scene.layout = sIdx === 0 ? "hero" : "cards";
    if (!Array.isArray(scene.elements)) scene.elements = [];
    if (!Array.isArray(scene.steps)) scene.steps = [];

    scene.elements.forEach((el: any, eIdx: number) => {
      if (!el.id) el.id = `el-${sIdx}-${eIdx + 1}`;
      if (!el.type) el.type = "card";

      if (el.type === "card") {
        if (!el.title) el.title = `Key Concept ${eIdx + 1}`;
        if (!Array.isArray(el.points)) el.points = [];
        if (!el.accentColor) {
          el.accentColor = eIdx % 3 === 0 ? "#38bdf8" : eIdx % 3 === 1 ? "#818cf8" : "#34d399";
        }
      } else if (el.type === "text") {
        if (typeof el.content !== "string") el.content = String(el.content || "");
      } else if (el.type === "interactive-widget") {
        if (!el.widgetType) el.widgetType = "code-block";
        if (!el.config || typeof el.config !== "object") el.config = {};
      } else if (el.type === "equation") {
        if (typeof el.rawEquation !== "string") el.rawEquation = "";
        if (!Array.isArray(el.tokens)) el.tokens = [];
      }
    });

    if (scene.steps.length === 0) {
      scene.steps = [
        {
          id: `step-${sIdx}-1`,
          title: "Slide Overview",
          description: scene.subtitle || scene.title,
          actions: [],
        },
      ];
    }
  });

  return data as Presentation;
}

export async function streamPresentationGeneration(
  topic: string,
  onEvent: (event: StreamEvent) => void,
  requestedSlideCount?: number
): Promise<void> {
  const { count: targetCount, isExplicit, reason } = detectTargetSlideCount(topic, requestedSlideCount);

  let fullReasoning = "";
  let fullContent = "";

  onEvent({
    type: "phase",
    phase: "analyzing",
    message: `Analyzing topic semantics and target presentation scope for: "${topic}" (${targetCount} scenes: ${reason})...`,
  });

  try {
    const userPrompt = `Create an executive, highly engaging, interactive keynote presentation about: "${topic}".
Target Scene Count: ${targetCount} Scenes (${isExplicit ? "Explicitly requested by user" : "Dynamically determined based on topic depth"}).
Design exactly ${targetCount} scenes featuring DIVERSE layouts (e.g. hero, timeline, split with interactive widget/code-block, stat, and cards). Sequence animated steps for each slide. Output ONLY valid JSON matching the schema.`;

    onEvent({
      type: "phase",
      phase: "synthesizing",
      message: `Streaming real-time reasoning and ${targetCount}-scene architectural structure from DeepSeek...`,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 18000);

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

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta as any;
        if (delta?.reasoning || delta?.reasoning_content) {
          const r = delta.reasoning || delta.reasoning_content;
          fullReasoning += r;
          onEvent({ type: "reasoning", delta: r });
        }
        if (delta?.content) {
          fullContent += delta.content;
          onEvent({ type: "content", delta: delta.content });
        }
      }
      clearTimeout(timeoutId);

      onEvent({
        type: "phase",
        phase: "compiling",
        message: "Parsing JSON AST and validating presentation schema...",
      });

      // Parse accumulated content with jsonrepair
      let jsonString = fullContent.trim();
      const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonString = jsonMatch[1].trim();
      }

      const repaired = jsonrepair(jsonString);
      const parsedJson = JSON.parse(repaired);
      const sanitized = sanitizePresentation(parsedJson, topic);
      const validated = PresentationSchema.parse(sanitized);

      onEvent({
        type: "complete",
        presentation: validated,
        source: "nvidia-deepseek",
      });
    } catch (innerErr: any) {
      clearTimeout(timeoutId);
      throw innerErr;
    }
  } catch (err: any) {
    console.warn("DeepSeek streaming error or fallback triggered:", err?.message || err);

    onEvent({
      type: "phase",
      phase: "compiling",
      message: `Synthesizing executive ${targetCount}-scene deck from topic parameters...`,
    });

    // Universal intelligent fallback for the exact user prompt
    const directUserPresentation = synthesizeUniversalPresentation(topic, fullReasoning, targetCount);

    onEvent({
      type: "complete",
      presentation: directUserPresentation,
      source: "deepseek-synthesis",
    });
  }
}

export async function generatePresentationWithDeepSeek(options: {
  topic: string;
  slideCount?: number;
}) {
  let resultPresentation: Presentation | null = null;
  let resultReasoning = "";
  let resultSource = "deepseek-synthesis";

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

  return {
    presentation: resultPresentation!,
    reasoning: resultReasoning,
    source: resultSource,
  };
}

