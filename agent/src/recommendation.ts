import { randomUUID } from "node:crypto";

import {
  buildKnowledgeReferences,
  getBuyerSignal,
  getDecisionRule,
  getObjection,
  getTaskPlaybook,
  loadKnowledgeBase,
  selectReviewObservations,
  type LoadedKnowledgeBase,
} from "./knowledgebase.js";
import {
  RecommendationResponseSchema,
  TASK_TYPES,
  type EvidenceHit,
  type RecommendRequest,
  type RecommendationResponse,
  type TaskType,
} from "./schemas.js";

type Scorecard = Record<TaskType, number>;

type EvidenceBucket = {
  confidence: number;
  matchedTerms: Set<string>;
  reasons: Set<string>;
};

type FactorImpact = "positive" | "negative" | "constraint" | "tie_breaker";

type DecisionFactor = {
  factor: string;
  impact: FactorImpact;
  detail: string;
};

type Diagnosis = {
  stage: string;
  quoteAgeDays?: number;
  daysSinceLastAction?: number;
  lastActionSummary?: string;
  signalHits: EvidenceHit[];
  objectionHits: EvidenceHit[];
  signalIds: string[];
  objectionIds: string[];
  primaryConcern: string;
  confidence: "low" | "medium" | "high";
  missingData: string[];
  riskFlags: string[];
  corpus: string;
  latestDebriefText: string;
  directTaskHints: Map<TaskType, string>;
};

const DEFAULT_WORKING_HOURS = [
  { dayOfWeek: 1, start: "09:00", end: "17:00" },
  { dayOfWeek: 2, start: "09:00", end: "17:00" },
  { dayOfWeek: 3, start: "09:00", end: "17:00" },
  { dayOfWeek: 4, start: "09:00", end: "17:00" },
  { dayOfWeek: 5, start: "09:00", end: "15:00" },
];

const TASK_PRIORITY: Record<TaskType, number> = {
  "Meeting in person": 5,
  "Phone Call": 4,
  "Send Email": 3,
  "Send WhatsApp Video Message": 2,
  "Send Gift": 1,
};

const TASK_DURATION_MINUTES: Partial<Record<TaskType, number>> = {
  "Phone Call": 20,
  "Meeting in person": 60,
};

const MANUAL_TASK_TERMS: Array<{ taskType: TaskType; terms: string[] }> = [
  {
    taskType: "Phone Call",
    terms: ["call", "phone", "telefon", "anruf", "ruckruf", "rueckruf"],
  },
  {
    taskType: "Send Email",
    terms: ["email", "mail", "written", "schriftlich", "recap", "summary", "zusammenfassung"],
  },
  {
    taskType: "Meeting in person",
    terms: ["visit", "meeting", "in person", "vor ort", "house", "home", "roof", "dach"],
  },
  {
    taskType: "Send WhatsApp Video Message",
    terms: ["whatsapp", "video", "screen recording", "walkthrough"],
  },
  {
    taskType: "Send Gift",
    terms: ["gift", "thank you", "danke", "coffee", "kaffee"],
  },
];

const KEYWORD_RULES: Array<{
  id: string;
  terms: string[];
  signals?: string[];
  objections?: string[];
  reason: string;
  taskHint?: TaskType;
}> = [
  {
    id: "price_roi",
    terms: [
      "zu teuer",
      "preis",
      "rabatt",
      "discount",
      "budget",
      "lohnt",
      "amortisation",
      "amortization",
      "payback",
      "roi",
      "rendite",
      "strompreis",
      "was spare ich",
    ],
    signals: ["roi_focused", "price_shock"],
    objections: ["upfront_price_shock", "roi_payback_distrust"],
    reason: "Customer language points to price, ROI, or payback uncertainty.",
  },
  {
    id: "competitor",
    terms: [
      "competitor",
      "another quote",
      "cheaper offer",
      "other provider",
      "vergleich",
      "vergleichsangebot",
      "zweites angebot",
      "anderer anbieter",
      "warum seid ihr teurer",
    ],
    signals: ["comparison_shopper", "price_shock"],
    objections: ["competitor_offer_comparison"],
    reason: "The customer appears to be comparing providers or scopes.",
  },
  {
    id: "site_visit",
    terms: [
      "someone to come",
      "look at the house",
      "come take a look",
      "house inspection",
      "site visit",
      "vor ort",
      "haus anschauen",
      "dach anschauen",
      "roof inspection",
      "cable path",
      "kabelweg",
      "meter location",
      "zahlerplatz",
      "zaehlerplatz",
    ],
    signals: ["site_visit_needed", "technical_skeptic", "trust_sensitive"],
    objections: ["needs_site_visit"],
    reason: "The decision depends on physical validation at the home.",
    taskHint: "Meeting in person",
  },
  {
    id: "roof_property_risk",
    terms: [
      "roof",
      "dach",
      "ziegel",
      "tile",
      "undicht",
      "leak",
      "wasserschaden",
      "damage",
      "haftet",
      "insurance",
      "versicherung",
    ],
    signals: ["site_visit_needed", "technical_skeptic", "trust_sensitive"],
    objections: ["roof_or_property_risk"],
    reason: "Roof or property risk is active enough to require concrete proof.",
  },
  {
    id: "battery_independence",
    terms: [
      "battery too big",
      "battery later",
      "speicher lohnt",
      "akku zu gross",
      "batterie spaeter",
      "autark",
      "unabhaengig",
      "unabhangig",
      "eigener strom",
      "wallbox",
      "ev",
    ],
    signals: ["independence_motivated", "technical_skeptic"],
    objections: ["battery_value_or_sizing"],
    reason: "Battery or autonomy language suggests a scenario tradeoff, not generic persuasion.",
  },
  {
    id: "winter_shade_heatpump",
    terms: [
      "winter",
      "shade",
      "shadow",
      "verschattung",
      "bewolkt",
      "bewoelkt",
      "cloud",
      "monthly output",
      "ertrag",
      "warmepumpe",
      "waermepumpe",
      "heat pump",
      "jaz",
      "altbau",
    ],
    signals: ["technical_skeptic", "independence_motivated"],
    objections: ["winter_or_shade_performance", "heat_pump_monthly_burden_or_building_fit"],
    reason: "Technical performance concern should be answered with data and limits.",
  },
  {
    id: "stakeholder",
    terms: [
      "partner",
      "spouse",
      "wife",
      "husband",
      "advisor",
      "berater",
      "parents",
      "eltern",
      "family",
      "familie",
      "needs to review",
      "besprechen",
      "gemeinsam anschauen",
      "drueber schauen",
    ],
    signals: ["stakeholder_review"],
    objections: ["stakeholder_or_advisor_review"],
    reason: "Another stakeholder needs a shareable decision artifact.",
  },
  {
    id: "paperwork_aftercare",
    terms: [
      "paperwork",
      "formalitaeten",
      "papierkram",
      "registration",
      "anmeldung",
      "netzbetreiber",
      "grid",
      "meter",
      "zahler",
      "zaehler",
      "handover",
      "aftercare",
      "support",
      "warranty",
      "garantie",
      "wer kummert",
      "wer kuemmert",
    ],
    signals: ["convenience_seeker", "trust_sensitive"],
    objections: ["paperwork_grid_or_admin_uncertainty", "aftercare_or_support_concern"],
    reason: "Process ownership or aftercare clarity is part of the decision.",
  },
  {
    id: "trust_pressure",
    terms: [
      "pressure",
      "pushy",
      "aufdringlich",
      "druck",
      "not serious",
      "nicht serioes",
      "vertrauen",
      "who is responsible",
      "wer ist verantwortlich",
      "no reply",
      "keine antwort",
      "keine rueckmeldung",
    ],
    signals: ["trust_sensitive"],
    objections: ["installer_trust_or_pressure", "responsiveness_or_continuity_gap"],
    reason: "Trust or continuity is a live blocker.",
  },
  {
    id: "climate",
    terms: ["co2", "klima", "climate", "nachhaltig", "sustainable", "umwelt", "green power"],
    signals: ["climate_motivated"],
    reason: "The customer explicitly references environmental impact.",
  },
  {
    id: "ready_to_close",
    terms: [
      "concerns resolved",
      "answers their main concern",
      "looks good",
      "passt",
      "machen wir",
      "next step",
      "naechste schritt",
      "vertrag",
      "contract",
      "signature",
      "unterschrift",
      "sign",
      "send final summary",
      "final summary",
    ],
    signals: ["ready_to_close"],
    reason: "The latest customer language suggests the blocker is resolved or close to resolved.",
    taskHint: "Send Email",
  },
  {
    id: "needs_time",
    terms: [
      "needs time",
      "review later",
      "will get back",
      "not ready",
      "pause",
      "wir melden uns",
      "noch zeit",
    ],
    signals: ["ghosting_risk"],
    objections: ["no_response_or_ghosting"],
    reason: "The customer needs time; further outreach should add clear value.",
  },
  {
    id: "signed",
    terms: ["contract signed", "signed", "unterschrieben"],
    signals: ["ready_to_close"],
    reason: "The customer appears to have signed or committed.",
  },
];

