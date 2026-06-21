import { describe, expect, it } from "vitest";

import { loadKnowledgeBase, summarizeKnowledgeBase } from "../src/knowledgebase.js";
import { recommendNextAction } from "../src/recommendation.js";
import type { RecommendRequest } from "../src/schemas.js";

const NOW = "2026-06-21T09:00:00.000Z";

function baseRequest(overrides: Partial<RecommendRequest> = {}): RecommendRequest {
  const request: RecommendRequest = {
    requestId: "test-request",
    now: NOW,
    trigger: {
      type: "strategy_requested",
    },
    installer: {
      id: "installer-1",
      companyName: "Reonic Demo Solar",
      region: "NRW",
      timezone: "Europe/Berlin",
      workingHours: [
        { dayOfWeek: 1, start: "09:00", end: "17:00" },
        { dayOfWeek: 2, start: "09:00", end: "17:00" },
        { dayOfWeek: 3, start: "09:00", end: "17:00" },
        { dayOfWeek: 4, start: "09:00", end: "17:00" },
        { dayOfWeek: 5, start: "09:00", end: "15:00" },
      ],
      calendar: {
        freeSlots: [
          {
            start: "2026-06-22T08:00:00.000Z",
            end: "2026-06-22T12:00:00.000Z",
            label: "Monday morning",
          },
          {
            start: "2026-06-22T13:00:00.000Z",
            end: "2026-06-22T15:00:00.000Z",
            label: "Monday afternoon",
          },
        ],
        busyBlocks: [],
        travelMinutesBuffer: 30,
      },
      proofAssets: [
        {
          id: "asset-1",
          title: "PV assumptions recap",
          type: "pdf",
          tags: ["roi", "quote"],
        },
      ],
    },
    customer: {
      id: "customer-1",
      name: "Max Mueller",
      language: "de",
      preferredFormality: "formal",
      email: "max@example.com",
      phone: "+491701234567",
      address: "Musterstrasse 1, Koeln",
      explicitMotives: [],
      statedConcerns: [],
    },
    quote: {
      id: "quote-1",
      status: "sent",
      sentAt: "2026-06-20T09:00:00.000Z",
      signatureState: "not_ready",
      scope: ["PV", "battery"],
      totalGross: 28_000,
      currency: "EUR",
      lineItems: [
        { label: "PV system", amountGross: 18_000, optional: false },
        { label: "Battery storage", amountGross: 10_000, optional: false },
      ],
      assumptions: {
        annualConsumptionKwh: 5_400,
      },
    },
    consent: {
      email: true,
      phone: true,
      whatsapp: false,
      tracking: true,
      optOut: false,
      writtenOnly: false,
    },
    history: {
      communications: [],
      actions: [],
      debriefs: [],
      files: [],
    },
    assistantState: {
      currentStage: "quote_sent_strategy_needed",
      activeBuyerSignals: [],
      activeObjections: [],
    },
  };

  return deepMerge(request, overrides);
}

describe("knowledgebase", () => {
  it("loads the clean local data sources", () => {
    const summary = summarizeKnowledgeBase(loadKnowledgeBase());

    expect(summary.buyerSignalCount).toBeGreaterThanOrEqual(10);
    expect(summary.objectionCount).toBeGreaterThanOrEqual(12);
    expect(summary.taskPlaybookCount).toBe(5);
    expect(summary.customerReviewObservationCount).toBeGreaterThanOrEqual(60);
  });
});

