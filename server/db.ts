import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";

import { requestRecommendation, requestRecommendationStream } from "./agentClient.js";
import { buildRecommendationRequest, mapRecommendationToPersistence } from "./agentMapper.js";
import {
  actionSeeds,
  bootstrapSeed,
  calendarSeeds,
  customerSeeds,
  fileSeeds,
  noteSeeds,
  quoteSeeds,
  strategySeeds,
} from "./seed.js";
import type {
  ActionRecord,
  AddNoteInput,
  AgentTraceEvent,
  BootstrapPayload,
  CalendarEventRecord,
  CreateQuoteInput,
  CustomerFileRecord,
  CustomerRecord,
  LogActionInput,
  NoteRecord,
  QuoteDetailPayload,
  QuoteRecord,
  ReviseStrategyInput,
  ScheduleActionInput,
  StrategyRecord,
  UpdateActionPreparationInput,
  UpdateCustomerInput,
} from "./types.js";

const DB_PATH = process.env.REONIC_DEMO_DB ?? join(process.cwd(), ".data", "reonic-demo.sqlite");

let db: DatabaseSync | undefined;

export function getDb() {
  if (!db) {
    mkdirSync(dirname(DB_PATH), { recursive: true });
    db = new DatabaseSync(DB_PATH);
    db.exec("PRAGMA journal_mode = WAL");
    createSchema(db);
    seedIfNeeded(db);
  }

  return db;
}

export function resetDatabase() {
  if (db) {
    db.close();
    db = undefined;
  }
  for (const path of [DB_PATH, `${DB_PATH}-wal`, `${DB_PATH}-shm`]) {
    if (existsSync(path)) {
      rmSync(path);
    }
  }
  getDb();
}

export function getBootstrap(): BootstrapPayload {
  return bootstrapSeed;
}

export function listQuotes(): QuoteRecord[] {
  const rows = getDb()
    .prepare("select data from quotes order by sort_order asc")
    .all() as unknown as JsonRow[];
  return rows.map((row) => parseJson<QuoteRecord>(row.data));
}

export function getQuoteDetail(quoteId: string): QuoteDetailPayload {
  const quote = getQuote(quoteId);
  const customer = getCustomer(quote.customerId);
  const strategy = getStrategyByQuote(quote.id);
  const actions = listActionsForQuote(quote.id);
  const notes = listNotesForCustomer(customer.id);
  const files = listFilesForCustomer(customer.id);
  return {
    quote,
    customer,
    ...(strategy ? { strategy } : {}),
    actions,
    notes,
    files,
  };
}

export function getCustomer(customerId: string): CustomerRecord {
  const row = getDb()
    .prepare("select data from customers where id = ?")
    .get(customerId) as JsonRow | undefined;
  if (!row) {
    throw notFound(`Customer ${customerId} not found`);
  }
  return parseJson<CustomerRecord>(row.data);
}

export function updateCustomer(customerId: string, input: UpdateCustomerInput): CustomerRecord {
  const customer = getCustomer(customerId);
  const updated: CustomerRecord = {
    ...customer,
    ...definedOnly(input),
    updatedAt: new Date().toISOString(),
  };
  putJson("customers", updated.id, updated);

  const quote = listQuotes().find((item) => item.customerId === customerId);
  if (quote) {
    updateQuote(quote.id, {
      customerName: updated.name,
      title: updated.name,
      contactLine: `${updated.name} · ${updated.email}`,
      address: updated.address,
      value: updated.quoteValue,
      productSummary: updated.system,
      strategyStale: Boolean(quote.strategyId),
    });
    const strategy = getStrategyByQuote(quote.id);
    if (strategy) {
      putJson("strategies", strategy.id, { ...strategy, stale: true });
    }
  }

  return updated;
}

export function getCalendarEvents(): CalendarEventRecord[] {
  const rows = getDb()
    .prepare("select data from calendar_events order by json_extract(data, '$.start') asc")
    .all() as unknown as JsonRow[];
  return rows.map((row) => parseJson<CalendarEventRecord>(row.data));
}

export async function generateStrategy(
  quoteId: string,
  onTrace?: (event: AgentTraceEvent) => void,
): Promise<QuoteDetailPayload> {
  return refreshRecommendation(quoteId, {
    triggerType: "strategy_requested",
    ...(onTrace ? { onTrace } : {}),
  });
}