export function recommendNextAction(input: RecommendRequest): RecommendationResponse {
  const kb = loadKnowledgeBase();
  const diagnosis = diagnose(input, kb);
  const { scorecard, factors, requiredProof } = scoreTasks(input, diagnosis, kb);
  const selectedTask = chooseTask(scorecard);
  const selectedScore = scorecard[selectedTask];
  const slots = getSuggestedSlots(input, selectedTask);
  const playbook = getTaskPlaybook(kb, selectedTask);
  const reviewTerms = [
    ...diagnosis.signalIds,
    ...diagnosis.objectionIds,
    diagnosis.primaryConcern,
    selectedTask,
  ];
  const reviewObservations = selectReviewObservations(kb, reviewTerms);
  const knowledgeUsed = buildKnowledgeReferences({
    taskType: selectedTask,
    signalIds: diagnosis.signalIds,
    objectionIds: diagnosis.objectionIds,
    reviewObservations,
  });
  const proofToPrepare = unique([
    ...requiredProof,
    ...collectProofFromObjections(kb, diagnosis.objectionIds),
    ...proofFromTask(selectedTask, diagnosis),
  ]).slice(0, 7);
  const internalPrepChecklist = unique([
    ...(playbook.prep_needed ?? []),
    ...diagnosis.missingData.map((item) => `Check or collect: ${item}`),
  ]).slice(0, 8);
  const suggestedSlots = slots.slice(0, 3);
  const durationMinutes = TASK_DURATION_MINUTES[selectedTask];
  const calendarEvent = buildCalendarEvent(input, selectedTask, suggestedSlots[0], diagnosis);
  const customerFacingDraft = buildCustomerFacingDraft(input, selectedTask, diagnosis);
  const alternatives = rankTasks(scorecard)
    .filter(({ taskType }) => taskType !== selectedTask)
    .filter(({ score }) => score > -999)
    .slice(0, 2)
    .map(({ taskType, score }) => ({
      taskType,
      score,
      whyNotFirst: explainAlternative(taskType, selectedTask, diagnosis),
    }));

  const response: RecommendationResponse = {
    recommendationId: randomUUID(),
    generatedAt: input.now,
    requestId: input.requestId,
    quoteState: buildQuoteState(diagnosis),
    buyerProfile: {
      primaryConcern: diagnosis.primaryConcern,
      confidence: diagnosis.confidence,
      signals: diagnosis.signalHits,
      objections: diagnosis.objectionHits,
      missingData: diagnosis.missingData,
      riskFlags: diagnosis.riskFlags,
    },
    nextBestAction: {
      taskType: selectedTask,
      title: buildActionTitle(selectedTask, diagnosis),
      priority: selectedScore >= 70 ? "high" : selectedScore >= 35 ? "medium" : "low",
      timing: buildTiming(input, selectedTask, suggestedSlots),
      ...(durationMinutes === undefined ? {} : { durationMinutes }),
      suggestedSlots,
      ...(calendarEvent === undefined ? {} : { calendarEvent }),
      agendaOrMessagePlan: buildAgendaOrMessagePlan(selectedTask, diagnosis, input),
      proofToPrepare,
      internalPrepChecklist,
      ...(customerFacingDraft === undefined ? {} : { customerFacingDraft }),
    },
    reasoning: {
      summary: buildReasoningSummary(selectedTask, diagnosis),
      decisionFactors: factors,
      knowledgeUsed,
      scorecard,
      alternatives,
    },
    debriefPrompt: buildDebriefPrompt(playbook, selectedTask),
    uiHints: {
      kanbanNextLabel: buildKanbanNextLabel(selectedTask),
      strategyHeadline: buildStrategyHeadline(selectedTask, diagnosis),
      ...(calendarEvent === undefined ? {} : { calendarActionLabel: "Add to calendar" }),
      logPromptTitle: `Log outcome after ${selectedTask.toLowerCase()}`,
    },
  };

  return RecommendationResponseSchema.parse(response);
}

