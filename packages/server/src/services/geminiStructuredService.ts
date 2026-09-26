/**
 * Native Gemini Structured JSON Schema Service
 * 
 * Uses @google/genai GoogleGenAI SDK with responseSchema enforcement
 * as a robust fallback for generating valid Presentation AST objects directly.
 */

import { GoogleGenAI, Type } from "@google/genai";
import { config } from "../config";
import { Presentation } from "@presentation/schema";

export class GeminiStructuredService {
  private ai: GoogleGenAI | null = null;

  private getAi(): GoogleGenAI {
    if (!this.ai) {
      const apiKey = config.geminiApiKey;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured");
      }
      this.ai = new GoogleGenAI({ apiKey });
    }
    return this.ai;
  }

  public isAvailable(): boolean {
    return Boolean(config.geminiApiKey && config.geminiApiKey.trim().length > 10);
  }

  /**
   * Generates a structured Presentation AST matching PresentationSchema directly using Gemini responseSchema
   */
  public async generateStructuredPresentation(
    topic: string,
    slideCount: number = 5
  ): Promise<Presentation> {
    const ai = this.getAi();

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        version: { type: Type.INTEGER },
        title: { type: Type.STRING },
        metadata: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            model: { type: Type.STRING },
            createdAt: { type: Type.STRING },
          },
          required: ["topic", "model", "createdAt"],
        },
        scenes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              category: { type: Type.STRING },
              layout: { type: Type.STRING },
              elements: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    badge: { type: Type.STRING },
                    accentColor: { type: Type.STRING },
                    points: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: ["id", "type", "title"],
                },
              },
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    actions: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          action: { type: Type.STRING },
                          target: { type: Type.STRING },
                          color: { type: Type.STRING },
                          duration: { type: Type.NUMBER },
                          pulse: { type: Type.BOOLEAN },
                        },
                        required: ["action", "target"],
                      },
                    },
                  },
                  required: ["id", "title", "description", "actions"],
                },
              },
            },
            required: ["id", "title", "layout", "elements", "steps"],
          },
        },
      },
      required: ["version", "title", "metadata", "scenes"],
    };

    const prompt = `You are Keynox AI Presentation Compiler.
Generate a structured JSON presentation deck for the topic: "${topic}".
Total Slides: ${slideCount}.
Ensure each scene has structured concept cards and step-by-step GSAP animation actions highlighting elements.`;

    const response = await ai.models.generateContent({
      model: config.geminiModel || "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema as any,
        temperature: 0.3,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned empty structured output");
    }

    return JSON.parse(text) as Presentation;
  }
}

export const geminiStructuredService = new GeminiStructuredService();
