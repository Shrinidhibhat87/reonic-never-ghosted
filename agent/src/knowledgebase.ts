import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { KnowledgeReference, TaskType } from "./schemas.js";

export interface BuyerSignalEntry {
  id: string;
  name: string;
  definition: string;
  language_clues?: string[];
  behavior_clues?: string[];
  what_it_usually_means?: string;
  confidence_notes?: string;
  related_objections?: string[];
  task_fit?: Partial<Record<TaskType, string>>;
  mistakes_to_avoid?: string[];
}

export interface ObjectionEntry {
  id: string;
  name: string;
  customer_wording?: string[];
  underlying_concern?: string;
  proof_that_helps?: string[];
  best_task_types?: Partial<Record<TaskType, string>>;
  what_not_to_say?: string[];
  missing_data_to_check?: string[];
  related_buyer_signals?: string[];
}

export interface TaskPlaybook {
  task_type: TaskType;
  primary_job: string;
  best_for?: string[];
  bad_for?: string[];
  buyer_signals_it_fits?: string[];
  objections_it_can_resolve?: string[];
  objections_it_can_support_indirectly?: string[];
  timing_guidance?: string[];
  prep_needed?: string[];
  output_artifacts?: string[];
  tone_guidance?: string[];
  debrief_questions?: string[];
  guardrails?: string[];
  [key: string]: unknown;
}

export interface DecisionRule {
  id: string;
  score_adjustments?: Partial<Record<TaskType, number>>;
  required_proof?: string[];
  rationale?: string;
  recommended_policy?: string;
}

export interface DecisionPolicy {
  decision_rules?: DecisionRule[];
  tie_breakers?: string[];
  claim_safety?: string[];
}

export interface DebriefRule {
  id: string;
  if_debrief_contains?: string[];
  set_stage?: string;
  set_or_boost?: {
    buyer_signals?: string[];
    objections?: string[];
    task_type?: TaskType;
  };
  next_step_note?: string;
}

export interface DebriefRules {
  required_debrief_fields?: string[];
  optional_debrief_fields?: string[];
  update_rules?: DebriefRule[];
  debrief_quality_rules?: string[];
}

export interface StageEntry {
  id: string;
  name: string;
  description?: string;
}

export interface StageModel {
  stages?: StageEntry[];
  state_facts_to_display?: string[];
}

export interface ReviewObservation {
  provider: string;
  platform: string;
  topic: string;
  journey_stage: string;
  sentiment: "positive" | "negative" | "mixed";
  review_language_de?: string[];
  what_customers_say: string;
  decision_relevance: string;
  tags: string[];
  file: string;
}

export interface LoadedKnowledgeBase {
  buyerSignals: BuyerSignalEntry[];
  objections: ObjectionEntry[];
  taskPlaybooks: Record<TaskType, TaskPlaybook>;
  decisionPolicy: DecisionPolicy;
  debriefRules: DebriefRules;
  stageModel: StageModel;
  reviewObservations: ReviewObservation[];
}

const AGENT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const KNOWLEDGEBASE_DIR = process.env.KNOWLEDGEBASE_DIR ?? join(AGENT_DIR, "knowledgebase");

let cachedKnowledgeBase: LoadedKnowledgeBase | undefined;

function readJson<T>(relativePath: string): T {
  const fullPath = join(KNOWLEDGEBASE_DIR, relativePath);
  return JSON.parse(readFileSync(fullPath, "utf8")) as T;
}

function readBuyerSignals(): BuyerSignalEntry[] {
  const doc = readJson<{ signals?: BuyerSignalEntry[] }>("buyer-signals/core-buyer-signals.json");
  return doc.signals ?? [];
}

function readObjections(): ObjectionEntry[] {
  const doc = readJson<{ objections?: ObjectionEntry[] }>(
    "objections/solar-objections-germany.json",
  );
  return doc.objections ?? [];
}

function readTaskPlaybooks(): Record<TaskType, TaskPlaybook> {
  const files = [
    "phone-call.json",
    "send-email.json",
    "in-person-meeting.json",
    "whatsapp-video-message.json",
    "send-gift.json",
  ];
  const playbooks: Partial<Record<TaskType, TaskPlaybook>> = {};

  for (const file of files) {
    const playbook = readJson<TaskPlaybook>(`task-playbooks/${file}`);
    playbooks[playbook.task_type] = playbook;
  }

  return playbooks as Record<TaskType, TaskPlaybook>;
}

