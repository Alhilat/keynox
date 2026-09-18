# HYPERDECK PLATFORM — SYSTEM ARCHITECTURE & DEVELOPER GUIDE

> **Fast-track orientation file for AI agents and senior engineers.**  
> Read this file first to understand the entire repository, technical architecture, and design constraints.

---

## 1. Executive Summary & Core Vision

HyperDeck is an **interactive, web-native presentation engine, visual studio, and explainer runtime** designed to replace static slide decks (like PowerPoint and Google Slides). 

### Core Product Philosophy
- **Presentations are Executable Web Applications**: Slides are not static text boxes with bullet points. They contain **live, interactive simulators** (e.g. clickable Boolean logic circuits, physics dynamics sliders, live code runners) and **fine-grained mathematical step animations** where terms visibly move and transform across equations using GSAP.
- **Visual Studio & Keynote Player**: Users can present in a cinematic, fullscreen Keynote environment or switch to a Visual Studio editor to visually design slides, insert components, and configure animation steps.
- **Zero AI Buzzword Slop & 100% Topic Fidelity**: Decks compiled by Nemotron and DeepSeek AI generate concrete, domain-specific technical models, truth tables, circuit diagrams, and mathematical derivations. All content MUST be derived 100% from the user's specific topic or uploaded paper—never canned corporate filler or hardcoded placeholder Greek letters (α/β).
- **Zero Blank State**: The platform always loads with rich showcase decks ready to play immediately.

---

## 2. Monorepo Architecture

The repository is structured as an npm monorepo with 4 interdependent workspaces:

```
/home/abdulrahman/presentation/
├── packages/
│   ├── schema/    # Shared Zod schemas & TypeScript types
│   ├── engine/    # Pure TypeScript presentation DOM & GSAP animation engine
│   ├── server/    # Fastify backend with Dual-Stage AI compilation & SSE stream
│   └── client/    # React 18 + Vite + Tailwind keynote player & visual studio
├── package.json   # Root workspace manager
└── AGENTS.md      # This architectural orientation guide
```

### Dependency Graph
```
@presentation/schema (Foundation)
       ▲               ▲
       │               │
@presentation/engine   @presentation/server
       ▲               ▲
       │               │
     @presentation/client (Frontend UI)
```

---

## 3. Package Deep Dives

### A. `@presentation/schema` (`packages/schema`)
Defines the authoritative data model using **Zod**. Every presentation is a single JSON document adhering to `PresentationSchema`.

- **`Presentation`**: Contains metadata and an array of `scenes` (slides).
- **`Scene`**:
  - `layout`: `"hero" | "cards" | "split" | "timeline" | "stat" | "standard"`
  - `elements`: Array of polymorphic elements (`card`, `equation`, `text`, `shape`, `image`, `interactive-widget`).
  - `steps`: Array of animated steps executed sequentially during presentation.
- **`Element` Types**:
  - `CardElement`: Structured concept container with title, description, badge, tag, and key points list.
  - `EquationElement`: Mathematical expression with fine-grained `MathToken` objects (`variable`, `operator`, `constant`, `term`).
  - `InteractiveWidgetElement`: Executable widget (`boolean-simulator`, `physics-slider`, `code-block`, `comparison-matrix`).
- **`StepAction` Types**:
  - `highlight`: Spotlight element with glowing border, pulse, and dims sibling cards to 45%.
  - `transform`: Morph token text (e.g. `15 - 5` → `10`).
  - `move`: Shift element by `(x, y)` delta.
  - `replace`: Swap out DOM tokens.
  - `fadeIn` / `fadeOut` / `scale` / `rotate`.

---

### B. `@presentation/engine` (`packages/engine`)
A lightweight, dependency-minimal runtime that renders and animates presentations directly into the DOM.

- **`DOMRenderer` (`src/renderer.ts`)**:
  - Renders a fixed **1280x720 virtual stage** centered and auto-scaled to fit any viewport using a `ResizeObserver` and GPU-accelerated transforms (`translate3d(0,0,0) scale(scale)`).
  - Supports structured responsive layouts (`hero`, `cards`, `split`, `timeline`).
  - **Direct Interactive Simulators**:
    - `boolean-simulator`: Clickable Signal A & B switches (`1/HIGH` vs `0/LOW`), reactive gate evaluation (AND, OR, NOT, XOR) with pulsing LED indicators, and live truth table row highlighting.
    - `physics-slider`: Interactive mass ($m$) and force ($F$) sliders calculating acceleration ($a = F/m$ m/s²).
