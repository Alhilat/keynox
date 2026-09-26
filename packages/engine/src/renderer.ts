import {
  Scene,
  Element,
  EquationElement,
  TextElement,
  CardElement,
  ShapeElement,
  ImageElement,
  InteractiveWidgetElement,
  PhysicsSliderConfigSchema,
  freeWidgetConfig,
  textOr,
} from "@presentation/schema";
import { renderPhysicsWidget as renderGenericPhysicsWidget } from "./physicsRenderer";
import {
  renderBooleanSimulatorWidget,
  renderLegacyPhysicsWidget,
  renderCodeBlockWidget,
  renderComparisonMatrixWidget,
} from "./widgets";

export class DOMRenderer {
  public static readonly STAGE_WIDTH = 1280;
  public static readonly STAGE_HEIGHT = 720;

  private stageEl: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private widgetCleanups: Array<() => void> = [];

  /**
   * Render an entire scene into the presentation container
   */
  public renderScene(scene: Scene, container: HTMLElement): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    container.innerHTML = "";
    container.setAttribute("data-scene-id", scene.id);
    this.runWidgetCleanups();

    // Outer viewport wrapper (centers the 16:9 stage)
    const viewport = document.createElement("div");
    viewport.className =
      "presentation-viewport relative w-full h-full flex items-center justify-center overflow-hidden bg-[#07090e]";
    viewport.style.position = "relative";
    viewport.style.width = "100%";
    viewport.style.height = "100%";

    // Fixed 1280x720 Virtual Stage - Clean, sleek matte obsidian finish
    const stage = document.createElement("div");
    stage.className =
      "presentation-stage-canvas absolute select-none overflow-hidden bg-[#0b0f19] border border-slate-800/80 rounded-2xl shadow-2xl flex flex-col";
    stage.style.position = "absolute";
    stage.style.width = `${DOMRenderer.STAGE_WIDTH}px`;
    stage.style.height = `${DOMRenderer.STAGE_HEIGHT}px`;
    stage.style.transformOrigin = "center center";

    // Executive Slide Top Accent Gradient Line
    const topAccent = document.createElement("div");
    topAccent.className =
      "absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 opacity-90 z-20";
    stage.appendChild(topAccent);

    // Slide Header Bar
    const slideHeader = document.createElement("div");
    slideHeader.className =
      "w-full px-12 pt-7 pb-4 flex items-center justify-between border-b border-slate-800/60 z-20 shrink-0";

    const titleGroup = document.createElement("div");
    titleGroup.className = "flex flex-col gap-1";

    const titleRow = document.createElement("div");
    titleRow.className = "flex items-center gap-3";

    const categoryTag = document.createElement("span");
    categoryTag.className =
      "px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase bg-blue-500/10 text-blue-400 border border-blue-500/25";
    categoryTag.textContent = scene.category || "OVERVIEW";
    titleRow.appendChild(categoryTag);

    const titleH = document.createElement("h2");
    titleH.className = "text-2xl font-bold text-white tracking-tight";
    titleH.textContent = scene.title || "Interactive Slide";
    titleRow.appendChild(titleH);

    titleGroup.appendChild(titleRow);

    if (scene.subtitle) {
      const subP = document.createElement("p");
      subP.className = "text-xs text-slate-400 font-medium pl-0.5 mt-0.5";
      subP.textContent = scene.subtitle;
      titleGroup.appendChild(subP);
    }

    slideHeader.appendChild(titleGroup);

