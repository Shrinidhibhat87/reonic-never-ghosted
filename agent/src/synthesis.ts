import type { Agent } from "@voltagent/core";
import { generateObject } from "ai";
import { z } from "zod";

import {
  RecommendationResponseSchema,
  type RecommendRequest,
  type RecommendationResponse,
} from "./schemas.js";
import { openaiModel, VOLTAGENT_MODEL } from "./agent.js";

export const SynthesisSchema = z.object({
  strategyHeadline: z.string().min(12).max(180),
  strategySummary: z.string().min(40).max(700),
  nextBestActionTitle: z.string().min(8).max(120),
  agendaOrMessagePlan: z.array(z.string().min(8).max(180)).min(3).max(6),
  proofToPrepare: z.array(z.string().min(4).max(140)).min(1).max(7),
  internalPrepChecklist: z.array(z.string().min(4).max(140)).min(1).max(8),
  reasoningSummary: z.string().min(30).max(600),
  customerFacingDraft: z
    .object({
      subject: z.string().max(120),
      body: z.string().min(30).max(1200),
    })
    .nullable(),
  uiHints: z.object({
    kanbanNextLabel: z.string().min(3).max(40),
    calendarActionLabel: z.string().max(40).nullable(),
    logPromptTitle: z.string().min(4).max(80),
  }),
});

export async function synthesizeRecommendation(params: {
  agent?: Agent; // unused: generateObject calls openaiModel directly. Kept for call-site compatibility.
  request: RecommendRequest;
  recommendation: RecommendationResponse;
}): Promise<RecommendationResponse> {
  const startedAt = Date.now();
  try {
    const result = await generateObject({
      model: openaiModel,
      schema: SynthesisSchema,
      prompt: buildSynthesisPrompt(params),
      temperature: 0.2,
      maxOutputTokens: 6000,
    });

    const synthesis = result.object;
    const customerFacingDraft = synthesis.customerFacingDraft
      ? {
          ...(synthesis.customerFacingDraft.subject.trim()
            ? { subject: synthesis.customerFacingDraft.subject }
            : {}),
          body: synthesis.customerFacingDraft.body,
        }
      : undefined;

    const merged: RecommendationResponse = {
      ...params.recommendation,
      nextBestAction: {
        ...params.recommendation.nextBestAction,
        title: synthesis.nextBestActionTitle,
        agendaOrMessagePlan: synthesis.agendaOrMessagePlan,
        proofToPrepare: synthesis.proofToPrepare,
        internalPrepChecklist: synthesis.internalPrepChecklist,
        ...(customerFacingDraft ? { customerFacingDraft } : {}),
      },
      reasoning: {
        ...params.recommendation.reasoning,
        summary: synthesis.strategySummary,
      },
      uiHints: {
        ...params.recommendation.uiHints,
        kanbanNextLabel: synthesis.uiHints.kanbanNextLabel,
        strategyHeadline: synthesis.strategyHeadline,
        ...(synthesis.uiHints.calendarActionLabel
          ? { calendarActionLabel: synthesis.uiHints.calendarActionLabel }
          : {}),
        logPromptTitle: synthesis.uiHints.logPromptTitle,
      },
      generation: {
        mode: "llm",
        model: VOLTAGENT_MODEL,
        latencyMs: Date.now() - startedAt,
      },
    };

    return RecommendationResponseSchema.parse(merged);
  } catch (error) {
    const fallback: RecommendationResponse = {
      ...params.recommendation,
      generation: {
        mode: "deterministic_fallback",
        model: VOLTAGENT_MODEL,
        latencyMs: Date.now() - startedAt,
        fallbackReason: describeError(error),
      },
    };
    return RecommendationResponseSchema.parse(fallback);
  }
}

export function buildSynthesisPrompt(params: {
  request: RecommendRequest;
  recommendation: RecommendationResponse;
}) {
  return [
    "You are the final copy and strategy synthesis layer for Reonic's AI marketing/sales assistant.",
    "You must make the recommendation feel precise, credible, and demo-ready for a renewable-energy installer.",
    "",
    "Hard rules:",
    "- Do not change the selected task type, timing, slots, consent constraints, quote value, or facts.",
    "- Do not invent CRM fields, subsidies, ROI guarantees, warranties, taxes, or hidden customer data.",
    "- Use the deterministic recommendation and knowledge references as the source of truth.",
    "- Use concise installer-facing English.",
    "- If writing customer-facing text, use formal German unless the request clearly indicates otherwise.",
    "- Public review evidence is background only; never imply it describes this installer.",
    "",
    "Return only the structured object requested by the schema.",
    "",
    "Context:",
    JSON.stringify(
      {
        trigger: params.request.trigger,
        customer: params.request.customer,
        quote: params.request.quote,
        consent: params.request.consent,
        assistantState: params.request.assistantState,
        recentHistory: {
          communications: params.request.history.communications.slice(-5),
          actions: params.request.history.actions.slice(-5),
          debriefs: params.request.history.debriefs.slice(-5),
          files: params.request.history.files.slice(-5),
        },
        // Enriched by the agent evaluation step — use improved summary if present.
        agentEvaluation: params.recommendation.reasoning.decisionFactors.find(
          (f) => f.factor === "agent_evaluation",
        )?.detail,
        recommendation: params.recommendation,
      },
      null,
      2,
    ),
  ].join("\n");
}

function describeError(error: unknown) {
  if (!(error instanceof Error)) {
    return "Unknown LLM synthesis error";
  }

  const details = [
    error.message,
    detailFrom(error, "responseBody"),
    detailFrom(error, "data"),
    detailFrom(error, "cause"),
  ].filter(Boolean);

  return details.join(" | ");
}

function detailFrom(error: Error, key: string) {
  const value = (error as unknown as Record<string, unknown>)[key];
  if (!value) {
    return undefined;
  }
  if (typeof value === "string") {
    return value.slice(0, 800);
  }
  try {
    return JSON.stringify(value).slice(0, 800);
  } catch {
    return String(value).slice(0, 800);
  }
}