function diagnose(input: RecommendRequest, kb: LoadedKnowledgeBase): Diagnosis {
  const signalEvidence = new Map<string, EvidenceBucket>();
  const objectionEvidence = new Map<string, EvidenceBucket>();
  const directTaskHints = new Map<TaskType, string>();
  const texts = collectText(input);
  const corpus = normalizeText(texts.join("\n"));
  const latestDebrief = getLatestDebrief(input);
  const latestDebriefText = normalizeText(
    [
      latestDebrief?.notes,
      ...(latestDebrief?.customerLanguage ?? []),
      ...(latestDebrief?.newFacts ?? []),
      latestDebrief?.nextCommitment,
      latestDebrief?.outcomeLabel,
    ]
      .filter(Boolean)
      .join(" "),
  );

  for (const id of input.assistantState.activeBuyerSignals) {
    addEvidence(signalEvidence, id, 0.68, "provided assistant state", "Existing strategy state.");
  }

  for (const id of input.assistantState.activeObjections) {
    addEvidence(objectionEvidence, id, 0.7, "provided assistant state", "Existing strategy state.");
  }

  for (const debrief of input.history.debriefs) {
    for (const id of debrief.remainingObjections) {
      addEvidence(objectionEvidence, id, 0.78, "remaining objection", "Installer logged it as unresolved.");
    }
    for (const id of debrief.newObjections) {
      addEvidence(objectionEvidence, id, 0.76, "new objection", "Installer logged it as newly raised.");
    }
  }

  for (const signal of kb.buyerSignals) {
    const matchedTerms = termsFound(corpus, signal.language_clues ?? []);
    if (matchedTerms.length > 0) {
      addEvidence(
        signalEvidence,
        signal.id,
        0.74,
        matchedTerms,
        signal.what_it_usually_means ?? signal.definition,
      );
    }
  }

  for (const objection of kb.objections) {
    const matchedTerms = termsFound(corpus, objection.customer_wording ?? []);
    if (matchedTerms.length > 0) {
      addEvidence(
        objectionEvidence,
        objection.id,
        0.78,
        matchedTerms,
        objection.underlying_concern ?? objection.name,
      );
    }
  }

  for (const rule of KEYWORD_RULES) {
    const matchedTerms = termsFound(corpus, rule.terms);
    if (matchedTerms.length === 0) {
      continue;
    }
    for (const signalId of rule.signals ?? []) {
      addEvidence(signalEvidence, signalId, 0.82, matchedTerms, rule.reason);
    }
    for (const objectionId of rule.objections ?? []) {
      addEvidence(objectionEvidence, objectionId, 0.84, matchedTerms, rule.reason);
    }
    if (rule.taskHint) {
      directTaskHints.set(rule.taskHint, rule.reason);
    }
  }

  for (const rule of kb.debriefRules.update_rules ?? []) {
    const matchedTerms = termsFound(latestDebriefText || corpus, rule.if_debrief_contains ?? []);
    if (matchedTerms.length === 0) {
      continue;
    }
    for (const signalId of rule.set_or_boost?.buyer_signals ?? []) {
      addEvidence(
        signalEvidence,
        signalId,
        0.86,
        matchedTerms,
        rule.next_step_note ?? "Matched debrief update rule.",
      );
    }
    for (const objectionId of rule.set_or_boost?.objections ?? []) {
      addEvidence(
        objectionEvidence,
        objectionId,
        0.86,
        matchedTerms,
        rule.next_step_note ?? "Matched debrief update rule.",
      );
    }
    if (rule.set_or_boost?.task_type) {
      directTaskHints.set(rule.set_or_boost.task_type, rule.next_step_note ?? rule.id);
    }
  }

  for (const termRule of MANUAL_TASK_TERMS) {
    const instruction = normalizeText(input.trigger.installerInstruction ?? "");
    if (instruction && termsFound(instruction, termRule.terms).length > 0) {
      directTaskHints.set(
        termRule.taskType,
        "Installer revision request explicitly points to this task type.",
      );
    }
  }

  const quoteAgeDays = diffDays(input.quote.sentAt, input.now);
  const daysSinceLastAction = getDaysSinceLastAction(input);
  const latestInbound = getLatestCommunication(input, "inbound");
  const noRecentResponse =
    quoteAgeDays !== undefined &&
    quoteAgeDays >= 10 &&
    (daysSinceLastAction === undefined || daysSinceLastAction >= 5) &&
    latestInbound === undefined;

  if (noRecentResponse) {
    addEvidence(
      signalEvidence,
      "ghosting_risk",
      0.72,
      "quote age/no recent customer response",
      "The quote is stale and there is no recent inbound response.",
    );
    addEvidence(
      objectionEvidence,
      "no_response_or_ghosting",
      0.72,
      "quote age/no recent customer response",
      "Repeated pressure is likely to reduce trust.",
    );
  }

  applyResolvedObjections(input, objectionEvidence, signalEvidence);

  const signalHits = toEvidenceHits(signalEvidence, kb, "signal");
  const objectionHits = toEvidenceHits(objectionEvidence, kb, "objection");
  const signalIds = signalHits.map((hit) => hit.id);
  const objectionIds = objectionHits.map((hit) => hit.id);
  const stage = determineStage(input, signalIds, objectionIds);
  const primaryConcern = inferPrimaryConcern(signalHits, objectionHits, stage);
  const missingData = inferMissingData(input, kb, objectionIds, signalIds);
  const riskFlags = inferRiskFlags(input, signalIds, objectionIds, quoteAgeDays);
  const lastActionSummary = getLastActionSummary(input);

  return {
    stage,
    ...(quoteAgeDays === undefined ? {} : { quoteAgeDays }),
    ...(daysSinceLastAction === undefined ? {} : { daysSinceLastAction }),
    ...(lastActionSummary === undefined ? {} : { lastActionSummary }),
    signalHits,
    objectionHits,
    signalIds,
    objectionIds,
    primaryConcern,
    confidence: inferConfidence(signalHits, objectionHits),
    missingData,
    riskFlags,
    corpus,
    latestDebriefText,
    directTaskHints,
  };
}

