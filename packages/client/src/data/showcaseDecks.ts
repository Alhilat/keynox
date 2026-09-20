import { Presentation } from "@presentation/schema";

/**
 * Showcase Deck 1: Boolean Logic & Digital Circuits (Live Interactive Simulator)
 */
export const booleanLogicDeck: Presentation = {
  version: 1,
  title: "Boolean Logic & Digital Circuit Architecture",
  metadata: {
    topic: "Boolean Logic & Digital Circuits",
    audience: "Engineers & Computer Scientists",
    createdAt: new Date().toISOString(),
    model: "Onyx Engine",
  },
  scenes: [
    {
      id: "bool-scene-1",
      title: "Foundations of Digital Computing",
      subtitle: "How two discrete binary states (0 & 1) orchestrate modern computing",
      category: "EXECUTIVE OVERVIEW",
      layout: "hero",
      elements: [
        {
          id: "bool-card-1",
          type: "card",
          title: "The Binary State Machine",
          tag: "FOUNDATION",
          badge: "01",
          description:
            "Formulated by George Boole in 1847, Boolean algebra abstracts mathematical logic into two truth values: TRUE (high voltage / 1) and FALSE (low voltage / 0).",
          points: [
            "Binary Representation: High Voltage (3.3V/5V) = 1, Ground (0V) = 0",
            "Deterministic State: Eliminates signal ambiguity through discrete digital thresholds",
          ],
          accentColor: "#38bdf8",
        },
        {
          id: "bool-card-2",
          type: "card",
          title: "The Transistor Primitive",
          tag: "SILICON",
          badge: "02",
          description:
            "Billions of nanoscale CMOS transistors act as voltage-controlled switches, physically implementing logic gates to drive modern CPUs and GPUs.",
          points: [
            "Microscopic Switches: Switched on or off via gate terminal voltages",
            "Universal Computing: Any arbitrary computational algorithm can be expressed in Boolean logic",
          ],
          accentColor: "#818cf8",
        },
      ],
      steps: [
        {
          id: "bool-step-1-1",
          title: "Binary Logic Foundation",
          description: "Introduction to Boolean algebra and discrete computing states",
          actions: [],
        },
      ],
    },
    {
      id: "bool-scene-2",
      title: "The Three Primary Operators",
      subtitle: "Detailed behavior, truth criteria, and algebraic identities",
      category: "OPERATOR SPEC",
      layout: "cards",
      elements: [
        {
          id: "card-and",
          type: "card",
          title: "AND Operator (&& / ∧)",
          tag: "CONJUNCTION",
          badge: "AND",
          description:
            "Evaluates to TRUE if and ONLY if both operands are TRUE. If any single input is FALSE, the entire expression evaluates to FALSE.",
          points: [
            "Truth Table: (1,1) → 1 | (1,0) → 0 | (0,1) → 0 | (0,0) → 0",
            "Short-Circuit: If left operand is FALSE, right operand is never evaluated",
          ],
          accentColor: "#38bdf8",
        },
        {
          id: "card-or",
          type: "card",
          title: "OR Operator (|| / ∨)",
          tag: "DISJUNCTION",
          badge: "OR",
          description:
            "Evaluates to TRUE if AT LEAST ONE operand is TRUE. Only evaluates to FALSE when all operands are FALSE.",
          points: [
            "Truth Table: (1,1) → 1 | (1,0) → 1 | (0,1) → 1 | (0,0) → 0",
            "Short-Circuit: If left operand is TRUE, right operand evaluation is skipped immediately",
          ],
          accentColor: "#818cf8",
        },
        {
          id: "card-not",
          type: "card",
          title: "NOT Operator (! / ¬)",
          tag: "INVERSION",
          badge: "NOT",
          description:
            "A unary operator that inverts truth state: transforms TRUE into FALSE, and FALSE into TRUE.",
          points: [
            "Truth Table: (1) → 0 | (0) → 1",
            "Double Inversion: !!A strictly equals A in all Boolean algebras",
          ],
          accentColor: "#34d399",
        },
      ],
      steps: [
        {
          id: "bool-step-2-1",
          title: "Compare All Three Operators",
          description: "Visualizing the three fundamental building blocks of Boolean logic",
          actions: [],
        },
        {
          id: "bool-step-2-2",
          title: "Focus AND Operator",
          description: "AND requires consensus across all inputs",
          actions: [
            {
              action: "highlight",
              target: "card-and",
              color: "#38bdf8",
              duration: 0.6,
              pulse: true,
            },
          ],
        },
        {
          id: "bool-step-2-3",
          title: "Focus OR Operator",
          description: "OR requires only a single satisfied condition",
          actions: [
            {
              action: "highlight",
              target: "card-or",
              color: "#818cf8",
              duration: 0.6,
              pulse: true,
            },
          ],
        },
        {
          id: "bool-step-2-4",
          title: "Focus NOT Operator",
          description: "NOT inverts state and powers conditional guards",
          actions: [
            {
              action: "highlight",
              target: "card-not",
              color: "#34d399",
              duration: 0.6,
              pulse: true,
            },
          ],
        },
      ],
    },
    {
      id: "bool-scene-3",
      title: "Interactive Hardware Logic Simulator",
      subtitle: "Click the input signal buttons to test gate evaluations and truth table live",
      category: "LIVE SIMULATOR",
      layout: "split",
      elements: [
        {
          id: "bool-sim-card",
          type: "card",
          title: "Real-Time Logic Evaluation",
          tag: "EXPERIMENT",
          badge: "SANDBOX",
          description:
            "Test how input signals propagate through physical digital logic gates. Notice how the XOR gate outputs TRUE only when inputs differ.",
          points: [
            "Click Signal A or Signal B to toggle HIGH (1) / LOW (0) states",
            "Watch AND, OR, NOT, and XOR gates re-evaluate instantaneously",
            "Observe the active row glow cyan in the truth table below",
          ],
          accentColor: "#38bdf8",
        },
        {
          id: "bool-widget-1",
          type: "interactive-widget",
          widgetType: "boolean-simulator",
          title: "Live Hardware Logic Simulator",
        },
      ],
      steps: [
        {
          id: "bool-step-3-1",
          title: "Hardware Logic Sandbox",
          description: "Interact directly with logic gates on this slide",
          actions: [
            {
              action: "highlight",
              target: "bool-sim-card",
              color: "#38bdf8",
              duration: 0.5,
            },
          ],
        },
      ],
    },
    {
      id: "bool-scene-4",
      title: "Software Logic vs Silicon Transistors",
      subtitle: "From high-level branching control to arithmetic ALU half-adders",
      category: "APPLICATIONS",
      layout: "split",
      elements: [
        {
          id: "card-code",
          type: "card",
          title: "Software Conditional Branching",
          tag: "PROGRAMMING",
          badge: "CODE",
          description:
            "Every modern runtime relies on Boolean operators for execution branching, authentication guards, and data filtering.",
          points: [
            "Access Control: if (user.isLoggedIn && user.hasRole('admin'))",
            "Safe Navigation: user && user.account && user.account.id",
            "Fallback Assignment: const theme = userTheme || 'system-dark'",
          ],
          accentColor: "#38bdf8",
        },
        {
          id: "card-hardware",
          type: "card",
          title: "Silicon Transistor Circuits",
          tag: "DIGITAL HARDWARE",
          badge: "CPU",
          description:
            "Microprocessors assemble physical NAND and NOR gates to construct registers, ALUs, and memory latches.",
          points: [
            "Universal Gates: Any Boolean function can be built using only NAND gates",
            "Binary Half-Adder: Uses XOR for sum bit and AND for carry bit to perform binary addition",
          ],
          accentColor: "#f59e0b",
        },
      ],
      steps: [
        {
          id: "bool-step-4-1",
          title: "Software & Hardware Synergy",
          description: "How Boolean logic bridges abstract code and physical silicon",
          actions: [],
        },
        {
          id: "bool-step-4-2",
          title: "Software Guard Focus",
          description: "Examining short-circuit evaluation in production code",
          actions: [
            {
              action: "highlight",
              target: "card-code",
              color: "#38bdf8",
              duration: 0.6,
              pulse: true,
            },
          ],
        },
        {
          id: "bool-step-4-3",
          title: "Silicon Hardware Focus",
          description: "Examining physical transistor circuits and half-adders",
          actions: [
            {
              action: "highlight",
              target: "card-hardware",
              color: "#f59e0b",
              duration: 0.6,
              pulse: true,
            },
          ],
        },
      ],
    },
    {
      id: "bool-scene-5",
      title: "De Morgan's Laws & Cheat Sheet",
      subtitle: "Core transformation equivalences and Boolean identities",
      category: "CHEAT SHEET",
      layout: "cards",
      elements: [
        {
          id: "demorgan-1",
          type: "card",
          title: "De Morgan's Law 1",
          tag: "IDENTITY",
          badge: "RULE 1",
          description:
            "The negation of a conjunction is the disjunction of the negations.",
          points: [
            "Formula: !(A && B) === (!A || !B)",
            "Code optimization: Replace nested not-conditions with cleaner OR logic",
          ],
          accentColor: "#38bdf8",
        },
        {
          id: "demorgan-2",
          type: "card",
          title: "De Morgan's Law 2",
          tag: "IDENTITY",
          badge: "RULE 2",
          description:
            "The negation of a disjunction is the conjunction of the negations.",
          points: [
            "Formula: !(A || B) === (!A && !B)",
            "Guard clause: 'If not red and not green' equals 'If neither red nor green'",
          ],
          accentColor: "#818cf8",
        },
        {
          id: "demorgan-3",
          type: "card",
          title: "Idempotent & Null Laws",
          tag: "ALGEBRA",
          badge: "RULE 3",
          description:
            "Core algebraic invariants that enable compiler dead-code elimination.",
          points: [
            "Idempotence: (A && A) === A | (A || A) === A",
            "Null / Domination: (A && 0) === 0 | (A || 1) === 1",
          ],
          accentColor: "#34d399",
        },
      ],
      steps: [
        {
          id: "bool-step-5-1",
          title: "Summary & Identities",
          description: "Essential rules for writing high-performance logic",
          actions: [],
        },
        {
          id: "bool-step-5-2",
          title: "Highlight De Morgan 1",
          description: "Transforming negative AND expressions",
          actions: [
            {
              action: "highlight",
              target: "demorgan-1",
              color: "#38bdf8",
              duration: 0.6,
            },
          ],
        },
        {
          id: "bool-step-5-3",
          title: "Highlight De Morgan 2",
          description: "Transforming negative OR expressions",
          actions: [
            {
              action: "highlight",
              target: "demorgan-2",
              color: "#818cf8",
              duration: 0.6,
            },
          ],
        },
      ],
    },
  ],
};

