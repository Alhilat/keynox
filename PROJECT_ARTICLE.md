# Keynox Platform — Full Project Article

> A file-by-file guide to the entire monorepo: what every file is and what it does.
> Repository: `/home/abdulrahman/presentation` · ~18,300 lines of TypeScript/TSX across 4 workspace packages.
> Verified state: `npm run build` ✅ · `vitest` 43/43 ✅ · 7 files currently modified-but-uncommitted.

---

## 1. What the project is

**Keynox** is an interactive, web-native presentation engine with an AI compilation pipeline. You type a topic — or upload a PDF — and a **3-stage LLM pipeline** synthesizes a complete, standalone HTML keynote (slides, KaTeX equations, SVG diagrams, live simulators), converts the same result into a typed **Presentation AST** for a native React/GSAP keynote player, and streams every intermediate token to the UI at 60 FPS.

Design laws (from `AGENTS.md`):

1. **100% topic fidelity, zero hardcoding** — no topic-specific `if` branches, no canned mock decks.
2. **No static bullet slides** — rich visuals: charts, SVG topologies, live simulators.
3. **Vanilla DOM for simulators** — avoids React reconciler vs. GSAP conflicts.
4. **Strict 1280×720 (16:9) stage** with GPU `translate3d(0,0,0) scale(...)`.
5. **Token budgeting** — CSS is pre-bundled server-side; LLMs never write boilerplate.
6. **Stream throttling** — all SSE tokens flow through `useStreamThrottler`.

### The three runtime modes (client `App.tsx`)

| Mode | Component | Purpose |
|---|---|---|
| `studio` (default) | `ConceptInputArea` → `NemotronProcessViewer` → `HtmlPresentationViewer` | Generate and watch the AI pipeline, preview the HTML site |
| `player` | `PresentationPlayer` | Cinematic native keynote stage (engine + GSAP) |
| `editor` | `EditorStudio` | Visual slide/element/step designer |

### End-to-end data flow

```
User topic / PDF (ConceptInputArea)
   │  PDF → pdfExtractor → POST /api/ai/extract-pdf
   ▼
POST /api/ai/stream-site  (SSE, Fastify :3001)
   ▼
PipelineOrchestrator
   ├─ cache check (LRU, 4h, poison filter)
   ├─ STAGE 1  stage1-analyzer    → deep domain knowledge extraction
   ├─ STAGE 2  stage2-storyboard  → slide narrative + visual/photo blueprint
   ├─ STAGE 3  stage3-creative-generator → per-slide HTML (watchdog + model fallbacks)
   ├─ photo synthesis  imageService (NVIDIA FLUX, parallel, ≤4 images)
   ├─ html-assembler (+ token-optimizer design system) → standalone HTML
   ├─ html-to-ast → Presentation AST  (validated by Zod PresentationSchema)
   └─ cache.set → SSE `complete` event
   ▼
App.tsx (RAF-throttled stream) → HtmlPresentationViewer (iframe)
   → "Keynote Player" → PresentationEngine → DOMRenderer + GSAPAnimator + PresentationAudio
   → "Visual Studio"  → EditorStudio (edits the AST)
```

---

## 2. Repository map (every file, one line each)

```
presentation/
├── AGENTS.md                     # Canonical architecture guide for agents & engineers (219 lines)
├── README.md                     # Thin landing readme; quick start + 7 feature bullets
├── package.json                  # Workspace root: dev/build/test scripts, Node >=20
├── package-lock.json             # npm lockfile v3 (~6,500 lines)
├── vitest.config.mjs             # Single test config: packages/*/src/**/__tests__/**/*.test.ts
├── render.yaml                   # Render.com blueprint: build all, serve server/dist, /health check
├── .nvmrc                        # Pins Node 20
├── .gitignore                    # Ignores dist/, node_modules/, *.env, logs, coverage, scratch/
├── .agents/, .codex/, .kombai/, scratch/   # Agent/tooling scratch dirs (scratch gitignored, .codex empty)
│
└── packages/
    ├── schema/   ← Zod data model (foundation)
    ├── engine/   ← vanilla-DOM renderer + GSAP + Web Audio runtime
    ├── server/   ← Fastify + 3-stage AI pipeline
    └── client/   ← React 18 + Vite + Tailwind studio/player/editor
```

Dependency graph: `schema` → `engine` + `server` → `client`.

---

## 3. Root files

| File | Lines | What it does |
|---|---|---|
| `package.json` | 24 | npm workspace manager (`workspaces: ["packages/*"]`). Scripts: `dev` (server + client in parallel), `build` (schema → engine → server → client, in dependency order), `start` (`node packages/server/dist/index.js`), `test` (`vitest run`). Dev deps: `typescript ^5.4.5`, `vitest ^5.0.1`. |
| `vitest.config.mjs` | 8 | The only Vitest config. Includes `packages/*/src/**/__tests__/**/*.test.ts`, excludes `dist/` and `node_modules/`. Discovers exactly 3 test files (schema, engine, server). Plain `.mjs` because the root package has no `"type"` field. |
| `.nvmrc` | 1 | `20` — matches `engines.node >=20` and Render's runtime. |
| `.gitignore` | 38 | Sectioned ignores: dependencies, `dist/`/`build/`, **`.env` / `*.env`** (API keys never committed), logs, coverage, IDE/OS files, `scratch/`. |
| `README.md` | 28 | Public readme: quick start (`npm install` / `npm run dev` / `npm run build`) and 7 key-feature bullets; defers all technical depth to `AGENTS.md`. |
| `AGENTS.md` | 219 | The canonical orientation document (injected as agent instructions): vision, monorepo layout, per-package deep dives, 3 workflow diagrams, dev commands, and the 6 hard design rules. *Note: it describes a 2-stage pipeline and a showcase gallery that the code has since changed (now 3-stage; gallery removed in the working tree), and cites `engine/src/engine.ts` which actually lives in `engine/src/index.ts`.* |
| `render.yaml` | 18 | Deployment-as-code for Render: Node web service `keynox` (free plan), `buildCommand: npm install --include=dev && npm run build`, `startCommand: node packages/server/dist/index.js`, `healthCheckPath: /health`, env vars `NODE_ENV=production`, `DEFAULT_AI_PROVIDER=auto`, and **`GEMINI_API_KEY` / `NVIDIA_API_KEY` set manually (`sync: false`)**. |
| `package-lock.json` | ~6,567 | Deterministic lockfile for the whole workspace. |

### tsconfig files (4 — there is **no root tsconfig**)

| File | Key settings |
|---|---|
| `packages/schema/tsconfig.json` | ES2022 / CommonJS, `declaration: true`, `outDir: dist`, `strict`. Emits `.d.ts` consumed by engine + server. |
| `packages/engine/tsconfig.json` | Identical to schema's (declaration + strict). |
| `packages/server/tsconfig.json` | Same, but **no `declaration`** — the server never publishes types. |
| `packages/client/tsconfig.json` | Vite style: `noEmit: true` (type-check only), `jsx: react-jsx`, `moduleResolution: bundler`, `strict` with `noUnusedLocals: false`/`noUnusedParameters: false` (which is why unused icon imports compile). |

Because schema/engine compile to CommonJS but the client is ESM, `client/vite.config.ts` **aliases both packages to their `src/`** so Vite compiles the TypeScript directly.

---

## 4. `packages/schema` — the data model (foundation)

The single source of truth for every deck. Runtime dep: **`zod ^3.23.8`** only. Imported by 13 files across all four packages.

### `src/index.ts` (2)
Barrel: `export * from "./actions"` + `export * from "./presentation"`.

### `src/presentation.ts` (135)
The authoritative document schema. Section by section:

- **`MathTokenSchema`** — fine-grained equation token for step-by-step math animation: `id`, `text`, `type: "variable" | "operator" | "constant" | "term" | "group"` (default `term`), optional `color`, `highlight`.
- **`BaseElementSchema`** — shared geometry/style: `id`, `x`/`y` (default 100/100), optional `width`/`height`, `rotation` 0, `scale` 1, `opacity` 1, free-form `style` record.
- **Six element schemas**, combined into **`ElementSchema = z.discriminatedUnion("type", ...)`**:
  1. `EquationElementSchema` — `type: "equation"`, `rawEquation`, `tokens: MathToken[]`, `fontSize` default 38.
  2. `TextElementSchema` — `type: "text"`, required `content`, `fontSize` 24, `fontWeight`, `color`, `textAlign`.
  3. `ShapeElementSchema` — `type: "shape"`, `shapeType: rectangle|circle|arrow|badge`, `fill`, `stroke`, `borderRadius`.
  4. `CardElementSchema` — `type: "card"`, required `title`, `tag`/`badge`/`description`, `points[]`, `accentColor` `#38bdf8`, `icon`.
  5. `ImageElementSchema` — `type: "image"`, required `src`, `alt`.
  6. `InteractiveWidgetElementSchema` — `type: "interactive-widget"`, `widgetType: boolean-simulator|code-block|comparison-matrix|physics-slider`, `title`, `config` record.
- **`StepSchema`** — one animation beat: `id`, `title`, `description?`, `actions: StepAction[]`.
- **`SceneLayoutSchema`** — `"hero" | "cards" | "split" | "timeline" | "stat" | "standard"` (default `standard`).
- **`SceneSchema`** — one slide: `id`, `title`, `subtitle?`, `category?`, `layout?`, `elements[]`, `steps[]`.
- **`PresentationMetadataSchema`** — `topic?`, `audience?`, `language` default `"English"`, `createdAt?`, `model?`.
- **`PresentationSchema`** (root) — `version` default 1, required `title`, `metadata`, **`scenes` with `.min(1)`**.
- 13 inferred types exported: `MathToken`, `Element`, `EquationElement`, `TextElement`, `CardElement`, `ShapeElement`, `ImageElement`, `InteractiveWidgetElement`, `Step`, `SceneLayout`, `Scene`, `PresentationMetadata`, `Presentation`.

