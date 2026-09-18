import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config";
import { aiRoutes } from "./routes/ai";

const server = Fastify({
  logger: true,
  bodyLimit: 50 * 1024 * 1024, // 50MB for high-resolution PDF canvas snapshots and vision models
});

async function start() {
  try {
    await server.register(cors, {
      origin: true, // Allow frontend dev server
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    });

    server.get("/health", async () => {
      return { status: "ok", timestamp: new Date().toISOString() };
    });

    await server.register(aiRoutes, { prefix: "/api/ai" });

    await server.listen({ port: config.port, host: "0.0.0.0" });
    console.log(`🚀 Presentation Server running on http://localhost:${config.port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
