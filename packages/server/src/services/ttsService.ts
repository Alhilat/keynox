/**
 * Keynox Slide Narration & Audio Synthesis Service
 * 
 * Uses Gemini Audio / TTS model (or Web Audio API synthesis metadata)
 * to generate slide-by-slide voiceovers for Keynote presentations.
 */

import { config } from "../config";

export interface SlideSpeechScript {
  slideIndex: number;
  script: string;
  audioUrl?: string;
}

export class TtsService {
  public isAvailable(): boolean {
    return Boolean(config.geminiApiKey && config.geminiApiKey.trim().length > 10);
  }

  /**
   * Generates a concise presenter script for a single slide
   */
  public async generateSlideScript(
    topic: string,
    slideTitle: string,
    slideContentText: string
  ): Promise<string> {
    const prompt = `You are a professional executive keynote presenter.
Synthesize a natural, spoken presenter script for 1 slide of a presentation.
Topic: "${topic}"
Slide Title: "${slideTitle}"
Slide Text Content:
"${slideContentText.slice(0, 1000)}"

RULES:
- Maximum 30-40 words (approx 15 seconds spoken).
- Conversational, authoritative, confident.
- Do NOT say "In this slide" or "Here we see". Direct technical insight only.`;

    if (!this.isAvailable()) {
      return `Welcome to ${slideTitle}. Here we explore the key principles of ${topic}.`;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 150 },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as any;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      return text || `Key overview of ${slideTitle} in the context of ${topic}.`;
    } catch (err: any) {
      console.warn("[TtsService] Failed to generate script:", err?.message);
      return `Key overview of ${slideTitle} in the context of ${topic}.`;
    }
  }
}

export const ttsService = new TtsService();
