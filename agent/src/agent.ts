import { Agent, createTool, type Memory } from "@voltagent/core";
import { openai } from "@ai-sdk/openai";

import { recommendNextAction } from "./recommendation.js";
import { RecommendRequestSchema, RecommendationResponseSchema } from "./schemas.js";

export const recommendNextActionTool = createTool({
  name: "recommend_next_action",
  description:
    "Given a renewable-energy customer, quote, communication history, consent, and installer calendar, return the next best sales/marketing action backed by the local knowledgebase.",
  parameters: RecommendRequestSchema,
  outputSchema: RecommendationResponseSchema,
  execute: async (args) => recommendNextAction(args),
});

export function createMarketingSalesAssistant(memory: Memory) {
  return new Agent({
    name: "reonic-marketing-sales-assistant",
    purpose:
      "Help renewable energy installers decide what to do next after a quote is sent.",
    instructions: [
      "You are an AI marketing and sales assistant for renewable energy installers.",
      "Your job is to recommend the next best action from exactly these task types: Phone Call, Send Email, Meeting in person, Send WhatsApp Video Message, Send Gift.",
      "Use the supplied customer, quote, communication history, installer calendar, consent, and local knowledgebase. Do not invent CRM fields, internal systems, or hidden data.",
      "Explain why this action, why now, what proof should be prepared, and what the installer should log afterward.",
      "Respect channel consent. Do not recommend phone, email, or WhatsApp outreach when that channel is not allowed.",
      "Do not make unsupported claims about ROI, savings, tariffs, subsidies, timelines, warranties, taxes, or guaranteed outcomes.",
      "Treat buyer profiles and ghosting risk as hypotheses grounded in the supplied data, not as facts about demographics.",
      "For public customer-review patterns, use them only as qualitative background for trust/tone risks. Never quote them to customers or imply another provider's reviews describe this installer.",
    ].join("\n"),
    model: openai(process.env.VOLTAGENT_MODEL ?? "gpt-4o-mini"),
    tools: [recommendNextActionTool],
    memory,
    temperature: 0.2,
    maxSteps: 3,
  });
}