*Design note:* heavy `.default()` chains mean `PresentationSchema.parse()` back-fills everything (so the renderer can rely on defaults post-parse), and Zod strips unknown keys — which is how AI-produced JSON with extra fields still validates.

### `src/actions.ts` (86)
The controlled GSAP animation vocabulary — `StepActionSchema = z.discriminatedUnion("action", ...)` with **8 variants**:

| Action | Fields (defaults) |
|---|---|
| `move` | `target`, `to {x,y}` (default `{0,0}`), `duration` 0.8, `ease` `power2.out` |
| `fadeIn` / `fadeOut` | `target`, `duration` 0.5 |
| `scale` | `target`, `scale` (multiplier), `duration` 0.6 |
| `rotate` | `target`, `angle` (degrees), `duration` 0.6 |
| `highlight` | `target`, `color` `#f59e0b`, `duration` 0.5, `pulse` true |
| `transform` | `target`, `toContent` (new text), `duration` 0.6 |
| `replace` | `targets: string[]`, `with: {id, text, type?}`, `duration` 0.7 |

Exported types: `Point`, `StepAction`, `MoveAction`, `HighlightAction`, `TransformAction`, `ReplaceAction` (6 of 8 variants get a named alias).

### `src/__tests__/schema.test.ts` (109) — 4 tests
1. Validates a full "Quantum Information Systems" deck (card + highlight step).
2. Rejects an invalid `layout` enum value.
3. Validates a `physics-slider` interactive widget with `{formula: "a = F/m"}` config.
4. Validates a `highlight` step action.

---

## 5. `packages/engine` — the presentation runtime

Pure TypeScript, no React. Deps: `@presentation/schema`, **`gsap ^3.12.5`**, `katex ^0.18.7` *(declared but never imported — KaTeX rendering actually happens in the server pipeline; engine equations use plain spans)*.

### `src/index.ts` (215) — `PresentationEngine` state machine
The engine's entry point (mis-mentioned as `engine.ts` in AGENTS.md). Exports `EngineState` (snapshot: `currentSceneIndex`, `currentStepIndex`, `totalScenes`, `totalStepsInScene`, `currentScene?`, `currentStep?`, `soundEnabled`), `StateChangeCallback`, and `class PresentationEngine`:

- **`constructor(container)`** — creates `PresentationAudio`, `DOMRenderer`, `GSAPAnimator(audio)` and registers the global keyboard listener.
- **`loadPresentation(presentation)`** — stores deck, resets indices, kills timelines, renders scene 0.
- **`nextStep()`** — re-entrancy-guarded (`isAnimating`); executes the current step's actions **sequentially with `await`**, or advances to the next scene.
- **`prevStep()`** — steps back, or jumps to the previous scene's **last** step.
- **`goToScene(i)` / `goToStep(i)`** — `goToStep` uses a **replay strategy**: kill timelines → re-render fresh DOM → re-execute all actions `1..target` with `{duration: 0}` (instant catch-up). This is how scrubbing converges to the correct visual state.
- **`onStateChange(cb)`** — subscribes (fires current state immediately), returns an unsubscribe function used by React `useEffect` cleanup.
- **Keyboard** (`setupKeyboardListeners`): `ArrowRight`/`Space`/`PageDown` → next, `ArrowLeft`/`PageUp` → prev; **suppressed when focus is in `INPUT`/`TEXTAREA`**.
- **`destroy()`** — removes listener, kills timelines, disconnects ResizeObserver, clears DOM.
- **`setSoundEnabled`** — delegates to `PresentationAudio`.

*Sole consumer:* `client/src/components/PresentationPlayer.tsx`.

### `src/renderer.ts` (965) — `DOMRenderer`, the largest file in the repo
Vanilla-DOM renderer that draws any `Scene` onto a fixed **1280×720** stage. Sections:

1. **`renderScene(scene, container)`** — builds viewport wrapper → stage element (`1280×720`, `transformOrigin: center`) → 3px gradient accent line → header bar (category chip, title, subtitle, pulsing "KEYNOX DECK" pill) → body → layout dispatch. **Scaling:** `scale = min(parentW/1280, parentH/720)`, applied as `transform: translate3d(0,0,0) scale(scale)` with `willChange: transform`, re-run by a `ResizeObserver` (fallback size 800×450).
2. **`detectLayout(scene)`** — heuristic: explicit non-standard `layout` wins; interactive widget → `hero`/`split`; card counts → `cards`/`split`; scene-1 with ≤2 elements → `hero`; else `standard`.
3. **Six layout renderers** — `renderHeroLayout` (pulsing badge + gradient `<h1>` + card grid), `renderCardsLayout` (1–4 cards in a responsive grid), `renderSplitLayout` (2 columns, forced accents `#38bdf8`/`#a855f7`), `renderTimelineLayout` (3-step flow with an absolute gradient connector line), `renderStatLayout` (KPI wall with per-index accent palette and dynamic column count), `renderStandardLayout` (≤4 → cards, else scrollable grid).
4. **`createCardNodeFromElement(...)`** — the universal card factory. Stamps **`data-id`** and **`data-type`** attributes (the anchors GSAP targets), resolves accent color (override → element's `accentColor` → 3-color cycle), builds badge/icon chrome, then dispatches by element type: card → title + description + dot-bulleted points; equation → `renderEquation`; text → first line becomes title, remaining lines become list items; shape/image/widget → dedicated renderers.
5. **`renderEquation`** — if `tokens` exist, each `MathToken` becomes a `<span data-id={tok.id} class="math-token math-token-{type}">` with type-based colors (operator slate, variable cyan, constant white); else plain `rawEquation` text. These spans are what `move`/`transform`/`replace` animate.
6. **`renderShape` / `renderImage`** — styled div; framed `<img>` with mono caption.
7. **`renderInteractiveWidget`** — dispatcher to four vanilla-DOM widgets (unknown types fall back to boolean simulator):
   - **`renderBooleanSimulatorWidget`** — Signal A/B toggle buttons (HIGH `1` / LOW `0` styling), four gate boxes **AND / OR / NOT / XOR** with LED dots and `TRUE (1)`/`FALSE (0)` readouts, and a 4-row truth table whose active row highlights (`data-state="00|01|10|11"`) while others dim. Pure closure state + `addEventListener`.
   - **`renderPhysicsWidget`** — mass (0.5–10 kg) and force (1–50 N) range sliders → live `a = F/m` readout via `input` listeners.
   - **`renderCodeBlockWidget`** — macOS-style window chrome, filename/language chip, Copy button (clipboard, "Copied!" for 1.5 s), line-number gutter, and a 4-regex mini syntax highlighter (keywords purple, numbers amber, strings emerald, comments slate italic). Falls back to a built-in TS snippet when `config.code` is absent.
   - **`renderComparisonMatrixWidget`** — HTML table from `config.columns`/`config.rows` with colored row dots and a naive "optimal value" heuristic (emerald if cell text contains `high`, `100k`, `< 1ms`, or `guaranteed`). Has hardcoded default rows when config is empty.
8. **`destroy()`** — disconnects the ResizeObserver.

### `src/animator.ts` (213) — `GSAPAnimator`
Executes one `StepAction` at a time as a GSAP timeline, with sound. `executeAction(action, container)` switches on `action.action`; every branch resolves `container.querySelector('[data-id="..."]')` first and no-ops if missing:

- **`move`** — whoosh sound; coordinates scaled by a **×1.33 fudge factor**; relative `x/y` tween, `power2.out`.
- **`fadeIn` / `fadeOut`** — opacity tweens.
- **`scale`** — step-click sound; `back.out(1.7)` overshoot.
- **`rotate`** — rotation to `angle` degrees.
- **`highlight`** (the flagship) — ping sound, plus a **success-chime heuristic** when the color is green/emerald (`#10b981`). Two sub-paths: if the target is a `.presentation-card`, it first **dims every sibling card to 45% opacity** (the "spotlight"), then runs a two-half pulse timeline (scale 1.04 + border color + glow up, back down). Non-card targets (math tokens/text) get color + text-shadow glow + 1.25 scale pulse.
- **`transform`** — shrink-fade out → mid-timeline callback swaps `textContent` → re-enter with `back.out(1.8)` (the equation morph).
- **`replace`** — resolves multiple targets, fades/collapses them, `replaceWith(newEl)` a newly created `<span data-id>` token, pops it in cyan then settles white.
- **`killAll()`** — kills all tracked timelines (scene change / scrub / destroy).

### `src/sound.ts` (132) — `PresentationAudio`
Zero-asset Web Audio synthesizer. Lazily creates `AudioContext` (with `webkitAudioContext` fallback, `typeof window` guard for headless safety, auto-resume for autoplay policy). Four synthesized cues:

| Method | Sound |
|---|---|
| `playStepClick()` | sine 440→880 Hz over 40 ms, gain 0.08 (mechanical click) |
| `playHighlightPing()` | sine E5 659.25→A5 880 Hz over 150 ms (glass ping) |
| `playMoveWhoosh()` | triangle 320→180 Hz over 250 ms (term crossing the equals sign) |
| `playSuccessChime()` | 4 sines C5/E5/G5/C6 staggered 80 ms (final-answer chord) |

Plus `setEnabled`/`isEnabled` for the player's mute toggle.

### `src/__tests__/engine.test.ts` (27) — 3 tests
Headless/Node safety: audio methods don't throw without `window`; `setEnabled(false/true)` toggling; `new GSAPAnimator()` defaults to a `PresentationAudio` instance. (No `DOMRenderer` coverage — it needs a DOM.)

---

## 6. `packages/server` — Fastify + the 3-stage AI pipeline

Deps: `fastify ^4`, `@fastify/cors`, `@fastify/static`, `openai` (used as the NVIDIA/Gemini OpenAI-compatible client), `zod`, `axios`, `dotenv`, `jsonrepair`.

### Entry & config

| File | Lines | What it does |
|---|---|---|
| `src/index.ts` | 55 | Fastify bootstrap: `logger: true`, **`bodyLimit: 50 MB`** (for base64 PDFs), registers CORS (`origin: true`), `GET /health`, mounts `aiRoutes` at `/api/ai`, and in production serves `client/dist` statically with an **SPA fallback** (`setNotFoundHandler`: `/api/*` → JSON 404, everything else → `index.html`). Listens on `0.0.0.0:$PORT` (default 3001). |
| `src/config.ts` | 36 | Zod-validated env config loaded from `packages/server/.env`. Keys: `port` (3001), `nvidiaApiKey`/`nvidiaApiKeyNano`/`nvidiaApiKeyUltra` (fall back to `NVIDIA_API_KEY`), `nvidiaBaseUrl` (`https://integrate.api.nvidia.com/v1`), `nvidiaModel` (`deepseek-ai/deepseek-v4-flash-0731`), `geminiApiKey`, `geminiModel` (`gemini-3.5-flash-lite`), `geminiBaseUrl` (Google's OpenAI-compatible endpoint), `defaultAiProvider: gemini|nvidia|auto`, `geminiCriticEnabled`. *Caveat: the pipeline stages mostly hardcode their own model IDs, so `NVIDIA_MODEL`/`GEMINI_MODEL` only affect `deepseek.ts`.* |
| `.env.example` | 6 | Template: `PORT=3001`, `NVIDIA_API_KEY`, `NVIDIA_API_KEY_NANO`, `NVIDIA_API_KEY_ULTRA`, `NVIDIA_BASE_URL`, `NVIDIA_MODEL=deepseek-ai/deepseek-v4-flash-0731`. *It does not list the Gemini vars `config.ts` also reads (`GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_BASE_URL`, `DEFAULT_AI_PROVIDER`, `GEMINI_CRITIC_ENABLED`).* The real `.env` sits alongside it, gitignored. |

### Routes

**`src/routes/ai.ts` (183)** — one plugin, five endpoints:

| Endpoint | Body | Behavior |
|---|---|---|
| `POST /api/ai/stream` | `{topic, slideCount?, theme?, engine?}` (Zod, 3–25 slides) | SSE: sets `text/event-stream` headers, calls `runNemotronPipeline`, writes `data: {json}\n\n` per event, error events on throw. |
| `POST /api/ai/stream-site` | same | **Byte-for-byte identical twin of `/stream`** (the client only calls this one). |
| `POST /api/ai/generate-presentation` | `{topic, slideCount?}` | Non-streaming fallback → `generatePresentationWithDeepSeek` → `{success, data, reasoning, source}`. |
| `POST /api/ai/extract-pdf` | `{fileBase64?, fileName?, pageImages?}` | Decodes base64 → `extractTextFromPdfBuffer(buffer, fileName, 25, pageImages)` (dynamic import of `pdfService`). |
| `POST /api/ai/generate-image` | `{prompt, width?, height?, steps?}` | Dynamic import → `generatePhotoWithNvidia` (NVIDIA NIM FLUX). |

*Note:* `archetypes`, `audience`, `language` are accepted by the schema but never passed to the pipeline.

### Pipeline (`src/pipeline/`)

**`orchestrator.ts` (312)** — the master coordinator, `PipelineOrchestrator.execute(topic, onEvent, requestedSlideCount?, theme?, engine?)`:
1. `detectTargetSlideCount` → count + explicit/inferred reason.
2. **Cache hit** → replays `cache_hit` / `stage1_complete` / `stage2_complete` / `complete` events and returns instantly.
3. **Stage 1** → `runStage1Analyzer` (emits `stage1_start/chunk/complete`), captures `cleanTopic`.
4. **Stage 2** → `runStage2Storyboard` (emits `stage2_start/chunk/complete`).
5. **Stage 3** → `runStage3CreativeGenerator` (emits `stage3_start/reasoning/chunk`, supports `onModelSwitch` re-emitting `stage3_start`).
6. **Photo synthesis** — regex-scans slide HTML for `<img data-photo-prompt="...">` (max 4), generates them **in parallel** via `generatePhotoWithNvidia` (1024×576, 2 steps, 8 s timeout), substituting `src=` on success or `createFallbackPhotoSvg` on failure; emits `photo_start`/`photo_done`.
7. **Slide-count guard** — counts slide tags; if `< 2`, re-runs Stage 3 as a recovery pass.
8. `assembleHyperDeckPresentation(...)` → final standalone HTML.
9. `convertHtmlToPresentationAst(...)` → AST (wrapped in try/catch).
10. `presentationCache.set(...)` → emits final `complete` event with `html`, `presentation`, `outline`, `topic`, `model`.
- Exports `PipelineEvent` type (13 event kinds), `PipelineEventHandler`, `pipelineOrchestrator` singleton.

**`stage1-analyzer.ts` (201)** — *Model 1: Principal Scientific & Technical Analyst.* Extracts `cleanTopic` via `extractCleanTopic`, then runs a long structured prompt (6-section "Domain Knowledge Extraction Report": title/thesis, chronological page-by-page coverage, architectural diagrams, terminal commands/code, hard metrics, core concepts — with an explicit anti-buzzword mandate banning "invariants/taxonomies/paradigms/telemetry" unless they are source terminology, and `TARGET PRESENTATION SCOPE: ${targetCount} Keynote Slides`). Client: OpenAI SDK at `config.nvidiaBaseUrl`, key `config.nvidiaApiKeyUltra || config.nvidiaApiKey`. Model constants `PRIMARY_MODEL = "nvidia/nemotron-3-super-120b-a12b"`, `FALLBACK_MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"`. Fallback chain: **Attempt 0** Gemini (only if `engine==="gemini"`, temp 0.25/8000, early return at ≥150 chars) → **Attempt 1** Nemotron Super (temp 0.25, `max_tokens: 8000`, streams `reasoning_content` as reasoning) → **Attempt 2** Nano 30B if <120 chars (temp 0.4) → **Attempt 3** Gemini if still <120 chars → **guard:** <80 chars **throws** `"Stage 1 analysis produced insufficient source-derived content"` (no mock fallback, per the repo law). Exports `Stage1AnalysisResult`, `runStage1Analyzer`.

**`stage2-storyboard.ts` (235)** — *Model 2: Executive Presentation Director & Visual Storyboard Architect.* Prompt takes Stage 1's analysis (pre-cleaned with `sanitizeDocumentContent`) + `TARGET SLIDE COUNT: Exactly ${targetCount} Slides` and demands: zero duplicate slides, proportional page-span coverage, no prompt noise/buzzwords (never emit "TARGET SLIDE COUNT"/"PREFERRED THEME" or canned filler), a mandatory authentic visual model per slide (subsystem stack / entity topology / protocol sequence / comparison table / terminal shell), "classic academic restraint (Oxford Blue, Slate, White)", and exact `SLIDE 1..N` output with number & title, subtitle & category (no pipes, no robotic "This slide…" openers), narrative with real commands/metrics, and a visual-model template recommendation from **20 enumerated template codes** `TEMPLATE_01_HERO_SPLIT_OVERVIEW` … `TEMPLATE_20_EXECUTIVE_CHECKLIST_SUMMARY` (terminal explorer, code diff, 4-/3-stage pipelines, connected topology, slider simulator, comparison matrix, bar chart, tri-card grid, quad metric dashboard, KaTeX derivation — "NEVER invent fake pseudo-math" — state machine, layer stack, SVG Venn, Three.js spatial world, timeline, pro/con, checklist). Also mandates an MIT/Stanford/Oxford professor voice, template diversity, and **absolutely no emojis**. Same constants (`PRIMARY_MODEL`/`FALLBACK_MODEL`) and chain as Stage 1 but temp 0.3 and 150-char thresholds; guard: <80 chars **throws** `"Stage 2 storyboard produced insufficient source-derived content"`. Exports `Stage2StoryboardResult`, `runStage2Storyboard`.

**`stage3-creative-generator.ts` (820)** — *Model 3: Creative Presentation Generator (Zero AI Slop, Zero Templates)*. Synthesizes one `<section class="slide">` per storyboard slide with pooled concurrency, then cleans, validates, and audits each block. Model constants: `MODEL_SUPER = "nvidia/nemotron-3-super-120b-a12b"`, `MODEL_LIGHTNING = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"`. Exports (exact):

| Export | What it does |
|---|---|
| `Stage3Callbacks` | `{onReasoning, onChunk, onModelSwitch?}` streaming callbacks. |
| `parseStoryboardIntoSlides(storyboardText, targetCount, analysisText?)` | Splits/dedupes/pads Stage 2's storyboard into exactly `targetCount` directives (details below). |
| `DESIGN_SYSTEM_VOCABULARY` | ~95-line prompt block enumerating every CSS primitive the AI may compose. |
| `buildSingleSlidePrompt(...)` | Builds the per-slide free-composition creative prompt. |
| `isValidSlideHtml(html)` | Structural/substance validator. |
| `sanitizeAiTone(slideHtml)` | 7-pass regex post-processor removing AI slop, pseudo-math, buzzwords, hallucinated classes, rainbow inline styles. |
| `synthesizeFallbackSlide(...)` | Last-resort slide built purely from source text — explicitly **no domain catalog / no topic branches**. |
| `runStage3CreativeGenerator(...)` | The generator: 6-worker pooled concurrency + watchdog + 5-tier fallback + Gemini critic. |

- **`parseStoryboardIntoSlides`** — splits on a lookahead `SLIDE \d+` regex; drops fragments <25 chars and prompt-metadata prefixes (`TARGET SLIDE COUNT`, `PREFERRED THEME`, `SOURCE DOCUMENT`); **dedupes identical normalized headlines**; if still short, re-splits on markdown headings; then partitions unused `analysisText` sections (round-robin, source-derived headings ≤96 chars) so every requested slide is filled with **source-derived** content; final padding repeats a source excerpt with a heading from its first real line — never an invented domain label.
- **`DESIGN_SYSTEM_VOCABULARY`** — "FREE COMPOSITION VOCABULARY, no locked skeletons": layout containers (`.grid-split`, `.grid-3`, `.grid-2`), glass cards (`.glass-card card-*` with header/title/badge/points), terminals & diffs (`.terminal-card`, `.diff-container`), architecture stacks (`.arch-stack > .stack-tier` ≥3 tiers, `.layer-stack`), flows & pipelines (`.motion-pipeline` with `.packet-pulse`, `.flow-diagram`), data viz (`.stat-grid`, `matrix-table`, `.chart-card` bars), specialised primitives (`.disk-stripe`, `.pointer-topology`, `.state-diagram`, `.checklist-group`, `.venn-container`), **inline SVG icons instead of emojis**, pipeline simulation buttons (`simulatePipelineFlow`), and KaTeX `<div class="equation-display">` only for genuine equations.
- **`buildSingleSlidePrompt`** — slide 0 gets `active` + "TITLE / HERO slide" hint; later slides get a diversity hint ("VISUALLY DIFFERENT from a standard two-card split"); truncates domain knowledge to 25,000 chars; mandates the `.slide-title-group` headline block; embeds the vocabulary + a content-shape→primitive mapping (sequential → pipeline, hierarchy → arch-stack, CLI → terminal, comparison → diff/grid-2, metrics → stat-grid, topology → flow/SVG, memory → disk-stripe); **ABSOLUTE RULES 1–10**: zero hardcoded content, zero prompt metadata, zero emojis, output only the `<section>`, zero pseudo-math, zero synthetic data (`[User_X]`), academic restraint (no inline hex), stacks ≥3 populated tiers, real CLI commands from the document, internal reasoning <80 tokens.
- **`runStage3CreativeGenerator`** — per-slide `synthesizeSlideSection(i)` wraps each call in an **`AbortController` with a 40-second watchdog** (temp 0.55, top_p 0.9, max_tokens 4000, streaming; reasoning deltas forwarded). **5-tier fallback:** 0) pure Gemini (35 s watchdog) when `engine==="gemini"` → 1) Nemotron Super 120B → 2) Nemotron Nano 30B → 3) Gemini → 4) `synthesizeFallbackSlide` (source text only) if all fail or `!isValidSlideHtml`. Then a **cleanup pipeline**: strip code fences → cut at first `<section` → drop preamble → delete CoT monologue lines (`From the storyboard…`, `Let's break down…`) → re-prepend canonical `<section class="slide" id="slideN">` → guarantee `</section>` (balance unclosed `<div>`s) → `sanitizeAiTone`. Then the optional **Gemini critic** (`geminiService.evaluateAndAuditSlide`, when `engine` is auto/nvidia and `config.geminiCriticEnabled`) may replace the slide with a repaired version, followed by a second `sanitizeAiTone`; critic failure never blocks a slide. **Concurrency:** a shared queue consumed by **6 pooled workers** (`CONCURRENCY_LIMIT = 6`), results stored by index to keep slide order stable; each ready slide is emitted as an `onChunk` comment + HTML.
- **`sanitizeAiTone` (7 passes):** ① category headers cut at `|`/`—` and stripped of buzzword suffixes (`INVARIANT(S)`, `TAXONOM(Y|IES)`, `PARADIGM(S)`, …), defaulting to `SOURCE MATERIAL`; ② deletes entire pseudo-math `.equation-display` blocks (`\text{Secure|Confidentiality…}` + `∩/∪/⇔`); ③ subtitle naturalization — strips "This slide compares…"/"In this slide…" openers and `-ing` participle clichés, plus a phrase dictionary (`systemic invariants → security guarantees`, `threat taxonomies → threat models`, `runtime telemetry → runtime metrics`, …); ④ removes demographic hallucinations (`Ages 10–100`) and `20/30/40% Probability` badges → `CRITICAL`; ⑤ auto-repairs hallucinated CSS classes (`tri-card-grid→grid-3`, `pipeline→motion-pipeline`, `stage→pipeline-stage`, `code-diff→diff-container`, `card-header→glass-card-header`, …); ⑥ invalid `<caption>` in a `<div>` → `.topology-label`; ⑦ converts rainbow inline `border-top`/`color` styles to `glass-card card-*` variants and rewrites residual "Invariant" titles. Crucially it **preserves real source commands and values**.
- **`isValidSlideHtml`:** rejects empty/<150-char output, output lacking structural markers, reasoning leaks / unfilled prompt templates (`[specific technical headline…]`), hollow `arch-stack`/`layer-stack` (<2 tiers or empty tier body), or <60 chars of stripped text.
- **`synthesizeFallbackSlide`:** strips markdown/prompt metadata/field prefixes, derives title/category from the directive (else first real line / `SOURCE MATERIAL`), picks up to 4 unique excerpts, HTML-escapes everything, and emits a fixed neutral `.slide-title-group` + `.grid-split` skeleton — deliberately with **no topic catalog**.

