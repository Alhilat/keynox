import {
  Scene,
  Element,
  EquationElement,
  TextElement,
  CardElement,
  ShapeElement,
  ImageElement,
  InteractiveWidgetElement,
} from "@presentation/schema";

export class DOMRenderer {
  public static readonly STAGE_WIDTH = 1280;
  public static readonly STAGE_HEIGHT = 720;

  private stageEl: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;

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
      "relative flex-1 w-full px-12 py-6 overflow-hidden flex flex-col justify-center";
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
      "w-full h-full flex flex-col items-center justify-center text-center max-w-4xl mx-auto py-6";

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
    let gridClasses = "w-full h-full grid gap-6 items-stretch";

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
    grid.className = "w-full h-full grid grid-cols-2 gap-8 items-stretch";

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
    wrapper.className = "w-full h-full flex flex-col justify-center";

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
    wrapper.className = "w-full h-full flex flex-col justify-center gap-6";

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
      grid.className = "w-full h-full grid grid-cols-3 gap-5 items-stretch overflow-y-auto pr-1";
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
      this.renderBooleanSimulatorWidget(element, container);
    } else if (widgetType === "physics-slider") {
      this.renderPhysicsWidget(element, container);
    } else if (widgetType === "code-block") {
      this.renderCodeBlockWidget(element, container);
    } else if (widgetType === "comparison-matrix") {
      this.renderComparisonMatrixWidget(element, container);
    } else {
      this.renderBooleanSimulatorWidget(element, container);
    }

    parent.appendChild(container);
  }

  private renderBooleanSimulatorWidget(element: InteractiveWidgetElement, container: HTMLElement): void {
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col gap-3 w-full";

    let stateA = true;
    let stateB = false;

    // Signal Controls Row
    const controlsRow = document.createElement("div");
    controlsRow.className = "grid grid-cols-2 gap-3";

    const btnA = document.createElement("button");
    btnA.type = "button";
    btnA.className =
      "p-2.5 rounded-xl border flex items-center justify-between transition-all duration-200 cursor-pointer shadow-md active:scale-95";

    const btnB = document.createElement("button");
    btnB.type = "button";
    btnB.className =
      "p-2.5 rounded-xl border flex items-center justify-between transition-all duration-200 cursor-pointer shadow-md active:scale-95";

    controlsRow.appendChild(btnA);
    controlsRow.appendChild(btnB);
    wrapper.appendChild(controlsRow);

    // Gates Grid (4 gates: AND, OR, NOT, XOR)
    const gatesGrid = document.createElement("div");
    gatesGrid.className = "grid grid-cols-4 gap-2";

    const createGateBox = (name: string, formula: string, rule: string) => {
      const box = document.createElement("div");
      box.className =
        "p-2.5 rounded-xl border transition-all duration-200 flex flex-col justify-between";
      box.innerHTML = `
        <div class="flex items-center justify-between mb-1">
          <span class="text-[10px] font-mono font-bold text-slate-400">${name}</span>
          <div class="gate-led w-2 h-2 rounded-full transition-all"></div>
        </div>
        <div class="gate-val text-sm font-mono font-black my-0.5 transition-all"></div>
        <div class="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-0.5">
          <span>${formula}</span>
          <span class="truncate max-w-[65px]">${rule}</span>
        </div>
      `;
      return box;
    };

    const andBox = createGateBox("AND", "A ∧ B", "Both 1");
    const orBox = createGateBox("OR", "A ∨ B", "Either 1");
    const notBox = createGateBox("NOT", "¬A", "Invert A");
    const xorBox = createGateBox("XOR", "A ⊕ B", "Strictly 1");

    gatesGrid.appendChild(andBox);
    gatesGrid.appendChild(orBox);
    gatesGrid.appendChild(notBox);
    gatesGrid.appendChild(xorBox);
    wrapper.appendChild(gatesGrid);

    // Live Interactive Truth Table
    const ttWrapper = document.createElement("div");
    ttWrapper.className =
      "p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] font-mono";
    ttWrapper.innerHTML = `
      <div class="flex items-center justify-between text-slate-500 font-bold border-b border-slate-800 pb-1 mb-1 px-2">
        <span>A</span><span>B</span><span>A ∧ B</span><span>A ∨ B</span><span>¬A</span><span>A ⊕ B</span><span>TRUTH STATE</span>
      </div>
      <div class="tt-rows flex flex-col gap-0.5">
        <div data-state="00" class="tt-row flex items-center justify-between px-2 py-0.5 rounded transition-all">
          <span>0</span><span>0</span><span>0</span><span>0</span><span>1</span><span>0</span><span class="tt-tag opacity-0 text-[9px] font-bold text-cyan-400">ACTIVE ROW</span>
        </div>
        <div data-state="01" class="tt-row flex items-center justify-between px-2 py-0.5 rounded transition-all">
          <span>0</span><span>1</span><span>0</span><span>1</span><span>1</span><span>1</span><span class="tt-tag opacity-0 text-[9px] font-bold text-cyan-400">ACTIVE ROW</span>
        </div>
        <div data-state="10" class="tt-row flex items-center justify-between px-2 py-0.5 rounded transition-all">
          <span>1</span><span>0</span><span>0</span><span>1</span><span>0</span><span>1</span><span class="tt-tag opacity-0 text-[9px] font-bold text-cyan-400">ACTIVE ROW</span>
        </div>
        <div data-state="11" class="tt-row flex items-center justify-between px-2 py-0.5 rounded transition-all">
          <span>1</span><span>1</span><span>1</span><span>1</span><span>0</span><span>0</span><span class="tt-tag opacity-0 text-[9px] font-bold text-cyan-400">ACTIVE ROW</span>
        </div>
      </div>
    `;
    wrapper.appendChild(ttWrapper);

    const updateUI = () => {
      // Button A
      if (stateA) {
        btnA.className =
          "p-2.5 rounded-xl border border-emerald-500/60 bg-emerald-950/40 text-white flex items-center justify-between shadow-lg shadow-emerald-500/15 cursor-pointer transition-all";
        btnA.innerHTML = `
          <div class="text-left">
            <span class="text-[9px] font-mono text-emerald-400 uppercase font-bold block">SIGNAL A (HIGH)</span>
            <span class="text-xs font-mono font-bold">Input A: 1 (TRUE)</span>
          </div>
          <span class="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-mono font-black">HIGH</span>
        `;
      } else {
        btnA.className =
          "p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-400 flex items-center justify-between cursor-pointer hover:border-slate-700 transition-all";
        btnA.innerHTML = `
          <div class="text-left">
            <span class="text-[9px] font-mono text-slate-500 uppercase font-bold block">SIGNAL A (LOW)</span>
            <span class="text-xs font-mono font-bold">Input A: 0 (FALSE)</span>
          </div>
          <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono font-bold">LOW</span>
        `;
      }

      // Button B
      if (stateB) {
        btnB.className =
          "p-2.5 rounded-xl border border-emerald-500/60 bg-emerald-950/40 text-white flex items-center justify-between shadow-lg shadow-emerald-500/15 cursor-pointer transition-all";
        btnB.innerHTML = `
          <div class="text-left">
            <span class="text-[9px] font-mono text-emerald-400 uppercase font-bold block">SIGNAL B (HIGH)</span>
            <span class="text-xs font-mono font-bold">Input B: 1 (TRUE)</span>
          </div>
          <span class="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-mono font-black">HIGH</span>
        `;
      } else {
        btnB.className =
          "p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-400 flex items-center justify-between cursor-pointer hover:border-slate-700 transition-all";
        btnB.innerHTML = `
          <div class="text-left">
            <span class="text-[9px] font-mono text-slate-500 uppercase font-bold block">SIGNAL B (LOW)</span>
            <span class="text-xs font-mono font-bold">Input B: 0 (FALSE)</span>
          </div>
          <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono font-bold">LOW</span>
        `;
      }

      const andVal = stateA && stateB;
      const orVal = stateA || stateB;
      const notVal = !stateA;
      const xorVal = (stateA || stateB) && !(stateA && stateB);

      const updateGateBox = (box: HTMLElement, val: boolean) => {
        const led = box.querySelector(".gate-led") as HTMLElement;
        const text = box.querySelector(".gate-val") as HTMLElement;
        if (val) {
          box.className =
            "p-2.5 rounded-xl border border-emerald-500/60 bg-emerald-950/30 text-white shadow-lg shadow-emerald-500/15 flex flex-col justify-between transition-all";
          led.className =
            "gate-led w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981] animate-pulse";
          text.className = "gate-val text-sm font-mono font-black my-0.5 text-emerald-400";
          text.textContent = "TRUE (1)";
        } else {
          box.className =
            "p-2.5 rounded-xl border border-slate-800 bg-slate-950/50 text-slate-400 flex flex-col justify-between transition-all";
          led.className = "gate-led w-2 h-2 rounded-full bg-slate-700";
          text.className = "gate-val text-sm font-mono font-black my-0.5 text-slate-500";
          text.textContent = "FALSE (0)";
        }
      };

      updateGateBox(andBox, andVal);
      updateGateBox(orBox, orVal);
      updateGateBox(notBox, notVal);
      updateGateBox(xorBox, xorVal);

      // Truth Table Highlight
      const activeStateKey = `${stateA ? "1" : "0"}${stateB ? "1" : "0"}`;
      ttWrapper.querySelectorAll(".tt-row").forEach((row) => {
        const el = row as HTMLElement;
        const tag = el.querySelector(".tt-tag") as HTMLElement;
        if (el.getAttribute("data-state") === activeStateKey) {
          el.className =
            "tt-row flex items-center justify-between px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/50 text-cyan-200 font-bold transition-all shadow-sm";
          if (tag) tag.style.opacity = "1";
        } else {
          el.className =
            "tt-row flex items-center justify-between px-2 py-0.5 rounded text-slate-400 opacity-50 transition-all";
          if (tag) tag.style.opacity = "0";
        }
      });
    };

    btnA.addEventListener("click", () => {
      stateA = !stateA;
      updateUI();
    });

    btnB.addEventListener("click", () => {
      stateB = !stateB;
      updateUI();
    });

    updateUI();
    container.appendChild(wrapper);
  }

  private renderPhysicsWidget(element: InteractiveWidgetElement, container: HTMLElement): void {
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col gap-3 w-full";

    let mass = 2; // kg
    let force = 10; // N

    const controls = document.createElement("div");
    controls.className = "grid grid-cols-2 gap-3";
    controls.innerHTML = `
      <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
        <div class="flex justify-between text-xs font-mono mb-1.5">
          <span class="text-slate-400">Mass (m):</span>
          <span class="mass-val text-blue-400 font-bold">2 kg</span>
        </div>
        <input type="range" min="0.5" max="10" step="0.5" value="2" class="mass-slider w-full accent-blue-500 cursor-pointer" />
      </div>
      <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
        <div class="flex justify-between text-xs font-mono mb-1.5">
          <span class="text-slate-400">Force (F):</span>
          <span class="force-val text-emerald-400 font-bold">10 N</span>
        </div>
        <input type="range" min="1" max="50" step="1" value="10" class="force-slider w-full accent-emerald-500 cursor-pointer" />
      </div>
    `;
    wrapper.appendChild(controls);

    const readout = document.createElement("div");
    readout.className =
      "p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between";
    readout.innerHTML = `
      <div class="font-mono text-xs text-slate-300">
        Newton's 2nd Law: <span class="text-white font-bold">a = F / m</span>
      </div>
      <div class="accel-val px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-sm">
        a = 5.0 m/s²
      </div>
    `;
    wrapper.appendChild(readout);

    const massSlider = controls.querySelector(".mass-slider") as HTMLInputElement;
    const forceSlider = controls.querySelector(".force-slider") as HTMLInputElement;
    const massVal = controls.querySelector(".mass-val") as HTMLElement;
    const forceVal = controls.querySelector(".force-val") as HTMLElement;
    const accelVal = readout.querySelector(".accel-val") as HTMLElement;

    const updatePhysics = () => {
      mass = parseFloat(massSlider.value);
      force = parseFloat(forceSlider.value);
      const accel = (force / Math.max(0.1, mass)).toFixed(1);
      massVal.textContent = `${mass} kg`;
      forceVal.textContent = `${force} N`;
      accelVal.textContent = `a = ${accel} m/s²`;
    };

    massSlider.addEventListener("input", updatePhysics);
    forceSlider.addEventListener("input", updatePhysics);

    container.appendChild(wrapper);
  }

  private renderCodeBlockWidget(element: InteractiveWidgetElement, container: HTMLElement): void {
    const config = element.config || {};
    const code = config.code || (element as any).code || `// Production Architecture Implementation
function evaluateConsensus(quorum: number, nodes: Node[]): ConsensusState {
  const activeVotes = nodes.filter(n => n.hasVoted && n.isHealthy).length;
  const isSupermajority = activeVotes >= Math.floor(quorum / 2) + 1;
  return { committed: isSupermajority, timestamp: Date.now() };
}`;
    const language = config.language || "typescript";
    const filename = config.filename || `${language}_impl.${language === "python" ? "py" : language === "rust" ? "rs" : "ts"}`;

    const wrapper = document.createElement("div");
    wrapper.className =
      "w-full rounded-xl bg-slate-950/90 border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs";

    // Code Window Top Bar
    const topBar = document.createElement("div");
    topBar.className =
      "px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between";
    topBar.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
          <span class="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
        </div>
        <span class="text-slate-400 text-[11px] font-semibold ml-2">${filename}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">${language}</span>
        <button class="btn-copy-code px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] transition-colors">Copy</button>
      </div>
    `;
    wrapper.appendChild(topBar);

    // Code Content with Line Numbers
    const codeBody = document.createElement("div");
    codeBody.className = "p-3.5 max-h-56 overflow-y-auto flex gap-3 text-[11px] leading-relaxed select-text";

    const lines = code.split("\n");
    const lineNums = document.createElement("div");
    lineNums.className = "text-slate-600 select-none text-right pr-2 border-r border-slate-800/80";
    lineNums.innerHTML = lines.map((_: string, i: number) => `<div>${i + 1}</div>`).join("");

    const codeLines = document.createElement("pre");
    codeLines.className = "flex-1 text-slate-200 overflow-x-auto whitespace-pre font-mono";
    
    // Highlight syntax tokens lightly
    const formatted = code
      .replace(/(function|const|let|var|return|if|else|import|export|class|type|interface)\b/g, '<span class="text-purple-400 font-bold">$1</span>')
      .replace(/(true|false|null|undefined|\d+)/g, '<span class="text-amber-300">$1</span>')
      .replace(/(".*?"|'.*?'|`.*?`)/g, '<span class="text-emerald-300">$1</span>')
      .replace(/(\/\/.*$)/gm, '<span class="text-slate-500 italic">$1</span>');

    codeLines.innerHTML = formatted;

    codeBody.appendChild(lineNums);
    codeBody.appendChild(codeLines);
    wrapper.appendChild(codeBody);

    const copyBtn = topBar.querySelector(".btn-copy-code") as HTMLButtonElement;
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(code);
      copyBtn.textContent = "Copied!";
      copyBtn.className = "btn-copy-code px-2 py-0.5 rounded bg-emerald-600/30 text-emerald-300 text-[10px]";
      setTimeout(() => {
        copyBtn.textContent = "Copy";
        copyBtn.className = "btn-copy-code px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]";
      }, 1500);
    });

    container.appendChild(wrapper);
  }

  private renderComparisonMatrixWidget(element: InteractiveWidgetElement, container: HTMLElement): void {
    const config = element.config || {};
    const columns: string[] = config.columns || ["Architecture", "Throughput", "Latency", "Fault Tolerance"];
    const rows: Array<{ name: string; values: string[]; status?: string }> = config.rows || [
      { name: "Monolithic Pattern", values: ["100K req/s", "< 1ms", "Low (Single point)", "High Efficiency"], status: "HIGH_PERF" },
      { name: "Microservices Pattern", values: ["45K req/s", "~ 15ms", "High (Isolated failures)", "Scalable Teams"], status: "MODULAR" },
      { name: "Event-Driven Stream", values: ["250K msg/s", "~ 5ms", "Guaranteed Replay", "Eventual Sync"], status: "REACTIVE" },
    ];

    const wrapper = document.createElement("div");
    wrapper.className =
      "w-full rounded-xl bg-slate-950/90 border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs";

    const table = document.createElement("table");
    table.className = "w-full text-left border-collapse";

    // Header
    const thead = document.createElement("thead");
    thead.className = "bg-slate-900/90 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400";
    let thHtml = "<tr>";
    columns.forEach((c) => {
      thHtml += `<th class="px-3.5 py-2.5">${c}</th>`;
    });
    thHtml += "</tr>";
    thead.innerHTML = thHtml;
    table.appendChild(thead);

    // Body
    const tbody = document.createElement("tbody");
    tbody.className = "divide-y divide-slate-800/60 text-[11px]";

    rows.forEach((r, idx) => {
      const tr = document.createElement("tr");
      tr.className = "hover:bg-slate-900/50 transition-colors cursor-pointer group";

      let rowHtml = `<td class="px-3.5 py-2.5 font-bold text-white flex items-center gap-2">
        <span class="w-1.5 h-1.5 rounded-full ${idx === 0 ? "bg-cyan-400" : idx === 1 ? "bg-indigo-400" : "bg-emerald-400"}"></span>
        ${r.name}
      </td>`;

      (r.values || []).forEach((v, vIdx) => {
        const isOptimal = v.toLowerCase().includes("high") || v.toLowerCase().includes("100k") || v.toLowerCase().includes("< 1ms") || v.toLowerCase().includes("guaranteed");
        rowHtml += `<td class="px-3.5 py-2.5 ${isOptimal ? "text-emerald-400 font-semibold" : "text-slate-300"}">${v}</td>`;
      });

      tr.innerHTML = rowHtml;
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
    container.appendChild(wrapper);
  }

  public destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }
}
