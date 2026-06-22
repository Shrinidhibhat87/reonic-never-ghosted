"use client";

// "Think outside the box" — out-of-the-box plays the engine surfaces (gifts,
// vouchers, tactile mail) instead of defaulting to yet another email. Now
// engine-emitted: the installer opts in on create/revise and the backend returns
// `creative_plays`. Renders nothing when the list is empty.
import React from "react";
import { Badge } from "@/ui/components/Badge";
import { FeatherChevronDown, FeatherChevronUp, FeatherGift, FeatherLightbulb } from "@subframe/core";
import type { CreativePlay } from "@/lib/types";

export function CreativePlays({ plays }: { plays: CreativePlay[] }) {
  const [open, setOpen] = React.useState(true);
  if (!plays.length) return null;
  return (
    <div className="flex w-full flex-col items-start gap-3 rounded-lg border border-solid border-brand-200 bg-brand-50 px-6 py-5 shadow-sm">
      <button className="flex w-full items-center gap-2" onClick={() => setOpen((o) => !o)}>
        <FeatherLightbulb className="text-heading-3 font-heading-3 text-brand-600" />
        <span className="grow shrink-0 basis-0 text-left text-heading-3 font-heading-3 text-default-font">
          Think outside the box
        </span>
        <Badge variant="brand">{plays.length} plays</Badge>
        {open ? (
          <FeatherChevronUp className="text-body font-body text-subtext-color" />
        ) : (
          <FeatherChevronDown className="text-body font-body text-subtext-color" />
        )}
      </button>
      {!open && (
        <span className="text-caption font-caption text-subtext-color">
          Out-of-the-box moves the agent picked when the obvious email won’t land — gifts, vouchers, tactile mail.
        </span>
      )}
      {open && (
        <div className="flex w-full flex-col items-start gap-2 border-t border-solid border-brand-200 pt-4">
          {plays.map((p) => (
            <div
              key={p.title}
              className="flex w-full items-start gap-3 rounded-md border border-solid border-neutral-border bg-default-background px-4 py-3"
            >
              <FeatherGift className="text-body font-body text-brand-600 mt-0.5" />
              <div className="flex grow shrink-0 basis-0 flex-col items-start gap-1">
                <div className="flex w-full flex-wrap items-center gap-2">
                  <span className="text-body-bold font-body-bold text-default-font">{p.title}</span>
                  <Badge variant="neutral">{p.trigger}</Badge>
                  {p.channel && <Badge variant="brand">{p.channel}</Badge>}
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
