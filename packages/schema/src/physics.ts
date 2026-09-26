import { z } from "zod";

/** A tunable input variable for a physics simulator, rendered as a range slider. */
export const PhysicsVariableSchema = z.object({
  symbol: z.string().min(1),
  label: z.string().min(1),
  unit: z.string(),
  min: z.number(),
  max: z.number(),
  default: z.number(),
  step: z.number().positive(),
});

/** The computed output of a physics simulator. */
export const PhysicsOutputSchema = z.object({
  symbol: z.string().min(1),
  label: z.string().min(1),
  unit: z.string(),
});

/** Canvas visualization backing a physics simulator. */
export const PhysicsVisualTypeSchema = z.enum([
  "projectile",
  "wave",
  "circuit",
  "vector-field",
  "spring-mass",
  "pendulum",
  "collision",
  "field-lines",
]);

/** Full configuration for a physics-slider interactive widget. */
export const PhysicsSliderConfigSchema = z.object({
  formula: z.string().min(1),
  variables: z.array(PhysicsVariableSchema).min(1),
  output: PhysicsOutputSchema,
  visualType: PhysicsVisualTypeSchema,
});

export type PhysicsVariable = z.infer<typeof PhysicsVariableSchema>;
export type PhysicsOutput = z.infer<typeof PhysicsOutputSchema>;
export type PhysicsVisualType = z.infer<typeof PhysicsVisualTypeSchema>;
export type PhysicsSliderConfig = z.infer<typeof PhysicsSliderConfigSchema>;

/** Type guard: true when a widget config is a typed physics slider config. */
export function isPhysicsSliderConfig(config: unknown): config is PhysicsSliderConfig {
  return PhysicsSliderConfigSchema.safeParse(config).success;
}

/** Schemaless key/value view of code-block and comparison-matrix widget configs. */
export interface FreeWidgetConfig {
  code?: unknown;
  language?: unknown;
  filename?: unknown;
  columns?: unknown;
  rows?: unknown;
}

/** Returns the schemaless view of a widget config (empty for physics configs). */
export function freeWidgetConfig(config: unknown): FreeWidgetConfig {
  if (config !== null && typeof config === "object" && !isPhysicsSliderConfig(config)) {
    return config as FreeWidgetConfig;
  }
  return {};
}

/** Returns the value when it is a non-empty string, otherwise the fallback. */
export function textOr(value: unknown, fallback?: unknown): string | undefined {
  if (typeof value === "string" && value !== "") return value;
  return typeof fallback === "string" && fallback !== "" ? fallback : undefined;
}