export async function reviseStrategy(
  quoteId: string,
  input: ReviseStrategyInput,
  onTrace?: (event: AgentTraceEvent) => void,
): Promise<QuoteDetailPayload> {
  const instruction = input.instruction.trim();
  if (!instruction) {
    const error = new Error("Revision instruction is required");
    Object.assign(error, { statusCode: 400 });
    throw error;
  }

  return refreshRecommendation(quoteId, {
    triggerType: "installer_revision_requested",
    installerInstruction: instruction,
    ...(onTrace ? { onTrace } : {}),
  });
}

export function createQuote(input: CreateQuoteInput): QuoteDetailPayload {
  const now = new Date().toISOString();
  const normalizedValue = Number(input.quoteValue);
  if (!input.name.trim() || !input.email.trim() || !input.address.trim() || !input.system.trim()) {
    const error = new Error("Name, email, address, and system are required");
    Object.assign(error, { statusCode: 400 });
    throw error;
  }
  if (!Number.isFinite(normalizedValue) || normalizedValue <= 0) {
    const error = new Error("Quote value must be a positive number");
    Object.assign(error, { statusCode: 400 });
    throw error;
  }

  const slug = slugify(input.name);
  const stamp = Date.now().toString(36);
  const customerId = `customer_${slug}_${stamp}`;
  const quoteId = `quote_${slug}_${stamp}`;
  const customer: CustomerRecord = {
    id: customerId,
    initials: initialsFor(input.name),
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    address: input.address.trim(),
    system: input.system.trim(),
    quoteValue: normalizedValue,
    leadBadge: "Fresh",
    leadBadgeTone: "blue",
    communicationPreference: input.preferredChannel.trim() || "Email",
    decisionNote: input.motivationOrConcern.trim() || "Fresh quote without a recorded objection yet.",
    householdNote: input.householdNote.trim() || "No special household note recorded.",
    updatedAt: now,
    buyerProfile: inferBuyerProfile(input),
  };
  const quote: QuoteRecord = {
    id: quoteId,
    customerId,
    title: customer.name,
    customerName: customer.name,
    contactLine: `${customer.name} · ${customer.email}`,
    address: customer.address,
    columnId: "waiting_response",
    ownerName: "Theo",
    ownerAvatar: "TT",
    ownerTone: "blue",
    value: normalizedValue,
    sentAt: now,
    lastActionAt: now,
    quoteAgeDays: 0,
    daysSinceLastAction: 0,
    productSummary: customer.system,
    nextAction: {
      kind: "generate_strategy",
      label: "Generate strategy",
      tone: "blue",
    },
    strategyStale: false,
  };

  putJson("customers", customer.id, customer);
  putQuoteWithSort(quote, firstQuoteSortOrder() - 1);

  const noteBody = [input.motivationOrConcern, input.initialNote].filter(Boolean).join("\n\n").trim();
  if (noteBody) {
    putJson("notes", `note_${quoteId}_intake`, {
      id: `note_${quoteId}_intake`,
      customerId,
      type: "text",
      title: "New quote intake",
      body: noteBody,
      authorName: "Theo Tiral · Installer",
      authorAvatar: "TT",
      createdAt: now,
    } satisfies NoteRecord);
  }

  return getQuoteDetail(quoteId);
}

