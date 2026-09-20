# Keynox Platform

> Web-Native Interactive Presentation Engine, Explainer Studio & Keynote Runtime

For the comprehensive technical architecture, package breakdown, and developer guidelines, see **[AGENTS.md](./AGENTS.md)**.

## Quick Start

```bash
# Install dependencies
npm install

# Start both backend (Fastify :3001) and frontend (Vite :5173)
npm run dev

# Build all monorepo packages
npm run build
```

## Key Features

- **Dual-Stage AI Studio**: Nemotron 30B Nano (Architectural Reasoning & Blueprinting) → Nemotron 120B Super (60FPS Interactive Web Explainer Synthesis).
- **Keynote Player**: Fullscreen presentation stage with slide thumbnails, step scrubber, Web Audio effects, laser pointer, and live interactive widgets.
- **Embedded Simulators**: Direct on-slide executable widgets (Boolean logic gate circuit simulator, physics $F=ma$ simulator, animated equation solver).
- **Visual Studio**: Full visual slide deck designer with slide list, canvas inspector, and step animation sequencer.
- **Token-Optimized Pipeline**: Pre-bundled Obsidian & Glassmorphism design system saving ~65% output tokens with zero truncation.
- **60FPS Stream Throttler**: Butter-smooth `requestAnimationFrame` token batching for latency-free typing and streaming.
- **100% Dynamic Topic Fidelity & Zero Hardcoding**: All content, KaTeX equations, SVG diagrams, and interactive sliders are strictly synthesized from the user's provided topic or uploaded paper. Absolutely zero hardcoded content, zero canned boilerplate, and zero topic-specific special casing.
