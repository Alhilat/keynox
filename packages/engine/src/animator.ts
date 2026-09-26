import gsap from "gsap";
import { StepAction } from "@presentation/schema";
import { PresentationAudio } from "./sound";

export class GSAPAnimator {
  private activeTimelines: gsap.core.Timeline[] = [];
  public audio: PresentationAudio;

  constructor(audio?: PresentationAudio) {
    this.audio = audio || new PresentationAudio();
  }

  /**
   * Execute a controlled animation action on target DOM elements
   */
  public async executeAction(action: StepAction, container: HTMLElement): Promise<void> {
    const tl = gsap.timeline();
    this.activeTimelines.push(tl);

    switch (action.action) {
      case "move": {
        const el = container.querySelector(`[data-id="${action.target}"]`) as HTMLElement;
        if (!el) return;
        this.audio.playMoveWhoosh();

        const toX = action.to.x !== undefined ? action.to.x * 1.33 : 0;
        const toY = action.to.y !== undefined ? action.to.y * 1.33 : 0;

        try {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        } catch (e) {}

        await tl.to(el, {
          x: toX,
          y: toY,
          duration: action.duration,
          ease: action.ease || "power2.out",
        });
        break;
      }

      case "fadeIn": {
        const el = container.querySelector(`[data-id="${action.target}"]`) as HTMLElement;
        if (!el) return;
        await tl.to(el, {
          opacity: 1,
          duration: action.duration,
          ease: "power1.inOut",
        });
        break;
      }

      case "fadeOut": {
        const el = container.querySelector(`[data-id="${action.target}"]`) as HTMLElement;
        if (!el) return;
        await tl.to(el, {
          opacity: 0,
          duration: action.duration,
          ease: "power1.inOut",
        });
        break;
      }

      case "scale": {
        const el = container.querySelector(`[data-id="${action.target}"]`) as HTMLElement;
        if (!el) return;
        this.audio.playStepClick();
        await tl.to(el, {
          scale: action.scale,
          duration: action.duration,
          ease: "back.out(1.7)",
        });
        break;
      }

      case "rotate": {
        const el = container.querySelector(`[data-id="${action.target}"]`) as HTMLElement;
        if (!el) return;
        await tl.to(el, {
          rotation: action.angle,
          duration: action.duration,
          ease: "power2.out",
        });
        break;
      }

      case "highlight": {
        const el = container.querySelector(`[data-id="${action.target}"]`) as HTMLElement;
        if (!el) return;
        this.audio.playHighlightPing();

        try {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        } catch (e) {}

        // Check if final green highlight
        if (action.color.includes("10b981") || action.color.includes("green") || action.color.includes("emerald")) {
          this.audio.playSuccessChime();
        }

        const isCard = el.classList.contains("presentation-card");
        if (isCard) {
          // Spotlight: dim sibling cards so active card stands out
          const siblingCards = container.querySelectorAll(".presentation-card");
          siblingCards.forEach((card) => {
            if (card !== el) {
              gsap.to(card, { opacity: 0.45, duration: 0.4 });
            }
          });
          await tl
            .to(el, {
              opacity: 1,
              scale: action.pulse ? 1.04 : 1.02,
              borderColor: action.color,
              boxShadow: `0 0 30px ${action.color}50`,
              duration: action.duration * 0.5,
              ease: "power2.out",
            })
            .to(el, {
              scale: 1,
              duration: action.duration * 0.5,
              ease: "power2.inOut",
            });
        } else {
          await tl
            .to(el, {
              color: action.color,
              boxShadow: `0 0 25px ${action.color}40`,
              borderColor: action.color,
              textShadow: `0 0 20px ${action.color}, 0 0 35px ${action.color}`,
              scale: action.pulse ? 1.25 : 1.1,
              duration: action.duration * 0.5,
              ease: "power2.out",
            })
            .to(el, {
              scale: 1,
              duration: action.duration * 0.5,
              ease: "power2.in",
            });
        }
        break;
      }

      case "transform": {
        const el = container.querySelector(`[data-id="${action.target}"]`) as HTMLElement;
        if (!el) return;

        try {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        } catch (e) {}

        await tl
          .to(el, {
            opacity: 0,
            scale: 0.6,
            duration: action.duration * 0.4,
            ease: "power1.in",
          })
          .add(() => {
            el.textContent = action.toContent;
          })
          .to(el, {
            opacity: 1,
            scale: 1,
            duration: action.duration * 0.6,
            ease: "back.out(1.8)",
          });
        break;
      }

      case "replace": {
        const targets = action.targets
          .map((id) => container.querySelector(`[data-id="${id}"]`) as HTMLElement)
          .filter(Boolean);

        if (targets.length === 0) return;

        const firstTarget = targets[0];
        const parent = firstTarget.parentElement;
        if (!parent) return;

        this.audio.playStepClick();

        // Create replacement DOM token
        const newEl = document.createElement("span");
        newEl.setAttribute("data-id", action.with.id);
        newEl.className = `math-token math-token-${action.with.type || "term"} inline-flex items-center justify-center mx-2 px-3 py-1 rounded-xl font-bold transition-colors`;
        newEl.textContent = action.with.text;
        newEl.style.opacity = "0";
        newEl.style.transform = "scale(0.5)";

        await tl
          .to(targets, {
            opacity: 0,
            scale: 0.4,
            duration: action.duration * 0.4,
            ease: "power1.in",
          })
          .add(() => {
            firstTarget.replaceWith(newEl);
            for (let i = 1; i < targets.length; i++) {
              targets[i].remove();
            }
          })
          .to(newEl, {
            opacity: 1,
            scale: 1.15,
            color: "#38bdf8",
            duration: action.duration * 0.4,
            ease: "back.out(1.8)",
          })
          .to(newEl, {
            scale: 1,
            color: "#ffffff",
            duration: action.duration * 0.2,
          });
        break;
      }
    }
  }

  public killAll(): void {
    this.activeTimelines.forEach((tl) => tl.kill());
    this.activeTimelines = [];
  }
}