    // Slide indicator chip in header
    const scenePill = document.createElement("div");
    scenePill.className =
      "px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 flex items-center gap-2";
    scenePill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span><span>KEYNOTE DECK</span>`;
    slideHeader.appendChild(scenePill);

    stage.appendChild(slideHeader);
    this.stageEl = stage;

    // Slide Body Container
    const bodyContainer = document.createElement("div");
    bodyContainer.className =
      "relative flex-1 w-full px-12 py-6 overflow-y-auto overflow-x-hidden flex flex-col justify-start pb-20 custom-scrollbar";
    bodyContainer.style.scrollBehavior = "smooth";
    bodyContainer.style.scrollbarWidth = "thin";
    bodyContainer.style.scrollbarColor = "rgba(56, 189, 248, 0.3) transparent";
    stage.appendChild(bodyContainer);

    // Determine layout strategy
    const layout = this.detectLayout(scene);
    this.renderStructuredLayout(scene, layout, bodyContainer);

    viewport.appendChild(stage);
    container.appendChild(viewport);

    // Auto-scale stage to fit container
    const updateScale = () => {
      const parentWidth = container.clientWidth || 800;
      const parentHeight = container.clientHeight || 450;
      const scaleX = parentWidth / DOMRenderer.STAGE_WIDTH;
      const scaleY = parentHeight / DOMRenderer.STAGE_HEIGHT;
      const scale = Math.min(scaleX, scaleY);

      stage.style.transform = `translate3d(0, 0, 0) scale(${scale})`;
    };

    stage.style.willChange = "transform";
    updateScale();
    this.resizeObserver = new ResizeObserver(() => updateScale());
    this.resizeObserver.observe(container);
  }

  /**
   * Determine optimal layout mode for the scene
   */
  private detectLayout(scene: Scene): "hero" | "cards" | "split" | "timeline" | "stat" | "standard" {
    if (scene.layout && scene.layout !== "standard") {
      return scene.layout as any;
    }

    const elements = scene.elements || [];
    if (elements.some((e) => e.type === "interactive-widget")) {
      return elements.length === 1 ? "hero" : "split";
    }

    const cardCount = elements.filter(
      (e) => e.type === "card" || (e.type === "text" && (e.id.includes("card") || (e as any).content?.includes("\n")))
    ).length;

    if (elements.some((e) => e.type === "card")) {
      return "cards";
    }

    if (cardCount === 2) {
      return "split";
    }

    if (cardCount >= 3) {
      return "cards";
    }

    if (scene.id === "scene-1" && elements.length <= 2) {
      return "hero";
    }

    return "standard";
  }

  /**
   * Render structured responsive layout
   */
  private renderStructuredLayout(
    scene: Scene,
    layout: "hero" | "cards" | "split" | "timeline" | "stat" | "standard",
    container: HTMLElement
  ): void {
    switch (layout) {
      case "hero":
        this.renderHeroLayout(scene, container);
        break;
      case "stat":
        this.renderStatLayout(scene, container);
        break;
      case "split":
        this.renderSplitLayout(scene, container);
        break;
      case "timeline":
        this.renderTimelineLayout(scene, container);
        break;
      case "cards":
        this.renderCardsLayout(scene, container);
        break;
      case "standard":
      default:
        this.renderStandardLayout(scene, container);
        break;
    }
  }

  /**
   * Render high-impact Hero Title Slide
   */
  private renderHeroLayout(scene: Scene, container: HTMLElement): void {
    const heroWrapper = document.createElement("div");
    heroWrapper.className =
      "w-full min-h-full flex flex-col items-center justify-center text-center max-w-4xl mx-auto py-6";

    const badge = document.createElement("div");
    badge.className =
      "inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-semibold uppercase tracking-wider mb-6";
    badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span> ${scene.category || "EXECUTIVE OVERVIEW"}`;
    heroWrapper.appendChild(badge);

    const titleH = document.createElement("h1");
    titleH.className =
      "text-5xl font-black text-white tracking-tight leading-tight mb-6 bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent";
    titleH.textContent = scene.title;
    heroWrapper.appendChild(titleH);

    if (scene.subtitle) {
      const sub = document.createElement("p");
      sub.className = "text-xl text-slate-300 max-w-2xl leading-relaxed mb-8 font-light";
      sub.textContent = scene.subtitle;
      heroWrapper.appendChild(sub);
    }

    // Render any elements (e.g. key takeaways card)
    const cardsGrid = document.createElement("div");
    cardsGrid.className = "w-full grid grid-cols-1 md:grid-cols-2 gap-5 mt-2 text-left";

    scene.elements.forEach((el, idx) => {
      const cardEl = this.createCardNodeFromElement(el, idx);
      cardsGrid.appendChild(cardEl);
    });

    if (scene.elements.length > 0) {
      heroWrapper.appendChild(cardsGrid);
    }

