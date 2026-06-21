import type {
  ActionRecord,
  ActionTaskType,
  CalendarEventRecord,
  NoteRecord,
  QuoteDetailPayload,
  QuoteNextKind,
  QuoteRecord,
  StrategyRecord,
  StrategyStep,
} from "./types.js";
import { bootstrapSeed } from "./seed.js";
import type { RecommendRequest, RecommendationResponse, TaskType } from "../agent/src/schemas.js";

export interface BuildRecommendationOptions {
  triggerType: RecommendRequest["trigger"]["type"];
  installerInstruction?: string;
  now?: string;
}

export interface RecommendationPersistence {
  strategy: StrategyRecord;
  action: ActionRecord;
  quotePatch: Partial<QuoteRecord>;
}

type AgentAction = RecommendRequest["history"]["actions"][number];
type AgentCommunication = RecommendRequest["history"]["communications"][number];
type AgentDebrief = RecommendRequest["history"]["debriefs"][number];

const ACTIVE_SIGNAL_MAP: Record<string, string> = {
  environmentalist: "climate_motivated",
  value_conscious: "roi_focused",
  trust_sensitive: "trust_sensitive",
  technical_skeptic: "technical_skeptic",
  comparison_shopper: "comparison_shopper",
};

const STEP_META: Record<
  ActionTaskType,
  {
    phase: string;
    icon: string;
    guideTitle: string;
    primaryCta: string;
    secondaryCta: string;
  }
> = {
  "Phone Call": {
    phase: "Build trust",
    icon: "phone",
    guideTitle: "Call script",
    primaryCta: "Schedule call",
    secondaryCta: "Edit call script",
  },
  "Meeting in person": {
    phase: "Validate the home",
    icon: "mapPin",
    guideTitle: "Visit agenda",
    primaryCta: "Schedule visit",
    secondaryCta: "Edit visit agenda",
  },
  "Send Email": {
    phase: "Close cleanly",
    icon: "send",
    guideTitle: "Email draft",
    primaryCta: "Schedule email",
    secondaryCta: "Draft email",
  },
  "Send WhatsApp Video Message": {
    phase: "Reassure visually",
    icon: "fileText",
    guideTitle: "Video script",
    primaryCta: "Schedule video",
    secondaryCta: "Edit video script",
  },
  "Send Gift": {
    phase: "Thoughtful follow-up",
    icon: "gift",
    guideTitle: "Gift note",
    primaryCta: "Schedule gift",
    secondaryCta: "Edit gift note",
  },
};

