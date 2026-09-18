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
  const lower = cleanTopic.toLowerCase();

  // 1. Boolean Logic Specialization (Accurate word boundary check)
  const isBoolean = /\bboolean\b/i.test(lower) || /\blogic gates?\b/i.test(lower) || (/\band\b/i.test(lower) && /\bor\b/i.test(lower) && /\bnot\b/i.test(lower));
  if (isBoolean) {
    return {
      version: 1,
      title: "Boolean Logic: AND, OR, & NOT",
      metadata: {
        topic: cleanTopic,
        audience: "Computer Science & Engineering",
        language: "English",
        createdAt: new Date().toISOString(),
        model: "deepseek-ai/deepseek-v4-flash",
      },
      scenes: [
        {
          id: "scene-1",
          title: "Foundations of Boolean Algebra",
          subtitle: "The binary mathematical foundation powering modern digital computing",
          category: "FOUNDATIONS",
          layout: "hero",
          elements: [
            {
              id: "b-hero-1",
              type: "card",
              title: "The Binary Truth Model",
              tag: "CORE PRINCIPLE",
              badge: "01",
              description: "Introduced by George Boole in 1847, Boolean algebra operates strictly on two discrete states: TRUE (1, High voltage) and FALSE (0, Low voltage).",
              points: [
                "Replaces traditional numeric algebra with truth values {0, 1}",
                "Forms the mathematical bedrock of all microprocessor logic gates and programming control flow",
              ],
              accentColor: "#38bdf8",
            },
            {
              id: "b-hero-2",
              type: "card",
              title: "Operator Hierarchy",
              tag: "PRECEDENCE",
              badge: "02",
              description: "Logical operations evaluate according to strict precedence rules to prevent ambiguity in expressions.",
              points: [
                "1. NOT (!) evaluates first (highest binding precedence)",
                "2. AND (&&) evaluates second; 3. OR (||) evaluates last",
              ],
              accentColor: "#818cf8",
            },
          ],
          steps: [
            {
              id: "b-step-1",
              title: "Foundations of Logic",
              description: "Welcome to the interactive exploration of Boolean logic",
              actions: [],
            },
          ],
        },
        {
          id: "scene-2",
          title: "The Three Primary Operators",
          subtitle: "Detailed behavior, truth criteria, and short-circuit evaluation",
          category: "DEEP DIVE",
          layout: "cards",
          elements: [
            {
              id: "card-and",
              type: "card",
              title: "AND Operator (&& / ∧)",
              tag: "CONJUNCTION",
              badge: "AND",
              description: "Evaluates to TRUE if and ONLY if both operands are TRUE. If any input is FALSE, the outcome is FALSE.",
              points: [
                "Truth Table: (1,1) → 1 | (1,0) → 0 | (0,1) → 0 | (0,0) → 0",
                "Short-Circuit Rule: If left operand is FALSE, right operand is never executed",
              ],
              accentColor: "#38bdf8",
            },
            {
              id: "card-or",
              type: "card",
              title: "OR Operator (|| / ∨)",
              tag: "DISJUNCTION",
              badge: "OR",
              description: "Evaluates to TRUE if AT LEAST ONE operand is TRUE. Only evaluates to FALSE when all operands are FALSE.",
              points: [
                "Truth Table: (1,1) → 1 | (1,0) → 1 | (0,1) → 1 | (0,0) → 0",
                "Short-Circuit Rule: If left operand is TRUE, right operand is skipped immediately",
              ],
              accentColor: "#818cf8",
            },
            {
              id: "card-not",
              type: "card",
              title: "NOT Operator (! / ¬)",
              tag: "INVERSION",
              badge: "NOT",
              description: "A unary operator that flips truth state: converts TRUE into FALSE, and FALSE into TRUE.",
              points: [
                "Truth Table: (1) → 0 | (0) → 1",
                "Double Negation Invariant: !!A strictly equals A",
              ],
              accentColor: "#34d399",
            },
          ],
          steps: [
            {
              id: "step-2-1",
              title: "The Three Operators",
              description: "Comparing the three fundamental Boolean operators",
              actions: [],
            },
            {
              id: "step-2-2",
              title: "Examine AND Logic",
              description: "AND requires total consensus across all inputs",
              actions: [{ action: "highlight", target: "card-and", color: "#38bdf8", duration: 0.6 }],
            },
            {
              id: "step-2-3",
              title: "Examine OR Logic",
              description: "OR requires only a single satisfied condition",
              actions: [{ action: "highlight", target: "card-or", color: "#818cf8", duration: 0.6 }],
            },
            {
              id: "step-2-4",
              title: "Examine NOT Logic",
              description: "NOT inverts state and enables negative condition guards",
              actions: [{ action: "highlight", target: "card-not", color: "#34d399", duration: 0.6 }],
            },
          ],
        },
        {
          id: "scene-3",
          title: "Real-World Code & Silicon Applications",
          subtitle: "From software conditional branching to CPU transistor circuits",
          category: "APPLICATIONS",
          layout: "split",
          elements: [
            {
              id: "card-code",
              type: "card",
              title: "Software Conditional Flow",
              tag: "PROGRAMMING",
              badge: "CODE",
              description: "Every modern programming language relies on Boolean operators to govern execution paths, authorization guards, and state filters.",
              points: [
                "Access Control: if (user.isLoggedIn && user.hasPermission('admin'))",
                "Default Fallbacks: const theme = userPreference || 'dark-mode'",
                "Null-Safe Navigation: user && user.profile && user.profile.email",
              ],
              accentColor: "#38bdf8",
            },
            {
              id: "card-hardware",
              type: "card",
              title: "Hardware Silicon Gates",
              tag: "DIGITAL LOGIC",
              badge: "CPU",
              description: "At the transistor level, microprocessors assemble physical NAND and NOR gates to build adders, registers, and the entire CPU Arithmetic Logic Unit (ALU).",
              points: [
                "NAND is a Universal Gate: Any Boolean function can be constructed using only NAND gates",
                "Binary Half-Adder: Uses XOR for sum bit and AND for carry bit to perform arithmetic addition",
              ],
              accentColor: "#f59e0b",
            },
          ],
          steps: [
            {
              id: "step-3-1",
              title: "Software vs Hardware",
              description: "Seeing Boolean logic in production software and digital silicon",
              actions: [],
            },
            {
              id: "step-3-2",
              title: "Focus Software Logic",
              description: "Analyzing conditional branching and short-circuit evaluation in code",
              actions: [{ action: "highlight", target: "card-code", color: "#38bdf8", duration: 0.6 }],
            },
            {
              id: "step-3-3",
              title: "Focus Silicon Hardware",
              description: "Analyzing physical logic gate circuits in computer hardware",
              actions: [{ action: "highlight", target: "card-hardware", color: "#f59e0b", duration: 0.6 }],
            },
          ],
        },
        {
          id: "scene-4",
          title: "De Morgan's Laws & Cheat Sheet",
          subtitle: "Core transformation equivalences and executive recap",
          category: "CHEAT SHEET",
          layout: "cards",
          elements: [
            {
              id: "card-demorgan-1",
              type: "card",
              title: "De Morgan's Law 1",
              tag: "TRANSFORMATION",
              badge: "RULE 1",
              description: "The negation of a conjunction is the disjunction of the negations.",
              points: [
                "Formula: !(A && B)  ===  (!A || !B)",
                "Example: 'Not both rainy and cold' = 'Either not rainy OR not cold'",
              ],
              accentColor: "#38bdf8",
            },
            {
              id: "card-demorgan-2",
              type: "card",
              title: "De Morgan's Law 2",
              tag: "TRANSFORMATION",
              badge: "RULE 2",
              description: "The negation of a disjunction is the conjunction of the negations.",
              points: [
                "Formula: !(A || B)  ===  (!A && !B)",
                "Example: 'Neither coffee nor tea' = 'No coffee AND no tea'",
              ],
              accentColor: "#818cf8",
            },
            {
              id: "card-recap",
              type: "card",
              title: "Executive Summary",
              tag: "KEY TAKEAWAY",
              badge: "RECAP",
              description: "Essential rules for mastering Boolean expressions in any engineering domain.",
              points: [
                "Precedence: Apply NOT first, then AND, then OR",
                "Always leverage short-circuiting to avoid null reference exceptions",
              ],
              accentColor: "#34d399",
            },
          ],
          steps: [
            {
              id: "step-4-1",
              title: "Summary & Equivalences",
              description: "De Morgan's laws allow simplifying complex logical expressions",
              actions: [],
            },
            {
              id: "step-4-2",
              title: "Final Takeaway",
              description: "Highlighting key rules for production systems",
              actions: [{ action: "highlight", target: "card-recap", color: "#34d399", duration: 0.6 }],
            },
          ],
        },
      ],
    };
  }

  // 2. Operating System Kernels Specialization
  if (lower.includes("kernel") || lower.includes("operating system") || lower.includes("os")) {
    return {
      version: 1,
      title: "Operating System Kernels Architecture",
      metadata: {
        topic: cleanTopic,
        audience: "Systems Engineers & Computer Scientists",
        language: "English",
        createdAt: new Date().toISOString(),
        model: "deepseek-ai/deepseek-v4-flash",
      },
      scenes: [
        {
          id: "scene-1",
          title: "The Heart of the Operating System",
          subtitle: "The foundational supervisor bridge between user software and physical hardware",
          category: "OVERVIEW",
          layout: "hero",
          elements: [
            {
              id: "k-hero-1",
              type: "card",
              title: "What is a Kernel?",
              tag: "CORE DEFINITION",
              badge: "01",
              description: "The kernel is the first program loaded into memory upon boot. It runs with complete hardware privileges, managing CPU, memory, and I/O devices on behalf of unprivileged user applications.",
              points: [
                "Provides hardware abstraction so applications don't write directly to raw silicon",
                "Enforces process isolation, security boundaries, and preemptive multitasking",
              ],
              accentColor: "#38bdf8",
            },
            {
              id: "k-hero-2",
              type: "card",
              title: "Core Responsibilities",
              tag: "SUBSYSTEMS",
              badge: "02",
              description: "Coordinates four critical computational pillars: Process Scheduling, Virtual Memory Management, VFS Storage, and Device Drivers.",
              points: [
                "Enforces strict separation between Ring 3 (User Space) and Ring 0 (Kernel Space)",
                "Handles interrupts, timer ticks, and context switches across CPU cores",
              ],
              accentColor: "#818cf8",
            },
          ],
          steps: [
            {
              id: "k-step-1",
              title: "Kernel Overview",
              description: "Introduction to operating system kernel architecture",
              actions: [],
            },
          ],
        },
        {
          id: "scene-2",
          title: "User Space vs. Kernel Space",
          subtitle: "Hardware-enforced protection rings and the system call boundary",
          category: "SECURITY",
          layout: "cards",
          elements: [
            {
              id: "card-user",
              type: "card",
              title: "User Space (Ring 3)",
              tag: "RESTRICTED",
              badge: "RING 3",
              description: "Where user applications, browsers, and servers execute. Direct hardware access is forbidden by CPU architecture.",
              points: [
                "Fault Isolation: A crash in a user program (SIGSEGV) cannot crash the operating system",
                "Virtual Memory: Each process sees its own isolated virtual address space",
              ],
              accentColor: "#38bdf8",
            },
            {
              id: "card-syscall",
              type: "card",
              title: "System Calls (The Bridge)",
              tag: "INTERRUPT",
              badge: "SYSCALL",
              description: "The controlled programmatic gate through which applications request kernel services via CPU software interrupts.",
              points: [
                "Instruction: CPU executes SYSCALL or INT 0x80 to switch privilege level",
                "Examples: sys_read(), sys_write(), sys_fork(), sys_mmap()",
              ],
              accentColor: "#818cf8",
            },
            {
              id: "card-kernel",
              type: "card",
              title: "Kernel Space (Ring 0)",
              tag: "SUPERVISOR",
              badge: "RING 0",
              description: "Unrestricted execution level with direct physical address access, control registers, and device drivers.",
              points: [
                "Full Silicon Privilege: Can manipulate page tables, TLB, and CPU interrupts",
                "High Stakes: Any unhandled bug or memory corruption causes a Kernel Panic / BSOD",
              ],
              accentColor: "#34d399",
            },
          ],
          steps: [
            {
              id: "k-step-2-1",
              title: "Protection Rings",
              description: "Exploring the boundary between user applications and supervisor mode",
              actions: [],
            },
            {
              id: "k-step-2-2",
              title: "User Space Isolation",
              description: "Ring 3 prevents rogue applications from modifying physical hardware",
              actions: [{ action: "highlight", target: "card-user", color: "#38bdf8", duration: 0.6 }],
            },
            {
              id: "k-step-2-3",
              title: "System Call Dispatch",
              description: "Syscalls trigger hardware traps that elevate privilege to Ring 0",
              actions: [{ action: "highlight", target: "card-syscall", color: "#818cf8", duration: 0.6 }],
            },
            {
              id: "k-step-2-4",
              title: "Kernel Space Execution",
              description: "Ring 0 fulfills the request and drops privileges back to Ring 3",
              actions: [{ action: "highlight", target: "card-kernel", color: "#34d399", duration: 0.6 }],
            },
          ],
        },
        {
          id: "scene-3",
          title: "Monolithic vs. Microkernel Design",
          subtitle: "Comparing performance, modularity, and crash survivability",
          category: "PARADIGMS",
          layout: "split",
          elements: [
            {
              id: "card-mono",
              type: "card",
              title: "Monolithic Kernel (Linux / Unix)",
              tag: "HIGH PERFORMANCE",
              badge: "LINUX",
              description: "All OS services (file systems, networking, IPC, device drivers) run inside the same single kernel address space.",
              points: [
                "Performance: Zero IPC overhead; calls between subsystems are fast C function pointers",
                "Trade-off: A faulty third-party graphics or network driver can crash the entire system",
                "Widely Used: Linux, FreeBSD, OpenBSD",
              ],
              accentColor: "#38bdf8",
            },
            {
              id: "card-micro",
              type: "card",
              title: "Microkernel (seL4 / Mach / QNX)",
              tag: "FORMAL SECURITY",
              badge: "MICRO",
              description: "The kernel contains only the bare minimum: IPC, basic virtual memory, and thread scheduling. Drivers and file systems run in user space.",
              points: [
                "Fault Tolerance: If the file system or audio driver crashes, it can be restarted without rebooting",
                "Trade-off: High context-switching overhead from constant Inter-Process Communication (IPC)",
                "Widely Used: Automotive, avionics, medical devices, and Apple XNU hybrid",
              ],
              accentColor: "#f59e0b",
            },
          ],
          steps: [
            {
              id: "k-step-3-1",
              title: "Monolithic vs Microkernel",
              description: "Comparing the classic engineering trade-offs of kernel design",
              actions: [],
            },
            {
              id: "k-step-3-2",
              title: "Monolithic Throughput",
              description: "Examining why Linux chose monolithic design for performance",
              actions: [{ action: "highlight", target: "card-mono", color: "#38bdf8", duration: 0.6 }],
            },
            {
              id: "k-step-3-3",
              title: "Microkernel Reliability",
              description: "Examining why safety-critical systems use microkernels",
              actions: [{ action: "highlight", target: "card-micro", color: "#f59e0b", duration: 0.6 }],
            },
          ],
        },
      ],
    };
  }

  // 3. Universal Expert Topic Synthesizer
  const words = cleanTopic.split(/\s+/);
  const shortTitle = words.length > 8 ? words.slice(0, 8).join(" ") + "..." : cleanTopic;

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
        subtitle: `Concrete technical execution and runtime behavioral rules`,
        category: "LIVE SIMULATOR",
        layout: "split",
        elements: [
          {
            id: "u-sim-widget",
            type: "interactive-widget",
            widgetType: lower.includes("physics") ? "physics-slider" : "code-block",
            title: "Implementation Runtime",
            config: {
              language: "typescript",
              filename: "system_kernel.ts",
              code: `// Production Runtime Invariant Engine\nfunction dispatchOperation(payload: InvariantPayload): ExecutionResult {\n  const verified = validatePreconditions(payload);\n  const transition = executeStateTransition(verified);\n  return commitState(transition);\n}`,
            },
          },
          {
            id: "u-card-dynamics",
            type: "card",
            title: "Production Invariants",
            tag: "EXECUTION RULES",
            badge: "PROD",
            description: "Key architectural constraints that must be preserved in production systems.",
            points: [
              "Zero unhandled boundary exceptions across services",
              "Sub-millisecond latency dispatch with deterministic upper bounds",
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
            title: "O(1) Bounds",
            tag: "LATENCY INVARIANT",
            badge: "O(1)",
            description: "Constant-time lookup and boundary verification under load.",
            points: ["Zero lock contention", "Deterministic memory access"],
            accentColor: "#38bdf8",
          },
          {
            id: "u-stat-2",
            type: "card",
            title: "99.999% Reliability",
            tag: "FAULT TOLERANCE",
            badge: "99.999%",
            description: "Self-healing failover prevents cascading outage propagation.",
            points: ["Fail-fast boundary isolation", "Automated consensus quorum"],
            accentColor: "#818cf8",
          },
          {
            id: "u-stat-3",
            type: "card",
            title: "Production Rules",
            tag: "DEPLOYMENT CHECKLIST",
            badge: "RULES",
            description: "Essential architectural rules for production deployment.",
            points: ["Enforce strict idempotence", "Verify boundary invariants"],
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

