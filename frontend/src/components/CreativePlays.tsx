"use client";

// "Think outside the box" — the bonus plays the agent can reach for when a
// trigger fires, instead of defaulting to yet another email. Collapsed by
// default; mirrors the play library in docs/.../agent_pipeline.md §3.5.
// ponytail: static mock list. Wire to the engine's selected plays when S5 emits them.
import React from "react";
import { Badge } from "@/ui/components/Badge";
import { FeatherChevronDown, FeatherChevronUp, FeatherGift, FeatherLightbulb } from "@subframe/core";

const PLAYS = [
  {
    title: "Lottery scratch-card “savings reveal”",
    trigger: "Older buyer · low digital engagement",
    why: "A premium printed letter with a scratch-card cuts through the email/WhatsApp this buyer tunes out.",
  },
  {
    title: "Birthday gift card",
    trigger: "Birthday within the follow-up window",
    why: "A small, timed gesture builds relationship warmth — reads as care, not a sales push.",
  },
  {
    title: "Complimentary wallbox bundle",
    trigger: "EV ownership / intent in notes",
    why: "Hooks a want they already have; lifts plan value and lands as a gift, not an upsell.",
  },
  {
    title: "Price-match + local install guarantee",
    trigger: "Competitor flagged · price-sensitive",
    why: "Beats a remote competitor on trust and convenience, not just on price.",
  },
  {
    title: "Voucher for a local café with the site-visit invite",
    trigger: "Warm lead stalling on a meeting",
    why: "A low-pressure, human reason to meet in person re-opens a quiet conversation.",
  },
  {
    title: "Hand-delivered savings dossier over coffee",
    trigger: "High-value deal gone quiet",
    why: "Human touch sized to the ticket; re-opens a stalled big deal.",
  },
];

export function CreativePlays() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="flex w-full flex-col items-start gap-3 rounded-lg border border-solid border-brand-200 bg-brand-50 px-6 py-5 shadow-sm">
      <button className="flex w-full items-center gap-2" onClick={() => setOpen((o) => !o)}>
        <FeatherLightbulb className="text-heading-3 font-heading-3 text-brand-600" />
        <span className="grow shrink-0 basis-0 text-left text-heading-3 font-heading-3 text-default-font">
          Think outside the box
        </span>
        <Badge variant="brand">{PLAYS.length} plays</Badge>
        {open ? (
          <FeatherChevronUp className="text-body font-body text-subtext-color" />
        ) : (
          <FeatherChevronDown className="text-body font-body text-subtext-color" />
        )}
      </button>
      {!open && (
        <span className="text-caption font-caption text-subtext-color">
          Out-of-the-box moves the agent can pick when the obvious email won’t land — gifts, vouchers, tactile mail.
        </span>
      )}
      {open && (
        <div className="flex w-full flex-col items-start gap-2 border-t border-solid border-brand-200 pt-4">
          {PLAYS.map((p) => (
            <div
              key={p.title}
              className="flex w-full items-start gap-3 rounded-md border border-solid border-neutral-border bg-default-background px-4 py-3"
            >
              <FeatherGift className="text-body font-body text-brand-600 mt-0.5" />
              <div className="flex grow shrink-0 basis-0 flex-col items-start gap-1">
                <div className="flex w-full flex-wrap items-center gap-2">
                  <span className="text-body-bold font-body-bold text-default-font">{p.title}</span>
                  <Badge variant="neutral">{p.trigger}</Badge>
                </div>
                <span className="text-body font-body text-subtext-color">{p.why}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
