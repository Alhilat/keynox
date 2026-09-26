/**
 * Presentation Generator Subsystem Index
 * 
 * Modular components powering Stage 3 creative slide synthesis:
 * - storyboardParser: Divides Stage 2 storyboards into structured slide directives
 * - slidePrompts: Design system vocabulary and per-slide prompt builder
 * - slideValidator: HTML structural gate and tone sanitizer
 * - fallbackSlide: Robust fallback synthesis when AI models timeout or err
 */

export { parseStoryboardIntoSlides } from "./storyboardParser";
export { DESIGN_SYSTEM_VOCABULARY, buildSingleSlidePrompt } from "./slidePrompts";
export { isValidSlideHtml, sanitizeAiTone } from "./slideValidator";
export { synthesizeFallbackSlide } from "./fallbackSlide";