export function buildRecommendationRequest(
  detail: QuoteDetailPayload,
  calendarEvents: CalendarEventRecord[],
  options: BuildRecommendationOptions,
): RecommendRequest {
  const now = options.now ?? new Date().toISOString();
  const activeBuyerSignals = mapActiveBuyerSignals(detail.customer.buyerProfile.map((signal) => signal.id));
  const activeObjections = inferActiveObjections(detail);

  return {
    requestId: `req_${detail.quote.id}_${Date.now()}`,
    now,
    trigger: {
      type: options.triggerType,
      ...(options.installerInstruction ? { installerInstruction: options.installerInstruction } : {}),
    },
    installer: {
      id: bootstrapSeed.installer.id,
      companyName: bootstrapSeed.installer.company,
      region: "Germany",
      timezone: "Europe/Berlin",
      workingHours: [
        { dayOfWeek: 1, start: "09:00", end: "17:00" },
        { dayOfWeek: 2, start: "09:00", end: "17:00" },
        { dayOfWeek: 3, start: "09:00", end: "17:00" },
        { dayOfWeek: 4, start: "09:00", end: "17:00" },
        { dayOfWeek: 5, start: "09:00", end: "15:00" },
      ],
      calendar: {
        busyBlocks: calendarEvents
          .filter((event) => event.row === "theo")
          .map((event) => ({
            start: event.start,
            end: event.end,
            label: event.title,
            ...(event.location ? { location: event.location } : {}),
          })),
        travelMinutesBuffer: 30,
      },
      proofAssets: [
        {
          id: "proof_quote_assumptions",
          title: "Quote assumptions recap",
          type: "pdf",
          tags: ["quote", "roi", "payback"],
        },
        {
          id: "proof_site_validation",
          title: "Roof, meter, inverter, and cable-path checklist",
          type: "checklist",
          tags: ["visit", "roof", "trust"],
        },
        {
          id: "proof_environmental_impact",
          title: "CO2 impact explanation",
          type: "one-pager",
          tags: ["climate", "impact"],
        },
        {
          id: "proof_local_install_photos",
          title: "Similar local installation photo set",
          type: "photo-set",
          tags: ["visual", "trust", "aftercare"],
        },
      ],
    },
    customer: {
      id: detail.customer.id,
      name: detail.customer.name,
      language: "de",
      preferredFormality: "formal",
      email: detail.customer.email,
      phone: detail.customer.phone,
      address: detail.customer.address,
      explicitMotives: detail.customer.buyerProfile.flatMap((signal) => [
        signal.name,
        signal.description,
      ]),
      statedConcerns: [
        detail.customer.decisionNote,
        ...detail.notes.slice(0, 6).map((note) => note.body),
      ],
      decisionMakersNote: detail.customer.decisionNote,
      householdOrPropertyNotes: detail.customer.householdNote,
    },
    quote: {
      id: detail.quote.id,
      status: quoteStatus(detail.quote),
      sentAt: detail.quote.sentAt,
      signatureState: signatureState(detail.quote),
      scope: quoteScope(detail.quote),
      totalGross: detail.quote.value,
      currency: "EUR",
      lineItems: [
        {
          label: detail.quote.productSummary,
          amountGross: detail.quote.value,
          optional: false,
        },
      ],
      assumptions: {
        boardColumn: detail.quote.columnId,
        currentNextAction: detail.quote.nextAction.kind,
        quoteAgeDays: detail.quote.quoteAgeDays ?? diffDays(detail.quote.sentAt, now) ?? 0,
        daysSinceLastAction: detail.quote.daysSinceLastAction ?? diffDays(detail.quote.lastActionAt, now) ?? 0,
        productSummary: detail.quote.productSummary,
      },
    },
    consent: consentFromCustomer(detail.customer.communicationPreference, detail.customer.email, detail.customer.phone),
    history: {
      communications: buildCommunications(detail.notes, detail.actions),
      actions: detail.actions
        .filter((action) => action.title !== "Generate closing strategy" && action.status !== "superseded")
        .map(agentActionFromAction),
      debriefs: buildDebriefs(detail.notes),
      files: [
        ...detail.files.map((file) => ({
          id: file.id,
          name: file.name,
          type: file.type,
          summary: file.summary,
          tags: file.tags,
        })),
        {
          id: `file_${detail.quote.id}_quote`,
          name: `${detail.quote.productSummary} quote`,
          type: "quote",
          summary: `Gross total ${detail.quote.value} EUR. Current board status: ${detail.quote.statusLabel ?? detail.quote.columnId}.`,
          tags: ["quote", detail.quote.productSummary],
        },
      ],
    },
    assistantState: {
      currentStage: currentStage(detail),
      activeBuyerSignals,
      activeObjections,
      ...(previousActiveTask(detail) ? { previousNextBestAction: previousActiveTask(detail) } : {}),
      ...(detail.strategy?.generatedAt ? { lastRecommendationAt: detail.strategy.generatedAt } : {}),
    },
  };
}

