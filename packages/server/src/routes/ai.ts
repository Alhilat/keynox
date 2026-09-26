import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { runNemotronPipeline } from "../services/nemotronPipeline";
import { generatePresentationWithDeepSeek } from "../services/deepseek";
import { createDisconnectGuard } from "../pipeline/disconnectGuard";

const GenerateRequestSchema = z.object({
  topic: z.string().min(1, "Topic cannot be empty"),
  slideCount: z.number().int().min(3).max(25).optional(),
  theme: z.string().optional(),
  archetypes: z.array(z.string()).optional(),
  audience: z.string().optional(),
  language: z.string().optional(),
  engine: z.enum(["gemini", "nvidia", "auto"]).optional(),
});

function isAbortError(err: any): boolean {
  return (
    err?.name === "AbortError" ||
    err?.code === 20 ||
    err?.code === "ABORT_ERR" ||
    /aborted|canceled|cancelled/i.test(err?.message || "")
  );
}

export const aiRoutes: FastifyPluginAsync = async (fastify) => {
  // Shared SSE handler for the Nemotron/Gemini streaming pipeline.
  // Registered under both /stream and /stream-site (legacy alias).
  const handleStream = async (request: FastifyRequest, reply: FastifyReply) => {
    const validatedInput = GenerateRequestSchema.safeParse(request.body);
    if (!validatedInput.success) {
      return reply.status(400).send({ error: "Invalid topic parameter" });
    }

    const { topic, slideCount, theme, engine } = validatedInput.data;

    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.flushHeaders?.();

    const guard = createDisconnectGuard(request);
    const { signal } = guard;
    const safeWrite = (event: unknown) => {
      if (signal.aborted) return;
      if (reply.raw.destroyed || reply.raw.writableEnded) return;
      try {
        reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch {
        guard.dispose();
      }
    };

    try {
      await runNemotronPipeline(
        topic,
        (event) => {
          safeWrite(event);
        },
        slideCount,
        theme,
        engine,
        signal
      );
    } catch (err: any) {
      if (signal.aborted || isAbortError(err)) {
        request.log.info("SSE client disconnected — LLM pipeline aborted");
        return;
      }
      safeWrite({ type: "error", message: err?.message || "Unknown error" });
    } finally {
      guard.dispose();
      try {
        if (!reply.raw.destroyed && !reply.raw.writableEnded) reply.raw.end();
      } catch {
        /* client already gone */
      }
    }
  };

  // Two-Stage Nemotron/Gemini Streaming Pipeline (Nano 30B / Gemini Outline -> Ultra 550B / Gemini Full HTML/CSS/JS Site)
  fastify.post("/stream", handleStream);

  // Alias for stream-site
  fastify.post("/stream-site", handleStream);

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

  // Export Presentation AST or HTML to PowerPoint (.pptx) Endpoint
  fastify.post("/export-pptx", async (request, reply) => {
    try {
      const body = request.body as any;
      if (!body) {
        return reply.status(400).send({ error: "Invalid request payload" });
      }

      let presentation: any = body;
      if (body.html && typeof body.html === "string") {
        const { convertHtmlToPresentationAst } = await import("../pipeline/html-to-ast");
        presentation = convertHtmlToPresentationAst(body.title || body.topic || "Presentation", body.html);
      }

      if (!presentation || !presentation.scenes || !Array.isArray(presentation.scenes)) {
        return reply.status(400).send({ error: "Invalid presentation object or HTML structure" });
      }

      const { exportPresentationToPptx } = await import("../services/pptxExporter");
      const buffer = await exportPresentationToPptx(presentation);

      reply.header("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
      reply.header("Content-Disposition", `attachment; filename="${(presentation.title || "presentation").replace(/[^a-z0-9]/gi, "_")}.pptx"`);
      return reply.send(buffer);
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ error: "Failed to export PPTX", message: err?.message });
    }
  });

  // Slide Presenter Voice Script Endpoint
  fastify.post("/narrate-slide", async (request, reply) => {
    try {
      const { topic, slideTitle, slideContentText } = request.body as {
        topic: string;
        slideTitle: string;
        slideContentText: string;
      };

      const { ttsService } = await import("../services/ttsService");
      const script = await ttsService.generateSlideScript(topic || "Technical Overview", slideTitle || "Slide", slideContentText || "");
      return reply.send({ success: true, script });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ error: "Failed to generate narration", message: err?.message });
    }
  });
};
