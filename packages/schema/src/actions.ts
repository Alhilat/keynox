import { z } from "zod";

// Base coordinates schema
export const PointSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
});

// Controlled GSAP animation actions
export const MoveActionSchema = z.object({
  action: z.literal("move"),
  target: z.string().describe("ID of the element or math token to move"),
  to: PointSchema.default({ x: 0, y: 0 }).describe("Target coordinates (relative or absolute)"),
  duration: z.number().default(0.8).describe("Animation duration in seconds"),
  ease: z.string().default("power2.out").optional(),
});

export const FadeInActionSchema = z.object({
  action: z.literal("fadeIn"),
  target: z.string().describe("ID of the element or token to fade in"),
  duration: z.number().default(0.5).describe("Duration in seconds"),
});

export const FadeOutActionSchema = z.object({
  action: z.literal("fadeOut"),
  target: z.string().describe("ID of the element or token to fade out"),
  duration: z.number().default(0.5).describe("Duration in seconds"),
});

export const ScaleActionSchema = z.object({
  action: z.literal("scale"),
  target: z.string().describe("ID of the element or token to scale"),
  scale: z.number().describe("Scale multiplier, e.g. 1.2 or 0.8"),
  duration: z.number().default(0.6).describe("Duration in seconds"),
});

export const RotateActionSchema = z.object({
  action: z.literal("rotate"),
  target: z.string(),
  angle: z.number().describe("Rotation angle in degrees"),
  duration: z.number().default(0.6),
});

export const HighlightActionSchema = z.object({
  action: z.literal("highlight"),
  target: z.string().describe("ID of the element or math token to highlight"),
  color: z.string().default("#f59e0b").describe("Highlight color hex or rgb"),
  duration: z.number().default(0.5),
  pulse: z.boolean().default(true).optional(),
});

export const TransformActionSchema = z.object({
  action: z.literal("transform"),
  target: z.string().describe("ID of the element or math token to transform"),
  toContent: z.string().describe("New text or expression content"),
  duration: z.number().default(0.6),
});

export const ReplaceActionSchema = z.object({
  action: z.literal("replace"),
  targets: z.array(z.string()).describe("IDs of tokens/elements to replace"),
  with: z.object({
    id: z.string(),
    text: z.string(),
    type: z.string().optional(),
  }).describe("Replacement token or element"),
  duration: z.number().default(0.7),
});

export const StepActionSchema = z.discriminatedUnion("action", [
  MoveActionSchema,
  FadeInActionSchema,
  FadeOutActionSchema,
  ScaleActionSchema,
  RotateActionSchema,
  HighlightActionSchema,
  TransformActionSchema,
  ReplaceActionSchema,
]);

export type Point = z.infer<typeof PointSchema>;
export type StepAction = z.infer<typeof StepActionSchema>;
export type MoveAction = z.infer<typeof MoveActionSchema>;
export type HighlightAction = z.infer<typeof HighlightActionSchema>;
export type TransformAction = z.infer<typeof TransformActionSchema>;
export type ReplaceAction = z.infer<typeof ReplaceActionSchema>;