export function scheduleAction(actionId: string, input: ScheduleActionInput): QuoteDetailPayload {
  const action = getAction(actionId);
  const quote = getQuote(action.quoteId);
  const customer = getCustomer(action.customerId);
  const customerFirstName = customer.name.split(/\s+/)[0] ?? customer.name;
  const start = input.slotStart ?? defaultSlotFor(action.taskType);
  const end = addMinutes(start, durationForAction(action.taskType));
  const eventId = `cal_${action.id}`;
  const preparationBody = input.preparationBody?.trim() || action.preparationBody;

  const event: CalendarEventRecord = {
    id: eventId,
    title: calendarTitleForAction(action, customerFirstName),
    start,
    end,
    row: "theo",
    color: calendarColorForAction(action.taskType),
    quoteId: quote.id,
    actionId: action.id,
    ...(action.taskType === "Meeting in person" ? { location: customer.address } : {}),
    ...(preparationBody ? { description: preparationBody } : {}),
  };

  putJson("calendar_events", event.id, event);
  putJson("actions", action.id, {
    ...action,
    status: "scheduled",
    scheduledFor: start,
    calendarEventId: event.id,
    ...(preparationBody
      ? {
          preparationBody,
          preparationUpdatedAt: new Date().toISOString(),
        }
      : {}),
  });

  if (action.taskType === "Phone Call") {
    updateQuote(quote.id, {
      nextAction: {
        kind: "log_call",
        label: "Log call",
        actionId: action.id,
        tone: "yellow",
      },
      lastActionAt: new Date().toISOString(),
      daysSinceLastAction: 0,
    });
  } else if (action.taskType === "Meeting in person") {
    updateQuote(quote.id, {
      nextAction: {
        kind: "log_visit",
        label: "Log visit",
        actionId: action.id,
        tone: "yellow",
      },
      lastActionAt: new Date().toISOString(),
      daysSinceLastAction: 0,
    });
  } else {
    updateQuote(quote.id, {
      nextAction: nextActionForScheduledAsyncTask(action, quote),
      statusLabel: "Scheduled",
      statusTone: "blue",
      lastActionAt: new Date().toISOString(),
      daysSinceLastAction: 0,
    });
  }

  return getQuoteDetail(quote.id);
}

export function updateActionPreparation(
  actionId: string,
  input: UpdateActionPreparationInput,
): QuoteDetailPayload {
  const action = getAction(actionId);
  putJson("actions", action.id, {
    ...action,
    preparationBody: input.body,
    preparationUpdatedAt: new Date().toISOString(),
  });

  if (action.calendarEventId) {
    const event = getCalendarEvent(action.calendarEventId);
    putJson("calendar_events", event.id, {
      ...event,
      description: input.body,
    });
  }

  return getQuoteDetail(action.quoteId);
}

export async function logAction(actionId: string, input: LogActionInput): Promise<QuoteDetailPayload> {
  const action = getAction(actionId);
  const quote = getQuote(action.quoteId);
  const completedAt = new Date().toISOString();

  putJson("actions", action.id, {
    ...action,
    status: "completed",
    completedAt,
  });

  const note = createDebriefNote(action, input.notes, completedAt);
  putJson("notes", note.id, note);

  await refreshRecommendation(quote.id, {
    triggerType: "debrief_added",
    now: completedAt,
  });
  updateQuote(quote.id, { lastActionAt: completedAt, daysSinceLastAction: 0 });

  return getQuoteDetail(quote.id);
}

export async function completeAction(actionId: string): Promise<QuoteDetailPayload> {
  const action = getAction(actionId);
  const quote = getQuote(action.quoteId);
  const completedAt = new Date().toISOString();

  putJson("actions", action.id, {
    ...action,
    status: "sent",
    completedAt,
  });

  if (action.taskType === "Send Email") {
    updateQuote(quote.id, {
      columnId: "completed",
      statusLabel: "Signed",
      statusTone: "blue",
      nextAction: {
        kind: "none",
        label: "",
        tone: "gray",
      },
      lastActionAt: completedAt,
      daysSinceLastAction: 0,
    });

    const strategy = getStrategyByQuote(quote.id);
    if (strategy) {
      putJson("strategies", strategy.id, {
        ...strategy,
        currentActionId: undefined,
        steps: strategy.steps.map((step) => ({ ...step, status: "completed" })),
      });
    }
  }

  if (action.taskType === "Send WhatsApp Video Message" || action.taskType === "Send Gift") {
    const note: NoteRecord = {
      id: `note_${action.id}_${Date.now()}`,
      customerId: action.customerId,
      type: "text",
      title: `${action.taskType} sent`,
      body: action.defaultLogText || `${action.title} was sent. Recommend the next best follow-up.`,
      authorName: "Theo Tiral · Installer",
      authorAvatar: "TT",
      createdAt: completedAt,
    };
    putJson("notes", note.id, note);
    await refreshRecommendation(quote.id, {
      triggerType: "debrief_added",
      now: completedAt,
    });
    updateQuote(quote.id, { lastActionAt: completedAt, daysSinceLastAction: 0 });
  }

  return getQuoteDetail(quote.id);
}