- **`GSAPAnimator` (`src/animator.ts`)**:
  - Coordinates GSAP timelines for all `StepAction` animations.
  - Features card spotlighting (dimming siblings to 45% so the audience focuses on the active card).
- **`PresentationEngine` (`src/engine.ts`)**:
  - Master state machine managing current slide index, step index, navigation (`nextStep`, `prevStep`, `goToScene`, `goToStep`), and emitting state updates.
- **`PresentationAudio` (`src/sound.ts`)**:
  - Synthesizes audio effects via Web Audio API (step click, move whoosh, highlight ping, success chime).

---

### C. `@presentation/server` (`packages/server`)
Fastify backend running on **port 3001**.

- **Endpoints**:
  - `POST /api/ai/stream`: Accepts `{ topic: string }` and returns a Server-Sent Events (SSE) stream.
  - `POST /api/ai/stream-site`: Dual-Stage Nemotron stream synthesizing standalone interactive presentations.
- **Modular Pipeline Architecture (`packages/server/src/pipeline/`)**:
  - `orchestrator.ts`: Master pipeline coordinator with LRU caching, watchdog, and streaming lifecycle management.
  - `token-optimizer.ts`: Pre-bundled Master Obsidian & Glassmorphism design system saving ~65% output tokens.
  - `stage1-architect.ts`: Nemotron 30B Nano Reasoning concept extractor & animation planner.
  - `stage2-synthesizer.ts`: Nemotron 120B Super / Lightning interactive slide generator.
  - `html-assembler.ts`: Clean standalone HTML packager embedding GSAP, KaTeX, navigation engine, and keyboard handlers.
  - `cache.ts`: In-memory LRU prompt cache for instant repeat queries.

---

### D. `@presentation/client` (`packages/client`)
React 18 application built with Vite and Tailwind CSS running on **port 5173**.

- **`App.tsx`**:
  - Unified platform shell with a 3-mode switcher:
    1. **AI Studio (`generator`)**: Prompt bar with topic presets, 60FPS RAF streaming reasoning console, and live interactive explainer preview.
    2. **Keynote Player (`player`)**: Cinematic presentation stage with thumbnail sidebar, audio effects, laser pointer, and step controls.
    3. **Visual Studio (`studio`)**: Slide list, live canvas inspector, element adder, step sequencer.
  - Showcase Gallery to instantly test pre-built interactive decks (Boolean Logic, Equations, Physics, OS Kernel).
- **Key Components**:
  - `PresentationPlayer.tsx`: The primary keynote stage. Includes collapsible `SlideNavigator`, laser pointer, sound toggle, fullscreen mode, step scrubber, and step HUD.
  - `EditorStudio.tsx`: Full visual slide deck designer. Users can edit titles, add/delete slides, add concept cards, equations, text blocks, and live simulators, and sequence step animations.
  - `HtmlPresentationViewer.tsx`: Standalone 16:9 explainer web app viewport with code inspector, outline viewer, download, and fullscreen.
  - `NemotronProcessViewer.tsx`: Terminal logs of Stage 1 (Nano 30B) and Stage 2 (Super 120B) reasoning and code.
  - `useStreamThrottler.ts`: Custom hook batching incoming tokens via `requestAnimationFrame` for guaranteed 60FPS rendering without virtual DOM thrashing.

---

## 4. Key Workflows & Data Flow

### 1. Presentation Playback Flow
```
User navigates to http://localhost:5173
  │
  ├──> App.tsx loads `booleanLogicDeck` by default (0ms blank state)
  │
  └──> PresentationPlayer mounts `PresentationEngine` on container ref
         │
         ├──> DOMRenderer draws 1280x720 virtual stage with layouts & simulators
         │
         ├──> User presses Space / Next Step
         │      ├──> GSAPAnimator executes step actions (highlight, spotlight, audio)
         │      └──> Engine updates step index & scrubber
         │
         └──> User interacts with slide
                └──> Clicks Signal A / B -> Live simulator updates gates & truth table
```