export function mapRecommendationToPersistence(
  detail: QuoteDetailPayload,
  recommendation: RecommendationResponse,
  now = new Date().toISOString(),
): RecommendationPersistence {
  const taskType = recommendation.nextBestAction.taskType;
  const nextKind = nextKindForRecommendation(detail.quote, recommendation);
  const stamp = Date.now().toString(36);
  const taskSlug = slugify(taskType);
  const strategyId = detail.strategy?.id ?? `strategy_${detail.quote.id}`;
  const actionId = `action_${detail.quote.id}_${taskSlug}_${stamp}`;
  const stepId = `step_${detail.quote.id}_${taskSlug}_${stamp}`;
  const activeStepNumber = nextStepNumber(detail);
  const activeStep = buildActiveStep({
    id: stepId,
    number: activeStepNumber,
    taskType,
    recommendation,
    now,
  });
  const completedSteps = completedStrategySteps(detail);
  const upcomingSteps = buildUpcomingSteps(taskType, activeStepNumber + 1, recommendation, now);
  const steps = renumberSteps([...completedSteps, activeStep, ...upcomingSteps]);

  const strategy: StrategyRecord = {
    id: strategyId,
    quoteId: detail.quote.id,
    generatedAt: now,
    stale: false,
    headline: recommendation.uiHints.strategyHeadline,
    summary: recommendation.reasoning.summary,
    currentActionId: actionId,
    steps,
    ...(recommendation.generation ? { generation: recommendation.generation } : {}),
  };

  const action: ActionRecord = {
    id: actionId,
    quoteId: detail.quote.id,
    customerId: detail.customer.id,
    strategyId,
    stepId,
    taskType,
    title: recommendation.nextBestAction.title,
    status: "recommended",
    preparationTitle: STEP_META[taskType].guideTitle,
    preparationBody: preparationBodyForAction(taskType, recommendation),
    preparationUpdatedAt: now,
    logPromptTitle: recommendation.uiHints.logPromptTitle,
    defaultLogText: defaultLogText(taskType, detail.customer.name),
  };

  const quotePatch: Partial<QuoteRecord> = {
    strategyId,
    strategyStale: false,
    nextAction: {
      kind: nextKind,
      label: stripNextPrefix(recommendation.uiHints.kanbanNextLabel),
      actionId,
      tone: toneForNextKind(nextKind),
    },
    quoteAgeDays: recommendation.quoteState.quoteAgeDays ?? detail.quote.quoteAgeDays,
    daysSinceLastAction: recommendation.quoteState.daysSinceLastAction ?? detail.quote.daysSinceLastAction,
    ...statusPatchForNextKind(nextKind),
  };

  return { strategy, action, quotePatch };
}

function quoteStatus(quote: QuoteRecord): RecommendRequest["quote"]["status"] {
  if (quote.columnId === "completed" || quote.statusLabel === "Signed") {
    return "signed";
  }
  if (quote.columnId === "waiting_installation") {
    return "accepted";
  }
  return "sent";
}

function signatureState(quote: QuoteRecord): RecommendRequest["quote"]["signatureState"] {
  if (quote.statusLabel === "Signed" || quote.columnId === "completed") {
    return "signed";
  }
  if (quote.statusLabel === "Signature open" || quote.nextAction.kind === "follow_up_signature") {
    return "sent";
  }
  if (quote.nextAction.kind === "send_final_recap") {
    return "ready";
  }
  return "not_ready";
}