export function addNote(customerId: string, input: AddNoteInput): NoteRecord {
  getCustomer(customerId);
  const note: NoteRecord = {
    id: `note_${Date.now()}`,
    customerId,
    type: input.type,
    title: input.title,
    body: input.body,
    authorName: "Theo Tiral · Installer",
    authorAvatar: "TT",
    createdAt: new Date().toISOString(),
    ...(input.type === "audio" ? { duration: "0:42", transcriptStatus: "Transcribed" } : {}),
  };
  putJson("notes", note.id, note);
  markCustomerStrategiesStale(customerId);
  return note;
}

export function getAction(actionId: string): ActionRecord {
  const row = getDb()
    .prepare("select data from actions where id = ?")
    .get(actionId) as JsonRow | undefined;
  if (!row) {
    throw notFound(`Action ${actionId} not found`);
  }
  return parseJson<ActionRecord>(row.data);
}

function getCalendarEvent(eventId: string): CalendarEventRecord {
  const row = getDb()
    .prepare("select data from calendar_events where id = ?")
    .get(eventId) as JsonRow | undefined;
  if (!row) {
    throw notFound(`Calendar event ${eventId} not found`);
  }
  return parseJson<CalendarEventRecord>(row.data);
}

async function refreshRecommendation(
  quoteId: string,
  options: Parameters<typeof buildRecommendationRequest>[2] & {
    onTrace?: (event: AgentTraceEvent) => void;
  },
) {
  const detail = getQuoteDetail(quoteId);
  options.onTrace?.(
    makeTrace(
      "assemble-context",
      "Assembling CRM context",
      `${detail.customer.name} · ${detail.notes.length} notes · ${detail.files.length} files`,
      "running",
    ),
  );
  const request = buildRecommendationRequest(detail, getCalendarEvents(), options);
  options.onTrace?.(
    makeTrace(
      "assemble-context",
      "CRM context ready",
      `${request.history.communications.length} communications · ${request.history.files.length} files`,
      "success",
    ),
  );
  const recommendation = options.onTrace
    ? await requestRecommendationStream(request, options.onTrace)
    : await requestRecommendation(request);
  options.onTrace?.(
    makeTrace(
      "persist",
      "Persisting recommendation",
      recommendation.nextBestAction.taskType,
      "running",
    ),
  );
  const persistence = mapRecommendationToPersistence(
    getQuoteDetail(quoteId),
    recommendation,
    options.now ?? new Date().toISOString(),
  );

  putJson("strategies", persistence.strategy.id, persistence.strategy);
  putJson("actions", persistence.action.id, persistence.action);
  supersedeReplaceableAction(detail, persistence.action.id, options.now ?? new Date().toISOString());
  updateQuote(quoteId, persistence.quotePatch);
  options.onTrace?.(
    makeTrace(
      "persist",
      "Recommendation saved",
      persistence.quotePatch.nextAction?.label,
      "success",
    ),
  );

  return getQuoteDetail(quoteId);
}

