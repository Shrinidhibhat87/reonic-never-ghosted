import express from "express";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";

import {
  addNote,
  completeAction,
  createQuote,
  generateStrategy,
  getBootstrap,
  getCalendarEvents,
  getCustomer,
  getDb,
  getQuoteDetail,
  listQuotes,
  logAction,
  resetDatabase,
  reviseStrategy,
  scheduleAction,
  updateActionPreparation,
  updateCustomer,
} from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const port = Number(process.env.PORT ?? 5173);
const isProduction = process.env.NODE_ENV === "production";

const app = express();
app.use(express.json({ limit: "2mb" }));

getDb();

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "reonic-platform-demo" });
});

app.get("/api/bootstrap", (_req, res) => {
  res.json(getBootstrap());
});

app.get("/api/quotes", (_req, res) => {
  res.json({ quotes: listQuotes() });
});

app.get("/api/quotes/:id", (req, res) => {
  res.json(getQuoteDetail(req.params.id));
});

app.post("/api/quotes", (req, res) => {
  res.json(createQuote(req.body));
});

app.get("/api/customers/:id", (req, res) => {
  res.json(getCustomer(req.params.id));
});

app.patch("/api/customers/:id", (req, res) => {
  res.json(updateCustomer(req.params.id, req.body));
});

app.get("/api/calendar", (_req, res) => {
  res.json({ events: getCalendarEvents() });
});

app.post("/api/quotes/:id/generate-strategy", async (req, res) => {
  res.json(await generateStrategy(req.params.id));
});

app.post("/api/quotes/:id/revise-strategy", async (req, res) => {
  res.json(await reviseStrategy(req.params.id, req.body));
});

app.post("/api/quotes/:id/generate-strategy/stream", async (req, res) => {
  await streamQuoteRecommendation(res, (onTrace) => generateStrategy(req.params.id, onTrace));
});

app.post("/api/quotes/:id/revise-strategy/stream", async (req, res) => {
  await streamQuoteRecommendation(res, (onTrace) => reviseStrategy(req.params.id, req.body, onTrace));
});

app.post("/api/actions/:id/schedule", (req, res) => {
  res.json(scheduleAction(req.params.id, req.body));
});

app.patch("/api/actions/:id/preparation", (req, res) => {
  res.json(updateActionPreparation(req.params.id, req.body));
});

app.post("/api/actions/:id/log", async (req, res) => {
  res.json(await logAction(req.params.id, req.body));
});

app.post("/api/actions/:id/complete", async (req, res) => {
  res.json(await completeAction(req.params.id));
});

app.post("/api/customers/:id/notes", (req, res) => {
  res.json(addNote(req.params.id, req.body));
});

app.post("/api/demo/reset", (_req, res) => {
  resetDatabase();
  res.json({ ok: true, bootstrap: getBootstrap() });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const statusCode =
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
      ? error.statusCode
      : 500;
  const message = error instanceof Error ? error.message : "Unexpected server error";
  if (statusCode >= 500) {
    console.error(error);
  }
  res.status(statusCode).json({ error: message });
});

if (!isProduction) {
  const vite = await createViteServer({
    root,
    appType: "spa",
    server: {
      middlewareMode: true,
    },
  });
  app.use(vite.middlewares);
} else {
  const clientDir = join(root, "dist", "client");
  app.use(express.static(clientDir));
  app.get("*", (_req, res) => {
    res.type("html").send(readFileSync(join(clientDir, "index.html"), "utf8"));
  });
}

app.listen(port, () => {
  console.log(`Reonic platform demo running at http://localhost:${port}`);
});

async function streamQuoteRecommendation(
  res: express.Response,
  run: (onTrace: Parameters<typeof generateStrategy>[1]) => Promise<unknown>,
) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  const send = (event: string, payload: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
  };

  try {
    const detail = await run((traceEvent) => send("trace", traceEvent));
    send("result", detail);
  } catch (error) {
    send("error", {
      error: error instanceof Error ? error.message : "Unexpected strategy stream error",
    });
  } finally {
    res.end();
  }
}