/**
 * Showcase Deck 2: Algebraic Equation Solving (Animated GSAP Steps)
 */
export const equationSolverDeck: Presentation = {
  version: 1,
  title: "Solving Linear Equations: Step-by-Step Morphing",
  metadata: {
    topic: "Solving Linear Equations",
    audience: "Math & Science Students",
    createdAt: new Date().toISOString(),
    model: "Onyx Engine",
  },
  scenes: [
    {
      id: "eq-scene-1",
      title: "The Golden Rule of Algebra",
      subtitle: "Maintaining balance across the equality sign",
      category: "PRINCIPLES",
      layout: "hero",
      elements: [
        {
          id: "eq-card-balance",
          type: "card",
          title: "The Scale Principle",
          tag: "FOUNDATION",
          badge: "01",
          description:
            "An algebraic equation is an exact balance. Whatever operation you apply to one side, you MUST apply to the other side to preserve equality.",
          points: [
            "Addition & Subtraction: Shifts terms across the balance line with inverted signs",
            "Multiplication & Division: Scales all terms uniformly across both sides",
          ],
          accentColor: "#38bdf8",
        },
        {
          id: "eq-card-goal",
          type: "card",
          title: "Variable Isolation",
          tag: "STRATEGY",
          badge: "02",
          description:
            "The objective in solving any linear equation is to isolate the unknown variable (e.g. x) on one side with a coefficient of 1.",
          points: [
            "Step 1: Group and isolate variable terms",
            "Step 2: Collect and simplify constant numeric terms",
            "Step 3: Divide by the variable's coefficient",
          ],
          accentColor: "#34d399",
        },
      ],
      steps: [
        {
          id: "eq-step-1-1",
          title: "Algebraic Balance",
          description: "Understanding equations as balanced scales",
          actions: [],
        },
      ],
    },
    {
      id: "eq-scene-2",
      title: "Step-by-Step Animated Solution",
      subtitle: "Watch the terms move, invert, and solve: 2x + 5 = 15",
      category: "INTERACTIVE SOLUTION",
      layout: "split",
      elements: [
        {
          id: "eq-element-1",
          type: "equation",
          rawEquation: "2x + 5 = 15",
          tokens: [
            { id: "tok-2x", text: "2x", type: "variable", color: "#38bdf8" },
            { id: "tok-plus", text: "+", type: "operator" },
            { id: "tok-5", text: "5", type: "constant", color: "#f8fafc" },
            { id: "tok-eq", text: "=", type: "operator" },
            { id: "tok-15", text: "15", type: "constant", color: "#f8fafc" },
          ],
        },
        {
          id: "eq-solution-notes",
          type: "card",
          title: "Derivation Commentary",
          tag: "EXPLANATION",
          badge: "STEPS",
          description:
            "Follow each step in the sequencer to see how inverse operations systematically isolate x.",
          points: [
            "Step 1: Identify constant term (+5) on the left",
            "Step 2: Subtract 5 from both sides: 2x = 15 - 5",
            "Step 3: Simplify right-hand side to 10: 2x = 10",
            "Step 4: Divide both sides by 2 to isolate x: x = 5",
          ],
          accentColor: "#818cf8",
        },
      ],
      steps: [
        {
          id: "eq-step-2-1",
          title: "Initial Equation State",
          description: "Target equation: 2x + 5 = 15",
          actions: [
            {
              action: "highlight",
              target: "tok-2x",
              color: "#38bdf8",
              duration: 0.6,
              pulse: true,
            },
          ],
        },
        {
          id: "eq-step-2-2",
          title: "Isolate Variable Term",
          description: "Focus on the constant +5 to be moved across the equality sign",
          actions: [
            {
              action: "highlight",
              target: "tok-5",
              color: "#f59e0b",
              duration: 0.6,
              pulse: true,
            },
          ],
        },
        {
          id: "eq-step-2-3",
          title: "Subtract 5 from Both Sides",
          description: "Moving +5 across yields 15 - 5 = 10",
          actions: [
            {
              action: "transform",
              target: "tok-15",
              toContent: "10",
              duration: 0.7,
            },
            {
              action: "fadeOut",
              target: "tok-plus",
              duration: 0.4,
            },
            {
              action: "fadeOut",
              target: "tok-5",
              duration: 0.4,
            },
          ],
        },
        {
          id: "eq-step-2-4",
          title: "Divide by Coefficient (2)",
          description: "Dividing 10 by 2 gives the final answer: x = 5",
          actions: [
            {
              action: "transform",
              target: "tok-2x",
              toContent: "x",
              duration: 0.6,
            },
            {
              action: "transform",
              target: "tok-15",
              toContent: "5",
              duration: 0.6,
            },
            {
              action: "highlight",
              target: "tok-15",
              color: "#10b981",
              duration: 0.8,
              pulse: true,
            },
          ],
        },
      ],
    },
  ],
};

