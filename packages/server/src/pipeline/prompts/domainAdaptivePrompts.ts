/**
 * Domain-Adaptive Extraction Prompts
 *
 * Replaces the hardcoded physics-only extraction with a domain-aware system.
 * Stage 1 first detects the document domain, then injects the right extraction scaffold.
 *
 * Supported domains:
 *   physics_math | cs_algorithms | chemistry_biology | engineering |
 *   economics_finance | social_history | medicine_health | general
 */

export type DocumentDomain =
  | "physics_math"
  | "cs_algorithms"
  | "chemistry_biology"
  | "engineering"
  | "economics_finance"
  | "social_history"
  | "medicine_health"
  | "general";

/**
 * Fast heuristic domain classifier.
 * Reads the first ~4000 characters of the raw content to detect domain.
 * Falls back to "general" if no strong signal is found.
 */
export function detectDocumentDomain(rawContent: string): DocumentDomain {
  const sample = rawContent.slice(0, 4000).toLowerCase();

  // Score each domain by keyword density
  const scores: Record<DocumentDomain, number> = {
    physics_math: 0,
    cs_algorithms: 0,
    chemistry_biology: 0,
    engineering: 0,
    economics_finance: 0,
    social_history: 0,
    medicine_health: 0,
    general: 0,
  };

  // Physics / Math signals
  const physicsMathSignals = [
    "equation", "theorem", "calculus", "velocity", "acceleration", "momentum",
    "quantum", "wave", "particle", "force", "energy", "entropy", "relativity",
    "fourier", "laplace", "differential equation", "integral", "eigenvalue",
    "matrix", "vector space", "topology", "manifold", "gradient", "divergence",
    "hamiltonian", "lagrangian", "newton", "maxwell", "schrödinger", "planck",
    "math", "mathematics", "solve", "algebra", "derive", "derivation", "derivative",
    "prove", "proof", "evaluate", "simplify", "factor", "arithmetic", "fraction",
    "trigonometry", "polynomial", "logarithm", "probability", "combinatorics",
  ];
  for (const sig of physicsMathSignals) {
    if (sample.includes(sig)) scores.physics_math += 2;
  }
  // Strong mathematical problem solving & notation patterns
  if (
    /(?:solve|calculate|evaluate|derive|find|compute)\b.*(?:equation|derivative|integral|root|limit|formula|sum|matrix|f\(x\)|x\b|y\b)/i.test(sample) ||
    /\b(?:f\(x\)|dy\/dx|d\/dx|y'|y''|\d*x\s*[+\-=^]|\$\\int|\$y|\$x)\b/i.test(sample)
  ) {
    scores.physics_math += 4;
  }

  // CS / Algorithms signals
  const csSignals = [
    "algorithm", "complexity", "o(n", "o(log", "big-o", "data structure",
    "graph", "tree", "hash", "dynamic programming", "recursion", "pointer",
    "memory", "kernel", "process", "thread", "mutex", "semaphore", "cache",
    "cpu", "gpu", "compiler", "parser", "network", "protocol", "tcp", "http",
    "api", "database", "sql", "index", "b-tree", "namespace", "container",
    "docker", "linux", "operating system", "socket", "packet", "latency",
    "throughput", "distributed", "consensus", "raft", "blockchain", "neural network",
    "machine learning", "transformer", "attention", "backpropagation",
  ];
  for (const sig of csSignals) {
    if (sample.includes(sig)) scores.cs_algorithms += 2;
  }

  // Chemistry / Biology signals
  const chemBioSignals = [
    "molecule", "atom", "bond", "reaction", "enzyme", "protein", "dna", "rna",
    "cell", "gene", "chromosome", "mitosis", "photosynthesis", "metabolism",
    "catalyst", "oxidation", "reduction", "acid", "base", "ph", "concentration",
    "mol", "titration", "organic chemistry", "polymer", "amino acid",
    "evolution", "species", "ecosystem", "bacteria", "virus", "mutation",
  ];
  for (const sig of chemBioSignals) {
    if (sample.includes(sig)) scores.chemistry_biology += 2;
  }

  // Engineering signals
  const engineeringSignals = [
    "circuit", "resistor", "capacitor", "inductor", "voltage", "current",
    "signal", "amplifier", "transistor", "semiconductor", "microcontroller",
    "pid", "control system", "feedback", "transfer function", "bode",
    "material", "stress", "strain", "yield", "tensile", "thermal",
    "cad", "finite element", "simulation", "tolerance", "specification",
    "bridge", "beam", "load", "torque", "gear", "motor", "actuator",
  ];
  for (const sig of engineeringSignals) {
    if (sample.includes(sig)) scores.engineering += 2;
  }

  // Economics / Finance signals
  const econFinanceSignals = [
    "gdp", "inflation", "market", "stock", "bond", "portfolio", "risk",
    "return", "interest rate", "monetary", "fiscal", "supply", "demand",
    "elasticity", "utility", "equilibrium", "price", "cost", "profit",
    "regression", "econometrics", "derivative", "option", "hedge",
    "trade", "tariff", "currency", "exchange rate", "recession", "growth",
  ];
  for (const sig of econFinanceSignals) {
    if (sample.includes(sig)) scores.economics_finance += 2;
  }

  // Social / History signals
  const socialHistorySignals = [
    "society", "culture", "history", "war", "revolution", "government",
    "policy", "law", "rights", "democracy", "politics", "sociology",
    "psychology", "behavior", "cognitive", "research study", "survey",
    "population", "census", "migration", "religion", "philosophy",
    "ethics", "morality", "literature", "art", "language", "linguistics",
  ];
  for (const sig of socialHistorySignals) {
    if (sample.includes(sig)) scores.social_history += 2;
  }

  // Medicine / Health signals
  const medSignals = [
    "patient", "clinical", "diagnosis", "treatment", "therapy", "drug",
    "pharmacology", "disease", "symptom", "syndrome", "pathology",
    "surgery", "physician", "hospital", "trial", "randomized", "placebo",
    "dose", "biomarker", "imaging", "mri", "ct scan", "blood pressure",
    "cardiovascular", "oncology", "cancer", "tumor", "immune", "antibody",
  ];
  for (const sig of medSignals) {
    if (sample.includes(sig)) scores.medicine_health += 2;
  }

  // Find the winning domain (minimum score of 4 to be considered)
  let best: DocumentDomain = "general";
  let bestScore = 3; // threshold: must beat this to override "general"
  for (const [domain, score] of Object.entries(scores) as [DocumentDomain, number][]) {
    if (domain !== "general" && score > bestScore) {
      best = domain;
      bestScore = score;
    }
  }

  return best;
}

/**
 * Returns the domain-specific extraction instructions to inject at the end of Stage 1's prompt.
 * This replaces the old hardcoded `stage1PhysicsPrompt`.
 */
export function getDomainExtractionPrompt(domain: DocumentDomain, topic: string): string {
  switch (domain) {
    case "physics_math":
      return `
PHYSICS & MATHEMATICS DOMAIN EXTRACTION for "${topic}":
1. MATHEMATICAL QUESTION & PROBLEM SOLVING MANDATE:
   If the topic asks to solve, calculate, evaluate, derive, or prove any mathematical problem:
   - FULL STEP-BY-STEP SOLUTION: You MUST fully solve the mathematical problem from initial given conditions to the final result.
   - ZERO FORGOTTEN / SKIPPED STEPS: You must NOT skip algebraic steps. Provide:
     * Problem statement & given conditions
     * Law / identity / theorem applied (e.g. Integration by Parts, Quadratic Formula, L'Hôpital's Rule)
     * Every intermediate substitution, manipulation, factoring, and simplification step
     * Final simplified answer with boxed KaTeX formula ($$ ... $$) and verification.
   - TECHNICAL PAYLOAD: Every intermediate step MUST be its own distinct technical_payload item with exact KaTeX formula AND explanatory text.
2. GOVERNING EQUATIONS: List every equation with each variable's symbol, mathematical/physical meaning, and domain.
3. MENTAL MODELS & INTUITION: Identify 2-4 geometric, visual, or physical mental models (e.g. area under curve, vectors, energy balance, phase space).
4. DERIVATION CHAINS: Extract complete step-by-step derivation chains where formulas transform into each other.
5. WORKED EXAMPLES: Concrete worked numerical or symbolic calculations with verified answers.
OUTPUT includes: complete step-by-step mathematical solutions (LaTeX notation $$ ... $$), governing equations, step justifications, and worked examples.`;

    case "cs_algorithms":
      return `
COMPUTER SCIENCE & ALGORITHMS DOMAIN EXTRACTION for "${topic}":
1. ALGORITHMS: List every algorithm mentioned with its time complexity O(...), space complexity, and key invariant.
2. DATA STRUCTURES: Describe exact memory layouts, pointer relationships, and structural invariants.
3. SYSTEM ARCHITECTURE: Extract component boundaries, API contracts, data flow paths, and state transitions.
4. REAL COMMANDS & CODE: Pull exact CLI commands, code snippets, syscalls, flags, and their actual outputs from the document.
5. PERFORMANCE METRICS: Extract concrete benchmarks — latencies (ms/μs/ns), throughput (req/s, MB/s), cache hit rates, etc.
6. PROTOCOL/STATE MACHINES: Identify all state transitions, message formats, and handshake sequences.
OUTPUT includes: algorithms with complexity, system topology, exact code/commands, and quantitative benchmarks.`;

    case "chemistry_biology":
      return `
CHEMISTRY & BIOLOGY DOMAIN EXTRACTION for "${topic}":
1. CHEMICAL REACTIONS: Extract balanced reaction equations with reactants, products, catalysts, and conditions (temperature, pressure, pH).
2. MOLECULAR STRUCTURES: Describe key molecules, their functional groups, and binding sites.
3. BIOLOGICAL PATHWAYS: Map metabolic or signaling pathways with exact step-by-step enzyme/cofactor involvement.
4. QUANTITATIVE DATA: Pull concentration values, rate constants (kcat, Km), binding affinities (Kd), and thermodynamic values (ΔG, ΔH).
5. EXPERIMENTAL METHODS: Extract specific protocols, instruments, and measurement techniques used.
OUTPUT includes: reaction equations (with stoichiometry), pathway diagrams, rate constants, and experimental methods.`;

    case "engineering":
      return `
ENGINEERING DOMAIN EXTRACTION for "${topic}":
1. SYSTEM SPECIFICATIONS: Extract exact component values (resistance Ω, capacitance F, voltage V, frequency Hz, material strength MPa).
2. GOVERNING EQUATIONS: List design equations, transfer functions, Bode plots, or stress-strain relations with all variables.
3. CIRCUIT / MECHANICAL DIAGRAMS: Describe system block diagrams, signal flow, feedback loops, or mechanical assemblies.
4. DESIGN PARAMETERS: Pull all sizing calculations, tolerance bands, safety factors, and operating ranges.
5. SIMULATION RESULTS: Extract key simulation outputs or measured performance curves.
OUTPUT includes: component specs, design equations, block diagrams, and performance metrics.`;

    case "economics_finance":
      return `
ECONOMICS & FINANCE DOMAIN EXTRACTION for "${topic}":
1. ECONOMIC MODELS: Identify the formal models used (supply-demand, IS-LM, CAPM, DCF, regression models) with all variables defined.
2. KEY EQUATIONS: Extract mathematical relationships with variable definitions and units (e.g. GDP = C + I + G + NX).
3. QUANTITATIVE DATA: Pull real numerical values — percentages, price levels, growth rates, elasticities, R², coefficients.
4. POLICY MECHANISMS: Describe exact policy instruments, their transmission channels, and measured effects.
5. COMPARATIVE ANALYSIS: Extract any tabular comparisons, rankings, or scenario analyses.
OUTPUT includes: model equations, empirical values, policy mechanisms, and data tables.`;

    case "social_history":
      return `
SOCIAL SCIENCE & HUMANITIES DOMAIN EXTRACTION for "${topic}":
1. CORE THESIS: Extract the central argument or historical claim with supporting evidence and sources.
2. KEY EVENTS & TIMELINE: Map chronological events with exact dates, actors, causes, and effects.
3. THEORETICAL FRAMEWORKS: Identify the analytical frameworks used (e.g. sociological theory, philosophical school, historical method).
4. EMPIRICAL EVIDENCE: Pull specific statistics, survey results, case studies, or primary sources cited.
5. CAUSAL CHAINS: Describe cause-and-effect relationships with the author's specific argument.
OUTPUT includes: thesis, timeline, theoretical frameworks, empirical data, and causal analysis.`;

    case "medicine_health":
      return `
MEDICINE & HEALTH DOMAIN EXTRACTION for "${topic}":
1. CLINICAL MECHANISMS: Describe the pathophysiology — what goes wrong at the molecular/cellular/organ level and why.
2. DIAGNOSTIC CRITERIA: Extract exact diagnostic thresholds, biomarker values, imaging findings, or scoring systems.
3. TREATMENT PROTOCOLS: List drug names with doses, mechanisms of action, contraindications, and expected outcomes.
4. CLINICAL EVIDENCE: Pull trial results — patient numbers (n=), p-values, confidence intervals, NNT, or hazard ratios.
5. PHYSIOLOGICAL EQUATIONS: Extract any pharmacokinetic formulas (clearance, half-life, bioavailability) or physiological models.
OUTPUT includes: pathophysiology, diagnostic thresholds, treatment protocols, and clinical trial statistics.`;

    case "general":
    default:
      return `
COMPREHENSIVE DOMAIN EXTRACTION for "${topic}":
1. CORE CONCEPTS: Identify the 4-6 most important ideas, principles, or mechanisms in the document with precise definitions.
2. KEY RELATIONSHIPS: Extract cause-and-effect relationships, comparisons, and logical dependencies between concepts.
3. QUANTITATIVE DATA: Pull every number, measurement, rate, percentage, or statistical value mentioned.
4. STRUCTURAL PATTERNS: Identify any processes, sequences, hierarchies, or taxonomies described.
5. VISUAL OPPORTUNITIES: Note which concepts would benefit from diagrams, timelines, comparisons, or interactive demonstrations.
OUTPUT: Comprehensive structured extraction covering all sections of the document with concrete facts, not summaries.`;
  }
}

/**
 * Returns domain-appropriate Stage 2 storyboard rules.
 * Replaces the hardcoded `stage2PhysicsPrompt` which was forcing physics-only constraints.
 */
export function getDomainStoryboardRules(domain: DocumentDomain): string {
  switch (domain) {
    case "physics_math":
      return `DOMAIN STORYBOARD RULES (Physics & Mathematics):
- MATHEMATICAL PROBLEM SOLVING PROGRESSION:
  * If the topic involves solving a math question, calculate, evaluate, or derive a formula:
    - Slide 1: Problem Definition, Given Conditions & Setup (purpose: "hook" or "concept")
    - Slide 2: Governing Method / Theorem & Strategy (purpose: "concept")
    - Middle Slides: Step-by-Step Derivation Phases (purpose: "proof", content_type: "math", archetype: "equation-morpher"). Dedicate at least 1-2 slides to walk through all intermediate algebraic manipulations.
    - Final Slide: Evaluated Solution, Verification & Intuition (purpose: "demo" or "closing")
  * ZERO FORGOTTEN STEPS: All mathematical steps from Stage 1 technical_payload MUST be referenced across slides.
  * DELIBERATE ANIMATION PACING: Set animation_energy to "calm" or "subtle" on math slides. Steps must unfold deliberately so the audience can read each formula before the next arrives.
  * NO BLANK SLIDES: Every math slide must feature prominent KaTeX displays ($$ ... $$) and clear explanatory cards.
- At least one slide MUST use the "equation-morpher" archetype to animate formulas step-by-step.
- For physics topics with dynamic parameters, use "interactive-simulator" with sliders tied to governing variables.
- FORBIDDEN: bullet-only slides with no equation or visual element.`;

    case "cs_algorithms":
      return `DOMAIN STORYBOARD RULES (Computer Science & Algorithms):
- At least one slide MUST use "code-terminal" with real extracted commands and actual outputs.
- At least one slide MUST use "architecture-topology" or "motion-pipeline" showing system data flow.
- Complexity classes MUST appear on slides covering algorithms (O(n log n), Θ(n²), etc.).
- State machines or protocol sequences → use "state-machine-fsm" archetype.
- Memory layouts or packet formats → use "disk-memory-layout" archetype.
- FORBIDDEN: vague slides without concrete code, commands, or architectural specifics.`;

    case "chemistry_biology":
      return `DOMAIN STORYBOARD RULES (Chemistry & Biology):
- Reaction pathways → use "motion-pipeline" archetype with each stage being a reaction step.
- Molecular comparisons → use "benchmark-matrix" with real Kd, Km, or ΔG values in cells.
- At least one "interactive-simulator" slide if the topic has quantitative rate laws or equilibria.
- Biological hierarchy (cell → organ → organism) → use "architecture-topology" or "tree-hierarchy".
- FORBIDDEN: bullet lists of definitions without structural visualization.`;

    case "engineering":
      return `DOMAIN STORYBOARD RULES (Engineering):
- Circuit/control diagrams → use "architecture-topology" with labeled component tiers.
- At least one "interactive-simulator" with real component values as slider parameters.
- Signal flow or process pipelines → use "motion-pipeline" with real stage labels.
- Design specification tables → use "benchmark-matrix" with exact numeric values.
- FORBIDDEN: slides without actual engineering values (component ratings, tolerances, frequencies).`;

    case "economics_finance":
      return `DOMAIN STORYBOARD RULES (Economics & Finance):
- Model equations (IS-LM, CAPM, regression) → use "equation-morpher" archetype.
- Market data or comparative metrics → use "benchmark-matrix" or "stat-dashboard-grid" with real values.
- Policy transmission mechanisms → use "motion-pipeline" showing cause-effect chain.
- Time-series or scenario analysis → use "bento-dashboard" with real % values.
- FORBIDDEN: abstract conceptual slides without quantitative data from the document.`;

    case "social_history":
      return `DOMAIN STORYBOARD RULES (Social Science & Humanities):
- Chronological events → use "timeline-milestone" with exact dates and actors.
- Causal chains or theoretical frameworks → use "motion-pipeline" showing argument flow.
- Comparative analysis (societies, policies, ideologies) → use "benchmark-matrix".
- Core thesis → use "quote-spotlight" archetype with the exact cited argument.
- FORBIDDEN: generic overview slides that don't commit to a specific claim or date.`;

    case "medicine_health":
      return `DOMAIN STORYBOARD RULES (Medicine & Health):
- Pathophysiology → use "motion-pipeline" showing disease progression steps.
- Clinical data or trial results → use "stat-dashboard-grid" with real p-values, n=, hazard ratios.
- Diagnostic criteria → use "benchmark-matrix" with exact threshold values.
- Drug mechanism → "motion-pipeline" from receptor binding to clinical effect.
- FORBIDDEN: slides that mention treatments without dosing, mechanisms, or clinical evidence.`;

    case "general":
    default:
      return `DOMAIN STORYBOARD RULES (General):
- Use visual diversity across all slides: pipeline, matrix, bento, timeline, terminal, simulator.
- Prioritize "motion-pipeline" for any sequential process, "benchmark-matrix" for comparisons.
- At least 40% of slides must use interactive or dynamic archetypes.
- FORBIDDEN: more than 2 consecutive slides using the same archetype.`;
  }
}