**`html-assembler.ts` (1209)** — wraps LLM slide fragments into one fully standalone, self-running Keynox "HyperDeck" document (no build step, no server needed). Exports `AssembleOptions {topic, slidesHtml, outline?, targetCount, theme?}`, `extractSlidesFromContent(raw)`, `extractCustomScripts(raw)`, `assembleHyperDeckPresentation(options)`; imports `MASTER_DESIGN_SYSTEM_CSS` from `token-optimizer` and `sanitizeAiTone` from stage 3.
- **`extractSlidesFromContent`** — strips `<!DOCTYPE>/<html>/<head>/<body>` and **removes `<script>` blocks first**; splits on a lookahead delimiter where `slide` must be a standalone class token (so `slide-title-group` is never mistaken for a slide); auto-closes truncated sections (strips dangling tag, balances unclosed `<div>`s); normalizes raw `<h2>Slide X – Title</h2>` into the standard `.slide-title-group`.
- **`extractCustomScripts`** — concatenates all `<script>` bodies *except* any containing `master-hyperdeck-controller` (keeps LLM widget JS, drops echoes of our own engine).
- **Assembly:** every slide passes through `sanitizeAiTone`, ids renumbered to `id="slide${idx}"`, slide 0 gets `active`; zero parsed slides → a single fallback hero section.
- **`<head>`:** title, Google Fonts (Plus Jakarta Sans, Inter, Fira Code, JetBrains Mono), CDN scripts **GSAP 3.12.5 + Three.js r128 + KaTeX 0.16.9 (css + auto-render)**, and `<style>` = `MASTER_DESIGN_SYSTEM_CSS` + assembler CSS (`.controls-bar` annotation bar, `.slide-indicator`, `.top-zoom-controls`, `.btn-annot`, `.color-picker`, `.drawing-canvas`).
- **`<body class="theme-${theme || 'oxford'}">`:** `#hyperdeckStage` main → `#topZoomControls` → progress bar → header (`KEYNOX` badge, deck title, `#slideCounter`) → `.slides-viewport` (slides + `<canvas id="drawingCanvas">`) → floating chevron prev/next → `#controlsBar` annotation toolbar (pen/highlighter/scroll, color input, undo/redo/save/clear) → footer (counter, ✏️ Draw toggle, prev/next, fullscreen) → `<script id="master-hyperdeck-controller">` → optional `<script id="custom-hyperdeck-widgets">` (LLM JS).
- **Embedded engine JS:** `updatePresentationState()` (`.active` management, GSAP entrance animations for cards/tables/charts/Venn/flow, spring bounce on pipeline stages, KaTeX `renderMathInElement` on the active slide, thumbnails/progress/counter updates, per-slide drawing restore, `window['initSlide'+i]()` hooks, and `postMessage` `HYPERDECK_STATE_UPDATE` to `window.parent`/`window.opener`; listens for `HYPERDECK_NAVIGATE`); **annotation engine** (30-entry undo stack of dataURLs, pen 3.5px / highlighter 24px yellow, `setTool/undo/redo/saveDrawings/clearDrawings`, per-slide layers persisted to `localStorage` key `keynox_drawings_*`); **zoom** (`zoomIn/zoomOut/resetZoom/applyZoom` 0.4–2.5, fullscreen listeners incl. `HYPERDECK_SET_FULLSCREEN`); **navigation** (`nextSlide/prevSlide/goToSlide/toggleFullscreen`); **keyboard**: →/Space/`j`/PageDown next, ←/`k`/PageUp prev, `f` fullscreen, digits `1..n` jump, `Ctrl+Z`/`Ctrl+Shift+Z`/`Ctrl+Y` undo/redo, `p` pen / `h` highlighter / `s`/`Esc` scroll (guarded against inputs); **`initMotionPipelines` + `simulatePipelineFlow`** (550 ms packet stepping); **`initThreeScenes`** — Three.js scenes keyed by `data-model`: `quantum-bloch-sphere`/`bloch`/`quantum` → **Bloch sphere** (wireframe sphere, cyan equatorial + emerald meridian tori, amber state-vector arrow, 70-point particle shell), `chip`/`hardware`/`die` → **silicon die** (substrate + emissive die + gold pins), default → **neural constellation** — all with hand-rolled orbit-drag controls + idle auto-rotation; **`initParticleConduits`** — 2D canvas particles traveling a cubic Bézier conduit (40 glowing particles).
- *Known dead code:* a thumbnail button list is built but never interpolated into the output HTML (a test asserts `.thumbnails-bar` is absent).
- *Widget split:* boolean/physics simulator **styling** lives in `token-optimizer`, their **markup** is composed by Stage 3 prompts, and their **behavior JS** arrives via `extractCustomScripts`. Imported by `orchestrator.ts`, `html-to-ast.ts`, `nemotronPipeline.ts`, and tests.

