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
    model: "Keynox Engine",
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