function readReviewObservations(): ReviewObservation[] {
  const index = readJson<{ files?: string[] }>("customer-reviews/index.json");
  const files = index.files ?? [];
  const observations: ReviewObservation[] = [];

  for (const file of files) {
    const doc = readJson<{
      source?: { provider?: string; platform?: string };
      observations?: Array<Omit<ReviewObservation, "provider" | "platform" | "file">>;
    }>(`customer-reviews/${file}`);

    for (const observation of doc.observations ?? []) {
      observations.push({
        provider: doc.source?.provider ?? "unknown",
        platform: doc.source?.platform ?? "unknown",
        file,
        topic: observation.topic,
        journey_stage: observation.journey_stage,
        sentiment: observation.sentiment,
        review_language_de: observation.review_language_de ?? [],
        what_customers_say: observation.what_customers_say,
        decision_relevance: observation.decision_relevance,
        tags: observation.tags ?? [],
      });
    }
  }

  return observations;
}

export function loadKnowledgeBase(): LoadedKnowledgeBase {
  cachedKnowledgeBase ??= {
    buyerSignals: readBuyerSignals(),
    objections: readObjections(),
    taskPlaybooks: readTaskPlaybooks(),
    decisionPolicy: readJson<DecisionPolicy>("sales-process-model/decision-policy.json"),
    debriefRules: readJson<DebriefRules>("sales-process-model/debrief-rules.json"),
    stageModel: readJson<StageModel>("sales-process-model/stages-and-events.json"),
    reviewObservations: readReviewObservations(),
  };

  return cachedKnowledgeBase;
}

export function summarizeKnowledgeBase(kb = loadKnowledgeBase()) {
  return {
    buyerSignalCount: kb.buyerSignals.length,
    objectionCount: kb.objections.length,
    taskPlaybookCount: Object.keys(kb.taskPlaybooks).length,
    customerReviewObservationCount: kb.reviewObservations.length,
    decisionRuleCount: kb.decisionPolicy.decision_rules?.length ?? 0,
    debriefRuleCount: kb.debriefRules.update_rules?.length ?? 0,
  };
}

export function getBuyerSignal(kb: LoadedKnowledgeBase, id: string) {
  return kb.buyerSignals.find((signal) => signal.id === id);
}

export function getObjection(kb: LoadedKnowledgeBase, id: string) {
  return kb.objections.find((objection) => objection.id === id);
}

export function getDecisionRule(kb: LoadedKnowledgeBase, id: string) {
  return kb.decisionPolicy.decision_rules?.find((rule) => rule.id === id);
}

export function getTaskPlaybook(kb: LoadedKnowledgeBase, taskType: TaskType) {
  return kb.taskPlaybooks[taskType];
}

export function selectReviewObservations(
  kb: LoadedKnowledgeBase,
  terms: string[],
  limit = 3,
): ReviewObservation[] {
  const normalizedTerms = new Set(terms.map((term) => term.toLowerCase()));

  return kb.reviewObservations
    .map((observation) => {
      const haystack = [
        observation.topic,
        observation.journey_stage,
        observation.sentiment,
        observation.what_customers_say,
        observation.decision_relevance,
        ...observation.tags,
        ...(observation.review_language_de ?? []),
      ]
        .join(" ")
        .toLowerCase();

      let score = 0;
      for (const term of normalizedTerms) {
        if (haystack.includes(term)) {
          score += 1;
        }
      }

      return { observation, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ observation }) => observation);
}

export function buildKnowledgeReferences(params: {
  taskType: TaskType;
  signalIds: string[];
  objectionIds: string[];
  reviewObservations: ReviewObservation[];
}): KnowledgeReference[] {
  const refs: KnowledgeReference[] = [
    {
      folder: "sales-process-model",
      file: "decision-policy.json",
      topic: "Task scoring and constraints",
      usedFor: "Ranked the allowed task types and applied channel/claim guardrails.",
    },
    {
      folder: "task-playbooks",
      file: playbookFileForTask(params.taskType),
      topic: params.taskType,
      usedFor: "Built the recommended action, prep checklist, timing, and debrief prompt.",
    },
  ];

  if (params.signalIds.length > 0) {
    refs.push({
      folder: "buyer-signals",
      file: "core-buyer-signals.json",
      topic: params.signalIds.join(", "),
      usedFor: "Estimated the buyer profile from customer language, history, and quote context.",
    });
  }

  if (params.objectionIds.length > 0) {
    refs.push({
      folder: "objections",
      file: "solar-objections-germany.json",
      topic: params.objectionIds.join(", "),
      usedFor: "Mapped active concerns to proof assets and unsafe claims to avoid.",
    });
  }

  for (const observation of params.reviewObservations) {
    refs.push({
      folder: "customer-reviews",
      file: observation.file,
      topic: observation.topic,
      usedFor: `Qualitative trust/tone context from ${observation.platform} review patterns.`,
    });
  }

  return refs;
}

function playbookFileForTask(taskType: TaskType) {
  switch (taskType) {
    case "Phone Call":
      return "phone-call.json";
    case "Send Email":
      return "send-email.json";
    case "Meeting in person":
      return "in-person-meeting.json";
    case "Send WhatsApp Video Message":
      return "whatsapp-video-message.json";
    case "Send Gift":
      return "send-gift.json";
  }
}
