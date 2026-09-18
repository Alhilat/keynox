import { z } from "zod";
import { StepActionSchema } from "./actions";

// Token for fine-grained equation manipulation
export const MathTokenSchema = z.object({
  id: z.string(),
  text: z.string(),
  type: z.enum(["variable", "operator", "constant", "term", "group"]).default("term"),
  color: z.string().optional(),
  highlight: z.boolean().default(false).optional(),
});

// Element types
export const BaseElementSchema = z.object({
  id: z.string(),
  x: z.number().default(100).optional(),
  y: z.number().default(100).optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  rotation: z.number().default(0).optional(),
  scale: z.number().default(1).optional(),
  opacity: z.number().default(1).optional(),
  style: z.record(z.any()).optional(),
});

export const EquationElementSchema = BaseElementSchema.extend({
  type: z.literal("equation"),
  rawEquation: z.string().default(""),
  tokens: z.array(MathTokenSchema).default([]),
  fontSize: z.number().default(38).optional(),
});

export const TextElementSchema = BaseElementSchema.extend({
  type: z.literal("text"),
  content: z.string(),
  fontSize: z.number().default(24).optional(),
  fontWeight: z.string().default("normal").optional(),
  color: z.string().default("#ffffff").optional(),
  textAlign: z.enum(["left", "center", "right"]).default("left").optional(),
});

export const ShapeElementSchema = BaseElementSchema.extend({
  type: z.literal("shape"),
  shapeType: z.enum(["rectangle", "circle", "arrow", "badge"]).default("rectangle"),
  fill: z.string().default("#3b82f6"),
  stroke: z.string().optional(),
  strokeWidth: z.number().default(0).optional(),
  borderRadius: z.number().default(8).optional(),
});

export const CardElementSchema = BaseElementSchema.extend({
  type: z.literal("card"),
  title: z.string(),
  tag: z.string().optional(),
  badge: z.string().optional(),
  description: z.string().optional(),
  points: z.array(z.string()).default([]),
  accentColor: z.string().default("#38bdf8").optional(),
  icon: z.string().optional(),
});

export const ImageElementSchema = BaseElementSchema.extend({
  type: z.literal("image"),
  src: z.string(),
  alt: z.string().default("presentation asset").optional(),
});

export const InteractiveWidgetElementSchema = BaseElementSchema.extend({
  type: z.literal("interactive-widget"),
  widgetType: z.enum(["boolean-simulator", "code-block", "comparison-matrix", "physics-slider"]).default("boolean-simulator"),
  title: z.string().optional(),
  config: z.record(z.any()).default({}).optional(),
});

export const ElementSchema = z.discriminatedUnion("type", [
  EquationElementSchema,
  TextElementSchema,
  CardElementSchema,
  ShapeElementSchema,
  ImageElementSchema,
  InteractiveWidgetElementSchema,
]);

// Step with sequential actions
export const StepSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  actions: z.array(StepActionSchema).default([]),
});

// Scene / Slide Layout
export const SceneLayoutSchema = z.enum(["hero", "cards", "split", "timeline", "stat", "standard"]).default("standard");

// Scene / Slide
export const SceneSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  category: z.string().optional(),
  layout: SceneLayoutSchema.optional(),
  elements: z.array(ElementSchema).default([]),
  steps: z.array(StepSchema).default([]),
});

// Root Presentation document
export const PresentationMetadataSchema = z.object({
  topic: z.string().optional(),
  audience: z.string().optional(),
  language: z.string().default("English").optional(),
  createdAt: z.string().optional(),
  model: z.string().optional(),
});

export const PresentationSchema = z.object({
  version: z.number().default(1),
  title: z.string(),
  metadata: PresentationMetadataSchema.default({}),
  scenes: z.array(SceneSchema).min(1),
});

export type MathToken = z.infer<typeof MathTokenSchema>;
export type Element = z.infer<typeof ElementSchema>;
export type EquationElement = z.infer<typeof EquationElementSchema>;
export type TextElement = z.infer<typeof TextElementSchema>;
export type CardElement = z.infer<typeof CardElementSchema>;
export type ShapeElement = z.infer<typeof ShapeElementSchema>;
export type ImageElement = z.infer<typeof ImageElementSchema>;
export type InteractiveWidgetElement = z.infer<typeof InteractiveWidgetElementSchema>;
export type Step = z.infer<typeof StepSchema>;
export type SceneLayout = z.infer<typeof SceneLayoutSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type PresentationMetadata = z.infer<typeof PresentationMetadataSchema>;
export type Presentation = z.infer<typeof PresentationSchema>;