function scoreTasks(
  input: RecommendRequest,
  diagnosis: Diagnosis,
  kb: LoadedKnowledgeBase,
): { scorecard: Scorecard; factors: DecisionFactor[]; requiredProof: string[] } {
  const scorecard = Object.fromEntries(TASK_TYPES.map((taskType) => [taskType, 0])) as Scorecard;
  const factors: DecisionFactor[] = [];
  const requiredProof: string[] = [];
  const objectionIds = new Set(diagnosis.objectionIds);
  const signalIds = new Set(diagnosis.signalIds);

  if (input.trigger.type === "customer_reply_added" || input.trigger.type === "debrief_added") {
    addScores(scorecard, ["Phone Call", "Send Email", "Meeting in person", "Send WhatsApp Video Message"], 20);
    factors.push({
      factor: "customer_initiated_or_new_debrief",
      impact: "positive",
      detail: "New information means a refreshed, specific next action is useful.",
    });
  }

  if ((input.quote.totalGross ?? 0) >= 20_000) {
    addScores(scorecard, ["Phone Call", "Meeting in person"], 10);
    factors.push({
      factor: "high_quote_value",
      impact: "positive",
      detail: "High-value home energy decisions benefit from a human or site-specific step when blockers are unclear.",
    });
  }

  if ((input.installer.proofAssets ?? []).length > 0) {
    addScores(scorecard, ["Send Email", "Send WhatsApp Video Message"], 10);
    factors.push({
      factor: "proof_assets_available",
      impact: "positive",
      detail: "The installer has proof assets that can support a written or visual follow-up.",
    });
  }

  if (diagnosis.objectionIds.length === 0 && input.quote.status !== "signed") {
    addScores(scorecard, ["Phone Call"], input.consent.phone ? 25 : 0);
    addScores(scorecard, ["Send Email"], input.consent.email ? 15 : 0);
    factors.push({
      factor: "fresh_or_unclear_blocker",
      impact: "positive",
      detail: "No explicit blocker is known yet, so the best first job is diagnosis and trust-building.",
    });
  }

  applyDecisionRule("roi_or_competitor", ["roi_payback_distrust", "competitor_offer_comparison"]);
  applyDecisionRule("proposal_clarity_low", [
    "proposal_clarity_or_bundle_suspicion",
    "upfront_price_shock",
  ]);
  applyDecisionRule("site_visit_requested_or_physical_blocker", [
    "needs_site_visit",
    "roof_or_property_risk",
  ]);
  applyDecisionRule("winter_heat_pump_or_shade", [
    "winter_or_shade_performance",
    "heat_pump_monthly_burden_or_building_fit",
  ]);
  applyDecisionRule("partner_or_advisor_review", ["stakeholder_or_advisor_review"]);
  applyDecisionRule("paperwork_or_aftercare", [
    "paperwork_grid_or_admin_uncertainty",
    "aftercare_or_support_concern",
  ]);

  if (signalIds.has("ready_to_close") && diagnosis.objectionIds.length === 0) {
    applyDecisionRule("ready_to_close", []);
  }

  if (objectionIds.has("battery_value_or_sizing")) {
    addScores(scorecard, ["Send WhatsApp Video Message"], input.consent.whatsapp ? 45 : 0);
    addScores(scorecard, ["Send Email"], 35);
    addScores(scorecard, ["Phone Call"], 25);
    requiredProof.push("battery now versus battery-ready-later scenario");
    factors.push({
      factor: "battery_value_or_sizing",
      impact: "positive",
      detail: "A battery sizing doubt needs a visual or written scenario comparison.",
    });
  }

  if (objectionIds.has("no_response_or_ghosting")) {
    applyDecisionRule("stale_no_response", []);
  }

  for (const [taskType, reason] of diagnosis.directTaskHints.entries()) {
    addScores(scorecard, [taskType], 45);
    factors.push({
      factor: "customer_or_installer_requested_task",
      impact: "positive",
      detail: `${taskType}: ${reason}`,
    });
  }

  if (input.consent.optOut) {
    for (const taskType of TASK_TYPES) {
      scorecard[taskType] = -999;
    }
    factors.push({
      factor: "customer_opted_out",
      impact: "constraint",
      detail: "Outbound recommendations are suppressed because opt-out is true.",
    });
  } else {
    if (!input.consent.phone || input.consent.writtenOnly) {
      scorecard["Phone Call"] = -999;
      factors.push({
        factor: "phone_not_consented",
        impact: "constraint",
        detail: "Phone calls are unavailable without phone consent or when written-only is requested.",
      });
    }
    if (!input.consent.email) {
      scorecard["Send Email"] = -999;
      factors.push({
        factor: "email_not_consented",
        impact: "constraint",
        detail: "Email is unavailable without email consent.",
      });
    }
    if (!input.consent.whatsapp || input.consent.writtenOnly) {
      scorecard["Send WhatsApp Video Message"] = -999;
      factors.push({
        factor: "whatsapp_not_consented",
        impact: "constraint",
        detail: "WhatsApp is unavailable without opt-in or when written-only is requested.",
      });
    }
  }

  if (!isGiftAllowed(input, diagnosis)) {
    scorecard["Send Gift"] = -999;
    factors.push({
      factor: "gift_guardrail",
      impact: "constraint",
      detail: "Gift is blocked unless it follows a meaningful interaction, is low-value, and does not distract from active objections.",
    });
  } else {
    addScores(scorecard, ["Send Gift"], 25);
  }

  if (diagnosis.objectionIds.includes("needs_site_visit") && input.customer.address === undefined) {
    addScores(scorecard, ["Meeting in person"], -10);
    factors.push({
      factor: "missing_visit_address",
      impact: "negative",
      detail: "A visit fits the blocker, but the address or access note should be checked.",
    });
  }

  const meetingSlots = getSuggestedSlots(input, "Meeting in person");
  if (scorecard["Meeting in person"] > 0 && meetingSlots.length === 0) {
    addScores(scorecard, ["Meeting in person"], -20);
    factors.push({
      factor: "calendar_capacity",
      impact: "negative",
      detail: "No realistic meeting slot was found in the next seven days.",
    });
  }

  if (!input.consent.tracking && objectionIds.has("no_response_or_ghosting")) {
    factors.push({
      factor: "no_tracking_consent",
      impact: "constraint",
      detail: "Ghosting risk is based on known history only, not open or click tracking.",
    });
  }

  return { scorecard, factors, requiredProof };

  function applyDecisionRule(ruleId: string, triggeringObjections: string[]) {
    if (
      triggeringObjections.length > 0 &&
      !triggeringObjections.some((objectionId) => objectionIds.has(objectionId))
    ) {
      return;
    }

    const rule = getDecisionRule(kb, ruleId);
    if (!rule?.score_adjustments) {
      return;
    }

    for (const [taskType, delta] of Object.entries(rule.score_adjustments)) {
      addScores(scorecard, [taskType as TaskType], delta ?? 0);
    }
    requiredProof.push(...(rule.required_proof ?? []));
    factors.push({
      factor: ruleId,
      impact: ruleId === "stale_no_response" ? "negative" : "positive",
      detail: rule.rationale ?? "Knowledgebase decision rule applied.",
    });
  }
}

function collectText(input: RecommendRequest): string[] {
  const quoteAssumptions = input.quote.assumptions
    ? Object.entries(input.quote.assumptions).map(([key, value]) => `${key}: ${String(value)}`)
    : [];

  return [
    input.trigger.installerInstruction,
    input.assistantState.currentStage,
    ...input.assistantState.activeBuyerSignals,
    ...input.assistantState.activeObjections,
    input.customer.name,
    input.customer.address,
    input.customer.decisionMakersNote,
    input.customer.householdOrPropertyNotes,
    ...input.customer.explicitMotives,
    ...input.customer.statedConcerns,
    ...input.quote.scope,
    ...input.quote.lineItems.map((item) => item.label),
    ...quoteAssumptions,
    ...input.history.communications.flatMap((communication) => [
      communication.summary,
      communication.body,
      communication.outcome,
    ]),
    ...input.history.actions.flatMap((action) => [
      action.taskType,
      action.status,
      action.summary,
      action.outcomeLabel,
    ]),
    ...input.history.debriefs.flatMap((debrief) => [
      debrief.notes,
      ...debrief.customerLanguage,
      ...debrief.newFacts,
      ...debrief.resolvedObjections,
      ...debrief.remainingObjections,
      ...debrief.newObjections,
      debrief.nextCommitment,
      debrief.outcomeLabel,
    ]),
    ...input.history.files.flatMap((file) => [file.name, file.summary, ...file.tags]),
  ].filter((value): value is string => Boolean(value));
}

