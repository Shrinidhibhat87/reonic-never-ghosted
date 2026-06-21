import { mkdirSync } from "node:fs";
import { chromium, type Page } from "playwright";

const baseUrl = process.env.REONIC_WEB_URL ?? "http://localhost:5173";
const timeout = 140_000;

mkdirSync(".tmp-ui", { recursive: true });

await fetch(`${baseUrl}/api/demo/reset`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: "{}",
});

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
page.setDefaultTimeout(timeout);

try {
  await page.goto(`${baseUrl}/quotes`, { waitUntil: "networkidle" });
  await quoteCard(page, "Lehmann, Markus").getByRole("button", { name: /Lehmann, Markus/i }).click();
  await page.waitForURL(/\/customers\/customer_markus\?quote=quote_markus/);
  await requireText(page, "Master Data");
  await requireText(page, "Files");
  await fetch(`${baseUrl}/api/customers/customer_markus/notes`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      type: "text",
      title: "Customer update",
      body: "Markus is sick this week; switch to a gentle written follow-up if the strategy is refreshed.",
    }),
  });
  await page.reload({ waitUntil: "networkidle" });
  await requireText(page, "Master data has changed");
  await page.getByRole("button", { name: /Regenerate strategy/i }).click();
  await page.waitForURL(/\/requests\/quote_markus\/strategy/);
  await requireText(page, "GPT-5 mini");
  await ensureNoText(page, "Agent run complete");
  await page.locator("main").getByRole("link", { name: /^Requests$/ }).click();
  await page.waitForURL(/\/quotes/);

  await page.getByRole("button", { name: /New quote/i }).click();
  const dialog = page.locator(".dialog-content");
  await dialog.getByLabel("Name").fill("Laura Stein");
  await dialog.getByLabel("Email").fill("laura.stein@email.de");
  await dialog.getByLabel("Phone").fill("+49 821 445566");
  await dialog.getByLabel("Address").fill("Parkweg 4, 86150 Augsburg");
  await dialog.getByLabel("System").fill("Solar + battery");
  await dialog.getByLabel("Quote value").fill("33600");
  await dialog
    .getByLabel("Motivation or concern")
    .fill("Customer wants predictable monthly bills and asked whether the roof needs a closer check.");
  await dialog
    .getByLabel("Household / property note")
    .fill("Family with two EVs; partner reviews larger purchases.");
  await clickAndWait(page, /Create quote/i, "/api/quotes");
  await page.waitForURL(/\/requests\/quote_laura_stein_/);
  await requireText(page, "No closing strategy yet");

  await fetch(`${baseUrl}/api/demo/reset`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });

  await page.goto(`${baseUrl}/requests/quote_sabine/strategy`, { waitUntil: "networkidle" });
  await clickAndWait(page, /Generate strategy/i, "/api/quotes/quote_sabine/generate-strategy");
  await requireText(page, "GPT-5 mini");
  await ensureNoText(page, "Agent run complete");
  await requireText(page, "Phone Call");
  await page.screenshot({ path: ".tmp-ui/strategy-generated.png", fullPage: true });

  await clickAndWait(page, /Schedule call/i, "/api/actions/", "/schedule");
  await page.waitForURL(/\/calendar\?quote=quote_sabine/);
  await requireHighlightedEvent(page);
  await page.screenshot({ path: ".tmp-ui/calendar-call.png", fullPage: true });

  await page.goto(`${baseUrl}/quotes`, { waitUntil: "networkidle" });
  await quoteCard(page, "Sabine Müller").getByRole("button", { name: /Log call/i }).click();
  await clickAndWait(page, /Save & update strategy/i, "/api/actions/", "/log");
  await page.waitForURL(/\/requests\/quote_sabine\/strategy/);
  await requireText(page, "Meeting in person");
  await page.screenshot({ path: ".tmp-ui/strategy-visit.png", fullPage: true });

  await clickAndWait(page, /Schedule visit/i, "/api/actions/", "/schedule");
  await page.waitForURL(/\/calendar\?quote=quote_sabine/);
  await requireHighlightedEvent(page);

  await page.goto(`${baseUrl}/quotes`, { waitUntil: "networkidle" });
  await quoteCard(page, "Sabine Müller").getByRole("button", { name: /Log visit/i }).click();
  await clickAndWait(page, /Save & update strategy/i, "/api/actions/", "/log");
  await page.waitForURL(/\/requests\/quote_sabine\/strategy/);
  await requireText(page, "Send Email");
  await requireText(page, "GPT-5 mini");
  await page
    .locator(".prep-editor textarea")
    .first()
    .fill("Subject: Final recap\n\nSmoke-test final recap draft with the visit reassurance included.");
  await page.screenshot({ path: ".tmp-ui/strategy-final-recap.png", fullPage: true });

  await clickAndWait(page, /Schedule email/i, "/api/actions/", "/schedule");
  await page.waitForURL(/\/calendar\?quote=quote_sabine/);
  await requireHighlightedEvent(page);
  await page.screenshot({ path: ".tmp-ui/calendar-email.png", fullPage: true });

  await page.goto(`${baseUrl}/requests/quote_sabine/strategy`, { waitUntil: "networkidle" });
  await requireText(page, "Scheduled time");
  await requireTextareaValue(page, "Smoke-test final recap draft");
  await clickAndWait(page, /Mark sent/i, "/api/actions/", "/complete");
  await page.waitForURL(/\/quotes/);
  await requireText(page, "Signed");
  await page.screenshot({ path: ".tmp-ui/final-signed.png", fullPage: true });

  console.log(
    JSON.stringify(
      {
        ok: true,
        screenshots: [
          ".tmp-ui/strategy-generated.png",
          ".tmp-ui/calendar-call.png",
          ".tmp-ui/strategy-visit.png",
          ".tmp-ui/strategy-final-recap.png",
          ".tmp-ui/calendar-email.png",
          ".tmp-ui/final-signed.png",
        ],
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}

function quoteCard(page: Page, customerName: string) {
  return page.locator(".quote-card").filter({ hasText: customerName }).first();
}

async function clickAndWait(page: Page, buttonName: RegExp, ...urlParts: string[]) {
  const button = page.getByRole("button", { name: buttonName }).first();
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.ok() && urlParts.every((part) => response.url().includes(part)),
      { timeout },
    ),
    button.click(),
  ]);
}

async function requireText(page: Page, text: string) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: "visible", timeout });
}

async function ensureNoText(page: Page, text: string) {
  const count = await page.getByText(text, { exact: false }).count();
  if (count > 0) {
    throw new Error(`Expected "${text}" to be hidden, but found ${count} match(es).`);
  }
}

async function requireHighlightedEvent(page: Page) {
  await page.locator(".calendar-event.highlighted").first().waitFor({ state: "visible", timeout });
}

async function requireTextareaValue(page: Page, text: string) {
  const value = await page.locator(".prep-editor textarea").first().inputValue({ timeout });
  if (!value.includes(text)) {
    throw new Error(`Expected persisted preparation text to include "${text}", got "${value}".`);
  }
}