**`token-optimizer.ts` (1808)** — header: *"Pre-bundles the Master Obsidian & Glassmorphism CSS design system… the LLM NEVER needs to write redundant CSS or boilerplates, saving ~65% of output tokens and eliminating truncations."* Two exports:
1. **`MASTER_DESIGN_SYSTEM_CSS`** (~1,700 lines in one template literal, injected verbatim into every deck): design tokens (`:root` obsidian palette + accent/font vars); **academic themes as `body.theme-*` variable overrides** — `theme-oxford`/`theme-cyber` (Oxford blue), `theme-cambridge`/`theme-ocean` (slate/white), `theme-harvard`/`theme-sunset` (crimson), `theme-heidelberg`/`theme-emerald` (green), `theme-princeton`/`theme-cosmic` (amber/gold); keyframes (`termPop`, `packetFly*`, `slideCardEntrance`, `flowDash`, `pulseNode`); 16:9 `.hyperdeck-stage` letterboxing + header/badge/counter chrome + `.slide` cross-fade; layouts (`.grid-2`, `.grid-3`, `.grid-split`); glassmorphism cards with accent variants; pipelines (`.motion-pipeline`, `.pipeline-stage`, `.packet-pulse`, `.state-switcher`); `.matrix-table` + `.terminal-card` (traffic dots, syntax spans); 2026 creative primitives (`.three-container`, `.particle-container`, `.flow-diagram`, `.venn-container`, `.chart-card` bars); **simulator stage** (`.sim-container`, `.sim-slider`, `.sim-gauge`, `.sim-visual-grid`); `.photo-card` (for FLUX `data-photo-prompt` images); nav chrome (chevrons, footer, thumbnails, progress bar); specialized primitives (`.layer-stack`, `.stat-grid`, `.diff-container`, `.state-diagram`, `.checklist-group`, `.disk-stripe`, `.pointer-topology`, `.arch-stack`, `.calc-workbench`); KaTeX overrides; and **"Resilient Structural Fallbacks & Aliases"** — CSS safety nets for every class name `sanitizeAiTone` repairs toward.
2. **`buildStage2Prompt(cleanTopic, outlineText, targetCount)`** — a Stage-2 prompt template that strictly forbids plain bullet lists and prescribes a chart slide, an SVG Venn/flow slide, a matrix slide, and an interactive simulator slide, with `.photo-card data-photo-prompt` for FLUX. **Not referenced anywhere — a reserved/legacy export.**

**`html-to-ast.ts` (223)** — `convertHtmlToPresentationAst(topic, html, modelName = "Keynox 3-Stage Engine"): Presentation` — bridges the HTML pipeline into the native schema/engine ecosystem so decks play in the Keynote Player and Visual Studio. Imports `Presentation, Scene, Element, Step, CardElement, ImageElement` from `@presentation/schema` and `extractSlidesFromContent`.
- **Strict guards:** throws if topic empty, no slides, a slide lacks a title, a card/pipeline stage lacks a source-derived title, or a slide has **zero elements** (`"contains no source-derived elements"`) — it deliberately **never invents cards** (a test verifies this).
- **3 element-extraction passes:** `<img>` → `ImageElement`; `.pipeline-stage` → `CardElement` (`.stage-num`→badge, `.stage-title`→title, `.stage-desc`→description, cycling accents `#10b981/#38bdf8/#818cf8/#f59e0b`); `.glass-card` → `CardElement` (`.card-title`, `.badge`, `.card-desc`, `<li>`→`points[]`, accent inferred from `card-*` class).
- **Layout inference:** slide 0 → `hero`; pipeline stages → `timeline`; exactly 2 elements or a widget/image → `split`; else `cards`.
- **Steps:** step 1 = overview (no actions), then **one highlight step per element** (`{action:"highlight", target: el.id, color: accent || "#38bdf8", duration: 0.6, pulse: true}`) — giving the native player a card-by-card spotlight scrubber.
- Returns `{version: 1, title, metadata: {topic, model: "… (Keynox 3-Stage Pipeline)", createdAt}, scenes}`; throws if 0 scenes.

**`topic-extractor.ts` (277)** — *"Dynamic Topic and Title Extractor — strictly dynamic parsing with ZERO hardcoded topics."* Five exports:
1. `sanitizeDocumentContent(raw)` — strips OCR/PDF banners (`==Start of PDF==`, `==End of OCR for page N==`), prompt directives (`TARGET SLIDE COUNT:`, `PREFERRED THEME:`, `SOURCE DOCUMENT CONTENT:`), collapses 3+ newlines.
2. `sanitizeTitleString(title)` — trims markdown wrappers, `Document Analysis: Page X` / `Page N:` prefixes, `(cont.)`/`(part)`/`(N)` suffixes, trailing punctuation, and **balances unclosed parentheses**.
3. `isPlaceholderOrGenericTitle(title)` — rejects empty/<3 chars, pure dates, bare numbers, literal placeholders (`title`, `presentation`, `text`, `doc`, …), prefixed placeholders (`Title (Lecture 3)`, `Topic - Week 6`), syllabus labels (`Lecture 3`, `Chapter 1 part 3`), university/department boilerplate, instructor lines (`Dr.`, `Prof.`), and OCR/UI noise.
4. `extractTrueTitleFromDocumentText(body, genericLabel?)` — rescues the real title: book-chapter header pattern `"(chapter )n Title"` optionally merged with a `n.n Subsection`, or a scan of the first 30 lines rejecting dates/metadata/course codes/meta labels/shell output; keeps up to 3 candidates of 4–70 chars; falls back to `genericLabel` or `"Technical Presentation"`.
5. `extractCleanTopic(rawInput)` — the main entry: strips UI noise, honors explicit `TOPIC|TITLE|SUBJECT|TEXT|CONTENT|SOURCE:` tags (recovers from body if the tagged value is generic), strips imperative prefixes ("please create a presentation about…"), checks the first line against the placeholder test, tries the book-chapter pattern, accepts short clean inputs (≤80 chars single line), else `extractTrueTitleFromDocumentText`, else the first 8 words; returns `{title, summary: clean.slice(0,160)}`.
- Consumed by stage1 (`extractCleanTopic`), stage2/stage3 (`sanitizeDocumentContent`), `pdfService` (`sanitizeTitleString`), `nemotronPipeline`, and tests.

**`cache.ts` (82)** — in-memory LRU (`maxSize` 50), key = `md5(normalized-topic + ":" + slideCount)`, 4-hour TTL, delete-and-reinsert LRU refresh, and a **poison filter** that refuses to cache (and evicts) HTML containing the canned `Intensity Factor (α) / Load Constraint (β) / Dynamic Intensity Factor` placeholder. Exports `CachedPresentation` and the `presentationCache` singleton (class is private). *Caveat: the key ignores `theme` and `engine`.*

### Services (`src/services/`)