function addEvidence(
  map: Map<string, EvidenceBucket>,
  id: string,
  confidence: number,
  terms: string[] | string,
  reason: string,
) {
  const bucket =
    map.get(id) ??
    ({
      confidence: 0,
      matchedTerms: new Set<string>(),
      reasons: new Set<string>(),
    } satisfies EvidenceBucket);

  bucket.confidence = Math.max(bucket.confidence, confidence);
  for (const term of Array.isArray(terms) ? terms : [terms]) {
    bucket.matchedTerms.add(term);
  }
  bucket.reasons.add(reason);
  map.set(id, bucket);
}

function applyResolvedObjections(
  input: RecommendRequest,
  objectionEvidence: Map<string, EvidenceBucket>,
  signalEvidence: Map<string, EvidenceBucket>,
) {
  const latestDebrief = getLatestDebrief(input);
  if (!latestDebrief) {
    return;
  }

  for (const objectionId of latestDebrief.resolvedObjections) {
    objectionEvidence.delete(objectionId);
  }

  const latestText = normalizeText(
    [
      latestDebrief.notes,
      ...latestDebrief.customerLanguage,
      ...latestDebrief.newFacts,
      latestDebrief.nextCommitment,
      latestDebrief.outcomeLabel,
    ].join(" "),
  );
  const readyTerms = [
    "concerns resolved",
    "answers their main concern",
    "answers the main concern",
    "main concern resolved",
    "looks good",
    "send final summary",
    "final summary",
    "contract",
    "signature",
    "unterschrift",
  ];

  if (
    termsFound(latestText, readyTerms).length > 0 &&
    latestDebrief.remainingObjections.length === 0 &&
    latestDebrief.newObjections.length === 0
  ) {
    objectionEvidence.clear();
    addEvidence(
      signalEvidence,
      "ready_to_close",
      0.9,
      "latest debrief",
      "Latest debrief says the main concern is resolved and the customer wants the final step.",
    );
  }
}

function toEvidenceHits(
  map: Map<string, EvidenceBucket>,
  kb: LoadedKnowledgeBase,
  kind: "signal" | "objection",
): EvidenceHit[] {
  return [...map.entries()]
    .map(([id, bucket]) => {
      const entry = kind === "signal" ? getBuyerSignal(kb, id) : getObjection(kb, id);
      return {
        id,
        name: entry?.name ?? humanizeId(id),
        confidence: round(bucket.confidence, 2),
        matchedTerms: [...bucket.matchedTerms].slice(0, 8),
        whyItMatters:
          [...bucket.reasons][0] ??
          (kind === "signal" ? "Matched buyer signal." : "Matched customer objection."),
      };
    })
    .sort((a, b) => b.confidence - a.confidence || a.name.localeCompare(b.name));
}

function determineStage(input: RecommendRequest, signalIds: string[], objectionIds: string[]) {
  const latestAction = getLatestAction(input);

  if (input.quote.status === "signed" || textHas(input.history.debriefs.map((d) => d.outcomeLabel).join(" "), ["signed"])) {
    return "signed";
  }
  if (input.quote.status === "lost") {
    return "lost";
  }
  if (signalIds.includes("ready_to_close") && objectionIds.length === 0) {
    return "contract_ready";
  }
  if (latestAction?.status === "scheduled") {
    return "task_scheduled";
  }
  if (input.trigger.type === "debrief_added" || input.trigger.type === "customer_reply_added") {
    return "strategy_update_needed";
  }
  if (input.assistantState.currentStage) {
    return input.assistantState.currentStage;
  }
  if (input.history.actions.length === 0 && input.quote.status === "sent") {
    return "quote_sent_strategy_needed";
  }
  return "active_followup";
}

function inferPrimaryConcern(signalHits: EvidenceHit[], objectionHits: EvidenceHit[], stage: string) {
  if (stage === "signed") {
    return "Customer signed; sales follow-up should stop.";
  }

  const primaryObjection = objectionHits[0];
  if (primaryObjection) {
    return primaryObjection.name;
  }

  const primarySignal = signalHits[0];
  if (primarySignal) {
    return primarySignal.name;
  }

  return "No explicit blocker yet";
}

function inferConfidence(signalHits: EvidenceHit[], objectionHits: EvidenceHit[]): "low" | "medium" | "high" {
  const topConfidence = Math.max(
    signalHits[0]?.confidence ?? 0,
    objectionHits[0]?.confidence ?? 0,
  );
  if (topConfidence >= 0.85 || objectionHits.length >= 2) {
    return "high";
  }
  if (topConfidence >= 0.65 || signalHits.length > 0 || objectionHits.length > 0) {
    return "medium";
  }
  return "low";
}

function inferMissingData(
  input: RecommendRequest,
  kb: LoadedKnowledgeBase,
  objectionIds: string[],
  signalIds: string[],
) {
  const missing = new Set<string>();

  for (const objectionId of objectionIds) {
    const objection = getObjection(kb, objectionId);
    for (const item of objection?.missing_data_to_check ?? []) {
      missing.add(item);
    }
  }

  if (
    (objectionIds.includes("roi_payback_distrust") || signalIds.includes("roi_focused")) &&
    input.quote.assumptions === undefined
  ) {
    missing.add("ROI assumptions used in the quote");
  }
  if (input.quote.lineItems.length === 0) {
    missing.add("Quote line-item breakdown");
  }
  if (objectionIds.includes("needs_site_visit") && input.customer.address === undefined) {
    missing.add("Customer address and access notes");
  }
  if (objectionIds.includes("competitor_offer_comparison")) {
    missing.add("Competitor quote scope if the customer is willing to share it");
  }

  return [...missing].slice(0, 8);
}

function inferRiskFlags(
  input: RecommendRequest,
  signalIds: string[],
  objectionIds: string[],
  quoteAgeDays: number | undefined,
) {
  const flags: string[] = [];

  if (quoteAgeDays !== undefined && quoteAgeDays >= 10) {
    flags.push(`Quote is ${quoteAgeDays} days old`);
  }
  if (signalIds.includes("ghosting_risk") || objectionIds.includes("no_response_or_ghosting")) {
    flags.push("Ghosting risk should be treated as a hypothesis");
  }
  if (objectionIds.includes("competitor_offer_comparison")) {
    flags.push("Customer may compare scope and exclusions, not only price");
  }
  if (!input.consent.tracking) {
    flags.push("Do not rely on open/click tracking");
  }
  if (!input.consent.phone) {
    flags.push("Phone channel unavailable");
  }
  if (!input.consent.whatsapp) {
    flags.push("WhatsApp channel unavailable");
  }

  return flags;
}

