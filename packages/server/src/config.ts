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
});

const rawConfig = {
  port: process.env.PORT,
  nvidiaApiKey: process.env.NVIDIA_API_KEY || "",
  nvidiaApiKeyNano: process.env.NVIDIA_API_KEY_NANO || process.env.NVIDIA_API_KEY || "",
  nvidiaApiKeyUltra: process.env.NVIDIA_API_KEY_ULTRA || process.env.NVIDIA_API_KEY || "",
  nvidiaBaseUrl: process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
  nvidiaModel: process.env.NVIDIA_MODEL || "deepseek-ai/deepseek-v4-flash-0731",
};

export const config = ConfigSchema.parse(rawConfig);
