import { Memory, VoltAgent } from "@voltagent/core";
import { LibSQLMemoryAdapter } from "@voltagent/libsql";
import { honoServer } from "@voltagent/server-hono";

import { createMarketingSalesAssistant } from "./agent.js";
import { loadKnowledgeBase, summarizeKnowledgeBase } from "./knowledgebase.js";
import { RecommendRequestSchema } from "./schemas.js";
import { recommendNextActionWorkflow } from "./workflow.js";

const port = Number(process.env.PORT ?? 3141);

export const memory = new Memory({
  storage: new LibSQLMemoryAdapter({
    url: process.env.VOLTAGENT_MEMORY_URL ?? "file:./.voltagent/memory.db",
  }),
});

export const marketingSalesAssistant = createMarketingSalesAssistant(memory);

export const voltAgent = new VoltAgent({
  agents: {
    marketingSalesAssistant,
  },
  workflows: {
    recommendNextActionWorkflow,
  },
  memory,
  server: honoServer({
    port,
    enableSwaggerUI: true,
    cors: {
      origin: "*",
      allowHeaders: [
        "Content-Type",
        "Authorization",
        "x-voltagent-dev",
        "X-VoltAgent-Dev",
      ],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    },
    configureApp: (app) => {
      app.get("/api/health", (c) =>
        c.json({
          status: "ok",
          service: "reonic-marketing-agent",
          port,
        }),
      );

      app.get("/api/knowledgebase/summary", (c) =>
        c.json({
          status: "ok",
          knowledgebase: summarizeKnowledgeBase(loadKnowledgeBase()),
        }),
      );

      app.post("/api/recommend-next-action", async (c) => {
        let body: unknown;
        try {
          body = await c.req.json();
        } catch {
          return c.json({ error: "Request body must be valid JSON." }, 400);
        }

        const parsed = RecommendRequestSchema.safeParse(body);
        if (!parsed.success) {
          return c.json(
            {
              error: "Invalid recommendation request.",
              issues: parsed.error.issues,
            },
            400,
          );
        }

        const execution = await recommendNextActionWorkflow.run(parsed.data);
        if (execution.status !== "completed" || execution.result === null) {
          return c.json(
            {
              error: "Recommendation workflow did not complete.",
              status: execution.status,
              executionId: execution.executionId,
            },
            500,
          );
        }

        return c.json(execution.result);
      });
    },
  }),
});

void voltAgent.ready.then(() => {
  console.log(`Reonic marketing agent listening on http://localhost:${port}`);
  console.log(`Custom endpoint: POST http://localhost:${port}/api/recommend-next-action`);
});