function collectProofFromObjections(kb: LoadedKnowledgeBase, objectionIds: string[]) {
  return unique(
    objectionIds.flatMap((objectionId) => getObjection(kb, objectionId)?.proof_that_helps ?? []),
  ).slice(0, 6);
}

function proofFromTask(taskType: TaskType, diagnosis: Diagnosis) {
  if (taskType === "Phone Call") {
    return ["quote recap", "top open questions", "checked assumptions"];
  }
  if (taskType === "Meeting in person") {
    return ["visit agenda", "roof, meter, inverter, and cable-path inspection checklist"];
  }
  if (taskType === "Send Email" && diagnosis.signalIds.includes("ready_to_close")) {
    return ["post-visit recap", "final quote summary", "signature path"];
  }
  if (taskType === "Send Email") {
    return ["structured written recap", "one clear next step"];
  }
  if (taskType === "Send WhatsApp Video Message") {
    return ["visual quote section or chart to show", "short reply option"];
  }
  return ["low-value useful decision-support item", "non-conditional message text"];
}

function chooseTask(scorecard: Scorecard): TaskType {
  return rankTasks(scorecard)[0]?.taskType ?? "Send Email";
}

function rankTasks(scorecard: Scorecard): Array<{ taskType: TaskType; score: number }> {
  return TASK_TYPES.map((taskType) => ({ taskType, score: scorecard[taskType] })).sort(
    (a, b) => b.score - a.score || TASK_PRIORITY[b.taskType] - TASK_PRIORITY[a.taskType],
  );
}

function addScores(scorecard: Scorecard, taskTypes: TaskType[], delta: number) {
  for (const taskType of taskTypes) {
    if (scorecard[taskType] <= -999) {
      continue;
    }
    scorecard[taskType] += delta;
  }
}

function isGiftAllowed(input: RecommendRequest, diagnosis: Diagnosis) {
  const meaningfulPriorInteraction = input.history.actions.some(
    (action) =>
      action.status === "completed" &&
      (action.taskType === "Phone Call" || action.taskType === "Meeting in person"),
  );
  const hasActivePriceOrNoResponse =
    diagnosis.objectionIds.includes("upfront_price_shock") ||
    diagnosis.objectionIds.includes("roi_payback_distrust") ||
    diagnosis.objectionIds.includes("competitor_offer_comparison") ||
    diagnosis.objectionIds.includes("no_response_or_ghosting");
  const usefulGiftSignal =
    diagnosis.signalIds.includes("convenience_seeker") ||
    diagnosis.signalIds.includes("climate_motivated") ||
    diagnosis.signalIds.includes("stakeholder_review");

  return meaningfulPriorInteraction && !hasActivePriceOrNoResponse && usefulGiftSignal;
}

function getSuggestedSlots(input: RecommendRequest, taskType: TaskType) {
  const durationMinutes = TASK_DURATION_MINUTES[taskType];
  if (durationMinutes === undefined) {
    return [];
  }

  const now = parseDate(input.now) ?? new Date();
  const explicitSlots = input.installer.calendar.freeSlots ?? [];
  if (explicitSlots.length > 0) {
    return explicitSlots
      .filter((slot) => {
        const start = parseDate(slot.start);
        const end = parseDate(slot.end);
        return Boolean(start && end && start >= now && minutesBetween(start, end) >= durationMinutes);
      })
      .slice(0, 5)
      .map((slot) => {
        const start = parseDate(slot.start);
        const end = start ? addMinutes(start, durationMinutes) : parseDate(slot.end);
        return {
          start: slot.start,
          end: end?.toISOString() ?? slot.end,
          ...(slot.label === undefined ? {} : { label: slot.label }),
          ...(slot.location === undefined ? {} : { location: slot.location }),
        };
      });
  }

  const workingHours = input.installer.workingHours ?? DEFAULT_WORKING_HOURS;
  const busyBlocks = input.installer.calendar.busyBlocks ?? [];
  const travelBuffer =
    taskType === "Meeting in person" ? input.installer.calendar.travelMinutesBuffer ?? 30 : 0;
  const fitDuration = durationMinutes + travelBuffer;
  const slots = [];

  for (let dayOffset = 0; dayOffset < 8 && slots.length < 5; dayOffset += 1) {
    const date = addDays(startOfDay(now), dayOffset);
    const dayOfWeek = date.getDay();
    const windows = workingHours.filter((window) => window.dayOfWeek === dayOfWeek);

    for (const window of windows) {
      let cursor = setTime(date, window.start);
      const windowEnd = setTime(date, window.end);
      if (cursor < now) {
        cursor = roundUpToNextHalfHour(now);
      }

      while (minutesBetween(cursor, windowEnd) >= fitDuration && slots.length < 5) {
        const slotEnd = addMinutes(cursor, durationMinutes);
        const fitEnd = addMinutes(cursor, fitDuration);
        if (!overlapsBusy(cursor, fitEnd, busyBlocks)) {
          slots.push({
            start: cursor.toISOString(),
            end: slotEnd.toISOString(),
            label: taskType === "Meeting in person" ? "Installer availability" : "Call slot",
          });
        }
        cursor = addMinutes(cursor, taskType === "Meeting in person" ? 60 : 30);
      }
    }
  }

  return slots;
}

function overlapsBusy(
  start: Date,
  end: Date,
  busyBlocks: Array<{ start: string; end: string }>,
) {
  return busyBlocks.some((block) => {
    const blockStart = parseDate(block.start);
    const blockEnd = parseDate(block.end);
    if (!blockStart || !blockEnd) {
      return false;
    }
    return start < blockEnd && end > blockStart;
  });
}

function buildCalendarEvent(
  input: RecommendRequest,
  taskType: TaskType,
  slot: { start: string; end: string; location?: string } | undefined,
  diagnosis: Diagnosis,
) {
  if (!slot || TASK_DURATION_MINUTES[taskType] === undefined) {
    return undefined;
  }

  const title =
    taskType === "Meeting in person"
      ? `Site validation visit - ${input.customer.name}`
      : `Quote follow-up call - ${input.customer.name}`;

  return {
    title,
    start: slot.start,
    end: slot.end,
    timezone: input.installer.timezone,
    ...(input.customer.address || slot.location
      ? { location: input.customer.address ?? slot.location }
      : {}),
    description: [
      `Purpose: ${diagnosis.primaryConcern}`,
      `Quote: ${input.quote.id}`,
      `Prep: ${proofFromTask(taskType, diagnosis).join("; ")}`,
    ].join("\n"),
  };
}