describe("recommendNextAction", () => {
  it("starts a fresh high-value quote with a phone call when consent exists", () => {
    const result = recommendNextAction(
      baseRequest({
        assistantState: {
          currentStage: "quote_sent_strategy_needed",
          activeBuyerSignals: ["trust_sensitive", "roi_focused"],
          activeObjections: [],
        },
      }),
    );

    expect(result.nextBestAction.taskType).toBe("Phone Call");
    expect(result.nextBestAction.suggestedSlots.length).toBeGreaterThan(0);
    expect(result.buyerProfile.signals.map((signal) => signal.id)).toContain("roi_focused");
  });

  it("moves to an in-person meeting when the call debrief asks for house validation", () => {
    const result = recommendNextAction(
      baseRequest({
        trigger: { type: "debrief_added" },
        history: {
          communications: [],
          actions: [
            {
              id: "action-1",
              taskType: "Phone Call",
              status: "completed",
              completedAt: "2026-06-21T08:30:00.000Z",
            },
          ],
          debriefs: [
            {
              id: "debrief-1",
              occurredAt: "2026-06-21T08:45:00.000Z",
              taskType: "Phone Call",
              notes:
                "Customer said the price may be okay, but they want someone to come look at the house, roof, and cable path before they trust the final quote.",
              customerLanguage: ["Please come take a look at the roof first."],
              newFacts: [],
              resolvedObjections: [],
              remainingObjections: ["needs_site_visit"],
              newObjections: [],
            },
          ],
          files: [],
        },
      }),
    );

    expect(result.nextBestAction.taskType).toBe("Meeting in person");
    expect(result.buyerProfile.objections.map((objection) => objection.id)).toContain(
      "needs_site_visit",
    );
    expect(result.nextBestAction.calendarEvent?.title).toContain("Site validation");
  });

  it("sends the final recap when the visit resolves the blocker", () => {
    const result = recommendNextAction(
      baseRequest({
        trigger: { type: "debrief_added" },
        history: {
          communications: [],
          actions: [
            {
              id: "action-2",
              taskType: "Meeting in person",
              status: "completed",
              completedAt: "2026-06-21T08:00:00.000Z",
            },
          ],
          debriefs: [
            {
              id: "debrief-2",
              occurredAt: "2026-06-21T08:30:00.000Z",
              taskType: "Meeting in person",
              notes:
                "Visit completed. Roof condition looked fine. This answers their main concern and the customer asked us to send final summary and signature path.",
              customerLanguage: ["This answers my main concern. Please send the final summary."],
              newFacts: ["Roof condition looked fine for proposed mounting method."],
              resolvedObjections: ["needs_site_visit", "roof_or_property_risk"],
              remainingObjections: [],
              newObjections: [],
            },
          ],
          files: [],
        },
      }),
    );

    expect(result.quoteState.stage).toBe("contract_ready");
    expect(result.nextBestAction.taskType).toBe("Send Email");
    expect(result.nextBestAction.customerFacingDraft?.subject).toContain("Zusammenfassung");
  });

  it("uses WhatsApp video for battery doubts when phone is unavailable and WhatsApp is opted in", () => {
    const result = recommendNextAction(
      baseRequest({
        customer: {
          id: "customer-1",
          name: "Max Mueller",
          language: "de",
          preferredFormality: "formal",
          explicitMotives: ["I want more independence from the utility."],
          statedConcerns: ["Battery too big? Could we install the battery later?"],
        },
        consent: {
          email: true,
          phone: false,
          whatsapp: true,
          tracking: false,
          optOut: false,
          writtenOnly: false,
        },
        assistantState: {
          currentStage: "active_followup",
          activeBuyerSignals: ["independence_motivated", "technical_skeptic"],
          activeObjections: ["battery_value_or_sizing"],
        },
      }),
    );

    expect(result.nextBestAction.taskType).toBe("Send WhatsApp Video Message");
    expect(result.reasoning.scorecard["Phone Call"]).toBe(-999);
  });

  it("handles stale no-response with one low-pressure email when other channels are unavailable", () => {
    const result = recommendNextAction(
      baseRequest({
        now: "2026-06-21T09:00:00.000Z",
        quote: {
          id: "quote-1",
          status: "sent",
          sentAt: "2026-06-09T09:00:00.000Z",
          signatureState: "not_ready",
          scope: ["PV"],
          totalGross: 18_000,
          currency: "EUR",
          lineItems: [{ label: "PV system", amountGross: 18_000, optional: false }],
        },
        consent: {
          email: true,
          phone: false,
          whatsapp: false,
          tracking: false,
          optOut: false,
          writtenOnly: false,
        },
        history: {
          communications: [],
          actions: [
            {
              id: "action-stale",
              taskType: "Send Email",
              status: "sent",
              dueAt: "2026-06-12T09:00:00.000Z",
              summary: "Initial quote follow-up sent.",
            },
          ],
          debriefs: [],
          files: [],
        },
      }),
    );

    expect(result.nextBestAction.taskType).toBe("Send Email");
    expect(result.buyerProfile.objections.map((objection) => objection.id)).toContain(
      "no_response_or_ghosting",
    );
    expect(result.nextBestAction.customerFacingDraft?.body).toContain("zu draengen");
  });

});

function deepMerge<T>(base: T, overrides: Partial<T>): T {
  if (!isRecord(base) || !isRecord(overrides)) {
    return overrides as T;
  }

  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    const baseValue = merged[key];
    if (isRecord(baseValue) && isRecord(value) && !Array.isArray(value)) {
      merged[key] = deepMerge(baseValue, value);
    } else {
      merged[key] = value;
    }
  }
  return merged as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
