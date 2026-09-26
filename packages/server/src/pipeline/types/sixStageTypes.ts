export interface TechnicalPayloadItem {
  id: string;
  type: "formula" | "code" | "stat" | "quote" | "definition" | "command";
  label: string;
  content: string;
  slide_hint?: string;
  importance?: "critical" | "high" | "medium";
}

export interface Stage1Extraction {
  core_thesis: string;
  target_audience: string;
  slide_count: number;
  domain: "tech" | "science" | "business" | "education" | "other";
  tone: "formal" | "casual" | "cinematic" | "academic";
  key_concepts: string[];
  content_types_needed: {
    has_math: boolean;
    has_data: boolean;
    has_timeline: boolean;
    has_comparison: boolean;
    has_code: boolean;
    has_diagrams: boolean;
  };
  technical_payload: TechnicalPayloadItem[];
}

export interface Stage2SlideStrategy {
  index: number;
  purpose: "hook" | "concept" | "proof" | "data" | "demo" | "transition" | "closing";
  title: string;
  content_summary: string;
  content_type: "text" | "math" | "chart" | "timeline" | "comparison" | "code" | "simulator" | "quote";
  technical_payload_refs: string[];
  animation_energy: "calm" | "dynamic" | "explosive" | "subtle";
  is_hero: boolean;
  narrative_weight: "light" | "medium" | "heavy";
}

export interface Stage2Strategy {
  slides: Stage2SlideStrategy[];
  visual_direction: "dark" | "light" | "gradient" | "minimal" | "bold";
  color_hint: string;
}

export interface Stage3SlideBrief {
  index: number;
  mood: string;
  layout: string;
  visual_concept: string;
  local_overrides?: {
    "--color-bg"?: string | null;
    "--color-accent"?: string | null;
  };
  typography: {
    title_weight: "100" | "400" | "700" | "900" | string;
    title_size: string;
    title_transform: "uppercase" | "lowercase" | "none" | string;
    body_weight: "300" | "400" | string;
  };
  animation_sequence: string[];
  special_element?: string | null;
}

export interface Stage3ArtDirection {
  global: {
    font_primary: string;
    font_mono: string;
    transition_style: "morph" | "slide" | "fade" | "zoom" | string;
    css_vars: {
      "--color-bg": string;
      "--color-primary": string;
      "--color-accent": string;
      "--color-text": string;
      "--color-muted": string;
    };
  };
  slides: Stage3SlideBrief[];
}

export interface Stage4SlideResult {
  index: number;
  html: string;
}

export interface Stage5AuditResult {
  index: number;
  status: "approved" | "repaired" | "sanitized" | "failed";
  html: string;
  violationsFixed?: string[];
}
