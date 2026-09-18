import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { runNemotronPipeline } from "../services/nemotronPipeline";
import { generatePresentationWithDeepSeek, streamPresentationGeneration } from "../services/deepseek";

const GenerateRequestSchema = z.object({
  topic: z.string().min(1, "Topic cannot be empty"),
  slideCount: z.number().int().min(3).max(10).optional(),
  theme: z.string().optional(),
  archetypes: z.array(z.string()).optional(),
  audience: z.string().optional(),
  language: z.string().optional(),
});

export const aiRoutes: FastifyPluginAsync = async (fastify) => {
  // Two-Stage Nemotron Streaming Pipeline (Nano 30B Outline -> Ultra 550B Full HTML/CSS/JS Site)
  fastify.post("/stream", async (request, reply) => {
    const validatedInput = GenerateRequestSchema.safeParse(request.body);
    if (!validatedInput.success) {
      return reply.status(400).send({ error: "Invalid topic parameter" });
    }

    const { topic, slideCount, theme } = validatedInput.data;

    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.flushHeaders?.();

    try {
      await runNemotronPipeline(
        topic,
        (event) => {
          reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
        },
        slideCount,
        theme
      );
    } catch (err: any) {
      reply.raw.write(
        `data: ${JSON.stringify({ type: "error", message: err?.message || "Unknown error" })}\n\n`
      );
    } finally {
      reply.raw.end();
    }
  });

  // Alias for stream-site
  fastify.post("/stream-site", async (request, reply) => {
    const validatedInput = GenerateRequestSchema.safeParse(request.body);
    if (!validatedInput.success) {
      return reply.status(400).send({ error: "Invalid topic parameter" });
    }

    const { topic, slideCount, theme } = validatedInput.data;

    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.flushHeaders?.();

    try {
      await runNemotronPipeline(
        topic,
        (event) => {
          reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
        },
        slideCount,
        theme
      );
    } catch (err: any) {
      reply.raw.write(
        `data: ${JSON.stringify({ type: "error", message: err?.message || "Unknown error" })}\n\n`
      );
    } finally {
      reply.raw.end();
    }
  });

  // Standard non-streaming fallback endpoint
  fastify.post("/generate-presentation", async (request, reply) => {
    try {
      const validatedInput = GenerateRequestSchema.safeParse(request.body);
      if (!validatedInput.success) {
        return reply.status(400).send({
          success: false,
          error: "Invalid request payload",
          details: validatedInput.error.errors,
        });
      }

      const { topic, slideCount } = validatedInput.data;
      const result = await generatePresentationWithDeepSeek({ topic, slideCount });

      return reply.send({
        success: true,
        data: result.presentation,
        reasoning: result.reasoning,
        source: result.source,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: "Failed to generate presentation",
        message: error?.message,
      });
    }
  });

  // High-performance PDF Document Extraction Endpoint with NVIDIA NIM Multimodal Vision
  fastify.post("/extract-pdf", async (request, reply) => {
    try {
      const body = request.body as {
        fileBase64?: string;
        fileName?: string;
        pageImages?: string[];
      };
      
      if (!body || (!body.fileBase64 && (!body.pageImages || body.pageImages.length === 0))) {
        return reply.status(400).send({
          success: false,
          error: "Missing fileBase64 or pageImages parameter",
        });
      }

      const buffer = body.fileBase64 ? Buffer.from(body.fileBase64, "base64") : Buffer.alloc(0);
      const { extractTextFromPdfBuffer } = await import("../services/pdfService");
      const result = await extractTextFromPdfBuffer(buffer, body.fileName, 25, body.pageImages);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({
        success: false,
        error: "Failed to extract PDF document",
        message: err?.message || "Unknown error",
      });
    }
  });

  // AI Photo Generation Endpoint using NVIDIA NIM (FLUX.2-klein-4b / FLUX.1-schnell)
  fastify.post("/generate-image", async (request, reply) => {
    try {
      const body = request.body as {
        prompt: string;
        width?: number;
        height?: number;
        steps?: number;
      };

      if (!body || !body.prompt || !body.prompt.trim()) {
        return reply.status(400).send({
          success: false,
          error: "Prompt is required for photo generation",
        });
      }

      const { generatePhotoWithNvidia } = await import("../services/imageService");
      const result = await generatePhotoWithNvidia({
        prompt: body.prompt.trim(),
        width: body.width,
        height: body.height,
        steps: body.steps,
      });

      return reply.send(result);
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({
        success: false,
        error: "Failed to generate photo with NVIDIA NIM",
        message: err?.message || "Unknown error",
      });
    }
  });
};