function buildCustomerFacingDraft(
  input: RecommendRequest,
  taskType: TaskType,
  diagnosis: Diagnosis,
) {
  const name = input.customer.name;
  const greeting = input.customer.preferredFormality === "informal" ? `Hallo ${name},` : `Guten Tag ${name},`;

  if (taskType === "Send Email") {
    if (diagnosis.signalIds.includes("ready_to_close")) {
      return {
        subject: "Kurze Zusammenfassung und naechster Schritt",
        body: [
          greeting,
          "",
          "vielen Dank fuer die Rueckmeldung. Ich fasse die offenen Punkte kurz zusammen, damit Sie alles in Ruhe pruefen koennen.",
          "",
          "- Was wir geklaert haben: die wichtigsten technischen und organisatorischen Fragen zur Anlage.",
          "- Was jetzt noch offen ist: die finale Freigabe des Angebots und der Signaturweg.",
          "- Naechster Schritt: Ich sende Ihnen die unterschriftsbereite Zusammenfassung bzw. den Vertrag zu.",
          "",
          "Wenn noch etwas fehlt, antworten Sie einfach direkt auf diese Mail.",
        ].join("\n"),
      };
    }

    if (diagnosis.objectionIds.includes("no_response_or_ghosting")) {
      return {
        subject: "Soll ich das Angebot pausieren oder anpassen?",
        body: [
          greeting,
          "",
          "ich wollte nur einmal sinnvoll nachfassen, ohne Sie zu draengen.",
          "",
          "Was waere fuer Sie aktuell am hilfreichsten?",
          "1. Eine kurze Erklaerung der wichtigsten Annahmen",
          "2. Eine Anpassung des Angebots",
          "3. Eine Pause, falls das Thema gerade nicht passt",
          "",
          "Eine kurze Zahl als Antwort reicht.",
        ].join("\n"),
      };
    }

    if (diagnosis.objectionIds.includes("competitor_offer_comparison")) {
      return {
        subject: "Vergleich der Angebotsbestandteile",
        body: [
          greeting,
          "",
          "damit der Vergleich fair bleibt, wuerde ich die entscheidenden Punkte nebeneinanderstellen: enthaltene Leistungen, optionale Positionen, Annahmen und Verantwortlichkeiten nach der Unterschrift.",
          "",
          "Wenn Sie moechten, koennen Sie mir die fuer Sie wichtigsten Vergleichspunkte nennen. Ich mache daraus eine kurze neutrale Zusammenfassung.",
        ].join("\n"),
      };
    }

    return {
      subject: "Kurzer Angebots-Recap",
      body: [
        greeting,
        "",
        "ich fasse Ihnen die wichtigsten Punkte zum Angebot strukturiert zusammen: was enthalten ist, welche Annahmen wichtig sind und welcher naechste Schritt sinnvoll waere.",
        "",
        "Falls eine Frage noch offen ist, nehme ich sie direkt in den Recap auf.",
      ].join("\n"),
    };
  }

  if (taskType === "Send WhatsApp Video Message") {
    return {
      body: [
        greeting,
        "ich sende Ihnen gleich ein kurzes Video, in dem ich genau den Punkt zeige, der fuer Ihre Entscheidung wichtig ist.",
        "Danach reicht eine kurze Antwort, ob Sie Variante A, Variante B oder einen gemeinsamen Review bevorzugen.",
      ].join("\n"),
    };
  }

  if (taskType === "Send Gift") {
    return {
      body: [
        greeting,
        "vielen Dank fuer Ihre Zeit. Ich lege eine kurze Entscheidungsunterlage bei, damit Sie die offenen Punkte in Ruhe zuhause pruefen koennen. Das ist nicht an eine Entscheidung gebunden.",
      ].join("\n"),
    };
  }

  return undefined;
}

function buildAgendaOrMessagePlan(
  taskType: TaskType,
  diagnosis: Diagnosis,
  input: RecommendRequest,
) {
  if (taskType === "Phone Call") {
    return [
      `Open with the purpose: clarify ${diagnosis.primaryConcern.toLowerCase()}, not pressure for signature.`,
      "Ask what would make the quote easier to decide.",
      "Walk through only the assumptions or scope items tied to the active concern.",
      "Agree one next commitment: recap, visit, stakeholder review, pause, or signature step.",
    ];
  }

  if (taskType === "Meeting in person") {
    return [
      "Confirm the visit is for site validation, not a closing ambush.",
      "Check roof/access, meter area, inverter location, cable path, and any customer-specific concern.",
      "State what the visit can decide and what still needs office validation.",
      "Leave with a clear post-visit recap or quote-update commitment.",
    ];
  }

  if (taskType === "Send Email") {
    if (diagnosis.signalIds.includes("ready_to_close")) {
      return [
        "Thank the customer for the call or visit.",
        "Summarize what was checked and what changed.",
        "List remaining decisions in one short section.",
        "Give the exact signature path and fallback contact option.",
      ];
    }
    if (diagnosis.objectionIds.includes("no_response_or_ghosting")) {
      return [
        "Acknowledge the quote without creating urgency.",
        "Ask one useful choice-based question.",
        "Offer pause as a valid option.",
        "Stop follow-up unless the customer replies or a new value-add appears.",
      ];
    }
    return [
      "Start from the customer's stated concern.",
      "Provide a structured recap or comparison.",
      "Name assumptions and missing data plainly.",
      "End with one clear next step and one easy alternative.",
    ];
  }

  if (taskType === "Send WhatsApp Video Message") {
    return [
      "Keep the video under 90 seconds.",
      "Show the exact quote section, chart, or scenario being explained.",
      `Answer the main point: ${diagnosis.primaryConcern}.`,
      "End with a simple reply option or offer a call.",
    ];
  }

  return [
    "Use only a low-value, decision-support item.",
    "Make the gesture explicitly non-conditional.",
    "Tie the item to what was discussed, such as a printed roadmap or checklist.",
    "Pair it with a short recap, not a signing ask.",
  ];
}

function buildDebriefPrompt(playbook: ReturnType<typeof getTaskPlaybook>, taskType: TaskType) {
  const defaults = [
    `Did the ${taskType.toLowerCase()} happen?`,
    "What exact customer wording should be captured?",
    "Which objection is resolved, changed, or still active?",
    "What is the next commitment and due date?",
  ];

  return unique([...(playbook.debrief_questions ?? []), ...defaults]).slice(0, 6);
}

function buildActionTitle(taskType: TaskType, diagnosis: Diagnosis) {
  if (taskType === "Phone Call") {
    return "Book a low-pressure quote clarity call";
  }
  if (taskType === "Meeting in person") {
    return "Schedule an in-person site validation visit";
  }
  if (taskType === "Send Email" && diagnosis.signalIds.includes("ready_to_close")) {
    return "Send the final recap and signature path";
  }
  if (taskType === "Send Email") {
    return "Send a structured written recap";
  }
  if (taskType === "Send WhatsApp Video Message") {
    return "Send a short personalized WhatsApp video";
  }
  return "Send a useful low-value decision-support gift";
}

