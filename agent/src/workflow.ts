import { createWorkflowChain } from "@voltagent/core";
import { generateObject } from "ai";
import { z } from "zod";

import { loadKnowledgeBase, summarizeKnowledgeBase } from "./knowledgebase.js";
import { recommendNextAction } from "./recommendation.js";
import {
  RecommendRequestSchema,
  RecommendationResponseSchema,
  type RecommendRequest,
  type RecommendationResponse,
} from "./schemas.js";
import { synthesizeRecommendation } from "./synthesis.js";
import { openaiModel, VOLTAGENT_MODEL } from "./agent.js";

const EvaluationSchema = z.object({
  confidence: z.enum(["low", "medium", "high"]),
  primaryReason: z.string().min(10).max(300),
  improvedSummary: z.string().min(20).max(500).optional(),
  additionalRiskFlags: z.array(z.string().max(120)).max(3).default([]),
});

function buildEvaluationPrompt(request: RecommendRequest, recommendation: RecommendationResponse): string {
  return [
    "You are evaluating a deterministic sales recommendation for correctness and fit.",
    "Given the CRM context and scoring result, return:",
    "  confidence: your confidence that this is the right action",
    "  primaryReason: the single most important reason for this action (1 sentence)",
    "  improvedSummary: a tighter, more specific summary if the current one is generic (optional)",
    "  additionalRiskFlags: any risk flags the deterministic scorer missed (max 3, empty array if none)",
    "",
    "Do NOT change the selected action type. Only evaluate fit and enrich reasoning.",
    "",
    JSON.stringify(
      {
        customer: { name: request.customer.name, language: request.customer.language },
        quote: { status: request.quote.status, totalGross: request.quote.totalGross, scope: request.quote.scope },
        signals: recommendation.buyerProfile.signals.slice(0, 5).map((s) => s.name),
        objections: recommendation.buyerProfile.objections.slice(0, 5).map((o) => o.name),
        selectedAction: recommendation.nextBestAction.taskType,
        scorecard: recommendation.reasoning.scorecard,
        currentSummary: recommendation.reasoning.summary,
        riskFlags: recommendation.buyerProfile.riskFlags,
      },
      null,
      2,
    ),
  ].join("\n");
}