/**
 * Showcase Deck 3: Classical Mechanics & Newton's Laws
 */
export const physicsDeck: Presentation = {
  version: 1,
  title: "Classical Mechanics: Dynamics & Newton's Laws",
  metadata: {
    topic: "Classical Mechanics",
    audience: "Physics & Engineering",
    createdAt: new Date().toISOString(),
    model: "Onyx Engine",
  },
  scenes: [
    {
      id: "phys-scene-1",
      title: "Newton's Three Laws of Motion",
      subtitle: "The deterministic framework governing physical momentum and force",
      category: "DYNAMICS",
      layout: "cards",
      elements: [
        {
          id: "phys-law-1",
          type: "card",
          title: "1. Law of Inertia",
          tag: "INERTIA",
          badge: "LAW 1",
          description:
            "An object remains at rest or in uniform linear motion unless acted upon by a net external force.",
          points: [
            "Inertial frames: Velocity vector remains constant if ΣF = 0",
            "Resistance to acceleration is directly proportional to mass",
          ],
          accentColor: "#38bdf8",
        },
        {
          id: "phys-law-2",
          type: "card",
          title: "2. Fundamental Law (F = ma)",
          tag: "DYNAMICS",
          badge: "LAW 2",
          description:
            "Acceleration is directly proportional to net force and inversely proportional to mass.",
          points: [
            "Equation: F = m · a (Force = Mass × Acceleration)",
            "Units: 1 Newton = 1 kg · m/s²",
          ],
          accentColor: "#34d399",
        },
        {
          id: "phys-law-3",
          type: "card",
          title: "3. Action & Reaction",
          tag: "RECIPROCITY",
          badge: "LAW 3",
          description:
            "When one body exerts a force on another, the second exerts an equal and opposite force on the first.",
          points: [
            "Equal magnitude, opposite directional vectors: F_AB = -F_BA",
            "Conservation of total system momentum: Δp_total = 0",
          ],
          accentColor: "#f59e0b",
        },
      ],
      steps: [
        {
          id: "phys-step-1-1",
          title: "The Three Laws",
          description: "Overview of classical Newtonian mechanics",
          actions: [],
        },
        {
          id: "phys-step-1-2",
          title: "Focus F = ma",
          description: "The core formula connecting mass, force, and acceleration",
          actions: [
            {
              action: "highlight",
              target: "phys-law-2",
              color: "#34d399",
              duration: 0.6,
              pulse: true,
            },
          ],
        },
      ],
    },
    {
      id: "phys-scene-2",
      title: "Interactive Force & Acceleration Sandbox",
      subtitle: "Drag mass and force sliders to calculate acceleration in real time",
      category: "LIVE SIMULATOR",
      layout: "split",
      elements: [
        {
          id: "phys-card-desc",
          type: "card",
          title: "Dynamic Equilibrium",
          tag: "EXPERIMENT",
          badge: "F = ma",
          description:
            "Experiment with differing masses and applied forces to see how acceleration scales linearly with force and inversely with mass.",
          points: [
            "Heavier Mass: Increases inertia, drastically reducing acceleration",
            "Greater Force: Drives higher acceleration proportional to force magnitude",
          ],
          accentColor: "#34d399",
        },
        {
          id: "phys-widget-1",
          type: "interactive-widget",
          widgetType: "physics-slider",
          title: "Newton's 2nd Law Simulator",
        },
      ],
      steps: [
        {
          id: "phys-step-2-1",
          title: "Interactive Physics Simulation",
          description: "Use the sliders on the right to test physical dynamics",
          actions: [
            {
              action: "highlight",
              target: "phys-card-desc",
              color: "#34d399",
              duration: 0.6,
            },
          ],
        },
      ],
    },
  ],
};

