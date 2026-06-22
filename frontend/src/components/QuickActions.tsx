"use client";

// "Take action now" — even though the play schedules a call later, the installer
// can fire any channel immediately. Each opens a mock popup: instant actions
// (call) confirm right away; messaged actions show an agent-drafted message that
// waits for human approval before it "sends".
// ponytail: drafts are static mock copy. Swap to draftStep() output when wiring real sends.
import React from "react";
import { Button } from "@/ui/components/Button";
import {
  FeatherCheck,
  FeatherClock,
  FeatherFileText,
  FeatherMail,
  FeatherMessageSquare,
  FeatherPhone,
  FeatherVideo,
  FeatherX,
} from "@subframe/core";

type Action = {
  key: string;
  label: string;
  icon: React.ReactNode;
  kind: "instant" | "approve";
  draftTitle?: string;
  draft?: string;
  pendingMsg?: string;
  doneMsg: string;
};

const ACTIONS: Action[] = [
  { key: "call", label: "Call now", icon: <FeatherPhone />, kind: "instant", doneMsg: "Call placed — dialing the prospect now." },
  {
    key: "email",
    label: "Email",
    icon: <FeatherMail />,
    kind: "approve",
    draftTitle: "Subject: Your solar quote — a quick recap",
    draft: "Hi,\n\nThanks again for your interest. I pulled together a short recap of the savings and payback on your quote, plus answers to the questions from our last chat.\n\nHappy to walk through it on a quick call this week.\n\nBest,\nYour installer",
    pendingMsg: "The agent drafted this email and is waiting for your approval.",
    doneMsg: "Email sent ✓",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: <FeatherMessageSquare />,
    kind: "approve",
    draftTitle: "WhatsApp message",
    draft: "Hi! Quick check-in on your solar quote — anything I can clarify on the savings or financing? Happy to call whenever suits 🙂",
    pendingMsg: "The agent drafted this message and is waiting for your approval.",
    doneMsg: "WhatsApp sent ✓",
  },
  {
    key: "letter",
    label: "Personal letter",
    icon: <FeatherFileText />,
    kind: "approve",
    draftTitle: "Premium printed letter + savings scratch-card",
    draft: "A tactile premium letter with a 'guaranteed-savings reveal' scratch-card — cuts through the digital channels this buyer tunes out.",
    pendingMsg: "The agent prepared this letter and is waiting for your approval.",
    doneMsg: "Letter queued for print & post ✓",
  },
  {
    key: "video",
    label: "Video message",
    icon: <FeatherVideo />,
    kind: "approve",
    draftTitle: "Personal video message",
    draft: "A 30-second personal video walking through the roof layout and the first-year savings — a face-to-name touch for a skeptical buyer.",
    pendingMsg: "The agent prepared this video and is waiting for your approval.",
    doneMsg: "Video message sent ✓",
  },
];

export function QuickActions() {
  const [open, setOpen] = React.useState<Action | null>(null);
  const [sent, setSent] = React.useState(false);

  function start(a: Action) {
    setSent(a.kind === "instant"); // instant actions land immediately
    setOpen(a);
  }
  function close() {
    setOpen(null);
    setSent(false);
  }

  return (
    <div className="flex w-full flex-col items-start gap-3 rounded-lg border border-solid border-neutral-border bg-default-background px-6 py-5 shadow-sm">
      <div className="flex w-full items-center gap-2">
        <FeatherPhone className="text-heading-3 font-heading-3 text-brand-600" />
        <span className="grow shrink-0 basis-0 text-heading-3 font-heading-3 text-default-font">Take action now</span>
        <span className="text-caption font-caption text-subtext-color">The play schedules these — or reach out this second.</span>
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 border-t border-solid border-neutral-border pt-4">
        {ACTIONS.map((a) => (
          <Button key={a.key} variant="neutral-secondary" icon={a.icon} onClick={() => start(a)}>
            {a.label}
          </Button>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={close}
        >
          <div
            className="flex w-full max-w-md flex-col items-start gap-4 rounded-lg border border-solid border-neutral-border bg-default-background px-6 py-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex w-full items-center gap-2">
              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-solid border-brand-200 bg-brand-50 text-brand-600">
                {open.icon}
              </div>
              <span className="grow shrink-0 basis-0 text-heading-3 font-heading-3 text-default-font">{open.label}</span>
              <button onClick={close} className="text-subtext-color hover:text-default-font">
                <FeatherX />
              </button>
            </div>

            {open.kind === "instant" || sent ? (
              <div className="flex w-full items-start gap-2 rounded-md border border-solid border-success-200 bg-success-50 px-4 py-3">
                <FeatherCheck className="text-body font-body text-success-600 mt-0.5" />
                <span className="text-body font-body text-default-font">{open.doneMsg}</span>
              </div>
            ) : (
              <>
                <div className="flex w-full items-center gap-2 rounded-md bg-warning-50 px-3 py-2">
                  <FeatherClock className="text-caption font-caption text-warning-700" />
                  <span className="text-caption font-caption text-warning-700">{open.pendingMsg}</span>
                </div>
                <div className="flex w-full flex-col items-start gap-1 rounded-md border border-solid border-neutral-border bg-neutral-50 px-4 py-3">
                  {open.draftTitle && (
                    <span className="text-caption-bold font-caption-bold text-subtext-color">{open.draftTitle}</span>
                  )}
                  <span className="w-full text-body font-body text-default-font whitespace-pre-wrap">{open.draft}</span>
                </div>
                <div className="flex w-full items-center gap-2">
                  <Button icon={<FeatherCheck />} onClick={() => setSent(true)}>
                    Approve &amp; send
                  </Button>
                  <Button variant="neutral-tertiary" onClick={close}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