export const recommendNextActionWorkflow = createWorkflowChain({
  id: "recommend-next-action",
  name: "Recommend Next Best Action",
  purpose:
    "Diagnose buyer state from quote/customer/history context, retrieve the relevant local knowledgebase, score task types, evaluate fit with the LLM, and synthesize an explainable next-best sales action.",
  input: RecommendRequestSchema,
  result: RecommendationResponseSchema,
})
  .andThen({
    id: "validate-context",
    name: "Validate CRM context",
    purpose: "Confirm the request contains the customer, quote, history, consent, and installer calendar context.",
    execute: async ({ data, writer }) => {
      writer.write({
        type: "agent-progress",
        metadata: {
          phase: "validate-context",
          title: "Validating CRM context",
          detail: `${data.customer.name} · ${data.quote.id}`,
        },
      });
      return data;
    },
  })
  .andThen({
    id: "load-knowledgebase",
    name: "Load knowledgebase",
    purpose: "Read the clean local customer-review, objection, buyer-signal, and task-playbook sources.",
    execute: async ({ data, writer }) => {
      const summary = summarizeKnowledgeBase(loadKnowledgeBase());
      writer.write({
        type: "agent-progress",
        metadata: {
          phase: "load-knowledgebase",
          title: "Loading knowledgebase",
          detail: `${summary.customerReviewObservationCount} review observations · ${summary.taskPlaybookCount} task playbooks`,
        },
      });
      return data;
    },
  })
  .andThen({
    id: "diagnose-and-score",
    name: "Diagnose and score actions",
    purpose: "Run the knowledgebase-backed scoring and calendar selection engine.",
    outputSchema: RecommendationResponseSchema,
    execute: async ({ data, writer }) => {
      writer.write({
        type: "agent-progress",
        metadata: {
          phase: "diagnose-and-score",
          title: "Diagnosing buyer state",
          detail: data.trigger.installerInstruction
            ? "Using installer revision as a high-priority signal"
            : "Scoring buyer profile, objections, and channel fit",
        },
      });
      const recommendation = recommendNextAction(data);
      writer.write({
        type: "agent-progress",
        metadata: {
          phase: "select-action",
          title: "Selected next best action",
          detail: recommendation.nextBestAction.taskType,
        },
      });
      return recommendation;
    },
  })
  .andThen({
    id: "evaluate-recommendation",
    name: "Agent evaluates recommendation fit",
    purpose: "Call the LLM to evaluate whether the deterministic recommendation fits the buyer context and enrich the reasoning narrative.",
    outputSchema: RecommendationResponseSchema,
    execute: async ({ data, getStepData, writer }) => {
      // The validate-context step receives the original RecommendRequest as its input.
      const request = getStepData("validate-context")?.input as RecommendRequest;
      writer.write({
        type: "agent-progress",
        metadata: {
          phase: "evaluate-recommendation",
          title: "Agent evaluating recommendation fit",
          detail: `${data.nextBestAction.taskType} for ${request?.customer?.name ?? "customer"}`,
        },
      });

      const startedAt = Date.now();
      try {
        const { object } = await generateObject({
          model: openaiModel,
          schema: EvaluationSchema,
          prompt: buildEvaluationPrompt(request, data),
          temperature: 0.1,
          maxOutputTokens: 600,
        });

        writer.write({
          type: "agent-progress",
          metadata: {
            phase: "evaluate-recommendation",
            title: "Agent evaluation complete",
            detail: `Confidence: ${object.confidence} — ${object.primaryReason.slice(0, 80)}`,
          },
        });

        const enriched: RecommendationResponse = {
          ...data,
          reasoning: {
            ...data.reasoning,
            summary: object.improvedSummary ?? data.reasoning.summary,
            decisionFactors: [
              {
                factor: "agent_evaluation",
                impact: "positive" as const,
                detail: object.primaryReason,
              },
              ...data.reasoning.decisionFactors,
            ],
          },
          buyerProfile: {
            ...data.buyerProfile,
            riskFlags: [...data.buyerProfile.riskFlags, ...object.additionalRiskFlags],
          },
          generation: {
            mode: "deterministic",
            model: VOLTAGENT_MODEL,
            latencyMs: Date.now() - startedAt,
          },
        };

        return RecommendationResponseSchema.parse(enriched);
      } catch (error) {
        // Non-fatal: log and pass through the deterministic recommendation unchanged.
        writer.write({
          type: "agent-progress",
          metadata: {
            phase: "evaluate-recommendation",
            title: "Agent evaluation skipped (LLM unavailable)",
            detail: error instanceof Error ? error.message.slice(0, 120) : "unknown error",
          },
        });
        return data;
      }
    },
  })
  .andThen({
    id: "synthesize-strategy",
    name: "Synthesize demo-ready strategy",
    purpose: "Call the configured LLM to turn the enriched recommendation into precise installer-facing copy.",
    outputSchema: RecommendationResponseSchema,
    execute: async ({ data, getStepData, writer }) => {
      const request = getStepData("validate-context")?.input as RecommendRequest;
      writer.write({
        type: "agent-progress",
        metadata: {
          phase: "synthesize-strategy",
          title: "Writing demo-ready strategy",
          detail: "Calling the configured LLM for final wording",
        },
      });
      const synthesized = await synthesizeRecommendation({ request, recommendation: data });
      writer.write({
        type: "agent-progress",
        metadata: {
          phase: "synthesize-strategy",
          title: "Strategy wording complete",
          detail: synthesized.generation?.mode === "llm" ? synthesized.generation.model : "deterministic fallback",
        },
      });
      return synthesized;
    },
  });
