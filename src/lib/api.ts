import type {
  AddNoteInput,
  AgentTraceEvent,
  BootstrapPayload,
  CalendarEventRecord,
  CreateQuoteInput,
  LogActionInput,
  QuoteDetailPayload,
  QuoteRecord,
  ScheduleActionInput,
  UpdateActionPreparationInput,
  UpdateCustomerInput,
} from "../../server/types.js";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export const api = {
  bootstrap: () => request<BootstrapPayload>("/api/bootstrap"),
  quotes: () => request<{ quotes: QuoteRecord[] }>("/api/quotes"),
  quote: (quoteId: string) => request<QuoteDetailPayload>(`/api/quotes/${quoteId}`),
  createQuote: (input: CreateQuoteInput) =>
    request<QuoteDetailPayload>("/api/quotes", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  calendar: () => request<{ events: CalendarEventRecord[] }>("/api/calendar"),
  generateStrategy: (quoteId: string) =>
    request<QuoteDetailPayload>(`/api/quotes/${quoteId}/generate-strategy`, {
      method: "POST",
      body: "{}",
    }),
  generateStrategyStream: (quoteId: string, onTrace: (event: AgentTraceEvent) => void) =>
    requestStream<QuoteDetailPayload>(`/api/quotes/${quoteId}/generate-strategy/stream`, {}, onTrace),
  reviseStrategy: (quoteId: string, instruction: string) =>
    request<QuoteDetailPayload>(`/api/quotes/${quoteId}/revise-strategy`, {
      method: "POST",
      body: JSON.stringify({ instruction }),
    }),
  reviseStrategyStream: (
    quoteId: string,
    instruction: string,
    onTrace: (event: AgentTraceEvent) => void,
  ) =>
    requestStream<QuoteDetailPayload>(
      `/api/quotes/${quoteId}/revise-strategy/stream`,
      { instruction },
      onTrace,
    ),
  scheduleAction: (actionId: string, input: ScheduleActionInput = {}) =>
    request<QuoteDetailPayload>(`/api/actions/${actionId}/schedule`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateActionPreparation: (actionId: string, input: UpdateActionPreparationInput) =>
    request<QuoteDetailPayload>(`/api/actions/${actionId}/preparation`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  logAction: (actionId: string, input: LogActionInput) =>
    request<QuoteDetailPayload>(`/api/actions/${actionId}/log`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  completeAction: (actionId: string) =>
    request<QuoteDetailPayload>(`/api/actions/${actionId}/complete`, {
      method: "POST",
      body: "{}",
    }),
  updateCustomer: (customerId: string, input: UpdateCustomerInput) =>
    request(`/api/customers/${customerId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  addNote: (customerId: string, input: AddNoteInput) =>
    request(`/api/customers/${customerId}/notes`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  resetDemo: () =>
    request("/api/demo/reset", {
      method: "POST",
      body: "{}",
    }),
};

async function requestStream<T>(
  path: string,
  body: unknown,
  onTrace: (event: AgentTraceEvent) => void,
): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed: ${response.status}`);
  }
  if (!response.body) {
    throw new Error("Streaming response had no body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: T | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });

    while (buffer.includes("\n\n")) {
      const splitAt = buffer.indexOf("\n\n");
      const frame = buffer.slice(0, splitAt);
      buffer = buffer.slice(splitAt + 2);
      const parsed = parseSseFrame(frame);
      if (!parsed) {
        continue;
      }
      if (parsed.event === "trace") {
        onTrace(parsed.data as AgentTraceEvent);
      }
      if (parsed.event === "result") {
        result = parsed.data as T;
      }
      if (parsed.event === "error") {
        const errorPayload = parsed.data as { error?: string };
        throw new Error(errorPayload.error ?? "Streaming request failed");
      }
    }
  }

  if (!result) {
    throw new Error("Streaming request finished without a result");
  }
  return result;
}

function parseSseFrame(frame: string) {
  const lines = frame.split("\n");
  const event = lines.find((line) => line.startsWith("event: "))?.slice(7).trim();
  const data = lines
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice(6))
    .join("\n");
  if (!event || !data) {
    return undefined;
  }
  return { event, data: JSON.parse(data) as unknown };
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatShortDate(iso?: string) {
  if (!iso) {
    return "Not sent";
  }
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