/**
 * Showcase Deck 4: Operating System Kernel Architecture
 */
export const osKernelDeck: Presentation = {
  version: 1,
  title: "Operating System Kernel & Memory Architecture",
  metadata: {
    topic: "Operating System Kernels",
    audience: "Systems Engineers",
    createdAt: new Date().toISOString(),
    model: "Onyx Engine",
  },
  scenes: [
    {
      id: "os-scene-1",
      title: "Kernel Architecture & Protection Rings",
      subtitle: "Hardware isolation between untrusted user applications and privileged supervisor space",
      category: "ARCHITECTURE",
      layout: "hero",
      elements: [
        {
          id: "os-card-user",
          type: "card",
          title: "User Space (Ring 3)",
          tag: "ISOLATED",
          badge: "RING 3",
          description:
            "Where standard applications execute with restricted CPU instructions and isolated virtual memory address spaces.",
          points: [
            "Restricted Privileges: Cannot directly issue disk, network, or hardware I/O instructions",
            "Fault Containment: Application crashes or segmentation faults do not bring down the OS",
          ],
          accentColor: "#38bdf8",
        },
        {
          id: "os-card-kernel",
          type: "card",
          title: "Kernel Space (Ring 0)",
          tag: "SUPERVISOR",
          badge: "RING 0",
          description:
            "The heart of the operating system with unrestricted execution access to CPU registers, physical RAM, and hardware devices.",
          points: [
            "Direct Hardware Control: Schedules CPU threads, manages MMU page tables, drives DMA",
            "Monolithic vs Microkernel: Linux implements a monolithic kernel; seL4/Mach use microkernels",
          ],
          accentColor: "#818cf8",
        },
      ],
      steps: [
        {
          id: "os-step-1-1",
          title: "Protection Rings Overview",
          description: "Hardware rings establishing memory boundaries",
          actions: [],
        },
        {
          id: "os-step-1-2",
          title: "Focus Kernel Space",
          description: "Ring 0 supervisor execution mode",
          actions: [
            {
              action: "highlight",
              target: "os-card-kernel",
              color: "#818cf8",
              duration: 0.6,
              pulse: true,
            },
          ],
        },
      ],
    },
    {
      id: "os-scene-2",
      title: "System Calls & Context Switching",
      subtitle: "How applications request kernel services via hardware traps and context saves",
      category: "EXECUTION FLOW",
      layout: "timeline",
      elements: [
        {
          id: "os-step-node-1",
          type: "card",
          title: "1. User Invocation",
          tag: "STAGE 1",
          badge: "SYSCALL",
          description:
            "Application executes a syscall (e.g. read(), write()) putting arguments into CPU registers (RAX, RDI, RSI).",
          points: [
            "Executes 'syscall' or 'int 0x80' assembly instruction",
            "Hardware automatically elevates CPU to Ring 0",
          ],
          accentColor: "#38bdf8",
        },
        {
          id: "os-step-node-2",
          type: "card",
          title: "2. Trap Table & Context Save",
          tag: "STAGE 2",
          badge: "CONTEXT",
          description:
            "Kernel saves user registers to kernel stack, inspects syscall number in RAX, and jumps to handler.",
          points: [
            "Saves program counter (RIP) and stack pointer (RSP)",
            "Prevents malicious arguments through kernel boundary sanitization",
          ],
          accentColor: "#818cf8",
        },
        {
          id: "os-step-node-3",
          type: "card",
          title: "3. Service Return (sysret)",
          tag: "STAGE 3",
          badge: "RETURN",
          description:
            "Kernel places return code into RAX, restores user register state, and drops privilege back to Ring 3.",
          points: [
            "Zero overhead switch back to user space",
            "Resumes userspace application execution seamlessly",
          ],
          accentColor: "#34d399",
        },
      ],
      steps: [
        {
          id: "os-step-2-1",
          title: "Full Syscall Pipeline",
          description: "Three stages of crossing the user/kernel boundary",
          actions: [],
        },
        {
          id: "os-step-2-2",
          title: "Highlight Stage 1: Syscall",
          description: "Hardware trap invocation",
          actions: [
            {
              action: "highlight",
              target: "os-step-node-1",
              color: "#38bdf8",
              duration: 0.5,
              pulse: true,
            },
          ],
        },
        {
          id: "os-step-2-3",
          title: "Highlight Stage 2: Context Save",
          description: "Kernel register preservation",
          actions: [
            {
              action: "highlight",
              target: "os-step-node-2",
              color: "#818cf8",
              duration: 0.5,
              pulse: true,
            },
          ],
        },
      ],
    },
  ],
};

export const showcaseDecks = {
  booleanLogic: booleanLogicDeck,
  equationSolver: equationSolverDeck,
  physics: physicsDeck,
  osKernel: osKernelDeck,
};
