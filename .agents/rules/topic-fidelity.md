# ABSOLUTE RULE: NEVER HARDCODE ANY INFORMATION, TOPIC, CONTENT, OR SPECIAL CASES

> **MANDATORY CONSTRAINTS FOR ALL AI AGENTS & DEVELOPERS**
> The user has stated this repeatedly: **UNDER NO CIRCUMSTANCES SHALL ANY INFORMATION, DATA, METRICS, TOPICS, OR CODE BE HARDCODED.**

---

## 1. Zero Hardcoding Mandate
1. **NO TOPIC SPECIAL-CASING**:
   - NEVER write `if (topic.includes("..."))` or domain-specific branches for any topic (IoT, Quantum, Neural Networks, Physics, etc.).
   - The platform is a universal presentation engine. It must work identically and dynamically for ANY document or topic.

2. **NO HARDCODED MOCK DATA OR PRE-FABRICATED SLIDES**:
   - NEVER create pre-written fallback presentations with hardcoded parameters, fake metrics (e.g. "4,800 ops/s", "Active Node Concurrency", "Intensity Factor α / Load Constraint β"), or hardcoded tables.
   - NEVER hardcode slide text, bullet points, card descriptions, or formulas in backend code.
   - If the AI model fails or is interrupted, the system MUST report an error or retry dynamically — it must NEVER silently substitute a pre-written hardcoded slide deck.

3. **100% PURE DYNAMIC EXTRACTION & SYNTHESIS**:
   - ALL titles, concepts, numbers, diagrams, equations, and interactive visualizers MUST be generated live by the AI model directly from the user's input prompt or uploaded PDF document.
   - All PDF parsing is dynamic via PDF.js extracting the user's raw text.
   - All visual diagrams (Venn diagrams, bar charts, flow topologies) must be synthesized dynamically by the LLM using the pre-bundled CSS primitives.

4. **ZERO PLACEHOLDER SLOP**:
   - NEVER use placeholder Greek letters ($\alpha$, $\beta$, $\gamma$).
   - NEVER use placeholder phases ("Phase 1: Ingestion / Phase 2: Execution / Phase 3: Feedback").
   - NEVER use canned corporate filler.

---

## 2. Enforcement Checklist Before Any Response
- [ ] Did you check if any new or modified file contains topic strings or hardcoded numbers? If yes, REMOVE THEM.
- [ ] Are all slides, equations, and interactive visualizers coming 100% dynamically from the LLM or user text?
- [ ] Is there ANY `if (topic === ...)` or `if (topic.includes(...))` in the codebase? If yes, DELETE IT IMMEDIATELY.
- [ ] If an AI call fails, does it fail cleanly or retry dynamically instead of returning canned dummy slides?