| File | Lines | What it does |
|---|---|---|
| `nemotronPipeline.ts` | 56 | Thin facade between routes and the orchestrator ("HyperDeck Presentation Synthesis Pipeline Facade"). `runNemotronPipeline(...)` → `pipelineOrchestrator.execute(...)`. Also re-exports `PipelineEvent`, `extractCleanTopic`, `extractCustomScripts` and defines helpers `isHtmlFullyComplete(html)` (≥300 chars and ≥2 `slide` class matches), `extractSlideSections`, `extractCustomStyles` (concatenates `<style>` bodies), `assemblePresentationWebsite(topic, rawContent, outline, targetCount = 4)` (several currently unused). This is what `routes/ai.ts` calls. |
| `deepseek.ts` | 174 | Direct JSON-AST generation path for `/generate-presentation`. Module-level OpenAI client (`apiKey: config.nvidiaApiKey`, `baseURL: config.nvidiaBaseUrl`), model = **`config.nvidiaModel`** default `deepseek-ai/deepseek-v4-flash-0731` — the one place the `NVIDIA_MODEL` env var actually takes effect. `SYSTEM_PROMPT` demands a single JSON object conforming to `PresentationSchema` (omit unsupported fields rather than fill examples). Call params `temperature: 0.3, top_p: 0.95, max_tokens: 3500` plus non-standard `chat_template_kwargs: {thinking: true, reasoning_effort: "low"}`, streaming, **18-second `AbortController`**. Output: fence-strip → **`jsonrepair`** → **`PresentationSchema.parse`** via `sanitizePresentation` (fills `title`/`metadata` from the user topic only, throws `"The model returned no presentation scenes"` if empty; never invents scenes). Exports `StreamEvent` union (`phase|reasoning|content|complete|error`), `streamPresentationGeneration`, `generatePresentationWithDeepSeek`; `source` reported as `"nvidia-deepseek"`. |
| `geminiService.ts` | 321 | Google Gemini layer used as an explicit engine, the Stage-3 **critic**, and multimodal PDF vision. Exports `StreamGeminiOptions`, `GeminiVisionExtractedDocument`, `class GeminiService`, `SlideEvaluationResult`, and the `geminiService` singleton. Chat goes through the **OpenAI-compatible endpoint** `config.geminiBaseUrl` (default `https://generativelanguage.googleapis.com/v1beta/openai`) with `GEMINI_API_KEY`; `getModel()` → `config.geminiModel` (default `gemini-3.5-flash-lite`, fallback literal `gemini-3.8-flash`); `isAvailable()` needs a >10-char key. Methods: **`streamChat`** (temp 0.35/4000; reasoning from `delta.reasoning_content` or `delta.extra_content.google.thought_signature`); **`extractDocumentVision(pageImages, fileName?)`** — native REST `.../v1beta/models/{model}:generateContent?key=…`, max 8 pages in batches of 2, temp 0.2/2500, demands headings, node/edge diagrams, Markdown tables with units, KaTeX equations; then regex-harvests title/diagrams/tables/formulas; **`evaluateAndAuditSlide(topic, slideHtml, slideIndex, totalSlides)`** — the **critic**: temp 0.1/1500, 8 audit rules (valid KaTeX, no prompt-metadata leaks, no emojis, balanced HTML, no hollow stacks, **replace fake CLI commands with authentic tools** like `$ nmap -sn 192.168.1.0/24`, strip robotic subtitles, preserve content); replies exactly `APPROVED` if good (cheap, <20 tokens) or the repaired `<section>` otherwise; **any error → `{passed: true}`** so it never blocks the pipeline. |
| `imageService.ts` | 208 | Photorealistic slide imagery via NVIDIA NIM FLUX with a guaranteed fallback. Exports `GenerateImageOptions`, `GenerateImageResult`, `createFallbackPhotoSvg(prompt)`, `generatePhotoWithNvidia(options)`. Primary: **`https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b`** (default 8 s `AbortController`, payload `{prompt, width: 1024, height: 576, steps: 1–4 (default 2)}`); fallback: **`.../flux.1-schnell`** (6 s, 4 steps). Auth: `Bearer` from `NVIDIA_API_KEY`/`NVIDIA_API_KEY_ULTRA` — missing key → immediate SVG fallback. Response `data.artifacts[0].base64` → `data:image/jpeg;base64,…` with `model`, `seed`, `latencyMs`. **Final fallback** `createFallbackPhotoSvg` draws a 1024×576 obsidian SVG (gradient, circuit grid, dashed orbit, "ARCHITECTURAL SYSTEM VISUAL" badge + sanitized prompt) as a `data:image/svg+xml` URI, model `"Obsidian Vector Fallback"` — synthesis **never hangs**. Called dynamically by the orchestrator's photo pass and `/generate-image`. |
| `pdfService.ts` | 210 | Text-layer PDF extraction with title detection and optional multimodal enrichment. Exports `ExtractedPdfData` (**declared twice** — lines 5 and 89; the second adds `visionExtracted?/diagrams?/tables?/formulas?`), `detectCleanTitle(firstPageText, fileName?)`, and `extractTextFromPdfBuffer(buffer, fileName?, maxPages = 25, pageImages?)`. **Imports `pdfjs-dist/legacy/build/pdf.js`** (via `// @ts-ignore`) — relying on npm workspace hoisting from the *client's* dependency declaration — plus `sanitizeTitleString`. Implementation: line reconstruction by rounding item Y-coordinates to a 3 px grid, page-artifact stripping (`Page N of M`), abstract capture from the first 2 pages (≤1000 chars), **stops at `references|bibliography|works cited`** after page 2 to save tokens; title = `visionData.title || detectCleanTitle(...)` (book-chapter / `Chapter X:` / `3.1 Section` patterns, else first plausible line among 10, rejecting `page/arxiv/listing/figure/$/#/drwx`, fallback cleaned filename or `"Technical Concept Explainer"`). When `pageImages` are supplied it dynamically calls the vision service and prepends a `### MULTIMODAL EXTRACTION` header to the raw text. Powers `/extract-pdf`. |
| `pdfVisionService.ts` | 154 | Deep multimodal understanding of rendered PDF page images (diagrams, tables, formulas, reading order). Exports `VisionExtractedDocument {title, markdownContent, diagrams[], tables[], formulas[], pageCount}` and `extractDocumentWithNvidiaVision(pageImagesBase64, fileName?)`. **Attempt 0:** Gemini vision via `geminiService.extractDocumentVision` (native REST, `GEMINI_API_KEY`) when it yields >100 chars. **Attempt 1 (NVIDIA NIM):** `VISION_MODEL = "meta/llama-3.2-11b-vision-instruct"` through the OpenAI SDK at `config.nvidiaBaseUrl`. Behavior: up to **6 pages**, batches of 2, `max_tokens: 1800`, temp 0.2, image as `image_url` data URI; system prompt requires title/headings, full transcription of block diagrams/flowcharts/topologies, Markdown tables with units, LaTeX formulas, multi-column reading order ("Do NOT omit figures or tables"); per-page failures yield `"[Visual extraction skipped for this page]"`; post-processing mirrors `geminiService`. Imported dynamically by `pdfService`. |
| `slideCountDetector.ts` | 96 | "Slide Count Detector & Dynamic Sizing Utility". Exports `DetectedSlideCount {count, isExplicit, reason}` and `detectTargetSlideCount(topic, providedCount?)`. Logic: ① explicit numeric API param → clamp **3..20**; ② digit regex `(\d+)\s*[- ]*(?:slides?|pages?|scenes?|parts?)` → clamp 3..20; ③ English word map (`three`…`eight`); ④ dynamic heuristic: ≥4 sentences or ≥65 words → **6 slides**, ≥2 sentences or ≥25 words → **5 slides**, else **4 slides**. Every result carries a human-readable `reason` surfaced in the Stage-1 start SSE message. Used by the orchestrator and `deepseek.ts`. |

### Tests

**`src/__tests__/pipeline.test.ts` (568) — 36 tests**, in one top-level `describe("HyperDeck Pipeline & Engine Test Suite")` with **12 nested describes**:

| describe block | Verifies |
|---|---|
| `extractSlidesFromContent` | Extracts `<section class='slide'>` elements; auto-closes unclosed tags, strips dangling fragments |
| `assembleHyperDeckPresentation` | KaTeX CSS/JS in head; developer font stack + enlarged keynote sizes; annotation canvas + toolbar + zoom controls bundled |
| `parseStoryboardIntoSlides` | Diverse blueprints when count > storyboard length; **never leaks prompt metadata** (`TARGET SLIDE COUNT`) into slides |
| `detectTargetSlideCount` | Explicit count parsing; 3–20 boundary enforcement |
| `presentationCache` | Cache/retrieve by topic; rejects & evicts poison-filter matches |
| `convertHtmlToPresentationAst` | Valid `PresentationSchema` AST; **rejects slides without source-derived elements** instead of inventing cards |
| `extractCleanTopic` | Keeps clean topics; extracts real topic behind generic week/chapter labels; strips UI noise words; sanitizes unclosed parens/trailing `cont` |
| `synthesizeFallbackSlide` | Preserves directive content **without domain-specific templates**; uses analysis excerpts; escapes source text; strips prompt metadata |
| `sanitizeDocumentContent` | Strips OCR/PDF banners and prompt directives |
| `sanitizeAiTone` | Strips pipe/buzzword categories, pseudo-math, robotic prefixes; naturalizes participle clichés; converts rainbow inline styles to academic classes; repairs hallucinated CSS classes/captions; **preserves real source commands and values** |
| `isValidSlideHtml` | Accepts substantive multi-tier slides; rejects hollow arch-stacks and low-substance slides |
| `Dynamic Academic Title Extraction` | Extracts true titles from OCR text; rejects dates/boilerplate/"Title (Lecture 3)"/"Text"; normalizes code-diff/pipeline/card-header classes |

---

## 7. `packages/client` — React 18 studio, player & editor