function quoteScope(quote: QuoteRecord) {
  return quote.productSummary
    .split(/\s*\+\s*|,\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function consentFromCustomer(preference: string, email: string | undefined, phone: string | undefined) {
  const normalized = preference.toLowerCase();
  const writtenOnly = normalized.includes("written only") || normalized.includes("email only");

  return {
    email: Boolean(email),
    phone: Boolean(phone) && !writtenOnly,
    whatsapp: normalized.includes("whatsapp"),
    tracking: true,
    optOut: normalized.includes("opt out"),
    writtenOnly,
  };
}

function buildCommunications(notes: NoteRecord[], actions: ActionRecord[]): AgentCommunication[] {
  const noteCommunications = notes.map((note) => ({
    id: note.id,
    occurredAt: note.createdAt,
    direction: "inbound" as const,
    channel: channelFromNote(note),
    summary: note.title,
    body: note.body,
  }));
  const actionCommunications = actions
    .filter((action) => action.taskType === "Send Email" || action.taskType === "Send WhatsApp Video Message")
    .map((action) => ({
      id: action.id,
      occurredAt: action.completedAt ?? action.scheduledFor ?? new Date().toISOString(),
      direction: "outbound" as const,
      channel: action.taskType === "Send WhatsApp Video Message" ? ("whatsapp" as const) : ("email" as const),
      summary: action.title,
      outcome: action.status,
    }));

  return [...noteCommunications, ...actionCommunications].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );
}

function channelFromNote(note: NoteRecord): AgentCommunication["channel"] {
  if (note.title.toLowerCase().includes("whatsapp")) {
    return "whatsapp";
  }
  if (note.type === "audio" || note.title.toLowerCase().includes("call")) {
    return "phone";
  }
  if (note.title.toLowerCase().includes("visit")) {
    return "meeting";
  }
  if (note.title.toLowerCase().includes("email")) {
    return "email";
  }
  return "other";
}

function agentActionFromAction(action: ActionRecord): AgentAction {
  const status = action.status === "superseded" ? "cancelled" : action.status;
  return {
    id: action.id,
    taskType: action.taskType,
    status,
    ...(action.scheduledFor ? { scheduledFor: action.scheduledFor } : {}),
    ...(action.completedAt ? { completedAt: action.completedAt } : {}),
    summary: action.title,
    outcomeLabel: action.status,
  };
}

function buildDebriefs(notes: NoteRecord[]): AgentDebrief[] {
  return notes
    .filter((note) => note.title.toLowerCase().includes("debrief"))
    .map((note) => {
      const taskType = note.title.toLowerCase().includes("visit")
        ? "Meeting in person"
        : "Phone Call";
      const objectionState = inferObjectionState(note.body, taskType);
      return {
        id: note.id,
        occurredAt: note.createdAt,
        taskType,
        notes: note.body,
        customerLanguage: extractCustomerLanguage(note.body),
        newFacts: extractFacts(note.body),
        ...objectionState,
      };
    });
}

function inferObjectionState(
  text: string,
  taskType: TaskType,
): Pick<
  AgentDebrief,
  "resolvedObjections" | "remainingObjections" | "newObjections" | "nextCommitment" | "outcomeLabel"
> {
  const normalized = normalize(text);
  const needsVisit =
    includesAny(normalized, ["come look", "look at the house", "roof", "cable path", "house", "dach", "vor ort"]) &&
    !includesAny(normalized, ["looked fine", "answers", "resolved", "confirmed"]);
  const readyToClose = includesAny(normalized, [
    "answers their main concern",
    "answers the main concern",
    "concern resolved",
    "looked fine",
    "final summary",
    "signature",
    "signatur",
  ]);
  const priceConcern = includesAny(normalized, ["price", "preis", "monthly", "payment", "too much", "zu teuer"]);
  const competitorConcern = includesAny(normalized, ["competitor", "vergleich", "another installer"]);

  if (readyToClose || taskType === "Meeting in person") {
    return {
      resolvedObjections: ["needs_site_visit", "roof_or_property_risk"],
      remainingObjections: [],
      newObjections: [],
      nextCommitment: "Send final summary and signature path.",
      outcomeLabel: "Concern resolved; customer is ready for final recap.",
    };
  }

  return {
    resolvedObjections: [],
    remainingObjections: [
      ...(needsVisit ? ["needs_site_visit"] : []),
      ...(priceConcern ? ["roi_payback_distrust"] : []),
      ...(competitorConcern ? ["competitor_offer_comparison"] : []),
    ],
    newObjections: needsVisit ? ["needs_site_visit"] : [],
    ...(needsVisit ? { nextCommitment: "Schedule an in-person site validation visit." } : {}),
    outcomeLabel: needsVisit
      ? "Customer asked for physical validation before deciding."
      : "Customer concern still needs follow-up.",
  };
}

function extractCustomerLanguage(text: string) {
  return text
    .split(/[.!?]\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 24)
    .slice(0, 2);
}

function extractFacts(text: string) {
  const facts = [];
  if (includesAny(normalize(text), ["roof", "dach"])) {
    facts.push("Roof or roof access was discussed.");
  }
  if (includesAny(normalize(text), ["meter", "inverter", "cable path", "zaehler", "wechselrichter"])) {
    facts.push("Meter, inverter, or cable path was discussed.");
  }
  if (includesAny(normalize(text), ["signature", "final summary", "signatur"])) {
    facts.push("Customer asked for the final decision or signature step.");
  }
  return facts;
}

function mapActiveBuyerSignals(ids: string[]) {
  return unique(ids.map((id) => ACTIVE_SIGNAL_MAP[id] ?? id)).filter((id) =>
    [
      "climate_motivated",
      "roi_focused",
      "trust_sensitive",
      "technical_skeptic",
      "comparison_shopper",
      "independence_motivated",
      "convenience_seeker",
      "stakeholder_review",
    ].includes(id),
  );
}

function inferActiveObjections(detail: QuoteDetailPayload) {
  const text = normalize(
    [
      detail.customer.decisionNote,
      detail.customer.householdNote,
      detail.quote.statusLabel,
      ...detail.notes.slice(0, 8).map((note) => note.body),
    ].join(" "),
  );
  const objections = [];
  if (includesAny(text, ["monthly", "payment", "competitor", "vergleich", "price", "preis"])) {
    objections.push("roi_payback_distrust");
  }
  if (includesAny(text, ["competitor", "comparison", "vergleich"])) {
    objections.push("competitor_offer_comparison");
  }
  if (
    includesAny(text, [
      "come look",
      "look at the house",
      "site visit",
      "cable path",
      "roof condition",
      "roof inspection",
      "dach anschauen",
      "vor ort",
    ])
  ) {
    objections.push("needs_site_visit");
  }
  return unique(objections);
}

function currentStage(detail: QuoteDetailPayload) {
  if (detail.quote.columnId === "completed" || detail.quote.statusLabel === "Signed") {
    return "signed";
  }
  if (!detail.strategy || detail.quote.nextAction.kind === "generate_strategy") {
    return "quote_sent_strategy_needed";
  }
  if (detail.quote.nextAction.kind === "log_call" || detail.quote.nextAction.kind === "log_visit") {
    return "task_scheduled";
  }
  return "active_followup";
}

function previousActiveTask(detail: QuoteDetailPayload) {
  return detail.strategy?.steps.find((step) => step.status === "active")?.taskType;
}

function completedStrategySteps(detail: QuoteDetailPayload): StrategyStep[] {
  const completedStepIds = new Set(
    detail.actions
      .filter(
        (action) =>
          action.status === "completed" || action.status === "sent" || action.status === "scheduled",
      )
      .map((action) => action.stepId)
      .filter((stepId): stepId is string => Boolean(stepId)),
  );
  const steps = detail.strategy?.steps ?? [];
  const completed = steps
    .filter((step) => step.status === "completed" || completedStepIds.has(step.id))
    .map((step) => ({ ...step, status: "completed" as const }));
  return uniqueBy(completed, (step) => step.id).sort((a, b) => a.number - b.number);
}

function nextStepNumber(detail: QuoteDetailPayload) {
  return completedStrategySteps(detail).length + 1;
}

function buildActiveStep(params: {
  id: string;
  number: number;
  taskType: ActionTaskType;
  recommendation: RecommendationResponse;
  now: string;
}): StrategyStep {
  const meta = STEP_META[params.taskType];
  const suggestedDateTime =
    params.recommendation.nextBestAction.suggestedSlots[0]?.start ??
    params.recommendation.nextBestAction.calendarEvent?.start ??
    params.now;

  return {
    id: params.id,
    number: params.number,
    phase: meta.phase,
    title: params.recommendation.nextBestAction.title,
    subtitle: truncate(params.recommendation.reasoning.summary, 150),
    taskType: params.taskType,
    status: "active",
    icon: meta.icon,
    guideTitle: meta.guideTitle,
    bullets: visibleStepBullets(params.taskType, params.recommendation),
    whyChips: whyChips(params.recommendation),
    suggestedTime: formatSuggestedDate(suggestedDateTime),
    suggestedDateTime,
    primaryCta: meta.primaryCta,
    secondaryCta: meta.secondaryCta,
  };
}

function visibleStepBullets(taskType: ActionTaskType, recommendation: RecommendationResponse) {
  const base = recommendation.nextBestAction.agendaOrMessagePlan.slice(0, 4);
  const draft = recommendation.nextBestAction.customerFacingDraft;
  if (taskType !== "Send Email" || !draft) {
    return base;
  }
  const firstDraftLine = draft.body
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !line.startsWith("Guten Tag") && !line.startsWith("Hallo"));
  return [
    ...base,
    firstDraftLine ? `Draft opening: ${truncate(firstDraftLine, 130)}` : "Draft email is ready for review.",
  ];
}

