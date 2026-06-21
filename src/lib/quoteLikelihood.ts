import type { QuoteRecord } from "../../server/types.js";

export type QuoteLikelihood = {
  label: string;
  tone: "blue" | "green" | "yellow" | "red";
  reason: string;
};

export function getQuoteLikelihood(quote: QuoteRecord): QuoteLikelihood {
  const age = quote.quoteAgeDays ?? 0;
  const idle = quote.daysSinceLastAction ?? 0;

  if (quote.columnId === "completed" || quote.statusLabel === "Signed") {
    return { label: "Won", tone: "green", reason: "Signed deal; no ghost risk." };
  }

  if (idle >= 7 || age >= 10) {
    return { label: "High ghost risk", tone: "red", reason: "Stale quote with no recent touch." };
  }

  if (
    quote.nextAction.kind === "follow_up_signature" ||
    quote.nextAction.kind === "send_final_recap" ||
    quote.statusLabel === "Signature open" ||
    quote.statusLabel === "Ready for recap"
  ) {
    return { label: "Likely to close", tone: "green", reason: "Blockers resolved; signature step remains." };
  }

  if (quote.strategyStale) {
    return { label: "Needs refresh", tone: "yellow", reason: "Customer data changed since strategy." };
  }

  if (quote.nextAction.kind === "generate_strategy" && age <= 4) {
    return { label: "Fresh quote", tone: "blue", reason: "Recent quote; first follow-up is due." };
  }

  if (idle >= 3 || age >= 5) {
    return { label: "Cooling off", tone: "yellow", reason: "Engagement is slowing; follow up soon." };
  }

  return { label: "In motion", tone: "blue", reason: "Recent activity keeps the deal warm." };
}