Deps: `react ^18.3.1`, `@presentation/engine`, `@presentation/schema`, `canvas-confetti`, `lucide-react`, `pdfjs-dist` *(declared here but never imported by client code — `pdfExtractor.ts` loads PDF.js from CDN instead; the dependency is actually consumed by the **server's** `pdfService.ts` via npm workspace hoisting)*. Dev: Vite 5, Tailwind 3.4, `@vitejs/plugin-react`.

### Configuration & bootstrap

| File | Lines | What it does |
|---|---|---|
| `package.json` | 31 | Scripts `dev` (vite), `build` (`tsc && vite build`), `preview`. |
| `tsconfig.json` | 20 | `noEmit`, `jsx: react-jsx`, `bundler` resolution, strict **but `noUnusedLocals: false`** (hence the unused icon imports compile). |
| `vite.config.ts` | 24 | React plugin; **aliases `@presentation/schema` → `../schema/src` and `@presentation/engine` → `../engine/src`** (client compiles sibling sources directly); dev server `0.0.0.0:5173`; **proxy `/api` → `http://localhost:3001`**. |
| `tailwind.config.js` | 24 | Scans `index.html` + `src/**`; custom colors (`background #000`, `surface #0a0a0a`, `accent #3b82f6`, `accentGlow #60a5fa`); font families sans/display (Plus Jakarta Sans/Inter/Outfit) and mono (Fira Code/JetBrains Mono/…). |
| `postcss.config.js` | 6 | `tailwindcss` → `autoprefixer`. |
| `index.html` | 17 | Title **"Keynox — Interactive Presentation Runtime"**; loads Google Fonts (Plus Jakarta Sans, Inter, Outfit, Fira Code, JetBrains Mono, KaTeX_Main) + KaTeX CSS from jsdelivr CDN; black-body shell with `<div id="root">`. |
| `src/main.tsx` | 10 | `ReactDOM.createRoot(...).render(<StrictMode><App/></StrictMode>)`; imports `index.css`. |
| `src/index.css` | 172 | Global "Obsidian/Glassmorphism" design system: Tailwind directives, black body with 3 fixed radial ambient glows, cyan scrollbars, `.glass-panel` backdrops, text gradients, keyframes (`glowPulse`, `floatGentle`, `shimmerEffect`), stage styles, **`.math-token` pills** (the classes `DOMRenderer`/`GSAPAnimator` rely on), `.presentation-card` hover-lift, `.animate-fadeIn`. |

### `src/App.tsx` (308) — the shell
- **State:** `activeMode` (`studio`/`player`/`editor`), `currentDeck` (initial **`booleanLogicDeck`** — zero blank state), `htmlSite`/`currentTitle`/`modelName`/`outlineText`, streaming state (`isStreaming`, `activeStage: 1|2|3|"done"`, per-stage messages, `photoLogs`, `error`), and **four `useStreamThrottler` instances** (`stage1Analysis`, `stage2Storyboard`, `stage3Reasoning`, `stage3Code`).
- **`handleGenerate(sentences, options)`** — derives a display title (regex `TOPIC: "..."` or first line ≤60 chars, strips `[SECTION:…]`), resets all streams, then **`POST /api/ai/stream-site`** with `{topic, theme: options?.theme || "cyber", slideCount: options?.slideCount || 5, archetypes, engine: options?.engine || "gemini"}` and **hand-parses SSE** (`getReader` + `TextDecoder`, split on `\n\n`, `data: ` prefix). Handles events: `cache_hit`, `stage1_start/chunk/complete`, `stage2_start/chunk/complete`, `stage3_start/reasoning/chunk`, `photo_start`, `photo_done`, `complete` (sets `htmlSite`, `outlineText`, `modelName`, `currentDeck` from `event.presentation`), `error`. Errors render a red "Compilation Error" banner.
- **Render:** sticky header (`KeynoxLogo` + wordmark + `STUDIO` pill) → `studio` mode (input area, error banner, `NemotronProcessViewer` while streaming, `HtmlPresentationViewer` once `htmlSite` exists) / `player` mode (`PresentationPlayer`) / `editor` mode (`EditorStudio`), each with a "← Return to Workspace" button.
- *Changed in working tree:* the 4-deck showcase gallery was removed; only `booleanLogicDeck` remains wired.

### Components (`src/components/`)

**`ConceptInputArea.tsx` (573)** — the prompt composer. Exports `ConceptInputArea`, `GenerationOptions {theme, slideCount, archetypes, engine?}`, `VisualLookTheme`, `AiEngine`.
- Three input modes: plain topic textarea (`Ctrl/Cmd+Enter` submits), **PDF attach** (file input + drag-and-drop → `extractPdfDocument(file, 20, progressCb)` → shows a metadata pill "✓ Ready • N pages • N words"), and hybrid (PDF loaded → textarea becomes a `USER DIRECTIVE`).
- Options bar with four popovers: **theme** (5 looks: `oxford` Oxford Navy, `cambridge` Cambridge Slate, `harvard` Harvard Crimson, `heidelberg` Heidelberg Scholar, `princeton` Princeton Bronze), **slide count** (`[4,6,8,10,12,16]`, default 6), **engine** (`auto` "Nemotron + Gemini critic" / `nvidia` / `gemini`), and **components/archetypes** (4 modules: `equations`, `architecture-stack`, `protocol-matrix`, `telemetry-cable`).
- `handleSubmit` builds the payload string: PDF branch emits `TOPIC / TARGET SLIDE COUNT / PREFERRED THEME / ARCHETYPES / ABSTRACT / USER DIRECTIVE / SOURCE DOCUMENT CONTENT` (clean text capped at **250,000 chars**; slide count clamped by page count for <8-page docs); text branch emits `TOPIC + header + CONTENT`. Calls `onGenerate(payload, options)` — no network calls here except PDF extraction.

**`NemotronProcessViewer.tsx` (283)** — the streaming console. Pipeline ribbon of 3 stage pills (Analysis → Storyboard → Code Generation) with spinners/check states that auto-follow `activeStage`; collapsible drawer with tabs **Analysis / Storyboard / Runtime Code** showing char counts, auto-scrolling `<pre>` terminals fed by the throttlers, Copy button, and a "Streaming 60FPS" vs "Complete" status. *Quirk: props `stage1Message/stage2Message/stage3Message/photoLogs/modelName` are passed by App but never rendered — there is no photo-log UI despite the data flowing in.*

**`HtmlPresentationViewer.tsx` (800)** — the generated-site viewport and the biggest client component.
- Renders the HTML in a sandboxed **`<iframe srcDoc>`** inside a 16:9 container (fullscreen-aware).
- Toolbar: **Outline** drawer (Stage 1/2 blueprint), **Code** drawer (full source + char count), **Copy**, **Download** (`Blob` → `<title>-presentation.html`), **Open in new tab** (blob URL), **Keynote Player**, **Visual Studio**, **Presenter Console**, **Fullscreen**.
- **Presenter Console** (`handleOpenPresenterConsole`, ~410 lines of the file): opens a popup and `document.write`s a complete presenter app — wall clock, elapsed timer with pause/reset, "Synced with Projector" status, current-slide card, next-slide peek, speaker notes card, slide pills, nav buttons. `parseSlidesForPresenter` extracts per-slide title/subtitle/badge/`data-notes`/6 bullets and an archetype label (3D WebGL / Particle Flow / Motion Pipeline / Simulator / Matrix).
- **postMessage bridge** with 5 message types: `HYPERDECK_SET_FULLSCREEN` (viewer→iframe), `HYPERDECK_STATE_UPDATE` (iframe→viewer), `HYPERDECK_PRESENTER_SYNC` (viewer→popup), `HYPERDECK_PRESENTER_ACTION` (popup→viewer), `HYPERDECK_NAVIGATE` (viewer→iframe).

**`PresentationPlayer.tsx` (422)** — the native keynote stage.
- Mounts `new PresentationEngine(containerRef.current)` on `[presentation]`, subscribes to state, fires **canvas-confetti** when the last step of the last scene is reached, and cleans up (`unsubscribe(); engine.destroy()`) on unmount.
- Toolbar: sidebar toggle, **laser pointer** (red dot following the mouse inside the stage), **sound toggle**, **JSON** (opens `JsonModal`), Studio link, **fullscreen** (`requestFullscreen` on the 16:9 viewport + floating overlay with slide/step counters), step pill.
- Body: `SlideNavigator` sidebar (hidden in fullscreen) + stage + `StepScrubber` + **Step HUD** (active step title/description, Restart/Prev/Next buttons) + keyboard hint row (`Space`/`→` next, `←` prev — the shortcuts are owned by the engine, not this component) + `JsonModal`.
- Derived progress bar from `currentStepIndex/totalSteps`.

**`EditorStudio.tsx` (605)** — the visual designer. Fully controlled: every mutation clones `presentation` and calls `onChange` (App holds truth in `currentDeck`).
- **Left column** "Slide Sequence": add slide (`handleAddScene` — creates a scene with a starter card + step), delete slide (blocked when only 1 remains), layout/component/step counts.
- **Center canvas**: 16:9 mini-preview of the selected scene, inline-editable title, element grid with type-specific previews, insert toolbar **+ Card / + Equation (`E = mc^2` starter with 4 MathTokens) / + Text / + Simulator / + Step Action**.
- **Right inspector**, two tabs: **Step Sequencer** (add/delete step, editable step title & description, action list showing `{action, target, duration}s`, `+ Action` adds a highlight action) and **Components** (read-only element list, click to select).
- Top bar: editable deck title, slide count, "Present Keynote" button. *No drag-reorder; `selectedStepIndex` state and the `"json"` tab union member are dead.*

**`SlideNavigator.tsx` (78)** — vertical slide list sidebar: zero-padded index, category/layout chip, truncated title, `N components` / `N steps`, cyan active rail, scrollable. (All 4 lucide imports unused.)

**`StepScrubber.tsx` (61)** — horizontal step strip: active (cyan), passed (emerald check), future (dim) states; clicking jumps via `engine.goToStep` (instant zero-duration replay).

**`JsonModal.tsx` (99)** — modal showing `JSON.stringify(presentation, null, 2)` with Copy (2 s feedback) and Download (`<title>.json`).

**`KeynoxLogo.tsx` (78)** — inline SVG monogram (viewBox 32×32): gradient spine + upper/lower "projection wings" + prismatic core node, inside a glossy badge with optional ambient glow. Props `size`, `className`, `showGlow`.

**Dead components (zero importers, verified by grep):**
- `InteractiveWidget.tsx` (259) — a React boolean/physics simulator; superseded by the engine's vanilla-DOM renderer (design law #3).
- `ImageGeneratorModal.tsx` (285) — "NVIDIA NIM Photo Studio" dialog calling `POST /api/ai/generate-image` (16:9 1024×576 or 1:1 1024×1024); its server endpoint exists but no UI can reach it.

### Data (`src/data/`)

**`showcaseDecks.ts` (847)** — four hand-authored, schema-typed showcase decks:
1. **`booleanLogicDeck`** (5 scenes) — *the default deck loaded by App*: binary state machine/transistor hero, three operators with highlight steps, a live **`boolean-simulator` widget** slide, software-vs-silicon, De Morgan cheat sheet.
2. **`equationSolverDeck`** (2 scenes) — solves `2x + 5 = 15` with 4 steps of fine-grained token animation (highlight → `transform` `15`→`10` + fade out `+5` → `transform` `2x`→`x`, `15`→`5`) — the flagship math-morphing demo.
3. **`physicsDeck`** (2 scenes) — Newton's three laws + a **`physics-slider` widget** (`a = F/m`) slide.
4. **`osKernelDeck`** (2 scenes) — Ring 0/3 protection rings + a `timeline` syscall/context-switch slide.
- Plus the `showcaseDecks` barrel object. **Only `booleanLogicDeck` is imported** — the other three became unreachable when the showcase gallery was removed from `App.tsx`.

**`showcaseHtmlSites.ts` (545)** — `booleanLogicHtmlSite`, a full standalone HTML boolean-logic site (progress bar, 4 slides, interactive gate simulator with truth table, keyboard nav) + the `showcaseHtmlSites` barrel. **Entirely dead** — a leftover from the removed gallery.

### Hooks & utils

**`hooks/useStreamThrottler.ts` (48)** — the 60 FPS streaming hook. API `{value, append, reset, setValue}`: `append(chunk)` accumulates into a ref queue and schedules a **single `requestAnimationFrame` flush** (only if none pending); `flush` commits one `setValue(prev => prev + pending)` per frame regardless of chunk count; `reset(v)` cancels the frame and replaces synchronously; unmount cancels pending frames. Instantiated 4× in `App.tsx` (deltas → `.append`, stage completion → `.reset(fullText)`). *`setValue` is never used by consumers.*

**`utils/pdfExtractor.ts` (289)** — client-side PDF pipeline. Exports `ExtractedPdfResult {fileName, title, totalPages, wordCount, cleanText, abstract?, sections[]}`, `formatCleanTitleFromFileName` (internal-only helper), and `extractPdfDocument(file, maxPages, onProgress)`:
1. Read file → `ArrayBuffer`.
2. **Lazy-load PDF.js from CDN** (`cdnjs .../pdf.js/3.11.174/pdf.min.js` + worker) — this is why npm `pdfjs-dist` is unused — and render up to 15 pages to JPEG canvases (`scale 1.2`, quality 0.82) for multimodal vision.
3. **`POST /api/ai/extract-pdf`** with `{fileBase64, fileName, pageImages}`; accepts the response if `cleanText.length > 50`.
4. **Client-side fallback**: per-page `getTextContent()` with header/footer artifact stripping, abstract regex capture within the first 2 pages, stops at References; title heuristic from page-1's first sentence (6–90 chars, rejects `[`/`page`/`arxiv`/`in this chapter` prefixes); throws "Unable to extract text… scanned or image-only" under 50 chars.
5. Last resort: `extractRawPdfStreams` byte-scan of PDF `Tj` text operators (>80 chars required).

---

## 8. Cross-cutting protocols

### HTTP API (all under `/api/ai`, proxied by Vite in dev)

| Endpoint | Consumer | Purpose |
|---|---|---|
| `POST /stream-site` (= `/stream`) | `App.tsx` | SSE 3-stage generation |
| `POST /extract-pdf` | `pdfExtractor.ts` | PDF text + page-image extraction |
| `POST /generate-image` | `ImageGeneratorModal.tsx` *(dead)* | FLUX image generation |
| `POST /generate-presentation` | external/JSON clients | Non-streaming DeepSeek→AST path |
| `GET /health` | Render | Health check |

### SSE event vocabulary
`cache_hit`, `stage1_start|chunk|complete`, `stage2_start|chunk|complete`, `stage3_start|reasoning|chunk`, `photo_start`, `photo_done`, `complete`, `error` — each written as `data: {json}\n\n`.

### postMessage protocol (viewer ↔ iframe ↔ presenter popup)
`HYPERDECK_SET_FULLSCREEN`, `HYPERDECK_STATE_UPDATE`, `HYPERDECK_PRESENTER_SYNC`, `HYPERDECK_PRESENTER_ACTION`, `HYPERDECK_NAVIGATE`.

### Exact model IDs (server)

| Model ID | Where used |
|---|---|
| `nvidia/nemotron-3-super-120b-a12b` | Stage 1 & 2 `PRIMARY_MODEL`, Stage 3 `MODEL_SUPER`, orchestrator labels |
| `nvidia/nemotron-3-super-120b-a12b (Gemini Critic)` | default model label in `auto` mode |
| `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning` | Stage 1 & 2 `FALLBACK_MODEL`, Stage 3 `MODEL_LIGHTNING` |
| `google/gemini-3.8-flash` | orchestrator label when `engine === "gemini"` |
| `gemini-3.5-flash-lite` / `gemini-3.8-flash` | `config.ts` `GEMINI_MODEL` default / `GeminiService` fallback literal |
| `deepseek-ai/deepseek-v4-flash-0731` | `NVIDIA_MODEL` default, used by `deepseek.ts` |
| `meta/llama-3.2-11b-vision-instruct` | `pdfVisionService` `VISION_MODEL` (NVIDIA fallback) |
| `black-forest-labs/flux.2-klein-4b` → `flux.1-schnell` | `imageService` primary → fallback image endpoints |

### Env vars consumed
`PORT`, `NVIDIA_API_KEY`, `NVIDIA_API_KEY_NANO`, `NVIDIA_API_KEY_ULTRA`, `NVIDIA_BASE_URL`, `NVIDIA_MODEL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_BASE_URL`, `DEFAULT_AI_PROVIDER`, `GEMINI_CRITIC_ENABLED` — all through `config.ts` except direct `process.env.NVIDIA_API_KEY`/`NVIDIA_API_KEY_ULTRA` re-checks inside `imageService.ts`.

### External HTTP endpoints called
- `https://integrate.api.nvidia.com/v1` — OpenAI-compatible chat (Nemotron Super/Nano, DeepSeek, llama-3.2 vision)
- `https://generativelanguage.googleapis.com/v1beta/openai` — OpenAI-compatible Gemini chat
- `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=…` — native Gemini vision
- `https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b` and `…/flux.1-schnell` — images
- CDNs embedded in output HTML: `fonts.googleapis.com`, `cdnjs.cloudflare.com` (GSAP 3.12.5, three.js r128, KaTeX 0.16.9); client `index.html` also loads KaTeX CSS from `cdn.jsdelivr.net`, and `pdfExtractor.ts` loads PDF.js 3.11.174 from `cdnjs.cloudflare.com`

### Server internal dependency edges
```
index.ts → config.ts, routes/ai.ts
routes/ai.ts → services/nemotronPipeline, services/deepseek, (dyn) services/pdfService, services/imageService
services/nemotronPipeline → pipeline/orchestrator, pipeline/topic-extractor, pipeline/html-assembler
pipeline/orchestrator → services/slideCountDetector, pipeline/cache, stage1, stage2, stage3,
                         html-assembler, html-to-ast, (dyn) imageService
stage1/stage2/stage3 → config, pipeline/topic-extractor, services/geminiService
pipeline/html-assembler → pipeline/token-optimizer (MASTER_DESIGN_SYSTEM_CSS), stage3 (sanitizeAiTone)
pipeline/html-to-ast → pipeline/html-assembler, @presentation/schema
services/pdfService → pipeline/topic-extractor (sanitizeTitleString), (dyn) pdfVisionService, pdfjs-dist
services/pdfVisionService → config, services/geminiService
services/deepseek → config, services/slideCountDetector, jsonrepair, @presentation/schema
```

### Keyboard shortcuts
- **Player (engine-owned):** `Space`/`→`/`PageDown` next · `←`/`PageUp` prev · suppressed in inputs.
- **Presenter popup:** `→`/`Space`/`j`/`PageDown` next · `←`/`k`/`PageUp` prev. *(Latent bug: the code checks for the literal `'Space'`, but `e.key` is `" "` — same bug exists in the server's generated page.)*
- **Generated iframe page (html-assembler):** arrows/space/j/PageDown/PageUp, `f` fullscreen, digits `1..n` jump, `p` pen / `h` highlighter / `s`/`Esc` tools, `Ctrl+Z`/`Ctrl+Shift+Z`/`Ctrl+Y` drawing undo-redo.
- **Input area:** `Ctrl/Cmd+Enter` submits generation.

---

## 9. Build, test & deploy

```bash
npm install            # workspace install
npm run dev            # Fastify :3001 (tsx watch) + Vite :5173 (with /api proxy)
npm run build          # schema → engine → server → client (tsc + vite build)
npm test               # vitest run → 43 tests (schema 4, engine 3, server 36)
npm start              # node packages/server/dist/index.js (serves client/dist too)
```

Production (Render, `render.yaml`): `npm install --include=dev && npm run build` → `node packages/server/dist/index.js`; Fastify serves the built client with SPA fallback; health at `/health`; secrets `GEMINI_API_KEY` + `NVIDIA_API_KEY` set in the dashboard.

Current health (verified): **build ✅ · 43/43 tests ✅ · `tsc --noEmit` clean** — with **7 modified-but-uncommitted files** (App showcase-gallery removal, big stage3/deepseek slim-downs, test/pipeline edits) and an untracked `.kombai/` directory.

---

## 10. Known issues & dead code (grep-verified)

**Docs drift:** `AGENTS.md`/`README` describe a *2-stage* pipeline (code is 3-stage), a *showcase gallery* (removed from `App.tsx`), `engine/src/engine.ts` (actually `engine/src/index.ts`), and distinct `/stream` vs `/stream-site` routes (they are identical).

**Dead client code:** `showcaseHtmlSites.ts` (whole file), `InteractiveWidget.tsx`, `ImageGeneratorModal.tsx`, `equationSolverDeck`/`physicsDeck`/`osKernelDeck` + barrel (3 of 4 decks unreachable), `NemotronProcessViewer` props `stage1/2/3Message`/`photoLogs`/`modelName` (no photo-log UI exists), `EditorStudio.selectedStepIndex` + `"json"` tab member, `useStreamThrottler.setValue`, `HtmlPresentationViewer.modelName` prop, ~20 unused lucide imports (allowed by `noUnusedLocals: false`), unlinked `public/*.html` test artifacts, `token-optimizer.buildStage2Prompt` (never called), `nemotronPipeline` helpers `isHtmlFullyComplete`/`extractSlideSections`/`extractCustomStyles`/`assemblePresentationWebsite`, `routes/ai.ts`'s unused `streamPresentationGeneration` import, `pdfExtractor.formatCleanTitleFromFileName` (external-import-free), a duplicated `ExtractedPdfData` interface in `pdfService.ts`, and a thumbnail-button list built but never emitted by `html-assembler.ts`. *(npm dep `pdfjs-dist` is **not** dead — the server's `pdfService.ts` imports it through workspace hoisting, though it would be cleaner to declare it there.)*

**Server/API concerns:** `/stream` and `/stream-site` are copy-paste duplicates; SSE writes to `reply.raw` with **no client-disconnect handling** (orphaned LLM streams keep running); no rate limiting on a 50 MB-body public endpoint; `archetypes`/`audience`/`language` accepted but dropped; cache key ignores `theme`/`engine`; `config.ts` model env vars mostly unused (stages hardcode model IDs — only `deepseek.ts` honors `NVIDIA_MODEL`); `.env.example` omits all five Gemini vars; the `/stream` route comment still describes the old "Two-Stage" pipeline; 38 `console.*` calls alongside Fastify's structured logger; `deepseek.generatePresentationWithDeepSeek` narrows a closure-assigned `Presentation | null` only via a final throw; presenter/iframe keyboard handlers check the literal `'Space'` instead of `" "` (latent no-op for the space key).

**Test gaps:** no coverage for `orchestrator.ts`, the SSE route contract, stage1/stage2 prompt flows, or any client component (engine tests cover only audio/animator construction — `DOMRenderer` needs a DOM environment).