function preparationBodyForAction(
  taskType: ActionTaskType,
  recommendation: RecommendationResponse,
) {
  const draft = recommendation.nextBestAction.customerFacingDraft;
  if (taskType === "Send Email" && draft) {
    return [draft.subject ? `Subject: ${draft.subject}` : undefined, draft.body]
      .filter(Boolean)
      .join("\n\n");
  }
  if (taskType === "Send WhatsApp Video Message" && draft) {
    return draft.body;
  }
  if (taskType === "Send Gift") {
    return [
      "Gift note:",
      recommendation.nextBestAction.customerFacingDraft?.body ??
        "Thank the customer for their time and include the decision-support material without making the gesture conditional on signing.",
      "",
      "Prepare:",
      ...recommendation.nextBestAction.proofToPrepare.map((item) => `- ${item}`),
    ].join("\n");
  }
  return recommendation.nextBestAction.agendaOrMessagePlan
    .map((item, index) => `${index + 1}. ${item}`)
    .join("\n");
}

function buildUpcomingSteps(
  taskType: ActionTaskType,
  startNumber: number,
  recommendation: RecommendationResponse,
  now: string,
): StrategyStep[] {
  const upcomingTasks =
    taskType === "Phone Call"
      ? (["Meeting in person", "Send Email"] as const)
      : taskType === "Meeting in person"
        ? (["Send Email"] as const)
        : taskType === "Send WhatsApp Video Message"
          ? (["Phone Call", "Send Email"] as const)
          : taskType === "Send Gift"
            ? (["Send Email"] as const)
            : ([] as const);

  return upcomingTasks.map((upcomingTask, index) => {
    const meta = STEP_META[upcomingTask];
    const suggestedDateTime = addDaysIso(now, index + 1);
    return {
      id: `step_upcoming_${slugify(upcomingTask)}_${startNumber + index}`,
      number: startNumber + index,
      phase: meta.phase,
      title: upcomingTitle(upcomingTask),
      subtitle: "Use this only if the logged outcome points here.",
      taskType: upcomingTask,
      status: "upcoming",
      icon: meta.icon,
      guideTitle: meta.guideTitle,
      bullets: upcomingBullets(upcomingTask),
      whyChips: whyChips(recommendation).slice(0, 2),
      suggestedTime: formatSuggestedDate(suggestedDateTime),
      suggestedDateTime,
      primaryCta: meta.primaryCta,
      secondaryCta: meta.secondaryCta,
    };
  });
}

