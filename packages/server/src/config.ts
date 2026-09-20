import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

// Load .env from package root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const ConfigSchema = z.object({
  port: z.coerce.number().default(3001),
  nvidiaApiKey: z.string().default(""),
  nvidiaApiKeyNano: z.string().default(""),
  nvidiaApiKeyUltra: z.string().default(""),
  nvidiaBaseUrl: z.string().default("https://integrate.api.nvidia.com/v1"),
  nvidiaModel: z.string().default("deepseek-ai/deepseek-v4-flash-0731"),
  geminiApiKey: z.string().default(""),
  geminiModel: z.string().default("gemini-3.5-flash-lite"),
  geminiBaseUrl: z.string().default("https://generativelanguage.googleapis.com/v1beta/openai"),
  defaultAiProvider: z.enum(["gemini", "nvidia", "auto"]).default("gemini"),
});

const rawConfig = {
  port: process.env.PORT,
  nvidiaApiKey: process.env.NVIDIA_API_KEY || "",
  nvidiaApiKeyNano: process.env.NVIDIA_API_KEY_NANO || process.env.NVIDIA_API_KEY || "",
  nvidiaApiKeyUltra: process.env.NVIDIA_API_KEY_ULTRA || process.env.NVIDIA_API_KEY || "",
  nvidiaBaseUrl: process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
  nvidiaModel: process.env.NVIDIA_MODEL || "deepseek-ai/deepseek-v4-flash-0731",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
  geminiBaseUrl: process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai",
  defaultAiProvider: (process.env.DEFAULT_AI_PROVIDER as any) || "gemini",
};

export const config = ConfigSchema.parse(rawConfig);
