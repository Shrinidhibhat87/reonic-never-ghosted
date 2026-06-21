import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

const tempDir = mkdtempSync(join(tmpdir(), "reonic-demo-"));
process.env.REONIC_DEMO_DB = join(tempDir, "test.sqlite");
process.env.REONIC_AGENT_MODE = "local";

const db = await import("../server/db.js");
const seed = await import("../server/seed.js");

describe("demo flow persistence", () => {
  beforeEach(() => {
    db.resetDatabase();
  });

  afterAll(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("generates the initial Sabine strategy and phone-call action", async () => {
    const detail = await db.generateStrategy(seed.DEMO_QUOTE_ID);

    expect(detail.strategy?.generation?.mode).toBe("deterministic");
    expect(detail.quote.nextAction.kind).toBe("schedule_call");
    expect(detail.actions.some((action) => action.taskType === "Phone Call")).toBe(true);
  });

  it("schedules the call and creates a highlighted calendar event", async () => {
    const generated = await db.generateStrategy(seed.DEMO_QUOTE_ID);
    const actionId = generated.quote.nextAction.actionId;
    expect(actionId).toBeTruthy();

    const scheduled = db.scheduleAction(actionId!, {});
    const events = db.getCalendarEvents();

    expect(scheduled.quote.nextAction.kind).toBe("log_call");
    expect(events.some((event) => event.actionId === actionId && event.title.includes("Call"))).toBe(true);
  });

  it("uses the call debrief to recommend an in-person visit", async () => {
    const generated = await db.generateStrategy(seed.DEMO_QUOTE_ID);
    const scheduled = db.scheduleAction(generated.quote.nextAction.actionId!, {});
    const updated = await db.logAction(scheduled.quote.nextAction.actionId!, {
      notes:
        "Customer said the price may be okay, but they want someone to come look at the house, roof, and cable path before they trust the final quote.",
    });

    expect(updated.quote.nextAction.kind).toBe("schedule_visit");
    expect(updated.strategy?.steps.find((step) => step.taskType === "Meeting in person")?.status).toBe("active");
  });

  it("uses the visit debrief to recommend a final recap and can close the quote", async () => {
    const generated = await db.generateStrategy(seed.DEMO_QUOTE_ID);
    const callScheduled = db.scheduleAction(generated.quote.nextAction.actionId!, {});
    const visitRecommended = await db.logAction(callScheduled.quote.nextAction.actionId!, {
      notes:
        "Customer said the price may be okay, but they want someone to come look at the house, roof, and cable path before they trust the final quote.",
    });
    const visitScheduled = db.scheduleAction(visitRecommended.quote.nextAction.actionId!, {});
    const finalRecommended = await db.logAction(visitScheduled.quote.nextAction.actionId!, {
      notes:
        "Visit completed. Roof condition looked fine. This answers Sabine's main concern and she asked for final summary and signature path.",
    });
    const signed = await db.completeAction(finalRecommended.quote.nextAction.actionId!);

    expect(finalRecommended.quote.nextAction.kind).toBe("send_final_recap");
    expect(signed.quote.columnId).toBe("completed");
    expect(signed.quote.statusLabel).toBe("Signed");
  });

  it("schedules a final email action with its editable draft before sending", async () => {
    const generated = await db.generateStrategy(seed.DEMO_QUOTE_ID);
    const callScheduled = db.scheduleAction(generated.quote.nextAction.actionId!, {});
    const visitRecommended = await db.logAction(callScheduled.quote.nextAction.actionId!, {
      notes:
        "Customer said the price may be okay, but they want someone to come look at the house, roof, and cable path before they trust the final quote.",
    });
    const visitScheduled = db.scheduleAction(visitRecommended.quote.nextAction.actionId!, {});
    const finalRecommended = await db.logAction(visitScheduled.quote.nextAction.actionId!, {
      notes:
        "Visit completed. Roof condition looked fine. This answers Sabine's main concern and she asked for final summary and signature path.",
    });
    const actionId = finalRecommended.quote.nextAction.actionId!;
    const scheduled = db.scheduleAction(actionId, {
      preparationBody: "Subject: Final recap\n\nCustom final email draft.",
    });

    const action = scheduled.actions.find((item) => item.id === actionId);
    const events = db.getCalendarEvents();

    expect(action?.status).toBe("scheduled");
    expect(action?.preparationBody).toContain("Custom final email draft");
    expect(scheduled.quote.nextAction.kind).toBe("send_final_recap");
    expect(events.some((event) => event.actionId === actionId && event.title.includes("Send email"))).toBe(true);
  });

  it("marks an existing strategy stale after master data edits", async () => {
    await db.generateStrategy(seed.DEMO_QUOTE_ID);
    db.updateCustomer(seed.DEMO_CUSTOMER_ID, { quoteValue: 39200 });

    const detail = db.getQuoteDetail(seed.DEMO_QUOTE_ID);
    expect(detail.quote.strategyStale).toBe(true);
    expect(detail.strategy?.stale).toBe(true);
  });

  it("creates a fresh quote lead with generate strategy as the next action", () => {
    const created = db.createQuote({
      name: "Laura Stein",
      email: "laura.stein@email.de",
      phone: "+49 821 445566",
      address: "Parkweg 4, 86150 Augsburg",
      system: "Solar + battery",
      quoteValue: 33600,
      preferredChannel: "Email first, accepts scheduled calls",
      motivationOrConcern:
        "Customer wants predictable monthly bills and asked whether the roof needs a closer check.",
      householdNote: "Family with two EVs; partner reviews larger purchases.",
      initialNote: "They dislike pushy follow-ups.",
    });

    expect(created.quote.nextAction.kind).toBe("generate_strategy");
    expect(created.customer.buyerProfile.length).toBeGreaterThan(0);
    expect(created.notes[0]?.body).toContain("predictable monthly bills");
  });

  it("marks strategies stale after adding a master-data note", async () => {
    await db.generateStrategy(seed.DEMO_QUOTE_ID);
    db.addNote(seed.DEMO_CUSTOMER_ID, {
      type: "text",
      title: "Customer health note",
      body: "Sabine is sick this week; use a kind written note and avoid asking for a call.",
    });

    const detail = db.getQuoteDetail(seed.DEMO_QUOTE_ID);
    expect(detail.quote.strategyStale).toBe(true);
    expect(detail.strategy?.stale).toBe(true);
  });

  it("revision can replace an unlocked call with a sensitive email", async () => {
    const generated = await db.generateStrategy(seed.DEMO_QUOTE_ID);
    const oldActionId = generated.quote.nextAction.actionId!;

    const revised = await db.reviseStrategy(seed.DEMO_QUOTE_ID, {
      instruction:
        "I just found out the customer is sick. Make the next step an email and include a kind note that I hope she recovered.",
    });

    expect(revised.quote.nextAction.kind).toBe("send_final_recap");
    expect(revised.actions.find((action) => action.id === oldActionId)?.status).toBe("superseded");
    expect(revised.strategy?.steps.find((step) => step.status === "active")?.taskType).toBe("Send Email");
    expect(
      revised.strategy?.steps
        .find((step) => step.status === "active")
        ?.bullets.join(" ")
        .toLowerCase(),
    ).toContain("besser");
  });

  it("revision can insert a gift before a signature follow-up when safe", async () => {
    const revised = await db.reviseStrategy("quote_anja", {
      instruction: "Before sending the contract link, send a small thank-you gift first.",
    });

    expect(revised.quote.nextAction.kind).toBe("send_gift");
    expect(db.getAction("action_anja_signature").status).toBe("superseded");
    expect(revised.strategy?.steps.find((step) => step.status === "active")?.taskType).toBe("Send Gift");
  });
});