function upcomingTitle(taskType: ActionTaskType) {
  if (taskType === "Meeting in person") {
    return "Validate the house if the call surfaces site risk";
  }
  if (taskType === "Phone Call") {
    return "Call if the video creates a live question";
  }
  return "Send the recap once the blocker is resolved";
}

function upcomingBullets(taskType: ActionTaskType) {
  if (taskType === "Meeting in person") {
    return [
      "Confirm roof, meter, inverter, and cable-path assumptions.",
      "Keep the visit framed as validation, not pressure.",
      "Leave with one logged decision blocker or final recap commitment.",
    ];
  }
  if (taskType === "Phone Call") {
    return [
      "Ask which point still feels unclear.",
      "Use the customer's words before explaining the quote.",
      "Agree whether the next step is recap, visit, or pause.",
    ];
  }
  return [
    "Summarize what changed or what was confirmed.",
    "List only the remaining decision point.",
    "Make the signature or reply path the single next action.",
  ];
}

function renumberSteps(steps: StrategyStep[]) {
  return steps.map((step, index) => ({ ...step, number: index + 1 }));
}

function whyChips(recommendation: RecommendationResponse): StrategyStep["whyChips"] {
  const evidence = [
    ...recommendation.buyerProfile.objections.map((hit) => ({
      label: hit.name,
      source: "Customer signal",
      icon: "shield",
    })),
    ...recommendation.buyerProfile.signals.map((hit) => ({
      label: hit.name,
      source: "Buyer profile",
      icon: "sparkles",
    })),
  ].slice(0, 3);

  if (evidence.length > 0) {
    return evidence;
  }

  return [
    {
      label: "Fresh quote",
      source: "Deal context",
      icon: "clock",
    },
  ];
}

