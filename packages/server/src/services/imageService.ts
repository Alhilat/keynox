import { config } from "../config";

export interface GenerateImageOptions {
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  timeoutMs?: number;
}

export interface GenerateImageResult {
  success: boolean;
  imageUrl: string;
  model: string;
  seed?: number;
  prompt: string;
  provider: string;
  latencyMs: number;
}

/**
 * Creates an elegant obsidian SVG visual fallback if AI photo generation times out or is rate limited.
 */
export function createFallbackPhotoSvg(prompt: string): string {
  const cleanPrompt = prompt.replace(/[<>&"']/g, "").slice(0, 75);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 576" width="1024" height="576">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070a13"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="grid" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.1"/>
      <stop offset="50%" stop-color="#818cf8" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.1"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect width="100%" height="100%" fill="url(#glow)"/>
  
  <!-- Circuit / Architectural Grid Lines -->
  <line x1="0" y1="144" x2="1024" y2="144" stroke="url(#grid)" stroke-width="1"/>
  <line x1="0" y1="288" x2="1024" y2="288" stroke="url(#grid)" stroke-width="1"/>
  <line x1="0" y1="432" x2="1024" y2="432" stroke="url(#grid)" stroke-width="1"/>
  <line x1="256" y1="0" x2="256" y2="576" stroke="url(#grid)" stroke-width="1"/>
  <line x1="512" y1="0" x2="512" y2="576" stroke="url(#grid)" stroke-width="1.5"/>
  <line x1="768" y1="0" x2="768" y2="576" stroke="url(#grid)" stroke-width="1"/>
  
  <!-- Central Conceptual Emblem -->
  <circle cx="512" cy="240" r="80" fill="#0f172a" stroke="#38bdf8" stroke-width="2.5" opacity="0.9"/>
  <circle cx="512" cy="240" r="60" fill="none" stroke="#818cf8" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.8"/>
  <circle cx="512" cy="240" r="8" fill="#38bdf8"/>
  
  <!-- Node Indicators -->
  <circle cx="380" cy="240" r="5" fill="#818cf8"/>
  <line x1="385" y1="240" x2="432" y2="240" stroke="#818cf8" stroke-width="2"/>
  <circle cx="644" cy="240" r="5" fill="#34d399"/>
  <line x1="592" y1="240" x2="639" y2="240" stroke="#34d399" stroke-width="2"/>
  
  <!-- Badge & Prompt Label -->
  <rect x="362" y="360" width="300" height="28" rx="14" fill="rgba(56, 189, 248, 0.1)" stroke="rgba(56, 189, 248, 0.3)" stroke-width="1"/>
  <text x="512" y="378" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="11" font-weight="700" text-anchor="middle" letter-spacing="1">ARCHITECTURAL SYSTEM VISUAL</text>
  <text x="512" y="420" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="15" font-weight="500" text-anchor="middle">${cleanPrompt}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Service to generate photorealistic images using NVIDIA NIM Free APIs
 * Primary Model: black-forest-labs/flux.2-klein-4b (Ultra-fast, ~2-3s inference)
 * Fallback Model: black-forest-labs/flux.1-schnell
 * Graceful Fallback: Obsidian Vector SVG Card (guaranteed <5ms return if API is rate-limited)
 */
export async function generatePhotoWithNvidia(
  options: GenerateImageOptions
): Promise<GenerateImageResult> {
  const { prompt, width = 1024, height = 576, steps = 2, timeoutMs = 8000 } = options;

  if (!prompt || !prompt.trim()) {
    throw new Error("Prompt is required for photo generation");
  }

  const primaryUrl = "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b";
  const fallbackUrl = "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell";

  const apiKey =
    config.nvidiaApiKey ||
    process.env.NVIDIA_API_KEY ||
    config.nvidiaApiKeyUltra ||
    process.env.NVIDIA_API_KEY_ULTRA;

  const startTime = Date.now();

  if (!apiKey) {
    console.warn("[ImageService] Missing NVIDIA API key. Using SVG fallback.");
    return {
      success: true,
      imageUrl: createFallbackPhotoSvg(prompt),
      model: "Obsidian Vector Fallback",
      prompt,
      provider: "HyperDeck Runtime",
      latencyMs: Date.now() - startTime,
    };
  }

  // Attempt 1: FLUX.2-klein-4b with strict timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const payload = {
      prompt: prompt.trim(),
      width,
      height,
      steps: Math.min(Math.max(steps, 1), 4),
    };

    const res = await fetch(primaryUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (res.ok) {
      const data = (await res.json()) as any;
      if (data.artifacts && data.artifacts[0] && data.artifacts[0].base64) {
        const artifact = data.artifacts[0];
        const imageUrl = `data:image/jpeg;base64,${artifact.base64}`;
        return {
          success: true,
          imageUrl,
          model: "FLUX.2-klein-4b",
          seed: artifact.seed,
          prompt,
          provider: "NVIDIA NIM FLUX.2",
          latencyMs: Date.now() - startTime,
        };
      }
    } else {
      const errText = await res.text().catch(() => "Unknown status");
      console.warn(`[ImageService] Primary model returned ${res.status}: ${errText.slice(0, 150)}. Trying fallback...`);
    }
  } catch (err: any) {
    console.warn(`[ImageService] Primary FLUX.2 error/timeout: ${err?.message || err}. Trying fallback...`);
  }

  // Attempt 2: FLUX.1-schnell with strict timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const fallbackPayload = {
      prompt: prompt.trim(),
      steps: 4,
    };

    const resFallback = await fetch(fallbackUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(fallbackPayload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (resFallback.ok) {
      const data = (await resFallback.json()) as any;
      if (data.artifacts && data.artifacts[0] && data.artifacts[0].base64) {
        const artifact = data.artifacts[0];
        const imageUrl = `data:image/jpeg;base64,${artifact.base64}`;
        return {
          success: true,
          imageUrl,
          model: "FLUX.1-schnell",
          seed: artifact.seed,
          prompt,
          provider: "NVIDIA NIM FLUX.1",
          latencyMs: Date.now() - startTime,
        };
      }
    }
  } catch (err: any) {
    console.warn(`[ImageService] Fallback FLUX.1 error:`, err?.message || err);
  }

  // Guaranteed Fallback: Return clean SVG so the presentation synthesis NEVER hangs
  console.log(`[ImageService] Using guaranteed SVG fallback for: "${prompt.slice(0, 45)}..."`);
  return {
    success: true,
    imageUrl: createFallbackPhotoSvg(prompt),
    model: "Obsidian Vector Fallback",
    prompt,
    provider: "HyperDeck Design System",
    latencyMs: Date.now() - startTime,
  };
}