    container.appendChild(heroWrapper);
  }

  /**
   * Render Multi-Card Grid (2, 3, or 4 balanced cards)
   */
  private renderCardsLayout(scene: Scene, container: HTMLElement): void {
    const elements = scene.elements;
    const count = elements.length || 1;

    const grid = document.createElement("div");
    let gridClasses = "w-full min-h-full grid gap-6 items-stretch";

    if (count <= 2) {
      gridClasses += " grid-cols-2";
    } else if (count === 3) {
      gridClasses += " grid-cols-3";
    } else {
      gridClasses += " grid-cols-2 grid-rows-2";
    }

    grid.className = gridClasses;

    elements.forEach((el, idx) => {
      const cardNode = this.createCardNodeFromElement(el, idx);
      grid.appendChild(cardNode);
    });

    container.appendChild(grid);
  }

  /**
   * Render Split 2-Column Comparison Layout
   */
  private renderSplitLayout(scene: Scene, container: HTMLElement): void {
    const grid = document.createElement("div");
    grid.className = "w-full min-h-full grid grid-cols-2 gap-8 items-stretch";

    scene.elements.forEach((el, idx) => {
      const cardNode = this.createCardNodeFromElement(el, idx, idx === 0 ? "#38bdf8" : "#a855f7");
      grid.appendChild(cardNode);
    });

    container.appendChild(grid);
  }

  /**
   * Render Sequential Process Flow / Timeline
   */
  private renderTimelineLayout(scene: Scene, container: HTMLElement): void {
    const wrapper = document.createElement("div");
    wrapper.className = "w-full min-h-full flex flex-col justify-center";

    const flowContainer = document.createElement("div");
    flowContainer.className = "w-full grid grid-cols-3 gap-6 items-stretch relative";

    // Connecting line behind cards
    const connector = document.createElement("div");
    connector.className =
      "absolute top-1/2 left-10 right-10 h-0.5 bg-gradient-to-r from-blue-500/40 via-indigo-500/40 to-cyan-500/40 -translate-y-1/2 z-0 hidden md:block";
    flowContainer.appendChild(connector);

    scene.elements.forEach((el, idx) => {
      const node = this.createCardNodeFromElement(el, idx, "#38bdf8", true);
      node.classList.add("relative", "z-10");
      flowContainer.appendChild(node);
    });

    wrapper.appendChild(flowContainer);
    container.appendChild(wrapper);
  }

  /**
   * Render High-Impact Key Performance / Stat Metrics Layout
   */
  private renderStatLayout(scene: Scene, container: HTMLElement): void {
    const wrapper = document.createElement("div");
    wrapper.className = "w-full min-h-full flex flex-col justify-center gap-6";

    // Top Stat Bar (High-contrast, large-format key numbers)
    const statsGrid = document.createElement("div");
    const statCards = scene.elements.filter(
      (e) => (e as any).tag?.includes("STAT") || (e as any).badge?.includes("KPI") || (e as any).badge?.includes("%") || e.type === "card"
    );

    const count = Math.min(3, Math.max(1, statCards.length));
    statsGrid.className = `w-full grid grid-cols-${count} gap-6 items-stretch`;

    scene.elements.forEach((el, idx) => {
      const card = document.createElement("div");
      card.setAttribute("data-id", el.id);
      card.className =
        "p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 shadow-2xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:border-blue-500/50";
      
      const accent = idx === 0 ? "#38bdf8" : idx === 1 ? "#818cf8" : "#34d399";
      card.style.borderTop = `3px solid ${accent}`;

      const tag = (el as any).tag || (el as any).badge || `METRIC 0${idx + 1}`;
      const title = (el as any).title || "Key Metric";
      const desc = (el as any).description || "";
      const points = (el as any).points || [];

      card.innerHTML = `
        <div class="flex items-center justify-between mb-3">
          <span class="px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-800/90 text-slate-300 border border-slate-700/80">${tag}</span>
          <div class="w-2 h-2 rounded-full" style="background-color: ${accent}"></div>
        </div>
        <div class="my-auto">
          <h3 class="text-3xl font-black text-white tracking-tight mb-2" style="color: ${accent}">${title}</h3>
          <p class="text-xs text-slate-300 leading-relaxed">${desc}</p>
        </div>
        ${points.length > 0 ? `
          <ul class="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
            ${points.map((p: string) => `
              <li class="text-[11px] text-slate-400 flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${accent}"></span>
                <span>${p}</span>
              </li>
            `).join("")}
          </ul>
        ` : ""}
      `;
      statsGrid.appendChild(card);
    });

    wrapper.appendChild(statsGrid);
    container.appendChild(wrapper);
  }

  /**
   * Standard fallback layout (flexible flex / cards)
   */
  private renderStandardLayout(scene: Scene, container: HTMLElement): void {
    if (scene.elements.length <= 4) {
      this.renderCardsLayout(scene, container);
    } else {
      const grid = document.createElement("div");
      grid.className = "w-full min-h-full grid grid-cols-3 gap-5 items-stretch pr-1";
      scene.elements.forEach((el, idx) => {
        const cardNode = this.createCardNodeFromElement(el, idx);
        grid.appendChild(cardNode);
      });
      container.appendChild(grid);
    }
  }

  /**
   * Universal card node creator from any polymorphic element
   */
  private createCardNodeFromElement(
    element: Element,
    index: number,
    overrideColor?: string,
    isStepNode: boolean = false
  ): HTMLElement {
    const card = document.createElement("div");
    card.setAttribute("data-id", element.id);
    card.setAttribute("data-type", element.type);

    const accent =
      overrideColor ||
      (element as any).accentColor ||
      (index % 3 === 0 ? "#38bdf8" : index % 3 === 1 ? "#818cf8" : "#34d399");

    card.className =
      "presentation-card relative p-6 rounded-2xl bg-slate-900/80 backdrop-blur border border-slate-800/90 shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:border-slate-700";
    card.style.borderTop = `3px solid ${accent}`;

    // Background subtle gradient glow
    const glow = document.createElement("div");
    glow.className =
      "pointer-events-none absolute -top-16 -right-16 w-36 h-36 rounded-full opacity-10 blur-2xl";
    glow.style.backgroundColor = accent;
    card.appendChild(glow);

    // Card Top Bar
    const topBar = document.createElement("div");
    topBar.className = "flex items-center justify-between gap-2 mb-3";

    const badge = document.createElement("span");
    badge.className =
      "px-2.5 py-0.5 rounded text-[11px] font-mono font-bold tracking-wide uppercase bg-slate-800/90 text-slate-300 border border-slate-700/80";
    badge.textContent =
      (element as any).tag || (element as any).badge || (isStepNode ? `STEP ${index + 1}` : `0${index + 1}`);
    topBar.appendChild(badge);

    if ((element as any).icon) {
      const iconSpan = document.createElement("span");
      iconSpan.className = "text-base";
      iconSpan.textContent = (element as any).icon;
      topBar.appendChild(iconSpan);
    }

    card.appendChild(topBar);

    // Card Content
    const contentBox = document.createElement("div");
    contentBox.className = "flex-1 flex flex-col justify-start";

    if (element.type === "card") {
      const title = document.createElement("h3");
      title.className = "text-lg font-bold text-white mb-2 leading-snug tracking-tight";
      title.textContent = (element as CardElement).title;
      contentBox.appendChild(title);

      if ((element as CardElement).description) {
        const desc = document.createElement("p");
        desc.className = "text-xs text-slate-300 leading-relaxed mb-3";
        desc.textContent = (element as CardElement).description || "";
        contentBox.appendChild(desc);
      }

      if ((element as CardElement).points && (element as CardElement).points.length > 0) {
        const ul = document.createElement("ul");
        ul.className = "space-y-1.5 mt-auto pt-2 border-t border-slate-800/60";
        (element as CardElement).points.forEach((pt) => {
          const li = document.createElement("li");
          li.className = "text-[11px] text-slate-300 flex items-start gap-2 leading-tight";
          li.innerHTML = `<span class="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style="background-color: ${accent}"></span><span>${pt}</span>`;
          ul.appendChild(li);
        });
        contentBox.appendChild(ul);
      }
    } else if (element.type === "equation") {
      this.renderEquation(element as EquationElement, contentBox);
    } else if (element.type === "text") {
      const raw = (element as TextElement).content || "";
      const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);

      const titleText = lines[0] || (element as any).title || "Key Concept";
      const descLines = lines.slice(1);

      const title = document.createElement("h3");
      title.className = "text-lg font-bold text-white mb-2 leading-snug tracking-tight";
      title.textContent = titleText;
      contentBox.appendChild(title);

      if (descLines.length > 0) {
        const ul = document.createElement("ul");
        ul.className = "space-y-1.5 mt-auto pt-2 border-t border-slate-800/60";
        descLines.forEach((line) => {
          const cleanLine = line.replace(/^[-*•]\s*/, "");
          const li = document.createElement("li");
          li.className = "text-[11px] text-slate-300 flex items-start gap-2 leading-tight";
          li.innerHTML = `<span class="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style="background-color: ${accent}"></span><span>${cleanLine}</span>`;
          ul.appendChild(li);
        });
        contentBox.appendChild(ul);
      }
    } else if (element.type === "shape") {
      this.renderShape(element as ShapeElement, contentBox);
    } else if (element.type === "image") {
      this.renderImage(element as ImageElement, contentBox);
    } else if (element.type === "interactive-widget") {
      this.renderInteractiveWidget(element as InteractiveWidgetElement, contentBox);
    }

    card.appendChild(contentBox);
    return card;
  }

  private renderEquation(element: EquationElement, parent: HTMLElement): void {
    const eqCard = document.createElement("div");
    eqCard.className =
      "my-auto p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-center";

    const eqContainer = document.createElement("div");
    eqContainer.className = "font-mono text-white text-lg tracking-wider text-center";

    if (element.tokens && element.tokens.length > 0) {
      element.tokens.forEach((tok) => {
        const span = document.createElement("span");
        span.setAttribute("data-id", tok.id);
        span.className = `math-token math-token-${tok.type} inline-flex items-center justify-center mx-1.5 px-2.5 py-1 rounded-md text-sm font-semibold transition-all`;
        span.textContent = tok.text;
        if (tok.color) span.style.color = tok.color;

        if (tok.type === "operator") {
          span.style.color = "#94a3b8";
        } else if (tok.type === "variable" || tok.type === "term") {
          span.style.color = tok.color || "#38bdf8";
        } else if (tok.type === "constant") {
          span.style.color = tok.color || "#f8fafc";
        }

        eqContainer.appendChild(span);
      });
    } else {
      eqContainer.textContent = element.rawEquation;
    }

    eqCard.appendChild(eqContainer);
    parent.appendChild(eqCard);
  }

  private renderShape(element: ShapeElement, parent: HTMLElement): void {
    const shapeEl = document.createElement("div");
    shapeEl.className = "presentation-shape shadow-lg my-auto";
    shapeEl.style.backgroundColor = element.fill;
    shapeEl.style.borderRadius = `${element.borderRadius || 12}px`;
    if (element.stroke) {
      shapeEl.style.border = `${element.strokeWidth || 2}px solid ${element.stroke}`;
    }
    parent.appendChild(shapeEl);
  }

  private renderImage(element: ImageElement, parent: HTMLElement): void {
    const wrap = document.createElement("div");
    wrap.className = "w-full h-full flex flex-col justify-center items-center overflow-hidden rounded-xl bg-slate-950/60 border border-slate-800/80 p-2 my-auto";

    const imgEl = document.createElement("img");
    imgEl.src = element.src;
    imgEl.alt = element.alt || "Keynote Visual";
    imgEl.className = "presentation-image w-full h-auto max-h-56 object-cover rounded-lg shadow-xl transition-transform duration-500 hover:scale-105";
    wrap.appendChild(imgEl);

    if (element.alt) {
      const caption = document.createElement("span");
      caption.className = "text-[11px] font-mono text-slate-400 mt-2 text-center tracking-wide line-clamp-1";
      caption.textContent = element.alt;
      wrap.appendChild(caption);
    }

    parent.appendChild(wrap);
  }

  private renderInteractiveWidget(element: InteractiveWidgetElement, parent: HTMLElement): void {
    const widgetType = element.widgetType || "boolean-simulator";
    const container = document.createElement("div");
    container.className = "w-full h-full flex flex-col justify-center select-none py-1";

    if (widgetType === "boolean-simulator") {
      renderBooleanSimulatorWidget(element, container);
    } else if (widgetType === "physics-slider") {
      this.renderPhysicsWidget(element, container);
    } else if (widgetType === "code-block") {
      renderCodeBlockWidget(element, container);
    } else if (widgetType === "comparison-matrix") {
      renderComparisonMatrixWidget(element, container);
    } else {
      renderBooleanSimulatorWidget(element, container);
    }

    parent.appendChild(container);
  }

  /**
   * Renders a physics-slider widget from its typed config when present,
   * falling back to the legacy F=ma sandbox for untyped configs.
   */
  private renderPhysicsWidget(element: InteractiveWidgetElement, container: HTMLElement): void {
    const parsed = PhysicsSliderConfigSchema.safeParse(element.config ?? {});
    if (parsed.success) {
      this.widgetCleanups.push(renderGenericPhysicsWidget(container, parsed.data));
      return;
    }
    renderLegacyPhysicsWidget(element, container);
  }


  public destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.runWidgetCleanups();
  }

  /** Cancels widget animation loops torn down by scene changes. */
  private runWidgetCleanups(): void {
    for (const cleanup of this.widgetCleanups) {
      try {
        cleanup();
      } catch {
        /* widget already torn down */
      }
    }
    this.widgetCleanups.length = 0;
  }
}