### 2. Studio Editing Flow
```
User clicks [ 🛠️ Visual Editor ] in Header
  │
  └──> EditorStudio mounts with current presentation
         ├──> Left column: Slide thumbnails (Add / Reorder / Delete)
         ├──> Center column: Canvas inspector (+ Card, + Equation, + Simulator)
         └──> Right column: Step sequencer (Add step, highlight target, pulse)
  │
User clicks [ ▶ Keynote Player ]
  └──> Switches back to Keynote Player with updated changes instantly
```

### 3. HyperDeck Dual-Stage Generation Flow
```
User enters topic (e.g. "Quantum Circuits") -> clicks "Generate with Nemotron AI"
  │
  ├──> POST /api/ai/stream-site (SSE stream)
  │      │
  │      ├──> Cache Check: If present in LRU cache, returns instantly (<10ms)
  │      │
  │      ├──> STAGE 1: Nemotron 30B Nano (nvidia/nemotron-3-nano-omni-30b-a3b-reasoning)
  │      │      * Generates slide outline, category badges, technical formulas & simulator concepts
  │      │      * Emits `stage1_start`, `stage1_chunk` (streaming thoughts & outline), `stage1_complete`
  │      │
  │      └──> STAGE 2: Nemotron 120B Super (nvidia/nemotron-3-super-120b-a12b)
  │             * Token-optimized prompt (CSS design system pre-bundled by HyperDeck assembler)
  │             * Synthesizes semantic slide sections with interactive simulators & tables
  │             * Emits `stage2_start`, `stage2_reasoning`, `stage2_chunk`, `complete`
  │
  └──> Client UI (NemotronProcessViewer + HtmlPresentationViewer):
         * Tokens throttled at 60FPS via requestAnimationFrame (no React lag)
         * Instantly renders the generated presentation inside HtmlPresentationViewer
         * Fullscreen, Open in New Window, Download .html, and View Source Code
```

---

## 5. Development & Build Instructions

### Running Locally
```bash
# Start all packages in dev mode (Vite on :5173, Fastify on :3001)
npm run dev

# Or run individual packages
npm --workspace=@presentation/server run dev
npm --workspace=@presentation/client run dev
```

### Building & Validating
```bash
# Full monorepo TypeScript build & Vite bundle
npm run build

# Individual package builds
npm --workspace=@presentation/schema run build
npm --workspace=@presentation/engine run build
npm --workspace=@presentation/server run build
npm --workspace=@presentation/client run build
```

---

1. **MANDATORY 100% TOPIC FIDELITY & ZERO HARDCODING (CRITICAL LAW)**: 
   - **ABSOLUTELY NEVER HARDCODE ANY INFORMATION, DATA, OR TOPIC**: Do not write `if (topic.includes(...))`, do not hardcode topic-specific templates (IoT, Physics, etc.), do not hardcode mock metrics (e.g. "4,800 ops/s", "Active Node Concurrency"), and do not hardcode Greek placeholder variables (e.g. "Intensity Factor α / Load Constraint β").
   - **100% PURE DYNAMIC GENERATION**: All slide titles, concept cards, equations, comparison matrices, and visual simulators MUST be synthesized live by the AI models (Nemotron 120B Super / DeepSeek) directly from the user's input text or uploaded PDF.
   - **NO SILENT MOCK FALLBACKS**: If an AI request fails, report the error or retry dynamically. Never substitute a pre-written hardcoded mock deck.
2. **Never Render Plain Static Text Bullets**: The user hates static corporate slides. Presentations must have rich visual shapes: dynamic bar charts, SVG Venn diagrams, connected flow topologies, and live visual stages for simulations.
3. **Vanilla DOM for Simulators in Engine**: Interactive widgets rendered by `DOMRenderer` are implemented with vanilla DOM and event listeners. This eliminates React reconciler conflicts with GSAP and ensures simulators work flawlessly inside fullscreen mode.
4. **Stage Coordinates & Aspect Ratio**: The presentation stage is strictly **1280x720 (16:9)** with GPU-accelerated `transform: translate3d(0,0,0) scale(scale)` applied by `ResizeObserver`.
5. **Token Budgeting**: Always use the pre-bundled design system from `token-optimizer.ts`. Never ask LLMs to generate 100+ lines of CSS, which causes output truncation.
6. **Stream Throttling**: Always route streaming tokens through `useStreamThrottler` to prevent high-frequency React re-renders from locking the browser thread.