function buildTiming(
  input: RecommendRequest,
  taskType: TaskType,
  slots: Array<{ start: string }>,
) {
  if (taskType === "Phone Call") {
    return slots[0]
      ? `Schedule the first realistic 20-minute slot: ${formatDateTime(slots[0].start, input.installer.timezone)}.`
      : "Schedule within 24 hours if the installer can open a 20-minute slot.";
  }
  if (taskType === "Meeting in person") {
    return slots[0]
      ? `Offer the first visit slot: ${formatDateTime(slots[0].start, input.installer.timezone)}.`
      : "Find a route-fit visit slot before sending another generic follow-up.";
  }
  if (taskType === "Send Email" && input.consent.email) {
    return "Send today while the quote context is still fresh.";
  }
  if (taskType === "Send WhatsApp Video Message") {
    return "Send today, ideally after preparing the visual proof asset.";
  }
  return "Send only after confirming the gesture is low-value and useful to the decision.";
}

function buildReasoningSummary(taskType: TaskType, diagnosis: Diagnosis) {
  if (taskType === "Meeting in person") {
    return `The active blocker is ${diagnosis.primaryConcern.toLowerCase()}, so physical validation is more useful than another remote follow-up.`;
  }
  if (taskType === "Phone Call") {
    return `A short human call is the strongest next step because ${diagnosis.primaryConcern.toLowerCase()} needs clarification before drafting more copy.`;
  }
  if (taskType === "Send Email") {
    return `Written proof is the best next step because ${diagnosis.primaryConcern.toLowerCase()} needs a shareable recap or final decision path.`;
  }
  if (taskType === "Send WhatsApp Video Message") {
    return `A short visual explanation fits because ${diagnosis.primaryConcern.toLowerCase()} can be explained without scheduling a live call.`;
  }
  return "A gift only fits here as a low-value decision-support gesture after meaningful interaction.";
}

function explainAlternative(taskType: TaskType, selectedTask: TaskType, diagnosis: Diagnosis) {
  if (selectedTask === "Meeting in person") {
    return `${taskType} is weaker because the customer concern is site-specific.`;
  }
  if (selectedTask === "Phone Call" && taskType === "Send Email") {
    return "Useful as a follow-up, but a call should first uncover the real blocker.";
  }
  if (selectedTask === "Send Email" && taskType === "Phone Call") {
    return "Useful if the customer engages, but written proof is lower-friction for the current blocker.";
  }
  if (diagnosis.objectionIds.includes("no_response_or_ghosting")) {
    return "More intrusive channels are weaker while the lead is stale.";
  }
  return "Lower score against the current buyer signals, objections, and channel constraints.";
}

function buildKanbanNextLabel(taskType: TaskType) {
  if (taskType === "Phone Call") {
    return "Next: schedule call";
  }
  if (taskType === "Meeting in person") {
    return "Next: book visit";
  }
  if (taskType === "Send Email") {
    return "Next: send recap";
  }
  if (taskType === "Send WhatsApp Video Message") {
    return "Next: send video";
  }
  return "Next: send decision pack";
}

function buildStrategyHeadline(taskType: TaskType, diagnosis: Diagnosis) {
  return `${taskType}: ${diagnosis.primaryConcern}`;
}

function buildQuoteState(diagnosis: Diagnosis) {
  return {
    stage: diagnosis.stage,
    ...(diagnosis.quoteAgeDays === undefined ? {} : { quoteAgeDays: diagnosis.quoteAgeDays }),
    ...(diagnosis.daysSinceLastAction === undefined
      ? {}
      : { daysSinceLastAction: diagnosis.daysSinceLastAction }),
    ...(diagnosis.lastActionSummary === undefined
      ? {}
      : { lastActionSummary: diagnosis.lastActionSummary }),
  };
}

function getLatestAction(input: RecommendRequest) {
  return [...input.history.actions]
    .sort((a, b) => timestampForAction(b) - timestampForAction(a))[0];
}

function getLatestDebrief(input: RecommendRequest) {
  return [...input.history.debriefs]
    .sort((a, b) => millis(b.occurredAt) - millis(a.occurredAt))[0];
}

function getLatestCommunication(input: RecommendRequest, direction?: "inbound" | "outbound") {
  return [...input.history.communications]
    .filter((communication) => direction === undefined || communication.direction === direction)
    .sort((a, b) => millis(b.occurredAt) - millis(a.occurredAt))[0];
}

function getDaysSinceLastAction(input: RecommendRequest) {
  const dates = [
    ...input.history.actions.flatMap((action) => [
      action.completedAt,
      action.scheduledFor,
      action.dueAt,
    ]),
    ...input.history.communications.map((communication) => communication.occurredAt),
    ...input.history.debriefs.map((debrief) => debrief.occurredAt),
  ].filter((value): value is string => Boolean(value));

  const latest = dates.map((date) => parseDate(date)).filter((date): date is Date => Boolean(date)).sort((a, b) => b.getTime() - a.getTime())[0];
  if (!latest) {
    return diffDays(input.quote.sentAt, input.now);
  }
  return Math.max(0, Math.floor((millis(input.now) - latest.getTime()) / 86_400_000));
}

function getLastActionSummary(input: RecommendRequest) {
  const latestDebrief = getLatestDebrief(input);
  if (latestDebrief?.notes) {
    return latestDebrief.notes;
  }
  const latestAction = getLatestAction(input);
  return latestAction?.summary;
}

function timestampForAction(action: RecommendRequest["history"]["actions"][number]) {
  return millis(action.completedAt ?? action.scheduledFor ?? action.dueAt ?? "");
}

function diffDays(from: string | undefined, to: string) {
  if (!from) {
    return undefined;
  }
  const start = parseDate(from);
  const end = parseDate(to);
  if (!start || !end) {
    return undefined;
  }
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86_400_000));
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function termsFound(text: string, terms: string[]) {
  const normalizedText = normalizeText(text);
  return unique(
    terms
      .map((term) => normalizeText(term))
      .filter((term) => term.length > 0 && normalizedText.includes(term)),
  );
}

function textHas(text: string, terms: string[]) {
  return termsFound(text, terms).length > 0;
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function humanizeId(id: string) {
  return id
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function parseDate(value: string | undefined) {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function millis(value: string) {
  return parseDate(value)?.getTime() ?? 0;
}

function minutesBetween(start: Date, end: Date) {
  return Math.floor((end.getTime() - start.getTime()) / 60_000);
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function setTime(date: Date, time: string) {
  const [hoursRaw, minutesRaw] = time.split(":");
  const copy = new Date(date);
  copy.setHours(Number(hoursRaw), Number(minutesRaw), 0, 0);
  return copy;
}

function roundUpToNextHalfHour(date: Date) {
  const copy = new Date(date);
  copy.setSeconds(0, 0);
  const minutes = copy.getMinutes();
  const remainder = minutes % 30;
  if (remainder !== 0) {
    copy.setMinutes(minutes + (30 - remainder));
  }
  return copy;
}

function formatDateTime(value: string, _timezone: string) {
  const date = parseDate(value);
  if (!date) {
    return value;
  }
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
