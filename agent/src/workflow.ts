import { createWorkflowChain } from "@voltagent/core";

import { recommendNextAction } from "./recommendation.js";
import { RecommendRequestSchema, RecommendationResponseSchema } from "./schemas.js";

export const recommendNextActionWorkflow = createWorkflowChain({
  id: "recommend-next-action",
  name: "Recommend Next Best Action",
  purpose:
    "Diagnose buyer state from quote/customer/history context, retrieve the relevant local knowledgebase, score task types, and return an explainable next-best sales action.",
  input: RecommendRequestSchema,
  result: RecommendationResponseSchema,
}).andThen({
  id: "build-recommendation",
  name: "Build recommendation",
  purpose: "Run the knowledgebase-backed scoring and calendar selection engine.",
  outputSchema: RecommendationResponseSchema,
  execute: async ({ data }) => recommendNextAction(data),
});
