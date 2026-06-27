import { Memory, VoltAgent, VoltAgentObservability } from "@voltagent/core";
import { LibSQLMemoryAdapter } from "@voltagent/libsql";
import { honoServer } from "@voltagent/server-hono";

import { createMarketingSalesAssistant } from "./agent.js";
import { loadKnowledgeBase, summarizeKnowledgeBase } from "./knowledgebase.js";
import { RecommendRequestSchema, type RecommendRequest } from "./schemas.js";
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
  // Records spans in-memory and streams them over WebSocket so the VoltOps console
  // (console.voltagent.dev -> localhost:3141) shows live runs without cloud keys.
  observability: new VoltAgentObservability(),
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

        // The workflow's final step already ran LLM synthesis.
        return c.json(execution.result);
      });

      app.post("/api/recommend-next-action/stream", async (c) => {
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

        return c.body(createRecommendationStream(parsed.data), 200, {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        });
      });
    },
  }),
});

void voltAgent.ready.then(() => {
  console.log(`Reonic marketing agent listening on http://localhost:${port}`);
  console.log(`Custom endpoint: POST http://localhost:${port}/api/recommend-next-action`);
});

function createRecommendationStream(request: RecommendRequest) {
  const encoder = new TextEncoder();
  let sequence = 0;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, payload: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`),
        );
      };

      const trace = (payload: {
        phase: string;
        title: string;
        detail?: string;
        status: "pending" | "running" | "success" | "error";
        durationMs?: number;
      }) => {
        send("trace", {
          id: `agent_trace_${++sequence}`,
          source: "voltagent",
          timestamp: new Date().toISOString(),
          ...payload,
        });
      };

      void (async () => {
        const startedAt = Date.now();
        try {
          trace({
            phase: "workflow",
            title: "Starting VoltAgent workflow",
            detail: request.trigger.type,
            status: "running",
          });

          const stream = recommendNextActionWorkflow.stream(request);
          for await (const event of stream) {
            const mapped = mapWorkflowEvent(event);
            if (mapped) {
              trace(mapped);
            }
          }

          // The workflow's final step already ran LLM synthesis.
          const recommendation = await stream.result;
          if (recommendation === null) {
            throw new Error("Recommendation workflow ended without a result");
          }

          trace({
            phase: "complete",
            title: "Agent run complete",
            detail: recommendation.nextBestAction.taskType,
            status: "success",
            durationMs: Date.now() - startedAt,
          });
          send("result", recommendation);
        } catch (error) {
          trace({
            phase: "error",
            title: "Agent run failed",
            detail: error instanceof Error ? error.message : String(error),
            status: "error",
          });
          send("error", {
            error: error instanceof Error ? error.message : "Unexpected agent stream error",
          });
        } finally {
          controller.close();
        }
      })();
    },
  });
}

function mapWorkflowEvent(event: unknown) {
  const item = event as {
    type?: string;
    from?: string;
    status?: "pending" | "running" | "success" | "error" | "suspended";
    metadata?: Record<string, unknown>;
  };

  if (item.type === "agent-progress") {
    const detail = item.metadata?.detail ? String(item.metadata.detail) : undefined;
    return {
      phase: String(item.metadata?.phase ?? item.from ?? "workflow"),
      title: String(item.metadata?.title ?? item.from ?? "Workflow progress"),
      ...(detail ? { detail } : {}),
      status: (item.status === "success" ? "success" : "running") as "running" | "success",
    };
  }

  if (item.type === "step-start") {
    return {
      phase: item.from ?? "workflow-step",
      title: titleForStep(item.from, "running"),
      status: "running" as const,
    };
  }

  if (item.type === "step-complete") {
    return {
      phase: item.from ?? "workflow-step",
      title: titleForStep(item.from, "success"),
      status: "success" as const,
    };
  }

  if (item.type === "workflow-complete") {
    return {
      phase: "workflow",
      title: "Recommendation workflow complete",
      status: "success" as const,
    };
  }

  if (item.type === "workflow-error" || item.type === "step-error") {
    return {
      phase: item.from ?? "workflow",
      title: "Workflow step failed",
      status: "error" as const,
    };
  }

  return undefined;
}

function titleForStep(stepId: string | undefined, status: "running" | "success") {
  const verb = status === "running" ? "Running" : "Completed";
  const normalized = stepId?.toLowerCase() ?? "";
  if (normalized === "validate-context" || normalized.includes("validate crm context")) {
    return status === "running" ? "Reading CRM context" : "CRM context read";
  }
  if (normalized === "load-knowledgebase" || normalized.includes("load knowledgebase")) {
    return status === "running" ? "Loading knowledgebase" : "Knowledgebase loaded";
  }
  if (normalized === "diagnose-and-score" || normalized.includes("diagnose and score")) {
    return status === "running" ? "Scoring next actions" : "Next actions scored";
  }
  if (normalized === "evaluate-recommendation" || normalized.includes("evaluate")) {
    return status === "running" ? "Agent evaluating recommendation" : "Recommendation evaluated";
  }
  if (normalized === "synthesize-strategy" || normalized.includes("synthesize")) {
    return status === "running" ? "Writing demo-ready strategy" : "Strategy wording complete";
  }
  return `${verb} ${stepId ?? "workflow step"}`;
}