function nextKindForRecommendation(
  quote: QuoteRecord,
  recommendation: RecommendationResponse,
): QuoteNextKind {
  const taskType = recommendation.nextBestAction.taskType;
  if (taskType === "Phone Call") {
    return "schedule_call";
  }
  if (taskType === "Meeting in person") {
    return "schedule_visit";
  }
  if (taskType === "Send WhatsApp Video Message") {
    return "send_whatsapp_video";
  }
  if (taskType === "Send Gift") {
    return "send_gift";
  }
  if (quote.nextAction.kind === "follow_up_signature" || quote.statusLabel === "Signature open") {
    return "follow_up_signature";
  }
  return "send_final_recap";
}

function toneForNextKind(kind: QuoteNextKind): QuoteRecord["nextAction"]["tone"] {
  if (kind === "none") {
    return "gray";
  }
  if (kind === "generate_strategy" || kind === "send_final_recap" || kind === "send_whatsapp_video") {
    return "blue";
  }
  if (kind === "send_gift") {
    return "green";
  }
  return "yellow";
}

function statusPatchForNextKind(kind: QuoteNextKind): Partial<QuoteRecord> {
  if (kind === "follow_up_signature") {
    return { statusLabel: "Signature open", statusTone: "yellow" };
  }
  if (kind === "send_final_recap") {
    return { statusLabel: "Ready for recap", statusTone: "green" };
  }
  return { statusLabel: undefined, statusTone: undefined };
}

function defaultLogText(taskType: ActionTaskType, customerName: string) {
  const firstName = customerName.split(/\s+/)[0] ?? customerName;
  if (taskType === "Phone Call") {
    return `${firstName} said the price may be okay, but wants someone to come look at the house, roof, and cable path before trusting the final quote.`;
  }
  if (taskType === "Meeting in person") {
    return `Visit completed. Roof condition looked fine. This answers the customer's main concern and they asked for the final summary and signature path.`;
  }
  if (taskType === "Send Email") {
    return `${firstName} signed after receiving the final recap and signature link.`;
  }
  if (taskType === "Send WhatsApp Video Message") {
    return `${firstName} watched the video and asked for a short call to confirm the last open question.`;
  }
  return `${firstName} appreciated the decision pack and asked for a concise written recap.`;
}

function stripNextPrefix(label: string) {
  return label.replace(/^next:\s*/i, "").trim();
}

function diffDays(from: string | undefined, to: string) {
  if (!from) {
    return undefined;
  }
  const start = new Date(from);
  const end = new Date(to);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return undefined;
  }
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86_400_000));
}

function formatSuggestedDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function addDaysIso(value: string, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(normalize(term)));
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function uniqueBy<T>(values: T[], key: (value: T) => string) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const id = key(value);
    if (seen.has(id)) {
      return false;
    }
    seen.add(id);
    return true;
  });
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1).trim()}...`;
}