function makeTrace(
  phase: string,
  title: string,
  detail: string | undefined,
  status: AgentTraceEvent["status"],
): AgentTraceEvent {
  return {
    id: `web_trace_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    source: "web",
    phase,
    title,
    ...(detail ? { detail } : {}),
    status,
    timestamp: new Date().toISOString(),
  };
}

function supersedeReplaceableAction(detail: QuoteDetailPayload, newActionId: string, now: string) {
  const oldActionId = detail.quote.nextAction.actionId;
  if (!oldActionId || oldActionId === newActionId) {
    return;
  }
  const oldAction = detail.actions.find((action) => action.id === oldActionId);
  if (!oldAction || oldAction.status !== "recommended" || oldAction.title === "Generate closing strategy") {
    return;
  }
  putJson("actions", oldAction.id, {
    ...oldAction,
    status: "superseded",
    supersededAt: now,
    supersededByActionId: newActionId,
  } satisfies ActionRecord);
}

function getQuote(quoteId: string): QuoteRecord {
  const row = getDb()
    .prepare("select data from quotes where id = ?")
    .get(quoteId) as JsonRow | undefined;
  if (!row) {
    throw notFound(`Quote ${quoteId} not found`);
  }
  return parseJson<QuoteRecord>(row.data);
}

function updateQuote(quoteId: string, patch: Partial<QuoteRecord>) {
  const quote = getQuote(quoteId);
  putJson("quotes", quote.id, { ...quote, ...patch });
}

function getStrategyByQuote(quoteId: string) {
  const row = getDb()
    .prepare("select data from strategies where quote_id = ? order by updated_at desc limit 1")
    .get(quoteId) as JsonRow | undefined;
  return row ? parseJson<StrategyRecord>(row.data) : undefined;
}

function listActionsForQuote(quoteId: string) {
  const rows = getDb()
    .prepare("select data from actions where quote_id = ? order by created_at asc")
    .all(quoteId) as unknown as JsonRow[];
  return rows.map((row) => parseJson<ActionRecord>(row.data));
}

function listNotesForCustomer(customerId: string) {
  const rows = getDb()
    .prepare("select data from notes where customer_id = ? order by json_extract(data, '$.createdAt') desc")
    .all(customerId) as unknown as JsonRow[];
  return rows.map((row) => parseJson<NoteRecord>(row.data));
}

function listFilesForCustomer(customerId: string) {
  const rows = getDb()
    .prepare("select data from customer_files where customer_id = ? order by json_extract(data, '$.uploadedAt') desc")
    .all(customerId) as unknown as JsonRow[];
  return rows.map((row) => parseJson<CustomerFileRecord>(row.data));
}

function createSchema(database: DatabaseSync) {
  database.exec(`
    create table if not exists meta (
      key text primary key,
      value text not null
    );

    create table if not exists customers (
      id text primary key,
      data text not null,
      updated_at text not null
    );

    create table if not exists quotes (
      id text primary key,
      customer_id text not null,
      column_id text not null,
      sort_order integer not null,
      data text not null,
      updated_at text not null
    );

    create table if not exists strategies (
      id text primary key,
      quote_id text not null,
      data text not null,
      updated_at text not null
    );

    create table if not exists actions (
      id text primary key,
      quote_id text not null,
      customer_id text not null,
      data text not null,
      created_at text not null,
      updated_at text not null
    );

    create table if not exists calendar_events (
      id text primary key,
      data text not null,
      updated_at text not null
    );

    create table if not exists notes (
      id text primary key,
      customer_id text not null,
      data text not null,
      updated_at text not null
    );

    create table if not exists customer_files (
      id text primary key,
      customer_id text not null,
      data text not null,
      updated_at text not null
    );
  `);
}

function seedIfNeeded(database: DatabaseSync) {
  const row = database.prepare("select value from meta where key = 'seeded'").get() as
    | { value: string }
    | undefined;
  if (row?.value === "v3") {
    return;
  }

  database.exec(`
    delete from customers;
    delete from quotes;
    delete from strategies;
    delete from actions;
    delete from calendar_events;
    delete from notes;
    delete from customer_files;
    delete from meta;
  `);

  customerSeeds.forEach((customer) => putJson("customers", customer.id, customer));
  quoteSeeds.forEach((quote, index) => putQuoteSeed(quote, index));
  strategySeeds.forEach((strategy) => putJson("strategies", strategy.id, strategy));
  actionSeeds.forEach((action) => putJson("actions", action.id, action));
  calendarSeeds.forEach((event) => putJson("calendar_events", event.id, event));
  noteSeeds.forEach((note) => putJson("notes", note.id, note));
  fileSeeds.forEach((file) => putJson("customer_files", file.id, file));
  database.prepare("insert into meta (key, value) values ('seeded', 'v3')").run();
}

function putQuoteSeed(quote: QuoteRecord, sortOrder: number) {
  putQuoteWithSort(quote, sortOrder);
}

function putQuoteWithSort(quote: QuoteRecord, sortOrder: number) {
  getDb()
    .prepare(
      `insert or replace into quotes (id, customer_id, column_id, sort_order, data, updated_at)
       values (?, ?, ?, ?, ?, ?)`,
    )
    .run(quote.id, quote.customerId, quote.columnId, sortOrder, stringify(quote), new Date().toISOString());
}

function putJson(table: string, id: string, value: unknown) {
  const now = new Date().toISOString();
  const data = stringify(value);
  if (table === "customers") {
    getDb()
      .prepare("insert or replace into customers (id, data, updated_at) values (?, ?, ?)")
      .run(id, data, now);
    return;
  }
  if (table === "quotes") {
    const quote = value as QuoteRecord;
    const current = getDb().prepare("select sort_order from quotes where id = ?").get(id) as
      | { sort_order: number }
      | undefined;
    getDb()
      .prepare(
        `insert or replace into quotes (id, customer_id, column_id, sort_order, data, updated_at)
         values (?, ?, ?, ?, ?, ?)`,
      )
      .run(id, quote.customerId, quote.columnId, current?.sort_order ?? 999, data, now);
    return;
  }
  if (table === "strategies") {
    const strategy = value as StrategyRecord;
    getDb()
      .prepare("insert or replace into strategies (id, quote_id, data, updated_at) values (?, ?, ?, ?)")
      .run(id, strategy.quoteId, data, now);
    return;
  }
  if (table === "actions") {
    const action = value as ActionRecord;
    const current = getDb().prepare("select created_at from actions where id = ?").get(id) as
      | { created_at: string }
      | undefined;
    getDb()
      .prepare(
        `insert or replace into actions (id, quote_id, customer_id, data, created_at, updated_at)
         values (?, ?, ?, ?, ?, ?)`,
      )
      .run(id, action.quoteId, action.customerId, data, current?.created_at ?? now, now);
    return;
  }
  if (table === "calendar_events") {
    getDb()
      .prepare("insert or replace into calendar_events (id, data, updated_at) values (?, ?, ?)")
      .run(id, data, now);
    return;
  }
  if (table === "notes") {
    const note = value as NoteRecord;
    getDb()
      .prepare("insert or replace into notes (id, customer_id, data, updated_at) values (?, ?, ?, ?)")
      .run(id, note.customerId, data, now);
    return;
  }
  if (table === "customer_files") {
    const file = value as CustomerFileRecord;
    getDb()
      .prepare("insert or replace into customer_files (id, customer_id, data, updated_at) values (?, ?, ?, ?)")
      .run(file.id, file.customerId, data, now);
    return;
  }
  throw new Error(`Unsupported table: ${table}`);
}

function markCustomerStrategiesStale(customerId: string) {
  const quotes = listQuotes().filter((quote) => quote.customerId === customerId && quote.strategyId);
  for (const quote of quotes) {
    updateQuote(quote.id, { strategyStale: true });
    const strategy = getStrategyByQuote(quote.id);
    if (strategy) {
      putJson("strategies", strategy.id, { ...strategy, stale: true });
    }
  }
}

function createDebriefNote(action: ActionRecord, body: string, createdAt: string): NoteRecord {
  return {
    id: `note_${action.id}_${Date.now()}`,
    customerId: action.customerId,
    type: "text",
    title: action.taskType === "Phone Call" ? "Call debrief" : "Visit debrief",
    body,
    authorName: "Theo Tiral · Installer",
    authorAvatar: "TT",
    createdAt,
  };
}

function inferBuyerProfile(input: CreateQuoteInput): CustomerRecord["buyerProfile"] {
  const text = normalizeText(
    [input.motivationOrConcern, input.householdNote, input.initialNote, input.system].join(" "),
  );
  const signals: CustomerRecord["buyerProfile"] = [];

  if (includesAny(text, ["co2", "klima", "climate", "umwelt", "nachhalt", "green"])) {
    signals.push({
      id: "environmentalist",
      name: "Environmentalist",
      strength: "Strong",
      tone: "green",
      description: "The intake mentions environmental impact, so the first strategy should include concrete impact language.",
      evidence: [{ label: "Environmental motive in intake", source: "New quote", icon: "leaf" }],
    });
  }
  if (includesAny(text, ["price", "preis", "budget", "monthly", "monat", "payback", "amort", "roi", "teuer"])) {
    signals.push({
      id: "value_conscious",
      name: "Value-conscious",
      strength: "Strong",
      tone: "yellow",
      description: "The intake points to price, monthly payment, or payback, so the strategy should reduce cost anxiety.",
      evidence: [{ label: "Cost concern in intake", source: "New quote", icon: "clock" }],
    });
  }
  if (includesAny(text, ["roof", "dach", "meter", "zaehler", "zähler", "shade", "shadow", "cable", "technical"])) {
    signals.push({
      id: "technical_skeptic",
      name: "Technical skeptic",
      strength: "Moderate",
      tone: "blue",
      description: "The intake contains house-specific technical questions that may need proof or a visit.",
      evidence: [{ label: "Property-specific concern", source: "New quote", icon: "home" }],
    });
  }
  if (includesAny(text, ["trust", "vertrauen", "pressure", "pushy", "sick", "krank", "hospital", "recovered"])) {
    signals.push({
      id: "trust_sensitive",
      name: "Trust-sensitive",
      strength: "Moderate",
      tone: "blue",
      description: "The customer context calls for a careful tone and lower-pressure follow-up.",
      evidence: [{ label: "Sensitive context in notes", source: "New quote", icon: "shield" }],
    });
  }

  if (signals.length > 0) {
    return signals.slice(0, 2);
  }

  return [
    {
      id: "value_conscious",
      name: "Value-conscious",
      strength: "Watch",
      tone: "yellow",
      description: "Fresh residential quote; start with practical value and a clear next step.",
      evidence: [{ label: "Fresh quote intake", source: "New quote", icon: "clipboard" }],
    },
  ];
}

function firstQuoteSortOrder() {
  const row = getDb().prepare("select min(sort_order) as value from quotes").get() as
    | { value: number | null }
    | undefined;
  return row?.value ?? 0;
}

function initialsFor(name: string) {
  return name
    .split(/[\s,-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function slugify(value: string) {
  return (
    normalizeText(value)
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 36) || "lead"
  );
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss");
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(normalizeText(term)));
}

function defaultSlotFor(taskType: ActionRecord["taskType"]) {
  if (taskType === "Meeting in person") {
    return "2026-06-23T11:00:00.000Z";
  }
  if (taskType === "Send Email" || taskType === "Send WhatsApp Video Message" || taskType === "Send Gift") {
    return "2026-06-22T12:30:00.000Z";
  }
  return "2026-06-22T10:30:00.000Z";
}

function durationForAction(taskType: ActionRecord["taskType"]) {
  if (taskType === "Meeting in person") {
    return 60;
  }
  if (taskType === "Send Gift") {
    return 30;
  }
  return 20;
}

function calendarTitleForAction(action: ActionRecord, customerFirstName: string) {
  if (action.taskType === "Meeting in person") {
    return `Visit ${customerFirstName}`;
  }
  if (action.taskType === "Phone Call") {
    return `Call ${customerFirstName}`;
  }
  if (action.taskType === "Send Email") {
    return `Send email to ${customerFirstName}`;
  }
  if (action.taskType === "Send WhatsApp Video Message") {
    return `Send WhatsApp video to ${customerFirstName}`;
  }
  return `Send gift to ${customerFirstName}`;
}

function calendarColorForAction(taskType: ActionRecord["taskType"]): CalendarEventRecord["color"] {
  if (taskType === "Meeting in person" || taskType === "Send Gift") {
    return "green";
  }
  if (taskType === "Send Email" || taskType === "Send WhatsApp Video Message") {
    return "blue";
  }
  return "orange";
}

function nextActionForScheduledAsyncTask(
  action: ActionRecord,
  quote: QuoteRecord,
): QuoteRecord["nextAction"] {
  if (action.taskType === "Send WhatsApp Video Message") {
    return {
      kind: "send_whatsapp_video",
      label: "Send video",
      actionId: action.id,
      tone: "blue",
    };
  }
  if (action.taskType === "Send Gift") {
    return {
      kind: "send_gift",
      label: "Send gift",
      actionId: action.id,
      tone: "green",
    };
  }
  return {
    kind: quote.nextAction.kind === "follow_up_signature" ? "follow_up_signature" : "send_final_recap",
    label: quote.nextAction.kind === "follow_up_signature" ? "Follow up signature" : "Send recap",
    actionId: action.id,
    tone: quote.nextAction.kind === "follow_up_signature" ? "yellow" : "blue",
  };
}

function addMinutes(iso: string, minutes: number) {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

function stringify(value: unknown) {
  return JSON.stringify(value);
}

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

function definedOnly<T extends object>(input: T): Partial<T> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as Partial<T>;
}

function notFound(message: string) {
  const error = new Error(message);
  Object.assign(error, { statusCode: 404 });
  return error;
}

interface JsonRow {
  data: string;
}
